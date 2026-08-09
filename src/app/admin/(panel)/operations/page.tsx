import { AlertTriangle, Bot, DatabaseZap, LockKeyhole, MailWarning, ReceiptText } from "lucide-react"

import { retryOperationAction } from "@/app/admin/actions"
import { requireAdminPageRole } from "@/lib/admin/page-auth"
import { getAdminOperations } from "@/lib/data/admin"

export const metadata = { title: "Operations" }

export default async function AdminOperationsPage() {
  await requireAdminPageRole("security-auditor", "owner")
  const data = await getAdminOperations()
  const incidents = data.billing.deadLetter + data.billing.criticalAlerts + data.email.deadLetter + data.deletion.failed + data.exports.failed + data.ai.openCircuits
  return <div className="space-y-7">
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Reliability control plane</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.035em] text-white sm:text-4xl">Operations</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Bounded backlog signals for billing, email, privacy jobs, AI availability, and administrator access.</p></div>
      <p className="text-xs text-neutral-600">Snapshot {new Date(data.generatedAt).toLocaleString()}</p>
    </section>
    {incidents > 0 ? <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/7 p-4"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300"/><p className="text-sm text-amber-100/75">{incidents} signal{incidents === 1 ? "" : "s"} need review. Follow the linked runbook before manually replaying a job.</p></div> : <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm text-emerald-200/70">No critical backlog is visible in this bounded snapshot.</div>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Signal icon={ReceiptText} label="Billing" value={data.billing.deadLetter + data.billing.failed} note={`${data.billing.openAlerts} open alerts · ${data.billing.criticalAlerts} critical`} danger={data.billing.deadLetter + data.billing.criticalAlerts > 0}/>
      <Signal icon={MailWarning} label="Email" value={data.email.deadLetter + data.email.failed} note={`${data.email.deadLetter} dead-letter deliveries`} danger={data.email.deadLetter > 0}/>
      <Signal icon={DatabaseZap} label="Deletion jobs" value={data.deletion.failed} note={`${data.deletion.processing} processing · ${data.deletion.stale} stale`} danger={data.deletion.failed + data.deletion.stale > 0}/>
      <Signal icon={DatabaseZap} label="Export jobs" value={data.exports.failed} note={`${data.exports.processing} processing · ${data.exports.stale} stale`} danger={data.exports.failed + data.exports.stale > 0}/>
      <Signal icon={Bot} label="AI circuits" value={data.ai.openCircuits} note={`${data.ai.circuits.length} provider circuit records`} danger={data.ai.openCircuits > 0}/>
      <Signal icon={LockKeyhole} label="Admin throttles" value={data.security.blockedAdminKeys} note="Currently blocked login fingerprints" danger={data.security.blockedAdminKeys > 0}/>
    </section>
    <section className="rounded-2xl border border-white/8 bg-white/[.025]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 p-5"><div><h2 className="text-base font-semibold text-white">Failed privacy jobs</h2><p className="mt-1 text-xs text-neutral-600">Retries are idempotent, bounded, audited, and owner-only.</p></div><code className="text-xs text-primary">docs/OPERATIONS_RUNBOOKS.md</code></div>
      {data.jobs.length ? <div className="divide-y divide-white/7">{data.jobs.map((job) => <article key={`${job.kind}-${job.id}`} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-red-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-red-300">{job.kind}</span><code className="text-xs text-neutral-400">{job.id}</code></div><p className="mt-2 text-sm text-neutral-300">Stage {job.stage} · attempt {job.attempts} · {job.errorCode ?? "unspecified failure"}</p><p className="mt-1 text-xs text-neutral-600">Updated {new Date(job.updatedAt).toLocaleString()}</p></div><form action={retryOperationAction} className="flex flex-col gap-2 sm:flex-row"><input type="hidden" name="kind" value={job.kind}/><input type="hidden" name="jobId" value={job.id}/><label className="sr-only" htmlFor={`reason-${job.id}`}>Recovery reason</label><input id={`reason-${job.id}`} name="reason" minLength={10} required placeholder="Reason and incident reference" className="h-10 min-w-64 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-neutral-700 focus:border-primary/50"/><button className="h-10 rounded-lg bg-white px-4 text-xs font-semibold text-black hover:bg-neutral-200">Retry job</button></form></article>)}</div> : <p className="p-8 text-center text-sm text-neutral-600">No failed deletion or export jobs.</p>}
    </section>
    {data.ai.circuits.length ? <section className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><h2 className="text-base font-semibold text-white">AI provider circuits</h2><div className="mt-4 grid gap-2">{data.ai.circuits.map((circuit) => <div key={circuit.key} className="flex flex-wrap justify-between gap-3 rounded-xl border border-white/7 bg-black/10 p-3 text-xs"><span className="text-neutral-300">{circuit.key}</span><span className="text-neutral-600">{circuit.consecutiveFailures} failures · {circuit.openedUntil ? `open until ${new Date(circuit.openedUntil).toLocaleString()}` : "closed"}</span></div>)}</div></section> : null}
  </div>
}

function Signal({ icon: Icon, label, value, note, danger }: { icon: typeof ReceiptText; label: string; value: number; note: string; danger: boolean }) {
  return <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><div className="flex items-center justify-between"><Icon className={danger ? "size-4 text-amber-300" : "size-4 text-primary"}/><span className={danger ? "size-2 rounded-full bg-amber-300" : "size-2 rounded-full bg-emerald-400"}/></div><p className="mt-5 text-3xl font-semibold text-white">{value}</p><p className="mt-1 text-sm font-semibold text-neutral-300">{label}</p><p className="mt-2 text-xs text-neutral-600">{note}</p></article>
}
