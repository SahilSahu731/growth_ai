import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: { include: ["src/lib/**/*.ts"], exclude: ["src/lib/data/**", "src/lib/convex-server.ts"] },
  },
})
