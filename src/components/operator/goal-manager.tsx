"use client"

import Link from "next/link"
import { useActionState, useCallback, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Flag,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"

import {
  createOperatorGoalAction,
  updateOperatorGoalAction,
  type OperatorFormState,
} from "@/app/(user)/chat/actions"
import { UpgradeTrigger } from "@/components/billing/upgrade-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addDateDays, formatDateOnly } from "@/lib/date-time"
import type { OperatorGoal, OperatorTask } from "@/lib/operator/types"
import { cn } from "@/lib/utils"

type GoalView = OperatorGoal["status"]

export function GoalManager({ goals, tasks, goalLimit, today, locale }: {
  goals: OperatorGoal[]
  tasks: OperatorTask[]
  goalLimit: number
  today: string
  locale: string
}) {
  const [view, setView] = useState<GoalView>("active")
  const [createOpen, setCreateOpen] = useState(false)
  const submitCreate = useCallback(async (previous: OperatorFormState, formData: FormData) => {
    const next = await createOperatorGoalAction(previous, formData)
    if (next.updatedAt && !next.success?.includes("already exists")) setCreateOpen(false)
    return next
  }, [])
  const [createState, createAction, creating] = useActionState(submitCreate, {} as OperatorFormState)

  const activeGoals = goals.filter((goal) => goal.status === "active")
  const visibleGoals = goals.filter((goal) => goal.status === view)
  const openTasks = tasks.filter((task) => task.status === "todo")
  const overdue = openTasks.filter((task) => task.scheduledFor < today).length
  const completed = tasks.filter((task) => task.status === "done").length
  const atLimit = activeGoals.length >= goalLimit
  const defaultTarget = addDateDays(today, 30)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <section className="overflow-hidden rounded-[2rem] border border-white/[.08] bg-[radial-gradient(circle_at_90%_0%,rgba(114,231,255,.11),transparent_30%),linear-gradient(145deg,#151515,#0d0d0d)] p-6 shadow-[0_24px_80px_rgba(0,0,0,.24)] sm:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><CircleDot className="size-3.5" />Outcome workspace</div>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.045em] text-white sm:text-5xl">Turn intentions into progress.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">Each goal holds a concrete outcome, a target date, and the next actions that move it forward. Keep the list small enough to act on.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/tasks" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-5 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:bg-white/[.07] hover:text-white"><ListChecks className="size-4" />View all tasks</Link>
            <Button type="button" onClick={() => setCreateOpen(true)} disabled={atLimit} className="h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/85"><Plus className="size-4" />New goal</Button>
          </div>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.08] sm:grid-cols-3">
          <Metric icon={Target} label="Active focus" value={`${activeGoals.length} / ${goalLimit}`} detail={atLimit ? "Capacity reached" : `${goalLimit - activeGoals.length} space${goalLimit - activeGoals.length === 1 ? "" : "s"} available`} />
          <Metric icon={Clock3} label="Needs attention" value={String(overdue)} detail={overdue ? "Overdue actions" : "Nothing overdue"} alert={overdue > 0} />
          <Metric icon={TrendingUp} label="Actions completed" value={String(completed)} detail="Across all goals" />
        </div>
      </section>

      {atLimit ? <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/[.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">Your active goal list is full.</p><p className="mt-1 text-xs text-white/45">Complete or archive one before adding another.</p></div>{goalLimit === 3 ? <UpgradeTrigger feature="up to 25 active goals" className="inline-flex items-center gap-1 text-xs font-bold text-primary">Increase capacity <ArrowRight className="size-3.5" /></UpgradeTrigger> : null}</div> : null}

      {goals.length ? (
        <section className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xl font-semibold tracking-tight text-white">Your goal system</h2><p className="mt-1 text-sm text-white/40">Open a goal to manage its actions and evidence.</p></div>
            <div className="inline-flex w-fit rounded-xl border border-white/[.08] bg-white/[.035] p-1" role="tablist" aria-label="Goal status">
              {(["active", "completed", "archived"] as const).map((status) => {
                const count = goals.filter((goal) => goal.status === status).length
                return <button key={status} type="button" role="tab" aria-selected={view === status} onClick={() => setView(status)} className={cn("rounded-lg px-3 py-2 text-xs font-semibold capitalize text-white/40 transition hover:text-white", view === status && "bg-white/[.09] text-white shadow-sm")}>{status}<span className="ml-1.5 text-white/30">{count}</span></button>
              })}
            </div>
          </div>

          {visibleGoals.length ? <div className="grid gap-4 lg:grid-cols-2">{visibleGoals.map((goal) => <GoalCard key={goal.id} goal={goal} tasks={tasks.filter((task) => task.goalId === goal.id)} today={today} locale={locale} />)}</div> : <StatusEmpty view={view} onCreate={() => setCreateOpen(true)} />}
        </section>
      ) : <FirstGoalEmpty onCreate={() => setCreateOpen(true)} />}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-white/[.12] bg-[#171717] p-0 text-white ring-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-white/[.08] px-6 py-5 sm:px-7"><DialogTitle className="text-xl font-semibold">Build a goal you can act on</DialogTitle><DialogDescription className="mt-1 text-sm text-white/40">Define the result, then schedule the smallest useful first move.</DialogDescription></DialogHeader>
          <form action={createAction} className="space-y-7 px-6 pb-7 sm:px-7">
            <fieldset className="space-y-4"><legend className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary"><Flag className="size-4" />1. Define the outcome</legend>
              <Field label="Goal" hint="Start with a verb" htmlFor="new-goal-title"><Input id="new-goal-title" name="title" minLength={3} maxLength={80} placeholder="Publish my portfolio" required className="h-11 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /></Field>
              <Field label="What will be different when this is achieved?" hint="Make success observable" htmlFor="new-goal-description"><Textarea id="new-goal-description" name="description" minLength={10} maxLength={500} placeholder="Three strong case studies are live and ready to share with prospective clients." required className="min-h-24 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /></Field>
              <Field label="Target date" hint="Optional, but useful" htmlFor="new-goal-target"><Input id="new-goal-target" name="targetDate" type="date" min={today} defaultValue={defaultTarget} className="h-11 border-white/10 bg-white/[.05] text-white" /></Field>
            </fieldset>

            <fieldset className="space-y-4 border-t border-white/[.08] pt-6"><legend className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary"><ListChecks className="size-4" />2. Commit the first action</legend>
              <Field label="Next action" hint="Something you can physically do" htmlFor="new-task-title"><Input id="new-task-title" name="taskTitle" minLength={3} maxLength={120} placeholder="Choose the three projects to feature" required className="h-11 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /></Field>
              <Field label="Done when…" hint="A clear finish line" htmlFor="new-task-condition"><Input id="new-task-condition" name="completionCondition" minLength={3} maxLength={220} placeholder="The project names and source links are in one document" required className="h-11 border-white/10 bg-white/[.05] text-white placeholder:text-white/20" /></Field>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Schedule it" htmlFor="new-task-date"><Input id="new-task-date" name="scheduledFor" type="date" min={today} defaultValue={today} required className="h-11 border-white/10 bg-white/[.05] text-white" /></Field><Field label="Time box" htmlFor="new-task-duration"><select id="new-task-duration" name="estimatedMinutes" defaultValue="25" className="h-11 w-full rounded-xl border border-white/10 bg-[#202020] px-3 text-sm text-white outline-none focus:border-primary/60"><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="25">25 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option></select></Field></div>
            </fieldset>

            {createState.error ? <p role="alert" className="rounded-xl border border-red-400/15 bg-red-400/10 p-3 text-sm text-red-200">{createState.error}</p> : null}
            <div className="flex flex-col-reverse gap-2 border-t border-white/[.08] pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="h-11 rounded-xl px-5 text-white/55 hover:bg-white/[.06] hover:text-white">Cancel</Button><Button disabled={creating} className="h-11 rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/85">{creating ? "Creating…" : "Create goal & first action"}<ArrowRight className="size-4" /></Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail, alert = false }: { icon: typeof Target; label: string; value: string; detail: string; alert?: boolean }) {
  return <div className="flex items-center gap-4 bg-[#101010] px-5 py-4"><span className={cn("flex size-10 items-center justify-center rounded-xl bg-white/[.05] text-primary", alert && "bg-amber-400/10 text-amber-300")}><Icon className="size-4.5" /></span><div><p className="text-xs font-medium text-white/40">{label}</p><div className="mt-0.5 flex items-baseline gap-2"><strong className="text-xl font-semibold text-white">{value}</strong><span className={cn("text-xs text-white/30", alert && "text-amber-300/70")}>{detail}</span></div></div></div>
}

function GoalCard({ goal, tasks, today, locale }: { goal: OperatorGoal; tasks: OperatorTask[]; today: string; locale: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const submit = useCallback(async (previous: OperatorFormState, formData: FormData) => {
    const next = await updateOperatorGoalAction(previous, formData)
    if (next.updatedAt) setEditOpen(false)
    return next
  }, [])
  const [state, action, pending] = useActionState(submit, {} as OperatorFormState)
  const meaningfulTasks = tasks.filter((task) => task.status !== "dismissed")
  const done = meaningfulTasks.filter((task) => task.status === "done").length
  const open = meaningfulTasks.filter((task) => task.status === "todo").sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || a.position - b.position)
  const progress = meaningfulTasks.length ? Math.round((done / meaningfulTasks.length) * 100) : 0
  const next = open[0]
  const overdue = open.filter((task) => task.scheduledFor < today).length

  return <>
    <article className="group flex min-h-80 flex-col overflow-hidden rounded-[1.6rem] border border-white/[.08] bg-[#111] transition hover:-translate-y-0.5 hover:border-white/[.14] hover:shadow-[0_22px_60px_rgba(0,0,0,.25)]">
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold capitalize", goal.status === "active" ? "bg-primary/10 text-primary" : goal.status === "completed" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[.06] text-white/40")}>{goal.status}</span>{goal.targetDate ? <span className="inline-flex items-center gap-1.5 text-xs text-white/35"><CalendarDays className="size-3.5" />{goal.status === "active" && goal.targetDate < today ? "Target passed · " : "Target · "}{formatDateOnly(goal.targetDate, locale, { month: "short", day: "numeric", year: goal.targetDate.slice(0, 4) !== today.slice(0, 4) ? "numeric" : undefined })}</span> : null}</div><button type="button" onClick={() => setEditOpen(true)} aria-label={`Edit ${goal.title}`} className="rounded-lg p-2 text-white/25 transition hover:bg-white/[.06] hover:text-white"><Pencil className="size-4" /></button></div>
        <h3 className="mt-5 text-2xl font-semibold tracking-[-.03em] text-white">{goal.title}</h3>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-white/42">{goal.description || "Add an observable outcome so you know what success means."}</p>

        <div className="mt-6"><div className="flex items-center justify-between text-xs"><span className="font-medium text-white/45">Action progress</span><span className="font-semibold text-white/70">{done} of {meaningfulTasks.length} done</span></div><div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>

        <div className={cn("mt-5 rounded-2xl border p-4", next ? "border-white/[.08] bg-white/[.035]" : "border-dashed border-white/[.1] bg-transparent")}>
          {next ? <><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.12em] text-white/30">Next action</p><span className={cn("text-xs font-semibold", next.scheduledFor < today ? "text-amber-300" : "text-white/35")}>{next.scheduledFor < today ? `${overdue} overdue` : next.scheduledFor === today ? "Today" : formatDateOnly(next.scheduledFor, locale, { month: "short", day: "numeric" })}</span></div><p className="mt-2 text-sm font-semibold text-white/85">{next.title}</p><p className="mt-1 line-clamp-1 text-xs text-white/35">Done when: {next.completionCondition}</p></> : <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-white/[.05] text-white/30"><Plus className="size-4" /></span><div><p className="text-sm font-semibold text-white/65">No next action</p><p className="mt-0.5 text-xs text-white/30">Open this goal and add the next move.</p></div></div>}
        </div>
      </div>
      <Link href={`/goals/${encodeURIComponent(goal.id)}`} className="flex items-center justify-between border-t border-white/[.07] px-5 py-4 text-sm font-semibold text-white/55 transition hover:bg-white/[.035] hover:text-white sm:px-6"><span>Open goal workspace</span><ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></Link>
    </article>

    <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="border-white/[.12] bg-[#171717] p-0 text-white ring-0 sm:max-w-lg"><DialogHeader className="border-b border-white/[.08] px-6 py-5"><DialogTitle className="text-lg font-semibold">Edit goal</DialogTitle><DialogDescription className="text-xs text-white/40">Update the outcome, timing, or lifecycle state.</DialogDescription></DialogHeader><form action={action} className="space-y-5 px-6 pb-6"><input type="hidden" name="goalId" value={goal.id} /><Field label="Goal" htmlFor={`goal-title-${goal.id}`}><Input id={`goal-title-${goal.id}`} name="title" defaultValue={goal.title} minLength={3} maxLength={80} required className="h-11 border-white/10 bg-white/[.05] text-white" /></Field><Field label="Observable outcome" htmlFor={`goal-description-${goal.id}`}><Textarea id={`goal-description-${goal.id}`} name="description" defaultValue={goal.description} maxLength={500} className="min-h-24 border-white/10 bg-white/[.05] text-white" /></Field><Field label="Target date" htmlFor={`goal-target-${goal.id}`}><Input id={`goal-target-${goal.id}`} name="targetDate" type="date" defaultValue={goal.targetDate} className="h-11 border-white/10 bg-white/[.05] text-white" /></Field><Field label="Status" htmlFor={`goal-status-${goal.id}`}><select id={`goal-status-${goal.id}`} name="status" defaultValue={goal.status} className="h-11 w-full rounded-xl border border-white/10 bg-[#202020] px-3 text-sm text-white"><option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option></select></Field>{state.error ? <p role="alert" className="rounded-xl bg-red-400/10 p-3 text-xs text-red-200">{state.error}</p> : null}<div className="flex justify-end gap-2 border-t border-white/[.08] pt-5"><Button type="button" variant="ghost" onClick={() => setEditOpen(false)} className="h-10 rounded-xl px-4 text-white/55 hover:bg-white/[.06] hover:text-white">Cancel</Button><Button disabled={pending} className="h-10 rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/85">{pending ? "Saving…" : "Save goal"}</Button></div></form></DialogContent></Dialog>
  </>
}

function FirstGoalEmpty({ onCreate }: { onCreate: () => void }) {
  const prompts = [{ icon: Flag, title: "Name the outcome", text: "What should be observably different?" }, { icon: CalendarDays, title: "Choose a horizon", text: "When will you review whether it worked?" }, { icon: ListChecks, title: "Commit one action", text: "What can you finish next—not someday?" }]
  return <section className="overflow-hidden rounded-[2rem] border border-white/[.09] bg-[#111]"><div className="grid lg:grid-cols-[1.1fr_.9fr]"><div className="p-7 sm:p-10"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-5" /></span><h2 className="mt-6 text-3xl font-semibold tracking-[-.035em] text-white">Build your first actionable goal.</h2><p className="mt-3 max-w-lg text-sm leading-7 text-white/45">A useful goal is not a motivational sentence. It connects a result you care about to a dated action you can complete.</p><Button type="button" onClick={onCreate} className="mt-7 h-11 rounded-full bg-primary px-6 font-bold text-primary-foreground hover:bg-primary/85">Create my first goal<ArrowRight className="size-4" /></Button></div><div className="border-t border-white/[.07] bg-white/[.025] p-5 lg:border-l lg:border-t-0 sm:p-7"><p className="mb-3 text-xs font-bold uppercase tracking-[.14em] text-white/30">Three decisions</p><div className="space-y-2">{prompts.map((prompt, index) => <div key={prompt.title} className="flex gap-3 rounded-2xl border border-white/[.07] bg-black/20 p-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[.05] text-primary"><prompt.icon className="size-4" /></span><div><p className="text-sm font-semibold text-white"><span className="mr-2 text-white/25">0{index + 1}</span>{prompt.title}</p><p className="mt-1 text-xs leading-5 text-white/35">{prompt.text}</p></div></div>)}</div></div></div></section>
}

function StatusEmpty({ view, onCreate }: { view: GoalView; onCreate: () => void }) {
  return <div className="rounded-3xl border border-dashed border-white/[.1] bg-white/[.02] px-6 py-12 text-center"><span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-white/[.05] text-white/35">{view === "completed" ? <CheckCircle2 className="size-5" /> : <Target className="size-5" />}</span><p className="mt-4 text-sm font-semibold text-white/70">No {view} goals</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-white/35">{view === "active" ? "Create a goal with an outcome and first action to get moving." : `Goals you mark ${view} will stay here for reference.`}</p>{view === "active" ? <Button type="button" onClick={onCreate} className="mt-5 h-10 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground"><Plus className="size-4" />New goal</Button> : null}</div>
}

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return <div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor={htmlFor} className="text-xs font-semibold text-white/65">{label}</Label>{hint ? <span className="text-xs text-white/25">{hint}</span> : null}</div>{children}</div>
}
