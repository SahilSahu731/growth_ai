"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { AnnouncementPresentation } from "@/components/announcements/announcement-presentation"
import type { PublicAnnouncement } from "@/lib/announcement-types"

export function GlobalAnnouncementBanner() {
  const pathname = usePathname()
  const [announcement, setAnnouncement] = useState<PublicAnnouncement | null>(null)

  useEffect(() => {
    if (pathname.startsWith("/admin")) return
    const controller = new AbortController()
    fetch("/api/announcements", { signal: controller.signal, cache: "no-store" })
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

  useEffect(() => {
    if (announcement?.placement !== "popup" || !announcement.dismissible) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previous }
  }, [announcement?.placement, announcement?.dismissible])

  if (pathname.startsWith("/admin") || !announcement) return null
  const dismissalKey = `growthai-announcement:${announcement.id}:${announcement.updatedAt}`
  return <div data-global-announcement><AnnouncementPresentation announcement={announcement} onDismiss={() => { window.localStorage.setItem(dismissalKey, "dismissed"); setAnnouncement(null) }} /></div>
}
