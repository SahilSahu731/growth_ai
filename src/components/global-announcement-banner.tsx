"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AlertTriangle, ArrowUpRight, BadgePercent, Info, Siren, X } from "lucide-react"

import type { PublicAnnouncement } from "@/lib/data/announcements"

const styles = {
  info: { bar: "border-cyan-400/20 bg-[#10242a] text-cyan-50", icon: Info, iconColor: "text-cyan-300", link: "text-cyan-200" },
  offer: { bar: "border-primary/25 bg-primary text-primary-foreground", icon: BadgePercent, iconColor: "text-primary-foreground", link: "text-primary-foreground" },
  warning: { bar: "border-amber-400/25 bg-[#3a2a0d] text-amber-50", icon: AlertTriangle, iconColor: "text-amber-300", link: "text-amber-200" },
  critical: { bar: "border-red-400/25 bg-[#3a1315] text-red-50", icon: Siren, iconColor: "text-red-300", link: "text-red-200" },
} as const

export function GlobalAnnouncementBanner() {
  const pathname = usePathname()
  const [announcement, setAnnouncement] = useState<PublicAnnouncement | null>(null)

  useEffect(() => {
    if (pathname.startsWith("/admin")) return
    const controller = new AbortController()
    fetch("/api/announcements", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ announcement: PublicAnnouncement | null }> : null)
      .then((data) => {
        const next = data?.announcement ?? null
        if (!next) return setAnnouncement(null)
        const dismissalKey = `growthai-announcement:${next.id}:${next.updatedAt}`
        setAnnouncement(window.localStorage.getItem(dismissalKey) ? null : next)
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") console.error("Announcement request failed", error)
      })
    return () => controller.abort()
  }, [pathname])

  if (pathname.startsWith("/admin") || !announcement) return null
  const appearance = styles[announcement.tone]
  const Icon = appearance.icon
  const dismissalKey = `growthai-announcement:${announcement.id}:${announcement.updatedAt}`
  return <aside data-global-announcement role={announcement.tone === "critical" ? "alert" : "status"} aria-live={announcement.tone === "critical" ? "assertive" : "polite"} className={`relative z-[70] flex min-h-10 w-full items-center border-b px-10 py-2 text-center ${appearance.bar}`}><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1"><Icon className={`size-4 shrink-0 ${appearance.iconColor}`} aria-hidden="true" /><p className="text-[11px] font-semibold leading-5 sm:text-xs">{announcement.message}</p>{announcement.linkLabel && announcement.linkUrl ? <a href={announcement.linkUrl} target={announcement.linkUrl.startsWith("https://") ? "_blank" : undefined} rel={announcement.linkUrl.startsWith("https://") ? "noopener noreferrer" : undefined} className={`inline-flex items-center gap-1 text-[11px] font-black underline decoration-current/40 underline-offset-4 sm:text-xs ${appearance.link}`}>{announcement.linkLabel}<ArrowUpRight className="size-3.5" /></a> : null}</div>{announcement.dismissible ? <button type="button" aria-label="Dismiss announcement" onClick={() => { window.localStorage.setItem(dismissalKey, "dismissed"); setAnnouncement(null) }} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition hover:bg-black/10"><X className="size-4" /></button> : null}</aside>
}
