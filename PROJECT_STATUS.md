# MedSysVE â€” Estado del Proyecto

> **Ãšltima actualizaciÃ³n:** 2026-07-14 17:30 (refresh post drug-allergy feature deploy)
> **VersiÃ³n:** v1.x (producciÃ³n, en evoluciÃ³n activa)
> **HEAD actual:** `9a963d0` (feat(safety): drug-allergy interaction check end-to-end)
> **Repositorio:** `https://github.com/guaricool/MedSysVE` (rama `master`)
> **Producto comercial:** MedSysVE (antes AJMedics â€” renombrado en 2026-06)
> **Operado por:** Yoguitech.LLC
> **Estado actual:** ProducciÃ³n, ~3 mÃ©dicos activos multi-tenant (Carlos / Joel / Dayana). Stripe LIVE mode deployed 2026-07-08. Drug-allergy safety check deployed 2026-07-14.

---

## Â¿QuÃ© es MedSysVE?

SaaS multi-tenant de **Historia ClÃ­nica ElectrÃ³nica (HCE) / EMR** para el mercado venezolano. Un doctor registra su consultorio, su equipo (secretaria, asistente, enfermera), sus pacientes, y corre todo el flujo clÃ­nico-financiero desde un solo lugar:

- **AtenciÃ³n clÃ­nica** â€” consultas SOAP, signos vitales, diagnÃ³sticos CIE-10, recetas, Ã³rdenes de lab/imagen, reposos, informes, referidos a colegas, certificados.
- **GestiÃ³n** â€” agenda semanal con tipos (consulta / seguimiento / emergencia / procedimiento / videoconsulta), sala de espera, recordatorios, facturaciÃ³n dual USD/Bs con tasa BCV, cobros parciales, seguros, anuncios al equipo.
- **Portal del paciente** â€” agendar citas, ver recetas, mensajes al doctor, descargar PDFs, gestionar consentimiento, vacunas.
- **Asistencia IA** â€” borrador de informe con Claude, OCR de resultados de lab con Claude Vision, detecciÃ³n de interacciones medicamentosas, alerta de alergias en receta, diagnÃ³stico diferencial.
- **Compliance** â€” HIPAA + LOPDP Venezolano: PHI cifrado a nivel de campo con AES-256-GCM + HMAC indexes buscables, audit log exhaustivo, multi-consultorio con workspace isolation, retenciones, breach ledger.

**Tema:** oscuro (slate-950 con acentos azul / verde / Ã¡mbar). Branding: wordmark `MedSysVE` con colores de la bandera venezolana (amarillo `#FFD100`, azul `#3B82F6`, rojo `#EF4444`).

---

| 2026-07-21 | `3daa9a0` | **27 Medical Specialties Blueprint & Native Additive DICOM/PACS Integration** — 100% completed execution of the 27 medical specialties. Integrated native DICOM/PACS infrastructure (`DicomStudy`, `DicomSeries`, `DicomImage` Prisma models, `dicom.ts` tRPC router, reusable HTML5 `<DicomViewer />` component with Level 1 Cobb Angle, Hounsfield HU, RECIST, CINE Multiframe, Color Inversion, and Level 2 basic pan/zoom). Enabled all 27 specialties in Doctor Registration, Patient Marketplace Search, and Admin Sandbox (`/admin/sandbox`). |
| 2026-07-21 | `52fec99` | **Architectural Refactoring (Phases 1-4)** — Migrated GlobalPatientProfile columns to Postgres JsonB with Prisma. Optimized tRPC queries in portal.ts to remove N+1 queries. Implemented versioned Keyring cryptography in field-crypto.ts with transparent backwards compatibility for raw legacy ciphertexts. Added Cache-Control headers to PDF responses and created pdf-worker.ts queue abstraction. Extracted shared UI clinical components (BloodTypeSelector, AllergyListEditor) and designed generic DynamicSoapForm.tsx. |
| 2026-07-21 | `294d75f` | **Portal EHR integration, search refinement, and default availability fallback** — Portal login block for unverified users with WhatsApp/Email verification direct panel. Unified local Patient profiles under global profile via cedula/email/phone match. Blood type, allergy list, vaccine registry, insurance, and medical history exposed in portal profile screen. Dynamic selects and accent-insensitive autocomplete for Venezuela locations and specialties in doctor search. Default availability backend fallback to Mon-Fri 8:00 AM - 5:00 PM if no DB config exists. Remediated msmtprc credential exposure, upgraded dependencies to secure versions (`nodemailer@9.0.3` and `postcss@8.5.15` overrides), and hardened GitHub Actions workflow permissions. |
| 2026-07-08 | `bedcd3a` | **Stripe LIVE launch** â€” 9 envs deployadas (sk_live_*, whsec_*, 6Ã— price_*, NEXT_PUBLIC_*), webhook endpoint suscrito a 5 eventos. Smoke test end-to-end parcial: cargo real $25 procesado bajo sesiÃ³n de Dayana (cross-session). Pending refund. |
| 2026-07-14 | `9a963d0` | **Drug-allergy interaction check (safety feature)** â€” `lib/drug-allergies.ts` con ~30 familias farmacolÃ³gicas VE + match exact/synonym/family + 31 unit tests. UI: warning en `prescription-form.tsx` al seleccionar med contraindicado. Server: defense-in-depth en `prescription.ts` rechaza `addItem` sin `overrideAlerta=true`. PDF: banner rojo "ALERGIAS DEL PACIENTE" en ambas mitades. AI: inyecciÃ³n de alergias activas en prompts de `encounter-assist` y `plan-suggestion`. Audit: nuevo `ALLERGY_OVERRIDE` action. Cross-reactivity cefalosporinaâ†”penicilina NO modelada (out of scope, requiere side-chain analysis). |
| 2026-07-08 | `51d4eac` | **Stripe checkout success_url fix** â€” derive de NEXTAUTH_URL con regex force www. (evita Traefik apexâ†’www cookie drop). |
| 2026-07-08 | `f6dec8a` + `6949f2f` | **Sentry/GlitchTip observability** â€” `@sentry/nextjs` wireado contra GlitchTip self-hosted en `glitchtip.Google Cloud Run.sslip.io`. Error tracking en cliente + edge + server. |
| 2026-07-07 | `0e8b003` | **Audit S11 â€” Automated PHI key rotation** â€” `scripts/rotate-field-keys.{sh,ts}` + DR-PLAN Â§5.1 runbook + 6 tests. Cierra audit #4. |

| Fecha | Commit | Resumen |
|---|---|---|
| 2026-06-21 | `52e2abe` | **Tenant isolation** â€” patient uniqueness removido del global, scoped a `(workspaceId, tipoIdentificacion, numeroIdentificacion)`. Bug crÃ­tico HIPAA cerrado. |
| 2026-06-21 | `56d0a15` | **Upload streaming fix** â€” `/api/uploads/[...path]` ya no se cuelga en modo standalone. |
| 2026-06-22 | `22315d5` | **Security hardening completo** â€” 20 bugs en 6 commits. Authz en proxy.ts, JWT verification, PHI encryption para `Patient.numeroIdentificacion`, audit log en 9 rutas PDF + 3 CSV + 3 AI, workspace switcher con DB validation, bcrypt dummy pre-computed. |
| 2026-06-22 | `0dbe382` | **Encrypt 23 PHI/PII columns** â€” field-level AES-256-GCM en cÃ©dulas, telÃ©fonos, emails, anamnesis, planes, firmas. Migration backfill. |
| 2026-06-23 | `0247902` | **Email OTP + password reset** â€” 6-digit codes vÃ­a Gmail SMTP. Reemplaza flujo viejo que dependÃ­a de Resend. |
| 2026-06-25 | `ede56f3` | **Marco legal LOPDP completo** â€” TÃ©rminos, Privacidad, Cookies, Consentimiento. Sistema de versionado con `LegalVersion` + `ConsentAcceptance`. Gate forzado en dashboard. Breach ledger. |
| 2026-06-25 | `3053d20` | **Strip BOM de SQL migrations** â€” fix que rompiÃ³ deploy (UTF-8 BOM invisible). |
| 2026-06-25 | `e294b90` | **Switch a Gmail SMTP via nodemailer** â€” drop Resend por costo/config. |
| 2026-06-26 | `054d300` | **Prescription + Imaging PDFs landscape 50/50** â€” formato "Dr. Pierluissis" con dos columnas (orden + indicaciones) + header/footer duplicados. |
| 2026-06-26 | `97aad84` | **Accordion sections** â€” refactor de patient history + encounter workspace a `<AccordionSection>`. UX mÃ¡s respirada. |
| 2026-06-27 | `20c0f07` | **Portal/PDF bugs + referral merge conflict** â€” Vitachart/PediatricPanel fix, LOPDP fix, `acceptReferral` ahora detecta conflicto de cÃ©dula y pide resoluciÃ³n manual. |
| 2026-06-27 | `37cb1bd` | **In-app REFERRAL_RECEIVED notification + bell wiggle** â€” el receptor ve la campanita con badge rojo + animaciÃ³n + "Atender â†’" â†’ `/doctor/referrals`. Antes solo habÃ­a email. |
| 2026-06-27 | `5b65856` | **AGENTS.md comprehensive** â€” entry point para cualquier AI que abra el repo (3 capas de memoria: repo + topic + HOT). |
| 2026-06-28 | `ebc804d` | **Stripe Billing + Clinic Extra Seats** â€” Suscripciones duales (Doctores individuales y ClÃ­nicas), webhooks de Stripe y cÃ³digos de invitaciÃ³n de clÃ­nica. |
| 2026-06-29 | `9e7f695` | **Patient Edit/Delete + Encounter Delete** â€” LÃ³gica de ediciÃ³n y eliminaciÃ³n segura manteniendo integridad referencial. DirecciÃ³n del paciente aÃ±adida al schema. |
| 2026-06-30 | `8f16fc7` | **Referral Data Transfer + Leak Fix** â€” Copia de perfil clÃ­nico (labs<90d, vacunas, alergias, seguros, historia) de doctor a doctor al aceptar un referido. Fix de tenant isolation cross-workspace. |
| 2026-06-30 | `fbc9670` | **UI/PDF Fixes** â€” Renombrado global de 'Anamnesis' a 'Historia ClÃ­nica' y correcciÃ³n del renderizado de la lista de diagnÃ³sticos en resÃºmenes PDF que usaban viÃ±etas incompatibles con Helvetica. |
| 2026-06-30 | `a4c5a55` | **Deploy fixes** â€” PrevenciÃ³n de `whole project trace` de Next.js (que causaba gigabytes en la carpeta standalone) y optimizaciÃ³n en Dockerfile para evitar `chown -R` masivo que crasheaba en Cloud Run. |
| 2026-06-30 | `4d61a11` | **Digital Seals on PDFs** â€” Se corrigiÃ³ la importaciÃ³n de `buildPdfBranding` en los endpoints de PDF y se implementÃ³ el renderizado del sello en todos los documentos. |
| 2026-06-30 | `9accae2` | **PDF Styling** â€” Se moviÃ³ el sello digital y el bloque de firmas hacia el lado derecho de las pÃ¡ginas en todos los documentos generados. |
| 2026-07-06 | `6509011` | **Audit #18 cerrado** â€” Backup chain v2 (GFS retention 7d/4w/12m, sha256 integrity, OAuth pre-flight, msmtp alerts) + monthly restore drill via Cloud Run Scheduled Task UUID `bljazmj4u5g3cmvbpqlg5m6i`. End-to-end verificado contra GCP real. |
| 2026-07-06 | `2578564` | **Audit #16 cerrado** â€” Notification bell + TIPO_HREF completo para los 7 `NotificationType` (APPOINTMENT_REQUEST, PORTAL_MESSAGE, REFERRAL_*, IMAGING_RESULT, SYSTEM). 6 con destino navegable + 1 mark-read-only. |
| 2026-07-06 | `ec28975` + `9ca0ba6` | **Audit S5+S6** â€” 9 routers migrados a `doctorProcedure` (alergia, tag, vaccine, labResult, medication, template, staffNote, billing, analytics). Gap #1 parcial + Gap #2 + Gap #3 cerrados. |
| 2026-07-06 | `cb74c56` | **Sync** â€” RegeneraciÃ³n de `SYSTEM_INDEX.md` contra HEAD + script `scripts/generate-graph3d.py` para viz 3D del knowledge graph (189 comunidades, 2117 nodos). |
| 2026-07-06 (pendiente) | `audit S7` | **Gap #1 cierre mayor + Gap #4 cerrado** â€” task.ts (6 procs), waitingRoom.ts (5 procs), consent.ts (2 procs), insurance.ts (1 proc) todos migrados a `doctorProcedure`. **251/251 tests pass**. |

---

## MÃ©tricas del proyecto (al 2026-07-06 23:50)

| MÃ©trica | Valor |
|---|---|
| HEAD | `b8f66b2` (post-S11 + graph3d fix) |
| Commits en `master` | ~119 desde el inicio |
| LÃ­neas de schema | ~1.500 (`prisma/schema.prisma`) |
| Modelos de DB | **51** (+3 desde jun: digital seal, audit #18 archival, drop legacy motivo, **+1 S10 DoctorFeatureOverride**) |
| Enums | **18** |
| Migrations aplicadas | **28** (+11 desde jun: sello + encryption + archival + drop legacy + S9 version + S10 override) |
| Routers tRPC | **39** (+1 S10: featureFlag) |
| PÃ¡ginas (route handlers / pages) | **50+** archivos `page.tsx` |
| Componentes React | **30+** directorios en `components/` |
| Fases implementadas | **40 / 40** + post-40 features |
| Audit items cerrados | **22 / 22 conocidos** (#1-#18 + #4, #12, #13, #15 via S8-S11 + Gap #1/#2/#3/#4). **0 items pendientes** en backlog. |
| Tests | **327/327 vitest** (16 archivos, ~720ms runtime), 0 E2E adicionales |
| Stripe integration | **LIVE mode deployed** 2026-07-08 (9 envs, webhook endpoint subscribed to 5 events). Smoke test parcial â€” refactor pendiente para mostrar sesiÃ³n activa en SubscriptionCard. |
| Observability | **Sentry + GlitchTip** wireados 2026-07-08 (commit `f6dec8a`). Errors trackeados cliente + edge + server. |
| Tiempo de typecheck (`tsc --noEmit`) | < 5s (verificado 2026-07-08 21:38) |
| Tiempo de build (`next build`) | ~3-5 min en Docker, **11.1s** para `tsc + next build` local (verificado 2026-07-08 21:38) |
| Memoria del repo (`AGENTS.md` + `MedSysVE-context.md` + `MEMORY.md`) | 3 capas, cobertura completa + 4 lecciones Stripe nuevas |

---

## Stack tecnolÃ³gico (versiones al 2026-06-27)

| Capa | TecnologÃ­a | VersiÃ³n | Notas |
|------|-----------|---------|-------|
| Runtime | Node.js | 20.x LTS | Cloud Run container |
| Framework | Next.js (App Router, `output: standalone`) | 16.2.9 | âš ï¸� Lee `node_modules/next/dist/docs/` antes de escribir cÃ³digo. |
| UI | React + shadcn/ui + Tailwind CSS v4 | 19.2.4 / ^4 | **Tailwind v4** = sin `tailwind.config.js`, keyframes vÃ­a `@theme inline`. |
| Lenguaje | TypeScript | ^5 strict | `tsc --noEmit` debe pasar siempre. |
| API | tRPC | ^11.17.0 | Routers en `server/routers/*.ts`. |
| Auth | Auth.js (next-auth beta) JWT, multi-rol | ^5.0.0-beta.31 | **Salt `__Secure-authjs.session-token`** en prod. `proxy.ts` reemplaza `middleware.ts`. |
| ORM | Prisma + `@prisma/adapter-pg` | ^7.8.0 | Prisma 7 requiere PgAdapter (no usar cliente por defecto). |
| DB | PostgreSQL | 16 | Multi-tenant por `workspaceId`. |
| Cache | Redis (ioredis) | ^5.11.1 | Sorted set `meds:autocomplete`. Se vacÃ­a al reiniciar. |
| ValidaciÃ³n | Zod | ^4.4.3 | Inputs en cada procedure tRPC. |
| IA | Anthropic Claude (haiku + sonnet) | API | `claude-haiku-4-5` para coste-eficiente, `claude-sonnet-4-6` para generaciÃ³n de informes. |
| PDF | `@react-pdf/renderer` | ^4.5.1 | On-demand, **CERO escrituras a disco**. |
| Email | nodemailer + Gmail SMTP | ^7.0.13 | Drop Resend en 2026-06-25 (`e294b90`). |
| WhatsApp | Meta Cloud API v20 | - | Solo documentos listos. |
| QR codes | qrcode | ^1.5.4 | Para 2FA TOTP enrollment. |
| Charts | Recharts | ^3.8.0 | Analytics + vitales. |
| Forms | react-hook-form + zodResolver | ^7.79.0 | |
| Deploy | Cloud Run (Docker standalone) | v4.1.2 | GCP GCP `Google Cloud Run`. App ID `jes48vqxcs3l2lyk1lkpa5zt`. |
| Tests E2E | Playwright | ^1.61.0 | `tests/`. |
| Tests unit | vitest | ^4.1.9 | `vitest.config.ts`. |
| Lint | ESLint | ^9 | `eslint.config.mjs`. |

---

## Estado de build (al 2026-06-27)

```
npx tsc --noEmit         â†’ 0 errores âœ…
npx next build           â†’ 54 rutas, 0 errores âœ… (verificar tras cambios grandes)
git push origin master   â†’ Ãºltimo commit 5b65856 âœ…
```

Ãšltimo deploy **verificado**: container `hze8mocuh4xqskqwrm3mx50b-011021577885` corriendo imagen `b8d3a44bfc43112686bd19d7da014635fddab123`, healthy, creado 2026-06-27 01:19:23Z. Deploys posteriores (`20c0f07`, `37cb1bd`, `5b65856`) auto-disparados por Cloud Run vÃ­a webhook de GitHub, pero **`37cb1bd` requiere intervenciÃ³n manual** post-deploy (ver Open Follow-ups).

---

## Fases implementadas (40 / 40 âœ…)

### NÃºcleo base

| # | Fase | Estado | Detalle |
|---|---|---|---|
| 1 | AutenticaciÃ³n y Base | âœ… | Auth.js v5, workspaces, roles, registro pacientes, dashboards por rol, Dockerfile/Cloud Run. |
| 2 | MÃ³dulo ClÃ­nico (Consulta) | âœ… | Schema: Encounter, Diagnosis, Medication, Prescription, LabOrder, ImagingOrder, Document. Redis autocomplete de medicamentos, IMC, alertas vitales, PDF con membrete. |
| 3 | Citas y FacturaciÃ³n | âœ… | Schema: Appointment, Invoice. Calendario semanal, tasa BCV manual, facturas PDF, numeraciÃ³n F-000001+. |
| 4 | OCR + WhatsApp + ClÃ­nica PÃºblica + Portal | âœ… | `/api/lab-ocr` con Claude Vision. Notificaciones WhatsApp (Meta Cloud). Portal de citas. `/clinica/[slug]` pÃºblico. |
| 5 | Analytics + Horario + Autoagendamiento | âœ… | Dashboard Recharts. Disponibilidad por dÃ­a. Portal REQUESTED. |
| 6 | Email + Portal Password + Red de Referidos | âœ… | Email + portal password + referidos entre doctores. (Migrado de Resend a Gmail SMTP en F35+.) |
| 7 | Workspace Settings + PDF Historia + Cron Reminders | âœ… | Config consultorio. PDF historia completa. Cron `appointment-reminders` con `CRON_SECRET`. |
| 8 | Dashboard EnfermerÃ­a + Portal Recetas + Email Factura | âœ… | Sala espera + llegadas + no-shows. Portal recetas. Email factura. |

### Mejoras clÃ­nicas y operativas

| # | Fase | Estado | Detalle |
|---|---|---|---|
| 9 | Resultados Lab + Dashboard Secretaria + Notas + BCV Auto | âœ… | Schema: LabResult. Dashboard secretaria. Notas internas. Auto-fetch `ve.dolarapi.com`. |
| 10 | Medicamentos 311 + CSV Pacientes + Dashboard Asistente | âœ… | CatÃ¡logo 311 fÃ¡rmacos. ExportaciÃ³n CSV. Dashboard asistente. |
| 11 | Multi-consultorio + Reporte Financiero PDF + Workspace UI | âœ… | Cambio consultorio desde sidebar. CreaciÃ³n nuevo consultorio. PDF reporte mensual. |
| 12 | Portal Mejorado + Analytics Avanzados + Flujo de Citas | âœ… | Lab results portal, cancelaciÃ³n con confirmaciÃ³n. RetenciÃ³n 90 dÃ­as, top diagnÃ³sticos. |
| 13 | Videoconsulta + Perfil Doctor + Auto-COMPLETAR Cita | âœ… | VIDEOCONSULTA con Jitsi. Perfil pÃºblico doctor. Auto-complete al firmar consulta. |
| 14 | SOAP + Plan + Historia de Citas por Paciente | âœ… | Subjetivo / Objetivo / AnÃ¡lisis / Plan. Auto-save 1.5s debounce. Historial citas en ficha. |
| 15 | Citas Recurrentes + Abonos en Facturas | âœ… | Series semanal/quincenal/mensual (2-12 citas). Pagos parciales en PENDING. |
| 16 | GrÃ¡ficas Vitales + Mensajes + Alergias | âœ… | Recharts PA/FC/peso. MensajerÃ­a doctor-paciente polling. Alergias con gravedad. |
| 17 | Antecedentes + PDF Orden Lab + Advertencia Alergias + Badge | âœ… | Antecedentes estructurados. PDF orden lab. Warning alergias en receta. Badge mensajes sin leer. |
| 18 | (saltada en docs, integraciÃ³n continua) | â€” | â€” |
| 19 | IA Asistente + Plantillas Consulta + Portal Perfil + Etiquetas | âœ… | Claude Haiku diagnÃ³stico diferencial + plan. Plantillas consulta. Perfil portal. Etiquetas. |
| 20 | Interacciones Medicamentos IA + Fechas Bloqueadas + Plantillas Documentos + Reagendamiento | âœ… | Interacciones con Claude Haiku. Excepciones horario. Plantillas documentos. Reagendamiento portal. |
| 21 | Ã�tems Factura + Filtros Pacientes + Anuncios + Tendencias Lab | âœ… | LÃ­neas detalle factura. Filtros sexo + etiqueta. Anuncios portal. Tendencias lab. |

### MÃ³dulos especializados

| # | Fase | Estado | Detalle |
|---|---|---|---|
| 22-26 | Sala de espera, Staff, Tasks, etc. | âœ… | Waiting room + estados (ESPERANDO/LLAMADO/ATENDIDO). Notas staff. Tareas con prioridad. Anuncios. |
| 27 | Panel de CrÃ³nicos | âœ… | Risk scoring + widget dashboard. |
| 28 | Portal Completo | âœ… | Vacunas, exÃ¡menes, recetas con PDF en portal paciente. |
| 29 | Notificaciones Internas | âœ… | Bell icon, `Notification` model + `NotificationType` enum (7 tipos). `TIPO_CONFIG` + `TIPO_HREF` maps para iconografÃ­a y destinos clickeables. |
| 30 | Tareas del Equipo | âœ… | Board de tareas con asignaciÃ³n a staff + prioridad + fecha vencimiento. |
| 31 | BÃºsqueda Global + ExportaciÃ³n CSV | âœ… | Command palette Ctrl+K. Export CSV citas y facturas. |
| 32 | Seguros MÃ©dicos (HMO) | âœ… | Schema: InsuranceProvider, PatientInsurance. Cobertura factura. PÃ¡gina gestiÃ³n. |
| 33 | Consentimientos Informados | âœ… | Schema: ConsentTemplate, PatientConsent. 4 plantillas venezolanas pre-cargadas. Firma digital. |
| 34 | AuditorÃ­a ClÃ­nica | âœ… | Schema: AuditLog + AuditEvent (PHI access trail). Eventos de CONSULTA_FIRMADA y otros. Dashboard filtrable. |
| 35 | Marco Legal LOPDP | âœ… | `LegalVersion` + `ConsentAcceptance`. TÃ©rminos / Privacidad / Cookies / Consentimiento LOPDP. Breach ledger. Admin compliance dashboard. AI support bot con contexto legal. |
| 36 | MÃ³dulo PediÃ¡trico | âœ… | Curvas crecimiento OMS (P3/P50/P97). Esquema PAI Venezuela. Auto-hide para adultos. |
| 37 | Recordatorios Configurables | âœ… | `recordatorioHoras` + `recordatorioWa` + `recordatorioEmail` por workspace. Cron respeta config. |
| 38 | Logo y Branding | âœ… | Upload logo/membrete (â‰¤5 MB, JPG/PNG/WebP). Branding en todos los PDFs. MedSysVE wordmark con bandera. |
| 39 | ImportaciÃ³n Masiva de Pacientes | âœ… | CSV import (max 500 filas/5 MB). DeduplicaciÃ³n automÃ¡tica. Plantilla descargable. |
| 40 | Indicadores de Calidad | âœ… | 12 mÃ©tricas KPI. Score general de calidad. Tendencias con flechas de direcciÃ³n. |

### Mejoras recientes (post-fase-40)

| Feature | Commit | Detalle |
|---|---|---|
| CÃ©dula merge conflict flow | `20c0f07` | `acceptReferral` detecta paciente existente en workspace del receptor, flipea `MERGE_PENDING` y pide resoluciÃ³n manual. `resolveReferralMerge({keep\|update})`. Audit `PATIENT_MERGE_*`. |
| Prescription + Imaging PDF redesign | `054d300`, `6e41c9f`, `b8d3a44` | Landscape 50/50 con header/footer duplicados. Estilo "Dr. Pierluissis". |
| Accordion sections | `97aad84` | Patient history + encounter workspace a `<AccordionSection>` con empty states informativos. |
| In-app REFERRAL_RECEIVED | `37cb1bd` | NotificaciÃ³n in-app cuando recibÃ­s un referido, con bell wiggle + click â†’ `/doctor/referrals`. Antes solo email. |
| Comprehensive AGENTS.md | `5b65856` | Entry point para AI agents con 3 capas de memoria. |
| **Backup migration: Google Drive â†’ Google Cloud Storage** | 2026-07-13 (manual ops, no code) | Drive OAuth token venciÃ³ y Service Accounts de Drive no tienen storage quota en cuentas personales (requiere Workspace + Shared Drives, $7-14/user/mo, descartado). B2 es la soluciÃ³n permanente: bucket privado `medsysve-backups`, app key con scope solo al bucket, doble encryption (gpg + rclone crypt), retention 7 daily + 4 weekly + 12 monthly. **4 retention bugs arreglados en `/opt/medsysve-backup/backup.sh`** (awk, ((COUNT++)), `[[ ]]`, date syntax â€” los 4 estaban rotos desde el deploy inicial). Backup mensual de configs/scripts/cron/rclone.conf con passphrase en 1Password. Drill end-to-end de recovery verificado. |
| **Drug-allergy interaction check (safety feature)** | `9a963d0` | `lib/drug-allergies.ts` con ~30 familias farmacolÃ³gicas VE (penicilinas, AINEs, cefalosporinas, sulfas, etc.) + match exact/synonym/family + 31 unit tests. UI warning + override button en `prescription-form.tsx`. Defense-in-depth en `prescription.ts` rechaza sin `overrideAlerta=true`. PDF: banner rojo en ambas mitades + badge "OVR". AI: alergias inyectadas en prompts. Audit `ALLERGY_OVERRIDE`. 3 capas: UI â†’ server â†’ audit. |

---

## Arquitectura de un vistazo

### Multi-tenancy â€” reglas duras

- Cada `Doctor` tiene uno o mÃ¡s `Workspace`s. Uno principal + (opcional) consultorios afiliados via `Clinic` + `DoctorClinicAffiliation`.
- Cada `Patient` pertenece a UN workspace (`Patient.workspaceId`). El mismo paciente en dos consultorios = DOS rows de `Patient`, una por workspace. **Esto es por diseÃ±o** â€” el aislamiento clÃ­nico es una promesa HIPAA/LOPDP, no una optimizaciÃ³n.
- **NO** hay uniqueness global sobre `(tipoIdentificacion, numeroIdentificacion)` en `Patient`. Hubo un leak cross-tenant por ese unique constraint en el pasado y se removiÃ³ (`52e2abe`). Cross-workspace lookup por cÃ©dula solo ocurre en el momento del registro vÃ­a `hmacCedula`, y nunca se filtra PHI entre workspaces.
- Las rutas de PDF filtran por `encounter.workspaceId === user.workspaceId` Y devuelven **404, NO 403** cuando hay cross-tenant (no leak de existencia).
- Auth-gated routes pasan por `proxy.ts` que llama `auth()` (edge-safe). Endpoints `/api/auth/*` deben pasar SIN session gate (CSRF existe para bootstrappear login). `/api/trpc/*` bypass (cada procedure tiene su propia authz).

### PHI encryption + searchable

- **Encryption:** AES-256-GCM con `FIELD_ENCRYPTION_KEY` (32 bytes). Helpers en `lib/field-crypto.ts`.
- **Pattern:** campo `xxx` (legacy plaintext) + `xxxCifrado` (preferred). Escrituras nuevas van al cifrado; lecturas hacen fallback a plaintext si `xxxCifrado` es NULL (durante migration).
- **Searchable encryption:** HMAC-SHA-256 con `FIELD_HMAC_KEY` (separado de la encryption key). Indexes en `hmacCedula`, `hmacNombre`, `hmacApellido`, `hmacTelefono`, `hmacEmail`. Permiten queries `WHERE hmacXxx = ?` sin descifrar.
- **23 columnas** encriptadas al 2026-06-22 (`0dbe382`): cÃ©dulas, telÃ©fonos, emails, anamnesis, planes, firmas, etc.
- **Special cases:** `Encounter.signatureHash` = HMAC de `{encounterId, signedBy, signedAt, content}`. Detecta tampering de cualquier campo firmado.

### PDFs on-demand (regla de oro)

**CERO escrituras a disco.** El filesystem de Cloud Run es efÃ­mero â€” `public/uploads/` se borra al reiniciar el contenedor. Todos los PDFs son rutas GET de API que leen la DB y renderizan con `@react-pdf/renderer`. `Buffer â†’ Response` con cast `as unknown as BodyInit`.

| PDF | Ruta API | Verificado |
|-----|---------|------------|
| Historia clÃ­nica completa | `GET /api/pdf/history/[patientRegId]` | âœ… |
| Encuentro firmado (resumen) | `GET /api/pdf/encounter/[id]` | âœ… |
| Factura | `GET /api/pdf/invoice/[id]` | âœ… |
| Reporte financiero mensual | `GET /api/pdf/report/[year]/[month]` | âœ… |
| CarnÃ© de vacunas | `GET /api/pdf/vaccine-carnet/[patientRegId]` | âœ… |
| Receta mÃ©dica | `GET /api/pdf/prescription/[id]` | âœ… |
| Orden de laboratorio | `GET /api/pdf/lab-order/[id]` | âœ… |
| Orden de imagen | `GET /api/pdf/imaging-order/[id]` | âœ… |
| Documento (reposo/informe/referido/certificado) | `GET /api/pdf/document/[id]` | âœ… |
| Recibos de pago (parciales) | `GET /api/pdf/payment/[pagoId]` | âœ… |

**Filenames:** `tipo-NombreApellido-DDMMYYYY.pdf` (ej: `factura-F-000001.pdf`, `consulta-PacientePrueba-22062026.pdf`).

### Roles

```
DOCTOR      â†’ acceso total, propietario del workspace
SECRETARY   â†’ agenda, facturaciÃ³n, pacientes
ASSISTANT   â†’ agenda, pacientes (lectura)
NURSE       â†’ sala de espera, signos vitales
PATIENT     â†’ portal solo-lectura (portal.*)
```

âš ï¸� **`SessionUser.role` NO incluye `"ADMIN"`**. Comparaciones contra `"ADMIN"` causan error de compilaciÃ³n. Para admin checks usa `session.user.isAdmin` (campo en JWT) o filtra por `doctor.isAdmin`.

---

## Modelos de DB (47, agrupados por dominio)

### Identidad y tenancy
`Doctor`, `Workspace`, `Clinic`, `DoctorClinicAffiliation`, `Staff`

### Pacientes y registro
`Patient`, `PatientRegistration`, `PatientTag`, `PatientInsurance`

### ClÃ­nica
`Encounter`, `Diagnosis`, `Medication`, `Prescription`, `PrescriptionItem`, `LabOrder`, `LabResult`, `ImagingOrder`, `ImagingOrderItem`, `Document`, `DocumentTemplate`, `Alergia`, `Vaccine`, `ConsentTemplate`, `PatientConsent`

### Citas y operaciÃ³n
`Appointment`, `WaitingEntry`, `Mensaje`, `EncounterTemplate`, `PatientConsent`

### FacturaciÃ³n
`Invoice`, `InvoiceItem`, `Pago`, `InsuranceProvider`

### Horario
`DoctorAvailability`, `AvailabilityException`

### Equipo y comunicaciÃ³n
`Announcement`, `StaffNote`, `Task`, `Notification`

### Compliance y auditorÃ­a
`TwoFactorBackupCode`, `AuditLog`, `AuditEvent`, `LegalVersion`, `ConsentAcceptance`, `DataExportRequest`, `DataDeletionRequest`, `BreachIncident`, `EmailOtp`

### CatÃ¡logos y clÃ­nica pÃºblica
`ClinicPost`

**Total: 47 modelos, 17 enums, 1320 lÃ­neas de schema.**

---

## Routers tRPC (35)

| Router | Path | Responsabilidad |
|---|---|---|
| `auth` | `server/routers/auth.ts` | Login, register, password reset. |
| `twoFactor` | `server/routers/twoFactor.ts` | TOTP enrollment + verify. |
| `doctor` | `server/routers/doctor.ts` | Doctor profile + workspace switcher. |
| `workspace` | `server/routers/workspace.ts` | Workspace settings + multi-clinic. |
| `patient` | `server/routers/patient.ts` | CRUD paciente + bÃºsqueda HMAC. |
| `encounter` | `server/routers/encounter.ts` | CRUD consulta SOAP + sign. |
| `diagnosis` | (vÃ­a encounter) | DiagnÃ³sticos CIE-10. |
| `prescription` | `server/routers/prescription.ts` | CRUD receta + PDF. |
| `medication` | `server/routers/medication.ts` | CatÃ¡logo + Redis autocomplete + seed. |
| `labOrder` | `server/routers/labOrder.ts` | Ã“rdenes de lab. |
| `labResult` | `server/routers/labResult.ts` | Resultados + tendencias. |
| `imagingOrder` | `server/routers/imagingOrder.ts` | Ã“rdenes de imagen + resultados. |
| `document` | `server/routers/document.ts` | Documentos clÃ­nicos + referidos + sign + merge conflict. |
| `icd10` | `server/routers/icd10.ts` | BÃºsqueda CIE-10 autocomplete. |
| `appointment` | `server/routers/appointment.ts` | Citas + series + notifications. |
| `availability` | `server/routers/availability.ts` | Horario semanal + excepciones. |
| `invoice` | `server/routers/invoice.ts` | FacturaciÃ³n + pagos parciales + PDF. |
| `insurance` | `server/routers/insurance.ts` | Seguros mÃ©dicos + cobertura. |
| `mensaje` | `server/routers/mensaje.ts` | MensajerÃ­a doctor-paciente. |
| `alergia` | `server/routers/alergia.ts` | Alergias + gravedad. |
| `vaccine` | `server/routers/vaccine.ts` | Vacunas + carnÃ© PDF. |
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
| `clinicPublic` | `server/routers/clinicPublic.ts` | PÃ¡gina pÃºblica `/clinica/[slug]`. |

---

## Variables de entorno requeridas

```env
# Base
DATABASE_URL=postgresql://user:pass@host:5432/medsysve
NEXTAUTH_SECRET=<32+ char>
NEXTAUTH_URL=https://medsysve.Google Cloud Run.sslip.io

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

# Email (Gmail SMTP via nodemailer â€” desde 2026-06-25)
GMAIL_USER=yoguitech@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx     # App Password, no la cuenta normal

# Cron
CRON_SECRET=<32+ char>

# LOPDP / Legal
LEGAL_SUPPORT_EMAIL=yoguitech@gmail.com

# Allowed IPs para la DB de Cloud Run (compartida entre Carlos / debug)
# Restaurar a "73.8.161.68,65.155.46.36" si se abre durante debug.
```

> **SEGURIDAD:** La contraseÃ±a de base de datos JAMÃ�S debe colocarse en la configuraciÃ³n de Cloud Run directamente â€” se almacena en la DB de Cloud Run y aparece en logs. Usar Docker secrets o variables de entorno cifradas.

---

## Convenciones del cÃ³digo

- **Archivos:** `camelCase` (`trpc-client.ts`, `billing-client.tsx`).
- **Imports:** `@/` alias sobre paths relativos.
- **tRPC procedures:** `publicProcedure` / `protectedProcedure` / `doctorProcedure` desde `server/trpc.ts`.
- **Prisma client:** SIEMPRE importar desde `lib/db.ts` (que crea el PgAdapter). NO usar `new PrismaClient()` directamente.
- **Buffer â†’ Response:** `new NextResponse(buffer as unknown as BodyInit, { headers: ... })` â€” el cast es necesario porque `Buffer<ArrayBufferLike>` no es asignable a `BodyInit` directo.
- **Server Components:** no usar `"use client"`. Client wrappers solo donde hay estado/efectos.
- **Notifications:** cuando agregues un nuevo tipo, sigue el patrÃ³n en `components/notifications/notification-bell.tsx` â€” extiende `NotificationType` enum + `TIPO_CONFIG` (icono/colores) + `TIPO_HREF` (destino on-click). La campanita, badge, wiggle y aria-label derivan de esos maps.
- **Audit:** acciones de impacto clÃ­nico van en `AuditEvent` (PHI access). Acciones de config/admin en `AuditLog`. Ver `lib/audit.ts` para el enum `AuditAction`.
- **PHI encriptado:** campos `*Cifrado` se prefieren en escrituras nuevas; legacy plaintext se tolera como fallback. HMAC indexes (`hmacCedula`, `hmacNombre`, etc.) habilitan queries buscables sin descifrar.
- **No escribir secretos a logs.** `lib/log-sanitizer.ts` trunca IPs a `/24` (IPv4) / `/48` (IPv6).
- **Single quote en commits:** mensajes con scope (`feat(scope):`, `fix(scope):`, `docs:`).
- **Git author:** SIEMPRE `Carlos Pierluissi <cpierluissis@gmail.com>` â€” Vercel/Cloud Run rechaza otros emails.

---

## Seguridad y compliance

### LOPDP (Venezuela)

- Marco legal completo: TÃ©rminos, Privacidad, Cookies, Consentimiento (`content/legal/*.md`).
- Versionado con `LegalVersion` (slug, version, contentHash, effectiveAt).
- `ConsentAcceptance` por doctor + slug + versiÃ³n + IP truncada.
- Gate en `app/(dashboard)/layout.tsx` via `requireLegalAcceptance()` â€” fuerza re-aceptar cuando Carlos bumpea `LegalVersion`.
- **Derecho de acceso (Art. 60):** `DataExportRequest` con download token 30-dÃ­as.
- **Derecho de cancelaciÃ³n (Art. 61):** `DataDeletionRequest` con soft-delete (tombstone) + audit trail preservado.
- **Breach notification (Art. 64):** `BreachIncident` ledger con ventana de 72h.

### HIPAA (referencia, no certificado)

- PHI cifrado a nivel de campo (AES-256-GCM).
- Audit trail exhaustivo en `AuditEvent` para cada read/write de PHI.
- Access control multi-tenant via `workspaceId` en cada query.
- Tenant isolation verificada en security audit (`52e2abe`).
- 9 rutas PDF + 3 CSV + 3 AI todas loggean access en `AuditEvent` con `AI_PHI_DISCLOSURE` para IA.

### AutenticaciÃ³n

- Auth.js v5 con JWT, multi-rol.
- 2FA TOTP opcional por doctor (`TwoFactorBackupCode` con bcrypt-hashed recovery codes).
- Email OTP para verificaciÃ³n de registro y password reset (`EmailOtp` con SHA-256 del cÃ³digo, nunca plaintext).
- Token format seguro: `base64url(JSON) + base64url(HMAC sig)` con `.` como Ãºnico separador de 2 partes (lecciÃ³n dura: un email con `.` rompiÃ³ el flujo viejo).

---

## Logros / Hitos clave

### Producto

- âœ… **Multi-tenant con aislamiento clÃ­nico estricto** (HIPAA-style) â€” paciente es por workspace, no global.
- âœ… **Ciclo clÃ­nico completo** â€” desde registro del paciente hasta cobro, con todos los intermediarios (recetas, Ã³rdenes, referidos, PDFs).
- âœ… **PHI cifrado end-to-end con searchable encryption** â€” 23 columnas encriptadas, queries siguen funcionando vÃ­a HMAC indexes.
- âœ… **Asistencia IA integrada** â€” borrador de informe, OCR de labs, interacciones medicamentosas, alerta de alergias, diagnÃ³stico diferencial.
- âœ… **Compliance LOPDP completo** â€” legal framework + audit + derechos ARCO + breach ledger.
- âœ… **Portal del paciente** â€” agendar, ver recetas, mensajes, descargar PDFs, gestionar consentimiento.
- âœ… **Red de referidos** â€” flujo completo con merge conflict resolution.
- âœ… **FacturaciÃ³n dual USD/Bs** con tasa BCV auto-fetch + pagos parciales + cobertura de seguros.
- âœ… **40/40 fases implementadas.**

### TÃ©cnico

- âœ… **17 migrations idempotentes** aplicadas en producciÃ³n sin downtime.
- âœ… **Serverless Containers build** funcionando en Cloud Run con contenedor efÃ­mero + uploads persistentes.
- âœ… **Traefik apex â†’ www cookie handling** dominado (siempre curl con `www.medsysve.com`).
- âœ… **Hot module reload estable** â€” `proxy.ts` reemplaza `middleware.ts` (edge runtime sin `node:util/types`).
- âœ… **Audit exhaustivo** â€” 9 PDFs + 3 CSVs + 3 AI + todas las mutations clÃ­nicas con `AuditEvent`.
- âœ… **Memory system en 3 capas** â€” AGENTS.md (repo) + MedSysVE-context.md (cron auto-update) + MEMORY.md (cross-project). Cualquier agente fresco arranca produciendo.

### Negocio

- âœ… 3 doctores activos multi-tenant: Carlos (admin), Joel, Dayana.
- âœ… Producto operacional bajo Yoguitech.LLC.
- âœ… Branding completo: wordmark con bandera, logo transparente, favicon, dominio propio.

---

## Pendientes / Open Follow-ups (al 2026-07-06 23:50)

### âœ… Cerrados en este ciclo (audits S5-S7)

- [x] Audit #16 cerrado (`2578564`): TIPO_HREF completo para 7 NotificationTypes
- [x] Audit #18 cerrado (`6509011`): backup chain v2 + monthly restore drill
- [x] Gap #1 cierre mayor: 14 routers migrados a `doctorProcedure` (S5+S7)
- [x] Gap #2 cerrado (`ec28975`): billing.createCheckoutSession â†’ doctor
- [x] Gap #3 cerrado (S5): staffNote â†’ doctor
- [x] Gap #4 cerrado (S7): task.ts â†’ doctor
- [x] AUDIT_BACKLOG.md refresh (2026-07-06 23:30): marca #16/#18 como DONE
- [x] PERMISSIONS.md refresh (2026-07-06 23:30): routers S7 actualizados

### ðŸ”´ Urgente (post-deploy inmediato)

- (Ninguno â€” los Ãºnicos urgentes eran ALTER TYPE migrations de #16 y eso ya deployÃ³ OK)

### ðŸŸ¡ Corto plazo (este sprint)

- [ ] **Banner persistente en dashboard** si hay referidos pendientes â€” Carlos dijo "no hay nada que indique que tiene algo pendiente". El bell badge ya existe pero un banner rojo al entrar al portal serÃ­a mÃ¡s prominente.
- [ ] **Migrar duplicados existentes** â€” el referido duplicado que ya existe en workspace de Joel (sivanam1982 â†’ joguelpinto0810) NO se limpia con el merge-conflict flow. Script de migraciÃ³n one-shot opcional.
- [ ] **Deep-link per-record para IMAGING_RESULT** â€” actualmente navega a `/doctor/patients` (lista). Pendiente denormalizar `patientRegistrationId` en `referenciaId` o server-side lookup keyed off imaging order (audit #16 follow-up).

### ðŸŸ¢ Mantenimiento continuo

- [ ] **Sembrar medicamentos en prod** si se tocaron: `POST /api/admin/seed-medications` desde navegador con sesiÃ³n DOCTOR. Esperado: `{ ok: true, upserted: ~501, redisLoaded: ~501 }`.
- [ ] **Verificar `allowed_ips`** de la DB de Cloud Run despuÃ©s de cualquier debug. Valor correcto: `73.8.161.68,65.155.46.36`.

### ðŸ”µ Backlog (audits S9-S11 candidatos, scope confirmado)

- [x] **S8: AI rate-limit numÃ©rico + prompt injection tests (audit #13)** âœ… **DONE 2026-07-07** â€” per-doctor rate limit activo (30/60/60), `lib/ai/guardrails.ts` con 4 capas, 45 tests adversariales. Detalles en `docs/AUDIT_BACKLOG.md` Â§#13.
- [x] **S9: Encounter auto-save conflict resolution (audit #12)** âœ… **DONE 2026-07-07** â€” `Encounter.version` + optimistic locking en `update`/`saveVitals` + AuditAction `ENCOUNTER_CONFLICT`. 10 tests de regresiÃ³n.
- [x] **S10: Per-doctor feature flag override (audit #15)** âœ… **DONE 2026-07-07** â€” `DoctorFeatureOverride` model + admin-only `featureFlag` router (list/set/clear) + 14 tests. Cache invalidation in-process.
- [x] **S11: PHI key rotation procedure + scripts (audit #4)** âœ… **DONE 2026-07-07** â€” `scripts/rotate-field-keys.sh` + `.ts` + 6 tests + `docs/DR-PLAN.md` Â§5.1 runbook + `AGENTS.md` secrets-rotation section.

**0 items pendientes en audit backlog.** Score global 91.2/100 (A+ en Audit Completion).

### ðŸ”µ Futuro (post-lanzamiento v2)

- [ ] **Auto-migrate en build de Cloud Run** â€” agregar `prestart` o script de release que corra `npx prisma migrate deploy` automÃ¡ticamente. Hoy es manual.
- [ ] **Real-time notifications** â€” reemplazar polling cada 30s con SSE o WebSocket. Latencia menor, menos requests.
- [ ] **Mobile app** â€” actualmente es web responsive. App nativa (React Native) serÃ­a plus.
- [ ] **Telemedicina mejorada** â€” Jitsi funciona pero UX puede mejorar (calendar integration, recording).
- [ ] **Multi-idioma** â€” actualmente solo espaÃ±ol (es-VE). i18n con `next-intl` para escalar.
- [ ] **Tests E2E mÃ¡s cobertura** â€” Playwright cubre los happy paths pero faltan edge cases de merge conflict, multi-doctor, etc.
- [ ] **Observability centralizada** â€” Sentry/Datadog o equivalente (actualmente audit log + log-sanitizer, sin tracing/metrics centralizados).
- [ ] **Performance profiling** â€” anÃ¡lisis N+1 queries + TTFB/LCP metrics en prod.

---

## Comandos rÃ¡pidos

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

# En prod (vÃ­a SSH al GCP, despuÃ©s docker exec al container)
docker ps                                          # ver containers corriendo
docker inspect <container> --format '{{.Config.Image}}'   # ver SHA del image
docker exec -it <container> npx prisma migrate deploy      # aplicar migrations
docker logs --tail 200 <container>                         # logs

# Re-sembrar Redis (post-deploy con cambios en medicamentos)
#   En navegador con sesiÃ³n DOCTOR activa en www.medsysve.com:
#   fetch('/api/admin/seed-medications', { method: 'POST' }).then(r => r.json()).then(console.log)

# Smoke test con mint-jwt (cross-doctor, ver MedSysVE-context.md para patrÃ³n completo)
node mint-jwt-joel.mjs                                       # genera JWT
curl -H "Cookie: __Secure-authjs.session-token=<jwt>" \
  https://www.medsysve.com/api/pdf/prescription/<id> \
  -o /tmp/test.pdf
```

---

## DocumentaciÃ³n relacionada

| Doc | PropÃ³sito | Ãšltima actualizaciÃ³n |
|---|---|---|
| `AGENTS.md` | Entry point para AI agents â€” orientaciÃ³n + estado + convenciones | 2026-07-06 (`6509011`) |
| `SISTEMA.md` | DescripciÃ³n funcional del sistema desde la perspectiva de usuario/dominio | (stale, menciona AJMedics) |
| `RUNBOOK.md` | Procedimientos operativos: deploy, rollback, restore, troubleshooting | 2026-07-02 (`49b9835`) |
| `SECURITY_HARDENING_CHANGELOG.md` | 20 bugs de seguridad arreglados en 6 commits | 2026-06-22 (`22315d5`) |
| `PROJECT_STATUS.md` (este) | Estado comprehensivo del proyecto â€” quÃ© es, quÃ© hay, quÃ© falta | 2026-07-06 (`6509011`) |
| `docs/DR-PLAN.md` | Disaster recovery runbook + audit #18 backup chain v2 | 2026-07-06 (`6509011`) |
| `docs/AUDIT_BACKLOG.md` | Audit IDs pendientes con scope inference para #4/#12/#13/#15/#16 | 2026-07-06 (`6509011`) |
| `docs/MANUAL-USUARIO.md` | Manual para el usuario final (mÃ©dicos) | (existente) |
| `docs/DOCUMENTACION-TECNICA.md` | DocumentaciÃ³n tÃ©cnica detallada | (existente) |
| `docs/MEMORIA-SISTEMA.md` | Memoria funcional del sistema | (existente) |
| `content/legal/*.md` | Textos legales (TÃ©rminos, Privacidad, Cookies, LOPDP) | Versionado con `LegalVersion` |
| `~/.mavis/agents/mavis/memory/MedSysVE-context.md` | Changelog operacional detallado + crons | Auto-update via `medsysve-sync` cron cada 30 min |
| `~/.mavis/agents/mavis/memory/MEMORY.md` | Preferencias Carlos + lecciones cross-project | 2026-06-27 |

---

## Contacto

- **Owner:** Carlos Pierluissi (`cpierluissis@gmail.com`).
- **Operado por:** Yoguitech.LLC.
- **Renombrar:** AJMedics â†’ MedSysVE fue el rename pÃºblico en 2026-06. Dentro de algunos docs viejos todavÃ­a aparece AJMedics. Buscar si importa antes de mostrar a externos.
- **Repositorio:** `github.com/guaricool/MedSysVE`.


 -   * * 2 0 2 6 - 0 7 - 2 0   ( P o r t a l   R e g i s t r a t i o n   &   L o g i n   F i x e s ) * * :   
     -   F i x e d   p r o x y . t s   r a t e - l i m i t s   o n   \ / a p i / a u t h / \   a n d   \ / a p i / a u t h / c a l l b a c k / c r e d e n t i a l s \   t o   a v o i d   4 2 9   w h e n   P o r t a l U s e r   i n i t i a t e s   N e x t A u t h   s e s s i o n . 
     -   A l l o w e d   \ / p o r t a l / r e g i s t e r \   i n   P O R T A L _ A U T H _ P A G E S   w i t h i n   p r o x y . t s   t o   f i x   r e d i r e c t   l o o p   w h e r e   u n a u t h e n t i c a t e d   u s e r s   c o u l d n ' t   r e a c h   t h e   p a t i e n t   r e g i s t r a t i o n . 
     -   A d d e d   C o u n t r y C o d e S e l e c t   ( <ØûÝ<ØêÝ  + 5 8 )   a n d   s t r u c t u r e d   p h o n e   i n p u t   t o   \  p p / p o r t a l / r e g i s t e r / p a g e . t s x \   t o   m a t c h   D o c t o r / C l i n i c   f o r m s . 
     -   A d d e d   ' R e g í s t r a t e   a q u í '   b u t t o n   i n   \  p p / p o r t a l / l o g i n / p a g e . t s x \   r o u t i n g   t o   \ / p o r t a l / r e g i s t e r \ . 
     -   A d d e d   c l i c k a b l e   l o g o   t o   \  p p / p o r t a l / l a y o u t . t s x \   t h a t   r e t u r n s   p a t i e n t s   t o   l a n d i n g   p a g e   ( \ / \ ) . 
     -   C o n f i r m e d   M e d S y s V E   s u c c e s s f u l l y   t r a n s i t i o n e d   e n t i r e l y   t o   G o o g l e   C l o u d   R u n   i n s t e a d   o f   C o o l i f y   V P S . 
  
 
 -   * * A c c e s s   t o   C l o u d   S e r v i c e s   ( G C P   &   G i t H u b ) * * :   
     -   T h e   l o c a l   a g e n t   e n v i r o n m e n t   h a s   f u l l   a c c e s s   t o   t h e   \ g c l o u d \   C L I .   A g e n t s   c a n   a n d   s h o u l d   r u n   c o m m a n d s   l i k e   \ g c l o u d   r u n   s e r v i c e s   d e s c r i b e   m e d s y s v e \   o r   \ g c l o u d   l o g g i n g   r e a d \   t o   m o n i t o r   d e p l o y m e n t s   a n d   i n s p e c t   b a c k e n d   b e h a v i o r   d i r e c t l y . 
     -   F u l l   \ g i t \   a c c e s s   i s   c o n f i g u r e d   t o   p u s h / p u l l   f r o m   G i t H u b   ( \ o r i g i n   m a s t e r \ )   e f f o r t l e s s l y . 
  
 