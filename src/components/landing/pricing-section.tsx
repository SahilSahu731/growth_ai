"use client"

import Link from "next/link"
import { Check, ShieldCheck } from "lucide-react"

import { UpgradeDialogProvider, useUpgradeDialog } from "@/components/billing/upgrade-dialog"
import { Button } from "@/components/ui/button"
import { PLANS } from "@/lib/plans"
import { cn } from "@/lib/utils"

type CurrentPlan = "free" | "pro" | "founder" | "team"

export function PricingSection({ compact = false, authenticated = false, currentPlan = "free" }: { compact?: boolean; authenticated?: boolean; currentPlan?: CurrentPlan }) {
  return <UpgradeDialogProvider authenticated={authenticated} currentPlan={currentPlan}><PricingGrid compact={compact} authenticated={authenticated} currentPlan={currentPlan} /></UpgradeDialogProvider>
}

function PricingGrid({ compact, authenticated, currentPlan }: { compact: boolean; authenticated: boolean; currentPlan: CurrentPlan }) {
  const { openUpgrade } = useUpgradeDialog()
  return <section id="pricing" className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", compact ? "py-12" : "py-24")}>
    {!compact ? <div className="mx-auto mb-12 max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Simple pricing</p><h2 className="mt-4 text-3xl font-black tracking-[-.04em] text-neutral-950 sm:text-5xl">The core growth loop stays free.</h2><p className="mt-4 text-base leading-7 text-neutral-500">Pro increases the active-goal limit. The current workspace, privacy export, weekly review, and Growth Map remain available on Free.</p></div> : null}
    <div className="grid gap-5 lg:grid-cols-3">{PLANS.map((plan) => { const isCurrent = currentPlan === plan.id || (currentPlan === "team" && plan.id === "pro"); return <article key={plan.id} className={cn("relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm", plan.id === "pro" ? "border-primary/50 ring-1 ring-primary/10" : "border-neutral-200")}>
      {isCurrent ? <span className="absolute right-5 top-5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase text-emerald-400">Current</span> : plan.badge ? <span className="absolute right-5 top-5 rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">{plan.badge}</span> : null}
      <p className="text-lg font-black text-neutral-950">{plan.name}</p><p className="mt-2 min-h-12 text-sm leading-6 text-neutral-500">{plan.description}</p><div className="mt-6 flex items-end gap-1"><span className="text-4xl font-black tracking-tight text-neutral-950">{plan.monthlyPrice === null ? "Custom" : plan.monthlyPrice === 0 ? "₹0" : `₹${plan.monthlyPrice}`}</span>{plan.monthlyPrice !== null && plan.monthlyPrice > 0 ? <span className="pb-1 text-sm text-zinc-500">/ month</span> : null}</div><ul className="my-7 flex-1 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex gap-3 text-sm text-neutral-600"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><span>{feature}</span></li>)}</ul>
      {plan.id === "free" ? authenticated ? <Button disabled className="h-11 rounded-full">{isCurrent ? "Current plan" : "Free plan"}</Button> : <Button asChild className="h-11 rounded-full"><Link href="/signup">Start free</Link></Button> : <Button type="button" disabled={isCurrent} onClick={() => openUpgrade(undefined, plan.id as "pro" | "founder")} className="h-11 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/85">{isCurrent ? "Current plan" : `Choose ${plan.name}`}</Button>}
      {plan.id !== "free" ? <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-neutral-500"><ShieldCheck className="size-3 text-emerald-400" />Secure Razorpay checkout. Cancel future renewal any time.</p> : null}
      <p className="mt-2 text-center text-[10px] leading-4 text-neutral-400">{plan.purchaseDisclosure}</p>
    </article> })}</div>
  </section>
}
