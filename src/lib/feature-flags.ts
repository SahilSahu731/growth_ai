export const featureFlags = {
  aiPatterns: process.env.FEATURE_AI_PATTERNS !== "false",
  billing: process.env.FEATURE_BILLING === "true",
  github: process.env.FEATURE_GITHUB === "true",
  publicPages: process.env.FEATURE_PUBLIC_PAGES !== "false",
  referrals: process.env.FEATURE_REFERRALS === "true",
} as const
