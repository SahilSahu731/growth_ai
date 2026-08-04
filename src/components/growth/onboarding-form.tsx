"use client"

import { useActionState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"

import { completeOnboardingAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const INITIAL_STATE: GrowthActionState = {}

function futureDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function GrowthOnboardingForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(completeOnboardingAction, INITIAL_STATE)
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", [])

  useEffect(() => {
    if (state.projectId) router.push("/dashboard")
  }, [router, state.projectId])

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="timezone" value={timezone} />
      <section className="space-y-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">01 / Your commitment</p><h2 className="mt-2 text-2xl font-semibold text-white">Choose the one thing you will ship.</h2></div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="name">Project name</Label><Input id="name" name="name" placeholder="Launch the first version of Forge" maxLength={80} required /></div>
          <div className="space-y-2"><Label htmlFor="targetShipDate">Target ship date</Label><Input id="targetShipDate" name="targetShipDate" type="date" min={futureDate(1)} defaultValue={futureDate(30)} required /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="description">What are you building?</Label><Textarea id="description" name="description" placeholder="A concise description of the product and who it helps." maxLength={600} required /></div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="whyItMatters">Why does this matter to you?</Label><Textarea id="whyItMatters" name="whyItMatters" placeholder="The personal reason you do not want to quietly abandon this." maxLength={500} required /></div>
          <div className="space-y-2"><Label htmlFor="definitionOfShipped">What exactly counts as shipped?</Label><Textarea id="definitionOfShipped" name="definitionOfShipped" placeholder="Deployed MVP with onboarding and the first five invited users." maxLength={300} required /></div>
        </div>
        <div className="grid gap-5 md:grid-cols-[1fr_14rem]">
          <div className="space-y-2"><Label htmlFor="currentNextAction">Smallest next shippable action</Label><Input id="currentNextAction" name="currentNextAction" placeholder="Finish and test the signup callback" maxLength={240} required /></div>
          <div className="space-y-2"><Label htmlFor="nextActionDueAt">Due by (optional)</Label><Input id="nextActionDueAt" name="nextActionDueAt" type="datetime-local" /></div>
        </div>
      </section>

      <section className="space-y-5 border-t border-white/10 pt-8">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">02 / Accountability</p><h2 className="mt-2 text-2xl font-semibold text-white">Decide how GrowthAI should show up.</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["supportive", "Supportive", "Calm, encouraging, still specific."],
            ["balanced", "Balanced", "Direct without losing context."],
            ["blunt", "Blunt", "Sharper language, never shame."],
          ].map(([value, title, description]) => (
            <label key={value} className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-4 has-checked:border-emerald-400/70 has-checked:bg-emerald-400/5">
              <input type="radio" name="coachTone" value={value} defaultChecked={value === "balanced"} className="sr-only" />
              <span className="block font-medium text-white">{title}</span><span className="mt-1 block text-sm text-zinc-400">{description}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2"><Label htmlFor="checkInCadence">Cadence</Label><select id="checkInCadence" name="checkInCadence" defaultValue="daily" className="h-10 w-full rounded-md border border-white/15 bg-zinc-900 px-3 text-sm"><option value="daily">Every day</option><option value="every_other_day">Every other day</option></select></div>
          <div className="space-y-2"><Label htmlFor="checkInHour">Local hour</Label><Input id="checkInHour" name="checkInHour" type="number" min={0} max={23} defaultValue={20} /></div>
          <div className="space-y-2"><Label htmlFor="checkInMinute">Minute</Label><Input id="checkInMinute" name="checkInMinute" type="number" min={0} max={59} step={5} defaultValue={0} /></div>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"><input name="emailNotifications" type="checkbox" defaultChecked className="mt-1" /><span><span className="block text-sm font-medium text-white">Email accountability prompts</span><span className="text-xs leading-5 text-zinc-500">You can disable these at any time. Critical account email is unaffected.</span></span></label>
      </section>

      {state.error ? <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="h-12 rounded-full bg-emerald-400 px-7 font-semibold text-zinc-950 hover:bg-emerald-300">{pending ? "Starting your commitment…" : "Start holding me accountable"}</Button>
    </form>
  )
}
