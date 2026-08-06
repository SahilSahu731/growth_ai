"use client"

import { useActionState, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import { AlignCenter, AlignLeft, AppWindow, BellRing, GalleryHorizontalEnd, Megaphone, PanelTop, Save, Trash2 } from "lucide-react"

import { createAnnouncementAction, deleteAnnouncementAction, updateAnnouncementAction, type AdminActionState } from "@/app/admin/actions"
import { AnnouncementPresentation } from "@/components/announcements/announcement-presentation"
import { ANNOUNCEMENT_PRESETS, type AnnouncementAlignment, type AnnouncementButtonStyle, type AnnouncementPlacement, type AnnouncementTone, type PublicAnnouncement } from "@/lib/announcement-types"
import type { AdminAnnouncement } from "@/lib/data/admin"
import { cn } from "@/lib/utils"

const initial: AdminActionState = {}
const fieldClass = "h-11 w-full rounded-xl border border-white/10 bg-[#111516] px-3 text-sm text-white outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
const placementOptions = [
  { value: "top_bar" as const, label: "Top bar", description: "Slim line above navigation", icon: PanelTop },
  { value: "floating_banner" as const, label: "Floating banner", description: "Card fixed at bottom-right", icon: GalleryHorizontalEnd },
  { value: "popup" as const, label: "Popup", description: "Centered modal with backdrop", icon: AppWindow },
]

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

function ColorField({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">{label}</span><span className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-[#111516] px-2 focus-within:border-primary/50"><input type="color" aria-label={`${label} picker`} value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="size-7 cursor-pointer rounded-md border-0 bg-transparent p-0" /><input name={name} value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} pattern="#[0-9A-Fa-f]{6}" maxLength={7} required className="min-w-0 flex-1 bg-transparent font-mono text-xs text-white outline-none" /></span></label>
}

export function AdminAnnouncementForm({ announcement }: { announcement?: AdminAnnouncement }) {
  const creating = !announcement
  const initialTone = announcement?.tone ?? "info"
  const initialColors = ANNOUNCEMENT_PRESETS[initialTone]
  const [state, action] = useActionState(creating ? createAnnouncementAction : updateAnnouncementAction, initial)
  const [title, setTitle] = useState(announcement?.title ?? "")
  const [message, setMessage] = useState(announcement?.message ?? "A clear, useful update for everyone using GrowthAI.")
  const [tone, setTone] = useState<AnnouncementTone>(initialTone)
  const [placement, setPlacement] = useState<AnnouncementPlacement>(announcement?.placement ?? "top_bar")
  const [backgroundColor, setBackgroundColor] = useState(announcement?.backgroundColor ?? initialColors.backgroundColor)
  const [textColor, setTextColor] = useState(announcement?.textColor ?? initialColors.textColor)
  const [accentColor, setAccentColor] = useState(announcement?.accentColor ?? initialColors.accentColor)
  const [alignment, setAlignment] = useState<AnnouncementAlignment>(announcement?.alignment ?? "center")
  const [buttonStyle, setButtonStyle] = useState<AnnouncementButtonStyle>(announcement?.buttonStyle ?? "solid")
  const [showIcon, setShowIcon] = useState(announcement?.showIcon ?? true)
  const [dismissible, setDismissible] = useState(announcement?.dismissible ?? true)
  const [linkLabel, setLinkLabel] = useState(announcement?.linkLabel ?? "")

  const preview = useMemo<PublicAnnouncement>(() => ({
    id: announcement?.id ?? "preview", title: title || null, message: message || "Your announcement message will appear here.", tone,
    placement, backgroundColor, textColor, accentColor, alignment, buttonStyle, showIcon,
    linkLabel: linkLabel || null, linkUrl: linkLabel ? "#" : null, dismissible, updatedAt: announcement?.updatedAt ?? "preview",
  }), [accentColor, alignment, announcement?.id, announcement?.updatedAt, backgroundColor, buttonStyle, dismissible, linkLabel, message, placement, showIcon, textColor, title, tone])

  function applyTone(value: AnnouncementTone) {
    setTone(value)
    setBackgroundColor(ANNOUNCEMENT_PRESETS[value].backgroundColor)
    setTextColor(ANNOUNCEMENT_PRESETS[value].textColor)
    setAccentColor(ANNOUNCEMENT_PRESETS[value].accentColor)
  }

  return <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.8fr)]">{announcement ? <input type="hidden" name="announcementId" value={announcement.id} /> : null}<div className="space-y-5"><fieldset className="space-y-3"><legend className="text-xs font-semibold text-neutral-400">Display type</legend><div className="grid gap-2 sm:grid-cols-3">{placementOptions.map((option) => <label key={option.value} className={cn("cursor-pointer rounded-xl border p-3 transition", placement === option.value ? "border-primary/40 bg-primary/8" : "border-white/8 bg-black/10 hover:border-white/15")}><input type="radio" name="placement" value={option.value} checked={placement === option.value} onChange={() => setPlacement(option.value)} className="sr-only" /><option.icon className={cn("size-4", placement === option.value ? "text-primary" : "text-neutral-600")} /><span className="mt-3 block text-xs font-bold text-neutral-300">{option.label}</span><span className="mt-1 block text-[9px] leading-4 text-neutral-600">{option.description}</span></label>)}</div></fieldset><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Style preset</span><select name="tone" value={tone} onChange={(event) => applyTone(event.target.value as AnnouncementTone)} className={fieldClass}><option value="info">Information</option><option value="offer">Offer</option><option value="warning">Warning</option><option value="critical">Critical</option></select></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Priority (0–100)</span><input name="priority" type="number" min={0} max={100} defaultValue={announcement?.priority ?? 50} className={fieldClass} /></label></div><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Title <span className="font-normal text-neutral-700">(optional)</span></span><input name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="A short headline" className={fieldClass} /></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Message</span><textarea name="message" required minLength={3} maxLength={240} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Example: Founder plan is 30% off until Friday." className={`${fieldClass} min-h-24 resize-y py-3 leading-6`} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Link text <span className="font-normal text-neutral-700">(optional)</span></span><input name="linkLabel" maxLength={40} value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="View offer" className={fieldClass} /></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">HTTPS URL or local path</span><input name="linkUrl" maxLength={500} defaultValue={announcement?.linkUrl} placeholder="/pricing" className={fieldClass} /></label></div><div className="grid gap-3 sm:grid-cols-3"><ColorField name="backgroundColor" label="Background" value={backgroundColor} onChange={setBackgroundColor} /><ColorField name="textColor" label="Text" value={textColor} onChange={setTextColor} /><ColorField name="accentColor" label="Accent" value={accentColor} onChange={setAccentColor} /></div><div className="grid gap-4 sm:grid-cols-2"><fieldset className="space-y-2"><legend className="text-xs font-semibold text-neutral-400">Text alignment</legend><div className="flex gap-2"><ChoiceButton name="alignment" value="left" selected={alignment === "left"} onSelect={() => setAlignment("left")} icon={AlignLeft} label="Left" /><ChoiceButton name="alignment" value="center" selected={alignment === "center"} onSelect={() => setAlignment("center")} icon={AlignCenter} label="Center" /></div></fieldset><fieldset className="space-y-2"><legend className="text-xs font-semibold text-neutral-400">CTA style</legend><div className="flex gap-2"><ChoiceButton name="buttonStyle" value="solid" selected={buttonStyle === "solid"} onSelect={() => setButtonStyle("solid")} icon={BellRing} label="Solid" /><ChoiceButton name="buttonStyle" value="outline" selected={buttonStyle === "outline"} onSelect={() => setButtonStyle("outline")} icon={BellRing} label="Outline" /></div></fieldset></div><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Starts at <span className="font-normal text-neutral-700">(UTC, optional)</span></span><input name="startsAt" type="datetime-local" defaultValue={utcInput(announcement?.startsAt)} className={fieldClass} /></label><label className="block space-y-2"><span className="text-xs font-semibold text-neutral-400">Ends at <span className="font-normal text-neutral-700">(UTC, optional)</span></span><input name="endsAt" type="datetime-local" defaultValue={utcInput(announcement?.endsAt)} className={fieldClass} /></label></div><div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-white/8 bg-black/10 p-4"><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-400"><input name="isActive" type="checkbox" defaultChecked={announcement?.isActive ?? true} className="size-4 accent-cyan-300" />Enabled</label><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-400"><input name="dismissible" type="checkbox" checked={dismissible} onChange={(event) => setDismissible(event.target.checked)} className="size-4 accent-cyan-300" />Visitors can dismiss</label><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-neutral-400"><input name="showIcon" type="checkbox" checked={showIcon} onChange={(event) => setShowIcon(event.target.checked)} className="size-4 accent-cyan-300" />Show icon</label></div><div className="flex flex-wrap items-center justify-between gap-3"><Feedback state={state} /><SaveButton creating={creating} /></div></div><aside className="xl:sticky xl:top-24 xl:self-start"><div className="overflow-hidden rounded-2xl border border-white/10 bg-[#07090a]"><div className="flex items-center justify-between border-b border-white/8 px-4 py-3"><div><p className="text-xs font-bold text-white">Live preview</p><p className="mt-0.5 text-[9px] text-neutral-600">Updates as you design</p></div><span className="rounded-full bg-primary/8 px-2 py-1 text-[9px] font-bold uppercase text-primary">{placement.replaceAll("_", " ")}</span></div><div className={cn("relative overflow-hidden", placement === "top_bar" ? "min-h-56" : "min-h-96", placement !== "popup" && "bg-[linear-gradient(135deg,#101415,#080a0b)] p-4")}><div className="mb-5 flex h-8 items-center gap-2 rounded-lg border border-white/5 bg-white/[.025] px-3"><span className="size-2 rounded-full bg-red-400/60" /><span className="size-2 rounded-full bg-amber-400/60" /><span className="size-2 rounded-full bg-emerald-400/60" /><span className="ml-2 h-2 w-24 rounded bg-white/5" /></div><AnnouncementPresentation announcement={preview} preview /></div></div><p className="mt-3 text-[10px] leading-5 text-neutral-700">Preview represents desktop placement. All three formats adapt to mobile screens automatically.</p></aside></form>
}

function ChoiceButton({ name, value, selected, onSelect, icon: Icon, label }: { name: string; value: string; selected: boolean; onSelect: () => void; icon: typeof AlignLeft; label: string }) {
  return <label className={cn("flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border text-[10px] font-bold", selected ? "border-primary/40 bg-primary/8 text-primary" : "border-white/8 bg-black/10 text-neutral-500")}><input type="radio" name={name} value={value} checked={selected} onChange={onSelect} className="sr-only" /><Icon className="size-3.5" />{label}</label>
}

export function AdminDeleteAnnouncementForm({ announcementId, message }: { announcementId: string; message: string }) {
  const [state, action] = useActionState(deleteAnnouncementAction, initial)
  return <form action={action} onSubmit={(event) => { if (!window.confirm(`Delete “${message}”? This cannot be undone.`)) event.preventDefault() }} className="flex flex-wrap items-center gap-3"><input type="hidden" name="announcementId" value={announcementId} /><DeleteButton /><Feedback state={state} /></form>
}
