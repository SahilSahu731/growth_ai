export function safeCallbackPath(value: string | null | undefined, fallback = "/chat"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback
  try {
    const parsed = new URL(value, "https://growthai.local")
    if (parsed.origin !== "https://growthai.local") return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
