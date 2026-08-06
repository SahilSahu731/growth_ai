import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60

export type AdminSessionPayload = {
  email: string
  issuedAt: number
  expiresAt: number
  version: string
  nonce: string
}

function encode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url")
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

export function createAdminSessionToken(input: {
  email: string
  secret: string
  version: string
  now?: number
}): string {
  const issuedAt = input.now ?? Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    email: input.email.trim().toLowerCase(),
    issuedAt,
    expiresAt: issuedAt + ADMIN_SESSION_TTL_SECONDS,
    version: input.version,
    nonce: randomBytes(16).toString("hex"),
  }
  const encodedPayload = encode(JSON.stringify(payload))
  return `${encodedPayload}.${signature(encodedPayload, input.secret)}`
}

export function verifyAdminSessionToken(input: {
  token: string
  secret: string
  version: string
  expectedEmail: string
  now?: number
}): AdminSessionPayload | null {
  const [encodedPayload, providedSignature, extra] = input.token.split(".")
  if (!encodedPayload || !providedSignature || extra) return null

  const expectedSignature = signature(encodedPayload, input.secret)
  const actual = Buffer.from(providedSignature)
  const expected = Buffer.from(expectedSignature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AdminSessionPayload>
    const now = input.now ?? Math.floor(Date.now() / 1000)
    if (
      typeof payload.email !== "string" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.version !== "string" ||
      typeof payload.nonce !== "string" ||
      payload.email !== input.expectedEmail.trim().toLowerCase() ||
      payload.version !== input.version ||
      payload.issuedAt > now + 60 ||
      payload.expiresAt <= now ||
      payload.expiresAt - payload.issuedAt !== ADMIN_SESSION_TTL_SECONDS
    ) return null
    return payload as AdminSessionPayload
  } catch {
    return null
  }
}
