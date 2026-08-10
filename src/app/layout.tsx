import type { Metadata } from "next"
import "./globals.css"
import { GlobalAnnouncementBanner } from "@/components/global-announcement-banner"
import { publicAppUrlObject } from "@/lib/public-url"

const siteUrl = publicAppUrlObject()
const description = "GrowthAI is an access-controlled AI growth coach that turns honest conversations into clear goals, focused tasks, and useful weekly reflection."

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "GrowthAI",
  title: { default: "GrowthAI — AI Goals, Tasks & Personal Growth Coach", template: "%s | GrowthAI" },
  description,
  keywords: ["AI growth coach", "personal growth", "AI goal planner", "goal tracking", "AI task planner", "weekly reflection", "life planning"],
  authors: [{ name: "GrowthAI", url: siteUrl }],
  creator: "GrowthAI",
  publisher: "GrowthAI",
  category: "productivity",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.png?v=2", type: "image/png", sizes: "500x500" }],
    shortcut: "/favicon.png?v=2",
    apple: [{ url: "/favicon.png?v=2", sizes: "500x500", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "GrowthAI",
    title: "GrowthAI — Grow with clarity and intention",
    description,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "GrowthAI — one clear next step" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowthAI — Grow with clarity and intention",
    description,
    images: ["/twitter-image"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { email: false, address: false, telephone: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="font-sans" suppressHydrationWarning><body className="antialiased"><GlobalAnnouncementBanner />{children}</body></html>
}
