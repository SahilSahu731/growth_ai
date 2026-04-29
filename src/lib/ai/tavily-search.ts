/**
 * Tavily Search API integration for PickAI
 * Integrate live web research with source attribution
 */

export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

export interface TavilyResearchOutput {
  sources: Array<{
    url: string
    title: string
    snippet: string
    confidence: number
  }>
  summary: string
  success: boolean
}

/**
 * Search the web using Tavily API
 * @param query - The search query
 * @returns Research results with sources and confidence scores
 */
export async function searchWithTavily(query: string): Promise<TavilyResearchOutput> {
  const apiKey = process.env.TAVILY_API_KEY

  if (!apiKey) {
    console.warn("TAVILY_API_KEY not configured. Returning empty research results.")
    return {
      sources: [],
      summary: "Web research is not configured.",
      success: false,
    }
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API returned ${response.status}: ${response.statusText}`)
    }

    const data: {
      results: Array<{
        title: string
        url: string
        content: string
        score: number
      }>
      answer: string
    } = await response.json()

    const sources = (data.results || [])
      .slice(0, 5)
      .map((result) => ({
        url: result.url,
        title: result.title,
        snippet: result.content?.substring(0, 200) || "",
        confidence: Math.round(result.score * 100) / 100,
      }))

    return {
      sources,
      summary: data.answer || "No summary available",
      success: true,
    }
  } catch (error) {
    console.error("Tavily search error:", error)
    return {
      sources: [],
      summary: `Research failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      success: false,
    }
  }
}

/**
 * Research specific claims for a comparison
 * @param category - Comparison category
 * @param claim - Specific claim to research
 * @returns Research findings
 */
export async function researchClaim(category: string, claim: string): Promise<TavilyResearchOutput> {
  const query = `${claim} ${category} 2024 2025 2026`
  return searchWithTavily(query)
}

/**
 * Research an option for a comparison
 * @param optionName - Option name (e.g., "iPhone 16", "Tesla Model 3")
 * @param category - Category context
 * @param specificAspect - What to research (e.g., "price", "reliability", "battery life")
 * @returns Research findings
 */
export async function researchOption(optionName: string, category: string, specificAspect?: string): Promise<TavilyResearchOutput> {
  const query = specificAspect ? `${optionName} ${specificAspect} reviews ${category}` : `${optionName} ${category} reviews`
  return searchWithTavily(query)
}

/**
 * Research hidden costs for an option
 * @param optionName - Option name
 * @param category - Category
 * @returns Research findings about hidden costs
 */
export async function researchHiddenCosts(optionName: string, category: string): Promise<TavilyResearchOutput> {
  const query = `${optionName} ${category} hidden costs fees additional costs total cost of ownership`
  return searchWithTavily(query)
}
