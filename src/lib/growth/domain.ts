import type { CheckInCadence, CheckInClassification, CheckInState, CoachTone } from "./types"

export const FREE_ACTIVE_PROJECT_LIMIT = 1
export const PRO_ACTIVE_PROJECT_LIMIT = 10
export const CHECK_IN_GRACE_HOURS = 18

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function normalizeProjectSlug(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56)
}

export function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date())
    return true
  } catch {
    return false
  }
}

export function localDateKey(date: Date, timezone: string): string {
  const parts = zonedParts(date, timezone)
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
}

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]))
}

export function nextCheckInAt(input: {
  after: Date
  timezone: string
  hour: number
  minute: number
  cadence: CheckInCadence
}): Date {
  if (!isValidTimezone(input.timezone)) throw new Error("Invalid timezone")
  const current = zonedParts(input.after, input.timezone)
  const toUtc = (year: number, month: number, day: number) => {
    const desiredAsUtc = Date.UTC(year, month - 1, day, input.hour, input.minute, 0)
    let candidate = new Date(desiredAsUtc)
    for (let index = 0; index < 3; index += 1) {
      const observed = zonedParts(candidate, input.timezone)
      const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second)
      candidate = new Date(candidate.getTime() + desiredAsUtc - observedAsUtc)
    }
    return candidate
  }
  let candidate = toUtc(current.year, current.month, current.day)
  if (candidate.getTime() <= input.after.getTime()) {
    const days = input.cadence === "daily" ? 1 : 2
    const nextLocalDate = new Date(Date.UTC(current.year, current.month - 1, current.day + days))
    candidate = toUtc(nextLocalDate.getUTCFullYear(), nextLocalDate.getUTCMonth() + 1, nextLocalDate.getUTCDate())
  }
  return candidate
}

export function deriveClassification(state: CheckInState, response: string): CheckInClassification {
  if (state === "blocked") return "real_blocker"
  if (state === "avoiding" || state === "pause_request") return "avoidance_signal"
  const concreteSignals = /(walked|exercised|trained|stretched|called|spoke|listened|apologized|saved|budgeted|paid|read|studied|practiced|learned|slept|rested|meditated|journaled|cooked|applied|asked|attended|created|finished|started|wrote|designed|built|shipped|published|launched|implemented|fixed|tested)/i
  if (concreteSignals.test(response)) return "meaningful_progress"
  if (response.trim().length < 30) return "unclear"
  return "maintenance"
}

export function fallbackCoachResponse(input: {
  state: CheckInState
  response: string
  nextAction: string
  tone: CoachTone
}): string {
  const classification = deriveClassification(input.state, input.response)
  if (classification === "meaningful_progress") return `That is concrete movement. Protect the momentum by finishing: ${input.nextAction}`
  if (classification === "real_blocker") return `The blocker is now visible. What is the smallest test that would remove uncertainty before you continue with: ${input.nextAction}?`
  if (classification === "avoidance_signal") {
    return input.tone === "blunt"
      ? `You named the avoidance, which is better than hiding it. Reduce the scope and do the first 15 minutes of: ${input.nextAction}`
      : `Thanks for naming what is happening. Make the restart smaller: spend 15 minutes beginning ${input.nextAction}.`
  }
  return `This update is still hard to verify. Name one thing that changed, then complete: ${input.nextAction}`
}

export function updatedStreak(input: {
  currentStreak: number
  longestStreak: number
  lastQualifyingDate: string | null
  localDate: string
  cadence: CheckInCadence
}) {
  if (input.lastQualifyingDate === input.localDate) {
    return { currentStreak: input.currentStreak, longestStreak: input.longestStreak, lastQualifyingDate: input.localDate }
  }
  if (!input.lastQualifyingDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, input.longestStreak), lastQualifyingDate: input.localDate }
  }
  const previous = new Date(`${input.lastQualifyingDate}T00:00:00Z`)
  const current = new Date(`${input.localDate}T00:00:00Z`)
  const days = Math.round((current.getTime() - previous.getTime()) / 86_400_000)
  const allowance = input.cadence === "daily" ? 1 : 2
  const currentStreak = days <= allowance ? input.currentStreak + 1 : 1
  return { currentStreak, longestStreak: Math.max(currentStreak, input.longestStreak), lastQualifyingDate: input.localDate }
}

export function isMeaningfulCheckIn(response: string, classification: CheckInClassification): boolean {
  return response.trim().length >= 12 && classification !== "unclear"
}
