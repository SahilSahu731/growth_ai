export type PlanId = "free" | "pro" | "founder" | "team"
export type MarketedPlanId = "free" | "pro"
export type PaidPlanId = "pro" | "founder"
export type PlanAvailability = "public" | "limited" | "unavailable"
export type EntitlementKey = "operator" | "weekly_report" | "growth_map" | "privacy_export" | "expanded_goals"

export type PlanDefinition = {
  id: PlanId
  name: string
  description: string
  availability: PlanAvailability
  price: { amountMinor: number | null; currency: "INR"; interval: "month" | null; intervalCount: 1 | null; taxBehavior: "exclusive" }
  limits: { activeGoals: number }
  entitlements: Readonly<Record<EntitlementKey, boolean>>
  providerPlanEnvironmentKey: "RAZORPAY_PLAN_ID_PRO_MONTHLY" | "RAZORPAY_PLAN_ID_FOUNDER" | null
  badge?: string
  features: readonly string[]
  purchaseDisclosure: string
}

export const PLAN_CATALOG: Readonly<Record<PlanId, PlanDefinition>> = {
  free: {
    id: "free",
    name: "Free",
    description: "The complete public-beta growth loop for one focused season of life.",
    availability: "public",
    price: { amountMinor: 0, currency: "INR", interval: null, intervalCount: null, taxBehavior: "exclusive" },
    limits: { activeGoals: 3 },
    entitlements: { operator: true, weekly_report: true, growth_map: true, privacy_export: true, expanded_goals: false },
    providerPlanEnvironmentKey: null,
    features: ["Up to 3 active goals", "AI-guided conversations and editable tasks", "Weekly review and Growth Map", "JSON export, retention, and deletion controls"],
    purchaseDisclosure: "No payment method or recurring charge.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "More active goals for people using the public-beta workspace across several priorities.",
    availability: "public",
    price: { amountMinor: 99_900, currency: "INR", interval: "month", intervalCount: 1, taxBehavior: "exclusive" },
    limits: { activeGoals: 25 },
    entitlements: { operator: true, weekly_report: true, growth_map: true, privacy_export: true, expanded_goals: true },
    providerPlanEnvironmentKey: "RAZORPAY_PLAN_ID_PRO_MONTHLY",
    badge: "Most popular",
    features: ["Up to 25 active goals", "Everything in the current Free workspace", "Subscription history and self-service cancellation", "No calendar, voice, or unshipped-memory promises"],
    purchaseDisclosure: "Renews monthly until cancelled. Taxes may be added by Razorpay where required.",
  },
  founder: {
    id: "founder",
    name: "Founder",
    description: "A legacy public-beta price retained for existing continuously subscribed accounts; new enrollment is closed.",
    availability: "unavailable",
    price: { amountMinor: 74_900, currency: "INR", interval: "month", intervalCount: 1, taxBehavior: "exclusive" },
    limits: { activeGoals: 25 },
    entitlements: { operator: true, weekly_report: true, growth_map: true, privacy_export: true, expanded_goals: true },
    providerPlanEnvironmentKey: "RAZORPAY_PLAN_ID_FOUNDER",
    features: ["Legacy accounts retain the current Pro workspace", "₹749 monthly price while continuously subscribed", "Closed to new enrollment", "No badge, private channel, or unreleased feature promise"],
    purchaseDisclosure: "Not available for new purchase. Existing subscriptions renew monthly until cancelled; taxes may apply.",
  },
  team: {
    id: "team",
    name: "Team",
    description: "Not currently offered. Collaboration, ownership, privacy, and billing behavior are not launch-ready.",
    availability: "unavailable",
    price: { amountMinor: null, currency: "INR", interval: null, intervalCount: null, taxBehavior: "exclusive" },
    limits: { activeGoals: 3 },
    entitlements: { operator: true, weekly_report: true, growth_map: true, privacy_export: true, expanded_goals: false },
    providerPlanEnvironmentKey: null,
    features: ["Not available for purchase"],
    purchaseDisclosure: "Team is not a purchasable or assignable product.",
  },
} as const

export type Plan = PlanDefinition & { monthlyPrice: number | null }

export const PLANS: readonly Plan[] = (["free", "pro"] as const).map((id) => {
  const plan = PLAN_CATALOG[id]
  return { ...plan, monthlyPrice: plan.price.amountMinor === null ? null : plan.price.amountMinor / 100 }
})

export function getPlan(id: PlanId | string): Plan {
  const plan = id in PLAN_CATALOG ? PLAN_CATALOG[id as PlanId] : PLAN_CATALOG.free
  return { ...plan, monthlyPrice: plan.price.amountMinor === null ? null : plan.price.amountMinor / 100 }
}

export function getPurchasablePlan(id: unknown): PlanDefinition | null {
  if (id !== "pro" && id !== "founder") return null
  const plan = PLAN_CATALOG[id]
  return plan.availability === "public" || plan.availability === "limited" ? plan : null
}

export function configuredProviderPlan(planId: PaidPlanId, environment: Record<string, string | undefined>) {
  const plan = PLAN_CATALOG[planId]
  const key = plan.providerPlanEnvironmentKey
  const providerPlanId = key ? environment[key] : undefined
  if (!providerPlanId || plan.price.amountMinor === null || !plan.price.interval) return null
  return {
    plan: planId,
    planId: providerPlanId,
    amount: plan.price.amountMinor,
    currency: plan.price.currency,
    interval: plan.price.interval,
    intervalCount: plan.price.intervalCount,
  }
}

export function planForProviderId(providerPlanId: string | undefined, environment: Record<string, string | undefined>) {
  if (!providerPlanId) return null
  for (const planId of ["pro", "founder"] as const) {
    const configured = configuredProviderPlan(planId, environment)
    if (configured?.planId === providerPlanId) return configured
  }
  return null
}

export function planHasEntitlement(planId: PlanId | string | undefined, entitlement: EntitlementKey) {
  return getPlan(planId ?? "free").entitlements[entitlement]
}
