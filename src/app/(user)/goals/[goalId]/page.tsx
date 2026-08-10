import Link from "next/link"
import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, CalendarDays, CheckCircle2, CircleDot, Clock3, ListChecks, Target } from "lucide-react"

import { authOptions } from "@/auth"
import { EditableTaskCard } from "@/components/operator/editable-task-card"
import { GoalTaskComposer } from "@/components/operator/goal-task-composer"
import { TaskHistoryCard } from "@/components/operator/task-history-card"
import { dateKeyInTimeZone, formatDateOnly } from "@/lib/date-time"
import { getOperatorGoal, getOperatorTasks } from "@/lib/data/operator"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { title: "Goal workspace" }

export default async function GoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const { goalId } = await params
  const [detail, workspace] = await Promise.all([getOperatorGoal(session.user.id, goalId), getOperatorTasks(session.user.id)])
  if (!detail) notFound()
  const locale = workspace?.locale ?? "en"
  const today = dateKeyInTimeZone(new Date(), workspace?.timezone ?? "UTC")
  const open = detail.tasks.filter((task) => task.status === "todo").sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor) || a.position - b.position)
  const finished = detail.tasks.filter((task) => task.status !== "todo")
  const meaningful = detail.tasks.filter((task) => task.status !== "dismissed")
  const done = meaningful.filter((task) => task.status === "done").length
  const progress = meaningful.length ? Math.round((done / meaningful.length) * 100) : 0
  const overdue = open.filter((task) => task.scheduledFor < today).length

  return <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
    <Link href="/goals" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-white"><ArrowLeft className="size-4" />All goals</Link>

    <header className="overflow-hidden rounded-[2rem] border border-white/[.08] bg-[radial-gradient(circle_at_90%_0%,rgba(114,231,255,.1),transparent_32%),linear-gradient(145deg,#151515,#0d0d0d)] p-6 shadow-[0_24px_80px_rgba(0,0,0,.2)] sm:p-8">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2"><span className={cn("rounded-full px-2.5 py-1 text-xs font-bold capitalize", detail.goal.status === "active" ? "bg-primary/10 text-primary" : detail.goal.status === "completed" ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[.06] text-white/40")}><CircleDot className="mr-1.5 inline size-3" />{detail.goal.status}</span>{detail.goal.targetDate ? <span className="inline-flex items-center gap-1.5 text-xs text-white/35"><CalendarDays className="size-3.5" />Target {formatDateOnly(detail.goal.targetDate, locale, { month: "short", day: "numeric", year: "numeric" })}</span> : null}</div><h1 className="mt-5 text-4xl font-semibold tracking-[-.045em] text-white sm:text-5xl">{detail.goal.title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-white/48">{detail.goal.description || "Add an observable outcome so you know what success means."}</p></div>
        <GoalTaskComposer goal={detail.goal} today={today} />
      </div>
      <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.08] sm:grid-cols-3"><Metric icon={Target} label="Progress" value={`${progress}%`} detail={`${done} of ${meaningful.length} actions done`} /><Metric icon={ListChecks} label="Open actions" value={String(open.length)} detail={open.length ? "Ready to work" : "Plan the next move"} /><Metric icon={Clock3} label="Needs attention" value={String(overdue)} detail={overdue ? "Overdue actions" : "Nothing overdue"} alert={overdue > 0} /></div>
    </header>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-[1.7rem] border border-white/[.08] bg-[#111] p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Execution queue</p><h2 className="mt-2 text-xl font-semibold text-white">Next actions</h2></div><span className="rounded-full bg-white/[.06] px-3 py-1.5 text-xs font-semibold text-white/40">{open.length} open</span></div><div className="mt-5 space-y-3">{open.length ? open.map((task) => <EditableTaskCard key={task.id} task={task} goals={[detail.goal]} locale={locale} compact />) : <div className="rounded-2xl border border-dashed border-white/[.1] px-5 py-10 text-center"><CheckCircle2 className="mx-auto size-6 text-emerald-300" /><p className="mt-3 text-sm font-semibold text-white/70">No open actions</p><p className="mt-1 text-xs text-white/35">Add the next concrete move or mark this goal complete.</p></div>}</div></section>

      <aside className="space-y-4"><section className="rounded-[1.7rem] border border-white/[.08] bg-[#111] p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-white/30">How to use this</p><ol className="mt-4 space-y-4 text-sm text-white/45"><li className="flex gap-3"><span className="font-bold text-primary">01</span><span>Keep the top action small enough to finish in one sitting.</span></li><li className="flex gap-3"><span className="font-bold text-primary">02</span><span>Use “Done when” as evidence, not a vague feeling.</span></li><li className="flex gap-3"><span className="font-bold text-primary">03</span><span>After completing it, add only the next useful action.</span></li></ol></section>{detail.goal.status === "active" && detail.goal.targetDate && detail.goal.targetDate < today ? <section className="rounded-[1.7rem] border border-amber-300/15 bg-amber-300/[.06] p-5"><p className="text-sm font-semibold text-amber-200">Target date has passed</p><p className="mt-2 text-xs leading-5 text-amber-100/45">Review the outcome, choose a realistic new date, or close the goal instead of letting it drift.</p></section> : null}</aside>
    </div>

    {finished.length ? <section className="rounded-[1.7rem] border border-white/[.08] bg-[#111] p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-white/30">Evidence log</p><h2 className="mt-2 text-xl font-semibold text-white">Finished actions</h2></div><div className="mt-5 grid gap-3 lg:grid-cols-2">{finished.map((task) => <TaskHistoryCard key={task.id} task={task} goals={[detail.goal]} compact />)}</div></section> : null}
  </div>
}

function Metric({ icon: Icon, label, value, detail, alert = false }: { icon: typeof Target; label: string; value: string; detail: string; alert?: boolean }) {
  return <div className="flex items-center gap-4 bg-[#101010] px-5 py-4"><span className={cn("flex size-10 items-center justify-center rounded-xl bg-white/[.05] text-primary", alert && "bg-amber-400/10 text-amber-300")}><Icon className="size-4" /></span><div><p className="text-xs font-medium text-white/40">{label}</p><div className="mt-0.5 flex items-baseline gap-2"><strong className="text-xl font-semibold text-white">{value}</strong><span className={cn("text-xs text-white/30", alert && "text-amber-300/70")}>{detail}</span></div></div></div>
}
