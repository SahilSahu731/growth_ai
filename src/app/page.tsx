import Link from "next/link"
import { getServerSession } from "next-auth"
import { ArrowRight, Brain, CheckCircle2, Flame, GitBranch as Github, ShieldCheck, Target } from "lucide-react"

import { authOptions } from "@/auth"
import { Button } from "@/components/ui/button"

const features = [
  { icon: Target, title: "One real commitment", text: "Define what shipped means, choose a deadline, and protect one concrete next action." },
  { icon: Brain, title: "Memory that earns trust", text: "GrowthAI references repeated blockers and carried actions only when your history supports it." },
  { icon: Flame, title: "Recovery, not guilt", text: "Missed check-ins trigger a smaller restart plan—not generic reminders or shame-heavy streaks." },
]

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const startHref = session?.user ? "/dashboard" : "/signup"
  return <main className="min-h-screen overflow-hidden bg-[#090b0a] text-white">
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#090b0a]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold"><span className="flex size-8 items-center justify-center rounded-xl bg-emerald-400 text-zinc-950">G</span><span>GrowthAI</span></Link>
        <nav className="hidden gap-6 text-sm text-zinc-400 md:flex"><Link href="#how" className="hover:text-white">How it works</Link><Link href="#principles" className="hover:text-white">Why it works</Link><Link href="/pricing" className="hover:text-white">Pricing</Link></nav>
        <div className="flex gap-2"><Button asChild variant="ghost" className="rounded-full text-zinc-300"><Link href="/login">Log in</Link></Button><Button asChild className="rounded-full bg-emerald-400 text-zinc-950 hover:bg-emerald-300"><Link href={startHref}>{session?.user ? "Open cockpit" : "Start building"}</Link></Button></div>
      </div>
    </header>

    <section className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-24 pt-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:pb-32 lg:pt-28">
      <div className="absolute left-1/3 top-0 -z-0 size-[30rem] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="relative z-10">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-300" />Accountability for people who build</p>
        <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">Do not let another project quietly disappear.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">Tell GrowthAI what you are shipping. It checks in, remembers the patterns behind your stalls, and helps you complete the next meaningful action.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="h-12 rounded-full bg-emerald-400 px-7 font-semibold text-zinc-950 hover:bg-emerald-300"><Link href={startHref}>Make one commitment <ArrowRight className="size-4" /></Link></Button><Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/15 bg-white/5"><Link href="#how">See the loop</Link></Button></div>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" />Free for one active project</span><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" />Private by default</span><span className="flex items-center gap-2"><Github className="size-4 text-emerald-400" />Built for developers</span></div>
      </div>

      <div className="relative z-10 rounded-[2rem] border border-white/10 bg-zinc-900/80 p-4 shadow-2xl shadow-emerald-950/40 sm:p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Today’s check-in</p><p className="mt-1 font-medium">Launch Forge</p></div><span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">12 days to ship</span></div>
        <div className="mt-5 rounded-2xl bg-black/30 p-4"><p className="text-sm text-zinc-300">“I researched auth providers again, but I did not implement the callback.”</p></div>
        <div className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">GrowthAI</p><p className="mt-2 text-sm leading-6 text-zinc-200">This is the third check-in where auth research replaced implementation. Stop comparing providers. Open the callback route and make one failing test pass.</p><p className="mt-3 text-sm font-medium text-white">Can you finish that in 30 minutes?</p></div>
        <div className="mt-4 grid grid-cols-3 gap-3">{[["7", "day streak"], ["3", "real ships"], ["1", "active focus"]].map(([value,label]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-zinc-500">{label}</p></div>)}</div>
      </div>
    </section>

    <section id="how" className="border-y border-white/10 bg-white/[0.02] py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">The accountability loop</p><h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Less conversation. More observable movement.</h2><div className="mt-12 grid gap-4 md:grid-cols-4">{[
      ["01", "Commit", "One project, one deadline, one definition of shipped."], ["02", "Check in", "Say what changed. Add evidence when it exists."], ["03", "Get challenged", "One grounded observation and one sharp question."], ["04", "Recover", "When momentum drops, restart with a smaller action."],
    ].map(([number,title,text]) => <article key={number} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5"><span className="text-xs font-mono text-emerald-400">{number}</span><h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p></article>)}</div></div></section>

    <section id="principles" className="mx-auto max-w-7xl px-4 py-24 sm:px-6"><div className="grid gap-5 md:grid-cols-3">{features.map(({icon:Icon,title,text}) => <article key={title} className="rounded-3xl border border-white/10 p-6"><span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Icon className="size-5" /></span><h3 className="mt-6 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-zinc-400">{text}</p></article>)}</div></section>

    <section className="mx-auto max-w-5xl px-4 pb-24 text-center sm:px-6"><div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 px-6 py-14"><h2 className="text-3xl font-semibold sm:text-5xl">What are you refusing to abandon?</h2><p className="mx-auto mt-4 max-w-2xl text-zinc-300">Make the commitment. GrowthAI will keep the next action visible when motivation stops doing the work.</p><Button asChild size="lg" className="mt-8 h-12 rounded-full bg-emerald-400 px-7 text-zinc-950 hover:bg-emerald-300"><Link href={startHref}>Start free <ArrowRight className="size-4" /></Link></Button></div></section>
    <footer className="border-t border-white/10 py-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p>© 2026 GrowthAI. Built for consistency, not screen time.</p><div className="flex gap-5"><Link href="/pricing">Pricing</Link><a href="mailto:support@growthai.app">Support</a></div></div></footer>
  </main>
}
