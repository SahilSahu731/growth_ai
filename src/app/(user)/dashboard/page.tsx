import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowUpRight, CalendarCheck, MessageCircle, Target } from "lucide-react"

import { authOptions } from "@/auth"
import { getAccountOverview } from "@/lib/data/account"
import { getOperatorWeeklyActivity } from "@/lib/data/operator"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard")
  const [account, week] = await Promise.all([getAccountOverview(session.user.id), getOperatorWeeklyActivity(session.user.id)])
  if (!account) redirect("/login")
  const cards = [
    { label: "Recent conversations", value: account.conversations.length, href: "/chat", icon: MessageCircle },
    { label: "Active goals", value: week?.activeGoals ?? 0, href: "/goals", icon: Target },
    { label: "Open tasks", value: week?.openTasks ?? 0, href: "/tasks", icon: CalendarCheck },
  ]
  return <div className="mx-auto max-w-5xl space-y-8"><header><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">Workspace overview</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Welcome back, {session.user.name?.split(" ")[0] ?? "there"}.</h1><p className="mt-3 text-base text-neutral-500">A direct view of the product features that are available now.</p></header><section className="grid gap-4 sm:grid-cols-3">{cards.map((card) => <Link key={card.label} href={card.href} className="group min-h-44 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm focus-visible:ring-2 focus-visible:ring-primary"><card.icon className="size-5 text-primary" /><p className="mt-7 text-3xl font-black">{card.value}</p><p className="mt-1 text-sm text-neutral-500">{card.label}</p><ArrowUpRight className="ml-auto mt-3 size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}</section><section className="rounded-3xl border border-neutral-200 bg-white p-6"><h2 className="text-xl font-bold">This week</h2><p className="mt-3 text-sm leading-7 text-neutral-500">{week?.conversationTurns ?? 0} reflection turns since {week ? new Date(week.since).toLocaleDateString() : "this week"}. Weekly observations appear after at least three turns.</p><Link href="/weekly-report" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">Open weekly report <ArrowUpRight className="size-4" /></Link></section></div>
}
