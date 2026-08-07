/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalMutationGeneric as internalMutation, makeFunctionReference, type FunctionReference } from "convex/server"
import { v } from "convex/values"

import { collectOwnedRows, takeOwnedRows, type UserOwnedTable } from "./lib/ownedData"
import { identityHash } from "./lib/identityHash"

export const enforceMessageRetention = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(200)
    let deleted = 0
    for (const user of users) {
      if (!user.messageRetentionDays || user.messageRetentionDays < 1) continue
      const cutoff = new Date(Date.now() - user.messageRetentionDays * 86_400_000).toISOString()
      const expired = await ctx.db.query("operatorMessages")
        .withIndex("by_user_time", (q: any) => q.eq("userId", user.legacyId).lt("createdAt", cutoff))
        .take(Math.max(0, 500 - deleted))
      for (const message of expired) await ctx.db.delete(message._id)
      deleted += expired.length
      if (deleted >= 500) break
    }
    const expiredLegal = await ctx.db.query("legalRetentionRecords").withIndex("by_retain_until", (q: any) => q.lt("retainUntil", new Date().toISOString())).take(200)
    for (const record of expiredLegal) await ctx.db.delete(record._id)
    return { deletedMessages: deleted, deletedLegalRecords: expiredLegal.length }
  },
})

const deletionStages: UserOwnedTable[] = ["operatorMessages", "operatorTasks", "operatorGoals", "operatorConversations", "subscriptions", "billingCheckoutLocks", "aiDailyUsage", "privacyEvents", "dataSubjectRequests"]
const processDeletionRef = makeFunctionReference<"mutation", Record<string, never>, unknown>("privacy:processDeletion") as unknown as FunctionReference<"mutation", "internal", { userId: string; jobId: string }, unknown>

export const processDeletion = internalMutation({
  args: { userId: v.string(), jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.query("accountDeletionJobs").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).filter((q: any) => q.eq(q.field("legacyId"), args.jobId)).unique()
    if (!job || job.status === "completed") return false
    const timestamp = new Date().toISOString()
    const stage = job.stage === "queued" ? "retain_billing" : job.stage
    await ctx.db.patch(job._id, { status: "processing", stage, attempts: job.attempts + 1, updatedAt: timestamp, errorCode: undefined })
    try {
      if (stage === "retain_billing") {
        const subscriptions = await collectOwnedRows(ctx, "subscriptions", args.userId)
        const retainUntil = new Date(Date.now() + 7 * 365 * 86_400_000).toISOString()
        for (const item of subscriptions) {
          await ctx.db.insert("legalRetentionRecords", {
            subjectReference: args.jobId,
            category: "billing",
            legalBasis: "Tax, accounting, chargeback and payment-dispute obligations where applicable",
            retainedData: JSON.stringify({ provider: item.provider, planTier: item.planTier, status: item.status, amount: item.amount, currency: item.currency, periodStart: item.periodStart, periodEnd: item.periodEnd, createdAt: item.createdAt }),
            retainUntil,
            createdAt: timestamp,
          })
        }
        await ctx.db.patch(job._id, { stage: deletionStages[0], updatedAt: timestamp })
        await ctx.scheduler.runAfter(0, processDeletionRef, args)
        return true
      }

      const stageIndex = deletionStages.indexOf(stage as UserOwnedTable)
      if (stageIndex >= 0) {
        const table = deletionStages[stageIndex]
        const rows = await takeOwnedRows(ctx, table, args.userId, 100)
        for (const row of rows) await ctx.db.delete(row._id)
        const nextStage = rows.length === 100 ? table : deletionStages[stageIndex + 1] ?? "delete_identity"
        await ctx.db.patch(job._id, { stage: nextStage, updatedAt: new Date().toISOString() })
        await ctx.scheduler.runAfter(0, processDeletionRef, args)
        return true
      }

      if (stage !== "delete_identity") throw new Error("UNKNOWN_DELETION_STAGE")
      const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.userId)).unique()
      if (user) {
        for (const value of [user.email, user.providerAccountId].filter((item): item is string => Boolean(item))) {
          const hashed = await identityHash(value)
          const existing = await ctx.db.query("deletedIdentityTombstones").withIndex("by_identity_hash", (q: any) => q.eq("identityHash", hashed)).unique()
          if (!existing) await ctx.db.insert("deletedIdentityTombstones", { identityHash: hashed, reason: "user_requested_deletion", createdAt: timestamp })
        }
        await ctx.db.delete(user._id)
      }
      const completedAt = new Date().toISOString()
      await ctx.db.patch(job._id, { status: "completed", stage: "completed", completedAt, updatedAt: completedAt })
      return true
    } catch {
      await ctx.db.patch(job._id, { status: "failed", errorCode: "DELETION_PROCESSING_FAILED", updatedAt: new Date().toISOString() })
      return false
    }
  },
})
