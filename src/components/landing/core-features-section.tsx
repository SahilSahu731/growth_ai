import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const coreFeatures: ReadonlyArray<{
  id: string
  title: string
  summary: string
}> = [
  {
    id: "01",
    title: "Developer Roadmap Engine",
    summary: "Turn project, skill, interview, and work goals into phased engineering sprints.",
  },
  {
    id: "02",
    title: "Coding Session Evidence",
    summary: "Log focused work, shipped outcomes, blockers, energy, and focus quality.",
  },
  {
    id: "03",
    title: "Skill Graph",
    summary: "Track current level, target level, confidence, and proof-of-work signals.",
  },
  {
    id: "04",
    title: "Proof-of-Work Projects",
    summary: "Manage repo-ready projects, stack decisions, live links, and portfolio readiness.",
  },
  {
    id: "05",
    title: "AI Weekly Reviews",
    summary: "Get a senior-dev style review of what shipped, what blocked you, and what to do next.",
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
              Not another todo app. A developer cockpit for visible progress.
            </h2>
          </div>
          <Card className="max-w-[20rem] rounded-xl border border-black/10 bg-white/70 p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.15em] text-(--landing-muted)">Unique Angle</p>
            <p className="mt-2 text-sm leading-6 text-(--landing-ink)">
              Growth_AI connects goals, projects, sessions, skills, and weekly reviews into one developer operating loop.
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
