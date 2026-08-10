import { generateKeyPairSync, randomBytes } from "node:crypto"

const roles = ["MEMBER", "ADMIN", "WEBHOOK", "BACKGROUND", "AUTH"] as const

console.log("# Store these only in the corresponding application runtime secret store.")
for (const role of roles) {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 3072,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  })
  // JSON.stringify escapes PEM newlines once. Pre-escaping them would make
  // dotenv preserve an extra backslash at the end of every decoded PEM line.
  console.log(`CONVEX_${role}_JWT_PRIVATE_KEY=${JSON.stringify(privateKey)}`)
  console.log(`CONVEX_${role}_JWT_KEY_ID=growthai-${role.toLowerCase()}-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`)
}
console.log("# Set this value in the Convex deployment environment, not the web runtime.")
console.log(`DELETED_IDENTITY_HMAC_SECRET=${randomBytes(32).toString("base64url")}`)
