/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"
import { requireServer } from "./lib/serverAuth"

function publicUser(user: any) {
  if (!user) return null
  return {
    id: user.legacyId,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash ?? null,
    authProvider: user.authProvider,
    planTier: user.planTier,
    deletedAt: user.deletedAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export const findByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requireServer(ctx)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email.trim().toLowerCase()))
      .unique()
    return publicUser(user)
  },
})

export const create = mutation({
  args: {
    legacyId: v.string(),
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const email = args.email.trim().toLowerCase()
    const existing = await ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", email)).unique()
    if (existing) throw new Error("An account with this email already exists.")

    const now = new Date().toISOString()
    const id = await ctx.db.insert("users", {
      legacyId: args.legacyId,
      name: args.name,
      email,
      passwordHash: args.passwordHash,
      authProvider: "credentials",
      planTier: "free",
      createdAt: now,
      updatedAt: now,
    })
    return publicUser(await ctx.db.get(id))
  },
})

export const upsertOAuth = mutation({
  args: { email: v.string(), name: v.optional(v.string()), provider: v.union(v.literal("google"), v.literal("github")) },
  handler: async (ctx, args) => {
    await requireServer(ctx)
    const email = args.email.trim().toLowerCase()
    const name = args.name?.trim() || email.split("@")[0] || "User"
    const existing = await ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", email)).unique()
    const now = new Date().toISOString()

    if (existing) {
      await ctx.db.patch(existing._id, { name, authProvider: args.provider, updatedAt: now })
      return publicUser({ ...existing, name, authProvider: args.provider, updatedAt: now })
    }

    const id = await ctx.db.insert("users", {
      legacyId: crypto.randomUUID(),
      name,
      email,
      authProvider: args.provider,
      planTier: "free",
      createdAt: now,
      updatedAt: now,
    })
    return publicUser(await ctx.db.get(id))
  },
})
