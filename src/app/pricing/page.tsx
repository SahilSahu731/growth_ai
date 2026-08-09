import Link from "next/link"
import { getServerSession } from "next-auth"
import { LockKeyhole, ShieldCheck, Webhook } from "lucide-react"

import { authOptions } from "@/auth"
import { BrandLogo } from "@/components/brand-logo"
import { PricingSection } from "@/components/landing/pricing-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { getAccountOverview } from "@/lib/data/account"
import { legalDetails } from "@/lib/legal"

export const dynamic = "force-dynamic"
export const metadata = { title: "Pricing", description: "Choose a GrowthAI plan for AI-guided goals, focused tasks, and grounded weekly reflection.", alternates: { canonical: "/pricing" } }

export default async function PricingPage() {
  const session = await getServerSession(authOptions)
  const account = session?.user?.id ? await getAccountOverview(session.user.id) : null
  const currentPlan = account?.user.planTier ?? "free"
  const support = legalDetails().supportContact
  return <main className="growth-grid min-h-screen bg-[#fafafa] text-neutral-950">
    <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/" className="flex items-center gap-2 font-display text-base tracking-wide"><BrandLogo className="size-8" priority />GrowthAI</Link><div className="flex items-center gap-2">{session?.user ? <><Link href="/settings#billing" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold">Billing</Link><Link href="/dashboard" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Dashboard</Link></> : <Link href="/login?callbackUrl=/pricing" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold">Log in</Link>}</div></header>
    <div className="px-4 pt-14 text-center sm:px-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Clear, secure pricing</p><h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-[-.045em] sm:text-6xl">Grow deeper when you need it.<br /><span className="font-editorial font-normal italic text-neutral-400">Keep the core loop free.</span></h1><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-500">Compare every shipped benefit here. Plan selection is confirmed in-app before Razorpay’s hosted checkout.</p></div>
    <PricingSection compact authenticated={Boolean(session?.user)} currentPlan={currentPlan} />
    <section className="mx-auto grid max-w-5xl gap-3 px-4 pb-12 sm:grid-cols-3 sm:px-6"><TrustItem icon={LockKeyhole} title="Server-created checkout" text="Plan IDs and pricing never come from the browser." /><TrustItem icon={Webhook} title="Signed plan activation" text="Access changes only after a verified Razorpay webhook." /><TrustItem icon={ShieldCheck} title="No card storage" text="GrowthAI never receives or stores payment-card details." /></section>
    <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6"><h2 className="text-2xl font-semibold tracking-tight">Before you purchase</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><Faq question="How does renewal and cancellation work?">Pro renews monthly until you cancel future renewal from Billing. A period-end cancellation keeps access through the paid period; an immediate provider cancellation ends access immediately.</Faq><Faq question="Are taxes included?">Displayed prices are in INR and exclude tax. Razorpay may add applicable regional tax before you approve checkout.</Faq><Faq question="What is the refund policy?">Refund eligibility follows applicable law and the policy shown at checkout. A redirect or browser refresh never grants access. Contact <a className="underline" href={`mailto:${support}`}>{support}</a> for billing help.</Faq><Faq question="What does Pro actually unlock?">Pro raises the active-goal limit from 3 to 25. Weekly review, Growth Map, privacy export, retention, and deletion controls remain available on Free.</Faq><Faq question="What happened to Founder?">Founder enrollment is closed. Existing continuously subscribed Founder accounts retain their ₹749 monthly price and current Pro workspace; no private channel or unreleased feature was promised.</Faq><Faq question="Are Calendar, Voice, or advanced memory included?">No. GrowthAI does not sell those capabilities until authorization, storage, deletion, consent, and failure behavior are complete.</Faq></div><div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold"><Link href="/terms" className="underline">Full terms</Link><Link href="/privacy" className="underline">Privacy</Link><Link href="/security" className="underline">Security</Link><Link href="/subprocessors" className="underline">Subprocessors</Link></div></section>
    <SiteFooter signedIn={Boolean(session?.user)} />
  </main>
}

function TrustItem({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) { return <article className="rounded-2xl border border-neutral-200 bg-white p-5"><Icon className="size-4 text-primary" /><p className="mt-4 text-xs font-bold text-neutral-900">{title}</p><p className="mt-2 text-[10px] leading-5 text-neutral-500">{text}</p></article> }
function Faq({ question, children }: { question: string; children: React.ReactNode }) { return <article className="rounded-2xl border border-neutral-200 bg-white p-5"><h3 className="text-sm font-semibold text-neutral-900">{question}</h3><p className="mt-2 text-xs leading-6 text-neutral-500">{children}</p></article> }
