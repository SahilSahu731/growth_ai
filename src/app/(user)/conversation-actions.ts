"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { deleteOperatorConversation, renameOperatorConversation, setOperatorConversationPinned } from "@/lib/data/operator"

export type ConversationActionState = { error?: string; success?: boolean; updatedAt?: number }

function value(formData: FormData, name: string) {
  const item = formData.get(name)
  return typeof item === "string" ? item.trim() : ""
}

function conversationActionError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : ""
  if (message.includes("Could not find public function")) {
    return "Conversation controls need the pending Convex database update. Your chat is safe."
  }
  return message || fallback
}

export async function renameConversationAction(_state: ConversationActionState, formData: FormData): Promise<ConversationActionState> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Your session expired." }
  try {
    await renameOperatorConversation({ userId: session.user.id, conversationId: value(formData, "conversationId"), title: value(formData, "title") })
    revalidatePath("/", "layout")
    return { success: true, updatedAt: Date.now() }
  } catch (error) {
    return { error: conversationActionError(error, "Could not rename this chat.") }
  }
}

export async function toggleConversationPinAction(
  _state: ConversationActionState,
  formData: FormData
): Promise<ConversationActionState> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Your session expired." }
  try {
    await setOperatorConversationPinned({
      userId: session.user.id,
      conversationId: value(formData, "conversationId"),
      pinned: value(formData, "pinned") === "true",
    })
    revalidatePath("/", "layout")
    return { success: true, updatedAt: Date.now() }
  } catch (error) {
    return { error: conversationActionError(error, "Could not update this chat.") }
  }
}

export async function deleteConversationAction(
  _state: ConversationActionState,
  formData: FormData
): Promise<ConversationActionState> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Your session expired." }
  const conversationId = value(formData, "conversationId")
  try {
    await deleteOperatorConversation({ userId: session.user.id, conversationId })
  } catch (error) {
    return { error: conversationActionError(error, "Could not delete this chat.") }
  }
  revalidatePath("/", "layout")
  return { success: true, updatedAt: Date.now() }
}
