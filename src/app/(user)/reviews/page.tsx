import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { ArrowRight, BookOpenCheck } from "lucide-react"
import { authOptions } from "@/auth"
import { listOperatorWeeklyReports } from "@/lib/data/operator"

export const dynamic = "force-dynamic"
export const metadata = { title: "Review history" }
export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const reports = await listOperatorWeeklyReports(session.user.id)
  return <div className="mx-auto max-w-5xl space-y-8"><section><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Stored source windows</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] text-neutral-950 sm:text-5xl">Review history.</h1><p className="mt-3 max-w-2xl text-base leading-7 text-neutral-500">Each version preserves the task and conversation window used at generation time. Open the current review to inspect source links and correct hypotheses.</p><Link href="/weekly-report" className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground">Open current review<ArrowRight className="size-4" /></Link></section>{reports.length ? <section className="grid gap-3 sm:grid-cols-2">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><BookOpenCheck className="size-4 text-primary" /><p className="mt-4 text-sm font-semibold text-neutral-900">{new Date(report.windowStart).toLocaleDateString()}–{new Date(report.windowEnd).toLocaleDateString()}</p><p className="mt-2 text-xs leading-5 text-neutral-500">{report.counts.completed} completed · {report.counts.deferred} deferred · {report.counts.dismissed} dismissed · {report.counts.overdue} overdue</p><p className="mt-3 text-[10px] text-neutral-400">Version {report.version} · {report.observations.length} observations · generated {new Date(report.createdAt).toLocaleString()}</p></article>)}</section> : <section className="rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center"><BookOpenCheck className="mx-auto size-6 text-neutral-400" /><h2 className="mt-4 text-lg font-semibold">No weekly versions yet.</h2><p className="mt-2 text-sm text-neutral-500">Opening your weekly review creates the first immutable source window.</p></section>}</div>
}
