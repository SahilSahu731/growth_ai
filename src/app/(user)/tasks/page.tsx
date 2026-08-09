import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Check, MessageSquareText } from "lucide-react"

import { authOptions } from "@/auth"
import { EditableTaskCard } from "@/components/operator/editable-task-card"
import { TaskHistoryCard } from "@/components/operator/task-history-card"
import { dateKeyInTimeZone, formatDateOnly } from "@/lib/date-time"
import { ensureOperatorConversation, getOperatorTasks } from "@/lib/data/operator"
import type { OperatorTask } from "@/lib/operator/types"

export const dynamic = "force-dynamic"
export const metadata = { title: "Tasks" }
type View = "today" | "upcoming" | "completed" | "dismissed"

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const [conversation, data, params] = await Promise.all([ensureOperatorConversation(session.user.id), getOperatorTasks(session.user.id), searchParams])
  if (!data) redirect("/chat")
  const today = dateKeyInTimeZone(new Date(), data.timezone)
  const view: View = ["today", "upcoming", "completed", "dismissed"].includes(params.view ?? "") ? params.view as View : "today"
  const visible = data.tasks.filter((task) => view === "today" ? task.status === "todo" && task.scheduledFor <= today : view === "upcoming" ? task.status === "todo" && task.scheduledFor > today : view === "completed" ? task.status === "done" : task.status === "dismissed")
  const groups = visible.reduce((result, task) => { const items = result.get(task.scheduledFor) ?? []; items.push(task); result.set(task.scheduledFor, items); return result }, new Map<string, OperatorTask[]>())
  return <div className="mx-auto w-full max-w-5xl space-y-8"><section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Execution</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.035em] text-neutral-950 sm:text-5xl">Your tasks.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-neutral-500">Approved commitments, separated so finished work never clutters what needs attention now.</p></div><Link href={`/chat?conversation=${encodeURIComponent(conversation.id)}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground"><MessageSquareText className="size-4" />Adjust in chat</Link></section><nav aria-label="Task views" className="flex gap-1 overflow-x-auto border-b border-neutral-200">{(["today", "upcoming", "completed", "dismissed"] as const).map((item) => <Link key={item} href={`/tasks?view=${item}`} aria-current={view === item ? "page" : undefined} className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize ${view === item ? "border-neutral-950 text-neutral-950" : "border-transparent text-neutral-400 hover:text-neutral-700"}`}>{item}</Link>)}</nav>{visible.length ? <div className="space-y-7">{Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, tasks]) => <section key={date}><div className="mb-3 flex items-center gap-3"><h2 className="text-sm font-semibold text-neutral-800">{formatDate(date, data.locale, today)}</h2><span className="text-[10px] text-neutral-400">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span></div><div className="grid gap-3">{tasks.map((task) => task.status === "todo" ? <EditableTaskCard key={task.id} task={task} goals={data.goals} locale={data.locale} /> : <TaskHistoryCard key={task.id} task={task} goals={data.goals} />)}</div></section>)}</div> : <section className="rounded-3xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center"><span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500"><Check className="size-5" /></span><h2 className="mt-5 text-xl font-semibold">Nothing in {view}.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">This view updates as you accept, reschedule, complete, dismiss, or restore commitments.</p></section>}</div>
}

function formatDate(value: string, locale: string, today: string) { if (value === today) return "Today"; if (value < today) return `Overdue · ${formatDateOnly(value, locale, { month: "short", day: "numeric" })}`; return formatDateOnly(value, locale, { weekday: "long", month: "short", day: "numeric" }) }
