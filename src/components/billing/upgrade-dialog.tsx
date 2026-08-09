"use client"

import Link from "next/link"
import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { Check, CreditCard, Loader2, LockKeyhole, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PLANS, type PlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

type PaidPlan = Extract<PlanId, "pro" | "founder">
type UpgradeContextValue = { openUpgrade: (feature?: string, plan?: PaidPlan) => void }
const UpgradeContext = createContext<UpgradeContextValue | null>(null)

export function useUpgradeDialog() {
  const context = useContext(UpgradeContext)
  if (!context) throw new Error("Upgrade controls must be inside UpgradeDialogProvider")
  return context
}

export function UpgradeDialogProvider({ children, authenticated, currentPlan }: { children: ReactNode; authenticated: boolean; currentPlan: "free" | "pro" | "founder" | "team" }) {
  const [open, setOpen] = useState(false)
  const [feature, setFeature] = useState<string | null>(null)
  const [selected, setSelected] = useState<PaidPlan>("pro")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paid = currentPlan !== "free"
  const context = useMemo<UpgradeContextValue>(() => ({ openUpgrade: (requestedFeature, plan = "pro") => { setFeature(requestedFeature ?? null); setSelected(plan); setError(null); setOpen(true); if (authenticated) void fetch("/api/analytics/upgrade", { method: "POST" }).catch(() => undefined) } }), [authenticated])

  async function checkout() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      })
      const result = await response.json() as { checkoutUrl?: string; error?: string; code?: string }
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Secure checkout could not be started.")
      const checkoutUrl = new URL(result.checkoutUrl)
      if (checkoutUrl.protocol !== "https:") throw new Error("The checkout destination was rejected.")
      window.location.assign(checkoutUrl.toString())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Secure checkout could not be started.")
      setPending(false)
    }
  }

  return <UpgradeContext.Provider value={context}>{children}<Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next) }}><DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-white/10 bg-[#0d1112] p-0 text-white ring-0 sm:max-w-3xl"><DialogHeader className="border-b border-white/8 px-6 py-6 sm:px-8"><span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10"><Sparkles className="size-5 text-primary" /></span><DialogTitle className="text-2xl font-black tracking-[-.035em]">{paid ? "Included with your plan" : feature ? `Unlock ${feature}` : "Choose your GrowthAI plan"}</DialogTitle><DialogDescription className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">{paid ? `Your ${currentPlan} plan already includes Pro features. New operator experiences will appear here as they become available.` : "Upgrade without leaving your current workflow. Plan selection happens here; payment is completed on Razorpay's secure checkout."}</DialogDescription></DialogHeader>{paid ? <div className="p-6 sm:p-8"><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><p className="text-sm font-bold text-emerald-300">Your account is already upgraded.</p><p className="mt-2 text-xs leading-6 text-neutral-500">Manage renewal status and subscription history from your billing page.</p></div><div className="mt-5 flex justify-end"><Button asChild className="h-10 rounded-xl px-5 font-bold"><Link href="/billing">Manage billing</Link></Button></div></div> : <div className="p-6 sm:p-8"><div className="grid gap-3 md:grid-cols-2">{PLANS.filter((plan) => plan.id !== "free").map((plan) => <button key={plan.id} type="button" onClick={() => setSelected(plan.id as PaidPlan)} className={cn("relative rounded-2xl border p-5 text-left transition", selected === plan.id ? "border-primary/50 bg-primary/[.07] ring-1 ring-primary/15" : "border-white/8 bg-white/[.025] hover:border-white/15")}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-white">{plan.name}</p><p className="mt-1 text-xs text-neutral-500">{plan.description}</p></div><span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", selected === plan.id ? "border-primary bg-primary text-primary-foreground" : "border-white/15")}><Check className="size-3" /></span></div><p className="mt-5 text-2xl font-black">₹{plan.monthlyPrice}<span className="text-xs font-medium text-neutral-500"> / month</span></p><ul className="mt-4 space-y-2">{plan.features.slice(0, 3).map((item) => <li key={item} className="flex gap-2 text-[10px] leading-5 text-neutral-400"><Check className="mt-1 size-3 shrink-0 text-primary" />{item}</li>)}</ul></button>)}</div>{error ? <p role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/8 p-3 text-xs text-red-300">{error}</p> : null}<div className="mt-6 flex flex-col gap-4 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-[10px] leading-5 text-neutral-600"><LockKeyhole className="size-3.5 shrink-0 text-emerald-400" />Authenticated server checkout · Signed webhooks · No card data stored</div>{authenticated ? <Button type="button" disabled={pending} onClick={() => void checkout()} className="h-11 rounded-xl px-6 font-bold">{pending ? <><Loader2 className="animate-spin" />Opening Razorpay…</> : <><CreditCard />Continue securely</>}</Button> : <Button asChild className="h-11 rounded-xl px-6 font-bold"><Link href="/login?callbackUrl=/pricing">Sign in to upgrade</Link></Button>}</div><p className="mt-4 text-center text-[10px] text-neutral-700">Recurring monthly billing in INR. Taxes may apply. Cancel future renewal from Billing.</p></div>}</DialogContent></Dialog></UpgradeContext.Provider>
}

export function UpgradeTrigger({ feature, plan = "pro", children, className, title }: { feature?: string; plan?: PaidPlan; children: ReactNode; className?: string; title?: string }) {
  const { openUpgrade } = useUpgradeDialog()
  return <button type="button" title={title} onClick={() => openUpgrade(feature, plan)} className={className}>{children}</button>
}
