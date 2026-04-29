import { createComparisonAction } from "@/app/(user)/compare/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const EXAMPLES = [
  "Compare 3 apartments near my office",
  "iPhone 15 vs Samsung S24 for camera and battery",
  "Two job offers: higher salary vs better growth",
  "Best health insurance plan for my family",
  "Which online course should I buy for data analytics?",
  "Car loan options with lowest real cost",
]

export function NewComparisonForm({ compact = false }: { compact?: boolean }) {
  return (
    <form action={createComparisonAction} className="space-y-4">
      <Textarea
        name="context"
        placeholder="What are you trying to compare?"
        className={compact ? "min-h-28 resize-none rounded-2xl border-white/10 bg-[#303030] p-4 text-base text-white" : "min-h-36 resize-none rounded-3xl border-white/10 bg-[#303030] p-5 text-lg text-white"}
        required
      />
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.slice(0, compact ? 3 : EXAMPLES.length).map((example) => (
          <button
            key={example}
            type="submit"
            name="context"
            value={example}
            className="rounded-full border border-white/10 bg-[#2f2f2f] px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#3a3a3a]"
          >
            {example}
          </button>
        ))}
      </div>
      <Button type="submit" className="h-11 rounded-full bg-white px-6 text-sm font-medium text-zinc-950 hover:bg-zinc-200">
        Compare anything
      </Button>
    </form>
  )
}
