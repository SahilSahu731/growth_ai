import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { ArrowRight, CheckCircle2, MessageSquareText, Sparkles } from "lucide-react"

import { authOptions } from "@/auth"
import { ensureOperatorConversation, getOperatorWeeklyActivity, getOperatorWorkspace } from "@/lib/data/operator"

export const dynamic = "force-dynamic"
export const metadata = { title: "Weekly report" }

export default async function WeeklyReportPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const conversation = await ensureOperatorConversation(session.user.id)
  const [workspace, activity] = await Promise.all([
    getOperatorWorkspace(session.user.id, conversation.id),
    getOperatorWeeklyActivity(session.user.id),
  ])
  if (!workspace) redirect("/chat")

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Last seven days</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-neutral-950 sm:text-5xl">Your weekly report.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">A factual view of the conversation and work currently in motion—not a score for your life.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric icon={MessageSquareText} label="Conversation turns" value={String(activity?.conversationTurns ?? 0)} />
        <Metric icon={CheckCircle2} label="Open approved tasks" value={String(activity?.openTasks ?? 0)} />
        <Metric icon={Sparkles} label="Active goals" value={String(activity?.activeGoals ?? 0)} />
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-neutral-400">GrowthAI synthesis</p>
        {activity?.enoughData ? (
          <><h2 className="mt-4 text-2xl font-black tracking-tight">There is enough context for a useful review.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">Ask GrowthAI to review what changed, what was repeatedly blocked, and which assumption the next plan should test.</p><Link href={`/chat?conversation=${encodeURIComponent(conversation.id)}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">Generate in chat<ArrowRight className="size-4" /></Link></>
        ) : (
          <><h2 className="mt-4 text-2xl font-black tracking-tight">Still gathering evidence.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">A trustworthy report needs more than one answer. Keep talking naturally; GrowthAI will synthesize the week after enough real context exists.</p><Link href={`/chat?conversation=${encodeURIComponent(conversation.id)}`} className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-neutral-900">Continue the conversation<ArrowRight className="size-4" /></Link></>
        )}
      </section>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><Icon className="size-4 text-primary" /><p className="mt-5 text-xl font-black capitalize text-neutral-950">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</p></div>
}
