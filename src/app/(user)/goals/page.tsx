import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { GoalManager } from "@/components/operator/goal-manager"
import { dateKeyInTimeZone } from "@/lib/date-time"
import { ensureOperatorConversation, getOperatorTasks, getOperatorWorkspace } from "@/lib/data/operator"

export const dynamic = "force-dynamic"
export const metadata = { title: "Goals" }

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const conversation = await ensureOperatorConversation(session.user.id)
  const [workspace, data] = await Promise.all([
    getOperatorWorkspace(session.user.id, conversation.id),
    getOperatorTasks(session.user.id),
  ])
  if (!workspace || !data) redirect("/chat")

  return <GoalManager goals={data.goals} tasks={data.tasks} goalLimit={workspace.goalLimit} today={dateKeyInTimeZone(new Date(), data.timezone)} locale={data.locale} />
}
