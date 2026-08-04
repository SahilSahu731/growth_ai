/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalMutationGeneric as internalMutation, internalQueryGeneric as internalQuery } from "convex/server"
import { v } from "convex/values"

const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()

const toneValidator = v.union(v.literal("supportive"), v.literal("balanced"), v.literal("blunt"))
const cadenceValidator = v.union(v.literal("daily"), v.literal("every_other_day"))
const projectStatusValidator = v.union(v.literal("active"), v.literal("paused"), v.literal("shipped"), v.literal("abandoned"), v.literal("archived"))
const checkInStateValidator = v.union(v.literal("progress"), v.literal("blocked"), v.literal("avoiding"), v.literal("pause_request"))
const classificationValidator = v.union(v.literal("meaningful_progress"), v.literal("maintenance"), v.literal("real_blocker"), v.literal("unclear"), v.literal("avoidance_signal"))

function clean(document: any) {
  if (!document) return null
  const fields = { ...document }
  const resolvedId = fields.legacyId ?? String(fields._id)
  delete fields._id
  delete fields._creationTime
  delete fields.legacyId
  return { id: resolvedId, ...fields }
}

function normalizedPlan(value: string | undefined) {
  if (value === "pro") return "pro"
  if (value === "founder" || value === "team") return "founder"
  return "free"
}

function cleanProject(project: any) {
  const value = clean(project)
  if (!value) return null
  return {
    ...value,
    lifeArea: value.lifeArea ?? "personal",
    nextActionDueAt: value.nextActionDueAt ?? null,
    publicSlug: value.publicSlug ?? null,
    shippedAt: value.shippedAt ?? null,
  }
}

function cleanCheckIn(checkIn: any) {
  const value = clean(checkIn)
  if (!value) return null
  return { ...value, helpful: value.helpful ?? null }
}

function cleanWeeklyReview(review: any) {
  const value = clean(review)
  if (!value) return null
  return { ...value, narrative: value.userEditedNarrative ?? value.narrative }
}

async function userByLegacyId(ctx: any, userId: string) {
  return ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", userId)).unique()
}

async function ownedProject(ctx: any, projectId: string, userId: string) {
  const project = await ctx.db.query("growthProjects").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", projectId)).unique()
  return project?.userId === userId ? project : null
}

async function preferenceForUser(ctx: any, userId: string) {
  return ctx.db.query("userPreferences").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique()
}

async function streakForProject(ctx: any, projectId: string) {
  return ctx.db.query("growthStreaks").withIndex("by_project", (q: any) => q.eq("projectId", projectId)).unique()
}

async function event(ctx: any, input: { userId: string; projectId: string; eventType: string; actor?: "user" | "system" | "github" | "billing"; metadata?: unknown; idempotencyKey?: string }) {
  if (input.idempotencyKey) {
    const existing = await ctx.db.query("projectEvents").withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", input.idempotencyKey)).unique()
    if (existing) return existing._id
  }
  return ctx.db.insert("projectEvents", {
    legacyId: id(),
    userId: input.userId,
    projectId: input.projectId,
    eventType: input.eventType,
    actor: input.actor ?? "user",
    metadataJson: JSON.stringify(input.metadata ?? {}),
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    schemaVersion: 1,
    createdAt: now(),
  })
}

export const getOnboardingState = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const [user, preferences, projects] = await Promise.all([
      userByLegacyId(ctx, userId),
      preferenceForUser(ctx, userId),
      ctx.db.query("growthProjects").withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", "active")).collect(),
    ])
    if (!user) return null
    return {
      completed: Boolean(user.onboardingCompletedAt && preferences && projects.length > 0),
      user: { id: user.legacyId, name: user.name, email: user.email, timezone: user.timezone ?? "UTC", planTier: normalizedPlan(user.planTier) },
      preferences: preferences ? clean(preferences) : null,
      project: projects[0] ? cleanProject(projects[0]) : null,
    }
  },
})

export const completeOnboarding = internalMutation({
  args: {
    userId: v.string(),
    project: v.object({
      name: v.string(), lifeArea: v.union(v.literal("health"), v.literal("career"), v.literal("relationships"), v.literal("learning"), v.literal("finances"), v.literal("creativity"), v.literal("wellbeing"), v.literal("personal")), description: v.string(), whyItMatters: v.string(), definitionOfShipped: v.string(),
      targetShipDate: v.string(), currentNextAction: v.string(), nextActionDueAt: v.optional(v.string()),
    }),
    preferences: v.object({
      coachTone: toneValidator, checkInCadence: cadenceValidator, checkInHour: v.number(), checkInMinute: v.number(),
      timezone: v.string(), emailNotifications: v.boolean(), weeklyReviewDay: v.number(), nextPromptAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await userByLegacyId(ctx, args.userId)
    if (!user) throw new Error("User not found")
    const active = await ctx.db.query("growthProjects").withIndex("by_user_status", (q: any) => q.eq("userId", args.userId).eq("status", "active")).collect()
    if (active.length > 0) throw new Error("You already have an active commitment.")

    const timestamp = now()
    const projectId = id()
    const projectDoc = await ctx.db.insert("growthProjects", {
      legacyId: projectId,
      userId: args.userId,
      ...args.project,
      status: "active",
      isPrimary: true,
      isPublic: false,
      showPublicStreak: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    const existingPreferences = await preferenceForUser(ctx, args.userId)
    const preferenceFields = {
      userId: args.userId,
      coachTone: args.preferences.coachTone,
      checkInCadence: args.preferences.checkInCadence,
      checkInHour: args.preferences.checkInHour,
      checkInMinute: args.preferences.checkInMinute,
      timezone: args.preferences.timezone,
      emailNotifications: args.preferences.emailNotifications,
      weeklyReviewDay: args.preferences.weeklyReviewDay,
      updatedAt: timestamp,
    }
    if (existingPreferences) await ctx.db.patch(existingPreferences._id, preferenceFields)
    else await ctx.db.insert("userPreferences", { ...preferenceFields, createdAt: timestamp })

    await ctx.db.insert("checkInSchedules", {
      legacyId: id(), userId: args.userId, projectId,
      cadence: args.preferences.checkInCadence,
      localHour: args.preferences.checkInHour,
      localMinute: args.preferences.checkInMinute,
      timezone: args.preferences.timezone,
      nextPromptAt: args.preferences.nextPromptAt,
      isActive: true, version: 1, createdAt: timestamp, updatedAt: timestamp,
    })
    await ctx.db.insert("growthStreaks", {
      userId: args.userId, projectId, currentStreak: 0, longestStreak: 0, missCount: 0, recoveryCount: 0, updatedAt: timestamp,
    })
    await ctx.db.patch(user._id, { timezone: args.preferences.timezone, onboardingCompletedAt: timestamp, updatedAt: timestamp })
    const referral = await ctx.db.query("referrals").withIndex("by_referred", (q: any) => q.eq("referredUserId", args.userId)).unique()
    if (referral?.status === "signed_up") await ctx.db.patch(referral._id, { activatedAt: timestamp, status: "activated" })
    await event(ctx, { userId: args.userId, projectId, eventType: "project_created", metadata: { targetShipDate: args.project.targetShipDate } })
    await event(ctx, { userId: args.userId, projectId, eventType: "next_action_committed", metadata: { nextAction: args.project.currentNextAction } })
    return cleanProject(await ctx.db.get(projectDoc))
  },
})

export const getDashboard = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await userByLegacyId(ctx, userId)
    if (!user) return null
    const [preferences, projects, checkIns, patterns, reviews] = await Promise.all([
      preferenceForUser(ctx, userId),
      ctx.db.query("growthProjects").withIndex("by_user_primary", (q: any) => q.eq("userId", userId)).collect(),
      ctx.db.query("growthCheckIns").withIndex("by_user_time", (q: any) => q.eq("userId", userId)).order("desc").take(12),
      ctx.db.query("patternInsights").withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", "active")).collect(),
      ctx.db.query("growthWeeklyReviews").withIndex("by_user_time", (q: any) => q.eq("userId", userId)).order("desc").take(1),
    ])
    const sortedProjects = projects.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt))
    const primaryProject = sortedProjects.find((project: any) => project.isPrimary && project.status === "active") ?? sortedProjects.find((project: any) => project.status === "active") ?? null
    const [streak, schedule, prompts] = primaryProject
      ? await Promise.all([streakForProject(ctx, primaryProject.legacyId), ctx.db.query("checkInSchedules").withIndex("by_project", (q: any) => q.eq("projectId", primaryProject.legacyId)).unique(), ctx.db.query("checkInPrompts").withIndex("by_project_time", (q: any) => q.eq("projectId", primaryProject.legacyId)).order("desc").take(5)])
      : [null, null, []]
    const currentPrompt = prompts.find((prompt: any) => prompt.status === "scheduled" || prompt.status === "sent" || prompt.status === "opened")
    return {
      user: {
        id: user.legacyId, name: user.name, email: user.email, planTier: normalizedPlan(user.planTier),
        timezone: user.timezone ?? preferences?.timezone ?? "UTC", onboardingCompletedAt: user.onboardingCompletedAt ?? null,
      },
      preferences: preferences ? clean(preferences) : null,
      projects: sortedProjects.map(cleanProject),
      primaryProject: cleanProject(primaryProject),
      streak: streak ? { projectId: streak.projectId, currentStreak: streak.currentStreak, longestStreak: streak.longestStreak, lastQualifyingDate: streak.lastQualifyingDate ?? null, missCount: streak.missCount, recoveryCount: streak.recoveryCount } : null,
      recentCheckIns: checkIns.map(cleanCheckIn),
      activePatterns: patterns.map(clean),
      latestReview: reviews[0] ? cleanWeeklyReview(reviews[0]) : null,
      nextPromptAt: schedule?.nextPromptAt ?? null,
      currentPromptId: currentPrompt?.legacyId ?? null,
    }
  },
})

export const createProject = internalMutation({
  args: {
    userId: v.string(), name: v.string(), lifeArea: v.union(v.literal("health"), v.literal("career"), v.literal("relationships"), v.literal("learning"), v.literal("finances"), v.literal("creativity"), v.literal("wellbeing"), v.literal("personal")), description: v.string(), whyItMatters: v.string(), definitionOfShipped: v.string(),
    targetShipDate: v.string(), currentNextAction: v.string(), nextActionDueAt: v.optional(v.string()), nextPromptAt: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await userByLegacyId(ctx, args.userId)
    if (!user) throw new Error("User not found")
    const active = await ctx.db.query("growthProjects").withIndex("by_user_status", (q: any) => q.eq("userId", args.userId).eq("status", "active")).collect()
    const limit = normalizedPlan(user.planTier) === "free" ? 1 : 10
    if (active.length >= limit) throw new Error(limit === 1 ? "Free accounts can have one active commitment." : "Active project limit reached.")
    const preferences = await preferenceForUser(ctx, args.userId)
    if (!preferences) throw new Error("Complete onboarding first")
    const timestamp = now()
    const projectId = id()
    const docId = await ctx.db.insert("growthProjects", {
      legacyId: projectId, userId: args.userId, name: args.name, description: args.description, whyItMatters: args.whyItMatters,
      definitionOfShipped: args.definitionOfShipped, targetShipDate: args.targetShipDate, status: "active",
      isPrimary: active.length === 0, currentNextAction: args.currentNextAction,
      ...(args.nextActionDueAt ? { nextActionDueAt: args.nextActionDueAt } : {}),
      isPublic: false, showPublicStreak: true, createdAt: timestamp, updatedAt: timestamp,
    })
    await ctx.db.insert("checkInSchedules", {
      legacyId: id(), userId: args.userId, projectId, cadence: preferences.checkInCadence,
      localHour: preferences.checkInHour, localMinute: preferences.checkInMinute, timezone: preferences.timezone,
      nextPromptAt: args.nextPromptAt, isActive: true, version: 1, createdAt: timestamp, updatedAt: timestamp,
    })
    await ctx.db.insert("growthStreaks", { userId: args.userId, projectId, currentStreak: 0, longestStreak: 0, missCount: 0, recoveryCount: 0, updatedAt: timestamp })
    await event(ctx, { userId: args.userId, projectId, eventType: "project_created" })
    return cleanProject(await ctx.db.get(docId))
  },
})

export const getProjectWorkspace = internalQuery({
  args: { userId: v.string(), projectId: v.string() },
  handler: async (ctx, args) => {
    const project = await ownedProject(ctx, args.projectId, args.userId)
    if (!project) return null
    const [checkIns, streak, patterns, reviews, schedule, evidence, prompts] = await Promise.all([
      ctx.db.query("growthCheckIns").withIndex("by_project_time", (q: any) => q.eq("projectId", args.projectId)).order("desc").take(50),
      streakForProject(ctx, args.projectId),
      ctx.db.query("patternInsights").withIndex("by_project_status", (q: any) => q.eq("projectId", args.projectId).eq("status", "active")).collect(),
      ctx.db.query("growthWeeklyReviews").withIndex("by_project_week", (q: any) => q.eq("projectId", args.projectId)).order("desc").take(12),
      ctx.db.query("checkInSchedules").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).unique(),
      ctx.db.query("growthEvidence").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).collect(),
      ctx.db.query("checkInPrompts").withIndex("by_project_time", (q: any) => q.eq("projectId", args.projectId)).order("desc").take(5),
    ])
    const currentPrompt = prompts.find((prompt: any) => prompt.status === "scheduled" || prompt.status === "sent" || prompt.status === "opened")
    return {
      project: cleanProject(project), checkIns: checkIns.map(cleanCheckIn), streak: streak ? clean(streak) : null,
      patterns: patterns.map(clean), reviews: reviews.map(cleanWeeklyReview), schedule: schedule ? clean(schedule) : null, evidence: evidence.map(clean), currentPromptId: currentPrompt?.legacyId ?? null,
    }
  },
})

export const submitCheckIn = internalMutation({
  args: {
    userId: v.string(), projectId: v.string(), promptId: v.optional(v.string()), response: v.string(), state: checkInStateValidator,
    classification: classificationValidator, confidence: v.number(), evidencePhrase: v.string(), aiResponse: v.string(),
    followUpQuestion: v.string(), nextAction: v.string(), nextActionDueAt: v.optional(v.string()), evidenceUrl: v.string(),
    modelName: v.string(), promptVersion: v.string(), localDate: v.string(), isMeaningful: v.boolean(),
    streak: v.object({ currentStreak: v.number(), longestStreak: v.number(), lastQualifyingDate: v.string() }),
  },
  handler: async (ctx, args) => {
    const project = await ownedProject(ctx, args.projectId, args.userId)
    if (!project || project.status !== "active") throw new Error("Active project not found")
    const timestamp = now()
    const legacyId = id()
    const checkInId = await ctx.db.insert("growthCheckIns", {
      legacyId, userId: args.userId, projectId: args.projectId,
      ...(args.promptId ? { promptId: args.promptId } : {}), response: args.response, state: args.state,
      classification: args.classification, confidence: args.confidence, evidencePhrase: args.evidencePhrase,
      aiResponse: args.aiResponse, followUpQuestion: args.followUpQuestion, nextAction: args.nextAction,
      ...(args.nextActionDueAt ? { nextActionDueAt: args.nextActionDueAt } : {}), evidenceUrl: args.evidenceUrl,
      modelName: args.modelName, promptVersion: args.promptVersion, localDate: args.localDate, createdAt: timestamp, updatedAt: timestamp,
    })
    await ctx.db.patch(project._id, { currentNextAction: args.nextAction, ...(args.nextActionDueAt ? { nextActionDueAt: args.nextActionDueAt } : {}), updatedAt: timestamp })
    if (args.promptId) {
      const prompt = await ctx.db.query("checkInPrompts").filter((q: any) => q.eq(q.field("legacyId"), args.promptId)).first()
      if (prompt && prompt.userId === args.userId) await ctx.db.patch(prompt._id, { status: "completed", respondedAt: timestamp })
    }
    const streak = await streakForProject(ctx, args.projectId)
    if (streak && args.isMeaningful) {
      await ctx.db.patch(streak._id, { ...args.streak, recoveryCount: streak.currentStreak === 0 && streak.missCount > 0 ? streak.recoveryCount + 1 : streak.recoveryCount, updatedAt: timestamp })
    }
    if (args.evidenceUrl) {
      await ctx.db.insert("growthEvidence", {
        legacyId: id(), userId: args.userId, projectId: args.projectId, checkInId: legacyId,
        type: "url", url: args.evidenceUrl, summary: args.evidencePhrase || "Evidence submitted with check-in",
        verificationStatus: "unverified", createdAt: timestamp,
      })
    }
    await event(ctx, { userId: args.userId, projectId: args.projectId, eventType: "checkin_completed", metadata: { classification: args.classification, checkInId: legacyId } })
    await event(ctx, { userId: args.userId, projectId: args.projectId, eventType: "next_action_committed", metadata: { nextAction: args.nextAction } })
    return cleanCheckIn(await ctx.db.get(checkInId))
  },
})

export const setCheckInFeedback = internalMutation({
  args: { userId: v.string(), checkInId: v.string(), helpful: v.boolean(), correction: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const checkIn = await ctx.db.query("growthCheckIns").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", args.checkInId)).unique()
    if (!checkIn || checkIn.userId !== args.userId) return false
    await ctx.db.patch(checkIn._id, { helpful: args.helpful, ...(args.correction ? { correction: args.correction } : {}), updatedAt: now() })
    return true
  },
})

export const updateProjectStatus = internalMutation({
  args: { userId: v.string(), projectId: v.string(), status: projectStatusValidator, reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const project = await ownedProject(ctx, args.projectId, args.userId)
    if (!project) return null
    const timestamp = now()
    await ctx.db.patch(project._id, {
      status: args.status, ...(args.reason ? { pauseReason: args.reason } : {}),
      ...(args.status === "shipped" ? { shippedAt: timestamp } : {}),
      ...(args.status === "archived" ? { archivedAt: timestamp } : {}), updatedAt: timestamp,
    })
    const schedule = await ctx.db.query("checkInSchedules").withIndex("by_project", (q: any) => q.eq("projectId", args.projectId)).unique()
    if (schedule) await ctx.db.patch(schedule._id, { isActive: args.status === "active", updatedAt: timestamp })
    await event(ctx, { userId: args.userId, projectId: args.projectId, eventType: `project_${args.status}`, metadata: { reason: args.reason ?? "" } })
    return cleanProject(await ctx.db.get(project._id))
  },
})

export const updatePreferences = internalMutation({
  args: {
    userId: v.string(), coachTone: toneValidator, checkInCadence: cadenceValidator, checkInHour: v.number(),
    checkInMinute: v.number(), timezone: v.string(), emailNotifications: v.boolean(), weeklyReviewDay: v.number(), nextPromptAt: v.string(),
  },
  handler: async (ctx, args) => {
    const preferences = await preferenceForUser(ctx, args.userId)
    if (!preferences) throw new Error("Preferences not found")
    const timestamp = now()
    await ctx.db.patch(preferences._id, {
      coachTone: args.coachTone, checkInCadence: args.checkInCadence, checkInHour: args.checkInHour,
      checkInMinute: args.checkInMinute, timezone: args.timezone, emailNotifications: args.emailNotifications,
      weeklyReviewDay: args.weeklyReviewDay, updatedAt: timestamp,
    })
    const schedules = await ctx.db.query("checkInSchedules").filter((q: any) => q.eq(q.field("userId"), args.userId)).collect()
    await Promise.all(schedules.map((schedule: any) => ctx.db.patch(schedule._id, {
      cadence: args.checkInCadence, localHour: args.checkInHour, localMinute: args.checkInMinute,
      timezone: args.timezone, nextPromptAt: args.nextPromptAt, version: schedule.version + 1, updatedAt: timestamp,
    })))
    const user = await userByLegacyId(ctx, args.userId)
    if (user) await ctx.db.patch(user._id, { timezone: args.timezone, updatedAt: timestamp })
    return clean(await ctx.db.get(preferences._id))
  },
})

export const upsertPattern = internalMutation({
  args: {
    userId: v.string(), projectId: v.string(), type: v.union(v.literal("repeated_blocker"), v.literal("vague_checkins"), v.literal("carried_action"), v.literal("late_stage_stall"), v.literal("schedule_mismatch")),
    summary: v.string(), confidence: v.number(), supportingCheckInIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ownedProject(ctx, args.projectId, args.userId)
    if (!project) throw new Error("Project not found")
    const existing = await ctx.db.query("patternInsights").withIndex("by_project_status", (q: any) => q.eq("projectId", args.projectId).eq("status", "active")).collect()
    const match = existing.find((item: any) => item.type === args.type)
    const timestamp = now()
    if (match) {
      await ctx.db.patch(match._id, { summary: args.summary, confidence: args.confidence, supportingCheckInIds: args.supportingCheckInIds, updatedAt: timestamp })
      return clean(await ctx.db.get(match._id))
    }
    const docId = await ctx.db.insert("patternInsights", { legacyId: id(), ...args, status: "active", createdAt: timestamp, updatedAt: timestamp })
    return clean(await ctx.db.get(docId))
  },
})

export const setPatternStatus = internalMutation({
  args: { userId: v.string(), patternId: v.string(), status: v.union(v.literal("acknowledged"), v.literal("dismissed"), v.literal("resolved")) },
  handler: async (ctx, args) => {
    const pattern = await ctx.db.query("patternInsights").filter((q: any) => q.eq(q.field("legacyId"), args.patternId)).first()
    if (!pattern || pattern.userId !== args.userId) return false
    await ctx.db.patch(pattern._id, { status: args.status, updatedAt: now() })
    return true
  },
})

export const upsertWeeklyReview = internalMutation({
  args: {
    userId: v.string(), projectId: v.string(), weekStart: v.string(), checkInsCompleted: v.number(), promptsMissed: v.number(),
    meaningfulProgressCount: v.number(), shippedSummary: v.string(), blockers: v.string(), observation: v.string(),
    nextWeekFocus: v.string(), narrative: v.string(), modelName: v.string(), promptVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ownedProject(ctx, args.projectId, args.userId)
    if (!project) throw new Error("Project not found")
    const existing = await ctx.db.query("growthWeeklyReviews").withIndex("by_project_week", (q: any) => q.eq("projectId", args.projectId).eq("weekStart", args.weekStart)).unique()
    const timestamp = now()
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: timestamp })
      return cleanWeeklyReview(await ctx.db.get(existing._id))
    }
    const docId = await ctx.db.insert("growthWeeklyReviews", { legacyId: id(), ...args, createdAt: timestamp, updatedAt: timestamp })
    await event(ctx, { userId: args.userId, projectId: args.projectId, eventType: "weekly_review_generated", actor: "system", metadata: { weekStart: args.weekStart } })
    return cleanWeeklyReview(await ctx.db.get(docId))
  },
})

export const editWeeklyReview = internalMutation({
  args: { userId: v.string(), reviewId: v.string(), narrative: v.string() },
  handler: async (ctx, args) => {
    const review = await ctx.db.query("growthWeeklyReviews").filter((q: any) => q.eq(q.field("legacyId"), args.reviewId)).first()
    if (!review || review.userId !== args.userId) return false
    await ctx.db.patch(review._id, { userEditedNarrative: args.narrative, updatedAt: now() })
    return true
  },
})

export const setPublicProject = internalMutation({
  args: { userId: v.string(), projectId: v.string(), isPublic: v.boolean(), publicSlug: v.optional(v.string()), showPublicStreak: v.boolean() },
  handler: async (ctx, args) => {
    const project = await ownedProject(ctx, args.projectId, args.userId)
    if (!project) throw new Error("Project not found")
    if (args.isPublic && !args.publicSlug) throw new Error("Public slug is required")
    if (args.publicSlug) {
      const existing = await ctx.db.query("growthProjects").withIndex("by_public_slug", (q: any) => q.eq("publicSlug", args.publicSlug)).unique()
      if (existing && existing._id !== project._id) throw new Error("That public URL is already taken")
    }
    await ctx.db.patch(project._id, { isPublic: args.isPublic, ...(args.publicSlug ? { publicSlug: args.publicSlug } : {}), showPublicStreak: args.showPublicStreak, updatedAt: now() })
    return cleanProject(await ctx.db.get(project._id))
  },
})

export const getPublicProject = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const project = await ctx.db.query("growthProjects").withIndex("by_public_slug", (q: any) => q.eq("publicSlug", slug)).unique()
    if (!project?.isPublic) return null
    const [streak, checkIns] = await Promise.all([
      streakForProject(ctx, project.legacyId),
      ctx.db.query("growthCheckIns").withIndex("by_project_time", (q: any) => q.eq("projectId", project.legacyId)).order("desc").take(30),
    ])
    return {
      project: { name: project.name, description: project.description, definitionOfShipped: project.definitionOfShipped, targetShipDate: project.targetShipDate, status: project.status, shippedAt: project.shippedAt ?? null },
      streak: project.showPublicStreak && streak ? { currentStreak: streak.currentStreak, longestStreak: streak.longestStreak } : null,
      checkInCount: checkIns.length,
      meaningfulProgressCount: checkIns.filter((item: any) => item.classification === "meaningful_progress").length,
    }
  },
})

export const createReferral = internalMutation({
  args: { userId: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("referrals").withIndex("by_referrer", (q: any) => q.eq("referrerUserId", args.userId)).first()
    if (existing) return clean(existing)
    const codeTaken = await ctx.db.query("referrals").withIndex("by_code", (q: any) => q.eq("code", args.code)).unique()
    if (codeTaken) throw new Error("Referral code already exists")
    const docId = await ctx.db.insert("referrals", { referrerUserId: args.userId, code: args.code, status: "created", createdAt: now() })
    return clean(await ctx.db.get(docId))
  },
})

export const getReferral = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const referral = await ctx.db.query("referrals").withIndex("by_referrer", (q: any) => q.eq("referrerUserId", userId)).first()
    return referral ? clean(referral) : null
  },
})

export const claimReferral = internalMutation({
  args: { code: v.string(), referredUserId: v.string() },
  handler: async (ctx, args) => {
    const referral = await ctx.db.query("referrals").withIndex("by_code", (q: any) => q.eq("code", args.code)).unique()
    if (!referral || referral.referrerUserId === args.referredUserId || referral.referredUserId) return false
    await ctx.db.patch(referral._id, { referredUserId: args.referredUserId, clickedAt: referral.clickedAt ?? now(), signedUpAt: now(), status: "signed_up" })
    return true
  },
})

export const recordBillingEvent = internalMutation({
  args: {
    providerEventId: v.string(), eventType: v.string(), payloadDigest: v.string(), userId: v.optional(v.string()),
    providerSubscriptionId: v.optional(v.string()), subscriptionStatus: v.optional(v.string()), periodStart: v.optional(v.string()), periodEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const duplicate = await ctx.db.query("billingEvents").withIndex("by_provider_event", (q: any) => q.eq("providerEventId", args.providerEventId)).unique()
    if (duplicate) return { duplicate: true }
    const timestamp = now()
    const eventId = await ctx.db.insert("billingEvents", {
      provider: "razorpay", providerEventId: args.providerEventId, eventType: args.eventType,
      payloadDigest: args.payloadDigest, status: "received", createdAt: timestamp,
    })
    try {
      if (args.userId && args.providerSubscriptionId && args.subscriptionStatus) {
        const existing = await ctx.db.query("subscriptions").withIndex("by_provider_subscription", (q: any) => q.eq("providerSubscriptionId", args.providerSubscriptionId)).unique()
        const active = ["active", "authenticated", "charged"].includes(args.subscriptionStatus)
        const fields = {
          userId: args.userId, provider: "razorpay" as const, providerSubscriptionId: args.providerSubscriptionId,
          planTier: "pro" as const, status: args.subscriptionStatus,
          ...(args.periodStart ? { periodStart: args.periodStart } : {}), ...(args.periodEnd ? { periodEnd: args.periodEnd } : {}),
          cancelAtPeriodEnd: args.subscriptionStatus === "cancelled", amount: 99900, currency: "INR", updatedAt: timestamp,
        }
        if (existing) await ctx.db.patch(existing._id, fields)
        else await ctx.db.insert("subscriptions", { ...fields, createdAt: timestamp })
        const user = await userByLegacyId(ctx, args.userId)
        if (user) await ctx.db.patch(user._id, { planTier: active ? "pro" : "free", updatedAt: timestamp })
      }
      await ctx.db.patch(eventId, { status: "processed", processedAt: timestamp })
      return { duplicate: false }
    } catch (error) {
      await ctx.db.patch(eventId, { status: "failed", failureReason: error instanceof Error ? error.message.slice(0, 300) : "Unknown error" })
      throw error
    }
  },
})

export const upsertGithubConnection = internalMutation({
  args: { userId: v.string(), githubUserId: v.string(), login: v.string(), installationId: v.optional(v.string()), selectedRepositories: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("githubConnections").withIndex("by_user", (q: any) => q.eq("userId", args.userId)).unique()
    const timestamp = now()
    const fields = { ...args, syncStatus: "connected" as const, updatedAt: timestamp }
    if (existing) {
      await ctx.db.patch(existing._id, fields)
      return clean(await ctx.db.get(existing._id))
    }
    const docId = await ctx.db.insert("githubConnections", { ...fields, createdAt: timestamp })
    return clean(await ctx.db.get(docId))
  },
})

export const getGithubConnection = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const connection = await ctx.db.query("githubConnections").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique()
    return connection ? clean(connection) : null
  },
})

export const disconnectGithub = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const connection = await ctx.db.query("githubConnections").withIndex("by_user", (q: any) => q.eq("userId", userId)).unique()
    if (!connection) return false
    await ctx.db.patch(connection._id, { syncStatus: "disconnected", selectedRepositories: [], updatedAt: now() })
    return true
  },
})

export const listDueSchedules = internalQuery({
  args: { dueAt: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const schedules = await ctx.db.query("checkInSchedules").withIndex("by_due", (q: any) => q.eq("isActive", true).lte("nextPromptAt", args.dueAt)).take(Math.min(args.limit, 100))
    const results = []
    for (const schedule of schedules) {
      const [user, project, preferences] = await Promise.all([
        userByLegacyId(ctx, schedule.userId), ownedProject(ctx, schedule.projectId, schedule.userId), preferenceForUser(ctx, schedule.userId),
      ])
      if (user && project?.status === "active") results.push({
        id: schedule.legacyId, userId: schedule.userId, projectId: schedule.projectId, projectName: project.name,
        recipient: user.email, cadence: schedule.cadence, timezone: schedule.timezone, localHour: schedule.localHour,
        localMinute: schedule.localMinute, nextPromptAt: schedule.nextPromptAt, emailEnabled: preferences?.emailNotifications ?? false,
      })
    }
    return results
  },
})

export const claimScheduledPrompt = internalMutation({
  args: { scheduleId: v.string(), expectedPromptAt: v.string(), nextPromptAt: v.string() },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.query("checkInSchedules").filter((q: any) => q.eq(q.field("legacyId"), args.scheduleId)).first()
    if (!schedule || !schedule.isActive || schedule.nextPromptAt !== args.expectedPromptAt) return { claimed: false }
    const key = `prompt:${schedule.legacyId}:${args.expectedPromptAt}`
    const duplicate = await ctx.db.query("checkInPrompts").withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", key)).unique()
    if (duplicate) return { claimed: false }
    const timestamp = now()
    const promptLegacyId = id()
    await ctx.db.insert("checkInPrompts", { legacyId: promptLegacyId, userId: schedule.userId, projectId: schedule.projectId, scheduleId: schedule.legacyId, scheduledFor: args.expectedPromptAt, status: "scheduled", idempotencyKey: key, createdAt: timestamp })
    const [user, preferences] = await Promise.all([userByLegacyId(ctx, schedule.userId), preferenceForUser(ctx, schedule.userId)])
    if (user && preferences?.emailNotifications) await ctx.db.insert("notifications", {
      legacyId: id(), userId: schedule.userId, projectId: schedule.projectId, promptId: promptLegacyId, channel: "email",
      template: "check_in_due", recipient: user.email, status: "scheduled", scheduledAt: args.expectedPromptAt,
      attemptCount: 0, idempotencyKey: `email:${key}`, createdAt: timestamp,
    })
    await ctx.db.patch(schedule._id, { lastPromptAt: args.expectedPromptAt, nextPromptAt: args.nextPromptAt, updatedAt: timestamp })
    await event(ctx, { userId: schedule.userId, projectId: schedule.projectId, eventType: "prompt_scheduled", actor: "system", idempotencyKey: key })
    return { claimed: true, promptId: promptLegacyId }
  },
})

export const listDueNotifications = internalQuery({
  args: { dueAt: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const notifications = await ctx.db.query("notifications").withIndex("by_status_time", (q: any) => q.eq("status", "scheduled").lte("scheduledAt", args.dueAt)).take(Math.min(args.limit, 100))
    const result = []
    for (const notification of notifications) {
      const project = notification.projectId ? await ownedProject(ctx, notification.projectId, notification.userId) : null
      result.push({ id: notification.legacyId, recipient: notification.recipient, template: notification.template, projectId: notification.projectId, projectName: project?.name ?? "your project", attemptCount: notification.attemptCount })
    }
    return result
  },
})

export const finishNotification = internalMutation({
  args: { notificationId: v.string(), sent: v.boolean(), providerMessageId: v.optional(v.string()), failureCategory: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const notification = await ctx.db.query("notifications").filter((q: any) => q.eq(q.field("legacyId"), args.notificationId)).first()
    if (!notification || notification.status !== "scheduled") return false
    const timestamp = now()
    const attempts = notification.attemptCount + 1
    const retryAt = new Date(Date.now() + 15 * 60_000).toISOString()
    await ctx.db.patch(notification._id, args.sent
      ? { status: "sent", sentAt: timestamp, providerMessageId: args.providerMessageId, attemptCount: attempts }
      : attempts < 3
        ? { status: "scheduled", scheduledAt: retryAt, failureCategory: args.failureCategory ?? "provider_error", attemptCount: attempts, nextRetryAt: retryAt }
        : { status: "failed", failureCategory: args.failureCategory ?? "provider_error", attemptCount: attempts })
    if (args.sent && notification.promptId) {
      const prompt = await ctx.db.query("checkInPrompts").filter((q: any) => q.eq(q.field("legacyId"), notification.promptId)).first()
      if (prompt?.status === "scheduled") await ctx.db.patch(prompt._id, { status: "sent", sentAt: timestamp })
    }
    if (args.sent && notification.projectId) await event(ctx, { userId: notification.userId, projectId: notification.projectId, eventType: "prompt_sent", actor: "system", metadata: { channel: notification.channel }, idempotencyKey: notification.idempotencyKey })
    return true
  },
})

export const markMissedPrompts = internalMutation({
  args: { before: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const [sentPrompts, scheduledPrompts] = await Promise.all([
      ctx.db.query("checkInPrompts").withIndex("by_status_time", (q: any) => q.eq("status", "sent").lte("scheduledFor", args.before)).take(Math.min(args.limit, 100)),
      ctx.db.query("checkInPrompts").withIndex("by_status_time", (q: any) => q.eq("status", "scheduled").lte("scheduledFor", args.before)).take(Math.min(args.limit, 100)),
    ])
    const prompts = [...sentPrompts, ...scheduledPrompts].slice(0, Math.min(args.limit, 100))
    const timestamp = now()
    for (const prompt of prompts) {
      await ctx.db.patch(prompt._id, { status: "missed", missedAt: timestamp })
      const streak = await streakForProject(ctx, prompt.projectId)
      if (streak) await ctx.db.patch(streak._id, { currentStreak: 0, missCount: streak.missCount + 1, updatedAt: timestamp })
      await event(ctx, { userId: prompt.userId, projectId: prompt.projectId, eventType: "checkin_missed", actor: "system", idempotencyKey: `missed:${prompt.legacyId}` })
    }
    return { marked: prompts.length }
  },
})

export const ingestGithubActivity = internalMutation({
  args: {
    installationId: v.string(), repository: v.string(), externalEventId: v.string(),
    activityType: v.union(v.literal("commit"), v.literal("pull_request"), v.literal("merge"), v.literal("release"), v.literal("deployment")),
    title: v.string(), url: v.string(), occurredAt: v.string(),
  },
  handler: async (ctx, args) => {
    const duplicate = await ctx.db.query("githubActivity").withIndex("by_external_event", (q: any) => q.eq("externalEventId", args.externalEventId)).unique()
    if (duplicate) return { duplicate: true, linked: true }
    const connection = await ctx.db.query("githubConnections").withIndex("by_installation", (q: any) => q.eq("installationId", args.installationId)).unique()
    if (!connection || connection.syncStatus === "disconnected") return { duplicate: false, linked: false }
    const selection = connection.selectedRepositories.find((value: string) => value.endsWith(`|${args.repository}`))
    const projectId = selection?.split("|", 1)[0]
    if (!projectId || !(await ownedProject(ctx, projectId, connection.userId))) return { duplicate: false, linked: false }
    await ctx.db.insert("githubActivity", { legacyId: id(), userId: connection.userId, projectId, repositoryId: args.repository, externalEventId: args.externalEventId, activityType: args.activityType, title: args.title.slice(0, 240), url: args.url, occurredAt: args.occurredAt, createdAt: now() })
    await ctx.db.patch(connection._id, { lastSyncAt: now(), syncStatus: "connected", updatedAt: now() })
    await event(ctx, { userId: connection.userId, projectId, eventType: "github_activity_observed", actor: "github", metadata: { repository: args.repository, activityType: args.activityType, url: args.url }, idempotencyKey: `github:${args.externalEventId}` })
    return { duplicate: false, linked: true }
  },
})

export const exportUserData = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const user = await userByLegacyId(ctx, userId)
    if (!user) return null
    const projects = await ctx.db.query("growthProjects").filter((q: any) => q.eq(q.field("userId"), userId)).collect()
    const [preferences, schedules, prompts, checkIns, evidence, events, streaks, reviews, patterns, notifications, subscriptions, githubConnections, githubActivity, referrals, comparisons] = await Promise.all([
      ctx.db.query("userPreferences").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("checkInSchedules").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("checkInPrompts").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("growthCheckIns").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("growthEvidence").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("projectEvents").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("growthStreaks").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("growthWeeklyReviews").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("patternInsights").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("notifications").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
      ctx.db.query("githubConnections").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
      ctx.db.query("githubActivity").filter((q: any) => q.eq(q.field("userId"), userId)).collect(),
      ctx.db.query("referrals").withIndex("by_referrer", (q: any) => q.eq("referrerUserId", userId)).collect(),
      ctx.db.query("comparisons").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect(),
    ])
    const sanitize = (rows: any[]) => rows.map(clean)
    return { exportedAt: now(), account: { id: user.legacyId, name: user.name, email: user.email, planTier: normalizedPlan(user.planTier), createdAt: user.createdAt }, preferences: sanitize(preferences), projects: sanitize(projects), schedules: sanitize(schedules), prompts: sanitize(prompts), checkIns: sanitize(checkIns), evidence: sanitize(evidence), events: sanitize(events), streaks: sanitize(streaks), weeklyReviews: sanitize(reviews), patterns: sanitize(patterns), notifications: sanitize(notifications), subscriptions: sanitize(subscriptions), githubConnections: sanitize(githubConnections), githubActivity: sanitize(githubActivity), referrals: sanitize(referrals), legacyComparisons: sanitize(comparisons) }
  },
})

export const deleteUserAccount = internalMutation({
  args: { userId: v.string(), confirmationEmail: v.string() },
  handler: async (ctx, args) => {
    const user = await userByLegacyId(ctx, args.userId)
    if (!user || user.email.toLowerCase() !== args.confirmationEmail.trim().toLowerCase()) return false
    const tableNames = ["userPreferences", "growthProjects", "checkInSchedules", "checkInPrompts", "growthCheckIns", "growthEvidence", "projectEvents", "growthStreaks", "growthWeeklyReviews", "patternInsights", "notifications", "subscriptions", "githubConnections", "githubActivity"] as const
    for (const table of tableNames) {
      const rows = await (ctx.db.query as any)(table).filter((q: any) => q.eq(q.field("userId"), args.userId)).collect()
      for (const row of rows) await ctx.db.delete(row._id)
    }
    const comparisons = await ctx.db.query("comparisons").withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId)).collect()
    for (const comparison of comparisons) {
      for (const table of ["comparisonOptions", "comparisonCriteria", "comparisonInsights", "comparisonEvidence", "comparisonSources"] as const) {
        const children = await (ctx.db.query as any)(table).filter((q: any) => q.eq(q.field("comparisonId"), comparison.legacyId)).collect()
        for (const child of children) await ctx.db.delete(child._id)
      }
      await ctx.db.delete(comparison._id)
    }
    const referrals = await ctx.db.query("referrals").filter((q: any) => q.or(q.eq(q.field("referrerUserId"), args.userId), q.eq(q.field("referredUserId"), args.userId))).collect()
    for (const referral of referrals) await ctx.db.delete(referral._id)
    await ctx.db.delete(user._id)
    return true
  },
})
