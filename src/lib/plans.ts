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
    features: ["Up to 3 active goals", "AI-planned, editable goal-linked tasks", "Weekly report and Growth Map", "JSON export, retention, and deletion controls"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For managing more active goals while supporting the public beta.",
    monthlyPrice: 999,
    badge: "Most popular",
    features: ["Up to 25 active goals", "Everything in the current Free workspace", "Subscription history and self-service cancellation", "Calendar, voice, and deeper insights are planned—not included yet"],
  },
  {
    id: "founder",
    name: "Founder",
    description: "A limited plan for people helping shape a healthier growth product.",
    monthlyPrice: 749,
    features: ["Everything currently available in Pro", "Locked founder price while subscribed", "Supports development during public beta", "No promised badge, private channel, or unreleased feature"],
  },
] as const

export function getPlan(id: PlanId | string): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0]
}
