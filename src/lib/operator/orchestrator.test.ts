import { describe, expect, it } from "vitest"

import { generateOperatorTurn, parseOperatorTurn } from "./orchestrator"

describe("parseOperatorTurn", () => {
  it("enforces task and scheduling limits", () => {
    const result = parseOperatorTurn({
      content: "Here is a focused plan.",
      state: "PLAN_CREATION",
      quickReplies: ["One", "Two", "Three", "Four"],
      taskDrafts: [
        { title: "First", note: "", estimatedMinutes: 500, completionCondition: "A draft exists", scheduledFor: "2026-08-01" },
        { title: "Second", note: "", estimatedMinutes: 1, completionCondition: "Sent", scheduledFor: "2026-09-01" },
      ],
    }, "2026-08-05", "test-model")

    expect(result?.state).toBe("plan_creation")
    expect(result?.quickReplies).toHaveLength(3)
    expect(result?.taskDrafts[0]).toMatchObject({ estimatedMinutes: 240, scheduledFor: "2026-08-05" })
    expect(result?.taskDrafts[1]).toMatchObject({ estimatedMinutes: 5, scheduledFor: "2026-08-12" })
  })

  it("rejects malformed responses", () => {
    expect(parseOperatorTurn({ content: "Hi", state: "unknown" }, "2026-08-05")).toBeNull()
  })

  it("starts with discovery instead of forcing a plan", async () => {
    const result = await generateOperatorTurn({
      message: "I feel stuck but do not know why",
      history: [],
      tasks: [],
      goals: [],
      state: "discovery",
      today: "2026-08-05",
    })

    expect(result.state).toBe("discovery")
    expect(result.taskDrafts).toEqual([])
    expect(result.quickReplies.length).toBeGreaterThan(0)
  })

  it("creates a bounded task proposal when asked", async () => {
    const result = await generateOperatorTurn({
      message: "Build me a career plan with tasks",
      history: [],
      tasks: [],
      goals: [],
      state: "discovery",
      today: "2026-08-05",
    })

    expect(result.state).toBe("plan_creation")
    expect(result.taskDrafts).toHaveLength(3)
    expect(result.taskDrafts.every((task) => task.estimatedMinutes >= 5 && task.completionCondition.length > 3)).toBe(true)
  })
})
