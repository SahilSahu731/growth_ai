"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const slides: ReadonlyArray<{
  label: string
  title: string
  description: string
  metricLabel: string
  metricValue: string
}> = [
  {
    label: "Goal to system",
    title: "Turn one ambition into a real weekly execution plan",
    description:
      "Growth_AI breaks your target into focused actions you can finish every day, not vague motivation.",
    metricLabel: "Average weekly completion",
    metricValue: "82%",
  },
  {
    label: "Adaptive accountability",
    title: "When consistency drops, your plan adjusts automatically",
    description:
      "The system reshapes workload, timing, and task sequence based on real behavior patterns.",
    metricLabel: "Completion uplift after adaptation",
    metricValue: "+31%",
  },
  {
    label: "Compounding progress",
    title: "Small daily wins build long-term momentum",
    description:
      "Track streaks, milestones, and skill growth from one simple dashboard designed for follow-through.",
    metricLabel: "Milestones reached in first month",
    metricValue: "4.2x",
  },
]

const AUTO_ADVANCE_MS = 4600

export function AuthShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, AUTO_ADVANCE_MS)

    return () => clearInterval(timer)
  }, [])

  return (
    <aside className="order-2 animate-reveal rounded-[2rem] border border-black/10 bg-white/74 p-5 shadow-2xl shadow-amber-950/10 backdrop-blur-sm sm:p-8 lg:p-10">
      <Badge variant="outline" className="border-black/15 bg-white/70 text-(--landing-ink)">
        Growth Intelligence
      </Badge>
      <h2 className="mt-5 font-display text-3xl leading-tight text-(--landing-ink) sm:text-4xl">
        Build momentum with an AI system that learns how you work.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-(--landing-muted)">
        Structured planning, daily accountability, and behavior-aware adaptation in one clean workflow.
      </p>

      <div className="mt-7 overflow-hidden rounded-2xl border border-black/10 bg-(--landing-surface)">
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <article key={slide.title} className="w-full shrink-0 px-6 py-7 sm:px-8 sm:py-8">
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-(--landing-accent)">{slide.label}</p>
              <h3 className="mt-3 font-display text-2xl leading-tight text-(--landing-ink) sm:text-[2rem]">
                {slide.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-(--landing-muted)">{slide.description}</p>

              <div className="mt-5 rounded-xl border border-black/10 bg-white px-4 py-3">
                <p className="text-[0.66rem] uppercase tracking-[0.18em] text-(--landing-muted)">{slide.metricLabel}</p>
                <p className="mt-1.5 font-display text-[2rem] leading-none text-(--landing-ink)">{slide.metricValue}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-xs leading-6 text-(--landing-muted)">
          Adaptive accountability that evolves with your real-world patterns.
        </p>
        <div className="flex items-center gap-1.5">
          {slides.map((slide, index) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex ? "w-7 bg-(--landing-accent)" : "w-3 bg-black/18 hover:bg-black/30"
              )}
              aria-label={`Show ${slide.label} slide`}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}