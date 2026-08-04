import { describe, expect, it } from "vitest"
import type { GrowthCheckIn } from "./types"
import { detectPatterns } from "./patterns"

function checkIn(overrides: Partial<GrowthCheckIn>): GrowthCheckIn {
  return {
    id: crypto.randomUUID(), projectId: "p1", response: "Worked on the product", state: "progress",
    classification: "maintenance", confidence: 0.7, aiResponse: "", followUpQuestion: "", nextAction: "finish onboarding",
    evidenceUrl: "", promptVersion: "v1", helpful: null, createdAt: new Date().toISOString(), ...overrides,
  }
}

describe("pattern detection", () => {
  it("detects repeated blockers with evidence ids", () => {
    const result = detectPatterns([
      checkIn({ id: "a", classification: "real_blocker", response: "OAuth callback keeps failing in production", createdAt: "2026-08-04T12:00:00Z" }),
      checkIn({ id: "b", classification: "real_blocker", response: "Production OAuth callback is still failing", createdAt: "2026-08-03T12:00:00Z" }),
    ])
    expect(result.find((item) => item.type === "repeated_blocker")?.supportingCheckInIds).toEqual(["a", "b"])
  })

  it("does not infer patterns from one entry", () => {
    expect(detectPatterns([checkIn({ classification: "real_blocker" })])).toEqual([])
  })
})
