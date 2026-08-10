import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { GrowthRoadmapManager } from "@/components/growth-map/growth-roadmap-manager"
import { getGrowthRoadmaps } from "@/lib/data/growth-map"

export const dynamic = "force-dynamic"
export const metadata = { title: "Growth map" }

export default async function GrowthMapPage() {
  if (process.env.MAJOR_EXPERIENCES_ENABLED === "false") redirect("/chat")
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const data = await getGrowthRoadmaps(session.user.id)
  return <GrowthRoadmapManager maps={data.maps} nodes={data.nodes} />
}
