import type { Metadata } from "next"
import "./globals.css"

const siteUrl = new URL(process.env.NEXT_PUBLIC_APP_URL?.startsWith("http") ? process.env.NEXT_PUBLIC_APP_URL : "https://growth.ai")
const description = "GrowthAI is a private AI growth coach that turns honest conversations into clear goals, focused tasks, and useful weekly reflection."

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
    icon: [{ url: "/favicon.png?v=2", type: "image/png", sizes: "1254x1254" }],
    shortcut: "/favicon.png?v=2",
    apple: [{ url: "/favicon.png?v=2", sizes: "1254x1254", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "GrowthAI",
    title: "GrowthAI — Grow with clarity and intention",
    description,
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "GrowthAI logo" }],
  },
  twitter: {
    card: "summary",
    title: "GrowthAI — Grow with clarity and intention",
    description,
    images: ["/logo.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { email: false, address: false, telephone: false },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="font-sans"><body className="antialiased">{children}</body></html>
}
