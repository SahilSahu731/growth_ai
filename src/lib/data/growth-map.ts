import "server-only"
import { convexMutation, convexQuery } from "@/lib/convex-server"
import type { OperatorGoal } from "@/lib/operator/types"

export type GrowthMapItem = { id: string; userId: string; type: "evidence" | "obstacle" | "experiment" | "outcome"; title: string; description: string; confidence: number; sourceTaskIds: string[]; sourceConversationIds: string[]; userConfirmed: boolean; status: "active" | "dismissed" | "merged"; mergedInto?: string; createdAt: string; updatedAt: string }
const member = (userId: string) => ({ role: "member" as const, subject: `member:${userId}`, scope: "operator:member" })
export function getGrowthMap(userId: string): Promise<{ items: GrowthMapItem[]; goals: OperatorGoal[]; outcomes: { completed: number; dismissed: number; open: number } }> { return convexQuery("growthMap:getMap", { userId }, member(userId)) }
export function upsertGrowthMapItem(input: { userId: string; itemId?: string; type: GrowthMapItem["type"]; title: string; description: string; confidence: number; sourceTaskIds: string[]; sourceConversationIds: string[]; userConfirmed: boolean }): Promise<GrowthMapItem> { return convexMutation("growthMap:upsertItem", input, member(input.userId)) }
export function setGrowthMapItemStatus(input: { userId: string; itemId: string; status: "active" | "dismissed" }): Promise<boolean> { return convexMutation("growthMap:setItemStatus", input, member(input.userId)) }
export function mergeGrowthMapItems(input: { userId: string; sourceId: string; targetId: string }): Promise<boolean> { return convexMutation("growthMap:mergeItems", input, member(input.userId)) }
export function deleteGrowthMapItem(input: { userId: string; itemId: string }): Promise<boolean> { return convexMutation("growthMap:deleteItem", input, member(input.userId)) }
