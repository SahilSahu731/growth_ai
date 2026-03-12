import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const launchPrinciples: ReadonlyArray<string> = [
  "Start with one killer flow: Goal -> Daily Plan -> Weekly Tracker.",
  "Keep the first promise narrow and measurable.",
  "Optimize for week-one consistency wins, not feature count.",
]

const weeklyPlan: ReadonlyArray<{ week: string; focus: string; output: string }> = [
  {
    week: "Week 1",
    focus: "Nutrition baseline and calorie awareness",
    output: "Daily meal plan + 8k steps target",
  },
  {
    week: "Week 2",
    focus: "Strength and cardio routine",
    output: "4 workout sessions + 2 active recovery sessions",
  },
  {
    week: "Week 3",
    focus: "Behavior consistency",
    output: "Sleep schedule + evening check-in automation",
  },
]

const trackerRows: ReadonlyArray<{ label: string; value: number }> = [
  { label: "Daily completion", value: 67 },
  { label: "Weekly milestone", value: 45 },
  { label: "Target weight path", value: 39 },
]

export function MvpSection() {
  return (
    <section id="mvp" className="px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid w-full max-w-280 gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-start">
        <div className="animate-reveal">
          <Badge variant="outline" className="border-black/15 bg-white/70 text-(--landing-ink)">
            MVP To Launch First
          </Badge>
          <h2 className="mt-7 font-display text-3xl leading-tight text-(--landing-ink) sm:text-4xl lg:text-[2.75rem]">
            Pick one outcome and make users feel progress in the first 24 hours.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-(--landing-muted)">
            The strongest launch version of Growth_AI is not everything in life. It is one concrete goal
            flow that proves your system can create behavior change.
          </p>
          <div className="mt-7 space-y-2.5">
            {launchPrinciples.map((item) => (
              <p key={item} className="rounded-lg border border-black/10 bg-white/70 px-3 py-2 text-sm text-(--landing-ink)">
                {item}
              </p>
            ))}
          </div>
        </div>

        <Card className="motion-card animate-reveal rounded-2xl border border-black/10 bg-white/90 animate-delay-100">
          <CardHeader>
            <CardDescription className="text-[0.67rem] uppercase tracking-[0.18em] text-(--landing-muted)">
              MVP Simulation
            </CardDescription>
            <CardTitle className="font-display text-3xl text-(--landing-ink)">Goal: Lose 10kg</CardTitle>
            <p className="text-sm leading-6 text-(--landing-muted)">
              Input: I want to lose 10kg in 4 months. Growth_AI outputs this starter system.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pb-5">
            {weeklyPlan.map((item) => (
              <div key={item.week} className="rounded-xl border border-black/10 bg-(--landing-surface) p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--landing-accent)">{item.week}</p>
                <p className="mt-2 text-sm font-semibold text-(--landing-ink)">{item.focus}</p>
                <p className="text-xs text-(--landing-muted)">{item.output}</p>
              </div>
            ))}

            <div className="rounded-xl border border-black/10 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--landing-muted)">
                Progress Tracker
              </p>
              <div className="mt-3 space-y-3">
                {trackerRows.map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-(--landing-muted)">
                      <span>{row.label}</span>
                      <span>{row.value}%</span>
                    </div>
                    <Progress
                      value={row.value}
                      className="h-1.5 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
