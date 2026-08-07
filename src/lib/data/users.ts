import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"

export type AppUser = {
  id: string
  name: string
  email: string
  authProvider: string
  providerAccountId: string | null
  emailVerifiedAt: string | null
  planTier: UserPlanTier
  // Optional during the additive Convex rollout. Legacy deployments/records
  // imply active unless deletedAt is present.
  accountStatus?: "active" | "suspended" | "deletion_pending" | "deleted"
  suspendedAt: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type UserPlanTier = "free" | "pro" | "founder" | "team"
export async function findUserByEmail(email: string): Promise<AppUser | null> {
  return convexQuery("users:findByEmail", { email: email.trim().toLowerCase() })
}

export async function upsertOAuthUser(input: {
  email: string
  name?: string | null
  provider: "google"
  providerAccountId: string
  emailVerified: boolean
  locale?: string
}): Promise<AppUser> {
  const base = {
    email: input.email.trim().toLowerCase(),
    ...(input.name ? { name: input.name } : {}),
    provider: input.provider,
  }
  try {
    return await convexMutation("users:upsertOAuth", {
      ...base,
      providerAccountId: input.providerAccountId,
      emailVerified: input.emailVerified,
      ...(input.locale ? { locale: input.locale } : {}),
    })
  } catch (error) {
    // Keep web and Convex deploys compatible during the additive rollout. The
    // previous validator rejects the new OAuth fields as unknown; retry its old
    // shape only for that precise validation failure. Identity/linking errors
    // from the new function must never fall back to weaker behavior.
    const message = error instanceof Error ? error.message : ""
    const legacyValidator = /ArgumentValidationError|extra field|not in the validator/i.test(message)
      && /providerAccountId|emailVerified|locale/i.test(message)
    if (!legacyValidator) throw error
    return convexMutation("users:upsertOAuth", base)
  }
}
