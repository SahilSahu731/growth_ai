"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Megaphone, Save, Trash2 } from "lucide-react"

import { createAnnouncementAction, deleteAnnouncementAction, updateAnnouncementAction, type AdminActionState } from "@/app/admin/actions"
import type { AdminAnnouncement } from "@/lib/data/admin"

const initial: AdminActionState = {}
const fieldClass = "h-11 w-full rounded-xl border border-white/10 bg-[#111516] px-3 text-sm text-white outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5"

function SaveButton({ creating }: { creating: boolean }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:bg-primary/85 disabled:opacity-50">{creating ? <Megaphone className="size-4" /> : <Save className="size-4" />}{pending ? "Saving…" : creating ? "Create announcement" : "Save changes"}</button>
}

function DeleteButton() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending} className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 text-[10px] font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"><Trash2 className="size-3.5" />{pending ? "Deleting…" : "Delete announcement"}</button>
}

function Feedback({ state }: { state: AdminActionState }) {
  return state.error || state.success ? <p role="status" className={state.error ? "text-xs text-red-300" : "text-xs text-emerald-400"}>{state.error ?? state.success}</p> : null
}

function utcInput(value?: string) {
  if (!value) return ""
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 16)
}

export function AdminAnnouncementForm({ announcement }: { announcement?: AdminAnnouncement }) {
  const creating = !announcement
  const [state, action] = useActionState(creating ? createAnnouncementAction : updateAnnouncementAction, initial)
  return <form action={action} className="space-y-4">{announcement ? <input type="hidden" name="announcementId" value={announcement.id} /> : null}<label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Banner message</span><textarea name="message" required minLength={3} maxLength={240} defaultValue={announcement?.message} placeholder="Example: Founder plan is 30% off until Friday." className={`${fieldClass} min-h-24 resize-y py-3 leading-6`} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Style</span><select name="tone" defaultValue={announcement?.tone ?? "info"} className={fieldClass}><option value="info">Information</option><option value="offer">Offer</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Priority (0–100)</span><input name="priority" type="number" min={0} max={100} defaultValue={announcement?.priority ?? 50} className={fieldClass} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Link text <span className="font-normal text-neutral-700">(optional)</span></span><input name="linkLabel" maxLength={40} defaultValue={announcement?.linkLabel} placeholder="View offer" className={fieldClass} /></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">HTTPS URL or local path</span><input name="linkUrl" maxLength={500} defaultValue={announcement?.linkUrl} placeholder="/pricing" className={fieldClass} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Starts at <span className="font-normal text-neutral-700">(UTC, optional)</span></span><input name="startsAt" type="datetime-local" defaultValue={utcInput(announcement?.startsAt)} className={fieldClass} /></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Ends at <span className="font-normal text-neutral-700">(UTC, optional)</span></span><input name="endsAt" type="datetime-local" defaultValue={utcInput(announcement?.endsAt)} className={fieldClass} /></label></div><div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-white/8 bg-black/10 p-4"><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-400"><input name="isActive" type="checkbox" defaultChecked={announcement?.isActive ?? true} className="size-4 accent-cyan-300" />Enabled</label><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-400"><input name="dismissible" type="checkbox" defaultChecked={announcement?.dismissible ?? true} className="size-4 accent-cyan-300" />Visitors can dismiss</label></div><div className="flex flex-wrap items-center justify-between gap-3"><Feedback state={state} /><SaveButton creating={creating} /></div></form>
}

export function AdminDeleteAnnouncementForm({ announcementId, message }: { announcementId: string; message: string }) {
  const [state, action] = useActionState(deleteAnnouncementAction, initial)
  return <form action={action} onSubmit={(event) => { if (!window.confirm(`Delete “${message}”? This cannot be undone.`)) event.preventDefault() }} className="flex flex-wrap items-center gap-3"><input type="hidden" name="announcementId" value={announcementId} /><DeleteButton /><Feedback state={state} /></form>
}
