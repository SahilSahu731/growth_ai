import Link from "next/link"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingComparison } from "@/components/landing/landing-comparison"
import { LandingFAQ } from "@/components/landing/landing-faq"
import { LandingCTA } from "@/components/landing/landing-cta"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-blue-950/5 to-zinc-950 text-white">
      {/* Subtle animated background */}
      <div className="fixed inset-0 -z-10 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute top-1/2 left-0 size-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-cyan-300 font-bold text-zinc-950">
              P
            </span>
            <span className="text-lg">PickAI</span>
          </Link>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild className="rounded-full bg-blue-500 text-white hover:bg-blue-600">
                <Link href="/dashboard">Open app</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-full text-zinc-300 hover:bg-zinc-800 hover:text-white">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-medium">
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <LandingHero session={session} />

      {/* Features Grid */}
      <LandingFeatures />

      {/* Live Comparison Demo */}
      <LandingComparison session={session} />

      {/* How it works / Social proof */}
      <LandingCTA />

      {/* FAQ */}
      <LandingFAQ />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950/50 py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-cyan-300 font-bold text-xs text-zinc-950">
                P
              </span>
              <span className="font-semibold">PickAI</span>
            </div>
            <p className="text-sm text-zinc-500">
              © 2026 PickAI. Compare better, decide faster.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
