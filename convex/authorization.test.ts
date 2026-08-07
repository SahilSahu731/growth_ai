/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")
const member = { tokenIdentifier: "test|member", subject: "member:user-1", role: "member", scope: "operator:member" }
const otherMember = { ...member, subject: "member:user-2" }
const admin = { tokenIdentifier: "test|admin", subject: "admin:owner@example.test", role: "admin", scope: "admin:read" }
const webhook = { tokenIdentifier: "test|webhook", subject: "webhook:razorpay", role: "webhook", scope: "billing:webhook" }

describe("Convex application identity isolation", () => {
  it("rejects anonymous callers from member and admin functions", async () => {
    const t = convexTest(schema, modules)
    await expect(t.mutation(api.operator.createConversation, { userId: "user-1" })).rejects.toThrow("AUTH_REQUIRED")
    await expect(t.query(api.admin.getDashboard, {})).rejects.toThrow("AUTH_REQUIRED")
  })

  it("prevents one member identity from addressing another member", async () => {
    const t = convexTest(schema, modules)
    await expect(t.withIdentity(otherMember).mutation(api.operator.createConversation, { userId: "user-1" })).rejects.toThrow("does not own")
  })

  it("prevents member, admin, and webhook identities from crossing capabilities", async () => {
    const t = convexTest(schema, modules)
    await expect(t.withIdentity(member).query(api.admin.getDashboard, {})).rejects.toThrow("does not have this capability")
    await expect(t.withIdentity(admin).mutation(api.operator.createConversation, { userId: "user-1" })).rejects.toThrow("does not have this capability")
    await expect(t.withIdentity(webhook).query(api.admin.getDashboard, {})).rejects.toThrow("does not have this capability")
    await expect(t.withIdentity(member).mutation(api.billing.recordEvent, {
      providerEventId: "evt_test", eventType: "subscription.activated", payloadDigest: "a".repeat(64), shouldApply: false,
    })).rejects.toThrow("does not have this capability")
  })

  it("keeps public announcements readable without granting other access", async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.announcements.getCurrent, {})).resolves.toBeNull()
    await expect(t.withIdentity(webhook).mutation(api.operator.createConversation, { userId: "user-1" })).rejects.toThrow("does not have this capability")
  })
})
