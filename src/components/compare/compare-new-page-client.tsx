"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  FileSearch,
  ListChecks,
  SearchCheckIcon,
  ShieldAlert,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { ComparisonCategory } from "@/lib/db"

const categories: Array<{ value: ComparisonCategory; label: string; description: string }> = [
  { value: "product", label: "Products", description: "Phones, laptops, cars, appliances" },
  { value: "finance", label: "Finance", description: "Loans, insurance, cards, investments" },
  { value: "housing", label: "Housing", description: "Apartments, homes, neighborhoods" },
  { value: "career", label: "Career", description: "Job offers, companies, roles" },
  { value: "education", label: "Education", description: "Courses, schools, programs" },
  { value: "software", label: "Software", description: "Apps, subscriptions, tools" },
  { value: "travel", label: "Travel", description: "Flights, hotels, plans" },
  { value: "healthcare", label: "Healthcare", description: "Plans, treatments, providers" },
  { value: "services", label: "Services", description: "Agencies, contractors, vendors" },
  { value: "custom", label: "Custom", description: "Anything else" },
]

export function CompareNewPageClient({ initialExample = "" }: { initialExample?: string }) {
  const router = useRouter()
  const [leftOption, setLeftOption] = useState(initialExample)
  const [rightOption, setRightOption] = useState("")
  const [category, setCategory] = useState<ComparisonCategory>("product")
  const [comparisonFocus, setComparisonFocus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()

    if (!leftOption.trim() || !rightOption.trim()) {
      setError("Add both options before starting research.")
      return
    }

    if (!comparisonFocus.trim()) {
      setError("Describe what matters in this decision.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/compare/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          option1: leftOption.trim(),
          option2: rightOption.trim(),
          category,
          description: comparisonFocus.trim(),
        }),
      })

      const payload = (await response.json().catch(() => null)) as { comparisonId?: string; error?: string } | null

      if (response.status === 401) {
        router.push("/signup")
        return
      }

      if (!response.ok || !payload?.comparisonId) {
        throw new Error(payload?.error ?? "Could not start comparison.")
      }

      router.push(`/compare/${payload.comparisonId}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not start comparison.")
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#171717] shadow-2xl shadow-black/30">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#10a37f]/30 bg-[#10a37f]/10 px-3 py-1 text-xs font-medium text-[#7de2ca]">
            <SearchCheckIcon className="size-3.5" />
            live research + scoring engine
          </div>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Compare anything with evidence, not vibes.
            </h1>
            <p className="text-sm leading-7 text-zinc-400 sm:text-base">
              Enter two choices, pick the decision type, and describe what matters. PickAI researches the options, builds weighted criteria, exposes hidden costs, and turns it into a clear recommendation.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 p-5 sm:p-7">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="group block rounded-2xl border border-white/10 bg-[#212121] p-4 transition focus-within:border-[#10a37f]/60">
              <span className="mb-3 flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-white text-sm font-semibold text-[#171717]">A</span>
                <span>
                  <span className="block text-sm font-semibold text-white">First option</span>
                  <span className="block text-xs text-zinc-500">Product, place, plan, offer, service...</span>
                </span>
              </span>
              <Input
                placeholder="MacBook Air M3"
                value={leftOption}
                onChange={(event) => {
                  setLeftOption(event.target.value)
                  setError("")
                }}
                className="h-12 border-white/10 bg-[#2f2f2f] text-base text-white placeholder:text-zinc-500"
                disabled={isLoading}
              />
            </label>

            <label className="group block rounded-2xl border border-white/10 bg-[#212121] p-4 transition focus-within:border-[#10a37f]/60">
              <span className="mb-3 flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-[#10a37f] text-sm font-semibold text-[#08130f]">B</span>
                <span>
                  <span className="block text-sm font-semibold text-white">Second option</span>
                  <span className="block text-xs text-zinc-500">The alternative you are considering</span>
                </span>
              </span>
              <Input
                placeholder="Dell XPS 13"
                value={rightOption}
                onChange={(event) => {
                  setRightOption(event.target.value)
                  setError("")
                }}
                className="h-12 border-white/10 bg-[#2f2f2f] text-base text-white placeholder:text-zinc-500"
                disabled={isLoading}
              />
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#212121] p-4">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Category</h2>
                <p className="text-xs text-zinc-500">This changes the research questions, hidden-cost model, and scoring criteria.</p>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">lens/{category}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  disabled={isLoading}
                  className={
                    category === item.value
                      ? "rounded-xl border border-[#10a37f] bg-[#10a37f]/15 p-3 text-left shadow-[0_0_0_1px_rgba(16,163,127,0.2)]"
                      : "rounded-xl border border-white/10 bg-[#2f2f2f] p-3 text-left transition hover:border-white/25 hover:bg-white/10"
                  }
                >
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{item.description}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="block rounded-2xl border border-white/10 bg-[#212121] p-4">
            <span className="mb-3 flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-white">What do you want to compare?</span>
                <span className="block text-xs text-zinc-500">Add priorities, constraints, budget, timeline, or dealbreakers.</span>
              </span>
              <Sparkles className="hidden size-4 text-[#10a37f] sm:block" />
            </span>
            <Textarea
              placeholder="I care most about total cost over 3 years, reliability, warranty, hidden fees, setup time, and resale value."
              value={comparisonFocus}
              onChange={(event) => {
                setComparisonFocus(event.target.value)
                setError("")
              }}
              className="min-h-32 resize-none border-white/10 bg-[#2f2f2f] text-white placeholder:text-zinc-500"
              disabled={isLoading}
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading || !leftOption.trim() || !rightOption.trim() || !comparisonFocus.trim()}
            className="h-12 w-full rounded-xl bg-[#10a37f] text-base font-semibold text-[#06130f] hover:bg-[#13b88f]"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2" /> Running deep research
              </>
            ) : (
              <>
                Run comparison research
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-[#171717] p-5">
          <h2 className="text-sm font-semibold text-white">What PickAI builds</h2>
          <div className="mt-5 space-y-4">
            {[
              { icon: FileSearch, title: "Source-backed research", text: "Current claims are tied to research cards when Tavily is configured." },
              { icon: ListChecks, title: "Weighted scoring", text: "Criteria and weights are generated from your situation, then recalculated in the workspace." },
              { icon: ShieldAlert, title: "Hidden costs and risks", text: "Fees, lock-in, regret risk, maintenance, time cost, and missing info are surfaced early." },
              { icon: BadgeCheck, title: "Decision report", text: "You get a ranked recommendation, questions to ask, and negotiation drafts." },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-[#212121] text-[#7de2ca]">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#171717] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">best examples</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["apartment vs apartment", "job offer vs offer", "loan vs loan", "course vs course", "SaaS tool vs tool", "insurance plan vs plan"].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  const [first = "", second = ""] = example.split(" vs ")
                  setLeftOption(first)
                  setRightOption(second)
                  setError("")
                }}
                className="rounded-full border border-white/10 bg-[#212121] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-[#10a37f]/50 hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </main>
  )
}
