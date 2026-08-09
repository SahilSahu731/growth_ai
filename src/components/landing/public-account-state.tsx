"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRight } from "lucide-react"

import { PricingSection } from "@/components/landing/pricing-section"

type PublicState = { authenticated: boolean; plan: "free" | "pro" | "founder" }
const fallback: PublicState = { authenticated: false, plan: "free" }
let stateRequest: Promise<PublicState> | null = null

function loadState() {
  stateRequest ??= fetch("/api/account/state", { credentials: "same-origin", cache: "no-store" })
    .then((response) => response.ok ? response.json() as Promise<PublicState> : fallback)
    .catch(() => fallback)
  return stateRequest
}

function usePublicState() {
  const [state, setState] = useState(fallback)
  useEffect(() => { void loadState().then(setState) }, [])
  return state
}

export function LandingAccountCtas() {
  const state = usePublicState()
  const destination = state.authenticated ? "/chat" : "/signup"
  return <div className="flex items-center gap-2"><Link href={state.authenticated ? "/chat" : "/login"} className="hidden rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-bold text-neutral-800 transition hover:-translate-y-0.5 hover:bg-neutral-50 sm:block">{state.authenticated ? "Workspace" : "Log in"}</Link><Link href={destination} className="group flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/10 transition hover:-translate-y-0.5 hover:bg-primary/85">{state.authenticated ? "Continue" : "Start growing"}<ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link></div>
}

export function LandingPrimaryCta({ children }: { children: React.ReactNode }) {
  const state = usePublicState()
  return <Link href={state.authenticated ? "/chat" : "/signup"} className="group flex h-12 w-full max-w-64 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:bg-primary/85 sm:w-auto">{children}<ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
}

export function PricingAccountHeader() {
  const state = usePublicState()
  return state.authenticated ? <div className="flex items-center gap-2"><Link href="/settings#billing" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold">Billing</Link><Link href="/dashboard" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Dashboard</Link></div> : <Link href="/login?callbackUrl=/pricing" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold">Log in</Link>
}

export function PublicPricingSection() {
  const state = usePublicState()
  return <PricingSection compact authenticated={state.authenticated} currentPlan={state.plan} />
}
