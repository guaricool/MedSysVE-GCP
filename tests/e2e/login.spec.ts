import { test, expect } from "@playwright/test"

test("login with wrong password shows error", async ({ page }) => {
  await page.goto("/login")
  await page.fill('[name="email"]', "ana.garcia@test.com")
  await page.fill('[name="password"]', "wrongpassword")
  await page.click('button[type="submit"]')
  await expect(page.locator("p")).toContainText("incorrectos")
})

test("unauthenticated user redirected to login", async ({ page }) => {
  await page.goto("/doctor")
  await expect(page).toHaveURL("/login")
})
