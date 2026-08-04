import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { CheckInForm } from "@/components/growth/check-in-form"
import { Button } from "@/components/ui/button"
import { getGrowthDashboard } from "@/lib/data/growth"

function dateLabel(value: string | null) {
  if (!value) return "Not scheduled"
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const dashboard = await getGrowthDashboard(session.user.id)
  if (!dashboard?.preferences || !dashboard.primaryProject) redirect("/onboarding")
  const project = dashboard.primaryProject

  return <div className="mx-auto w-full max-w-6xl space-y-6">
    <section className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Your active commitment</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{project.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Ship by {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${project.targetShipDate}T12:00:00Z`))}. {project.definitionOfShipped}</p>
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"><p className="text-xs uppercase tracking-wider text-zinc-500">Current next action</p><p className="mt-2 text-lg text-white">{project.currentNextAction}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <div className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-5"><p className="text-sm text-zinc-500">Current streak</p><p className="mt-2 text-4xl font-semibold text-white">{dashboard.streak?.currentStreak ?? 0}<span className="ml-2 text-sm font-normal text-zinc-500">check-ins</span></p><p className="mt-2 text-xs text-zinc-500">Best: {dashboard.streak?.longestStreak ?? 0}</p></div>
        <div className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-5"><p className="text-sm text-zinc-500">Next prompt</p><p className="mt-2 text-sm font-medium leading-6 text-white">{dateLabel(dashboard.nextPromptAt)}</p><p className="mt-2 text-xs text-zinc-500">{dashboard.preferences.timezone}</p></div>
      </div>
    </section>

    <section className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6 sm:p-8"><CheckInForm projectId={project.id} projectName={project.name} currentNextAction={project.currentNextAction} promptId={dashboard.currentPromptId} /></section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-white">Recent truth</h2><Link href={`/projects/${project.id}`} className="text-sm text-emerald-400">Open project →</Link></div>{dashboard.recentCheckIns.length ? <div className="mt-4 space-y-3">{dashboard.recentCheckIns.slice(0, 3).map(item => <div key={item.id} className="rounded-xl border border-white/10 p-4"><div className="flex justify-between gap-4"><span className="text-xs uppercase tracking-wide text-emerald-400">{item.classification.replaceAll("_", " ")}</span><time className="text-xs text-zinc-600">{new Date(item.createdAt).toLocaleDateString()}</time></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">{item.response}</p><p className="mt-2 text-xs text-zinc-500">Next: {item.nextAction}</p></div>)}</div> : <p className="mt-4 text-sm text-zinc-500">Your first check-in will establish the baseline.</p>}</div>
      <div className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6"><h2 className="text-xl font-semibold text-white">Patterns, not judgment</h2>{dashboard.activePatterns.length ? <div className="mt-4 space-y-3">{dashboard.activePatterns.slice(0, 3).map(pattern => <div key={pattern.id} className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4"><p className="text-sm leading-6 text-zinc-300">{pattern.summary}</p><p className="mt-2 text-xs text-zinc-600">Confidence {Math.round(pattern.confidence * 100)}%</p></div>)}</div> : <p className="mt-4 text-sm leading-6 text-zinc-500">After several check-ins, GrowthAI will surface repeated blockers, carried actions, and schedule mismatches—with evidence you can inspect.</p>}</div>
    </section>
    <div className="flex flex-wrap gap-3"><Button asChild variant="outline" className="rounded-full border-white/15"><Link href="/reviews">Open weekly reviews</Link></Button><Button asChild variant="ghost" className="rounded-full text-zinc-400"><Link href="/settings">Tune accountability</Link></Button></div>
  </div>
}
