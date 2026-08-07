/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it, vi } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")
const exportIdentity = { tokenIdentifier: "test|member", subject: "member:large-user", role: "member", scope: "account:export" }
const deleteIdentity = { tokenIdentifier: "test|member", subject: "member:large-user", role: "member", scope: "account:delete" }

describe("account portability and deletion", () => {
  it("exports and deletes a large synthetic account without leaving owned records", async () => {
    const test = convexTest(schema, modules)
    const timestamp = "2026-08-07T00:00:00.000Z"
    await test.run(async (ctx) => {
      await ctx.db.insert("users", {
        legacyId: "large-user", name: "Large Fixture", email: "large@example.test", authProvider: "google", providerAccountId: "large-subject",
        emailVerifiedAt: timestamp, accountStatus: "active", planTier: "free", createdAt: timestamp, updatedAt: timestamp,
      })
      await ctx.db.insert("operatorConversations", {
        legacyId: "large-conversation", userId: "large-user", title: "Large fixture", state: "discovery", createdAt: timestamp, updatedAt: timestamp,
      })
      for (let index = 0; index < 150; index += 1) {
        await ctx.db.insert("operatorMessages", {
          legacyId: `large-message-${index}`, userId: "large-user", conversationId: "large-conversation", role: "user", content: `Synthetic ${index}`,
          quickReplies: [], taskDrafts: [], createdAt: new Date(Date.parse(timestamp) + index * 1000).toISOString(),
        })
      }
      await ctx.db.insert("aiDailyUsage", { userId: "large-user", date: "2026-08-07", requests: 1, inputTokens: 10, outputTokens: 5, updatedAt: timestamp })
    })

    const exported = await test.withIdentity(exportIdentity).query(api.account.exportUserData, { userId: "large-user" })
    expect(exported?.messages).toHaveLength(150)
    expect(exported?.account.email).toBe("large@example.test")

    await expect(test.withIdentity(deleteIdentity).mutation(api.account.requestAccountDeletion, { userId: "large-user", confirmationEmail: "wrong@example.test" })).resolves.toBeNull()
    const deletion = await test.withIdentity(deleteIdentity).mutation(api.account.requestAccountDeletion, { userId: "large-user", confirmationEmail: "large@example.test" })
    expect(deletion?.status).toBe("queued")
    vi.useFakeTimers()
    await test.finishAllScheduledFunctions(vi.runAllTimers)
    vi.useRealTimers()
    const authIdentity = { tokenIdentifier: "test|auth", subject: "oauth:large@example.test", role: "auth", scope: "users:auth" }
    await expect(test.withIdentity(authIdentity).mutation(api.users.upsertOAuth, {
      email: "large@example.test", name: "Restored fixture", provider: "google", providerAccountId: "large-subject", emailVerified: true,
    })).rejects.toThrow("cannot be restored automatically")
    const remaining = await test.run(async (ctx) => ({
      users: await ctx.db.query("users").collect(),
      conversations: await ctx.db.query("operatorConversations").collect(),
      messages: await ctx.db.query("operatorMessages").collect(),
      usage: await ctx.db.query("aiDailyUsage").collect(),
    }))
    expect(remaining).toEqual({ users: [], conversations: [], messages: [], usage: [] })
  })
})
