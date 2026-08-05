import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { ChatExperience } from "@/components/operator/chat-experience"
import { createOperatorConversation, ensureOperatorConversation, getOperatorWorkspace } from "@/lib/data/operator"

export const dynamic = "force-dynamic"

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ new?: string; conversation?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const params = await searchParams
  if (params.new === "1") {
    const created = await createOperatorConversation(session.user.id)
    redirect(`/chat?conversation=${encodeURIComponent(created.id)}`)
  }

  const conversation = params.conversation
    ? { id: params.conversation }
    : await ensureOperatorConversation(session.user.id)
  const workspace = await getOperatorWorkspace(session.user.id, conversation.id)
  if (!workspace) redirect("/chat")

  return <ChatExperience workspace={workspace} userName={session.user.name ?? "there"} />
}
