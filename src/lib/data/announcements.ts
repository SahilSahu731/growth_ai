import "server-only"

import { convexQuery } from "@/lib/convex-server"
import type { PublicAnnouncement } from "@/lib/announcement-types"

export type { PublicAnnouncement } from "@/lib/announcement-types"

export function getCurrentAnnouncement(): Promise<PublicAnnouncement | null> {
  return convexQuery("announcements:getCurrent", {})
}
