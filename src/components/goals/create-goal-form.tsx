"use client"

import { useActionState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

import { createGoalAction, type GoalActionState } from "@/app/(user)/goals/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_STATE: GoalActionState = {}

const CATEGORIES = ["Developer", "Career", "Business", "Learning", "Interview", "Product", "Other"] as const

type CreateGoalFormProps = {
  onSuccess?: (goalId: string) => void
}

export function CreateGoalForm({ onSuccess }: CreateGoalFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const lastHandledGoalId = useRef<string | undefined>(undefined)

  const [state, formAction, isPending] = useActionState(createGoalAction, INITIAL_STATE)

  useEffect(() => {
    if (!state.success || !state.goalId) {
      return
    }

    if (lastHandledGoalId.current === state.goalId) {
      return
    }

    lastHandledGoalId.current = state.goalId
    formRef.current?.reset()

    if (onSuccess) {
      onSuccess(state.goalId)
      return
    }

    router.refresh()
  }, [onSuccess, router, state.goalId, state.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Goal title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Ship paid beta by June"
            className="h-11 rounded-xl border-black/15 bg-white px-3 text-sm"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue="Business"
            className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-(--landing-ink) outline-none transition focus:border-(--landing-accent)"
            required
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="durationWeeks">Duration (weeks)</Label>
          <Input
            id="durationWeeks"
            name="durationWeeks"
            type="number"
            min={1}
            max={104}
            defaultValue={12}
            className="h-11 rounded-xl border-black/15 bg-white px-3 text-sm"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="developerTrack">Developer track</Label>
          <select
            id="developerTrack"
            name="developerTrack"
            defaultValue="solo_builder"
            className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-(--landing-ink) outline-none transition focus:border-(--landing-accent)"
            required
          >
            <option value="solo_builder">Solo Builder</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="working_developer">Working Developer</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goalType">Goal type</Label>
          <select
            id="goalType"
            name="goalType"
            defaultValue="ship_project"
            className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm text-(--landing-ink) outline-none transition focus:border-(--landing-accent)"
            required
          >
            <option value="ship_project">Ship project</option>
            <option value="learn_skill">Learn skill</option>
            <option value="interview_prep">Interview prep</option>
            <option value="career_growth">Career growth</option>
            <option value="work_performance">Work performance</option>
          </select>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{state.success}</p>}

      <Button
        type="submit"
        className="h-11 rounded-full bg-(--landing-ink) px-5 text-sm text-(--landing-surface) hover:bg-(--landing-accent)"
        disabled={isPending}
      >
        {isPending ? "Creating goal..." : "Create core goal"}
      </Button>
    </form>
  )
}
