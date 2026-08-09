/* eslint-disable @typescript-eslint/no-explicit-any */
import { PLAN_CATALOG, type PlanId } from "../../src/lib/plans"

const PAID_PRIORITY: Record<string, number> = { pro: 1, founder: 2 }

function liveSubscription(subscription: any, nowIso: string) {
  if (subscription.entitlementState === "active") {
    return !subscription.accessUntil || subscription.accessUntil > nowIso
  }
  return subscription.entitlementState === "grace" && Boolean(subscription.graceUntil && subscription.graceUntil > nowIso)
}

function liveGrant(grant: any, nowIso: string) {
  return !grant.revokedAt && grant.startsAt <= nowIso && grant.expiresAt > nowIso
}

export async function resolveEntitlements(ctx: any, userId: string, at = new Date()) {
  const nowIso = at.toISOString()
  const [subscriptions, grants] = await Promise.all([
    ctx.db.query("subscriptions").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
    ctx.db.query("entitlementGrants").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
  ])
  const paid = subscriptions.filter((item: any) => liveSubscription(item, nowIso))
  const complimentary = grants.filter((item: any) => liveGrant(item, nowIso))
  const candidates = [
    ...paid.map((item: any) => ({ plan: item.planTier as PlanId, source: "subscription" as const, expiresAt: item.accessUntil ?? item.graceUntil, grace: item.entitlementState === "grace", id: item.providerSubscriptionId })),
    ...complimentary.map((item: any) => ({ plan: item.planTier as PlanId, source: "complimentary" as const, expiresAt: item.expiresAt, grace: false, id: String(item._id) })),
  ].sort((left, right) => (PAID_PRIORITY[right.plan] ?? 0) - (PAID_PRIORITY[left.plan] ?? 0))
  const selected = candidates[0]
  const plan: PlanId = selected?.plan ?? "free"
  const catalog = PLAN_CATALOG[plan]
  return {
    plan,
    source: selected?.source ?? "free",
    sourceId: selected?.id,
    expiresAt: selected?.expiresAt,
    grace: selected?.grace ?? false,
    limits: catalog.limits,
    entitlements: catalog.entitlements,
  }
}

export async function syncCachedPlan(ctx: any, userId: string, now = new Date()) {
  const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", userId)).unique()
  if (!user) return null
  const resolved = await resolveEntitlements(ctx, userId, now)
  if (user.planTier !== resolved.plan) {
    await ctx.db.patch(user._id, { planTier: resolved.plan, updatedAt: now.toISOString() })
  }
  return resolved
}
