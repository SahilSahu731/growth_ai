import { NextResponse } from "next/server"
import { payloadDigest, unixIso, verifyRazorpaySignature, type RazorpayWebhook } from "@/lib/billing/razorpay"
import { recordBillingEvent } from "@/lib/data/growth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
  const rawBody = await request.text()
  if (!verifyRazorpaySignature(rawBody, request.headers.get("x-razorpay-signature"), secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  let event: RazorpayWebhook
  try { event = JSON.parse(rawBody) as RazorpayWebhook } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }) }
  const subscription = event.payload?.subscription?.entity
  const eventType = event.event ?? "unknown"
  const providerEventId = request.headers.get("x-razorpay-event-id") ?? `${eventType}:${payloadDigest(rawBody)}`
  await recordBillingEvent({
    providerEventId, eventType, payloadDigest: payloadDigest(rawBody),
    ...(subscription?.notes?.userId ? { userId: subscription.notes.userId } : {}),
    ...(subscription?.id ? { providerSubscriptionId: subscription.id } : {}),
    ...(subscription?.status ? { subscriptionStatus: subscription.status } : {}),
    ...(unixIso(subscription?.current_start) ? { periodStart: unixIso(subscription?.current_start) } : {}),
    ...(unixIso(subscription?.current_end) ? { periodEnd: unixIso(subscription?.current_end) } : {}),
  })
  return NextResponse.json({ received: true })
}
