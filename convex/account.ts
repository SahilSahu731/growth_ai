/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"
import { requireServer } from "./lib/serverAuth"

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
    await requireServer(ctx)
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
    await requireServer(ctx)
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
    return { coachTone: args.coachTone, timezone, emailNotifications: args.emailNotifications, updatedAt }
  },
})

export const exportUserData = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireServer(ctx)
    const user = await userById(ctx, userId)
    if (!user) return null
    const [conversations, messages, goals, tasks, subscriptions] = await Promise.all([
      ctx.db.query("operatorConversations").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("operatorMessages").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("operatorGoals").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("operatorTasks").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
    ])
    return {
      exportedAt: new Date().toISOString(),
      account: clean(user),
      conversations: conversations.map(clean),
      messages: messages.map(clean),
      goals: goals.map(clean),
      tasks: tasks.map(clean),
      subscriptions: subscriptions.map(clean),
    }
  },
})

export const deleteUserAccount = mutation({
  args: { userId: v.string(), confirmationEmail: v.string() },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const user = await userById(ctx, args.userId)
    if (!user || user.email.toLowerCase() !== args.confirmationEmail.trim().toLowerCase()) return false
    for (const table of ["operatorMessages", "operatorTasks", "operatorGoals", "operatorConversations", "subscriptions"] as const) {
      const rows = await ctx.db.query(table).filter((q: any) => q.eq(q.field("userId"), args.userId)).collect()
      for (const row of rows) await ctx.db.delete(row._id)
    }
    await ctx.db.delete(user._id)
    return true
  },
})
