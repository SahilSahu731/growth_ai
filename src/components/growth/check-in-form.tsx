"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { submitCheckInAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function CheckInForm({ projectId, projectName, currentNextAction, promptId }: { projectId: string; projectName: string; currentNextAction: string; promptId?: string | null }) {
  const router = useRouter(); const [state, action, pending] = useActionState(submitCheckInAction, {} as GrowthActionState)
  useEffect(() => { if (state.success) router.refresh() }, [router, state.success])
  return <form action={action} className="space-y-6"><input type="hidden" name="projectId" value={projectId} />{promptId ? <input type="hidden" name="promptId" value={promptId} /> : null}<div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400">A moment to notice</p><h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-neutral-950">What shifted around {projectName}?</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-500">Small counts. Name what happened, what you felt, or what made the next step easier or harder.</p></div><Textarea name="response" aria-label="Growth reflection" placeholder="I noticed that…" className="min-h-36 border-neutral-200 bg-neutral-50/60 text-base leading-7" maxLength={4000} required />
    <fieldset><legend className="mb-3 text-sm font-bold text-neutral-800">Which feels most true?</legend><div className="grid gap-2 sm:grid-cols-4">{[["progress","I moved forward"],["blocked","Something blocked me"],["avoiding","I’m avoiding this"],["pause_request","I need a pause"]].map(([value,label]) => <label key={value} className="cursor-pointer rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center text-xs font-bold text-neutral-500 transition has-checked:border-neutral-950 has-checked:bg-neutral-950 has-checked:text-white"><input type="radio" name="state" value={value} defaultChecked={value === "progress"} className="sr-only" />{label}</label>)}</div></fieldset>
    <div className="space-y-2"><Label htmlFor="nextAction" className="font-bold text-neutral-800">What is one kind, concrete next step?</Label><Input id="nextAction" name="nextAction" defaultValue={currentNextAction} maxLength={240} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="nextActionDueAt" className="font-bold text-neutral-800">When? (optional)</Label><Input id="nextActionDueAt" name="nextActionDueAt" type="datetime-local" /></div><div className="space-y-2"><Label htmlFor="evidenceUrl" className="font-bold text-neutral-800">A supporting link (optional)</Label><Input id="evidenceUrl" name="evidenceUrl" type="url" placeholder="A note, photo, activity, or resource" /></div></div>
    {state.error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}{state.success ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{state.success}</p> : null}<Button type="submit" disabled={pending} className="h-11 rounded-full bg-neutral-950 px-6 font-bold text-white hover:bg-neutral-800">{pending ? "Saving your reflection…" : "Save reflection"}</Button></form>
}
