import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { isRazorpaySubscriptionId, isTrustedBillingRequest } from "@/lib/billing/razorpay"
import { getUserBilling, markBillingCancellationRequested } from "@/lib/data/account"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!isTrustedBillingRequest({
    requestUrl: request.url,
    origin: request.headers.get("origin"),
    fetchSite: request.headers.get("sec-fetch-site"),
    allowedOrigins: [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL],
  })) return NextResponse.json({ error: "Untrusted cancellation request." }, { status: 403 })
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 })
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null
  if (body?.confirmation !== "CANCEL") return NextResponse.json({ error: "Type CANCEL exactly to confirm." }, { status: 400 })

  const billing = await getUserBilling(session.user.id)
  const subscription = billing?.current
  if (!subscription || !["created", "pending", "authenticated", "active"].includes(subscription.status)) {
    return NextResponse.json({ error: "No cancellable subscription was found." }, { status: 404 })
  }
  if (subscription.cancelAtPeriodEnd) return NextResponse.json({ error: "Cancellation is already scheduled." }, { status: 409 })
  if (!isRazorpaySubscriptionId(subscription.providerSubscriptionId)) return NextResponse.json({ error: "Invalid subscription record." }, { status: 409 })
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 })

  try {
    const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subscription.providerSubscriptionId)}/cancel`, {
      method: "POST",
      headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "content-type": "application/json" },
      body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
    const result = await response.json().catch(() => null) as { id?: string; error?: { description?: string } } | null
    if (!response.ok || result?.id !== subscription.providerSubscriptionId) {
      console.error("Razorpay cancellation failed", response.status, result?.error?.description)
      return NextResponse.json({ error: "Cancellation could not be scheduled. No local plan change was made." }, { status: 502 })
    }
    await markBillingCancellationRequested(session.user.id, subscription.providerSubscriptionId)
    return NextResponse.json({ scheduled: true }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    console.error("Subscription cancellation failed", error)
    return NextResponse.json({ error: "Cancellation could not be scheduled. No local plan change was made." }, { status: 502 })
  }
}
