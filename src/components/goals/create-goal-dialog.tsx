"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { CreateGoalForm } from "@/components/goals/create-goal-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function CreateGoalDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleGoalCreated(goalId: string) {
    setOpen(false)
    router.push(`/goals/${goalId}?setup=1&tab=structure`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-full bg-(--landing-ink) px-5 text-sm text-(--landing-surface) hover:bg-(--landing-accent)">
          Create goal
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto p-5 sm:max-w-2xl sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-display text-3xl text-(--landing-ink)">Create developer goal</DialogTitle>
          <DialogDescription className="text-sm">
            Pick the track, goal type, and duration. Then build the full developer roadmap inside the goal.
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-(--landing-muted)">
          Step 1 creates your goal shell. Step 2 generates phases, milestones, and checklists for shipping, skill growth, interviews, or work performance.
        </p>

        <CreateGoalForm onSuccess={handleGoalCreated} />
      </DialogContent>
    </Dialog>
  )
}
