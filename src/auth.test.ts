import { beforeEach, describe, expect, it, vi } from "vitest"

const users = vi.hoisted(() => ({
  findUserByEmail: vi.fn(),
  upsertOAuthUser: vi.fn(),
}))

vi.mock("@/lib/data/users", () => users)

import { authOptions } from "./auth"

describe("member authentication callbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("persists a verified Google subject and locale", async () => {
    users.upsertOAuthUser.mockResolvedValue({ id: "user-1", accountStatus: "active", deletedAt: null })
    const signIn = authOptions.callbacks?.signIn
    expect(signIn).toBeDefined()
    const allowed = await signIn?.({
      user: { id: "google-user", email: "Alex@Example.test", name: "Alex" },
      account: { provider: "google", type: "oauth", providerAccountId: "google-subject", access_token: "fixture" },
      profile: { email_verified: true, locale: "en-IN" } as never,
      credentials: undefined,
      email: undefined,
    })
    expect(allowed).toBe(true)
    expect(users.upsertOAuthUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "Alex@Example.test",
      providerAccountId: "google-subject",
      emailVerified: true,
      locale: "en-IN",
    }))
  })

  it("rejects an unverified Google identity", async () => {
    users.upsertOAuthUser.mockRejectedValue(new Error("A verified Google email is required"))
    const allowed = await authOptions.callbacks?.signIn?.({
      user: { id: "google-user", email: "alex@example.test" },
      account: { provider: "google", type: "oauth", providerAccountId: "google-subject" },
      profile: { email_verified: false } as never,
      credentials: undefined,
      email: undefined,
    })
    expect(allowed).toBe(false)
  })

  it("removes suspended and deleted accounts from JWT sessions", async () => {
    const jwt = authOptions.callbacks?.jwt
    users.findUserByEmail.mockResolvedValueOnce({ id: "user-1", accountStatus: "suspended", deletedAt: null })
    const suspended = await jwt?.({ token: { email: "alex@example.test", userId: "old" }, user: { id: "session-user" }, account: null, profile: undefined, trigger: undefined, isNewUser: false, session: undefined })
    expect(suspended?.userId).toBeUndefined()

    users.findUserByEmail.mockResolvedValueOnce({ id: "user-1", accountStatus: "active", deletedAt: null })
    const active = await jwt?.({ token: { email: "alex@example.test" }, user: { id: "session-user" }, account: null, profile: undefined, trigger: undefined, isNewUser: false, session: undefined })
    expect(active?.userId).toBe("user-1")
  })

  it("keeps legacy active accounts usable during the additive schema rollout", async () => {
    users.findUserByEmail.mockResolvedValue({ id: "legacy-user", deletedAt: null })
    const token = await authOptions.callbacks?.jwt?.({
      token: { email: "legacy@example.test" }, user: { id: "oauth-user" }, account: null,
      profile: undefined, trigger: undefined, isNewUser: false, session: undefined,
    })
    expect(token?.userId).toBe("legacy-user")
  })

  it("does not erase an established session during a temporary account-store failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    users.findUserByEmail.mockRejectedValue(new Error("temporary Convex failure"))
    const token = await authOptions.callbacks?.jwt?.({
      token: { email: "alex@example.test", userId: "existing-user" }, user: { id: "session-user" }, account: null,
      profile: undefined, trigger: undefined, isNewUser: false, session: undefined,
    })
    expect(token?.userId).toBe("existing-user")
  })

  it("does not create an authenticated session from an account-store failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    users.findUserByEmail.mockRejectedValue(new Error("temporary Convex failure"))
    const token = await authOptions.callbacks?.jwt?.({
      token: { email: "new@example.test" }, user: { id: "oauth-user" }, account: null,
      profile: undefined, trigger: undefined, isNewUser: false, session: undefined,
    })
    expect(token?.userId).toBeUndefined()
  })
})
