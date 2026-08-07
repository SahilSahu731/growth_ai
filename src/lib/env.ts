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
  NEXT_PUBLIC_CONVEX_URL: optionalString,
  CONVEX_DEPLOYMENT: optionalString,
  CONVEX_DEPLOY_KEY: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  ADMIN_EMAIL: optionalString,
  ADMIN_PASSWORD_HASH: optionalString,
  ADMIN_SESSION_SECRET: optionalString,
  ADMIN_SESSION_VERSION: optionalString,
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
}).passthrough()

export type GrowthAiEnvironment = z.infer<typeof environmentSchema>

export type EnvironmentValidation = {
  environment: GrowthAiEnvironment
  errors: string[]
  warnings: string[]
}

const placeholders = /^(replace-|your-|changeme|example|todo|dev:your-|https:\/\/your-)/i

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
      "CONVEX_DEPLOY_KEY",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
    ] as const) requireValue(name)

    if (!isHttpsUrl(environment.NEXT_PUBLIC_APP_URL)) errors.push("NEXT_PUBLIC_APP_URL must be an absolute HTTPS URL in production.")
    if (!isHttpsUrl(environment.NEXTAUTH_URL)) errors.push("NEXTAUTH_URL must be an absolute HTTPS URL in production.")
    if (!isHttpsUrl(environment.NEXT_PUBLIC_CONVEX_URL)) errors.push("NEXT_PUBLIC_CONVEX_URL must be an absolute HTTPS URL in production.")
    if (origin(environment.NEXT_PUBLIC_APP_URL) && origin(environment.NEXTAUTH_URL) && origin(environment.NEXT_PUBLIC_APP_URL) !== origin(environment.NEXTAUTH_URL)) {
      errors.push("NEXT_PUBLIC_APP_URL and NEXTAUTH_URL must use the same production origin.")
    }
    if ((environment.AUTH_SECRET?.length ?? 0) < 32) errors.push("AUTH_SECRET must contain at least 32 characters in production.")
  }

  const googleValues = [environment.GOOGLE_CLIENT_ID, environment.GOOGLE_CLIENT_SECRET]
  if (googleValues.some(Boolean) && !googleValues.every(Boolean)) errors.push("Google OAuth requires both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
  if (environment.GOOGLE_CLIENT_ID && !/^[A-Za-z0-9_-]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(environment.GOOGLE_CLIENT_ID)) {
    errors.push("GOOGLE_CLIENT_ID is not a valid Google Web application client ID.")
  }

  const adminValues = [environment.ADMIN_EMAIL, environment.ADMIN_PASSWORD_HASH, environment.ADMIN_SESSION_SECRET]
  if (adminValues.some(Boolean)) {
    if (!adminValues.every(Boolean)) errors.push("Admin authentication requires ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and ADMIN_SESSION_SECRET together.")
    if (environment.ADMIN_PASSWORD_HASH && !/^\$2[aby]\$\d{2}\$/.test(environment.ADMIN_PASSWORD_HASH)) errors.push("ADMIN_PASSWORD_HASH must be a bcrypt hash.")
    if ((environment.ADMIN_SESSION_SECRET?.length ?? 0) < 32) errors.push("ADMIN_SESSION_SECRET must contain at least 32 characters.")
  } else {
    warnings.push("Admin authentication is disabled because no admin credential set is configured.")
  }

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
