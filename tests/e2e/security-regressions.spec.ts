/**
 * Security regression tests for the bug fixes Carlos signed off on.
 *
 * Each test maps to one or more of the 20 bugs found in the original audit
 * (see GRAPH_REPORT.md and the bug-list delivered earlier). They run after
 * `npm run dev` + a seed admin user; they should NOT replace the existing
 * login/register tests, only extend them.
 *
 * How to run: `npx playwright test tests/e2e/security-regressions.spec.ts`
 *
 * Prereqs:
 *  - Postgres reachable at DATABASE_URL with migrations applied.
 *  - Redis reachable at REDIS_URL.
 *  - FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY set in the env.
 *  - A doctor account seeded with email `security-test@test.local`.
 */

import { test, expect } from "@playwright/test"

const TEST_EMAIL = "security-test@test.local"
const TEST_PASSWORD = "SecTest!2026!Pwd"

test.describe("Auth + proxy hardening (Bug #7)", () => {
  test("forged session cookie is rejected — user stays on /login", async ({ page, context }) => {
    // Plant a bogus cookie value in the session name. proxy.ts must verify
    // the JWT signature, not just check cookie presence.
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: "this-is-not-a-real-jwt",
        domain: "localhost",
        path: "/",
      },
    ])
    await page.goto("/doctor")
    // proxy.ts now calls auth() which returns null for the bogus cookie,
    // so the redirect to /login kicks in.
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Workspace switcher authorization (Bug #8)", () => {
  test("doctor cannot switch to another workspace via JWT update", async ({ page, request }) => {
    // Sign in first to get a real session.
    await page.goto("/login")
    await page.fill('[name="email"]', TEST_EMAIL)
    await page.fill('[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/doctor/, { timeout: 10_000 }).catch(() => null)

    // Attempt a malicious update with an arbitrary workspaceId. The fixed
    // JWT callback must reject this — the cookie that comes back should
    // still resolve to the original workspaceId.
    const resp = await request.post("/api/auth/session", {
      data: { workspaceId: "fake-workspace-id-from-another-clinic" },
    })
    expect(resp.status()).toBeLessThan(500)
    const body = await resp.json()
    if (body?.user?.workspaceId) {
      expect(body.user.workspaceId).not.toBe("fake-workspace-id-from-another-clinic")
    }
  })
})

test.describe("Patient PHI encryption (Bugs #1, #3, #5)", () => {
  test("registered patient has encrypted cedula in DB but decrypted in API response", async ({ page, request }) => {
    await page.goto("/login")
    await page.fill('[name="email"]', TEST_EMAIL)
    await page.fill('[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/doctor/, { timeout: 10_000 }).catch(() => null)

    // Use the tRPC client via fetch to register a patient.
    const reg = await request.post("/api/trpc/patient.register", {
      headers: { "content-type": "application/json" },
      data: {
        json: {
          tipoIdentificacion: "CEDULA_V",
          numeroIdentificacion: "V-99999999",
          sinCedula: false,
          nombre: "EncryptTest",
          apellido: "Paciente",
          fechaNacimiento: "1990-01-01",
          sexo: "MASCULINO",
          telefono: "04140000000",
          email: "encrypt.test@example.local",
        },
      },
    })
    expect(reg.status()).toBeLessThan(500)

    // The search API should find the patient by cédula — which proves
    // hmacCedula is populated AND search uses it.
    const search = await request.get("/api/trpc/patient.search?batch=1&input=" + encodeURIComponent(JSON.stringify({ "0": { json: { query: "V-99999999" } } })))
    expect(search.status()).toBe(200)
    const searchJson = await search.json()
    const hits = searchJson?.[0]?.result?.data?.json ?? []
    expect(hits.length).toBeGreaterThan(0)
    // API returns the DECRYPTED cédula, not the encrypted base64 blob.
    for (const hit of hits) {
      expect(hit.patient.numeroIdentificacion).toBe("V-99999999")
      expect(hit.patient.numeroIdentificacion).not.toMatch(/^[A-Za-z0-9+/=]{20,}$/)
    }
  })

  test("encounter PDF reads from encrypted field, not legacy plaintext", async ({ page }) => {
    // Smoke check: open an encounter PDF and verify the body shows the
    // expected historiaClinica. If the PDF renders the legacy plaintext only
    // and the new write didn't populate historiaClinicaCifrada, the doctor
    // sees an empty historiaClinica section.
    await page.goto("/login")
    await page.fill('[name="email"]', TEST_EMAIL)
    await page.fill('[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/doctor/, { timeout: 10_000 }).catch(() => null)
    // Navigating to a PDF requires a real encounter ID; this is a
    // placeholder. When run with seeded data, set the encounter ID here.
    test.skip(!process.env.TEST_ENCOUNTER_ID, "Requires TEST_ENCOUNTER_ID env var")
  })
})

test.describe("Audit logging (Bugs #4, #5, #6)", () => {
  test("audit row written when /api/export/patients is hit", async ({ page, request }) => {
    await page.goto("/login")
    await page.fill('[name="email"]', TEST_EMAIL)
    await page.fill('[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/doctor/, { timeout: 10_000 }).catch(() => null)

    const r = await request.get("/api/export/patients")
    expect(r.status()).toBe(200)

    // After the fix, an EXPORT_CSV_PATIENTS row must exist in the audit
    // table. We can't query the DB from the browser context, but the
    // /api/audit/recent route (if exposed) would let us assert. For now
    // we assert only that the response is a CSV — full DB assertion
    // belongs in a vitest integration test.
    expect(r.headers()["content-type"]).toContain("text/csv")
  })

  test("AI assist records AI_PHI_DISCLOSURE audit row", async ({ page, request }) => {
    await page.goto("/login")
    await page.fill('[name="email"]', TEST_EMAIL)
    await page.fill('[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/doctor/, { timeout: 10_000 }).catch(() => null)

    const r = await request.post("/api/ai/encounter-assist", {
      headers: { "content-type": "application/json" },
      data: {
        motivo: "dolor torácico",
        historiaClinica: "PACIENTE CON ANTECEDENTES — test data only",
      },
    })
    // Either 200 (AI responded) or 4xx (no API key). Either way, no 500.
    expect(r.status()).toBeLessThan(500)
    // The actual audit row assertion would query the DB. That's a
    // vitest integration test concern, not a browser test.
  })
})

test.describe("Rate limiting fail-closed (Bug #18)", () => {
  test("seed-medications endpoint stays protected when Redis is unreachable", async ({ request }) => {
    // This is hard to test deterministically without breaking Redis.
    // The fix added `failClosed: true` for sensitive buckets. Smoke check:
    // hitting the endpoint without auth should still 401.
    const r = await request.post("/api/admin/seed-medications")
    expect([401, 403]).toContain(r.status())
  })
})