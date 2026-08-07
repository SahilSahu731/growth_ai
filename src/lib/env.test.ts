import { describe, expect, it } from "vitest"

import { assertEnvironment, validateEnvironment } from "./env"

const testPrivateKey = (label: string) => `${["-----BEGIN", "PRIVATE KEY-----"].join(" ")}\\n${label}\\n${["-----END", "PRIVATE KEY-----"].join(" ")}`

const validProduction = {
  NEXT_PUBLIC_APP_URL: "https://growthai.example",
  NEXTAUTH_URL: "https://growthai.example",
  AUTH_SECRET: "a".repeat(32),
  NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
  CONVEX_AUTH_BASE_URL: "https://growthai.example",
  CONVEX_MEMBER_JWT_PRIVATE_KEY: testPrivateKey("test-member"),
  CONVEX_ADMIN_JWT_PRIVATE_KEY: testPrivateKey("test-admin"),
  CONVEX_WEBHOOK_JWT_PRIVATE_KEY: testPrivateKey("test-webhook"),
  CONVEX_BACKGROUND_JWT_PRIVATE_KEY: testPrivateKey("test-background"),
  CONVEX_AUTH_JWT_PRIVATE_KEY: testPrivateKey("test-auth"),
  LEGAL_ENTITY_NAME: "GrowthAI Test Private Limited",
  LEGAL_JURISDICTION: "Karnataka, India",
  LEGAL_CONTACT_ADDRESS: "Synthetic test address",
  LEGAL_CONTACT_EMAIL: "privacy@growthai.example",
  SECURITY_CONTACT_EMAIL: "security@growthai.example",
  SUPPORT_CONTACT_EMAIL: "support@growthai.example",
  MINIMUM_USER_AGE: "18",
  ADMIN_SESSION_SECRET: "test-admin-session-secret-that-is-at-least-32-chars",
  ADMIN_ACCOUNTS_JSON: JSON.stringify([{ email: "owner@growthai.example", passwordHash: "$2b$12$Jbl4/KinmOHPD5.VRHGjNeB3ysEaH4Oi.9M837kszKy4bA03jAtFm", totpSecret: "JBSWY3DPEHPK3PXP", roles: ["owner"] }]),
  GOOGLE_CLIENT_ID: "123456-example.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "not-a-real-google-secret-value",
}

describe("environment validation", () => {
  it("accepts a complete production core configuration", () => {
    expect(validateEnvironment(validProduction, { production: true }).errors).toEqual([])
  })

  it("rejects placeholders, insecure URLs, and short secrets", () => {
    const result = validateEnvironment({
      ...validProduction,
      NEXT_PUBLIC_APP_URL: "http://growthai.example",
      NEXTAUTH_URL: "http://other.example",
      AUTH_SECRET: "short",
      CONVEX_DEPLOY_KEY: "dev:your-deployment|your-key",
    }, { production: true })
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("NEXT_PUBLIC_APP_URL"),
      expect.stringContaining("NEXTAUTH_URL"),
      expect.stringContaining("AUTH_SECRET"),
      expect.stringContaining("CONVEX_DEPLOY_KEY"),
    ]))
  })

  it("rejects partial optional integrations and public-looking secrets", () => {
    const result = validateEnvironment({
      NEXT_PUBLIC_DEPLOY_KEY: "should-never-be-public",
      RAZORPAY_KEY_ID: "rzp_test_example",
      ADMIN_EMAIL: "admin@example.test",
    })
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("NEXT_PUBLIC_DEPLOY_KEY"),
      expect.stringContaining("Razorpay"),
      expect.stringContaining("Admin authentication"),
    ]))
  })

  it("validates optional Gemini cost-rate pairs", () => {
    expect(validateEnvironment({
      GEMINI_INPUT_COST_PER_MILLION_USD: "0.5",
      GEMINI_OUTPUT_COST_PER_MILLION_USD: "2",
    }).errors).toEqual([])
    expect(validateEnvironment({ GEMINI_INPUT_COST_PER_MILLION_USD: "-1" }).errors).toEqual(expect.arrayContaining([
      expect.stringContaining("both input and output"),
      expect.stringContaining("non-negative"),
    ]))
  })

  it("rejects invalid transport, proxy, and duplicate administrator configuration", () => {
    const account = { email: "owner@growthai.example", passwordHash: "$2b$12$Jbl4/KinmOHPD5.VRHGjNeB3ysEaH4Oi.9M837kszKy4bA03jAtFm", totpSecret: "JBSWY3DPEHPK3PXP", roles: ["owner"] }
    const result = validateEnvironment({
      ADMIN_SESSION_SECRET: "test-admin-session-secret-that-is-at-least-32-chars",
      ADMIN_ACCOUNTS_JSON: JSON.stringify([account, { ...account, email: "OWNER@growthai.example" }]),
      ENABLE_HSTS: "yes",
      TRUSTED_PROXY_HOPS: "9",
    })
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining("ADMIN_ACCOUNTS_JSON"),
      expect.stringContaining("ENABLE_HSTS"),
      expect.stringContaining("TRUSTED_PROXY_HOPS"),
    ]))
  })

  it("throws a consolidated error through the production assertion boundary", () => {
    expect(() => assertEnvironment({}, { production: true })).toThrow("Invalid GrowthAI environment")
    expect(assertEnvironment(validProduction, { production: true }).NEXT_PUBLIC_APP_URL).toBe("https://growthai.example")
  })
})
