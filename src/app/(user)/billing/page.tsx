import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { ArrowUpRight, CalendarClock, CheckCircle2, CreditCard, History, LockKeyhole, ShieldCheck } from "lucide-react"

import { authOptions } from "@/auth"
import { CancelSubscription } from "@/components/billing/cancel-subscription"
import { UpgradeTrigger } from "@/components/billing/upgrade-dialog"
import { getUserBilling } from "@/lib/data/account"

export const dynamic = "force-dynamic"
export const metadata = { title: "Billing" }

function date(value?: string) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "Not available"
}

function money(amount: number, currency: string) {
  return (amount / 100).toLocaleString("en-IN", { style: "currency", currency })
}

function statusStyle(status: string) {
  if (["active", "authenticated"].includes(status)) return "bg-emerald-500/10 text-emerald-400"
  if (["created", "pending"].includes(status)) return "bg-amber-500/10 text-amber-300"
  return "bg-white/5 text-neutral-500"
}

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login?callbackUrl=/billing")
  const billing = await getUserBilling(session.user.id)
  if (!billing) redirect("/login?callbackUrl=/billing")
  const current = billing.current
  const paid = billing.planTier !== "free"
  const cancellable = current && ["created", "pending", "authenticated", "active"].includes(current.status)

  return <div className="mx-auto w-full max-w-6xl space-y-7">
    <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Account billing</p><h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-neutral-950 sm:text-5xl">Plan & billing.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">Manage subscription renewal and review the billing state recorded from verified Razorpay events.</p></div>
      {!paid ? <UpgradeTrigger feature="GrowthAI Pro" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground">Compare paid plans</UpgradeTrigger> : null}
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Current entitlement</p><p className="mt-3 text-3xl font-black capitalize text-neutral-950">{billing.planTier}</p></div><span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10"><CreditCard className="size-5 text-primary" /></span></div>
        {current ? <div className="mt-6 grid gap-3 sm:grid-cols-3"><Detail label="Subscription" value={current.providerSubscriptionId} mono /><Detail label="Status" value={current.cancelAtPeriodEnd ? "Cancels at period end" : current.status} /><Detail label="Renewal / period end" value={date(current.periodEnd)} /></div> : <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-5"><p className="text-xs font-bold text-neutral-700">No paid subscription</p><p className="mt-2 text-xs leading-5 text-neutral-500">The Free plan has no payment method or recurring charge.</p></div>}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-neutral-200 pt-5">
          {current?.checkoutUrl && ["created", "pending"].includes(current.status) ? <a href={current.checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">Resume secure checkout<ArrowUpRight className="size-4" /></a> : null}
          {cancellable ? <CancelSubscription disabled={current.cancelAtPeriodEnd} /> : null}
          {current ? <span className={`rounded-full px-3 py-1.5 text-[9px] font-bold uppercase ${statusStyle(current.status)}`}>{current.status}</span> : null}
        </div>
      </article>

      <article className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7"><ShieldCheck className="size-5 text-emerald-400" /><h2 className="mt-5 text-lg font-black text-neutral-900">Payment security</h2><ul className="mt-4 space-y-4"><SecurityItem icon={LockKeyhole} text="Checkout is created only after authenticated, same-origin server validation." /><SecurityItem icon={CheckCircle2} text="Plan access changes only from HMAC-verified Razorpay events for server-created subscriptions." /><SecurityItem icon={CalendarClock} text="Cancellation is ownership-checked and scheduled with Razorpay first." /></ul><p className="mt-5 border-t border-neutral-200 pt-4 text-[10px] leading-5 text-neutral-500">GrowthAI stores subscription identifiers and status—not card numbers, CVV, or banking credentials.</p></article>
    </section>

    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-neutral-100"><History className="size-4 text-neutral-500" /></span><div><h2 className="text-lg font-black text-neutral-900">Subscription history</h2><p className="mt-1 text-xs text-neutral-500">Provider-confirmed lifecycle records for this account.</p></div></div>
      {billing.subscriptions.length ? <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-neutral-200 text-[10px] uppercase tracking-wider text-neutral-400"><th className="pb-3">Plan</th><th className="pb-3">Status</th><th className="pb-3">Amount</th><th className="pb-3">Period</th><th className="pb-3 text-right">Updated</th></tr></thead><tbody>{billing.subscriptions.map((item) => <tr key={item.id} className="border-b border-neutral-100 last:border-0"><td className="py-4 text-xs font-bold capitalize text-neutral-800">{item.planTier}</td><td className="py-4"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${statusStyle(item.status)}`}>{item.status}</span></td><td className="py-4 text-xs text-neutral-500">{money(item.amount, item.currency)}</td><td className="py-4 text-[10px] text-neutral-500">{date(item.periodStart)} – {date(item.periodEnd)}</td><td className="py-4 text-right text-[10px] text-neutral-400">{date(item.updatedAt)}</td></tr>)}</tbody></table></div> : <p className="mt-6 rounded-2xl border border-dashed border-neutral-300 py-10 text-center text-xs text-neutral-500">No subscription history yet.</p>}
    </section>
  </div>
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-xl bg-neutral-50 p-3"><p className="text-[9px] font-bold uppercase text-neutral-400">{label}</p><p className={`mt-2 truncate text-xs font-semibold capitalize text-neutral-700 ${mono ? "font-mono text-[9px] normal-case" : ""}`}>{value}</p></div>
}

function SecurityItem({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return <li className="flex gap-3 text-xs leading-5 text-neutral-500"><Icon className="mt-0.5 size-4 shrink-0 text-primary" />{text}</li>
}
