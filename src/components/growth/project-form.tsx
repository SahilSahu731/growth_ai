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
  const router = useRouter()
  const [state, action, pending] = useActionState(createGrowthProjectAction, {} as GrowthActionState)
  useEffect(() => { if (state.projectId) router.push(`/projects/${state.projectId}`) }, [router, state.projectId])
  return <form action={action} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="name">Project name</Label><Input id="name" name="name" maxLength={80} required /></div><div className="space-y-2"><Label htmlFor="targetShipDate">Ship date</Label><Input id="targetShipDate" name="targetShipDate" type="date" defaultValue={inThirtyDays()} required /></div></div>
    <div className="space-y-2"><Label htmlFor="description">What are you building?</Label><Textarea id="description" name="description" maxLength={600} required /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="whyItMatters">Why it matters</Label><Textarea id="whyItMatters" name="whyItMatters" maxLength={500} required /></div><div className="space-y-2"><Label htmlFor="definitionOfShipped">Definition of shipped</Label><Textarea id="definitionOfShipped" name="definitionOfShipped" maxLength={300} required /></div></div>
    <div className="grid gap-4 sm:grid-cols-[1fr_14rem]"><div className="space-y-2"><Label htmlFor="currentNextAction">First concrete action</Label><Input id="currentNextAction" name="currentNextAction" maxLength={240} required /></div><div className="space-y-2"><Label htmlFor="nextActionDueAt">Due (optional)</Label><Input id="nextActionDueAt" name="nextActionDueAt" type="datetime-local" /></div></div>
    {state.error ? <p role="alert" className="text-sm text-red-300">{state.error}</p> : null}
    <Button disabled={pending} className="rounded-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300">{pending ? "Creating…" : "Create commitment"}</Button>
  </form>
}
