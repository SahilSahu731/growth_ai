"use server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { deleteGrowthMapItem, mergeGrowthMapItems, setGrowthMapItemStatus, upsertGrowthMapItem } from "@/lib/data/growth-map"

function value(data: FormData, key: string) { const item = data.get(key); return typeof item === "string" ? item.trim() : "" }
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
