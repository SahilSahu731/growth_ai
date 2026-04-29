import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { OnboardingForm } from "@/components/developer/onboarding-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { findUserByEmail, getDeveloperProfile } from "@/lib/db"

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const profile = await getDeveloperProfile(user.id)
  if (profile) redirect("/dashboard")

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-2xl border border-black/10 bg-(--landing-ink) p-5 text-(--landing-surface) shadow-xl shadow-black/10 sm:p-7">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-(--landing-accent-soft)">Dev Cockpit Setup</p>
        <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl">Calibrate your developer growth system.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
          Choose how you build, where you are headed, and how much coding energy you can spend each week.
          Growth_AI will turn that into sprints, skill signals, and proof-of-work.
        </p>
      </section>

      <Card className="rounded-2xl border border-black/10 bg-white/92">
        <CardHeader>
          <CardDescription className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-(--landing-muted)">
            Profile Matrix
          </CardDescription>
          <CardTitle className="font-display text-3xl text-(--landing-ink)">Developer operating mode</CardTitle>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  )
}
