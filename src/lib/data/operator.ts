import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import { getAccountOverview } from "@/lib/data/account"
import type {
  OperatorConversation,
  OperatorGoal,
  OperatorTask,
  OperatorTurn,
  OperatorWeeklyActivity,
  OperatorWorkspace,
} from "@/lib/operator/types"

export function ensureOperatorConversation(userId: string): Promise<OperatorConversation> {
  return convexMutation("operator:ensureConversation", { userId })
}

export function createOperatorConversation(userId: string): Promise<OperatorConversation> {
  return convexMutation("operator:createConversation", { userId })
}

export function getOperatorWorkspace(userId: string, conversationId: string): Promise<OperatorWorkspace | null> {
  return convexQuery("operator:getWorkspace", { userId, conversationId })
}

export async function getOperatorWeeklyActivity(userId: string): Promise<OperatorWeeklyActivity | null> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const account = await getAccountOverview(userId)
  if (!account) return null
  const workspaces = (await Promise.all(
    account.conversations.map((conversation) => convexQuery<
      { userId: string; conversationId: string }, OperatorWorkspace | null
    >("operator:getWorkspace", { userId, conversationId: conversation.id }))
  )).filter((workspace): workspace is OperatorWorkspace => workspace !== null)
  const conversationTurns = workspaces.reduce((count, workspace) => count + workspace.messages.filter(
    (message) => message.role === "user" && message.createdAt >= since
  ).length, 0)
  const current = workspaces[0]
  return {
    since,
    conversationTurns,
    openTasks: current?.tasks.length ?? 0,
    activeGoals: current?.goals.filter((goal) => goal.status === "active").length ?? 0,
    enoughData: conversationTurns >= 3,
  }
}

export function appendOperatorExchange(input: {
  userId: string
  conversationId: string
  userMessage: string
  assistant: OperatorTurn
}) {
  return convexMutation("operator:appendExchange", input)
}

export function acceptOperatorTasks(input: { userId: string; conversationId: string; messageId: string }): Promise<{ created: number; alreadyAccepted: boolean }> {
  return convexMutation("operator:acceptTasks", input)
}

export function setOperatorTaskStatus(input: {
  userId: string
  taskId: string
  status: OperatorTask["status"]
}): Promise<boolean> {
  return convexMutation("operator:setTaskStatus", input)
}

export function createOperatorGoal(input: { userId: string; title: string; description: string }): Promise<{ goal: OperatorGoal; limit: number; duplicate: boolean }> {
  return convexMutation("operator:createGoal", input)
}

export function updateOperatorGoal(input: {
  userId: string
  goalId: string
  title: string
  description: string
  status: OperatorGoal["status"]
}): Promise<OperatorGoal> {
  return convexMutation("operator:updateGoal", input)
}

export function updateOperatorTask(input: {
  userId: string
  taskId: string
  goalId: string
  title: string
  note: string
  estimatedMinutes: number
  completionCondition: string
  scheduledFor: string
}): Promise<OperatorTask> {
  return convexMutation("operator:updateTask", input)
}
