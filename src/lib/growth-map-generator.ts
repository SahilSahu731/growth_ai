import "server-only"

import { GoogleGenAI } from "@google/genai"

import type { GrowthRoadmapNodeInput } from "@/lib/data/growth-map"
import { safeErrorForLog } from "@/lib/safe-log"

type GeneratedRoadmap = { title: string; outcome: string; nodes: GrowthRoadmapNodeInput[] }

function fallback(topic: string, outcome: string): GeneratedRoadmap {
  const subject = topic.trim().replace(/\s+/g, " ").slice(0, 80)
  const target = outcome.trim().replace(/\s+/g, " ").slice(0, 300)
  return {
    title: `${subject} roadmap`,
    outcome: target,
    nodes: [
      { key: "foundation", title: `${subject} foundations`, description: `Learn the vocabulary, mental models, and essential fundamentals required to work confidently with ${subject}.`, stage: 1, type: "foundation", estimatedHours: 12, parentKeys: [] },
      { key: "guided-core", title: "Guided core practice", description: "Follow a structured sequence of worked examples, then reproduce each concept without copying.", stage: 2, type: "core", estimatedHours: 20, parentKeys: ["foundation"] },
      { key: "independent-practice", title: "Independent problem solving", description: "Solve progressively harder exercises, record mistakes, and revisit weak concepts deliberately.", stage: 3, type: "practice", estimatedHours: 30, parentKeys: ["guided-core"] },
      { key: "small-project", title: "Build a focused project", description: `Create a small complete artifact that demonstrates practical command of ${subject}.`, stage: 4, type: "project", estimatedHours: 24, parentKeys: ["independent-practice"] },
      { key: "capstone", title: "Complete the target outcome", description: target, stage: 5, type: "project", estimatedHours: 40, parentKeys: ["small-project"] },
    ],
  }
}

function parse(value: unknown, topic: string, outcome: string): GeneratedRoadmap | null {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.nodes)) return null
  const validTypes = new Set(["foundation", "core", "practice", "project"])
  const nodes = raw.nodes.slice(0, 30).flatMap((item, index): GrowthRoadmapNodeInput[] => {
    if (!item || typeof item !== "object") return []
    const node = item as Record<string, unknown>
    const title = typeof node.title === "string" ? node.title.trim().slice(0, 100) : ""
    const description = typeof node.description === "string" ? node.description.trim().slice(0, 400) : ""
    if (title.length < 2 || description.length < 3) return []
    const type = typeof node.type === "string" && validTypes.has(node.type) ? node.type as GrowthRoadmapNodeInput["type"] : "core"
    return [{
      key: typeof node.key === "string" ? node.key.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || `node-${index}` : `node-${index}`,
      title,
      description,
      stage: typeof node.stage === "number" ? Math.min(Math.max(Math.round(node.stage), 1), 12) : index + 1,
      type,
      estimatedHours: typeof node.estimatedHours === "number" ? Math.min(Math.max(Math.round(node.estimatedHours), 1), 500) : 10,
      parentKeys: Array.isArray(node.parentKeys) ? node.parentKeys.filter((key): key is string => typeof key === "string").slice(0, 6) : [],
    }]
  })
  if (nodes.length < 4) return null
  const nodesByKey = new Map(nodes.map((node) => [node.key, node]))
  const safeNodes = nodes.map((node) => ({ ...node, parentKeys: node.parentKeys.filter((key) => { const parent = nodesByKey.get(key); return parent && parent.key !== node.key && parent.stage < node.stage }) }))
  return {
    title: typeof raw.title === "string" ? raw.title.trim().slice(0, 80) || `${topic} roadmap` : `${topic} roadmap`,
    outcome: typeof raw.outcome === "string" ? raw.outcome.trim().slice(0, 300) || outcome : outcome,
    nodes: safeNodes,
  }
}

export async function generateGrowthRoadmap(topic: string, outcome: string, experience: string): Promise<GeneratedRoadmap> {
  const fallbackMap = fallback(topic, outcome)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallbackMap
  const schema = {
    type: "object", additionalProperties: false, required: ["title", "outcome", "nodes"],
    properties: {
      title: { type: "string", maxLength: 80 }, outcome: { type: "string", maxLength: 300 },
      nodes: { type: "array", minItems: 8, maxItems: 24, items: { type: "object", additionalProperties: false, required: ["key", "title", "description", "stage", "type", "estimatedHours", "parentKeys"], properties: { key: { type: "string", maxLength: 40 }, title: { type: "string", maxLength: 100 }, description: { type: "string", maxLength: 400 }, stage: { type: "number", minimum: 1, maximum: 12 }, type: { type: "string", enum: ["foundation", "core", "practice", "project"] }, estimatedHours: { type: "number", minimum: 1, maximum: 500 }, parentKeys: { type: "array", maxItems: 6, items: { type: "string", maxLength: 40 } } } } },
    },
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const result = await new GoogleGenAI({ apiKey }).models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
      contents: [{ role: "user", parts: [{ text: JSON.stringify({ topic, desiredOutcome: outcome, currentExperience: experience || "not specified" }) }] }],
      config: {
        abortSignal: controller.signal,
        systemInstruction: "You design rigorous, dependency-aware learning roadmaps. Build a complete but focused roadmap from foundations through deliberate practice and portfolio-quality projects. Each node must be independently understandable. Dependencies may only refer to keys in the same response. Avoid fluff, motivation, dates, and resource brand names.",
        responseMimeType: "application/json", responseJsonSchema: schema, maxOutputTokens: 5000,
      },
    })
    if (!result.text) return fallbackMap
    return parse(JSON.parse(result.text), topic, outcome) ?? fallbackMap
  } catch (error) {
    console.error("Growth map generation failed; using structured fallback", safeErrorForLog(error))
    return fallbackMap
  } finally {
    clearTimeout(timer)
  }
}
