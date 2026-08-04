import { describe, expect, it } from "vitest"

import {
  deriveClassification,
  fallbackCoachResponse,
  isMeaningfulCheckIn,
  isValidTimezone,
  localDateKey,
  nextCheckInAt,
  normalizeProjectSlug,
  updatedStreak,
} from "./domain"

describe("GrowthAI domain", () => {
  it("normalizes safe public slugs", () => {
    expect(normalizeProjectSlug("  Ship My SaaS! 🚀 ")).toBe("ship-my-saas")
  })

  it("validates IANA timezones", () => {
    expect(isValidTimezone("Asia/Kolkata")).toBe(true)
    expect(isValidTimezone("Mars/Olympus")).toBe(false)
  })

  it("creates stable local date keys", () => {
    expect(localDateKey(new Date("2026-08-04T20:00:00Z"), "Asia/Kolkata")).toBe("2026-08-05")
  })

  it("schedules a future check-in in a half-hour timezone", () => {
    const result = nextCheckInAt({
      after: new Date("2026-08-04T10:00:00Z"),
      timezone: "Asia/Kolkata",
      hour: 20,
      minute: 30,
      cadence: "daily",
    })
    expect(result.toISOString()).toBe("2026-08-04T15:00:00.000Z")
  })

  it("classifies explicit progress and blockers deterministically", () => {
    expect(deriveClassification("progress", "Implemented the onboarding flow and deployed it.")).toBe("meaningful_progress")
    expect(deriveClassification("blocked", "The OAuth callback fails.")).toBe("real_blocker")
  })

  it("uses respectful recovery language", () => {
    const response = fallbackCoachResponse({ state: "avoiding", response: "I avoided it", nextAction: "open the failing test", tone: "blunt" })
    expect(response).toContain("15 minutes")
    expect(response.toLowerCase()).not.toContain("lazy")
  })

  it("increments or resets streaks based on cadence", () => {
    expect(updatedStreak({ currentStreak: 3, longestStreak: 5, lastQualifyingDate: "2026-08-03", localDate: "2026-08-04", cadence: "daily" }).currentStreak).toBe(4)
    expect(updatedStreak({ currentStreak: 3, longestStreak: 5, lastQualifyingDate: "2026-08-01", localDate: "2026-08-04", cadence: "daily" }).currentStreak).toBe(1)
    expect(updatedStreak({ currentStreak: 3, longestStreak: 5, lastQualifyingDate: "2026-08-02", localDate: "2026-08-04", cadence: "every_other_day" }).currentStreak).toBe(4)
  })

  it("does not reward unverifiable empty updates", () => {
    expect(isMeaningfulCheckIn("tiny", "unclear")).toBe(false)
    expect(isMeaningfulCheckIn("Fixed the signup callback", "meaningful_progress")).toBe(true)
  })
})
