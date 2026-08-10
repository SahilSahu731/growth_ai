/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"
import { requireMember } from "./lib/serverAuth"

const itemType = v.union(v.literal("evidence"), v.literal("obstacle"), v.literal("experiment"), v.literal("outcome"))
const nodeType = v.union(v.literal("foundation"), v.literal("core"), v.literal("practice"), v.literal("project"))
const nodeStatus = v.union(v.literal("locked"), v.literal("available"), v.literal("in_progress"), v.literal("completed"))
function clean(document: any) { const value = { ...document }; delete value._id; delete value._creationTime; return { id: value.legacyId, ...value } }

export const getMap = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "operator:member")
    const [items, goals, tasks] = await Promise.all([
      ctx.db.query("growthMapItems").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).take(500),
      ctx.db.query("operatorGoals").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).take(100),
      ctx.db.query("operatorTasks").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).take(1000),
    ])
    return { items: items.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map(clean), goals: goals.map(clean), outcomes: { completed: tasks.filter((item: any) => item.status === "done").length, dismissed: tasks.filter((item: any) => item.status === "dismissed").length, open: tasks.filter((item: any) => item.status === "todo").length } }
  },
})

export const getRoadmaps = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    await requireMember(ctx, userId, "operator:member")
    const [maps, nodes] = await Promise.all([
      ctx.db.query("growthMaps").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).order("desc").take(50),
      ctx.db.query("growthMapNodes").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).take(2_000),
    ])
    return {
      maps: maps.map(clean),
      nodes: nodes.sort((a: any, b: any) => a.stage - b.stage || a.position - b.position).map(clean),
    }
  },
})

export const createRoadmap = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    topic: v.string(),
    outcome: v.string(),
    source: v.union(v.literal("manual"), v.literal("ai")),
    nodes: v.array(v.object({
      key: v.string(),
      title: v.string(),
      description: v.string(),
      stage: v.number(),
      type: nodeType,
      estimatedHours: v.number(),
      parentKeys: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const title = args.title.replace(/\s+/g, " ").trim().slice(0, 80)
    const topic = args.topic.replace(/\s+/g, " ").trim().slice(0, 80)
    const outcome = args.outcome.replace(/\s+/g, " ").trim().slice(0, 300)
    if (title.length < 3 || topic.length < 2 || outcome.length < 5) throw new Error("ROADMAP_INVALID: Add a clear title, topic, and target outcome")
    if (args.nodes.length < 1 || args.nodes.length > 60) throw new Error("ROADMAP_NODES_INVALID: A map needs between 1 and 60 milestones")
    const timestamp = new Date().toISOString()
    const mapLegacyId = crypto.randomUUID()
    const existingMaps = await ctx.db.query("growthMaps").withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId)).take(51)
    if (existingMaps.length >= 50) throw new Error("ROADMAP_LIMIT_REACHED: Archive or remove a map before creating another")
    const keys = new Set<string>()
    const prepared = args.nodes.map((node, position) => {
      const key = node.key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || `node-${position}`
      if (keys.has(key)) throw new Error("ROADMAP_NODE_DUPLICATE: Milestone identifiers must be unique")
      keys.add(key)
      const nodeTitle = node.title.replace(/\s+/g, " ").trim().slice(0, 100)
      const description = node.description.replace(/\s+/g, " ").trim().slice(0, 400)
      if (nodeTitle.length < 2 || description.length < 3) throw new Error("ROADMAP_NODE_INVALID: Every milestone needs a title and useful description")
      return { ...node, key, title: nodeTitle, description, stage: Math.min(Math.max(Math.round(node.stage), 1), 12), position, estimatedHours: Math.min(Math.max(Math.round(node.estimatedHours), 1), 500) }
    })
    const preparedByKey = new Map(prepared.map((node) => [node.key, node]))
    for (const node of prepared) {
      if (node.parentKeys.some((parent) => !keys.has(parent))) throw new Error("ROADMAP_DEPENDENCY_INVALID: A milestone references a missing dependency")
      if (node.parentKeys.some((parent) => preparedByKey.get(parent)!.stage >= node.stage)) throw new Error("ROADMAP_DEPENDENCY_ORDER_INVALID: Prerequisites must be in an earlier stage")
    }
    const mapId = await ctx.db.insert("growthMaps", { legacyId: mapLegacyId, userId: args.userId, title, topic, outcome, source: args.source, status: "active", createdAt: timestamp, updatedAt: timestamp })
    const legacyIds = new Map(prepared.map((node) => [node.key, crypto.randomUUID()]))
    for (const node of prepared) {
      const parentIds = node.parentKeys.map((key) => legacyIds.get(key)!).filter(Boolean)
      await ctx.db.insert("growthMapNodes", {
        legacyId: legacyIds.get(node.key)!, userId: args.userId, mapId: mapLegacyId,
        title: node.title, description: node.description, stage: node.stage, position: node.position,
        type: node.type, status: parentIds.length ? "locked" : "available", estimatedHours: node.estimatedHours,
        parentIds, createdAt: timestamp, updatedAt: timestamp,
      })
    }
    return clean(await ctx.db.get(mapId))
  },
})

export const setRoadmapNodeStatus = mutation({
  args: { userId: v.string(), nodeId: v.string(), status: nodeStatus },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const node = await ctx.db.query("growthMapNodes").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.nodeId)).unique()
    if (!node || node.userId !== args.userId) throw new Error("ROADMAP_NODE_NOT_FOUND: Milestone not found")
    if (args.status === "locked") throw new Error("ROADMAP_STATUS_INVALID: Locked status is controlled by dependencies")
    if (args.status !== "completed" && node.parentIds.length) {
      const parents = await Promise.all(node.parentIds.map((parentId: string) => ctx.db.query("growthMapNodes").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", parentId)).unique()))
      if (parents.some((parent: any) => !parent || parent.status !== "completed")) throw new Error("ROADMAP_NODE_LOCKED: Complete the prerequisites first")
    }
    const timestamp = new Date().toISOString()
    await ctx.db.patch(node._id, { status: args.status, updatedAt: timestamp, completedAt: args.status === "completed" ? timestamp : undefined })
    const allNodes = await ctx.db.query("growthMapNodes").withIndex("by_map_position", (q: any) => q.eq("mapId", node.mapId)).take(100)
    if (args.status === "completed") {
      for (const candidate of allNodes.filter((item: any) => item.status === "locked" && item.parentIds.includes(node.legacyId))) {
        const parents = await Promise.all(candidate.parentIds.map((parentId: string) => ctx.db.query("growthMapNodes").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", parentId)).unique()))
        if (parents.every((parent: any) => parent?.status === "completed" || parent?.legacyId === node.legacyId)) await ctx.db.patch(candidate._id, { status: "available", updatedAt: timestamp })
      }
    } else if (node.status === "completed") {
      const children = allNodes.filter((item: any) => item.parentIds.includes(node.legacyId))
      if (children.some((child: any) => child.status === "in_progress" || child.status === "completed")) throw new Error("ROADMAP_DEPENDENT_ACTIVE: Reset dependent milestones first")
      for (const child of children.filter((item: any) => item.status === "available")) await ctx.db.patch(child._id, { status: "locked", updatedAt: timestamp })
    }
    const map = await ctx.db.query("growthMaps").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", node.mapId)).unique()
    if (map) await ctx.db.patch(map._id, { updatedAt: timestamp })
    return true
  },
})

export const setRoadmapStatus = mutation({
  args: { userId: v.string(), mapId: v.string(), status: v.union(v.literal("active"), v.literal("archived")) },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId, "operator:member")
    const map = await ctx.db.query("growthMaps").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.mapId)).unique()
    if (!map || map.userId !== args.userId) return false
    await ctx.db.patch(map._id, { status: args.status, updatedAt: new Date().toISOString() })
    return true
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
