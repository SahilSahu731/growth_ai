import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const analysisPoints: ReadonlyArray<{ title: string; description: string }> = [
  {
    title: "Category",
    description: "Personal growth operating system, not a generic AI assistant.",
  },
  {
    title: "Core Job",
    description: "Transform goals into daily, adaptive execution plans.",
  },
  {
    title: "Defensible Edge",
    description: "Behavioral tracking and accountability loops that improve over time.",
  },
]

const frictionPoints: ReadonlyArray<{ title: string; description: string }> = [
  {
    title: "Too many goals",
    description: "Users chase coding, fitness, business, and reading at once.",
  },
  {
    title: "Too much information",
    description: "Advice is everywhere, but direction is missing.",
  },
  {
    title: "No clear path",
    description: "People do not know what to do today, this week, or next.",
  },
  {
    title: "No accountability",
    description: "Without check-ins, momentum collapses after a few days.",
  },
]

export function ProductThesisSection() {
  return (
    <section id="why" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto w-full max-w-280">
        <div className="animate-reveal max-w-180">
          <Badge variant="outline" className="border-black/15 bg-white/70 text-(--landing-ink)">
            Product Analysis
          </Badge>
          <h2 className="mt-7 font-display text-3xl leading-tight text-(--landing-ink) sm:text-4xl lg:text-[2.85rem]">
            People do not fail because of lack of knowledge. They fail because they lack structure and
            accountability.
          </h2>
          <p className="mt-6 max-w-152 text-base leading-8 text-(--landing-muted)">
            This should feel like an operating system for progress: fewer decisions, clearer daily actions,
            and accountability that adapts when life gets messy.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {analysisPoints.map((point, index) => (
            <Card
              key={point.title}
              className="motion-card animate-reveal rounded-xl border border-black/10 bg-white/80"
              style={{ animationDelay: `${110 + index * 120}ms` }}
            >
              <CardHeader>
                <CardDescription className="text-[0.67rem] uppercase tracking-[0.16em] text-(--landing-muted)">
                  {point.title}
                </CardDescription>
                <CardTitle className="font-display text-[1.7rem] leading-tight text-(--landing-ink)">
                  {point.description}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {frictionPoints.map((point, index) => (
            <Card
              key={point.title}
              className="animate-reveal rounded-xl border border-black/10 bg-(--landing-surface)"
              style={{ animationDelay: `${180 + index * 70}ms` }}
            >
              <CardHeader className="pb-0">
                <CardTitle className="text-base font-semibold text-(--landing-ink)">{point.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-(--landing-muted)">{point.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
