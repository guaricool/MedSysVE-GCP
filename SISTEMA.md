# SISTEMA.md — MedSysVE: Referencia Completa del Sistema

## ¿Qué es MedSysVE?
SaaS de gestión médica electrónica (EMR) para el mercado venezolano. Sistema multi-tenant donde cada doctor tiene su propio workspace (consultorio).

## Stack Tecnológico
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js App Router | 16.2.9 |
| React | React | 19 |
| TypeScript | TypeScript | 5.x strict |
| ORM | Prisma | 7.8.0 |
| Base de datos | PostgreSQL | 16 |
| Cache | Redis | latest |
| API | tRPC | v11 |
| Auth | Auth.js (next-auth) | v5 |
| UI | shadcn/ui + Tailwind | v4 |
| PDF | @react-pdf/renderer | - |
| Charts | Recharts | - |
| AI | Anthropic Claude | claude-sonnet-4-6 |
| Email | nodemailer + Gmail SMTP | - | (migrado de Resend en 2026-06-25, `e294b90`)
| WhatsApp | Meta Cloud API v20 (graph.facebook.com) | - |

## Rutas del Proyecto
```
C:\Proyectos\MedSysVE\      # Proyecto principal (renombrado desde C:\Projects\AJMedics\ en 2026-06)
```

## Comandos Esenciales
```bash
npx next dev --port 3000     # Servidor de desarrollo
npx next build               # Build de producción
npx tsc --noEmit             # Verificar TypeScript
npx prisma db push           # ⚠️ SOLO dev — sincronizar schema con DB local
npx prisma migrate deploy     # PROD — aplicar migrations (NO db push en prod, ver PROJECT_STATUS.md)
npx prisma generate          # Regenerar cliente Prisma
npx prisma studio            # GUI de la base de datos
```

## Arquitectura del Sistema

### Multi-tenancy
- Cada doctor tiene uno o más `Workspace` (consultorios)
- Todo dato está aislado por `workspaceId`
- TODOS los queries Prisma deben incluir `where: { workspaceId }`

### tRPC
- Endpoint único: `/api/trpc/[trpc]`
- Tipos de procedimiento:
  - `publicProcedure` — sin auth
  - `protectedProcedure` — cualquier sesión válida
  - `doctorProcedure` — rol DOCTOR únicamente
  - `portalProcedure` — rol PATIENT únicamente
- Context: `{ session: SessionUser | null, db: PrismaClient }`
- **Patrón TS depth limit**: usar `(trpc.namespace as any).procedure` en cliente, `(ctx.db as any).model` en servidor

### Auth (Auth.js v5)
- Strategy: JWT (no database sessions)
- Token contiene: `{ id, email, nombre, apellido, role, workspaceId, doctorId, patientId? }`
- Cookie: `authjs.session-token` (HTTP) o `__Secure-authjs.session-token` (HTTPS)
- Import correcto: `import { auth } from "@/lib/auth"` — NO `@/auth`
- Roles: `DOCTOR | SECRETARY | ASSISTANT | NURSE | PATIENT`

### Proxy (Next.js 16)
- Archivo: `proxy.ts` en la raíz (NO middleware.ts — era edge runtime)
- Corre en Node.js runtime
- Usa cookie check optimistic (no verifica JWT, solo existencia)
- Redirige no-autenticados a /login o /portal/login

## Mapa de Módulos y Rutas

| Ruta | Componente/Página | Roles | Descripción |
|------|------------------|-------|-------------|
| `/doctor` | doctor/page.tsx | DOCTOR | Dashboard con stats y pizarrón |
| `/doctor/patients` | patients/page.tsx | DOCTOR, SEC, ASS | Lista de pacientes |
| `/doctor/patients/new` | patients/new/page.tsx | DOCTOR, SEC | Registrar paciente |
| `/doctor/patients/[id]` | patients/[id]/page.tsx | DOCTOR, SEC | Perfil del paciente |
| `/doctor/patients/[id]/encounters/[id]` | encounters/[id]/page.tsx | DOCTOR | Consulta SOAP |
| `/doctor/appointments` | appointments/ | DOCTOR, SEC | Calendario de citas |
| `/doctor/waiting-room` | waiting-room/ | Todos | Sala de espera |
| `/doctor/billing` | billing/ | DOCTOR, SEC | Facturación |
| `/doctor/analytics` | analytics/ | DOCTOR | Estadísticas |
| `/doctor/schedule` | schedule/ | DOCTOR | Horario de atención |
| `/doctor/mensajes` | mensajes/ | DOCTOR, SEC | Mensajes internos |
| `/doctor/chronics` | chronics/ | DOCTOR | Panel de crónicos |
| `/doctor/tasks` | tasks/ | DOCTOR | Tareas del equipo |
| `/doctor/insurance` | insurance/ | DOCTOR | Seguros médicos |
| `/doctor/consent-templates` | consent-templates/ | DOCTOR | Plantillas consentimiento |
| `/doctor/audit` | audit/ | DOCTOR | Auditoría clínica |
| `/doctor/quality` | quality/ | DOCTOR | Indicadores de calidad |
| `/doctor/import` | import/ | DOCTOR, SEC | Importar CSV |
| `/doctor/referrals` | referrals/ | DOCTOR | Referidos médicos |
| `/doctor/staff` | staff/ | DOCTOR | Mi equipo |
| `/doctor/workspace` | workspace/ | DOCTOR | Configuración |
| `/doctor/teleconsulta/[id]` | teleconsulta/ | DOCTOR | Sala de videoconsulta |
| `/portal/*` | portal/ | PATIENT | Portal del paciente |
| `/clinica/[slug]` | clinica/ | público | Página pública clínica |
| `/portal/schedule` | portal/schedule | público | Solicitar cita |

## Routers tRPC Disponibles

| Router | Ubicación | Procedimientos clave |
|--------|-----------|---------------------|
| `patient` | routers/patient.ts | list, get, create, update, addTag, addVaccine, addNote, setPortalAccess |
| `encounter` | routers/encounter.ts | create, get, update, sign, addLabOrder, addImagingOrder |
| `appointment` | routers/appointment.ts | list, get, create, update, requestFromPortal |
| `invoice` | routers/invoice.ts | list, create, update |
| `analytics` | routers/analytics.ts | summary, patientVitals, qualityIndicators |
| `insurance` | routers/insurance.ts | listProviders, createProvider, listPatientInsurances, addPatientInsurance |
| `consent` | routers/consent.ts | listTemplates, createTemplate, listPatientConsents, signConsent |
| `audit` | routers/audit.ts | list (con filtros y paginación) |
| `waitingRoom` | routers/waitingRoom.ts | today, add, callPatient, done |
| `workspace` | routers/workspace.ts | get, updateSettings, updateReminderConfig |
| `doctor` | routers/doctor.ts | register, updateProfile |
| `staff` | routers/staff.ts | list, invite, update |
| `notification` | routers/notification.ts | list, markRead, unreadCount |
| `mensaje` | routers/mensaje.ts | list, send, unreadCount |
| `task` | routers/task.ts | list, create, update, delete |
| `referral` | routers/referral.ts | list, create, update |
| `medication` | routers/medication.ts | search |
| `prescription` | routers/prescription.ts | list, create |
| `lab` | routers/lab.ts | list, addResult |
| `availability` | routers/availability.ts | getAvailableSlots |
| `clinicPublic` | routers/clinicPublic.ts | getBySlug |
| `portal` | (varios) | myWorkspaces, myAppointments, myPrescriptions, etc. |

## API REST Endpoints

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/trpc/[trpc]` | GET/POST | según procedure | Todos los endpoints tRPC |
| `/api/auth/[...nextauth]` | GET/POST | - | Auth.js handlers |
| `/api/ai/encounter-assist` | POST | sesión | IA asistente clínico |
| `/api/ai/dose-suggestion` | POST | sesión | Sugerencia de dosis |
| `/api/ai/drug-interactions` | POST | sesión | Interacciones medicamentosas |
| `/api/bcv-rate` | GET | público | Tipo de cambio BCV actual |
| `/api/cron/appointment-reminders` | POST | CRON_SECRET | Enviar recordatorios |
| `/api/cron/bcv-update` | POST | CRON_SECRET | Actualizar tipo de cambio |
| `/api/export/patients` | GET | DOCTOR/SEC | CSV pacientes |
| `/api/export/appointments` | GET | DOCTOR/SEC | CSV citas |
| `/api/export/invoices` | GET | DOCTOR/SEC | CSV facturas |
| `/api/import/patients` | POST | DOCTOR/SEC | Importar CSV pacientes |
| `/api/lab-ocr` | POST | sesión | OCR resultado laboratorio |
| `/api/upload/logo` | POST | DOCTOR | Subir logo |
| `/api/upload/membrete` | POST | DOCTOR | Subir membrete |
| `/api/upload/imaging-result` | POST | sesión | Subir imagen |

## Modelos Prisma — Referencia Rápida

```
Workspace ─┬─ Doctor (via DoctorWorkspace)
           ├─ Staff
           ├─ PatientRegistration ─── Patient
           ├─ Appointment
           ├─ Encounter
           ├─ Invoice ─── InsuranceProvider
           ├─ WaitingEntry
           ├─ LabResult
           ├─ ImagingOrder
           ├─ Notification
           ├─ Task
           ├─ Mensaje
           ├─ Referral
           ├─ ConsentTemplate ─── PatientConsent
           ├─ AuditLog
           └─ Clinic (slug público)

PatientRegistration ─┬─ Patient
                     ├─ Encounter[]
                     ├─ Appointment[]
                     ├─ Invoice[]
                     ├─ PatientTag[]
                     ├─ PatientVaccine[]
                     ├─ PatientInsurance[]
                     ├─ PatientConsent[]
                     ├─ LabResult[]
                     └─ WaitingEntry[]
```

### Enums Importantes
```prisma
enum UserRole         { DOCTOR SECRETARY ASSISTANT NURSE PATIENT }
enum IdentificationType { CEDULA_V CEDULA_E PASAPORTE }   // NO CEDULA_VENEZOLANA
enum Sexo             { MASCULINO FEMENINO OTRO }
enum AppointmentStatus { REQUESTED SCHEDULED CONFIRMED CANCELLED NO_SHOW COMPLETED }
enum AppointmentType  { CONSULTA SEGUIMIENTO EMERGENCIA PROCEDIMIENTO VIDEOCONSULTA }
enum InvoiceStatus    { PENDIENTE PAGADA CANCELADA VENCIDA }
enum EncounterStatus  { BORRADOR FIRMADA ANULADA }
enum TaskPriority     { ALTA MEDIA BAJA }
enum TaskStatus       { PENDIENTE EN_PROGRESO COMPLETADA }
```

### Campos Críticos
- `PatientTag.etiqueta`: String directo (NO relación a Tag.nombre)
- `PatientRegistration.idDisplay`: String (NO Int) — ej: "000001"
- `Staff.pinAccesoHash`: bcrypt hash del PIN (nunca plaintext)
- `Invoice.items`: Json (array de `{descripcion, cantidad, precioUnitario, moneda}`)
- `Encounter.diagnosticos`: Json (array de `{codigo, descripcion}`)

## Componentes Clave

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `Sidebar` | components/layout/sidebar.tsx | Navegación principal, links por rol |
| `TRPCProvider` | components/providers/trpc-provider.tsx | SessionProvider + tRPC + QueryClient |
| `CommandPalette` | components/search/command-palette.tsx | Búsqueda global ⌘K |
| `NotificationBell` | components/notifications/notification-bell.tsx | Campana de notificaciones |
| `WorkspaceSwitcher` | components/workspace/workspace-switcher.tsx | Cambiar consultorio activo |
| `AppointmentsClient` | components/appointments/appointments-client.tsx | Calendario semanal + agenda |
| `BillingClient` | components/billing/billing-client.tsx | Facturación con seguro |
| `GrowthChart` | components/patients/growth-chart.tsx | Gráfica crecimiento OMS |
| `PediatricPanel` | components/patients/pediatric-panel.tsx | Panel pediátrico (auto-oculta ≥18 años) |
| `InsuranceManager` | components/insurance/insurance-manager.tsx | Seguros en perfil paciente |
| `ConsentManager` | components/consent/consent-manager.tsx | Consentimientos en perfil paciente |

## Patrones y Convenciones

### Manejo de errores
```typescript
// Fire-and-forget (audit, notificaciones no críticas)
void logAudit({ workspaceId, accion, entidad, ... })

// tRPC errors
throw new TRPCError({ code: "NOT_FOUND" })
throw new TRPCError({ code: "UNAUTHORIZED" })
throw new TRPCError({ code: "BAD_REQUEST", message: "..." })
```

### Server components con datos tRPC
```typescript
// Usar createServerCaller, nunca fetch directo
const caller = await createServerCaller()
const data = await (caller as any).router.procedure({ input })
```

### Exports CSV (Excel compatible)
```typescript
// UTF-8 BOM prefix para Excel
const BOM = "﻿"
return new Response(BOM + csvContent, {
  headers: { "Content-Type": "text/csv;charset=utf-8" },
})
```

### Nombres de archivos
- camelCase para componentes y páginas
- kebab-case para utilidades y routers
- Imports relativos preferidos (`../../lib/auth`) excepto aliases `@/`

## Variables de Entorno Requeridas

```bash
# Core
DATABASE_URL=postgresql://ajmedics:password@localhost:5432/ajmedics
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=<32 bytes base64>
NEXTAUTH_URL=http://localhost:3000

# Servicios externos (opcionales para desarrollo)
ANTHROPIC_API_KEY=           # IA asistente clínico
WHATSAPP_TOKEN=              # Meta Cloud API: token de acceso (Business Manager)
WHATSAPP_PHONE_NUMBER_ID=    # ID del número emisor registrado en Meta
RESEND_API_KEY=              # Email recordatorios
CRON_SECRET=                 # Protección endpoints cron

# Storage (Cloudflare R2)
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=ajmedics
CLOUDFLARE_R2_ENDPOINT=
```

## Bugs Conocidos y Workarounds

| Bug | Causa | Solución |
|-----|-------|---------|
| "column X does not exist" (dev) | Schema no sincronizado con DB | `npx prisma db push` (solo local) |
| "column X does not exist" (prod) | Migration no aplicada | `docker exec -it <container> npx prisma migrate deploy` |
| "Type instantiation is excessively deep" | Prisma includes profundos + tRPC | Cast `as any` en ambos lados |
| "useSession must be wrapped in SessionProvider" | Componente client fuera del provider | SessionProvider está en TRPCProvider (global) |
| tRPC palabra reservada (`call`, `delete`…) | Nombre de procedimiento inválido | Renombrar (ej: `callPatient`) |
| ERR_TOO_MANY_REDIRECTS en portal | Loop proxy ↔ server component | No rebotar portal auth pages en proxy.ts |
| portal/schedule bloqueada en "Cargando…" | Query auth sin verificar rol | `enabled: isPatient` en useQuery |

## Fases Implementadas

| Fase | Módulo | Estado |
|------|--------|--------|
| 1–5 | Auth, registro, workspace, staff | ✅ |
| 6–10 | Pacientes CRUD, SOAP, recetas, lab, facturación | ✅ |
| 11–15 | Citas, sala de espera, horario, analytics, portal paciente | ✅ |
| 16–20 | PDF reports, búsqueda, notificaciones, tareas, mensajes | ✅ |
| 21–25 | Crónicos, referidos, imagenología, reposo, plantillas IA | ✅ |
| 26–31 | WhatsApp, BCV rate, audit, búsqueda global ⌘K, rebranding MedSysVE | ✅ |
| 32 | Seguros Médicos (HMO) | ✅ |
| 33 | Consentimientos Informados | ✅ |
| 34 | Auditoría Clínica (AuditLog + logAudit) | ✅ |
| 35 | Telemedicina (Jitsi + checklist) | ✅ |
| 36 | Módulo Pediátrico (OMS + PAI Venezuela) | ✅ |
| 37 | Config Recordatorios por workspace | ✅ |
| 38 | Branding — logo y membrete | ✅ |
| 39 | Importación masiva CSV pacientes | ✅ |
| 40 | Indicadores de Calidad (12 métricas) | ✅ |
| 41 | Suscripciones y Pagos (Stripe), Extra Seats (Clínicas) | ✅ |

## Dónde Ir Para Cada Cambio

| Quiero… | Archivo(s) a modificar |
|---------|----------------------|
| Agregar campo a paciente | `prisma/schema.prisma` → `db push` → `server/routers/patient.ts` → componente |
| Nuevo tipo de cita | `prisma/schema.prisma` (enum AppointmentType) → `db push` → `appointments-client.tsx` |
| Nueva ruta del doctor | `app/(dashboard)/doctor/nueva-ruta/page.tsx` + `components/layout/sidebar.tsx` |
| Nuevo procedimiento tRPC | `server/routers/[router].ts` → `server/routers/_app.ts` (registrar) |
| Nueva página del portal | `app/portal/nueva/page.tsx` + `app/portal/layout.tsx` (agregar al NAV) |
| Cambiar lógica de auth | `lib/auth.ts` |
| Cambiar protección de rutas | `proxy.ts` |
| Nuevo modelo Prisma | `prisma/schema.prisma` → `npx prisma migrate dev --name X` → `npx prisma generate` (dev) / `npx prisma migrate deploy` (prod) |
| Nuevo endpoint REST | `app/api/ruta/route.ts` |
| Cambiar recordatorios | `app/api/cron/appointment-reminders/route.ts` |
| Agregar campo al workspace | `prisma/schema.prisma` → `server/routers/workspace.ts` → `workspace-settings-client.tsx` |
