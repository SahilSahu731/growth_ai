import type { OAuthProviderAvailability } from "@/components/auth/oauth-buttons"

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_SECRET

  return {
    clientId,
    clientSecret,
    enabled: Boolean(clientId && clientSecret),
  }
}

export function getOAuthProviderAvailability(): OAuthProviderAvailability {
  return {
    google: getGoogleOAuthConfig().enabled,
  }
}
