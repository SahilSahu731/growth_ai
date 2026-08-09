/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")
const webhook = { tokenIdentifier: "test|webhook", subject: "webhook:razorpay", role: "webhook", scope: "billing:webhook" }
const member = { tokenIdentifier: "test|member", subject: "member:user-1", role: "member", scope: "billing:read" }
const stamp = "2026-08-09T00:00:00.000Z"

async function seed(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { legacyId: "user-1", name: "Billing User", email: "billing@example.test", authProvider: "google", planTier: "free", accountStatus: "active", createdAt: stamp, updatedAt: stamp })
    await ctx.db.insert("subscriptions", { userId: "user-1", provider: "razorpay", providerSubscriptionId: "sub_123456789", providerPlanId: "plan_123456789", planTier: "pro", status: "created", entitlementState: "none", cancelAtPeriodEnd: false, amount: 99900, currency: "INR", createdAt: stamp, updatedAt: stamp })
  })
}

describe("durable billing lifecycle", () => {
  it("stores the receipt separately and grants only after processing", async () => {
    const t = convexTest(schema, modules); await seed(t); const server = t.withIdentity(webhook)
    const receipt = await server.mutation(api.billing.receiveEvent, { providerEventId: "evt_activate", eventType: "subscription.activated", payloadDigest: "a".repeat(64), eventCreatedAt: 1_786_233_600_000, shouldApply: true, noteUserId: "user-1", providerSubscriptionId: "sub_123456789", providerPlanId: "plan_123456789", reportedStatus: "active", periodEnd: "2026-09-09T00:00:00.000Z" })
    expect(receipt.status).toBe("received")
    expect((await t.withIdentity(member).query(api.billing.getEntitlements, { userId: "user-1" }))?.plan).toBe("free")
    await server.mutation(api.billing.processEvent, { providerEventId: "evt_activate" })
    expect((await t.withIdentity(member).query(api.billing.getEntitlements, { userId: "user-1" }))?.plan).toBe("pro")
  })

  it("detects provider event id reuse without applying a second payload", async () => {
    const t = convexTest(schema, modules); await seed(t); const server = t.withIdentity(webhook)
    await server.mutation(api.billing.receiveEvent, { providerEventId: "evt_duplicate", eventType: "subscription.activated", payloadDigest: "a".repeat(64), shouldApply: false })
    const duplicate = await server.mutation(api.billing.receiveEvent, { providerEventId: "evt_duplicate", eventType: "subscription.cancelled", payloadDigest: "b".repeat(64), shouldApply: true })
    expect(duplicate).toMatchObject({ duplicate: true, digestMismatch: true, status: "ignored" })
  })

  it("keeps failed receipts retryable and dead-letter metadata durable", async () => {
    const t = convexTest(schema, modules); const server = t.withIdentity(webhook)
    await server.mutation(api.billing.receiveEvent, { providerEventId: "evt_missing", eventType: "subscription.activated", payloadDigest: "c".repeat(64), shouldApply: true, providerSubscriptionId: "sub_missing9", reportedStatus: "active" })
    const result = await server.mutation(api.billing.processEvent, { providerEventId: "evt_missing" })
    expect(result).toMatchObject({ ok: false, category: "transient", attemptCount: 1 })
    await t.run(async (ctx) => { const event = await ctx.db.query("billingEvents").withIndex("by_provider_event", (q) => q.eq("providerEventId", "evt_missing")).unique(); expect(event?.status).toBe("failed"); expect(event?.nextRetryAt).toBeTruthy() })
  })

  it("ignores an older cancellation after a newer activation", async () => {
    const t = convexTest(schema, modules); await seed(t); const server = t.withIdentity(webhook)
    await server.mutation(api.billing.receiveEvent, { providerEventId: "evt_new", eventType: "subscription.activated", payloadDigest: "d".repeat(64), eventCreatedAt: 2000, shouldApply: true, providerSubscriptionId: "sub_123456789", providerPlanId: "plan_123456789", reportedStatus: "active", periodEnd: "2026-09-09T00:00:00.000Z" })
    await server.mutation(api.billing.processEvent, { providerEventId: "evt_new" })
    await server.mutation(api.billing.receiveEvent, { providerEventId: "evt_old", eventType: "subscription.cancelled", payloadDigest: "e".repeat(64), eventCreatedAt: 1000, shouldApply: true, providerSubscriptionId: "sub_123456789", reportedStatus: "cancelled" })
    const result = await server.mutation(api.billing.processEvent, { providerEventId: "evt_old" })
    expect(result).toMatchObject({ ok: true, stale: true })
    expect((await t.withIdentity(member).query(api.billing.getEntitlements, { userId: "user-1" }))?.plan).toBe("pro")
  })

  it("enforces access across paid, grace, period-end, paused, refunded, and complimentary states", async () => {
    const t = convexTest(schema, modules); await seed(t)
    const entitlement = () => t.withIdentity(member).query(api.billing.getEntitlements, { userId: "user-1" })
    const patchSubscription = async (fields: Record<string, unknown>) => t.run(async (ctx) => {
      const row = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q) => q.eq("providerSubscriptionId", "sub_123456789")).unique()
      if (!row) throw new Error("missing subscription")
      await ctx.db.patch(row._id, fields)
    })

    expect((await entitlement())?.plan).toBe("free")
    await patchSubscription({ status: "active", entitlementState: "active", accessUntil: "2099-01-01T00:00:00.000Z" })
    expect((await entitlement())?.plan).toBe("pro")
    await patchSubscription({ status: "pending", entitlementState: "grace", accessUntil: undefined, graceUntil: "2099-01-01T00:00:00.000Z" })
    expect((await entitlement())?.grace).toBe(true)
    await patchSubscription({ status: "cancelled", entitlementState: "active", cancelAtPeriodEnd: true, graceUntil: undefined, accessUntil: "2099-01-01T00:00:00.000Z" })
    expect((await entitlement())?.plan).toBe("pro")
    await patchSubscription({ status: "paused", entitlementState: "none", accessUntil: undefined })
    expect((await entitlement())?.plan).toBe("free")
    await patchSubscription({ status: "refunded", entitlementState: "none" })
    await t.run(async (ctx) => { await ctx.db.insert("entitlementGrants", { userId: "user-1", planTier: "pro", source: "design_partner", reason: "Consented beta cohort", actor: "owner:test", startsAt: "2026-01-01T00:00:00.000Z", expiresAt: "2099-01-01T00:00:00.000Z", createdAt: stamp, updatedAt: stamp }) })
    expect(await entitlement()).toMatchObject({ plan: "pro", source: "complimentary", grace: false })
  })
})
