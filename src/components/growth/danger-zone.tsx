"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DangerZone({ email, hideExport = false }: { email: string; hideExport?: boolean }) {
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function remove() {
    if (confirmation !== email || !window.confirm("Permanently delete your GrowthAI account and history? This cannot be undone.")) return
    setPending(true)
    setError("")
    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation }),
    })
    if (response.ok) {
      await signOut({ callbackUrl: "/" })
      return
    }
    const body = await response.json().catch(() => ({})) as { error?: string }
    setError(body.error ?? "Deletion failed.")
    setPending(false)
  }

  return <div className="space-y-4">
    <p className="max-w-2xl text-sm font-normal leading-7 text-[#b0b0ab]">
      Deletion is queued as a resumable background job and removes your account, chats, goals, tasks, preferences, and active billing profile. Active subscriptions must end first. Processing begins immediately with no cooling-off period. Minimal billing records may be retained where law requires; encrypted backups expire within 35 days and are not used to recreate deleted accounts. You must have signed in within the last 15 minutes.
    </p>
    {!hideExport ? <a href="/api/account/export" className="inline-flex min-h-11 items-center rounded-lg border border-[#3a3a3a] px-4 py-2.5 text-sm font-medium text-[#dededb]">Download my data</a> : null}
    <div className="flex max-w-2xl flex-col gap-2 sm:flex-row">
      <Input value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder={`Type ${email} to confirm`} aria-label="Confirm account email" className="h-11 rounded-lg border-red-500/25 bg-[#151515] px-3 text-sm font-normal text-[#ededeb]" />
      <Button type="button" variant="destructive" className="h-11 rounded-lg px-5 text-sm font-semibold" disabled={pending || confirmation !== email} onClick={() => void remove()}>{pending ? "Queuing…" : "Delete permanently"}</Button>
    </div>
    {error ? <p role="alert" className="text-sm font-normal text-red-400">{error}</p> : null}
  </div>
}
