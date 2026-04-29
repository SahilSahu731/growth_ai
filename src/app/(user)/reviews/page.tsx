import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { generateWeeklyReviewAction } from "@/app/(user)/developer-actions"
import { authOptions } from "@/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { findUserByEmail, getDeveloperProfile, listWeeklyReviewsByUserId } from "@/lib/db"

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const profile = await getDeveloperProfile(user.id)
  if (!profile) redirect("/onboarding")

  const reviews = await listWeeklyReviewsByUserId(user.id, 8)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">Reviews</p>
          <h1 className="font-display text-4xl leading-none text-(--landing-ink)">AI weekly developer review</h1>
          <p className="mt-2 text-sm text-(--landing-muted)">Turn sessions, projects, and goals into sharper sprint decisions.</p>
        </div>
        <form action={generateWeeklyReviewAction}>
          <Button type="submit" className="h-10 rounded-full bg-(--landing-ink) px-5 text-sm text-(--landing-surface) hover:bg-(--landing-accent)">
            Generate review
          </Button>
        </form>
      </section>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="rounded-2xl border border-black/10 bg-white/92">
            <CardContent className="py-8">
              <p className="text-sm leading-6 text-(--landing-muted)">
                No reviews yet. Log a coding session, add a project, then generate your first weekly developer review.
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="rounded-2xl border border-black/10 bg-white/92">
              <CardHeader>
                <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
                  Week of {review.weekStart}
                </CardDescription>
                <CardTitle className="font-display text-2xl text-(--landing-ink)">{review.highLeverageAction}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-3 text-sm leading-6 text-(--landing-ink)">{review.aiReviewText}</p>
                <div className="space-y-2">
                  <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-3 text-xs leading-5 text-(--landing-muted)">Shipped: {review.shippedSummary}</p>
                  <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-3 text-xs leading-5 text-(--landing-muted)">Blockers: {review.blockers}</p>
                  <p className="rounded-xl border border-black/10 bg-(--landing-surface) p-3 text-xs leading-5 text-(--landing-muted)">Next sprint: {review.nextSprint}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
