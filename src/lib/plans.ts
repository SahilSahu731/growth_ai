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
    description: "For proving that the accountability loop works for you.",
    monthlyPrice: 0,
    features: ["One active commitment", "Core check-ins and honest coaching", "Basic streak and weekly review", "Manual evidence links"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For builders shipping several projects with deeper memory.",
    monthlyPrice: 999,
    badge: "Most popular",
    features: ["Up to 10 active commitments", "Deeper patterns and review history", "GitHub evidence integration", "Public progress pages and exports"],
  },
  {
    id: "founder",
    name: "Founder",
    description: "A limited early-supporter plan with permanent recognition.",
    monthlyPrice: 749,
    features: ["Everything in Pro", "Locked founder price while subscribed", "Direct product feedback channel", "Founder badge (optional)"],
  },
] as const

export function getPlan(id: PlanId | string): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0]
}
