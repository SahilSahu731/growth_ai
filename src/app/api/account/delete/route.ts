import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { deleteGrowthUserAccount } from "@/lib/data/growth"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null
  if (typeof body?.confirmation !== "string" || body.confirmation.trim().toLowerCase() !== session.user.email.toLowerCase()) return NextResponse.json({ error: "Enter your account email exactly to confirm." }, { status: 400 })
  const deleted = await deleteGrowthUserAccount(session.user.id, body.confirmation)
  return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Account could not be deleted." }, { status: 409 })
}
