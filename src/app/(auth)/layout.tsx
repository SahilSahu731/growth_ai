import Link from "next/link"

import { AuthShowcase } from "@/components/auth/auth-showcase"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-atmosphere relative min-h-screen overflow-x-clip px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-[rgba(168,90,45,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-[rgba(232,210,187,0.28)] blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-[1340px]">
        <header className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/84 px-4 py-3 backdrop-blur sm:rounded-full sm:px-6">
          <Link href="/" className="font-display text-xl tracking-tight text-(--landing-ink) sm:text-2xl">
            Growth_AI
          </Link>
          <Link href="/" className="text-xs text-(--landing-muted) underline-offset-4 hover:underline sm:text-sm">
            Back to Home
          </Link>
        </header>

        <div className="mt-4 rounded-2xl border border-black/10 bg-white/70 px-4 py-3 lg:hidden">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-(--landing-muted)">Growth Intelligence</p>
          <p className="mt-1 text-sm leading-6 text-(--landing-muted)">
            Turn goals into systems with adaptive accountability.
          </p>
        </div>

        <div className="mt-5 grid gap-6 lg:mt-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:gap-8">
          <main className="order-1 mx-auto w-full max-w-[42rem]">{children}</main>
          <div className="order-2 hidden lg:block">
            <AuthShowcase />
          </div>
        </div>
      </div>
    </div>
  )
}
