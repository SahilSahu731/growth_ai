/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"
import { requireServer } from "./lib/serverAuth"
import { conversationTitle } from "./lib/conversationTitle"

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

function goalLimitForPlan(planTier: string | undefined) {
  return planTier === "free" || !planTier ? 3 : 25
}

async function goalForUser(ctx: any, goalId: string, userId: string) {
  const goal = await ctx.db.query("operatorGoals").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", goalId)).unique()
  return goal?.userId === userId ? goal : null
}

async function activeGoalsForUser(ctx: any, userId: string) {
  return ctx.db.query("operatorGoals").withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", "active")).collect()
}

async function insertConversation(ctx: any, userId: string) {
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
    await requireServer(ctx)
    return insertConversation(ctx, userId)
  },
})

export const ensureConversation = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireServer(ctx)
    const existing = await ctx.db
      .query("operatorConversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
      .order("desc")
      .first()
    if (existing) return clean(existing)

    return insertConversation(ctx, userId)
  },
})

export const getWorkspace = query({
  args: { userId: v.string(), conversationId: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) return null

    const [messages, openTasks, goals, user] = await Promise.all([
      ctx.db
        .query("operatorMessages")
        .withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId))
        .order("asc")
        .take(80),
      ctx.db
        .query("operatorTasks")
        .withIndex("by_user_status", (q: any) => q.eq("userId", args.userId).eq("status", "todo"))
        .collect(),
      ctx.db.query("operatorGoals").filter((q: any) => q.eq(q.field("userId"), args.userId)).collect(),
      userForId(ctx, args.userId),
    ])

    return {
      conversation: clean(conversation),
      messages: messages.map(clean),
      tasks: openTasks.sort((a: any, b: any) => {
        const dateOrder = a.scheduledFor.localeCompare(b.scheduledFor)
        return dateOrder || a.position - b.position
      }).map(clean),
      goals: goals.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean),
      goalLimit: goalLimitForPlan(user?.planTier),
      timezone: user?.timezone ?? "UTC",
    }
  },
})

export const renameConversation = mutation({
  args: { userId: v.string(), conversationId: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("Conversation not found")
    const title = args.title.replace(/\s+/g, " ").trim().slice(0, 64)
    if (title.length < 2) throw new Error("Use at least 2 characters")
    await ctx.db.patch(conversation._id, { title, updatedAt: now() })
    return { id: conversation.legacyId, title }
  },
})

export const setConversationPinned = mutation({
  args: { userId: v.string(), conversationId: v.string(), pinned: v.boolean() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("Conversation not found")
    const timestamp = now()
    await ctx.db.patch(conversation._id, { pinnedAt: args.pinned ? timestamp : undefined, updatedAt: timestamp })
    return true
  },
})

export const deleteConversation = mutation({
  args: { userId: v.string(), conversationId: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) return false
    const messages = await ctx.db.query("operatorMessages").withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId)).collect()
    for (const message of messages) await ctx.db.delete(message._id)
    await ctx.db.delete(conversation._id)
    return true
  },
})

export const createGoal = mutation({
  args: { userId: v.string(), title: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const title = args.title.trim().slice(0, 80)
    const description = args.description.trim().slice(0, 500)
    if (title.length < 3) throw new Error("Goal title must be at least 3 characters")
    const [user, activeGoals] = await Promise.all([userForId(ctx, args.userId), activeGoalsForUser(ctx, args.userId)])
    if (!user) throw new Error("User not found")
    const duplicate = activeGoals.find((goal: any) => goal.title.toLowerCase() === title.toLowerCase())
    if (duplicate) return { goal: clean(duplicate), limit: goalLimitForPlan(user.planTier), duplicate: true }
    const limit = goalLimitForPlan(user.planTier)
    if (activeGoals.length >= limit) throw new Error(limit === 3 ? "Free accounts can have up to 3 active goals. Upgrade to Pro to add more." : "Active goal limit reached.")
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
    await requireServer(ctx)
    const goal = await goalForUser(ctx, args.goalId, args.userId)
    if (!goal) throw new Error("Goal not found")
    const title = args.title.trim().slice(0, 80)
    if (title.length < 3) throw new Error("Goal title must be at least 3 characters")
    const timestamp = now()
    await ctx.db.patch(goal._id, {
      title,
      description: args.description.trim().slice(0, 500),
      status: args.status,
      updatedAt: timestamp,
      ...(args.status === "completed" ? { completedAt: timestamp } : {}),
    })
    if (args.status !== "active") {
      const openTasks = await ctx.db.query("operatorTasks").withIndex("by_goal_status", (q: any) => q.eq("goalId", args.goalId).eq("status", "todo")).collect()
      await Promise.all(openTasks.map((task: any) => ctx.db.patch(task._id, { status: "dismissed", updatedAt: timestamp })))
    }
    return clean(await ctx.db.get(goal._id))
  },
})

export const appendExchange = mutation({
  args: {
    userId: v.string(),
    conversationId: v.string(),
    userMessage: v.string(),
    assistant: v.object({
      content: v.string(),
      state: conversationState,
      quickReplies: v.array(v.string()),
      taskDrafts: v.array(taskDraft),
      modelName: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("Conversation not found")

    const timestamp = now()
    await ctx.db.insert("operatorMessages", {
      legacyId: id(),
      userId: args.userId,
      conversationId: args.conversationId,
      role: "user",
      content: args.userMessage.slice(0, 4000),
      quickReplies: [],
      taskDrafts: [],
      createdAt: timestamp,
    })
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
      createdAt: timestamp,
    })

    const messageCount = await ctx.db
      .query("operatorMessages")
      .withIndex("by_conversation_time", (q: any) => q.eq("conversationId", args.conversationId))
      .take(3)
    await ctx.db.patch(conversation._id, {
      state: args.assistant.state,
      ...(messageCount.length <= 2 ? { title: conversationTitle(args.userMessage) } : {}),
      updatedAt: timestamp,
    })
    return clean(await ctx.db.get(assistantDocumentId))
  },
})

export const acceptTasks = mutation({
  args: { userId: v.string(), conversationId: v.string(), messageId: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const conversation = await conversationForUser(ctx, args.conversationId, args.userId)
    if (!conversation) throw new Error("Conversation not found")
    const message = await ctx.db
      .query("operatorMessages")
      .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.messageId))
      .unique()
    if (!message || message.userId !== args.userId || message.conversationId !== args.conversationId || message.role !== "assistant") {
      throw new Error("Task proposal not found")
    }
    if (message.tasksAcceptedAt) return { created: 0, alreadyAccepted: true }

    const timestamp = now()
    let created = 0
    const counts = new Map<string, number>()
    const [user, initialGoals] = await Promise.all([userForId(ctx, args.userId), activeGoalsForUser(ctx, args.userId)])
    if (!user) throw new Error("User not found")
    const goalLimit = goalLimitForPlan(user.planTier)
    const goals = [...initialGoals]

    for (const draft of message.taskDrafts.slice(0, 3)) {
      const goalTitle = draft.goalTitle?.trim().slice(0, 80) || "Personal growth"
      let goal = goals.find((item: any) => item.title.toLowerCase() === goalTitle.toLowerCase())
      if (!goal) {
        if (goals.length >= goalLimit) throw new Error(goalLimit === 3 ? "This plan needs another goal, but free accounts can have only 3 active goals. Choose an existing goal or upgrade to Pro." : "Active goal limit reached.")
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
          .collect()
        existingCount = existing.filter((task: any) => task.status !== "dismissed").length
      }
      if (existingCount >= 3) continue

      await ctx.db.insert("operatorTasks", {
        legacyId: id(),
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
      counts.set(draft.scheduledFor, existingCount + 1)
      created += 1
    }

    await ctx.db.patch(message._id, { tasksAcceptedAt: timestamp })
    return { created, alreadyAccepted: false }
  },
})

export const setTaskStatus = mutation({
  args: {
    userId: v.string(),
    taskId: v.string(),
    status: v.union(v.literal("todo"), v.literal("done"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const task = await ctx.db
      .query("operatorTasks")
      .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.taskId))
      .unique()
    if (!task || task.userId !== args.userId) return false
    const timestamp = now()
    await ctx.db.patch(task._id, {
      status: args.status,
      updatedAt: timestamp,
      ...(args.status === "done" ? { completedAt: timestamp } : {}),
    })
    return true
  },
})

export const updateTask = mutation({
  args: {
    userId: v.string(), taskId: v.string(), goalId: v.string(), title: v.string(), note: v.string(),
    estimatedMinutes: v.number(), completionCondition: v.string(), scheduledFor: v.string(),
  },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const task = await ctx.db.query("operatorTasks").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.taskId)).unique()
    if (!task || task.userId !== args.userId) throw new Error("Task not found")
    const goal = await goalForUser(ctx, args.goalId, args.userId)
    if (!goal || goal.status !== "active") throw new Error("Choose an active goal")
    const title = args.title.trim().slice(0, 120)
    const completionCondition = args.completionCondition.trim().slice(0, 220)
    if (title.length < 3) throw new Error("Task title must be at least 3 characters")
    if (completionCondition.length < 3) throw new Error("Add a clear completion condition")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.scheduledFor)) throw new Error("Choose a valid date")
    const tasksOnDate = await ctx.db.query("operatorTasks").withIndex("by_user_date", (q: any) => q.eq("userId", args.userId).eq("scheduledFor", args.scheduledFor)).collect()
    const occupied = tasksOnDate.filter((item: any) => item.legacyId !== args.taskId && item.status !== "dismissed").length
    if (occupied >= 3) throw new Error("That day already has 3 tasks. Choose another day.")
    await ctx.db.patch(task._id, {
      goalId: args.goalId,
      title,
      note: args.note.trim().slice(0, 300),
      estimatedMinutes: Math.min(Math.max(Math.round(args.estimatedMinutes), 5), 240),
      completionCondition,
      scheduledFor: args.scheduledFor,
      updatedAt: now(),
    })
    return clean(await ctx.db.get(task._id))
  },
})
