"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Session } from "next-auth"

export function LandingHero({ session }: { session: Session | null }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
      <div className="text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <span className="text-xs font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            ✨ AI Decision Engine
          </span>
        </div>

        {/* Main heading */}
        <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Stop overthinking.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400">
            Make better choices
          </span>
          .
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 leading-8">
          PickAI turns confusing decisions into beautiful comparisons. Compare products, apartments, job offers, cars, schools—anything. Get weighted scoring, hidden costs, risks, live research, smart questions to ask, and AI recommendations.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-blue-500/30 font-semibold px-8">
            <Link href={session?.user ? "/compare/new" : "/signup"}>
              Start comparing
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 text-white hover:bg-white/5">
            <Link href="/login">
              Log in
            </Link>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span>Free to start</span>
          </div>
          <div className="h-px w-12 bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔒</span>
            <span>Private & secure</span>
          </div>
          <div className="h-px w-12 bg-white/10"></div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span>Instant results</span>
          </div>
        </div>

        {/* Hero image placeholder - comparison table preview */}
        <div className="mt-16 mx-auto max-w-5xl rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-8 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Price Range", value: "$800-1500" },
              { label: "Performance", value: "★★★★★" },
              { label: "Battery Life", value: "14-16 hrs" },
              { label: "Warranty", value: "2-3 years" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-white/5 p-4 border border-white/5">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-xs text-zinc-600">
            Example: Compare laptops, apartments, job offers, or anything else
          </div>
        </div>
      </div>
    </section>
  )
}
