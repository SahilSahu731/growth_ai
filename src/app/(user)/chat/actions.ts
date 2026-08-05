"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import {
  acceptOperatorTasks,
  appendOperatorExchange,
  createOperatorGoal,
  getOperatorWorkspace,
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

export async function sendOperatorMessageAction(_state: ChatActionState, formData: FormData): Promise<ChatActionState> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return { error: "Your session expired. Sign in again." }

  const conversationId = field(formData, "conversationId")
  const message = field(formData, "message")
  if (!conversationId) return { error: "Conversation not found. Refresh and try again." }
  if (message.length < 2) return { error: "Write a little more so GrowthAI can understand you." }
  if (message.length > 4000) return { error: "Keep this message under 4,000 characters." }

  const workspace = await getOperatorWorkspace(userId, conversationId)
  if (!workspace) return { error: "Conversation not found. Refresh and try again." }

  try {
    const assistant = await generateOperatorTurn({
      message,
      history: workspace.messages,
      tasks: workspace.tasks,
      goals: workspace.goals,
      state: workspace.conversation.state,
      today: localDate(workspace.timezone),
    })
    await appendOperatorExchange({ userId, conversationId, userMessage: message, assistant })
    revalidatePath("/chat")
    revalidatePath("/dashboard")
    return { sentAt: Date.now() }
  } catch (error) {
    console.error("Could not complete GrowthAI chat turn", error)
    return { error: "GrowthAI could not answer just now. Your message was not lost—please try again." }
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
    return { error: error instanceof Error ? error.message : "Could not add these tasks." }
  }
}

export async function setOperatorTaskStatusAction(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return
  const taskId = field(formData, "taskId")
  const status = field(formData, "status") as OperatorTask["status"]
  if (!taskId || !["todo", "done", "dismissed"].includes(status)) return
  await setOperatorTaskStatus({ userId, taskId, status })
  revalidateOperatorViews()
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
    return { error: error instanceof Error ? error.message : "Could not update this task." }
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
    return { error: error instanceof Error ? error.message : "Could not create this goal." }
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
    return { error: error instanceof Error ? error.message : "Could not update this goal." }
  }
}

function revalidateOperatorViews() {
  revalidatePath("/chat")
  revalidatePath("/tasks")
  revalidatePath("/goals")
  revalidatePath("/weekly-report")
  revalidatePath("/growth-map")
}
