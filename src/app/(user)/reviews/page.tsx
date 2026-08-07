import Link from "next/link"
import { BookOpenCheck } from "lucide-react"

export const metadata = { title: "Reviews" }

export default function ReviewsPage() {
  return <section className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-7 sm:p-10"><BookOpenCheck className="size-7 text-primary" /><h1 className="mt-6 text-4xl font-black tracking-tight">Reviews live in your weekly report.</h1><p className="mt-4 text-base leading-8 text-neutral-500">The current beta provides one weekly reflection surface based on actual conversation and task activity. No separate review history is promised yet.</p><Link href="/weekly-report" className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground">Open weekly report</Link></section>
}
