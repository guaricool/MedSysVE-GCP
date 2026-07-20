<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# MedSysVE — Agent Entry Point

> **Resumen ejecutivo (1 minuto):** SaaS multi-tenant de Historia Clínica Electrónica para médicos venezolanos. Tema oscuro, asistencia IA, facturación dual USD/Bs con tasa BCV, portal para pacientes, red de referidos entre doctores, suscripciones mensuales/trimestrales via Stripe. Stack: Next.js 16 + React 19 + tRPC 11 + Prisma 7 + PostgreSQL + Auth.js v5 + Tailwind v4 + shadcn/ui + Redis. Deploy: Cloud Run + Docker standalone en GCP GCP `Google Cloud Run`. Repo: `github.com/guaricool/MedSysVE` (`master`).

---

## Estado actual (2026-07-14)

- **HEAD:** `9a963d0` en `master` — `feat(safety): drug-allergy interaction check end-to-end`
- **Cambios recientes (última semana, 2026-07-08 → 2026-07-14):**
  - `9a963d0` feat(safety): drug-allergy interaction check end-to-end (lib/drug-allergies.ts con 30 familias VE + match exact/synonym/family, UI warning en prescription-form, defense-in-depth en prescription router, banner rojo en PDF, inyeccion de alergias en prompts AI, audit ALLERGY_OVERRIDE)
  - `34b94e8` chore: remove dead EncounterClient + update stale AGENTS.md note
  - `5522858` test(reports): 35 unit tests for report sections + buildReportPrompt
  - `ace1249` feat(reports): per-consulta override modal in informe-form
  - `3dabd71` feat(reports): /doctor/preferencias-informe UI
  - `bedcd3a` fix(billing): post-checkout redirect to /workspace + SubscriptionCard reads stripeSubscriptionId
  - `51d4eac` fix(billing): derive success_url/cancel_url from NEXTAUTH_URL with www. prefix
  - `f6dec8a` + `6949f2f` feat(observability): wire @sentry/nextjs to self-hosted GlitchTip
- **Último deploy verificado:** container `hze8mocuh4xqskqwrm3mx50b-...` con image `9a963d0f5fc09a7bd07b1400e3c928742a52ba4f` healthy (running:healthy, last_online_at 2026-07-14 22:24 UTC).
- **Drug-allergy safety feature (LIVE):** nueva `lib/drug-allergies.ts` con 30+ familias farmacológicas VE (penicilinas, AINEs, cefalosporinas, sulfas, macrólidos, etc.) + 3-level matcher. UI warning al seleccionar med contraindicado (rojo=naranja según severidad). Server defense-in-depth rechaza addItem sin overrideAlerta=true. PDF de receta muestra banner "ALERGIAS DEL PACIENTE" en ambas mitades (farmacia + paciente) + badge "OVR" en items con override. AI inyecta alergias activas en system prompt de encounter-assist y plan-suggestion. Audit `ALLERGY_OVERRIDE` por cada override aceptado. 31 unit tests, `tsc --noEmit` clean, `next build` Compiled successfully in 8.0s.
- **Backup infrastructure migrada a Google Cloud Storage (2026-07-13, manual ops):** Drive OAuth token venció y Service Accounts de Google Drive no tienen storage quota en cuentas personales (requiere Workspace + Shared Drives, descartado por costo). B2 es la solución permanente: bucket privado `medsysve-backups`, app key con scope solo al bucket, doble encryption (gpg + rclone crypt). **4 retention bugs acumulados en `/opt/medsysve-backup/backup.sh` arreglados** (awk $1↔$2, `((COUNT++))` con set -e, `[[ ]] && action` propagando exit 1, `date -d "$EPOCH seconds ago -N days"` inválido) — los 4 estaban rotos desde el deploy inicial, archivos se acumulaban sin límite. Backup mensual de configs/scripts/cron/rclone.conf con passphrase en 1Password. Drill end-to-end de recovery verificado (20 archivos extraídos, todos los scripts MATCH byte-a-byte).
- **Stripe LIVE mode deployed:** 9 envs creadas en Cloud Run, webhook endpoint suscrito a 5 eventos. **Smoke test incompleto** — $25 procesado bajo sesión de Dayana, pendiente refund.
- **Auditorías S8-S11 todas cerradas + deployadas:** AI guardrails (45 tests), Encounter optimistic locking (10 tests), Doctor feature flag override (14 tests), PHI key rotation scripts (6 tests). Score MetaHarness 91.2/100 (A+ en Audit Completion).
- **`tsc --noEmit`:** clean ✅
- **`next build`:** Compiled successfully in 8.0s (post-9a963d0)

## Feature: location-aware system (implementada 2026-06-27)

Carlos pidió que el sistema escale multi-ciudad:

- **Schema**: `Clinic.estado` + `Clinic.ciudad` + `Clinic.invitationCode` (unique); `Workspace.estado` + `Workspace.ciudad`. Composite index `(estado, ciudad)` en ambos.
- **tRPC**:
  - `workspace.createClinic` — crea clínica + genera código de invitación.
  - `workspace.peekClinicByCode` — muestra info antes de unirse.
  - `workspace.joinClinicByCode` — consume código + crea workspace bajo la clínica.
  - `workspace.regenerateClinicCode` — rota código.
  - `doctor.searchForReferral` — REQUIERE estado+ciudad, JOIN a Workspace para filtrar geográficamente.
- **UI**:
  - `components/auth/register-form.tsx` — pide estado+ciudad al crear workspace del nuevo doctor.
  - `components/workspace/workspace-settings-client.tsx` — agrega `LocationForm` + `ClinicCard` + `JoinClinicForm`.
  - `components/clinic/clinic-card.tsx` (NEW) — muestra clínica, código de invitación (owner only), botón regenerar.
  - `components/clinic/join-clinic-form.tsx` (NEW) — flow de unirse a clínica existente post-signup.
  - `components/encounter/referido-form.tsx` — REQUIERE estado+ciudad antes de mostrar doctores.
- **Lib**: `lib/venezuela-locations.ts` (23 estados + ciudades principales), `lib/clinic-invitation-code.ts` (CLINIC-XXXXXX generator sin chars ambiguos).
- **Backfill**: NULL permitido en columnas existentes (Carlos, Joel, Dayana no las llenaron aún — gate UI las pide).

---

## Cómo retomar este proyecto desde cero

Si acabas de caer en este repo y necesitas saber "dónde estamos":

1. **Lee este archivo entero** — captura orientación + estado actual + gotchas.
2. **Lee `PROJECT_STATUS.md`** — schema completo, 40 fases implementadas, variables de entorno, arquitectura de PDFs on-demand.
3. **Lee `SISTEMA.md`** — descripción funcional del sistema desde la perspectiva de usuario/dominio.
4. **Lee `RUNBOOK.md`** — procedimientos operativos: deploy, rollback, restore, troubleshooting.
5. **Lee `SECURITY_HARDENING_CHANGELOG.md`** — qué controles de seguridad están aplicados (PHI encryption, RLS, audit, etc.).
6. **Lee `~/.mavis/agents/mavis/memory/MedSysVE-context.md`** — changelog operacional reciente, deploy verifications, crons.
7. **Lee `~/.mavis/agents/mavis/memory/MEMORY.md`** — lecciones cross-project aplicables (BOM en SQL, Traefik apex→www, NextAuth v5 bypass, mint-jwt patterns, etc.).

Con esos 7 archivos deberías poder hacer cualquier cambio sin pedirle a Carlos que explique el contexto.

---

## Arquitectura de un vistazo

### Capas

| Capa | Tech | Detalles críticos |
|------|------|------------------|
| Framework | Next.js 16 (App Router, `output: standalone`) | `params` es `Promise<{...}>` — siempre `await params`. Ver guía en `node_modules/next/dist/docs/`. |
| UI | React 19 + Tailwind v4 + shadcn/ui | Tailwind v4 usa `@theme inline { --animate-wiggle: ... }` para keyframes custom. No usa `tailwind.config.js`. |
| API | tRPC 11 | Routers en `server/routers/*.ts`. Procedures: `publicProcedure` / `protectedProcedure` / `doctorProcedure`. |
| Auth | Auth.js v5 (next-auth beta) | JWT, multi-rol. **Salt `__Secure-authjs.session-token`** en prod (no `authjs.session-token`). `proxy.ts` reemplaza `middleware.ts`. **Endpoints `/api/auth/*` deben pasar SIN session gate.** |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Prisma 7 requiere PgAdapter para PostgreSQL (no usar el cliente por defecto). Cambios de schema → `npx prisma migrate deploy` en prod. |
| DB | PostgreSQL | Tenant isolation por `workspaceId`. PHI fields cifrados (AES-256-GCM) con fallback a plaintext en lecturas legacy. HMAC indexes para searchable encryption de cédula/nombre/apellido/teléfono/email. |
| Cache | Redis (ioredis) | Sorted set `meds:autocomplete` para medicamentos. **Se vacía al reiniciar** — re-sembrar con `POST /api/admin/seed-medications` después de cada deploy. |
| IA | Anthropic Claude (haiku + sonnet) | `/api/ai/encounter-assist` para diagnóstico diferencial + plan. `/api/lab-ocr` con Claude Vision para resultados de lab. |
| PDF | `@react-pdf/renderer` | **CERO escrituras a disco.** Todas las rutas son GET que renderizan on-demand desde DB. Container de Cloud Run es efímero → `public/uploads/` se borra al reiniciar. |
| Email | nodemailer + Gmail SMTP (App Password) | `lib/email.ts`. **Drop Resend en 2026-06-25** (`e294b90`). Plantillas: confirmación de cita, recordatorio, bienvenida portal, referido, OTP. |
| WhatsApp | Meta Cloud API | `lib/whatsapp.ts`. Solo documentos listos (`notifyDocumentReady`). |
| Deploy | Cloud Run (Docker standalone) | GCP GCP `Google Cloud Run`. App ID `jes48vqxcs3l2lyk1lkpa5zt`. |

### Multi-tenancy — reglas duras

- Cada `Doctor` tiene uno o más `Workspace`s.
- Cada `Patient` pertenece a UN workspace (`Patient.workspaceId`). El mismo paciente en dos consultorios = DOS rows de `Patient`, una por workspace. **Esto es por diseño** — el aislamiento clínico es una promesa HIPAA/LOPDP, no una optimización.
- **NO** hay uniqueness global sobre `(tipoIdentificacion, numeroIdentificacion)` en `Patient`. Hubo un leak cross-tenant por ese unique constraint en el pasado (lo cuenta la memoria) y se removió.
- Cross-workspace lookup por cédula solo ocurre en el momento del registro vía `hmacCedula`, y nunca se filtra PHI entre workspaces.
- Las rutas de PDF filtran por `encounter.workspaceId === user.workspaceId` Y devuelven **404, NO 403** cuando hay cross-tenant (no leak de existencia).

### Roles

```
DOCTOR      → acceso total, propietario del workspace
SECRETARY   → agenda, facturación, pacientes
ASSISTANT   → agenda, pacientes (lectura)
NURSE       → sala de espera, signos vitales
PATIENT     → portal solo-lectura (portal.*)
```

⚠️ **`SessionUser.role` NO incluye `"ADMIN"`**. Comparaciones contra `"ADMIN"` causan error de compilación. Para admin checks usa `session.user.isAdmin` (campo en JWT) o filtra por `doctor.isAdmin`.

---

## Convenciones del código

- **Archivos:** `camelCase` (`trpc-client.ts`, `billing-client.tsx`).
- **Imports:** `@/` alias sobre paths relativos.
- **tRPC procedures:** `publicProcedure` / `protectedProcedure` / `doctorProcedure` desde `server/trpc.ts`.
- **Prisma client:** SIEMPRE importar desde `lib/db.ts` (que crea el PgAdapter). NO usar `new PrismaClient()` directamente.
- **Buffer → Response:** `new NextResponse(buffer as unknown as BodyInit, { headers: ... })` — el cast es necesario porque `Buffer<ArrayBufferLike>` no es asignable a `BodyInit` directo.
- **Server Components:** no usar `"use client"`. Client wrappers solo donde hay estado/efectos.
- **Notifications:** cuando agregues un nuevo tipo, sigue el patrón en `components/notifications/notification-bell.tsx` — extiende `NotificationType` enum + `TIPO_CONFIG` (icono/colores) + `TIPO_HREF` (destino on-click). La campanita, badge, wiggle y aria-label derivan de esos maps.
- **Audit:** acciones de impacto clínico van en `AuditEvent` (PHI access). Acciones de config/admin en `AuditLog`. Ver `lib/audit.ts` para el enum `AuditAction`.
- **PHI encriptado:** campos `*Cifrado` se prefieren en escrituras nuevas; legacy plaintext se tolera como fallback. HMAC indexes (`hmacCedula`, `hmacNombre`, etc.) habilitan queries buscables sin descifrar.
- **No escribir secretos a logs.** `lib/log-sanitizer.ts` trunca IPs a `/24` (IPv4) / `/48` (IPv6).

---

## Mapa de archivos — dónde encontrar qué

| Si necesitas tocar... | Mira en... |
|----------------------|------------|
| Schema de DB | `prisma/schema.prisma` (~1316 líneas, ~30 modelos) |
| Migrations | `prisma/migrations/<timestamp>_<slug>/migration.sql` |
| tRPC routers | `server/routers/*.ts` (35 routers) |
| tRPC root | `server/trpc.ts` (define `protectedProcedure`, `doctorProcedure`) |
| Auth config | `lib/auth.ts` (NextAuth v5) + `proxy.ts` (bypass `/api/auth/*`) |
| Email | `lib/email.ts` (nodemailer + Gmail SMTP) + `lib/email-templates.ts` |
| WhatsApp | `lib/whatsapp.ts` |
| Field encryption | `lib/field-crypto.ts` (AES-256-GCM + HMAC) |
| Audit | `lib/audit.ts` (enums + helper `audit()`) |
| PDF | `lib/pdf-*.tsx` + `app/api/pdf/*` |
| Layouts | `app/(dashboard)/layout.tsx`, `app/portal/layout.tsx`, `app/(auth)/layout.tsx` |
| Sidebar (campanita) | `components/layout/sidebar.tsx` + `components/notifications/notification-bell.tsx` |
| Pacientes | `app/(dashboard)/doctor/patients/*` + `components/patient/*` + `server/routers/patient.ts` |
| Referidos | `app/(dashboard)/doctor/referrals/*` + `components/referrals/*` + `server/routers/document.ts` |
| Consultas (encounter) | `app/(dashboard)/doctor/patients/[regId]/encounters/[encId]/*` + `components/encounter/*` + `server/routers/encounter.ts` |
| Citas | `app/(dashboard)/agenda/*` + `server/routers/appointment.ts` |
| Portal paciente | `app/portal/*` + `components/portal/*` |
| Admin (admin only) | `app/(dashboard)/admin/*` |
| Documentos legales | `content/legal/*.md` (terms, privacy, cookies, LOPDP) |
| Tipos compartidos | `types/index.ts` |
| Tests E2E | `tests/` (Playwright) + `playwright.config.ts` |
| Tests unit | vitest (config en `vitest.config.ts`) |

---

## Workflow de deploy

1. **Desarrollo local:** `npm run dev` (Next.js dev server con HMR).
2. **Verificar tipos:** `npx tsc --noEmit`. Debe retornar 0 errores.
3. **Verificar build:** `npx next build`. Debe completar sin errores y reportar 54 rutas.
4. **Stage cambios + commit:**
   ```powershell
   git add <specific-files>
   git -c user.name='Carlos Pierluissi' -c user.email='cpierluissis@gmail.com' commit -m "..."
   ```
   ⚠️ El `user.email` DEBE ser `cpierluissis@gmail.com` — Cloud Run rechaza pushes con cualquier otro email.
5. **Push:** `git push origin master`.
6. **Cloud Run auto-deploya** vía webhook de GitHub. Tarda ~3-5 min. Container image se reemplaza atómicamente.
7. **Si tocaste schema.prisma:** después del deploy automático, abrir consola del container y correr:
   ```bash
   npx prisma migrate deploy
   ```
   Debe decir "1 migration(s) applied" (o N si eran varias). Prisma 7 + ALTER TYPE ADD VALUE es non-transactional — Prisma's migrator maneja esto automáticamente.
8. **Re-sembrar Redis si tocaste medicamentos:** `fetch('/api/admin/seed-medications', { method: 'POST' })` desde el navegador con sesión DOCTOR. Esperado: `{ ok: true, upserted: ~501, redisLoaded: ~501 }`.
9. **Verificar:**
   - `docker ps` en GCP → container nuevo con el SHA esperado.
   - `docker inspect <container> --format '{{.Config.Image}}'` → debe terminar con el SHA del HEAD.
   - Smoke test: `curl -I https://www.medsysve.com/login` → 200.
   - Login + bell badge en `/dashboard` debería aparecer.

---

## Patrones críticos — NO romper

### 1. Cédula merge conflict en referidos

`server/routers/document.ts#acceptReferral` detecta cuando el doctor receptor YA tiene un paciente con la misma cédula. En ese caso flipea `referidoStatus = MERGE_PENDING` y devuelve `{ needsMerge: true, existingPatient, referredPatient }`. La UI muestra un modal side-by-side y llama `resolveReferralMerge({ action: 'keep' | 'update' })`. **NO** hacer merge silencioso — fue el bug original.

### 2. PHI cifrado + HMAC indexes

Cuando agregues un campo PHI nuevo, sigue el patrón:
- Campo `xxx` (legacy plaintext) + `xxxCifrado` (AES-256-GCM) + opcional `hmacXxx` (HMAC-SHA-256 index para búsquedas).
- Escrituras nuevas: `xxxCifrado`. Lecturas: fallback a `xxx` si `xxxCifrado` es NULL (durante migración).
- HMAC usa `FIELD_ENCRYPTION_KEY` (mismo secret que AES). Ver `lib/field-crypto.ts`.

### 3. Audit log en acciones de impacto clínico

Toda mutation que escribe PHI o cambia estado clínico DEBE loggear en `AuditEvent` con `outcome: "ALLOWED"`, `channel`, `metadata` relevante. Ver `lib/audit.ts` para el helper `audit()`.

### 4. Smoke tests con mint-jwt (NO en producción real)

Los `mint-jwt-*.mjs` que están en la raíz son herramientas de debug post-deploy. **NO** commitear a producción. Usarlos para verificar PDFs cross-doctor:

```js
// mint-jwt-doctor.mjs — ajustar doctorId/workspaceId
import { encode } from "@auth/core/jwt";
const token = await encode({
  token: { sub, id: sub, email, role: "DOCTOR", doctorId, workspaceId, ... },
  secret: process.env.AUTH_SECRET,
  salt: "__Secure-authjs.session-token",
  maxAge: 24 * 60 * 60,
});
console.log(token);
```

```bash
curl -H "Cookie: __Secure-authjs.session-token=<jwt>" \
  https://www.medsysve.com/api/pdf/prescription/<id> -o /tmp/test.pdf
```

⚠️ **SIEMPRE usar `www.medsysve.com`** — el apex redirige y pierde la cookie `__Secure-`.

### 5. LOPDP legal gate

Después de bumpear `LegalVersion.slug`, todos los doctores deben re-aceptar. El gate se activa en `app/(dashboard)/layout.tsx` vía `requireLegalAcceptance`. Para verificar deploy sin que el legal gate tape: grep por `EncounterWorkspace` en el RSC payload (bundle cargado = prueba suficiente).

### 6. Referral notifications (Fase 29+)

`Notification` model es workspace-scoped. Para crear:
- `tipo`: `REFERRAL_RECEIVED` (receptor), `REFERRAL_ACCEPTED`/`REFERRAL_REJECTED` (emisor después de actuar), `APPOINTMENT_REQUEST`, `PORTAL_MESSAGE`, `IMAGING_RESULT`, `SYSTEM`.
- `workspaceId`: el workspace DEL USUARIO QUE DEBE VERLA.
- `referenciaId`: ID del recurso relacionado (para futuro deep-linking).

Las rutas de notificación viven en `server/routers/notification.ts` con `list`, `unreadCount`, `markRead`, `markAllRead`. Bell en `components/notifications/notification-bell.tsx`.

---

## Gotchas específicos del proyecto

- **`proxy.ts` reemplaza `middleware.ts`** — runtime edge no soporta `node:util/types`. Si ves un middleware, no es el que está activo.
- **Doctor.cedula es UNIQUE global** (no por workspace). Esto es OK porque un doctor es un doctor — pero un doctor no es un paciente.
- **`Patient.numeroIdentificacion` NO es unique global** — removido para evitar leak cross-tenant. Usar `hmacCedula` indexable + filter por workspace.
- **Redis `meds:autocomplete`** se siembra via POST. Cada deploy toca algo → re-sembrar.
- **Cloud Run auto-ejecuta `prisma migrate deploy`** — el `Dockerfile` línea 51 corre `CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]` desde commit `112ed33`. Las migrations se aplican automáticamente al startup del container, ~3 segundos antes de que Node levante. NO hace falta correr `docker exec ... npx prisma migrate deploy` post-deploy — el entrypoint ya lo hace. Confirmado en deploys `575c3b8` (rename) y `b2eef56` (DoctorReportPreferences). Lo que sigue pendiente (PROJECT_STATUS.md §474): auto-migrate en el **build step de Cloud Run** (prestart script) para que el `prisma generate` del build corra con el schema ya migrado.
- **Container es efímero** — cualquier archivo escrito a disco (que no sea volumen montado) se pierde al reiniciar. PDFs son on-demand, uploads están en Cloud Run volume.
- **Allowed IPs** en la config del DB de Cloud Run a veces se "abre a 0.0.0.0" durante debug. Restaurar a `73.8.161.68,65.155.46.36` (IPs de Carlos). El cron de MedSysVE verifica esto en cada run.

---

## Open follow-ups (a 2026-06-27)

- [ ] **Sembrar medicamentos en prod post-deploy** si se tocaron: `POST /api/admin/seed-medications` desde navegador con sesión DOCTOR.
- [ ] **Correr `npx prisma migrate deploy` en container de prod** después del deploy de `37cb1bd` (ALTER TYPE ADD VALUE).
- [ ] **Migrar duplicados existentes** — el referido duplicado que ya existe en workspace de Joel (sivanam1982 → joguelpinto0810) NO se limpia con el merge-conflict flow. Pedirle a Carlos si quiere script de migración one-shot.
- [ ] **Extender `TIPO_HREF`** en notification-bell con destinos para APPOINTMENT_REQUEST, PORTAL_MESSAGE, IMAGING_RESULT, REFERRAL_ACCEPTED/REJECTED. Por ahora solo REFERRAL_RECEIVED navega.
- [ ] **Banner persistente en dashboard** si hay referidos pendientes (Carlos dijo "no hay nada que indique que tiene algo pendiente"). El bell badge ya existe pero un banner rojo al entrar al portal sería más prominente.
- [ ] **Verificar visualmente el bell wiggle** después del primer deploy post-`37cb1bd` — la animación requiere que `globals.css` se cargue correctamente.

---

## Secrets rotation (Audit S11, 2026-07-07)

> **Background:** MedSysVE has three separate env-var keys for PHI protection
> (audit #7 follow-up separated them so rotating one doesn't break the others).
> Rotation was manual until audit S11. **The procedure is now automated** via
> `scripts/rotate-field-keys.sh` + `scripts/rotate-field-keys.ts`.

### The three keys

| Env var | Purpose | What it protects | Notes |
|---|---|---|---|
| `FIELD_ENCRYPTION_KEY` | AES-256-GCM | All PHI ciphertexts (Patient.cedulaCifrada, nombreCifrado, apellidoCifrado, telefonoCifrado, emailCifrado, rifCifrado, Encounter.motivoCifrado, anamnesisCifrada, planCifrado) | Separate from HMAC so HMAC rotation can be done independently |
| `FIELD_HMAC_KEY` | HMAC-SHA-256 | All searchable indexes (hmacCedula, hmacNombre, hmacApellido, hmacTelefono, hmacEmail, hmacRif, motivoHmac) | Index is deterministic; rotating + recomputing preserves lookups |
| `FIELD_SIGN_KEY` | HMAC-SHA-256 | Encounter.signatureHash (audit trail integrity) | Rotation INVALIDATES all past signatures — re-sign manually or accept loss |

### When to rotate

- **Quarterly** for `FIELD_ENCRYPTION_KEY` and `FIELD_HMAC_KEY` (recommended by `lib/field-crypto.ts`).
- **Immediately** on suspected compromise.
- **Annually** for `FIELD_SIGN_KEY` is overkill; rotate only on compromise.

### How to rotate `FIELD_ENCRYPTION_KEY` / `FIELD_HMAC_KEY`

> Full procedure in `docs/DR-PLAN.md` §5.1. The TL;DR:

1. Generate new keys: `openssl rand -base64 32` × 2. Store in 1Password + vault.
2. Take a fresh backup (defense-in-depth, audit #18).
3. **Stop the app container** (downtime window — single-key encryption).
4. SSH to GCP, run `scripts/rotate-field-keys.sh` with old + new keys.
5. Update Cloud Run env vars.
6. Smoke test: login + view a known patient.
7. Retain old keys in vault for 30 days.

```bash
# Dry-run first (no writes)
ssh root@Google Cloud Run "cd /opt/medsysve && \
  FIELD_ENCRYPTION_KEY=<old-enc> \
  FIELD_HMAC_KEY=<old-hmac> \
  ROTATE_FIELD_ENCRYPTION_KEY=$NEW_ENC_KEY \
  ROTATE_FIELD_HMAC_KEY=$NEW_HMAC_KEY \
  ROTATE_DRY_RUN=1 \
  node --no-warnings -r tsx/cjs scripts/rotate-field-keys.ts"

# Real rotation (writes to DB)
ssh root@Google Cloud Run "cd /opt/medsysve && \
  FIELD_ENCRYPTION_KEY=<old-enc> \
  FIELD_HMAC_KEY=<old-hmac> \
  ROTATE_FIELD_ENCRYPTION_KEY=$NEW_ENC_KEY \
  ROTATE_FIELD_HMAC_KEY=$NEW_HMAC_KEY \
  node --no-warnings -r tsx/cjs scripts/rotate-field-keys.ts"
```

### Why downtime?

The current `lib/field-crypto.ts` is single-key (no versioned ciphertext
prefix). During rotation, rows exist in mixed format. Supporting concurrent
reads requires dual-key decryption with a `v1:` / `v2:` prefix on each
ciphertext — that's a follow-up ("key versioning"), not part of S11.
Until then: app offline + worker + smoke test.

### Tests

6 new tests in `tests/unit/rotate-field-keys.test.ts`:
- Happy path (Patient.cedulaCifrada + hmacCedula)
- All 6 Patient PHI columns + 6 HMAC indexes
- Encounter.motivoCifrado + motivoHmac (paired)
- Encounter.anamnesisCifrada + planCifrado (no HMAC pair)
- Idempotency: re-run skips rows already rotated
- Dry-run: no writes

### Why `FIELD_SIGN_KEY` rotation isn't in the worker

`Encounter.signatureHash` binds (encounterId, signedBy, signedAt, content)
under `FIELD_SIGN_KEY`. Rotating it invalidates ALL past signatures —
defeats the audit trail. Procedure is documented in DR-PLAN.md §5.1 but
NOT automated. Carlos would need to either re-sign affected encounters
manually or accept signature loss (not recommended).

### When adding new PHI columns

Update `scripts/rotate-field-keys.ts` TABLES to include them. The worker
is exhaustive — anything outside TABLES is left as-is (and will break the
next read with the new key, which is intentional: loud failure on forgotten
columns is better than silent data loss).

---

## Comandos rápidos

```powershell
# Estado del repo
git -C C:\Proyectos\MedSysVE log --oneline -10
git -C C:\Proyectos\MedSysVE status --short

# Typecheck
npx tsc --noEmit

# Build
npx next build

# Generar Prisma client (después de cambios de schema)
npx prisma generate

# Migration nueva (desarrollo)
npx prisma migrate dev --name <slug>

# Aplicar migrations en prod (vía SSH al container)
#   Primero SSH al GCP, después docker exec al container
docker exec -it <container> npx prisma migrate deploy

# Ver logs del container de prod
docker logs --tail 200 <container>

# Re-sembrar Redis (post-deploy con cambios en medicamentos)
#   En navegador con sesión DOCTOR activa en www.medsysve.com:
#   fetch('/api/admin/seed-medications', { method: 'POST' }).then(r => r.json()).then(console.log)
```

---

## Contacto / Ownership

- **Owner:** Carlos Pierluissi (`cpierluissis@gmail.com`).
- **Operado por:** Yoguitech.LLC (footer del dashboard).
- **Renombrar:** AJMedics → MedSysVE fue el rename público en 2026-06. Mantener nombre **MedSysVE** en cualquier comunicación externa.
- **Repositorio:** `github.com/guaricool/MedSysVE`.

