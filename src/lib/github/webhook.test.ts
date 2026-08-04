import { createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { normalizeGithubEvent, verifyGithubSignature } from "./webhook"

describe("GitHub webhook boundary", () => {
  it("verifies sha256 signatures", () => { const body = "{}"; const signature = `sha256=${createHmac("sha256", "secret").update(body).digest("hex")}`; expect(verifyGithubSignature(body, signature, "secret")).toBe(true); expect(verifyGithubSignature("x", signature, "secret")).toBe(false) })
  it("normalizes a push without treating it as self-reported progress", () => { const result = normalizeGithubEvent("push", "delivery", { installation: { id: 7 }, repository: { full_name: "acme/app" }, head_commit: { id: "abc", message: "test auth", url: "https://example.test/commit", timestamp: "2026-01-01T00:00:00Z" } }); expect(result).toMatchObject({ activityType: "commit", repository: "acme/app", externalEventId: "delivery:abc" }) })
})
