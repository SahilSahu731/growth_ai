import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import type {
  OperatorConversation,
  OperatorGoal,
  OperatorTask,
  OperatorTurn,
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
