import "server-only"

import { convexMutation, convexQuery } from "@/lib/convex-server"

export type AppUser = { id: string; name: string; email: string; passwordHash: string | null; authProvider: string; planTier: UserPlanTier; deletedAt: string | null; createdAt: string; updatedAt: string }

export type UserPlanTier = "free" | "pro" | "founder" | "team"
export async function findUserByEmail(email: string): Promise<AppUser | null> {
  return convexQuery("users:findByEmail", { email: email.trim().toLowerCase() })
}

export async function createUser(input: {
  id: string
  name: string
  email: string
  passwordHash: string
}): Promise<AppUser> {
  return convexMutation("users:create", {
    legacyId: input.id,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
  })
}

export async function upsertOAuthUser(input: {
  email: string
  name?: string | null
  provider: "google" | "github"
}): Promise<AppUser> {
  return convexMutation("users:upsertOAuth", {
    email: input.email.trim().toLowerCase(),
    ...(input.name ? { name: input.name } : {}),
    provider: input.provider,
  })
}
