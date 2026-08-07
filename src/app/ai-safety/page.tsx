import type { Metadata } from "next"

import { TrustPage, TrustSection } from "@/components/legal/trust-page"

export const metadata: Metadata = { title: "AI safety", description: "GrowthAI AI limitations, safety behavior and emergency guidance." }

export default function AiSafetyPage() {
  return <TrustPage eyebrow="AI safety" title="A planning tool, not a clinician." summary="GrowthAI can help you reflect and plan. It cannot diagnose, treat, guarantee outcomes, or replace qualified human care." updated="2026-08-07">
    <TrustSection title="How replies are produced"><p>GrowthAI sends the minimum relevant conversation context, active goals and open tasks to the configured model provider. Output is schema-validated before storage. When the provider is unavailable, a deterministic fallback keeps basic planning available.</p></TrustSection>
    <TrustSection title="Safety behavior"><p>Independent rules check for crisis and high-risk content before a model call. Safety replies do not create goals or tasks. The system also sets boundaries around medical, legal, financial, abusive, delusional and dependency-forming requests.</p></TrustSection>
    <TrustSection title="Emergencies"><p>GrowthAI is not monitored by emergency professionals. If you or someone else may be in immediate danger, contact local emergency services now. In India call 112; in the United States or Canada call or text 988; elsewhere use your local emergency or crisis service.</p></TrustSection>
    <TrustSection title="Your judgement matters"><p>AI can misunderstand context and produce confident errors. Verify important information, avoid sharing unnecessary secrets, edit suggested tasks, and consult a qualified professional for high-stakes decisions.</p></TrustSection>
  </TrustPage>
}
