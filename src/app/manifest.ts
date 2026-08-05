import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GrowthAI",
    short_name: "GrowthAI",
    description: "A private AI growth coach for clear goals, focused tasks, and useful reflection.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0d0b",
    theme_color: "#58e05c",
    icons: [{ src: "/favicon.png", sizes: "1254x1254", type: "image/png", purpose: "maskable" }],
  }
}
