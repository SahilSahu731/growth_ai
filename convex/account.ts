/* eslint-disable @typescript-eslint/no-explicit-any */
import { makeFunctionReference, mutationGeneric as mutation, queryGeneric as query, type FunctionReference } from "convex/server"
import { v } from "convex/values"
import { requireMember } from "./lib/serverAuth"
import { collectOwnedRows } from "./lib/ownedData"

function clean(document: any) {
  if (!document) return null
  const value = { ...document }
  const resolvedId = value.legacyId ?? String(value._id)
  delete value._id
  delete value._creationTime
  delete value.legacyId
  delete value.passwordHash
  return { id: resolvedId, ...value }
}

async function userById(ctx: any, userId: string) {
  return ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", userId)).unique()
}

export const getOverview = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "account:read")
    const [user, conversations] = await Promise.all([
      userById(ctx, userId),
      ctx.db.query("operatorConversations").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).order("desc").collect(),
    ])
    if (!user) return null
    return {
      user: clean(user),
      conversations: conversations
        .sort((a: any, b: any) => {
          if (Boolean(a.pinnedAt) !== Boolean(b.pinnedAt)) return a.pinnedAt ? -1 : 1
          return b.updatedAt.localeCompare(a.updatedAt)
        })
        .map((conversation: any) => ({ id: conversation.legacyId, title: conversation.title, pinned: Boolean(conversation.pinnedAt) })),
      preferences: {
        coachTone: user.coachTone ?? "balanced",
        timezone: user.timezone ?? "UTC",
        emailNotifications: user.emailNotifications ?? false,
        messageRetentionDays: user.messageRetentionDays ?? 0,
        termsAcceptedVersion: user.termsAcceptedVersion ?? null,
        privacyAcceptedVersion: user.privacyAcceptedVersion ?? null,
        aiNoticeAcceptedVersion: user.aiNoticeAcceptedVersion ?? null,
      },
    }
  },
})

export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    coachTone: v.union(v.literal("supportive"), v.literal("balanced"), v.literal("blunt")),
    timezone: v.string(),
    emailNotifications: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:write")
    const user = await userById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    const timezone = args.timezone.trim().slice(0, 80)
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone }).format()
    } catch {
      throw new Error("Choose a valid timezone")
    }
    const updatedAt = new Date().toISOString()
    await ctx.db.patch(user._id, {
      coachTone: args.coachTone,
      timezone,
      emailNotifications: args.emailNotifications,
      updatedAt,
    })
    await ctx.db.insert("privacyEvents", { userId: args.userId, type: "preferences.updated", details: `coachTone=${args.coachTone};timezone=${timezone}`, createdAt: updatedAt })
    return { coachTone: args.coachTone, timezone, emailNotifications: args.emailNotifications, updatedAt }
  },
})

export const exportUserData = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "account:export")
    const user = await userById(ctx, userId)
    if (!user) return null
    const [conversations, messages, goals, tasks, subscriptions, privacyEvents, accessHistory, dataSubjectRequests] = await Promise.all([
      collectOwnedRows(ctx, "operatorConversations", userId),
      collectOwnedRows(ctx, "operatorMessages", userId),
      collectOwnedRows(ctx, "operatorGoals", userId),
      collectOwnedRows(ctx, "operatorTasks", userId),
      ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
      ctx.db.query("privacyEvents").withIndex("by_user_created", (q: any) => q.eq("userId", userId)).collect(),
      ctx.db.query("adminAuditLogs").withIndex("by_target_created", (q: any) => q.eq("targetId", userId)).collect(),
      ctx.db.query("dataSubjectRequests").withIndex("by_user_created", (q: any) => q.eq("userId", userId)).collect(),
    ])
    return {
      format: "growthai-portable-export",
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      retentionPolicy: { messages: user.messageRetentionDays ? `${user.messageRetentionDays} days` : "Until manually deleted", backups: "Up to 35 days after deletion", audit: "Up to 2 years", legallyRequiredBilling: "Up to 7 years where required" },
      account: clean(user),
      conversations: conversations.map(clean),
      messages: messages.map(clean),
      goals: goals.map(clean),
      tasks: tasks.map(clean),
      subscriptions: subscriptions.map(clean),
      preferenceAndPrivacyHistory: privacyEvents.map(clean),
      supportAccessHistory: accessHistory.map((item: any) => ({ action: item.action, reason: item.reason ?? null, ticket: item.ticket ?? null, result: item.result ?? null, accessedAt: item.createdAt })),
      dataSubjectRequests: dataSubjectRequests.map(clean),
    }
  },
})

export const acceptLegal = mutation({
  args: { userId: v.string(), termsVersion: v.string(), privacyVersion: v.string(), aiNoticeVersion: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:write")
    const user = await userById(ctx, args.userId)
    if (!user || user.deletedAt) throw new Error("Account not available")
    const timestamp = new Date().toISOString()
    await ctx.db.patch(user._id, {
      termsAcceptedVersion: args.termsVersion.slice(0, 40), termsAcceptedAt: timestamp,
      privacyAcceptedVersion: args.privacyVersion.slice(0, 40), aiNoticeAcceptedVersion: args.aiNoticeVersion.slice(0, 40), updatedAt: timestamp,
    })
    await ctx.db.insert("privacyEvents", { userId: args.userId, type: "legal.accepted", details: `terms=${args.termsVersion};privacy=${args.privacyVersion};ai=${args.aiNoticeVersion}`, createdAt: timestamp })
    return true
  },
})

export const setMessageRetention = mutation({
  args: { userId: v.string(), days: v.number() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:write")
    if (![0, 30, 90, 180, 365].includes(args.days)) throw new Error("Choose a supported retention period")
    const user = await userById(ctx, args.userId)
    if (!user || user.deletedAt) throw new Error("Account not available")
    const timestamp = new Date().toISOString()
    await ctx.db.patch(user._id, { messageRetentionDays: args.days, updatedAt: timestamp })
    await ctx.db.insert("privacyEvents", { userId: args.userId, type: "retention.updated", details: args.days ? `${args.days} days` : "manual", createdAt: timestamp })
    return true
  },
})

export const clearAiMemory = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "account:delete")
    const user = await userById(ctx, userId)
    if (!user || user.deletedAt) throw new Error("Account not available")
    const conversations = await collectOwnedRows(ctx, "operatorConversations", userId)
    const messages = await collectOwnedRows(ctx, "operatorMessages", userId)
    const tasks = await collectOwnedRows(ctx, "operatorTasks", userId)
    const conversationTitles = new Map(conversations.map((item: any) => [item.legacyId, item.title]))
    for (const task of tasks) {
      if (task.conversationId) await ctx.db.patch(task._id, { originConversationTitle: task.originConversationTitle ?? conversationTitles.get(task.conversationId), conversationId: undefined, sourceMessageId: undefined })
    }
    for (const message of messages) await ctx.db.delete(message._id)
    for (const conversation of conversations) await ctx.db.delete(conversation._id)
    const timestamp = new Date().toISOString()
    await ctx.db.patch(user._id, { aiMemoryClearedAt: timestamp, updatedAt: timestamp })
    await ctx.db.insert("privacyEvents", { userId, type: "ai_memory.cleared", details: `${conversations.length} conversations;${messages.length} messages`, createdAt: timestamp })
    return { conversations: conversations.length, messages: messages.length }
  },
})

export const submitDataSubjectRequest = mutation({
  args: { userId: v.string(), type: v.union(v.literal("access"), v.literal("correction"), v.literal("deletion"), v.literal("restriction"), v.literal("objection")), details: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:write")
    if (!await userById(ctx, args.userId)) throw new Error("Account not available")
    const timestamp = new Date().toISOString()
    const legacyId = crypto.randomUUID()
    await ctx.db.insert("dataSubjectRequests", { legacyId, userId: args.userId, type: args.type, status: "identity_verified", details: args.details?.trim().slice(0, 1000), createdAt: timestamp, updatedAt: timestamp })
    return { id: legacyId, status: "identity_verified" as const }
  },
})

const processDeletion = makeFunctionReference<"mutation", Record<string, never>, unknown>("privacy:processDeletion") as unknown as FunctionReference<"mutation", "internal", { userId: string; jobId: string }, unknown>

export const requestAccountDeletion = mutation({
  args: { userId: v.string(), confirmationEmail: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "account:delete")
    const user = await userById(ctx, args.userId)
    if (!user || user.email.toLowerCase() !== args.confirmationEmail.trim().toLowerCase()) return null
    const subscriptions = await ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).collect()
    if (subscriptions.some((item: any) => ["created", "pending", "authenticated", "active"].includes(item.status))) throw new Error("ACTIVE_SUBSCRIPTION")
    const existing = await ctx.db.query("accountDeletionJobs").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    if (existing && existing.status !== "failed") return { id: existing.legacyId, status: existing.status }
    const timestamp = new Date().toISOString()
    const jobId = existing?.legacyId ?? crypto.randomUUID()
    await ctx.db.patch(user._id, { accountStatus: "deletion_pending", updatedAt: timestamp })
    if (existing) await ctx.db.patch(existing._id, { status: "queued", stage: "queued", updatedAt: timestamp, errorCode: undefined })
    else await ctx.db.insert("accountDeletionJobs", { legacyId: jobId, userId: args.userId, status: "queued", stage: "queued", attempts: 0, createdAt: timestamp, updatedAt: timestamp })
    await ctx.scheduler.runAfter(0, processDeletion, { userId: args.userId, jobId })
    return { id: jobId, status: "queued" as const }
  },
})
