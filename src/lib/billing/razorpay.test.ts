import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  isAllowedRazorpayCheckoutUrl,
  isRazorpaySubscriptionId,
  isTrustedBillingRequest,
  paidPlanConfig,
  unixIso,
  verifyRazorpaySignature,
} from "./razorpay"

describe("Razorpay boundary", () => {
  it("accepts only the matching HMAC", () => { const body = '{"event":"subscription.activated"}'; const signature = createHmac("sha256", "secret").update(body).digest("hex"); expect(verifyRazorpaySignature(body, signature, "secret")).toBe(true); expect(verifyRazorpaySignature(`${body}x`, signature, "secret")).toBe(false) })
  it("normalizes provider timestamps", () => { expect(unixIso(0)).toBe("1970-01-01T00:00:00.000Z"); expect(unixIso("bad")).toBeUndefined() })

  it("only permits Razorpay-hosted HTTPS checkout URLs", () => {
    expect(isAllowedRazorpayCheckoutUrl("https://rzp.io/i/example")).toBe(true)
    expect(isAllowedRazorpayCheckoutUrl("https://api.razorpay.com/v1/example")).toBe(true)
    expect(isAllowedRazorpayCheckoutUrl("http://rzp.io/i/example")).toBe(false)
    expect(isAllowedRazorpayCheckoutUrl("https://razorpay.com.evil.test/example")).toBe(false)
    expect(isAllowedRazorpayCheckoutUrl("javascript:alert(1)")).toBe(false)
  })

  it("requires same-origin browser mutations", () => {
    const base = { requestUrl: "https://growth.test/api/billing/checkout", allowedOrigins: ["https://growth.test"] }
    expect(isTrustedBillingRequest({ ...base, origin: "https://growth.test", fetchSite: "same-origin" })).toBe(true)
    expect(isTrustedBillingRequest({ ...base, origin: null, fetchSite: "same-origin" })).toBe(false)
    expect(isTrustedBillingRequest({ ...base, origin: "https://evil.test", fetchSite: "cross-site" })).toBe(false)
    expect(isTrustedBillingRequest({ ...base, origin: "not a url", fetchSite: null })).toBe(false)
  })

  it("maps paid plans exclusively from server configuration", () => {
    const environment = { RAZORPAY_PLAN_ID_PRO_MONTHLY: "plan_pro", RAZORPAY_PLAN_ID_FOUNDER: "plan_founder" }
    expect(paidPlanConfig("pro", environment)).toEqual({ plan: "pro", planId: "plan_pro", amount: 99900, currency: "INR" })
    expect(paidPlanConfig("founder", environment)).toEqual({ plan: "founder", planId: "plan_founder", amount: 74900, currency: "INR" })
    expect(paidPlanConfig("pro", {})).toBeNull()
  })

  it("accepts only provider-shaped subscription identifiers", () => {
    expect(isRazorpaySubscriptionId("sub_ABC123xyz")).toBe(true)
    expect(isRazorpaySubscriptionId("order_ABC123xyz")).toBe(false)
    expect(isRazorpaySubscriptionId("sub_bad-value")).toBe(false)
  })
})
