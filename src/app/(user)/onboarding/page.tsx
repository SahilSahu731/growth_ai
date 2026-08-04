import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { GrowthOnboardingForm } from "@/components/growth/onboarding-form"
import { getOnboardingState } from "@/lib/data/growth"
import { findUserByEmail } from "@/lib/data/users"

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions); const email = session?.user?.email?.trim().toLowerCase(); if (!email) redirect("/login")
  const user = await findUserByEmail(email); if (!user) redirect("/login")
  const state = await getOnboardingState(user.id); if (state?.completed) redirect("/dashboard")
  return <div className="mx-auto w-full max-w-5xl space-y-7"><section className="growth-grid rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-neutral-400">A few quiet questions</p><h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-.045em] text-neutral-950 sm:text-6xl">Begin with one part of life<br /><span className="font-editorial font-normal italic text-neutral-400">that deserves your attention.</span></h1><p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-neutral-500">Not the most impressive goal. Not everything at once. Choose something that would make daily life feel meaningfully better.</p></section><section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-10"><GrowthOnboardingForm /></section></div>
}
