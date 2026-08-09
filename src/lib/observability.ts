import { createHash, randomUUID } from "node:crypto"

type LogLevel = "info" | "warn" | "error"
type SafeField = string | number | boolean | null | undefined

export function correlationId(value?: string | null) {
  return value && /^[A-Za-z0-9_-]{8,100}$/.test(value) ? value : randomUUID()
}

export function safeIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16)
}

export function operationalLog(level: LogLevel, event: string, fields: Record<string, SafeField> = {}) {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, event: event.slice(0, 80), ...fields })
  if (level === "error") console.error(entry)
  else if (level === "warn") console.warn(entry)
  else console.info(entry)
}
