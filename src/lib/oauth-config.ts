export type OAuthProviderAvailability = {
  google: boolean
  github: boolean
}

export function getGithubOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID ?? process.env.GITHUB_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_SECRET
  return { clientId, clientSecret, enabled: Boolean(clientId && clientSecret) }
}

export function getGoogleOAuthConfig() {
  const clientId = (process.env.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_ID)?.trim()
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_SECRET)?.trim()
  const validClientId = Boolean(clientId && /^[A-Za-z0-9_-]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId))

  return {
    clientId,
    clientSecret,
    enabled: Boolean(validClientId && clientSecret && clientSecret.length >= 20),
  }
}

export function getOAuthProviderAvailability(): OAuthProviderAvailability {
  return {
    google: getGoogleOAuthConfig().enabled,
    github: getGithubOAuthConfig().enabled,
  }
}
