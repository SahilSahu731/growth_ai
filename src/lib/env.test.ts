import { describe, expect, it } from "vitest"

import { validateEnvironment } from "./env"

const validProduction = {
  NEXT_PUBLIC_APP_URL: "https://growthai.example",
  NEXTAUTH_URL: "https://growthai.example",
  AUTH_SECRET: "a".repeat(32),
  NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud",
  CONVEX_DEPLOY_KEY: "prod:example|not-a-real-key",
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
})
