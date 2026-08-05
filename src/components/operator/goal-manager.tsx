"use client"

import Link from "next/link"
import { useActionState, useCallback, useState } from "react"
import { ArrowUpRight, Pencil, Plus, Target } from "lucide-react"

import {
  createOperatorGoalAction,
  updateOperatorGoalAction,
  type OperatorFormState,
} from "@/app/(user)/chat/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { OperatorGoal, OperatorTask } from "@/lib/operator/types"

export function GoalManager({ goals, tasks, goalLimit }: { goals: OperatorGoal[]; tasks: OperatorTask[]; goalLimit: number }) {
  const [createState, createAction, creating] = useActionState(createOperatorGoalAction, {} as OperatorFormState)
  const activeGoals = goals.filter((goal) => goal.status === "active")
  const atLimit = activeGoals.length >= goalLimit

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Direction</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-neutral-950 sm:text-5xl">Your goals.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">Every task belongs to a goal. Goals keep separate parts of your life clear without turning everything into one giant plan.</p>
        </div>
        <div className="min-w-56 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs"><span className="font-bold text-neutral-700">Active goals</span><span className="text-neutral-400">{activeGoals.length} / {goalLimit}</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((activeGoals.length / goalLimit) * 100, 100)}%` }} /></div>
          {goalLimit === 3 ? <Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-primary">Need more? Upgrade to Pro <ArrowUpRight className="size-3" /></Link> : <p className="mt-3 text-[10px] font-bold text-primary">Pro goal capacity</p>}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((goal) => <GoalCard key={goal.id} goal={goal} taskCount={tasks.filter((task) => task.goalId === goal.id).length} />)}
        {!goals.length ? <div className="col-span-full rounded-3xl border border-dashed border-neutral-300 bg-white/50 px-6 py-12 text-center"><Target className="mx-auto size-5 text-neutral-400" /><p className="mt-4 text-sm font-bold text-neutral-700">No goals yet</p><p className="mt-2 text-xs text-neutral-500">Create one here, or let GrowthAI propose one with your first approved plan.</p></div> : null}
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/[.1] text-primary"><Plus className="size-4" /></span><div><h2 className="text-xl font-black tracking-tight">Add a goal</h2><p className="mt-1 text-xs leading-5 text-neutral-500">Goals can also be created automatically when you approve an AI plan.</p></div></div>
        {atLimit ? (
          <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[.06] p-5"><p className="text-sm font-bold text-neutral-800">You have reached the {goalLimit}-goal limit.</p><p className="mt-2 text-xs leading-5 text-neutral-500">Complete or archive a goal to make room, or upgrade to Pro for more active goals.</p><Link href="/pricing" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">See Pro plans</Link></div>
        ) : (
          <form action={createAction} className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)_auto] lg:items-end">
            <Field label="Goal title" htmlFor="new-goal-title"><Input id="new-goal-title" name="title" minLength={3} maxLength={80} placeholder="Find a better role" required /></Field>
            <Field label="What does this goal mean?" htmlFor="new-goal-description"><Input id="new-goal-description" name="description" maxLength={500} placeholder="A short direction—not a perfect plan" /></Field>
            <Button disabled={creating} className="h-10 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/85">{creating ? "Adding…" : "Add goal"}</Button>
          </form>
        )}
        {createState.error ? <p className="mt-3 text-xs text-red-300">{createState.error}</p> : null}
        {createState.success ? <p className="mt-3 text-xs text-primary">{createState.success}</p> : null}
      </section>
    </div>
  )
}

function GoalCard({ goal, taskCount }: { goal: OperatorGoal; taskCount: number }) {
  const [open, setOpen] = useState(false)
  const submit = useCallback(async (previous: OperatorFormState, formData: FormData) => {
    const next = await updateOperatorGoalAction(previous, formData)
    if (next.updatedAt) setOpen(false)
    return next
  }, [])
  const [state, action, pending] = useActionState(submit, {} as OperatorFormState)

  return (
    <>
      <article className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/[.1] text-primary"><Target className="size-4" /></span>
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"><Pencil className="size-4" /></button>
        </div>
        <span className="mt-5 inline-flex rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-neutral-500">{goal.status}</span>
        <h2 className="mt-3 text-xl font-black tracking-tight text-neutral-900">{goal.title}</h2>
        <p className="mt-2 min-h-10 text-xs leading-5 text-neutral-500">{goal.description || "No description yet."}</p>
        <div className="mt-5 border-t border-neutral-100 pt-4 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{taskCount} open {taskCount === 1 ? "task" : "tasks"}</div>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/[.12] bg-[#202020] p-0 text-white ring-0 sm:max-w-lg">
          <DialogHeader className="border-b border-white/[.09] px-6 py-5"><DialogTitle>Edit goal</DialogTitle><DialogDescription className="text-xs text-white/40">Changes appear on every linked task.</DialogDescription></DialogHeader>
          <form action={action} className="space-y-5 px-6 pb-6">
            <input type="hidden" name="goalId" value={goal.id} />
            <Field dark label="Goal title" htmlFor={`goal-title-${goal.id}`}><Input id={`goal-title-${goal.id}`} name="title" defaultValue={goal.title} minLength={3} maxLength={80} required className="border-white/10 bg-white/[.05] text-white" /></Field>
            <Field dark label="Description" htmlFor={`goal-description-${goal.id}`}><Textarea id={`goal-description-${goal.id}`} name="description" defaultValue={goal.description} maxLength={500} className="min-h-24 border-white/10 bg-white/[.05] text-white" /></Field>
            <Field dark label="Status" htmlFor={`goal-status-${goal.id}`}><select id={`goal-status-${goal.id}`} name="status" defaultValue={goal.status} className="h-10 w-full rounded-xl border border-white/10 bg-[#292929] px-3 text-sm text-white"><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></Field>
            {state.error ? <p className="rounded-xl bg-red-400/10 p-3 text-xs text-red-200">{state.error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-white/[.08] pt-5"><Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-white/55 hover:bg-white/[.06] hover:text-white">Cancel</Button><Button disabled={pending} className="h-10 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/85">{pending ? "Saving…" : "Save goal"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Field({ label, htmlFor, children, dark = false }: { label: string; htmlFor: string; children: React.ReactNode; dark?: boolean }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor} className={dark ? "text-xs font-semibold text-white/60" : "text-xs font-bold text-neutral-700"}>{label}</Label>{children}</div>
}
