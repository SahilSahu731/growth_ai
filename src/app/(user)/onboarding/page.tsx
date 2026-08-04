import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { CalendarDays, Sparkles, Target } from "lucide-react"

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
    <>
      <div aria-hidden className="pointer-events-none mx-auto w-full max-w-6xl space-y-6 opacity-35 blur-[1px]">
        <section className="growth-grid rounded-3xl border border-neutral-200 bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Your growth space</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-.05em]">Good to have you here.</h1>
          <p className="mt-3 text-sm text-neutral-500">Your first meaningful direction will appear here.</p>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <PreviewCard icon={Target} label="Current intention" />
          <PreviewCard icon={CalendarDays} label="Reflection rhythm" />
          <PreviewCard icon={Sparkles} label="Patterns noticed" />
        </section>
      </div>
      <GrowthOnboardingForm />
    </>
  )
}

function PreviewCard({ icon: Icon, label }: { icon: typeof Target; label: string }) {
  return <div className="h-32 rounded-2xl border border-neutral-200 bg-white p-5"><Icon className="size-4" /><p className="mt-5 text-xs font-bold uppercase tracking-wider text-neutral-400">{label}</p></div>
}
