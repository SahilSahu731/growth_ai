import { cronJobs, makeFunctionReference, type FunctionReference } from "convex/server"

const crons = cronJobs()
const enforceRetention = makeFunctionReference<"mutation", Record<string, never>, unknown>("privacy:enforceMessageRetention") as unknown as FunctionReference<"mutation", "internal", Record<string, never>, unknown>

crons.daily("enforce message and legal retention", { hourUTC: 2, minuteUTC: 20 }, enforceRetention, {})

export default crons
