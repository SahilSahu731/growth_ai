import Link from "next/link"
import { Search, UserRoundCheck } from "lucide-react"

import { AdminPagination } from "@/components/admin/admin-pagination"
import { listAdminUsers } from "@/lib/data/admin"
import { requireAdminPageSession } from "@/lib/admin/page-auth"

export const metadata = { title: "Users" }

function positiveInteger(value: string | undefined) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function isSuspended(user: { accountStatus?: string; deletedAt?: string }) {
  return user.accountStatus === "suspended" || Boolean(user.deletedAt)
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; deleted?: string }> }) {
  await requireAdminPageSession()
  const params = await searchParams
  const search = params.q?.trim().slice(0, 100) ?? ""
  const result = await listAdminUsers({ search, page: positiveInteger(params.page), pageSize: 20 })
  return <div className="space-y-7"><section><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Account management</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Users</h1><p className="mt-2 text-sm text-neutral-500">Search accounts, inspect product data, control access, and manage entitlements.</p></section>
  {params.deleted === "1" ? <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400">The user and all owned product data were permanently deleted.</p> : null}
  <section className="rounded-2xl border border-white/8 bg-white/[.025] p-4 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><form className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-3 focus-within:border-primary/40"><Search className="size-4 text-neutral-600" /><input name="q" defaultValue={search} placeholder="Search name or email" className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-700" /><button className="text-xs font-bold text-primary">Search</button></form><p className="text-xs text-neutral-600">{result.total.toLocaleString()} {result.total === 1 ? "account" : "accounts"}</p></div>
  <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead><tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-neutral-600"><th className="pb-3 font-bold">User</th><th className="pb-3 font-bold">Access</th><th className="pb-3 font-bold">Plan</th><th className="pb-3 font-bold">Goals</th><th className="pb-3 font-bold">Open tasks</th><th className="pb-3 font-bold">Joined</th><th className="pb-3" /></tr></thead><tbody>{result.items.map((user) => <tr key={user.id} className="border-b border-white/5 last:border-0"><td className="py-3.5"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xs font-bold text-neutral-300">{user.name.slice(0, 2).toUpperCase()}</span><span><span className="block text-xs font-semibold text-neutral-200">{user.name}</span><span className="block text-[10px] text-neutral-600">{user.email}</span></span></div></td><td className="py-3.5"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${isSuspended(user) ? "bg-red-500/10 text-red-300" : "bg-emerald-500/10 text-emerald-400"}`}>{isSuspended(user) ? "Suspended" : "Active"}</span></td><td className="py-3.5 text-xs font-semibold capitalize text-neutral-400">{user.planTier}</td><td className="py-3.5 text-xs text-neutral-400">{user.activeGoals ?? 0}</td><td className="py-3.5 text-xs text-neutral-400">{user.openTasks ?? 0}</td><td className="py-3.5 text-[10px] text-neutral-600">{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(user.createdAt))}</td><td className="py-3.5 text-right"><Link href={`/admin/users/${user.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-3 text-[10px] font-bold text-neutral-300 hover:bg-white/5">Manage</Link></td></tr>)}</tbody></table>{!result.items.length ? <div className="py-16 text-center"><UserRoundCheck className="mx-auto size-6 text-neutral-700" /><p className="mt-3 text-sm font-semibold text-neutral-400">No matching users</p><p className="mt-1 text-xs text-neutral-700">Try a different name or email.</p></div> : null}</div><AdminPagination page={result.page} pages={result.pages} basePath="/admin/users" params={search ? { q: search } : {}} /></section></div>
}
