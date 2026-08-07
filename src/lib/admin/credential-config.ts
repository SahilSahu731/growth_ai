import { createHash, timingSafeEqual } from "node:crypto"
import { compare } from "bcryptjs"

export type ResolvedAdminCredentialConfig = {
  email: string
  passwordCredential: string
  passwordIsHash: boolean
  sessionSecret: string
  sessionVersion: string
}

export function constantTimeTextEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest()
  const rightDigest = createHash("sha256").update(right).digest()
  return timingSafeEqual(leftDigest, rightDigest)
}

export function resolveAdminCredentialConfig(environment: Record<string, string | undefined>): ResolvedAdminCredentialConfig | null {
  const email = environment.ADMIN_EMAIL?.trim().toLowerCase() ?? ""
  const configuredHash = environment.ADMIN_PASSWORD_HASH ?? ""
  const passwordCredential = configuredHash
  const passwordIsHash = /^\$2[aby]\$\d{2}\$/.test(configuredHash)
  const sessionSecretSource = environment.ADMIN_SESSION_SECRET ?? ""
  const sessionVersion = environment.ADMIN_SESSION_VERSION?.trim() || "1"
  if (!email || !passwordIsHash || sessionSecretSource.length < 32) return null
  const sessionSecret = createHash("sha256").update(`growthai-admin-session|${sessionSecretSource}`).digest("hex")
  return { email, passwordCredential, passwordIsHash, sessionSecret, sessionVersion }
}

export async function matchesAdminPassword(password: string, config: ResolvedAdminCredentialConfig): Promise<boolean> {
  return compare(password, config.passwordCredential).catch(() => false)
}
