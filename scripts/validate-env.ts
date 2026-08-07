import { loadEnvConfig } from "@next/env"

import { validateEnvironment } from "../src/lib/env"

loadEnvConfig(process.cwd())
const result = validateEnvironment(process.env, { production: true })

for (const warning of result.warnings) console.warn(`Environment warning: ${warning}`)
if (result.errors.length) {
  console.error(`Environment validation failed:\n- ${result.errors.join("\n- ")}`)
  process.exitCode = 1
} else {
  console.log("Production environment validation passed.")
}
