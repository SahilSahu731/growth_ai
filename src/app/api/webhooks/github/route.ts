import { NextResponse } from "next/server"
import { ingestGithubActivity } from "@/lib/data/growth"
import { normalizeGithubEvent, verifyGithubSignature } from "@/lib/github/webhook"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 })
  const body = await request.text()
  if (!verifyGithubSignature(body, request.headers.get("x-hub-signature-256"), secret)) return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  let payload: Record<string, unknown>
  try { payload = JSON.parse(body) as Record<string, unknown> } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }) }
  const event = request.headers.get("x-github-event") ?? "unknown"
  const delivery = request.headers.get("x-github-delivery") ?? crypto.randomUUID()
  const normalized = normalizeGithubEvent(event, delivery, payload)
  if (!normalized) return NextResponse.json({ accepted: true, linked: false })
  const result = await ingestGithubActivity(normalized)
  return NextResponse.json({ accepted: true, ...result })
}
