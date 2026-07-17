# MedSysVE — Documentación Técnica Completa

> Sistema de Gestión de Expediente Médico Electrónico (EMR) SaaS para el mercado venezolano.
> Versión: 1.0 · Fecha: 2026-06-19 · Estado: Producción

> ⚠️ **DOCUMENTO HISTÓRICO.** Generado el 2026-06-19. Algunas referencias están desactualizadas (paths `C:\Projects\AJMedics\`, mención de `prisma db push` en lugar de `prisma migrate deploy` para prod, Resend en lugar de Gmail SMTP, etc.). **Para el estado actual del proyecto ver [`PROJECT_STATUS.md`](../../PROJECT_STATUS.md)** (regenerado el 2026-06-27 con HEAD `5b65856`, métricas reales y todos los pendientes).
>
> Tratar este archivo como referencia arquitectónica (cómo está estructurado el sistema) y usar `PROJECT_STATUS.md` + `AGENTS.md` para el estado operacional y comandos exactos.

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Base de Datos — Modelos Prisma](#4-base-de-datos--modelos-prisma)
5. [Autenticación y Autorización](#5-autenticación-y-autorización)
6. [API tRPC — Routers y Procedimientos](#6-api-trpc--routers-y-procedimientos)
7. [API REST — Endpoints Directos](#7-api-rest--endpoints-directos)
8. [Componentes y UI](#8-componentes-y-ui)
9. [Fases de Implementación (1–40)](#9-fases-de-implementación-140)
10. [Patrones de Código Críticos](#10-patrones-de-código-críticos)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Comandos de Desarrollo](#12-comandos-de-desarrollo)
13. [Bugs Conocidos y Soluciones](#13-bugs-conocidos-y-soluciones)
14. [Guía para Extender el Sistema](#14-guía-para-extender-el-sistema)

---

## 1. Visión General

MedSysVE es un SaaS multi-tenant de gestión médica diseñado específicamente para Venezuela. Cada doctor tiene su propio **workspace** (consultorio) con datos completamente aislados. Los pacientes pueden pertenecer a múltiples consultorios simultáneamente a través de la tabla pivote `PatientRegistration`.

### Actores del sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `DOCTOR` | Propietario del workspace | Acceso total |
| `SECRETARY` | Staff administrativo | Pacientes, citas, facturación |
| `ASSISTANT` | Asistente médico | Sala de espera, pacientes |
| `NURSE` | Enfermero | Sala de espera, pacientes, citas |
| `PATIENT` | Paciente registrado | Portal del paciente únicamente |

### Características clave

- **Multi-tenant**: `workspaceId` en cada query — datos completamente aislados por consultorio
- **Bilingüe de datos**: soporte USD y Bolívares con tipo de cambio BCV en tiempo real
- **IA integrada**: Claude API para asistencia clínica, sugerencia de dosis, interacciones medicamentosas, OCR de laboratorio
- **Portal del paciente**: acceso independiente con credenciales propias
- **Página pública** por slug: `/clinica/[slug]` para cada consultorio

---

## 2. Stack Tecnológico

### Runtime y Framework

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 22 |
| OS | Windows 11 | — |
| Framework | Next.js | 16.2.9 |
| Bundler | Turbopack | (incluido en Next.js 16) |
| React | React | 19 |
| TypeScript | TypeScript | 5.x strict |

### Backend y Base de Datos

| Capa | Tecnología | Versión |
|------|-----------|---------|
| ORM | Prisma | 7.8.0 |
| Base de datos | PostgreSQL | 16 |
| Cache / Queue | Redis | — |
| API interna | tRPC | v11 |
| Autenticación | Auth.js (next-auth) | v5 |

### Frontend

| Capa | Tecnología | Notas |
|------|-----------|-------|
| UI Components | shadcn/ui | Basado en Radix UI |
| Estilos | Tailwind CSS | v4 |
| Gráficas | Recharts | — |
| PDF | @react-pdf/renderer | — |
| Calendario | react-day-picker | — |
| Fechas | date-fns | — |

### Servicios Externos

| Servicio | Uso | Variables de entorno |
|---------|-----|---------------------|
| Anthropic Claude | IA clínica, OCR | `ANTHROPIC_API_KEY` |
| Resend | Emails transaccionales | `RESEND_API_KEY` |
| Twilio | WhatsApp recordatorios | `TWILIO_*` |
| Cloudflare R2 | Almacenamiento de archivos | `CLOUDFLARE_R2_*` |
| BCV | Tipo de cambio USD/Bs | — (scraping) |

---

## 3. Estructura del Proyecto

```
C:\Projects\AJMedics\
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — TRPCProvider + SessionProvider
│   ├── globals.css                   # Estilos globales Tailwind v4
│   │
│   ├── (dashboard)/                  # Grupo de rutas autenticadas
│   │   ├── layout.tsx                # SERVER COMPONENT — verifica sesión, carga workspace
│   │   ├── doctor/
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   ├── analytics/page.tsx    # Estadísticas con Recharts
│   │   │   ├── appointments/page.tsx # Calendario semanal + agenda 30 días
│   │   │   ├── audit/page.tsx        # Log de auditoría (solo DOCTOR)
│   │   │   ├── billing/page.tsx      # Facturación
│   │   │   ├── chronics/page.tsx     # Panel de pacientes crónicos
│   │   │   ├── consent-templates/    # Plantillas de consentimiento informado
│   │   │   ├── import/page.tsx       # Importación masiva CSV
│   │   │   ├── insurance/page.tsx    # Gestión de aseguradoras
│   │   │   ├── mensajes/page.tsx     # Mensajes internos del equipo
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx          # Lista con búsqueda y filtros
│   │   │   │   ├── new/page.tsx      # Registro de nuevo paciente
│   │   │   │   └── [patientRegId]/
│   │   │   │       ├── page.tsx      # Perfil completo del paciente (server)
│   │   │   │       └── encounters/
│   │   │   │           └── [encounterId]/page.tsx  # Consulta SOAP completa
│   │   │   ├── quality/page.tsx      # Indicadores de calidad (12 métricas)
│   │   │   ├── referrals/page.tsx    # Referidos médicos
│   │   │   ├── schedule/page.tsx     # Horario y disponibilidad
│   │   │   ├── staff/                # Gestión del equipo
│   │   │   ├── tasks/page.tsx        # Tablero de tareas
│   │   │   ├── teleconsulta/[appointmentId]/  # Sala de videoconsulta (Jitsi)
│   │   │   ├── waiting-room/page.tsx # Sala de espera digital
│   │   │   └── workspace/page.tsx    # Configuración del consultorio
│   │   ├── assistant/page.tsx        # Dashboard para ASSISTANT
│   │   ├── nurse/page.tsx            # Dashboard para NURSE
│   │   └── secretary/page.tsx        # Dashboard para SECRETARY
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Auth.js handlers (GET + POST)
│   │   ├── trpc/[trpc]/route.ts          # tRPC handler centralizado
│   │   ├── ai/
│   │   │   ├── encounter-assist/route.ts  # Asistente clínico IA
│   │   │   ├── dose-suggestion/route.ts   # Sugerencia de dosis
│   │   │   └── drug-interactions/route.ts # Interacciones medicamentosas
│   │   ├── bcv-rate/route.ts              # Tipo de cambio BCV
│   │   ├── cron/
│   │   │   ├── appointment-reminders/route.ts  # Recordatorios automáticos
│   │   │   └── bcv-update/route.ts             # Actualización tipo de cambio
│   │   ├── export/
│   │   │   ├── appointments/route.ts  # CSV de citas
│   │   │   ├── invoices/route.ts      # CSV de facturas
│   │   │   └── patients/route.ts      # CSV de pacientes
│   │   ├── import/patients/route.ts   # Importación masiva CSV
│   │   ├── lab-ocr/route.ts           # OCR de resultados de laboratorio
│   │   └── upload/
│   │       ├── imaging-result/route.ts  # Subir imágenes de resultados
│   │       ├── logo/route.ts            # Subir logo del consultorio
│   │       └── membrete/route.ts        # Subir membrete del consultorio
│   │
│   ├── clinica/[slug]/page.tsx        # Página pública por slug
│   │
│   ├── portal/                        # Portal del Paciente
│   │   ├── layout.tsx                 # Layout del portal (nav del paciente)
│   │   ├── page.tsx                   # Inicio del portal
│   │   ├── login/page.tsx             # Login del paciente
│   │   ├── schedule/page.tsx          # Solicitar cita (público)
│   │   ├── prescriptions/page.tsx     # Ver recetas médicas
│   │   ├── lab-results/page.tsx       # Resultados de laboratorio
│   │   ├── examenes/page.tsx          # Órdenes de exámenes
│   │   ├── vacunas/page.tsx           # Historial de vacunas
│   │   ├── mensajes/page.tsx          # Mensajes con el médico
│   │   └── perfil/page.tsx            # Perfil del paciente
│   │
│   ├── login/page.tsx                 # Login de doctores y staff
│   └── register/page.tsx              # Registro de nuevo doctor
│
├── components/
│   ├── analytics/analytics-client.tsx     # Gráficas Recharts
│   ├── appointments/appointments-client.tsx # Calendario semanal + agenda
│   ├── billing/billing-client.tsx          # Módulo de facturación
│   ├── consent/consent-manager.tsx         # Widget consentimientos por paciente
│   ├── insurance/insurance-manager.tsx     # Widget seguros por paciente
│   ├── layout/
│   │   ├── sidebar.tsx                     # Sidebar con links según rol
│   │   └── ...
│   ├── notifications/notification-bell.tsx # Campana de notificaciones
│   ├── patients/
│   │   ├── growth-chart.tsx               # Gráfica de crecimiento OMS (pediátrico)
│   │   └── pediatric-panel.tsx            # Panel pediátrico (auto-oculta en adultos)
│   ├── portal/                            # Componentes del portal del paciente
│   ├── providers/
│   │   └── trpc-provider.tsx              # SessionProvider + TRPCProvider (global)
│   ├── search/command-palette.tsx         # Búsqueda global ⌘K
│   ├── waiting-room/waiting-room-client.tsx
│   └── workspace/
│       ├── branding-upload.tsx             # Upload de logo y membrete
│       ├── reminder-config-client.tsx      # Config recordatorios por workspace
│       └── workspace-switcher.tsx          # Cambio de workspace (multi-workspace)
│
├── server/
│   ├── caller.ts                  # createServerCaller() para server components
│   ├── context.ts                 # Contexto tRPC: { session, db }
│   ├── trpc.ts                    # Definición de procedimientos base
│   └── routers/
│       ├── _app.ts                # Router raíz — importa todos los sub-routers
│       ├── analytics.ts           # Estadísticas y métricas de calidad
│       ├── appointment.ts         # Gestión de citas
│       ├── audit.ts               # Log de auditoría
│       ├── availability.ts        # Disponibilidad de horarios
│       ├── clinicPublic.ts        # Datos públicos de la clínica
│       ├── consent.ts             # Consentimientos informados
│       ├── doctor.ts              # Registro y perfil del doctor
│       ├── encounter.ts           # Consultas SOAP
│       ├── insurance.ts           # Aseguradoras y seguros de pacientes
│       ├── invoice.ts             # Facturación
│       ├── lab.ts                 # Órdenes y resultados de laboratorio
│       ├── medication.ts          # Catálogo de medicamentos
│       ├── mensaje.ts             # Mensajes internos
│       ├── notification.ts        # Notificaciones del sistema
│       ├── patient.ts             # CRUD de pacientes
│       ├── prescription.ts        # Recetas médicas
│       ├── referral.ts            # Referidos médicos
│       ├── staff.ts               # Gestión del equipo
│       ├── task.ts                # Tareas del equipo
│       ├── waitingRoom.ts         # Sala de espera
│       └── workspace.ts           # Configuración del consultorio
│
├── lib/
│   ├── audit.ts          # logAudit() — función fire-and-forget
│   ├── auth.ts           # Auth.js v5 — configuración completa
│   ├── db.ts             # PrismaClient singleton (evita conexiones múltiples en dev)
│   ├── trpc-client.ts    # Cliente tRPC para componentes client
│   └── utils.ts          # cn() y otras utilidades
│
├── types/
│   └── index.ts          # SessionUser, UserRole, y tipos compartidos
│
├── prisma/
│   ├── schema.prisma       # 30+ modelos con relaciones
│   ├── prisma.config.ts    # Config de Prisma 7
│   └── seed-medications.ts # Seed del catálogo de medicamentos
│
├── proxy.ts              # Guard de rutas Next.js 16 (reemplaza middleware.ts)
├── next.config.ts        # Config de Next.js
├── tsconfig.json         # TypeScript strict mode
├── tailwind.config.ts    # Tailwind v4
└── .env.local            # Variables de entorno (NO subir al repo)
```

---

## 4. Base de Datos — Modelos Prisma

La base de datos es PostgreSQL. El ORM es Prisma 7. **No se usan migrations** — los cambios se aplican con `npx prisma db push`.

### Multi-tenancy

El aislamiento de datos se logra mediante `workspaceId` en **cada modelo**. Todo query debe filtrar por `workspaceId: ctx.session.workspaceId`.

### Diagrama de Relaciones Principales

```
Doctor ─────── DoctorWorkspace ─── Workspace
                                       │
                          ┌────────────┤
                          │            │
                     PatientRegistration   Staff
                          │
              ┌───────────┼───────────────────────┐
              │           │                       │
          Encounter   Appointment             Invoice
              │
    ┌─────────┼──────────┐
    │         │          │
 LabOrder  Referral  PatientConsent
```

### Modelos

#### `Workspace`
Centro del sistema. Cada doctor (o grupo de doctores) tiene uno.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `nombre` | String | Nombre del consultorio |
| `descripcion` | String? | Descripción pública |
| `direccion` | String? | Dirección física |
| `telefono` | String? | Teléfono de contacto |
| `email` | String? | Email del consultorio |
| `rif` | String? | RIF venezolano |
| `sitioweb` | String? | URL del sitio web |
| `slug` | String (unique) | Para URL pública /clinica/[slug] |
| `logoUrl` | String? | Ruta al logo subido |
| `membreteUrl` | String? | Ruta al membrete subido |
| `recordatorioHoras` | Int | Horas antes de cita para recordatorio (default: 24) |
| `recordatorioWa` | Boolean | Enviar recordatorio por WhatsApp |
| `recordatorioEmail` | Boolean | Enviar recordatorio por email |
| `doctorId` | String | FK al doctor principal |

#### `Doctor`
Usuario tipo DOCTOR. Puede pertenecer a múltiples workspaces.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `nombre` | String | Primer nombre |
| `apellido` | String | Apellido |
| `cedula` | String | Cédula venezolana |
| `email` | String (unique) | Email de login |
| `passwordHash` | String | Hash bcrypt de la contraseña |
| `bio` | String? (Text) | Biografía profesional |
| `especialidadPrincipal` | String? | Especialidad médica |
| `telefono` | String? | Teléfono personal |

Relación con Workspace: many-to-many via `DoctorWorkspace`.

#### `Staff`
Empleados del consultorio (secretaria, asistente, enfermero).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `nombre` | String | Nombre |
| `apellido` | String | Apellido |
| `email` | String | Email (único globalmente) |
| `rol` | Enum | SECRETARY, ASSISTANT, NURSE |
| `activo` | Boolean | Si puede iniciar sesión |
| `pinAccesoHash` | String? | Hash bcrypt del PIN (usada como contraseña) |
| `workspaceId` | String | FK al workspace |

**Importante**: El PIN se almacena como hash bcrypt en `pinAccesoHash`. En el login se usa como contraseña el PIN numérico.

#### `Patient`
Entidad global de paciente — existe independientemente del consultorio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `nombre` | String | Nombre |
| `apellido` | String | Apellido |
| `fechaNacimiento` | DateTime | Fecha de nacimiento |
| `sexo` | Enum | MASCULINO, FEMENINO, OTRO |
| `numeroIdentificacion` | String? | Número de cédula o pasaporte |
| `tipoIdentificacion` | Enum? | CEDULA_V, CEDULA_E, PASAPORTE |
| `sinCedula` | Boolean | True para menores sin cédula |
| `telefono` | String? | Teléfono |
| `email` | String? | Email |
| `portalPasswordHash` | String? | Hash bcrypt para acceso al portal |

#### `PatientRegistration`
**Tabla pivote** entre Patient y Workspace. Habilita multi-tenancy a nivel de paciente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK al workspace |
| `patientId` | String | FK al paciente global |
| `idDisplay` | String | ID visible (ej: "000001") — correlativo por workspace |

Un mismo paciente puede tener registros en múltiples workspaces con IDs distintos.

#### `Encounter` (Consulta)
Representa una consulta médica. Sigue el formato SOAP.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `patientRegistrationId` | String | FK registro del paciente |
| `doctorId` | String | FK doctor que atiende |
| `appointmentId` | String? | FK cita relacionada (opcional) |
| `motivo` | String? | S — Motivo de consulta |
| `anamnesis` | String? (Text) | S — Anamnesis detallada |
| `plan` | String? (Text) | P — Plan de tratamiento |
| `diagnosticos` | Json | A — Array [{codigo, descripcion}] (CIE-10) |
| `taSistolica` | Int? | O — TA sistólica (mmHg) |
| `taDiastolica` | Int? | O — TA diastólica (mmHg) |
| `fc` | Int? | O — Frecuencia cardíaca (lpm) |
| `fr` | Int? | O — Frecuencia respiratoria (rpm) |
| `temperatura` | Decimal? | O — Temperatura (°C) |
| `peso` | Decimal? | O — Peso (kg) |
| `talla` | Decimal? | O — Talla (cm) |
| `spo2` | Decimal? | O — Saturación O2 (%) |
| `glasgow` | Int? | O — Escala Glasgow (pts) |
| `estado` | Enum | BORRADOR, FIRMADA, ANULADA |
| `firmadoAt` | DateTime? | Timestamp de firma |
| `informeMedico` | String? (Text) | Informe médico redactado |
| `reposoData` | Json? | Datos del reposo médico |

#### `Invoice` (Factura)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `numero` | Int (autoincrement) | Número de factura correlativo |
| `workspaceId` | String | FK workspace |
| `patientRegistrationId` | String | FK registro paciente |
| `encounterId` | String? | FK consulta relacionada |
| `estado` | Enum | PENDIENTE, PAGADA, CANCELADA, VENCIDA |
| `items` | Json | Array [{descripcion, cantidad, precioUnitario, moneda}] |
| `montoTotal` | Decimal | Total calculado |
| `moneda` | Enum | USD, BS |
| `tipoCambio` | Decimal? | Tasa BCV al momento de emisión |
| `insuranceProviderId` | String? | FK aseguradora (si aplica) |
| `montoSeguro` | Decimal? | Monto cubierto por el seguro |

#### `Appointment` (Cita)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `patientRegistrationId` | String? | FK registro (null para bloques) |
| `doctorId` | String | FK doctor |
| `fechaHora` | DateTime | Fecha y hora de la cita |
| `duracionMinutos` | Int | Duración en minutos |
| `tipo` | Enum | CONSULTA, SEGUIMIENTO, EMERGENCIA, PROCEDIMIENTO, VIDEOCONSULTA |
| `estado` | Enum | REQUESTED, SCHEDULED, CONFIRMED, CANCELLED, NO_SHOW, COMPLETED |
| `titulo` | String? | Título del bloque (si no tiene paciente) |
| `notas` | String? | Notas internas |
| `motivoPortal` | String? | Motivo ingresado desde el portal del paciente |

#### `InsuranceProvider` (Aseguradora)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `nombre` | String | Nombre de la aseguradora |
| `codigo` | String? | Código interno |
| `telefono` | String? | Teléfono de la aseguradora |
| `email` | String? | Email de contacto |
| `activo` | Boolean | Si está activa |

#### `PatientInsurance` (Seguro del Paciente)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `patientRegistrationId` | String | FK registro paciente |
| `providerId` | String | FK aseguradora |
| `numeroPóliza` | String | Número de póliza |
| `titular` | String? | Nombre del titular |
| `coberturaPct` | Decimal | Porcentaje de cobertura (0-100) |
| `fechaVigencia` | DateTime? | Fecha de vencimiento |
| `activa` | Boolean | Si el seguro está vigente |
| `notas` | String? | Observaciones |

#### `ConsentTemplate` (Plantilla de Consentimiento)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `titulo` | String | Título del consentimiento |
| `contenido` | String (Text) | Texto del consentimiento |
| `activo` | Boolean | Si está disponible |

#### `PatientConsent` (Consentimiento Firmado)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `patientRegistrationId` | String | FK registro paciente |
| `templateId` | String | FK plantilla |
| `encounterId` | String? | FK consulta relacionada |
| `firmado` | Boolean | Si fue firmado |
| `firmadoAt` | DateTime? | Cuándo fue firmado |
| `firmaData` | String? (Text) | Datos de la firma digital |
| `pdfUrl` | String? | URL del PDF generado |
| `notas` | String? | Observaciones |

#### `AuditLog`
Registro inmutable de acciones críticas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `accion` | String | Ej: "CONSULTA_FIRMADA", "PACIENTE_CREADO" |
| `entidad` | String | Nombre del modelo afectado |
| `entidadId` | String? | ID del registro afectado |
| `actorId` | String? | ID del usuario que hizo la acción |
| `actorNombre` | String? | Nombre legible del actor |
| `detalle` | Json? | Datos adicionales de contexto |
| `ip` | String? | IP del cliente |
| `createdAt` | DateTime | Timestamp automático |

Índices: `[workspaceId, createdAt]`, `[entidad, entidadId]`, `[actorId]`

#### `WaitingEntry` (Sala de Espera)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `patientRegistrationId` | String | FK registro paciente |
| `appointmentId` | String? | FK cita relacionada |
| `turno` | Int | Número de turno del día |
| `estado` | Enum | ESPERANDO, ATENDIENDO, COMPLETADO, CANCELADO |
| `notas` | String? | Notas de admisión |
| `llamadoAt` | DateTime? | Cuándo fue llamado al consultorio |

#### `Notification`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `recipientId` | String | ID del destinatario |
| `tipo` | String | APPOINTMENT_REQUEST, PORTAL_MESSAGE, REFERRAL, IMAGING_RESULT, SYSTEM |
| `titulo` | String | Título |
| `mensaje` | String | Contenido |
| `leida` | Boolean | Si fue leída |
| `data` | Json? | Datos de contexto (ej: ID de la cita relacionada) |

#### `Task`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `titulo` | String | Título de la tarea |
| `descripcion` | String? | Descripción detallada |
| `prioridad` | Enum | ALTA, MEDIA, BAJA |
| `estado` | Enum | PENDIENTE, EN_PROGRESO, COMPLETADA |
| `assignedToId` | String? | ID del staff asignado |
| `dueDate` | DateTime? | Fecha límite |

#### `Referral` (Referido Médico)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | PK |
| `workspaceId` | String | FK workspace |
| `fromDoctorId` | String | Doctor que refiere |
| `toDoctorId` | String | Doctor receptor |
| `patientRegistrationId` | String | FK registro paciente |
| `encounterId` | String? | FK consulta de origen |
| `motivo` | String | Motivo del referido |
| `notas` | String? | Observaciones |
| `estado` | String | PENDIENTE, ACEPTADO, RECHAZADO, COMPLETADO |

---

## 5. Autenticación y Autorización

### Configuración Auth.js v5

Archivo: `lib/auth.ts`

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Provider 1: Doctor + Staff
    Credentials({
      async authorize(raw) {
        // 1. Busca en tabla Doctor por email
        // 2. Si no existe, busca en tabla Staff con activo: true
        // 3. Verifica password con bcrypt.compare()
        // 4. Retorna SessionUser o null
      }
    }),
    // Provider 2: Portal del Paciente
    Credentials({
      id: "portal",
      async authorize(raw) {
        // Busca en tabla Patient por email
        // Verifica portalPasswordHash con bcrypt.compare()
      }
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // Copia campos del user al JWT token en el login inicial
      if (user) {
        token.role = u.role
        token.workspaceId = u.workspaceId
        token.doctorId = u.doctorId
        // ...
      }
      return token
    },
    session({ session, token }) {
      session.user = token  // El token JWT se expone como session.user
      return session
    }
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" }
})
```

### Tipo SessionUser

```typescript
// types/index.ts
interface SessionUser {
  id: string
  email: string
  nombre: string
  apellido: string
  role: "DOCTOR" | "SECRETARY" | "ASSISTANT" | "NURSE" | "PATIENT"
  workspaceId: string    // siempre presente
  doctorId: string       // para doctores; para staff es el doctorId del workspace
  patientId?: string     // solo para PATIENT
}
```

### Proxy (proxy.ts) — Guard de Rutas

**Importante**: En Next.js 16, el archivo `middleware.ts` fue renombrado a `proxy.ts`. El proxy corre en **Node.js runtime** (no edge), lo que permite usar módulos nativos de Node.

```typescript
// proxy.ts — lógica simplificada
export default function proxy(req: NextRequest) {
  const token = req.cookies.get("authjs.session-token")?.value
  const isLoggedIn = !!token

  if (!isLoggedIn) {
    // Rutas del portal → /portal/login
    // Resto → /login
    return NextResponse.redirect(...)
  }

  // Usuarios logueados en /login → /doctor
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/doctor", req.url))
  }
  // Portal auth pages: pasa al server component (evita redirect loops)
}
```

**¿Por qué no usar auth() en el proxy?**
`auth()` importa módulos de Node.js que no funcionan en edge runtime. El proxy usa solo verificación optimista de cookie (existe la cookie = probablemente autenticado). La verificación real ocurre en los server components.

### Procedimientos tRPC

Definidos en `server/trpc.ts`:

```typescript
// Sin autenticación
export const publicProcedure = t.procedure

// Cualquier usuario autenticado
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" })
  return next({ ctx: { session: ctx.session } })
})

// Solo DOCTOR
export const doctorProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || ctx.session.role !== "DOCTOR")
    throw new TRPCError({ code: "FORBIDDEN" })
  return next()
})

// Solo PATIENT (portal)
export const portalProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || ctx.session.role !== "PATIENT")
    throw new TRPCError({ code: "UNAUTHORIZED" })
  return next()
})
```

---

## 6. API tRPC — Routers y Procedimientos

El cliente tRPC está en `lib/trpc-client.ts`. El router raíz en `server/routers/_app.ts`.

### Contexto tRPC

```typescript
// server/context.ts
export async function createContext() {
  const session = await auth()
  return {
    session: session?.user as SessionUser | null,
    db,  // PrismaClient singleton
  }
}
```

### Router: `patient`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `list` | query | protected | Lista pacientes con búsqueda (nombre/cédula/ID) y filtros (sexo, etiqueta) |
| `get` | query | protected | Perfil completo con todas las relaciones |
| `create` | mutation | protected | Crea Patient + PatientRegistration |
| `update` | mutation | protected | Actualiza datos del paciente |
| `addTag` | mutation | protected | Añade etiqueta al paciente |
| `removeTag` | mutation | protected | Elimina etiqueta |
| `addAllergy` | mutation | protected | Añade alergia |
| `removeAllergy` | mutation | protected | Elimina alergia |
| `addVaccine` | mutation | protected | Registra vacuna |
| `addNote` | mutation | protected | Añade nota interna |
| `setPortalAccess` | mutation | doctor | Establece credenciales del portal |
| `updateAntecedentes` | mutation | protected | Actualiza antecedentes médicos |

### Router: `encounter`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `create` | mutation | protected | Crea encuentro en BORRADOR |
| `get` | query | protected | Obtiene encuentro con todas las relaciones |
| `update` | mutation | protected | Actualiza campos SOAP (motivo, anamnesis, plan, vitales, diagnósticos, informe) |
| `sign` | mutation | doctor | Cambia estado a FIRMADA + dispara logAudit |
| `addLabOrder` | mutation | protected | Añade orden de laboratorio |
| `addImagingOrder` | mutation | protected | Añade orden de imagenología |
| `addReferral` | mutation | protected | Crea referido desde la consulta |
| `getLabOrders` | query | protected | Lista órdenes de lab del encuentro |

### Router: `appointment`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `list` | query | protected | Citas en rango fecha (from, to) |
| `get` | query | protected | Una cita por ID |
| `create` | mutation | protected | Crea cita |
| `update` | mutation | protected | Actualiza estado, fecha, notas |
| `requestFromPortal` | mutation | portal | Paciente solicita cita (estado: REQUESTED) |
| `getAvailableSlots` | query | public | Slots disponibles para fecha dada |

### Router: `invoice`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `list` | query | protected | Lista facturas con filtros |
| `create` | mutation | protected | Crea factura con items JSON + seguro opcional |
| `update` | mutation | protected | Cambia estado de pago |

### Router: `analytics`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `summary` | query | protected | Stats últimos 30 días (pacientes, consultas, ingresos) |
| `patientVitals` | query | protected | Peso/talla histórico de un paciente (para gráfica de crecimiento) |
| `qualityIndicators` | query | doctor | 12 métricas de calidad — ejecuta 12 queries en paralelo con Promise.all |

Las 12 métricas de `qualityIndicators`:
1. `totalPatients` — Total de pacientes registrados
2. `totalEncounters` — Total de consultas en 30 días
3. `signRate` — % de consultas firmadas vs creadas
4. `completionRate` — % de citas completadas
5. `noShowRate` — % de inasistencias
6. `chronicPatients` — Pacientes con etiquetas crónicas (HTA, DM2, etc.)
7. `chronicFollowUp` — % de crónicos con consulta en últimos 90 días
8. `pendingInvoices` — Facturas pendientes de cobro
9. `paidInvoices` — Facturas cobradas en 30 días
10. `prescriptionsLast30` — Prescripciones emitidas en 30 días
11. `vitalsRate` — % de consultas con signos vitales registrados
12. `avgEncountersPerPatient` — Promedio de consultas por paciente

### Router: `insurance`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `listProviders` | query | protected | Aseguradoras del workspace |
| `createProvider` | mutation | doctor | Nueva aseguradora |
| `updateProvider` | mutation | doctor | Editar / activar / desactivar |
| `listPatientInsurances` | query | protected | Seguros de un paciente |
| `addPatientInsurance` | mutation | protected | Vincular seguro a paciente |
| `updatePatientInsurance` | mutation | protected | Actualizar datos del seguro |

### Router: `consent`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `listTemplates` | query | protected | Plantillas del workspace |
| `createTemplate` | mutation | doctor | Nueva plantilla |
| `updateTemplate` | mutation | doctor | Editar plantilla |
| `listPatientConsents` | query | protected | Consentimientos de un paciente |
| `createConsent` | mutation | protected | Asignar consentimiento a paciente |
| `signConsent` | mutation | protected | Marcar como firmado |

### Router: `audit`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `list` | query | doctor | Log con filtros: entidad, actorId, from, to, take (50), skip |

### Router: `waitingRoom`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `today` | query | protected | Entradas de hoy |
| `add` | mutation | protected | Agregar paciente a la sala |
| `callPatient` | mutation | doctor | Llamar al paciente (estado: ATENDIENDO) |
| `done` | mutation | doctor | Marcar como completado |
| `cancel` | mutation | protected | Cancelar entrada |

### Router: `workspace`

| Procedimiento | Tipo | Auth | Descripción |
|--------------|------|------|-------------|
| `get` | query | protected | Datos del workspace actual |
| `updateSettings` | mutation | doctor | Nombre, dirección, logoUrl, membreteUrl, etc. |
| `updateReminderConfig` | mutation | doctor | Horas de anticipación, WhatsApp, email |
| `myWorkspaces` | query | portal | Workspaces vinculados al paciente actual |

---

## 7. API REST — Endpoints Directos

Estos endpoints usan `NextRequest`/`NextResponse` directamente (no tRPC).

### AI Endpoints

#### `POST /api/ai/encounter-assist`
- **Auth**: cualquier sesión activa
- **Body**: `{ motivo, anamnesis, diagnosticos: [{codigo, descripcion}], vitales }`
- **Respuesta**: `{ sugerencias: string }` — texto generado por Claude
- **Uso**: El botón "✦ IA Asistente Clínico" en la consulta

#### `POST /api/ai/dose-suggestion`
- **Body**: `{ medicamento, peso, edad, diagnostico }`
- **Respuesta**: `{ dosis, frecuencia, advertencias }`

#### `POST /api/ai/drug-interactions`
- **Body**: `{ medicamentos: string[] }`
- **Respuesta**: `{ interacciones: string[] }`

### Tipo de Cambio

#### `GET /api/bcv-rate`
- **Auth**: no requerida
- **Respuesta**: `{ tasa: number, fecha: string }`
- Obtiene el tipo de cambio oficial del Banco Central de Venezuela

### CRON Jobs

#### `GET /api/cron/appointment-reminders`
- **Auth**: Header `Authorization: Bearer CRON_SECRET`
- **Lógica**:
  1. Obtiene todos los workspaces con sus configs (`recordatorioHoras`, `recordatorioEmail`, `recordatorioWa`)
  2. Para cada workspace, filtra citas en la ventana de tiempo configurada
  3. Envía email via Resend si `recordatorioEmail: true`
  4. Envía WhatsApp via Twilio si `recordatorioWa: true`

#### `GET /api/cron/bcv-update`
- **Auth**: Header `Authorization: Bearer CRON_SECRET`
- Actualiza el tipo de cambio en Redis/DB

### Exportación CSV

Los 3 endpoints de exportación siguen el mismo patrón:
- **Auth**: DOCTOR o SECRETARY
- **Respuesta**: CSV con UTF-8 BOM (`﻿`) para compatibilidad con Excel español
- Headers: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`

#### `GET /api/export/patients`
Campos: ID, Nombre, Apellido, Cédula, Nacimiento, Sexo, Teléfono, Email

#### `GET /api/export/appointments`
Campos: Fecha, Hora, Paciente, Tipo, Estado, Doctor, Duración

#### `GET /api/export/invoices`
Campos: Número, Fecha, Paciente, Estado, Moneda, Total, Aseguradora

### Importación CSV

#### `POST /api/import/patients`
- **Auth**: DOCTOR o SECRETARY
- **Body**: FormData con campo `file` (CSV)
- **Límites**: máx 500 filas, máx 5MB
- **Columnas requeridas**: nombre, apellido, fechaNacimiento
- **Columnas opcionales**: sexo, telefono, email, cedula
- **Deduplicación**: por nombre + apellido + fechaNacimiento
- **Proceso**: crea `Patient` (si no existe) + `PatientRegistration` (si no existe en el workspace)
- **Respuesta**: `{ total, created, skipped, errors: string[] }`

### Upload de Archivos

#### `POST /api/upload/logo`
- **Auth**: DOCTOR
- **Límite**: 2MB
- **Formatos**: JPG, PNG, WebP
- **Destino**: `public/uploads/logos/[workspaceId]-[timestamp].[ext]`
- **Respuesta**: `{ url: string }`

#### `POST /api/upload/membrete`
- **Auth**: DOCTOR
- **Límite**: 5MB
- **Destino**: `public/uploads/membretes/`

### OCR de Laboratorio

#### `POST /api/lab-ocr`
- **Auth**: cualquier sesión
- **Body**: FormData con imagen del resultado
- Usa Claude Haiku para extraer valores numéricos con sus unidades y rangos de referencia
- **Respuesta**: `{ resultados: [{nombre, valor, unidad, rangoRef}] }`

---

## 8. Componentes y UI

### Providers Global (`components/providers/trpc-provider.tsx`)

```typescript
"use client"
export function TRPCProvider({ children }) {
  return (
    <SessionProvider>           // Auth.js v5 — necesario para useSession()
      <trpc.Provider ...>
        <QueryClientProvider ...>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  )
}
```

**Crítico**: `SessionProvider` debe envolver todo el árbol para que `useSession()` funcione en cualquier componente client. Está en el root layout via `TRPCProvider`.

### Sidebar (`components/layout/sidebar.tsx`)

Componente client. Recibe `role`, `nombre`, `apellido`, `workspaceNombre` como props desde el server layout.

Links visibles por rol:
- **DOCTOR**: todos los links (19 items)
- **SECRETARY**: pacientes, sala espera, citas, tareas, facturación, estadísticas
- **ASSISTANT**: sala espera, pacientes
- **NURSE**: sala espera, pacientes, citas

### Formulario SOAP (`app/(dashboard)/doctor/patients/[id]/encounters/[id]/`)

El formulario de consulta es la pieza central del sistema. Secciones:
1. **Plantillas** — carga templates de consulta predefinidos
2. **S — Subjetivo**: motivo de consulta + anamnesis (autoguardado)
3. **O — Signos Vitales**: TA, FC, FR, temperatura, peso, talla, SpO2, Glasgow
4. **A — Diagnósticos**: buscador CIE-10 en tiempo real
5. **P — Plan**: plan de tratamiento (autoguardado)
6. **IA Asistente**: panel colapsable con Claude API
7. **Receta Médica**: búsqueda de medicamentos + historial del paciente
8. **Órdenes de Laboratorio**: nombre del estudio + indicaciones + urgente
9. **Resultados de Lab (OCR)**: drag-drop de imagen → extracción automática
10. **Órdenes de Imagenología**: tipo + región anatómica + indicaciones
11. **Informe Médico**: editor libre + generación con IA
12. **Reposo Médico**: días + fecha inicio + diagnóstico → genera PDF
13. **Referido Médico**: búsqueda de médicos del sistema

### Módulo Pediátrico (`components/patients/pediatric-panel.tsx`)

- Se renderiza automáticamente en el perfil del paciente
- **Oculto** para pacientes ≥ 18 años (retorna `null`)
- Muestra **gráfica de crecimiento OMS** (peso para edad, percentiles P3/P50/P97)
- Muestra **Programa Ampliado de Inmunización (PAI) Venezuela** con 8 grupos etarios
- Calcula cobertura comparando las vacunas registradas vs las requeridas

### Gráfica de Crecimiento (`components/patients/growth-chart.tsx`)

Usa Recharts `LineChart` con 4 líneas:
- P97 (rojo punteado) — referencia OMS
- P50 (gris punteado) — referencia OMS
- P3 (azul punteado) — referencia OMS
- Peso del paciente (verde sólido) — datos reales

Solo disponible para niños menores de 2 años (datos de tabla simplificada 0-24 meses).

### Búsqueda Global (`components/search/command-palette.tsx`)

- Activada con `Ctrl+K` o `⌘K`
- Busca pacientes, citas y facturas en tiempo real
- Navega directamente al resultado seleccionado

### Sala de Teleconsulta (`app/(dashboard)/doctor/teleconsulta/[id]/teleconsulta-room.tsx`)

1. Muestra checklist pre-consulta con 5 ítems (micrófono, cámara, internet, privacidad, historia revisada)
2. El botón "Iniciar teleconsulta" se activa solo cuando todos están marcados
3. Abre Jitsi Meet en una nueva pestaña con sala única: `medsysve-{últimos-10-chars-del-id}`
4. Sección de notas post-consulta

---

## 9. Fases de Implementación (1–40)

### Fase 1-5: Fundamentos
- **Fase 1**: Setup del proyecto Next.js 16 + Prisma + Auth.js v5. Modelos base: Workspace, Doctor.
- **Fase 2**: Sistema de autenticación completo. Login de doctor y staff. JWT strategy.
- **Fase 3**: Registro de doctor. Creación automática de Workspace al registrarse.
- **Fase 4**: Gestión de staff. Invitación, roles, activación/desactivación.
- **Fase 5**: Configuración del workspace. Datos del consultorio, horario de atención.

### Fase 6-10: Gestión Clínica Core
- **Fase 6**: CRUD de pacientes con multi-tenancy (PatientRegistration).
- **Fase 7**: Sistema de encuentros/consultas SOAP. Campos completos de vitales y diagnósticos CIE-10.
- **Fase 8**: Recetas médicas digitales con catálogo de medicamentos.
- **Fase 9**: Órdenes y resultados de laboratorio.
- **Fase 10**: Órdenes de imagenología.

### Fase 11-15: Administración
- **Fase 11**: Facturación. Items, monedas USD/BS, tipo de cambio BCV.
- **Fase 12**: Sistema de citas. Calendario semanal con vista por horas.
- **Fase 13**: Sala de espera digital con turnos y estados.
- **Fase 14**: Horario y disponibilidad del doctor.
- **Fase 15**: Analytics básico con Recharts.

### Fase 16-20: Portal y Exportación
- **Fase 16**: Portal del paciente con login separado. Vista de recetas y resultados.
- **Fase 17**: Generación de PDF. Historial clínico, reposo médico, receta.
- **Fase 18**: Exportación CSV de pacientes, citas y facturas.
- **Fase 19**: Sistema de notificaciones internas.
- **Fase 20**: Página pública de clínica `/clinica/[slug]`.

### Fase 21-25: Módulos Clínicos Avanzados
- **Fase 21**: Panel de pacientes crónicos con scoring de riesgo.
- **Fase 22**: Sistema de referidos médicos dentro del sistema.
- **Fase 23**: Mejoras en imagenología — subida de resultados con OCR.
- **Fase 24**: Reposo médico con generación de PDF.
- **Fase 25**: Plantillas de consulta para agilizar el llenado del SOAP.

### Fase 26-31: Comunicación y Colaboración
- **Fase 26**: Recordatorios de citas por WhatsApp (Twilio).
- **Fase 27**: Integración tipo de cambio BCV en tiempo real.
- **Fase 28**: Portal del paciente completo (vacunas, exámenes, recetas PDF).
- **Fase 29**: Notificaciones internas con campana (APPOINTMENT_REQUEST, PORTAL_MESSAGE, etc.).
- **Fase 30**: Tablero de tareas del equipo con prioridades y asignación.
- **Fase 31**: Búsqueda global con Command Palette (⌘K) + Rebranding a MedSysVE.

### Fase 32: Seguros Médicos (HMO)
- Modelos: `InsuranceProvider`, `PatientInsurance`
- Campo `insuranceProviderId` y `montoSeguro` en Invoice
- Router `insurance` completo
- Componente `InsuranceManager` en perfil del paciente
- Página de gestión de aseguradoras `/doctor/insurance`
- Cálculo automático de cobertura en facturación

### Fase 33: Consentimientos Informados
- Modelos: `ConsentTemplate`, `PatientConsent`
- Router `consent` con firma digital
- 4 plantillas venezolanas preconfiguradas
- Componente `ConsentManager` con estados pendiente/firmado
- Página de gestión de plantillas `/doctor/consent-templates`

### Fase 34: Auditoría Clínica
- Modelo `AuditLog` con índices optimizados
- `lib/audit.ts` — función `logAudit()` fire-and-forget (nunca lanza excepción)
- Router `audit` con filtros avanzados
- UI con filtros de entidad, actor y rango de fechas
- Primer evento auditado: firma de consulta (`CONSULTA_FIRMADA`)

### Fase 35: Telemedicina
- Sala de videoconsulta integrada con Jitsi Meet
- Checklist pre-consulta con 5 ítems (activa el botón de ingreso)
- Procedimiento `appointment.get` para verificar tipo VIDEOCONSULTA
- Link a sala desde la página de citas

### Fase 36: Módulo Pediátrico
- Gráfica de crecimiento OMS (peso para edad, 0-24 meses)
- Panel PAI Venezuela — 8 grupos etarios con cobertura automática
- Datos de vitales históricos via `analytics.patientVitals`
- Auto-ocultación para pacientes mayores de 18 años

### Fase 37: Configuración de Recordatorios
- Campos en Workspace: `recordatorioHoras`, `recordatorioWa`, `recordatorioEmail`
- Procedimiento `workspace.updateReminderConfig`
- UI con toggles y selector de horas (1h a 72h)
- CRON de recordatorios respeta configuración por workspace

### Fase 38: Branding / Logo
- API `/api/upload/logo` y `/api/upload/membrete`
- Validación de tipo (JPG/PNG/WebP) y tamaño
- Guardado en `public/uploads/`
- Componente `BrandingUpload` con drag-drop y preview

### Fase 39: Importación Masiva de Pacientes
- API `/api/import/patients` — parser CSV propio
- Deduplicación por nombre+apellido+fechaNacimiento
- Máx 500 filas y 5MB por importación
- Plantilla CSV descargable desde la UI
- Resultados: total, creados, omitidos, errores

### Fase 40: Indicadores de Calidad
- `analytics.qualityIndicators` — 12 queries en paralelo (Promise.all)
- Score global = promedio de 4 métricas clave
- Componente `ScoreBar` con colores: verde (≥objetivo), ámbar (≥70%), rojo (<70%)
- 9 tarjetas KPI en grid responsivo

---

## 10. Patrones de Código Críticos

### 1. TypeScript Depth Limit con Prisma

Prisma 7 con includes profundos puede causar el error:
```
Type instantiation is excessively deep and possibly infinite
```

**Solución establecida en el proyecto**:
```typescript
// En server/routers (backend):
const result = await (ctx.db as any).modelName.findMany({
  where: { workspaceId: ctx.session.workspaceId },
  include: { deepRelation: { include: { anotherRelation: true } } }
})

// En componentes client:
const { data } = (trpc.namespace as any).procedure.useQuery()
const typed = data as ExpectedType
```

### 2. Fire-and-Forget Audit

```typescript
// lib/audit.ts
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await (db as any).auditLog.create({ data: params })
  } catch {
    // NUNCA propagar el error — audit no debe interrumpir el flujo principal
  }
}

// Uso en routers:
void logAudit({      // void = no esperamos el resultado
  workspaceId: ctx.session.workspaceId,
  accion: "CONSULTA_FIRMADA",
  entidad: "Encounter",
  entidadId: input.id,
  actorId: ctx.session.doctorId,
  actorNombre: ctx.session.nombre,
  detalle: { motivo: encounter.motivo }
})
// El flujo principal continúa inmediatamente
```

### 3. Multi-Tenant Isolation

**Regla absoluta**: todo query de Prisma debe incluir `workspaceId`.

```typescript
// ✅ Correcto
await ctx.db.patient.findMany({
  where: {
    workspaceId: ctx.session.workspaceId,  // SIEMPRE
    // ... otros filtros
  }
})

// ❌ Incorrecto — expone datos de otros workspaces
await ctx.db.patient.findMany()
```

### 4. Server Components con tRPC

Para llamar tRPC desde server components (no client):

```typescript
// server/caller.ts
export async function createServerCaller() {
  const context = await createContext()
  return appRouter.createCaller(context)
}

// En un server component:
import { createServerCaller } from "@/server/caller"

export default async function PatientPage({ params }) {
  const caller = await createServerCaller()
  const patient = await (caller as any).patient.get({ id: params.id })
  // ...
}
```

### 5. Nombres Reservados en tRPC

tRPC tiene palabras reservadas que no pueden usarse como nombres de procedimiento: `call`, `delete`, `new`, `return`, etc.

```typescript
// ❌ Falla en build
call: doctorProcedure...

// ✅ Correcto
callPatient: doctorProcedure...
```

### 6. CSV con BOM para Excel

Los exports CSV usan UTF-8 BOM para compatibilidad con Excel en español:

```typescript
const BOM = "﻿"
const csv = BOM + headers + rows
return new Response(csv, {
  headers: { "Content-Type": "text/csv; charset=utf-8" }
})
```

### 7. idDisplay como String

```typescript
// PatientRegistration.idDisplay es STRING, no número
const count = await ctx.db.patientRegistration.count({ where: { workspaceId } })
const idDisplay = String(count + 1).padStart(6, "0")  // "000001"
```

### 8. IdentificationType Enum

Los valores correctos del enum son exactamente:
```typescript
// ✅ Correcto
tipoIdentificacion: "CEDULA_V"  // venezolano
tipoIdentificacion: "CEDULA_E"  // extranjero
tipoIdentificacion: "PASAPORTE"

// ❌ Incorrecto (no existe)
tipoIdentificacion: "CEDULA_VENEZOLANA"
```

---

## 11. Variables de Entorno

Archivo: `.env.local` (NO subir al repositorio)

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/ajmedics"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth.js (obligatorio)
NEXTAUTH_SECRET="<generado con: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"    # En prod: https://tu-dominio.com

# Inteligencia Artificial
ANTHROPIC_API_KEY="sk-ant-..."         # Para asistente clínico, OCR, sugerencias

# Email (Resend)
RESEND_API_KEY="re_..."                # Para recordatorios y confirmaciones

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"  # Número de sandbox o producción

# Almacenamiento (Cloudflare R2)
CLOUDFLARE_R2_ACCOUNT_ID="..."
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET_NAME="ajmedics"
CLOUDFLARE_R2_ENDPOINT="https://....r2.cloudflarestorage.com"

# CRON Jobs
CRON_SECRET="<secret aleatorio largo>"  # Para proteger /api/cron/*
```

### Variables requeridas vs opcionales

| Variable | Requerida | Sin ella |
|---------|-----------|---------|
| `DATABASE_URL` | Sí | El sistema no arranca |
| `NEXTAUTH_SECRET` | Sí | El login no funciona |
| `NEXTAUTH_URL` | Sí | Redirects incorrectos |
| `ANTHROPIC_API_KEY` | No | IA deshabilitada (sin error) |
| `RESEND_API_KEY` | No | Emails no se envían |
| `TWILIO_*` | No | WhatsApp no funciona |
| `CLOUDFLARE_R2_*` | No | Uploads van a local |
| `CRON_SECRET` | No | CRONs desprotegidos |

---

## 12. Comandos de Desarrollo

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo (hot reload, Turbopack)
npx next dev --port 3000

# Verificar TypeScript sin compilar
npx tsc --noEmit

# Build de producción
npx next build

# Servidor de producción (después del build)
npx next start
```

### Prisma

```bash
# Generar cliente Prisma (después de cambiar schema.prisma)
npx prisma generate

# Sincronizar schema con la DB (agrega columnas/tablas faltantes)
# USAR EN VEZ DE prisma migrate en este proyecto
npx prisma db push

# Ver y editar la DB en el navegador
npx prisma studio

# Poblar catálogo de medicamentos
npx tsx prisma/seed-medications.ts

# Ver el estado actual de la DB vs schema
npx prisma db pull
```

### Base de Datos PostgreSQL

```bash
# Conectar a la DB
psql -U ajmedics -d ajmedics

# Ver todas las tablas
\dt

# Ver estructura de una tabla
\d "Encounter"

# Backup
pg_dump -U ajmedics ajmedics > backup-$(date +%Y%m%d).sql

# Restaurar
psql -U ajmedics ajmedics < backup-20260619.sql
```

---

## 13. Bugs Conocidos y Soluciones

### Bug 1: Schema desincronizado con la DB

**Síntoma**: Error `The column 'ModelName.fieldName' does not exist in the current database` al arrancar.

**Causa**: Se agregó un campo al `schema.prisma` pero no se ejecutó `prisma db push`.

**Solución**:
```bash
npx prisma db push
```

**Prevención**: Cada vez que se modifica `schema.prisma`, ejecutar `prisma generate && prisma db push`.

---

### Bug 2: TypeScript "Type instantiation is excessively deep"

**Síntoma**: El compilador TypeScript falla en queries de Prisma con includes profundos.

**Solución**: Usar `(ctx.db as any)` o `(trpc.router as any)`. Ver sección 10, patrón 1.

---

### Bug 3: SessionProvider faltante

**Síntoma**: Error `[next-auth]: useSession must be wrapped in a <SessionProvider />` al navegar al dashboard.

**Causa**: Un componente client usa `useSession()` pero no está dentro de `<SessionProvider>`.

**Solución**: El `TRPCProvider` global ya incluye `<SessionProvider>`. Si aparece este error en un componente nuevo, verificar que está dentro del árbol de `TRPCProvider`.

---

### Bug 4: Redirect loop en portal

**Síntoma**: `ERR_TOO_MANY_REDIRECTS` al navegar a `/portal/login` estando logueado como doctor.

**Causa**: El proxy redirige al usuario logueado a `/portal`, el server component lo devuelve a `/portal/login`, creando un loop.

**Solución**: El proxy no redirige las páginas de auth del portal — las deja pasar al server component que maneja la lógica de rol. Ver `proxy.ts`.

---

### Bug 5: tRPC palabra reservada

**Síntoma**: Build falla con `Reserved words used in router({}) call: [palabra]`.

**Causa**: Un procedimiento tRPC tiene un nombre que es palabra reservada de JavaScript.

**Solución**: Renombrar el procedimiento. Ejemplo: `call` → `callPatient`.

---

### Bug 6: `portal/schedule` bloqueada

**Síntoma**: La página se queda en "Cargando..." para usuarios no-paciente.

**Causa**: La query `portal.myWorkspaces` hace 401 para no-pacientes y tRPC no libera el estado `isLoading`.

**Solución**: La query usa `enabled: isPatient` — solo se ejecuta si el rol es PATIENT.

---

## 14. Guía para Extender el Sistema

### Agregar un nuevo módulo

**Ejemplo**: agregar "Vacunas del workspace" (catálogo de vacunas personalizado).

#### Paso 1: Schema Prisma

```prisma
// En schema.prisma
model WorkspaceVaccine {
  id          String    @id @default(cuid())
  workspaceId String
  nombre      String
  fabricante  String?
  activo      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  @@index([workspaceId])
}
```

```bash
npx prisma generate && npx prisma db push
```

#### Paso 2: Router tRPC

```typescript
// server/routers/workspaceVaccine.ts
import { z } from "zod"
import { router, doctorProcedure, protectedProcedure } from "@/server/trpc"

export const workspaceVaccineRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workspaceVaccine.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      orderBy: { nombre: "asc" },
    })
  }),
  create: doctorProcedure
    .input(z.object({ nombre: z.string().min(1), fabricante: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workspaceVaccine.create({
        data: { ...input, workspaceId: ctx.session.workspaceId },
      })
    }),
})
```

#### Paso 3: Registrar en el router raíz

```typescript
// server/routers/_app.ts
import { workspaceVaccineRouter } from "./workspaceVaccine"

export const appRouter = router({
  // ... routers existentes
  workspaceVaccine: workspaceVaccineRouter,
})
```

#### Paso 4: Página Next.js

```typescript
// app/(dashboard)/doctor/workspace-vaccines/page.tsx
export const dynamic = "force-dynamic"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { WorkspaceVaccinesClient } from "./workspace-vaccines-client"

export default async function WorkspaceVaccinesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return <WorkspaceVaccinesClient />
}
```

#### Paso 5: Componente Client

```typescript
// app/(dashboard)/doctor/workspace-vaccines/workspace-vaccines-client.tsx
"use client"
import { trpc } from "@/lib/trpc-client"

export function WorkspaceVaccinesClient() {
  const { data: vaccines } = (trpc.workspaceVaccine as any).list.useQuery()
  // ... UI
}
```

#### Paso 6: Agregar al Sidebar

```typescript
// components/layout/sidebar.tsx
import { Syringe } from "lucide-react"

const doctorLinks = [
  // ... links existentes
  { href: "/doctor/workspace-vaccines", label: "Vacunas", icon: Syringe },
]
```

---

### Agregar un campo a un modelo existente

1. Agregar el campo en `schema.prisma`
2. Ejecutar `npx prisma generate && npx prisma db push`
3. Si el campo es opcional, los datos existentes quedan con `null` — no hay pérdida de datos
4. Actualizar el router correspondiente para leer/escribir el nuevo campo
5. Actualizar los componentes UI

---

### Agregar un nuevo tipo de notificación

```typescript
// En el router donde ocurre el evento
await ctx.db.notification.create({
  data: {
    workspaceId: ctx.session.workspaceId,
    recipientId: doctorId,
    tipo: "NUEVO_TIPO",     // string libre
    titulo: "Título",
    mensaje: "Descripción del evento",
    data: { relatedId: someId },  // contexto para navigation
  }
})
```

---

### Cuándo usar `prisma db push` vs migraciones

Este proyecto usa `prisma db push` en lugar de `prisma migrate` por simplicidad en desarrollo. **Para producción** se recomienda generar una migration SQL manualmente:

```bash
# Generar el SQL de los cambios sin aplicarlos
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration.sql

# Revisar el SQL y aplicarlo manualmente
psql -U ajmedics ajmedics < migration.sql
```

---

*Documentación generada: 2026-06-19 · MedSysVE v1.0*
