"use client"

import { AlertTriangle } from "lucide-react"

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="mx-auto mt-16 max-w-lg rounded-2xl border border-red-500/15 bg-red-500/5 p-7 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-red-500/10"><AlertTriangle className="size-5 text-red-300" /></span><h1 className="mt-5 text-xl font-black text-white">Admin data could not be loaded.</h1><p className="mt-2 text-sm leading-6 text-neutral-500">The session remains protected. Check the Convex deployment and retry the request.</p><button type="button" onClick={reset} className="mt-6 h-10 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground">Try again</button></section>
}
