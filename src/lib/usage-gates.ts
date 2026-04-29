import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export type UserTier = "guest" | "free" | "pro" | "enterprise"

export interface UsageQuota {
  comparisons: number
  uploads: number
  researchCalls: number
}

export interface UsageLimits {
  guest: UsageQuota
  free: UsageQuota
  pro: UsageQuota
  enterprise: UsageQuota
}

export const USAGE_LIMITS: UsageLimits = {
  guest: {
    comparisons: 1, // One temporary comparison per session
    uploads: 0, // No file uploads for guests
    researchCalls: 3, // Limited research
  },
  free: {
    comparisons: 3,
    uploads: 3,
    researchCalls: 10,
  },
  pro: {
    comparisons: 100,
    uploads: 50,
    researchCalls: 500,
  },
  enterprise: {
    comparisons: 99999,
    uploads: 99999,
    researchCalls: 99999,
  },
}

export async function getUserTier(): Promise<UserTier> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return "guest"
  // TODO: Add tier from user subscription
  return "free" // Default to free for authenticated users
}

export async function checkComparisonUsage(): Promise<{
  allowed: boolean
  remaining: number
  tier: UserTier
}> {
  const tier = await getUserTier()
  const limit = USAGE_LIMITS[tier].comparisons

  if (tier === "guest") {
    // Guests have 1 temporary comparison
    return { allowed: true, remaining: 1, tier }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { allowed: false, remaining: 0, tier }
  }

  // For now, always allow (usage tracking would need db functions)
  return { allowed: true, remaining: limit, tier }
}

export async function checkUploadUsage(): Promise<{
  allowed: boolean
  remaining: number
  tier: UserTier
}> {
  const tier = await getUserTier()
  const limit = USAGE_LIMITS[tier].uploads

  if (tier === "guest") {
    return { allowed: false, remaining: 0, tier }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { allowed: false, remaining: 0, tier }
  }

  // For now, always allow (usage tracking would need db functions)
  return { allowed: true, remaining: limit, tier }
}

export async function checkResearchUsage(): Promise<{
  allowed: boolean
  remaining: number
  tier: UserTier
}> {
  const tier = await getUserTier()
  const limit = USAGE_LIMITS[tier].researchCalls

  const session = await getServerSession(authOptions)
  if (!session?.user && tier === "guest") {
    return { allowed: limit > 0, remaining: limit, tier }
  }

  if (!session?.user) {
    return { allowed: false, remaining: 0, tier }
  }

  // For now, always allow (usage tracking would need db functions)
  return { allowed: true, remaining: limit, tier }
}

export async function incrementComparisonUsage(): Promise<void> {
  // Usage will be tracked via incrementUsageCounter in db.ts
}

export async function incrementUploadUsage(): Promise<void> {
  // Usage will be tracked via incrementUsageCounter in db.ts
}

export async function incrementResearchUsage(): Promise<void> {
  // Usage will be tracked via incrementUsageCounter in db.ts
}
