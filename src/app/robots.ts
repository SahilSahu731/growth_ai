import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_APP_URL : "https://growthai.app"
  return {
    rules: [{ userAgent: "*", allow: ["/", "/pricing"], disallow: ["/api/", "/chat", "/goals", "/tasks", "/weekly-report", "/growth-map", "/settings", "/dashboard"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
