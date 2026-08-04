import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import type {
  AccountabilityAnalysis,
  CheckInCadence,
  CheckInState,
  CoachTone,
  GrowthCheckIn,
  GrowthDashboard,
  GrowthProject,
  PatternInsight,
  LifeArea,
  ProjectStatus,
  UserPreferences,
  WeeklyReview,
} from "@/lib/growth/types"

export type OnboardingState = {
  completed: boolean
  user: { id: string; name: string; email: string; timezone: string; planTier: "free" | "pro" | "founder" }
  preferences: UserPreferences | null
  project: GrowthProject | null
}

export type ProjectWorkspace = {
  project: GrowthProject
  checkIns: GrowthCheckIn[]
  streak: { currentStreak: number; longestStreak: number; lastQualifyingDate?: string; missCount: number; recoveryCount: number } | null
  patterns: PatternInsight[]
  reviews: WeeklyReview[]
  schedule: { nextPromptAt: string; timezone: string; cadence: CheckInCadence } | null
  currentPromptId: string | null
  evidence: Array<{ id: string; url: string; summary: string; verificationStatus: string; createdAt: string }>
}

export function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  return convexQuery("growth:getOnboardingState", { userId })
}

export function completeOnboarding(input: {
  userId: string
  project: {
    name: string; lifeArea: LifeArea; description: string; whyItMatters: string; definitionOfShipped: string;
    targetShipDate: string; currentNextAction: string; nextActionDueAt?: string
  }
  preferences: {
    coachTone: CoachTone; checkInCadence: CheckInCadence; checkInHour: number; checkInMinute: number;
    timezone: string; emailNotifications: boolean; weeklyReviewDay: number; nextPromptAt: string
  }
}): Promise<GrowthProject> {
  return convexMutation("growth:completeOnboarding", input)
}

export function getGrowthDashboard(userId: string): Promise<GrowthDashboard | null> {
  return convexQuery("growth:getDashboard", { userId })
}

export function createGrowthProject(input: {
  userId: string; name: string; lifeArea: LifeArea; description: string; whyItMatters: string; definitionOfShipped: string;
  targetShipDate: string; currentNextAction: string; nextActionDueAt?: string; nextPromptAt: string
}): Promise<GrowthProject> {
  return convexMutation("growth:createProject", input)
}

export function getProjectWorkspace(userId: string, projectId: string): Promise<ProjectWorkspace | null> {
  return convexQuery("growth:getProjectWorkspace", { userId, projectId })
}

export function submitGrowthCheckIn(input: {
  userId: string; projectId: string; promptId?: string; response: string; state: CheckInState;
  classification: AccountabilityAnalysis["classification"]; confidence: number; evidencePhrase: string;
  aiResponse: string; followUpQuestion: string; nextAction: string; nextActionDueAt?: string;
  evidenceUrl: string; modelName: string; promptVersion: string; localDate: string; isMeaningful: boolean;
  streak: { currentStreak: number; longestStreak: number; lastQualifyingDate: string }
}): Promise<GrowthCheckIn> {
  return convexMutation("growth:submitCheckIn", input)
}

export function updateProjectStatus(input: { userId: string; projectId: string; status: ProjectStatus; reason?: string }): Promise<GrowthProject | null> {
  return convexMutation("growth:updateProjectStatus", input)
}

export function setCheckInFeedback(input: { userId: string; checkInId: string; helpful: boolean; correction?: string }): Promise<boolean> {
  return convexMutation("growth:setCheckInFeedback", input)
}

export function updateGrowthPreferences(input: {
  userId: string; coachTone: CoachTone; checkInCadence: CheckInCadence; checkInHour: number; checkInMinute: number;
  timezone: string; emailNotifications: boolean; weeklyReviewDay: number; nextPromptAt: string
}): Promise<UserPreferences> {
  return convexMutation("growth:updatePreferences", input)
}

export function upsertPatternInsight(input: {
  userId: string; projectId: string; type: PatternInsight["type"]; summary: string;
  confidence: number; supportingCheckInIds: string[]
}): Promise<PatternInsight> {
  return convexMutation("growth:upsertPattern", input)
}

export function setPatternStatus(input: { userId: string; patternId: string; status: "acknowledged" | "dismissed" | "resolved" }): Promise<boolean> {
  return convexMutation("growth:setPatternStatus", input)
}

export function upsertGrowthWeeklyReview(input: {
  userId: string; projectId: string; weekStart: string; checkInsCompleted: number; promptsMissed: number;
  meaningfulProgressCount: number; shippedSummary: string; blockers: string; observation: string;
  nextWeekFocus: string; narrative: string; modelName: string; promptVersion: string
}): Promise<WeeklyReview> {
  return convexMutation("growth:upsertWeeklyReview", input)
}

export function editGrowthWeeklyReview(input: { userId: string; reviewId: string; narrative: string }): Promise<boolean> {
  return convexMutation("growth:editWeeklyReview", input)
}

export function setPublicProject(input: { userId: string; projectId: string; isPublic: boolean; publicSlug?: string; showPublicStreak: boolean }): Promise<GrowthProject> {
  return convexMutation("growth:setPublicProject", input)
}

export function getPublicProject(slug: string): Promise<{
  project: { name: string; description: string; definitionOfShipped: string; targetShipDate: string; status: ProjectStatus; shippedAt: string | null }
  streak: { currentStreak: number; longestStreak: number } | null
  checkInCount: number
  meaningfulProgressCount: number
} | null> {
  return convexQuery("growth:getPublicProject", { slug })
}

export function createReferral(userId: string, code: string) {
  return convexMutation<{ userId: string; code: string }, { id: string; code: string }>("growth:createReferral", { userId, code })
}
export function getReferral(userId: string): Promise<{ id: string; code: string; status: string } | null> { return convexQuery("growth:getReferral", { userId }) }
export function claimReferral(code: string, referredUserId: string): Promise<boolean> { return convexMutation("growth:claimReferral", { code, referredUserId }) }

export function recordBillingEvent(input: {
  providerEventId: string; eventType: string; payloadDigest: string; userId?: string;
  providerSubscriptionId?: string; subscriptionStatus?: string; periodStart?: string; periodEnd?: string
}): Promise<{ duplicate: boolean }> {
  return convexMutation("growth:recordBillingEvent", input)
}

export function getGithubConnection(userId: string): Promise<{
  id: string; githubUserId: string; login: string; selectedRepositories: string[]; syncStatus: string; lastSyncAt?: string
} | null> {
  return convexQuery("growth:getGithubConnection", { userId })
}

export function upsertGithubConnection(input: {
  userId: string; githubUserId: string; login: string; installationId?: string; selectedRepositories: string[]
}) {
  return convexMutation("growth:upsertGithubConnection", input)
}

export function disconnectGithub(userId: string): Promise<boolean> {
  return convexMutation("growth:disconnectGithub", { userId })
}

export type DueSchedule = { id: string; userId: string; projectId: string; projectName: string; recipient: string; cadence: CheckInCadence; timezone: string; localHour: number; localMinute: number; nextPromptAt: string; emailEnabled: boolean }
export function listDueSchedules(dueAt: string, limit = 100): Promise<DueSchedule[]> { return convexQuery("growth:listDueSchedules", { dueAt, limit }) }
export function claimScheduledPrompt(input: { scheduleId: string; expectedPromptAt: string; nextPromptAt: string }): Promise<{ claimed: boolean; promptId?: string }> { return convexMutation("growth:claimScheduledPrompt", input) }
export type DueNotification = { id: string; recipient: string; template: string; projectId?: string; projectName: string; attemptCount: number }
export function listDueNotifications(dueAt: string, limit = 100): Promise<DueNotification[]> { return convexQuery("growth:listDueNotifications", { dueAt, limit }) }
export function finishNotification(input: { notificationId: string; sent: boolean; providerMessageId?: string; failureCategory?: string }): Promise<boolean> { return convexMutation("growth:finishNotification", input) }
export function markMissedPrompts(before: string, limit = 100): Promise<{ marked: number }> { return convexMutation("growth:markMissedPrompts", { before, limit }) }
export function ingestGithubActivity(input: { installationId: string; repository: string; externalEventId: string; activityType: "commit" | "pull_request" | "merge" | "release" | "deployment"; title: string; url: string; occurredAt: string }): Promise<{ duplicate: boolean; linked: boolean }> { return convexMutation("growth:ingestGithubActivity", input) }
export function exportGrowthUserData(userId: string): Promise<Record<string, unknown> | null> { return convexQuery("growth:exportUserData", { userId }) }
export function deleteGrowthUserAccount(userId: string, confirmationEmail: string): Promise<boolean> { return convexMutation("growth:deleteUserAccount", { userId, confirmationEmail }) }
