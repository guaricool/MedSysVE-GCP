/**
 * Permission matrix tests (audit #9).
 *
 * These tests verify the permission matrix documented in docs/PERMISSIONS.md
 * is consistent with the actual code:
 *
 * - Each router uses the procedures documented in PERMISSIONS.md
 * - The role-check logic in server/trpc.ts matches the documented semantics
 *
 * Why static-analysis tests instead of unit tests on procedures?
 * Importing server/trpc.ts pulls in Next.js (via @/lib/auth → next-auth),
 * which fails in vitest. So we test the BEHAVIOR through code introspection
 * rather than direct invocation. This still catches regressions like a
 * router accidentally changing `doctorProcedure` to `protectedProcedure`.
 */

import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROUTERS_DIR = join(process.cwd(), "server", "routers")

function listRouters(): string[] {
  return readdirSync(ROUTERS_DIR)
    .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
    .sort()
}

function readRouter(name: string): string {
  return readFileSync(join(ROUTERS_DIR, name), "utf-8")
}

function usesProcedure(routerSrc: string, proc: string): boolean {
  // Match `<proc>.input`, `<proc>.query`, `<proc>.mutation` (typical tRPC pattern).
  // Also match bare `<proc>` token to catch imports.
  const procRegex = new RegExp(`\\b${proc}\\b`, "g")
  return procRegex.test(routerSrc)
}

function detectProcedures(routerSrc: string): string[] {
  const candidates = [
    { proc: "publicProcedure", label: "public" },
    { proc: "protectedProcedure", label: "protected" },
    { proc: "doctorProcedure", label: "doctor" },
    { proc: "portalProcedure", label: "portal" },
    { proc: "clinicAdminProcedure", label: "clinicAdmin" },
  ]
  const importMatch = routerSrc.match(/import\s*{([^}]+)}\s*from\s*["']\.\.\/trpc["']/)
  const imports = importMatch ? importMatch[1] : ""

  return candidates
    .filter((c) => {
      const imported = imports.includes(c.proc)
      const used = usesProcedure(routerSrc, c.proc)
      return used && (imported || usesProcedureInBody(routerSrc, c.proc))
    })
    .map((c) => c.label)
}

function usesProcedureInBody(routerSrc: string, proc: string): boolean {
  // Strip the import statement so we only look at body usage.
  const withoutImport = routerSrc.replace(
    /import\s*{[^}]+}\s*from\s*["']\.\.\/trpc["']\s*;?/,
    "",
  )
  const procRegex = new RegExp(`\\b${proc}\\b`, "g")
  return procRegex.test(withoutImport)
}

// ---------------------------------------------------------------------------
// Source-of-truth: docs/PERMISSIONS.md declares which procedures each router
// uses. We verify the actual code matches.
// ---------------------------------------------------------------------------

// Expected matrix — keep in sync with docs/PERMISSIONS.md.
// "any" means the router may use any procedure (verified by code, not doc).
const EXPECTED_PROCEDURES: Record<string, string[]> = {
  "admin.ts": ["protected"],
  "alergia.ts": ["doctor"],
  "analytics.ts": ["doctor"],
  "announcement.ts": ["doctor"],
  "appointment.ts": ["doctor", "portal", "protected"],
  "audit.ts": ["doctor"],
  "auth.ts": ["protected", "public"],
  "availability.ts": ["doctor", "public"],
  "billing.ts": ["doctor"],
  // Audit S10 (2026-07-07): feature-flag admin router uses `protectedProcedure`
  // + an inline admin-only middleware (email allowlist) — same pattern as
  // admin.ts. Verified by code, not by procedure type.
  "feature-flag.ts": ["protected"],
  "clinicAdmin.ts": ["clinicAdmin", "public"],
  "clinicPublic.ts": ["doctor", "public"],
  "compliance.ts": ["doctor"],
  "consent.ts": ["doctor", "protected"],
  "doctor.ts": ["doctor", "protected", "public"],
  "document.ts": ["doctor"],
  "encounter.ts": ["doctor"],
  "expressOrder.ts": ["protected"],
  "icd10.ts": ["protected"],
  "imagingOrder.ts": ["doctor"],
  "insurance.ts": ["doctor", "protected"],
  "invoice.ts": ["doctor", "protected"],
  "labOrder.ts": [], // stub router, no procedures yet
  "labResult.ts": ["doctor"],
  "medication.ts": ["doctor"],
  "mensaje.ts": ["portal", "protected"],
  "notification.ts": ["protected"],
  "patient.ts": ["doctor", "protected"],
  "portal.ts": ["portal"],
  "prescription.ts": ["doctor"],
  "report-preferences.ts": ["doctor"],
  "staff.ts": ["doctor"],
  "staffNote.ts": ["doctor"],
  "tag.ts": ["doctor"],
  "task.ts": ["doctor"],
  "template.ts": ["doctor"],
  "twoFactor.ts": ["doctor"],
  "vaccine.ts": ["doctor"],
  "waitingRoom.ts": ["doctor"],
  "workspace.ts": ["doctor", "protected"],
}

// ===========================================================================
// Router-level: each router uses the procedures declared in PERMISSIONS.md
// ===========================================================================

describe("Permission matrix — router procedures", () => {
  for (const [router, expectedProcs] of Object.entries(EXPECTED_PROCEDURES)) {
    it(`${router} uses expected procedures: [${expectedProcs.join(", ")}]`, () => {
      const src = readRouter(router)
      const actualProcs = detectProcedures(src)

      for (const expected of expectedProcs) {
        expect(
          actualProcs,
          `${router} should use ${expected} (declared in docs/PERMISSIONS.md)`,
        ).toContain(expected)
      }
    })
  }
})

// ===========================================================================
// Coverage: every router in server/routers/ is covered by the matrix
// ===========================================================================

describe("Permission matrix — coverage", () => {
  it("every router file is listed in EXPECTED_PROCEDURES", () => {
    const allRouters = listRouters()
    const declared = Object.keys(EXPECTED_PROCEDURES)
    const missing = allRouters.filter((r) => !declared.includes(r))
    expect(
      missing,
      `New router(s) found but not in EXPECTED_PROCEDURES. Add them to docs/PERMISSIONS.md AND tests/unit/permissions.test.ts: ${missing.join(", ")}`,
    ).toEqual([])
  })

  it("every declared router still exists on disk", () => {
    const allRouters = listRouters()
    const declared = Object.keys(EXPECTED_PROCEDURES)
    const stale = declared.filter((r) => !allRouters.includes(r))
    expect(
      stale,
      `Declared router(s) no longer exist. Remove them from EXPECTED_PROCEDURES AND docs/PERMISSIONS.md: ${stale.join(", ")}`,
    ).toEqual([])
  })
})

// ===========================================================================
// Role-check logic in server/trpc.ts
// ===========================================================================

describe("Permission matrix — role-check semantics in server/trpc.ts", () => {
  const trpcSrc = readFileSync(join(process.cwd(), "server", "trpc.ts"), "utf-8")

  it("protectedProcedure rejects null session", () => {
    // Find the protectedProcedure block
    const block = trpcSrc.match(
      /export const protectedProcedure[\s\S]+?throw new TRPCError\(\{ code: "UNAUTHORIZED" \}\)/,
    )
    expect(block, "protectedProcedure should reject UNAUTHORIZED when session is null").not.toBeNull()
  })

  it("doctorProcedure requires role === 'DOCTOR'", () => {
    expect(trpcSrc).toMatch(
      /doctorProcedure[\s\S]+?ctx\.session\.role\s*!==\s*["']DOCTOR["']/,
    )
  })

  it("portalProcedure requires role === 'PATIENT'", () => {
    expect(trpcSrc).toMatch(
      /portalProcedure[\s\S]+?ctx\.session\.role\s*!==\s*["']PATIENT["']/,
    )
  })

  it("clinicAdminProcedure requires role === 'CLINIC_ADMIN' + clinicId", () => {
    expect(trpcSrc).toMatch(
      /clinicAdminProcedure[\s\S]+?ctx\.session\.role\s*!==\s*["']CLINIC_ADMIN["']/,
    )
    expect(trpcSrc).toMatch(/clinicAdminProcedure[\s\S]+?!ctx\.session\.clinicId/)
  })

  it("publicProcedure has no auth check", () => {
    // publicProcedure should be just `t.procedure` with no `.use(...)` middleware
    // beyond the initial declaration.
    expect(trpcSrc).toMatch(/export const publicProcedure\s*=\s*t\.procedure/)
    // And not have a `.use(...)` directly after.
    expect(trpcSrc).not.toMatch(/export const publicProcedure\s*=\s*t\.procedure\.use/)
  })
})

// ===========================================================================
// Forbidden operations must be on doctorProcedure, not protectedProcedure
// ===========================================================================

describe("Permission matrix — sensitive operations should NOT be on protectedProcedure only", () => {
  // These routers contain highly sensitive clinical operations and should
  // require doctorProcedure (or stricter). If any of them only use
  // protectedProcedure, it's a likely gap.
  //
  // KNOWN GAPS (tracked in docs/PERMISSIONS.md): none as of 2026-07-06.
  // Previously `billing.ts` was here (Gap #2) — fixed in audit S6 by
  // changing createCheckoutSession to doctorProcedure.
  const KNOWN_GAPS = new Set<string>([])
  const SHOULD_REQUIRE_DOCTOR = [
    "billing.ts",         // Gap #2: should require doctor
    "prescription.ts",
    "imagingOrder.ts",
    "audit.ts",
    "twoFactor.ts",
    "staff.ts",
    "task.ts",            // Audit S7 (2026-07-06): team coordination, doctor-only until staff login
    "waitingRoom.ts",     // Audit S7 (2026-07-06): reception operations, doctor-only until staff login
  ]

  for (const router of SHOULD_REQUIRE_DOCTOR) {
    it(`${router} uses doctorProcedure (not just protected)`, () => {
      const src = readRouter(router)
      const usesDoctor = usesProcedureInBody(src, "doctorProcedure")

      if (KNOWN_GAPS.has(router)) {
        // Known gap — verify it still has the gap (so we notice if it
        // gets fixed accidentally and we can remove from KNOWN_GAPS).
        expect(usesDoctor, `${router} is in KNOWN_GAPS but now uses doctorProcedure. Remove from KNOWN_GAPS.`).toBe(false)
        return
      }

      expect(
        usesDoctor,
        `${router} should expose at least one doctorProcedure operation. ` +
          `If only protectedProcedure is used, sensitive operations may be accessible to non-doctor users.`,
      ).toBe(true)
    })
  }
})

// ===========================================================================
// Multi-tenancy invariant: doctorProcedure must filter by workspaceId
// ===========================================================================

describe("Permission matrix — multi-tenancy invariant", () => {
  // Routers that legitimately operate doctor-scoped (not workspace-scoped)
  // and therefore don't need to reference ctx.session.workspaceId.
  // - billing.ts: Stripe subscriptions are doctor-scoped, not workspace-scoped.
  //   Verifies ownership via ctx.session.id === input.entityId instead.
  const WORKSPACE_OPT_OUT = new Set([
    "billing.ts",
    // report-preferences.ts is doctor-scoped, not workspace-scoped — a
    // doctor with multiple workspaces shares one set of report preferences
    // across all of them. The DoctorReportPreferences model is keyed by
    // doctorId, not workspaceId, by design. Verified manually.
    "report-preferences.ts",
  ])

  // Every router using doctorProcedure should filter by workspaceId
  // (otherwise cross-workspace data leak).
  it("routers with doctorProcedure filter by ctx.session.workspaceId", () => {
    const routers = Object.entries(EXPECTED_PROCEDURES)
      .filter(([_, procs]) => procs.includes("doctor"))
      .map(([name]) => name)
      .filter((name) => !WORKSPACE_OPT_OUT.has(name))

    for (const router of routers) {
      const src = readRouter(router)
      const usesDoctor = usesProcedureInBody(src, "doctorProcedure")
      if (!usesDoctor) continue
      // Heuristic: look for ctx.session.workspaceId in the file.
      expect(
        src.includes("ctx.session.workspaceId"),
        `${router} uses doctorProcedure but doesn't reference ctx.session.workspaceId — ` +
          `possible cross-workspace data leak. Verify manually.`,
      ).toBe(true)
    }
  })

  it("routers with clinicAdminProcedure filter by ctx.clinicId", () => {
    const routers = Object.entries(EXPECTED_PROCEDURES)
      .filter(([_, procs]) => procs.includes("clinicAdmin"))
      .map(([name]) => name)

    for (const router of routers) {
      const src = readRouter(router)
      const usesClinicAdmin = usesProcedureInBody(src, "clinicAdminProcedure")
      if (!usesClinicAdmin) continue
      expect(
        src.includes("ctx.clinicId") || src.includes("clinicId"),
        `${router} uses clinicAdminProcedure but doesn't reference ctx.clinicId — ` +
          `possible cross-clinic data leak. Verify manually.`,
      ).toBe(true)
    }
  })
})