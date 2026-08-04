import Link from "next/link"
import { notFound } from "next/navigation"
import { getPublicProject } from "@/lib/data/growth"

export default async function PublicCommitmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getPublicProject(slug)
  if (!data) notFound()
  return <main className="min-h-screen bg-[#171717] px-5 py-12 text-white"><div className="mx-auto max-w-3xl"><Link href="/" className="text-sm text-zinc-500">GrowthAI</Link><section className="mt-12 rounded-[2rem] border border-white/10 bg-[#242424] p-7 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Public commitment</p><h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{data.project.name}</h1><p className="mt-5 text-base leading-7 text-zinc-400">{data.project.description}</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><Stat label="Definition of shipped" value={data.project.definitionOfShipped} /><Stat label="Target ship date" value={data.project.targetShipDate} /><Stat label="Check-ins completed" value={String(data.checkInCount)} /><Stat label="Meaningful progress updates" value={String(data.meaningfulProgressCount)} />{data.streak ? <Stat label="Current streak" value={String(data.streak.currentStreak)} /> : null}<Stat label="Status" value={data.project.status} /></div></section><p className="mt-6 text-center text-xs leading-5 text-zinc-600">This builder chose exactly what to publish. GrowthAI does not expose their raw check-ins or private coaching.</p><div className="mt-8 text-center"><Link href="/signup" className="inline-block rounded-full bg-emerald-400 px-6 py-3 font-semibold text-zinc-950">Make your own commitment</Link></div></div></main>
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 p-4"><p className="text-xs uppercase tracking-wide text-zinc-600">{label}</p><p className="mt-2 text-sm leading-6 text-zinc-200 capitalize">{value}</p></div> }
