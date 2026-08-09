import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import type {
  OperatorConversation,
  OperatorGoal,
  OperatorMessage,
  OperatorMessagePage,
  OperatorTask,
  OperatorTurn,
  OperatorWeeklyActivity,
  OperatorWeeklyReport,
  OperatorWorkspace,
} from "@/lib/operator/types"

function member(userId: string, scope = "operator:member") {
  return { role: "member" as const, subject: `member:${userId}`, scope }
}

export function ensureOperatorConversation(userId: string): Promise<OperatorConversation> {
  return convexMutation("operator:ensureConversation", { userId }, member(userId))
}

export function createOperatorConversation(userId: string): Promise<OperatorConversation> {
  return convexMutation("operator:createConversation", { userId }, member(userId))
}

export function renameOperatorConversation(input: { userId: string; conversationId: string; title: string }): Promise<{ id: string; title: string }> {
  return convexMutation("operator:renameConversation", input, member(input.userId))
}

export function setOperatorConversationPinned(input: { userId: string; conversationId: string; pinned: boolean }): Promise<boolean> {
  return convexMutation("operator:setConversationPinned", input, member(input.userId))
}
export function setOperatorConversationArchived(input: { userId: string; conversationId: string; archived: boolean }): Promise<boolean> { return convexMutation("operator:setConversationArchived", input, member(input.userId)) }

export function deleteOperatorConversation(input: { userId: string; conversationId: string }): Promise<boolean> {
  return convexMutation("operator:deleteConversation", input, member(input.userId))
}

export function getOperatorWorkspace(userId: string, conversationId: string): Promise<OperatorWorkspace | null> {
  return convexQuery("operator:getWorkspace", { userId, conversationId }, member(userId))
}

export function getOperatorTasks(userId: string): Promise<{ tasks: OperatorTask[]; goals: OperatorGoal[]; timezone: string; locale: string } | null> {
  return convexQuery("operator:getTasks", { userId }, member(userId))
}

export function ensureOperatorWeeklyReport(input: { userId: string; windowStart: string; windowEnd: string; previousWindowStart: string }): Promise<OperatorWeeklyReport> {
  return convexMutation("operator:ensureWeeklyReport", input, member(input.userId))
}
export function listOperatorWeeklyReports(userId: string): Promise<OperatorWeeklyReport[]> { return convexQuery("operator:listWeeklyReports", { userId }, member(userId)) }

export function reviewOperatorWeeklyObservation(input: { userId: string; reportId: string; observationId: string; status: "accepted" | "rejected" | "corrected"; correction?: string }): Promise<boolean> {
  return convexMutation("operator:reviewWeeklyObservation", input, member(input.userId))
}

export function submitOperatorMessageFeedback(input: { userId: string; messageId: string; rating: "useful" | "not_useful" | "reported"; reason?: string }): Promise<boolean> {
  return convexMutation("operator:submitMessageFeedback", input, member(input.userId))
}

export function getOperatorGoal(userId: string, goalId: string): Promise<{ goal: OperatorGoal; tasks: OperatorTask[] } | null> {
  return convexQuery("operator:getGoal", { userId, goalId }, member(userId))
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
  }, member(input.userId))
}

export async function getOperatorWeeklyActivity(userId: string): Promise<OperatorWeeklyActivity | null> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
  return convexQuery("operator:getWeeklyActivity", { userId, since }, member(userId))
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
  return convexMutation("operator:beginTurn", input, member(input.userId))
}

export function completeOperatorTurn(input: {
  userId: string
  conversationId: string
  userMessageId: string
  leaseId: string
  assistant: OperatorTurn
}): Promise<OperatorMessage> {
  return convexMutation("operator:completeTurn", input, member(input.userId))
}

export function failOperatorTurn(input: {
  userId: string
  conversationId: string
  userMessageId: string
  leaseId: string
  failureCode: string
}): Promise<boolean> {
  return convexMutation("operator:failTurn", input, member(input.userId))
}

export function cancelOperatorTurn(input: { userId: string; conversationId: string }): Promise<boolean> {
  return convexMutation("operator:cancelTurn", input, member(input.userId))
}

export function recordOperatorProviderOutcome(success: boolean): Promise<{ open: boolean; consecutiveFailures: number }> {
  return convexMutation("operator:recordProviderOutcome", { provider: "gemini", success }, { role: "background", subject: "background:ai-provider", scope: "operator:provider" })
}

export function acceptOperatorTasks(input: { userId: string; conversationId: string; messageId: string }): Promise<{ created: number; alreadyAccepted: boolean }> {
  return convexMutation("operator:acceptTasks", input, member(input.userId))
}
export function updateOperatorTaskProposal(input: { userId: string; conversationId: string; messageId: string; index: number; title: string; note: string; estimatedMinutes: number; completionCondition: string; scheduledFor: string; goalTitle: string }): Promise<boolean> { return convexMutation("operator:updateTaskProposal", input, member(input.userId)) }

export function setOperatorTaskStatus(input: {
  userId: string
  taskId: string
  status: OperatorTask["status"]
}): Promise<boolean> {
  return convexMutation("operator:setTaskStatus", input, member(input.userId))
}

export function createOperatorGoal(input: { userId: string; title: string; description: string }): Promise<{ goal: OperatorGoal; limit: number; duplicate: boolean }> {
  return convexMutation("operator:createGoal", input, member(input.userId))
}

export function updateOperatorGoal(input: {
  userId: string
  goalId: string
  title: string
  description: string
  status: OperatorGoal["status"]
}): Promise<OperatorGoal> {
  return convexMutation("operator:updateGoal", input, member(input.userId))
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
  return convexMutation("operator:updateTask", input, member(input.userId))
}
