import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { ArrowUpRight } from "lucide-react"
import { authOptions } from "@/auth"
import { GrowthProjectForm } from "@/components/growth/project-form"
import { getGrowthDashboard } from "@/lib/data/growth"

export default async function GoalsPage() {
  const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login")
  const dashboard = await getGrowthDashboard(session.user.id); if (!dashboard?.preferences) redirect("/onboarding")
  const canCreate = dashboard.user.planTier !== "free" || dashboard.projects.filter(goal => goal.status === "active").length < 1
  return <div className="mx-auto w-full max-w-6xl space-y-7"><section><p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400">Your intentions</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-neutral-950 sm:text-5xl">The parts of life receiving your attention.</h1><p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-neutral-500">Not a list of everything you should fix. Just the meaningful directions you have chosen to return to.</p></section><section className="grid gap-5 md:grid-cols-2">{dashboard.projects.map(goal => <Link key={goal.id} href={`/goals/${goal.id}`} className="motion-card rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">{goal.lifeArea}</span><ArrowUpRight className="size-4 text-neutral-400" /></div><h2 className="mt-6 text-2xl font-black tracking-tight text-neutral-950">{goal.name}</h2><p className="mt-3 line-clamp-2 text-sm leading-7 text-neutral-500">{goal.description}</p><div className="mt-6 border-t border-neutral-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Next gentle step</p><p className="mt-2 text-sm font-bold text-neutral-800">{goal.currentNextAction}</p></div></Link>)}</section><section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-2xl font-black tracking-tight">Create another intention</h2>{canCreate ? <div className="mt-6"><GrowthProjectForm /></div> : <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-sm leading-6 text-neutral-600">The free plan keeps one active intention visible at a time. Pause or complete it before beginning another, or choose Pro for several life areas.</p><Link href="/pricing" className="mt-3 inline-block text-xs font-bold text-neutral-950">See plans →</Link></div>}</section></div>
}
