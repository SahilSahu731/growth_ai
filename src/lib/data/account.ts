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
  conversations: Array<{ id: string; title: string }>
  preferences: {
    coachTone: CoachTone
    timezone: string
    emailNotifications: boolean
  }
}

export function getAccountOverview(userId: string): Promise<AccountOverview | null> {
  return convexQuery("account:getOverview", { userId })
}

export function updateAccountPreferences(input: {
  userId: string
  coachTone: CoachTone
  timezone: string
  emailNotifications: boolean
}) {
  return convexMutation("account:updatePreferences", input)
}

export function exportUserData(userId: string): Promise<Record<string, unknown> | null> {
  return convexQuery("account:exportUserData", { userId })
}

export function deleteUserAccount(userId: string, confirmationEmail: string): Promise<boolean> {
  return convexMutation("account:deleteUserAccount", { userId, confirmationEmail })
}

export function recordBillingEvent(input: {
  providerEventId: string
  eventType: string
  payloadDigest: string
  userId?: string
  providerSubscriptionId?: string
  subscriptionStatus?: string
  periodStart?: string
  periodEnd?: string
}): Promise<{ duplicate: boolean }> {
  return convexMutation("billing:recordEvent", input)
}
