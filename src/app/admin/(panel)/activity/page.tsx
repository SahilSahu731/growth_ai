import Link from "next/link"
import { Activity, Bot, UserRound } from "lucide-react"

import { AdminPagination } from "@/components/admin/admin-pagination"
import { getAdminActivity } from "@/lib/data/admin"
import { requireAdminPageSession } from "@/lib/admin/page-auth"

export const metadata = { title: "Activity" }
function pageNumber(value?: string) { const page = Number(value); return Number.isInteger(page) && page > 0 ? page : 1 }
function date(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) }

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPageSession()
  const params = await searchParams
  const data = await getAdminActivity(pageNumber(params.page))
  return <div className="space-y-7"><section><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Product operations</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Activity</h1><p className="mt-2 text-sm text-neutral-500">Recent conversation activity for support and abuse investigation.</p></section><div className="flex gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4"><Activity className="mt-0.5 size-4 shrink-0 text-amber-400" /><p className="text-xs leading-5 text-amber-100/60">Message access is sensitive. This screen shows only short previews and is available exclusively inside the protected admin session. Use it only for legitimate operational needs.</p></div><section className="rounded-2xl border border-white/8 bg-white/[.025] p-4 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-white">Recent messages</h2><p className="mt-1 text-xs text-neutral-600">{data.total.toLocaleString()} stored messages</p></div></div><div className="mt-5 space-y-3">{data.items.map((item) => <article key={item.id} className="rounded-xl border border-white/7 bg-black/10 p-4"><div className="flex items-start gap-3"><span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.role === "assistant" ? "bg-primary/8 text-primary" : "bg-white/5 text-neutral-500"}`}>{item.role === "assistant" ? <Bot className="size-4" /> : <UserRound className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="truncate text-xs font-semibold text-neutral-300">{item.conversationTitle}</p><time className="text-[9px] text-neutral-700">{date(item.createdAt)}</time></div>{item.user ? <Link href={`/admin/users/${item.user.id}`} className="mt-1 inline-block text-[10px] text-neutral-600 hover:text-primary">{item.user.name} · {item.user.email}</Link> : <p className="mt-1 text-[10px] text-neutral-700">Deleted user</p>}<p className="mt-3 text-xs leading-6 text-neutral-500">{item.content}</p></div></div></article>)}{!data.items.length ? <p className="py-14 text-center text-xs text-neutral-600">No activity has been recorded.</p> : null}</div><AdminPagination page={data.page} pages={data.pages} basePath="/admin/activity" /></section></div>
}
