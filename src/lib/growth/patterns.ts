import type { GrowthCheckIn, PatternInsight } from "./types"

export type DetectedPattern = Pick<PatternInsight, "type" | "summary" | "confidence" | "supportingCheckInIds">

function normalizedWords(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3)
}

function overlap(left: string, right: string): number {
  const a = new Set(normalizedWords(left))
  const b = new Set(normalizedWords(right))
  if (a.size === 0 || b.size === 0) return 0
  return [...a].filter((word) => b.has(word)).length / Math.min(a.size, b.size)
}

export function detectPatterns(checkIns: GrowthCheckIn[]): DetectedPattern[] {
  const recent = [...checkIns].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  const patterns: DetectedPattern[] = []

  const blockers = recent.filter((item) => item.classification === "real_blocker")
  if (blockers.length >= 2 && overlap(blockers[0].response, blockers[1].response) >= 0.25) {
    patterns.push({
      type: "repeated_blocker",
      summary: "A similar blocker has appeared more than once. Decide whether it needs a smaller experiment, outside help, or a scope change.",
      confidence: 0.72,
      supportingCheckInIds: blockers.slice(0, 3).map((item) => item.id),
    })
  }

  const lastThree = recent.slice(0, 3)
  if (lastThree.length === 3 && lastThree.every((item) => item.response.trim().length < 55 || item.classification === "unclear")) {
    patterns.push({
      type: "vague_checkins",
      summary: "Your latest updates are getting shorter or harder to verify. Name one artifact or observable change in the next check-in.",
      confidence: 0.78,
      supportingCheckInIds: lastThree.map((item) => item.id),
    })
  }

  if (lastThree.length >= 2 && overlap(lastThree[0].nextAction, lastThree[1].nextAction) >= 0.6) {
    patterns.push({
      type: "carried_action",
      summary: "The same next action is being carried forward. Reduce it until it can be finished in one focused session.",
      confidence: 0.82,
      supportingCheckInIds: lastThree.slice(0, 2).map((item) => item.id),
    })
  }
  return patterns
}
