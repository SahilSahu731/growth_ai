/* eslint-disable @typescript-eslint/no-explicit-any */

export type UserOwnedTable = "operatorMessages" | "operatorTasks" | "operatorGoals" | "operatorConversations" | "subscriptions" | "billingCheckoutLocks" | "aiDailyUsage" | "privacyEvents" | "dataSubjectRequests"

export function collectOwnedRows(ctx: any, table: UserOwnedTable, userId: string): Promise<any[]> {
  return ownedQuery(ctx, table, userId).collect()
}

export function takeOwnedRows(ctx: any, table: UserOwnedTable, userId: string, limit: number): Promise<any[]> {
  return ownedQuery(ctx, table, userId).take(limit)
}

function ownedQuery(ctx: any, table: UserOwnedTable, userId: string): any {
  switch (table) {
    case "operatorMessages":
      return ctx.db.query(table).withIndex("by_user_time", (q: any) => q.eq("userId", userId))
    case "operatorTasks":
      return ctx.db.query(table).withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
    case "operatorGoals":
      return ctx.db.query(table).withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
    case "operatorConversations":
      return ctx.db.query(table).withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
    case "subscriptions":
    case "billingCheckoutLocks":
      return ctx.db.query(table).withIndex("by_user", (q: any) => q.eq("userId", userId))
    case "aiDailyUsage":
      return ctx.db.query(table).withIndex("by_user_date", (q: any) => q.eq("userId", userId))
    case "privacyEvents":
    case "dataSubjectRequests":
      return ctx.db.query(table).withIndex("by_user_created", (q: any) => q.eq("userId", userId))
  }
}
