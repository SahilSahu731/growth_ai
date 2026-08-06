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
    setPending(true); setError("")
    const response = await fetch("/api/account/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmation }) })
    if (response.ok) { await signOut({ callbackUrl: "/" }); return }
    const body = await response.json().catch(() => ({})) as { error?: string }; setError(body.error ?? "Deletion failed."); setPending(false)
  }
  return <div className="space-y-4"><p className="max-w-2xl text-sm font-normal leading-7 text-[#999994]">Permanent deletion removes your chats, goals, tasks, billing profile, and account. Active subscriptions must end first so deleting the account cannot leave an unmanaged renewal behind.</p>{!hideExport ? <a href="/api/account/export" className="inline-block rounded-lg border border-[#3a3a3a] px-4 py-2.5 text-sm font-medium text-[#dededb]">Download my data</a> : null}<div className="flex max-w-2xl flex-col gap-2 sm:flex-row"><Input value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder={`Type ${email} to confirm`} aria-label="Confirm account email" className="h-11 rounded-lg border-red-500/25 bg-[#151515] px-3 text-sm font-normal text-[#ededeb]" /><Button type="button" variant="destructive" className="h-11 rounded-lg px-5 text-sm font-semibold" disabled={pending || confirmation !== email} onClick={() => void remove()}>{pending ? "Deleting…" : "Delete permanently"}</Button></div>{error ? <p className="text-sm font-normal text-red-400">{error}</p> : null}</div>
}
