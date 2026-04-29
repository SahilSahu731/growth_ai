"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { analyzeComparisonWithGemini, researchComparisonSources } from "@/lib/ai/comparison-engine"
import {
  addComparisonEvidence,
  addComparisonOption,
  createComparison,
  findUserByEmail,
  getComparisonReportForUser,
  incrementUsageCounter,
  replaceComparisonAnalysis,
  type ComparisonCategory,
  type EvidenceType,
} from "@/lib/db"

export type CompareActionState = {
  error?: string
  success?: string
}

const CATEGORIES = new Set<ComparisonCategory>([
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
])

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : ""
}

function inferCategory(input: string): ComparisonCategory {
  const value = input.toLowerCase()
  if (/(apartment|rent|house|lease|flat)/.test(value)) return "housing"
  if (/(job|offer|salary|career|company)/.test(value)) return "career"
  if (/(loan|insurance|credit|bank|investment|emi)/.test(value)) return "finance"
  if (/(course|school|college|bootcamp|class)/.test(value)) return "education"
  if (/(flight|hotel|trip|travel|visa)/.test(value)) return "travel"
  if (/(software|app|subscription|tool|saas)/.test(value)) return "software"
  if (/(doctor|hospital|clinic|treatment)/.test(value)) return "healthcare"
  if (/(service|agency|contractor|provider)/.test(value)) return "services"
  if (/(phone|laptop|car|camera|watch|buy|purchase)/.test(value)) return "product"
  return "custom"
}

async function currentUser() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) return null

  return findUserByEmail(email)
}

export async function createComparisonAction(formData: FormData): Promise<void> {
  const user = await currentUser()

  if (!user) {
    redirect("/signup")
  }

  // Check usage limits
  const { checkComparisonUsage } = await import("@/lib/usage-gates")
  const usage = await checkComparisonUsage()
  
  if (!usage.allowed) {
    redirect(`/compare/new?error=Comparison limit reached (${usage.tier} tier). Upgrade or wait for next month.`)
  }

  const context = text(formData.get("context"))
  const categoryRaw = text(formData.get("category"))
  const category = CATEGORIES.has(categoryRaw as ComparisonCategory)
    ? (categoryRaw as ComparisonCategory)
    : inferCategory(context)

  if (context.length < 4) {
    redirect("/compare/new?error=Describe what you want to compare")
  }

  const title = context.length > 88 ? `${context.slice(0, 85)}...` : context
  const comparison = await createComparison({
    userId: user.id,
    title,
    category,
    context,
    usageMode: (usage.tier === "enterprise" ? "pro" : usage.tier) as "guest" | "free" | "pro",
  })

  const { incrementComparisonUsage } = await import("@/lib/usage-gates")
  await incrementComparisonUsage()

  redirect(`/compare/${comparison.id}`)
}

export async function addOptionAction(
  _prevState: CompareActionState,
  formData: FormData
): Promise<CompareActionState> {
  const user = await currentUser()
  if (!user) return { error: "Please sign in again." }

  const comparisonId = text(formData.get("comparisonId"))
  const name = text(formData.get("name"))
  const description = text(formData.get("description"))
  const price = text(formData.get("price"))
  const sourceUrl = text(formData.get("sourceUrl"))
  const notes = text(formData.get("notes"))

  if (!comparisonId || name.length < 2) {
    return { error: "Add an option name before saving." }
  }

  const option = await addComparisonOption({
    comparisonId,
    userId: user.id,
    name,
    description,
    price,
    sourceUrl,
    notes,
  })

  if (!option) return { error: "Could not add option." }

  revalidatePath(`/compare/${comparisonId}`)
  return { success: "Option added." }
}

function evidenceTypeFromFile(file: File): EvidenceType {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.includes("pdf")) return "pdf"
  if (file.type.includes("text")) return "text"
  return "document"
}

export async function addEvidenceAction(
  _prevState: CompareActionState,
  formData: FormData
): Promise<CompareActionState> {
  const user = await currentUser()
  if (!user) return { error: "Please sign in again." }

  const comparisonId = text(formData.get("comparisonId"))
  const pastedEvidence = text(formData.get("pastedEvidence"))
  const file = formData.get("file")

  if (!comparisonId) return { error: "Missing comparison." }

  if (file instanceof File && file.size > 0) {
    const fileType = evidenceTypeFromFile(file)
    const extractedText = fileType === "image" ? `Image evidence uploaded: ${file.name}` : (await file.text().catch(() => ""))
    const evidence = await addComparisonEvidence({
      comparisonId,
      userId: user.id,
      fileName: file.name,
      fileType,
      fileUrl: "",
      fileKey: `local-${crypto.randomUUID()}`,
      extractedText: extractedText.slice(0, 12000),
      evidenceSummary: extractedText.slice(0, 400) || "Uploaded file saved as evidence. Full UploadThing storage can be connected with UPLOADTHING_TOKEN.",
    })

    if (!evidence) return { error: "Could not save uploaded evidence." }

    await incrementUsageCounter({ userId: user.id, uploads: 1 })
    revalidatePath(`/compare/${comparisonId}`)
    return { success: "Evidence uploaded." }
  }

  if (pastedEvidence.length < 4) {
    return { error: "Paste evidence text or upload a file." }
  }

  const evidence = await addComparisonEvidence({
    comparisonId,
    userId: user.id,
    fileName: "Pasted evidence",
    fileType: "text",
    fileUrl: "",
    fileKey: `text-${crypto.randomUUID()}`,
    extractedText: pastedEvidence.slice(0, 12000),
    evidenceSummary: pastedEvidence.slice(0, 400),
  })

  if (!evidence) return { error: "Could not save evidence." }

  revalidatePath(`/compare/${comparisonId}`)
  return { success: "Evidence saved." }
}

export async function runAnalysisAction(formData: FormData): Promise<void> {
  const user = await currentUser()
  if (!user) redirect("/login")

  const comparisonId = text(formData.get("comparisonId"))
  if (!comparisonId) return

  const report = await getComparisonReportForUser({ comparisonId, userId: user.id })
  if (!report) return

  const query = `${report.comparison.title} ${report.options.map((option) => option.name).join(" vs ")}`
  const sources = await researchComparisonSources(query)
  const draft = await analyzeComparisonWithGemini({
    context: report.comparison.context,
    options: report.options,
    evidence: report.evidence,
    sources,
  })

  await replaceComparisonAnalysis({
    comparisonId,
    userId: user.id,
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

  await incrementUsageCounter({ userId: user.id, researchCalls: sources.length > 0 ? 1 : 0 })
  revalidatePath(`/compare/${comparisonId}`)
  revalidatePath(`/reports/${comparisonId}`)
}
