const SMALL_WORDS = new Set(["a", "an", "and", "at", "but", "for", "in", "of", "on", "or", "the", "to", "with"])

function titleCase(words: string[]) {
  return words.map((word, index) => {
    if (index > 0 && SMALL_WORDS.has(word.toLowerCase())) return word.toLowerCase()
    if (/^[A-Z0-9]{2,}$/.test(word)) return word
    return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
  }).join(" ")
}

export function conversationTitle(message: string) {
  const original = message.replace(/[`*_#>]/g, " ").replace(/\s+/g, " ").trim()
  if (!original) return "New conversation"
  if (/\bfeel stuck\b.*\b(?:don'?t|do not) know why\b/i.test(original)) return "Finding Direction When Feeling Stuck"
  if (/\bcannot stay consistent\b|\bcan'?t stay consistent\b/i.test(original)) return "Building Better Consistency"
  if (/\bdecid(?:e|ing).*what to do next\b/i.test(original)) return "Deciding What to Do Next"

  let subject = original
    .replace(/^(?:hey|hi|hello)\b[\s,!.-]*/i, "")
    .replace(/^(?:now\s+)?(?:i\s+)?(?:want|need)(?:\s+you)?\s+to\s+/i, "")
    .replace(/^(?:can|could|would)\s+you\s+/i, "")
    .replace(/^please\s+/i, "")
    .replace(/^help\s+me(?:\s+(?:with|to))?\s+/i, "")
    .split(/[.!?\n]/, 1)[0]
    .replace(/[^\p{L}\p{N}\s'&+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (subject.length < 3) subject = original
  const words = subject.split(" ").filter(Boolean).slice(0, 7)
  const title = titleCase(words).slice(0, 56).trim()
  return title || "New conversation"
}
