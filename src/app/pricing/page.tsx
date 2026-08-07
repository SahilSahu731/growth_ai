import Link from "next/link"
import { getServerSession } from "next-auth"
import { LockKeyhole, ShieldCheck, Webhook } from "lucide-react"

import { authOptions } from "@/auth"
import { BrandLogo } from "@/components/brand-logo"
import { PricingSection } from "@/components/landing/pricing-section"
import { SiteFooter } from "@/components/landing/site-footer"
import { getAccountOverview } from "@/lib/data/account"

export const dynamic = "force-dynamic"
export const metadata = { title: "Pricing", description: "Choose a GrowthAI plan for AI-guided goals, focused tasks, and grounded weekly reflection.", alternates: { canonical: "/pricing" } }

export default async function PricingPage() {
  const session = await getServerSession(authOptions)
  const account = session?.user?.id ? await getAccountOverview(session.user.id) : null
  const currentPlan = account?.user.planTier ?? "free"
  return <main className="growth-grid min-h-screen bg-[#fafafa] text-neutral-950"><header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6"><Link href="/" className="flex items-center gap-2 font-display text-base tracking-wide"><BrandLogo className="size-8" priority />GrowthAI</Link><div className="flex items-center gap-2">{session?.user ? <><Link href="/settings#billing" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold">Billing</Link><Link href="/dashboard" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Dashboard</Link></> : <Link href="/login?callbackUrl=/pricing" className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-bold">Log in</Link>}</div></header><div className="px-4 pt-14 text-center sm:px-6"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Clear, secure pricing</p><h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black tracking-[-.045em] sm:text-6xl">Grow deeper when you need it.<br /><span className="font-editorial font-normal italic text-neutral-400">Keep the core loop free.</span></h1><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-neutral-500">Compare every plan here. When you choose a paid plan, confirmation happens in-app before you are sent to Razorpay’s hosted checkout.</p></div><PricingSection compact authenticated={Boolean(session?.user)} currentPlan={currentPlan} /><section className="mx-auto grid max-w-5xl gap-3 px-4 pb-12 sm:grid-cols-3 sm:px-6"><TrustItem icon={LockKeyhole} title="Server-created checkout" text="Plan IDs and pricing never come from the browser." /><TrustItem icon={Webhook} title="Signed plan activation" text="Access changes only after a verified Razorpay webhook." /><TrustItem icon={ShieldCheck} title="No card storage" text="GrowthAI never receives or stores payment-card details." /></section><p className="mx-auto max-w-3xl px-4 pb-20 text-center text-xs leading-6 text-neutral-500">Prices are in INR. Taxes may apply. Subscriptions renew monthly until cancellation is scheduled from Billing.</p><SiteFooter signedIn={Boolean(session?.user)} /></main>
}

function TrustItem({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <article className="rounded-2xl border border-neutral-200 bg-white p-5"><Icon className="size-4 text-primary" /><p className="mt-4 text-xs font-bold text-neutral-900">{title}</p><p className="mt-2 text-[10px] leading-5 text-neutral-500">{text}</p></article>
}
