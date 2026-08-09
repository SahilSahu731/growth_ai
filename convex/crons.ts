import { cronJobs, makeFunctionReference, type FunctionReference } from "convex/server"

const crons = cronJobs()
const enforceRetention = makeFunctionReference<"mutation", Record<string, never>, unknown>("privacy:enforceMessageRetention") as unknown as FunctionReference<"mutation", "internal", Record<string, never>, unknown>
const retryBillingEvents = makeFunctionReference<"mutation", Record<string, never>, unknown>("billing:retryDueEvents") as unknown as FunctionReference<"mutation", "internal", Record<string, never>, unknown>
const expireBillingCheckouts = makeFunctionReference<"mutation", Record<string, never>, unknown>("billing:expireAbandonedCheckouts") as unknown as FunctionReference<"mutation", "internal", Record<string, never>, unknown>
const reconcileBilling = makeFunctionReference<"action", Record<string, never>, unknown>("billing:reconcileSubscriptions") as unknown as FunctionReference<"action", "internal", Record<string, never>, unknown>
const deliverEmail = makeFunctionReference<"action", Record<string, never>, unknown>("email:deliverQueued") as unknown as FunctionReference<"action", "internal", Record<string, never>, unknown>
const queueWeeklyEmail = makeFunctionReference<"mutation", Record<string, never>, unknown>("email:queueWeeklySummaries") as unknown as FunctionReference<"mutation", "internal", Record<string, never>, unknown>
const recoverExports = makeFunctionReference<"mutation", Record<string, never>, unknown>("exports:recoverAndExpire") as unknown as FunctionReference<"mutation", "internal", Record<string, never>, unknown>
const recoverDeletions = makeFunctionReference<"mutation", Record<string, never>, unknown>("privacy:recoverDeletionJobs") as unknown as FunctionReference<"mutation", "internal", Record<string, never>, unknown>

crons.daily("enforce message and legal retention", { hourUTC: 2, minuteUTC: 20 }, enforceRetention, {})
crons.interval("retry failed billing events", { minutes: 5 }, retryBillingEvents, {})
crons.interval("expire abandoned billing checkouts", { minutes: 30 }, expireBillingCheckouts, {})
crons.interval("reconcile Razorpay subscriptions", { hours: 6 }, reconcileBilling, {})
crons.interval("deliver transactional email", { minutes: 5 }, deliverEmail, {})
crons.interval("queue opted-in weekly summaries", { hours: 1 }, queueWeeklyEmail, {})
crons.interval("recover and expire account exports", { minutes: 15 }, recoverExports, {})
crons.interval("recover stuck deletion jobs", { minutes: 15 }, recoverDeletions, {})

export default crons
