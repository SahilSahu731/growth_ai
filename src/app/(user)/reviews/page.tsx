import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { generateWeeklyReviewAction } from "@/app/(user)/growth-actions"
import { authOptions } from "@/auth"
import { ReviewEditor } from "@/components/growth/review-editor"
import { Button } from "@/components/ui/button"
import { getGrowthDashboard, getProjectWorkspace } from "@/lib/data/growth"

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const dashboard = await getGrowthDashboard(session.user.id)
  if (!dashboard?.preferences) redirect("/onboarding")
  const workspaces = (await Promise.all(dashboard.projects.map(p => getProjectWorkspace(session.user.id!, p.id)))).filter(Boolean)
  const reviews = workspaces.flatMap(w => w?.reviews ?? []).sort((a, b) => b.weekStart.localeCompare(a.weekStart))
  return <div className="mx-auto w-full max-w-5xl space-y-6"><section><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Weekly reviews</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">See the week without rewriting history.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Reviews are grounded in saved check-ins. Edit the narrative if GrowthAI misses context; the underlying events remain intact.</p></section><section className="flex flex-wrap gap-3">{dashboard.projects.filter(p => p.status === "active").map(project => <form key={project.id} action={generateWeeklyReviewAction}><input type="hidden" name="projectId" value={project.id} /><Button type="submit" className="rounded-full">Generate for {project.name}</Button></form>)}</section><section className="space-y-4">{reviews.length ? reviews.map(review => { const project = dashboard.projects.find(p => p.id === review.projectId); return <article key={review.id} className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6 sm:p-8"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-emerald-400">Week of {review.weekStart}</p><h2 className="mt-2 text-2xl font-semibold text-white">{project?.name ?? "Project review"}</h2></div><div className="flex gap-4 text-center"><Metric label="Check-ins" value={review.checkInsCompleted} /><Metric label="Progress" value={review.meaningfulProgressCount} /><Metric label="Missed" value={review.promptsMissed} /></div></div><div className="mt-6 grid gap-3 md:grid-cols-3"><Block label="Shipped" value={review.shippedSummary} /><Block label="Blockers" value={review.blockers} /><Block label="Next focus" value={review.nextWeekFocus} /></div><div className="mt-5"><ReviewEditor review={review} /></div></article> }) : <div className="rounded-3xl border border-dashed border-white/15 p-8 text-sm text-zinc-500">No weekly review yet. Generate one after your first check-in.</div>}</section></div>
}
function Metric({ label, value }: { label: string; value: number }) { return <div><p className="text-xl font-semibold text-white">{value}</p><p className="text-xs text-zinc-600">{label}</p></div> }
function Block({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 p-4"><p className="text-xs uppercase tracking-wide text-zinc-600">{label}</p><p className="mt-2 text-sm leading-6 text-zinc-300">{value || "Nothing recorded."}</p></div> }
