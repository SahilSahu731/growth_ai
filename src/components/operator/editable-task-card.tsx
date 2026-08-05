"use client"

import { useActionState, useCallback, useState } from "react"
import { Check, Clock3, Pencil, X } from "lucide-react"

import {
  setOperatorTaskStatusAction,
  updateOperatorTaskAction,
  type OperatorFormState,
} from "@/app/(user)/chat/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { OperatorGoal, OperatorTask } from "@/lib/operator/types"

export function EditableTaskCard({ task, goals, compact = false }: { task: OperatorTask; goals: OperatorGoal[]; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const activeGoals = goals.filter((goal) => goal.status === "active")
  const goal = goals.find((item) => item.id === task.goalId)
  const saveTask = useCallback(async (previous: OperatorFormState, formData: FormData) => {
    const next = await updateOperatorTaskAction(previous, formData)
    if (next.updatedAt) setOpen(false)
    return next
  }, [])
  const [state, action, pending] = useActionState(saveTask, {} as OperatorFormState)

  return (
    <>
      <article className={cn(
        "group border",
        compact
          ? "rounded-xl border-white/[.08] bg-white/[.035] p-3.5"
          : "rounded-2xl border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
      )}>
        <div className="flex items-start gap-3">
          <form action={setOperatorTaskStatusAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              name="status"
              value="done"
              aria-label={`Complete ${task.title}`}
              className={cn(
                "mt-0.5 flex size-5 items-center justify-center rounded-full border text-transparent transition hover:border-primary hover:bg-primary hover:text-primary-foreground",
                compact ? "border-white/20" : "border-neutral-300"
              )}
            >
              <Check className="size-3" />
            </button>
          </form>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn("font-semibold leading-5", compact ? "text-xs text-white/75" : "text-sm text-neutral-900")}>{task.title}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", compact ? "bg-primary/[.1] text-primary" : "bg-primary/[.1] text-primary")}>{goal?.title ?? "Goal"}</span>
            </div>
            {!compact && task.note ? <p className="mt-1.5 text-xs leading-5 text-neutral-500">{task.note}</p> : null}
            <div className={cn("mt-2 flex flex-wrap items-center gap-2 text-[10px]", compact ? "text-white/30" : "text-neutral-400")}>
              <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{task.estimatedMinutes} min</span>
              <span>{formatDate(task.scheduledFor)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Edit ${task.title}`}
            className={cn("rounded-md p-1 transition", compact ? "text-white/25 hover:bg-white/[.06] hover:text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-900")}
          >
            <Pencil className="size-3.5" />
          </button>
          <form action={setOperatorTaskStatusAction} className={cn(compact && "opacity-0 transition group-hover:opacity-100 focus-within:opacity-100")}>
            <input type="hidden" name="taskId" value={task.id} />
            <button name="status" value="dismissed" aria-label={`Dismiss ${task.title}`} className={cn("rounded-md p-1 transition", compact ? "text-white/20 hover:text-white" : "text-neutral-400 hover:text-neutral-900")}><X className="size-3.5" /></button>
          </form>
        </div>
        <p className={cn("mt-3 border-t pt-2.5 text-[10px] leading-4", compact ? "border-white/[.06] text-white/30" : "border-neutral-100 text-neutral-400")}>Done when: {task.completionCondition}</p>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/[.12] bg-[#202020] p-0 text-white ring-0 sm:max-w-lg">
          <DialogHeader className="border-b border-white/[.09] px-6 py-5">
            <DialogTitle className="text-lg font-semibold">Edit task</DialogTitle>
            <DialogDescription className="text-xs text-white/40">Change this task card without changing the rest of the plan.</DialogDescription>
          </DialogHeader>
          <form action={action} className="space-y-5 px-6 pb-6">
            <input type="hidden" name="taskId" value={task.id} />
            <Field label="Task title" htmlFor={`title-${task.id}`}><Input id={`title-${task.id}`} name="title" defaultValue={task.title} minLength={3} maxLength={120} required className="h-11 border-white/10 bg-white/[.05] text-sm text-white" /></Field>
            <Field label="Goal" htmlFor={`goal-${task.id}`}>
              <select id={`goal-${task.id}`} name="goalId" defaultValue={task.goalId} required className="h-11 w-full rounded-xl border border-white/10 bg-[#292929] px-3 text-sm text-white outline-none focus:border-primary/60">
                <option value="" disabled>Choose a goal</option>
                {activeGoals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="Notes" htmlFor={`note-${task.id}`}><Textarea id={`note-${task.id}`} name="note" defaultValue={task.note} maxLength={300} className="min-h-24 border-white/10 bg-white/[.05] text-sm text-white" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Scheduled date" htmlFor={`date-${task.id}`}><Input id={`date-${task.id}`} name="scheduledFor" type="date" defaultValue={task.scheduledFor} required className="h-11 border-white/10 bg-white/[.05] text-sm text-white" /></Field>
              <Field label="Estimated minutes" htmlFor={`duration-${task.id}`}><Input id={`duration-${task.id}`} name="estimatedMinutes" type="number" min={5} max={240} step={5} defaultValue={task.estimatedMinutes} required className="h-11 border-white/10 bg-white/[.05] text-sm text-white" /></Field>
            </div>
            <Field label="Done when…" htmlFor={`condition-${task.id}`}><Input id={`condition-${task.id}`} name="completionCondition" defaultValue={task.completionCondition} minLength={3} maxLength={220} required className="h-11 border-white/10 bg-white/[.05] text-sm text-white" /></Field>
            {state.error ? <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-xs text-red-200">{state.error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-white/[.08] pt-5">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-white/55 hover:bg-white/[.06] hover:text-white">Cancel</Button>
              <Button disabled={pending || !activeGoals.length} className="h-10 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/85">{pending ? "Saving…" : "Save task"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor} className="text-xs font-semibold text-white/60">{label}</Label>{children}</div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))
}
