import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { exportGrowthUserData } from "@/lib/data/growth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const data = await exportGrowthUserData(session.user.id)
  if (!data) return NextResponse.json({ error: "Account not found" }, { status: 404 })
  return new NextResponse(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="growthai-export-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "private, no-store" } })
}
