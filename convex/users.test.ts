/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")
const identity = { tokenIdentifier: "test|auth", subject: "oauth:alex@example.test", role: "auth", scope: "users:auth" }

describe("OAuth account ownership", () => {
  it("requires a verified Google email", async () => {
    const t = convexTest(schema, modules).withIdentity(identity)
    await expect(t.mutation(api.users.upsertOAuth, {
      email: "alex@example.test", name: "Alex", provider: "google", providerAccountId: "subject-1", emailVerified: false,
    })).rejects.toThrow("verified Google email")
  })

  it("stores the provider subject and does not overwrite a user-controlled name", async () => {
    const test = convexTest(schema, modules)
    const t = test.withIdentity(identity)
    const created = await t.mutation(api.users.upsertOAuth, {
      email: "alex@example.test", name: "Original Name", provider: "google", providerAccountId: "subject-1", emailVerified: true, locale: "en-IN",
    })
    const existing = await t.mutation(api.users.upsertOAuth, {
      email: "alex@example.test", name: "Provider Changed Name", provider: "google", providerAccountId: "subject-1", emailVerified: true, locale: "en-US",
    })
    if (!created || !existing) throw new Error("Expected OAuth upsert to return a user")
    expect(existing.id).toBe(created.id)
    expect(existing.name).toBe("Original Name")
    expect(existing.providerAccountId).toBe("subject-1")
    const record = await test.run((ctx) => ctx.db.query("users").first())
    expect(record?.locale).toBe("en-IN")
  })

  it("refuses to link an email to a different Google subject", async () => {
    const t = convexTest(schema, modules).withIdentity(identity)
    await t.mutation(api.users.upsertOAuth, {
      email: "alex@example.test", name: "Alex", provider: "google", providerAccountId: "subject-1", emailVerified: true,
    })
    await expect(t.mutation(api.users.upsertOAuth, {
      email: "alex@example.test", name: "Alex", provider: "google", providerAccountId: "subject-2", emailVerified: true,
    })).rejects.toThrow("another Google identity")
  })
})
