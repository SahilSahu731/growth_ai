"use client"

import { useEffect, useState } from "react"
import { Check, ChevronRight, Sparkles } from "lucide-react"

const stories = [
  {
    area: "Health",
    title: "Feel at home in my body again",
    meaning: "Move with care four times a week and notice more energy—not chase a number.",
    step: "Take a 20-minute walk before lunch.",
    prompt: "What felt different after you moved today?",
    response: "I almost skipped it, but the shorter walk made starting feel easy.",
    insight: "Smaller plans are helping you begin without negotiating with yourself.",
    progress: 68,
    days: "6 days",
  },
  {
    area: "Relationships",
    title: "Be more present with people I love",
    meaning: "Create small, consistent moments of attention instead of waiting for perfect free time.",
    step: "Send Mum a voice note after work.",
    prompt: "Where did you choose connection over convenience?",
    response: "I called for ten minutes instead of postponing it to the weekend.",
    insight: "Short, real contact is becoming more valuable than the perfect long conversation.",
    progress: 82,
    days: "12 days",
  },
  {
    area: "Learning",
    title: "Become curious again",
    meaning: "Read and explore because it expands me, not because it needs to become an achievement.",
    step: "Read five pages with my phone in another room.",
    prompt: "What idea stayed with you today?",
    response: "I stopped at seven pages and wrote one question I want to follow.",
    insight: "Removing the output target is making it easier for curiosity to return.",
    progress: 54,
    days: "4 days",
  },
  {
    area: "Wellbeing",
    title: "Protect a quieter mind",
    meaning: "Build enough space into ordinary days to hear what I actually need.",
    step: "Take ten screen-free minutes before bed.",
    prompt: "What did the quiet make easier to notice?",
    response: "I was more tired than unmotivated, so I chose sleep instead of pushing through.",
    insight: "Rest is becoming useful information, rather than something you have to earn.",
    progress: 74,
    days: "9 days",
  },
] as const

export function DynamicGrowthShowcase() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const story = stories[active]

  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => setActive((current) => (current + 1) % stories.length), 5200)
    return () => window.clearInterval(timer)
  }, [paused])

  return (
    <div
      className="mx-auto w-full max-w-5xl rounded-3xl border border-neutral-200/80 bg-neutral-100/70 p-2 shadow-[0_28px_90px_rgba(0,0,0,.5)] backdrop-blur sm:p-3.5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-left sm:p-6">
        <div className="flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-red-400" />
            <span className="size-2.5 rounded-full bg-yellow-400" />
            <span className="live-dot size-2.5 rounded-full bg-green-400" />
            <span className="ml-2 font-mono text-[10px] tracking-wider text-neutral-400">growthai.app/today</span>
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-full border border-neutral-200 bg-neutral-100 p-1" role="tablist" aria-label="Preview a life area">
            {stories.map((item, index) => (
              <button
                key={item.area}
                type="button"
                role="tab"
                aria-selected={active === index}
                onClick={() => setActive(index)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold transition ${active === index ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                {item.area}
              </button>
            ))}
          </div>
        </div>

        <div key={story.area} className="animate-reveal grid gap-5 pt-5 lg:grid-cols-[1.05fr_.95fr]">
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

        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
          {stories.map((item, index) => <span key={item.area} className={`h-1 rounded-full transition-all duration-500 ${index === active ? "w-8 bg-neutral-950" : "w-2 bg-neutral-200"}`} />)}
        </div>
      </div>
    </div>
  )
}
