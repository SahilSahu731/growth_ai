/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalMutationGeneric as internalMutation, makeFunctionReference, type FunctionReference } from "convex/server"
import { v } from "convex/values"

import { takeOwnedRows, type UserOwnedTable } from "./lib/ownedData"
import { identityHash } from "./lib/identityHash"

export const enforceMessageRetention = internalMutation({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db.query("maintenanceCursors").withIndex("by_key", (q: any) => q.eq("key", "message-retention")).unique()
    const batch = await ctx.db.query("users").paginate({ cursor: state?.cursor ?? null, numItems: 100 })
    const users = batch.page
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
    const timestamp = new Date().toISOString()
    const fields = { cursor: batch.isDone ? undefined : batch.continueCursor, lastBatchSize: users.length, completedCycles: (state?.completedCycles ?? 0) + (batch.isDone ? 1 : 0), updatedAt: timestamp }
    if (state) await ctx.db.patch(state._id, fields); else await ctx.db.insert("maintenanceCursors", { key: "message-retention", ...fields })
    return { deletedMessages: deleted, deletedLegalRecords: expiredLegal.length, cycleComplete: batch.isDone }
  },
})

const deletionStages: UserOwnedTable[] = ["operatorMessages", "messageFeedback", "operatorTasks", "operatorTaskEvents", "weeklyReports", "growthMapItems", "growthMapNodes", "growthMaps", "productEvents", "operatorGoals", "operatorConversations", "entitlementGrants", "subscriptions", "billingCheckoutLocks", "emailDeliveries", "aiDailyUsage", "privacyEvents", "dataSubjectRequests", "accountExportChunks", "accountExportJobs"]
const processDeletionRef = makeFunctionReference<"mutation", Record<string, never>, unknown>("privacy:processDeletion") as unknown as FunctionReference<"mutation", "internal", { userId: string; jobId: string }, unknown>

export const processDeletion = internalMutation({
  args: { userId: v.string(), jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.query("accountDeletionJobs").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).filter((q: any) => q.eq(q.field("legacyId"), args.jobId)).unique()
    if (!job || job.status === "completed") return false
    const timestamp = new Date().toISOString()
    const stage = job.stage === "queued" ? "retain_billing" : job.stage
    const attempt = job.attempts + 1
    await ctx.db.patch(job._id, { status: "processing", stage, attempts: attempt, lastHeartbeatAt: timestamp, updatedAt: timestamp, nextRetryAt: undefined, errorCode: undefined })
    try {
      if (stage === "retain_billing") {
        const subscriptions = await takeOwnedRows(ctx, "subscriptions", args.userId, 500)
        if (subscriptions.length === 500) throw new Error("DELETION_BILLING_REVIEW_REQUIRED")
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
        await ctx.db.patch(job._id, { stage: "wait_notification", updatedAt: timestamp })
        await ctx.scheduler.runAfter(10 * 60 * 1000, processDeletionRef, args)
        return true
      }

      if (stage === "wait_notification") {
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
        await ctx.db.patch(job._id, { stage: nextStage, deletedRows: (job.deletedRows ?? 0) + rows.length, lastHeartbeatAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
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
      await ctx.db.patch(job._id, { status: "completed", stage: "completed", completedAt, lastHeartbeatAt: completedAt, updatedAt: completedAt })
      return true
    } catch (error) {
      const errorCode = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "DELETION_PROCESSING_FAILED"
      const retry = attempt < 5 && errorCode === "DELETION_PROCESSING_FAILED"
      const delay = Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.max(0, attempt - 1))
      await ctx.db.patch(job._id, { status: "failed", errorCode, nextRetryAt: retry ? new Date(Date.now() + delay).toISOString() : undefined, updatedAt: new Date().toISOString() })
      if (retry) await ctx.scheduler.runAfter(delay, processDeletionRef, args)
      return false
    }
  },
})

export const recoverDeletionJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const nowIso = new Date().toISOString()
    const stale = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    const failed = await ctx.db.query("accountDeletionJobs").withIndex("by_status_created", (q: any) => q.eq("status", "failed")).take(25)
    const processing = await ctx.db.query("accountDeletionJobs").withIndex("by_status_created", (q: any) => q.eq("status", "processing")).filter((q: any) => q.lt(q.field("updatedAt"), stale)).take(25)
    const due = [...failed.filter((item: any) => item.nextRetryAt && item.nextRetryAt <= nowIso && item.attempts < 5), ...processing]
    for (const job of due) await ctx.scheduler.runAfter(0, processDeletionRef, { userId: job.userId, jobId: job.legacyId })
    return { recovered: due.length }
  },
})
