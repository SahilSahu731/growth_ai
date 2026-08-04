import { CheckCircle2, ShieldCheck, Target } from "lucide-react"

const principles = [
  { icon: Target, title: "One real commitment", text: "Start with a deadline, a finish line, and the smallest next action." },
  { icon: CheckCircle2, title: "Evidence over performance", text: "Check-ins ask what changed; GitHub and links remain supporting evidence." },
  { icon: ShieldCheck, title: "Private by default", text: "Your raw updates and coaching stay private unless you deliberately publish a limited progress page." },
]

export function AuthShowcase() {
  return <aside className="rounded-[2rem] border border-black/10 bg-white/74 p-8 shadow-2xl shadow-amber-950/10 backdrop-blur-sm lg:p-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Accountability for builders</p><h2 className="mt-5 font-display text-4xl leading-tight text-(--landing-ink)">A place to tell the truth about what moved.</h2><p className="mt-4 text-sm leading-7 text-(--landing-muted)">GrowthAI is deliberately smaller than a project manager and more grounded than an average chat app.</p><div className="mt-8 space-y-4">{principles.map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4 rounded-2xl border border-black/10 bg-white/70 p-4"><Icon className="mt-0.5 size-5 shrink-0 text-emerald-700" /><div><h3 className="font-medium text-(--landing-ink)">{title}</h3><p className="mt-1 text-sm leading-6 text-(--landing-muted)">{text}</p></div></div>)}</div></aside>
}
