/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalMutationGeneric as internalMutation, makeFunctionReference, mutationGeneric as mutation, queryGeneric as query, type FunctionReference } from "convex/server"
import { v } from "convex/values"

import { enqueueEmail } from "./lib/email"
import { paginateOwnedRows, type UserOwnedTable } from "./lib/ownedData"
import { requireMember } from "./lib/serverAuth"

const PAGE_SIZE = 25
const MAX_ROWS = 5_000
const MAX_BYTES = 10 * 1024 * 1024
const MAX_CHUNKS = 250
const EXPORT_TTL_MS = 24 * 60 * 60 * 1000
const stages: UserOwnedTable[] = ["operatorConversations", "operatorMessages", "operatorGoals", "operatorTasks", "operatorTaskEvents", "weeklyReports", "growthMapItems", "growthMaps", "growthMapNodes", "messageFeedback", "subscriptions", "entitlementGrants", "productEvents", "emailDeliveries", "privacyEvents", "dataSubjectRequests"]
const processRef = makeFunctionReference<"mutation", Record<string, never>, unknown>("exports:process") as unknown as FunctionReference<"mutation", "internal", { jobId: string }, unknown>

function safeRow(row: any) {
  const value = { ...row }
  delete value._id
  delete value._creationTime
  delete value.passwordHash
  delete value.tokenHash
  if ("variablesJson" in value) delete value.variablesJson
  return value
}

async function jobById(ctx: any, jobId: string) {
  return ctx.db.query("accountExportJobs").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", jobId)).unique()
}

export const request = mutation({
  args: { userId: v.string(), tokenHash: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:export")
    if (!/^[a-f0-9]{64}$/.test(args.tokenHash)) throw new Error("EXPORT_TOKEN_INVALID")
    const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.userId)).unique()
    if (!user || user.deletedAt || (user.accountStatus && user.accountStatus !== "active")) throw new Error("ACCOUNT_NOT_AVAILABLE")
    const recent = await ctx.db.query("accountExportJobs").withIndex("by_user_created", (q: any) => q.eq("userId", args.userId)).order("desc").take(5)
    const active = recent.find((item: any) => ["queued", "processing"].includes(item.status))
    if (active) {
      await ctx.db.patch(active._id, { tokenHash: args.tokenHash, updatedAt: new Date().toISOString() })
      return { id: active.legacyId, status: active.status }
    }
    const timestamp = new Date().toISOString()
    const jobId = crypto.randomUUID()
    await ctx.db.insert("accountExportJobs", { legacyId: jobId, userId: args.userId, tokenHash: args.tokenHash, status: "queued", stage: "account", attempts: 0, rowCount: 0, byteSize: 0, chunkCount: 0, expiresAt: new Date(Date.now() + EXPORT_TTL_MS).toISOString(), createdAt: timestamp, updatedAt: timestamp })
    await ctx.scheduler.runAfter(0, processRef, { jobId })
    return { id: jobId, status: "queued" as const }
  },
})

export const status = query({
  args: { userId: v.string(), jobId: v.string(), tokenHash: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:export")
    const job = await jobById(ctx, args.jobId)
    if (!job || job.userId !== args.userId || job.tokenHash !== args.tokenHash) return null
    return { id: job.legacyId, status: job.expiresAt <= new Date().toISOString() && job.status === "completed" ? "expired" : job.status, stage: job.stage, rowCount: job.rowCount, byteSize: job.byteSize, expiresAt: job.expiresAt, errorCode: job.errorCode ?? null }
  },
})

export const download = query({
  args: { userId: v.string(), jobId: v.string(), tokenHash: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:export")
    const job = await jobById(ctx, args.jobId)
    if (!job || job.userId !== args.userId || job.tokenHash !== args.tokenHash || job.status !== "completed" || job.expiresAt <= new Date().toISOString()) return null
    const chunks = await ctx.db.query("accountExportChunks").withIndex("by_job_sequence", (q: any) => q.eq("jobId", args.jobId)).order("asc").take(MAX_CHUNKS)
    if (chunks.length !== job.chunkCount) throw new Error("EXPORT_CHUNK_MISMATCH")
    return { createdAt: job.createdAt, completedAt: job.completedAt, expiresAt: job.expiresAt, chunks: chunks.map((item: any) => ({ section: item.section, data: item.data })) }
  },
})

export const process = internalMutation({
  args: { jobId: v.string() },
  handler: async (ctx, args) => {
    const job = await jobById(ctx, args.jobId)
    if (!job || ["completed", "expired"].includes(job.status)) return false
    const timestamp = new Date().toISOString()
    const attempt = job.attempts + 1
    await ctx.db.patch(job._id, { status: "processing", attempts: attempt, lastHeartbeatAt: timestamp, updatedAt: timestamp, nextRetryAt: undefined, errorCode: undefined })
    try {
      if (job.stage === "account") {
        const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", job.userId)).unique()
        if (!user) throw new Error("ACCOUNT_NOT_AVAILABLE")
        const data = JSON.stringify([safeRow(user)])
        await ctx.db.insert("accountExportChunks", { jobId: job.legacyId, userId: job.userId, sequence: 0, section: "account", data, createdAt: timestamp })
        await ctx.db.patch(job._id, { stage: stages[0], cursor: undefined, rowCount: 1, byteSize: data.length, chunkCount: 1, updatedAt: timestamp })
        await ctx.scheduler.runAfter(0, processRef, args)
        return true
      }
      const stageIndex = stages.indexOf(job.stage as UserOwnedTable)
      if (stageIndex < 0) throw new Error("EXPORT_STAGE_INVALID")
      const result = await paginateOwnedRows(ctx, stages[stageIndex], job.userId, job.cursor ?? null, PAGE_SIZE)
      const rows = result.page.map(safeRow)
      const data = JSON.stringify(rows)
      const nextRows = job.rowCount + rows.length
      const nextBytes = job.byteSize + data.length
      const nextChunks = job.chunkCount + (rows.length ? 1 : 0)
      if (nextRows > MAX_ROWS || nextBytes > MAX_BYTES || nextChunks > MAX_CHUNKS) throw new Error("EXPORT_LIMIT_EXCEEDED")
      if (rows.length) await ctx.db.insert("accountExportChunks", { jobId: job.legacyId, userId: job.userId, sequence: job.chunkCount, section: job.stage, data, createdAt: timestamp })
      const finalStage = stageIndex === stages.length - 1
      if (result.isDone && finalStage) {
        const completedAt = new Date().toISOString()
        await ctx.db.patch(job._id, { status: "completed", stage: "completed", cursor: undefined, rowCount: nextRows, byteSize: nextBytes, chunkCount: nextChunks, completedAt, updatedAt: completedAt, lastHeartbeatAt: completedAt })
        const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", job.userId)).unique()
        if (user) await enqueueEmail(ctx, { idempotencyKey: `export:${job.legacyId}:ready`, userId: job.userId, toEmail: user.email, kind: "export_ready", mandatory: true, variables: { detail: "Your requested account export is ready for 24 hours. Sign in to Settings → Privacy to download it.", accountUrl: `${globalThis.process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings#privacy` } })
        return true
      }
      await ctx.db.patch(job._id, { stage: result.isDone ? stages[stageIndex + 1] : job.stage, cursor: result.isDone ? undefined : result.continueCursor, rowCount: nextRows, byteSize: nextBytes, chunkCount: nextChunks, updatedAt: timestamp, lastHeartbeatAt: timestamp })
      await ctx.scheduler.runAfter(0, processRef, args)
      return true
    } catch (error) {
      const code = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "EXPORT_PROCESSING_FAILED"
      const retry = attempt < 5 && code === "EXPORT_PROCESSING_FAILED"
      const delay = Math.min(60 * 60 * 1000, 30_000 * 2 ** Math.max(0, attempt - 1))
      await ctx.db.patch(job._id, { status: "failed", errorCode: code, nextRetryAt: retry ? new Date(Date.now() + delay).toISOString() : undefined, updatedAt: new Date().toISOString() })
      if (retry) await ctx.scheduler.runAfter(delay, processRef, args)
      return false
    }
  },
})

export const recoverAndExpire = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date(), nowIso = now.toISOString(), stale = new Date(now.getTime() - 15 * 60 * 1000).toISOString()
    const failed = await ctx.db.query("accountExportJobs").withIndex("by_status_updated", (q: any) => q.eq("status", "failed")).take(25)
    const processing = await ctx.db.query("accountExportJobs").withIndex("by_status_updated", (q: any) => q.eq("status", "processing").lt("updatedAt", stale)).take(25)
    for (const job of [...failed.filter((item: any) => item.nextRetryAt && item.nextRetryAt <= nowIso), ...processing]) await ctx.scheduler.runAfter(0, processRef, { jobId: job.legacyId })
    const completed = await ctx.db.query("accountExportJobs").withIndex("by_status_updated", (q: any) => q.eq("status", "completed")).take(25)
    let expired = 0
    for (const job of completed.filter((item: any) => item.expiresAt <= nowIso)) {
      const chunks = await ctx.db.query("accountExportChunks").withIndex("by_job_sequence", (q: any) => q.eq("jobId", job.legacyId)).take(MAX_CHUNKS)
      for (const chunk of chunks) await ctx.db.delete(chunk._id)
      await ctx.db.patch(job._id, { status: "expired", stage: "expired", updatedAt: nowIso })
      expired += 1
    }
    return { recovered: failed.length + processing.length, expired }
  },
})
