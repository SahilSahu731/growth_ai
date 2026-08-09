/* eslint-disable @typescript-eslint/no-explicit-any */
export async function enqueueEmail(ctx: any, input: { idempotencyKey: string; userId?: string; toEmail: string; kind: "subscription_confirmation" | "renewal" | "payment_failure" | "cancellation" | "plan_change" | "security_alert" | "export_ready" | "deletion_status" | "weekly_summary"; mandatory: boolean; variables: Record<string, string | number | boolean | null | undefined> }) {
  const existing = await ctx.db.query("emailDeliveries").withIndex("by_idempotency", (q: any) => q.eq("idempotencyKey", input.idempotencyKey)).unique()
  if (existing) return existing._id
  const timestamp = new Date().toISOString()
  return ctx.db.insert("emailDeliveries", { idempotencyKey: input.idempotencyKey, userId: input.userId, toEmail: input.toEmail.trim().toLowerCase(), kind: input.kind, mandatory: input.mandatory, variablesJson: JSON.stringify(input.variables).slice(0, 4000), status: "queued", attemptCount: 0, nextRetryAt: timestamp, createdAt: timestamp, updatedAt: timestamp })
}
