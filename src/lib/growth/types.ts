export type PlanTier = "free" | "pro" | "founder"
export type CoachTone = "supportive" | "balanced" | "blunt"
export type CheckInCadence = "daily" | "every_other_day"
export type ProjectStatus = "active" | "paused" | "shipped" | "abandoned" | "archived"
export type CheckInState = "progress" | "blocked" | "avoiding" | "pause_request"
export type CheckInClassification =
  | "meaningful_progress"
  | "maintenance"
  | "real_blocker"
  | "unclear"
  | "avoidance_signal"

export type GrowthUser = {
  id: string
  name: string
  email: string
  planTier: PlanTier
  timezone: string
  onboardingCompletedAt: string | null
}

export type UserPreferences = {
  userId: string
  coachTone: CoachTone
  checkInCadence: CheckInCadence
  checkInHour: number
  checkInMinute: number
  timezone: string
  emailNotifications: boolean
  weeklyReviewDay: number
  createdAt: string
  updatedAt: string
}

export type GrowthProject = {
  id: string
  userId: string
  name: string
  description: string
  whyItMatters: string
  definitionOfShipped: string
  targetShipDate: string
  status: ProjectStatus
  isPrimary: boolean
  currentNextAction: string
  nextActionDueAt: string | null
  publicSlug: string | null
  isPublic: boolean
  showPublicStreak: boolean
  createdAt: string
  updatedAt: string
  shippedAt: string | null
}

export type ProjectStreak = {
  projectId: string
  currentStreak: number
  longestStreak: number
  lastQualifyingDate: string | null
  missCount: number
  recoveryCount: number
}

export type GrowthCheckIn = {
  id: string
  projectId: string
  response: string
  state: CheckInState
  classification: CheckInClassification
  confidence: number
  aiResponse: string
  followUpQuestion: string
  nextAction: string
  evidenceUrl: string
  promptVersion: string
  helpful: boolean | null
  createdAt: string
}

export type PatternInsight = {
  id: string
  projectId: string
  type: "repeated_blocker" | "vague_checkins" | "carried_action" | "late_stage_stall" | "schedule_mismatch"
  summary: string
  confidence: number
  supportingCheckInIds: string[]
  status: "active" | "acknowledged" | "dismissed" | "resolved"
  createdAt: string
}

export type WeeklyReview = {
  id: string
  projectId: string
  weekStart: string
  checkInsCompleted: number
  promptsMissed: number
  meaningfulProgressCount: number
  shippedSummary: string
  blockers: string
  observation: string
  nextWeekFocus: string
  narrative: string
  modelName: string
  createdAt: string
}

export type GrowthDashboard = {
  user: GrowthUser
  preferences: UserPreferences | null
  projects: GrowthProject[]
  primaryProject: GrowthProject | null
  streak: ProjectStreak | null
  recentCheckIns: GrowthCheckIn[]
  activePatterns: PatternInsight[]
  latestReview: WeeklyReview | null
  nextPromptAt: string | null
  currentPromptId: string | null
}

export type AccountabilityAnalysis = {
  classification: CheckInClassification
  confidence: number
  evidencePhrase: string
  response: string
  followUpQuestion: string
  suggestedNextAction: string
  modelName: string
  promptVersion: string
}
