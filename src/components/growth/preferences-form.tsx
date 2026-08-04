"use client"

import { useActionState } from "react"
import { setPublicProjectAction, updatePreferencesAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { GrowthProject, UserPreferences } from "@/lib/growth/types"

export function PreferencesForm({ preferences }: { preferences: UserPreferences }) {
  const [state, action, pending] = useActionState(updatePreferencesAction, {} as GrowthActionState)
  return <form action={action} className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Coach tone</Label><select name="coachTone" defaultValue={preferences.coachTone} className="h-10 w-full rounded-md border border-white/15 bg-zinc-900 px-3 text-sm"><option value="supportive">Supportive</option><option value="balanced">Balanced</option><option value="blunt">Blunt</option></select></div><div className="space-y-2"><Label>Cadence</Label><select name="checkInCadence" defaultValue={preferences.checkInCadence} className="h-10 w-full rounded-md border border-white/15 bg-zinc-900 px-3 text-sm"><option value="daily">Daily</option><option value="every_other_day">Every other day</option></select></div></div>
    <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Hour</Label><Input name="checkInHour" type="number" min={0} max={23} defaultValue={preferences.checkInHour} /></div><div className="space-y-2"><Label>Minute</Label><Input name="checkInMinute" type="number" min={0} max={59} defaultValue={preferences.checkInMinute} /></div><div className="space-y-2"><Label>Timezone</Label><Input name="timezone" defaultValue={preferences.timezone} /></div></div>
    <input type="hidden" name="weeklyReviewDay" value={preferences.weeklyReviewDay} />
    <label className="flex gap-3 text-sm"><input name="emailNotifications" type="checkbox" defaultChecked={preferences.emailNotifications} />Email accountability prompts</label>
    {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}{state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
    <Button disabled={pending} className="rounded-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300">{pending ? "Saving…" : "Save preferences"}</Button>
  </form>
}

export function PublicProjectForm({ project }: { project: GrowthProject }) {
  const [state, action, pending] = useActionState(setPublicProjectAction, {} as GrowthActionState)
  return <form action={action} className="space-y-4">
    <input type="hidden" name="projectId" value={project.id} />
    <label className="flex gap-3 text-sm"><input name="isPublic" type="checkbox" defaultChecked={project.isPublic} />Publish an opt-in commitment page</label>
    <div className="space-y-2"><Label>Public URL</Label><div className="flex items-center gap-2"><span className="text-sm text-zinc-500">/p/</span><Input name="publicSlug" defaultValue={project.publicSlug ?? ""} placeholder="ship-forge" /></div></div>
    <label className="flex gap-3 text-sm"><input name="showPublicStreak" type="checkbox" defaultChecked={project.showPublicStreak} />Show streak publicly</label>
    <p className="text-xs leading-5 text-zinc-500">Raw check-ins, private reasons, email, and AI patterns are never shown.</p>
    {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}{state.success ? <p className="text-sm text-emerald-300">{state.success}</p> : null}
    <Button disabled={pending} variant="outline" className="rounded-full border-white/15">{pending ? "Updating…" : "Update public page"}</Button>
  </form>
}
