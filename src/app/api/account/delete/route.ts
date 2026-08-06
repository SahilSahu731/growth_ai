import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { isTrustedMutationRequest } from "@/lib/billing/razorpay"
import { deleteUserAccount, getUserBilling } from "@/lib/data/account"

export async function POST(request: Request) {
  if (!isTrustedMutationRequest({
    requestUrl: request.url,
    origin: request.headers.get("origin"),
    fetchSite: request.headers.get("sec-fetch-site"),
    allowedOrigins: [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL],
  })) return NextResponse.json({ error: "Untrusted deletion request." }, { status: 403 })
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({ error: "Expected JSON." }, { status: 415 })
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => null) as { confirmation?: unknown } | null
  if (typeof body?.confirmation !== "string" || body.confirmation.trim().toLowerCase() !== session.user.email.toLowerCase()) return NextResponse.json({ error: "Enter your account email exactly to confirm." }, { status: 400 })
  const billing = await getUserBilling(session.user.id)
  if (billing?.current && ["created", "pending", "authenticated", "active"].includes(billing.current.status)) {
    return NextResponse.json({ error: "Cancel your subscription from Billing and wait for it to end before deleting your account." }, { status: 409 })
  }
  const deleted = await deleteUserAccount(session.user.id, body.confirmation)
  return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Account could not be deleted." }, { status: 409 })
}
