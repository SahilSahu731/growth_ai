import Link from "next/link"
import type { ReactNode } from "react"

import { BrandLogo } from "@/components/brand-logo"
import { SiteFooter } from "@/components/landing/site-footer"

export function TrustPage({ eyebrow, title, summary, updated, children }: { eyebrow: string; title: string; summary: string; updated: string; children: ReactNode }) {
  return <main className="min-h-screen bg-[#fafafa] text-neutral-950">
    <header className="border-b border-neutral-200 bg-white"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><Link href="/" className="flex items-center gap-2 font-display"><BrandLogo className="size-8" />GrowthAI</Link><Link href="/security" className="text-sm font-semibold text-neutral-600 hover:text-neutral-950">Trust center</Link></div></header>
    <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-black tracking-[-.04em] sm:text-6xl">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-neutral-600">{summary}</p>
      <p className="mt-3 text-sm text-neutral-500">Last updated: {updated}</p>
      <div className="trust-copy mt-12 space-y-10">{children}</div>
    </article>
    <SiteFooter />
  </main>
}

export function TrustSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2 className="text-2xl font-bold tracking-tight">{title}</h2><div className="mt-3 space-y-3 text-base leading-8 text-neutral-600">{children}</div></section>
}
