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
  const plainPassword = environment.ADMIN_PASSWORD ?? ""
  const configuredHash = environment.ADMIN_PASSWORD_HASH ?? ""
  const passwordCredential = plainPassword || configuredHash
  const passwordIsHash = !plainPassword && configuredHash.startsWith("$2")
  const sessionSecretSource = environment.ADMIN_SESSION_SECRET || environment.AUTH_SECRET || environment.NEXTAUTH_SECRET || ""
  const sessionVersion = environment.ADMIN_SESSION_VERSION?.trim() || "1"
  if (!email || !passwordCredential || !sessionSecretSource) return null
  const sessionSecret = createHash("sha256").update(`growthai-admin-session|${sessionSecretSource}`).digest("hex")
  return { email, passwordCredential, passwordIsHash, sessionSecret, sessionVersion }
}

export async function matchesAdminPassword(password: string, config: ResolvedAdminCredentialConfig): Promise<boolean> {
  return config.passwordIsHash
    ? compare(password, config.passwordCredential).catch(() => false)
    : constantTimeTextEqual(password, config.passwordCredential)
}
