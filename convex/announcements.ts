/* eslint-disable @typescript-eslint/no-explicit-any */
import { queryGeneric as query } from "convex/server"


function publicAnnouncement(document: any) {
  const presets = {
    info: { backgroundColor: "#10242A", textColor: "#ECFEFF", accentColor: "#67E8F9" },
    offer: { backgroundColor: "#72E7FF", textColor: "#031014", accentColor: "#031014" },
    warning: { backgroundColor: "#3A2A0D", textColor: "#FFFBEB", accentColor: "#FCD34D" },
    critical: { backgroundColor: "#3A1315", textColor: "#FEF2F2", accentColor: "#FCA5A5" },
  } as const
  const colors = presets[document.tone as keyof typeof presets] ?? presets.info
  return {
    id: document.legacyId,
    title: document.title ?? null,
    message: document.message,
    tone: document.tone,
    placement: document.placement ?? "top_bar",
    backgroundColor: document.backgroundColor ?? colors.backgroundColor,
    textColor: document.textColor ?? colors.textColor,
    accentColor: document.accentColor ?? colors.accentColor,
    alignment: document.alignment ?? "center",
    buttonStyle: document.buttonStyle ?? "solid",
    showIcon: document.showIcon ?? true,
    linkLabel: document.linkLabel ?? null,
    linkUrl: document.linkUrl ?? null,
    dismissible: document.dismissible,
    updatedAt: document.updatedAt,
  }
}

export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
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
