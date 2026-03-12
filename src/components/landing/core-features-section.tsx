import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const coreFeatures: ReadonlyArray<{
  id: string
  title: string
  summary: string
}> = [
  {
    id: "01",
    title: "Goal to System Converter",
    summary: "Turn one ambition into a day-by-day plan with realistic weekly milestones.",
  },
  {
    id: "02",
    title: "Daily Accountability AI",
    summary: "Track completion each day and automatically adapt when momentum drops.",
  },
  {
    id: "03",
    title: "Progress Dashboard",
    summary: "Visualize streaks, skill growth, and time invested at a glance.",
  },
  {
    id: "04",
    title: "Anti-Procrastination Mode",
    summary: "Launch instant focus sessions and immediate next actions when distracted.",
  },
  {
    id: "05",
    title: "Learning Navigator",
    summary: "Get a curated path with resources and projects in the right sequence.",
  },
]

export function CoreFeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto w-full max-w-280">
        <div className="animate-reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-164">
            <Badge variant="outline" className="border-black/15 bg-white/70 text-(--landing-ink)">
              Core Features
            </Badge>
            <h2 className="mt-6 font-display text-3xl leading-tight text-(--landing-ink) sm:text-4xl lg:text-[2.8rem]">
              Not a chat wrapper. A system engine for execution.
            </h2>
          </div>
          <Card className="max-w-[20rem] rounded-xl border border-black/10 bg-white/70 p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.15em] text-(--landing-muted)">Unique Angle</p>
            <p className="mt-2 text-sm leading-6 text-(--landing-ink)">
              ChatGPT answers questions. Growth_AI builds and runs life systems.
            </p>
          </Card>
        </div>

        <div className="mt-10 divide-y divide-black/10 rounded-2xl border border-black/10 bg-white/72">
          {coreFeatures.map((feature, index) => (
            <article
              key={feature.id}
              className="animate-reveal grid gap-3 px-5 py-6 sm:grid-cols-[3.5rem_1fr] sm:gap-5 sm:px-6"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-(--landing-accent-soft) text-xs font-semibold tracking-[0.12em] text-(--landing-accent)">
                {feature.id}
              </span>
              <div>
                <h3 className="font-display text-[1.6rem] leading-tight text-(--landing-ink)">{feature.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-(--landing-muted)">{feature.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
