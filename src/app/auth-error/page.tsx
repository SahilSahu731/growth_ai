import Link from "next/link"
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Sign-in problem", robots: { index: false, follow: false } }

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const reference = crypto.randomUUID().slice(0, 12)

  return (
    <main className="growth-grid flex min-h-screen items-center justify-center bg-[#070a0c] px-5 py-16 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0d1317]/90 p-7 shadow-[0_30px_90px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-10">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#72e7ff]/10 text-[#72e7ff]">
          <AlertTriangle className="size-5" />
        </div>
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[.2em] text-[#72e7ff]">Sign-in could not finish</p>
        <h1 className="font-editorial mt-3 text-5xl italic leading-[.9] tracking-[-.04em] sm:text-6xl">Let’s try that again.</h1>
        <p className="mt-5 text-sm leading-7 text-white/50">
          GrowthAI could not complete this sign-in. Return to the login page and try again. If it continues, contact support and include the reference below.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/login" className="group flex h-12 items-center justify-center gap-2 rounded-full bg-[#72e7ff] px-5 text-xs font-bold text-[#031014] transition hover:-translate-y-0.5 hover:bg-white"><RotateCcw className="size-3.5" />Try again</Link>
          <Link href="/" className="group flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-xs font-bold text-white/65 transition hover:border-white/20 hover:text-white"><ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />Back home</Link>
        </div>
        <p className="mt-6 text-center text-[10px] text-white/40">Support reference: {reference} · Error type: {error ?? "Unknown"}</p>
      </section>
    </main>
  )
}
