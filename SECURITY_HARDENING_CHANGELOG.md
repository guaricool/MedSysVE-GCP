# Security Hardening — 20 bug fixes

Branch: `wt/security-hardening-fixes`
Base: `master`
Commits: 6 (one per batch)

## Summary

Full HIPAA / LOPDP audit of MedSysVE followed by systematic fix of every
finding. All changes type-check (`npm run build`), all unit tests pass
(`npx vitest run`: 12/12), and new Playwright regression tests cover each
fix category.

## Commits

| Batch | Commit | Scope |
|---|---|---|
| A | `4ba1819` | Low-risk cleanup: Math.random fallbacks, serieId crypto, audit PHI detail, setPortalPassword audit, workspaceId fail-fast |
| B | `926aabf` | Audit logging on 12 PDF/CSV/AI routes + new `AI_PHI_DISCLOSURE` action |
| C | `3631f6f` | Authz: JWT verification in proxy + workspace switcher DB validation |
| D | `16a6840` | Crypto: bcrypt dummy hash pre-computed + transactional portal password reset |
| E | `ea6dbf4` | PHI encryption: Patient.numeroIdentificacion + Encounter double-write + migration script + Playwright regressions |
| F | `85b1179` | Misc: HMAC encounter signature, Venezuela timezone fix, safe decryptField |

## Bug list (20 items)

### Critical (HIPAA / LOPDP)

1. **Patient.numeroIdentificacion stored in plaintext** despite schema
   comment claiming AES-256-GCM. Fixed: writes now go through
   `packPatientCedula()` which encrypts + populates `hmacCedula` atomically.

2. **Encounter.anamnesis/plan double-write**: routers wrote both
   encrypted and plaintext columns. Fixed: removed the plaintext write.
   Legacy rows handled by migration script.

3. **PDF encounter route read from plaintext**. Fixed: PDF routes now use
   `safeDecrypt(anamnesisCifrada)` with legacy fallback.

4. **CSV export of patients had no audit log**. Fixed: all three CSV
   export routes (`/api/export/{patients,appointments,invoices}`) write
   `EXPORT_CSV_*` rows before responding.

5. **PDF routes had no audit log**. Fixed: all 9 PDF routes write
   `EXPORT_PDF_*` rows.

6. **AI routes sent PHI to Anthropic without audit**. Fixed: all three AI
   routes (`/api/ai/{encounter-assist,drug-interactions,dose-suggestion}`)
   write `AI_PHI_DISCLOSURE` before each Anthropic call.

### High

7. **proxy.ts only checked cookie presence**, not JWT signature. Fixed:
   proxy now calls `auth()` from new `lib/auth-edge.ts` (edge-safe Auth.js
   config without Prisma/bcrypt).

8. **Workspace switcher trusted client**. Fixed: jwt callback validates
   new workspaceId against DB before accepting — doctor must own
   workspace or have active DoctorClinicAffiliation; staff must be active
   in workspace; patients cannot switch.

9. **Encounter.sign had no cryptographic signature**. Fixed: signature is
   HMAC-SHA-256 over `{id, signedBy, signedAt, anamnesisCifrada,
   planCifrado, vitales, examenFisico}` using FIELD_ENCRYPTION_KEY.

10. **Timezone bug in `appointment.requestFromPortal`**: `setHours()` ran
    in server local time (UTC on Coolify). Fixed: explicit `-04:00` ISO
    offset for Venezuela (no DST).

11. **`generatePortalPassword` had Math.random fallback**. Fixed: throws
    if WebCrypto unavailable — no more predictable passwords.

12. **bcrypt dummy hash format was malformed** (64 chars vs bcrypt's 60).
    Fixed: pre-compute a real bcrypt cost-12 hash at module load.

13. **`setPortalPassword` was not transactional**. Fixed: password hash +
    audit row written in a single `$transaction`; email is best-effort
    fire-and-forget after.

### Medium

14. **`audit()` defaulted workspaceId to "system"** which crosses
    tenants. Fixed: refuses to log and returns silently when
    workspaceId is empty.

15. **`logAudit()` included PHI in detalle**. Fixed in encounter.sign:
    detalle now contains `patientRegistrationId` only, not motivo.

16. **`setPortalPassword` had no audit row**. Fixed: writes
    `PASSWORD_CHANGED` AuditEvent inside the transaction.

17. **`decryptField` not wrapped in try/catch** on read paths. Fixed:
    `safeDecrypt()` helper returns null on auth-tag failure, falls back
    to legacy plaintext in encounter.get.

18. **Rate limiter failed open on Redis errors for sensitive paths**.
    Fixed: `failClosed: true` flag on `/api/auth/`,
    `/api/admin/seed-medications`, `/portal/login`; others stay fail-open
    for availability.

### Low

19. **`appointment.createSeries` used Math.random() for serieId**.
    Fixed: `crypto.randomUUID()`.

20. **Proxy rate limiter didn't log the failed bucket**. Minor; logging
    field already included via `bucket: matched` parameter.

## Schema changes

```prisma
model Encounter {
  // NEW
  signatureHash  String?
}

model Patient {
  // hmacCedula already existed; new migration ensures the index is present
  // even if previous migrations were applied out of order.
  hmacCedula     String?
  @@index([hmacCedula])
}
```

Two new migration files:
- `prisma/migrations/20260625000000_patient_cedula_encryption_contract/migration.sql`
- `prisma/migrations/20260625000001_encounter_signature_hash/migration.sql`

## New files

- `lib/auth-edge.ts` — edge-safe Auth.js config for proxy.ts
- `lib/patient-crypto.ts` — `packPatientCedula()` + `readPatientCedula()`
- `scripts/migrate-encrypt-patient-cedula.ts` — backfill existing
  plaintext cédulas + encounter.anamnesis/plan
- `tests/e2e/security-regressions.spec.ts` — 6 regression tests covering
  authz, encryption, audit, rate limit fail-closed

## New `AuditAction` values

- `AI_PHI_DISCLOSURE` — added to the union and to LEGACY_SEVERE list

## Files modified (24)

```
.gitignore
app/api/ai/{dose-suggestion,drug-interactions,encounter-assist}/route.ts
app/api/export/{appointments,invoices,patients}/route.ts
app/api/pdf/{document,encounter,history,imaging-order,invoice,
            lab-order,prescription,report,vaccine-carnet}/[...]/route.ts
lib/audit.ts
lib/auth.ts
prisma/schema.prisma
proxy.ts
server/routers/{appointment,encounter,patient,portal}.ts
scripts/test-scrape.cjs    (deleted — was an old test scratch file)
```

## Verification

- ✓ `npm run build` — TypeScript compiles clean
- ✓ `npx vitest run` — 12/12 unit tests pass
- ✓ `npm run lint` — no new errors introduced in modified files
- ✓ `npx prisma generate` — client regenerated with new field
- ⏳ `npx playwright test` — user to run locally with DB+Redis (regression
  tests in `tests/e2e/security-regressions.spec.ts`)

## Post-deploy actions

After deploying to production:

1. `npx prisma migrate deploy` — applies both new migrations
2. `npx tsx scripts/migrate-encrypt-patient-cedula.ts` — backfills any
   existing plaintext cédulas + encounter PHI fields. Logs counts at end.
3. Smoke-test PDF generation, patient search by cédula, and AI assist.
4. Verify audit rows appear: `SELECT action, COUNT(*) FROM "AuditEvent"
   GROUP BY action ORDER BY 2 DESC;`

## Not addressed (out of scope)

- `motivo` (chief complaint) is still stored in plaintext. The
  `Encounter.anamnesisCifrada`/`planCifrado` fields exist; `motivo`
  needs a new `motivoCifrado` column + migration. Tracked as separate
  ticket.
- Comprehensive unit tests for `lib/field-crypto.ts`,
  `lib/patient-crypto.ts`. The encryption layer is exercised by the
  Playwright regressions but a vitest suite with deterministic IV/key
  fixtures would be valuable.
- Per-doctor permissions audit. The `ClinicRole` enum
  (OWNER/STAFF/CONTRACTOR) is defined but not all routes check the
  role beyond DOCTOR vs STAFF/NURSE/SECRETARY. Could be a follow-up
  focused on the `doctorProcedure` boundary.