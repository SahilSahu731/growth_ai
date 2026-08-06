export type AnnouncementTone = "info" | "offer" | "warning" | "critical"
export type AnnouncementPlacement = "top_bar" | "floating_banner" | "popup"
export type AnnouncementAlignment = "left" | "center"
export type AnnouncementButtonStyle = "solid" | "outline"

export const ANNOUNCEMENT_PRESETS: Record<AnnouncementTone, { backgroundColor: string; textColor: string; accentColor: string }> = {
  info: { backgroundColor: "#10242A", textColor: "#ECFEFF", accentColor: "#67E8F9" },
  offer: { backgroundColor: "#72E7FF", textColor: "#031014", accentColor: "#031014" },
  warning: { backgroundColor: "#3A2A0D", textColor: "#FFFBEB", accentColor: "#FCD34D" },
  critical: { backgroundColor: "#3A1315", textColor: "#FEF2F2", accentColor: "#FCA5A5" },
}

export type PublicAnnouncement = {
  id: string
  title: string | null
  message: string
  tone: AnnouncementTone
  placement: AnnouncementPlacement
  backgroundColor: string
  textColor: string
  accentColor: string
  alignment: AnnouncementAlignment
  buttonStyle: AnnouncementButtonStyle
  showIcon: boolean
  linkLabel: string | null
  linkUrl: string | null
  dismissible: boolean
  updatedAt: string
}
