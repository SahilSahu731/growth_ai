import type { NextConfig } from "next";

import { assertEnvironment } from "./src/lib/env";

if (process.env.GROWTHAI_VALIDATE_ENV === "1" || process.env.VERCEL_ENV === "production") {
  assertEnvironment(process.env, { production: true });
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Next 16's CLI type checker can lose captured output on Node 24.
  // The compiler API performs the same check without spawning that process.
  experimental: {
    useTypeScriptCli: false,
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ...(process.env.ENABLE_HSTS === "1" && process.env.NODE_ENV === "production"
          ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
          : []),
      ],
    }, {
      source: "/admin/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
      ],
    }, {
      source: "/billing",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
      ],
    }]
  },
};

export default nextConfig;
