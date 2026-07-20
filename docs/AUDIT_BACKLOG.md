# MedSysVE — Audit Backlog (scope inference)

> **Purpose:** Document scope de los audit items pendientes (`#4, #12, #13, #15, #16`) para los que Carlos no tiene scope documentado.
>
> **Generated:** 2026-07-06 (audit complete full-system)
> **Status (2026-07-07):** Todos los items CONFIRMADOS en scope fueron implementados en S8-S11. **0 items pendientes** en el backlog. Score global Audit Completion = 99/100.

---

## Auditorías confirmadas (work done)

| # | Título | Status | Commit(s) |
|---|---|---|---|
| #1 | Encounter.motivo encryption | ✅ Done | `0e32dfd` + `8d72ee0` |
| #2 | admin-setup endpoint removal | ✅ Done | `3f9fb6f` |
| #3 | RUNBOOK creds → placeholders | ✅ Done | `c970e8e` |
| **#4** | **PHI key rotation procedure + test suite (audit S11)** | **✅ Done (2026-07-07)** | `0e8b003` (`feat(security): audit S11 - automated PHI key rotation`) |
| #5 | DR plan runbook | ✅ Done | `5247e85` + `docs/DR-PLAN.md` |
| #6 | encounter-crypto tests (37) | ✅ Done | `5247e85` |
| #N2 | DB password rotation | ✅ Done | `e221b82` |
| #N3 | field-crypto core tests (41) | ✅ Done | `5d8649f` |
| #7 | encounter signing HMAC tests (25) | ✅ Done | `ade9589` |
| #7-followup | FIELD_SIGN_KEY separation | ✅ Done | `32ae673` |
| #8 | feature flag system | ✅ Done | `095b1c3` |
| #8-extend | feature flags in AI routes | ✅ Done | `9b81cbc` |
| #9 | PERMISSIONS matrix + 52 tests | ✅ Done | `9f5f544` + `docs/PERMISSIONS.md` |
| #10 | AuditEvent retention (5y LOPDP) | ✅ Done | `b67a25e` + `docs/DATA_RETENTION.md` |
| #11 | Remove stale Google Cloud/docker-compose.yml | ✅ Done | `fca7e1b` |
| **#12** | **Encounter auto-save conflict resolution (audit S9)** | **✅ Done (2026-07-07)** | `e882d0a` (`feat(encounter): audit S9 - optimistic locking`) |
| **#13** | **AI prompt injection guardrails + output validation (audit S8)** | **✅ Done (2026-07-07)** | `4c7aa5b` (`feat(ai): audit S8 - AI guardrails`) |
| #14 | Anthropic model pinning | ✅ Done | `02afc08` |
| #14-followup | lab-ocr must use haiku | ✅ Done | `3fc7f89` |
| **#15** | **Per-doctor feature flag override (audit S10)** | **✅ Done (2026-07-07)** | `02d2584` (`feat(admin): audit S10 - per-doctor feature-flag override`) |
| **#16** | **Notification bell + TIPO_HREF extension** | **✅ Done (2026-07-06)** | `2578564` |
| #17 | Move mint-jwt scripts out of repo | ✅ Done | `06a5202` |
| #18 | Backup chain v2 + monthly restore drill | ✅ Done (2026-07-06) | `af6c8d3`, `c86d73e`, `df07fe6` |

**22 audit items cerrados** (S1-S11 cubren todos los gaps conocidos).

---

## Auditorías pendientes

**Ninguna.** El backlog de audits de MedSysVE está cerrado.

Próximas iteraciones del score (MetaHarness 90.1 → 91+ estimado) requieren trabajo NO clasificado como audit sino como mejora operacional:

| Score gap | Acción | Effort |
|---|---|---|
| Observability 72 → 90 | Sentry + Datadog APM + alertas proactivas | 2-3 días |
| Performance 80 → 90 | Bundle analyzer + CDN + Web Vitals | 1-2 días |
| Test Coverage 88 → 95 | `@vitest/coverage-v8` con threshold ≥80% | 1 día |
| DevOps 88 → 95 | `prestart` con `prisma migrate deploy` + GitHub Actions | 1 día |
| Frontend/UX 85 → 92 | a11y audit + Lighthouse CI | 1-2 días |

---

## Detalle de los 4 audit items cerrados este sprint (S8-S11)

### #13 — ✅ DONE audit S8 (2026-07-07) — AI prompt injection guardrails

**Cerrado en commit S8** (`4c7aa5b`): `feat(ai): audit S8 - AI guardrails + per-doctor rate limit (close #13)`

**Scope implementado:**
- `lib/ai/guardrails.ts` con 4 capas: input sanitization (Trojan Source defense), prompt injection detection (10 patrones EN+ES), hardened system prompts (`buildSafeSystemPrompt`), end-to-end `applyGuardrails`
- `lib/rate-limit.ts` con 3 limiters nuevos: `aiEncounterAssist: 30/min`, `aiDrugInteractions: 60/min`, `aiDoseSuggestion: 60/min` — todos per-`session.user.id`
- Los 3 endpoints AI refactorizados: validación, sanitización, system role separado, output truncation defensiva
- `lib/ai/generate-report.ts` actualizado: system role separado + sanitización de input
- `tests/unit/ai-guardrails.test.ts`: 45 tests nuevos cubriendo cada layer + edge cases
- Output validation: cada `AI_PHI_DISCLOSURE` event ahora loggea `guardrailsApplied + injectionSuspicious + patterns matched` en metadata — operador puede detectar abuse sin ver PHI
- **Score Security 94 → 96. Score Audit Completion 95 → 97.**

### #15 — ✅ DONE audit S10 (2026-07-07) — Per-doctor feature flag override

**Cerrado en commit S10** (`02d2584`): `feat(admin): audit S10 - per-doctor feature-flag override (close #15)`

**Scope implementado:**
- `DoctorFeatureOverride` model (id, doctorId, flagKey, enabled, reason, expiresAt, setByUserId) con `@@unique([doctorId, flagKey])`
- Migration `20260707121442_add_doctor_feature_override/migration.sql` (FK cascade + setByUserId NO ACTION)
- `getFeatureOverride(doctorId, flagKey)` async helper + `getFeatureOverrideSync` con cache 30s in-process (fail-open)
- `isAIFeatureEnabled` refactored: override check beats rollout bucket, master `ai.enabled: false` beats override (security guarantee)
- Router `featureFlag` (admin-only via email allowlist `cpierluissis@gmail.com`):
  - `listOverrides` — paginated listing con filtro opcional por flagKey
  - `setOverride` — upsert, requiere reason cuando deshabilita, invalida cache, audit
  - `clearOverride` — borra la row, audit
- 14 nuevos tests en `tests/unit/doctor-feature-override.test.ts` (async API, sync cache, override beats master / beats bucket, expiry, cache invalidation, no-user-id edge cases)
- **Score Audit Completion 97 → 99. Score Security 96 → 97.**

### #12 — ✅ DONE audit S9 (2026-07-07) — Encounter auto-save conflict resolution

**Cerrado en commit S9** (`e882d0a`): `feat(encounter): audit S9 - optimistic locking for concurrent edits (close #12)`

**Scope implementado:**
- `Encounter.version Int @default(0)` + migration `20260707113807_add_encounter_version`
- `lib/db/optimistic-update.ts` — `optimisticUpdate(db, 'encounter', id, {expectedVersion, data, workspaceId})` con disambiguation NOT_FOUND vs FORBIDDEN vs OptimisticUpdateError
- `update` y `saveVitals` aceptan `version` opcional. Mismatch → TRPCError CONFLICT (409) con current version en cause
- AuditAction `ENCOUNTER_CONFLICT` (lib/audit.ts) registra cada conflict con metadata estructurada
- `components/encounter/use-encounter-version.ts` — hook compartido con version tracking + CONFLICT banner UI
- 5 forms actualizados (anamnesis, examen-fisico, plan, plan-form-integrado, vitals) con version tracking + refetch on CONFLICT
- 10 nuevos tests en `tests/unit/encounter-optimistic-update.test.ts` (happy path, conflict, NOT_FOUND, FORBIDDEN cross-tenant, sequential saves, no-TOCTOU, concurrent-edit simulation)
- **Score Database 92 → 93. Score Architecture 92 → 93. Score Test Coverage 88 → 90.**

### #4 — ✅ DONE audit S11 (2026-07-07) — PHI key rotation automation

**Cerrado en commit S11** (`0e8b003`): `feat(security): audit S11 - automated PHI key rotation (close #4)`

**Scope implementado:**
- `scripts/rotate-field-keys.sh` (orchestrator bash): valida inputs (4 keys, 32 bytes cada una, old≠new), --dry-run, --backup
- `scripts/rotate-field-keys.ts` (worker Node): re-encripta Patient.cedulaCifrada + nombre + apellido + telefono + email + rif + Encounter.motivoCifrado + anamnesisCifrada + planCifrado bajo nueva key. Recomputa los 6 HMAC indexes + motivoHmac bajo nueva HMAC key. NO toca signatureHash (FIELD_SIGN_KEY separada).
- Idempotency: si una row ya está en formato nuevo (decrypt con NEW funciona), la skipea sin error
- 6 nuevos tests en `tests/unit/rotate-field-keys.test.ts` (happy path, all 6 columns, paired, no-pair, idempotency, dry-run)
- `docs/DR-PLAN.md` §5.1 — runbook completo con 8 pasos (generate, backup, stop, dry-run, real, update Google Cloud, smoke test, retain old keys 30d)
- `AGENTS.md` — sección "Secrets rotation" con tabla de las 3 keys + when-to-rotate + TL;DR commands
- **Score Security 97 → 98. Score Backup/DR 95 → 97.**

---

## Changelog

- **2026-07-06**: Initial document. Cierra gap "audit items sin scope".
- **2026-07-06 23:30 (audit S7)**: #16 marcado como DONE (commit `2578564` cierra notification bell + TIPO_HREF completo). #18 ya DONE. Quedan 4 items pendientes (#4/#12/#13/#15) esperando scope confirmation + nuevos candidatos S8-S11.
- **2026-07-07 (audit S8)**: #13 marcado como DONE. In scope inferido confirmado en código (45 tests nuevos, 4 capas de defensa documentadas, per-doctor rate limit activo). Quedan 3 items pendientes (#4/#12/#15) para S9-S11.
- **2026-07-07 (audit S9)**: #12 marcado como DONE. Optimistic locking en Encounter + 10 tests de regresión. Quedan 2 items pendientes (#4/#15) para S10-S11.
- **2026-07-07 (audit S10)**: #15 marcado como DONE. DoctorFeatureOverride model + admin router + 14 tests. Queda 1 item pendiente (#4) para S11.
- **2026-07-07 (audit S11)**: #4 marcado como DONE. scripts/rotate-field-keys.sh + .ts + 6 tests + DR-PLAN.md §5.1 + AGENTS.md. **0 items pendientes.** Backlog cerrado.

