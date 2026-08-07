import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"
import type { UserPlanTier } from "@/lib/data/users"

export type CoachTone = "supportive" | "balanced" | "blunt"

export type AccountOverview = {
  user: {
    id: string
    name: string
    email: string
    planTier: UserPlanTier
    timezone?: string
  }
  conversations: Array<{ id: string; title: string; pinned: boolean }>
  preferences: {
    coachTone: CoachTone
    timezone: string
    emailNotifications: boolean
    messageRetentionDays: number
    termsAcceptedVersion: string | null
    privacyAcceptedVersion: string | null
    aiNoticeAcceptedVersion: string | null
  }
}

export function getAccountOverview(userId: string): Promise<AccountOverview | null> {
  return convexQuery("account:getOverview", { userId }, member(userId, "account:read"))
}

function member(userId: string, scope: string) {
  return { role: "member" as const, subject: `member:${userId}`, scope }
}

export function updateAccountPreferences(input: {
  userId: string
  coachTone: CoachTone
  timezone: string
  emailNotifications: boolean
}) {
  return convexMutation("account:updatePreferences", input, member(input.userId, "account:write"))
}

export function exportUserData(userId: string): Promise<Record<string, unknown> | null> {
  return convexQuery("account:exportUserData", { userId }, member(userId, "account:export"))
}

export function acceptLegalNotices(userId: string, versions: { termsVersion: string; privacyVersion: string; aiNoticeVersion: string }): Promise<boolean> {
  return convexMutation("account:acceptLegal", { userId, ...versions }, member(userId, "account:write"))
}

export function setAccountMessageRetention(userId: string, days: number): Promise<boolean> {
  return convexMutation("account:setMessageRetention", { userId, days }, member(userId, "account:write"))
}

export function clearAccountAiMemory(userId: string): Promise<{ conversations: number; messages: number }> {
  return convexMutation("account:clearAiMemory", { userId }, member(userId, "account:delete"))
}

export function submitAccountDataRequest(userId: string, type: "access" | "correction" | "deletion" | "restriction" | "objection", details?: string): Promise<{ id: string; status: "identity_verified" }> {
  return convexMutation("account:submitDataSubjectRequest", { userId, type, ...(details ? { details } : {}) }, member(userId, "account:write"))
}

export function requestAccountDeletion(userId: string, confirmationEmail: string): Promise<{ id: string; status: string } | null> {
  return convexMutation("account:requestAccountDeletion", { userId, confirmationEmail }, member(userId, "account:delete"))
}

export function recordBillingEvent(input: {
  providerEventId: string
  eventType: string
  payloadDigest: string
  shouldApply: boolean
  ignoreReason?: string
  userId?: string
  providerSubscriptionId?: string
  subscriptionStatus?: string
  planTier?: "pro" | "founder"
  amount?: number
  currency?: string
  periodStart?: string
  periodEnd?: string
}): Promise<{ duplicate: boolean }> {
  return convexMutation("billing:recordEvent", input, { role: "webhook", subject: "webhook:razorpay", scope: "billing:webhook" })
}

export type BillingSubscription = {
  id: string
  userId: string
  provider: "razorpay"
  providerSubscriptionId: string
  checkoutUrl?: string
  planTier: "pro" | "founder"
  status: string
  periodStart?: string
  periodEnd?: string
  cancelAtPeriodEnd: boolean
  amount: number
  currency: string
  createdAt: string
  updatedAt: string
}

export type UserBillingOverview = {
  planTier: UserPlanTier
  timezone: string
  locale: string
  current: BillingSubscription | null
  subscriptions: BillingSubscription[]
}

export function getUserBilling(userId: string): Promise<UserBillingOverview | null> {
  return convexQuery("billing:getUserBilling", { userId }, member(userId, "billing:read"))
}

export function beginBillingCheckout(userId: string, planTier: "pro" | "founder"): Promise<{ ok: true; token: string } | { ok: false; reason: "existing_subscription" | "checkout_in_progress" }> {
  return convexMutation("billing:beginCheckout", { userId, planTier }, member(userId, "billing:write"))
}

export function releaseBillingCheckout(userId: string, token: string): Promise<boolean> {
  return convexMutation("billing:releaseCheckout", { userId, token }, member(userId, "billing:write"))
}

export function completeBillingCheckout(input: { userId: string; token: string; providerSubscriptionId: string; planTier: "pro" | "founder"; amount: number; currency: string; checkoutUrl: string }): Promise<boolean> {
  return convexMutation("billing:completeCheckout", input, member(input.userId, "billing:write"))
}

export function markBillingCancellationRequested(userId: string, providerSubscriptionId: string): Promise<boolean> {
  return convexMutation("billing:markCancelRequested", { userId, providerSubscriptionId }, member(userId, "billing:write"))
}
