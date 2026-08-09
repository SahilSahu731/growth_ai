import { NextResponse } from "next/server"

import { getCurrentAnnouncement } from "@/lib/data/announcements"

export const dynamic = "force-dynamic"

export async function GET() {
  if (process.env.ANNOUNCEMENTS_ENABLED === "false") {
    return NextResponse.json({ announcement: null }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } })
  }
  try {
    const announcement = await getCurrentAnnouncement()
    return NextResponse.json({ announcement }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } })
  } catch (error) {
    console.error("Could not load active announcement", error)
    return NextResponse.json({ error: "Announcement service unavailable" }, { status: 503, headers: { "cache-control": "no-store", "retry-after": "30" } })
  }
}
