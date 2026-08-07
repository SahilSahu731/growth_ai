/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"

import { requireServer } from "./lib/serverAuth"

const paidPlan = v.union(v.literal("pro"), v.literal("founder"))
const activeStatuses = new Set(["active", "authenticated"])
const blockingStatuses = new Set(["created", "pending", "active", "authenticated"])

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

export const getUserBilling = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireServer(ctx)
    const [user, subscriptions] = await Promise.all([
      userForId(ctx, userId),
      ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
    ])
    if (!user || user.deletedAt) return null
    const sorted = subscriptions.sort((left: any, right: any) => right.updatedAt.localeCompare(left.updatedAt))
    return {
      planTier: user.planTier,
      timezone: user.timezone ?? "UTC",
      locale: user.locale ?? "en",
      subscriptions: sorted.map(clean),
      current: clean(sorted.find((item: any) => blockingStatuses.has(item.status)) ?? sorted[0] ?? null),
    }
  },
})

export const beginCheckout = mutation({
  args: { userId: v.string(), planTier: paidPlan },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const now = new Date()
    const nowIso = now.toISOString()
    const user = await userForId(ctx, args.userId)
    if (!user || user.deletedAt) throw new Error("Account not available")
    const subscriptions = await ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).collect()
    if (subscriptions.some((item: any) => blockingStatuses.has(item.status))) {
      return { ok: false as const, reason: "existing_subscription" as const }
    }
    const existingLock = await ctx.db.query("billingCheckoutLocks").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    if (existingLock && existingLock.expiresAt > nowIso) return { ok: false as const, reason: "checkout_in_progress" as const }
    if (existingLock) await ctx.db.delete(existingLock._id)
    const token = crypto.randomUUID()
    await ctx.db.insert("billingCheckoutLocks", {
      userId: args.userId,
      token,
      planTier: args.planTier,
      createdAt: nowIso,
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    })
    return { ok: true as const, token }
  },
})

export const releaseCheckout = mutation({
  args: { userId: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const lock = await ctx.db.query("billingCheckoutLocks").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    if (lock?.token === args.token) await ctx.db.delete(lock._id)
    return true
  },
})

export const completeCheckout = mutation({
  args: {
    userId: v.string(), token: v.string(), providerSubscriptionId: v.string(), planTier: paidPlan,
    amount: v.number(), currency: v.string(), checkoutUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const lock = await ctx.db.query("billingCheckoutLocks").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    if (!lock || lock.token !== args.token || lock.expiresAt <= new Date().toISOString() || lock.planTier !== args.planTier) {
      throw new Error("Checkout lock expired")
    }
    const duplicate = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
    if (duplicate && duplicate.userId !== args.userId) throw new Error("Subscription ownership conflict")
    const timestamp = new Date().toISOString()
    if (!duplicate) {
      await ctx.db.insert("subscriptions", {
        userId: args.userId,
        provider: "razorpay",
        providerSubscriptionId: args.providerSubscriptionId,
        checkoutUrl: args.checkoutUrl,
        planTier: args.planTier,
        status: "created",
        cancelAtPeriodEnd: false,
        amount: args.amount,
        currency: args.currency,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }
    await ctx.db.delete(lock._id)
    return true
  },
})

export const markCancelRequested = mutation({
  args: { userId: v.string(), providerSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const subscription = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
    if (!subscription || subscription.userId !== args.userId) throw new Error("Subscription not found")
    await ctx.db.patch(subscription._id, { cancelAtPeriodEnd: true, updatedAt: new Date().toISOString() })
    return true
  },
})

export const recordEvent = mutation({
  args: {
    providerEventId: v.string(), eventType: v.string(), payloadDigest: v.string(),
    shouldApply: v.boolean(), ignoreReason: v.optional(v.string()),
    userId: v.optional(v.string()), providerSubscriptionId: v.optional(v.string()), subscriptionStatus: v.optional(v.string()),
    planTier: v.optional(paidPlan), amount: v.optional(v.number()), currency: v.optional(v.string()),
    periodStart: v.optional(v.string()), periodEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const duplicate = await ctx.db.query("billingEvents").withIndex("by_provider_event", (q: any) => q.eq("providerEventId", args.providerEventId)).unique()
    if (duplicate) return { duplicate: true }
    const timestamp = new Date().toISOString()
    const eventId = await ctx.db.insert("billingEvents", {
      provider: "razorpay", providerEventId: args.providerEventId, eventType: args.eventType,
      payloadDigest: args.payloadDigest, status: "received", createdAt: timestamp,
    })
    if (!args.shouldApply) {
      await ctx.db.patch(eventId, { status: "ignored", failureReason: args.ignoreReason?.slice(0, 300), processedAt: timestamp })
      return { duplicate: false }
    }
    try {
      if (!args.userId || !args.providerSubscriptionId || !args.subscriptionStatus || !args.planTier || args.amount === undefined || !args.currency) {
        throw new Error("Validated subscription fields are incomplete")
      }
      const user = await userForId(ctx, args.userId)
      if (!user) throw new Error("Subscription user not found")
      const existing = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
      if (!existing) throw new Error("Unknown checkout subscription")
      if (existing.userId !== args.userId || existing.planTier !== args.planTier) throw new Error("Subscription ownership conflict")
      const fields = {
        userId: args.userId, provider: "razorpay" as const, providerSubscriptionId: args.providerSubscriptionId,
        planTier: args.planTier, status: args.subscriptionStatus,
        ...(args.periodStart ? { periodStart: args.periodStart } : {}), ...(args.periodEnd ? { periodEnd: args.periodEnd } : {}),
        cancelAtPeriodEnd: args.subscriptionStatus === "cancelled" || existing?.cancelAtPeriodEnd === true,
        amount: args.amount, currency: args.currency, updatedAt: timestamp,
      }
      await ctx.db.patch(existing._id, fields)

      const allSubscriptions = await ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).collect()
      const effective = allSubscriptions.map((item: any) => item.providerSubscriptionId === args.providerSubscriptionId ? { ...item, ...fields } : item)
      const activePlans = effective.filter((item: any) => activeStatuses.has(item.status)).map((item: any) => item.planTier)
      const effectivePlan = activePlans.includes("founder") ? "founder" : activePlans.includes("pro") ? "pro" : "free"
      await ctx.db.patch(user._id, { planTier: effectivePlan, updatedAt: timestamp })
      await ctx.db.patch(eventId, { status: "processed", processedAt: timestamp })
      return { duplicate: false }
    } catch (error) {
      await ctx.db.patch(eventId, { status: "failed", failureReason: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" })
      throw error
    }
  },
})
