# MedSysVE — Memoria Completa del Sistema

> Archivo de referencia inmediata para cualquier desarrollador que necesite entender,
> mantener o extender el sistema sin leer todos los archivos fuente.
> Generado: 2026-06-19 · Basado en implementación completada de 40 fases.

> ⚠️ **DOCUMENTO HISTÓRICO.** Generado el 2026-06-19. Algunas referencias están desactualizadas (paths, comandos, mención de `prisma db push` en lugar de `prisma migrate deploy`, Resend en lugar de Gmail SMTP, etc.). **Para el estado actual del proyecto ver [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)** (regenerado el 2026-06-27 con HEAD `5b65856`, métricas reales y todos los pendientes).
>
> Tratar este archivo como referencia conceptual (qué hace cada parte del sistema) y usar `PROJECT_STATUS.md` + `AGENTS.md` para el estado operacional.

---

## ¿Qué es esto?

MedSysVE es un SaaS EMR (Electronic Medical Record) multi-tenant para el mercado venezolano.
Un doctor registra su consultorio (workspace), gestiona pacientes, consultas SOAP, facturación,
citas, y un portal del paciente. Los datos de cada consultorio están completamente aislados.

**Nombre original del proyecto**: AJMedics → renombrado a MedSysVE en Fase 31.

---

## Stack en una línea

```
Next.js 16.2.9 (App Router + Turbopack) + React 19 + TypeScript strict
Prisma 7.8.0 + PostgreSQL 16 (multi-tenant via workspaceId)
tRPC v11 + Auth.js v5 (JWT) + Redis
shadcn/ui + Tailwind v4 + Recharts
Anthropic Claude API + Resend + Meta Cloud API (WhatsApp) + Cloudflare R2
```

---

## Dónde está cada cosa

### Rutas del usuario final
```
/login                              → Login de doctor/staff
/register                           → Registro de nuevo doctor
/doctor                             → Dashboard principal
/doctor/patients                    → Lista de pacientes
/doctor/patients/[id]               → Perfil completo del paciente
/doctor/patients/[id]/encounters/[encId] → Formulario SOAP de consulta
/doctor/appointments                → Calendario de citas
/doctor/waiting-room                → Sala de espera digital
/doctor/billing                     → Facturación
/doctor/analytics                   → Estadísticas con Recharts
/doctor/quality                     → 12 indicadores de calidad
/doctor/chronics                    → Panel de pacientes crónicos
/doctor/staff                       → Gestión del equipo
/doctor/tasks                       → Tablero de tareas
/doctor/mensajes                    → Mensajes internos
/doctor/referrals                   → Referidos médicos
/doctor/insurance                   → Aseguradoras
/doctor/consent-templates           → Plantillas de consentimiento informado
/doctor/audit                       → Log de auditoría (solo DOCTOR)
/doctor/import                      → Importación masiva CSV
/doctor/workspace                   → Configuración del consultorio
/doctor/teleconsulta/[appointmentId] → Sala de videoconsulta Jitsi
/portal/*                           → Portal del paciente (auth separada)
/clinica/[slug]                     → Página pública por slug
```

### Archivos clave del backend
```
server/routers/_app.ts              → Router raíz, importa todos los sub-routers
server/routers/*.ts                 → 19 sub-routers individuales
server/trpc.ts                      → publicProcedure, protectedProcedure, doctorProcedure, portalProcedure
server/context.ts                   → createContext() → { session, db }
server/caller.ts                    → createServerCaller() para server components
lib/auth.ts                         → NextAuth config (2 providers: doctor/staff + patient)
lib/db.ts                           → PrismaClient singleton
lib/audit.ts                        → logAudit() fire-and-forget
prisma/schema.prisma                → 30+ modelos, todos con workspaceId
proxy.ts                            → Guard de rutas (reemplaza middleware.ts en Next.js 16)
```

### Archivos clave del frontend
```
app/layout.tsx                      → Root layout → <TRPCProvider>
components/providers/trpc-provider.tsx → SessionProvider + TRPCProvider (global)
components/layout/sidebar.tsx       → Sidebar con links filtrados por rol
lib/trpc-client.ts                  → Cliente tRPC para componentes "use client"
types/index.ts                      → SessionUser, UserRole
```

---

## Flujo de autenticación

```
Usuario → /login → Auth.js credentials provider
  ├── Tabla Doctor (email + bcrypt passwordHash)
  └── Tabla Staff  (email + bcrypt pinAccesoHash)

Paciente → /portal/login → Auth.js credentials provider (id: "portal")
  └── Tabla Patient (email + bcrypt portalPasswordHash)

JWT payload: { id, email, nombre, apellido, role, workspaceId, doctorId, patientId? }
Cookie:      authjs.session-token (HTTP-only)

proxy.ts verifica la cookie (optimistic) → sin imports de Auth.js
Server components usan: import { auth } from "@/lib/auth"
Client components usan: import { useSession } from "next-auth/react"
```

---

## Procedimientos tRPC — por tipo

```typescript
publicProcedure     → sin auth         → clinicPublic, availability.getAvailableSlots
protectedProcedure  → cualquier sesión → patient, encounter, appointment, invoice, lab, ...
doctorProcedure     → solo DOCTOR      → audit, consent.createTemplate, staff.create, ...
portalProcedure     → solo PATIENT     → portal.myWorkspaces, appointment.requestFromPortal
```

### Cómo llamar tRPC desde server components
```typescript
const caller = await createServerCaller()
const data = await (caller as any).router.procedure({ ...input })
```

### Cómo llamar tRPC desde client components
```typescript
const { data } = (trpc.router as any).procedure.useQuery()
const { mutate } = (trpc.router as any).procedure.useMutation()
```

El `as any` es necesario por el límite de profundidad de TypeScript con Prisma.

---

## Patrón de multi-tenancy

**Regla absoluta**: todo query Prisma incluye `workspaceId: ctx.session.workspaceId`.

```typescript
// ✅ Siempre así:
await ctx.db.model.findMany({
  where: { workspaceId: ctx.session.workspaceId, ...filters }
})

// ❌ Nunca sin workspaceId — expone datos de otros consultorios
await ctx.db.model.findMany()
```

---

## Patrón de auditoría

```typescript
// fire-and-forget — nunca bloquea, nunca lanza excepción
void logAudit({
  workspaceId: ctx.session.workspaceId,
  accion: "CONSULTA_FIRMADA",
  entidad: "Encounter",
  entidadId: id,
  actorId: ctx.session.doctorId,
  actorNombre: ctx.session.nombre,
  detalle: { extra: "data" }
})
```

---

## Modelos Prisma — referencia rápida

| Modelo | Propósito | Campos clave |
|--------|-----------|-------------|
| `Workspace` | Consultorio | nombre, slug, logoUrl, recordatorioHoras |
| `Doctor` | Médico | email, passwordHash, especialidadPrincipal |
| `DoctorWorkspace` | N:M Doctor↔Workspace | — |
| `Staff` | Personal | rol (SECRETARY/ASSISTANT/NURSE), pinAccesoHash |
| `Patient` | Paciente global | portalPasswordHash, sinCedula |
| `PatientRegistration` | Paciente en workspace | idDisplay (STRING "000001") |
| `Encounter` | Consulta SOAP | estado (BORRADOR/FIRMADA/ANULADA) |
| `Appointment` | Cita | estado, tipo (incluye VIDEOCONSULTA) |
| `Invoice` | Factura | moneda (USD/BS), insuranceProviderId |
| `InsuranceProvider` | Aseguradora | workspaceId, activo |
| `PatientInsurance` | Seguro del paciente | coberturaPct, activa |
| `ConsentTemplate` | Plantilla consentimiento | activo |
| `PatientConsent` | Consentimiento firmado | firmado, pdfUrl |
| `AuditLog` | Log inmutable | accion, entidad, actorId |
| `WaitingEntry` | Sala de espera | turno (int), estado |
| `Notification` | Notificación | tipo (string), leida |
| `Task` | Tarea del equipo | prioridad (ALTA/MEDIA/BAJA) |
| `Referral` | Referido médico | fromDoctorId, toDoctorId |

---

## API REST directa — resumen

```
POST /api/ai/encounter-assist      → Asistente clínico (Claude)
POST /api/ai/dose-suggestion       → Sugerencia de dosis (Claude)
POST /api/ai/drug-interactions     → Interacciones (Claude)
GET  /api/bcv-rate                 → Tipo de cambio BCV
GET  /api/cron/appointment-reminders → CRON recordatorios (Bearer CRON_SECRET)
GET  /api/cron/bcv-update          → CRON actualizar BCV (Bearer CRON_SECRET)
GET  /api/export/patients          → CSV pacientes
GET  /api/export/appointments      → CSV citas
GET  /api/export/invoices          → CSV facturas
POST /api/import/patients          → Importar CSV (máx 500 filas, 5MB)
POST /api/lab-ocr                  → OCR resultados de laboratorio
POST /api/upload/logo              → Logo del consultorio (máx 2MB)
POST /api/upload/membrete          → Membrete (máx 5MB)
POST /api/upload/imaging-result    → Imagen de resultado de imagenología
```

---

## Decisiones técnicas y por qué

### ¿Por qué proxy.ts y no middleware.ts?
Next.js 16 renombró la convención. `middleware.ts` intentaba importar `auth()` de Auth.js
que usa `node:util/types` — no disponible en el edge runtime. `proxy.ts` corre en
Node.js runtime. Solo hacemos verificación optimista de cookie, sin imports pesados.

### ¿Por qué `prisma db push` y no migrations?
Por velocidad de desarrollo. El schema cambia frecuentemente en proyectos en evolución.
Para producción, generar el SQL con `prisma migrate diff` y aplicar manualmente.

### ¿Por qué `(ctx.db as any)` en los routers?
TypeScript tiene un límite de profundidad de instanciación de tipos. Los includes profundos
de Prisma (5+ niveles) causan errores de compilación. `as any` es la solución estándar
documentada por Prisma para este caso.

### ¿Por qué `void logAudit()` y no `await`?
El audit no debe bloquear la respuesta al cliente. Si la inserción de audit falla (DB
temporalmente no disponible), el flujo principal no debe fallar. La función atrapa todas
las excepciones internamente.

### ¿Por qué `PatientRegistration` como tabla pivote?
Un paciente puede visitar múltiples consultorios. Sin la tabla pivote, el paciente
tendría que registrarse N veces con datos duplicados. Con la tabla pivote, el registro
global del paciente es único y cada consultorio tiene su propia "vista" del paciente
con su propio ID correlativo (`idDisplay`).

### ¿Por qué idDisplay es STRING?
Formato "000001" con padding — si fuera INT, perderíamos el formato de 6 dígitos.

---

## Variables de entorno requeridas

```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"  # o dominio en prod
ANTHROPIC_API_KEY="sk-ant-..."        # para IA (opcional pero degrada sin él)
RESEND_API_KEY="re_..."               # emails (opcional)
WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID  # WhatsApp vía Meta Cloud API (opcional)
CLOUDFLARE_R2_*                       # uploads a R2 (sin esto va a public/uploads local)
CRON_SECRET="..."                     # para proteger /api/cron/*
```

---

## Comandos que se usan

```bash
npx next dev --port 3000           # desarrollo con hot reload
npx next build                     # build de producción (debe completar sin errores)
npx tsc --noEmit                   # verificar TypeScript sin compilar
npx prisma generate                # regenerar cliente Prisma tras cambiar schema
npx prisma db push                 # sincronizar schema con la DB (NO migrate)
npx prisma studio                  # GUI de la DB en el navegador
npx tsx prisma/seed-medications.ts # poblar catálogo de medicamentos
```

---

## Bugs conocidos y su solución

| Bug | Causa | Fix |
|-----|-------|-----|
| `Doctor.bio does not exist` | schema desincronizado | `npx prisma db push` |
| `useSession must be wrapped in SessionProvider` | falta `<SessionProvider>` en el árbol | Ya está en `TRPCProvider` global |
| `ERR_TOO_MANY_REDIRECTS` en /portal/login | proxy hacía loop con server component | proxy.ts no redirige páginas de auth del portal |
| `Reserved words used in router: call` | `call` es palabra reservada JS en tRPC | Renombrar a `callPatient` o similar |
| `/portal/schedule` stuck "Cargando..." | query sin `enabled: isPatient` | Agregar `enabled` a `useQuery` |
| `Type instantiation is excessively deep` | include profundo en Prisma | Usar `(ctx.db as any)` |

---

## Cómo extender el sistema

### Agregar un nuevo modelo
1. Editar `prisma/schema.prisma` (siempre incluir `workspaceId`)
2. `npx prisma generate && npx prisma db push`
3. Crear `server/routers/newRouter.ts`
4. Importar en `server/routers/_app.ts`
5. Crear página en `app/(dashboard)/doctor/new-page/`

### Agregar un procedimiento protegido
```typescript
// server/routers/miRouter.ts
import { router, protectedProcedure } from "@/server/trpc"
export const miRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.miModelo.findMany({
      where: { workspaceId: ctx.session.workspaceId }
    })
  })
})
```

### Agregar al sidebar
```typescript
// components/layout/sidebar.tsx → array doctorLinks
{ href: "/doctor/nueva-seccion", label: "Nueva Sección", icon: IconName }
```

---

## Estado del sistema (2026-06-19)

- ✅ Build de producción: `npx next build` — 54 rutas, 0 errores
- ✅ TypeScript: `npx tsc --noEmit` — 0 errores
- ✅ 40 fases implementadas y verificadas
- ✅ 5 bugs encontrados y corregidos en auditoría QA (Playwright)
- ✅ Registro de doctor → funcional
- ✅ Login doctor + staff + paciente → funcional
- ✅ Módulo SOAP completo → funcional
- ✅ Portal del paciente → funcional
- ✅ Facturación con seguros → funcional
- ✅ IA integrada (asistente clínico, dosis, interacciones, OCR) → funcional
- ✅ Recordatorios automáticos (WhatsApp + email) → funcional
- ✅ Auditoría clínica → funcional
- ✅ Indicadores de calidad (12 métricas) → funcional
- ✅ Módulo pediátrico (OMS + PAI Venezuela) → funcional
- ✅ Telemedicina (Jitsi) → funcional
- ✅ Importación masiva CSV → funcional
- ✅ Branding (logo + membrete) → funcional
- ✅ Consentimientos informados → funcional
- ✅ Seguros médicos (HMO) → funcional

---

*MedSysVE · Memoria del sistema · 2026-06-19*
