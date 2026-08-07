/* eslint-disable @typescript-eslint/no-explicit-any */
import { mutationGeneric as mutation, queryGeneric as query } from "convex/server"
import { v } from "convex/values"
import { requireScope } from "./lib/serverAuth"
import { identityHash } from "./lib/identityHash"

function publicUser(user: any) {
  if (!user) return null
  return {
    id: user.legacyId,
    name: user.name,
    email: user.email,
    authProvider: user.authProvider,
    providerAccountId: user.providerAccountId ?? null,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
    planTier: user.planTier,
    accountStatus: user.accountStatus ?? (user.deletedAt ? "suspended" : "active"),
    suspendedAt: user.suspendedAt ?? null,
    deletedAt: user.deletedAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export const findByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requireScope(ctx, "auth", "users:auth")
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email.trim().toLowerCase()))
      .unique()
    return publicUser(user)
  },
})

export const upsertOAuth = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    provider: v.literal("google"),
    providerAccountId: v.string(),
    emailVerified: v.boolean(),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireScope(ctx, "auth", "users:auth")
    if (!args.emailVerified) throw new Error("A verified Google email is required")
    const email = args.email.trim().toLowerCase()
    const providerAccountId = args.providerAccountId.trim()
    if (!providerAccountId) throw new Error("OAuth account identifier is required")
    const [emailHash, providerHash] = await Promise.all([identityHash(email), identityHash(providerAccountId)])
    for (const hashed of [emailHash, providerHash]) {
      const tombstone = await ctx.db.query("deletedIdentityTombstones").withIndex("by_identity_hash", (q: any) => q.eq("identityHash", hashed)).unique()
      if (tombstone) throw new Error("ACCOUNT_DELETED: This identity belongs to a deleted account and cannot be restored automatically")
    }
    const name = args.name?.trim() || email.split("@")[0] || "User"
    const [providerUser, emailUser] = await Promise.all([
      ctx.db.query("users").withIndex("by_provider_account", (q: any) => q.eq("authProvider", args.provider).eq("providerAccountId", providerAccountId)).unique(),
      ctx.db.query("users").withIndex("by_email", (q: any) => q.eq("email", email)).unique(),
    ])
    const now = new Date().toISOString()

    if (providerUser) {
      if (emailUser && emailUser._id !== providerUser._id) throw new Error("Email belongs to another account")
      const locale = providerUser.locale || !args.locale ? providerUser.locale : args.locale.slice(0, 20)
      const accountStatus = providerUser.accountStatus ?? (providerUser.deletedAt ? "suspended" : "active")
      await ctx.db.patch(providerUser._id, { email, emailVerifiedAt: now, locale, accountStatus, updatedAt: now })
      return publicUser({ ...providerUser, email, emailVerifiedAt: now, locale, accountStatus, updatedAt: now })
    }

    if (emailUser) {
      if (emailUser.providerAccountId && emailUser.providerAccountId !== providerAccountId) {
        throw new Error("Account is already linked to another Google identity")
      }
      await ctx.db.patch(emailUser._id, {
        authProvider: args.provider,
        providerAccountId,
        emailVerifiedAt: now,
        accountStatus: emailUser.accountStatus ?? (emailUser.deletedAt ? "suspended" : "active"),
        ...(emailUser.locale || !args.locale ? {} : { locale: args.locale.slice(0, 20) }),
        updatedAt: now,
      })
      return publicUser({ ...emailUser, authProvider: args.provider, providerAccountId, emailVerifiedAt: now, updatedAt: now })
    }

    const id = await ctx.db.insert("users", {
      legacyId: crypto.randomUUID(),
      name,
      email,
      authProvider: args.provider,
      providerAccountId,
      emailVerifiedAt: now,
      ...(args.locale ? { locale: args.locale.slice(0, 20) } : {}),
      planTier: "free",
      accountStatus: "active",
      createdAt: now,
      updatedAt: now,
    })
    return publicUser(await ctx.db.get(id))
  },
})
