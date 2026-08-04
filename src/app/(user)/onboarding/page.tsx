import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { GrowthOnboardingForm } from "@/components/growth/onboarding-form"
import { getOnboardingState } from "@/lib/data/growth"
import { findUserByEmail } from "@/lib/data/users"

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) redirect("/login")

  const user = await findUserByEmail(email)
  if (!user) redirect("/login")

  const state = await getOnboardingState(user.id)
  if (state?.completed) redirect("/dashboard")

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <section className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Set up in under five minutes</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">Turn one real project into a commitment.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">GrowthAI works when the outcome is concrete. Define what shipped means, choose when we should check in, and start with the next observable action.</p>
      </section>
      <section className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6 sm:p-9"><GrowthOnboardingForm /></section>
    </div>
  )
}
