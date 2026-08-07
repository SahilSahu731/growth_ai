export async function identityHash(value: string) {
  const configured = process.env.DELETED_IDENTITY_HMAC_SECRET
  const secret = configured || (process.env.NODE_ENV === "test" ? "growthai-test-only-deleted-identity-secret" : "")
  if (secret.length < 32) throw new Error("DELETED_IDENTITY_HMAC_SECRET must contain at least 32 characters")
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`growthai-deleted-identity-v2|${value.trim().toLowerCase()}`))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}
