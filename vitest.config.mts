import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  test: {
    include: ["src/**/*.test.ts", "convex/**/*.test.ts"],
    coverage: {
      include: ["src/**/*.{ts,tsx}", "convex/**/*.ts"],
      exclude: ["**/*.test.ts", "convex/_generated/**", "src/types/**"],
      reporter: ["text", "json-summary", "html"],
      // Ratchet these floors upward with each coverage-improving change. Critical
      // auth, data, environment, and model-boundary files also keep their own
      // baseline so broad UI files cannot hide a regression in a trusted path.
      thresholds: {
        lines: 18,
        functions: 11,
        statements: 17,
        branches: 16,
        "src/auth.ts": { lines: 82, functions: 66, statements: 76, branches: 68 },
        "src/lib/env.ts": { lines: 83, functions: 71, statements: 76, branches: 72 },
        "src/lib/operator/orchestrator.ts": { lines: 92, functions: 69, statements: 82, branches: 72 },
        "convex/operator.ts": { lines: 69, functions: 69, statements: 61, branches: 52 },
        "convex/users.ts": { lines: 80, functions: 66, statements: 74, branches: 54 },
      },
    },
  },
})
