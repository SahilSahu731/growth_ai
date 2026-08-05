import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { DangerZone } from "@/components/growth/danger-zone"
import { AccountPreferencesForm } from "@/components/operator/account-preferences-form"
import { getAccountOverview } from "@/lib/data/account"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const account = await getAccountOverview(session.user.id)
  if (!account) redirect("/login")

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Settings</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-.04em] sm:text-5xl">Make this space feel like yours.</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-500">Control how GrowthAI talks with you and handles your account.</p>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Panel title="AI preferences"><AccountPreferencesForm preferences={account.preferences} /></Panel>
        <Panel title="Account & plan">
          <p className="text-sm font-bold text-neutral-800">{session.user.name ?? "GrowthAI member"}</p>
          <p className="mt-1 text-sm text-neutral-400">{session.user.email}</p>
          <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Current plan</p>
            <p className="mt-2 text-xl font-black capitalize">{account.user.planTier}</p>
          </div>
          <Link href="/pricing" className="mt-4 inline-block text-xs font-bold text-primary">View plans →</Link>
        </Panel>
      </section>
      <section className="rounded-3xl border border-red-200 bg-red-50/40 p-6">
        <h2 className="mb-4 font-black">Your data, your choice</h2>
        <DangerZone email={session.user.email ?? ""} />
      </section>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"><h2 className="mb-5 text-xl font-black tracking-tight">{title}</h2>{children}</div>
}
