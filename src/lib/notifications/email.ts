import "server-only"

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character) }

export async function sendCheckInEmail(input: { to: string; projectName: string; projectId?: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  if (!apiKey || !from) return { sent: false as const, failureCategory: "email_not_configured" }
  const url = input.projectId ? `${appUrl}/projects/${encodeURIComponent(input.projectId)}` : `${appUrl}/dashboard`
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [input.to], subject: `What moved on ${input.projectName}?`, html: `<div style="font-family:system-ui;max-width:560px;margin:auto"><h1>What moved on ${escapeHtml(input.projectName)}?</h1><p>Write one honest update, choose your next concrete action, and get back to building.</p><p><a href="${url}">Complete your check-in</a></p><p style="color:#777;font-size:12px">You enabled accountability emails in GrowthAI settings.</p></div>` }) })
  if (!response.ok) return { sent: false as const, failureCategory: `resend_${response.status}` }
  const body = await response.json() as { id?: string }
  return { sent: true as const, providerMessageId: body.id }
}
