import { createHmac, timingSafeEqual } from "node:crypto"

export function verifyGithubSignature(body: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=") || !secret) return false
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`
  const left = Buffer.from(expected)
  const right = Buffer.from(header)
  return left.length === right.length && timingSafeEqual(left, right)
}

type GithubPayload = Record<string, unknown> & {
  installation?: { id?: string | number }
  repository?: { full_name?: string; html_url?: string }
  head_commit?: { id?: string; message?: string; url?: string; timestamp?: string }
  action?: string
  pull_request?: { id?: string | number; merged?: boolean; title?: string; html_url?: string; updated_at?: string }
  release?: { id?: string | number; name?: string; tag_name?: string; html_url?: string; published_at?: string }
  deployment?: { id?: string | number; description?: string; environment?: string; created_at?: string }
}
export function normalizeGithubEvent(event: string, deliveryId: string, payload: GithubPayload) {
  const installationId = payload.installation?.id
  const repository = payload.repository?.full_name
  if (!installationId || !repository) return null
  if (event === "push" && payload.head_commit) return { installationId: String(installationId), repository, externalEventId: `${deliveryId}:${payload.head_commit.id}`, activityType: "commit" as const, title: payload.head_commit.message ?? "Commit pushed", url: payload.head_commit.url ?? payload.repository?.html_url ?? "", occurredAt: payload.head_commit.timestamp ?? new Date().toISOString() }
  if (event === "pull_request" && payload.pull_request) return { installationId: String(installationId), repository, externalEventId: `${deliveryId}:${payload.pull_request.id}`, activityType: (payload.action === "closed" && payload.pull_request.merged ? "merge" : "pull_request") as "merge" | "pull_request", title: payload.pull_request.title ?? "Pull request activity", url: payload.pull_request.html_url ?? "", occurredAt: payload.pull_request.updated_at ?? new Date().toISOString() }
  if (event === "release" && payload.release) return { installationId: String(installationId), repository, externalEventId: `${deliveryId}:${payload.release.id}`, activityType: "release" as const, title: payload.release.name ?? payload.release.tag_name ?? "Release", url: payload.release.html_url ?? "", occurredAt: payload.release.published_at ?? new Date().toISOString() }
  if (event === "deployment" && payload.deployment) return { installationId: String(installationId), repository, externalEventId: `${deliveryId}:${payload.deployment.id}`, activityType: "deployment" as const, title: payload.deployment.description || `Deployment to ${payload.deployment.environment ?? "production"}`, url: payload.repository?.html_url ?? "", occurredAt: payload.deployment.created_at ?? new Date().toISOString() }
  return null
}
