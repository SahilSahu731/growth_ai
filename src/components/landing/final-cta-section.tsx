import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const visionTracks: ReadonlyArray<string> = ["Career Growth", "Fitness", "Learning", "Business", "Productivity"]

export function FinalCtaSection() {
  return (
    <section id="cta" className="px-4 pb-24 pt-18 sm:px-6 lg:pb-28 lg:pt-20">
      <div className="mx-auto w-full max-w-280">
        <Card className="animate-reveal overflow-hidden rounded-3xl border border-black/10 bg-(--landing-ink) text-(--landing-surface) shadow-2xl shadow-amber-950/20">
          <CardContent className="grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-12">
            <div>
              <Badge className="bg-(--landing-accent) text-white">Long-Term Vision</Badge>
              <h2 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">
                Become the personal operating system for self-improvement.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-(--landing-surface)/80 sm:text-base">
                Think Duolingo + Notion + AI Coach in one focused workflow.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {visionTracks.map((track) => (
                  <span
                    key={track}
                    className="rounded-full border border-white/25 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.14em] text-(--landing-surface)/85"
                  >
                    {track}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xs sm:p-6">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-(--landing-surface)/75">Tagline</p>
              <p className="mt-3 font-display text-3xl leading-tight text-(--landing-surface)">
                Your AI Coach for Real Progress.
              </p>
              <p className="mt-4 text-sm leading-7 text-(--landing-surface)/80">
                Start with one clear goal. Growth_AI builds the roadmap and keeps your momentum alive.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-11 rounded-full bg-(--landing-surface) px-6 text-[0.72rem] uppercase tracking-[0.15em] text-(--landing-ink) hover:bg-white"
                >
                  <Link href="#top">Build My Growth Plan</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 rounded-full border-white/30 bg-transparent px-6 text-[0.72rem] uppercase tracking-[0.15em] text-(--landing-surface) hover:bg-white/12"
                >
                  <Link href="#mvp">See MVP Demo</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-(--landing-muted)">
          <p>Growth_AI - Turn Your Goals Into Systems.</p>
          <p>Built for consistency, accountability, and adaptive growth.</p>
        </footer>
      </div>
    </section>
  )
}
