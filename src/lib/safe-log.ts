const secrets = [
  /\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g,
  /\b(?:sk|key|token|secret|password)[_-]?[A-Za-z0-9_-]{8,}\b/gi,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:\d[ -]*?){13,19}\b/g,
]

export function redactLogText(value: string) {
  return secrets.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), value).replace(/[\r\n\t]+/g, " ").slice(0, 500)
}

export function safeErrorForLog(error: unknown) {
  if (!(error instanceof Error)) return { name: "UnknownError", message: "Unknown failure" }
  const code = "code" in error && typeof error.code === "string" ? redactLogText(error.code) : undefined
  return { name: error.name.slice(0, 80), message: redactLogText(error.message), ...(code ? { code } : {}) }
}
