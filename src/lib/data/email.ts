import "server-only"
import { convexMutation } from "@/lib/convex-server"

export function receiveEmailProviderEvent(input: { providerEventId: string; payloadDigest: string; eventType: string; providerEmailId?: string }): Promise<{ duplicate: boolean }> {
  return convexMutation("email:receiveProviderEvent", input, { role: "webhook", subject: "webhook:resend", scope: "email:webhook" })
}
