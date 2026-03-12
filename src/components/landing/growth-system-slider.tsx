"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const slides: ReadonlyArray<{
  label: string
  title: string
  copy: string
}> = [
  {
    label: "Input",
    title: "I want to become a software engineer in 6 months",
    copy: "Growth_AI turns one broad goal into realistic, day-level execution.",
  },
  {
    label: "System",
    title: "Week 1: Python basics, 2h/day, calculator mini-project",
    copy: "A structured plan appears instantly with scoped learning blocks and builds.",
  },
  {
    label: "Adapt",
    title: "Missed tasks detected. Evening plan optimized for 8:30 PM",
    copy: "The system adjusts based on behavior so progress keeps moving forward.",
  },
]

const INTERVAL_MS = 3600

export function GrowthSystemSlider() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section className="px-4 pb-16 sm:px-6 lg:pb-20">
      <div className="mx-auto w-full max-w-280 animate-reveal animate-delay-200">
        <div
          className="overflow-hidden rounded-2xl border border-black/10 bg-white/75"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
        >
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide) => (
              <Card
                key={slide.title}
                className="w-full shrink-0 border-0 bg-transparent shadow-none ring-0"
              >
                <CardContent className="px-6 py-8 sm:px-8 sm:py-9">
                  <Badge
                    variant="outline"
                    className="border-(--landing-accent)/25 bg-(--landing-accent-soft) text-(--landing-accent)"
                  >
                    {slide.label}
                  </Badge>
                  <p className="mt-4 max-w-4xl font-display text-2xl leading-tight text-(--landing-ink) sm:text-[2rem]">
                    {slide.title}
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-(--landing-muted)">
                    {slide.copy}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-black/8 px-4 py-3">
            {slides.map((slide, index) => (
              <button
                key={slide.label}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  activeIndex === index
                    ? "w-7 bg-(--landing-accent)"
                    : "w-3 bg-black/20 hover:bg-black/35"
                )}
                aria-label={`Show ${slide.label} slide`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
