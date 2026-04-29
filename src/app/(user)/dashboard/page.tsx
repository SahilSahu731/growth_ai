import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { findUserByEmail, listComparisonsByUserId } from "@/lib/db"

const STATUS_LABELS = {
  draft: "Draft",
  needs_info: "Needs info",
  ready: "Ready",
  decided: "Decided",
  archived: "Archived",
} as const

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const comparisons = await listComparisonsByUserId(user.id)
  const readyCount = comparisons.filter((item) => item.status === "ready" || item.status === "decided").length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#2f2f2f] p-6 sm:p-8">
        <p className="text-sm text-zinc-400">PickAI workspace</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Saved comparisons
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Compare products, jobs, apartments, loans, courses, subscriptions, and anything else with structured scoring and hidden-risk analysis.
            </p>
          </div>
          <Button asChild className="h-11 w-fit rounded-full bg-white px-6 text-zinc-950 hover:bg-zinc-200">
            <Link href="/compare/new">New comparison</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total", comparisons.length],
          ["Ready", readyCount],
          ["Free limit", "3/mo"],
        ].map(([label, value]) => (
          <Card key={label} className="rounded-2xl border-white/10 bg-[#2f2f2f]">
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl text-white">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        {comparisons.length === 0 ? (
          <Card className="rounded-3xl border-white/10 bg-[#2f2f2f]">
            <CardContent className="flex flex-col items-start gap-4 py-10">
              <div>
                <h2 className="text-2xl font-semibold text-white">No comparisons yet</h2>
                <p className="mt-2 text-sm text-zinc-400">Start with a messy decision. PickAI will turn it into options, criteria, scores, risks, questions, and a recommendation.</p>
              </div>
              <Button asChild className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200">
                <Link href="/compare/new">Compare anything</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          comparisons.map((comparison) => (
            <Link
              key={comparison.id}
              href={`/compare/${comparison.id}`}
              className="grid gap-3 rounded-2xl border border-white/10 bg-[#2f2f2f] p-4 transition hover:bg-[#343434] md:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-white">{comparison.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{comparison.finalRecommendation || comparison.context}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="rounded-full bg-[#212121] px-2 py-1">{comparison.category}</span>
                <span className="rounded-full bg-[#212121] px-2 py-1">{STATUS_LABELS[comparison.status]}</span>
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  )
}
