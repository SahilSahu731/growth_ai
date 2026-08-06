import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export function verifyRazorpaySignature(body: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false
  const expected = createHmac("sha256", secret).update(body).digest("hex")
  const left = Buffer.from(expected, "utf8")
  const right = Buffer.from(signature, "utf8")
  return left.length === right.length && timingSafeEqual(left, right)
}

export function payloadDigest(body: string) { return createHash("sha256").update(body).digest("hex") }

export function unixIso(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? new Date(value * 1000).toISOString() : undefined
}

export type PaidPlanId = "pro" | "founder"

export function paidPlanConfig(plan: PaidPlanId, environment: Record<string, string | undefined>) {
  const planId = plan === "founder" ? environment.RAZORPAY_PLAN_ID_FOUNDER : environment.RAZORPAY_PLAN_ID_PRO_MONTHLY
  if (!planId) return null
  return { plan, planId, amount: plan === "founder" ? 74900 : 99900, currency: "INR" as const }
}

export function isAllowedRazorpayCheckoutUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && (url.hostname === "rzp.io" || url.hostname === "razorpay.com" || url.hostname.endsWith(".razorpay.com"))
  } catch {
    return false
  }
}

export function isTrustedMutationRequest(input: { requestUrl: string; origin: string | null; fetchSite: string | null; allowedOrigins: Array<string | undefined> }) {
  if (input.fetchSite === "cross-site") return false
  if (!input.origin) return false
  const candidates = new Set<string>()
  try { candidates.add(new URL(input.requestUrl).origin) } catch { return false }
  for (const value of input.allowedOrigins) {
    if (!value) continue
    try { candidates.add(new URL(value).origin) } catch { /* Ignore malformed optional configuration. */ }
  }
  try { return candidates.has(new URL(input.origin).origin) } catch { return false }
}

export const isTrustedBillingRequest = isTrustedMutationRequest

export function isRazorpaySubscriptionId(value: string | undefined): value is string {
  return Boolean(value && /^sub_[A-Za-z0-9]{6,100}$/.test(value))
}

export const MUTATING_SUBSCRIPTION_EVENTS = new Set([
  "subscription.authenticated", "subscription.activated", "subscription.charged",
  "subscription.pending", "subscription.halted", "subscription.paused", "subscription.resumed",
  "subscription.cancelled", "subscription.completed",
])

export type RazorpayWebhook = {
  event?: string
  created_at?: number
  payload?: { subscription?: { entity?: { id?: string; plan_id?: string; status?: string; current_start?: number; current_end?: number; notes?: { userId?: string; plan?: string } } } }
}
