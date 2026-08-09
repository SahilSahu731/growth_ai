"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Route render failed", { digest: error.digest ?? "unknown" }) }, [error])
  return <main className="flex min-h-[70vh] items-center justify-center bg-background px-5 text-foreground"><section className="w-full max-w-xl rounded-3xl border border-border bg-card p-7 text-center shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[.16em] text-destructive">Temporary problem</p><h1 className="mt-4 text-3xl font-semibold tracking-tight">This page could not load.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your saved work has not been changed. Retry the route, or return to your workspace.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={reset} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Try again</button><Link href="/chat" className="min-h-11 content-center rounded-xl border border-border px-5 text-sm font-semibold">Open workspace</Link></div></section></main>
}
