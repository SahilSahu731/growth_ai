"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import {
  completeOnboarding,
  createReferral,
  createGrowthProject,
  editGrowthWeeklyReview,
  getGrowthDashboard,
  getProjectWorkspace,
  setCheckInFeedback,
  setPatternStatus,
  setPublicProject,
  submitGrowthCheckIn,
  updateGrowthPreferences,
  updateProjectStatus,
  upsertGrowthWeeklyReview,
  upsertPatternInsight,
} from "@/lib/data/growth"
import { analyzeCheckIn, generateWeeklyReview } from "@/lib/growth/accountability-ai"
import { isMeaningfulCheckIn, isValidTimezone, localDateKey, nextCheckInAt, normalizeProjectSlug, updatedStreak } from "@/lib/growth/domain"
import { detectPatterns } from "@/lib/growth/patterns"
import type { CheckInCadence, CheckInState, CoachTone, ProjectStatus } from "@/lib/growth/types"

export type GrowthActionState = { error?: string; success?: string; projectId?: string }

const TONES = new Set<CoachTone>(["supportive", "balanced", "blunt"])
const CADENCES = new Set<CheckInCadence>(["daily", "every_other_day"])
const CHECK_IN_STATES = new Set<CheckInState>(["progress", "blocked", "avoiding", "pause_request"])
const PROJECT_STATUSES = new Set<ProjectStatus>(["active", "paused", "shipped", "abandoned", "archived"])

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function integer(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(text(formData, key), 10)
  return Number.isFinite(value) ? value : fallback
}

function optionalIso(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

async function currentUserId() {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

function projectFields(formData: FormData) {
  return {
    name: text(formData, "name"),
    description: text(formData, "description"),
    whyItMatters: text(formData, "whyItMatters"),
    definitionOfShipped: text(formData, "definitionOfShipped"),
    targetShipDate: text(formData, "targetShipDate"),
    currentNextAction: text(formData, "currentNextAction"),
    nextActionDueAt: optionalIso(text(formData, "nextActionDueAt")),
  }
}

function validateProject(project: ReturnType<typeof projectFields>) {
  if (project.name.length < 3 || project.name.length > 80) return "Project name must be between 3 and 80 characters."
  if (project.description.length < 12 || project.description.length > 600) return "Describe what you are building in 12–600 characters."
  if (project.whyItMatters.length < 8 || project.whyItMatters.length > 500) return "Explain why this matters to you."
  if (project.definitionOfShipped.length < 8 || project.definitionOfShipped.length > 300) return "Define an observable shipped outcome."
  if (project.currentNextAction.length < 4 || project.currentNextAction.length > 240) return "Add one concrete next action."
  const target = new Date(`${project.targetShipDate}T23:59:59Z`)
  if (!project.targetShipDate || Number.isNaN(target.getTime())) return "Choose a valid target ship date."
  if (target.getTime() <= Date.now()) return "The target ship date must be in the future."
  return null
}

export async function completeOnboardingAction(_state: GrowthActionState, formData: FormData): Promise<GrowthActionState> {
  const userId = await currentUserId()
  if (!userId) return { error: "Your session expired. Sign in again." }
  const project = projectFields(formData)
  const projectError = validateProject(project)
  if (projectError) return { error: projectError }

  const coachTone = text(formData, "coachTone") as CoachTone
  const checkInCadence = text(formData, "checkInCadence") as CheckInCadence
  const checkInHour = integer(formData, "checkInHour", 20)
  const checkInMinute = integer(formData, "checkInMinute", 0)
  const timezone = text(formData, "timezone") || "UTC"
  if (!TONES.has(coachTone) || !CADENCES.has(checkInCadence)) return { error: "Choose a valid coaching tone and check-in cadence." }
  if (!isValidTimezone(timezone)) return { error: "Choose a valid timezone." }
  if (checkInHour < 0 || checkInHour > 23 || checkInMinute < 0 || checkInMinute > 59) return { error: "Choose a valid check-in time." }

  try {
    const nextPromptAt = nextCheckInAt({ after: new Date(), timezone, hour: checkInHour, minute: checkInMinute, cadence: checkInCadence }).toISOString()
    const created = await completeOnboarding({
      userId,
      project,
      preferences: {
        coachTone, checkInCadence, checkInHour, checkInMinute, timezone,
        emailNotifications: formData.get("emailNotifications") === "on", weeklyReviewDay: 0, nextPromptAt,
      },
    })
    revalidatePath("/dashboard")
    return { success: "Your commitment is live.", projectId: created.id }
  } catch (error) {
    console.error("Onboarding failed", error)
    return { error: error instanceof Error ? error.message : "Could not create your commitment." }
  }
}

export async function createGrowthProjectAction(_state: GrowthActionState, formData: FormData): Promise<GrowthActionState> {
  const userId = await currentUserId()
  if (!userId) return { error: "Your session expired. Sign in again." }
  const project = projectFields(formData)
  const error = validateProject(project)
  if (error) return { error }
  const dashboard = await getGrowthDashboard(userId)
  if (!dashboard?.preferences) return { error: "Complete onboarding first." }
  try {
    const nextPromptAt = nextCheckInAt({
      after: new Date(), timezone: dashboard.preferences.timezone, hour: dashboard.preferences.checkInHour,
      minute: dashboard.preferences.checkInMinute, cadence: dashboard.preferences.checkInCadence,
    }).toISOString()
    const created = await createGrowthProject({ userId, ...project, nextPromptAt })
    revalidatePath("/dashboard")
    revalidatePath("/projects")
    return { success: "Project commitment created.", projectId: created.id }
  } catch (caught) {
    return { error: caught instanceof Error ? caught.message : "Could not create the project." }
  }
}

export async function submitCheckInAction(_state: GrowthActionState, formData: FormData): Promise<GrowthActionState> {
  const userId = await currentUserId()
  if (!userId) return { error: "Your session expired. Sign in again." }
  const projectId = text(formData, "projectId")
  const promptId = text(formData, "promptId")
  const response = text(formData, "response")
  const nextAction = text(formData, "nextAction")
  const evidenceUrl = text(formData, "evidenceUrl")
  const state = text(formData, "state") as CheckInState
  if (!projectId) return { error: "Project is missing." }
  if (response.length < 8 || response.length > 4000) return { error: "Write at least one specific sentence about what happened." }
  if (nextAction.length < 4 || nextAction.length > 240) return { error: "Commit to one concrete next action." }
  if (!CHECK_IN_STATES.has(state)) return { error: "Choose the state that best matches today." }
  if (evidenceUrl) {
    try { new URL(evidenceUrl) } catch { return { error: "Evidence must be a valid URL." } }
  }

  const workspace = await getProjectWorkspace(userId, projectId)
  const dashboard = await getGrowthDashboard(userId)
  if (!workspace || !dashboard?.preferences) return { error: "Project not found." }
  const localDate = localDateKey(new Date(), dashboard.preferences.timezone)
  const analysis = await analyzeCheckIn({
    project: workspace.project, recentCheckIns: workspace.checkIns, response, state, nextAction, tone: dashboard.preferences.coachTone,
  })
  const meaningful = isMeaningfulCheckIn(response, analysis.classification)
  const nextStreak = updatedStreak({
    currentStreak: workspace.streak?.currentStreak ?? 0,
    longestStreak: workspace.streak?.longestStreak ?? 0,
    lastQualifyingDate: workspace.streak?.lastQualifyingDate ?? null,
    localDate,
    cadence: dashboard.preferences.checkInCadence,
  })
  try {
    const created = await submitGrowthCheckIn({
      userId, projectId, ...(promptId ? { promptId } : {}), response, state, classification: analysis.classification, confidence: analysis.confidence,
      evidencePhrase: analysis.evidencePhrase, aiResponse: analysis.response, followUpQuestion: analysis.followUpQuestion,
      nextAction: analysis.suggestedNextAction || nextAction, nextActionDueAt: optionalIso(text(formData, "nextActionDueAt")),
      evidenceUrl, modelName: analysis.modelName, promptVersion: analysis.promptVersion, localDate, isMeaningful: meaningful,
      streak: nextStreak,
    })
    const patterns = detectPatterns([created, ...workspace.checkIns])
    await Promise.all(patterns.map((pattern) => upsertPatternInsight({ userId, projectId, ...pattern })))
    revalidatePath("/dashboard")
    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/reviews")
    return { success: "Check-in saved. Your next action is committed.", projectId }
  } catch (error) {
    console.error("Check-in failed", error)
    return { error: "Your update could not be saved. Your text is still in the form—please retry." }
  }
}

export async function updateProjectStatusAction(formData: FormData): Promise<void> {
  const userId = await currentUserId()
  if (!userId) redirect("/login")
  const projectId = text(formData, "projectId")
  const status = text(formData, "status") as ProjectStatus
  const reason = text(formData, "reason")
  if (!projectId || !PROJECT_STATUSES.has(status)) return
  await updateProjectStatus({ userId, projectId, status, ...(reason ? { reason } : {}) })
  revalidatePath("/dashboard")
  revalidatePath("/projects")
  revalidatePath(`/projects/${projectId}`)
}

export async function checkInFeedbackAction(formData: FormData): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return
  const checkInId = text(formData, "checkInId")
  const projectId = text(formData, "projectId")
  if (!checkInId) return
  await setCheckInFeedback({ userId, checkInId, helpful: text(formData, "helpful") === "true", correction: text(formData, "correction") || undefined })
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function updatePreferencesAction(_state: GrowthActionState, formData: FormData): Promise<GrowthActionState> {
  const userId = await currentUserId()
  if (!userId) return { error: "Your session expired." }
  const coachTone = text(formData, "coachTone") as CoachTone
  const checkInCadence = text(formData, "checkInCadence") as CheckInCadence
  const timezone = text(formData, "timezone")
  const checkInHour = integer(formData, "checkInHour", 20)
  const checkInMinute = integer(formData, "checkInMinute", 0)
  if (!TONES.has(coachTone) || !CADENCES.has(checkInCadence) || !isValidTimezone(timezone)) return { error: "Check your tone, cadence, and timezone." }
  try {
    const nextPromptAt = nextCheckInAt({ after: new Date(), timezone, hour: checkInHour, minute: checkInMinute, cadence: checkInCadence }).toISOString()
    await updateGrowthPreferences({
      userId, coachTone, checkInCadence, checkInHour, checkInMinute, timezone,
      emailNotifications: formData.get("emailNotifications") === "on", weeklyReviewDay: integer(formData, "weeklyReviewDay", 0), nextPromptAt,
    })
    revalidatePath("/settings")
    return { success: "Accountability preferences updated." }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update preferences." }
  }
}

function mondayDate(date = new Date()) {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = copy.getUTCDay() || 7
  copy.setUTCDate(copy.getUTCDate() - day + 1)
  return copy.toISOString().slice(0, 10)
}

export async function generateWeeklyReviewAction(formData: FormData): Promise<void> {
  const userId = await currentUserId()
  if (!userId) redirect("/login")
  const projectId = text(formData, "projectId")
  const workspace = await getProjectWorkspace(userId, projectId)
  if (!workspace) return
  const weekStart = mondayDate()
  const weekCheckIns = workspace.checkIns.filter((item) => item.createdAt.slice(0, 10) >= weekStart)
  const meaningful = weekCheckIns.filter((item) => item.classification === "meaningful_progress").length
  const draft = await generateWeeklyReview({ project: workspace.project, checkIns: weekCheckIns, checkInsCompleted: weekCheckIns.length, promptsMissed: workspace.streak?.missCount ?? 0, meaningfulProgressCount: meaningful })
  await upsertGrowthWeeklyReview({
    userId, projectId, weekStart, checkInsCompleted: weekCheckIns.length, promptsMissed: workspace.streak?.missCount ?? 0,
    meaningfulProgressCount: meaningful, ...draft,
  })
  revalidatePath("/reviews")
  revalidatePath(`/projects/${projectId}`)
}

export async function editWeeklyReviewAction(_state: GrowthActionState, formData: FormData): Promise<GrowthActionState> {
  const userId = await currentUserId()
  if (!userId) return { error: "Your session expired." }
  const reviewId = text(formData, "reviewId")
  const narrative = text(formData, "narrative")
  if (!reviewId || narrative.length < 20 || narrative.length > 3000) return { error: "Review must be between 20 and 3,000 characters." }
  const updated = await editGrowthWeeklyReview({ userId, reviewId, narrative })
  revalidatePath("/reviews")
  return updated ? { success: "Review updated." } : { error: "Review not found." }
}

export async function setPatternStatusAction(formData: FormData): Promise<void> {
  const userId = await currentUserId()
  if (!userId) return
  const patternId = text(formData, "patternId")
  const projectId = text(formData, "projectId")
  const status = text(formData, "status") as "acknowledged" | "dismissed" | "resolved"
  if (!patternId || !["acknowledged", "dismissed", "resolved"].includes(status)) return
  await setPatternStatus({ userId, patternId, status })
  revalidatePath("/dashboard")
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function setPublicProjectAction(_state: GrowthActionState, formData: FormData): Promise<GrowthActionState> {
  const userId = await currentUserId()
  if (!userId) return { error: "Your session expired." }
  const projectId = text(formData, "projectId")
  const isPublic = formData.get("isPublic") === "on"
  const publicSlug = normalizeProjectSlug(text(formData, "publicSlug"))
  if (!projectId || (isPublic && publicSlug.length < 3)) return { error: "Choose a public URL with at least three characters." }
  try {
    await setPublicProject({ userId, projectId, isPublic, ...(publicSlug ? { publicSlug } : {}), showPublicStreak: formData.get("showPublicStreak") === "on" })
    revalidatePath("/settings")
    if (publicSlug) revalidatePath(`/p/${publicSlug}`)
    return { success: isPublic ? "Public commitment page published." : "Public page disabled." }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update sharing." }
  }
}

export async function createReferralAction(): Promise<void> {
  const userId = await currentUserId()
  if (!userId) redirect("/login")
  await createReferral(userId, crypto.randomUUID().replaceAll("-", "").slice(0, 10))
  revalidatePath("/settings")
}
