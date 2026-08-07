import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { ArrowLeft, Check, Sparkles, TrendingUp } from "lucide-react"

import { authOptions } from "@/auth"
import { BrandLogo } from "@/components/brand-logo"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // A NextAuth session shell can exist without a valid application user ID
  // during an expired/failed account lookup. Redirecting that shell to /chat
  // creates a /login ↔ /chat loop with the protected layout.
  if (session?.user?.id) redirect("/chat")

  return (
    <div className="auth-fullscreen relative min-h-screen overflow-hidden bg-[#050706] text-white">
      <Image
        src="/growth-auth-background-v2.webp"
        alt="A quiet figure looking across a landscape illuminated by threads of warm light"
        fill
        priority
        sizes="100vw"
        className="auth-background-image object-cover object-[40%_center]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,6,4,.24)_0%,rgba(3,6,4,.1)_48%,rgba(3,6,4,.8)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,3,.28),transparent_38%,rgba(2,4,3,.7))]" />
      <div className="growth-auth-grid absolute inset-0 opacity-50" />
      <div className="auth-grain pointer-events-none absolute inset-0 opacity-[.1] mix-blend-soft-light" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-12">
        <section className="relative hidden min-h-screen flex-col justify-between border-r border-white/8 p-10 lg:col-span-7 lg:flex xl:p-12">
          <Link href="/" className="font-display flex w-fit items-center gap-2 text-base tracking-widest text-white transition hover:text-[#72e7ff]"><BrandLogo className="size-9" priority />GROWTHAI</Link>

          <div className="mx-auto max-w-2xl text-center">
            <p className="font-editorial text-[clamp(2.75rem,4.8vw,5.25rem)] font-normal italic leading-[.96] tracking-[-.035em] text-white/90">“A good life is noticed,<br />chosen, and practiced.”</p>
            <div className="mx-auto my-7 h-px w-12 bg-[#72e7ff]/70 shadow-[0_0_18px_rgba(114,231,255,.5)]" />
            <p className="text-[20px] text-primary font-semibold uppercase">GrowthAI · your private reflection space</p>
          </div>

          <div className="auth-snapshot mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#72e7ff]/25 bg-[#070b0d]/75 shadow-[0_20px_55px_rgba(0,0,0,.4)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2.5"><span className="live-dot size-2 rounded-full bg-[#72e7ff]" /><p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/80">Example growth snapshot</p></div>
              <p className="text-[11px] font-semibold text-white/50">This week</p>
            </div>

            <div className="grid md:grid-cols-[1.15fr_.85fr]">
              <div className="border-b border-white/10 p-4 md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#72e7ff]"><Sparkles className="size-4" />Current intention</p>
                  <span className="rounded-full bg-[#72e7ff] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#031014]">Wellbeing</span>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-[-.03em] text-white">Protect my mornings</p>
                <p className="mt-1.5 max-w-sm text-xs leading-5 text-white/60">Begin with enough quiet to choose my energy instead of immediately reacting.</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-white/70"><Check className="size-3.5 text-[#72e7ff]" />Ten minutes without my phone</div>
              </div>

              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-[.12em] text-white/60">Reflection rhythm</p>
                <div className="mt-2 flex items-end justify-between gap-3"><p className="font-editorial text-4xl italic leading-none text-white">5 <span className="text-xl text-white/40">/ 7</span></p><p className="text-[10px] font-semibold text-[#72e7ff]">honest days</p></div>
                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <div key={`${day}-${index}`} className="text-center"><span className={`mx-auto flex size-7 items-center justify-center rounded-full border text-[10px] font-bold ${index < 5 ? "border-[#72e7ff]/50 bg-[#72e7ff]/20 text-[#72e7ff]" : "border-white/15 bg-white/5 text-white/45"}`}>{index < 5 ? <Check className="size-3" /> : day}</span><span className="mt-1 block text-[9px] text-white/40">{day}</span></div>)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#72e7ff] px-4 py-3 text-[#031014]">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#031014]/10"><TrendingUp className="size-4" /></span>
              <div><p className="text-[10px] font-black uppercase tracking-[.13em] opacity-60">Pattern noticed</p><p className="mt-0.5 text-sm font-bold leading-5">Movement before lunch leads to calmer, more focused afternoons.</p></div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#070a0c]/90 p-6 backdrop-blur-2xl lg:col-span-5 lg:bg-[#070a0c]/97 sm:p-10 xl:p-14">
          <div className="pointer-events-none absolute -right-32 top-1/3 size-72 rounded-full bg-[#72e7ff]/5.5 blur-[90px]" />
          <div className="flex items-center justify-between">
            <Link href="/" className="font-display flex items-center gap-2 text-sm tracking-widest text-white lg:hidden"><BrandLogo className="size-8" priority />GROWTHAI</Link>
            <Link href="/" className="group ml-auto flex items-center gap-2 text-xs font-medium text-white/40 transition hover:text-white"><ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />Back</Link>
          </div>
          <main className="my-auto flex w-full justify-center py-14">{children}</main>
          <p className="text-center text-[9px] font-semibold uppercase tracking-[.18em] text-white/20">Private by default · designed for real life</p>
        </section>
      </div>
    </div>
  )
}
