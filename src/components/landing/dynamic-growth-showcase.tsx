"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronRight, Pause, Play, Sparkles } from "lucide-react"

const stories = [
  {
    area: "Product",
    title: "Ship the smallest useful beta",
    meaning: "Replace a vague launch plan with one testable user outcome.",
    step: "Write the three tasks required for one onboarding path.",
    prompt: "What became clearer after you reduced the scope?",
    response: "I stopped redesigning the dashboard and finished the first-user path.",
    insight: "Narrowing the deliverable may be helping you finish before polishing.",
    progress: 68,
    days: "6 days",
  },
  {
    area: "Client work",
    title: "Unblock a difficult proposal",
    meaning: "Turn an open-ended deliverable into a decision the client can answer.",
    step: "Draft two scope options with one tradeoff each.",
    prompt: "Which uncertainty was actually slowing the work?",
    response: "The missing decision was budget, not the presentation format.",
    insight: "Naming the decision may be reducing avoidable revision work.",
    progress: 82,
    days: "12 days",
  },
  {
    area: "Career",
    title: "Choose a credible next role",
    meaning: "Collect evidence about the work you want before rewriting every application.",
    step: "Compare two recent roles against three non-negotiables.",
    prompt: "What did the comparison rule out?",
    response: "I need ownership of outcomes more than a particular job title.",
    insight: "Concrete role evidence may be more useful than another broad career label.",
    progress: 54,
    days: "4 days",
  },
  {
    area: "Learning",
    title: "Apply one technical concept",
    meaning: "Replace passive collecting with a small example you can explain and test.",
    step: "Build one minimal example and write down the failure case.",
    prompt: "Which part only became clear when you used it?",
    response: "I understood the API boundary once the invalid input failed.",
    insight: "Small experiments may be producing stronger evidence than more reading.",
    progress: 74,
    days: "9 days",
  },
] as const

export function DynamicGrowthShowcase() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const story = stories[active]

  useEffect(() => {
    if (paused || reducedMotion) return
    const timer = window.setInterval(() => setActive((current) => (current + 1) % stories.length), 5200)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion])

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(query.matches)
    sync(); query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  function moveTab(index: number) {
    const next = (index + stories.length) % stories.length
    setActive(next); setPaused(true); tabs.current[next]?.focus()
  }

  return (
    <div
      className="mx-auto w-full max-w-5xl rounded-3xl border border-neutral-200/80 bg-neutral-100/70 p-2 shadow-[0_28px_90px_rgba(0,0,0,.5)] backdrop-blur sm:p-3.5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onPointerDown={() => setPaused(true)}
    >
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-left sm:p-6">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[.14em] text-neutral-400">Interactive walkthrough · synthetic example data</p>
        <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-yellow-400" />
            <span className="live-dot size-2.5 rounded-full bg-green-400" />
            <span className="ml-2 font-mono text-[10px] tracking-wider text-neutral-400">growthai.app/today</span>
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-full border border-neutral-200 bg-neutral-100 p-1" role="tablist" aria-label="Preview a life area" aria-orientation="horizontal">
            {stories.map((item, index) => (
              <button
                key={item.area}
                type="button"
                role="tab"
                id={`growth-story-tab-${index}`}
                aria-controls={`growth-story-panel-${index}`}
                aria-selected={active === index}
                tabIndex={active === index ? 0 : -1}
                ref={(element) => { tabs.current[index] = element }}
                onClick={() => { setActive(index); setPaused(true) }}
                onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); moveTab(index + 1) } else if (event.key === "ArrowLeft") { event.preventDefault(); moveTab(index - 1) } else if (event.key === "Home") { event.preventDefault(); moveTab(0) } else if (event.key === "End") { event.preventDefault(); moveTab(stories.length - 1) } }}
                className={`min-h-11 shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active === index ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}
              >
                {item.area}
              </button>
            ))}
          </div>
        </div>

        <div key={story.area} id={`growth-story-panel-${active}`} role="tabpanel" aria-labelledby={`growth-story-tab-${active}`} className="animate-reveal grid gap-5 pt-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Your current intention</p>
                <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">{story.title}</h3>
              </div>
              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold text-neutral-500">{story.area}</span>
            </div>
            <p className="mt-3 text-xs leading-6 text-neutral-500">{story.meaning}</p>
            <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">One next step</p>
                <span className="text-[10px] font-bold text-neutral-400">{story.progress}% rhythm</span>
              </div>
              <p className="mt-2 text-sm font-bold">{story.step}</p>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-neutral-200">
                <div className="dynamic-progress h-full rounded-full bg-neutral-950" style={{ width: `${story.progress}%` }} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-neutral-400"><Check className="size-3" />A step sized for today</div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-neutral-200 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-neutral-400">Live reflection</p>
                <span className="font-editorial text-2xl italic">{story.days}</span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6">{story.prompt}</p>
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3 text-[11px] leading-5 text-neutral-500">“{story.response}”</div>
            </div>
            <div className="group rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-neutral-400"><Sparkles className="size-3.5 text-neutral-950" />Pattern noticed</div>
              <p className="mt-2 text-xs font-semibold leading-6 text-neutral-600">{story.insight}</p>
              <span className="mt-3 flex items-center gap-1 text-[10px] font-bold text-neutral-400">See why GrowthAI noticed this <ChevronRight className="size-3 transition group-hover:translate-x-0.5" /></span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3"><button type="button" aria-pressed={paused || reducedMotion} disabled={reducedMotion} onClick={() => setPaused((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-neutral-200 px-4 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default disabled:opacity-75">{reducedMotion ? <><Pause className="size-3.5" />Auto-rotation off</> : paused ? <><Play className="size-3.5" />Resume preview</> : <><Pause className="size-3.5" />Pause preview</>}</button><div className="flex gap-1.5" aria-hidden>
          {stories.map((item, index) => <span key={item.area} className={`h-1 rounded-full transition-all duration-500 ${index === active ? "w-8 bg-neutral-950" : "w-2 bg-neutral-200"}`} />)}
        </div></div>
      </div>
    </div>
  )
}
