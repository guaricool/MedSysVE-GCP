import { test, expect } from "@playwright/test"

test("doctor registration flow", async ({ page }) => {
  await page.goto("/register")
  await page.fill('[name="nombre"]', "Ana")
  await page.fill('[name="apellido"]', "García")
  await page.fill('[name="cedula"]', "98765432")
  await page.fill('[name="email"]', "ana.garcia@test.com")
  await page.fill('[name="password"]', "password123")
  await page.selectOption('[name="especialidad"]', "Gastroenterología")
  await page.fill('[name="workspaceNombre"]', "Consultorio Dra. García")
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL("/doctor", { timeout: 10000 })
  await expect(page.locator("h1")).toContainText("García")
})

test("shows error when cedula already exists", async ({ page }) => {
  await page.goto("/register")
  await page.fill('[name="nombre"]', "Otro")
  await page.fill('[name="apellido"]', "Doctor")
  await page.fill('[name="cedula"]', "98765432") // same as previous test
  await page.fill('[name="email"]', "otro@test.com")
  await page.fill('[name="password"]', "password123")
  await page.selectOption('[name="especialidad"]', "Cardiología")
  await page.fill('[name="workspaceNombre"]', "Otro Consultorio")
  await page.click('button[type="submit"]')

  await expect(page.locator("p.text-red-400")).toBeVisible({ timeout: 5000 })
})
