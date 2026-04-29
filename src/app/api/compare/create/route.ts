import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { createComparison, addComparisonOption, replaceComparisonAnalysis, type ComparisonCategory } from "@/lib/db"
import { analyzeComparisonWithGemini, researchComparisonSources } from "@/lib/ai/comparison-engine"
import { checkComparisonUsage, incrementComparisonUsage } from "@/lib/usage-gates"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { option1, option2, category, description } = body

    if (!option1 || !option2 || !category || !description) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check usage
    const usage = await checkComparisonUsage()
    if (!usage.allowed) {
      return Response.json(
        { error: "Comparison limit reached. Please upgrade or wait for next month." },
        { status: 429 }
      )
    }

    // Create comparison
    const title = `${option1} vs ${option2}`
    const comparison = await createComparison({
      userId: session.user.id,
      title,
      category: category as ComparisonCategory,
      context: description,
      usageMode: usage.tier === "enterprise" ? "pro" : (usage.tier as "guest" | "free" | "pro"),
    })

    if (!comparison.id) {
      return Response.json({ error: "Failed to create comparison" }, { status: 500 })
    }

    // Increment usage
    await incrementComparisonUsage()

    // Create options
    await Promise.all([
      addComparisonOption({
        comparisonId: comparison.id,
        userId: session.user.id,
        name: option1,
        description: `${category} option - ${option1}`,
        price: "",
        sourceUrl: "",
        notes: `Added as comparison option for: ${description}`,
      }),
      addComparisonOption({
        comparisonId: comparison.id,
        userId: session.user.id,
        name: option2,
        description: `${category} option - ${option2}`,
        price: "",
        sourceUrl: "",
        notes: `Added as comparison option for: ${description}`,
      }),
    ])

    const sources = await researchComparisonSources(`${option1} vs ${option2} ${category} ${description}`)
    const draft = await analyzeComparisonWithGemini({
      context: `${description}\nOption 1: ${option1}\nOption 2: ${option2}`,
      options: [
        {
          id: "option-1",
          comparisonId: comparison.id,
          name: option1,
          description: `${category} option - ${option1}`,
          price: "",
          sourceUrl: "",
          notes: `Added as comparison option for: ${description}`,
          totalScore: 0,
          createdAt: comparison.createdAt,
          updatedAt: comparison.updatedAt,
        },
        {
          id: "option-2",
          comparisonId: comparison.id,
          name: option2,
          description: `${category} option - ${option2}`,
          price: "",
          sourceUrl: "",
          notes: `Added as comparison option for: ${description}`,
          totalScore: 0,
          createdAt: comparison.createdAt,
          updatedAt: comparison.updatedAt,
        },
      ],
      evidence: [],
      sources,
    })

    await replaceComparisonAnalysis({
      comparisonId: comparison.id,
      userId: session.user.id,
      status: draft.status,
      finalRecommendation: draft.finalRecommendation,
      criteria: draft.criteria,
      scores: draft.scores,
      insights: [
        ...draft.insights,
        ...draft.missingQuestions.map((question) => ({
          insightType: "missing_info" as const,
          title: "Missing question",
          content: question,
          severity: "medium" as const,
        })),
      ],
      sources: sources.map((source) => ({
        url: source.url,
        title: source.title,
        snippet: source.snippet,
        confidence: source.confidence,
        claimSupported: source.claimSupported,
      })),
    })

    return Response.json({ comparisonId: comparison.id })
  } catch (error) {
    console.error("Create comparison error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create comparison" },
      { status: 500 }
    )
  }
}
