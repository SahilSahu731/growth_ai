"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { generateWeeklyReviewWithGemini } from "@/lib/ai/weekly-review"
import {
  createCodingSession,
  createProject,
  findUserByEmail,
  getDeveloperProfile,
  listCodingSessionsByUserId,
  listDeveloperSkills,
  listGoalsByUserId,
  listProjectsByUserId,
  type CodingSessionType,
  type DeveloperGoalType,
  type DeveloperLevel,
  type DeveloperPersona,
  type ProjectStatus,
  upsertDeveloperProfile,
  upsertWeeklyReview,
} from "@/lib/db"

export type DeveloperActionState = {
  error?: string
  success?: string
}

const PERSONAS = new Set<DeveloperPersona>(["solo_builder", "job_seeker", "working_developer"])
const LEVELS = new Set<DeveloperLevel>(["beginner", "intermediate", "advanced"])
const GOAL_TYPES = new Set<DeveloperGoalType>(["ship_project", "learn_skill", "interview_prep", "career_growth", "work_performance"])
const PROJECT_STATUSES = new Set<ProjectStatus>(["idea", "building", "shipped", "paused", "archived"])
const SESSION_TYPES = new Set<CodingSessionType>(["deep_work", "debugging", "learning", "interview_prep", "planning", "review"])

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

function integer(value: FormDataEntryValue | null, fallback: number): number {
  const parsed = Number.parseInt(text(value), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return Math.round(value)
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10)
}

async function currentUser() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) return null

  return findUserByEmail(email)
}

export async function saveDeveloperOnboardingAction(
  _prevState: DeveloperActionState,
  formData: FormData
): Promise<DeveloperActionState> {
  const user = await currentUser()

  if (!user) {
    return { error: "Your session expired. Please sign in again." }
  }

  const persona = text(formData.get("persona")) as DeveloperPersona
  const targetTrack = text(formData.get("targetTrack"))
  const currentLevel = text(formData.get("currentLevel")) as DeveloperLevel
  const weeklyCodingHours = clamp(integer(formData.get("weeklyCodingHours"), 8), 1, 80)
  const primaryGoalType = text(formData.get("primaryGoalType")) as DeveloperGoalType
  const preferredPlanningStyle = text(formData.get("preferredPlanningStyle")) || "weekly_sprints"

  if (!PERSONAS.has(persona) || !LEVELS.has(currentLevel) || !GOAL_TYPES.has(primaryGoalType)) {
    return { error: "Choose a valid developer setup before continuing." }
  }

  if (targetTrack.length < 2 || targetTrack.length > 80) {
    return { error: "Target track should be between 2 and 80 characters." }
  }

  try {
    await upsertDeveloperProfile({
      userId: user.id,
      persona,
      targetTrack,
      currentLevel,
      weeklyCodingHours,
      primaryGoalType,
      preferredPlanningStyle,
    })
  } catch (error) {
    console.error("Failed to save developer onboarding", error)
    return { error: "Could not save your developer profile right now." }
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function createProjectAction(
  _prevState: DeveloperActionState,
  formData: FormData
): Promise<DeveloperActionState> {
  const user = await currentUser()

  if (!user) {
    return { error: "Your session expired. Please sign in again." }
  }

  const title = text(formData.get("title"))
  const projectType = text(formData.get("projectType")) as DeveloperGoalType
  const status = text(formData.get("status")) as ProjectStatus
  const stack = text(formData.get("stack"))
  const repoUrl = text(formData.get("repoUrl"))
  const liveUrl = text(formData.get("liveUrl"))
  const portfolioReadiness = clamp(integer(formData.get("portfolioReadiness"), 15), 0, 100)
  const goalId = text(formData.get("goalId")) || null

  if (title.length < 3 || title.length > 120) {
    return { error: "Project title should be between 3 and 120 characters." }
  }

  if (!GOAL_TYPES.has(projectType) || !PROJECT_STATUSES.has(status)) {
    return { error: "Choose a valid project type and status." }
  }

  try {
    await createProject({
      userId: user.id,
      goalId,
      title,
      projectType,
      status,
      stack,
      repoUrl,
      liveUrl,
      portfolioReadiness,
    })
  } catch (error) {
    console.error("Failed to create project", error)
    return { error: "Could not create project right now." }
  }

  revalidatePath("/projects")
  revalidatePath("/dashboard")
  return { success: "Project added to your proof-of-work pipeline." }
}

export async function logCodingSessionAction(
  _prevState: DeveloperActionState,
  formData: FormData
): Promise<DeveloperActionState> {
  const user = await currentUser()

  if (!user) {
    return { error: "Your session expired. Please sign in again." }
  }

  const sessionType = text(formData.get("sessionType")) as CodingSessionType
  const durationMinutes = clamp(integer(formData.get("durationMinutes"), 45), 5, 720)
  const completedSummary = text(formData.get("completedSummary"))
  const blockers = text(formData.get("blockers"))
  const energyRating = clamp(integer(formData.get("energyRating"), 3), 1, 5)
  const focusRating = clamp(integer(formData.get("focusRating"), 3), 1, 5)
  const sessionDate = text(formData.get("sessionDate")) || todayDateOnly()
  const goalId = text(formData.get("goalId")) || null
  const projectId = text(formData.get("projectId")) || null

  if (!SESSION_TYPES.has(sessionType)) {
    return { error: "Choose a valid coding session type." }
  }

  if (completedSummary.length < 4 || completedSummary.length > 500) {
    return { error: "Add a short summary of what moved forward." }
  }

  try {
    await createCodingSession({
      userId: user.id,
      goalId,
      projectId,
      sessionType,
      durationMinutes,
      completedSummary,
      blockers,
      energyRating,
      focusRating,
      sessionDate,
    })
  } catch (error) {
    console.error("Failed to log coding session", error)
    return { error: "Could not log coding session right now." }
  }

  revalidatePath("/planner")
  revalidatePath("/progress")
  revalidatePath("/dashboard")
  return { success: "Coding session logged." }
}

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  start.setUTCDate(start.getUTCDate() + diff)
  return start.toISOString().slice(0, 10)
}

export async function generateWeeklyReviewAction(): Promise<void> {
  const user = await currentUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getDeveloperProfile(user.id)

  if (!profile) {
    redirect("/onboarding")
  }

  const [goals, projects, skills, sessions] = await Promise.all([
    listGoalsByUserId(user.id),
    listProjectsByUserId(user.id),
    listDeveloperSkills(user.id),
    listCodingSessionsByUserId(user.id, 20),
  ])

  try {
    const draft = await generateWeeklyReviewWithGemini({ profile, goals, projects, skills, sessions })

    await upsertWeeklyReview({
      userId: user.id,
      weekStart: getWeekStartDate(),
      shippedSummary: draft.shippedSummary,
      blockers: draft.blockers,
      skillMovement: draft.skillMovement,
      nextSprint: draft.nextSprint,
      highLeverageAction: draft.highLeverageAction,
      aiReviewText: draft.aiReviewText,
      modelName: draft.modelName,
    })
  } catch (error) {
    console.error("Failed to generate weekly review", error)
  }

  revalidatePath("/reviews")
  revalidatePath("/dashboard")
}
