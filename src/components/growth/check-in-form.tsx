"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { submitCheckInAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CheckInForm({ projectId, projectName, currentNextAction, promptId }: { projectId: string; projectName: string; currentNextAction: string; promptId?: string | null }) {
  const router = useRouter()
  const [state, action, pending] = useActionState(submitCheckInAction, {} as GrowthActionState)
  useEffect(() => { if (state.success) router.refresh() }, [router, state.success])

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="projectId" value={projectId} />
      {promptId ? <input type="hidden" name="promptId" value={promptId} /> : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Accountability check-in</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">What did you do on {projectName}?</h2>
        <p className="mt-2 text-sm text-zinc-400">Name something observable: a change, test, conversation, decision, deployment, or lesson.</p>
      </div>
      <Textarea name="response" aria-label="Progress update" placeholder="I implemented the OAuth callback, reproduced the production failure, and found the redirect URI mismatch…" className="min-h-36 bg-zinc-950/70" maxLength={4000} required />
      <fieldset><legend className="mb-3 text-sm font-medium text-zinc-200">Which state is most honest today?</legend><div className="grid gap-2 sm:grid-cols-4">{[
        ["progress", "Made progress"], ["blocked", "I’m blocked"], ["avoiding", "I’m avoiding it"], ["pause_request", "Need to pause"],
      ].map(([value, label]) => <label key={value} className="cursor-pointer rounded-xl border border-white/10 px-3 py-2.5 text-center text-sm text-zinc-300 has-checked:border-emerald-400 has-checked:bg-emerald-400/10 has-checked:text-white"><input type="radio" name="state" value={value} defaultChecked={value === "progress"} className="sr-only" />{label}</label>)}</div></fieldset>
      <div className="space-y-2"><Label htmlFor="nextAction">What will you do next?</Label><Input id="nextAction" name="nextAction" defaultValue={currentNextAction} maxLength={240} required /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="nextActionDueAt">Finish by (optional)</Label><Input id="nextActionDueAt" name="nextActionDueAt" type="datetime-local" /></div>
        <div className="space-y-2"><Label htmlFor="evidenceUrl">Evidence URL (optional)</Label><Input id="evidenceUrl" name="evidenceUrl" type="url" placeholder="https://github.com/…" /></div>
      </div>
      {state.error ? <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p> : null}
      {state.success ? <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{state.success}</p> : null}
      <Button type="submit" disabled={pending} className="h-11 rounded-full bg-emerald-400 px-6 font-semibold text-zinc-950 hover:bg-emerald-300">{pending ? "Saving before coaching…" : "Submit check-in"}</Button>
    </form>
  )
}
