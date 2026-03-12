import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type DailyTask = {
  title: string
  time: string
  complete: boolean
}

const dailyTasks: ReadonlyArray<DailyTask> = [
  { title: "Python fundamentals", time: "2h", complete: true },
  { title: "Mini project sprint", time: "45m", complete: true },
  { title: "Daily check-in", time: "5m", complete: false },
]

const skillMeters: ReadonlyArray<{ label: string; value: number }> = [
  { label: "Consistency streak", value: 72 },
  { label: "Weekly momentum", value: 84 },
]

export function HeroSection() {
  return (
    <section id="top" className="px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:pb-28 lg:pt-28">
      <div className="mx-auto grid w-full max-w-280 gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
        <div className="animate-reveal">
          <Badge
            variant="outline"
            className="border-(--landing-accent)/25 bg-(--landing-accent-soft) text-(--landing-accent)"
          >
            Growth_AI
          </Badge>
          <h1 className="mt-7 max-w-3xl font-display text-4xl leading-[1.02] tracking-tight text-(--landing-ink) sm:text-5xl lg:text-[4rem]">
            Turn ambitious goals into a daily system that actually gets done.
          </h1>
          <p className="mt-7 max-w-152 text-[1.02rem] leading-8 text-(--landing-muted)">
            Growth_AI translates one goal into clear daily actions, tracks completion, and adapts your
            plan when consistency breaks.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-10 rounded-full bg-(--landing-ink) px-6 text-xs text-(--landing-surface) hover:bg-(--landing-accent)"
            >
              <Link href="#cta">Build My Growth Plan</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-10 rounded-full border-black/15 bg-white/70 px-6 text-xs text-(--landing-ink) hover:bg-white"
            >
              <Link href="#features">Explore Core Features</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-(--landing-muted)">
            Goals are easy. Systems are hard. We build them.
          </p>
        </div>

        <div className="animate-reveal animate-delay-100">
          <Card className="motion-card rounded-2xl border border-black/10 bg-white/92 shadow-xl shadow-amber-950/8 backdrop-blur-sm">
            <CardHeader>
              <CardDescription className="text-[0.67rem] uppercase tracking-[0.14em] text-(--landing-muted)">
                Daily Accountability AI
              </CardDescription>
              <CardTitle className="font-display text-[2rem] leading-tight text-(--landing-ink)">
                Today&apos;s System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pb-5">
              <div className="space-y-2.5">
                {dailyTasks.map((task) => (
                  <div
                    key={task.title}
                    className="flex items-center justify-between rounded-xl border border-black/10 bg-(--landing-surface) px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "inline-flex size-3.5 shrink-0 rounded-full border",
                          task.complete
                            ? "border-(--landing-accent) bg-(--landing-accent)"
                            : "border-black/20 bg-transparent"
                        )}
                      />
                      <p className="text-sm font-medium text-(--landing-ink)">{task.title}</p>
                    </div>
                    <p className="text-xs text-(--landing-muted)">{task.time}</p>
                  </div>
                ))}
              </div>

              <Separator className="bg-black/10" />

              <div className="space-y-3.5">
                {skillMeters.map((meter) => (
                  <div key={meter.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-(--landing-muted)">
                      <span>{meter.label}</span>
                      <span>{meter.value}%</span>
                    </div>
                    <Progress
                      value={meter.value}
                      className="h-1.5 rounded-full bg-(--landing-accent-soft) *:data-[slot=progress-indicator]:bg-(--landing-accent)"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-(--landing-accent)/20 bg-(--landing-accent-soft) p-3.5 text-sm leading-6 text-(--landing-ink)">
                You missed one task yesterday. Growth_AI shifted your deep work block to your highest
                completion window.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
