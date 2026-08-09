"use client"

import { useEffect, useState } from "react"
import { Download, LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

type ExportReference = { id: string; token: string }
type ExportStatus = { status: "queued" | "processing" | "completed" | "failed" | "expired"; stage: string; rowCount: number; byteSize: number; expiresAt: string; errorCode?: string | null }
const storageKey = "growthai:account-export"

export function AccountExportControl() {
  const [reference, setReference] = useState<ExportReference | null>(null)
  const [status, setStatus] = useState<ExportStatus | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    try { const saved = window.sessionStorage.getItem(storageKey); if (saved) setReference(JSON.parse(saved) as ExportReference) }
    catch { window.sessionStorage.removeItem(storageKey) }
  }, [])

  useEffect(() => {
    if (!reference || ["completed", "failed", "expired"].includes(status?.status ?? "")) return
    let active = true
    const check = async () => {
      try {
        const response = await fetch(`/api/account/export?job=${encodeURIComponent(reference.id)}&token=${encodeURIComponent(reference.token)}`, { cache: "no-store" })
        const result = await response.json() as ExportStatus & { error?: string }
        if (!response.ok) throw new Error(result.error ?? "Could not check export status")
        if (active) setStatus(result)
      } catch (failure) { if (active) setError(failure instanceof Error ? failure.message : "Could not check export status") }
    }
    void check()
    const timer = window.setInterval(() => void check(), 2500)
    return () => { active = false; window.clearInterval(timer) }
  }, [reference, status?.status])

  async function start() {
    setPending(true); setError(""); setStatus(null)
    try {
      const response = await fetch("/api/account/export", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
      const result = await response.json() as ExportReference & { error?: string }
      if (!response.ok) throw new Error(result.error ?? "Could not start export")
      const next = { id: result.id, token: result.token }
      window.sessionStorage.setItem(storageKey, JSON.stringify(next))
      setReference(next)
      setStatus({ status: "queued", stage: "queued", rowCount: 0, byteSize: 0, expiresAt: "" })
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not start export") }
    finally { setPending(false) }
  }

  const ready = Boolean(reference && status?.status === "completed")
  return <div className="flex min-w-40 flex-col items-end gap-2"><Button type="button" variant="outline" disabled={pending || status?.status === "queued" || status?.status === "processing"} onClick={() => void start()} className="min-h-11 rounded-lg px-4 text-sm font-medium">{pending || status?.status === "queued" || status?.status === "processing" ? <LoaderCircle className="animate-spin" /> : <Download />}{ready ? "Create another" : "Prepare export"}</Button>{ready && reference ? <a href={`/api/account/export?job=${encodeURIComponent(reference.id)}&token=${encodeURIComponent(reference.token)}&download=1`} className="text-xs font-medium text-primary underline underline-offset-4">Download JSON before it expires</a> : null}{status?.status === "queued" || status?.status === "processing" ? <span role="status" className="text-right text-xs text-[#8f8f8b]">Preparing securely · {status.rowCount} records</span> : null}{status?.status === "failed" ? <span role="alert" className="text-right text-xs text-red-400">Export failed. Try again or contact support with code {status.errorCode ?? "EXPORT_FAILED"}.</span> : null}{error ? <span role="alert" className="text-right text-xs text-red-400">{error}</span> : null}</div>
}
