const DEVELOPMENT_URL = "http://localhost:3000"

export function publicAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) {
    try {
      return new URL(configured).origin
    } catch {
      // Production validation rejects this; local rendering uses a stable URL.
    }
  }
  return DEVELOPMENT_URL
}

export function publicAppUrlObject() {
  return new URL(publicAppUrl())
}
