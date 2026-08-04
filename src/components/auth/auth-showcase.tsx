import Image from "next/image"
import { ArrowUpRight, LockKeyhole, Sparkles } from "lucide-react"

const areas = ["Health", "Purpose", "Relationships", "Calm"]

export function AuthShowcase() {
  return (
    <aside className="auth-visual group relative min-h-[46rem] overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#111] shadow-[0_40px_100px_rgba(0,0,0,.55)]">
      <Image
        src="/growth-journey-auth.webp"
        alt="A solitary person following a warm path through a quiet sculptural landscape"
        fill
        priority
        sizes="(min-width: 1024px) 52vw, 100vw"
        className="auth-visual-image object-cover object-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,4,.16)_0%,rgba(4,4,4,.02)_36%,rgba(4,4,4,.86)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_18%,rgba(245,185,104,.14),transparent_34%)]" />
      <div className="auth-grain absolute inset-0 opacity-[.11] mix-blend-soft-light" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6 lg:p-8">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-white/80 backdrop-blur-xl">
          <span className="live-dot size-1.5 rounded-full bg-emerald-300" />
          Your life, in motion
        </div>
        <div className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-xl">
          <ArrowUpRight className="size-4" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {areas.map((area, index) => (
            <span key={area} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold backdrop-blur-xl ${index === 0 ? "border-amber-200/40 bg-amber-100/15 text-amber-50" : "border-white/15 bg-black/20 text-white/60"}`}>
              {area}
            </span>
          ))}
        </div>
        <p className="font-editorial max-w-xl text-4xl font-normal italic leading-[1.02] tracking-[-.025em] text-white sm:text-5xl lg:text-[3.5rem]">
          The next version of your life starts quietly.
        </p>
        <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-white/65">
          One honest intention. One step that fits today. A system that learns how you grow without turning you into a score.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="auth-floating-card rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/50"><Sparkles className="size-3.5 text-amber-200" />Today’s focus</div>
            <p className="mt-2 text-sm font-semibold text-white">Make space before adding more.</p>
          </div>
          <div className="auth-floating-card rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl [animation-delay:900ms]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/50"><LockKeyhole className="size-3.5 text-amber-200" />Private by default</div>
            <p className="mt-2 text-sm font-semibold text-white">Your reflections belong to you.</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
