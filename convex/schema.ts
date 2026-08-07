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
    status: v.union(v.literal("received"), v.literal("processed"), v.literal("ignored"), v.literal("failed")),
    failureReason: v.optional(v.string()),
    createdAt: v.string(),
    processedAt: v.optional(v.string()),
  })
    .index("by_provider_event", ["providerEventId"])
    .index("by_status_created", ["status", "createdAt"]),

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

  adminAuditLogs: defineTable({
    actor: v.string(),
    action: v.string(),
    targetType: v.string(),
    targetId: v.optional(v.string()),
    summary: v.string(),
    createdAt: v.string(),
  }).index("by_created_at", ["createdAt"]),

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
