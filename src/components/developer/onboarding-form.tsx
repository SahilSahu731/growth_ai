"use client"

import { useActionState } from "react"

import { saveDeveloperOnboardingAction, type DeveloperActionState } from "@/app/(user)/developer-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_STATE: DeveloperActionState = {}

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(saveDeveloperOnboardingAction, INITIAL_STATE)

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["solo_builder", "Solo Builder", "Ship products, validate ideas, build portfolio proof."],
          ["job_seeker", "Job Seeker", "Prepare interviews, build resume projects, close skill gaps."],
          ["working_developer", "Working Developer", "Level up architecture, delivery, debugging, and depth."],
        ].map(([value, title, detail]) => (
          <label key={value} className="group rounded-xl border border-black/10 bg-white/85 p-4 hover:border-(--landing-accent)">
            <input className="peer sr-only" type="radio" name="persona" value={value} required />
            <span className="block font-display text-xl text-(--landing-ink) peer-checked:text-(--landing-accent)">{title}</span>
            <span className="mt-2 block text-sm leading-6 text-(--landing-muted)">{detail}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetTrack">Target track</Label>
          <Input id="targetTrack" name="targetTrack" placeholder="Full-stack SaaS builder" className="h-11 rounded-xl border-black/15 bg-white" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weeklyCodingHours">Weekly coding hours</Label>
          <Input id="weeklyCodingHours" name="weeklyCodingHours" type="number" min={1} max={80} defaultValue={8} className="h-11 rounded-xl border-black/15 bg-white" required />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="currentLevel">Current level</Label>
          <select id="currentLevel" name="currentLevel" defaultValue="intermediate" className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="primaryGoalType">Primary goal</Label>
          <select id="primaryGoalType" name="primaryGoalType" defaultValue="ship_project" className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="ship_project">Ship project</option>
            <option value="learn_skill">Learn skill</option>
            <option value="interview_prep">Interview prep</option>
            <option value="career_growth">Career growth</option>
            <option value="work_performance">Work performance</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preferredPlanningStyle">Planning style</Label>
          <select id="preferredPlanningStyle" name="preferredPlanningStyle" defaultValue="weekly_sprints" className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="weekly_sprints">Weekly sprints</option>
            <option value="daily_checklist">Daily checklist</option>
            <option value="deep_work_blocks">Deep-work blocks</option>
            <option value="portfolio_milestones">Portfolio milestones</option>
          </select>
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={isPending} className="h-11 w-fit rounded-full bg-(--landing-ink) px-6 text-sm text-(--landing-surface) hover:bg-(--landing-accent)">
        {isPending ? "Calibrating cockpit..." : "Enter Dev Cockpit"}
      </Button>
    </form>
  )
}
