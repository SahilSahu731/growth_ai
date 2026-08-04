"use client"

import { useActionState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { completeOnboardingAction, type GrowthActionState } from "@/app/(user)/growth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const lifeAreas = [["health", "Health"], ["career", "Career"], ["relationships", "Relationships"], ["learning", "Learning"], ["finances", "Finances"], ["creativity", "Creativity"], ["wellbeing", "Wellbeing"], ["personal", "Personal"]]
function futureDate(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }

export function GrowthOnboardingForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(completeOnboardingAction, {} as GrowthActionState)
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", [])
  useEffect(() => { if (state.projectId) router.push("/dashboard") }, [router, state.projectId])
  return <form action={action} className="space-y-12">
    <input type="hidden" name="timezone" value={timezone} />
    <section className="space-y-6"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400">01 · Your direction</p><h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-neutral-950">What would you like to feel different?</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-500">Choose one meaningful area—not your whole life. You can change direction later without losing what you learned.</p></div>
      <fieldset><legend className="mb-3 text-sm font-bold text-neutral-800">Part of life</legend><div className="flex flex-wrap gap-2">{lifeAreas.map(([value,label]) => <label key={value} className="cursor-pointer rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-500 transition has-checked:border-neutral-950 has-checked:bg-neutral-950 has-checked:text-white"><input type="radio" name="lifeArea" value={value} defaultChecked={value === "wellbeing"} className="sr-only" />{label}</label>)}</div></fieldset>
      <div className="grid gap-5 md:grid-cols-2"><Field label="Name this intention" htmlFor="name"><Input id="name" name="name" placeholder="Feel at home in my body again" maxLength={80} required /></Field><Field label="Reflection date" htmlFor="targetShipDate"><Input id="targetShipDate" name="targetShipDate" type="date" min={futureDate(1)} defaultValue={futureDate(30)} required /></Field></div>
      <Field label="What would meaningful growth look like?" htmlFor="description"><Textarea id="description" name="description" placeholder="Describe the change in a way that leaves room for real life—not perfection." maxLength={600} required /></Field>
      <div className="grid gap-5 md:grid-cols-2"><Field label="Why does this matter now?" htmlFor="whyItMatters"><Textarea id="whyItMatters" name="whyItMatters" placeholder="The honest reason you want to give this attention." maxLength={500} required /></Field><Field label="How will you recognize progress?" htmlFor="definitionOfShipped"><Textarea id="definitionOfShipped" name="definitionOfShipped" placeholder="I move with care four times a week and notice more energy." maxLength={300} required /></Field></div>
      <div className="grid gap-5 md:grid-cols-[1fr_14rem]"><Field label="Smallest meaningful next step" htmlFor="currentNextAction"><Input id="currentNextAction" name="currentNextAction" placeholder="Take a 20-minute walk before lunch" maxLength={240} required /></Field><Field label="When? (optional)" htmlFor="nextActionDueAt"><Input id="nextActionDueAt" name="nextActionDueAt" type="datetime-local" /></Field></div>
    </section>
    <section className="space-y-6 border-t border-neutral-200 pt-10"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400">02 · Your support</p><h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-neutral-950">How should GrowthAI speak with you?</h2></div><div className="grid gap-3 md:grid-cols-3">{[["supportive", "Supportive", "Gentle, warm, and still specific."], ["balanced", "Balanced", "Clear and compassionate."], ["blunt", "Direct", "Straightforward without shame."]].map(([value,title,description]) => <label key={value} className="cursor-pointer rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 transition has-checked:border-neutral-950 has-checked:bg-white has-checked:shadow-sm"><input type="radio" name="coachTone" value={value} defaultChecked={value === "balanced"} className="sr-only" /><span className="block font-bold text-neutral-900">{title}</span><span className="mt-1 block text-xs leading-5 text-neutral-500">{description}</span></label>)}</div>
      <div className="grid gap-5 sm:grid-cols-3"><Field label="Reflection rhythm" htmlFor="checkInCadence"><select id="checkInCadence" name="checkInCadence" defaultValue="daily" className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm"><option value="daily">Every day</option><option value="every_other_day">Every other day</option></select></Field><Field label="Local hour" htmlFor="checkInHour"><Input id="checkInHour" name="checkInHour" type="number" min={0} max={23} defaultValue={20} /></Field><Field label="Minute" htmlFor="checkInMinute"><Input id="checkInMinute" name="checkInMinute" type="number" min={0} max={59} step={5} defaultValue={0} /></Field></div>
      <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4"><input name="emailNotifications" type="checkbox" defaultChecked className="mt-1 accent-neutral-950" /><span><span className="block text-sm font-bold text-neutral-900">Gentle email reflection prompts</span><span className="text-xs leading-5 text-neutral-500">Optional and easy to disable. No motivational spam.</span></span></label>
    </section>
    {state.error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
    <Button type="submit" disabled={pending} className="h-12 rounded-full bg-neutral-950 px-7 font-bold text-white hover:bg-neutral-800">{pending ? "Creating your space…" : "Begin this growth journey"}</Button>
  </form>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) { return <div className="space-y-2"><Label htmlFor={htmlFor} className="font-bold text-neutral-800">{label}</Label>{children}</div> }
