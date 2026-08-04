"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createGrowthProjectAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

function inThirtyDays() { const date = new Date(); date.setDate(date.getDate() + 30); return date.toISOString().slice(0, 10) }
export function GrowthProjectForm() {
  const router = useRouter(); const [state, action, pending] = useActionState(createGrowthProjectAction, {} as GrowthActionState)
  useEffect(() => { if (state.projectId) router.push(`/goals/${state.projectId}`) }, [router, state.projectId])
  return <form action={action} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><Field label="Name this intention"><Input name="name" maxLength={80} required /></Field><Field label="Life area"><select name="lifeArea" className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm">{["health","career","relationships","learning","finances","creativity","wellbeing","personal"].map(area => <option key={area} value={area}>{area[0].toUpperCase()+area.slice(1)}</option>)}</select></Field></div><Field label="What would you like to change?"><Textarea name="description" maxLength={600} required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Why it matters"><Textarea name="whyItMatters" maxLength={500} required /></Field><Field label="How you will recognize progress"><Textarea name="definitionOfShipped" maxLength={300} required /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Smallest next step"><Input name="currentNextAction" maxLength={240} required /></Field><Field label="Reflection date"><Input name="targetShipDate" type="date" defaultValue={inThirtyDays()} required /></Field></div><Field label="Next step due (optional)"><Input name="nextActionDueAt" type="datetime-local" /></Field>{state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}<Button disabled={pending} className="rounded-full bg-neutral-950 text-white hover:bg-neutral-800">{pending ? "Creating…" : "Create intention"}</Button></form>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label className="font-bold text-neutral-800">{label}</Label>{children}</div> }
