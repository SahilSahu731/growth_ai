import Link from "next/link"

import { PricingSection } from "@/components/landing/pricing-section"

export const metadata = {
  title: "Pricing | GrowthAI",
  description: "Simple plans for accountability that helps builders ship.",
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold"><span className="flex size-8 items-center justify-center rounded-xl bg-emerald-400 text-zinc-950">G</span>GrowthAI</Link>
          <Link href="/login" className="text-sm text-zinc-400 transition hover:text-white">Log in</Link>
        </div>
      </header>
      <div className="px-4 pt-20 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Plans</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Ship one thing free. Upgrade when you need depth.</h1>
      </div>
      <PricingSection compact />
      <p className="mx-auto max-w-3xl px-4 pb-20 text-center text-sm leading-6 text-zinc-500">Prices are in INR and include the product features shown above. Taxes may apply. Payment credentials must be configured before checkout is available.</p>
    </main>
  )
}
