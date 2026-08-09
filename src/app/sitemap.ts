import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_APP_URL : "https://growthai.app"
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/security`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/ai-safety`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/subprocessors`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ]
}
