/* eslint-disable @typescript-eslint/no-explicit-any */
import { internalActionGeneric as internalAction, internalMutationGeneric as internalMutation, internalQueryGeneric as internalQuery, makeFunctionReference, mutationGeneric as mutation } from "convex/server"
import { v } from "convex/values"
import { requireScope } from "./lib/serverAuth"
import { enqueueEmail } from "./lib/email"

const dueRef = makeFunctionReference<"query">("email:due")
const finishRef = makeFunctionReference<"mutation">("email:finish")
const MAX_ATTEMPTS = 5
function escape(value: unknown) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!) }
const subjects: Record<string, string> = { subscription_confirmation: "Your GrowthAI subscription is active", renewal: "GrowthAI subscription renewed", payment_failure: "Payment needs attention", cancellation: "GrowthAI cancellation confirmed", plan_change: "GrowthAI plan changed", security_alert: "GrowthAI security alert", export_ready: "Your GrowthAI export is ready", deletion_status: "GrowthAI deletion request update", weekly_summary: "Your GrowthAI weekly review" }
function render(kind: string, variables: Record<string, unknown>) {
  const heading = subjects[kind] ?? "GrowthAI account update"
  const detail = escape(variables.detail ?? "There is an update to your GrowthAI account.")
  const text = `${heading}\n\n${String(variables.detail ?? "There is an update to your GrowthAI account.")}\n\nManage your account: ${String(variables.accountUrl ?? "https://growthai.app/settings")}\n\nGrowthAI Support`
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f3;font-family:Arial,sans-serif;color:#171717"><div style="max-width:560px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:28px"><p style="font-size:12px;color:#6b7280">GrowthAI</p><h1 style="font-size:24px;line-height:1.25">${escape(heading)}</h1><p style="font-size:15px;line-height:1.7;color:#525252">${detail}</p><p><a href="${escape(variables.accountUrl ?? "https://growthai.app/settings")}" style="color:#176b78">Manage account</a></p></div><p style="font-size:11px;line-height:1.6;color:#737373">This is a required transactional message about your account. Optional summaries can be disabled in Settings.</p></div></body></html>`
  return { subject: heading, text, html }
}

export const due = internalQuery({ args: {}, handler: async (ctx) => { const now = new Date().toISOString(); const queued = await ctx.db.query("emailDeliveries").withIndex("by_status_retry", (q: any) => q.eq("status", "queued").lte("nextRetryAt", now)).take(25); const failed = await ctx.db.query("emailDeliveries").withIndex("by_status_retry", (q: any) => q.eq("status", "failed").lte("nextRetryAt", now)).take(Math.max(0, 25 - queued.length)); return [...queued, ...failed].map((item: any) => ({ ...item, id: String(item._id) })) } })
export const finish = internalMutation({
  args: { id: v.string(), ok: v.boolean(), providerId: v.optional(v.string()), category: v.optional(v.string()), message: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id as any); if (!row) return false
    const timestamp = new Date().toISOString(); const attempts = (row.attemptCount ?? 0) + 1; const dead = !args.ok && attempts >= MAX_ATTEMPTS
    await ctx.db.patch(row._id, { status: args.ok ? "sent" : dead ? "dead_letter" : "failed", attemptCount: attempts, providerId: args.providerId ?? row.providerId, errorCategory: args.ok ? undefined : args.category?.slice(0, 100), errorMessage: args.ok ? undefined : args.message?.slice(0, 300), nextRetryAt: args.ok || dead ? undefined : new Date(Date.now() + Math.min(6 * 60 * 60 * 1000, 30_000 * 2 ** attempts)).toISOString(), sentAt: args.ok ? timestamp : row.sentAt, updatedAt: timestamp })
    return true
  },
})
export const deliverQueued = internalAction({
  args: {}, handler: async (ctx) => {
    const apiKey = process.env.RESEND_API_KEY, from = process.env.TRANSACTIONAL_EMAIL_FROM
    if (!apiKey || !from) return { sent: 0, skipped: "not_configured" }
    const rows = await ctx.runQuery(dueRef as any, {}) as any[]; let sent = 0
    for (const row of rows) { try { const content = render(row.kind, JSON.parse(row.variablesJson)); const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": row.idempotencyKey }, body: JSON.stringify({ from, to: [row.toEmail], ...content }), signal: AbortSignal.timeout(10_000) }); const result = await response.json() as any; await ctx.runMutation(finishRef as any, { id: row.id, ok: response.ok, ...(result?.id ? { providerId: result.id } : {}), ...(!response.ok ? { category: `http_${response.status}`, message: result?.message ?? "Provider rejected email" } : {}) }); if (response.ok) sent += 1 } catch { await ctx.runMutation(finishRef as any, { id: row.id, ok: false, category: "network", message: "Email provider request failed" }) } }
    return { sent }
  },
})

export const receiveProviderEvent = mutation({
  args: { providerEventId: v.string(), payloadDigest: v.string(), eventType: v.string(), providerEmailId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireScope(ctx, "webhook", "email:webhook")
    const duplicate = await ctx.db.query("emailWebhookEvents").withIndex("by_provider_event", (q: any) => q.eq("providerEventId", args.providerEventId)).unique(); if (duplicate) return { duplicate: true }
    const timestamp = new Date().toISOString(); const delivery = args.providerEmailId ? await ctx.db.query("emailDeliveries").withIndex("by_provider", (q: any) => q.eq("providerId", args.providerEmailId)).unique() : null
    const mapped = args.eventType === "email.delivered" ? "delivered" : args.eventType === "email.bounced" ? "bounced" : ["email.complained", "email.suppressed"].includes(args.eventType) ? "complained" : null
    if (delivery && mapped) await ctx.db.patch(delivery._id, { status: mapped, deliveredAt: mapped === "delivered" ? timestamp : delivery.deliveredAt, updatedAt: timestamp })
    if (delivery?.userId && mapped === "complained") {
      const user = await ctx.db.query("users").withIndex("by_legacy_id", (q: any) => q.eq("legacyId", delivery.userId)).unique()
      if (user) await ctx.db.patch(user._id, { emailNotifications: false, notificationFrequency: "off", updatedAt: timestamp })
    }
    await ctx.db.insert("emailWebhookEvents", { ...args, status: delivery && mapped ? "processed" : "ignored", createdAt: timestamp })
    return { duplicate: false }
  },
})

export const queueWeeklySummaries = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.NOTIFICATIONS_ENABLED === "false") return { queued: 0, skipped: "disabled" }
    const state = await ctx.db.query("maintenanceCursors").withIndex("by_key", (q: any) => q.eq("key", "weekly-summary")).unique()
    const batch = await ctx.db.query("users").paginate({ cursor: state?.cursor ?? null, numItems: 100 })
    const users = batch.page
    let queued = 0
    for (const user of users) {
      if (!user.emailNotifications || user.notificationFrequency !== "weekly" || user.deletedAt || (user.accountStatus && user.accountStatus !== "active")) continue
      if (user.notificationSnoozedUntil && user.notificationSnoozedUntil > new Date().toISOString()) continue
      let parts: Intl.DateTimeFormatPart[]
      try { parts = new Intl.DateTimeFormat("en", { timeZone: user.timezone ?? "UTC", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()) } catch { continue }
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ""
      if (part("weekday") !== "Mon" || Number(part("hour")) !== 9) continue
      const localTime = `${part("hour")}:${part("minute")}`
      const quietStart = user.notificationQuietStart ?? "21:00", quietEnd = user.notificationQuietEnd ?? "08:00"
      const quiet = quietStart <= quietEnd ? localTime >= quietStart && localTime < quietEnd : localTime >= quietStart || localTime < quietEnd
      if (quiet) continue
      const reports = await ctx.db.query("weeklyReports").withIndex("by_user_created", (q: any) => q.eq("userId", user.legacyId)).order("desc").take(1)
      const report = reports[0]
      if (!report || report.createdAt < new Date(Date.now() - 8 * 86_400_000).toISOString()) continue
      const weekKey = `${part("year")}-${part("month")}-${part("day")}`
      await enqueueEmail(ctx, { idempotencyKey: `weekly:${user.legacyId}:${weekKey}`, userId: user.legacyId, toEmail: user.email, kind: "weekly_summary", mandatory: false, variables: { detail: `Your review records ${report.counts.completed} completed, ${report.counts.deferred} deferred, ${report.counts.dismissed} dismissed, and ${report.counts.overdue} overdue commitments. Open GrowthAI to review sources and correct interpretations.`, accountUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://growthai.app"}/weekly-report` } })
      queued += 1
    }
    const timestamp = new Date().toISOString()
    const fields = { cursor: batch.isDone ? undefined : batch.continueCursor, lastBatchSize: users.length, completedCycles: (state?.completedCycles ?? 0) + (batch.isDone ? 1 : 0), updatedAt: timestamp }
    if (state) await ctx.db.patch(state._id, fields); else await ctx.db.insert("maintenanceCursors", { key: "weekly-summary", ...fields })
    return { queued, cycleComplete: batch.isDone }
  },
})
