import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { unixIso, verifyRazorpaySignature } from "./razorpay"

describe("Razorpay boundary", () => {
  it("accepts only the matching HMAC", () => { const body = '{"event":"subscription.activated"}'; const signature = createHmac("sha256", "secret").update(body).digest("hex"); expect(verifyRazorpaySignature(body, signature, "secret")).toBe(true); expect(verifyRazorpaySignature(`${body}x`, signature, "secret")).toBe(false) })
  it("normalizes provider timestamps", () => { expect(unixIso(0)).toBe("1970-01-01T00:00:00.000Z"); expect(unixIso("bad")).toBeUndefined() })
})
