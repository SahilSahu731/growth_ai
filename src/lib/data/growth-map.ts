import "server-only"
import { convexMutation, convexQuery } from "@/lib/convex-server"
import type { OperatorGoal } from "@/lib/operator/types"

export type GrowthMapItem = { id: string; userId: string; type: "evidence" | "obstacle" | "experiment" | "outcome"; title: string; description: string; confidence: number; sourceTaskIds: string[]; sourceConversationIds: string[]; userConfirmed: boolean; status: "active" | "dismissed" | "merged"; mergedInto?: string; createdAt: string; updatedAt: string }
export type GrowthRoadmap = { id: string; userId: string; title: string; topic: string; outcome: string; source: "manual" | "ai"; status: "active" | "archived"; createdAt: string; updatedAt: string }
export type GrowthRoadmapNode = { id: string; userId: string; mapId: string; title: string; description: string; stage: number; position: number; type: "foundation" | "core" | "practice" | "project"; status: "locked" | "available" | "in_progress" | "completed"; estimatedHours: number; parentIds: string[]; createdAt: string; updatedAt: string; completedAt?: string }
export type GrowthRoadmapNodeInput = { key: string; title: string; description: string; stage: number; type: GrowthRoadmapNode["type"]; estimatedHours: number; parentKeys: string[] }
const member = (userId: string) => ({ role: "member" as const, subject: `member:${userId}`, scope: "operator:member" })
export function getGrowthMap(userId: string): Promise<{ items: GrowthMapItem[]; goals: OperatorGoal[]; outcomes: { completed: number; dismissed: number; open: number } }> { return convexQuery("growthMap:getMap", { userId }, member(userId)) }
export function getGrowthRoadmaps(userId: string): Promise<{ maps: GrowthRoadmap[]; nodes: GrowthRoadmapNode[] }> { return convexQuery("growthMap:getRoadmaps", { userId }, member(userId)) }
export function createGrowthRoadmap(input: { userId: string; title: string; topic: string; outcome: string; source: GrowthRoadmap["source"]; nodes: GrowthRoadmapNodeInput[] }): Promise<GrowthRoadmap> { return convexMutation("growthMap:createRoadmap", input, member(input.userId)) }
export function setGrowthRoadmapNodeStatus(input: { userId: string; nodeId: string; status: "available" | "in_progress" | "completed" }): Promise<boolean> { return convexMutation("growthMap:setRoadmapNodeStatus", input, member(input.userId)) }
export function setGrowthRoadmapStatus(input: { userId: string; mapId: string; status: "active" | "archived" }): Promise<boolean> { return convexMutation("growthMap:setRoadmapStatus", input, member(input.userId)) }
export function upsertGrowthMapItem(input: { userId: string; itemId?: string; type: GrowthMapItem["type"]; title: string; description: string; confidence: number; sourceTaskIds: string[]; sourceConversationIds: string[]; userConfirmed: boolean }): Promise<GrowthMapItem> { return convexMutation("growthMap:upsertItem", input, member(input.userId)) }
export function setGrowthMapItemStatus(input: { userId: string; itemId: string; status: "active" | "dismissed" }): Promise<boolean> { return convexMutation("growthMap:setItemStatus", input, member(input.userId)) }
export function mergeGrowthMapItems(input: { userId: string; sourceId: string; targetId: string }): Promise<boolean> { return convexMutation("growthMap:mergeItems", input, member(input.userId)) }
export function deleteGrowthMapItem(input: { userId: string; itemId: string }): Promise<boolean> { return convexMutation("growthMap:deleteItem", input, member(input.userId)) }
