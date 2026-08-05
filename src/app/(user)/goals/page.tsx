import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { GoalManager } from "@/components/operator/goal-manager"
import { ensureOperatorConversation, getOperatorWorkspace } from "@/lib/data/operator"

export const dynamic = "force-dynamic"
export const metadata = { title: "Goals" }

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const conversation = await ensureOperatorConversation(session.user.id)
  const workspace = await getOperatorWorkspace(session.user.id, conversation.id)
  if (!workspace) redirect("/chat")

  return <GoalManager goals={workspace.goals} tasks={workspace.tasks} goalLimit={workspace.goalLimit} />
}
