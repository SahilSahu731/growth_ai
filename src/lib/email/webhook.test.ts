import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { verifyResendWebhook } from "./webhook"

describe("Resend webhook verification", () => {
  it("accepts the signed raw body and rejects tampering or stale timestamps", () => {
    const key = Buffer.from("test-webhook-secret-key")
    const secret = `whsec_${key.toString("base64")}`
    const body = JSON.stringify({ type: "email.delivered" })
    const id = "msg_test", timestamp = "1800000000"
    const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64")
    const input = { body, id, timestamp, signature: `v1,${signature}`, secret, now: 1_800_000_000_000 }
    expect(verifyResendWebhook(input)).toBe(true)
    expect(verifyResendWebhook({ ...input, body: `${body} ` })).toBe(false)
    expect(verifyResendWebhook({ ...input, now: input.now + 301_000 })).toBe(false)
  })
})
