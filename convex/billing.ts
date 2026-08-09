/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  internalActionGeneric as internalAction,
  internalMutationGeneric as internalMutation,
  makeFunctionReference,
  mutationGeneric as mutation,
  queryGeneric as query,
} from "convex/server"
import { v } from "convex/values"

import { resolveEntitlements, syncCachedPlan } from "./lib/entitlements"
import { enqueueEmail } from "./lib/email"
import { requireMember, requireScope } from "./lib/serverAuth"

const paidPlan = v.union(v.literal("pro"), v.literal("founder"))
const eventFailure = v.union(v.literal("validation"), v.literal("ownership"), v.literal("provider_mismatch"), v.literal("transition"), v.literal("transient"), v.literal("internal"))
const MAX_EVENT_ATTEMPTS = 5
const CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000
const GRACE_MS = 72 * 60 * 60 * 1000

function clean(document: any) {
  if (!document) return null
  const value = { ...document }
  delete value._id
  delete value._creationTime
  return { id: String(document._id), ...value }
}

async function userForId(ctx: any, userId: string) {
  return ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", userId)).unique()
}

async function raiseAlert(ctx: any, input: { kind: "webhook_failure" | "reconciliation_drift" | "entitlement_change" | "checkout_abandoned"; severity: "info" | "warning" | "critical"; dedupeKey: string; message: string; userId?: string; providerSubscriptionId?: string; billingEventId?: string }, nowIso: string) {
  const existing = await ctx.db.query("billingAlerts").withIndex("by_dedupe", (q: any) => q.eq("dedupeKey", input.dedupeKey)).unique()
  if (existing?.status === "open") {
    await ctx.db.patch(existing._id, { message: input.message.slice(0, 500), severity: input.severity, updatedAt: nowIso })
    return
  }
  await ctx.db.insert("billingAlerts", { ...input, message: input.message.slice(0, 500), status: "open", createdAt: nowIso, updatedAt: nowIso })
}

function retryAt(attempt: number, now: number) {
  return new Date(now + Math.min(6 * 60 * 60 * 1000, 30_000 * 2 ** Math.max(0, attempt - 1))).toISOString()
}

async function failEvent(ctx: any, event: any, category: "validation" | "ownership" | "provider_mismatch" | "transition" | "transient" | "internal", reason: string, now: Date) {
  const attemptCount = (event.attemptCount ?? 0) + 1
  const dead = attemptCount >= MAX_EVENT_ATTEMPTS || category === "ownership" || category === "provider_mismatch"
  const nowIso = now.toISOString()
  await ctx.db.patch(event._id, {
    status: dead ? "dead_letter" : "failed",
    attemptCount,
    lastAttemptAt: nowIso,
    failureCategory: category,
    failureReason: reason.slice(0, 300),
    nextRetryAt: dead ? undefined : retryAt(attemptCount, now.getTime()),
    finalDisposition: dead ? "dead_letter" : undefined,
    processedAt: dead ? nowIso : undefined,
  })
  await raiseAlert(ctx, {
    kind: "webhook_failure", severity: dead ? "critical" : "warning",
    dedupeKey: `webhook:${event.providerEventId}`, billingEventId: String(event._id),
    providerSubscriptionId: event.providerSubscriptionId,
    message: `${event.eventType} ${dead ? "moved to dead letter" : "failed"}: ${reason}`,
  }, nowIso)
  return { ok: false as const, dead, category, attemptCount }
}

function transitionFor(event: any, current: any, now: Date) {
  const status = event.reportedStatus
  const type = event.eventType
  const nowIso = now.toISOString()
  const periodEnd = event.periodEnd ?? current.periodEnd
  if (type === "refund.processed" || type === "payment.refunded") {
    return { status: "refunded", entitlementState: "revoked" as const, accessUntil: nowIso, graceUntil: undefined, refundedAt: nowIso }
  }
  if (["subscription.authenticated", "subscription.activated", "subscription.charged", "subscription.resumed"].includes(type) || status === "active" || status === "authenticated") {
    return { status: status ?? "active", entitlementState: "active" as const, accessUntil: periodEnd, graceUntil: undefined, pausedAt: undefined }
  }
  if (type === "payment.failed" || status === "pending" || status === "halted") {
    return { status: status ?? "payment_failed", entitlementState: "grace" as const, accessUntil: periodEnd, graceUntil: new Date(now.getTime() + GRACE_MS).toISOString() }
  }
  if (status === "paused" || type === "subscription.paused") {
    return { status: "paused", entitlementState: "paused" as const, accessUntil: nowIso, graceUntil: undefined, pausedAt: nowIso }
  }
  if (status === "cancelled" || type === "subscription.cancelled") {
    const keepUntilEnd = Boolean(event.reportedCancelAtPeriodEnd && periodEnd && periodEnd > nowIso)
    return { status: "cancelled", entitlementState: keepUntilEnd ? "active" as const : "revoked" as const, accessUntil: keepUntilEnd ? periodEnd : nowIso, graceUntil: undefined, cancelAtPeriodEnd: keepUntilEnd, canceledAt: nowIso }
  }
  if (status === "completed" || type === "subscription.completed") {
    const keepUntilEnd = Boolean(periodEnd && periodEnd > nowIso)
    return { status: "completed", entitlementState: keepUntilEnd ? "active" as const : "revoked" as const, accessUntil: keepUntilEnd ? periodEnd : nowIso, graceUntil: undefined }
  }
  if (type === "subscription.updated" && typeof status === "string") {
    return { status, cancelAtPeriodEnd: Boolean(event.reportedCancelAtPeriodEnd), accessUntil: periodEnd }
  }
  return null
}

async function processStoredEvent(ctx: any, event: any) {
  if (["processed", "ignored"].includes(event.status)) return { ok: true as const, duplicate: true }
  const now = new Date()
  const nowIso = now.toISOString()
  if (!event.providerSubscriptionId) return failEvent(ctx, event, "validation", "Missing subscription identifier", now)
  const subscription = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", event.providerSubscriptionId)).unique()
  if (!subscription) return failEvent(ctx, event, "transient", "Unknown checkout subscription", now)
  if (event.noteUserId && subscription.userId !== event.noteUserId) return failEvent(ctx, event, "ownership", "Subscription ownership conflict", now)
  if (event.providerPlanId && subscription.providerPlanId && event.providerPlanId !== subscription.providerPlanId) return failEvent(ctx, event, "provider_mismatch", "Provider plan identifier changed unexpectedly", now)
  if (event.eventCreatedAt && subscription.providerStatusUpdatedAt && event.eventCreatedAt < subscription.providerStatusUpdatedAt) {
    await ctx.db.patch(event._id, { status: "ignored", attemptCount: (event.attemptCount ?? 0) + 1, lastAttemptAt: nowIso, processedAt: nowIso, finalDisposition: "stale", failureReason: "Older than the last applied provider event" })
    return { ok: true as const, stale: true }
  }
  const transition = transitionFor(event, subscription, now)
  if (!transition) return failEvent(ctx, event, "transition", `Unsupported billing transition: ${event.eventType}/${event.reportedStatus ?? "unknown"}`, now)
  const sameBusinessState = transition.status === subscription.status
    && (!event.periodStart || event.periodStart === subscription.periodStart)
    && (!event.periodEnd || event.periodEnd === subscription.periodEnd)
    && (!("entitlementState" in transition) || transition.entitlementState === subscription.entitlementState)
    && (!("cancelAtPeriodEnd" in transition) || transition.cancelAtPeriodEnd === subscription.cancelAtPeriodEnd)
  if (sameBusinessState) {
    await ctx.db.patch(event._id, { status: "ignored", attemptCount: (event.attemptCount ?? 0) + 1, lastAttemptAt: nowIso, processedAt: nowIso, finalDisposition: "duplicate", failureReason: "Business transition was already applied" })
    return { ok: true as const, duplicateTransition: true }
  }
  const before = await resolveEntitlements(ctx, subscription.userId, now)
  await ctx.db.patch(subscription._id, {
    ...transition,
    ...(event.periodStart ? { periodStart: event.periodStart } : {}),
    ...(event.periodEnd ? { periodEnd: event.periodEnd } : {}),
    providerStatusUpdatedAt: event.eventCreatedAt ?? now.getTime(),
    lastProviderEventId: event.providerEventId,
    updatedAt: nowIso,
  })
  const after = await syncCachedPlan(ctx, subscription.userId, now)
  await ctx.db.patch(event._id, { status: "processed", attemptCount: (event.attemptCount ?? 0) + 1, lastAttemptAt: nowIso, nextRetryAt: undefined, failureCategory: undefined, failureReason: undefined, finalDisposition: "applied", processedAt: nowIso })
  if (after && before.plan !== after.plan) {
    await raiseAlert(ctx, { kind: "entitlement_change", severity: "info", dedupeKey: `entitlement:${event.providerEventId}`, userId: subscription.userId, providerSubscriptionId: subscription.providerSubscriptionId, billingEventId: String(event._id), message: `Entitlement changed from ${before.plan} to ${after.plan} after ${event.eventType}.` }, nowIso)
  }
  const user = await userForId(ctx, subscription.userId)
  const emailKind = event.eventType === "subscription.charged" ? "renewal" : ["subscription.authenticated", "subscription.activated"].includes(event.eventType) ? "subscription_confirmation" : event.eventType === "payment.failed" || event.reportedStatus === "halted" ? "payment_failure" : event.eventType === "subscription.cancelled" ? "cancellation" : event.eventType === "subscription.updated" ? "plan_change" : null
  if (user?.email && emailKind) {
    const details: Record<string, string> = {
      subscription_confirmation: `Your ${subscription.planTier} subscription is active. Access was granted only after a signed provider event.`,
      renewal: `Your ${subscription.planTier} subscription renewed. The recorded amount is ${(subscription.amount / 100).toFixed(2)} ${subscription.currency}.`,
      payment_failure: `Razorpay reported a payment problem. Access remains available for a 72-hour grace period while you update payment details.`,
      cancellation: transition.entitlementState === "active" ? `Renewal is cancelled. Access continues through ${transition.accessUntil}.` : "Your subscription has been cancelled and paid access has ended.",
      plan_change: `Razorpay reported a subscription update. Your current entitlement is ${after?.plan ?? "free"}.`,
    }
    await enqueueEmail(ctx, { idempotencyKey: `billing:${event.providerEventId}:${emailKind}`, userId: subscription.userId, toEmail: user.email, kind: emailKind as any, mandatory: true, variables: { detail: details[emailKind], accountUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://growthai.app"}/settings#billing` } })
  }
  if (after && before.plan === "free" && after.plan !== "free") await ctx.db.insert("productEvents", { userId: subscription.userId, name: "subscription_activated", sourceId: subscription.providerSubscriptionId, funnelVersion: "core-loop-v1", plan: after.plan, createdAt: nowIso })
  return { ok: true as const, applied: true }
}

export const getEntitlements = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "billing:read")
    if (!await userForId(ctx, userId)) return null
    return resolveEntitlements(ctx, userId)
  },
})

export const getUserBilling = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "billing:read")
    const [user, subscriptions, entitlements] = await Promise.all([
      userForId(ctx, userId),
      ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", userId)).take(100),
      resolveEntitlements(ctx, userId),
    ])
    if (!user || user.deletedAt) return null
    const sorted = subscriptions.sort((left: any, right: any) => right.updatedAt.localeCompare(left.updatedAt))
    return { planTier: entitlements.plan, entitlements, timezone: user.timezone ?? "UTC", locale: user.locale ?? "en", subscriptions: sorted.map(clean), current: clean(sorted.find((item: any) => ["created", "pending", "active", "authenticated", "paused", "halted"].includes(item.status)) ?? sorted[0] ?? null) }
  },
})

export const recordUpgradeViewed = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "billing:read")
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const recent = await ctx.db.query("productEvents").withIndex("by_user_created", (q: any) => q.eq("userId", userId).gte("createdAt", cutoff)).filter((q: any) => q.eq(q.field("name"), "upgrade_viewed")).first()
    if (recent) return true
    const entitlement = await resolveEntitlements(ctx, userId)
    await ctx.db.insert("productEvents", { userId, name: "upgrade_viewed", funnelVersion: "core-loop-v1", plan: entitlement.plan, createdAt: new Date().toISOString() })
    return true
  },
})

export const beginCheckout = mutation({
  args: { userId: v.string(), planTier: paidPlan },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "billing:write")
    const now = new Date()
    const nowIso = now.toISOString()
    const user = await userForId(ctx, args.userId)
    if (!user || user.deletedAt) throw new Error("Account not available")
    const subscriptions = await ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).take(100)
    for (const item of subscriptions) {
      if (item.status === "created" && (!item.checkoutExpiresAt || item.checkoutExpiresAt <= nowIso)) {
        await ctx.db.patch(item._id, { status: "expired", entitlementState: "none", updatedAt: nowIso })
        await raiseAlert(ctx, { kind: "checkout_abandoned", severity: "info", dedupeKey: `checkout:${item.providerSubscriptionId}`, userId: args.userId, providerSubscriptionId: item.providerSubscriptionId, message: "Abandoned checkout expired." }, nowIso)
      }
    }
    const live = subscriptions.some((item: any) => item.status !== "created" && ["pending", "active", "authenticated", "paused", "halted"].includes(item.status))
      || subscriptions.some((item: any) => item.entitlementState === "active" && (!item.accessUntil || item.accessUntil > nowIso) || item.entitlementState === "grace" && item.graceUntil && item.graceUntil > nowIso)
      || subscriptions.some((item: any) => item.status === "created" && item.checkoutExpiresAt && item.checkoutExpiresAt > nowIso)
    if (live) return { ok: false as const, reason: "existing_subscription" as const }
    const existingLock = await ctx.db.query("billingCheckoutLocks").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    if (existingLock && existingLock.expiresAt > nowIso) return { ok: false as const, reason: "checkout_in_progress" as const }
    if (existingLock) await ctx.db.delete(existingLock._id)
    const token = crypto.randomUUID()
    await ctx.db.insert("billingCheckoutLocks", { userId: args.userId, token, planTier: args.planTier, createdAt: nowIso, expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString() })
    const entitlements = await resolveEntitlements(ctx, args.userId, now)
    await ctx.db.insert("productEvents", { userId: args.userId, name: "checkout_started", funnelVersion: "core-loop-v1", plan: entitlements.plan, sourceId: token, createdAt: nowIso })
    return { ok: true as const, token }
  },
})

export const releaseCheckout = mutation({
  args: { userId: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "billing:write")
    const lock = await ctx.db.query("billingCheckoutLocks").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    if (lock?.token === args.token) await ctx.db.delete(lock._id)
    return true
  },
})

export const completeCheckout = mutation({
  args: { userId: v.string(), token: v.string(), providerSubscriptionId: v.string(), providerPlanId: v.string(), planTier: paidPlan, amount: v.number(), currency: v.string(), checkoutUrl: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "billing:write")
    const lock = await ctx.db.query("billingCheckoutLocks").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    if (!lock || lock.token !== args.token || lock.expiresAt <= new Date().toISOString() || lock.planTier !== args.planTier) throw new Error("Checkout lock expired")
    const duplicate = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
    if (duplicate && duplicate.userId !== args.userId) throw new Error("Subscription ownership conflict")
    const timestamp = new Date().toISOString()
    if (!duplicate) await ctx.db.insert("subscriptions", { userId: args.userId, provider: "razorpay", providerSubscriptionId: args.providerSubscriptionId, providerPlanId: args.providerPlanId, checkoutUrl: args.checkoutUrl, checkoutExpiresAt: new Date(Date.now() + CHECKOUT_TTL_MS).toISOString(), planTier: args.planTier, status: "created", entitlementState: "none", cancelAtPeriodEnd: false, amount: args.amount, currency: args.currency, createdAt: timestamp, updatedAt: timestamp })
    await ctx.db.delete(lock._id)
    return true
  },
})

export const markCancelRequested = mutation({
  args: { userId: v.string(), providerSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "billing:write")
    const subscription = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
    if (!subscription || subscription.userId !== args.userId) throw new Error("Subscription not found")
    const timestamp = new Date().toISOString()
    await ctx.db.patch(subscription._id, { cancelAtPeriodEnd: true, cancelRequestedAt: timestamp, updatedAt: timestamp })
    return true
  },
})

export const receiveEvent = mutation({
  args: { providerEventId: v.string(), eventType: v.string(), payloadDigest: v.string(), eventCreatedAt: v.optional(v.number()), shouldApply: v.boolean(), ignoreReason: v.optional(v.string()), noteUserId: v.optional(v.string()), providerSubscriptionId: v.optional(v.string()), providerPlanId: v.optional(v.string()), reportedStatus: v.optional(v.string()), reportedCancelAtPeriodEnd: v.optional(v.boolean()), periodStart: v.optional(v.string()), periodEnd: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireScope(ctx, "webhook", "billing:webhook")
    const duplicate = await ctx.db.query("billingEvents").withIndex("by_provider_event", (q: any) => q.eq("providerEventId", args.providerEventId)).unique()
    if (duplicate) return { duplicate: true, digestMismatch: duplicate.payloadDigest !== args.payloadDigest, eventId: String(duplicate._id), status: duplicate.status }
    const nowIso = new Date().toISOString()
    const eventId = await ctx.db.insert("billingEvents", { provider: "razorpay", providerEventId: args.providerEventId, eventType: args.eventType, payloadDigest: args.payloadDigest, eventCreatedAt: args.eventCreatedAt, providerSubscriptionId: args.providerSubscriptionId, providerPlanId: args.providerPlanId, reportedStatus: args.reportedStatus, reportedCancelAtPeriodEnd: args.reportedCancelAtPeriodEnd, noteUserId: args.noteUserId, periodStart: args.periodStart, periodEnd: args.periodEnd, status: args.shouldApply ? "received" : "ignored", attemptCount: 0, failureReason: args.shouldApply ? undefined : args.ignoreReason?.slice(0, 300), finalDisposition: args.shouldApply ? undefined : "ignored", processedAt: args.shouldApply ? undefined : nowIso, createdAt: nowIso })
    return { duplicate: false, digestMismatch: false, eventId: String(eventId), status: args.shouldApply ? "received" : "ignored" }
  },
})

// Compatibility guard for older clients. The old all-in-one handler is
// intentionally disabled because it could roll back the receipt on failure.
export const recordEvent = mutation({
  args: { providerEventId: v.string(), eventType: v.string(), payloadDigest: v.string(), shouldApply: v.boolean() },
  handler: async (ctx) => {
    await requireScope(ctx, "webhook", "billing:webhook")
    throw new Error("BILLING_HANDLER_RETIRED: use receiveEvent then processEvent")
  },
})

export const processEvent = mutation({
  args: { providerEventId: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "webhook", "billing:webhook")
    const event = await ctx.db.query("billingEvents").withIndex("by_provider_event", (q: any) => q.eq("providerEventId", args.providerEventId)).unique()
    if (!event) throw new Error("Billing event receipt not found")
    return processStoredEvent(ctx, event)
  },
})

export const markEventFailure = mutation({
  args: { providerEventId: v.string(), category: eventFailure, reason: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "webhook", "billing:webhook")
    const event = await ctx.db.query("billingEvents").withIndex("by_provider_event", (q: any) => q.eq("providerEventId", args.providerEventId)).unique()
    if (!event || ["processed", "ignored", "dead_letter"].includes(event.status)) return false
    await failEvent(ctx, event, args.category, args.reason, new Date())
    return true
  },
})

export const replayEvent = mutation({
  args: { providerEventId: v.string(), actor: v.string(), reason: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:billing")
    const reason = args.reason.replace(/\s+/g, " ").trim().slice(0, 300)
    if (reason.length < 10) throw new Error("A replay reason of at least 10 characters is required")
    const event = await ctx.db.query("billingEvents").withIndex("by_provider_event", (q: any) => q.eq("providerEventId", args.providerEventId)).unique()
    if (!event || !["failed", "dead_letter"].includes(event.status)) throw new Error("Only failed or dead-letter events can be replayed")
    const nowIso = new Date().toISOString()
    await ctx.db.patch(event._id, { status: "received", nextRetryAt: undefined, finalDisposition: undefined, replayedAt: nowIso, replayedBy: args.actor })
    const result = await processStoredEvent(ctx, { ...event, status: "received", replayedAt: nowIso, replayedBy: args.actor })
    await ctx.db.insert("adminAuditLogs", { actor: args.actor, actorRole: "owner", action: "billing.event.replay", targetType: "billing_event", targetId: String(event._id), reason, result: result.ok ? "processed" : "failed", summary: `Replayed ${event.eventType} (${event.providerEventId}).`, createdAt: nowIso })
    return result
  },
})

export const retryDueEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const nowIso = new Date().toISOString()
    const failed = await ctx.db.query("billingEvents").withIndex("by_status_retry", (q: any) => q.eq("status", "failed").lte("nextRetryAt", nowIso)).take(50)
    for (const event of failed) await processStoredEvent(ctx, event)
    return failed.length
  },
})

export const expireAbandonedCheckouts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const nowIso = new Date().toISOString()
    const created = await ctx.db.query("subscriptions").withIndex("by_user_status").filter((q: any) => q.eq(q.field("status"), "created")).take(200)
    let expired = 0
    for (const item of created) if (!item.checkoutExpiresAt || item.checkoutExpiresAt <= nowIso) {
      await ctx.db.patch(item._id, { status: "expired", entitlementState: "none", updatedAt: nowIso })
      await raiseAlert(ctx, { kind: "checkout_abandoned", severity: "info", dedupeKey: `checkout:${item.providerSubscriptionId}`, userId: item.userId, providerSubscriptionId: item.providerSubscriptionId, message: "Abandoned checkout expired during maintenance." }, nowIso)
      expired += 1
    }
    return expired
  },
})

export const subscriptionsForReconciliation = internalMutation({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db.query("maintenanceCursors").withIndex("by_key", (q: any) => q.eq("key", "billing-reconciliation")).unique()
    const batch = await ctx.db.query("subscriptions").paginate({ cursor: state?.cursor ?? null, numItems: 100 })
    const timestamp = new Date().toISOString()
    const fields = { cursor: batch.isDone ? undefined : batch.continueCursor, lastBatchSize: batch.page.length, completedCycles: (state?.completedCycles ?? 0) + (batch.isDone ? 1 : 0), updatedAt: timestamp }
    if (state) await ctx.db.patch(state._id, fields); else await ctx.db.insert("maintenanceCursors", { key: "billing-reconciliation", ...fields })
    return batch.page.filter((item: any) => !["expired", "refunded"].includes(item.status)).map(clean)
  },
})

export const applyReconciliation = internalMutation({
  args: { providerSubscriptionId: v.string(), ok: v.boolean(), providerStatus: v.optional(v.string()), providerPlanId: v.optional(v.string()), periodStart: v.optional(v.string()), periodEnd: v.optional(v.string()), errorCategory: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const item = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
    if (!item) return false
    const now = new Date()
    const nowIso = now.toISOString()
    if (!args.ok || !args.providerStatus) {
      await ctx.db.patch(item._id, { lastReconciledAt: nowIso, reconciliationStatus: "failed", reconciliationErrorCategory: args.errorCategory ?? "provider_error" })
      await raiseAlert(ctx, { kind: "reconciliation_drift", severity: "warning", dedupeKey: `reconcile:${item.providerSubscriptionId}`, userId: item.userId, providerSubscriptionId: item.providerSubscriptionId, message: `Subscription reconciliation failed (${args.errorCategory ?? "provider_error"}).` }, nowIso)
      return false
    }
    const planMismatch = Boolean(args.providerPlanId && item.providerPlanId !== args.providerPlanId)
    const statusDrift = item.status !== args.providerStatus
    const drift = statusDrift || planMismatch
    await ctx.db.patch(item._id, { lastReconciledAt: nowIso, reconciliationStatus: drift ? "drift" : "matched", reconciliationErrorCategory: undefined })
    if (drift) await raiseAlert(ctx, { kind: "reconciliation_drift", severity: "critical", dedupeKey: `reconcile:${item.providerSubscriptionId}`, userId: item.userId, providerSubscriptionId: item.providerSubscriptionId, message: `Provider reports ${args.providerStatus}/${args.providerPlanId ?? "unknown plan"}; application has ${item.status}/${item.providerPlanId ?? "unknown plan"}.` }, nowIso)
    // Status drift is repairable when the provider plan still matches the
    // server-created checkout. A plan mismatch remains quarantined for review.
    if (statusDrift && !planMismatch) {
      const providerEventId = `reconcile_${item.providerSubscriptionId}_${Date.now()}`
      const eventId = await ctx.db.insert("billingEvents", { provider: "razorpay", providerEventId, eventType: "subscription.updated", payloadDigest: "provider-reconciliation", eventCreatedAt: Date.now(), providerSubscriptionId: item.providerSubscriptionId, providerPlanId: args.providerPlanId, reportedStatus: args.providerStatus, periodStart: args.periodStart, periodEnd: args.periodEnd, status: "received", attemptCount: 0, createdAt: nowIso })
      await processStoredEvent(ctx, await ctx.db.get(eventId))
      await ctx.db.patch(item._id, { lastReconciledAt: nowIso, reconciliationStatus: "matched", reconciliationErrorCategory: undefined })
      return true
    }
    return !drift
  },
})

const listForReconcile = makeFunctionReference<"mutation">("billing:subscriptionsForReconciliation")
const applyReconcile = makeFunctionReference<"mutation">("billing:applyReconciliation")

export const reconcileSubscriptions = internalAction({
  args: {},
  handler: async (ctx) => {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) return { checked: 0, skipped: "not_configured" }
    const subscriptions = await ctx.runMutation(listForReconcile as any, {}) as any[]
    let checked = 0
    for (const item of subscriptions) {
      try {
        const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(item.providerSubscriptionId)}`, { headers: { authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` }, signal: AbortSignal.timeout(10_000) })
        const provider = await response.json() as any
        await ctx.runMutation(applyReconcile as any, { providerSubscriptionId: item.providerSubscriptionId, ok: response.ok, ...(response.ok ? { providerStatus: provider.status, providerPlanId: provider.plan_id, ...(provider.current_start ? { periodStart: new Date(provider.current_start * 1000).toISOString() } : {}), ...(provider.current_end ? { periodEnd: new Date(provider.current_end * 1000).toISOString() } : {}) } : { errorCategory: `http_${response.status}` }) })
      } catch {
        await ctx.runMutation(applyReconcile as any, { providerSubscriptionId: item.providerSubscriptionId, ok: false, errorCategory: "network" })
      }
      checked += 1
    }
    return { checked }
  },
})
