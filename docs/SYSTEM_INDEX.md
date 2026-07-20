# MedSysVE — System Index

> **Propósito**: mapa completo del sistema. Entry point complementario a `AGENTS.md` (resumen ejecutivo). Este archivo es el catálogo exhaustivo: cada modelo, ruta, router, componente, script y operación.
>
> **Generado**: 2026-07-06 (regeneración completa — index + graph3d)
> **HEAD**: `b02e015b79254aa23ae4251fab37063dc2e36a6a` (feat portal: PDF Vista previa sin firma/sello)
> **Container prod**: `b02e015b...` healthy (Up ~6min). **Graphify graph**: 2117 nodos, 3514 edges, 189 comunidades.

---

## 1. Stack & versiones

| Capa | Tech | Versión |
|------|------|---------|
| Framework | Next.js (App Router) | 16.x |
| React | React | 19.x |
| API | tRPC | 11.x |
| ORM | Prisma | 7.x (con `@prisma/adapter-pg`) |
| DB | PostgreSQL (Google Cloud Cloud Run) | 16-alpine |
| Auth | Auth.js | v5 (NextAuth) |
| Styling | Tailwind CSS | v4 |
| UI primitives | Radix UI + shadcn/ui + Base UI | latest |
| Cache | Redis | 7-alpine |
| State | TanStack Query + React Hook Form + Zod | latest |
| AI | Anthropic SDK | `@anthropic-ai/sdk` (pinned: haiku for OCR, sonnet elsewhere) |
| Billing | Stripe | latest |
| Email | Nodemailer + Gmail SMTP | — |
| Deploy | Docker standalone + Google Cloud + Traefik | Google Cloud 4.1.2 |
| Repo | GitHub | `guaricool/MedSysVE` (master) |
| Knowledge graph | graphify + 3d-force-graph v1 | CDN-loaded, 2117 nodos, 189 comunidades |

---

## 2. Database (Prisma schema)

**Total**: **50 modelos**, **18 enums**, **27 migrations** (todas aplicadas, `prisma migrate status` = "up to date").

### 2.1 Modelos por dominio

#### Core (multi-tenancy)
- `Doctor` — médico, plan, admin flag, stripeCustomerId
- `Workspace` — unidad tenant scope (encounters, patients, etc.)
- `Clinic` — agrupación de workspaces (admin rol)
- `ClinicAdmin` — rol de admin de clínica
- `ClinicInvitationCode` — códigos de invitación staff/extra-seat
- `DoctorClinicAffiliation` — relación doctor ↔ clínica
- `Staff` + `StaffNote` — staff de clínica + notas
- `PatientRegistration` — registro paciente en un workspace (multi-cédula cross-tenant)
- `Patient` — paciente PHI-encrypted (cédula, email, teléfono)

#### Clinical
- `Encounter` — consulta, tiene `motivoCifrado`+`motivoHmac` (audit #1) + `anamnesisCifrada`+`planCifrado`
- `Diagnosis` — diagnósticos CIE-10
- `Alergia` — alergias paciente
- `Vaccine` — carnet de vacunación
- `Medication` — catálogo vademécum (~501 fármacos)
- `Prescription` + `PrescriptionItem` — recetas
- `LabOrder` + `LabResult` — órdenes de lab + resultados
- `ImagingOrder` + `ImagingOrderItem` — órdenes de imagen
- `Document` — documentos clínicos (incluye REFERIDO)
- `EncounterTemplate` + `DocumentTemplate` — plantillas

#### Scheduling & Communication
- `Appointment` — citas
- `DoctorAvailability` + `AvailabilityException` — calendario
- `WaitingEntry` — lista de espera del día
- `Mensaje` — mensajes doctor↔paciente (portal)
- `Notification` — in-app notifications (bell, audit #16 wireado)

#### Billing & Insurance
- `Invoice` + `InvoiceItem` + `Pago` — facturación USD/Bs con tasa BCV
- `InsuranceProvider` + `PatientInsurance` — seguros

#### Compliance & Legal (LOPDP Venezuela + audit)
- `AuditLog` — log general
- `AuditEvent` — eventos específicos con `archivedAt` (audit #10, retention 5y, helpers en audit-active-events.ts)
- `LegalVersion` — versiones del marco legal
- `ConsentAcceptance` — consentimientos firmados
- `ConsentTemplate` — plantillas de consentimiento
- `PatientConsent` — consentimientos de paciente
- `DataExportRequest` + `DataDeletionRequest` — derechos LOPDP Art. 61
- `BreachIncident` — registro de incidentes (retention 7y post-resolución)

#### Security
- `EmailOtp` — one-time passwords (login + recuperación)
- `TwoFactorBackupCode` — códigos backup 2FA

#### Other
- `Task` — tareas del workspace (priority enum)
- `Announcement` — anuncios de la clínica
- `PatientTag` — tags personalizables
- `ClinicPost` — posts del landing público

### 2.2 Enums (18)

`StaffRole`, `ClinicRole`, `ClinicAdminRole`, `IdentificationType`, `ParentRelationship`, `SexoType`, `EncounterStatus`, `DiagnosisTipo`, `DocumentTipo`, `AppointmentType`, `AppointmentStatus`, `PaymentMethod`, `InvoiceStatus`, `MensajeAutor`, `AlergiaGravedad`, `NotificationType`, `TaskPriority`, `OtpPurpose`

### 2.3 Migrations (27 — todas `applied`)

| # | Migration | Audit/Tema |
|---|-----------|-----------|
| 1 | `20260616190926_init` | init |
| 2-25 | (early migrations, see git log) | schema evolution |
| 24 | `20260630000000_add_sello_url` | digital seal |
| 25 | `20260702145636_encounter_motivo_encryption` | **audit #1** PHI |
| 26 | `20260702191500_audit_event_archival` | **audit #10** retention |
| 27 | `20260703010000_drop_encounter_motivo_legacy` | **audit #1 cleanup** drop plaintext |

---

## 3. Rutas (Next.js App Router)

**Total**: 80+ rutas organizadas en route groups.

### 3.1 `(auth)` — autenticación pública
- `/(auth)/login`
- `/(auth)/register` (con split doctor/clinic)
- `/(auth)/forgot-password`

### 3.2 `(dashboard)` — autenticadas (4 roles)
#### Admin
- `/(dashboard)/admin/branding`
- `/(dashboard)/admin/compliance`
- `/(dashboard)/admin/doctors`

#### Clínica (CLINIC_ADMIN role)
- `/(dashboard)/clinica` (overview)
- `/(dashboard)/clinica/staff`
- `/(dashboard)/clinica/invitaciones`

#### Doctor (DOCTOR role — el más completo)
- `/(dashboard)/doctor/workspace` (configuración)
- `/(dashboard)/doctor/patients` + `[patientRegId]` + `new`
- `/(dashboard)/doctor/patients/[patientRegId]/encounters/[encounterId]` (consulta workspace)
- `/(dashboard)/doctor/analytics`
- `/(dashboard)/doctor/audit`
- `/(dashboard)/doctor/billing`
- `/(dashboard)/doctor/chronics`
- `/(dashboard)/doctor/compliance`
- `/(dashboard)/doctor/consent-templates`
- `/(dashboard)/doctor/import`
- `/(dashboard)/doctor/insurance`
- `/(dashboard)/doctor/mensajes`
- `/(dashboard)/doctor/quality`
- `/(dashboard)/doctor/referrals`
- `/(dashboard)/doctor/schedule`
- `/(dashboard)/doctor/staff` + `invite`
- `/(dashboard)/doctor/tasks`
- `/(dashboard)/doctor/teleconsulta` + `[appointmentId]`
- `/(dashboard)/doctor/waiting-room`
- `/(dashboard)/doctor/appointments`

#### Nurse / Secretary / Assistant
- `/(dashboard)/nurse`, `/(dashboard)/secretary`, `/(dashboard)/assistant`

### 3.3 `api` — endpoints backend
#### AI (3)
- `POST /api/ai/dose-suggestion`
- `POST /api/ai/drug-interactions`
- `POST /api/ai/encounter-assist`

#### Cron (2)
- `POST /api/cron/appointment-reminders` (diario 8 AM)
- `POST /api/cron/bcv-update` (cada 6h)
- ✅ `archive-old-audit-events` (mensual, configurado en Google Cloud Scheduled Tasks)

#### PDF (10) — ahora con `?preview=1` para portal
- `GET /api/pdf/prescription/[id]` — soporta `?preview=1`
- `GET /api/pdf/imaging-order/[id]` — soporta `?preview=1`
- `GET /api/pdf/lab-order/[id]` — soporta `?preview=1`
- `GET /api/pdf/encounter/[id]`
- `GET /api/pdf/history/[patientRegId]`
- `GET /api/pdf/document/[id]` — soporta `?preview=1`
- `GET /api/pdf/vaccine-carnet/[patientRegId]`
- `GET /api/pdf/invoice/[id]`
- `GET /api/pdf/report/[year]/[month]`

#### Stripe (2)
- `POST /api/stripe/webhook` (4 eventos suscritos)
- `GET /api/stripe/portal` (Customer Portal session)

#### Upload (4)
- `POST /api/upload/logos`
- `POST /api/upload/sello`
- `POST /api/upload/membrete`
- `POST /api/upload/imaging-result`

#### Other
- `POST /api/auth/*` (NextAuth handlers)
- `GET /api/bcv-rate` (tasa BCV)
- `POST /api/lab-ocr` (OCR de resultados, **audit #14**: pinned a `claude-haiku-4-5`)
- `GET/POST /api/trpc/[trpc]` (tRPC entry)
- `GET /api/uploads/[...path]` (serving uploads)
- `POST /api/support-bot/chat`
- `POST /api/admin/seed-medications`
- `POST /api/import/patients`
- `GET /api/export/{appointments,invoices,patients}`

### 3.4 `clinica/[slug]` — landing público de clínicas
### 3.5 `legal/*` — páginas legales (cookies, privacidad, términos, LOPDP consentimiento)
### 3.6 `portal/*` — portal del paciente (PATIENT role, autenticado)
- `/portal/login`, `/portal/perfil`, `/portal/mensajes`, `/portal/examenes`, `/portal/lab-results`, `/portal/prescriptions`, `/portal/schedule`, `/portal/vacunas`

---

## 4. tRPC routers (39 archivos en `server/routers/`)

| Router | LOC | Responsabilidad |
|---|---|---|
| `document` | 770 | Documentos clínicos (incluye referidos + PDFs) |
| `clinicAdmin` | 719 | Admin de clínica (staff + invitaciones) |
| `patient` | 637 | CRUD pacientes (multi-tenant) |
| `doctor` | 619 | CRUD doctores + referral search |
| `encounter` | 574 | CRUD consultas + signing |
| `analytics` | 387 | Reportes |
| `auth` | 382 | Helpers de auth (current session) |
| `portal` | 359 | Endpoints del portal del paciente |
| `appointment` | 350 | Citas |
| `compliance` | 300 | LOPDP — export/delete requests |
| `admin` | 298 | Admin tools |
| `workspace` | 291 | Workspace management |
| `twoFactor` | 266 | 2FA TOTP |
| `invoice` | 259 | Facturación USD/Bs |
| `insurance` | 136 | Seguros |
| `availability` | 132 | Calendario |
| `medication` | 131 | Catálogo medicamentos |
| `task` | 130 | Tareas |
| `staff` | 124 | Staff CRUD |
| `mensaje` | 112 | Mensajes portal |
| `clinicPublic` | 109 | Endpoints públicos de clínica |
| `waitingRoom` | 109 | Lista de espera |
| `consent` | 103 | Consentimientos |
| `template` | 91 | Plantillas |
| `prescription` | 88 | Recetas |
| `billing` | 81 | Stripe billing |
| `labResult` | 81 | Resultados lab |
| `_app` | 81 | App router aggregator |
| `vaccine` | 66 | Vacunas |
| `alergia` | 58 | Alergias |
| `tag` | 56 | Tags |
| `staffNote` | 47 | Notas staff |
| `imagingOrder` | 43 | Órdenes imagen |
| `announcement` | 42 | Anuncios |
| `audit` | 36 | Audit log queries |
| `notification` | 36 | Notificaciones |
| `icd10` | 22 | Catálogo CIE-10 |
| `labOrder` | 4 | (thin wrapper) |

**Estructura típica** de cada router: ~4-10 procedures (queries + mutations) con `protectedProcedure` / `doctorProcedure` / `portalProcedure` / `clinicAdminProcedure`. Ver `docs/PERMISSIONS.md` para la matriz completa.

---

## 5. Components (30 directorios)

```
components/
├── admin/          # branding, doctors, compliance
├── analytics/      # charts, reports
├── appointments/   # calendar, booking
├── assistant/      # role-specific
├── auth/           # login, register, password reset
├── billing/        # subscription card, plans
├── clinic/         # clinic card, join form
├── clinic-admin/   # staff management, invitations
├── consent/        # consent templates
├── dashboard/      # shared layout widgets
├── encounter/      # consulta workspace, accordion, signing
├── insurance/      # insurance providers UI
├── layout/         # header, sidebar, footer
├── legal/          # consent gate, legal gate
├── mensajes/       # chat UI
├── notifications/  # bell, dropdown, wiggle animation
├── nurse/          # role-specific
├── patients/       # patient list, edit, delete modals
├── portal/         # patient portal UI (incl. portal-logout-button.tsx)
├── providers/      # provider search
├── referrals/      # referral form, merge dialog
├── schedule/       # schedule view
├── search/         # global search
├── secretary/      # role-specific
├── staff/          # staff invite UI
├── support/        # support bot widget
├── tasks/          # task list
├── ui/             # shadcn primitives (button, dialog, etc.)
├── waiting-room/   # waiting list UI
└── workspace/      # workspace settings, subscription card
```

---

## 6. Lib (~30 archivos de utilidades + 4 sub-directorios)

| Archivo | Propósito |
|---|---|
| `field-crypto.ts` (142) | AES-256-GCM + HMAC-SHA256 (PHI encryption primitives) |
| `patient-crypto.ts` (71) | Wrappers `packPatient`/`readPatient` |
| `encounter-crypto.ts` (75) | Wrappers `packEncounterMotivo`/`readEncounterMotivo` (audit #1) |
| `encounter-signing.ts` (54) | HMAC-SHA256 signing de encounter firmado (audit #7) |
| `audit.ts` (393) | Audit event helpers (read active, archive, etc.) |
| `auth.ts` (373) | NextAuth config + helpers (portal provider + doctor provider) |
| `auth-edge.ts` (46) | Auth para edge runtime (middleware) |
| `totp.ts` (79) | TOTP 2FA |
| `otp.ts` (265) | Email OTP |
| `account-lockout.ts` (149) | Lockout después de N intentos (per-email) |
| `password-policy.ts` (107) | Política de passwords (BCRYPT_COST=12) |
| `db.ts` (19) | Prisma client (singleton con globalThis.__prisma) |
| `redis.ts` (16) | Redis client singleton |
| `email.ts` (246) | Gmail SMTP transport |
| `whatsapp.ts` (115) | WhatsApp Business API |
| `storage.ts` (26) | File uploads |
| `stripe.ts` (15) | Stripe client singleton |
| `rate-limit.ts` (119) | Rate limiting (Redis sliding-window) |
| `log-sanitizer.ts` (174) | Sanitiza PHI de logs |
| `clinic-invitation-code.ts` (33) | Generator `CLINIC-XXXXXX` |
| `venezuela-locations.ts` (68) | 23 estados + ciudades principales |
| `tz.ts` (2) | Timezone helpers |
| `utils.ts` (7) | Misc utilities |
| `trpc-client.ts` (5) | Client-side tRPC |
| `feature-flags.ts` (218) | Feature flag system (env JSON, audit #8) |
| `medications-redis.ts` (60) + `.test.ts` (56) | Catálogo medicamentos cacheado en Redis |
| `medsysve-context.ts` | (legacy naming, deprecated) |

### 6.1 `lib/pdf/` (12 archivos, 2,062 LOC) — Pipeline PDF
- `header-logic.ts` — `buildPdfHeader`, `buildFooterLines`, `buildPdfBranding`
- `filename.ts` — `pdfFilename(slug, ...)` 
- `preview-watermark.tsx` — banner "⚠ VISTA PREVIA" (new, commit `b02e015`)
- `document-pdf.tsx` — INFORME / REPOSO / REFERIDO / CERTIFICADO
- `prescription-pdf.tsx` — receta dúo (mitad farmacia + mitad paciente)
- `lab-order-pdf.tsx` — orden de laboratorio
- `imaging-order-pdf.tsx` — orden de imagenología
- `encounter-summary-pdf.tsx` — resumen de consulta
- (más...)

Todos aceptan `omitSello?: boolean` → render sin firma/sello + watermark "VISTA PREVIA" para descargas del portal.

### 6.2 `lib/clinical/` (4 archivos) — Cálculos clínicos
- `imc.ts` (13), `vitals-alerts.ts` (36), `reposo.ts` (6), `__tests__/imc.test.ts` (22)

### 6.3 `lib/legal/` (3 archivos, 488 LOC) — Marco legal
- `legal-page.tsx` (33) + páginas servidas

---

## 7. Scripts operacionales (~40 archivos)

### Producción (deploy + operations)
- `health-check.sh` — health check del backup chain (cron)
- `backup-db.sh`, `backup.sh`, `restore-db.sh`, `restore.sh`, `restore-test.sh`, `run-restore-test.sh`
- `mount-secrets.sh`, `setup-gocryptfs.sh`, `setup-rclone.sh`, `setup-msmtp.sh` — infra setup
- `diagnose-rclone.sh`, `verify-rclone-auth.sh`, `verify-rclone-simple.sh`, `verify-cron.sh`
- `fix-p3009.sh`, `fix-proxy.py`
- `generate-graph3d.py` — **new** generador de visualización 3D

### Migrations de datos (one-shot scripts idempotentes)
- `archive-old-audit-events.ts` — **audit #10** retention script (cron mensual)
- `encrypt-existing-phi.ts` — backfill genérico de PHI
- `migrate-encrypt-patient-cedula.ts` — backfill cédula cifrada (Phase 24)

### Audit / monitoring
- `audit-rls.cjs` — verifica RLS policies
- `check-prod-pats.ts` — auditoría de PATs en prod
- `check-encryption.sh`, `check-email.sh`
- `scrape-vademecum.cjs` — scrape inicial del vademécum (con checkpoints)

### Dev / debug
- `db-topology.sh`, `smoke-test.sh`, `smoke-test-2.sh`, `verify-all.sh`
- `test-alert-failure.sh`, `test-msmtp.sh`, `test-new-token.sh`
- `check-css.sh`, `debug-redirect.sh`
- `generate-secrets.ps1`, `inject-secrets.ps1`, `legal-grandfather.sh`

---

## 8. Documentación (`docs/`)

| Archivo | Tema |
|---|---|
| `AGENTS.md` (top-level) | Entry point (resumen ejecutivo, 1-min overview) |
| `RUNBOOK.md` (top-level) | Operaciones del día a día (P3009 workaround documented) |
| `README.md` (top-level) | Repo overview |
| `PROJECT_STATUS.md` (top-level) | Estado del proyecto (sprint actual) |
| `SECURITY_HARDENING_CHANGELOG.md` (top-level) | Cambios de seguridad por sprint |
| `docs/SYSTEM_INDEX.md` | **Este archivo** — mapa exhaustivo del sistema |
| `docs/DATA_RETENTION.md` | Política de retención + script archive-old-audit-events |
| `docs/DR-PLAN.md` | Disaster Recovery runbook (RPO ≤24h, RTO ~30min) |
| `docs/PERMISSIONS.md` | Matriz de permisos por role/procedure (audit #9) |
| `docs/SECURITY-COMPLIANCE.md` | Estado de compliance LOPDP + NIST controls |
| `docs/IA_FEATURES_GUIDE.md` | 3 features de IA + feature flags |
| `docs/FEATURE_FLAGS.md` | Feature flags system (audit #8) |
| `docs/MANUAL-USUARIO.md` | Manual de usuario en español |
| `docs/MEMORIA-SISTEMA.md` | Notas internas (header STALE) |
| `docs/DOCUMENTACION-TECNICA.md` | Docs técnicas (header STALE) |
| `docs/AUDIT_BACKLOG.md` | Backlog de auditoría (scope inference) |
| `docs/N8N_META_INTEGRATION_LOG.md` | Automatizaciones externas (WhatsApp/Instagram/Meta) |
| `docs/superpowers/` | Plan + specs del proyecto (3 archivos) |

---

## 9. Hooks (2 client hooks)

- `hooks/use-keyboard-shortcuts.ts` (59) — atajos de teclado
- `hooks/use-mobile.ts` (20) — detección mobile/desktop

---

## 10. Tests

| Suite | Tests | Cobertura |
|---|---|---|
| `tests/unit/field-crypto.test.ts` | 41 | **audit #N3** primitives AES-256-GCM + HMAC |
| `tests/unit/encounter-crypto.test.ts` | 37 | **audit #6** packEncounterMotivo |
| `tests/unit/encounter-signing.test.ts` | 25 | **audit #7** HMAC signing |
| `tests/unit/permissions.test.ts` | 52 | **audit #9** matrix 35 routers |
| `tests/unit/feature-flags.test.ts` | ~30 | **audit #8** feature flag system |
| `tests/unit/anthropic-model-pinning.test.ts` | ~10 | **audit #14** AI model pinning |
| `tests/unit/audit-active-events.test.ts` | varios | **DATA_RETENTION gap #2** |
| `tests/unit/doctor.test.ts`, `patient.test.ts`, `staff.test.ts` | varios | schemas + flows |
| `tests/e2e/login.spec.ts`, `register.spec.ts`, `security-regressions.spec.ts` | Playwright | (config disponible, suite estable) |

**Total**: **249 tests passing** (12 unit files). Sin test suite E2E activa (Playwright setup disponible).

---

## 11. Deployment

### Container (producción)
- **Container name**: `hze8mocuh4xqskqwrm3mx50b-022320493669`
- **Image tag**: `hze8mocuh4xqskqwrm3mx50b:b02e015b79254aa23ae4251fab37063dc2e36a6a`
- **Status**: `Up ~6min, healthy` (Google Cloud)
- **Healthcheck**: GET `/login` → 200 cada 30s
- **Pre-deploy command**: `npx prisma generate`
- **Post-startup**: `npx prisma migrate deploy && node server.js`
- **Domain**: `https://medsysve.com` (apex) + `https://www.medsysve.com` (canonical), Traefik redirect apex→www

### Infrastructure (Google Cloud `Google Cloud Run`)
- Google Cloud 4.1.2 (self-hosted)
- PostgreSQL 16-alpine (container `tf03dm49her0vco2lprdqbjm`, healthy)
- Redis 7-alpine
- Traefik 3.6 (proxy + Let's Encrypt)
- n8n (automatizaciones externas)

### Cron jobs configurados (post-deploy audit)
| Job | Schedule | Endpoint |
|---|---|---|
| `archive-old-audit-events` | `0 3 1 * *` (1° de cada mes, 03:00 UTC) | `npx tsx scripts/archive-old-audit-events.ts` |
| `appointment-reminders` | diario 8 AM | `POST /api/cron/appointment-reminders` |
| `bcv-update` | cada 6h | `POST /api/cron/bcv-update` |
| `medsysve-deploy-monitor` (mavis cron) | cada 15min | SSH + docker ps check |

### Backup chain (DR-PLAN §3, audit #18 rewrite)
- Diario 07:00 UTC → `/tmp/medsysve-backup-<DATE>.sql.gz`
- gocryptfs encrypt → `/root/.medsysve-vault/`
- rclone crypt → `gdrive-medsysve-crypt:backups/` (AES-256)
- Retención: 7 daily + 4 weekly + 12 monthly (GFS)
- Health check: `bash /opt/medsysve-backup/health-check.sh`
- Monthly restore drill (Google Cloud Scheduled Task UUID `bljazmj4u5g3cmvbpqlg5m6i`)

---

## 12. Patrones críticos (revisar antes de modificar)

### 12.1 Multi-tenancy
- **Patient cross-tenant leak prevention**: cada `patient.findMany` filtra por `workspaceId`. Cross-tenant devuelve 404 (no leak de existencia).
- **`acceptReferral`**: NO silencia merge — detecta paciente existente en workspace destino por `(hmacCedula, tipoIdentificacion)`, dispara `MERGE_PENDING` + `resolveReferralMerge` con acciones `keep|update`.
- **Workspace para JWT smoke-test**: viene de `Encounter.workspaceId`, NO de `DoctorClinicAffiliation.clinicId`. Para mintear JWT funcional: `SELECT DISTINCT workspaceId FROM Encounter ORDER BY createdAt DESC LIMIT 5;`

### 12.2 Role isolation en proxy + layout (authz fix, 2026-07-07)
- `proxy.ts` lee sesión ANTES de las public-routes, redirige por rol:
  - `/` autenticado → role-appropriate dashboard (`/doctor` o `/portal`)
  - PATIENT en path no-portal → `/portal`
  - non-patient en `/portal/*` (excepto login) → `/`
- `app/(dashboard)/layout.tsx` defense-in-depth: PATIENT → redirect a `/portal`
- Portal del paciente tiene botón **Salir** (`components/portal/portal-logout-button.tsx`)

### 12.3 PHI Encryption (audit #1 + #6 + #N3 + #7)
- **Primitives**: `lib/field-crypto.ts` — AES-256-GCM (envelope `v1:base64`) + HMAC-SHA256
- **Helpers**: `lib/patient-crypto.ts` + `lib/encounter-crypto.ts` + `lib/encounter-signing.ts`
- **Pattern**: nuevo campo PHI = `campoCifrado String? @db.Text` + `campoHmac String?` + helper `packX`/`readX` + migration con ambas columnas + backfill script idempotente bajo `scripts/migrations/`. **Nunca** escribir plaintext PHI.
- **Backfill actual**: `motivoCifrado` (audit #1) — encounters encrypted. Legacy `motivo` column dropped (migration #27).
- **Key separation** (audit #7 followup): `FIELD_SIGN_KEY` separada de `FIELD_ENCRYPTION_KEY` para evitar invalidación de firmas en rotación de key PHI.

### 12.4 Audit (audit #10)
- `AuditEvent.archivedAt DateTime?` + `@@index([archivedAt, createdAt])`
- Retention 5 años hot, archived indefinido. **Compliance base: LOPDP Art. 19** (NO HIPAA — MedSysVE sirve clínicas venezolanas).
- `scripts/archive-old-audit-events.ts` corre mensualmente, idempotente, CLI flags `--retention-years --dry-run --help`. Cursor-based batched updates (no OFFSET).
- `lib/audit-active-events.ts` helpers: cualquier `prisma.auditEvent.findMany` en app code debe filtrar `archivedAt: null` para no devolver filas archivadas al UI (DATA_RETENTION gap #2 fix).

### 12.5 Auth (Auth.js v5)
- **Roles**: 4 (`DOCTOR`, `PATIENT`, `CLINIC_ADMIN`, `STAFF`)
- **Procedures**: 5 (`publicProcedure`, `protectedProcedure`, `doctorProcedure`, `portalProcedure`, `clinicAdminProcedure`)
- **Static-analysis matrix** (`docs/PERMISSIONS.md`): 35 routers mapeados, 52 tests de regresión. Si cambias `doctorProcedure` → `protectedProcedure` por error, el test falla.
- **Mensajes real-time-ish**: portal y doctor pollean cada 3s (interim, audit #5 backlog pendiente). True WebSocket/SSE requiere Redis pub/sub.

### 12.6 PDF generation con preview (audit #5 + 2026-07-07 fix)
- 10 endpoints PDF, 4 aceptan `?preview=1` (document, prescription, lab-order, imaging-order).
- `omitSello?: boolean` prop en cada PDF generator.
- Toggle sólo honrado para role=PATIENT (doctores siempre reciben copia legal).
- Filename incluye prefijo `preview-` para que el paciente distinga las descargas.
- Watermark "⚠ VISTA PREVIA — Sin validez legal" inline en el PDF, además de la omisión del sello + línea de firma.

### 12.7 Notifications bell (audit #16, audit #S16 cerrado)
- `bell` con wiggle animation (`@keyframes wiggle` en `app/globals.css`, expuesto via `@theme inline` en Tailwind v4)
- TIPO_CONFIG (icon + colors) + TIPO_HREF (clickable destination). Tipos wireados: `APPOINTMENT_REQUEST`, `PORTAL_MESSAGE`, `REFERRAL_ACCEPTED/REJECTED/RECEIVED`, `IMAGING_RESULT`, `SYSTEM` (mark-read-only).
- Si agregás tipo nuevo: enum + TIPO_CONFIG + TIPO_HREF map.

### 12.8 Mensajes portal (portal ↔ doctor)
- Polling 3s en ambos lados (interim hasta WebSocket/SSE real).
- `markRead` invalida `unreadCount` query del sidebar — bug fix 2026-07-07.
- Doctor envía `leido: true` en sus propios mensajes por construcción.

---

## 13. Operacional: configuración sensible

| Archivo | Status | Notas |
|---|---|---|
| `.env` | ❌ no existe | todo en `.env.local` |
| `.env.local` | ✅ gitignored | `DATABASE_URL`, Auth secret, encryption keys, etc. |
| `.env.stripe.local` | ✅ gitignored | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `.env.Google Cloud.local` | ✅ gitignored | `Google Cloud_API_TOKEN`, `Google Cloud_API_BASE_URL`, `Google Cloud_API_APP_UUID_MEDSYSVE` |

**KEYS críticas (separadas, audit #7 followup)**:
- `FIELD_ENCRYPTION_KEY` — AES-256-GCM para PHI encryption
- `FIELD_SIGN_KEY` — HMAC-SHA256 para encounter signing (separada para rotación independiente)
- `AUTH_SECRET` — JWT signing
- `REDIS_URL` — rate limit + lockout + medications cache

---

## 14. Open follow-ups

1. **Real-time mensajes paciente↔doctor** — polling 3s es interim; SSE/WebSocket con Redis pub/sub pendiente.
2. **Google Cloud deploy race condition** — algunos deploys fallan post-build con `No such container`. Workaround: re-trigger con push de commit nuevo (a veces `node.js builder` retiene puerto). Track cada caso en audit backlog.
3. **PDF `pdfUrl` column unused** — schema tiene `pdfUrl String?` en Document, Prescription, etc. pero ningún router lo escribe. Portal usa `/api/pdf/<entity>/${id}`. Migración para dropear pendiente.
4. **Encounter motivo backfill** — 18/18 encounters encrypted en encrypt-backfill. Nuevos encounters deben usar el campo cifrado directamente (validation en zod schema).
5. **Coverage en app/medical** — EncounterWorkspace, VitalsChart, LabResultsClient ya tienen tests E2E pendientes. Falta decisión sobre framework (Playwright vs Cypress).
6. **OG image regeneration** — `public/og-image.png` fue generada vía MCP en sesión previa, nunca committeada. Regenerar + commit cuando el landing se actualice.
7. **Working tree cleanup** — `notification-bell.tsx` TIPO_HREF, `og-image.png`, `.last-sync-sha` usualmente quedan en working tree entre sesiones. Commits separados para no contaminar features.

---

## 15. Diagrama de capas (alto nivel)

```
┌─────────────────────────────────────────────────────┐
│  Browser (HTTPS → Traefik → Next.js container)     │
└─────────────────────┬───────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │  Next.js 16 App Router    │
        │  - (auth) / (dashboard) / │
        │  - api/* / portal / legal │
        │  proxy.ts (role-based)    │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │  tRPC routers (39)        │
        │  - doctorProcedure        │
        │  - portalProcedure        │
        │  - protectedProcedure     │
        │  - clinicAdminProcedure   │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │  Prisma 7 (adapter-pg)    │
        │  50 models, 18 enums      │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │  PostgreSQL 16            │
        │  (container tf03dm...)    │
        └───────────────────────────┘

  Auxiliares:
  - Redis 7 (catálogo medicamentos + lockout + rate-limit + room for SSE pub/sub)
  - Google Cloud 4.1.2 (deploy + cron + scheduled tasks)
  - Stripe (billing webhooks + Customer Portal)
  - Anthropic API (encounter-assist, drug-interactions, dose-suggestion, lab-ocr)
  - Gmail SMTP (transactional email)
  - n8n (automatizaciones externas)
  - Google Drive (backups cifrados vía rclone)
  - graphify + 3d-force-graph (knowledge graph + visualization)
```

---

## 16. Tamaño del código (resumen — regenerado 2026-07-06)

| Categoría | Count | LOC |
|---|---|---|
| TS/TSX (UI + server) | 325 | 49,317 |
| Markdown (docs) | 26 | 12,923 |
| HTML (manual content) | 10 | 3,703 |
| Shell scripts | 30 | 2,239 |
| SQL migrations | 29 | 1,180 |
| CJS/PS1/other | 13 | 833 |
| CSS | 1 | 143 |
| **Total in-scope** | **433** | **~70,445** |

### Por categoría principal
| Área | Archivos | LOC |
|---|---|---|
| `server/routers/` (tRPC) | 38 | 8,129 |
| `components/encounter/` | 27 | 5,348 |
| `app/(dashboard)/` (pages) | 45 | 3,814 |
| `app/api/` (endpoints) | 31 | 3,035 |
| `components/patients/` | 19 | 2,260 |
| `lib/pdf/` | 12 | 2,062 |
| `tests/unit/` | 10 | 2,023 |
| `prisma/migrations/` | 27 | 1,147 |
| `app/portal/` | 10 | 835 |

### Top routers por LOC
1. `document.ts` (770) — 2. `clinicAdmin.ts` (719) — 3. `patient.ts` (637) — 4. `doctor.ts` (619) — 5. `encounter.ts` (574)

### Knowledge graph (graphify)
- 2,117 nodos, 3,514 edges, 189 comunidades
- `graphify-out/graph.html` — visualización interactiva 2D
- `graphify-out/graph3d.html` — **new** visualización 3D por capas (CDN 3d-force-graph v1)
- `graphify-out/GRAPH_REPORT.md` — reporte en lenguaje natural

---

## 17. Cambios recientes (último sprint, 2026-07-02 → 2026-07-07)

| Commit | Audit | Tema |
|---|---|---|
| `b02e015` | feat | PDF Vista previa sin firma/sello (portal) |
| `1472fca` | fix | 4 portal/UX fixes (logout, unread badge, polling 3s, landing teleconsulta) |
| `2578564` | audit #16 | notification-bell TIPO_HREF wireado |
| `1d71d49` | fix(authz) | portal CTA + role isolation (proxy + dashboard layout) |
| `6979a12` | fix(seo) | sitemap.xml/robots.txt bypass en PUBLIC_PREFIXES |
| `1dc779f` | feat(seo) | landing metadata + sitemap + robots + JSON-LD |
| `9ca0ba6` | audit #5 | role checks adicionales (5 routers) |
| `ec28975` | audit #5+#6 | procedure role checks (9 routers) |
| `6509011` | docs | close audit #18 + scope inference #4/#12/#13/#15/#16 |
| `df07fe6` | audit #18 | retention regex handles legacy + new formats |
| `c86d73e` | audit #18 | regex accepts legacy YYYYMMDD.sql.gz + REQUIRED_TABLES |
| `af6c8d3` | audit #18 | backup script rewrite + monthly restore drill |
| `3fc7f89` | audit #14 | lab-ocr pinned a claude-haiku-4-5 (no sonnet) |
| `06a5202` | audit #17 | move mint-jwt scripts out of repo |
| `9b81cbc` | audit #8-extend | feature flags in all AI routes |
| `02afc08` | audit #14 | Anthropic model pinning enforcement |
| `32ae673` | audit #7 | FIELD_SIGN_KEY separation from FIELD_ENCRYPTION_KEY |
| `91dfd23` | DATA_RETENTION #2 | archivedAt filter helpers for AuditEvent |
| `8d72ee0` | audit #1 cleanup | drop Encounter.motivo legacy column |
| `095b1c3` | audit #8 | feature flag system + 30 tests |

**Tests cumulativos**: 249 unit passing (12 archivos). 52 permissions regressions.
