import { Megaphone, Radio, Timer } from "lucide-react"

import { AdminAnnouncementForm, AdminDeleteAnnouncementForm } from "@/components/admin/admin-announcement-forms"
import { requireAdminPageSession } from "@/lib/admin/page-auth"
import { listAdminAnnouncements, type AdminAnnouncement } from "@/lib/data/admin"

export const metadata = { title: "Announcements" }

function stateOf(item: AdminAnnouncement) {
  const now = Date.now()
  if (!item.isActive) return { label: "Inactive", className: "bg-white/5 text-neutral-500" }
  if (item.startsAt && Date.parse(item.startsAt) > now) return { label: "Scheduled", className: "bg-blue-500/10 text-blue-300" }
  if (item.endsAt && Date.parse(item.endsAt) <= now) return { label: "Expired", className: "bg-neutral-500/10 text-neutral-500" }
  return { label: "Live", className: "bg-emerald-500/10 text-emerald-400" }
}

function date(value?: string) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC" : "No limit"
}

const previewStyles = {
  info: "border-cyan-400/20 bg-[#10242a] text-cyan-50",
  offer: "border-primary/25 bg-primary text-primary-foreground",
  warning: "border-amber-400/25 bg-[#3a2a0d] text-amber-50",
  critical: "border-red-400/25 bg-[#3a1315] text-red-50",
}

export default async function AdminAnnouncementsPage() {
  await requireAdminPageSession()
  const announcements = await listAdminAnnouncements()
  return <div className="space-y-7"><section><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Site communication</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Announcements</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Publish a slim global banner for offers, service warnings, launches, or important updates. The highest-priority currently eligible banner is shown.</p></section><section className="grid gap-3 sm:grid-cols-3"><Metric icon={Megaphone} label="Created" value={announcements.length} /><Metric icon={Radio} label="Live now" value={announcements.filter((item) => stateOf(item).label === "Live").length} /><Metric icon={Timer} label="Scheduled" value={announcements.filter((item) => stateOf(item).label === "Scheduled").length} /></section><section className="rounded-2xl border border-white/8 bg-white/[.025] p-5 sm:p-6"><div className="mb-5"><h2 className="text-sm font-bold text-white">Create announcement</h2><p className="mt-1 text-xs text-neutral-600">Leave scheduling blank to publish immediately when enabled.</p></div><AdminAnnouncementForm /></section><section className="space-y-4"><div><h2 className="text-sm font-bold text-white">All announcements</h2><p className="mt-1 text-xs text-neutral-600">Higher priority wins when schedules overlap.</p></div>{announcements.map((item) => { const state = stateOf(item); return <article key={item.id} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[.025]"><div className={`flex min-h-11 flex-wrap items-center justify-center gap-2 border-b px-4 py-2 text-center ${previewStyles[item.tone]}`}><span className="text-xs font-semibold">{item.message}</span>{item.linkLabel ? <span className="text-xs font-black underline underline-offset-4">{item.linkLabel}</span> : null}</div><div className="p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${state.className}`}>{state.label}</span><span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-neutral-500">{item.tone}</span><span className="text-[10px] text-neutral-700">Priority {item.priority}</span></div><p className="text-[10px] text-neutral-700">{date(item.startsAt)} → {date(item.endsAt)}</p></div><AdminAnnouncementForm announcement={item} /><div className="mt-5 border-t border-white/8 pt-5"><AdminDeleteAnnouncementForm announcementId={item.id} message={item.message} /></div></div></article> })}{!announcements.length ? <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><Megaphone className="mx-auto size-6 text-neutral-700" /><p className="mt-3 text-sm font-semibold text-neutral-400">No announcements yet</p><p className="mt-1 text-xs text-neutral-700">Create the first banner above.</p></div> : null}</section></div>
}

function Metric({ icon: Icon, label, value }: { icon: typeof Megaphone; label: string; value: number }) {
  return <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><Icon className="size-4 text-primary" /><p className="mt-5 text-2xl font-black text-white">{value}</p><p className="mt-1 text-[10px] text-neutral-600">{label}</p></article>
}
