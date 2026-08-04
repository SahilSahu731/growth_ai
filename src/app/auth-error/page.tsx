import Link from "next/link"
import { AlertTriangle, ArrowLeft, Database, RotateCcw } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = { title: "Sign-in problem | GrowthAI" }

export default async function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const databaseConfigured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL && process.env.CONVEX_DEPLOY_KEY)
  const databaseBlocked = error === "AccessDenied" && !databaseConfigured

  return (
    <main className="growth-grid flex min-h-screen items-center justify-center bg-[#070a0c] px-5 py-16 text-white">
      <section className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0d1317]/90 p-7 shadow-[0_30px_90px_rgba(0,0,0,.5)] backdrop-blur-xl sm:p-10">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#72e7ff]/10 text-[#72e7ff]">
          {databaseBlocked ? <Database className="size-5" /> : <AlertTriangle className="size-5" />}
        </div>
        <p className="mt-7 text-[10px] font-bold uppercase tracking-[.2em] text-[#72e7ff]">Sign-in could not finish</p>
        <h1 className="font-editorial mt-3 text-5xl italic leading-[.9] tracking-[-.04em] sm:text-6xl">{databaseBlocked ? "Connect the database." : "Let’s try that again."}</h1>
        <p className="mt-5 text-sm leading-7 text-white/50">
          {databaseBlocked
            ? "Google verified your identity, but GrowthAI could not create your account because the Convex cloud database is not configured yet."
            : "GrowthAI could not complete this sign-in. Return to the login page and try again; if it continues, verify the Google and Convex environment settings."}
        </p>

        {databaseBlocked ? <div className="mt-6 rounded-2xl border border-[#72e7ff]/20 bg-[#72e7ff]/[.06] p-4 text-xs leading-6 text-white/60"><p className="font-bold text-white">Required in `.env.local`</p><p className="mt-1 font-mono text-[11px] text-[#72e7ff]">NEXT_PUBLIC_CONVEX_URL<br />CONVEX_DEPLOY_KEY</p></div> : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/login" className="group flex h-12 items-center justify-center gap-2 rounded-full bg-[#72e7ff] px-5 text-xs font-bold text-[#031014] transition hover:-translate-y-0.5 hover:bg-white"><RotateCcw className="size-3.5" />Try again</Link>
          <Link href="/" className="group flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-xs font-bold text-white/65 transition hover:border-white/20 hover:text-white"><ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />Back home</Link>
        </div>
        <p className="mt-6 text-center text-[10px] text-white/25">Error reference: {error ?? "Unknown"}</p>
      </section>
    </main>
  )
}
