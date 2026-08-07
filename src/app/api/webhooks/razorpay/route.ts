import { NextResponse } from "next/server"
import { safeErrorForLog } from "@/lib/safe-log"

import {
  MUTATING_SUBSCRIPTION_EVENTS,
  isRazorpaySubscriptionId,
  paidPlanConfig,
  payloadDigest,
  unixIso,
  verifyRazorpaySignature,
  type PaidPlanId,
  type RazorpayWebhook,
} from "@/lib/billing/razorpay"
import { recordBillingEvent } from "@/lib/data/account"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
  const declaredLength = Number(request.headers.get("content-length") ?? "0")
  if (declaredLength > 1_000_000) return NextResponse.json({ error: "Payload too large." }, { status: 413 })
  const rawBody = await request.text()
  if (rawBody.length > 1_000_000) return NextResponse.json({ error: "Payload too large." }, { status: 413 })
  if (!verifyRazorpaySignature(rawBody, request.headers.get("x-razorpay-signature"), secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 })

  let event: RazorpayWebhook
  try { event = JSON.parse(rawBody) as RazorpayWebhook } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }) }
  const subscription = event.payload?.subscription?.entity
  const eventType = typeof event.event === "string" ? event.event.slice(0, 120) : "unknown"
  const digest = payloadDigest(rawBody)
  const suppliedEventId = request.headers.get("x-razorpay-event-id")
  const providerEventId = suppliedEventId && /^[A-Za-z0-9_-]{6,160}$/.test(suppliedEventId) ? suppliedEventId : `${eventType}:${digest}`
  const notesPlan = subscription?.notes?.plan
  const plan = notesPlan === "pro" || notesPlan === "founder" ? notesPlan as PaidPlanId : null
  const config = plan ? paidPlanConfig(plan, process.env) : null
  const validUserId = typeof subscription?.notes?.userId === "string" && /^[A-Za-z0-9_-]{8,160}$/.test(subscription.notes.userId)
  const validSubscription = isRazorpaySubscriptionId(subscription?.id)
  const allowedEvent = MUTATING_SUBSCRIPTION_EVENTS.has(eventType)
  const validPlan = Boolean(config && subscription?.plan_id === config.planId)
  const validStatus = typeof subscription?.status === "string" && /^[a-z_]{3,40}$/.test(subscription.status)
  const shouldApply = Boolean(allowedEvent && validUserId && validSubscription && validPlan && validStatus)
  const ignoreReason = shouldApply ? undefined : [
    !allowedEvent ? "Unsupported event type" : null,
    !validUserId ? "Invalid user note" : null,
    !validSubscription ? "Invalid subscription identifier" : null,
    !validPlan ? "Plan identifier mismatch" : null,
    !validStatus ? "Invalid subscription status" : null,
  ].filter(Boolean).join("; ")

  try {
    await recordBillingEvent({
      providerEventId, eventType, payloadDigest: digest, shouldApply, ...(ignoreReason ? { ignoreReason } : {}),
      ...(shouldApply && subscription && config ? {
        userId: subscription.notes!.userId!, providerSubscriptionId: subscription.id!, subscriptionStatus: subscription.status!,
        planTier: config.plan, amount: config.amount, currency: config.currency,
        ...(unixIso(subscription.current_start) ? { periodStart: unixIso(subscription.current_start) } : {}),
        ...(unixIso(subscription.current_end) ? { periodEnd: unixIso(subscription.current_end) } : {}),
      } : {}),
    })
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Razorpay webhook processing failed", safeErrorForLog(error))
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}
