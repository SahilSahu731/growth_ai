import Link from "next/link"
import { getServerSession } from "next-auth"
import { notFound, redirect } from "next/navigation"

import { authOptions } from "@/auth"
import { getOperatorGoal } from "@/lib/data/operator"

export const metadata = { title: "Goal detail" }

export default async function GoalPage({ params }: { params: Promise<{ goalId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const { goalId } = await params
  const detail = await getOperatorGoal(session.user.id, goalId)
  if (!detail) notFound()
  return <div className="mx-auto max-w-4xl space-y-6"><Link href="/goals" className="inline-flex min-h-11 items-center text-sm font-semibold text-neutral-500 hover:text-neutral-900">← All goals</Link><header className="rounded-3xl border border-neutral-200 bg-white p-7"><p className="text-sm font-bold uppercase tracking-[.14em] text-primary">{detail.goal.status}</p><h1 className="mt-3 text-4xl font-black tracking-tight">{detail.goal.title}</h1><p className="mt-4 text-base leading-7 text-neutral-500">{detail.goal.description || "No description has been added."}</p></header><section className="rounded-3xl border border-neutral-200 bg-white p-7"><h2 className="text-xl font-bold">Tasks</h2><div className="mt-5 space-y-3">{detail.tasks.length ? detail.tasks.map((task) => <article key={task.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold">{task.title}</p><span className="text-sm capitalize text-neutral-500">{task.status}</span></div><p className="mt-2 text-sm text-neutral-500">Scheduled {task.scheduledFor} · {task.estimatedMinutes} minutes</p></article>) : <p className="text-sm text-neutral-500">No tasks are attached to this goal.</p>}</div></section></div>
}
