import { z } from "zod"

const optionalString = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().optional()
)

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  VERCEL_ENV: optionalString,
  GROWTHAI_VALIDATE_ENV: optionalString,
  NEXT_PUBLIC_APP_URL: optionalString,
  NEXTAUTH_URL: optionalString,
  AUTH_SECRET: optionalString,
  ENABLE_HSTS: optionalString,
  LEGAL_ENTITY_NAME: optionalString,
  LEGAL_JURISDICTION: optionalString,
  LEGAL_CONTACT_ADDRESS: optionalString,
  LEGAL_CONTACT_EMAIL: optionalString,
  SECURITY_CONTACT_EMAIL: optionalString,
  SUPPORT_CONTACT_EMAIL: optionalString,
  MINIMUM_USER_AGE: optionalString,
  NEXT_PUBLIC_CONVEX_URL: optionalString,
  CONVEX_DEPLOYMENT: optionalString,
  CONVEX_DEPLOY_KEY: optionalString,
  CONVEX_AUTH_BASE_URL: optionalString,
  CONVEX_MEMBER_JWT_PRIVATE_KEY: optionalString,
  CONVEX_MEMBER_JWT_KEY_ID: optionalString,
  CONVEX_ADMIN_JWT_PRIVATE_KEY: optionalString,
  CONVEX_ADMIN_JWT_KEY_ID: optionalString,
  CONVEX_WEBHOOK_JWT_PRIVATE_KEY: optionalString,
  CONVEX_WEBHOOK_JWT_KEY_ID: optionalString,
  CONVEX_BACKGROUND_JWT_PRIVATE_KEY: optionalString,
  CONVEX_BACKGROUND_JWT_KEY_ID: optionalString,
  CONVEX_AUTH_JWT_PRIVATE_KEY: optionalString,
  CONVEX_AUTH_JWT_KEY_ID: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  ADMIN_EMAIL: optionalString,
  ADMIN_ACCOUNTS_JSON: optionalString,
  ADMIN_PASSWORD_HASH: optionalString,
  ADMIN_SESSION_SECRET: optionalString,
  ADMIN_SESSION_VERSION: optionalString,
  ADMIN_TOTP_SECRET: optionalString,
  ADMIN_ROLES: optionalString,
  TRUSTED_PROXY_HOPS: optionalString,
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: optionalString,
  GEMINI_DISABLED: optionalString,
  GEMINI_INPUT_COST_PER_MILLION_USD: optionalString,
  GEMINI_OUTPUT_COST_PER_MILLION_USD: optionalString,
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  RAZORPAY_PLAN_ID_PRO_MONTHLY: optionalString,
  RAZORPAY_PLAN_ID_FOUNDER: optionalString,
  BILLING_CHECKOUT_ENABLED: optionalString,
  RESEND_API_KEY: optionalString,
  RESEND_WEBHOOK_SECRET: optionalString,
  TRANSACTIONAL_EMAIL_FROM: optionalString,
}).passthrough()

export type GrowthAiEnvironment = z.infer<typeof environmentSchema>

export type EnvironmentValidation = {
  environment: GrowthAiEnvironment
  errors: string[]
  warnings: string[]
}

const placeholders = /^(replace-|your-|changeme|example|todo|dev:your-|https:\/\/your-)/i
const pkcs8Start = ["-----BEGIN", "PRIVATE KEY-----"].join(" ")
const pkcs8End = ["-----END", "PRIVATE KEY-----"].join(" ")

function isHttpsUrl(value: string | undefined) {
  if (!value) return false
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

function origin(value: string | undefined) {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function validateEnvironment(
  input: Record<string, string | undefined>,
  options: { production?: boolean } = {}
): EnvironmentValidation {
  const parsed = environmentSchema.safeParse(input)
  if (!parsed.success) {
    return {
      environment: environmentSchema.parse({}),
      errors: parsed.error.issues.map((issue) => `Invalid environment field ${issue.path.join(".") || "unknown"}.`),
      warnings: [],
    }
  }

  const environment = parsed.data
  const production = options.production ?? environment.VERCEL_ENV === "production"
  const errors: string[] = []
  const warnings: string[] = []
  const requireValue = (name: keyof GrowthAiEnvironment) => {
    const value = environment[name]
    if (typeof value !== "string" || !value || placeholders.test(value)) {
      errors.push(`${String(name)} must be configured with a non-placeholder value.`)
    }
  }

  for (const [name, value] of Object.entries(input)) {
    if (name.startsWith("NEXT_PUBLIC_") && /(SECRET|PASSWORD|TOKEN|PRIVATE|DEPLOY_KEY)/i.test(name) && value) {
      errors.push(`${name} looks sensitive and must not use the NEXT_PUBLIC_ prefix.`)
    }
  }

  if (production) {
    for (const name of [
      "NEXT_PUBLIC_APP_URL",
      "NEXTAUTH_URL",
      "AUTH_SECRET",
      "NEXT_PUBLIC_CONVEX_URL",
      "CONVEX_AUTH_BASE_URL",
      "CONVEX_MEMBER_JWT_PRIVATE_KEY",
      "CONVEX_ADMIN_JWT_PRIVATE_KEY",
      "CONVEX_WEBHOOK_JWT_PRIVATE_KEY",
      "CONVEX_BACKGROUND_JWT_PRIVATE_KEY",
      "CONVEX_AUTH_JWT_PRIVATE_KEY",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "LEGAL_ENTITY_NAME",
      "LEGAL_JURISDICTION",
      "LEGAL_CONTACT_ADDRESS",
      "LEGAL_CONTACT_EMAIL",
      "SECURITY_CONTACT_EMAIL",
      "SUPPORT_CONTACT_EMAIL",
    ] as const) requireValue(name)

    if (!isHttpsUrl(environment.NEXT_PUBLIC_APP_URL)) errors.push("NEXT_PUBLIC_APP_URL must be an absolute HTTPS URL in production.")
    if (!isHttpsUrl(environment.NEXTAUTH_URL)) errors.push("NEXTAUTH_URL must be an absolute HTTPS URL in production.")
    if (!isHttpsUrl(environment.NEXT_PUBLIC_CONVEX_URL)) errors.push("NEXT_PUBLIC_CONVEX_URL must be an absolute HTTPS URL in production.")
    if (!isHttpsUrl(environment.CONVEX_AUTH_BASE_URL)) errors.push("CONVEX_AUTH_BASE_URL must be an absolute HTTPS URL in production.")
    if (origin(environment.CONVEX_AUTH_BASE_URL) && origin(environment.NEXT_PUBLIC_APP_URL) && origin(environment.CONVEX_AUTH_BASE_URL) !== origin(environment.NEXT_PUBLIC_APP_URL)) {
      errors.push("CONVEX_AUTH_BASE_URL must use the canonical application origin.")
    }
    if (environment.CONVEX_DEPLOY_KEY) errors.push("CONVEX_DEPLOY_KEY must not be available to the production web runtime; keep it only in the Convex deployment job.")
    for (const name of ["CONVEX_MEMBER_JWT_PRIVATE_KEY", "CONVEX_ADMIN_JWT_PRIVATE_KEY", "CONVEX_WEBHOOK_JWT_PRIVATE_KEY", "CONVEX_BACKGROUND_JWT_PRIVATE_KEY", "CONVEX_AUTH_JWT_PRIVATE_KEY"] as const) {
      const value = environment[name]?.replace(/\\n/g, "\n") ?? ""
      if (!value.includes(pkcs8Start) || !value.includes(pkcs8End)) errors.push(`${name} must be a PKCS#8 private key.`)
    }
    if (origin(environment.NEXT_PUBLIC_APP_URL) && origin(environment.NEXTAUTH_URL) && origin(environment.NEXT_PUBLIC_APP_URL) !== origin(environment.NEXTAUTH_URL)) {
      errors.push("NEXT_PUBLIC_APP_URL and NEXTAUTH_URL must use the same production origin.")
    }
    if ((environment.AUTH_SECRET?.length ?? 0) < 32) errors.push("AUTH_SECRET must contain at least 32 characters in production.")
    if (environment.ENABLE_HSTS !== "1") warnings.push("ENABLE_HSTS is not enabled; confirm HTTPS and the canonical domain before setting it to 1.")
    const minimumAge = Number(environment.MINIMUM_USER_AGE)
    if (!Number.isInteger(minimumAge) || minimumAge < 13 || minimumAge > 21) errors.push("MINIMUM_USER_AGE must be an integer from 13 through 21.")
    for (const name of ["LEGAL_CONTACT_EMAIL", "SECURITY_CONTACT_EMAIL", "SUPPORT_CONTACT_EMAIL"] as const) {
      if (environment[name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(environment[name])) errors.push(`${name} must be a valid monitored email address.`)
    }
  }

  const googleValues = [environment.GOOGLE_CLIENT_ID, environment.GOOGLE_CLIENT_SECRET]
  if (googleValues.some(Boolean) && !googleValues.every(Boolean)) errors.push("Google OAuth requires both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
  if (environment.GOOGLE_CLIENT_ID && !/^[A-Za-z0-9_-]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(environment.GOOGLE_CLIENT_ID)) {
    errors.push("GOOGLE_CLIENT_ID is not a valid Google Web application client ID.")
  }
  if (environment.ENABLE_HSTS && !["0", "1"].includes(environment.ENABLE_HSTS)) errors.push("ENABLE_HSTS must be 0 or 1.")
  if (environment.TRUSTED_PROXY_HOPS && (!Number.isInteger(Number(environment.TRUSTED_PROXY_HOPS)) || Number(environment.TRUSTED_PROXY_HOPS) < 0 || Number(environment.TRUSTED_PROXY_HOPS) > 5)) errors.push("TRUSTED_PROXY_HOPS must be an integer from 0 through 5.")

  const legacyAdminValues = [environment.ADMIN_EMAIL, environment.ADMIN_PASSWORD_HASH, environment.ADMIN_TOTP_SECRET, environment.ADMIN_ROLES]
  const adminValues = [...legacyAdminValues, environment.ADMIN_ACCOUNTS_JSON, environment.ADMIN_SESSION_SECRET]
  if (environment.ADMIN_ACCOUNTS_JSON) {
    if ((environment.ADMIN_SESSION_SECRET?.length ?? 0) < 32) errors.push("ADMIN_SESSION_SECRET must contain at least 32 characters.")
    try {
      const accounts = JSON.parse(environment.ADMIN_ACCOUNTS_JSON) as unknown
      if (!Array.isArray(accounts) || !accounts.length || accounts.length > 50) throw new Error("invalid")
      const emails = new Set<string>()
      for (const account of accounts) {
        if (!account || typeof account !== "object") throw new Error("invalid")
        const value = account as Record<string, unknown>
        if (typeof value.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || typeof value.passwordHash !== "string" || !/^\$2[aby]\$\d{2}\$/.test(value.passwordHash) || typeof value.totpSecret !== "string" || !/^[A-Z2-7]{16,}$/.test(value.totpSecret.replace(/\s+/g, "").toUpperCase()) || !Array.isArray(value.roles) || !value.roles.length || value.roles.some((role) => typeof role !== "string" || !["support-read", "support-write", "billing", "security-auditor", "owner"].includes(role))) throw new Error("invalid")
        const email = value.email.trim().toLowerCase()
        if (emails.has(email)) throw new Error("duplicate")
        emails.add(email)
      }
    } catch { errors.push("ADMIN_ACCOUNTS_JSON must contain 1-50 unique administrators with bcrypt passwordHash, Base32 totpSecret, and supported roles.") }
    if (legacyAdminValues.some(Boolean)) warnings.push("Legacy single-admin variables are ignored while ADMIN_ACCOUNTS_JSON is configured.")
  } else if (legacyAdminValues.some(Boolean) || environment.ADMIN_SESSION_SECRET) {
    if (!adminValues.every(Boolean)) errors.push("Admin authentication requires ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET, ADMIN_TOTP_SECRET, and ADMIN_ROLES together.")
    if (environment.ADMIN_PASSWORD_HASH && !/^\$2[aby]\$\d{2}\$/.test(environment.ADMIN_PASSWORD_HASH)) errors.push("ADMIN_PASSWORD_HASH must be a bcrypt hash.")
    if ((environment.ADMIN_SESSION_SECRET?.length ?? 0) < 32) errors.push("ADMIN_SESSION_SECRET must contain at least 32 characters.")
    if (environment.ADMIN_TOTP_SECRET && !/^[A-Z2-7]{16,}$/.test(environment.ADMIN_TOTP_SECRET.replace(/\s+/g, "").toUpperCase())) errors.push("ADMIN_TOTP_SECRET must be a Base32 authenticator secret with at least 16 characters.")
    const roles = (environment.ADMIN_ROLES || "").split(",").map((role) => role.trim()).filter(Boolean)
    if (roles.some((role) => !["support-read", "support-write", "billing", "security-auditor", "owner"].includes(role))) errors.push("ADMIN_ROLES contains an unsupported administrator role.")
  } else {
    warnings.push("Admin authentication is disabled because no admin credential set is configured.")
  }
  if (production && !environment.ADMIN_ACCOUNTS_JSON) errors.push("ADMIN_ACCOUNTS_JSON is required in production so every named administrator has MFA and explicit roles.")

  if (environment.GEMINI_API_KEY && !environment.GEMINI_MODEL) errors.push("GEMINI_MODEL is required when GEMINI_API_KEY is configured.")
  if (environment.GEMINI_DISABLED && !["0", "1"].includes(environment.GEMINI_DISABLED)) errors.push("GEMINI_DISABLED must be 0 or 1.")
  const geminiRates = [environment.GEMINI_INPUT_COST_PER_MILLION_USD, environment.GEMINI_OUTPUT_COST_PER_MILLION_USD]
  if (geminiRates.some(Boolean) && !geminiRates.every(Boolean)) errors.push("Gemini cost tracking requires both input and output per-million-token rates.")
  for (const [name, value] of [
    ["GEMINI_INPUT_COST_PER_MILLION_USD", environment.GEMINI_INPUT_COST_PER_MILLION_USD],
    ["GEMINI_OUTPUT_COST_PER_MILLION_USD", environment.GEMINI_OUTPUT_COST_PER_MILLION_USD],
  ] as const) {
    if (value && (!Number.isFinite(Number(value)) || Number(value) < 0)) errors.push(`${name} must be a non-negative number.`)
  }

  const razorpayValues = [
    environment.RAZORPAY_KEY_ID,
    environment.RAZORPAY_KEY_SECRET,
    environment.RAZORPAY_WEBHOOK_SECRET,
    environment.RAZORPAY_PLAN_ID_PRO_MONTHLY,
    environment.RAZORPAY_PLAN_ID_FOUNDER,
  ]
  if (razorpayValues.some(Boolean) && !razorpayValues.every(Boolean)) {
    errors.push("Razorpay must be either fully configured or fully disabled; partial configuration is unsafe.")
  }
  if (environment.BILLING_CHECKOUT_ENABLED && !["true", "false"].includes(environment.BILLING_CHECKOUT_ENABLED)) errors.push("BILLING_CHECKOUT_ENABLED must be true or false.")
  if (environment.BILLING_CHECKOUT_ENABLED === "true" && !razorpayValues.every(Boolean)) errors.push("Checkout cannot be enabled until Razorpay is fully configured.")
  const emailValues = [environment.RESEND_API_KEY, environment.RESEND_WEBHOOK_SECRET, environment.TRANSACTIONAL_EMAIL_FROM]
  if (emailValues.some(Boolean) && !emailValues.every(Boolean)) errors.push("Transactional email must be fully configured or fully disabled.")

  return { environment, errors: [...new Set(errors)], warnings: [...new Set(warnings)] }
}

export function assertEnvironment(
  input: Record<string, string | undefined>,
  options: { production?: boolean } = {}
): GrowthAiEnvironment {
  const result = validateEnvironment(input, options)
  if (result.errors.length) {
    throw new Error(`Invalid GrowthAI environment:\n- ${result.errors.join("\n- ")}`)
  }
  return result.environment
}
