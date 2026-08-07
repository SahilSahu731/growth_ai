import { describe, expect, it } from "vitest"

import { safeCallbackPath } from "./safe-callback"

describe("safeCallbackPath", () => {
  it("keeps local paths", () => {
    expect(safeCallbackPath("/pricing?from=login#plans")).toBe("/pricing?from=login#plans")
  })

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)"])("rejects unsafe callback %s", (value) => {
    expect(safeCallbackPath(value)).toBe("/chat")
  })
})
