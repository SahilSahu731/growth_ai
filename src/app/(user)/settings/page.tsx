import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { createReferralAction } from "@/app/(user)/growth-actions"
import { DangerZone } from "@/components/growth/danger-zone"
import { PreferencesForm, PublicProjectForm } from "@/components/growth/preferences-form"
import { getGithubConnection, getGrowthDashboard, getReferral } from "@/lib/data/growth"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")
  const [dashboard, github, referral] = await Promise.all([getGrowthDashboard(session.user.id), getGithubConnection(session.user.id), getReferral(session.user.id)])
  if (!dashboard?.preferences) redirect("/onboarding")
  return <div className="mx-auto w-full max-w-5xl space-y-6">
    <section><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Settings</p><h1 className="mt-3 text-4xl font-semibold text-white">Make accountability fit real life.</h1><p className="mt-3 text-sm text-zinc-400">Change the schedule or tone without losing your history.</p></section>
    <section className="grid gap-5 lg:grid-cols-2">
      <Panel title="Check-in preferences"><PreferencesForm preferences={dashboard.preferences} /></Panel>
      <Panel title="Account & plan"><p className="text-sm text-zinc-300">{session.user.name ?? "GrowthAI builder"}</p><p className="mt-1 text-sm text-zinc-500">{session.user.email}</p><div className="mt-5 rounded-xl border border-white/10 p-4"><p className="text-xs uppercase tracking-wide text-zinc-600">Current plan</p><p className="mt-2 text-xl font-semibold capitalize text-white">{dashboard.user.planTier}</p></div><Link href="/pricing" className="mt-4 inline-block text-sm text-emerald-400">View billing plans →</Link></Panel>
      <Panel title="GitHub evidence"><p className="text-sm leading-6 text-zinc-400">{github ? `Connected as ${github.login}. ${github.selectedRepositories.length} repositories selected.` : "Optional. Connect GitHub to attach commit and pull request evidence. GitHub activity never decides whether your progress is meaningful on its own."}</p><Link href="/api/auth/signin/github?callbackUrl=/settings" className="mt-4 inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-white">{github ? "Reconnect GitHub" : "Connect GitHub"}</Link></Panel>
      <Panel title="Invite a builder">{referral ? <><p className="text-sm text-zinc-400">Share this link only with someone who is actively trying to ship.</p><code className="mt-3 block overflow-x-auto rounded-xl bg-zinc-950/50 p-3 text-sm text-emerald-300">{`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/signup?ref=${referral.code}`}</code></> : <form action={createReferralAction}><p className="mb-4 text-sm leading-6 text-zinc-400">Create a private invite link. Rewards stay disabled until referral quality is validated.</p><button className="rounded-full border border-white/15 px-4 py-2 text-sm text-white">Create invite link</button></form>}</Panel>
      {dashboard.projects.map(project => <Panel key={project.id} title={`Public page · ${project.name}`}><PublicProjectForm project={project} /></Panel>)}
    </section>
    <section className="rounded-3xl border border-red-400/15 bg-red-400/[0.03] p-6"><h2 className="mb-4 font-semibold text-white">Privacy & account deletion</h2><DangerZone email={session.user.email ?? ""} /></section>
  </div>
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-3xl border border-white/10 bg-[#2b2b2b] p-6"><h2 className="mb-5 text-xl font-semibold text-white">{title}</h2>{children}</div> }
