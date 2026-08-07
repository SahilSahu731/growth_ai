import "server-only"

import { createPrivateKey, createPublicKey, type JsonWebKey } from "node:crypto"
import { importPKCS8, SignJWT } from "jose"

export const CONVEX_IDENTITY_ROLES = ["member", "admin", "webhook", "background", "auth"] as const
export type ConvexIdentityRole = (typeof CONVEX_IDENTITY_ROLES)[number]

const audience = "growthai-convex"
const privateKeyNames: Record<ConvexIdentityRole, string> = {
  member: "CONVEX_MEMBER_JWT_PRIVATE_KEY",
  admin: "CONVEX_ADMIN_JWT_PRIVATE_KEY",
  webhook: "CONVEX_WEBHOOK_JWT_PRIVATE_KEY",
  background: "CONVEX_BACKGROUND_JWT_PRIVATE_KEY",
  auth: "CONVEX_AUTH_JWT_PRIVATE_KEY",
}

function baseUrl() {
  const configured = process.env.CONVEX_AUTH_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (!configured) throw new Error("Missing CONVEX_AUTH_BASE_URL for Convex application authentication.")
  return new URL(configured).origin
}

function normalizePem(value: string) {
  return value.replace(/\\n/g, "\n").trim()
}

function privateKey(role: ConvexIdentityRole) {
  const name = privateKeyNames[role]
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}; the web runtime must use a scoped Convex application identity.`)
  return normalizePem(value)
}

export function convexIdentityIssuer(role: ConvexIdentityRole) {
  return `${baseUrl()}/convex/${role}`
}

export function convexIdentityKeyId(role: ConvexIdentityRole) {
  return process.env[`CONVEX_${role.toUpperCase()}_JWT_KEY_ID`] || `growthai-${role}-v1`
}

export async function createConvexIdentityToken(input: {
  role: ConvexIdentityRole
  subject: string
  scope: string
}) {
  const key = await importPKCS8(privateKey(input.role), "RS256")
  return new SignJWT({ role: input.role, scope: input.scope, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: convexIdentityKeyId(input.role) })
    .setIssuer(convexIdentityIssuer(input.role))
    .setAudience(audience)
    .setSubject(input.subject.slice(0, 200))
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(key)
}

export function convexIdentityJwk(role: ConvexIdentityRole): JsonWebKey & { kid: string; use: "sig"; alg: "RS256" } {
  const publicKey = createPublicKey(createPrivateKey(privateKey(role)))
  const exported = publicKey.export({ format: "jwk" })
  return { ...exported, kid: convexIdentityKeyId(role), use: "sig", alg: "RS256" }
}
