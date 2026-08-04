import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "GrowthAI — Accountability for builders", template: "%s | GrowthAI" },
  description: "Tell GrowthAI what you are building, and it makes sure you do not quietly abandon it.",
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
