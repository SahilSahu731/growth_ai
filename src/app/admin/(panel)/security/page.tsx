import { CheckCircle2, KeyRound, LockKeyhole, ShieldAlert, ShieldCheck, TimerReset, XCircle } from "lucide-react"

import { AdminPagination } from "@/components/admin/admin-pagination"
import { adminCredentialHealth } from "@/lib/admin/auth"
import { requireAdminPageRole } from "@/lib/admin/page-auth"
import { getAdminAuditLogs, listAdminSessionRecords } from "@/lib/data/admin"

export const metadata = { title: "Security" }

function pageNumber(value?: string) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function date(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export default async function AdminSecurityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireAdminPageRole("security-auditor")
  const params = await searchParams
  const [logs, health, sessions] = await Promise.all([
    getAdminAuditLogs(pageNumber(params.page)),
    Promise.resolve(adminCredentialHealth()),
    listAdminSessionRecords(session.email),
  ])
  const now = new Date().toISOString()
  const activeSessions = sessions.filter((item) => !item.revokedAt && item.idleExpiresAt > now && item.absoluteExpiresAt > now).length
  const checks = [
    { label: `${activeSessions} active server-side session${activeSessions === 1 ? "" : "s"}`, valid: health.configured, icon: KeyRound },
    { label: `${health.accounts} named administrator account${health.accounts === 1 ? "" : "s"}`, valid: health.accounts > 0, icon: ShieldCheck },
    { label: "Passwords are bcrypt hashes and TOTP MFA is active", valid: health.passwordHashed && health.mfaConfigured, icon: LockKeyhole },
    { label: "Session signing secret is at least 32 characters", valid: health.sessionSecretStrong, icon: TimerReset },
  ]

  return <div className="space-y-7">
    <section>
      <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Access governance</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Security</h1>
      <p className="mt-2 text-sm text-neutral-400">Credential health, session policy, and privileged action history.</p>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {checks.map((check) => <article key={check.label} className="rounded-2xl border border-white/8 bg-white/[.025] p-4">
        <div className="flex items-center justify-between"><check.icon className="size-4 text-neutral-400" />{check.valid ? <CheckCircle2 className="size-4 text-emerald-400" /> : <XCircle className="size-4 text-red-400" />}</div>
        <p className="mt-5 text-xs font-semibold leading-5 text-neutral-300">{check.label}</p>
        <p className={`mt-2 text-xs font-bold uppercase ${check.valid ? "text-emerald-400" : "text-red-300"}`}>{check.valid ? "Healthy" : "Action required"}</p>
      </article>)}
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><ShieldAlert className="size-4 text-primary" /><h2 className="mt-5 text-sm font-bold">Session policy</h2><p className="mt-2 text-xs leading-6 text-neutral-400">Sessions have a 30-minute rolling idle limit and an {health.sessionHours}-hour absolute limit. Cookies are HttpOnly, SameSite=Strict, restricted to <code>/admin</code>, and Secure in production.</p></article>
      <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><TimerReset className="size-4 text-primary" /><h2 className="mt-5 text-sm font-bold">Abuse protection</h2><p className="mt-2 text-xs leading-6 text-neutral-400">Account, device, and global login keys use exponential backoff. Forwarded addresses are accepted only across the configured trusted-proxy boundary. Incrementing <code>ADMIN_SESSION_VERSION</code> invalidates every cookie.</p></article>
    </section>

    <section className="rounded-2xl border border-white/8 bg-white/[.025] p-5 sm:p-6">
      <h2 className="text-sm font-bold text-white">Your recent sessions</h2>
      <p className="mt-1 text-xs text-neutral-400">Device identifiers are one-way hashes; only the first characters are shown.</p>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-white/8 text-xs uppercase tracking-wider text-neutral-400"><th className="pb-3">Device</th><th className="pb-3">Roles</th><th className="pb-3">Created</th><th className="pb-3">Last seen</th><th className="pb-3">Expires</th><th className="pb-3">State</th></tr></thead><tbody>{sessions.map((item) => {
        const active = !item.revokedAt && item.idleExpiresAt > now && item.absoluteExpiresAt > now
        return <tr key={item.id} className="border-b border-white/5 last:border-0"><td className="py-3 font-mono text-xs text-neutral-400">{item.device.slice(0, 12)}…</td><td className="py-3 text-xs text-neutral-400">{item.roles.join(", ")}</td><td className="py-3 text-xs text-neutral-400">{date(item.createdAt)}</td><td className="py-3 text-xs text-neutral-400">{date(item.lastSeenAt)}</td><td className="py-3 text-xs text-neutral-400">{date(item.absoluteExpiresAt)}</td><td className={active ? "py-3 text-xs text-emerald-400" : "py-3 text-xs text-neutral-500"}>{active ? "Active" : item.revokedAt ? "Revoked" : "Expired"}</td></tr>
      })}</tbody></table>{!sessions.length ? <p className="py-10 text-center text-xs text-neutral-400">No session records found.</p> : null}</div>
    </section>

    <section className="rounded-2xl border border-white/8 bg-white/[.025] p-5 sm:p-6">
      <div><h2 className="text-sm font-bold text-white">Privileged action log</h2><p className="mt-1 text-xs text-neutral-400">{logs.total.toLocaleString()} recorded admin events</p></div>
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-white/8 text-xs uppercase tracking-wider text-neutral-400"><th className="pb-3">Action</th><th className="pb-3">Actor</th><th className="pb-3">Target</th><th className="pb-3">Summary</th><th className="pb-3 text-right">Time</th></tr></thead><tbody>{logs.items.map((log) => <tr key={log.id} className="border-b border-white/5 last:border-0"><td className="py-3"><span className="rounded-lg bg-primary/8 px-2 py-1 font-mono text-xs text-primary">{log.action}</span></td><td className="py-3 text-xs text-neutral-400">{log.actor}</td><td className="py-3 text-xs text-neutral-400">{log.targetType}{log.targetId ? <span className="block max-w-32 truncate font-mono text-xs text-neutral-500">{log.targetId}</span> : null}</td><td className="max-w-96 py-3 text-xs leading-5 text-neutral-400">{log.summary}</td><td className="py-3 text-right text-xs text-neutral-500">{date(log.createdAt)}</td></tr>)}</tbody></table>{!logs.items.length ? <p className="py-12 text-center text-xs text-neutral-400">No privileged actions recorded yet.</p> : null}</div>
      <AdminPagination page={logs.page} pages={logs.pages} basePath="/admin/security" />
    </section>
  </div>
}
