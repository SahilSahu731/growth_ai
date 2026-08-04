/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { internalMutationGeneric as internalMutation, internalQueryGeneric as internalQuery } from "convex/server"
import { v } from "convex/values"

const now = () => new Date().toISOString()

function strip(document: any) {
  if (!document) return null
  const { _id, _creationTime, legacyId, ...value } = document
  return { id: legacyId, ...value }
}

async function ownedComparison(ctx: any, comparisonId: string, userId: string) {
  const comparison = await ctx.db
    .query("comparisons")
    .withIndex("by_legacy_id", (q: any) => q.eq("legacyId", comparisonId))
    .unique()
  return comparison?.userId === userId ? comparison : null
}

async function byComparison(ctx: any, table: string, comparisonId: string) {
  return ctx.db.query(table).withIndex("by_comparison", (q: any) => q.eq("comparisonId", comparisonId)).collect()
}

export const create = internalMutation({
  args: {
    userId: v.optional(v.string()),
    title: v.string(),
    category: v.string(),
    context: v.string(),
    usageMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = now()
    const legacyId = crypto.randomUUID()
    await ctx.db.insert("comparisons", {
      legacyId,
      userId: args.userId,
      title: args.title,
      category: args.category,
      status: "draft",
      context: args.context,
      finalRecommendation: "",
      usageMode: args.usageMode ?? "free",
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return {
      id: legacyId,
      userId: args.userId ?? null,
      title: args.title,
      category: args.category,
      status: "draft",
      context: args.context,
      finalRecommendation: "",
      usageMode: args.usageMode ?? "free",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  },
})

export const get = internalQuery({
  args: { comparisonId: v.string() },
  handler: async (ctx, { comparisonId }) => {
    const item = await ctx.db.query("comparisons").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", comparisonId)).unique()
    const result = strip(item)
    return result ? { ...result, userId: result.userId ?? null } : null
  },
})

export const listForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const rows = await ctx.db.query("comparisons").withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect()
    return rows.sort((a: any, b: any) => b.updatedAt.localeCompare(a.updatedAt)).map((row: any) => ({ ...strip(row), userId: row.userId ?? null }))
  },
})

export const reportForUser = internalQuery({
  args: { comparisonId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const comparison = await ownedComparison(ctx, args.comparisonId, args.userId)
    if (!comparison) return null

    const [options, criteria, insights, evidence, sources] = await Promise.all([
      byComparison(ctx, "comparisonOptions", args.comparisonId),
      byComparison(ctx, "comparisonCriteria", args.comparisonId),
      byComparison(ctx, "comparisonInsights", args.comparisonId),
      byComparison(ctx, "comparisonEvidence", args.comparisonId),
      byComparison(ctx, "comparisonSources", args.comparisonId),
    ])
    const optionIds = new Set(options.map((option: any) => option.legacyId))
    const scoreGroups = await Promise.all(
      [...optionIds].map((optionId) => ctx.db.query("optionScores").withIndex("by_option", (q: any) => q.eq("optionId", optionId)).collect())
    )

    return {
      comparison: { ...strip(comparison), userId: comparison.userId ?? null },
      options: options.sort((a: any, b: any) => b.totalScore - a.totalScore || a.createdAt.localeCompare(b.createdAt)).map(strip),
      criteria: criteria.sort((a: any, b: any) => b.weight - a.weight || a.createdAt.localeCompare(b.createdAt)).map(strip),
      scores: scoreGroups.flat().map(strip),
      insights: insights.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt)).map((row: any) => ({ ...strip(row), optionId: row.optionId ?? null })),
      evidence: evidence.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)).map(strip),
      sources: sources.sort((a: any, b: any) => b.fetchedAt.localeCompare(a.fetchedAt)).map(strip),
    }
  },
})

export const addOption = internalMutation({
  args: {
    comparisonId: v.string(), userId: v.string(), name: v.string(), description: v.string(),
    price: v.string(), sourceUrl: v.string(), notes: v.string(),
  },
  handler: async (ctx, args) => {
    const comparison = await ownedComparison(ctx, args.comparisonId, args.userId)
    if (!comparison) return null
    const timestamp = now()
    const legacyId = crypto.randomUUID()
    const id = await ctx.db.insert("comparisonOptions", {
      legacyId,
      comparisonId: args.comparisonId,
      name: args.name,
      description: args.description,
      price: args.price,
      sourceUrl: args.sourceUrl,
      notes: args.notes,
      totalScore: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await ctx.db.patch(comparison._id, { updatedAt: timestamp })
    return strip(await ctx.db.get(id))
  },
})

export const addEvidence = internalMutation({
  args: {
    comparisonId: v.string(), userId: v.string(), fileName: v.string(), fileType: v.string(),
    fileUrl: v.string(), fileKey: v.string(), extractedText: v.string(), evidenceSummary: v.string(),
  },
  handler: async (ctx, args) => {
    const comparison = await ownedComparison(ctx, args.comparisonId, args.userId)
    if (!comparison) return null
    const timestamp = now()
    const legacyId = crypto.randomUUID()
    const id = await ctx.db.insert("comparisonEvidence", {
      legacyId,
      comparisonId: args.comparisonId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileUrl: args.fileUrl,
      fileKey: args.fileKey,
      extractedText: args.extractedText,
      evidenceSummary: args.evidenceSummary,
      createdAt: timestamp,
    })
    await ctx.db.patch(comparison._id, { updatedAt: timestamp })
    return strip(await ctx.db.get(id))
  },
})

export const replaceAnalysis = internalMutation({
  args: {
    comparisonId: v.string(),
    userId: v.string(),
    status: v.string(),
    finalRecommendation: v.string(),
    criteria: v.array(v.object({ name: v.string(), description: v.string(), weight: v.number(), categoryRelevance: v.string() })),
    scores: v.array(v.object({ optionName: v.string(), criterionName: v.string(), score: v.number(), reason: v.string() })),
    insights: v.array(v.object({ optionName: v.optional(v.string()), insightType: v.string(), title: v.string(), content: v.string(), severity: v.string() })),
    sources: v.array(v.object({ url: v.string(), title: v.string(), snippet: v.string(), confidence: v.number(), claimSupported: v.string() })),
  },
  handler: async (ctx, args) => {
    const comparison = await ownedComparison(ctx, args.comparisonId, args.userId)
    if (!comparison) return false
    const options = await byComparison(ctx, "comparisonOptions", args.comparisonId)
    const previousCriteria = await byComparison(ctx, "comparisonCriteria", args.comparisonId)
    const previousInsights = await byComparison(ctx, "comparisonInsights", args.comparisonId)
    const previousSources = await byComparison(ctx, "comparisonSources", args.comparisonId)
    const previousScores = (await Promise.all(options.map((option: any) => ctx.db.query("optionScores").withIndex("by_option", (q: any) => q.eq("optionId", option.legacyId)).collect()))).flat()

    await Promise.all([...previousScores, ...previousCriteria, ...previousInsights, ...previousSources].map((document: any) => ctx.db.delete(document._id)))

    const timestamp = now()
    const optionIds = new Map(options.map((option: any) => [option.name.toLowerCase(), option.legacyId]))
    const criterionIds = new Map<string, string>()
    for (const criterion of args.criteria) {
      const legacyId = crypto.randomUUID()
      criterionIds.set(criterion.name.toLowerCase(), legacyId)
      await ctx.db.insert("comparisonCriteria", { legacyId, comparisonId: args.comparisonId, ...criterion, createdAt: timestamp, updatedAt: timestamp })
    }

    for (const score of args.scores) {
      const optionId = optionIds.get(score.optionName.toLowerCase())
      const criterionId = criterionIds.get(score.criterionName.toLowerCase())
      if (!optionId || !criterionId) continue
      await ctx.db.insert("optionScores", { legacyId: crypto.randomUUID(), optionId, criterionId, score: score.score, reason: score.reason })
    }

    for (const option of options) {
      const optionScores = args.scores.filter((score) => score.optionName.toLowerCase() === option.name.toLowerCase())
      const weightedTotal = args.criteria.reduce((total, criterion) => {
        const score = optionScores.find((item) => item.criterionName.toLowerCase() === criterion.name.toLowerCase())?.score ?? 0
        return total + (score * criterion.weight) / 10
      }, 0)
      await ctx.db.patch(option._id, { totalScore: Math.round(weightedTotal * 10) / 10, updatedAt: timestamp })
    }

    for (const insight of args.insights) {
      await ctx.db.insert("comparisonInsights", {
        legacyId: crypto.randomUUID(), comparisonId: args.comparisonId,
        optionId: insight.optionName ? optionIds.get(insight.optionName.toLowerCase()) : undefined,
        insightType: insight.insightType, title: insight.title, content: insight.content,
        severity: insight.severity, createdAt: timestamp,
      })
    }
    for (const source of args.sources) {
      if (!source.url) continue
      await ctx.db.insert("comparisonSources", { legacyId: crypto.randomUUID(), comparisonId: args.comparisonId, ...source, fetchedAt: timestamp })
    }

    await ctx.db.patch(comparison._id, { status: args.status, finalRecommendation: args.finalRecommendation, updatedAt: timestamp })
    return true
  },
})

export const incrementUsage = internalMutation({
  args: { userId: v.string(), comparisons: v.optional(v.number()), uploads: v.optional(v.number()), researchCalls: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const usageMonth = now().slice(0, 7)
    const existing = await ctx.db.query("usageCounters").withIndex("by_user_month", (q: any) => q.eq("userId", args.userId).eq("usageMonth", usageMonth)).unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        comparisonsUsed: existing.comparisonsUsed + (args.comparisons ?? 0),
        uploadsUsed: existing.uploadsUsed + (args.uploads ?? 0),
        researchCallsUsed: existing.researchCallsUsed + (args.researchCalls ?? 0),
      })
      return
    }
    await ctx.db.insert("usageCounters", {
      userId: args.userId, usageMonth, planTier: "free",
      comparisonsUsed: args.comparisons ?? 0, uploadsUsed: args.uploads ?? 0, researchCallsUsed: args.researchCalls ?? 0,
    })
  },
})

export const addSource = internalMutation({
  args: { comparisonId: v.string(), url: v.string(), title: v.string(), snippet: v.string(), confidence: v.optional(v.number()), claimSupported: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const legacyId = crypto.randomUUID()
    const fetchedAt = now()
    const id = await ctx.db.insert("comparisonSources", {
      legacyId, comparisonId: args.comparisonId, url: args.url, title: args.title, snippet: args.snippet,
      confidence: args.confidence ?? 70, claimSupported: args.claimSupported ?? "", fetchedAt,
    })
    return strip(await ctx.db.get(id))
  },
})

export const listSources = internalQuery({
  args: { comparisonId: v.string() },
  handler: async (ctx, { comparisonId }) => {
    const sources = await byComparison(ctx, "comparisonSources", comparisonId)
    return sources.sort((a: any, b: any) => b.fetchedAt.localeCompare(a.fetchedAt)).map(strip)
  },
})
