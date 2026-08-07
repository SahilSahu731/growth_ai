import type { Metadata } from "next"

import { TrustPage, TrustSection } from "@/components/legal/trust-page"
import { LEGAL_VERSIONS, legalDetails } from "@/lib/legal"

export const metadata: Metadata = { title: "Privacy", description: "How GrowthAI collects, uses, shares, retains, exports, and deletes personal data." }

export default function PrivacyPage() {
  const legal = legalDetails()
  return <TrustPage eyebrow="Privacy" title="Your data, explained plainly." summary="GrowthAI stores the information needed to provide your workspace. It does not sell personal data or use your conversations for advertising." updated={LEGAL_VERSIONS.privacy}>
    <TrustSection title="Who controls your data"><p>{legal.entity} is responsible for the service. Privacy questions and rights requests may be sent to <a href={`mailto:${legal.contact}`}>{legal.contact}</a>. Registered address: {legal.address}. Governing jurisdiction: {legal.jurisdiction}.</p></TrustSection>
    <TrustSection title="What we collect"><p>We collect your Google account identifier, verified email, name and optional profile image; chats and AI responses; goals, tasks, settings and interaction metadata; subscription identifiers and status; security, audit and limited request metadata. Razorpay receives payment details directly—GrowthAI does not store card numbers, CVV or banking credentials.</p></TrustSection>
    <TrustSection title="Why and on what basis"><p>We process account and workspace data to perform the service you request, secure it, provide support, prevent abuse and meet legal obligations. Optional product communication relies on consent where required. We do not enable behavioral advertising.</p></TrustSection>
    <TrustSection title="AI processing and people who may access data"><p>Relevant conversation context, active goals and open tasks may be sent to the configured Google Gemini service to generate a reply. Authorized support or security administrators may access limited account metadata; message content requires a documented support or safety reason and is audited. Provider personnel may process data under their service terms and access controls.</p></TrustSection>
    <TrustSection title="Retention"><p>Account data is kept while your account is active. You may choose 30-, 90-, 180- or 365-day message retention, or retain messages until you delete them. Account deletion removes active product data after billing prerequisites are satisfied. Security and billing records may be retained for up to 7 years when legally required; audit logs for 2 years; encrypted backups expire within 35 days and are not restored to recreate deleted accounts.</p></TrustSection>
    <TrustSection title="Exports, deletion and your rights"><p>Settings → Privacy provides a timestamped JSON export and controls for conversations, AI memory, retention and account deletion. Depending on your location, you may request access, correction, portability, restriction, objection or deletion. We verify identity before completing a data-subject request.</p></TrustSection>
    <TrustSection title="International processing and subprocessors"><p>Providers may process information outside your country using appropriate contractual safeguards. See the <a href="/subprocessors">current subprocessor list</a> for categories and purposes.</p></TrustSection>
    <TrustSection title="Children"><p>GrowthAI is intended for people aged {legal.minimumAge} or older. We do not knowingly create accounts for younger users. Contact us if you believe a minor has provided data.</p></TrustSection>
  </TrustPage>
}
