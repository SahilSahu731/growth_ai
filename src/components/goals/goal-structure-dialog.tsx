"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { GoalEcosystemBuilder } from "@/components/goals/goal-ecosystem-builder"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type GoalStructureDialogProps = {
  goalId: string
  hasRoadmap: boolean
  autoOpen?: boolean
}

export function GoalStructureDialog({ goalId, hasRoadmap, autoOpen = false }: GoalStructureDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(autoOpen)

  const hasSetupFlag = useMemo(() => searchParams.get("setup") === "1", [searchParams])

  function clearSetupFlagFromUrl() {
    if (!hasSetupFlag) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("setup")

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl)
  }

  function handleCompleted() {
    setOpen(false)
    clearSetupFlagFromUrl()
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      clearSetupFlagFromUrl()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-full bg-(--landing-ink) px-5 text-sm text-(--landing-surface) hover:bg-(--landing-accent)">
          {hasRoadmap ? "Refine structure" : "Build structure"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto p-5 sm:max-w-3xl sm:p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-display text-3xl text-(--landing-ink)">Goal structure setup</DialogTitle>
          <DialogDescription className="text-sm">
            Choose simple options and generate a readable structure with phases, milestones, and checklist tasks.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="questions" className="space-y-4">
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-full bg-black/6 p-1">
            <TabsTrigger value="questions" className="rounded-full text-sm data-active:bg-white">
              Structure Questions
            </TabsTrigger>
            <TabsTrigger value="guide" className="rounded-full text-sm data-active:bg-white">
              What You Get
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-3">
            <GoalEcosystemBuilder goalId={goalId} hasRoadmap={hasRoadmap} onCompleted={handleCompleted} />
          </TabsContent>

          <TabsContent value="guide" className="space-y-3">
            <div className="rounded-xl border border-black/10 bg-(--landing-surface) p-4 text-sm leading-6 text-(--landing-ink)">
              <p className="font-medium">Your structure will include:</p>
              <p className="mt-2">1. Phases broken by timeline.</p>
              <p>2. Milestones mapped to each phase.</p>
              <p>3. Actionable checklist tasks with due dates.</p>
              <p>4. Updated purpose and next-step guidance for this goal.</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
