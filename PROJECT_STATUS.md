# MedSysVE — Estado del Proyecto

> **Última actualización:** 2026-07-14 17:30 (refresh post drug-allergy feature deploy)
> **Versión:** v1.x (producción, en evolución activa)
> **HEAD actual:** `9a963d0` (feat(safety): drug-allergy interaction check end-to-end)
> **Repositorio:** `https://github.com/guaricool/MedSysVE` (rama `master`)
> **Producto comercial:** MedSysVE (antes AJMedics — renombrado en 2026-06)
> **Operado por:** Yoguitech.LLC
> **Estado actual:** Producción, ~3 médicos activos multi-tenant (Carlos / Joel / Dayana). Stripe LIVE mode deployed 2026-07-08. Drug-allergy safety check deployed 2026-07-14.

---

## ¿Qué es MedSysVE?

SaaS multi-tenant de **Historia Clínica Electrónica (HCE) / EMR** para el mercado venezolano. Un doctor registra su consultorio, su equipo (secretaria, asistente, enfermera), sus pacientes, y corre todo el flujo clínico-financiero desde un solo lugar:

- **Atención clínica** — consultas SOAP, signos vitales, diagnósticos CIE-10, recetas, órdenes de lab/imagen, reposos, informes, referidos a colegas, certificados.
- **Gestión** — agenda semanal con tipos (consulta / seguimiento / emergencia / procedimiento / videoconsulta), sala de espera, recordatorios, facturación dual USD/Bs con tasa BCV, cobros parciales, seguros, anuncios al equipo.
- **Portal del paciente** — agendar citas, ver recetas, mensajes al doctor, descargar PDFs, gestionar consentimiento, vacunas.
- **Asistencia IA** — borrador de informe con Claude, OCR de resultados de lab con Claude Vision, detección de interacciones medicamentosas, alerta de alergias en receta, diagnóstico diferencial.
- **Compliance** — HIPAA + LOPDP Venezolano: PHI cifrado a nivel de campo con AES-256-GCM + HMAC indexes buscables, audit log exhaustivo, multi-consultorio con workspace isolation, retenciones, breach ledger.

**Tema:** oscuro (slate-950 con acentos azul / verde / ámbar). Branding: wordmark `MedSysVE` con colores de la bandera venezolana (amarillo `#FFD100`, azul `#3B82F6`, rojo `#EF4444`).

---

| 2026-07-08 | `bedcd3a` | **Stripe LIVE launch** — 9 envs deployadas (sk_live_*, whsec_*, 6× price_*, NEXT_PUBLIC_*), webhook endpoint suscrito a 5 eventos. Smoke test end-to-end parcial: cargo real $25 procesado bajo sesión de Dayana (cross-session). Pending refund. |
| 2026-07-14 | `9a963d0` | **Drug-allergy interaction check (safety feature)** — `lib/drug-allergies.ts` con ~30 familias farmacológicas VE + match exact/synonym/family + 31 unit tests. UI: warning en `prescription-form.tsx` al seleccionar med contraindicado. Server: defense-in-depth en `prescription.ts` rechaza `addItem` sin `overrideAlerta=true`. PDF: banner rojo "ALERGIAS DEL PACIENTE" en ambas mitades. AI: inyección de alergias activas en prompts de `encounter-assist` y `plan-suggestion`. Audit: nuevo `ALLERGY_OVERRIDE` action. Cross-reactivity cefalosporina↔penicilina NO modelada (out of scope, requiere side-chain analysis). |
| 2026-07-08 | `51d4eac` | **Stripe checkout success_url fix** — derive de NEXTAUTH_URL con regex force www. (evita Traefik apex→www cookie drop). |
| 2026-07-08 | `f6dec8a` + `6949f2f` | **Sentry/GlitchTip observability** — `@sentry/nextjs` wireado contra GlitchTip self-hosted en `glitchtip.13.140.181.29.sslip.io`. Error tracking en cliente + edge + server. |
| 2026-07-07 | `0e8b003` | **Audit S11 — Automated PHI key rotation** — `scripts/rotate-field-keys.{sh,ts}` + DR-PLAN §5.1 runbook + 6 tests. Cierra audit #4. |

| Fecha | Commit | Resumen |
|---|---|---|
| 2026-06-21 | `52e2abe` | **Tenant isolation** — patient uniqueness removido del global, scoped a `(workspaceId, tipoIdentificacion, numeroIdentificacion)`. Bug crítico HIPAA cerrado. |
| 2026-06-21 | `56d0a15` | **Upload streaming fix** — `/api/uploads/[...path]` ya no se cuelga en modo standalone. |
| 2026-06-22 | `22315d5` | **Security hardening completo** — 20 bugs en 6 commits. Authz en proxy.ts, JWT verification, PHI encryption para `Patient.numeroIdentificacion`, audit log en 9 rutas PDF + 3 CSV + 3 AI, workspace switcher con DB validation, bcrypt dummy pre-computed. |
| 2026-06-22 | `0dbe382` | **Encrypt 23 PHI/PII columns** — field-level AES-256-GCM en cédulas, teléfonos, emails, anamnesis, planes, firmas. Migration backfill. |
| 2026-06-23 | `0247902` | **Email OTP + password reset** — 6-digit codes vía Gmail SMTP. Reemplaza flujo viejo que dependía de Resend. |
| 2026-06-25 | `ede56f3` | **Marco legal LOPDP completo** — Términos, Privacidad, Cookies, Consentimiento. Sistema de versionado con `LegalVersion` + `ConsentAcceptance`. Gate forzado en dashboard. Breach ledger. |
| 2026-06-25 | `3053d20` | **Strip BOM de SQL migrations** — fix que rompió deploy (UTF-8 BOM invisible). |
| 2026-06-25 | `e294b90` | **Switch a Gmail SMTP via nodemailer** — drop Resend por costo/config. |
| 2026-06-26 | `054d300` | **Prescription + Imaging PDFs landscape 50/50** — formato "Dr. Pierluissis" con dos columnas (orden + indicaciones) + header/footer duplicados. |
| 2026-06-26 | `97aad84` | **Accordion sections** — refactor de patient history + encounter workspace a `<AccordionSection>`. UX más respirada. |
| 2026-06-27 | `20c0f07` | **Portal/PDF bugs + referral merge conflict** — Vitachart/PediatricPanel fix, LOPDP fix, `acceptReferral` ahora detecta conflicto de cédula y pide resolución manual. |
| 2026-06-27 | `37cb1bd` | **In-app REFERRAL_RECEIVED notification + bell wiggle** — el receptor ve la campanita con badge rojo + animación + "Atender →" → `/doctor/referrals`. Antes solo había email. |
| 2026-06-27 | `5b65856` | **AGENTS.md comprehensive** — entry point para cualquier AI que abra el repo (3 capas de memoria: repo + topic + HOT). |
| 2026-06-28 | `ebc804d` | **Stripe Billing + Clinic Extra Seats** — Suscripciones duales (Doctores individuales y Clínicas), webhooks de Stripe y códigos de invitación de clínica. |
| 2026-06-29 | `9e7f695` | **Patient Edit/Delete + Encounter Delete** — Lógica de edición y eliminación segura manteniendo integridad referencial. Dirección del paciente añadida al schema. |
| 2026-06-30 | `8f16fc7` | **Referral Data Transfer + Leak Fix** — Copia de perfil clínico (labs<90d, vacunas, alergias, seguros, historia) de doctor a doctor al aceptar un referido. Fix de tenant isolation cross-workspace. |
| 2026-06-30 | `fbc9670` | **UI/PDF Fixes** — Renombrado global de 'Anamnesis' a 'Historia Clínica' y corrección del renderizado de la lista de diagnósticos en resúmenes PDF que usaban viñetas incompatibles con Helvetica. |
| 2026-06-30 | `a4c5a55` | **Deploy fixes** — Prevención de `whole project trace` de Next.js (que causaba gigabytes en la carpeta standalone) y optimización en Dockerfile para evitar `chown -R` masivo que crasheaba en Coolify. |
| 2026-06-30 | `4d61a11` | **Digital Seals on PDFs** — Se corrigió la importación de `buildPdfBranding` en los endpoints de PDF y se implementó el renderizado del sello en todos los documentos. |
| 2026-06-30 | `9accae2` | **PDF Styling** — Se movió el sello digital y el bloque de firmas hacia el lado derecho de las páginas en todos los documentos generados. |
| 2026-07-06 | `6509011` | **Audit #18 cerrado** — Backup chain v2 (GFS retention 7d/4w/12m, sha256 integrity, OAuth pre-flight, msmtp alerts) + monthly restore drill via Coolify Scheduled Task UUID `bljazmj4u5g3cmvbpqlg5m6i`. End-to-end verificado contra VPS real. |
| 2026-07-06 | `2578564` | **Audit #16 cerrado** — Notification bell + TIPO_HREF completo para los 7 `NotificationType` (APPOINTMENT_REQUEST, PORTAL_MESSAGE, REFERRAL_*, IMAGING_RESULT, SYSTEM). 6 con destino navegable + 1 mark-read-only. |
| 2026-07-06 | `ec28975` + `9ca0ba6` | **Audit S5+S6** — 9 routers migrados a `doctorProcedure` (alergia, tag, vaccine, labResult, medication, template, staffNote, billing, analytics). Gap #1 parcial + Gap #2 + Gap #3 cerrados. |
| 2026-07-06 | `cb74c56` | **Sync** — Regeneración de `SYSTEM_INDEX.md` contra HEAD + script `scripts/generate-graph3d.py` para viz 3D del knowledge graph (189 comunidades, 2117 nodos). |
| 2026-07-06 (pendiente) | `audit S7` | **Gap #1 cierre mayor + Gap #4 cerrado** — task.ts (6 procs), waitingRoom.ts (5 procs), consent.ts (2 procs), insurance.ts (1 proc) todos migrados a `doctorProcedure`. **251/251 tests pass**. |

---

## Métricas del proyecto (al 2026-07-06 23:50)

| Métrica | Valor |
|---|---|
| HEAD | `b8f66b2` (post-S11 + graph3d fix) |
| Commits en `master` | ~119 desde el inicio |
| Líneas de schema | ~1.500 (`prisma/schema.prisma`) |
| Modelos de DB | **51** (+3 desde jun: digital seal, audit #18 archival, drop legacy motivo, **+1 S10 DoctorFeatureOverride**) |
| Enums | **18** |
| Migrations aplicadas | **28** (+11 desde jun: sello + encryption + archival + drop legacy + S9 version + S10 override) |
| Routers tRPC | **39** (+1 S10: featureFlag) |
| Páginas (route handlers / pages) | **50+** archivos `page.tsx` |
| Componentes React | **30+** directorios en `components/` |
| Fases implementadas | **40 / 40** + post-40 features |
| Audit items cerrados | **22 / 22 conocidos** (#1-#18 + #4, #12, #13, #15 via S8-S11 + Gap #1/#2/#3/#4). **0 items pendientes** en backlog. |
| Tests | **327/327 vitest** (16 archivos, ~720ms runtime), 0 E2E adicionales |
| Stripe integration | **LIVE mode deployed** 2026-07-08 (9 envs, webhook endpoint subscribed to 5 events). Smoke test parcial — refactor pendiente para mostrar sesión activa en SubscriptionCard. |
| Observability | **Sentry + GlitchTip** wireados 2026-07-08 (commit `f6dec8a`). Errors trackeados cliente + edge + server. |
| Tiempo de typecheck (`tsc --noEmit`) | < 5s (verificado 2026-07-08 21:38) |
| Tiempo de build (`next build`) | ~3-5 min en Docker, **11.1s** para `tsc + next build` local (verificado 2026-07-08 21:38) |
| Memoria del repo (`AGENTS.md` + `MedSysVE-context.md` + `MEMORY.md`) | 3 capas, cobertura completa + 4 lecciones Stripe nuevas |

---

## Stack tecnológico (versiones al 2026-06-27)

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Runtime | Node.js | 20.x LTS | Coolify container |
| Framework | Next.js (App Router, `output: standalone`) | 16.2.9 | ⚠️ Lee `node_modules/next/dist/docs/` antes de escribir código. |
| UI | React + shadcn/ui + Tailwind CSS v4 | 19.2.4 / ^4 | **Tailwind v4** = sin `tailwind.config.js`, keyframes vía `@theme inline`. |
| Lenguaje | TypeScript | ^5 strict | `tsc --noEmit` debe pasar siempre. |
| API | tRPC | ^11.17.0 | Routers en `server/routers/*.ts`. |
| Auth | Auth.js (next-auth beta) JWT, multi-rol | ^5.0.0-beta.31 | **Salt `__Secure-authjs.session-token`** en prod. `proxy.ts` reemplaza `middleware.ts`. |
| ORM | Prisma + `@prisma/adapter-pg` | ^7.8.0 | Prisma 7 requiere PgAdapter (no usar cliente por defecto). |
| DB | PostgreSQL | 16 | Multi-tenant por `workspaceId`. |
| Cache | Redis (ioredis) | ^5.11.1 | Sorted set `meds:autocomplete`. Se vacía al reiniciar. |
| Validación | Zod | ^4.4.3 | Inputs en cada procedure tRPC. |
| IA | Anthropic Claude (haiku + sonnet) | API | `claude-haiku-4-5` para coste-eficiente, `claude-sonnet-4-6` para generación de informes. |
| PDF | `@react-pdf/renderer` | ^4.5.1 | On-demand, **CERO escrituras a disco**. |
| Email | nodemailer + Gmail SMTP | ^7.0.13 | Drop Resend en 2026-06-25 (`e294b90`). |
| WhatsApp | Meta Cloud API v20 | - | Solo documentos listos. |
| QR codes | qrcode | ^1.5.4 | Para 2FA TOTP enrollment. |
| Charts | Recharts | ^3.8.0 | Analytics + vitales. |
| Forms | react-hook-form + zodResolver | ^7.79.0 | |
| Deploy | Coolify (Docker standalone) | v4.1.2 | VPS Contabo `13.140.181.29`. App ID `jes48vqxcs3l2lyk1lkpa5zt`. |
| Tests E2E | Playwright | ^1.61.0 | `tests/`. |
| Tests unit | vitest | ^4.1.9 | `vitest.config.ts`. |
| Lint | ESLint | ^9 | `eslint.config.mjs`. |

---

## Estado de build (al 2026-06-27)

```
npx tsc --noEmit         → 0 errores ✅
npx next build           → 54 rutas, 0 errores ✅ (verificar tras cambios grandes)
git push origin master   → último commit 5b65856 ✅
```

Último deploy **verificado**: container `hze8mocuh4xqskqwrm3mx50b-011021577885` corriendo imagen `b8d3a44bfc43112686bd19d7da014635fddab123`, healthy, creado 2026-06-27 01:19:23Z. Deploys posteriores (`20c0f07`, `37cb1bd`, `5b65856`) auto-disparados por Coolify vía webhook de GitHub, pero **`37cb1bd` requiere intervención manual** post-deploy (ver Open Follow-ups).

---

## Fases implementadas (40 / 40 ✅)

### Núcleo base

| # | Fase | Estado | Detalle |
|---|---|---|---|
| 1 | Autenticación y Base | ✅ | Auth.js v5, workspaces, roles, registro pacientes, dashboards por rol, Dockerfile/Coolify. |
| 2 | Módulo Clínico (Consulta) | ✅ | Schema: Encounter, Diagnosis, Medication, Prescription, LabOrder, ImagingOrder, Document. Redis autocomplete de medicamentos, IMC, alertas vitales, PDF con membrete. |
| 3 | Citas y Facturación | ✅ | Schema: Appointment, Invoice. Calendario semanal, tasa BCV manual, facturas PDF, numeración F-000001+. |
| 4 | OCR + WhatsApp + Clínica Pública + Portal | ✅ | `/api/lab-ocr` con Claude Vision. Notificaciones WhatsApp (Meta Cloud). Portal de citas. `/clinica/[slug]` público. |
| 5 | Analytics + Horario + Autoagendamiento | ✅ | Dashboard Recharts. Disponibilidad por día. Portal REQUESTED. |
| 6 | Email + Portal Password + Red de Referidos | ✅ | Email + portal password + referidos entre doctores. (Migrado de Resend a Gmail SMTP en F35+.) |
| 7 | Workspace Settings + PDF Historia + Cron Reminders | ✅ | Config consultorio. PDF historia completa. Cron `appointment-reminders` con `CRON_SECRET`. |
| 8 | Dashboard Enfermería + Portal Recetas + Email Factura | ✅ | Sala espera + llegadas + no-shows. Portal recetas. Email factura. |

### Mejoras clínicas y operativas

| # | Fase | Estado | Detalle |
|---|---|---|---|
| 9 | Resultados Lab + Dashboard Secretaria + Notas + BCV Auto | ✅ | Schema: LabResult. Dashboard secretaria. Notas internas. Auto-fetch `ve.dolarapi.com`. |
| 10 | Medicamentos 311 + CSV Pacientes + Dashboard Asistente | ✅ | Catálogo 311 fármacos. Exportación CSV. Dashboard asistente. |
| 11 | Multi-consultorio + Reporte Financiero PDF + Workspace UI | ✅ | Cambio consultorio desde sidebar. Creación nuevo consultorio. PDF reporte mensual. |
| 12 | Portal Mejorado + Analytics Avanzados + Flujo de Citas | ✅ | Lab results portal, cancelación con confirmación. Retención 90 días, top diagnósticos. |
| 13 | Videoconsulta + Perfil Doctor + Auto-COMPLETAR Cita | ✅ | VIDEOCONSULTA con Jitsi. Perfil público doctor. Auto-complete al firmar consulta. |
| 14 | SOAP + Plan + Historia de Citas por Paciente | ✅ | Subjetivo / Objetivo / Análisis / Plan. Auto-save 1.5s debounce. Historial citas en ficha. |
| 15 | Citas Recurrentes + Abonos en Facturas | ✅ | Series semanal/quincenal/mensual (2-12 citas). Pagos parciales en PENDING. |
| 16 | Gráficas Vitales + Mensajes + Alergias | ✅ | Recharts PA/FC/peso. Mensajería doctor-paciente polling. Alergias con gravedad. |
| 17 | Antecedentes + PDF Orden Lab + Advertencia Alergias + Badge | ✅ | Antecedentes estructurados. PDF orden lab. Warning alergias en receta. Badge mensajes sin leer. |
| 18 | (saltada en docs, integración continua) | — | — |
| 19 | IA Asistente + Plantillas Consulta + Portal Perfil + Etiquetas | ✅ | Claude Haiku diagnóstico diferencial + plan. Plantillas consulta. Perfil portal. Etiquetas. |
| 20 | Interacciones Medicamentos IA + Fechas Bloqueadas + Plantillas Documentos + Reagendamiento | ✅ | Interacciones con Claude Haiku. Excepciones horario. Plantillas documentos. Reagendamiento portal. |
| 21 | Ítems Factura + Filtros Pacientes + Anuncios + Tendencias Lab | ✅ | Líneas detalle factura. Filtros sexo + etiqueta. Anuncios portal. Tendencias lab. |

### Módulos especializados

| # | Fase | Estado | Detalle |
|---|---|---|---|
| 22-26 | Sala de espera, Staff, Tasks, etc. | ✅ | Waiting room + estados (ESPERANDO/LLAMADO/ATENDIDO). Notas staff. Tareas con prioridad. Anuncios. |
| 27 | Panel de Crónicos | ✅ | Risk scoring + widget dashboard. |
| 28 | Portal Completo | ✅ | Vacunas, exámenes, recetas con PDF en portal paciente. |
| 29 | Notificaciones Internas | ✅ | Bell icon, `Notification` model + `NotificationType` enum (7 tipos). `TIPO_CONFIG` + `TIPO_HREF` maps para iconografía y destinos clickeables. |
| 30 | Tareas del Equipo | ✅ | Board de tareas con asignación a staff + prioridad + fecha vencimiento. |
| 31 | Búsqueda Global + Exportación CSV | ✅ | Command palette Ctrl+K. Export CSV citas y facturas. |
| 32 | Seguros Médicos (HMO) | ✅ | Schema: InsuranceProvider, PatientInsurance. Cobertura factura. Página gestión. |
| 33 | Consentimientos Informados | ✅ | Schema: ConsentTemplate, PatientConsent. 4 plantillas venezolanas pre-cargadas. Firma digital. |
| 34 | Auditoría Clínica | ✅ | Schema: AuditLog + AuditEvent (PHI access trail). Eventos de CONSULTA_FIRMADA y otros. Dashboard filtrable. |
| 35 | Marco Legal LOPDP | ✅ | `LegalVersion` + `ConsentAcceptance`. Términos / Privacidad / Cookies / Consentimiento LOPDP. Breach ledger. Admin compliance dashboard. AI support bot con contexto legal. |
| 36 | Módulo Pediátrico | ✅ | Curvas crecimiento OMS (P3/P50/P97). Esquema PAI Venezuela. Auto-hide para adultos. |
| 37 | Recordatorios Configurables | ✅ | `recordatorioHoras` + `recordatorioWa` + `recordatorioEmail` por workspace. Cron respeta config. |
| 38 | Logo y Branding | ✅ | Upload logo/membrete (≤5 MB, JPG/PNG/WebP). Branding en todos los PDFs. MedSysVE wordmark con bandera. |
| 39 | Importación Masiva de Pacientes | ✅ | CSV import (max 500 filas/5 MB). Deduplicación automática. Plantilla descargable. |
| 40 | Indicadores de Calidad | ✅ | 12 métricas KPI. Score general de calidad. Tendencias con flechas de dirección. |

### Mejoras recientes (post-fase-40)

| Feature | Commit | Detalle |
|---|---|---|
| Cédula merge conflict flow | `20c0f07` | `acceptReferral` detecta paciente existente en workspace del receptor, flipea `MERGE_PENDING` y pide resolución manual. `resolveReferralMerge({keep\|update})`. Audit `PATIENT_MERGE_*`. |
| Prescription + Imaging PDF redesign | `054d300`, `6e41c9f`, `b8d3a44` | Landscape 50/50 con header/footer duplicados. Estilo "Dr. Pierluissis". |
| Accordion sections | `97aad84` | Patient history + encounter workspace a `<AccordionSection>` con empty states informativos. |
| In-app REFERRAL_RECEIVED | `37cb1bd` | Notificación in-app cuando recibís un referido, con bell wiggle + click → `/doctor/referrals`. Antes solo email. |
| Comprehensive AGENTS.md | `5b65856` | Entry point para AI agents con 3 capas de memoria. |
| **Backup migration: Google Drive → Backblaze B2** | 2026-07-13 (manual ops, no code) | Drive OAuth token venció y Service Accounts de Drive no tienen storage quota en cuentas personales (requiere Workspace + Shared Drives, $7-14/user/mo, descartado). B2 es la solución permanente: bucket privado `medsysve-backups`, app key con scope solo al bucket, doble encryption (gpg + rclone crypt), retention 7 daily + 4 weekly + 12 monthly. **4 retention bugs arreglados en `/opt/medsysve-backup/backup.sh`** (awk, ((COUNT++)), `[[ ]]`, date syntax — los 4 estaban rotos desde el deploy inicial). Backup mensual de configs/scripts/cron/rclone.conf con passphrase en 1Password. Drill end-to-end de recovery verificado. |
| **Drug-allergy interaction check (safety feature)** | `9a963d0` | `lib/drug-allergies.ts` con ~30 familias farmacológicas VE (penicilinas, AINEs, cefalosporinas, sulfas, etc.) + match exact/synonym/family + 31 unit tests. UI warning + override button en `prescription-form.tsx`. Defense-in-depth en `prescription.ts` rechaza sin `overrideAlerta=true`. PDF: banner rojo en ambas mitades + badge "OVR". AI: alergias inyectadas en prompts. Audit `ALLERGY_OVERRIDE`. 3 capas: UI → server → audit. |

---

## Arquitectura de un vistazo

### Multi-tenancy — reglas duras

- Cada `Doctor` tiene uno o más `Workspace`s. Uno principal + (opcional) consultorios afiliados via `Clinic` + `DoctorClinicAffiliation`.
- Cada `Patient` pertenece a UN workspace (`Patient.workspaceId`). El mismo paciente en dos consultorios = DOS rows de `Patient`, una por workspace. **Esto es por diseño** — el aislamiento clínico es una promesa HIPAA/LOPDP, no una optimización.
- **NO** hay uniqueness global sobre `(tipoIdentificacion, numeroIdentificacion)` en `Patient`. Hubo un leak cross-tenant por ese unique constraint en el pasado y se removió (`52e2abe`). Cross-workspace lookup por cédula solo ocurre en el momento del registro vía `hmacCedula`, y nunca se filtra PHI entre workspaces.
- Las rutas de PDF filtran por `encounter.workspaceId === user.workspaceId` Y devuelven **404, NO 403** cuando hay cross-tenant (no leak de existencia).
- Auth-gated routes pasan por `proxy.ts` que llama `auth()` (edge-safe). Endpoints `/api/auth/*` deben pasar SIN session gate (CSRF existe para bootstrappear login). `/api/trpc/*` bypass (cada procedure tiene su propia authz).

### PHI encryption + searchable

- **Encryption:** AES-256-GCM con `FIELD_ENCRYPTION_KEY` (32 bytes). Helpers en `lib/field-crypto.ts`.
- **Pattern:** campo `xxx` (legacy plaintext) + `xxxCifrado` (preferred). Escrituras nuevas van al cifrado; lecturas hacen fallback a plaintext si `xxxCifrado` es NULL (durante migration).
- **Searchable encryption:** HMAC-SHA-256 con `FIELD_HMAC_KEY` (separado de la encryption key). Indexes en `hmacCedula`, `hmacNombre`, `hmacApellido`, `hmacTelefono`, `hmacEmail`. Permiten queries `WHERE hmacXxx = ?` sin descifrar.
- **23 columnas** encriptadas al 2026-06-22 (`0dbe382`): cédulas, teléfonos, emails, anamnesis, planes, firmas, etc.
- **Special cases:** `Encounter.signatureHash` = HMAC de `{encounterId, signedBy, signedAt, content}`. Detecta tampering de cualquier campo firmado.

### PDFs on-demand (regla de oro)

**CERO escrituras a disco.** El filesystem de Coolify es efímero — `public/uploads/` se borra al reiniciar el contenedor. Todos los PDFs son rutas GET de API que leen la DB y renderizan con `@react-pdf/renderer`. `Buffer → Response` con cast `as unknown as BodyInit`.

| PDF | Ruta API | Verificado |
|-----|---------|------------|
| Historia clínica completa | `GET /api/pdf/history/[patientRegId]` | ✅ |
| Encuentro firmado (resumen) | `GET /api/pdf/encounter/[id]` | ✅ |
| Factura | `GET /api/pdf/invoice/[id]` | ✅ |
| Reporte financiero mensual | `GET /api/pdf/report/[year]/[month]` | ✅ |
| Carné de vacunas | `GET /api/pdf/vaccine-carnet/[patientRegId]` | ✅ |
| Receta médica | `GET /api/pdf/prescription/[id]` | ✅ |
| Orden de laboratorio | `GET /api/pdf/lab-order/[id]` | ✅ |
| Orden de imagen | `GET /api/pdf/imaging-order/[id]` | ✅ |
| Documento (reposo/informe/referido/certificado) | `GET /api/pdf/document/[id]` | ✅ |
| Recibos de pago (parciales) | `GET /api/pdf/payment/[pagoId]` | ✅ |

**Filenames:** `tipo-NombreApellido-DDMMYYYY.pdf` (ej: `factura-F-000001.pdf`, `consulta-PacientePrueba-22062026.pdf`).

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

## Modelos de DB (47, agrupados por dominio)

### Identidad y tenancy
`Doctor`, `Workspace`, `Clinic`, `DoctorClinicAffiliation`, `Staff`

### Pacientes y registro
`Patient`, `PatientRegistration`, `PatientTag`, `PatientInsurance`

### Clínica
`Encounter`, `Diagnosis`, `Medication`, `Prescription`, `PrescriptionItem`, `LabOrder`, `LabResult`, `ImagingOrder`, `ImagingOrderItem`, `Document`, `DocumentTemplate`, `Alergia`, `Vaccine`, `ConsentTemplate`, `PatientConsent`

### Citas y operación
`Appointment`, `WaitingEntry`, `Mensaje`, `EncounterTemplate`, `PatientConsent`

### Facturación
`Invoice`, `InvoiceItem`, `Pago`, `InsuranceProvider`

### Horario
`DoctorAvailability`, `AvailabilityException`

### Equipo y comunicación
`Announcement`, `StaffNote`, `Task`, `Notification`

### Compliance y auditoría
`TwoFactorBackupCode`, `AuditLog`, `AuditEvent`, `LegalVersion`, `ConsentAcceptance`, `DataExportRequest`, `DataDeletionRequest`, `BreachIncident`, `EmailOtp`

### Catálogos y clínica pública
`ClinicPost`

**Total: 47 modelos, 17 enums, 1320 líneas de schema.**

---

## Routers tRPC (35)

| Router | Path | Responsabilidad |
|---|---|---|
| `auth` | `server/routers/auth.ts` | Login, register, password reset. |
| `twoFactor` | `server/routers/twoFactor.ts` | TOTP enrollment + verify. |
| `doctor` | `server/routers/doctor.ts` | Doctor profile + workspace switcher. |
| `workspace` | `server/routers/workspace.ts` | Workspace settings + multi-clinic. |
| `patient` | `server/routers/patient.ts` | CRUD paciente + búsqueda HMAC. |
| `encounter` | `server/routers/encounter.ts` | CRUD consulta SOAP + sign. |
| `diagnosis` | (vía encounter) | Diagnósticos CIE-10. |
| `prescription` | `server/routers/prescription.ts` | CRUD receta + PDF. |
| `medication` | `server/routers/medication.ts` | Catálogo + Redis autocomplete + seed. |
| `labOrder` | `server/routers/labOrder.ts` | Órdenes de lab. |
| `labResult` | `server/routers/labResult.ts` | Resultados + tendencias. |
| `imagingOrder` | `server/routers/imagingOrder.ts` | Órdenes de imagen + resultados. |
| `document` | `server/routers/document.ts` | Documentos clínicos + referidos + sign + merge conflict. |
| `icd10` | `server/routers/icd10.ts` | Búsqueda CIE-10 autocomplete. |
| `appointment` | `server/routers/appointment.ts` | Citas + series + notifications. |
| `availability` | `server/routers/availability.ts` | Horario semanal + excepciones. |
| `invoice` | `server/routers/invoice.ts` | Facturación + pagos parciales + PDF. |
| `insurance` | `server/routers/insurance.ts` | Seguros médicos + cobertura. |
| `mensaje` | `server/routers/mensaje.ts` | Mensajería doctor-paciente. |
| `alergia` | `server/routers/alergia.ts` | Alergias + gravedad. |
| `vaccine` | `server/routers/vaccine.ts` | Vacunas + carné PDF. |
| `consent` | `server/routers/consent.ts` | Consentimientos informados + firma. |
| `template` | `server/routers/template.ts` | Plantillas de consulta + documentos. |
| `tag` | `server/routers/tag.ts` | Etiquetas de paciente. |
| `task` | `server/routers/task.ts` | Tareas del equipo. |
| `staff` | `server/routers/staff.ts` | CRUD staff + roles. |
| `staffNote` | `server/routers/staffNote.ts` | Notas internas. |
| `announcement` | `server/routers/announcement.ts` | Anuncios del consultorio. |
| `waitingRoom` | `server/routers/waitingRoom.ts` | Sala de espera (callPatient, etc). |
| `notification` | `server/routers/notification.ts` | Bell: list, unreadCount, markRead, markAllRead. |
| `audit` | `server/routers/audit.ts` | Audit log queries. |
| `compliance` | `server/routers/compliance.ts` | Admin compliance dashboard. |
| `analytics` | `server/routers/analytics.ts` | KPIs + tendencias + retenciones. |
| `admin` | `server/routers/admin.ts` | Admin panel (solo admin). |
| `portal` | `server/routers/portal.ts` | Rutas auth-gated del portal paciente. |
| `clinicPublic` | `server/routers/clinicPublic.ts` | Página pública `/clinica/[slug]`. |

---

## Variables de entorno requeridas

```env
# Base
DATABASE_URL=postgresql://user:pass@host:5432/medsysve
NEXTAUTH_SECRET=<32+ char>
NEXTAUTH_URL=https://medsysve.13.140.181.29.sslip.io

# Crypto (field-level PHI)
FIELD_ENCRYPTION_KEY=<32 bytes base64>     # AES-256-GCM
FIELD_HMAC_KEY=<32 bytes base64>           # HMAC-SHA-256

# Redis
REDIS_URL=redis://...

# IA
ANTHROPIC_API_KEY=sk-ant-...

# WhatsApp (Meta Cloud API)
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...

# Email (Gmail SMTP via nodemailer — desde 2026-06-25)
GMAIL_USER=yoguitech@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx     # App Password, no la cuenta normal

# Cron
CRON_SECRET=<32+ char>

# LOPDP / Legal
LEGAL_SUPPORT_EMAIL=yoguitech@gmail.com

# Allowed IPs para la DB de Coolify (compartida entre Carlos / debug)
# Restaurar a "73.8.161.68,65.155.46.36" si se abre durante debug.
```

> **SEGURIDAD:** La contraseña de base de datos JAMÁS debe colocarse en la configuración de Coolify directamente — se almacena en la DB de Coolify y aparece en logs. Usar Docker secrets o variables de entorno cifradas.

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
- **Single quote en commits:** mensajes con scope (`feat(scope):`, `fix(scope):`, `docs:`).
- **Git author:** SIEMPRE `Carlos Pierluissi <cpierluissis@gmail.com>` — Vercel/Coolify rechaza otros emails.

---

## Seguridad y compliance

### LOPDP (Venezuela)

- Marco legal completo: Términos, Privacidad, Cookies, Consentimiento (`content/legal/*.md`).
- Versionado con `LegalVersion` (slug, version, contentHash, effectiveAt).
- `ConsentAcceptance` por doctor + slug + versión + IP truncada.
- Gate en `app/(dashboard)/layout.tsx` via `requireLegalAcceptance()` — fuerza re-aceptar cuando Carlos bumpea `LegalVersion`.
- **Derecho de acceso (Art. 60):** `DataExportRequest` con download token 30-días.
- **Derecho de cancelación (Art. 61):** `DataDeletionRequest` con soft-delete (tombstone) + audit trail preservado.
- **Breach notification (Art. 64):** `BreachIncident` ledger con ventana de 72h.

### HIPAA (referencia, no certificado)

- PHI cifrado a nivel de campo (AES-256-GCM).
- Audit trail exhaustivo en `AuditEvent` para cada read/write de PHI.
- Access control multi-tenant via `workspaceId` en cada query.
- Tenant isolation verificada en security audit (`52e2abe`).
- 9 rutas PDF + 3 CSV + 3 AI todas loggean access en `AuditEvent` con `AI_PHI_DISCLOSURE` para IA.

### Autenticación

- Auth.js v5 con JWT, multi-rol.
- 2FA TOTP opcional por doctor (`TwoFactorBackupCode` con bcrypt-hashed recovery codes).
- Email OTP para verificación de registro y password reset (`EmailOtp` con SHA-256 del código, nunca plaintext).
- Token format seguro: `base64url(JSON) + base64url(HMAC sig)` con `.` como único separador de 2 partes (lección dura: un email con `.` rompió el flujo viejo).

---

## Logros / Hitos clave

### Producto

- ✅ **Multi-tenant con aislamiento clínico estricto** (HIPAA-style) — paciente es por workspace, no global.
- ✅ **Ciclo clínico completo** — desde registro del paciente hasta cobro, con todos los intermediarios (recetas, órdenes, referidos, PDFs).
- ✅ **PHI cifrado end-to-end con searchable encryption** — 23 columnas encriptadas, queries siguen funcionando vía HMAC indexes.
- ✅ **Asistencia IA integrada** — borrador de informe, OCR de labs, interacciones medicamentosas, alerta de alergias, diagnóstico diferencial.
- ✅ **Compliance LOPDP completo** — legal framework + audit + derechos ARCO + breach ledger.
- ✅ **Portal del paciente** — agendar, ver recetas, mensajes, descargar PDFs, gestionar consentimiento.
- ✅ **Red de referidos** — flujo completo con merge conflict resolution.
- ✅ **Facturación dual USD/Bs** con tasa BCV auto-fetch + pagos parciales + cobertura de seguros.
- ✅ **40/40 fases implementadas.**

### Técnico

- ✅ **17 migrations idempotentes** aplicadas en producción sin downtime.
- ✅ **Standalone Docker build** funcionando en Coolify con contenedor efímero + uploads persistentes.
- ✅ **Traefik apex → www cookie handling** dominado (siempre curl con `www.medsysve.com`).
- ✅ **Hot module reload estable** — `proxy.ts` reemplaza `middleware.ts` (edge runtime sin `node:util/types`).
- ✅ **Audit exhaustivo** — 9 PDFs + 3 CSVs + 3 AI + todas las mutations clínicas con `AuditEvent`.
- ✅ **Memory system en 3 capas** — AGENTS.md (repo) + MedSysVE-context.md (cron auto-update) + MEMORY.md (cross-project). Cualquier agente fresco arranca produciendo.

### Negocio

- ✅ 3 doctores activos multi-tenant: Carlos (admin), Joel, Dayana.
- ✅ Producto operacional bajo Yoguitech.LLC.
- ✅ Branding completo: wordmark con bandera, logo transparente, favicon, dominio propio.

---

## Pendientes / Open Follow-ups (al 2026-07-06 23:50)

### ✅ Cerrados en este ciclo (audits S5-S7)

- [x] Audit #16 cerrado (`2578564`): TIPO_HREF completo para 7 NotificationTypes
- [x] Audit #18 cerrado (`6509011`): backup chain v2 + monthly restore drill
- [x] Gap #1 cierre mayor: 14 routers migrados a `doctorProcedure` (S5+S7)
- [x] Gap #2 cerrado (`ec28975`): billing.createCheckoutSession → doctor
- [x] Gap #3 cerrado (S5): staffNote → doctor
- [x] Gap #4 cerrado (S7): task.ts → doctor
- [x] AUDIT_BACKLOG.md refresh (2026-07-06 23:30): marca #16/#18 como DONE
- [x] PERMISSIONS.md refresh (2026-07-06 23:30): routers S7 actualizados

### 🔴 Urgente (post-deploy inmediato)

- (Ninguno — los únicos urgentes eran ALTER TYPE migrations de #16 y eso ya deployó OK)

### 🟡 Corto plazo (este sprint)

- [ ] **Banner persistente en dashboard** si hay referidos pendientes — Carlos dijo "no hay nada que indique que tiene algo pendiente". El bell badge ya existe pero un banner rojo al entrar al portal sería más prominente.
- [ ] **Migrar duplicados existentes** — el referido duplicado que ya existe en workspace de Joel (sivanam1982 → joguelpinto0810) NO se limpia con el merge-conflict flow. Script de migración one-shot opcional.
- [ ] **Deep-link per-record para IMAGING_RESULT** — actualmente navega a `/doctor/patients` (lista). Pendiente denormalizar `patientRegistrationId` en `referenciaId` o server-side lookup keyed off imaging order (audit #16 follow-up).

### 🟢 Mantenimiento continuo

- [ ] **Sembrar medicamentos en prod** si se tocaron: `POST /api/admin/seed-medications` desde navegador con sesión DOCTOR. Esperado: `{ ok: true, upserted: ~501, redisLoaded: ~501 }`.
- [ ] **Verificar `allowed_ips`** de la DB de Coolify después de cualquier debug. Valor correcto: `73.8.161.68,65.155.46.36`.

### 🔵 Backlog (audits S9-S11 candidatos, scope confirmado)

- [x] **S8: AI rate-limit numérico + prompt injection tests (audit #13)** ✅ **DONE 2026-07-07** — per-doctor rate limit activo (30/60/60), `lib/ai/guardrails.ts` con 4 capas, 45 tests adversariales. Detalles en `docs/AUDIT_BACKLOG.md` §#13.
- [x] **S9: Encounter auto-save conflict resolution (audit #12)** ✅ **DONE 2026-07-07** — `Encounter.version` + optimistic locking en `update`/`saveVitals` + AuditAction `ENCOUNTER_CONFLICT`. 10 tests de regresión.
- [x] **S10: Per-doctor feature flag override (audit #15)** ✅ **DONE 2026-07-07** — `DoctorFeatureOverride` model + admin-only `featureFlag` router (list/set/clear) + 14 tests. Cache invalidation in-process.
- [x] **S11: PHI key rotation procedure + scripts (audit #4)** ✅ **DONE 2026-07-07** — `scripts/rotate-field-keys.sh` + `.ts` + 6 tests + `docs/DR-PLAN.md` §5.1 runbook + `AGENTS.md` secrets-rotation section.

**0 items pendientes en audit backlog.** Score global 91.2/100 (A+ en Audit Completion).

### 🔵 Futuro (post-lanzamiento v2)

- [ ] **Auto-migrate en build de Coolify** — agregar `prestart` o script de release que corra `npx prisma migrate deploy` automáticamente. Hoy es manual.
- [ ] **Real-time notifications** — reemplazar polling cada 30s con SSE o WebSocket. Latencia menor, menos requests.
- [ ] **Mobile app** — actualmente es web responsive. App nativa (React Native) sería plus.
- [ ] **Telemedicina mejorada** — Jitsi funciona pero UX puede mejorar (calendar integration, recording).
- [ ] **Multi-idioma** — actualmente solo español (es-VE). i18n con `next-intl` para escalar.
- [ ] **Tests E2E más cobertura** — Playwright cubre los happy paths pero faltan edge cases de merge conflict, multi-doctor, etc.
- [ ] **Observability centralizada** — Sentry/Datadog o equivalente (actualmente audit log + log-sanitizer, sin tracing/metrics centralizados).
- [ ] **Performance profiling** — análisis N+1 queries + TTFB/LCP metrics en prod.

---

## Comandos rápidos

```powershell
# Estado del repo
git -C C:\Proyectos\MedSysVE log --oneline -10
git -C C:\Proyectos\MedSysVE status --short

# Typecheck + build
npx tsc --noEmit
npx next build

# Prisma
npx prisma generate              # regenerar cliente (post schema change)
npx prisma migrate dev --name X  # nueva migration (dev)
npx prisma studio                # GUI

# En prod (vía SSH al VPS, después docker exec al container)
docker ps                                          # ver containers corriendo
docker inspect <container> --format '{{.Config.Image}}'   # ver SHA del image
docker exec -it <container> npx prisma migrate deploy      # aplicar migrations
docker logs --tail 200 <container>                         # logs

# Re-sembrar Redis (post-deploy con cambios en medicamentos)
#   En navegador con sesión DOCTOR activa en www.medsysve.com:
#   fetch('/api/admin/seed-medications', { method: 'POST' }).then(r => r.json()).then(console.log)

# Smoke test con mint-jwt (cross-doctor, ver MedSysVE-context.md para patrón completo)
node mint-jwt-joel.mjs                                       # genera JWT
curl -H "Cookie: __Secure-authjs.session-token=<jwt>" \
  https://www.medsysve.com/api/pdf/prescription/<id> \
  -o /tmp/test.pdf
```

---

## Documentación relacionada

| Doc | Propósito | Última actualización |
|---|---|---|
| `AGENTS.md` | Entry point para AI agents — orientación + estado + convenciones | 2026-07-06 (`6509011`) |
| `SISTEMA.md` | Descripción funcional del sistema desde la perspectiva de usuario/dominio | (stale, menciona AJMedics) |
| `RUNBOOK.md` | Procedimientos operativos: deploy, rollback, restore, troubleshooting | 2026-07-02 (`49b9835`) |
| `SECURITY_HARDENING_CHANGELOG.md` | 20 bugs de seguridad arreglados en 6 commits | 2026-06-22 (`22315d5`) |
| `PROJECT_STATUS.md` (este) | Estado comprehensivo del proyecto — qué es, qué hay, qué falta | 2026-07-06 (`6509011`) |
| `docs/DR-PLAN.md` | Disaster recovery runbook + audit #18 backup chain v2 | 2026-07-06 (`6509011`) |
| `docs/AUDIT_BACKLOG.md` | Audit IDs pendientes con scope inference para #4/#12/#13/#15/#16 | 2026-07-06 (`6509011`) |
| `docs/MANUAL-USUARIO.md` | Manual para el usuario final (médicos) | (existente) |
| `docs/DOCUMENTACION-TECNICA.md` | Documentación técnica detallada | (existente) |
| `docs/MEMORIA-SISTEMA.md` | Memoria funcional del sistema | (existente) |
| `content/legal/*.md` | Textos legales (Términos, Privacidad, Cookies, LOPDP) | Versionado con `LegalVersion` |
| `~/.mavis/agents/mavis/memory/MedSysVE-context.md` | Changelog operacional detallado + crons | Auto-update via `medsysve-sync` cron cada 30 min |
| `~/.mavis/agents/mavis/memory/MEMORY.md` | Preferencias Carlos + lecciones cross-project | 2026-06-27 |

---

## Contacto

- **Owner:** Carlos Pierluissi (`cpierluissis@gmail.com`).
- **Operado por:** Yoguitech.LLC.
- **Renombrar:** AJMedics → MedSysVE fue el rename público en 2026-06. Dentro de algunos docs viejos todavía aparece AJMedics. Buscar si importa antes de mostrar a externos.
- **Repositorio:** `github.com/guaricool/MedSysVE`.
