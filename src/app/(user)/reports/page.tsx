import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { Card, CardContent } from "@/components/ui/card"
import { findUserByEmail, listComparisonsByUserId } from "@/lib/db"

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const comparisons = (await listComparisonsByUserId(user.id)).filter((item) => item.status === "ready" || item.status === "decided")

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section>
        <p className="text-sm text-zinc-500">Reports</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">Decision reports</h1>
        <p className="mt-2 text-sm text-zinc-400">Reports collect your recommendation, scores, hidden costs, risks, questions, negotiation drafts, and sources.</p>
      </section>

      <div className="space-y-3">
        {comparisons.length === 0 ? (
          <Card className="rounded-3xl border-white/10 bg-[#2f2f2f]">
            <CardContent className="py-8 text-sm text-zinc-400">No ready reports yet. Analyze a comparison to generate one.</CardContent>
          </Card>
        ) : (
          comparisons.map((comparison) => (
            <Link key={comparison.id} href={`/reports/${comparison.id}`} className="block rounded-2xl border border-white/10 bg-[#2f2f2f] p-4 hover:bg-[#343434]">
              <p className="text-base font-medium text-white">{comparison.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{comparison.finalRecommendation}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
