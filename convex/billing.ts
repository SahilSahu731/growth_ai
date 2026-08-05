/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation } from "convex/server"
import { v } from "convex/values"
import { requireServer } from "./lib/serverAuth"

export const recordEvent = mutation({
  args: {
    providerEventId: v.string(), eventType: v.string(), payloadDigest: v.string(), userId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()), subscriptionStatus: v.optional(v.string()), periodStart: v.optional(v.string()), periodEnd: v.optional(v.string()),
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
    try {
      if (args.userId && args.providerSubscriptionId && args.subscriptionStatus) {
        const existing = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
        const active = ["active", "authenticated", "charged"].includes(args.subscriptionStatus)
        const fields = {
          userId: args.userId, provider: "razorpay" as const, providerSubscriptionId: args.providerSubscriptionId,
          planTier: "pro" as const, status: args.subscriptionStatus,
          ...(args.periodStart ? { periodStart: args.periodStart } : {}), ...(args.periodEnd ? { periodEnd: args.periodEnd } : {}),
          cancelAtPeriodEnd: args.subscriptionStatus === "cancelled", amount: 99900, currency: "INR", updatedAt: timestamp,
        }
        if (existing) await ctx.db.patch(existing._id, fields)
        else await ctx.db.insert("subscriptions", { ...fields, createdAt: timestamp })
        const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.userId)).unique()
        if (user) await ctx.db.patch(user._id, { planTier: active ? "pro" : "free", updatedAt: timestamp })
      }
      await ctx.db.patch(eventId, { status: "processed", processedAt: timestamp })
      return { duplicate: false }
    } catch (error) {
      await ctx.db.patch(eventId, { status: "failed", failureReason: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" })
      throw error
    }
  },
})
