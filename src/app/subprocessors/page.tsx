import type { Metadata } from "next"

import { TrustPage, TrustSection } from "@/components/legal/trust-page"

export const metadata: Metadata = { title: "Subprocessors", description: "Providers that may process GrowthAI customer data." }

const providers = [
  ["Vercel", "Application hosting, delivery and operational logs", "Account, request and limited diagnostic metadata"],
  ["Convex", "Database and application functions", "Account and workspace content"],
  ["Google OAuth", "Account authentication", "Identifier, verified email, name and profile image"],
  ["Google Gemini", "AI response generation when enabled", "Relevant conversation context, active goals and open tasks"],
  ["Razorpay", "Hosted payment and subscription processing when enabled", "Billing contact and subscription/payment data"],
] as const

export default function SubprocessorsPage() {
  return <TrustPage eyebrow="Privacy" title="Subprocessors." summary="These providers may process data to operate GrowthAI. Analytics, email and monitoring providers are not listed because they are not currently integrated." updated="2026-08-07">
    <TrustSection title="Current providers"><div className="overflow-x-auto" tabIndex={0} aria-label="Current subprocessors table"><table className="w-full min-w-[620px] text-left"><thead><tr><th className="border-b py-3">Provider</th><th className="border-b py-3">Purpose</th><th className="border-b py-3">Data</th></tr></thead><tbody>{providers.map(([name, purpose, data]) => <tr key={name}><td className="border-b py-4 pr-4 font-semibold text-neutral-900">{name}</td><td className="border-b py-4 pr-4">{purpose}</td><td className="border-b py-4">{data}</td></tr>)}</tbody></table></div></TrustSection>
    <TrustSection title="Changes"><p>Material additions will be reflected here before the provider processes customer content. Provider configuration remains optional until enabled in the deployment environment.</p></TrustSection>
  </TrustPage>
}
