"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { headers } from "next/headers"
import { createHmac } from "node:crypto"

import { authOptions } from "@/auth"
import {
  acceptOperatorTasks,
  beginOperatorTurn,
  completeOperatorTurn,
  createOperatorGoal,
  failOperatorTurn,
  getOperatorMessagePage,
  getOperatorWorkspace,
  recordOperatorProviderOutcome,
  setOperatorTaskStatus,
  updateOperatorGoal,
  updateOperatorTask,
} from "@/lib/data/operator"
import { generateOperatorTurn } from "@/lib/operator/orchestrator"
import type { OperatorGoal, OperatorTask } from "@/lib/operator/types"

export type ChatActionState = { error?: string; sentAt?: number }
export type OperatorFormState = { error?: string; success?: string; updatedAt?: number }

function field(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === "string" ? value.trim() : ""
}

function userSafeError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : ""
  const coded = message.match(/^[A-Z][A-Z0-9_]+:\s*(.+)$/)?.[1]
  return coded || message || fallback
}

function localDate(timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

async function rateLimitKey() {
  const requestHeaders = await headers()
  const address = requestHeaders.get("x-real-ip")
    ?? (process.env.VERCEL === "1" ? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() : null)
    ?? "local-or-unknown"
  const key = process.env.AUTH_SECRET ?? "growthai-development-rate-limit"
  return createHmac("sha256", key).update(address).digest("hex")
}

export async function sendOperatorMessageAction(_state: ChatActionState, formData: FormData): Promise<ChatActionState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired. Sign in again." }

  const conversationId = field(formData, "conversationId")
  const message = field(formData, "message")
  const requestId = field(formData, "requestId")
  if (!conversationId) return { error: "Conversation not found. Refresh and try again." }
  if (message.length < 2) return { error: "Write a little more so GrowthAI can understand you." }
  if (message.length > 4000) return { error: "Keep this message under 4,000 characters." }
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(requestId)) return { error: "This message request expired. Please send it again." }

  const workspace = await getOperatorWorkspace(userId, conversationId)
  if (!workspace) return { error: "Conversation not found. Refresh and try again." }

  const leaseId = crypto.randomUUID()
  const today = localDate(workspace.timezone)
  let persistedMessageId: string | null = null
  try {
    const started = await beginOperatorTurn({
      userId,
      conversationId,
      requestId,
      leaseId,
      rateLimitKey: await rateLimitKey(),
      localDate: today,
      userMessage: message,
    })
    persistedMessageId = started.message.id
    if (started.status === "complete" || !started.acquired) {
      revalidatePath("/chat")
      return { sentAt: Date.now() }
    }
    const assistant = await generateOperatorTurn({
      message,
      history: workspace.messages.filter((item) => item.id !== started.message.id),
      tasks: workspace.tasks,
      goals: workspace.goals,
      state: workspace.conversation.state,
      today,
      coachTone: workspace.coachTone,
      locale: workspace.locale,
      providerCircuitOpen: workspace.providerCircuitOpen,
    })
    await completeOperatorTurn({ userId, conversationId, userMessageId: started.message.id, leaseId, assistant })
    if (assistant.generationOutcome.startsWith("provider_")) {
      await recordOperatorProviderOutcome(["provider_success", "provider_refusal"].includes(assistant.generationOutcome)).catch(() => undefined)
    }
    revalidatePath("/chat")
    revalidatePath("/dashboard")
    return { sentAt: Date.now() }
  } catch (error) {
    console.error("Could not complete GrowthAI chat turn", error)
    const messageText = error instanceof Error ? error.message : ""
    if (messageText.includes("AI_RATE_LIMITED") || messageText.includes("AI_DAILY_LIMIT_REACHED")) {
      return { error: messageText.split(": ").slice(1).join(": ") || "AI usage limit reached. Try again later." }
    }
    if (persistedMessageId) {
      await failOperatorTurn({
        userId,
        conversationId,
        userMessageId: persistedMessageId,
        leaseId,
        failureCode: "GENERATION_FAILED",
      }).catch(() => false)
      revalidatePath("/chat")
      return { error: "Your message is saved, but GrowthAI could not answer just now. Retry it from the conversation." }
    }
    return { error: "GrowthAI could not save this message. Please try again." }
  }
}

export async function loadOlderMessagesAction(conversationId: string, cursor: string) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired.", page: [], continueCursor: "", isDone: true }
  if (!conversationId || !cursor) return { error: "Message history cursor is invalid.", page: [], continueCursor: "", isDone: true }
  try {
    return await getOperatorMessagePage({ userId, conversationId, cursor })
  } catch {
    return { error: "Could not load earlier messages.", page: [], continueCursor: cursor, isDone: false }
  }
}

export async function acceptOperatorTasksAction(_state: OperatorFormState, formData: FormData): Promise<OperatorFormState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired." }
  const conversationId = field(formData, "conversationId")
  const messageId = field(formData, "messageId")
  if (!conversationId || !messageId) return { error: "Task proposal not found." }
  try {
    const result = await acceptOperatorTasks({ userId, conversationId, messageId })
    revalidateOperatorViews()
    return { success: result.alreadyAccepted ? "Tasks were already added." : `${result.created} tasks added.`, updatedAt: Date.now() }
  } catch (error) {
    return { error: userSafeError(error, "Could not add these tasks.") }
  }
}

export async function setOperatorTaskStatusAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { success: false, error: "Your session expired." }
  const taskId = field(formData, "taskId")
  const status = field(formData, "status") as OperatorTask["status"]
  if (!taskId || !["todo", "done", "dismissed"].includes(status)) return { success: false, error: "Invalid task update." }
  const success = await setOperatorTaskStatus({ userId, taskId, status })
  return { success, ...(success ? {} : { error: "Task was not found." }) }
}

export async function updateOperatorTaskAction(_state: OperatorFormState, formData: FormData): Promise<OperatorFormState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired." }
  const taskId = field(formData, "taskId")
  const goalId = field(formData, "goalId")
  const title = field(formData, "title")
  const completionCondition = field(formData, "completionCondition")
  const scheduledFor = field(formData, "scheduledFor")
  const estimatedMinutes = Number.parseInt(field(formData, "estimatedMinutes"), 10)
  if (!taskId || !goalId) return { error: "Choose a goal for this task." }
  if (title.length < 3 || completionCondition.length < 3) return { error: "Add a clear title and completion condition." }
  try {
    await updateOperatorTask({
      userId, taskId, goalId, title, note: field(formData, "note"),
      estimatedMinutes: Number.isFinite(estimatedMinutes) ? estimatedMinutes : 25,
      completionCondition, scheduledFor,
    })
    revalidateOperatorViews()
    return { success: "Task updated.", updatedAt: Date.now() }
  } catch (error) {
    return { error: userSafeError(error, "Could not update this task.") }
  }
}

export async function createOperatorGoalAction(_state: OperatorFormState, formData: FormData): Promise<OperatorFormState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired." }
  try {
    const result = await createOperatorGoal({ userId, title: field(formData, "title"), description: field(formData, "description") })
    revalidateOperatorViews()
    return { success: result.duplicate ? "That goal already exists." : "Goal created.", updatedAt: Date.now() }
  } catch (error) {
    return { error: userSafeError(error, "Could not create this goal.") }
  }
}

export async function updateOperatorGoalAction(_state: OperatorFormState, formData: FormData): Promise<OperatorFormState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired." }
  const status = field(formData, "status") as OperatorGoal["status"]
  if (!["active", "completed", "archived"].includes(status)) return { error: "Choose a valid goal status." }
  try {
    await updateOperatorGoal({
      userId, goalId: field(formData, "goalId"), title: field(formData, "title"),
      description: field(formData, "description"), status,
    })
    revalidateOperatorViews()
    return { success: "Goal updated.", updatedAt: Date.now() }
  } catch (error) {
    return { error: userSafeError(error, "Could not update this goal.") }
  }
}

function revalidateOperatorViews() {
  revalidatePath("/chat")
  revalidatePath("/tasks")
  revalidatePath("/goals")
  revalidatePath("/weekly-report")
  revalidatePath("/growth-map")
}
