import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { GrowthProjectForm } from "@/components/growth/project-form"
import { getGrowthDashboard } from "@/lib/data/growth"

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const dashboard = await getGrowthDashboard(session.user.id)
  if (!dashboard?.preferences) redirect("/onboarding")
  const canCreate = dashboard.user.planTier !== "free" || dashboard.projects.filter(p => p.status === "active").length < 1
  return <div className="mx-auto w-full max-w-6xl space-y-6">
    <section><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Commitments</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Projects you intend to finish.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">A project is not a task list. It has a ship date, a clear finish line, and one current next action.</p></section>
    <section className="grid gap-4 md:grid-cols-2">{dashboard.projects.map(project => <Link key={project.id} href={`/projects/${project.id}`} className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6 transition hover:border-emerald-400/40"><div className="flex items-center justify-between"><span className="rounded-full border border-white/10 px-2.5 py-1 text-xs capitalize text-zinc-400">{project.status}</span>{project.isPrimary ? <span className="text-xs text-emerald-400">Primary</span> : null}</div><h2 className="mt-5 text-2xl font-semibold text-white">{project.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{project.description}</p><div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs uppercase tracking-wide text-zinc-600">Next action</p><p className="mt-2 text-sm text-zinc-200">{project.currentNextAction}</p></div></Link>)}</section>
    <section className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6 sm:p-8"><h2 className="text-2xl font-semibold text-white">Create another commitment</h2>{canCreate ? <div className="mt-6"><GrowthProjectForm /></div> : <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4"><p className="text-sm text-zinc-300">The free plan deliberately keeps you focused on one active commitment.</p><Link href="/pricing" className="mt-2 inline-block text-sm text-emerald-400">See Pro plans →</Link></div>}</section>
  </div>
}
