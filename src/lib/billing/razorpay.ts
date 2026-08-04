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

export type RazorpayWebhook = {
  event?: string
  payload?: { subscription?: { entity?: { id?: string; status?: string; current_start?: number; current_end?: number; notes?: { userId?: string; plan?: string } } } }
}
