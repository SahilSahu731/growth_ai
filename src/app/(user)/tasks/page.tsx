import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Check, MessageSquareText } from "lucide-react"

import { authOptions } from "@/auth"
import { EditableTaskCard } from "@/components/operator/editable-task-card"
import { ensureOperatorConversation, getOperatorWorkspace } from "@/lib/data/operator"
import type { OperatorTask } from "@/lib/operator/types"

export const dynamic = "force-dynamic"

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const conversation = await ensureOperatorConversation(session.user.id)
  const workspace = await getOperatorWorkspace(session.user.id, conversation.id)
  if (!workspace) redirect("/chat")

  const groups = workspace.tasks.reduce((result, task) => {
    const items = result.get(task.scheduledFor) ?? []
    items.push(task)
    result.set(task.scheduledFor, items)
    return result
  }, new Map<string, OperatorTask[]>())

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Execution</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-neutral-950 sm:text-5xl">Your tasks.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">Only tasks you approved in chat appear here. GrowthAI limits each day so the plan stays usable.</p>
        </div>
        <Link href={`/chat?conversation=${encodeURIComponent(conversation.id)}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground"><MessageSquareText className="size-4" />Adjust in chat</Link>
      </section>

      {workspace.tasks.length ? (
        <div className="space-y-7">
          {Array.from(groups.entries()).map(([date, tasks]) => (
            <section key={date}>
              <div className="mb-3 flex items-center gap-3"><h2 className="text-sm font-bold text-neutral-800">{formatDate(date)}</h2><span className="text-[10px] text-neutral-400">{tasks.length} of 3 tasks</span></div>
              <div className="grid gap-3">
                {tasks.map((task) => <EditableTaskCard key={task.id} task={task} goals={workspace.goals} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="rounded-3xl border border-dashed border-neutral-300 bg-white/60 px-6 py-16 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500"><Check className="size-5" /></span>
          <h2 className="mt-5 text-xl font-black">Nothing waiting on you.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">Talk with GrowthAI when you want help choosing a direction. It will propose tasks before adding them.</p>
          <Link href={`/chat?conversation=${encodeURIComponent(conversation.id)}`} className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">Go to chat</Link>
        </section>
      )}
    </div>
  )
}

function formatDate(value: string) {
  const today = new Date().toISOString().slice(0, 10)
  if (value === today) return "Today"
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`))
}
