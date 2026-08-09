/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"
import { requireMember } from "./lib/serverAuth"

const itemType = v.union(v.literal("evidence"), v.literal("obstacle"), v.literal("experiment"), v.literal("outcome"))
function clean(document: any) { const value = { ...document }; delete value._id; delete value._creationTime; return { id: value.legacyId, ...value } }

export const getMap = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "operator:member")
    const [items, goals, tasks] = await Promise.all([
      ctx.db.query("growthMapItems").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect(),
      ctx.db.query("operatorGoals").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect(),
      ctx.db.query("operatorTasks").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect(),
    ])
    return { items: items.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean), goals: goals.map(clean), outcomes: { completed: tasks.filter((item: any) => item.status === "done").length, dismissed: tasks.filter((item: any) => item.status === "dismissed").length, open: tasks.filter((item: any) => item.status === "todo").length } }
  },
})

export const upsertItem = mutation({
  args: { userId: v.string(), itemId: v.optional(v.string()), type: itemType, title: v.string(), description: v.string(), confidence: v.number(), sourceTaskIds: v.array(v.string()), sourceConversationIds: v.array(v.string()), userConfirmed: v.boolean() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const title = args.title.replace(/\s+/g, " ").trim().slice(0, 100)
    const description = args.description.replace(/\s+/g, " ").trim().slice(0, 500)
    if (title.length < 3 || description.length < 3) throw new Error("MAP_ITEM_INVALID")
    const timestamp = new Date().toISOString()
    const suppliedTaskIds = [...new Set(args.sourceTaskIds)].slice(0, 20)
    const suppliedConversationIds = [...new Set(args.sourceConversationIds)].slice(0, 20)
    const fields = { type: args.type, title, description, confidence: Math.min(1, Math.max(0, args.confidence)), sourceTaskIds: suppliedTaskIds, sourceConversationIds: suppliedConversationIds, userConfirmed: args.userConfirmed, updatedAt: timestamp }
    if (args.itemId) {
      const existing = await ctx.db.query("growthMapItems").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.itemId)).unique()
      if (!existing || existing.userId !== args.userId) throw new Error("MAP_ITEM_NOT_FOUND")
      await ctx.db.patch(existing._id, {
        ...fields,
        sourceTaskIds: suppliedTaskIds.length ? suppliedTaskIds : existing.sourceTaskIds,
        sourceConversationIds: suppliedConversationIds.length ? suppliedConversationIds : existing.sourceConversationIds,
      })
      return clean(await ctx.db.get(existing._id))
    }
    const legacyId = crypto.randomUUID()
    const id = await ctx.db.insert("growthMapItems", { legacyId, userId: args.userId, ...fields, status: "active", createdAt: timestamp })
    return clean(await ctx.db.get(id))
  },
})

export const setItemStatus = mutation({
  args: { userId: v.string(), itemId: v.string(), status: v.union(v.literal("active"), v.literal("dismissed")) },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const item = await ctx.db.query("growthMapItems").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.itemId)).unique()
    if (!item || item.userId !== args.userId) return false
    await ctx.db.patch(item._id, { status: args.status, updatedAt: new Date().toISOString() })
    return true
  },
})

export const mergeItems = mutation({
  args: { userId: v.string(), sourceId: v.string(), targetId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    if (args.sourceId === args.targetId) throw new Error("MAP_MERGE_INVALID")
    const [source, target] = await Promise.all([
      ctx.db.query("growthMapItems").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.sourceId)).unique(),
      ctx.db.query("growthMapItems").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.targetId)).unique(),
    ])
    if (!source || !target || source.userId !== args.userId || target.userId !== args.userId) throw new Error("MAP_ITEM_NOT_FOUND")
    const timestamp = new Date().toISOString()
    await ctx.db.patch(target._id, { sourceTaskIds: [...new Set([...target.sourceTaskIds, ...source.sourceTaskIds])].slice(0, 20), sourceConversationIds: [...new Set([...target.sourceConversationIds, ...source.sourceConversationIds])].slice(0, 20), updatedAt: timestamp })
    await ctx.db.patch(source._id, { status: "merged", mergedInto: target.legacyId, updatedAt: timestamp })
    return true
  },
})

export const deleteItem = mutation({
  args: { userId: v.string(), itemId: v.string() },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const item = await ctx.db.query("growthMapItems").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.itemId)).unique()
    if (!item || item.userId !== args.userId) return false
    await ctx.db.delete(item._id)
    return true
  },
})
