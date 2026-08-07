import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.describe("public journeys", () => {
  for (const route of ["/", "/login", "/pricing", "/privacy", "/terms", "/security", "/ai-safety", "/subprocessors"] as const) {
    test(`${route} has no detectable WCAG A/AA violations`, async ({ page }) => {
      await page.goto(route)
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()
      expect(results.violations).toEqual([])
    })
  }

  test("HTML responses use a nonce-bound script policy", async ({ page }) => {
    const response = await page.goto("/")
    const policy = response?.headers()["content-security-policy"] ?? ""
    expect(policy).toContain("script-src 'self' 'nonce-")
    expect(policy).toContain("'strict-dynamic'")
    expect(policy.match(/script-src[^;]*/)?.[0]).not.toContain("'unsafe-inline'")
  })

  test("landing page reaches sign in and pricing", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.getByRole("link", { name: /pricing/i }).first()).toBeVisible()
    await page.getByRole("link", { name: /pricing/i }).first().click()
    await expect(page).toHaveURL(/\/pricing/)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("login preserves a safe callback and exposes one Google action", async ({ page }) => {
    await page.goto("/login?callbackUrl=%2Fpricing")
    await expect(page.getByRole("heading", { name: /keep growing/i })).toBeVisible()
    await expect(page.getByRole("button", { name: /continue with google/i })).toHaveCount(1)
  })

  test("protected pages redirect anonymous users to login", async ({ page }) => {
    await page.goto("/settings")
    await expect(page).toHaveURL(/\/login/)
  })
})
