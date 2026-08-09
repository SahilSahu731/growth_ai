import Link from "next/link"
import { getServerSession } from "next-auth"
import { ArrowUpRight, Brain, Check, ChevronRight, Compass, Heart, Leaf, LineChart, RefreshCcw, ShieldCheck, Sparkles, Target } from "lucide-react"

import { authOptions } from "@/auth"
import { BrandLogo } from "@/components/brand-logo"
import { DynamicGrowthShowcase } from "@/components/landing/dynamic-growth-showcase"
import { SiteFooter } from "@/components/landing/site-footer"

const lifeAreas = ["Product", "Career", "Client work", "Learning", "Creative work"]

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const startHref = session?.user ? "/chat" : "/signup"
  return <main className="min-h-screen overflow-x-hidden bg-[#fafafa] text-neutral-950">
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-50">
        <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between rounded-full border border-neutral-200/80 bg-white/85 px-4 shadow-[0_8px_30px_rgba(0,0,0,.025)] backdrop-blur-md sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-display text-base tracking-wide transition hover:opacity-70"><BrandLogo className="size-8" priority />GrowthAI</Link>
          <div className="hidden items-center gap-7 text-[11px] font-bold uppercase tracking-[.14em] text-neutral-500 md:flex"><a href="#system" className="hover:text-neutral-950">The system</a><a href="#inside" className="hover:text-neutral-950">Inside</a><Link href="/pricing" className="hover:text-neutral-950">Pricing</Link></div>
          <div className="flex items-center gap-2"><Link href={session?.user ? "/chat" : "/login"} className="hidden rounded-full border border-neutral-200 bg-white px-5 py-2 text-xs font-bold text-neutral-800 transition hover:-translate-y-0.5 hover:bg-neutral-50 sm:block">{session?.user ? "Workspace" : "Log in"}</Link><Link href={startHref} className="group flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/10 transition hover:-translate-y-0.5 hover:bg-primary/85">{session?.user ? "Continue" : "Start growing"}<ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link></div>
        </nav>
      </header>

      <section className="growth-grid relative flex min-h-[calc(100vh-72px)] flex-col items-center justify-center overflow-hidden pb-12 pt-16 text-center sm:pt-20">
        <div className="ambient-orb absolute left-1/2 top-20 -z-0 h-96 w-3/4 -translate-x-1/2 rounded-full bg-neutral-200/25 blur-3xl" />
        <div className="relative z-10 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/85 px-3 py-1.5 text-xs font-bold text-neutral-600 shadow-sm backdrop-blur"><BrandLogo className="size-6 rounded-full" /><span>For solo builders and knowledge workers</span></div>
        <h1 className="relative z-10 mt-7 max-w-5xl text-[clamp(2.8rem,7.2vw,6.4rem)] font-black leading-[.98] tracking-[-.055em] text-neutral-950">Turn a stuck priority into<br /><span className="font-editorial block text-[1.08em] font-normal italic tracking-[-.025em] text-neutral-400 sm:inline">one clear next step.</span></h1>
        <p className="relative z-10 mt-7 max-w-2xl px-3 text-base font-medium leading-8 text-neutral-500 sm:text-lg">GrowthAI helps you unpack an ambiguous self-directed priority, approve a manageable action, and review the evidence a week later—without streaks, pressure, or inflated promises.</p>
        <div className="relative z-10 mt-9 flex w-full flex-col items-center justify-center gap-3 px-4 sm:flex-row"><Link href={startHref} className="group flex h-12 w-full max-w-64 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition hover:-translate-y-0.5 hover:bg-primary/85 sm:w-auto">Begin with one intention<ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link><a href="#inside" className="group flex h-12 w-full max-w-64 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-6 text-sm font-semibold text-neutral-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white sm:w-auto">See how it feels<ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></a></div>
        <div className="relative z-10 mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-neutral-500"><span className="flex items-center gap-1.5"><Check className="size-3.5" />Up to three active goals free</span><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" />Access-controlled data</span><span className="flex items-center gap-1.5"><Heart className="size-3.5" />No shame or hustle culture</span></div>

        <div id="inside" className="relative z-10 mt-16 w-full px-1 sm:px-4">
          <DynamicGrowthShowcase />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 py-12 sm:grid-cols-3">
        {[{ value: "3", label: "active goals on the free plan" }, { value: "1–3", label: "editable actions in each proposal" }, { value: "1", label: "bounded weekly focus" }].map(item => <div key={item.label} className="motion-card rounded-2xl border border-neutral-200 bg-white/85 p-6 text-center shadow-sm"><p className="font-editorial text-5xl italic text-neutral-950 sm:text-6xl">{item.value}</p><p className="mt-2 text-[11px] font-bold uppercase tracking-[.14em] text-neutral-400">{item.label}</p></div>)}
      </section>

      <section id="system" className="py-16">
        <div className="mx-auto mb-11 max-w-3xl text-center"><span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-neutral-500">A dependable work loop</span><h2 className="mt-5 text-4xl font-black leading-tight tracking-[-.04em] sm:text-6xl">Clarify. Act. Review.<br /><span className="font-editorial font-normal italic text-neutral-400">Keep only what the evidence supports.</span></h2></div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Bento icon={Compass} eyebrow="Direction" title="Choose what matters now" text="Name the life area, why it matters, and what meaningful progress would look like—without turning your life into a productivity contest." className="lg:col-span-2" visual={<div className="flex flex-wrap gap-2">{lifeAreas.map((area, index) => <span key={area} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${index === 3 ? "border-neutral-900 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-500"}`}>{area}</span>)}</div>} />
          <Bento icon={RefreshCcw} eyebrow="Recovery" title="Restart gently" text="A missed day becomes a smaller next step, not proof that you failed." visual={<div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Today’s reset</p><p className="mt-2 text-sm font-semibold">Walk outside for ten minutes.</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200"><div className="h-full w-2/3 rounded-full bg-neutral-950" /></div></div>} />
          <Bento icon={Brain} eyebrow="Self-knowledge" title="See your real patterns" text="GrowthAI points to repeated blockers and helpful conditions only when your own reflections support them." visual={<div className="space-y-2">{["Energy is better after morning movement", "Big steps are getting postponed", "Sunday planning is helping"].map((text, index) => <div key={text} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"><span className={`size-2 rounded-full ${index === 1 ? "bg-amber-400" : "bg-neutral-900"}`} /><p className="text-xs font-semibold text-neutral-600">{text}</p></div>)}</div>} />
          <Bento icon={LineChart} eyebrow="Reflection" title="Understand the week" text="Weekly reviews separate what happened from what it might mean, then help you choose the next humane focus." className="lg:col-span-2" visual={<MiniWeek />} />
        </div>
      </section>

      <section className="grid items-center gap-6 py-14 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9"><span className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-neutral-500">A better conversation with yourself</span><h2 className="mt-6 text-4xl font-black leading-[1.05] tracking-[-.04em]">Honest enough to help.<br /><span className="font-editorial font-normal italic text-neutral-400">Kind enough to return to.</span></h2><p className="mt-5 text-sm font-medium leading-7 text-neutral-500">The AI does not diagnose you, flatter you, or turn every day into a score. It uses your own words to offer one grounded observation and one useful question.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Supportive, balanced, or direct tone", "Export, retention, and deletion controls", "Relevant context only is sent to the model", "Deterministic fallback when AI is unavailable"].map(text => <div key={text} className="flex gap-2 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 text-xs font-semibold text-neutral-700"><Check className="mt-0.5 size-3.5 shrink-0" />{text}</div>)}</div></div>
        <div className="rounded-3xl border border-neutral-200 bg-neutral-100/60 p-3 shadow-sm sm:p-5"><div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Evening reflection · Wellbeing</p><p className="mt-4 text-sm leading-7 text-neutral-700">“I wanted to call my sister, but work ran late again. I kept thinking I needed a long conversation, so I did nothing.”</p><div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"><div className="flex items-center gap-2"><Sparkles className="size-4" /><p className="text-xs font-bold">GrowthAI</p></div><p className="mt-3 text-sm leading-7 text-neutral-600">The size of the ideal conversation may be stopping the small connection you actually want. Try sending a voice note instead of waiting for the perfect hour.</p><p className="mt-3 text-sm font-bold text-neutral-900">Would a two-minute voice note feel honest enough for today?</p></div></div></div>
      </section>

      <section className="py-16 text-center"><div className="mx-auto max-w-4xl rounded-3xl border border-neutral-200 bg-white px-6 py-14 shadow-sm"><Leaf className="mx-auto size-7 text-primary" /><h2 className="mt-6 text-4xl font-black tracking-[-.04em] sm:text-6xl">Which priority keeps circling?</h2><p className="mx-auto mt-5 max-w-xl text-base leading-8 text-neutral-500">Bring one real stuck point. Leave with a small action you can inspect, edit, and approve.</p><Link href={startHref} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/85">Start free<ArrowUpRight className="size-4" /></Link></div></section>
    </div>
    <SiteFooter signedIn={Boolean(session?.user)} />
  </main>
}

function Bento({ icon: Icon, eyebrow, title, text, visual, className = "" }: { icon: typeof Target; eyebrow: string; title: string; text: string; visual: React.ReactNode; className?: string }) {
  return <article className={`motion-card flex min-h-80 flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400"><Icon className="size-4 text-neutral-900" />{eyebrow}</div><h3 className="mt-5 text-2xl font-black tracking-[-.025em]">{title}</h3><p className="mt-3 max-w-xl text-sm font-medium leading-7 text-neutral-500">{text}</p></div><div className="mt-7">{visual}</div></article>
}

function MiniWeek() {
  return <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4"><div className="flex h-28 items-end gap-2">{[32, 56, 44, 76, 62, 88, 68].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="flex h-24 w-full items-end"><div className="w-full rounded-t bg-neutral-900" style={{ height: `${height}%`, opacity: .55 + index * .06 }} /></div><span className="text-[9px] font-bold text-neutral-400">{"MTWTFSS"[index]}</span></div>)}</div></div>
}
