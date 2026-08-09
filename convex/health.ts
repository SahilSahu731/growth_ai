import { queryGeneric as query } from "convex/server"

export const ready = query({
  args: {},
  handler: async (ctx) => {
    await ctx.db.query("announcements").withIndex("by_active").take(1)
    return { ready: true, checkedAt: new Date().toISOString() }
  },
})
