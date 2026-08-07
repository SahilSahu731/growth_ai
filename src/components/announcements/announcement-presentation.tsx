"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, ArrowUpRight, BadgePercent, Info, Siren, X } from "lucide-react"

import type { PublicAnnouncement } from "@/lib/announcement-types"
import { cn } from "@/lib/utils"

const icons = { info: Info, offer: BadgePercent, warning: AlertTriangle, critical: Siren } as const

function AnnouncementContent({ announcement, compact = false }: { announcement: PublicAnnouncement; compact?: boolean }) {
  const Icon = icons[announcement.tone]
  const centered = announcement.alignment === "center"
  const linkStyle = announcement.buttonStyle === "solid"
    ? { backgroundColor: announcement.accentColor, color: announcement.backgroundColor, borderColor: announcement.accentColor }
    : { color: announcement.accentColor, borderColor: announcement.accentColor }
  return <div className={cn("flex min-w-0 items-start", compact ? "gap-2.5" : "gap-3.5", centered && !compact && "text-center")}>{announcement.showIcon ? <span className={cn("flex shrink-0 items-center justify-center rounded-xl", compact ? "mt-0.5 size-6" : "size-10")} style={{ backgroundColor: `${announcement.accentColor}1A`, color: announcement.accentColor }}><Icon className={compact ? "size-3.5" : "size-5"} /></span> : null}<div className={cn("min-w-0 flex-1", centered && !compact && "flex flex-col items-center")}>{announcement.title ? <p className={cn("font-black tracking-tight", compact ? "text-xs" : "text-lg")}>{announcement.title}</p> : null}<p className={cn("font-medium", compact ? "text-[11px] leading-5 sm:text-xs" : "mt-1 text-sm leading-6")}>{announcement.message}</p>{announcement.linkLabel && announcement.linkUrl ? <a href={announcement.linkUrl} target={announcement.linkUrl.startsWith("https://") ? "_blank" : undefined} rel={announcement.linkUrl.startsWith("https://") ? "noopener noreferrer" : undefined} className={cn("inline-flex items-center justify-center gap-1.5 border font-black transition hover:opacity-85", compact ? "ml-2 border-0 text-[11px] underline decoration-current/40 underline-offset-4" : "mt-4 min-h-9 rounded-lg px-4 text-xs")} style={compact ? { color: announcement.accentColor } : linkStyle}>{announcement.linkLabel}<ArrowUpRight className="size-3.5" /></a> : null}</div></div>
}

export function AnnouncementPresentation({ announcement, onDismiss, preview = false }: { announcement: PublicAnnouncement; onDismiss?: () => void; preview?: boolean }) {
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const modal = announcement.placement === "popup" && announcement.dismissible && !preview
  useEffect(() => {
    if (!modal) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onDismiss?.(); return }
      if (event.key !== "Tab" || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) { event.preventDefault(); dialogRef.current.focus(); return }
      const first = focusable[0]
      const last = focusable.at(-1)!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", keydown)
    return () => { document.removeEventListener("keydown", keydown); previousFocus.current?.focus() }
  }, [modal, onDismiss])
  const close = announcement.dismissible || preview ? <button type="button" aria-label="Dismiss announcement" onClick={onDismiss} className="flex size-11 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"><X className="size-4" /></button> : null
  const baseStyle = { backgroundColor: announcement.backgroundColor, color: announcement.textColor, borderColor: `${announcement.accentColor}55` }

  if (announcement.placement === "top_bar") {
    return <aside role={announcement.tone === "critical" ? "alert" : "status"} aria-live={announcement.tone === "critical" ? "assertive" : "polite"} className={cn("flex min-h-10 w-full items-center border-b px-3 py-2", !preview && "relative z-[70]")} style={baseStyle}><div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2"><AnnouncementContent announcement={announcement} compact />{close}</div></aside>
  }

  if (announcement.placement === "floating_banner") {
    return <aside role={announcement.tone === "critical" ? "alert" : "status"} className={cn("w-[calc(100%-2rem)] max-w-md rounded-2xl border p-5 shadow-2xl", preview ? "relative mx-auto" : "fixed bottom-4 right-4 z-[90] sm:bottom-6 sm:right-6")} style={baseStyle}><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><AnnouncementContent announcement={announcement} /></div>{close}</div></aside>
  }

  if (!announcement.dismissible && !preview) {
    return <aside role={announcement.tone === "critical" ? "alert" : "status"} aria-label={announcement.title ?? "Important announcement"} className="fixed inset-x-4 top-4 z-[90] mx-auto max-w-2xl rounded-2xl border p-5 shadow-2xl" style={baseStyle}><AnnouncementContent announcement={announcement} /></aside>
  }

  return <div className={cn("flex items-center justify-center", preview ? "relative min-h-80 rounded-xl bg-black/65 p-5" : "fixed inset-0 z-[100] bg-black/70 p-4 backdrop-blur-sm")} role="presentation" onMouseDown={(event) => { if (!preview && announcement.dismissible && event.target === event.currentTarget) onDismiss?.() }}><section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal={!preview} aria-label={announcement.title ?? "Announcement"} className="relative w-full max-w-md rounded-3xl border p-6 shadow-[0_32px_100px_rgba(0,0,0,.65)] outline-none sm:p-7" style={baseStyle}><div className="absolute right-3 top-3">{close}</div><div className="pr-10"><AnnouncementContent announcement={announcement} /></div></section></div>
}
