import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const planTier = v.union(v.literal("free"), v.literal("pro"), v.literal("founder"), v.literal("team"))

export default defineSchema({
  users: defineTable({
    legacyId: v.string(),
    name: v.string(),
    email: v.string(),
    passwordHash: v.optional(v.string()),
    authProvider: v.string(),
    planTier,
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    onboardingCompletedAt: v.optional(v.string()),
    deletedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_legacy_id", ["legacyId"]),

  comparisons: defineTable({
    legacyId: v.string(),
    userId: v.optional(v.string()),
    title: v.string(),
    category: v.string(),
    status: v.string(),
    context: v.string(),
    finalRecommendation: v.string(),
    usageMode: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  comparisonOptions: defineTable({
    legacyId: v.string(),
    comparisonId: v.string(),
    name: v.string(),
    description: v.string(),
    price: v.string(),
    sourceUrl: v.string(),
    notes: v.string(),
    totalScore: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_comparison", ["comparisonId"]),

  comparisonCriteria: defineTable({
    legacyId: v.string(),
    comparisonId: v.string(),
    name: v.string(),
    description: v.string(),
    weight: v.number(),
    categoryRelevance: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_comparison", ["comparisonId"]),

  optionScores: defineTable({
    legacyId: v.string(),
    optionId: v.string(),
    criterionId: v.string(),
    score: v.number(),
    reason: v.string(),
  })
    .index("by_option", ["optionId"])
    .index("by_criterion", ["criterionId"]),

  comparisonInsights: defineTable({
    legacyId: v.string(),
    comparisonId: v.string(),
    optionId: v.optional(v.string()),
    insightType: v.string(),
    title: v.string(),
    content: v.string(),
    severity: v.string(),
    createdAt: v.string(),
  }).index("by_comparison", ["comparisonId"]),

  comparisonEvidence: defineTable({
    legacyId: v.string(),
    comparisonId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileUrl: v.string(),
    fileKey: v.string(),
    extractedText: v.string(),
    evidenceSummary: v.string(),
    createdAt: v.string(),
  }).index("by_comparison", ["comparisonId"]),

  comparisonSources: defineTable({
    legacyId: v.string(),
    comparisonId: v.string(),
    url: v.string(),
    title: v.string(),
    snippet: v.string(),
    fetchedAt: v.string(),
    confidence: v.number(),
    claimSupported: v.string(),
  }).index("by_comparison", ["comparisonId"]),

  usageCounters: defineTable({
    userId: v.string(),
    usageMonth: v.string(),
    planTier: v.string(),
    comparisonsUsed: v.number(),
    uploadsUsed: v.number(),
    researchCallsUsed: v.number(),
  }).index("by_user_month", ["userId", "usageMonth"]),

  userPreferences: defineTable({
    userId: v.string(),
    coachTone: v.union(v.literal("supportive"), v.literal("balanced"), v.literal("blunt")),
    checkInCadence: v.union(v.literal("daily"), v.literal("every_other_day")),
    checkInHour: v.number(),
    checkInMinute: v.number(),
    timezone: v.string(),
    emailNotifications: v.boolean(),
    weeklyReviewDay: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  growthProjects: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    whyItMatters: v.string(),
    definitionOfShipped: v.string(),
    targetShipDate: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("shipped"), v.literal("abandoned"), v.literal("archived")),
    isPrimary: v.boolean(),
    currentNextAction: v.string(),
    nextActionDueAt: v.optional(v.string()),
    pauseReason: v.optional(v.string()),
    publicSlug: v.optional(v.string()),
    isPublic: v.boolean(),
    showPublicStreak: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
    shippedAt: v.optional(v.string()),
    archivedAt: v.optional(v.string()),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_primary", ["userId", "isPrimary"])
    .index("by_public_slug", ["publicSlug"]),

  checkInSchedules: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    cadence: v.union(v.literal("daily"), v.literal("every_other_day")),
    localHour: v.number(),
    localMinute: v.number(),
    timezone: v.string(),
    nextPromptAt: v.string(),
    lastPromptAt: v.optional(v.string()),
    isActive: v.boolean(),
    version: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_due", ["isActive", "nextPromptAt"]),

  checkInPrompts: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    scheduleId: v.string(),
    scheduledFor: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("sent"), v.literal("opened"), v.literal("completed"), v.literal("missed"), v.literal("cancelled")),
    sentAt: v.optional(v.string()),
    openedAt: v.optional(v.string()),
    respondedAt: v.optional(v.string()),
    missedAt: v.optional(v.string()),
    idempotencyKey: v.string(),
    createdAt: v.string(),
  })
    .index("by_project_time", ["projectId", "scheduledFor"])
    .index("by_status_time", ["status", "scheduledFor"])
    .index("by_idempotency", ["idempotencyKey"]),

  growthCheckIns: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    promptId: v.optional(v.string()),
    response: v.string(),
    state: v.union(v.literal("progress"), v.literal("blocked"), v.literal("avoiding"), v.literal("pause_request")),
    classification: v.union(v.literal("meaningful_progress"), v.literal("maintenance"), v.literal("real_blocker"), v.literal("unclear"), v.literal("avoidance_signal")),
    confidence: v.number(),
    evidencePhrase: v.string(),
    aiResponse: v.string(),
    followUpQuestion: v.string(),
    nextAction: v.string(),
    nextActionDueAt: v.optional(v.string()),
    evidenceUrl: v.string(),
    modelName: v.string(),
    promptVersion: v.string(),
    helpful: v.optional(v.boolean()),
    correction: v.optional(v.string()),
    localDate: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_project_time", ["projectId", "createdAt"])
    .index("by_user_time", ["userId", "createdAt"])
    .index("by_project_classification", ["projectId", "classification"]),

  growthEvidence: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    checkInId: v.string(),
    type: v.union(v.literal("url"), v.literal("github_commit"), v.literal("pull_request"), v.literal("deployment"), v.literal("screenshot"), v.literal("text")),
    url: v.string(),
    summary: v.string(),
    verificationStatus: v.union(v.literal("unverified"), v.literal("verified"), v.literal("failed")),
    externalId: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_checkin", ["checkInId"]),

  projectEvents: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    eventType: v.string(),
    actor: v.union(v.literal("user"), v.literal("system"), v.literal("github"), v.literal("billing")),
    metadataJson: v.string(),
    idempotencyKey: v.optional(v.string()),
    schemaVersion: v.number(),
    createdAt: v.string(),
  })
    .index("by_project_time", ["projectId", "createdAt"])
    .index("by_user_time", ["userId", "createdAt"])
    .index("by_idempotency", ["idempotencyKey"]),

  growthStreaks: defineTable({
    userId: v.string(),
    projectId: v.string(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastQualifyingDate: v.optional(v.string()),
    missCount: v.number(),
    recoveryCount: v.number(),
    updatedAt: v.string(),
  }).index("by_project", ["projectId"]),

  growthWeeklyReviews: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    weekStart: v.string(),
    checkInsCompleted: v.number(),
    promptsMissed: v.number(),
    meaningfulProgressCount: v.number(),
    shippedSummary: v.string(),
    blockers: v.string(),
    observation: v.string(),
    nextWeekFocus: v.string(),
    narrative: v.string(),
    modelName: v.string(),
    promptVersion: v.string(),
    userEditedNarrative: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_project_week", ["projectId", "weekStart"])
    .index("by_user_time", ["userId", "weekStart"]),

  patternInsights: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    type: v.union(v.literal("repeated_blocker"), v.literal("vague_checkins"), v.literal("carried_action"), v.literal("late_stage_stall"), v.literal("schedule_mismatch")),
    summary: v.string(),
    confidence: v.number(),
    supportingCheckInIds: v.array(v.string()),
    status: v.union(v.literal("active"), v.literal("acknowledged"), v.literal("dismissed"), v.literal("resolved")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_project_status", ["projectId", "status"])
    .index("by_user_status", ["userId", "status"]),

  notifications: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.optional(v.string()),
    promptId: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("in_app")),
    template: v.string(),
    recipient: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("sent"), v.literal("delivered"), v.literal("failed"), v.literal("cancelled")),
    scheduledAt: v.string(),
    sentAt: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),
    attemptCount: v.number(),
    nextRetryAt: v.optional(v.string()),
    failureCategory: v.optional(v.string()),
    idempotencyKey: v.string(),
    createdAt: v.string(),
  })
    .index("by_status_time", ["status", "scheduledAt"])
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_user_time", ["userId", "createdAt"]),

  subscriptions: defineTable({
    userId: v.string(),
    provider: v.literal("razorpay"),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.string(),
    planTier: v.union(v.literal("pro"), v.literal("founder")),
    status: v.string(),
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
    cancelAtPeriodEnd: v.boolean(),
    amount: v.number(),
    currency: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_provider_subscription", ["providerSubscriptionId"]),

  billingEvents: defineTable({
    provider: v.literal("razorpay"),
    providerEventId: v.string(),
    eventType: v.string(),
    payloadDigest: v.string(),
    status: v.union(v.literal("received"), v.literal("processed"), v.literal("ignored"), v.literal("failed")),
    failureReason: v.optional(v.string()),
    createdAt: v.string(),
    processedAt: v.optional(v.string()),
  }).index("by_provider_event", ["providerEventId"]),

  githubConnections: defineTable({
    userId: v.string(),
    githubUserId: v.string(),
    login: v.string(),
    installationId: v.optional(v.string()),
    selectedRepositories: v.array(v.string()),
    lastSyncAt: v.optional(v.string()),
    syncStatus: v.union(v.literal("connected"), v.literal("syncing"), v.literal("error"), v.literal("disconnected")),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_installation", ["installationId"]),

  githubActivity: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    projectId: v.string(),
    repositoryId: v.string(),
    externalEventId: v.string(),
    activityType: v.union(v.literal("commit"), v.literal("pull_request"), v.literal("merge"), v.literal("release"), v.literal("deployment")),
    title: v.string(),
    url: v.string(),
    occurredAt: v.string(),
    createdAt: v.string(),
  })
    .index("by_project_time", ["projectId", "occurredAt"])
    .index("by_external_event", ["externalEventId"]),

  referrals: defineTable({
    referrerUserId: v.string(),
    code: v.string(),
    referredUserId: v.optional(v.string()),
    campaign: v.optional(v.string()),
    clickedAt: v.optional(v.string()),
    signedUpAt: v.optional(v.string()),
    activatedAt: v.optional(v.string()),
    rewardedAt: v.optional(v.string()),
    status: v.union(v.literal("created"), v.literal("clicked"), v.literal("signed_up"), v.literal("activated"), v.literal("rewarded"), v.literal("reversed")),
    createdAt: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_referrer", ["referrerUserId"])
    .index("by_referred", ["referredUserId"]),
})
