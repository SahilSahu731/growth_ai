import "server-only"

import { convexQuery } from "@/lib/convex-server"

export type PublicAnnouncement = {
  id: string
  message: string
  tone: "info" | "offer" | "warning" | "critical"
  linkLabel: string | null
  linkUrl: string | null
  dismissible: boolean
  updatedAt: string
}

export function getCurrentAnnouncement(): Promise<PublicAnnouncement | null> {
  return convexQuery("announcements:getCurrent", {})
}
