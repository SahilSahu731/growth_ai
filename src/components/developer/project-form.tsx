"use client"

import { useActionState, useEffect, useRef } from "react"

import { createProjectAction, type DeveloperActionState } from "@/app/(user)/developer-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INITIAL_STATE: DeveloperActionState = {}

export function ProjectForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(createProjectAction, INITIAL_STATE)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="project-title">Project title</Label>
          <Input id="project-title" name="title" placeholder="AI code review dashboard" className="h-10 rounded-xl border-black/15 bg-white" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stack">Stack</Label>
          <Input id="stack" name="stack" placeholder="Next.js, Postgres, Gemini" className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="projectType">Type</Label>
          <select id="projectType" name="projectType" defaultValue="ship_project" className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="ship_project">Ship project</option>
            <option value="learn_skill">Learn skill</option>
            <option value="interview_prep">Interview prep</option>
            <option value="career_growth">Career growth</option>
            <option value="work_performance">Work performance</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue="building" className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm">
            <option value="idea">Idea</option>
            <option value="building">Building</option>
            <option value="shipped">Shipped</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="portfolioReadiness">Portfolio readiness</Label>
          <Input id="portfolioReadiness" name="portfolioReadiness" type="number" min={0} max={100} defaultValue={20} className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="repoUrl">Repo URL placeholder</Label>
          <Input id="repoUrl" name="repoUrl" placeholder="https://github.com/you/project" className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="liveUrl">Live URL placeholder</Label>
          <Input id="liveUrl" name="liveUrl" placeholder="https://project.vercel.app" className="h-10 rounded-xl border-black/15 bg-white" />
        </div>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <Button type="submit" disabled={isPending} className="h-10 w-fit rounded-full bg-(--landing-ink) px-5 text-sm text-(--landing-surface) hover:bg-(--landing-accent)">
        {isPending ? "Adding project..." : "Add project"}
      </Button>
    </form>
  )
}
