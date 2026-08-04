"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DangerZone({ email }: { email: string }) {
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  async function remove() {
    if (confirmation !== email || !window.confirm("Permanently delete your GrowthAI account and history? This cannot be undone.")) return
    setPending(true); setError("")
    const response = await fetch("/api/account/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation }) })
    if (response.ok) { await signOut({ callbackUrl: "/" }); return }
    const body = await response.json().catch(() => ({})) as { error?: string }; setError(body.error ?? "Deletion failed."); setPending(false)
  }
  return <div className="space-y-3"><p className="text-sm leading-6 text-zinc-500">Download your data first if you want a copy. Permanent deletion removes your commitments, check-ins, patterns, reviews, evidence, integrations, and account.</p><a href="/api/account/export" className="inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-white">Download my data</a><div className="flex max-w-xl flex-col gap-2 sm:flex-row"><Input value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder={email} aria-label="Confirm account email" /><Button type="button" variant="destructive" disabled={pending || confirmation !== email} onClick={() => void remove()}>{pending ? "Deleting…" : "Delete permanently"}</Button></div>{error ? <p className="text-sm text-red-300">{error}</p> : null}</div>
}
