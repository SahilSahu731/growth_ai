import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export function verifyResendWebhook(input: { body: string; id: string | null; timestamp: string | null; signature: string | null; secret: string; now?: number }) {
  if (!input.id || !input.timestamp || !input.signature || !input.secret) return false
  const seconds = Number(input.timestamp)
  if (!Number.isFinite(seconds) || Math.abs((input.now ?? Date.now()) - seconds * 1000) > 5 * 60 * 1000) return false
  try {
    const key = Buffer.from(input.secret.startsWith("whsec_") ? input.secret.slice(6) : input.secret, "base64")
    const expected = createHmac("sha256", key).update(`${input.id}.${input.timestamp}.${input.body}`).digest("base64")
    return input.signature.split(/\s+/).some((candidate) => {
      const supplied = candidate.startsWith("v1,") ? candidate.slice(3) : ""
      const left = Buffer.from(expected), right = Buffer.from(supplied)
      return left.length === right.length && timingSafeEqual(left, right)
    })
  } catch { return false }
}
export function emailPayloadDigest(body: string) { return createHash("sha256").update(body).digest("hex") }
