import type { Metadata } from "next"

import { TrustPage, TrustSection } from "@/components/legal/trust-page"
import { legalDetails } from "@/lib/legal"

export const metadata: Metadata = { title: "Security", description: "GrowthAI security practices and vulnerability reporting." }

export default function SecurityPage() {
  const legal = legalDetails()
  return <TrustPage eyebrow="Security" title="Security without inflated promises." summary="GrowthAI uses layered application controls and publishes known operational boundaries. No internet service can promise absolute security." updated="2026-08-07">
    <TrustSection title="Current controls"><p>Google OAuth, HTTP-only sessions, scoped short-lived Convex application identities, server-enforced ownership, same-origin mutation checks, signed Razorpay webhooks, input validation, rate limits, security headers, secret and dependency scanning, encrypted transport and auditable administrator actions.</p></TrustSection>
    <TrustSection title="Data access"><p>Members can access only their own records. Administrative access is role-restricted. Sensitive support access requires justification and is recorded. Production validation rejects a Convex deploy key in the web runtime; the deployment owner must still verify isolation and rotate the historical key before launch.</p></TrustSection>
    <TrustSection title="Report a vulnerability"><p>Email <a href={`mailto:${legal.securityContact}`}>{legal.securityContact}</a> with reproduction steps, affected URLs and impact. Do not access other users’ data, degrade service, use social engineering or publish an unresolved issue. We aim to acknowledge reports within 3 business days.</p></TrustSection>
    <TrustSection title="Operational status"><p>Security review is continuous. A focused independent penetration test, production incident contacts and external audit export must be completed before paid launch; current status is disclosed rather than represented as certified.</p></TrustSection>
  </TrustPage>
}
