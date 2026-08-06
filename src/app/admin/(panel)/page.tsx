import Link from "next/link"
import { Activity, ArrowUpRight, CheckCircle2, CreditCard, MessageSquareText, ShieldAlert, Target, Users } from "lucide-react"

import { getAdminDashboard } from "@/lib/data/admin"
import { requireAdminPageSession } from "@/lib/admin/page-auth"

export const metadata = { title: "Overview" }

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default async function AdminOverviewPage() {
  await requireAdminPageSession()
  const dashboard = await getAdminDashboard()
  const metrics = [
    { label: "Active users", value: dashboard.totals.activeUsers, note: `${dashboard.lastSevenDays.users} joined this week`, icon: Users },
    { label: "Conversations", value: dashboard.totals.conversations, note: `${dashboard.lastSevenDays.messages} messages this week`, icon: MessageSquareText },
    { label: "Active goals", value: dashboard.totals.activeGoals, note: `${dashboard.totals.openTasks} open tasks`, icon: Target },
    { label: "Paid subscriptions", value: dashboard.totals.activeSubscriptions, note: `${dashboard.totals.failedBillingEvents} failed billing events`, icon: CreditCard },
  ]
  const maxPlan = Math.max(1, ...dashboard.planDistribution.map((item) => item.count))
  return <div className="space-y-7"><section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Command center</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Platform overview</h1><p className="mt-2 text-sm text-neutral-500">Users, engagement, execution, and billing health in one place.</p></div><Link href="/admin/security" className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-white/10 px-4 text-xs font-bold text-neutral-300 hover:bg-white/5 sm:self-auto"><ShieldAlert className="size-4" />Review security log</Link></section>

  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary"><metric.icon className="size-4" /></span><Activity className="size-3.5 text-neutral-700" /></div><p className="mt-6 text-3xl font-black tracking-tight text-white">{metric.value.toLocaleString()}</p><p className="mt-1 text-xs font-semibold text-neutral-300">{metric.label}</p><p className="mt-2 text-[10px] text-neutral-600">{metric.note}</p></article>)}</section>

  <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border border-white/8 bg-white/[.025] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-white">Recently joined</h2><p className="mt-1 text-xs text-neutral-600">Newest product accounts</p></div><Link href="/admin/users" className="flex items-center gap-1 text-xs font-bold text-primary">All users<ArrowUpRight className="size-3.5" /></Link></div><div className="mt-5 divide-y divide-white/7">{dashboard.recentUsers.length ? dashboard.recentUsers.map((user) => <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xs font-bold text-neutral-300">{user.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-neutral-200">{user.name}</span><span className="block truncate text-[10px] text-neutral-600">{user.email}</span></span><span className="text-right"><span className="block text-[10px] font-bold capitalize text-neutral-400">{user.planTier}</span><span className="block text-[9px] text-neutral-700">{formatDate(user.createdAt)}</span></span></Link>) : <p className="py-10 text-center text-xs text-neutral-600">No users yet.</p>}</div></div>

  <div className="space-y-5"><article className="rounded-2xl border border-white/8 bg-white/[.025] p-5 sm:p-6"><h2 className="text-sm font-bold text-white">Plan distribution</h2><p className="mt-1 text-xs text-neutral-600">Active accounts by entitlement</p><div className="mt-5 space-y-4">{dashboard.planDistribution.map((item) => <div key={item.tier}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold capitalize text-neutral-400">{item.tier}</span><span className="font-bold text-neutral-200">{item.count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxPlan) * 100}%` }} /></div></div>)}</div></article><article className="grid grid-cols-2 gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-5"><SmallMetric icon={CheckCircle2} value={dashboard.totals.completedTasks} label="Completed tasks" /><SmallMetric icon={ShieldAlert} value={dashboard.totals.suspendedUsers} label="Suspended users" /></article></div></section>

  <section className="rounded-2xl border border-white/8 bg-white/[.025] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-white">Recent billing events</h2><p className="mt-1 text-xs text-neutral-600">Latest webhook processing results</p></div><Link href="/admin/billing" className="text-xs font-bold text-primary">Open billing</Link></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead><tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-neutral-600"><th className="pb-3 font-bold">Event</th><th className="pb-3 font-bold">Provider ID</th><th className="pb-3 font-bold">Status</th><th className="pb-3 text-right font-bold">Received</th></tr></thead><tbody>{dashboard.recentBillingEvents.map((event) => <tr key={event.id} className="border-b border-white/5 last:border-0"><td className="py-3 text-xs font-semibold text-neutral-300">{event.eventType}</td><td className="max-w-52 truncate py-3 font-mono text-[10px] text-neutral-600">{String(event.providerEventId ?? "—")}</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${event.status === "failed" ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-400"}`}>{event.status}</span></td><td className="py-3 text-right text-[10px] text-neutral-600">{formatDate(event.createdAt)}</td></tr>)}</tbody></table></div></section></div>
}

function SmallMetric({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return <div className="rounded-xl bg-white/[.025] p-3"><Icon className="size-4 text-neutral-500" /><p className="mt-4 text-xl font-black text-white">{value.toLocaleString()}</p><p className="mt-1 text-[10px] text-neutral-600">{label}</p></div>
}
