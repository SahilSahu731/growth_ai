import { NextRequest, NextResponse } from "next/server"

function nonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...bytes))
}

export function proxy(request: NextRequest) {
  const value = nonce()
  const development = process.env.NODE_ENV === "development"
  const convexOrigin = process.env.NEXT_PUBLIC_CONVEX_URL ? new URL(process.env.NEXT_PUBLIC_CONVEX_URL).origin : ""
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${value}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    // Tailwind and several Radix primitives currently emit style attributes.
    // Script execution remains nonce-bound; inline style removal is tracked as
    // a component migration rather than weakening script-src.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    `connect-src 'self' ${convexOrigin}${development ? " ws: wss:" : ""}`,
    "frame-src https://api.razorpay.com https://*.razorpay.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self' https://api.razorpay.com https://*.razorpay.com",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ")

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", value)
  requestHeaders.set("content-security-policy", policy)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("content-security-policy", policy)
  return response
}

export const config = {
  matcher: [{ source: "/((?!api/convex/jwks|_next/static|_next/image|favicon.png).*)", missing: [{ type: "header", key: "next-router-prefetch" }] }],
}
