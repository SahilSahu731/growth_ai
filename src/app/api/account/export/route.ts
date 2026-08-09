import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { downloadAccountExport, getAccountExportStatus, requestAccountExport } from "@/lib/data/account"
import { isTrustedMutationRequest } from "@/lib/billing/razorpay"

function digest(token: string) { return createHash("sha256").update(token).digest("hex") }

async function authenticatedUser() {
  const session = await getServerSession(authOptions)
  return session?.user?.id ? session : null
}

export async function POST(request: NextRequest) {
  const session = await authenticatedUser()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isTrustedMutationRequest({ requestUrl: request.url, origin: request.headers.get("origin"), fetchSite: request.headers.get("sec-fetch-site"), allowedOrigins: [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL] })) return NextResponse.json({ error: "Untrusted export request" }, { status: 403 })
  if (!session.authenticatedAt || Date.now() - session.authenticatedAt > 15 * 60 * 1000) {
    return NextResponse.json({ error: "For your security, sign out and sign in again before exporting account data." }, { status: 428 })
  }
  const token = randomBytes(32).toString("base64url")
  const job = await requestAccountExport(session.user.id, digest(token))
  return NextResponse.json({ ...job, token }, { status: 202, headers: { "cache-control": "private, no-store" } })
}

export async function GET(request: NextRequest) {
  const session = await authenticatedUser()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const jobId = request.nextUrl.searchParams.get("job") ?? ""
  const token = request.nextUrl.searchParams.get("token") ?? ""
  if (!/^[0-9a-f-]{36}$/.test(jobId) || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return NextResponse.json({ error: "Invalid export reference" }, { status: 400 })
  const tokenHash = digest(token)
  if (request.nextUrl.searchParams.get("download") !== "1") {
    const status = await getAccountExportStatus(session.user.id, jobId, tokenHash)
    return status ? NextResponse.json(status, { headers: { "cache-control": "private, no-store" } }) : NextResponse.json({ error: "Export not found" }, { status: 404 })
  }
  const data = await downloadAccountExport(session.user.id, jobId, tokenHash)
  if (!data) return NextResponse.json({ error: "Export is not ready or has expired" }, { status: 409 })
  const sections = data.chunks.map((chunk) => `{"section":${JSON.stringify(chunk.section)},"items":${chunk.data}}`)
  const body = `{"format":"growthai-portable-export","formatVersion":3,"exportedAt":${JSON.stringify(data.completedAt)},"expiresAt":${JSON.stringify(data.expiresAt)},"sections":[${sections.join(",")}]}`
  return new NextResponse(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="growthai-export-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } })
}
