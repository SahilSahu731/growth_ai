import { NextRequest, NextResponse } from "next/server"

import { convexAnonymousQuery } from "@/lib/convex-server"
import { correlationId, operationalLog } from "@/lib/observability"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = correlationId(request.headers.get("x-request-id"))
  try {
    const result = await Promise.race([
      convexAnonymousQuery<Record<string, never>, { ready: boolean }>("health:ready", {}),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("READINESS_TIMEOUT")), 2500)),
    ])
    if (!result.ready) throw new Error("DEPENDENCY_NOT_READY")
    return NextResponse.json({ status: "ready" }, { headers: { "cache-control": "no-store", "x-request-id": requestId } })
  } catch (error) {
    operationalLog("error", "readiness.failed", { requestId, category: error instanceof Error && error.message === "READINESS_TIMEOUT" ? "timeout" : "dependency" })
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: { "cache-control": "no-store", "retry-after": "15", "x-request-id": requestId } })
  }
}
