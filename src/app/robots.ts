import type { MetadataRoute } from "next"
import { publicAppUrl } from "@/lib/public-url"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicAppUrl()
  return {
    rules: [{ userAgent: "*", allow: ["/", "/pricing", "/privacy", "/terms", "/security", "/ai-safety", "/subprocessors"], disallow: ["/api/", "/billing", "/chat", "/goals", "/tasks", "/weekly-report", "/growth-map", "/settings", "/dashboard", "/admin"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
