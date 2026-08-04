import Link from "next/link"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PLANS } from "@/lib/plans"
import { cn } from "@/lib/utils"

export function PricingSection({ compact = false }: { compact?: boolean }) {
  return (
    <section id="pricing" className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", compact ? "py-12" : "py-24")}>
      {!compact ? (
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Simple pricing</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Pay for depth, not artificial motivation.</h2>
          <p className="mt-4 text-base leading-7 text-zinc-400">The complete core loop stays free. Pro adds multiple commitments, deeper memory, integrations, and exports.</p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-3xl border bg-zinc-900/70 p-6",
              plan.id === "pro" ? "border-emerald-400/50 shadow-2xl shadow-emerald-950/30" : "border-white/10"
            )}
          >
            {plan.badge ? <span className="absolute right-5 top-5 rounded-full bg-emerald-400 px-3 py-1 text-xs font-semibold text-zinc-950">{plan.badge}</span> : null}
            <p className="text-lg font-semibold text-white">{plan.name}</p>
            <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-400">{plan.description}</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-semibold tracking-tight text-white">{plan.monthlyPrice === null ? "Custom" : plan.monthlyPrice === 0 ? "₹0" : `₹${plan.monthlyPrice}`}</span>
              {plan.monthlyPrice !== null && plan.monthlyPrice > 0 ? <span className="pb-1 text-sm text-zinc-500">/ month</span> : null}
            </div>
            <ul className="my-7 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-zinc-300">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild className={cn("h-11 rounded-full", plan.id === "pro" ? "bg-emerald-400 text-zinc-950 hover:bg-emerald-300" : "bg-white text-zinc-950 hover:bg-zinc-200")}>
              <Link href={plan.id === "free" ? "/signup" : `/api/billing/checkout?plan=${plan.id}`}>
                {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
              </Link>
            </Button>
            {plan.id !== "free" ? <p className="mt-3 text-center text-xs text-zinc-500">Secure monthly billing via Razorpay. Cancel any time.</p> : null}
          </article>
        ))}
      </div>
    </section>
  )
}
