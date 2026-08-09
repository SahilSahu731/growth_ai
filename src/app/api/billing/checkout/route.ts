import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/auth"
import { beginBillingCheckout, completeBillingCheckout, releaseBillingCheckout } from "@/lib/data/account"
import { isAllowedRazorpayCheckoutUrl, isRazorpaySubscriptionId, isTrustedBillingRequest, paidPlanConfig, type PaidPlanId } from "@/lib/billing/razorpay"
import { getPurchasablePlan } from "@/lib/plans"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (process.env.BILLING_CHECKOUT_ENABLED !== "true") {
    return NextResponse.json({ error: "New checkout is temporarily unavailable. Existing subscriptions are unaffected.", code: "checkout_disabled" }, { status: 503, headers: { "retry-after": "3600" } })
  }
  if (!isTrustedBillingRequest({
    requestUrl: request.url,
    origin: request.headers.get("origin"),
    fetchSite: request.headers.get("sec-fetch-site"),
    allowedOrigins: [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL],
  })) return NextResponse.json({ error: "Untrusted checkout request." }, { status: 403 })
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ error: "Expected JSON." }, { status: 415 })
  }
  if (Number(request.headers.get("content-length") ?? "0") > 4096) return NextResponse.json({ error: "Payload too large." }, { status: 413 })
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 })
  const body = await request.json().catch(() => null) as { plan?: unknown } | null
  if (body?.plan !== "pro" && body?.plan !== "founder") return NextResponse.json({ error: "Choose a valid paid plan." }, { status: 400 })
  const plan = body.plan as PaidPlanId
  if (!getPurchasablePlan(plan)) return NextResponse.json({ error: "This plan is not open for new enrollment." }, { status: 409 })
  const planConfig = paidPlanConfig(plan, process.env)
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret || !planConfig) return NextResponse.json({ error: "Billing is not configured for this environment." }, { status: 503 })

  const lock = await beginBillingCheckout(session.user.id, plan)
  if (!lock.ok) {
    return NextResponse.json({
      error: lock.reason === "existing_subscription" ? "You already have a subscription. Manage it from Billing." : "A checkout is already in progress. Try again in a few minutes.",
      code: lock.reason,
    }, { status: 409 })
  }

  try {
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "content-type": "application/json" },
      body: JSON.stringify({
        plan_id: planConfig.planId,
        total_count: 120,
        quantity: 1,
        customer_notify: 1,
        notes: { userId: session.user.id, plan, checkoutToken: lock.token },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })
    const result = await response.json().catch(() => null) as { id?: string; short_url?: string; error?: { description?: string } } | null
    if (!response.ok || !isRazorpaySubscriptionId(result?.id) || !result.short_url || !isAllowedRazorpayCheckoutUrl(result.short_url)) {
      console.error("Razorpay checkout failed", response.status, result?.error?.description)
      await releaseBillingCheckout(session.user.id, lock.token)
      return NextResponse.json({ error: "Checkout could not be started." }, { status: 502 })
    }
    await completeBillingCheckout({
      userId: session.user.id, token: lock.token, providerSubscriptionId: result.id,
      providerPlanId: planConfig.planId, planTier: plan, amount: planConfig.amount, currency: planConfig.currency, checkoutUrl: result.short_url,
    })
    return NextResponse.json({ checkoutUrl: result.short_url }, { headers: { "cache-control": "no-store" } })
  } catch (error) {
    await releaseBillingCheckout(session.user.id, lock.token).catch(() => undefined)
    console.error("Checkout initialization failed", error)
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 502 })
  }
}

export function GET() {
  return NextResponse.json({ error: "Use POST to start checkout." }, { status: 405, headers: { allow: "POST" } })
}
