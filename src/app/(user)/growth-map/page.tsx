import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { ArrowRight, Brain, Compass, ShieldCheck } from "lucide-react"

import { authOptions } from "@/auth"
import { ensureOperatorConversation, getOperatorWorkspace } from "@/lib/data/operator"

export const dynamic = "force-dynamic"
export const metadata = { title: "Growth map" }

export default async function GrowthMapPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const conversation = await ensureOperatorConversation(session.user.id)
  const workspace = await getOperatorWorkspace(session.user.id, conversation.id)
  if (!workspace) redirect("/chat")

  const userMessages = workspace.messages.filter((message) => message.role === "user")

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Living context</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-neutral-950 sm:text-5xl">Your Growth Map.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">A map of evidence and working hypotheses. It never presents a personality label or an AI guess as truth.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MapCard icon={Compass} title="Current direction" value={workspace.conversation.title} />
        <MapCard icon={Brain} title="Evidence gathered" value={`${userMessages.length} personal ${userMessages.length === 1 ? "response" : "responses"}`} />
        <MapCard icon={ShieldCheck} title="Confidence standard" value="You confirm major conclusions" />
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
        {userMessages.length >= 4 ? <><h2 className="text-2xl font-black tracking-tight">Ready to map the first pattern.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">Ask GrowthAI what it currently sees as observation, hypothesis, constraint, and missing information. You can correct every part.</p></> : <><h2 className="text-2xl font-black tracking-tight">Your map starts with conversation.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-500">There is not enough evidence yet to infer a useful pattern. GrowthAI will wait instead of manufacturing certainty.</p></>}
        <Link href={`/chat?conversation=${encodeURIComponent(conversation.id)}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground">Continue in chat<ArrowRight className="size-4" /></Link>
      </section>
    </div>
  )
}

function MapCard({ icon: Icon, title, value }: { icon: typeof Brain; title: string; value: string }) {
  return <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><Icon className="size-4 text-primary" /><p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{title}</p><p className="mt-2 text-sm font-bold leading-6 text-neutral-800">{value}</p></article>
}
