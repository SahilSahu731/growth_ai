import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { isTrustedMutationRequest } from "@/lib/billing/razorpay"
import { recordBillingUpgradeViewed } from "@/lib/data/account"

export async function POST(request: Request) {
  if (!isTrustedMutationRequest({ requestUrl: request.url, origin: request.headers.get("origin"), fetchSite: request.headers.get("sec-fetch-site"), allowedOrigins: [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL] })) return NextResponse.json({ error: "Untrusted request." }, { status: 403 })
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  await recordBillingUpgradeViewed(session.user.id)
  return new NextResponse(null, { status: 204 })
}
