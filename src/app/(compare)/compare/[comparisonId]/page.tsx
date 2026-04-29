import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { runAnalysisAction } from "@/app/(user)/compare/actions"
import { authOptions } from "@/auth"
import { AddEvidenceForm, AddOptionForm } from "@/components/compare/comparison-forms"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { findUserByEmail, getComparisonReportForUser, type OptionScore } from "@/lib/db"

type PageProps = {
  params: Promise<{ comparisonId: string }>
}

function scoreFor(optionId: string, criterionId: string, scores: OptionScore[]) {
  return scores.find((score) => score.optionId === optionId && score.criterionId === criterionId)
}

export default async function CompareWorkspacePage({ params }: PageProps) {
  const { comparisonId } = await params
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const report = await getComparisonReportForUser({ comparisonId, userId: user.id })
  if (!report) notFound()

  const hiddenCosts = report.insights.filter((item) => item.insightType === "hidden_cost")
  const risks = report.insights.filter((item) => item.insightType === "risk")
  const questions = report.insights.filter((item) => item.insightType === "question" || item.insightType === "missing_info")
  const negotiations = report.insights.filter((item) => item.insightType === "negotiation")

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-4 px-4 py-6 sm:px-6 xl:grid-cols-[21rem_1fr_23rem]">
      <aside className="space-y-4">
        <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
          <CardHeader>
            <CardDescription>Options</CardDescription>
            <CardTitle className="text-xl text-white">Add choices</CardTitle>
          </CardHeader>
          <CardContent>
            <AddOptionForm comparisonId={comparisonId} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
          <CardHeader>
            <CardDescription>Evidence</CardDescription>
            <CardTitle className="text-xl text-white">Paste or upload</CardTitle>
          </CardHeader>
          <CardContent>
            <AddEvidenceForm comparisonId={comparisonId} />
          </CardContent>
        </Card>
      </aside>

      <main className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-[#2f2f2f] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-zinc-500">{report.comparison.category} / {report.comparison.status}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{report.comparison.title}</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{report.comparison.context}</p>
            </div>
            <div className="flex gap-2">
              <form action={runAnalysisAction}>
                <input type="hidden" name="comparisonId" value={comparisonId} />
                <Button type="submit" className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200">
                  Re-run research
                </Button>
              </form>
              <Button asChild variant="outline" className="rounded-full border-white/10 bg-[#303030] text-white hover:bg-zinc-700">
                <Link href={`/reports/${comparisonId}`}>Open report</Link>
              </Button>
            </div>
          </div>
        </section>

        <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
          <CardHeader>
            <CardDescription>Weighted scoring</CardDescription>
            <CardTitle className="text-2xl text-white">Comparison table</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {report.options.length === 0 ? (
              <p className="text-sm text-zinc-400">Add at least two options to generate a useful comparison.</p>
            ) : report.criteria.length === 0 ? (
              <p className="text-sm text-zinc-400">Deep research is running. Use Re-run research after adding more evidence.</p>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-zinc-400">
                    <th className="py-3 pr-4">Option</th>
                    {report.criteria.map((criterion) => (
                      <th key={criterion.id} className="py-3 pr-4">{criterion.name} ({criterion.weight}%)</th>
                    ))}
                    <th className="py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.options.map((option) => (
                    <tr key={option.id} className="border-b border-white/10">
                      <td className="max-w-48 py-3 pr-4 align-top">
                        <p className="font-medium text-white">{option.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">{option.price || option.sourceUrl || option.description}</p>
                      </td>
                      {report.criteria.map((criterion) => {
                        const score = scoreFor(option.id, criterion.id, report.scores)
                        return (
                          <td key={criterion.id} className="max-w-56 py-3 pr-4 align-top text-zinc-300">
                            <p className="font-medium text-white">{score?.score ?? "-"}/10</p>
                            <p className="mt-1 text-xs leading-5 text-zinc-500">{score?.reason ?? "No score yet."}</p>
                          </td>
                        )
                      })}
                      <td className="py-3 align-top">
                        <p className="font-semibold text-white">{Math.round(option.totalScore)}/100</p>
                        <Progress value={option.totalScore} className="mt-2 h-2 bg-[#212121] *:data-[slot=progress-indicator]:bg-[#10a37f]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
          <CardHeader>
            <CardDescription>Deep research</CardDescription>
            <CardTitle className="text-2xl text-white">Sources and evidence</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {report.sources.length === 0 && report.evidence.length === 0 ? (
              <p className="text-sm text-zinc-400">Research sources and uploaded evidence will appear here after analysis.</p>
            ) : (
              <>
                {report.sources.map((source) => (
                  <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-[#303030] p-3 hover:bg-[#363636]">
                    <p className="line-clamp-1 text-sm font-medium text-white">{source.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-400">{source.snippet}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {new Date(source.fetchedAt).toLocaleDateString()} / {source.confidence}% confidence
                    </p>
                  </a>
                ))}
                {report.evidence.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-[#303030] p-3">
                    <p className="line-clamp-1 text-sm font-medium text-white">{item.fileName}</p>
                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-zinc-400">{item.evidenceSummary || item.extractedText}</p>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <aside className="space-y-4">
        <Card className="rounded-2xl border-white/10 bg-[#2f2f2f]">
          <CardHeader>
            <CardDescription>Recommendation</CardDescription>
            <CardTitle className="text-xl text-white">Best fit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-zinc-300">
              {report.comparison.finalRecommendation || "Deep research needs more detail before recommending a winner."}
            </p>
          </CardContent>
        </Card>

        {[
          ["Hidden costs", hiddenCosts],
          ["Risks", risks],
          ["Questions to ask", questions],
          ["Negotiation points", negotiations],
        ].map(([title, items]) => (
          <Card key={title as string} className="rounded-2xl border-white/10 bg-[#2f2f2f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-white">{title as string}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(items as typeof report.insights).length === 0 ? (
                <p className="text-sm text-zinc-500">No findings yet.</p>
              ) : (
                (items as typeof report.insights).slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl bg-[#303030] p-3">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">{item.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </aside>
    </div>
  )
}
