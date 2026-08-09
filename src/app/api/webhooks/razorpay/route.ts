import { NextResponse } from "next/server"
import { safeErrorForLog } from "@/lib/safe-log"

import {
  MUTATING_SUBSCRIPTION_EVENTS,
  isRazorpaySubscriptionId,
  payloadDigest,
  unixIso,
  verifyRazorpaySignature,
  type RazorpayWebhook,
} from "@/lib/billing/razorpay"
import { markBillingEventFailure, processBillingEvent, receiveBillingEvent } from "@/lib/data/account"

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
  const noteUserId = typeof subscription?.notes?.userId === "string" && /^[A-Za-z0-9_-]{8,160}$/.test(subscription.notes.userId) ? subscription.notes.userId : undefined
  const providerSubscriptionId = subscription?.id ?? event.payload?.payment?.entity?.subscription_id ?? event.payload?.refund?.entity?.notes?.subscriptionId
  const validSubscription = isRazorpaySubscriptionId(providerSubscriptionId)
  const allowedEvent = MUTATING_SUBSCRIPTION_EVENTS.has(eventType)
  const validPlanId = !subscription?.plan_id || /^plan_[A-Za-z0-9]{6,100}$/.test(subscription.plan_id)
  const validStatus = !subscription?.status || /^[a-z_]{3,40}$/.test(subscription.status)
  const shouldApply = Boolean(allowedEvent && validSubscription && validPlanId && validStatus)
  const ignoreReason = shouldApply ? undefined : [
    !allowedEvent ? "Unsupported event type" : null,
    !validSubscription ? "Invalid subscription identifier" : null,
    !validPlanId ? "Invalid plan identifier" : null,
    !validStatus ? "Invalid subscription status" : null,
  ].filter(Boolean).join("; ")

  try {
    const receipt = await receiveBillingEvent({
      providerEventId, eventType, payloadDigest: digest, shouldApply, ...(ignoreReason ? { ignoreReason } : {}),
      ...(typeof event.created_at === "number" ? { eventCreatedAt: event.created_at * 1000 } : {}),
      ...(shouldApply ? {
        ...(noteUserId ? { noteUserId } : {}), providerSubscriptionId: providerSubscriptionId!,
        ...(subscription?.plan_id ? { providerPlanId: subscription.plan_id } : {}),
        ...(subscription?.status ? { reportedStatus: subscription.status } : {}),
        ...(typeof subscription?.cancel_at_cycle_end === "boolean" ? { reportedCancelAtPeriodEnd: subscription.cancel_at_cycle_end } : {}),
        ...(unixIso(subscription?.current_start) ? { periodStart: unixIso(subscription?.current_start) } : {}),
        ...(unixIso(subscription?.current_end) ? { periodEnd: unixIso(subscription?.current_end) } : {}),
      } : {}),
    })
    if (receipt.digestMismatch) return NextResponse.json({ error: "Event identifier was reused with a different payload." }, { status: 409 })
    if (!receipt.duplicate && shouldApply) await processBillingEvent(providerEventId)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Razorpay webhook processing failed", safeErrorForLog(error))
    await markBillingEventFailure(providerEventId, "internal", "Webhook processing infrastructure failure").catch(() => undefined)
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 })
  }
}
