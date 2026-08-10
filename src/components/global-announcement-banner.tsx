"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { AnnouncementPresentation } from "@/components/announcements/announcement-presentation"
import type { PublicAnnouncement } from "@/lib/announcement-types"

let announcementRequest: Promise<{ announcement: PublicAnnouncement | null }> | null = null

function loadAnnouncement() {
  announcementRequest ??= fetch("/api/announcements", { cache: "default" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Announcement request failed (${response.status})`)
      return response.json() as Promise<{ announcement: PublicAnnouncement | null }>
    })
  return announcementRequest
}

export function GlobalAnnouncementBanner() {
  const pathname = usePathname()
  const [announcement, setAnnouncement] = useState<PublicAnnouncement | null>(null)

  useEffect(() => {
    let active = true
    void loadAnnouncement()
      .then((data) => {
        if (!active) return
        const next = data?.announcement ?? null
        if (!next) return setAnnouncement(null)
        const dismissalKey = `growthai-announcement:${next.id}:${next.updatedAt}`
        setAnnouncement(window.localStorage.getItem(dismissalKey) ? null : next)
      })
      .catch((error) => {
        console.error("Announcement request failed", error)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (announcement?.placement !== "popup" || !announcement.dismissible) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previous }
  }, [announcement?.placement, announcement?.dismissible])

  if (pathname.startsWith("/admin")) return null
  if (!announcement) return null
  const dismissalKey = `growthai-announcement:${announcement.id}:${announcement.updatedAt}`
  return <div data-global-announcement><AnnouncementPresentation announcement={announcement} onDismiss={() => { window.localStorage.setItem(dismissalKey, "dismissed"); setAnnouncement(null) }} /></div>
}
