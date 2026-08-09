/* eslint-disable @typescript-eslint/no-explicit-any */

export type UserOwnedTable = "operatorMessages" | "operatorTasks" | "operatorTaskEvents" | "messageFeedback" | "weeklyReports" | "growthMapItems" | "productEvents" | "operatorGoals" | "operatorConversations" | "subscriptions" | "entitlementGrants" | "billingCheckoutLocks" | "emailDeliveries" | "aiDailyUsage" | "privacyEvents" | "dataSubjectRequests" | "accountDeletionJobs" | "accountExportJobs" | "accountExportChunks"

export function collectOwnedRows(ctx: any, table: UserOwnedTable, userId: string): Promise<any[]> {
  // Compatibility helper for legacy, synchronous privacy paths. It is
  // deliberately capped; new large-data flows must use paginateOwnedRows.
  return ownedQuery(ctx, table, userId).take(5_001)
}

export function takeOwnedRows(ctx: any, table: UserOwnedTable, userId: string, limit: number): Promise<any[]> {
  return ownedQuery(ctx, table, userId).take(limit)
}

export function paginateOwnedRows(ctx: any, table: UserOwnedTable, userId: string, cursor: string | null, limit: number): Promise<{ page: any[]; continueCursor: string; isDone: boolean }> {
  return ownedQuery(ctx, table, userId).paginate({ cursor, numItems: limit })
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
    case "entitlementGrants":
    case "billingCheckoutLocks":
    case "accountDeletionJobs":
    case "accountExportChunks":
      return ctx.db.query(table).withIndex("by_user", (q: any) => q.eq("userId", userId))
    case "aiDailyUsage":
      return ctx.db.query(table).withIndex("by_user_date", (q: any) => q.eq("userId", userId))
    case "privacyEvents":
    case "dataSubjectRequests":
    case "operatorTaskEvents":
    case "messageFeedback":
    case "weeklyReports":
    case "productEvents":
    case "emailDeliveries":
    case "accountExportJobs":
      return ctx.db.query(table).withIndex("by_user_created", (q: any) => q.eq("userId", userId))
    case "growthMapItems":
      return ctx.db.query(table).withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
  }
}
