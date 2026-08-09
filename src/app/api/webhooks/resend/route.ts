import { NextResponse } from "next/server"
import { receiveEmailProviderEvent } from "@/lib/data/email"
import { emailPayloadDigest, verifyResendWebhook } from "@/lib/email/webhook"

export const runtime = "nodejs"
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Email webhook is not configured." }, { status: 503 })
  const raw = await request.text()
  if (raw.length > 500_000) return NextResponse.json({ error: "Payload too large." }, { status: 413 })
  const id = request.headers.get("svix-id"), timestamp = request.headers.get("svix-timestamp"), signature = request.headers.get("svix-signature")
  if (!verifyResendWebhook({ body: raw, id, timestamp, signature, secret })) return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  let event: { type?: unknown; data?: { email_id?: unknown } }
  try { event = JSON.parse(raw) } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }) }
  const eventType = typeof event.type === "string" ? event.type.slice(0, 100) : "unknown"
  const providerEmailId = typeof event.data?.email_id === "string" ? event.data.email_id.slice(0, 160) : undefined
  await receiveEmailProviderEvent({ providerEventId: id!, payloadDigest: emailPayloadDigest(raw), eventType, ...(providerEmailId ? { providerEmailId } : {}) })
  return NextResponse.json({ received: true })
}
