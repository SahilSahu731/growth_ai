export type PlanId = "free" | "pro" | "founder"

export type Plan = {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number | null
  badge?: string
  features: readonly string[]
}

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "A complete chat-to-action loop for focused personal growth.",
    monthlyPrice: 0,
    features: ["Up to 3 active goals", "AI-planned, editable goal-linked tasks", "Weekly report and Growth Map", "Private by default"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing across several parts of life with deeper memory.",
    monthlyPrice: 999,
    badge: "Most popular",
    features: ["Up to 25 active goals", "Calendar Operator and deeper memory", "Voice Coach and advanced insights", "Exports and priority features"],
  },
  {
    id: "founder",
    name: "Founder",
    description: "A limited plan for people helping shape a healthier growth product.",
    monthlyPrice: 749,
    features: ["Everything in Pro", "Locked founder price while subscribed", "Direct product feedback channel", "Founder badge (optional)"],
  },
] as const

export function getPlan(id: PlanId | string): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0]
}
