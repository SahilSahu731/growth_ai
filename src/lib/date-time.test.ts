import { describe, expect, it } from "vitest"

import { dateKeyInTimeZone, formatDateOnly, localDateStartUtc, sevenDayWindowStart } from "./date-time"

describe("timezone and locale helpers", () => {
  it("derives Today from the user's timezone", () => {
    const instant = new Date("2026-08-07T20:00:00.000Z")
    expect(dateKeyInTimeZone(instant, "Asia/Kolkata")).toBe("2026-08-08")
    expect(dateKeyInTimeZone(instant, "America/Los_Angeles")).toBe("2026-08-07")
  })

  it("converts local midnight and seven-day windows across offsets", () => {
    expect(localDateStartUtc("2026-08-08", "Asia/Kolkata").toISOString()).toBe("2026-08-07T18:30:00.000Z")
    expect(sevenDayWindowStart("Asia/Kolkata", new Date("2026-08-08T10:00:00.000Z")).toISOString()).toBe("2026-08-01T18:30:00.000Z")
  })

  it("formats date-only values without timezone date drift", () => {
    expect(formatDateOnly("2026-08-08", "en-IN", { month: "short", day: "numeric" })).toContain("8")
  })
})
