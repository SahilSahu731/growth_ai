import { describe, expect, it } from "vitest"
import { PLAN_CATALOG, configuredProviderPlan, getPurchasablePlan, planHasEntitlement, type EntitlementKey, type PlanId } from "./plans"

describe("authoritative plan catalog", () => {
  const plans: PlanId[] = ["free", "pro", "founder", "team"]
  const features: EntitlementKey[] = ["operator", "weekly_report", "growth_map", "privacy_export", "expanded_goals"]

  it("defines every plan and entitlement explicitly", () => {
    for (const plan of plans) {
      expect(PLAN_CATALOG[plan].id).toBe(plan)
      for (const feature of features) expect(typeof planHasEntitlement(plan, feature)).toBe("boolean")
    }
    expect(PLAN_CATALOG.free.limits.activeGoals).toBe(3)
    expect(PLAN_CATALOG.pro.limits.activeGoals).toBe(25)
    expect(PLAN_CATALOG.founder.availability).toBe("unavailable")
    expect(PLAN_CATALOG.team.availability).toBe("unavailable")
  })

  it("opens only Pro for new checkout and derives provider amount from the catalog", () => {
    expect(getPurchasablePlan("pro")?.price.amountMinor).toBe(99_900)
    expect(getPurchasablePlan("founder")).toBeNull()
    expect(getPurchasablePlan("team")).toBeNull()
    expect(configuredProviderPlan("pro", { RAZORPAY_PLAN_ID_PRO_MONTHLY: "plan_test123" })).toMatchObject({ plan: "pro", planId: "plan_test123", amount: 99_900, currency: "INR", interval: "month" })
  })

  it("keeps privacy export a right on every plan", () => {
    for (const plan of plans) expect(planHasEntitlement(plan, "privacy_export")).toBe(true)
  })
})
