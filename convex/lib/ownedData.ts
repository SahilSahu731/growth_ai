/* eslint-disable @typescript-eslint/no-explicit-any */

export type UserOwnedTable = "operatorMessages" | "operatorTasks" | "operatorGoals" | "operatorConversations" | "subscriptions" | "billingCheckoutLocks" | "aiDailyUsage"

export function collectOwnedRows(ctx: any, table: UserOwnedTable, userId: string): Promise<any[]> {
  switch (table) {
    case "operatorMessages":
      return ctx.db.query(table).withIndex("by_user_time", (q: any) => q.eq("userId", userId)).collect()
    case "operatorTasks":
      return ctx.db.query(table).withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect()
    case "operatorGoals":
      return ctx.db.query(table).withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect()
    case "operatorConversations":
      return ctx.db.query(table).withIndex("by_user_updated", (q: any) => q.eq("userId", userId)).collect()
    case "subscriptions":
    case "billingCheckoutLocks":
      return ctx.db.query(table).withIndex("by_user", (q: any) => q.eq("userId", userId)).collect()
    case "aiDailyUsage":
      return ctx.db.query(table).withIndex("by_user_date", (q: any) => q.eq("userId", userId)).collect()
  }
}
