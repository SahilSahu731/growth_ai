"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function CancelSubscription({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation }),
      })
      const result = await response.json() as { scheduled?: boolean; error?: string }
      if (!response.ok || !result.scheduled) throw new Error(result.error || "Cancellation could not be scheduled.")
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cancellation could not be scheduled.")
    } finally {
      setPending(false)
    }
  }

  return <><Button type="button" variant="outline" disabled={disabled} onClick={() => setOpen(true)} className="h-10 rounded-xl border-red-500/20 px-4 text-red-300 hover:bg-red-500/10">{disabled ? "Cancellation scheduled" : "Cancel subscription"}</Button><Dialog open={open} onOpenChange={(next) => { if (!pending) setOpen(next) }}><DialogContent className="border-white/10 bg-[#111516] p-0 text-white ring-0 sm:max-w-md"><DialogHeader className="border-b border-white/8 p-6"><span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-500/10"><AlertTriangle className="size-5 text-red-300" /></span><DialogTitle className="text-xl font-black">Schedule cancellation?</DialogTitle><DialogDescription className="mt-2 text-neutral-500">Your paid access remains available through the current billing period. Razorpay will stop future renewals.</DialogDescription></DialogHeader><div className="space-y-4 p-6"><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Type <strong className="text-white">CANCEL</strong> to confirm</span><Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="h-11 border-white/10 bg-white/5 text-white" /></label>{error ? <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300">{error}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={pending} onClick={() => setOpen(false)} className="h-10 px-4">Keep plan</Button><Button type="button" disabled={pending || confirmation !== "CANCEL"} onClick={() => void cancel()} className="h-10 bg-red-500 px-4 font-bold text-white hover:bg-red-400">{pending ? <><Loader2 className="animate-spin" />Scheduling…</> : "Confirm cancellation"}</Button></div></div></DialogContent></Dialog></>
}
