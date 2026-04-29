import Link from "next/link"
import { ArrowLeft, LayoutDashboard, Sparkles } from "lucide-react"

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#212121] text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(16,163,127,0.12),transparent_34rem)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#171717]/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              <span className="grid size-6 place-items-center rounded-full bg-[#10a37f] text-[#08130f]">
                <Sparkles className="size-3.5" />
              </span>
              <span className="truncate text-sm font-semibold">PickAI Compare</span>
              <span className="hidden rounded-full border border-[#10a37f]/30 bg-[#10a37f]/10 px-2 py-0.5 text-[11px] font-medium text-[#7de2ca] sm:inline">
                deep research
              </span>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="relative">{children}</div>
    </div>
  )
}
