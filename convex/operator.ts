/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, paginationOptsValidator, queryGeneric as query } from "convex/server"
import { v } from "convex/values"
import { requireMember, requireScope } from "./lib/serverAuth"
import { conversationTitle } from "./lib/conversationTitle"
import { assertGoalCanBeActive } from "./lib/goalLimits"
import { resolveEntitlements } from "./lib/entitlements"

const conversationState = v.union(
  v.literal("discovery"),
  v.literal("diagnosis"),
  v.literal("focus_proposal"),
  v.literal("plan_creation"),
  v.literal("daily_execution"),
  v.literal("blocker_diagnosis"),
  v.literal("review"),
  v.literal("replan")
)

const taskDraft = v.object({
  title: v.string(),
  note: v.string(),
  estimatedMinutes: v.number(),
  completionCondition: v.string(),
  scheduledFor: v.string(),
  goalTitle: v.optional(v.string()),
})

function now() {
  return new Date().toISOString()
}

function id() {
  return crypto.randomUUID()
}

function clean(document: any) {
  if (!document) return null
  const value = { ...document }
  const resolvedId = value.legacyId ?? String(value._id)
  delete value._id
  delete value._creationTime
  delete value.legacyId
  return { id: resolvedId, ...value }
}

async function conversationForUser(ctx: any, conversationId: string, userId: string) {
  const conversation = await ctx.db
    .query("operatorConversations")
    .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", conversationId))
    .unique()
  return conversation?.userId === userId ? conversation : null
}

async function userForId(ctx: any, userId: string) {
  return ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", userId)).unique()
}

function normalizeGoalTitle(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80)
}

function normalizedTitleKey(value: string) {
  return normalizeGoalTitle(value).toLocaleLowerCase("en")
}

function isRealDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

async function consumeAiQuota(ctx: any, input: { userId: string; rateLimitKey: string; date: string }) {
  const timestamp = now()
  const currentTime = Date.now()
  const limits = [
    { key: `user:${input.userId}`, maximum: 20 },
    { key: `network:${input.rateLimitKey}`, maximum: 40 },
  ]
  for (const limit of limits) {
    const row = await ctx.db.query("aiUsageWindows").withIndex("by_key", (q: any) => q.eq("key", limit.key)).unique()
    if (!row || currentTime - row.windowStartedAt >= 15 * 60 * 1000) {
      if (row) await ctx.db.patch(row._id, { windowStartedAt: currentTime, count: 1, updatedAt: timestamp })
      else await ctx.db.insert("aiUsageWindows", { key: limit.key, windowStartedAt: currentTime, count: 1, updatedAt: timestamp })
    } else {
      if (row.count >= limit.maximum) throw new Error("AI_RATE_LIMITED: Too many requests. Wait a few minutes and try again.")
      await ctx.db.patch(row._id, { count: row.count + 1, updatedAt: timestamp })
    }
  }

  const daily = await ctx.db.query("aiDailyUsage").withIndex("by_user_date", (q: any) => q.eq("userId", input.userId).eq("date", input.date)).unique()
  if (daily && (daily.requests >= 100 || daily.inputTokens + daily.outputTokens >= 100_000 || (daily.estimatedCostUsd ?? 0) >= 5)) {
    throw new Error("AI_DAILY_LIMIT_REACHED: Daily AI usage limit reached. Try again tomorrow.")
  }
  if (daily) await ctx.db.patch(daily._id, { requests: daily.requests + 1, updatedAt: timestamp })
  else await ctx.db.insert("aiDailyUsage", { userId: input.userId, date: input.date, requests: 1, inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, updatedAt: timestamp })
}

async function goalForUser(ctx: any, goalId: string, userId: string) {
  const goal = await ctx.db.query("operatorGoals").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", goalId)).unique()
  return goal?.userId === userId ? goal : null
}

async function activeGoalsForUser(ctx: any, userId: string) {
  return ctx.db.query("operatorGoals").withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", "active")).take(100)
}

async function activeGenerationForUser(ctx: any, userId: string, excludeMessageId?: string) {
  const timestamp = now()
  const pending = await ctx.db
    .query("operatorMessages")
    .withIndex("by_user_generation", (q: any) => q.eq("userId", userId).eq("generationStatus", "pending"))
    .take(10)
  return pending.find((message: any) => message.legacyId !== excludeMessageId && message.generationLeaseExpiresAt > timestamp)
}

async function trackProductEvent(ctx: any, input: { userId: string; name: "conversation_started" | "evidence_gathered" | "plan_proposed" | "task_accepted" | "task_completed" | "task_deferred" | "report_viewed" | "upgrade_viewed" | "checkout_started" | "subscription_activated" | "onboarding_completed" | "feedback_submitted"; sourceId?: string; durationMs?: number; estimatedCostUsd?: number }) {
  const entitlement = await resolveEntitlements(ctx, input.userId)
  await ctx.db.insert("productEvents", { userId: input.userId, name: input.name, sourceId: input.sourceId, funnelVersion: "core-loop-v1", plan: entitlement.plan, durationMs: input.durationMs, estimatedCostUsd: input.estimatedCostUsd, createdAt: now() })
}

async function insertConversation(ctx: any, userId: string) {
  const user = await userForId(ctx, userId)
  if (!user || user.deletedAt || (user.accountStatus && user.accountStatus !== "active")) throw new Error("USER_NOT_FOUND: User not found")
  const timestamp = now()
  const legacyId = id()
  const documentId = await ctx.db.insert("operatorConversations", {
    legacyId,
    userId,
    title: "A new direction",
    state: "discovery",
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  return clean(await ctx.db.get(documentId))
}

export const createConversation = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "operator:member")
    const recent = await ctx.db.query("operatorConversations").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).order("desc").filter((q: any) => q.eq(q.field("archivedAt"), undefined)).first()
    if (recent) {
      const firstMessage = await ctx.db.query("operatorMessages").withIndex("by_conversation_time", (q: any) => q.eq("conversationId", recent.legacyId)).first()
      if (!firstMessage) return clean(recent)
    }
    return insertConversation(ctx, userId)
  },
})

export const ensureConversation = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "operator:member")
    const existing = await ctx.db
      .query("operatorConversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
      .order("desc")
      .filter((q: any) => q.eq(q.field("archivedAt"), undefined))
      .first()
    if (existing) return clean(existing)

    return insertConversation(ctx, userId)
  },
})

export const getWorkspace = query({
  args: { userId: v.string(), conversationId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) return null

    const [messagePage, openTasks, goals, user, providerCircuit, entitlements] = await Promise.all([
      ctx.db
        .query("operatorMessages")
        .withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId))
        .order("desc")
        .paginate({ numItems: 80, cursor: null }),
      ctx.db
        .query("operatorTasks")
        .withIndex("by_user_status", (q: any) => q.eq("userId", args.userId).eq("status", "todo"))
        .take(1000),
      ctx.db.query("operatorGoals").withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId)).take(100),
      userForId(ctx, args.userId),
      ctx.db.query("aiProviderCircuit").withIndex("by_key", (q: any) => q.eq("key", "gemini")).unique(),
      resolveEntitlements(ctx, args.userId),
    ])

    return {
      conversation: clean(conversation),
      messages: messagePage.page.reverse().map(clean),
      messageCursor: messagePage.continueCursor,
      hasMoreMessages: !messagePage.isDone,
      tasks: openTasks.sort((a: any, b: any) => {
        const dateOrder = a.scheduledFor.localeCompare(b.scheduledFor)
        return dateOrder || a.position - b.position
      }).map(clean),
      goals: goals.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean),
      goalLimit: entitlements.limits.activeGoals,
      entitlements,
      timezone: user?.timezone ?? "UTC",
      locale: user?.locale ?? "en",
      coachTone: user?.coachTone ?? "balanced",
      providerCircuitOpen: Boolean(providerCircuit?.openedUntil && providerCircuit.openedUntil > now()),
    }
  },
})

export const getMessagePage = query({
  args: { userId: v.string(), conversationId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND: Conversation not found")
    const result = await ctx.db
      .query("operatorMessages")
      .withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .paginate(args.paginationOpts)
    return { ...result, page: result.page.reverse().map(clean) }
  },
})

export const getTasks = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "operator:member")
    const [tasks, goals, user] = await Promise.all([
      ctx.db.query("operatorTasks").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).order("desc").take(1_000),
      ctx.db.query("operatorGoals").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).order("desc").take(100),
      userForId(ctx, userId),
    ])
    if (!user) return null
    return { tasks: tasks.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean), goals: goals.map(clean), timezone: user.timezone ?? "UTC", locale: user.locale ?? "en" }
  },
})

export const getWeeklyActivity = query({
  args: { userId: v.string(), since: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    if (Number.isNaN(Date.parse(args.since))) throw new Error("INVALID_ACTIVITY_WINDOW")
    const [messages, openTasks, activeGoals] = await Promise.all([
      ctx.db.query("operatorMessages").withIndex("by_user_time", (q: any) => q.eq("userId", args.userId).gte("createdAt", args.since)).take(500),
      ctx.db.query("operatorTasks").withIndex("by_user_status", (q: any) => q.eq("userId", args.userId).eq("status", "todo")).take(500),
      ctx.db.query("operatorGoals").withIndex("by_user_status", (q: any) => q.eq("userId", args.userId).eq("status", "active")).take(100),
    ])
    const conversationTurns = messages.filter((item: any) => item.role === "user").length
    return { since: args.since, conversationTurns, openTasks: openTasks.length, activeGoals: activeGoals.length, enoughData: conversationTurns >= 3, bounded: messages.length === 500 || openTasks.length === 500 || activeGoals.length === 100 }
  },
})

export const ensureWeeklyReport = mutation({
  args: { userId: v.string(), windowStart: v.string(), windowEnd: v.string(), previousWindowStart: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const start = new Date(args.windowStart), end = new Date(args.windowEnd), previousStart = new Date(args.previousWindowStart)
    if ([start, end, previousStart].some((item) => Number.isNaN(item.getTime())) || end <= start || start <= previousStart || end.getTime() - start.getTime() > 8 * 24 * 60 * 60 * 1000) throw new Error("INVALID_REPORT_WINDOW")
    const existing = await ctx.db.query("weeklyReports").withIndex("by_user_window", (q: any) => q.eq("userId", args.userId).eq("windowStart", start.toISOString())).unique()
    if (existing) {
      await trackProductEvent(ctx, { userId: args.userId, name: "report_viewed", sourceId: String(existing._id) })
      return clean(existing)
    }
    const [taskEvents, tasks, messages, goals] = await Promise.all([
      ctx.db.query("operatorTaskEvents").withIndex("by_user_created", (q: any) => q.eq("userId", args.userId)).order("desc").take(2000),
      ctx.db.query("operatorTasks").withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId)).take(1000),
      ctx.db.query("operatorMessages").withIndex("by_user_time", (q: any) => q.eq("userId", args.userId)).order("desc").take(2000),
      ctx.db.query("operatorGoals").withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId)).take(100),
    ])
    const countWindow = (from: string, to: string) => {
      const events = taskEvents.filter((item: any) => item.createdAt >= from && item.createdAt < to)
      const turns = messages.filter((item: any) => item.role === "user" && item.createdAt >= from && item.createdAt < to)
      const toDate = to.slice(0, 10)
      return { completed: events.filter((item: any) => item.event === "completed").length, deferred: events.filter((item: any) => item.event === "deferred").length, dismissed: events.filter((item: any) => item.event === "dismissed").length, overdue: tasks.filter((item: any) => item.status === "todo" && item.scheduledFor < toDate).length, conversationTurns: turns.length }
    }
    const counts = countWindow(start.toISOString(), end.toISOString())
    const previousCounts = countWindow(previousStart.toISOString(), start.toISOString())
    const currentEvents = taskEvents.filter((item: any) => item.createdAt >= start.toISOString() && item.createdAt < end.toISOString())
    const sourceTaskIds = [...new Set(currentEvents.map((item: any) => item.taskId))].slice(0, 20) as string[]
    const sourceConversationIds = [...new Set(messages.filter((item: any) => item.role === "user" && item.createdAt >= start.toISOString() && item.createdAt < end.toISOString()).map((item: any) => item.conversationId))].slice(0, 20) as string[]
    const observations = [
      { id: id(), kind: "fact" as const, statement: `You completed ${counts.completed}, deferred ${counts.deferred}, and dismissed ${counts.dismissed} commitments in this source window.`, confidence: 1, taskIds: sourceTaskIds, conversationIds: [] as string[] },
      { id: id(), kind: "fact" as const, statement: `${counts.overdue} open ${counts.overdue === 1 ? "commitment is" : "commitments are"} currently past the scheduled date.`, confidence: 1, taskIds: tasks.filter((item: any) => item.status === "todo" && item.scheduledFor < end.toISOString().slice(0, 10)).map((item: any) => item.legacyId).slice(0, 20), conversationIds: [] as string[] },
      ...(counts.deferred + counts.dismissed > counts.completed && sourceTaskIds.length ? [{ id: id(), kind: "hypothesis" as const, statement: "The current plan may contain more commitments than fit comfortably. Consider narrowing the next week rather than trying harder.", confidence: .62, taskIds: sourceTaskIds, conversationIds: sourceConversationIds }] : []),
    ]
    const nextFocus = goals.filter((goal: any) => goal.status === "active").slice(0, 2).map((goal: any) => goal.title)
    const timestamp = now()
    const reportId = await ctx.db.insert("weeklyReports", { userId: args.userId, version: 1, windowStart: start.toISOString(), windowEnd: end.toISOString(), previousWindowStart: previousStart.toISOString(), counts, previousCounts, observations, nextFocus, createdAt: timestamp })
    await trackProductEvent(ctx, { userId: args.userId, name: "report_viewed", sourceId: String(reportId) })
    return clean(await ctx.db.get(reportId))
  },
})

export const listWeeklyReports = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "operator:member")
    const reports = await ctx.db.query("weeklyReports").withIndex("by_user_created", (q: any) => q.eq("userId", userId)).order("desc").take(52)
    return reports.map(clean)
  },
})

export const reviewWeeklyObservation = mutation({
  args: { userId: v.string(), reportId: v.string(), observationId: v.string(), status: v.union(v.literal("accepted"), v.literal("rejected"), v.literal("corrected")), correction: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const report = await ctx.db.get(args.reportId as any)
    if (!report || report.userId !== args.userId || !Array.isArray(report.observations)) throw new Error("REPORT_NOT_FOUND")
    const correction = args.correction?.replace(/\s+/g, " ").trim().slice(0, 300)
    if (args.status === "corrected" && !correction) throw new Error("CORRECTION_REQUIRED")
    const observations = report.observations.map((item: any) => item.id === args.observationId ? { ...item, reviewStatus: args.status, correction: args.status === "corrected" ? correction : undefined } : item)
    await ctx.db.patch(report._id, { observations })
    return true
  },
})

export const submitMessageFeedback = mutation({
  args: { userId: v.string(), messageId: v.string(), rating: v.union(v.literal("useful"), v.literal("not_useful"), v.literal("reported")), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const message = await ctx.db.query("operatorMessages").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.messageId)).unique()
    if (!message || message.userId !== args.userId || message.role !== "assistant") throw new Error("MESSAGE_NOT_FOUND")
    const timestamp = now()
    const existing = await ctx.db.query("messageFeedback").withIndex("by_message_user", (q: any) => q.eq("messageId", args.messageId).eq("userId", args.userId)).unique()
    const fields = { rating: args.rating, reason: args.reason?.replace(/\s+/g, " ").trim().slice(0, 300), updatedAt: timestamp }
    if (existing) await ctx.db.patch(existing._id, fields)
    else await ctx.db.insert("messageFeedback", { userId: args.userId, messageId: args.messageId, createdAt: timestamp, ...fields })
    await trackProductEvent(ctx, { userId: args.userId, name: "feedback_submitted", sourceId: args.messageId })
    return true
  },
})

export const getGoal = query({
  args: { userId: v.string(), goalId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const goal = await goalForUser(ctx, args.goalId, args.userId)
    if (!goal) return null
    const tasks = await ctx.db.query("operatorTasks").withIndex("by_goal_status", (q: any) => q.eq("goalId", args.goalId)).take(1000)
    return { goal: clean(goal), tasks: tasks.filter((task: any) => task.userId === args.userId).sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean) }
  },
})

export const renameConversation = mutation({
  args: { userId: v.string(), conversationId: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND: Conversation not found")
    const title = args.title.replace(/\s+/g, " ").trim().slice(0, 64)
    if (title.length < 2) throw new Error("INVALID_CONVERSATION_TITLE: Use at least 2 characters")
    await ctx.db.patch(conversation._id, { title, updatedAt: now() })
    return { id: conversation.legacyId, title }
  },
})

export const setConversationPinned = mutation({
  args: { userId: v.string(), conversationId: v.string(), pinned: v.boolean() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND: Conversation not found")
    const timestamp = now()
    await ctx.db.patch(conversation._id, { pinnedAt: args.pinned ? timestamp : undefined, updatedAt: timestamp })
    return true
  },
})

export const setConversationArchived = mutation({
  args: { userId: v.string(), conversationId: v.string(), archived: v.boolean() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND: Conversation not found")
    const timestamp = now()
    await ctx.db.patch(conversation._id, { archivedAt: args.archived ? timestamp : undefined, pinnedAt: args.archived ? undefined : conversation.pinnedAt, updatedAt: timestamp })
    return true
  },
})

export const deleteConversation = mutation({
  args: { userId: v.string(), conversationId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) return false
    const messages = await ctx.db.query("operatorMessages").withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId)).take(501)
    const tasks = await ctx.db.query("operatorTasks").withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId)).take(501)
    if (messages.length > 500 || tasks.length > 500) throw new Error("CONVERSATION_TOO_LARGE: Contact support to delete this conversation safely")
    const messageCreatedAt = new Map(messages.map((message: any) => [message.legacyId, message.createdAt]))
    for (const task of tasks) {
      await ctx.db.patch(task._id, {
        originConversationTitle: conversation.title,
        originMessageCreatedAt: task.sourceMessageId ? messageCreatedAt.get(task.sourceMessageId) : undefined,
        conversationId: undefined,
        sourceMessageId: undefined,
      })
    }
    for (const message of messages) await ctx.db.delete(message._id)
    await ctx.db.delete(conversation._id)
    return true
  },
})

export const createGoal = mutation({
  args: { userId: v.string(), title: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const title = normalizeGoalTitle(args.title)
    const description = args.description.trim().slice(0, 500)
    if (title.length < 3) throw new Error("INVALID_GOAL_TITLE: Goal title must be at least 3 characters")
    const [user, activeGoals, allGoals, entitlements] = await Promise.all([
      userForId(ctx, args.userId),
      activeGoalsForUser(ctx, args.userId),
      ctx.db.query("operatorGoals").withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId)).take(100),
      resolveEntitlements(ctx, args.userId),
    ])
    if (!user) throw new Error("USER_NOT_FOUND: User not found")
    const duplicate = allGoals.find((goal: any) => normalizedTitleKey(goal.title) === normalizedTitleKey(title))
    if (duplicate) return { goal: clean(duplicate), limit: entitlements.limits.activeGoals, duplicate: true }
    const limit = entitlements.limits.activeGoals
    if (activeGoals.length >= limit) throw new Error(limit === 3 ? "GOAL_LIMIT_REACHED: Free accounts can have up to 3 active goals. Upgrade to Pro to add more." : "GOAL_LIMIT_REACHED: Active goal limit reached.")
    const timestamp = now()
    const documentId = await ctx.db.insert("operatorGoals", {
      legacyId: id(), userId: args.userId, title, description, status: "active", createdAt: timestamp, updatedAt: timestamp,
    })
    return { goal: clean(await ctx.db.get(documentId)), limit, duplicate: false }
  },
})

export const updateGoal = mutation({
  args: {
    userId: v.string(), goalId: v.string(), title: v.string(), description: v.string(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const goal = await goalForUser(ctx, args.goalId, args.userId)
    if (!goal) throw new Error("GOAL_NOT_FOUND: Goal not found")
    const title = normalizeGoalTitle(args.title)
    if (title.length < 3) throw new Error("INVALID_GOAL_TITLE: Goal title must be at least 3 characters")
    const allGoals = await ctx.db.query("operatorGoals").withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId)).take(100)
    const duplicate = allGoals.find((item: any) => item.legacyId !== args.goalId && normalizedTitleKey(item.title) === normalizedTitleKey(title))
    if (duplicate) throw new Error("DUPLICATE_GOAL: Another goal already uses that title")
    if (args.status === "active") await assertGoalCanBeActive(ctx, { userId: args.userId, goalId: args.goalId })
    const timestamp = now()
    await ctx.db.patch(goal._id, {
      title,
      description: args.description.trim().slice(0, 500),
      status: args.status,
      updatedAt: timestamp,
      completedAt: args.status === "completed" ? (goal.completedAt ?? timestamp) : undefined,
    })
    if (args.status !== "active") {
      const openTasks = await ctx.db.query("operatorTasks").withIndex("by_goal_status", (q: any) => q.eq("goalId", args.goalId).eq("status", "todo")).take(1000)
      await Promise.all(openTasks.map((task: any) => ctx.db.patch(task._id, { status: "dismissed", updatedAt: timestamp })))
    }
    return clean(await ctx.db.get(goal._id))
  },
})

export const deleteGoal = mutation({
  args: { userId: v.string(), goalId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const goal = await goalForUser(ctx, args.goalId, args.userId)
    if (!goal) throw new Error("GOAL_NOT_FOUND: Goal not found")
    const tasks = await ctx.db
      .query("operatorTasks")
      .withIndex("by_goal_status", (q: any) => q.eq("goalId", args.goalId))
      .take(1)
    if (tasks.length) throw new Error("GOAL_HAS_TASKS: Archive goals that have task history instead of deleting them")
    await ctx.db.delete(goal._id)
    return true
  },
})

export const beginTurn = mutation({
  args: {
    userId: v.string(),
    conversationId: v.string(),
    requestId: v.string(),
    leaseId: v.string(),
    rateLimitKey: v.string(),
    localDate: v.string(),
    userMessage: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND: Conversation not found")
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(args.requestId)) throw new Error("INVALID_REQUEST_ID: Invalid message request")
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(args.leaseId)) throw new Error("INVALID_LEASE_ID: Invalid generation lease")
    if (!/^[a-f0-9]{32,64}$/.test(args.rateLimitKey)) throw new Error("INVALID_RATE_LIMIT_KEY: Invalid request fingerprint")
    if (!isRealDateOnly(args.localDate)) throw new Error("INVALID_DATE: Invalid local date")
    const content = args.userMessage.trim().slice(0, 4000)
    if (content.length < 2) throw new Error("INVALID_MESSAGE: Message is too short")

    const timestamp = now()
    const leaseExpiresAt = new Date(Date.now() + 30_000).toISOString()
    const existing = await ctx.db
      .query("operatorMessages")
      .withIndex("by_conversation_request", (q: any) => q.eq("conversationId", args.conversationId).eq("requestId", args.requestId))
      .unique()
    if (existing) {
      if (existing.userId !== args.userId || existing.role !== "user" || existing.content !== content) {
        throw new Error("REQUEST_CONFLICT: This request ID belongs to another message")
      }
      if (existing.generationStatus === "complete") return { message: clean(existing), acquired: false, status: "complete" }
      if (existing.generationStatus === "pending" && existing.generationLeaseExpiresAt && existing.generationLeaseExpiresAt > timestamp) {
        return { message: clean(existing), acquired: existing.generationLeaseId === args.leaseId, status: "pending" }
      }
      if (await activeGenerationForUser(ctx, args.userId, existing.legacyId)) {
        return { message: clean(existing), acquired: false, status: "failed" }
      }
      await consumeAiQuota(ctx, { userId: args.userId, rateLimitKey: args.rateLimitKey, date: args.localDate })
      await ctx.db.patch(existing._id, {
        generationStatus: "pending",
        generationLeaseId: args.leaseId,
        generationLeaseExpiresAt: leaseExpiresAt,
        generationAttempt: (existing.generationAttempt ?? 1) + 1,
        failureCode: undefined,
      })
      return { message: clean(await ctx.db.get(existing._id)), acquired: true, status: "pending" }
    }

    const busy = await activeGenerationForUser(ctx, args.userId)
    if (busy) {
      const userMessageId = id()
      const userDocumentId = await ctx.db.insert("operatorMessages", {
        legacyId: userMessageId,
        userId: args.userId,
        conversationId: args.conversationId,
        role: "user",
        content,
        quickReplies: [],
        taskDrafts: [],
        requestId: args.requestId,
        usageDate: args.localDate,
        generationStatus: "failed",
        failureCode: "GENERATION_BUSY",
        createdAt: timestamp,
      })
      await ctx.db.patch(conversation._id, { updatedAt: timestamp })
      return { message: clean(await ctx.db.get(userDocumentId)), acquired: false, status: "failed" }
    }

    await consumeAiQuota(ctx, { userId: args.userId, rateLimitKey: args.rateLimitKey, date: args.localDate })

    const previousMessage = await ctx.db
      .query("operatorMessages")
      .withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId))
      .first()
    const userMessageId = id()
    const userDocumentId = await ctx.db.insert("operatorMessages", {
      legacyId: userMessageId,
      userId: args.userId,
      conversationId: args.conversationId,
      role: "user",
      content,
      quickReplies: [],
      taskDrafts: [],
      requestId: args.requestId,
      usageDate: args.localDate,
      generationStatus: "pending",
      generationLeaseId: args.leaseId,
      generationLeaseExpiresAt: leaseExpiresAt,
      generationAttempt: 1,
      createdAt: timestamp,
    })

    await ctx.db.patch(conversation._id, {
      ...(previousMessage ? {} : { title: conversationTitle(content) }),
      updatedAt: timestamp,
    })
    await trackProductEvent(ctx, { userId: args.userId, name: previousMessage ? "evidence_gathered" : "conversation_started", sourceId: userMessageId })
    return { message: clean(await ctx.db.get(userDocumentId)), acquired: true, status: "pending" }
  },
})

export const completeTurn = mutation({
  args: {
    userId: v.string(),
    conversationId: v.string(),
    userMessageId: v.string(),
    leaseId: v.string(),
    assistant: v.object({
      content: v.string(),
      state: conversationState,
      quickReplies: v.array(v.string()),
      taskDrafts: v.array(taskDraft),
      modelName: v.string(),
      promptVersion: v.string(),
      latencyMs: v.number(),
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      estimatedCostUsd: v.optional(v.number()),
      generationOutcome: v.string(),
      finishReason: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND: Conversation not found")
    const userMessage = await ctx.db.query("operatorMessages").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.userMessageId)).unique()
    if (!userMessage || userMessage.userId !== args.userId || userMessage.conversationId !== args.conversationId || userMessage.role !== "user") {
      throw new Error("MESSAGE_NOT_FOUND: User message not found")
    }
    const existingReply = await ctx.db.query("operatorMessages").withIndex("by_reply_to", (q: any) => q.eq("replyToMessageId", args.userMessageId)).unique()
    if (userMessage.generationStatus === "complete" && existingReply) return clean(existingReply)
    if (userMessage.generationLeaseId !== args.leaseId || userMessage.generationStatus !== "pending") {
      throw new Error("GENERATION_SUPERSEDED: This generation lease is no longer active")
    }

    const timestamp = now()
    const assistantMessageId = id()
    const assistantDocumentId = await ctx.db.insert("operatorMessages", {
      legacyId: assistantMessageId,
      userId: args.userId,
      conversationId: args.conversationId,
      role: "assistant",
      content: args.assistant.content.slice(0, 2400),
      state: args.assistant.state,
      quickReplies: args.assistant.quickReplies.slice(0, 3),
      taskDrafts: args.assistant.taskDrafts.slice(0, 3),
      modelName: args.assistant.modelName,
      replyToMessageId: args.userMessageId,
      promptVersion: args.assistant.promptVersion,
      latencyMs: Math.max(0, Math.round(args.assistant.latencyMs)),
      inputTokens: args.assistant.inputTokens,
      outputTokens: args.assistant.outputTokens,
      estimatedCostUsd: args.assistant.estimatedCostUsd,
      generationOutcome: args.assistant.generationOutcome.slice(0, 60),
      finishReason: args.assistant.finishReason,
      createdAt: timestamp,
    })
    await ctx.db.patch(userMessage._id, {
      generationStatus: "complete",
      generationLeaseId: undefined,
      generationLeaseExpiresAt: undefined,
      failureCode: undefined,
    })
    const usageDate = userMessage.usageDate ?? userMessage.createdAt.slice(0, 10)
    const usage = await ctx.db.query("aiDailyUsage").withIndex("by_user_date", (q: any) => q.eq("userId", args.userId).eq("date", usageDate)).unique()
    if (usage) {
      await ctx.db.patch(usage._id, {
        inputTokens: usage.inputTokens + (args.assistant.inputTokens ?? 0),
        outputTokens: usage.outputTokens + (args.assistant.outputTokens ?? 0),
        estimatedCostUsd: (usage.estimatedCostUsd ?? 0) + (args.assistant.estimatedCostUsd ?? 0),
        updatedAt: timestamp,
      })
    }
    await ctx.db.patch(conversation._id, {
      state: args.assistant.state,
      updatedAt: timestamp,
    })
    if (args.assistant.taskDrafts.length) await trackProductEvent(ctx, { userId: args.userId, name: "plan_proposed", sourceId: assistantMessageId, durationMs: args.assistant.latencyMs, estimatedCostUsd: args.assistant.estimatedCostUsd })
    return clean(await ctx.db.get(assistantDocumentId))
  },
})

export const failTurn = mutation({
  args: {
    userId: v.string(),
    conversationId: v.string(),
    userMessageId: v.string(),
    leaseId: v.string(),
    failureCode: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const userMessage = await ctx.db.query("operatorMessages").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.userMessageId)).unique()
    if (!userMessage || userMessage.userId !== args.userId || userMessage.conversationId !== args.conversationId || userMessage.role !== "user") return false
    if (userMessage.generationStatus !== "pending" || userMessage.generationLeaseId !== args.leaseId) return false
    await ctx.db.patch(userMessage._id, {
      generationStatus: "failed",
      generationLeaseId: undefined,
      generationLeaseExpiresAt: undefined,
      failureCode: args.failureCode.replace(/[^A-Z0-9_]/g, "").slice(0, 60) || "GENERATION_FAILED",
    })
    return true
  },
})

export const cancelTurn = mutation({
  args: { userId: v.string(), conversationId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    if (!await conversationForUser(ctx, args.conversationId, args.userId)) return false
    const pending = await ctx.db.query("operatorMessages").withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId)).order("desc").filter((q: any) => q.eq(q.field("generationStatus"), "pending")).first()
    if (!pending || pending.userId !== args.userId) return false
    await ctx.db.patch(pending._id, { generationStatus: "cancelled", generationLeaseId: undefined, generationLeaseExpiresAt: undefined, failureCode: "USER_CANCELLED" })
    return true
  },
})

export const recordProviderOutcome = mutation({
  args: { provider: v.literal("gemini"), success: v.boolean() },
  handler: async (ctx, args) => {
    await requireScope(ctx, "background", "operator:provider")
    const timestamp = now()
    const row = await ctx.db.query("aiProviderCircuit").withIndex("by_key", (q: any) => q.eq("key", args.provider)).unique()
    if (args.success) {
      if (row) await ctx.db.patch(row._id, { consecutiveFailures: 0, openedUntil: undefined, updatedAt: timestamp })
      return { open: false, consecutiveFailures: 0 }
    }
    const consecutiveFailures = (row?.consecutiveFailures ?? 0) + 1
    const openedUntil = consecutiveFailures >= 5 ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : row?.openedUntil
    if (row) await ctx.db.patch(row._id, { consecutiveFailures, openedUntil, updatedAt: timestamp })
    else await ctx.db.insert("aiProviderCircuit", { key: args.provider, consecutiveFailures, openedUntil, updatedAt: timestamp })
    return { open: Boolean(openedUntil && openedUntil > timestamp), consecutiveFailures }
  },
})

export const acceptTasks = mutation({
  args: { userId: v.string(), conversationId: v.string(), messageId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("CONVERSATION_NOT_FOUND: Conversation not found")
    const message = await ctx.db
      .query("operatorMessages")
      .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.messageId))
      .unique()
    if (!message || message.userId !== args.userId || message.conversationId !== args.conversationId || message.role !== "assistant") {
      throw new Error("TASK_PROPOSAL_NOT_FOUND: Task proposal not found")
    }
    if (message.tasksAcceptedAt) return { created: 0, alreadyAccepted: true }

    const timestamp = now()
    let created = 0
    const counts = new Map<string, number>()
    const [user, initialGoals, entitlements] = await Promise.all([userForId(ctx, args.userId), activeGoalsForUser(ctx, args.userId), resolveEntitlements(ctx, args.userId)])
    if (!user) throw new Error("USER_NOT_FOUND: User not found")
    const goalLimit = entitlements.limits.activeGoals
    const goals = [...initialGoals]

    const eligibleDrafts: any[] = []
    for (const draft of message.taskDrafts.slice(0, 3)) {
      if (!isRealDateOnly(draft.scheduledFor)) continue
      let existingCount = counts.get(draft.scheduledFor)
      if (existingCount === undefined) {
        const existing = await ctx.db
          .query("operatorTasks")
          .withIndex("by_user_date", (q: any) => q.eq("userId", args.userId).eq("scheduledFor", draft.scheduledFor))
          .take(4)
        existingCount = existing.filter((task: any) => task.status !== "dismissed").length
      }
      if (existingCount >= 3) continue
      counts.set(draft.scheduledFor, existingCount + 1)
      eligibleDrafts.push(draft)
    }

    const newGoalTitles = [...new Set(eligibleDrafts
      .map((draft: any) => normalizeGoalTitle(draft.goalTitle || "Personal growth"))
      .filter((title: string) => !goals.some((item: any) => normalizedTitleKey(item.title) === normalizedTitleKey(title))))]
    if (goals.length + newGoalTitles.length > goalLimit) {
      throw new Error(goalLimit === 3
        ? "GOAL_LIMIT_REACHED: This plan needs another goal, but free accounts can have only 3 active goals. Choose an existing goal or upgrade to Pro."
        : "GOAL_LIMIT_REACHED: Active goal limit reached.")
    }

    counts.clear()
    for (const draft of eligibleDrafts) {
      const goalTitle = normalizeGoalTitle(draft.goalTitle || "Personal growth")
      let goal = goals.find((item: any) => normalizedTitleKey(item.title) === normalizedTitleKey(goalTitle))
      if (!goal) {
        const goalDocumentId = await ctx.db.insert("operatorGoals", {
          legacyId: id(), userId: args.userId, title: goalTitle, description: "Created from an approved GrowthAI plan.",
          status: "active", createdAt: timestamp, updatedAt: timestamp,
        })
        goal = await ctx.db.get(goalDocumentId)
        goals.push(goal)
      }
      let existingCount = counts.get(draft.scheduledFor)
      if (existingCount === undefined) {
        const existing = await ctx.db
          .query("operatorTasks")
          .withIndex("by_user_date", (q: any) => q.eq("userId", args.userId).eq("scheduledFor", draft.scheduledFor))
          .take(4)
        existingCount = existing.filter((task: any) => task.status !== "dismissed").length
      }
      const taskLegacyId = id()
      await ctx.db.insert("operatorTasks", {
        legacyId: taskLegacyId,
        userId: args.userId,
        conversationId: args.conversationId,
        sourceMessageId: args.messageId,
        goalId: goal.legacyId,
        title: draft.title,
        note: draft.note,
        status: "todo",
        estimatedMinutes: Math.min(Math.max(Math.round(draft.estimatedMinutes), 5), 240),
        completionCondition: draft.completionCondition,
        scheduledFor: draft.scheduledFor,
        position: existingCount,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      await ctx.db.insert("operatorTaskEvents", { userId: args.userId, taskId: taskLegacyId, event: "accepted", toStatus: "todo", toDate: draft.scheduledFor, createdAt: timestamp })
      counts.set(draft.scheduledFor, existingCount + 1)
      created += 1
    }

    await ctx.db.patch(message._id, { tasksAcceptedAt: timestamp })
    if (created) await trackProductEvent(ctx, { userId: args.userId, name: "task_accepted", sourceId: args.messageId })
    return { created, alreadyAccepted: false }
  },
})

export const updateTaskProposal = mutation({
  args: { userId: v.string(), conversationId: v.string(), messageId: v.string(), index: v.number(), title: v.string(), note: v.string(), estimatedMinutes: v.number(), completionCondition: v.string(), scheduledFor: v.string(), goalTitle: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const message = await ctx.db.query("operatorMessages").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.messageId)).unique()
    const index = Math.floor(args.index)
    if (!message || message.userId !== args.userId || message.conversationId !== args.conversationId || message.role !== "assistant" || message.tasksAcceptedAt || index < 0 || index >= message.taskDrafts.length) throw new Error("TASK_PROPOSAL_NOT_FOUND")
    const title = args.title.trim().slice(0, 120), completionCondition = args.completionCondition.trim().slice(0, 220)
    if (title.length < 3 || completionCondition.length < 3 || !isRealDateOnly(args.scheduledFor)) throw new Error("TASK_PROPOSAL_INVALID")
    const taskDrafts = [...message.taskDrafts]
    taskDrafts[index] = { title, note: args.note.trim().slice(0, 300), estimatedMinutes: Math.min(240, Math.max(5, Math.round(args.estimatedMinutes))), completionCondition, scheduledFor: args.scheduledFor, goalTitle: normalizeGoalTitle(args.goalTitle || "Personal growth") }
    await ctx.db.patch(message._id, { taskDrafts })
    return true
  },
})

export const setTaskStatus = mutation({
  args: {
    userId: v.string(),
    taskId: v.string(),
    status: v.union(v.literal("todo"), v.literal("done"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const task = await ctx.db
      .query("operatorTasks")
      .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.taskId))
      .unique()
    if (!task || task.userId !== args.userId) return false
    const timestamp = now()
    await ctx.db.patch(task._id, {
      status: args.status,
      updatedAt: timestamp,
      completedAt: args.status === "done" ? (task.completedAt ?? timestamp) : undefined,
    })
    const event = args.status === "done" ? "completed" : args.status === "dismissed" ? "dismissed" : "reopened"
    await ctx.db.insert("operatorTaskEvents", { userId: args.userId, taskId: args.taskId, event, fromStatus: task.status, toStatus: args.status, createdAt: timestamp })
    if (args.status === "done") await trackProductEvent(ctx, { userId: args.userId, name: "task_completed", sourceId: args.taskId })
    return true
  },
})

export const updateTask = mutation({
  args: {
    userId: v.string(), taskId: v.string(), goalId: v.string(), title: v.string(), note: v.string(),
    estimatedMinutes: v.number(), completionCondition: v.string(), scheduledFor: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const task = await ctx.db.query("operatorTasks").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.taskId)).unique()
    if (!task || task.userId !== args.userId) throw new Error("TASK_NOT_FOUND: Task not found")
    const goal = await goalForUser(ctx, args.goalId, args.userId)
    if (!goal || goal.status !== "active") throw new Error("GOAL_NOT_ACTIVE: Choose an active goal")
    const title = args.title.trim().slice(0, 120)
    const completionCondition = args.completionCondition.trim().slice(0, 220)
    if (title.length < 3) throw new Error("INVALID_TASK_TITLE: Task title must be at least 3 characters")
    if (completionCondition.length < 3) throw new Error("INVALID_COMPLETION_CONDITION: Add a clear completion condition")
    if (!isRealDateOnly(args.scheduledFor)) throw new Error("INVALID_DATE: Choose a valid date")
    const tasksOnDate = await ctx.db.query("operatorTasks").withIndex("by_user_date", (q: any) => q.eq("userId", args.userId).eq("scheduledFor", args.scheduledFor)).take(4)
    const occupied = tasksOnDate.filter((item: any) => item.legacyId !== args.taskId && item.status !== "dismissed").length
    if (occupied >= 3) throw new Error("DAILY_TASK_LIMIT_REACHED: That day already has 3 tasks. Choose another day.")
    const timestamp = now()
    await ctx.db.patch(task._id, {
      goalId: args.goalId,
      title,
      note: args.note.trim().slice(0, 300),
      estimatedMinutes: Math.min(Math.max(Math.round(args.estimatedMinutes), 5), 240),
      completionCondition,
      scheduledFor: args.scheduledFor,
      updatedAt: timestamp,
    })
    const movedLater = args.scheduledFor > task.scheduledFor
    await ctx.db.insert("operatorTaskEvents", { userId: args.userId, taskId: args.taskId, event: movedLater ? "deferred" : args.scheduledFor !== task.scheduledFor ? "rescheduled" : "edited", fromStatus: task.status, toStatus: task.status, fromDate: task.scheduledFor, toDate: args.scheduledFor, createdAt: timestamp })
    if (movedLater) await trackProductEvent(ctx, { userId: args.userId, name: "task_deferred", sourceId: args.taskId })
    return clean(await ctx.db.get(task._id))
  },
})
