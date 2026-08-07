import { legalDetails } from "@/lib/legal"

export function GET() {
  const legal = legalDetails()
  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://growthai.app"
  return new Response(`Contact: mailto:${legal.securityContact}\nPreferred-Languages: en\nCanonical: ${origin}/.well-known/security.txt\nPolicy: ${origin}/security\nExpires: 2027-08-07T00:00:00.000Z\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } })
}
