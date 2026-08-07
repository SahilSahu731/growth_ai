export const LEGAL_VERSIONS = { terms: "2026-08-07", privacy: "2026-08-07", aiNotice: "2026-08-07" } as const

export function legalDetails() {
  return {
    entity: process.env.LEGAL_ENTITY_NAME || "GrowthAI (pre-launch project)",
    jurisdiction: process.env.LEGAL_JURISDICTION || "Jurisdiction to be confirmed before public launch",
    address: process.env.LEGAL_CONTACT_ADDRESS || "Registered address to be confirmed before public launch",
    contact: process.env.LEGAL_CONTACT_EMAIL || "privacy@growthai.app",
    securityContact: process.env.SECURITY_CONTACT_EMAIL || "security@growthai.app",
    supportContact: process.env.SUPPORT_CONTACT_EMAIL || "support@growthai.app",
    minimumAge: Number(process.env.MINIMUM_USER_AGE || 18),
  }
}
