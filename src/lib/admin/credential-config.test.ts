import { describe, expect, it } from "vitest"

import { matchesAdminPassword, resolveAdminCredentialConfig } from "./credential-config"

describe("admin credential configuration", () => {
  it("accepts the direct password and short session secret compatibility configuration", async () => {
    const config = resolveAdminCredentialConfig({
      ADMIN_EMAIL: "admin@x.com",
      ADMIN_PASSWORD_HASH: "kingofthepirates",
      ADMIN_SESSION_SECRET: "onepiece",
      ADMIN_SESSION_VERSION: "1",
    })
    expect(config).not.toBeNull()
    expect(config?.email).toBe("admin@x.com")
    expect(config?.sessionSecret).toHaveLength(64)
    expect(config && await matchesAdminPassword("kingofthepirates", config)).toBe(true)
    expect(config && await matchesAdminPassword("wrong-password", config)).toBe(false)
  })

  it("supports bcrypt password hashes for production", async () => {
    const config = resolveAdminCredentialConfig({
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD_HASH: "$2b$12$Jbl4/KinmOHPD5.VRHGjNeB3ysEaH4Oi.9M837kszKy4bA03jAtFm",
      ADMIN_SESSION_SECRET: "this-is-a-long-random-session-secret-for-testing",
    })
    expect(config?.passwordIsHash).toBe(true)
    expect(config && await matchesAdminPassword("growthai-invalid-admin-credential", config)).toBe(true)
  })

  it("requires an email, password, and signing source", () => {
    expect(resolveAdminCredentialConfig({ ADMIN_EMAIL: "admin@example.com" })).toBeNull()
  })
})
