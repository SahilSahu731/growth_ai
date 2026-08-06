import { redirect } from "next/navigation"
import { ShieldCheck } from "lucide-react"

import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { BrandLogo } from "@/components/brand-logo"
import { getAdminSession } from "@/lib/admin/auth"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin sign in" }

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin")
  return <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#07090a] px-4 py-10"><div className="absolute inset-0 growth-grid opacity-30" /><div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" /><section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0d1011]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur sm:p-9"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><BrandLogo className="size-10" priority /><div><p className="font-display text-sm tracking-wide">GrowthAI</p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Administration</p></div></div><span className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5"><ShieldCheck className="size-4 text-emerald-400" /></span></div><div className="mt-9"><h1 className="text-3xl font-black tracking-[-.04em] text-white">Restricted access.</h1><p className="mt-3 text-sm leading-6 text-neutral-500">All three independent credentials are required. Attempts are rate-limited and successful access is audited.</p></div><AdminLoginForm /><p className="mt-6 text-center text-[10px] leading-5 text-neutral-700">This area is separate from member authentication.<br />User accounts cannot access it.</p></section></main>
}
