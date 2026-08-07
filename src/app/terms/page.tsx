import type { Metadata } from "next"

import { TrustPage, TrustSection } from "@/components/legal/trust-page"
import { LEGAL_VERSIONS, legalDetails } from "@/lib/legal"

export const metadata: Metadata = { title: "Terms", description: "Terms for using GrowthAI." }

export default function TermsPage() {
  const legal = legalDetails()
  return <TrustPage eyebrow="Terms" title="Terms of service." summary="These terms describe the rules for using GrowthAI and the limits of this public-beta service." updated={LEGAL_VERSIONS.terms}>
    <TrustSection title="Eligibility and account responsibility"><p>You must be at least {legal.minimumAge}, able to form a binding agreement, and provide a verified account you control. Keep access to your Google account secure and notify us about suspected misuse.</p></TrustSection>
    <TrustSection title="Acceptable use"><p>Do not use GrowthAI to harm people, violate law or rights, distribute malware, probe other accounts, bypass limits, automate abusive traffic, or rely on the service for emergency, clinical, legal, financial or other high-stakes decisions.</p></TrustSection>
    <TrustSection title="AI limitations"><p>AI output may be inaccurate, incomplete or unsuitable. GrowthAI is a reflection and planning tool—not medical care, therapy, emergency support, legal advice or financial advice. You remain responsible for decisions and should use qualified professionals where appropriate.</p></TrustSection>
    <TrustSection title="Subscriptions, cancellation and refunds"><p>Prices, currency, renewal period and taxes are shown before checkout. Paid subscriptions renew until cancellation is scheduled. You may cancel future renewal from Billing. Refund eligibility follows applicable law and the policy shown at checkout; contact {legal.supportContact} for billing help.</p></TrustSection>
    <TrustSection title="Beta availability and changes"><p>The service is in public beta. Features may change, fail or be withdrawn. Planned features are labelled and are not part of a purchase unless expressly included at checkout.</p></TrustSection>
    <TrustSection title="Content and licence"><p>You retain rights in content you submit. You grant {legal.entity} the limited rights needed to host, process, secure, back up and return that content through the service. You may export or delete it through account controls.</p></TrustSection>
    <TrustSection title="Suspension and termination"><p>We may restrict access to protect users, investigate abuse, comply with law or enforce these terms. You may delete your account after active billing obligations are resolved.</p></TrustSection>
    <TrustSection title="Disclaimers and liability"><p>To the extent allowed by law, the beta service is provided without guarantees of uninterrupted availability or error-free AI output. Liability is limited only as permitted under {legal.jurisdiction}; rights that cannot legally be excluded remain unaffected.</p></TrustSection>
    <TrustSection title="Questions and disputes"><p>Contact <a href={`mailto:${legal.contact}`}>{legal.contact}</a> first so concerns can be resolved. Applicable law and dispute venue will be those of {legal.jurisdiction}, subject to mandatory consumer protections.</p></TrustSection>
  </TrustPage>
}
