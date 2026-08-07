import { createHash, timingSafeEqual } from "node:crypto"
import { compare } from "bcryptjs"

export const ADMIN_ROLES = ["support-read", "support-write", "billing", "security-auditor", "owner"] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export type ResolvedAdminCredentialConfig = {
  email: string
  passwordCredential: string
  passwordIsHash: boolean
  sessionSecret: string
  sessionVersion: string
  totpSecret: string
  roles: AdminRole[]
}

export function constantTimeTextEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest()
  const rightDigest = createHash("sha256").update(right).digest()
  return timingSafeEqual(leftDigest, rightDigest)
}

export function resolveAdminCredentialConfig(environment: Record<string, string | undefined>): ResolvedAdminCredentialConfig | null {
  return resolveAdminCredentialConfigs(environment)[0] ?? null
}

export function resolveAdminCredentialConfigs(environment: Record<string, string | undefined>): ResolvedAdminCredentialConfig[] {
  const sessionSecretSource = environment.ADMIN_SESSION_SECRET ?? ""
  const sessionVersion = environment.ADMIN_SESSION_VERSION?.trim() || "1"
  if (sessionSecretSource.length < 32) return []
  const sessionSecret = createHash("sha256").update(`growthai-admin-session|${sessionSecretSource}`).digest("hex")
  if (environment.ADMIN_ACCOUNTS_JSON) {
    try {
      const parsed = JSON.parse(environment.ADMIN_ACCOUNTS_JSON) as unknown
      if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 50) return []
      const accounts: Array<ResolvedAdminCredentialConfig | null> = parsed.map((item) => {
        if (!item || typeof item !== "object") return null
        const value = item as Record<string, unknown>
        const email = typeof value.email === "string" ? value.email.trim().toLowerCase() : ""
        const passwordCredential = typeof value.passwordHash === "string" ? value.passwordHash : ""
        const totpSecret = typeof value.totpSecret === "string" ? value.totpSecret.replace(/\s+/g, "").toUpperCase() : ""
        const roles = Array.isArray(value.roles) ? value.roles.filter((role): role is AdminRole => typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole)) : []
        if (!email || !/^\$2[aby]\$\d{2}\$/.test(passwordCredential) || !/^[A-Z2-7]{16,}$/.test(totpSecret) || !roles.length) return null
        return { email, passwordCredential, passwordIsHash: true, sessionSecret, sessionVersion, totpSecret, roles: [...new Set(roles)] }
      })
      const valid = accounts.filter((item): item is ResolvedAdminCredentialConfig => item !== null)
      return valid.length === parsed.length && new Set(valid.map((item) => item.email)).size === valid.length ? valid : []
    } catch { return [] }
  }
  const email = environment.ADMIN_EMAIL?.trim().toLowerCase() ?? ""
  const configuredHash = environment.ADMIN_PASSWORD_HASH ?? ""
  const passwordCredential = configuredHash
  const passwordIsHash = /^\$2[aby]\$\d{2}\$/.test(configuredHash)
  const totpSecret = environment.ADMIN_TOTP_SECRET?.replace(/\s+/g, "").toUpperCase() ?? ""
  const roles = (environment.ADMIN_ROLES || "owner").split(",").map((role) => role.trim()).filter((role): role is AdminRole => ADMIN_ROLES.includes(role as AdminRole))
  if (!email || !passwordIsHash || !/^[A-Z2-7]{16,}$/.test(totpSecret) || !roles.length) return []
  return [{ email, passwordCredential, passwordIsHash, sessionSecret, sessionVersion, totpSecret, roles: [...new Set(roles)] }]
}

export async function matchesAdminPassword(password: string, config: ResolvedAdminCredentialConfig): Promise<boolean> {
  return compare(password, config.passwordCredential).catch(() => false)
}
