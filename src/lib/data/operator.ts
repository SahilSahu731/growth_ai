import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import { getAccountOverview } from "@/lib/data/account"
import { sevenDayWindowStart } from "@/lib/date-time"
import type {
  OperatorConversation,
  OperatorGoal,
  OperatorMessage,
  OperatorMessagePage,
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

export function renameOperatorConversation(input: { userId: string; conversationId: string; title: string }): Promise<{ id: string; title: string }> {
  return convexMutation("operator:renameConversation", input)
}

export function setOperatorConversationPinned(input: { userId: string; conversationId: string; pinned: boolean }): Promise<boolean> {
  return convexMutation("operator:setConversationPinned", input)
}

export function deleteOperatorConversation(input: { userId: string; conversationId: string }): Promise<boolean> {
  return convexMutation("operator:deleteConversation", input)
}

export function getOperatorWorkspace(userId: string, conversationId: string): Promise<OperatorWorkspace | null> {
  return convexQuery("operator:getWorkspace", { userId, conversationId })
}

export function getOperatorMessagePage(input: {
  userId: string
  conversationId: string
  cursor: string
  numItems?: number
}): Promise<OperatorMessagePage> {
  return convexQuery("operator:getMessagePage", {
    userId: input.userId,
    conversationId: input.conversationId,
    paginationOpts: { cursor: input.cursor, numItems: Math.min(Math.max(input.numItems ?? 80, 1), 80) },
  })
}

export async function getOperatorWeeklyActivity(userId: string): Promise<OperatorWeeklyActivity | null> {
  const account = await getAccountOverview(userId)
  if (!account) return null
  const since = sevenDayWindowStart(account.preferences.timezone).toISOString()
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

export function beginOperatorTurn(input: {
  userId: string
  conversationId: string
  requestId: string
  leaseId: string
  rateLimitKey: string
  localDate: string
  userMessage: string
}): Promise<{ message: OperatorMessage; acquired: boolean; status: "pending" | "complete" | "failed" }> {
  return convexMutation("operator:beginTurn", input)
}

export function completeOperatorTurn(input: {
  userId: string
  conversationId: string
  userMessageId: string
  leaseId: string
  assistant: OperatorTurn
}): Promise<OperatorMessage> {
  return convexMutation("operator:completeTurn", input)
}

export function failOperatorTurn(input: {
  userId: string
  conversationId: string
  userMessageId: string
  leaseId: string
  failureCode: string
}): Promise<boolean> {
  return convexMutation("operator:failTurn", input)
}

export function recordOperatorProviderOutcome(success: boolean): Promise<{ open: boolean; consecutiveFailures: number }> {
  return convexMutation("operator:recordProviderOutcome", { provider: "gemini", success })
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
