import "server-only"

import { createHash } from "node:crypto"
import { compare } from "bcryptjs"
import { Secret, TOTP } from "otpauth"
import { cookies, headers } from "next/headers"

import { ADMIN_SESSION_TTL_SECONDS, createAdminSessionToken, readAdminSessionEmail, verifyAdminSessionToken } from "@/lib/admin/session-token"
import { constantTimeTextEqual, matchesAdminPassword, resolveAdminCredentialConfigs, type ResolvedAdminCredentialConfig } from "@/lib/admin/credential-config"
import { ADMIN_ROLES, type AdminRole } from "@/lib/admin/credential-config"
import { createAdminSessionRecord, revokeAdminSessionRecord, validateAdminSessionRecord } from "@/lib/data/admin"

const COOKIE_NAME = "growthai_admin_session"
const DUMMY_HASH = "$2b$12$Jbl4/KinmOHPD5.VRHGjNeB3ysEaH4Oi.9M837kszKy4bA03jAtFm"

export type AdminSession = { email: string; roles: ResolvedAdminCredentialConfig["roles"]; issuedAt: number; expiresAt: number }

export function adminHasRole(session: AdminSession, ...roles: ResolvedAdminCredentialConfig["roles"]): boolean {
  return session.roles.includes("owner") || roles.some((role) => session.roles.includes(role))
}

export function adminSessionHasRecentMfa(session: AdminSession, maxAgeSeconds = 10 * 60): boolean {
  const now = Math.floor(Date.now() / 1000)
  return session.issuedAt <= now + 60 && now - session.issuedAt <= maxAgeSeconds
}

function config(email?: string | null): ResolvedAdminCredentialConfig | null {
  const accounts = resolveAdminCredentialConfigs(process.env)
  return email ? accounts.find((item) => item.email === email.trim().toLowerCase()) ?? null : accounts[0] ?? null
}

export function isAdminConfigured(): boolean {
  return config() !== null
}

export async function verifyAdminCredentials(input: { email: string; password: string; otp: string }): Promise<boolean> {
  const current = config(input.email)
  const passwordMatches = current
    ? await matchesAdminPassword(input.password, current)
    : await compare(input.password, DUMMY_HASH).catch(() => false)
  const emailMatches = constantTimeTextEqual(input.email.trim().toLowerCase(), current?.email ?? "invalid@growthai.local")
  const otpMatches = current ? TOTP.validate({ token: input.otp.replace(/\s+/g, ""), secret: Secret.fromBase32(current.totpSecret), algorithm: "SHA1", digits: 6, period: 30, window: 1 }) !== null : false
  return Boolean(current && emailMatches && passwordMatches && otpMatches)
}

export async function createAdminSession(email: string): Promise<AdminSession> {
  const current = config(email)
  if (!current) throw new Error("Admin authentication is not configured")
  const token = createAdminSessionToken({
    email: current.email,
    secret: current.sessionSecret,
    version: current.sessionVersion,
  })
  const payload = verifyAdminSessionToken({ token, secret: current.sessionSecret, version: current.sessionVersion, expectedEmail: current.email })
  if (!payload) throw new Error("Could not create a valid administrator session")
  await createAdminSessionRecord({
    tokenHash: createHash("sha256").update(token).digest("hex"), email: current.email, roles: current.roles,
    deviceHash: await adminLoginFingerprint(), absoluteExpiresAt: new Date(payload.expiresAt * 1000).toISOString(),
  })
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
    priority: "high",
  })
  return { email: current.email, roles: current.roles, issuedAt: payload.issuedAt, expiresAt: payload.expiresAt }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  const current = config(readAdminSessionEmail(token))
  if (!current) return null
  const payload = verifyAdminSessionToken({
    token,
    secret: current.sessionSecret,
    version: current.sessionVersion,
    expectedEmail: current.email,
  })
  if (!payload) return null
  const record = await validateAdminSessionRecord({ tokenHash: createHash("sha256").update(token).digest("hex"), email: payload.email, deviceHash: await adminLoginFingerprint() }).catch(() => null)
  if (!record) return null
  const roles = record.roles.filter((role): role is AdminRole => ADMIN_ROLES.includes(role as AdminRole))
  return roles.length ? { email: payload.email, roles, issuedAt: payload.issuedAt, expiresAt: payload.expiresAt } : null
}

export async function deleteAdminSession(): Promise<void> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  const current = token ? config(readAdminSessionEmail(token)) : null
  if (current && token) await revokeAdminSessionRecord(createHash("sha256").update(token).digest("hex"), current.email).catch(() => undefined)
  store.delete(COOKIE_NAME)
}

export async function adminLoginFingerprint(): Promise<string> {
  const requestHeaders = await headers()
  const trustedHops = Math.max(0, Math.min(5, Number(process.env.TRUSTED_PROXY_HOPS || "0") || 0))
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean) ?? []
  const address = trustedHops > 0 ? (forwarded.at(-trustedHops) || "unknown") : "untrusted-proxy-address"
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 200) || "unknown"
  const sessionSource = process.env.ADMIN_SESSION_SECRET ?? "growthai-unconfigured-admin"
  const salt = createHash("sha256").update(sessionSource).digest("hex")
  return createHash("sha256").update(`email-password-v2|${salt}|${address}|${userAgent}`).digest("hex")
}

export async function adminLoginFingerprints(email: string): Promise<string[]> {
  const device = await adminLoginFingerprint()
  const sessionSource = process.env.ADMIN_SESSION_SECRET ?? "growthai-unconfigured-admin"
  const salt = createHash("sha256").update(sessionSource).digest("hex")
  const digest = (value: string) => createHash("sha256").update(`admin-throttle-v3|${salt}|${value}`).digest("hex")
  return [digest(`device:${device}`), digest(`account:${email.trim().toLowerCase()}`), digest("global")]
}

export function adminCredentialHealth() {
  const accounts = resolveAdminCredentialConfigs(process.env)
  const current = accounts[0] ?? null
  return {
    configured: Boolean(current),
    passwordHashed: Boolean(accounts.length && accounts.every((item) => item.passwordIsHash)),
    sessionSecretStrong: (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
    sessionHours: ADMIN_SESSION_TTL_SECONDS / 3600,
    mfaConfigured: Boolean(current?.totpSecret),
    roles: [...new Set(accounts.flatMap((item) => item.roles))],
    accounts: accounts.length,
  }
}
