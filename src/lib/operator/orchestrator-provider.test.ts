import { beforeEach, describe, expect, it, vi } from "vitest"

const provider = vi.hoisted(() => ({ generateContent: vi.fn() }))

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: provider.generateContent }
  },
}))

import { generateOperatorTurn } from "./orchestrator"

const input = {
  message: "Help me choose one next step",
  history: [],
  tasks: [],
  goals: [],
  state: "discovery" as const,
  today: "2026-08-07",
  coachTone: "blunt" as const,
  locale: "en-IN",
}

describe("Gemini provider contract", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("GEMINI_API_KEY", "fixture-key")
    vi.stubEnv("GEMINI_MODEL", "fixture-supported-model")
    vi.stubEnv("GEMINI_DISABLED", "0")
    vi.stubEnv("GEMINI_INPUT_COST_PER_MILLION_USD", "1")
    vi.stubEnv("GEMINI_OUTPUT_COST_PER_MILLION_USD", "2")
  })

  it("uses system instructions and a structured JSON response schema", async () => {
    provider.generateContent.mockResolvedValue({
      text: JSON.stringify({ content: "Choose the smallest visible outcome.", state: "focus_proposal", quickReplies: ["Draft it"], taskDrafts: [] }),
      candidates: [{ finishReason: "STOP" }],
      modelVersion: "fixture-model-v1",
      usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 40 },
    })
    const result = await generateOperatorTurn(input)
    const request = provider.generateContent.mock.calls[0]?.[0]
    expect(request.config.systemInstruction).toContain("selected coaching tone is blunt")
    expect(request.config.responseMimeType).toBe("application/json")
    expect(request.config.responseJsonSchema.required).toEqual(["content", "state", "quickReplies", "taskDrafts"])
    expect(request.contents[0].parts[0].text).toContain("newUserMessage")
    expect(result).toMatchObject({ modelName: "fixture-model-v1", inputTokens: 120, outputTokens: 40, estimatedCostUsd: 0.0002, generationOutcome: "provider_success", finishReason: "STOP" })
  })

  it("falls back safely when the provider blocks or returns malformed data", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    provider.generateContent.mockResolvedValue({ text: "", candidates: [], promptFeedback: { blockReason: "SAFETY" } })
    const result = await generateOperatorTurn(input)
    expect(result.modelName).toBe("deterministic-safety-provider-block")
    expect(result.taskDrafts).toEqual([])
    expect(result.generationOutcome).toBe("provider_refusal")
  })

  it.each([
    [new DOMException("timed out", "AbortError"), "provider_timeout"],
    [Object.assign(new Error("overloaded"), { status: 429 }), "provider_overload"],
  ])("classifies provider failure paths: %s", async (failure, expected) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    provider.generateContent.mockRejectedValue(failure)
    const result = await generateOperatorTurn(input)
    expect(result.generationOutcome).toBe(expected)
    expect(result.modelName).toBe("deterministic-operator")
  })

  it("classifies truncation and malformed structured output separately", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    provider.generateContent.mockResolvedValueOnce({ text: "{}", candidates: [{ finishReason: "MAX_TOKENS" }] })
    await expect(generateOperatorTurn(input)).resolves.toMatchObject({ generationOutcome: "provider_truncated" })
    provider.generateContent.mockResolvedValueOnce({ text: "not-json", candidates: [{ finishReason: "STOP" }] })
    await expect(generateOperatorTurn(input)).resolves.toMatchObject({ generationOutcome: "provider_malformed" })
  })

  it("honors the provider kill switch", async () => {
    vi.stubEnv("GEMINI_DISABLED", "1")
    const result = await generateOperatorTurn(input)
    expect(provider.generateContent).not.toHaveBeenCalled()
    expect(result.modelName).toBe("deterministic-operator")
  })

  it("uses fallback without contacting Gemini while the global circuit is open", async () => {
    const result = await generateOperatorTurn({ ...input, providerCircuitOpen: true })
    expect(provider.generateContent).not.toHaveBeenCalled()
    expect(result).toMatchObject({ modelName: "deterministic-operator", generationOutcome: "fallback_circuit_open" })
  })
})
