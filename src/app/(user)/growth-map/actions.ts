"use server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { createGrowthRoadmap, deleteGrowthMapItem, mergeGrowthMapItems, setGrowthMapItemStatus, setGrowthRoadmapNodeStatus, setGrowthRoadmapStatus, upsertGrowthMapItem, type GrowthRoadmapNodeInput } from "@/lib/data/growth-map"
import { generateGrowthRoadmap } from "@/lib/growth-map-generator"

function value(data: FormData, key: string) { const item = data.get(key); return typeof item === "string" ? item.trim() : "" }
export type RoadmapActionState = { error?: string; success?: string; updatedAt?: number }

function safeError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : ""
  return message.match(/^[A-Z][A-Z0-9_]+:\s*(.+)$/)?.[1] || fallback
}

export async function createRoadmapAction(_state: RoadmapActionState, data: FormData): Promise<RoadmapActionState> {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return { error: "Your session expired." }
  const title = value(data, "title"), topic = value(data, "topic"), outcome = value(data, "outcome")
  const milestones = value(data, "milestones").split("\n").map((item) => item.trim()).filter(Boolean).slice(0, 12)
  if (title.length < 3 || topic.length < 2 || outcome.length < 5) return { error: "Add a clear title, topic, and target outcome." }
  if (!milestones.length) return { error: "Add at least one milestone." }
  const nodes: GrowthRoadmapNodeInput[] = milestones.map((milestone, index) => ({ key: `manual-${index + 1}`, title: milestone.slice(0, 100), description: `Complete and demonstrate: ${milestone.slice(0, 300)}`, stage: index + 1, type: index === 0 ? "foundation" : index === milestones.length - 1 ? "project" : "core", estimatedHours: 10, parentKeys: index ? [`manual-${index}`] : [] }))
  try { await createGrowthRoadmap({ userId: session.user.id, title, topic, outcome, source: "manual", nodes }); revalidatePath("/growth-map"); return { success: "Roadmap created.", updatedAt: Date.now() } }
  catch (error) { return { error: safeError(error, "Could not create this roadmap.") } }
}

export async function generateRoadmapAction(_state: RoadmapActionState, data: FormData): Promise<RoadmapActionState> {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return { error: "Your session expired." }
  const topic = value(data, "topic"), outcome = value(data, "outcome"), experience = value(data, "experience")
  if (topic.length < 2 || outcome.length < 5) return { error: "Tell the AI what you want to learn and what success looks like." }
  try { const generated = await generateGrowthRoadmap(topic, outcome, experience); await createGrowthRoadmap({ userId: session.user.id, title: generated.title, topic, outcome: generated.outcome, source: "ai", nodes: generated.nodes }); revalidatePath("/growth-map"); return { success: "AI roadmap created.", updatedAt: Date.now() } }
  catch (error) { return { error: safeError(error, "Could not generate this roadmap.") } }
}

export async function setRoadmapNodeStatusAction(data: FormData) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return
  const status = value(data, "status"); if (!["available", "in_progress", "completed"].includes(status)) return
  await setGrowthRoadmapNodeStatus({ userId: session.user.id, nodeId: value(data, "nodeId"), status: status as "available" | "in_progress" | "completed" }); revalidatePath("/growth-map")
}

export async function setRoadmapStatusAction(data: FormData) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return
  const status = value(data, "status"); if (status !== "active" && status !== "archived") return
  await setGrowthRoadmapStatus({ userId: session.user.id, mapId: value(data, "mapId"), status }); revalidatePath("/growth-map")
}
export async function saveGrowthMapItemAction(data: FormData) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return
  const type = value(data, "type"); if (!["evidence", "obstacle", "experiment", "outcome"].includes(type)) return
  const itemId = value(data, "itemId")
  await upsertGrowthMapItem({ userId: session.user.id, ...(itemId ? { itemId } : {}), type: type as "evidence" | "obstacle" | "experiment" | "outcome", title: value(data, "title"), description: value(data, "description"), confidence: Number(value(data, "confidence") || "1"), sourceTaskIds: [], sourceConversationIds: [], userConfirmed: true })
  revalidatePath("/growth-map")
}
export async function setGrowthMapItemStatusAction(data: FormData) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return
  const status = value(data, "status"); if (status !== "active" && status !== "dismissed") return
  await setGrowthMapItemStatus({ userId: session.user.id, itemId: value(data, "itemId"), status }); revalidatePath("/growth-map")
}
export async function deleteGrowthMapItemAction(data: FormData) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return
  await deleteGrowthMapItem({ userId: session.user.id, itemId: value(data, "itemId") }); revalidatePath("/growth-map")
}
export async function mergeGrowthMapItemsAction(data: FormData) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) return
  const sourceId = value(data, "sourceId"), targetId = value(data, "targetId")
  if (!sourceId || !targetId || sourceId === targetId) return
  await mergeGrowthMapItems({ userId: session.user.id, sourceId, targetId }); revalidatePath("/growth-map")
}
