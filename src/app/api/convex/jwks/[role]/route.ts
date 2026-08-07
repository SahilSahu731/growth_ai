import { NextResponse } from "next/server"

import { CONVEX_IDENTITY_ROLES, convexIdentityJwk, type ConvexIdentityRole } from "@/lib/convex-identity"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: { params: Promise<{ role: string }> }) {
  const { role } = await context.params
  if (!CONVEX_IDENTITY_ROLES.includes(role as ConvexIdentityRole)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  try {
    return NextResponse.json({ keys: [convexIdentityJwk(role as ConvexIdentityRole)] }, {
      headers: { "cache-control": "public, max-age=300, stale-while-revalidate=3600" },
    })
  } catch {
    return NextResponse.json({ error: "Identity key is not configured" }, { status: 503 })
  }
}
