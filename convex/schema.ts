import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const planTier = v.union(v.literal("free"), v.literal("pro"), v.literal("founder"), v.literal("team"))
const conversationState = v.union(
  v.literal("discovery"),
  v.literal("diagnosis"),
  v.literal("focus_proposal"),
  v.literal("plan_creation"),
  v.literal("daily_execution"),
  v.literal("blocker_diagnosis"),
  v.literal("review"),
  v.literal("replan")
)

export default defineSchema({
  users: defineTable({
    legacyId: v.string(),
    name: v.string(),
    email: v.string(),
    authProvider: v.string(),
    providerAccountId: v.optional(v.string()),
    emailVerifiedAt: v.optional(v.string()),
    planTier,
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    coachTone: v.optional(v.union(v.literal("supportive"), v.literal("balanced"), v.literal("blunt"))),
    emailNotifications: v.optional(v.boolean()),
    notificationQuietStart: v.optional(v.string()),
    notificationQuietEnd: v.optional(v.string()),
    notificationFrequency: v.optional(v.union(v.literal("off"), v.literal("weekly"))),
    notificationSnoozedUntil: v.optional(v.string()),
    messageRetentionDays: v.optional(v.number()),
    aiMemoryClearedAt: v.optional(v.string()),
    termsAcceptedVersion: v.optional(v.string()),
    termsAcceptedAt: v.optional(v.string()),
    privacyAcceptedVersion: v.optional(v.string()),
    aiNoticeAcceptedVersion: v.optional(v.string()),
    accountStatus: v.optional(v.union(v.literal("active"), v.literal("suspended"), v.literal("deletion_pending"), v.literal("deleted"))),
    suspendedAt: v.optional(v.string()),
    suspensionReason: v.optional(v.string()),
    suspensionActor: v.optional(v.string()),
    deletedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_provider_account", ["authProvider", "providerAccountId"])
    .index("by_legacy_id", ["legacyId"])
    .index("by_created", ["createdAt"])
    .index("by_status_created", ["accountStatus", "createdAt"])
    .index("by_plan_created", ["planTier", "createdAt"]),

  operatorConversations: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    title: v.string(),
    state: conversationState,
    pinnedAt: v.optional(v.string()),
    archivedAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  operatorGoals: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("archived")),
    createdAt: v.string(),
    updatedAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  operatorMessages: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    conversationId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    state: v.optional(v.string()),
    quickReplies: v.array(v.string()),
    taskDrafts: v.array(v.object({
      title: v.string(),
      note: v.string(),
      estimatedMinutes: v.number(),
      completionCondition: v.string(),
      scheduledFor: v.string(),
      goalTitle: v.optional(v.string()),
    })),
    modelName: v.optional(v.string()),
    requestId: v.optional(v.string()),
    usageDate: v.optional(v.string()),
    replyToMessageId: v.optional(v.string()),
    generationStatus: v.optional(v.union(v.literal("pending"), v.literal("complete"), v.literal("failed"), v.literal("cancelled"))),
    generationLeaseId: v.optional(v.string()),
    generationLeaseExpiresAt: v.optional(v.string()),
    generationAttempt: v.optional(v.number()),
    failureCode: v.optional(v.string()),
    promptVersion: v.optional(v.string()),
    latencyMs: v.optional(v.number()),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    estimatedCostUsd: v.optional(v.number()),
    generationOutcome: v.optional(v.string()),
    finishReason: v.optional(v.string()),
    tasksAcceptedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_conversation_time", ["conversationId", "createdAt"])
    .index("by_conversation_request", ["conversationId", "requestId"])
    .index("by_reply_to", ["replyToMessageId"])
    .index("by_user_time", ["userId", "createdAt"])
    .index("by_user_generation", ["userId", "generationStatus"]),

  operatorTasks: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    conversationId: v.optional(v.string()),
    sourceMessageId: v.optional(v.string()),
    originConversationTitle: v.optional(v.string()),
    originMessageCreatedAt: v.optional(v.string()),
    goalId: v.string(),
    title: v.string(),
    note: v.string(),
    status: v.union(v.literal("todo"), v.literal("done"), v.literal("dismissed")),
    estimatedMinutes: v.number(),
    completionCondition: v.string(),
    scheduledFor: v.string(),
    position: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_conversation", ["conversationId"])
    .index("by_goal_status", ["goalId", "status"])
    .index("by_user_date", ["userId", "scheduledFor"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  operatorTaskEvents: defineTable({
    userId: v.string(),
    taskId: v.string(),
    event: v.union(v.literal("accepted"), v.literal("completed"), v.literal("dismissed"), v.literal("reopened"), v.literal("rescheduled"), v.literal("deferred"), v.literal("edited")),
    fromStatus: v.optional(v.string()),
    toStatus: v.optional(v.string()),
    fromDate: v.optional(v.string()),
    toDate: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_task_created", ["taskId", "createdAt"]),

  messageFeedback: defineTable({
    userId: v.string(),
    messageId: v.string(),
    rating: v.union(v.literal("useful"), v.literal("not_useful"), v.literal("reported")),
    reason: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_message_user", ["messageId", "userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  weeklyReports: defineTable({
    userId: v.string(),
    version: v.number(),
    windowStart: v.string(),
    windowEnd: v.string(),
    previousWindowStart: v.string(),
    counts: v.object({ completed: v.number(), deferred: v.number(), dismissed: v.number(), overdue: v.number(), conversationTurns: v.number() }),
    previousCounts: v.object({ completed: v.number(), deferred: v.number(), dismissed: v.number(), overdue: v.number(), conversationTurns: v.number() }),
    observations: v.array(v.object({ id: v.string(), kind: v.union(v.literal("fact"), v.literal("hypothesis")), statement: v.string(), confidence: v.number(), taskIds: v.array(v.string()), conversationIds: v.array(v.string()), reviewStatus: v.optional(v.union(v.literal("accepted"), v.literal("rejected"), v.literal("corrected"))), correction: v.optional(v.string()) })),
    nextFocus: v.array(v.string()),
    createdAt: v.string(),
  })
    .index("by_user_window", ["userId", "windowStart"])
    .index("by_user_created", ["userId", "createdAt"]),

  growthMapItems: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    type: v.union(v.literal("evidence"), v.literal("obstacle"), v.literal("experiment"), v.literal("outcome")),
    title: v.string(),
    description: v.string(),
    confidence: v.number(),
    sourceTaskIds: v.array(v.string()),
    sourceConversationIds: v.array(v.string()),
    userConfirmed: v.boolean(),
    status: v.union(v.literal("active"), v.literal("dismissed"), v.literal("merged")),
    mergedInto: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  productEvents: defineTable({
    userId: v.string(),
    name: v.union(v.literal("conversation_started"), v.literal("evidence_gathered"), v.literal("plan_proposed"), v.literal("task_accepted"), v.literal("task_completed"), v.literal("task_deferred"), v.literal("report_viewed"), v.literal("upgrade_viewed"), v.literal("checkout_started"), v.literal("subscription_activated"), v.literal("onboarding_completed"), v.literal("feedback_submitted")),
    sourceId: v.optional(v.string()),
    funnelVersion: v.string(),
    acquisitionSource: v.optional(v.string()),
    experiment: v.optional(v.string()),
    plan: v.string(),
    durationMs: v.optional(v.number()),
    estimatedCostUsd: v.optional(v.number()),
    createdAt: v.string(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_name_created", ["name", "createdAt"]),

  aiUsageWindows: defineTable({
    key: v.string(),
    windowStartedAt: v.number(),
    count: v.number(),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),

  aiDailyUsage: defineTable({
    userId: v.string(),
    date: v.string(),
    requests: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    estimatedCostUsd: v.optional(v.number()),
    updatedAt: v.string(),
  }).index("by_user_date", ["userId", "date"]),

  aiProviderCircuit: defineTable({
    key: v.string(),
    consecutiveFailures: v.number(),
    openedUntil: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),

  subscriptions: defineTable({
    userId: v.string(),
    provider: v.literal("razorpay"),
    providerCustomerId: v.optional(v.string()),
    providerSubscriptionId: v.string(),
    checkoutUrl: v.optional(v.string()),
    checkoutExpiresAt: v.optional(v.string()),
    planTier: v.union(v.literal("pro"), v.literal("founder")),
    providerPlanId: v.optional(v.string()),
    status: v.string(),
    entitlementState: v.optional(v.union(v.literal("none"), v.literal("active"), v.literal("grace"), v.literal("paused"), v.literal("revoked"))),
    accessUntil: v.optional(v.string()),
    graceUntil: v.optional(v.string()),
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
    cancelAtPeriodEnd: v.boolean(),
    cancelRequestedAt: v.optional(v.string()),
    canceledAt: v.optional(v.string()),
    pausedAt: v.optional(v.string()),
    refundedAt: v.optional(v.string()),
    providerStatusUpdatedAt: v.optional(v.number()),
    lastProviderEventId: v.optional(v.string()),
    lastReconciledAt: v.optional(v.string()),
    reconciliationStatus: v.optional(v.union(v.literal("matched"), v.literal("drift"), v.literal("failed"))),
    reconciliationErrorCategory: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_provider_subscription", ["providerSubscriptionId"]),

  billingCheckoutLocks: defineTable({
    userId: v.string(),
    token: v.string(),
    planTier: v.union(v.literal("pro"), v.literal("founder")),
    expiresAt: v.string(),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),

  billingEvents: defineTable({
    provider: v.literal("razorpay"),
    providerEventId: v.string(),
    eventType: v.string(),
    payloadDigest: v.string(),
    status: v.union(v.literal("received"), v.literal("processed"), v.literal("ignored"), v.literal("failed"), v.literal("dead_letter")),
    eventCreatedAt: v.optional(v.number()),
    providerSubscriptionId: v.optional(v.string()),
    providerPlanId: v.optional(v.string()),
    reportedStatus: v.optional(v.string()),
    reportedCancelAtPeriodEnd: v.optional(v.boolean()),
    noteUserId: v.optional(v.string()),
    periodStart: v.optional(v.string()),
    periodEnd: v.optional(v.string()),
    attemptCount: v.optional(v.number()),
    nextRetryAt: v.optional(v.string()),
    lastAttemptAt: v.optional(v.string()),
    failureCategory: v.optional(v.union(v.literal("validation"), v.literal("ownership"), v.literal("provider_mismatch"), v.literal("transition"), v.literal("transient"), v.literal("internal"))),
    failureReason: v.optional(v.string()),
    finalDisposition: v.optional(v.union(v.literal("applied"), v.literal("duplicate"), v.literal("stale"), v.literal("ignored"), v.literal("dead_letter"))),
    replayedAt: v.optional(v.string()),
    replayedBy: v.optional(v.string()),
    createdAt: v.string(),
    processedAt: v.optional(v.string()),
  })
    .index("by_provider_event", ["providerEventId"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_status_retry", ["status", "nextRetryAt"])
    .index("by_subscription_created", ["providerSubscriptionId", "createdAt"]),

  entitlementGrants: defineTable({
    userId: v.string(),
    planTier: v.union(v.literal("pro"), v.literal("founder")),
    source: v.union(v.literal("admin_comp"), v.literal("design_partner"), v.literal("support_remediation")),
    reason: v.string(),
    actor: v.string(),
    startsAt: v.string(),
    expiresAt: v.string(),
    revokedAt: v.optional(v.string()),
    revokedBy: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  billingAlerts: defineTable({
    kind: v.union(v.literal("webhook_failure"), v.literal("reconciliation_drift"), v.literal("entitlement_change"), v.literal("checkout_abandoned")),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    dedupeKey: v.string(),
    userId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()),
    billingEventId: v.optional(v.string()),
    message: v.string(),
    status: v.union(v.literal("open"), v.literal("acknowledged"), v.literal("resolved")),
    createdAt: v.string(),
    updatedAt: v.string(),
    acknowledgedAt: v.optional(v.string()),
    acknowledgedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.string()),
  })
    .index("by_status_created", ["status", "createdAt"])
    .index("by_dedupe", ["dedupeKey"]),

  emailDeliveries: defineTable({
    idempotencyKey: v.string(),
    userId: v.optional(v.string()),
    toEmail: v.string(),
    kind: v.union(v.literal("subscription_confirmation"), v.literal("renewal"), v.literal("payment_failure"), v.literal("cancellation"), v.literal("plan_change"), v.literal("security_alert"), v.literal("export_ready"), v.literal("deletion_status"), v.literal("weekly_summary")),
    mandatory: v.boolean(),
    variablesJson: v.string(),
    status: v.union(v.literal("queued"), v.literal("sending"), v.literal("sent"), v.literal("delivered"), v.literal("bounced"), v.literal("complained"), v.literal("failed"), v.literal("dead_letter"), v.literal("suppressed")),
    attemptCount: v.number(),
    nextRetryAt: v.optional(v.string()),
    providerId: v.optional(v.string()),
    errorCategory: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    sentAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
  })
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_status_retry", ["status", "nextRetryAt"])
    .index("by_provider", ["providerId"])
    .index("by_user_created", ["userId", "createdAt"]),

  emailWebhookEvents: defineTable({
    providerEventId: v.string(),
    payloadDigest: v.string(),
    eventType: v.string(),
    providerEmailId: v.optional(v.string()),
    status: v.union(v.literal("processed"), v.literal("ignored")),
    createdAt: v.string(),
  }).index("by_provider_event", ["providerEventId"]),

  // Admin identity is deliberately not stored on user records. These tables
  // support abuse prevention and an immutable operational trail for the
  // environment-configured, separately authenticated administrator.
  adminLoginAttempts: defineTable({
    key: v.string(),
    attempts: v.number(),
    windowStartedAt: v.string(),
    blockedUntil: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_key", ["key"]),

  adminSessions: defineTable({
    tokenHash: v.string(),
    email: v.string(),
    roles: v.array(v.string()),
    deviceHash: v.string(),
    createdAt: v.string(),
    lastSeenAt: v.string(),
    idleExpiresAt: v.string(),
    absoluteExpiresAt: v.string(),
    revokedAt: v.optional(v.string()),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_email_created", ["email", "createdAt"]),

  adminAuditLogs: defineTable({
    actor: v.string(),
    actorRole: v.optional(v.string()),
    action: v.string(),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    reason: v.optional(v.string()),
    ticket: v.optional(v.string()),
    requestId: v.optional(v.string()),
    result: v.optional(v.string()),
    summary: v.string(),
    createdAt: v.string(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_target_created", ["targetId", "createdAt"]),

  privacyEvents: defineTable({
    userId: v.string(),
    type: v.string(),
    details: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_user_created", ["userId", "createdAt"]),

  dataSubjectRequests: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    type: v.union(v.literal("access"), v.literal("correction"), v.literal("deletion"), v.literal("restriction"), v.literal("objection")),
    status: v.union(v.literal("submitted"), v.literal("identity_verified"), v.literal("in_progress"), v.literal("completed"), v.literal("rejected")),
    details: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    completedAt: v.optional(v.string()),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_status_created", ["status", "createdAt"]),

  accountDeletionJobs: defineTable({
    legacyId: v.string(),
    userId: v.string(),
    status: v.union(v.literal("queued"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    stage: v.string(),
    attempts: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
    completedAt: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status_created", ["status", "createdAt"]),

  legalRetentionRecords: defineTable({
    subjectReference: v.string(),
    category: v.union(v.literal("billing"), v.literal("security"), v.literal("audit")),
    legalBasis: v.string(),
    retainedData: v.string(),
    retainUntil: v.string(),
    createdAt: v.string(),
  }).index("by_retain_until", ["retainUntil"]),

  deletedIdentityTombstones: defineTable({
    identityHash: v.string(),
    reason: v.literal("user_requested_deletion"),
    createdAt: v.string(),
  }).index("by_identity_hash", ["identityHash"]),

  announcements: defineTable({
    legacyId: v.string(),
    title: v.optional(v.string()),
    message: v.string(),
    tone: v.union(v.literal("info"), v.literal("offer"), v.literal("warning"), v.literal("critical")),
    placement: v.optional(v.union(v.literal("top_bar"), v.literal("floating_banner"), v.literal("popup"))),
    backgroundColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
    accentColor: v.optional(v.string()),
    alignment: v.optional(v.union(v.literal("left"), v.literal("center"))),
    buttonStyle: v.optional(v.union(v.literal("solid"), v.literal("outline"))),
    showIcon: v.optional(v.boolean()),
    linkLabel: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    startsAt: v.optional(v.string()),
    endsAt: v.optional(v.string()),
    priority: v.number(),
    dismissible: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_legacy_id", ["legacyId"])
    .index("by_active", ["isActive"]),
})
