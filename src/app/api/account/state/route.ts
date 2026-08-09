import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { getAccountState } from "@/lib/data/account"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ authenticated: false, plan: "free" }, { headers: { "cache-control": "private, no-store" } })
  const account = await getAccountState(session.user.id)
  if (!account) return NextResponse.json({ authenticated: false, plan: "free" }, { headers: { "cache-control": "private, no-store" } })
  const plan = account.planTier === "team" ? "pro" : account.planTier
  return NextResponse.json({ authenticated: true, plan }, { headers: { "cache-control": "private, no-store" } })
}
