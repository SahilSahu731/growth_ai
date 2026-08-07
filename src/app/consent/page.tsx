import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { acceptLegalAction } from "@/app/consent/actions"
import { authOptions } from "@/auth"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { getAccountOverview } from "@/lib/data/account"
import { LEGAL_VERSIONS, legalDetails } from "@/lib/legal"

export const metadata = { title: "Before your first conversation" }

export default async function ConsentPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login?callbackUrl=/consent")
  const account = await getAccountOverview(session.user.id)
  if (account?.preferences.termsAcceptedVersion === LEGAL_VERSIONS.terms && account.preferences.privacyAcceptedVersion === LEGAL_VERSIONS.privacy && account.preferences.aiNoticeAcceptedVersion === LEGAL_VERSIONS.aiNotice) redirect("/chat")
  const legal = legalDetails()
  const error = (await searchParams).error
  return <main className="flex min-h-svh items-center justify-center bg-[#0d1112] px-4 py-10 text-white"><section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[.035] p-6 shadow-2xl sm:p-9"><Link href="/" className="flex items-center gap-2 font-display"><BrandLogo className="size-9" />GrowthAI</Link><p className="mt-8 text-sm font-bold uppercase tracking-[.16em] text-primary">One clear pause</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Before your first AI conversation.</h1><p className="mt-4 text-base leading-7 text-neutral-300">GrowthAI sends only relevant conversation context, active goals, and open tasks to Google Gemini when AI is enabled. AI can be wrong and is not medical, emergency, legal, or financial care. Authorized support access to message content requires a recorded reason.</p><form action={acceptLegalAction} className="mt-7 space-y-4"><Consent name="age">I confirm I am at least {legal.minimumAge} years old.</Consent><Consent name="terms">I agree to the <Link href="/terms" target="_blank" className="underline">Terms</Link> and acknowledge the <Link href="/privacy" target="_blank" className="underline">Privacy Notice</Link>.</Consent><Consent name="ai">I understand the <Link href="/ai-safety" target="_blank" className="underline">AI limitations and safety behavior</Link> and consent to model processing for conversations I start.</Consent>{error ? <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">Accept all required items to continue.</p> : null}<Button className="min-h-12 w-full rounded-xl text-base font-bold">Accept and enter GrowthAI</Button></form><p className="mt-5 text-sm text-neutral-400">Versions: Terms {LEGAL_VERSIONS.terms} · Privacy {LEGAL_VERSIONS.privacy} · AI notice {LEGAL_VERSIONS.aiNotice}</p></section></main>
}

function Consent({ name, children }: { name: string; children: React.ReactNode }) {
  return <label className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-4 text-sm leading-6 text-neutral-200 focus-within:ring-2 focus-within:ring-primary"><input type="checkbox" name={name} value="yes" required className="mt-1 size-5 shrink-0 accent-cyan-300" /><span>{children}</span></label>
}
