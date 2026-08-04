import { describe, expect, it } from "vitest"
import { parseAccountabilityAnalysis } from "./accountability-ai"

describe("accountability output validation", () => {
  it("accepts and bounds valid structured output", () => {
    const result = parseAccountabilityAnalysis({
      classification: "real_blocker", confidence: 4, evidencePhrase: "callback fails", response: "Run the smallest callback test.",
      followUpQuestion: "Which environment fails?", suggestedNextAction: "reproduce locally", modelName: "test",
    })
    expect(result?.confidence).toBe(1)
    expect(result?.classification).toBe("real_blocker")
  })

  it("rejects unknown classifications and empty replies", () => {
    expect(parseAccountabilityAnalysis({ classification: "lazy", response: "No" })).toBeNull()
    expect(parseAccountabilityAnalysis({ classification: "unclear", response: "" })).toBeNull()
  })
})
