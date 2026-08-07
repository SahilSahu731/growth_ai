import { expect, test } from "@playwright/test"

test.describe("public journeys", () => {
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
