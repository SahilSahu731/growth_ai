import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { findUserByEmail, getComparisonReportForUser } from "@/lib/db"

type PageProps = {
  params: Promise<{ comparisonId: string }>
}

export default async function ReportPage({ params }: PageProps) {
  const { comparisonId } = await params
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const report = await getComparisonReportForUser({ comparisonId, userId: user.id })
  if (!report) notFound()

  const ranked = [...report.options].sort((left, right) => right.totalScore - left.totalScore)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#2f2f2f] p-6 sm:p-8">
        <p className="text-sm text-zinc-500">{report.comparison.category} decision report</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">{report.comparison.title}</h1>
        <p className="mt-4 text-base leading-7 text-zinc-300">{report.comparison.finalRecommendation || "No final recommendation yet."}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200">
            <Link href={`/compare/${comparisonId}`}>Back to workspace</Link>
          </Button>
          <Button variant="outline" className="rounded-full border-white/10 bg-[#303030] text-white hover:bg-zinc-700" disabled>
            PDF export gated
          </Button>
        </div>
      </section>

      <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Ranked options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranked.map((option, index) => (
            <div key={option.id} className="rounded-xl border border-white/10 bg-[#303030] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-medium text-white">{index + 1}. {option.name}</p>
                <p className="text-sm text-[#10a37f]">{Math.round(option.totalScore)}/100</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{option.description || option.notes || option.price}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {["hidden_cost", "risk", "question", "negotiation", "missing_info"].map((type) => {
          const items = report.insights.filter((item) => item.insightType === type)
          return (
            <Card key={type} className="rounded-2xl border-white/10 bg-[#2f2f2f]">
              <CardHeader>
                <CardTitle className="capitalize text-xl text-white">{type.replaceAll("_", " ")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500">None found.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="rounded-xl bg-[#303030] p-3">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">{item.content}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Sources used</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {report.sources.length === 0 ? (
            <p className="text-sm text-zinc-500">No live sources were attached.</p>
          ) : (
            report.sources.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-[#303030] p-3 hover:bg-[#363636]">
                <p className="line-clamp-1 text-sm font-medium text-white">{source.title}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-400">{source.snippet}</p>
              </a>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
