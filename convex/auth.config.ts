import type { AuthConfig } from "convex/server"

const baseUrl = process.env.CONVEX_AUTH_BASE_URL

if (!baseUrl) {
  throw new Error("CONVEX_AUTH_BASE_URL must be configured in the Convex deployment environment")
}

const origin = new URL(baseUrl).origin
const audience = "growthai-convex"
const roles = ["member", "admin", "webhook", "background", "auth"] as const

export default {
  providers: roles.map((role) => ({
    type: "customJwt" as const,
    issuer: `${origin}/convex/${role}`,
    applicationID: audience,
    jwks: `${origin}/api/convex/jwks/${role}`,
    algorithm: "RS256" as const,
  })),
} satisfies AuthConfig
