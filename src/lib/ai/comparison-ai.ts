import { GoogleGenerativeAI } from "@google/generative-ai"
import type {
  ComparisonCategory,
  ComparisonCriterion,
  ComparisonOption,
  OptionScore,
  RiskSeverity,
} from "@/lib/db"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" })

// ============================================
// CLASSIFICATION & INTENT ANALYSIS
// ============================================

export async function classifyComparisonIntent(userInput: string): Promise<{
  detectedCategory: ComparisonCategory
  clarificationQuestions: string[]
  confidence: number
}> {
  const prompt = `
You are an expert at understanding what people are trying to compare or decide on.

The user says: "${userInput}"

Determine:
1. What category they're comparing (choose from: product, finance, housing, career, education, software, travel, healthcare, services, custom)
2. 2-3 clarifying questions to help them describe their situation better
3. Your confidence 0-1

Return JSON:
{
  "detectedCategory": "housing" | "product" | "career" | etc,
  "clarificationQuestions": ["question1", "question2"],
  "confidence": 0.85
}
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const json = JSON.parse(text)
    return {
      detectedCategory: json.detectedCategory || "custom",
      clarificationQuestions: json.clarificationQuestions || [],
      confidence: json.confidence || 0.7,
    }
  } catch (error) {
    console.error("Error classifying intent:", error)
    return {
      detectedCategory: "custom" as ComparisonCategory,
      clarificationQuestions: [
        "What are the top 3 things that matter most to you?",
        "What's your budget or budget range?",
        "When do you need to make this decision?",
      ],
      confidence: 0.5,
    }
  }
}

// ============================================
// CRITERIA GENERATION
// ============================================

export async function generateComparisonCriteria(input: {
  category: ComparisonCategory
  title: string
  context: string
}): Promise<
  Array<{
    name: string
    description: string
    categoryRelevance: string
  }>
> {
  const prompt = `
You are an expert at breaking down complex decisions into fair, meaningful criteria.

Decision Details:
- Category: ${input.category}
- Title: ${input.title}
- Context: ${input.context}

Generate 6-10 specific, measurable criteria that would help someone compare options in this category.

For each criterion:
- be specific to the category
- avoid generic criteria like "quality" (be specific)
- consider both explicit costs and hidden factors
- include at least one risk-related criterion
- include hidden cost considerations

Return JSON:
{
  "criteria": [
    {
      "name": "Annual Cost",
      "description": "Total cost including fees, taxes, maintenance, and subscriptions",
      "categoryRelevance": "Essential for financial decisions"
    },
    ...
  ]
}

Return ONLY valid JSON, no other text.
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
    const json = JSON.parse(cleanText)

    return (
      json.criteria?.map((c: any) => ({
        name: c.name || "Unknown",
        description: c.description || "",
        categoryRelevance: c.categoryRelevance || "",
      })) || []
    )
  } catch (error) {
    console.error("Error generating criteria:", error)

    // Fallback criteria based on category
    const fallbackCriteria: { [key in ComparisonCategory]: any[] } = {
      product: [
        { name: "Price", description: "Purchase price or monthly cost", categoryRelevance: "Core" },
        { name: "Performance", description: "Speed, power, or effectiveness", categoryRelevance: "Core" },
        { name: "Reliability", description: "Durability and warranty coverage", categoryRelevance: "Core" },
        { name: "Support", description: "Customer service and documentation", categoryRelevance: "Important" },
      ],
      finance: [
        { name: "Interest Rate", description: "APR or yield percentage", categoryRelevance: "Core" },
        { name: "Fees", description: "Annual, monthly, or transaction fees", categoryRelevance: "Core" },
        { name: "Flexibility", description: "Early withdrawal or refinancing options", categoryRelevance: "Important" },
        { name: "Risk Level", description: "Volatility or credit risk", categoryRelevance: "Important" },
      ],
      housing: [
        { name: "Rent/Price", description: "Monthly rent or purchase price", categoryRelevance: "Core" },
        { name: "Location", description: "Walkability, commute time, neighborhood", categoryRelevance: "Core" },
        { name: "Lease Terms", description: "Flexibility, lock-in period, renewal", categoryRelevance: "Important" },
        { name: "Hidden Costs", description: "Utilities, maintenance, HOA fees", categoryRelevance: "Core" },
      ],
      career: [
        { name: "Compensation", description: "Salary, bonus, equity", categoryRelevance: "Core" },
        { name: "Growth", description: "Learning opportunities and advancement", categoryRelevance: "Important" },
        { name: "Work-Life Balance", description: "Hours, flexibility, remote work", categoryRelevance: "Important" },
        { name: "Culture & Fit", description: "Team dynamics and company values", categoryRelevance: "Important" },
      ],
      education: [
        { name: "Cost", description: "Tuition, fees, and total investment", categoryRelevance: "Core" },
        { name: "Reputation", description: "Rankings and job placement rate", categoryRelevance: "Important" },
        { name: "Format", description: "Online, hybrid, or in-person", categoryRelevance: "Important" },
        { name: "Outcomes", description: "Career services and alumni success", categoryRelevance: "Core" },
      ],
      software: [
        { name: "Features", description: "Does it meet your specific needs?", categoryRelevance: "Core" },
        { name: "Cost", description: "Subscription, one-time, or free", categoryRelevance: "Core" },
        { name: "Ease of Use", description: "Learning curve and interface", categoryRelevance: "Important" },
        { name: "Integration", description: "Works with your existing tools", categoryRelevance: "Important" },
      ],
      travel: [
        { name: "Cost", description: "Total trip expense", categoryRelevance: "Core" },
        { name: "Duration", description: "Travel time and scheduling", categoryRelevance: "Important" },
        { name: "Safety", description: "Security and travel advisories", categoryRelevance: "Core" },
        { name: "Experience", description: "Activities and attractions", categoryRelevance: "Important" },
      ],
      healthcare: [
        { name: "Cost", description: "Out-of-pocket and total expenses", categoryRelevance: "Core" },
        { name: "Effectiveness", description: "Success rate or clinical evidence", categoryRelevance: "Core" },
        { name: "Side Effects", description: "Known risks and complications", categoryRelevance: "Core" },
        { name: "Convenience", description: "Recovery time and accessibility", categoryRelevance: "Important" },
      ],
      services: [
        { name: "Price", description: "Hourly rate, package, or total cost", categoryRelevance: "Core" },
        { name: "Quality", description: "Reviews and track record", categoryRelevance: "Core" },
        { name: "Availability", description: "Response time and scheduling", categoryRelevance: "Important" },
        { name: "Reliability", description: "Warranties and guarantees", categoryRelevance: "Important" },
      ],
      custom: [
        { name: "Cost", description: "Total investment required", categoryRelevance: "Core" },
        { name: "Quality", description: "Overall value and satisfaction", categoryRelevance: "Core" },
        { name: "Fit", description: "Matches your specific needs", categoryRelevance: "Important" },
        { name: "Risk", description: "Potential downsides or failures", categoryRelevance: "Important" },
      ],
    }

    return fallbackCriteria[input.category] || fallbackCriteria.custom
  }
}

// ============================================
// HIDDEN COSTS & RISKS ANALYSIS
// ============================================

export async function detectHiddenCostsAndRisks(input: {
  category: ComparisonCategory
  title: string
  optionName: string
  optionDescription: string
  price?: string
}): Promise<{
  hiddenCosts: Array<{ item: string; estimatedCost: string }>
  risks: Array<{ risk: string; severity: RiskSeverity }>
}> {
  const prompt = `
You are an expert at finding hidden costs and risks in decisions.

Decision: ${input.title}
Category: ${input.category}
Option: ${input.optionName}
Description: ${input.optionDescription}
Price/Cost: ${input.price || "Not specified"}

Find 4-6 hidden costs or fees that the person might not initially think of.
Also identify 3-4 key risks or downsides.

Return JSON:
{
  "hiddenCosts": [
    { "item": "Monthly subscription fee", "estimatedCost": "$10/month" },
    ...
  ],
  "risks": [
    { "risk": "Early cancellation penalty", "severity": "medium" },
    ...
  ]
}

For severity, use: "low", "medium", or "high"
Return ONLY valid JSON, no other text.
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
    const json = JSON.parse(cleanText)

    return {
      hiddenCosts: json.hiddenCosts || [],
      risks: json.risks || [],
    }
  } catch (error) {
    console.error("Error detecting hidden costs:", error)
    return {
      hiddenCosts: [],
      risks: [],
    }
  }
}

// ============================================
// SMART QUESTIONS TO ASK
// ============================================

export async function generateSmartQuestions(input: {
  category: ComparisonCategory
  title: string
  optionName: string
}): Promise<{
  mustAsk: string[]
  goodToAsk: string[]
  negotiationLeverage: string[]
}> {
  const prompt = `
You are an expert at helping people ask the right questions before making decisions.

Decision: ${input.title}
Category: ${input.category}
Option: ${input.optionName}

Generate questions to ask sellers, providers, employers, landlords, or experts for this option.

Organize into 3 groups:
1. Must-ask questions (critical before deciding)
2. Good-to-ask questions (helpful context)
3. Negotiation leverage questions (to improve terms)

Return JSON:
{
  "mustAsk": ["question1", "question2", "question3"],
  "goodToAsk": ["question1", "question2"],
  "negotiationLeverage": ["question1", "question2"]
}

Return ONLY valid JSON, no other text.
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
    const json = JSON.parse(cleanText)

    return {
      mustAsk: json.mustAsk || [],
      goodToAsk: json.goodToAsk || [],
      negotiationLeverage: json.negotiationLeverage || [],
    }
  } catch (error) {
    console.error("Error generating questions:", error)
    return {
      mustAsk: [],
      goodToAsk: [],
      negotiationLeverage: [],
    }
  }
}

// ============================================
// NEGOTIATION MESSAGE GENERATION
// ============================================

export async function generateNegotiationMessages(input: {
  category: ComparisonCategory
  optionName: string
  potentialIssue: string
}): Promise<{
  politeAsk: string
  firmAsk: string
  followUp: string
}> {
  const prompt = `
You are an expert at writing professional negotiation messages.

Category: ${input.category}
Option: ${input.optionName}
Issue to negotiate: ${input.potentialIssue}

Write 3 versions of a negotiation message:
1. Polite and professional
2. Firm but still respectful
3. A follow-up if they don't respond

Keep each under 100 words.

Return JSON:
{
  "politeAsk": "message",
  "firmAsk": "message",
  "followUp": "message"
}

Return ONLY valid JSON, no other text.
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
    const json = JSON.parse(cleanText)

    return {
      politeAsk: json.politeAsk || "Could we discuss the terms?",
      firmAsk: json.firmAsk || "I'd like to request better terms.",
      followUp: json.followUp || "Following up on my previous inquiry.",
    }
  } catch (error) {
    console.error("Error generating negotiation messages:", error)
    return {
      politeAsk: "Could we discuss adjusting the terms?",
      firmAsk: "I need better terms to move forward.",
      followUp: "Following up on my previous offer.",
    }
  }
}

// ============================================
// FINAL RECOMMENDATION
// ============================================

export async function generateFinalRecommendation(input: {
  title: string
  category: ComparisonCategory
  options: Array<{
    name: string
    totalScore: number
  }>
  criteria: Array<{
    name: string
    weight: number
  }>
  insights: string
}): Promise<{
  topRecommendation: string
  reasoning: string
  warnings: string[]
}> {
  const prompt = `
You are an expert decision advisor.

Decision: ${input.title}
Category: ${input.category}

Options with scores:
${input.options.map((o) => `- ${o.name}: ${o.totalScore}/10`).join("\n")}

Weighted criteria:
${input.criteria.map((c) => `- ${c.name} (${c.weight}%)`).join("\n")}

Insights: ${input.insights}

Provide:
1. Top recommendation (which option to choose)
2. Clear reasoning (why this wins)
3. Key warnings or caveats

Return JSON:
{
  "topRecommendation": "Option name",
  "reasoning": "explanation",
  "warnings": ["warning1", "warning2"]
}

Return ONLY valid JSON, no other text.
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
    const json = JSON.parse(cleanText)

    return {
      topRecommendation: json.topRecommendation || input.options[0]?.name || "Unable to determine",
      reasoning: json.reasoning || "Based on weighted scoring and analysis",
      warnings: json.warnings || [],
    }
  } catch (error) {
    console.error("Error generating recommendation:", error)
    return {
      topRecommendation: input.options[0]?.name || "Unable to determine",
      reasoning: "Highest total score based on your criteria",
      warnings: [],
    }
  }
}

// ============================================
// CALCULATE WEIGHTED SCORE
// ============================================

export async function calculateWeightedScore(input: {
  optionId: string
  scores: Array<{
    criterionId: string
    score: number
  }>
  weights: Array<{
    criterionId: string
    weight: number
  }>
}): Promise<number> {
  let totalWeightedScore = 0
  let totalWeight = 0

  for (const weight of input.weights) {
    const score = input.scores.find((s) => s.criterionId === weight.criterionId)
    if (score) {
      totalWeightedScore += (score.score * weight.weight) / 100
      totalWeight += weight.weight
    }
  }

  if (totalWeight === 0) return 0

  // Normalize to 0-10 scale
  return (totalWeightedScore / totalWeight) * 10
}
