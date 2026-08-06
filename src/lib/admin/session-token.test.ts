import { describe, expect, it } from "vitest"

import { ADMIN_SESSION_TTL_SECONDS, createAdminSessionToken, verifyAdminSessionToken } from "./session-token"

const secret = "test-session-secret-that-is-longer-than-thirty-two-characters"

describe("admin session token", () => {
  it("round-trips a valid scoped session", () => {
    const token = createAdminSessionToken({ email: "ADMIN@Example.com", secret, version: "3", now: 1_800_000_000 })
    const payload = verifyAdminSessionToken({ token, secret, version: "3", expectedEmail: "admin@example.com", now: 1_800_000_100 })
    expect(payload?.email).toBe("admin@example.com")
    expect(payload?.expiresAt).toBe(1_800_000_000 + ADMIN_SESSION_TTL_SECONDS)
  })

  it("rejects tampering and a different signing secret", () => {
    const token = createAdminSessionToken({ email: "admin@example.com", secret, version: "1", now: 1_800_000_000 })
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`
    expect(verifyAdminSessionToken({ token: tampered, secret, version: "1", expectedEmail: "admin@example.com", now: 1_800_000_100 })).toBeNull()
    expect(verifyAdminSessionToken({ token, secret: `${secret}x`, version: "1", expectedEmail: "admin@example.com", now: 1_800_000_100 })).toBeNull()
  })

  it("rejects expired, future, wrong-email, and revoked-version sessions", () => {
    const token = createAdminSessionToken({ email: "admin@example.com", secret, version: "1", now: 1_800_000_000 })
    expect(verifyAdminSessionToken({ token, secret, version: "1", expectedEmail: "admin@example.com", now: 1_800_000_000 + ADMIN_SESSION_TTL_SECONDS })).toBeNull()
    expect(verifyAdminSessionToken({ token, secret, version: "1", expectedEmail: "other@example.com", now: 1_800_000_100 })).toBeNull()
    expect(verifyAdminSessionToken({ token, secret, version: "2", expectedEmail: "admin@example.com", now: 1_800_000_100 })).toBeNull()
    expect(verifyAdminSessionToken({ token, secret, version: "1", expectedEmail: "admin@example.com", now: 1_799_999_900 })).toBeNull()
  })
})
