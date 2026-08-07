"use client"

import { useState } from "react"
import { Eraser, Send, TimerReset } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

async function post(body: Record<string, unknown>) {
  const response = await fetch("/api/account/privacy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const result = await response.json().catch(() => ({})) as { error?: string; requestId?: string; removed?: { conversations: number; messages: number } }
  if (!response.ok) throw new Error(result.error || "The privacy request could not be completed.")
  return result
}

export function PrivacyControls({ initialRetentionDays }: { initialRetentionDays: number }) {
  const [days, setDays] = useState(initialRetentionDays)
  const [memoryConfirmation, setMemoryConfirmation] = useState("")
  const [requestType, setRequestType] = useState("access")
  const [requestDetails, setRequestDetails] = useState("")
  const [pending, setPending] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  async function run(kind: string, body: Record<string, unknown>) {
    setPending(kind); setMessage("")
    try {
      const result = await post(body)
      if (kind === "memory") { setMemoryConfirmation(""); setMessage(`AI memory cleared: ${result.removed?.conversations ?? 0} conversations and ${result.removed?.messages ?? 0} messages removed. Approved goals and tasks were retained.`) }
      else if (kind === "request") { setRequestDetails(""); setMessage(`Request submitted and identity verified. Reference: ${result.requestId}`) }
      else setMessage(days ? `Messages older than ${days} days will be removed automatically.` : "Automatic message expiry is off. Messages remain until you remove them.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "The request failed.") }
    finally { setPending(null) }
  }

  return <div className="divide-y divide-[#292929]">
    <section className="py-6"><div className="flex gap-3"><TimerReset className="mt-1 size-5 shrink-0 text-primary" /><div className="w-full"><h3 className="font-medium text-[#ededeb]">Automatic message retention</h3><p className="mt-1 text-sm leading-6 text-[#a3a39e]">A daily job permanently removes messages older than your selection. Goals and tasks remain.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><select value={days} onChange={(event) => setDays(Number(event.target.value))} className="min-h-11 rounded-lg border border-[#3d3d3d] bg-[#171717] px-3 text-sm"><option value={0}>Keep until I delete</option><option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>180 days</option><option value={365}>365 days</option></select><Button disabled={pending !== null} onClick={() => void run("retention", { action: "retention", days })}>Save retention</Button></div></div></div></section>
    <section className="py-6"><div className="flex gap-3"><Eraser className="mt-1 size-5 shrink-0 text-primary" /><div className="w-full"><h3 className="font-medium text-[#ededeb]">Clear AI memory</h3><p className="mt-1 text-sm leading-6 text-[#a3a39e]">Permanently deletes every conversation and message without deleting your account, goals, approved tasks, preferences, or billing records.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><Input value={memoryConfirmation} onChange={(event) => setMemoryConfirmation(event.target.value)} placeholder="Type CLEAR AI MEMORY" aria-label="Type CLEAR AI MEMORY to confirm" className="min-h-11 border-[#3d3d3d] bg-[#171717]" /><Button variant="destructive" disabled={pending !== null || memoryConfirmation !== "CLEAR AI MEMORY"} onClick={() => void run("memory", { action: "clear-memory", confirmation: memoryConfirmation })}>Clear memory</Button></div></div></div></section>
    <section className="py-6"><div className="flex gap-3"><Send className="mt-1 size-5 shrink-0 text-primary" /><div className="w-full"><h3 className="font-medium text-[#ededeb]">Data rights request</h3><p className="mt-1 text-sm leading-6 text-[#a3a39e]">Submit a tracked privacy request. Your signed-in account verifies identity; support may request additional verification for sensitive changes.</p><div className="mt-4 grid gap-3"><select value={requestType} onChange={(event) => setRequestType(event.target.value)} className="min-h-11 rounded-lg border border-[#3d3d3d] bg-[#171717] px-3 text-sm"><option value="access">Access</option><option value="correction">Correction</option><option value="deletion">Deletion</option><option value="restriction">Restriction</option><option value="objection">Objection</option></select><textarea value={requestDetails} onChange={(event) => setRequestDetails(event.target.value)} maxLength={1000} rows={3} placeholder="Optional details" className="rounded-lg border border-[#3d3d3d] bg-[#171717] p-3 text-sm" /><Button className="w-fit" disabled={pending !== null} onClick={() => void run("request", { action: "data-request", type: requestType, details: requestDetails })}>Submit request</Button></div></div></div></section>
    <div aria-live="polite" className="min-h-12 py-3 text-sm text-[#c5c5c0]">{message}</div>
  </div>
}
