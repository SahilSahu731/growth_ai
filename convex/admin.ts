/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"

import { requireScope } from "./lib/serverAuth"
import { assertGoalCanBeActive, assertPlanSupportsActiveGoals } from "./lib/goalLimits"
import { collectOwnedRows } from "./lib/ownedData"

const planTier = v.union(v.literal("free"), v.literal("pro"), v.literal("founder"), v.literal("team"))

const announcementTone = v.union(v.literal("info"), v.literal("offer"), v.literal("warning"), v.literal("critical"))
const announcementPlacement = v.union(v.literal("top_bar"), v.literal("floating_banner"), v.literal("popup"))
const announcementAlignment = v.union(v.literal("left"), v.literal("center"))
const announcementButtonStyle = v.union(v.literal("solid"), v.literal("outline"))

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

async function writeAudit(
  ctx: any,
  input: { actor: string; actorRole?: string; action: string; targetType: string; targetId?: string; reason?: string; ticket?: string; requestId?: string; result?: string; summary: string }
) {
  await ctx.db.insert("adminAuditLogs", {
    actor: input.actor.trim().toLowerCase().slice(0, 160),
    ...(input.actorRole ? { actorRole: input.actorRole.slice(0, 60) } : {}),
    action: input.action.slice(0, 80),
    targetType: input.targetType.slice(0, 60),
    ...(input.targetId ? { targetId: input.targetId.slice(0, 160) } : {}),
    ...(input.reason ? { reason: input.reason.replace(/\s+/g, " ").trim().slice(0, 500) } : {}),
    ...(input.ticket ? { ticket: input.ticket.trim().slice(0, 100) } : {}),
    ...(input.requestId ? { requestId: input.requestId.trim().slice(0, 100) } : {}),
    ...(input.result ? { result: input.result.trim().slice(0, 60) } : {}),
    summary: input.summary.replace(/\s+/g, " ").trim().slice(0, 300),
    createdAt: new Date().toISOString(),
  })
}

export const consumeLoginAttempt = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    await requireScope(ctx, "admin", "admin:login")
    const now = new Date()
    const nowIso = now.toISOString()
    const row = await ctx.db.query("adminLoginAttempts").withIndex("by_key", (q: any) => q.eq("key", key)).unique()

    if (row?.blockedUntil && row.blockedUntil > nowIso) {
      return { allowed: false, retryAt: row.blockedUntil }
    }

    const windowExpired = !row || Date.parse(row.windowStartedAt) < now.getTime() - 15 * 60 * 1000
    const attempts = windowExpired ? 1 : row.attempts + 1
    const backoffMs = attempts > 5 ? Math.min(30 * 60 * 1000, 60_000 * (2 ** Math.min(attempts - 6, 5))) : 0
    const blockedUntil = backoffMs ? new Date(now.getTime() + backoffMs).toISOString() : undefined
    const fields = {
      attempts,
      windowStartedAt: windowExpired ? nowIso : row.windowStartedAt,
      blockedUntil,
      updatedAt: nowIso,
    }

    if (row) await ctx.db.patch(row._id, fields)
    else await ctx.db.insert("adminLoginAttempts", { key, ...fields })

    return { allowed: !blockedUntil, retryAt: blockedUntil ?? null }
  },
})

export const clearLoginAttempts = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    await requireScope(ctx, "admin", "admin:login")
    const row = await ctx.db.query("adminLoginAttempts").withIndex("by_key", (q: any) => q.eq("key", key)).unique()
    if (row) await ctx.db.delete(row._id)
    return true
  },
})

export const createSession = mutation({
  args: { tokenHash: v.string(), email: v.string(), roles: v.array(v.string()), deviceHash: v.string(), absoluteExpiresAt: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:session")
    const timestamp = new Date().toISOString()
    const idleExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await ctx.db.insert("adminSessions", { tokenHash: args.tokenHash, email: args.email.trim().toLowerCase(), roles: args.roles.slice(0, 8), deviceHash: args.deviceHash, createdAt: timestamp, lastSeenAt: timestamp, idleExpiresAt, absoluteExpiresAt: args.absoluteExpiresAt })
    return true
  },
})

export const validateSession = mutation({
  args: { tokenHash: v.string(), email: v.string(), deviceHash: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:session")
    const row = await ctx.db.query("adminSessions").withIndex("by_token_hash", (q: any) => q.eq("tokenHash", args.tokenHash)).unique()
    const timestamp = new Date().toISOString()
    if (!row || row.revokedAt || row.email !== args.email.trim().toLowerCase() || row.deviceHash !== args.deviceHash || row.idleExpiresAt <= timestamp || row.absoluteExpiresAt <= timestamp) return null
    await ctx.db.patch(row._id, { lastSeenAt: timestamp, idleExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
    return { email: row.email, roles: row.roles, absoluteExpiresAt: row.absoluteExpiresAt }
  },
})

export const revokeSession = mutation({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:session")
    const row = await ctx.db.query("adminSessions").withIndex("by_token_hash", (q: any) => q.eq("tokenHash", args.tokenHash)).unique()
    if (row && !row.revokedAt) await ctx.db.patch(row._id, { revokedAt: new Date().toISOString() })
    return true
  },
})

export const listSessions = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:session")
    const rows = await ctx.db.query("adminSessions").withIndex("by_email_created", (q: any) => q.eq("email", args.email.trim().toLowerCase())).order("desc").take(20)
    return rows.map((row: any) => ({ id: row.tokenHash.slice(0, 12), roles: row.roles, device: row.deviceHash.slice(0, 12), createdAt: row.createdAt, lastSeenAt: row.lastSeenAt, idleExpiresAt: row.idleExpiresAt, absoluteExpiresAt: row.absoluteExpiresAt, revokedAt: row.revokedAt ?? null }))
  },
})

export const recordAudit = mutation({
  args: {
    actor: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    reason: v.optional(v.string()), ticket: v.optional(v.string()), requestId: v.optional(v.string()), result: v.optional(v.string()), actorRole: v.optional(v.string()),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:audit")
    await writeAudit(ctx, args)
    return true
  },
})

export const getDashboard = query({
  args: {},
  handler: async (ctx) => {
    await requireScope(ctx, "admin", "admin:read")
    const [users, conversations, messages, goals, tasks, subscriptions, billingEvents] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("operatorConversations").collect(),
      ctx.db.query("operatorMessages").collect(),
      ctx.db.query("operatorGoals").collect(),
      ctx.db.query("operatorTasks").collect(),
      ctx.db.query("subscriptions").collect(),
      ctx.db.query("billingEvents").collect(),
    ])
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const activeSubscriptions = subscriptions.filter((item: any) => ["active", "authenticated", "charged"].includes(item.status))
    return {
      totals: {
        users: users.length,
        activeUsers: users.filter((item: any) => !item.deletedAt && (!item.accountStatus || item.accountStatus === "active")).length,
        suspendedUsers: users.filter((item: any) => Boolean(item.deletedAt) || item.accountStatus === "suspended").length,
        conversations: conversations.length,
        messages: messages.length,
        activeGoals: goals.filter((item: any) => item.status === "active").length,
        openTasks: tasks.filter((item: any) => item.status === "todo").length,
        completedTasks: tasks.filter((item: any) => item.status === "done").length,
        activeSubscriptions: activeSubscriptions.length,
        failedBillingEvents: billingEvents.filter((item: any) => item.status === "failed").length,
      },
      lastSevenDays: {
        users: users.filter((item: any) => Date.parse(item.createdAt) >= sevenDaysAgo).length,
        messages: messages.filter((item: any) => Date.parse(item.createdAt) >= sevenDaysAgo).length,
        completedTasks: tasks.filter((item: any) => item.status === "done" && item.completedAt && Date.parse(item.completedAt) >= sevenDaysAgo).length,
      },
      planDistribution: ["free", "pro", "founder", "team"].map((tier) => ({
        tier,
        count: users.filter((item: any) => item.planTier === tier && !item.deletedAt && (!item.accountStatus || item.accountStatus === "active")).length,
      })),
      recentUsers: users.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(clean),
      recentBillingEvents: billingEvents.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map(clean),
    }
  },
})

export const listUsers = query({
  args: { search: v.string(), page: v.number(), pageSize: v.number() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:read")
    const search = args.search.trim().toLowerCase()
    const pageSize = Math.min(Math.max(Math.floor(args.pageSize), 1), 100)
    const page = Math.max(Math.floor(args.page), 1)
    const all = await ctx.db.query("users").collect()
    const filtered = all
      .filter((user: any) => !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search))
      .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    const enriched = await Promise.all(items.map(async (user: any) => {
      const [goals, tasks, subscriptions] = await Promise.all([
        collectOwnedRows(ctx, "operatorGoals", user.legacyId),
        collectOwnedRows(ctx, "operatorTasks", user.legacyId),
        ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", user.legacyId)).collect(),
      ])
      return {
        ...clean(user),
        activeGoals: goals.filter((goal: any) => goal.status === "active").length,
        openTasks: tasks.filter((task: any) => task.status === "todo").length,
        subscriptions: subscriptions.length,
      }
    }))
    return { items: enriched, total: filtered.length, page, pageSize, pages: Math.max(1, Math.ceil(filtered.length / pageSize)) }
  },
})

export const getUserDetail = mutation({
  args: { userId: v.string(), actor: v.string(), reason: v.string(), ticket: v.string(), requestId: v.string() },
  handler: async (ctx, { userId, actor, reason, ticket, requestId }) => {
    await requireScope(ctx, "admin", "admin:sensitive-read")
    if (reason.trim().length < 10 || ticket.trim().length < 3 || !/^[A-Za-z0-9_-]{8,100}$/.test(requestId)) throw new Error("SUPPORT_JUSTIFICATION_REQUIRED")
    const user = await userById(ctx, userId)
    if (!user) return null
    const [conversations, messages, goals, tasks, subscriptions] = await Promise.all([
      collectOwnedRows(ctx, "operatorConversations", userId),
      collectOwnedRows(ctx, "operatorMessages", userId),
      collectOwnedRows(ctx, "operatorGoals", userId),
      collectOwnedRows(ctx, "operatorTasks", userId),
      ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
    ])
    const result = {
      user: clean(user),
      conversations: conversations.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean),
      messages: messages.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)).slice(0, 40).map(clean),
      goals: goals.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean),
      tasks: tasks.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 100).map(clean),
      subscriptions: subscriptions.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean),
      counts: { conversations: conversations.length, messages: messages.length, goals: goals.length, tasks: tasks.length },
    }
    await writeAudit(ctx, { actor, actorRole: "support-read", action: "user.sensitive_data.read", targetType: "user", targetId: userId, reason, ticket, requestId, result: "success", summary: `Opened account, conversation, message, goal, task, and subscription details for ${user.email}.` })
    return result
  },
})

export const updateUser = mutation({
  args: { actor: v.string(), userId: v.string(), name: v.string(), planTier },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:write")
    const user = await userById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    const name = args.name.replace(/\s+/g, " ").trim().slice(0, 100)
    if (name.length < 2) throw new Error("Name must contain at least 2 characters")
    await assertPlanSupportsActiveGoals(ctx, { userId: args.userId, planTier: args.planTier })
    await ctx.db.patch(user._id, { name, planTier: args.planTier, updatedAt: new Date().toISOString() })
    await writeAudit(ctx, {
      actor: args.actor,
      action: "user.update",
      targetType: "user",
      targetId: args.userId,
      summary: `Updated ${user.email}: name and plan (${user.planTier} to ${args.planTier}).`,
    })
    return clean(await ctx.db.get(user._id))
  },
})

export const setUserAccess = mutation({
  args: { actor: v.string(), userId: v.string(), suspended: v.boolean(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:write")
    const user = await userById(ctx, args.userId)
    if (!user) throw new Error("User not found")
    const timestamp = new Date().toISOString()
    const reason = args.reason?.trim().slice(0, 300)
    if (args.suspended && (!reason || reason.length < 3)) throw new Error("A suspension reason is required")
    await ctx.db.patch(user._id, {
      accountStatus: args.suspended ? "suspended" : "active",
      suspendedAt: args.suspended ? timestamp : undefined,
      suspensionReason: args.suspended ? reason : undefined,
      suspensionActor: args.suspended ? args.actor : undefined,
      deletedAt: undefined,
      updatedAt: timestamp,
    })
    await writeAudit(ctx, {
      actor: args.actor,
      action: args.suspended ? "user.suspend" : "user.restore",
      targetType: "user",
      targetId: args.userId,
      summary: `${args.suspended ? "Suspended" : "Restored"} access for ${user.email}.${args.suspended ? ` Reason: ${reason}` : ""}`,
    })
    return true
  },
})

export const setGoalStatus = mutation({
  args: {
    actor: v.string(),
    userId: v.string(),
    goalId: v.string(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:write")
    const goal = await ctx.db.query("operatorGoals").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.goalId)).unique()
    if (!goal || goal.userId !== args.userId) throw new Error("Goal not found")
    if (args.status === "active") await assertGoalCanBeActive(ctx, { userId: args.userId, goalId: args.goalId })
    const timestamp = new Date().toISOString()
    await ctx.db.patch(goal._id, {
      status: args.status,
      updatedAt: timestamp,
      completedAt: args.status === "completed" ? (goal.completedAt ?? timestamp) : undefined,
    })
    if (args.status !== "active") {
      const tasks = await ctx.db.query("operatorTasks").withIndex("by_goal_status", (q: any) => q.eq("goalId", args.goalId).eq("status", "todo")).collect()
      for (const task of tasks) await ctx.db.patch(task._id, { status: "dismissed", updatedAt: timestamp })
    }
    await writeAudit(ctx, {
      actor: args.actor,
      action: "goal.status",
      targetType: "goal",
      targetId: args.goalId,
      summary: `Changed goal “${goal.title}” to ${args.status}.`,
    })
    return true
  },
})

export const setTaskStatus = mutation({
  args: {
    actor: v.string(),
    userId: v.string(),
    taskId: v.string(),
    status: v.union(v.literal("todo"), v.literal("done"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:write")
    const task = await ctx.db.query("operatorTasks").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.taskId)).unique()
    if (!task || task.userId !== args.userId) throw new Error("Task not found")
    const timestamp = new Date().toISOString()
    await ctx.db.patch(task._id, {
      status: args.status,
      updatedAt: timestamp,
      completedAt: args.status === "done" ? timestamp : undefined,
    })
    await writeAudit(ctx, {
      actor: args.actor,
      action: "task.status",
      targetType: "task",
      targetId: args.taskId,
      summary: `Changed task “${task.title}” to ${args.status}.`,
    })
    return true
  },
})

export const deleteConversation = mutation({
  args: { actor: v.string(), userId: v.string(), conversationId: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:delete")
    const conversation = await ctx.db.query("operatorConversations").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.conversationId)).unique()
    if (!conversation || conversation.userId !== args.userId) throw new Error("Conversation not found")
    const messages = await ctx.db.query("operatorMessages").withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId)).collect()
    for (const message of messages) await ctx.db.delete(message._id)
    await ctx.db.delete(conversation._id)
    await writeAudit(ctx, {
      actor: args.actor,
      action: "conversation.delete",
      targetType: "conversation",
      targetId: args.conversationId,
      summary: `Deleted conversation “${conversation.title}” and ${messages.length} messages.`,
    })
    return true
  },
})

export const deleteUser = mutation({
  args: { actor: v.string(), userId: v.string(), confirmationEmail: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:delete")
    const user = await userById(ctx, args.userId)
    if (!user || user.email.toLowerCase() !== args.confirmationEmail.trim().toLowerCase()) {
      throw new Error("Confirmation email does not match")
    }
    const deleted: Record<string, number> = {}
    for (const table of ["operatorMessages", "operatorTasks", "operatorGoals", "operatorConversations", "subscriptions", "billingCheckoutLocks", "aiDailyUsage"] as const) {
      const rows = await collectOwnedRows(ctx, table, args.userId)
      deleted[table] = rows.length
      for (const row of rows) await ctx.db.delete(row._id)
    }
    // Preserve the audit trail independently from the deleted user record.
    await writeAudit(ctx, {
      actor: args.actor,
      action: "user.delete",
      targetType: "user",
      targetId: args.userId,
      summary: `Permanently deleted ${user.email} and owned product data (${JSON.stringify(deleted)}).`,
    })
    await ctx.db.delete(user._id)
    return true
  },
})

export const getBilling = query({
  args: { page: v.number(), pageSize: v.number() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:billing")
    const page = Math.max(1, Math.floor(args.page))
    const pageSize = Math.min(100, Math.max(1, Math.floor(args.pageSize)))
    const [subscriptions, events, users] = await Promise.all([
      ctx.db.query("subscriptions").collect(),
      ctx.db.query("billingEvents").collect(),
      ctx.db.query("users").collect(),
    ])
    const userMap = new Map(users.map((user: any) => [user.legacyId, { name: user.name, email: user.email }]))
    const sorted = events.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    const start = (page - 1) * pageSize
    return {
      subscriptions: subscriptions.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map((item: any) => ({ ...clean(item), user: userMap.get(item.userId) ?? null })),
      events: sorted.slice(start, start + pageSize).map(clean),
      totalEvents: sorted.length,
      page,
      pages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    }
  },
})

export const getActivity = mutation({
  args: { page: v.number(), pageSize: v.number(), actor: v.string(), reason: v.string(), ticket: v.string(), requestId: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:sensitive-read")
    if (args.reason.trim().length < 10 || args.ticket.trim().length < 3 || !/^[A-Za-z0-9_-]{8,100}$/.test(args.requestId)) throw new Error("SUPPORT_JUSTIFICATION_REQUIRED")
    const page = Math.max(1, Math.floor(args.page))
    const pageSize = Math.min(100, Math.max(1, Math.floor(args.pageSize)))
    const [messages, conversations, users] = await Promise.all([
      ctx.db.query("operatorMessages").collect(),
      ctx.db.query("operatorConversations").collect(),
      ctx.db.query("users").collect(),
    ])
    const userMap = new Map(users.map((user: any) => [user.legacyId, { id: user.legacyId, name: user.name, email: user.email }]))
    const conversationMap = new Map(conversations.map((item: any) => [item.legacyId, item.title]))
    const sorted = messages.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    const start = (page - 1) * pageSize
    const result = {
      items: sorted.slice(start, start + pageSize).map((message: any) => ({
        ...clean(message),
        content: message.content.slice(0, 240),
        user: userMap.get(message.userId) ?? null,
        conversationTitle: conversationMap.get(message.conversationId) ?? "Deleted conversation",
      })),
      total: sorted.length,
      page,
      pages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    }
    await writeAudit(ctx, { actor: args.actor, actorRole: "support-read", action: "messages.bulk_read", targetType: "message_page", reason: args.reason, ticket: args.ticket, requestId: args.requestId, result: "success", summary: `Read ${result.items.length} message previews from activity page ${page}.` })
    return result
  },
})

export const getAuditLogs = query({
  args: { page: v.number(), pageSize: v.number() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:audit-read")
    const page = Math.max(1, Math.floor(args.page))
    const pageSize = Math.min(100, Math.max(1, Math.floor(args.pageSize)))
    const logs = await ctx.db.query("adminAuditLogs").withIndex("by_created_at").order("desc").collect()
    const start = (page - 1) * pageSize
    return {
      items: logs.slice(start, start + pageSize).map(clean),
      total: logs.length,
      page,
      pages: Math.max(1, Math.ceil(logs.length / pageSize)),
    }
  },
})

function announcementFields(args: {
  title?: string
  message: string
  tone: "info" | "offer" | "warning" | "critical"
  placement: "top_bar" | "floating_banner" | "popup"
  backgroundColor: string
  textColor: string
  accentColor: string
  alignment: "left" | "center"
  buttonStyle: "solid" | "outline"
  showIcon: boolean
  linkLabel?: string
  linkUrl?: string
  startsAt?: string
  endsAt?: string
  priority: number
  dismissible: boolean
  isActive: boolean
}) {
  const title = args.title?.replace(/\s+/g, " ").trim().slice(0, 80) || undefined
  const message = args.message.replace(/\s+/g, " ").trim().slice(0, 240)
  if (message.length < 3) throw new Error("Announcement must contain at least 3 characters")
  const linkLabel = args.linkLabel?.replace(/\s+/g, " ").trim().slice(0, 40) || undefined
  const linkUrl = args.linkUrl?.trim().slice(0, 500) || undefined
  if (Boolean(linkLabel) !== Boolean(linkUrl)) throw new Error("Link text and URL must be provided together")
  if (linkUrl && !((linkUrl.startsWith("/") && !linkUrl.startsWith("//")) || linkUrl.startsWith("https://"))) {
    throw new Error("Announcement links must use HTTPS or a local path")
  }
  const colorPattern = /^#[0-9A-Fa-f]{6}$/
  for (const [name, color] of [["Background", args.backgroundColor], ["Text", args.textColor], ["Accent", args.accentColor]] as const) {
    if (!colorPattern.test(color)) throw new Error(`${name} color must be a 6-digit hex value`)
  }
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const contrast = (left: string, right: string) => {
    const values = [luminance(left), luminance(right)].sort((a, b) => b - a)
    return (values[0] + 0.05) / (values[1] + 0.05)
  }
  if (contrast(args.textColor, args.backgroundColor) < 4.5) throw new Error("Announcement text and background must have at least 4.5:1 contrast")
  if (contrast(args.accentColor, args.backgroundColor) < 3) throw new Error("Announcement accent and background must have at least 3:1 contrast")
  const startsAt = args.startsAt || undefined
  const endsAt = args.endsAt || undefined
  if (startsAt && Number.isNaN(Date.parse(startsAt))) throw new Error("Start time is invalid")
  if (endsAt && Number.isNaN(Date.parse(endsAt))) throw new Error("End time is invalid")
  if (startsAt && endsAt && startsAt >= endsAt) throw new Error("End time must be after start time")
  return {
    title,
    message,
    tone: args.tone,
    placement: args.placement,
    backgroundColor: args.backgroundColor.toUpperCase(),
    textColor: args.textColor.toUpperCase(),
    accentColor: args.accentColor.toUpperCase(),
    alignment: args.alignment,
    buttonStyle: args.buttonStyle,
    showIcon: args.showIcon,
    linkLabel,
    linkUrl,
    startsAt,
    endsAt,
    priority: Math.min(100, Math.max(0, Math.round(args.priority))),
    dismissible: args.dismissible,
    isActive: args.isActive,
  }
}

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireScope(ctx, "admin", "admin:read")
    const rows = await ctx.db.query("announcements").collect()
    return rows.sort((left: any, right: any) => right.priority - left.priority || right.updatedAt.localeCompare(left.updatedAt)).map(clean)
  },
})

export const createAnnouncement = mutation({
  args: {
    actor: v.string(), title: v.optional(v.string()), message: v.string(), tone: announcementTone,
    placement: announcementPlacement, backgroundColor: v.string(), textColor: v.string(), accentColor: v.string(),
    alignment: announcementAlignment, buttonStyle: announcementButtonStyle, showIcon: v.boolean(),
    linkLabel: v.optional(v.string()), linkUrl: v.optional(v.string()),
    startsAt: v.optional(v.string()), endsAt: v.optional(v.string()),
    priority: v.number(), dismissible: v.boolean(), isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:write")
    const timestamp = new Date().toISOString()
    const legacyId = crypto.randomUUID()
    const fields = announcementFields(args)
    const id = await ctx.db.insert("announcements", { legacyId, ...fields, createdAt: timestamp, updatedAt: timestamp })
    await writeAudit(ctx, {
      actor: args.actor, action: "announcement.create", targetType: "announcement", targetId: legacyId,
      summary: `Created ${fields.tone} announcement “${fields.message}”.`,
    })
    return clean(await ctx.db.get(id))
  },
})

export const updateAnnouncement = mutation({
  args: {
    actor: v.string(), announcementId: v.string(), title: v.optional(v.string()), message: v.string(), tone: announcementTone,
    placement: announcementPlacement, backgroundColor: v.string(), textColor: v.string(), accentColor: v.string(),
    alignment: announcementAlignment, buttonStyle: announcementButtonStyle, showIcon: v.boolean(),
    linkLabel: v.optional(v.string()), linkUrl: v.optional(v.string()),
    startsAt: v.optional(v.string()), endsAt: v.optional(v.string()),
    priority: v.number(), dismissible: v.boolean(), isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:write")
    const row = await ctx.db.query("announcements").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.announcementId)).unique()
    if (!row) throw new Error("Announcement not found")
    const fields = announcementFields(args)
    await ctx.db.patch(row._id, { ...fields, updatedAt: new Date().toISOString() })
    await writeAudit(ctx, {
      actor: args.actor, action: "announcement.update", targetType: "announcement", targetId: args.announcementId,
      summary: `Updated ${fields.tone} announcement “${fields.message}” (${fields.isActive ? "active" : "inactive"}).`,
    })
    return clean(await ctx.db.get(row._id))
  },
})

export const deleteAnnouncement = mutation({
  args: { actor: v.string(), announcementId: v.string() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "admin", "admin:delete")
    const row = await ctx.db.query("announcements").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.announcementId)).unique()
    if (!row) throw new Error("Announcement not found")
    await ctx.db.delete(row._id)
    await writeAudit(ctx, {
      actor: args.actor, action: "announcement.delete", targetType: "announcement", targetId: args.announcementId,
      summary: `Deleted announcement “${row.message}”.`,
    })
    return true
  },
})
