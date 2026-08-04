import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login", request.url))
  const plan = new URL(request.url).searchParams.get("plan") === "founder" ? "founder" : "pro"
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const planId = plan === "founder" ? process.env.RAZORPAY_PLAN_ID_FOUNDER : process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY
  if (!keyId || !keySecret || !planId) return NextResponse.json({ error: "Billing is not configured for this environment." }, { status: 503 })

  const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
    method: "POST",
    headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, "content-type": "application/json" },
    body: JSON.stringify({ plan_id: planId, total_count: 120, quantity: 1, customer_notify: 1, notes: { userId: session.user.id, plan } }),
    cache: "no-store",
  })
  const result = await response.json() as { short_url?: string; error?: { description?: string } }
  if (!response.ok || !result.short_url) {
    console.error("Razorpay checkout failed", response.status, result.error?.description)
    return NextResponse.json({ error: "Checkout could not be started." }, { status: 502 })
  }
  return NextResponse.redirect(result.short_url)
}
