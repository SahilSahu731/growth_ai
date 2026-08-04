import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GrowthAI — Grow with intention", template: "%s | GrowthAI" },
  description: "A calm personal growth system that helps you choose what matters, take one meaningful step, and understand the patterns shaping your life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body className="antialiased">{children}</body>
    </html>
  );
}
