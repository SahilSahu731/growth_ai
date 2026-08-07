import "server-only"

import { createHash } from "node:crypto"
import { compare } from "bcryptjs"
import { cookies, headers } from "next/headers"

import { ADMIN_SESSION_TTL_SECONDS, createAdminSessionToken, verifyAdminSessionToken } from "@/lib/admin/session-token"
import { constantTimeTextEqual, matchesAdminPassword, resolveAdminCredentialConfig, type ResolvedAdminCredentialConfig } from "@/lib/admin/credential-config"

const COOKIE_NAME = "growthai_admin_session"
const DUMMY_HASH = "$2b$12$Jbl4/KinmOHPD5.VRHGjNeB3ysEaH4Oi.9M837kszKy4bA03jAtFm"

export type AdminSession = { email: string; expiresAt: number }

function config(): ResolvedAdminCredentialConfig | null {
  return resolveAdminCredentialConfig(process.env)
}

export function isAdminConfigured(): boolean {
  return config() !== null
}

export async function verifyAdminCredentials(input: { email: string; password: string }): Promise<boolean> {
  const current = config()
  const passwordMatches = current
    ? await matchesAdminPassword(input.password, current)
    : await compare(input.password, DUMMY_HASH).catch(() => false)
  const emailMatches = constantTimeTextEqual(input.email.trim().toLowerCase(), current?.email ?? "invalid@growthai.local")
  return Boolean(current && emailMatches && passwordMatches)
}

export async function createAdminSession(): Promise<AdminSession> {
  const current = config()
  if (!current) throw new Error("Admin authentication is not configured")
  const token = createAdminSessionToken({
    email: current.email,
    secret: current.sessionSecret,
    version: current.sessionVersion,
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
  return { email: current.email, expiresAt: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const current = config()
  if (!current) return null
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = verifyAdminSessionToken({
    token,
    secret: current.sessionSecret,
    version: current.sessionVersion,
    expectedEmail: current.email,
  })
  return payload ? { email: payload.email, expiresAt: payload.expiresAt } : null
}

export async function deleteAdminSession(): Promise<void> {
  ;(await cookies()).delete(COOKIE_NAME)
}

export async function adminLoginFingerprint(): Promise<string> {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
  const address = forwardedFor || requestHeaders.get("x-real-ip") || "unknown"
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 200) || "unknown"
  const salt = config()?.sessionSecret ?? "growthai-unconfigured-admin"
  return createHash("sha256").update(`email-password-v2|${salt}|${address}|${userAgent}`).digest("hex")
}

export function adminCredentialHealth() {
  const current = config()
  return {
    configured: Boolean(current),
    passwordHashed: Boolean(process.env.ADMIN_PASSWORD_HASH?.startsWith("$2")),
    sessionSecretStrong: (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
    sessionHours: ADMIN_SESSION_TTL_SECONDS / 3600,
  }
}
