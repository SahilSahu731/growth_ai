import { ImageResponse } from "next/og"

export const alt = "GrowthAI — one clear next step"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px", color: "#f5f7f2", background: "radial-gradient(circle at 80% 18%, #2e7d32 0%, #102818 25%, #080a0b 58%)", fontFamily: "sans-serif" }}><div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 30, fontWeight: 700 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 54, height: 54, borderRadius: 16, background: "#8de83f", color: "#071007" }}>G</div>GrowthAI</div><div style={{ display: "flex", flexDirection: "column" }}><div style={{ maxWidth: 900, fontSize: 78, lineHeight: 1.03, letterSpacing: "-4px", fontWeight: 700 }}>Turn a stuck priority into one clear next step.</div><div style={{ marginTop: 28, color: "#aab3aa", fontSize: 25 }}>Clarify. Act. Review. Keep only what the evidence supports.</div></div></div>, size)
}
