import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import Link from "next/link"

import { authOptions } from "@/auth"
import { AuthShowcase } from "@/components/auth/auth-showcase"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="landing-atmosphere auth-shell relative min-h-screen overflow-x-clip px-3 py-3 sm:px-5 sm:py-5 lg:px-7 lg:py-7">
      <div className="ambient-orb pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-amber-200/10 blur-[110px]" />
      <div className="ambient-orb pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-violet-400/10 blur-[130px] [animation-delay:1.5s]" />

      <div className="relative z-10 mx-auto w-full max-w-[1440px]">
        <header className="flex items-center justify-between px-2 py-2 sm:px-4">
          <Link href="/" className="font-display text-lg tracking-wide text-(--landing-ink) transition hover:opacity-70 sm:text-xl">
            GROWTHAI
          </Link>
          <Link href="/" className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-(--landing-muted) backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:text-sm">
            <span className="transition group-hover:-translate-x-0.5">←</span> Back home
          </Link>
        </header>

        <div className="mt-3 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(28rem,.88fr)]">
          <div className="hidden lg:block">
            <AuthShowcase />
          </div>
          <main className="flex min-h-[calc(100vh-7rem)] w-full items-center justify-center py-4 lg:py-8">
            <div className="w-full max-w-[34rem]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
