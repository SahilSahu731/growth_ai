import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"

import { authOptions } from "@/auth"
import { isTrustedMutationRequest } from "@/lib/billing/razorpay"
import { clearAccountAiMemory, setAccountMessageRetention, submitAccountDataRequest } from "@/lib/data/account"

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("retention"), days: z.union([z.literal(0), z.literal(30), z.literal(90), z.literal(180), z.literal(365)]) }),
  z.object({ action: z.literal("clear-memory"), confirmation: z.literal("CLEAR AI MEMORY") }),
  z.object({ action: z.literal("data-request"), type: z.enum(["access", "correction", "deletion", "restriction", "objection"]), details: z.string().trim().max(1000).optional() }),
])

export async function POST(request: Request) {
  if (!isTrustedMutationRequest({ requestUrl: request.url, origin: request.headers.get("origin"), fetchSite: request.headers.get("sec-fetch-site"), allowedOrigins: [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL] })) {
    return NextResponse.json({ error: "Untrusted privacy request." }, { status: 403 })
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 })
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Check the privacy-control values and try again." }, { status: 400 })
  if (parsed.data.action === "clear-memory" && (!session.authenticatedAt || Date.now() - session.authenticatedAt > 15 * 60 * 1000)) {
    return NextResponse.json({ error: "For your security, sign out and sign in again before clearing AI memory." }, { status: 428 })
  }
  if (parsed.data.action === "retention") {
    await setAccountMessageRetention(session.user.id, parsed.data.days)
    return NextResponse.json({ updated: true })
  }
  if (parsed.data.action === "clear-memory") {
    const removed = await clearAccountAiMemory(session.user.id)
    return NextResponse.json({ cleared: true, removed })
  }
  const result = await submitAccountDataRequest(session.user.id, parsed.data.type, parsed.data.details)
  return NextResponse.json({ submitted: true, requestId: result.id, status: result.status }, { status: 201 })
}
