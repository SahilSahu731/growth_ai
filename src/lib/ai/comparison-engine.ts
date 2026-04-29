import type {
  ComparisonCategory,
  ComparisonEvidence,
  ComparisonInsight,
  ComparisonOption,
  ComparisonSource,
  RiskSeverity,
} from "@/lib/db"

export type ComparisonAnalysisDraft = {
  category: ComparisonCategory
  title: string
  status: "needs_info" | "ready"
  finalRecommendation: string
  criteria: Array<{
    name: string
    description: string
    weight: number
    categoryRelevance: string
  }>
  scores: Array<{
    optionName: string
    criterionName: string
    score: number
    reason: string
  }>
  insights: Array<{
    optionName?: string
    insightType: ComparisonInsight["insightType"]
    title: string
    content: string
    severity: RiskSeverity
  }>
  missingQuestions: string[]
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  error?: { message?: string }
}

type TavilyResult = {
  title?: string
  url?: string
  content?: string
  score?: number
}

type TavilyResponse = {
  results?: TavilyResult[]
}

const CATEGORIES: ComparisonCategory[] = [
  "product",
  "finance",
  "housing",
  "career",
  "education",
  "software",
  "travel",
  "healthcare",
  "services",
  "custom",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min
  if (value > max) return max
  return Math.round(value)
}

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  const codeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)```/i)
  const candidate = codeBlockMatch ? codeBlockMatch[1] : trimmed

  try {
    return JSON.parse(candidate) as Record<string, unknown>
  } catch {
    const firstBrace = candidate.indexOf("{")
    const lastBrace = candidate.lastIndexOf("}")

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>
    }
  }

  throw new Error("AI response was not valid JSON.")
}

function fallbackCriteria(category: ComparisonCategory) {
  const base =
    category === "housing"
      ? ["Total monthly cost", "Commute", "Safety", "Lease risk", "Hidden fees"]
      : category === "career"
        ? ["Compensation", "Growth", "Manager/team", "Stability", "Work-life risk"]
        : category === "finance"
          ? ["True cost", "Flexibility", "Risk", "Fees", "Long-term value"]
          : ["Price", "Quality", "Long-term value", "Risk", "Convenience"]

  return base.map((name, index) => ({
    name,
    description: `How ${name.toLowerCase()} affects this decision.`,
    weight: index === 0 ? 28 : index === 1 ? 22 : index === 2 ? 20 : 15,
    categoryRelevance: category,
  }))
}

function normalizeCategory(value: unknown): ComparisonCategory {
  const candidate = asString(value, "custom")
  return CATEGORIES.includes(candidate as ComparisonCategory) ? (candidate as ComparisonCategory) : "custom"
}

function buildPrompt(input: {
  context: string
  options: ComparisonOption[]
  evidence: ComparisonEvidence[]
  sources: ComparisonSource[]
}): string {
  return [
    "You are PickAI, a practical decision analyst for ordinary people.",
    "Compare the options using structured weighted criteria. Find hidden costs, risks, questions to ask, negotiation angles, missing information, and a final recommendation.",
    "Return ONLY valid JSON in this shape:",
    '{"category":"product","title":"","status":"ready","finalRecommendation":"","criteria":[{"name":"","description":"","weight":20,"categoryRelevance":""}],"scores":[{"optionName":"","criterionName":"","score":7,"reason":""}],"insights":[{"optionName":"","insightType":"risk","title":"","content":"","severity":"medium"}],"missingQuestions":[]}',
    "Rules:",
    "- category must be one of product, finance, housing, career, education, software, travel, healthcare, services, custom",
    "- criteria weights must total 100",
    "- scores are 1 to 10",
    "- insightType must be hidden_cost, risk, question, negotiation, recommendation, or missing_info",
    "- severity must be low, medium, or high",
    "- if evidence is weak, status should be needs_info",
    `Decision context: ${input.context}`,
    `Options: ${input.options.map((option) => `${option.name}: ${option.description} ${option.price} ${option.notes} ${option.sourceUrl}`).join("\n")}`,
    `Evidence: ${input.evidence.map((item) => `${item.fileName}: ${item.evidenceSummary || item.extractedText.slice(0, 800)}`).join("\n") || "none"}`,
    `Live sources: ${input.sources.map((source) => `${source.title} ${source.url}: ${source.snippet}`).join("\n") || "none"}`,
  ].join("\n")
}

export async function researchComparisonSources(query: string): Promise<ComparisonSource[]> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    return []
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
    }),
  })

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as TavilyResponse

  return (payload.results ?? []).slice(0, 5).map((result) => ({
    id: crypto.randomUUID(),
    comparisonId: "",
    url: result.url ?? "",
    title: result.title ?? "Source",
    snippet: result.content ?? "",
    fetchedAt: new Date().toISOString(),
    confidence: clamp(Math.round((result.score ?? 0.6) * 100), 1, 100),
    claimSupported: "Live research source for option facts, pricing, reviews, or decision context.",
  }))
}

export async function analyzeComparisonWithGemini(input: {
  context: string
  options: ComparisonOption[]
  evidence: ComparisonEvidence[]
  sources: ComparisonSource[]
}): Promise<ComparisonAnalysisDraft> {
  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    const category: ComparisonCategory = "custom"
    const criteria = fallbackCriteria(category)
    return {
      category,
      title: input.context.slice(0, 80) || "New comparison",
      status: input.options.length >= 2 ? "ready" : "needs_info",
      finalRecommendation: "Add at least two options and configure GEMINI_API_KEY to unlock full PickAI analysis.",
      criteria,
      scores: input.options.flatMap((option) =>
        criteria.map((criterion) => ({
          optionName: option.name,
          criterionName: criterion.name,
          score: 5,
          reason: "Neutral placeholder score until AI analysis is configured.",
        }))
      ),
      insights: [
        {
          insightType: "missing_info",
          title: "AI not configured",
          content: "Set GEMINI_API_KEY to generate hidden costs, risks, questions, negotiation points, and recommendations.",
          severity: "medium",
        },
      ],
      missingQuestions: ["What matters most to you in this decision?", "What is your budget or constraint?"],
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
        generationConfig: { temperature: 0.25, responseMimeType: "application/json" },
      }),
    }
  )

  const payload = (await response.json()) as GeminiResponse

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Gemini request failed.")
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? ""
  const parsed = extractJson(text)
  const category = normalizeCategory(parsed.category)
  const criteriaRaw = Array.isArray(parsed.criteria) ? parsed.criteria : []
  const criteria = criteriaRaw.length > 0
    ? criteriaRaw.slice(0, 8).map((item, index) => {
        const row = isRecord(item) ? item : {}
        return {
          name: asString(row.name, `Criterion ${index + 1}`).slice(0, 64),
          description: asString(row.description, "Decision criterion.").slice(0, 220),
          weight: clamp(asNumber(row.weight, 20), 1, 80),
          categoryRelevance: asString(row.categoryRelevance, category).slice(0, 80),
        }
      })
    : fallbackCriteria(category)
  const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0) || 1
  const normalizedCriteria = criteria.map((item) => ({
    ...item,
    weight: Math.max(1, Math.round((item.weight / totalWeight) * 100)),
  }))
  const delta = 100 - normalizedCriteria.reduce((sum, item) => sum + item.weight, 0)
  if (normalizedCriteria[0]) normalizedCriteria[0].weight += delta

  const scoresRaw = Array.isArray(parsed.scores) ? parsed.scores : []
  const insightsRaw = Array.isArray(parsed.insights) ? parsed.insights : []
  const missingQuestionsRaw = Array.isArray(parsed.missingQuestions) ? parsed.missingQuestions : []

  return {
    category,
    title: asString(parsed.title, input.context.slice(0, 80) || "Comparison").slice(0, 100),
    status: asString(parsed.status, "ready") === "needs_info" ? "needs_info" : "ready",
    finalRecommendation: asString(parsed.finalRecommendation, "PickAI needs more information before recommending a winner.").slice(0, 1600),
    criteria: normalizedCriteria,
    scores: scoresRaw.slice(0, 80).map((item) => {
      const row = isRecord(item) ? item : {}
      return {
        optionName: asString(row.optionName).slice(0, 100),
        criterionName: asString(row.criterionName).slice(0, 64),
        score: clamp(asNumber(row.score, 5), 1, 10),
        reason: asString(row.reason, "No reason supplied.").slice(0, 320),
      }
    }),
    insights: insightsRaw.slice(0, 40).map((item) => {
      const row = isRecord(item) ? item : {}
      const insightType = asString(row.insightType, "risk")
      const severity = asString(row.severity, "medium")
      return {
        optionName: asString(row.optionName) || undefined,
        insightType: ["hidden_cost", "risk", "question", "negotiation", "recommendation", "missing_info"].includes(insightType)
          ? (insightType as ComparisonInsight["insightType"])
          : "risk",
        title: asString(row.title, "Insight").slice(0, 100),
        content: asString(row.content, "Review this before deciding.").slice(0, 600),
        severity: ["low", "medium", "high"].includes(severity) ? (severity as RiskSeverity) : "medium",
      }
    }),
    missingQuestions: missingQuestionsRaw.map((item) => asString(item)).filter(Boolean).slice(0, 8),
  }
}
