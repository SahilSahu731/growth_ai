"use client"

import { useActionState, useCallback, useState } from "react"
import { ArrowRight, ListPlus, Plus } from "lucide-react"

import { createOperatorTaskAction, type OperatorFormState } from "@/app/(user)/chat/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { OperatorGoal } from "@/lib/operator/types"

export function GoalTaskComposer({ goal, today }: { goal: OperatorGoal; today: string }) {
  const [open, setOpen] = useState(false)
  const submit = useCallback(async (previous: OperatorFormState, formData: FormData) => {
    const next = await createOperatorTaskAction(previous, formData)
    if (next.updatedAt) setOpen(false)
    return next
  }, [])
  const [state, action, pending] = useActionState(submit, {} as OperatorFormState)

  if (goal.status !== "active") return null

  return <>
    <Button type="button" onClick={() => setOpen(true)} className="h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/85"><Plus className="size-4" />Add next action</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/[.12] bg-[#171717] p-0 text-white ring-0 sm:max-w-xl">
        <DialogHeader className="border-b border-white/[.08] px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold"><ListPlus className="size-5 text-primary" />Add the next action</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-white/40">Make it small, scheduled, and unambiguous to finish.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5 px-6 pb-6">
          <input type="hidden" name="goalId" value={goal.id} />
          <Field label="Action" htmlFor="new-action-title"><Input id="new-action-title" name="title" minLength={3} maxLength={120} placeholder="Draft the first case study outline" required className="h-11 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /></Field>
          <Field label="Done when…" htmlFor="new-action-condition"><Input id="new-action-condition" name="completionCondition" minLength={3} maxLength={220} placeholder="The outline has problem, process, and result sections" required className="h-11 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /></Field>
          <Field label="Notes" htmlFor="new-action-note"><Textarea id="new-action-note" name="note" maxLength={300} placeholder="Optional context, links, or constraints" className="min-h-20 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Scheduled date" htmlFor="new-action-date"><Input id="new-action-date" name="scheduledFor" type="date" defaultValue={today} required className="h-11 border-white/10 bg-white/[.05] text-white" /></Field>
            <Field label="Time box" htmlFor="new-action-duration"><select id="new-action-duration" name="estimatedMinutes" defaultValue="25" className="h-11 w-full rounded-xl border border-white/10 bg-[#202020] px-3 text-sm text-white outline-none focus:border-primary/60"><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="25">25 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option></select></Field>
          </div>
          {state.error ? <p role="alert" className="rounded-xl border border-red-400/15 bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p> : null}
          <div className="flex flex-col-reverse gap-2 border-t border-white/[.08] pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 rounded-xl px-5 text-white/55 hover:bg-white/[.06] hover:text-white">Cancel</Button><Button disabled={pending} className="h-11 rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/85">{pending ? "Adding…" : "Add action"}<ArrowRight className="size-4" /></Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor} className="text-xs font-semibold text-white/65">{label}</Label>{children}</div>
}
