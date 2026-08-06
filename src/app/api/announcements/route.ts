import { NextResponse } from "next/server"

import { getCurrentAnnouncement } from "@/lib/data/announcements"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const announcement = await getCurrentAnnouncement()
    return NextResponse.json({ announcement }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    console.error("Could not load active announcement", error)
    return NextResponse.json({ announcement: null }, { status: 200, headers: { "cache-control": "no-store" } })
  }
}
