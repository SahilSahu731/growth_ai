export type OperatorState =
  | "discovery"
  | "diagnosis"
  | "focus_proposal"
  | "plan_creation"
  | "daily_execution"
  | "blocker_diagnosis"
  | "review"
  | "replan"

export type OperatorTaskDraft = {
  title: string
  note: string
  estimatedMinutes: number
  completionCondition: string
  scheduledFor: string
  goalTitle: string
}

export type OperatorGoal = {
  id: string
  userId: string
  title: string
  description: string
  targetDate?: string
  status: "active" | "completed" | "archived"
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type OperatorConversation = {
  id: string
  userId: string
  title: string
  state: OperatorState
  createdAt: string
  updatedAt: string
}

export type OperatorMessage = {
  id: string
  userId: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  state?: OperatorState
  quickReplies: string[]
  taskDrafts: OperatorTaskDraft[]
  modelName?: string
  requestId?: string
  usageDate?: string
  replyToMessageId?: string
  generationStatus?: "pending" | "complete" | "failed" | "cancelled"
  generationAttempt?: number
  failureCode?: string
  promptVersion?: string
  latencyMs?: number
  inputTokens?: number
  outputTokens?: number
  estimatedCostUsd?: number
  generationOutcome?: string
  finishReason?: string
  tasksAcceptedAt?: string
  createdAt: string
}

export type OperatorTask = {
  id: string
  userId: string
  conversationId?: string
  sourceMessageId?: string
  originConversationTitle?: string
  originMessageCreatedAt?: string
  goalId: string
  title: string
  note: string
  status: "todo" | "done" | "dismissed"
  estimatedMinutes: number
  completionCondition: string
  scheduledFor: string
  position: number
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type OperatorWorkspace = {
  conversation: OperatorConversation
  messages: OperatorMessage[]
  messageCursor: string
  hasMoreMessages: boolean
  tasks: OperatorTask[]
  goals: OperatorGoal[]
  goalLimit: number
  timezone: string
  locale: string
  coachTone: "supportive" | "balanced" | "blunt"
  providerCircuitOpen: boolean
  entitlements: { plan: "free" | "pro" | "founder" | "team"; source: string; grace: boolean; limits: { activeGoals: number }; entitlements: Record<string, boolean> }
}

export type OperatorWeeklyReport = {
  id: string
  userId: string
  version: number
  windowStart: string
  windowEnd: string
  previousWindowStart: string
  counts: { completed: number; deferred: number; dismissed: number; overdue: number; conversationTurns: number }
  previousCounts: { completed: number; deferred: number; dismissed: number; overdue: number; conversationTurns: number }
  observations: Array<{ id: string; kind: "fact" | "hypothesis"; statement: string; confidence: number; taskIds: string[]; conversationIds: string[]; reviewStatus?: "accepted" | "rejected" | "corrected"; correction?: string }>
  nextFocus: string[]
  createdAt: string
}

export type OperatorWeeklyActivity = {
  since: string
  conversationTurns: number
  openTasks: number
  activeGoals: number
  enoughData: boolean
}

export type OperatorTurn = {
  content: string
  state: OperatorState
  quickReplies: string[]
  taskDrafts: OperatorTaskDraft[]
  modelName: string
  promptVersion: string
  latencyMs: number
  inputTokens?: number
  outputTokens?: number
  estimatedCostUsd?: number
  generationOutcome: string
  finishReason?: string
}

export type OperatorMessagePage = {
  page: OperatorMessage[]
  continueCursor: string
  isDone: boolean
}
