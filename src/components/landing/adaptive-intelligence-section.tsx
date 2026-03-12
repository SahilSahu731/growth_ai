import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const behavioralSignals: ReadonlyArray<{
  signal: string
  observation: string
}> = [
  {
    signal: "Skip pattern",
    observation: "User misses tasks after day 3 when sessions are longer than 90 minutes.",
  },
  {
    signal: "Energy window",
    observation: "Completion rates rise 31% for sessions scheduled after 8 PM.",
  },
  {
    signal: "Motivation trigger",
    observation: "Momentum improves when first task can be finished in under 20 minutes.",
  },
]

const adaptations: ReadonlyArray<string> = [
  "Split heavy sessions into two 45-minute blocks.",
  "Schedule deep work in the user's highest-completion time window.",
  "Start each day with a small guaranteed-win task.",
]

export function AdaptiveIntelligenceSection() {
  return (
    <section id="adaptive" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid w-full max-w-280 gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="animate-reveal">
          <Badge variant="outline" className="border-black/15 bg-white/70 text-(--landing-ink)">
            YC-Level Edge
          </Badge>
          <h2 className="mt-7 font-display text-3xl leading-tight text-(--landing-ink) sm:text-4xl lg:text-[2.75rem]">
            Adaptive growth intelligence is the real moat.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-(--landing-muted)">
            Plan generation is easy to copy. Behavioral adaptation is not. Growth_AI should detect
            patterns and reshape execution continuously.
          </p>
          <div className="mt-6 rounded-xl border border-black/10 bg-white/80 p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-(--landing-muted)">Simplest Explanation</p>
            <p className="mt-2 text-sm leading-6 text-(--landing-ink)">
              Growth_AI is an AI that turns your goals into daily systems and keeps you accountable.
            </p>
          </div>
        </div>

        <Card className="motion-card animate-reveal rounded-2xl border border-black/10 bg-white/90 animate-delay-100">
          <CardHeader>
            <CardDescription className="text-[0.67rem] uppercase tracking-[0.18em] text-(--landing-muted)">
              Behavioral Tracking Loop
            </CardDescription>
            <CardTitle className="font-display text-3xl text-(--landing-ink)">
              Observe -&gt; Adapt -&gt; Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            {behavioralSignals.map((item) => (
              <div key={item.signal} className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--landing-accent)">{item.signal}</p>
                <p className="mt-2 text-sm leading-6 text-(--landing-ink)">{item.observation}</p>
              </div>
            ))}

            <div className="rounded-xl border border-black/10 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--landing-muted)">AI Adaptation Output</p>
              <div className="mt-3 space-y-2">
                {adaptations.map((item) => (
                  <p key={item} className="rounded-md bg-(--landing-accent-soft) px-2.5 py-2 text-sm text-(--landing-ink)">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
