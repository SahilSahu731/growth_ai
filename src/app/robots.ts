import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_APP_URL : "https://growthai.app"
  return {
    rules: [{ userAgent: "*", allow: ["/", "/pricing", "/privacy", "/terms", "/security", "/ai-safety", "/subprocessors"], disallow: ["/api/", "/billing", "/chat", "/goals", "/tasks", "/weekly-report", "/growth-map", "/settings", "/dashboard", "/admin"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
