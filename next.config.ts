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
      ],
    }, {
      source: "/admin/:path*",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; connect-src 'self'${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}` },
      ],
    }, {
      source: "/billing",
      headers: [
        { key: "Cache-Control", value: "private, no-store, max-age=0" },
        { key: "Content-Security-Policy", value: `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; connect-src 'self'${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}` },
      ],
    }]
  },
};

export default nextConfig;
