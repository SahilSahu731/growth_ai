import { AppWindow, GalleryHorizontalEnd, Megaphone, PanelTop, Radio, Timer } from "lucide-react"

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
  return value ? `${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value))} UTC` : "No limit"
}

function placementLabel(value?: AdminAnnouncement["placement"]) {
  if (value === "popup") return "Popup"
  if (value === "floating_banner") return "Floating banner"
  return "Top bar"
}

export default async function AdminAnnouncementsPage() {
  await requireAdminPageSession()
  const announcements = await listAdminAnnouncements()
  return <div className="space-y-7"><section><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Site communication</p><h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">Announcements</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">Create top bars, floating banners, or popup announcements. Control the colors, content, CTA, schedule, priority, and behavior with a live preview before publishing.</p></section><section className="grid gap-3 sm:grid-cols-3"><Metric icon={Megaphone} label="Created" value={announcements.length} /><Metric icon={Radio} label="Live now" value={announcements.filter((item) => stateOf(item).label === "Live").length} /><Metric icon={Timer} label="Scheduled" value={announcements.filter((item) => stateOf(item).label === "Scheduled").length} /></section><section className="grid gap-3 sm:grid-cols-3"><TypeCard icon={PanelTop} title="Top bar" description="A slim, full-width notice above the website navigation." /><TypeCard icon={GalleryHorizontalEnd} title="Floating banner" description="A prominent card anchored to the lower-right corner." /><TypeCard icon={AppWindow} title="Popup" description="A focused modal centered over a dimmed page backdrop." /></section><section className="rounded-2xl border border-white/8 bg-white/[.025] p-5 sm:p-6"><div className="mb-6"><h2 className="text-sm font-bold text-white">Create announcement</h2><p className="mt-1 text-xs text-neutral-600">Design and preview it here. Leave scheduling blank to publish immediately when enabled.</p></div><AdminAnnouncementForm /></section><section className="space-y-4"><div><h2 className="text-sm font-bold text-white">All announcements</h2><p className="mt-1 text-xs text-neutral-600">The highest-priority eligible announcement is displayed when schedules overlap.</p></div>{announcements.map((item) => { const state = stateOf(item); return <article key={item.id} className="overflow-hidden rounded-2xl border border-white/8 bg-white/[.025]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-black/10 px-5 py-4"><div className="min-w-0"><p className="truncate text-xs font-bold text-neutral-200">{item.title || item.message}</p><p className="mt-1 line-clamp-1 text-[10px] text-neutral-600">{item.title ? item.message : "No separate title"}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase ${state.className}`}>{state.label}</span><span className="rounded-full bg-primary/8 px-2 py-1 text-[9px] font-bold uppercase text-primary">{placementLabel(item.placement)}</span><span className="text-[10px] text-neutral-700">Priority {item.priority}</span></div></div><div className="p-5 sm:p-6"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-neutral-700">{date(item.startsAt)} → {date(item.endsAt)}</p><div className="flex gap-1.5"><span className="size-4 rounded-full border border-white/10" style={{ backgroundColor: item.backgroundColor }} title="Background color" /><span className="size-4 rounded-full border border-white/10" style={{ backgroundColor: item.textColor }} title="Text color" /><span className="size-4 rounded-full border border-white/10" style={{ backgroundColor: item.accentColor }} title="Accent color" /></div></div><AdminAnnouncementForm announcement={item} /><div className="mt-6 border-t border-white/8 pt-5"><AdminDeleteAnnouncementForm announcementId={item.id} message={item.title || item.message} /></div></div></article> })}{!announcements.length ? <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><Megaphone className="mx-auto size-6 text-neutral-700" /><p className="mt-3 text-sm font-semibold text-neutral-400">No announcements yet</p><p className="mt-1 text-xs text-neutral-700">Create and preview the first one above.</p></div> : null}</section></div>
}

function Metric({ icon: Icon, label, value }: { icon: typeof Megaphone; label: string; value: number }) {
  return <article className="rounded-2xl border border-white/8 bg-white/[.025] p-5"><Icon className="size-4 text-primary" /><p className="mt-5 text-2xl font-black text-white">{value}</p><p className="mt-1 text-[10px] text-neutral-600">{label}</p></article>
}

function TypeCard({ icon: Icon, title, description }: { icon: typeof PanelTop; title: string; description: string }) {
  return <article className="rounded-2xl border border-white/8 bg-black/10 p-4"><Icon className="size-4 text-neutral-500" /><p className="mt-3 text-xs font-bold text-neutral-300">{title}</p><p className="mt-1 text-[10px] leading-5 text-neutral-600">{description}</p></article>
}
