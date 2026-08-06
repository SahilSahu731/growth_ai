/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryGeneric as query } from "convex/server"

import { requireServer } from "./lib/serverAuth"

function publicAnnouncement(document: any) {
  return {
    id: document.legacyId,
    message: document.message,
    tone: document.tone,
    linkLabel: document.linkLabel ?? null,
    linkUrl: document.linkUrl ?? null,
    dismissible: document.dismissible,
    updatedAt: document.updatedAt,
  }
}

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    await requireServer(ctx)
    const now = new Date().toISOString()
    const candidates = await ctx.db
      .query("announcements")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .collect()
    const current = candidates
      .filter((item: any) => (!item.startsAt || item.startsAt <= now) && (!item.endsAt || item.endsAt > now))
      .sort((left: any, right: any) => right.priority - left.priority || right.updatedAt.localeCompare(left.updatedAt))[0]
    return current ? publicAnnouncement(current) : null
  },
})
