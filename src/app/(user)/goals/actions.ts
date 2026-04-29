"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import {
  createGoal,
  type DeveloperGoalType,
  type DeveloperPersona,
  deleteGoal,
  findUserByEmail,
  GoalStatus,
  setGoalTaskCompletion,
  updateGoalProgress,
  updateGoalStatus,
} from "@/lib/db"

export type GoalActionState = {
  error?: string
  success?: string
  goalId?: string
}

const VALID_STATUSES: ReadonlySet<GoalStatus> = new Set(["active", "paused", "completed", "archived"])
const VALID_DEVELOPER_TRACKS: ReadonlySet<DeveloperPersona> = new Set(["solo_builder", "job_seeker", "working_developer"])
const VALID_GOAL_TYPES: ReadonlySet<DeveloperGoalType> = new Set(["ship_project", "learn_skill", "interview_prep", "career_growth", "work_performance"])

function parseText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

function parseInteger(value: FormDataEntryValue | null): number {
  const asText = parseText(value)
  const parsed = Number.parseInt(asText, 10)

  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100

  return Math.round(value)
}

function parseBoolean(value: FormDataEntryValue | null): boolean | null {
  const normalized = parseText(value).toLowerCase()

  if (normalized === "true") return true
  if (normalized === "false") return false

  return null
}

async function getCurrentAppUser() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    return null
  }

  return findUserByEmail(email)
}

export async function createGoalAction(
  _prevState: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  const user = await getCurrentAppUser()

  if (!user) {
    return { error: "Your session expired. Please sign in again." }
  }

  const title = parseText(formData.get("title"))
  const category = parseText(formData.get("category")) || "General"
  const durationWeeks = parseInteger(formData.get("durationWeeks"))
  const developerTrack = parseText(formData.get("developerTrack"))
  const goalType = parseText(formData.get("goalType"))

  if (title.length < 4 || title.length > 120) {
    return { error: "Goal title should be between 4 and 120 characters." }
  }

  if (category.length < 2 || category.length > 32) {
    return { error: "Category should be between 2 and 32 characters." }
  }

  if (!Number.isFinite(durationWeeks) || durationWeeks < 1 || durationWeeks > 104) {
    return { error: "Duration should be between 1 and 104 weeks." }
  }

  if (!VALID_DEVELOPER_TRACKS.has(developerTrack as DeveloperPersona) || !VALID_GOAL_TYPES.has(goalType as DeveloperGoalType)) {
    return { error: "Choose a valid developer track and goal type." }
  }

  const today = new Date()
  const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
  const targetDate = new Date(todayDate)
  targetDate.setUTCDate(targetDate.getUTCDate() + durationWeeks * 7)
  const normalizedDate = targetDate.toISOString().slice(0, 10)

  try {
    const goal = await createGoal({
      id: crypto.randomUUID(),
      userId: user.id,
      title,
      category,
      whyItMatters: "Define your ecosystem to generate a personal strategy and stay consistent.",
      nextStep: "Open this goal and answer 5 quick setup questions.",
      weeklyCommitmentHours: 4,
      targetDate: normalizedDate,
      developerTrack: developerTrack as DeveloperPersona,
      goalType: goalType as DeveloperGoalType,
    })

    revalidatePath("/goals")

    return {
      success: "Goal created. Open it now to build your ecosystem.",
      goalId: goal.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    if (errorMessage.includes("DATABASE_URL")) {
      return {
        error: "Database is not configured. Please set a valid DATABASE_URL in your .env file.",
      }
    }

    console.error("Failed to create goal", error)

    return {
      error: "Could not create your goal right now. Please try again.",
    }
  }
}

export async function updateGoalProgressAction(formData: FormData): Promise<void> {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect("/login")
  }

  const goalId = parseText(formData.get("goalId"))
  const progressSource = formData.get("presetProgress") ?? formData.get("progress")
  const progress = clampProgress(parseInteger(progressSource))

  if (!goalId) {
    return
  }

  try {
    await updateGoalProgress({
      goalId,
      userId: user.id,
      progress,
    })

    revalidatePath("/goals")
  } catch (error) {
    console.error("Failed to update goal progress", error)
  }
}

export async function updateGoalStatusAction(formData: FormData): Promise<void> {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect("/login")
  }

  const goalId = parseText(formData.get("goalId"))
  const statusRaw = parseText(formData.get("status"))

  if (!goalId || !VALID_STATUSES.has(statusRaw as GoalStatus)) {
    return
  }

  try {
    await updateGoalStatus({
      goalId,
      userId: user.id,
      status: statusRaw as GoalStatus,
    })

    revalidatePath("/goals")
  } catch (error) {
    console.error("Failed to update goal status", error)
  }
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect("/login")
  }

  const goalId = parseText(formData.get("goalId"))

  if (!goalId) {
    return
  }

  try {
    await deleteGoal({
      goalId,
      userId: user.id,
    })

    revalidatePath("/goals")
  } catch (error) {
    console.error("Failed to delete goal", error)
  }
}

export async function toggleGoalTaskCompletionAction(formData: FormData): Promise<void> {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect("/login")
  }

  const goalId = parseText(formData.get("goalId"))
  const taskId = parseText(formData.get("taskId"))
  const isCompleted = parseBoolean(formData.get("isCompleted"))

  if (!goalId || !taskId || isCompleted === null) {
    return
  }

  try {
    await setGoalTaskCompletion({
      goalId,
      taskId,
      userId: user.id,
      isCompleted,
    })

    revalidatePath("/goals")
    revalidatePath(`/goals/${goalId}`)
  } catch (error) {
    console.error("Failed to toggle task completion", error)
  }
}
