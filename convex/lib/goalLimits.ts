/* eslint-disable @typescript-eslint/no-explicit-any */
import { PLAN_CATALOG } from "../../src/lib/plans"
import { resolveEntitlements } from "./entitlements"

export function goalLimitForPlan(planTier: string | undefined) {
  return planTier && planTier in PLAN_CATALOG ? PLAN_CATALOG[planTier as keyof typeof PLAN_CATALOG].limits.activeGoals : PLAN_CATALOG.free.limits.activeGoals
}

async function goalLimitState(ctx: any, userId: string, planTierOverride?: string) {
  const [user, activeGoals] = await Promise.all([
    ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", userId)).unique(),
    ctx.db.query("operatorGoals").withIndex("by_user_status", (q: any) => q.eq("userId", userId).eq("status", "active")).take(100),
  ])
  if (!user) throw new Error("USER_NOT_FOUND: User not found")
  const entitlements = planTierOverride ? null : await resolveEntitlements(ctx, userId)
  return { activeGoals, limit: goalLimitForPlan(planTierOverride ?? entitlements?.plan ?? "free") }
}

export async function assertGoalCanBeActive(ctx: any, input: { userId: string; goalId?: string }) {
  const { activeGoals, limit } = await goalLimitState(ctx, input.userId)
  if (input.goalId && activeGoals.some((goal: any) => goal.legacyId === input.goalId)) return
  if (activeGoals.length >= limit) {
    throw new Error(limit === 3
      ? "GOAL_LIMIT_REACHED: Free accounts can have up to 3 active goals. Upgrade to Pro to add more."
      : "GOAL_LIMIT_REACHED: Active goal limit reached.")
  }
}

export async function assertPlanSupportsActiveGoals(ctx: any, input: { userId: string; planTier: string }) {
  const { activeGoals, limit } = await goalLimitState(ctx, input.userId, input.planTier)
  if (activeGoals.length > limit) {
    throw new Error(`GOAL_LIMIT_REACHED: This account has ${activeGoals.length} active goals; ${input.planTier} permits ${limit}. Archive goals before changing the plan.`)
  }
}
