"use client"

import { useActionState, useEffect, useRef } from "react"

import { logCodingSessionAction, type DeveloperActionState } from "@/app/(user)/developer-actions"
import type { AppGoal, AppProject } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const INITIAL_STATE: DeveloperActionState = {}

export function SessionForm({ goals, projects }: { goals: AppGoal[]; projects: AppProject[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(logCodingSessionAction, INITIAL_STATE)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="sessionType">Session type</Label>
          <select id="sessionType" name="sessionType" defaultValue="deep_work" className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="deep_work">Deep work</option>
            <option value="debugging">Debugging</option>
            <option value="learning">Learning</option>
            <option value="interview_prep">Interview prep</option>
            <option value="planning">Planning</option>
            <option value="review">Review</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Minutes</Label>
          <Input id="durationMinutes" name="durationMinutes" type="number" min={5} max={720} defaultValue={60} className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sessionDate">Date</Label>
          <Input id="sessionDate" name="sessionDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="goalId">Goal</Label>
          <select id="goalId" name="goalId" defaultValue="" className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="">No linked goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectId">Project</Label>
          <select id="projectId" name="projectId" defaultValue="" className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="">No linked project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="completedSummary">What shipped or improved?</Label>
        <Textarea id="completedSummary" name="completedSummary" placeholder="Implemented onboarding guard and cleaned up dashboard data flow." className="min-h-24 rounded-xl border-black/15 bg-white" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="blockers">Blockers</Label>
        <Input id="blockers" name="blockers" placeholder="Optional: unclear API shape, flaky build, low energy..." className="h-10 rounded-xl border-black/15 bg-white" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="energyRating">Energy 1-5</Label>
          <Input id="energyRating" name="energyRating" type="number" min={1} max={5} defaultValue={3} className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="focusRating">Focus 1-5</Label>
          <Input id="focusRating" name="focusRating" type="number" min={1} max={5} defaultValue={4} className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <Button type="submit" disabled={isPending} className="h-10 w-fit rounded-full bg-(--landing-ink) px-5 text-sm text-(--landing-surface) hover:bg-(--landing-accent)">
        {isPending ? "Logging session..." : "Log session"}
      </Button>
    </form>
  )
}
