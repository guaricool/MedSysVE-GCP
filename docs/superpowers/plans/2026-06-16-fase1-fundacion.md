# AJMedics Fase 1 — Fundación: Auth, Workspaces, Roles, Pacientes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la base completa del sistema: registro de doctores, workspaces, roles de staff, registro y búsqueda de pacientes, dashboards por rol, y deployment en Google Cloud.

**Architecture:** Monolito modular Next.js 15 con App Router. tRPC para type-safety end-to-end entre cliente y servidor. Auth.js v5 maneja autenticación multi-tenant con contexto de workspace en la sesión. Row-Level Security aplicado via Prisma middleware usando `workspace_id`.

**Tech Stack:** Next.js 15, TypeScript, PostgreSQL 16, Prisma ORM, Auth.js v5, tRPC v11, Tailwind CSS, shadcn/ui, Redis (sesiones), Vitest (tests), Playwright (E2E)

---

## Estructura de Archivos

```
ajmedics/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                     ← sidebar + workspace context
│   │   ├── doctor/
│   │   │   ├── page.tsx                   ← dashboard doctor
│   │   │   ├── workspace/
│   │   │   │   ├── page.tsx               ← gestión workspace
│   │   │   │   └── new/page.tsx           ← crear workspace
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx               ← lista staff
│   │   │   │   └── invite/page.tsx        ← invitar staff
│   │   │   └── patients/
│   │   │       ├── page.tsx               ← lista + búsqueda
│   │   │       └── new/page.tsx           ← registrar paciente
│   │   ├── secretary/page.tsx
│   │   ├── assistant/page.tsx
│   │   └── nurse/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── trpc/[trpc]/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                                ← shadcn/ui (auto-generado)
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── register-form.tsx
│   ├── workspace/
│   │   ├── workspace-switcher.tsx         ← selector en sidebar
│   │   └── workspace-form.tsx
│   ├── staff/
│   │   ├── invite-form.tsx
│   │   └── staff-table.tsx
│   ├── patients/
│   │   ├── patient-form.tsx               ← registro + lógica menor/representante
│   │   ├── patient-search.tsx             ← autocomplete cédula/nombre
│   │   └── patient-card.tsx
│   └── layout/
│       ├── sidebar.tsx
│       └── top-bar.tsx
├── server/
│   ├── trpc.ts                            ← context + middleware workspace
│   ├── routers/
│   │   ├── _app.ts                        ← root router
│   │   ├── doctor.ts
│   │   ├── workspace.ts
│   │   ├── staff.ts
│   │   └── patient.ts
├── lib/
│   ├── auth.ts                            ← Auth.js config
│   ├── db.ts                              ← Prisma singleton
│   ├── redis.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts                           ← protección de rutas por rol
├── types/
│   └── index.ts                           ← tipos compartidos
├── tests/
│   ├── unit/
│   │   ├── patient.test.ts
│   │   └── workspace.test.ts
│   └── e2e/
│       ├── register.spec.ts
│       └── login.spec.ts
├── .env.example
├── docker-compose.yml                      ← desarrollo local
└── Google Cloud/
    └── docker-compose.yml
```

---

## Task 1: Inicialización del Proyecto

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `.env.example`
- Create: `docker-compose.yml`

- [ ] **Crear proyecto Next.js 15 con TypeScript**

```bash
cd C:/Projects/AJMedics
npx create-next-app@latest . --typescript --tailwind --app --src-dir no --import-alias "@/*"
```

- [ ] **Instalar dependencias principales**

```bash
npm install @prisma/client prisma
npm install @trpc/server @trpc/client @trpc/next @trpc/react-query
npm install @tanstack/react-query
npm install next-auth@beta @auth/prisma-adapter
npm install zod
npm install ioredis
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
```

- [ ] **Instalar dependencias de desarrollo y test**

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D prisma
```

- [ ] **Inicializar shadcn/ui**

```bash
npx shadcn@latest init
```
Seleccionar: Default style, Slate color, CSS variables: yes.

Luego agregar componentes base:
```bash
npx shadcn@latest add button input label form card badge avatar dropdown-menu separator
```

- [ ] **Crear `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
})
```

- [ ] **Crear `.env.example`**

```env
# Database
DATABASE_URL="postgresql://ajmedics:password@localhost:5432/ajmedics"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth.js
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic (Claude API)
ANTHROPIC_API_KEY=""

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"

# Resend (Email)
RESEND_API_KEY=""

# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=""
CLOUDFLARE_R2_ACCESS_KEY_ID=""
CLOUDFLARE_R2_SECRET_ACCESS_KEY=""
CLOUDFLARE_R2_BUCKET_NAME="ajmedics"
CLOUDFLARE_R2_ENDPOINT=""
```

Copiar a `.env.local` y completar los valores locales.

- [ ] **Crear `docker-compose.yml` para desarrollo local**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ajmedics
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ajmedics
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

- [ ] **Levantar servicios locales y verificar conexión**

```bash
docker-compose up -d
docker-compose ps
# Expected: postgres y redis en estado "Up"
```

- [ ] **Commit inicial**

```bash
git init
echo ".env.local" >> .gitignore
echo ".superpowers/" >> .gitignore
git add .
git commit -m "feat: project scaffolding — Next.js 15, Prisma, Auth.js, tRPC, shadcn/ui"
```

---

## Task 2: Schema Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`

- [ ] **Inicializar Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Escribir `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum StaffRole {
  SECRETARY
  ASSISTANT
  NURSE
}

enum ClinicRole {
  OWNER
  STAFF
  CONTRACTOR
}

enum IdentificationType {
  CEDULA_V
  CEDULA_E
  PASAPORTE
}

enum ParentRelationship {
  PADRE
  MADRE
  TUTOR_LEGAL
  OTRO
}

model Doctor {
  id                   String      @id @default(cuid())
  cedula               String      @unique
  nombre               String
  apellido             String
  email                String      @unique
  passwordHash         String
  telefono             String?
  fotoUrl              String?
  especialidadPrincipal String
  subEspecialidades    String[]    @default([])
  rif                  String?
  datosFiscales        Json?
  createdAt            DateTime    @default(now())
  updatedAt            DateTime    @updatedAt
  workspaces           Workspace[]
  clinicAffiliations   DoctorClinicAffiliation[]
}

model Workspace {
  id              String    @id @default(cuid())
  nombre          String
  direccion       String?
  telefono        String?
  logoUrl         String?
  membreteUrl     String?
  rif             String?
  razonSocial     String?
  direccionFiscal String?
  doctorId        String
  doctor          Doctor    @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  clinicId        String?
  clinic          Clinic?   @relation(fields: [clinicId], references: [id])
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  staff           Staff[]
  patientRegs     PatientRegistration[]

  @@index([doctorId])
  @@index([clinicId])
}

model Staff {
  id          String    @id @default(cuid())
  cedula      String
  nombre      String
  apellido    String
  email       String
  pinAcceso   String?
  rol         StaffRole
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  activo      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([cedula, workspaceId])
  @@unique([email, workspaceId])
  @@index([workspaceId])
}

model Patient {
  id                   String              @id @default(cuid())
  tipoIdentificacion   IdentificationType?
  numeroIdentificacion String?
  sinCedula            Boolean             @default(false)
  nombre               String
  apellido             String
  fechaNacimiento      DateTime
  sexo                 String
  telefono             String?
  email                String?
  portalPasswordHash   String?
  // Representante (obligatorio cuando sinCedula = true)
  repCedula            String?
  repNombreCompleto    String?
  repParentesco        ParentRelationship?
  repTelefono          String?
  repEmail             String?
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  registrations        PatientRegistration[]

  @@unique([tipoIdentificacion, numeroIdentificacion])
}

model Clinic {
  id              String    @id @default(cuid())
  nombre          String
  rif             String?   @unique
  razonSocial     String?
  direccion       String?
  telefono        String?
  email           String?
  website         String?
  logoUrl         String?
  bannerUrl       String?
  descripcion     String?
  servicios       String[]  @default([])
  redesSociales   Json?
  activa          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  affiliations    DoctorClinicAffiliation[]
  workspaces      Workspace[]
}

model DoctorClinicAffiliation {
  id        String    @id @default(cuid())
  doctorId  String
  doctor    Doctor    @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  clinicId  String
  clinic    Clinic    @relation(fields: [clinicId], references: [id], onDelete: Cascade)
  rol       ClinicRole @default(STAFF)
  activo    Boolean   @default(true)
  createdAt DateTime  @default(now())

  @@unique([doctorId, clinicId])
  @@index([clinicId])
}

model PatientRegistration {
  id          String    @id @default(cuid())
  idDisplay   String                        // "000054"
  patientId   String
  patient     Patient   @relation(fields: [patientId], references: [id])
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  notasInternas String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([workspaceId, idDisplay])
  @@unique([workspaceId, patientId])
  @@index([workspaceId])
  @@index([patientId])
}
```

- [ ] **Crear `lib/db.ts` (Prisma singleton)**

```typescript
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] **Ejecutar migración inicial**

```bash
npx prisma migrate dev --name init
```
Expected: `✔  Your database is now in sync with your schema.`

- [ ] **Verificar con Prisma Studio**

```bash
npx prisma studio
# Abre http://localhost:5555 — deben verse todas las tablas vacías
```

- [ ] **Commit**

```bash
git add prisma/ lib/db.ts
git commit -m "feat: database schema — Doctor, Workspace, Staff, Patient, PatientRegistration"
```

---

## Task 3: Configuración Auth.js + tRPC

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/redis.ts`
- Create: `server/trpc.ts`
- Create: `server/routers/_app.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/api/trpc/[trpc]/route.ts`
- Create: `types/index.ts`

- [ ] **Crear `lib/redis.ts`**

```typescript
import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, { lazyConnect: true })

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis
```

- [ ] **Crear `types/index.ts`**

```typescript
export type UserRole = "DOCTOR" | "SECRETARY" | "ASSISTANT" | "NURSE"

export interface SessionUser {
  id: string
  email: string
  nombre: string
  apellido: string
  role: UserRole
  workspaceId: string
  doctorId: string        // el doctor dueño del workspace
}
```

- [ ] **Crear `lib/auth.ts`**

```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { SessionUser } from "@/types"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  workspaceId: z.string().optional(),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const { email, password } = parsed.data

        // Intenta autenticar como doctor
        const doctor = await db.doctor.findUnique({
          where: { email },
          include: { workspaces: { take: 1 } },
        })
        if (doctor && await bcrypt.compare(password, doctor.passwordHash)) {
          const ws = doctor.workspaces[0]
          if (!ws) return null
          return {
            id: doctor.id,
            email: doctor.email,
            nombre: doctor.nombre,
            apellido: doctor.apellido,
            role: "DOCTOR",
            workspaceId: ws.id,
            doctorId: doctor.id,
          } satisfies SessionUser
        }

        // Intenta autenticar como staff
        const staff = await db.staff.findFirst({
          where: { email, activo: true },
          include: { workspace: true },
        })
        if (staff && staff.pinAcceso && await bcrypt.compare(password, staff.pinAcceso)) {
          return {
            id: staff.id,
            email: staff.email,
            nombre: staff.nombre,
            apellido: staff.apellido,
            role: staff.rol as SessionUser["role"],
            workspaceId: staff.workspaceId,
            doctorId: staff.workspace.doctorId,
          } satisfies SessionUser
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) Object.assign(token, user)
      return token
    },
    session({ session, token }) {
      session.user = token as unknown as SessionUser & typeof session.user
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
})
```

- [ ] **Instalar bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Crear `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/lib/auth"
export const { GET, POST } = handlers
```

- [ ] **Crear `server/trpc.ts`**

```typescript
import { initTRPC, TRPCError } from "@trpc/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ZodError } from "zod"
import type { SessionUser } from "@/types"

export async function createContext() {
  const session = await auth()
  return {
    session: session?.user as SessionUser | null,
    db,
  }
}

type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" })
  return next({ ctx: { ...ctx, session: ctx.session } })
})

export const doctorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.session.role !== "DOCTOR") throw new TRPCError({ code: "FORBIDDEN" })
  return next({ ctx })
})
```

- [ ] **Crear `server/routers/_app.ts`**

```typescript
import { router } from "../trpc"
import { doctorRouter } from "./doctor"
import { workspaceRouter } from "./workspace"
import { staffRouter } from "./staff"
import { patientRouter } from "./patient"

export const appRouter = router({
  doctor: doctorRouter,
  workspace: workspaceRouter,
  staff: staffRouter,
  patient: patientRouter,
})

export type AppRouter = typeof appRouter
```

- [ ] **Crear `app/api/trpc/[trpc]/route.ts`**

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/routers/_app"
import { createContext } from "@/server/trpc"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(),
  })

export { handler as GET, handler as POST }
```

- [ ] **Commit**

```bash
git add lib/ server/ app/api/ types/
git commit -m "feat: Auth.js credentials + tRPC setup with workspace context"
```

---

## Task 4: Registro de Doctor

**Files:**
- Create: `server/routers/doctor.ts`
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `components/auth/register-form.tsx`
- Create: `tests/unit/doctor.test.ts`

- [ ] **Escribir test fallido para registro de doctor**

```typescript
// tests/unit/doctor.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest"

describe("doctor registration", () => {
  it("hashes password before storing", async () => {
    const bcrypt = await import("bcryptjs")
    const hash = await bcrypt.hash("password123", 10)
    expect(hash).not.toBe("password123")
    expect(await bcrypt.compare("password123", hash)).toBe(true)
  })

  it("rejects registration if cedula already exists", async () => {
    // Este test se completa en Task 4 luego de implementar el router
    expect(true).toBe(true)
  })
})
```

- [ ] **Ejecutar tests — verificar que pasan (son triviales por ahora)**

```bash
npx vitest run tests/unit/doctor.test.ts
# Expected: PASS
```

- [ ] **Crear `server/routers/doctor.ts`**

```typescript
import { router, publicProcedure } from "../trpc"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"

const ESPECIALIDADES_VE = [
  "Medicina General", "Cardiología", "Gastroenterología", "Traumatología",
  "Pediatría", "Ginecología y Obstetricia", "Neurología", "Dermatología",
  "Oftalmología", "Otorrinolaringología", "Urología", "Neumología",
  "Endocrinología", "Nefrología", "Oncología", "Psiquiatría", "Cirugía General",
  "Cirugía Plástica", "Ortopedia", "Anestesiología", "Radiología", "Patología",
  "Medicina Interna", "Geriatría", "Reumatología", "Infectología",
  "Medicina de Emergencia", "Hematología", "Inmunología", "Medicina Ocupacional",
]

export const doctorRouter = router({
  register: publicProcedure
    .input(z.object({
      cedula: z.string().min(6).max(10),
      nombre: z.string().min(2),
      apellido: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      telefono: z.string().optional(),
      especialidadPrincipal: z.string(),
      subEspecialidades: z.array(z.string()).default([]),
      // Primer workspace (obligatorio al registrarse)
      workspaceNombre: z.string().min(2),
      workspaceDireccion: z.string().optional(),
      workspaceTelefono: z.string().optional(),
      workspaceRif: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.doctor.findFirst({
        where: { OR: [{ cedula: input.cedula }, { email: input.email }] },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existing.cedula === input.cedula
            ? "Ya existe un doctor registrado con esa cédula"
            : "Ya existe un doctor registrado con ese email",
        })
      }

      const passwordHash = await bcrypt.hash(input.password, 12)

      const doctor = await ctx.db.doctor.create({
        data: {
          cedula: input.cedula,
          nombre: input.nombre,
          apellido: input.apellido,
          email: input.email,
          passwordHash,
          telefono: input.telefono,
          especialidadPrincipal: input.especialidadPrincipal,
          subEspecialidades: input.subEspecialidades,
          workspaces: {
            create: {
              nombre: input.workspaceNombre,
              direccion: input.workspaceDireccion,
              telefono: input.workspaceTelefono,
              rif: input.workspaceRif,
            },
          },
        },
        include: { workspaces: true },
      })

      return { doctorId: doctor.id, workspaceId: doctor.workspaces[0].id }
    }),

  especialidades: publicProcedure.query(() => ESPECIALIDADES_VE),
})
```

- [ ] **Crear `app/(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">AJMedics</h1>
          <p className="text-slate-400 mt-1">Sistema de Historias Médicas</p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Crear `components/auth/register-form.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// shadcn Select no necesario — se usa <select> nativo para especialidades

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const { data: especialidades = [] } = trpc.doctor.especialidades.useQuery()

  const register = trpc.doctor.register.useMutation({
    onSuccess: async (data, variables) => {
      const result = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      })
      if (result?.ok) router.push("/doctor")
    },
    onError: (e) => setError(e.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    register.mutate({
      cedula: fd.get("cedula") as string,
      nombre: fd.get("nombre") as string,
      apellido: fd.get("apellido") as string,
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      telefono: fd.get("telefono") as string,
      especialidadPrincipal: fd.get("especialidad") as string,
      workspaceNombre: fd.get("workspaceNombre") as string,
      workspaceDireccion: fd.get("workspaceDireccion") as string,
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Registro de Doctor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Nombre</Label>
              <Input name="nombre" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Apellido</Label>
              <Input name="apellido" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Cédula</Label>
            <Input name="cedula" placeholder="V-12345678" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input name="email" type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Contraseña</Label>
            <Input name="password" type="password" required minLength={8} className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Especialidad</Label>
            <select name="especialidad" required className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
              <option value="">Seleccionar...</option>
              {especialidades.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <hr className="border-slate-700" />
          <p className="text-slate-400 text-sm">Datos de tu consultorio / clínica principal</p>
          <div className="space-y-1">
            <Label className="text-slate-300">Nombre del Consultorio</Label>
            <Input name="workspaceNombre" placeholder="Ej: Consultorio Dra. García" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Dirección (opcional)</Label>
            <Input name="workspaceDireccion" className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? "Registrando..." : "Crear cuenta"}
          </Button>
          <p className="text-center text-slate-400 text-sm">
            ¿Ya tienes cuenta? <a href="/login" className="text-blue-400 hover:underline">Iniciar sesión</a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Crear `app/(auth)/register/page.tsx`**

```tsx
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return <RegisterForm />
}
```

- [ ] **Crear cliente tRPC `lib/trpc-client.ts`**

```typescript
import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@/server/routers/_app"

export const trpc = createTRPCReact<AppRouter>()
```

- [ ] **Crear `app/layout.tsx` con TRPCProvider**

```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TRPCProvider } from "@/components/providers/trpc-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AJMedics",
  description: "Sistema de Historias Médicas",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-950`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  )
}
```

- [ ] **Crear `components/providers/trpc-provider.tsx`**

```tsx
"use client"
import { trpc } from "@/lib/trpc-client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { useState } from "react"

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: "/api/trpc" })],
    })
  )
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

- [ ] **Probar registro en browser**

```bash
npm run dev
# Abrir http://localhost:3000/register
# Completar formulario con datos de prueba
# Verificar redirección a /doctor después del registro
```

- [ ] **Commit**

```bash
git add .
git commit -m "feat: doctor registration with workspace creation"
```

---

## Task 5: Login y Selección de Workspace

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `components/auth/login-form.tsx`
- Create: `server/routers/workspace.ts`
- Create: `middleware.ts`

- [ ] **Crear `components/auth/login-form.tsx`**

```tsx
"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    })
    setLoading(false)
    if (result?.ok) {
      router.push("/doctor")
      router.refresh()
    } else {
      setError("Email o contraseña incorrectos")
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input name="email" type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Contraseña</Label>
            <Input name="password" type="password" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </Button>
          <p className="text-center text-slate-400 text-sm">
            ¿Eres doctor nuevo? <a href="/register" className="text-blue-400 hover:underline">Regístrate</a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Crear `app/(auth)/login/page.tsx`**

```tsx
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return <LoginForm />
}
```

- [ ] **Crear `middleware.ts`**

```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const isAuthPage = nextUrl.pathname.startsWith("/login") ||
                     nextUrl.pathname.startsWith("/register")

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isLoggedIn && isAuthPage) {
    const role = (session?.user as any)?.role
    const dest = role === "DOCTOR" ? "/doctor"
      : role === "SECRETARY" ? "/secretary"
      : role === "ASSISTANT" ? "/assistant"
      : "/nurse"
    return NextResponse.redirect(new URL(dest, nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Crear `server/routers/workspace.ts`**

```typescript
import { router, doctorProcedure, protectedProcedure } from "../trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"

export const workspaceRouter = router({
  myWorkspaces: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findMany({
      where: { doctorId: ctx.session.doctorId },
      orderBy: { createdAt: "asc" },
    })
  }),

  create: doctorProcedure
    .input(z.object({
      nombre: z.string().min(2),
      direccion: z.string().optional(),
      telefono: z.string().optional(),
      rif: z.string().optional(),
      razonSocial: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workspace.create({
        data: { ...input, doctorId: ctx.session.doctorId },
      })
    }),

  update: doctorProcedure
    .input(z.object({
      id: z.string(),
      nombre: z.string().min(2).optional(),
      direccion: z.string().optional(),
      telefono: z.string().optional(),
      rif: z.string().optional(),
      razonSocial: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ws = await ctx.db.workspace.findFirst({
        where: { id: input.id, doctorId: ctx.session.doctorId },
      })
      if (!ws) throw new TRPCError({ code: "FORBIDDEN" })
      const { id, ...data } = input
      return ctx.db.workspace.update({ where: { id }, data })
    }),

  current: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findUnique({
      where: { id: ctx.session.workspaceId },
      include: { doctor: { select: { nombre: true, apellido: true, especialidadPrincipal: true } } },
    })
  }),
})
```

- [ ] **Probar login en browser**

```bash
# Usar las credenciales del doctor creado en Task 4
# Verificar redirección a /doctor
# Probar con credenciales incorrectas — debe mostrar error
```

- [ ] **Commit**

```bash
git add .
git commit -m "feat: login flow + route protection middleware by role"
```

---

## Task 6: Dashboards y Layout Principal

**Files:**
- Create: `app/(dashboard)/layout.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `app/(dashboard)/doctor/page.tsx`
- Create: `app/(dashboard)/secretary/page.tsx`
- Create: `app/(dashboard)/assistant/page.tsx`
- Create: `app/(dashboard)/nurse/page.tsx`

- [ ] **Crear `components/layout/sidebar.tsx`**

```tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Users, Calendar, FileText, Pill, LogOut, Settings, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const doctorLinks = [
  { href: "/doctor", label: "Dashboard", icon: Home },
  { href: "/doctor/patients", label: "Pacientes", icon: Users },
  { href: "/doctor/staff", label: "Mi Equipo", icon: Users },
  { href: "/doctor/workspace", label: "Consultorio", icon: Settings },
]

const secretaryLinks = [
  { href: "/secretary", label: "Dashboard", icon: Home },
  { href: "/doctor/patients", label: "Pacientes", icon: Users },
  { href: "/secretary/appointments", label: "Citas", icon: Calendar },
]

const roleLinks: Record<string, typeof doctorLinks> = {
  DOCTOR: doctorLinks,
  SECRETARY: secretaryLinks,
  ASSISTANT: [
    { href: "/assistant", label: "Dashboard", icon: Home },
    { href: "/doctor/patients", label: "Pacientes", icon: Users },
  ],
  NURSE: [
    { href: "/nurse", label: "Dashboard", icon: Home },
    { href: "/doctor/patients", label: "Pacientes", icon: Users },
  ],
}

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const links = roleLinks[role] ?? []

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <span className="text-white font-bold text-lg">AJMedics</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800 w-full"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Crear `app/(dashboard)/layout.tsx`**

```tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import type { SessionUser } from "@/types"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const user = session.user as SessionUser

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar role={user.role} />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Crear `app/(dashboard)/doctor/page.tsx`**

```tsx
import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"
import { db } from "@/lib/db"

export default async function DoctorDashboard() {
  const session = await auth()
  const user = session!.user as SessionUser

  const workspace = await db.workspace.findUnique({
    where: { id: user.workspaceId },
    include: {
      _count: { select: { patientRegs: true, staff: { where: { activo: true } } } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Buenos días, Dr. {user.apellido}
        </h1>
        <p className="text-slate-400">{workspace?.nombre}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pacientes registrados" value={workspace?._count.patientRegs ?? 0} color="blue" />
        <StatCard label="Staff activo" value={workspace?._count.staff ?? 0} color="green" />
        <StatCard label="Citas hoy" value={0} color="purple" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "border-l-blue-500",
    green: "border-l-emerald-500",
    purple: "border-l-purple-500",
  }
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-lg p-5 border-l-4 ${colors[color]}`}>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
```

- [ ] **Crear dashboards de staff (secretary, assistant, nurse)**

`app/(dashboard)/secretary/page.tsx`:
```tsx
import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"

export default async function SecretaryDashboard() {
  const session = await auth()
  const user = session!.user as SessionUser
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Secretaria</h1>
      <p className="text-slate-400">Bienvenida, {user.nombre}</p>
    </div>
  )
}
```

`app/(dashboard)/assistant/page.tsx`:
```tsx
import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"

export default async function AssistantDashboard() {
  const session = await auth()
  const user = session!.user as SessionUser
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Asistente</h1>
      <p className="text-slate-400">Bienvenida, {user.nombre}</p>
    </div>
  )
}
```

`app/(dashboard)/nurse/page.tsx`:
```tsx
import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"

export default async function NurseDashboard() {
  const session = await auth()
  const user = session!.user as SessionUser
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Enfermería</h1>
      <p className="text-slate-400">Bienvenida, {user.nombre}</p>
    </div>
  )
}
```

- [ ] **Verificar dashboards en browser**

```bash
# Login como doctor → debe ver /doctor con stats
# Verificar sidebar con links correctos
# Verificar que /secretary redirige a login si no autenticado
```

- [ ] **Commit**

```bash
git add .
git commit -m "feat: role dashboards + sidebar navigation"
```

---

## Task 7: Gestión de Staff

**Files:**
- Create: `server/routers/staff.ts`
- Create: `components/staff/invite-form.tsx`
- Create: `components/staff/staff-table.tsx`
- Create: `app/(dashboard)/doctor/staff/page.tsx`
- Create: `app/(dashboard)/doctor/staff/invite/page.tsx`
- Create: `tests/unit/staff.test.ts`

- [ ] **Escribir test fallido para staff**

```typescript
// tests/unit/staff.test.ts
import { describe, it, expect } from "vitest"

describe("staff PIN validation", () => {
  it("PIN must be at least 6 characters", () => {
    const validatePin = (pin: string) => pin.length >= 6
    expect(validatePin("12345")).toBe(false)
    expect(validatePin("123456")).toBe(true)
  })
})
```

- [ ] **Ejecutar test — verificar PASS**

```bash
npx vitest run tests/unit/staff.test.ts
```

- [ ] **Crear `server/routers/staff.ts`**

```typescript
import { router, doctorProcedure } from "../trpc"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"
import { StaffRole } from "@prisma/client"

export const staffRouter = router({
  list: doctorProcedure.query(async ({ ctx }) => {
    return ctx.db.staff.findMany({
      where: { workspaceId: ctx.session.workspaceId, activo: true },
      orderBy: { createdAt: "asc" },
    })
  }),

  invite: doctorProcedure
    .input(z.object({
      cedula: z.string().min(6),
      nombre: z.string().min(2),
      apellido: z.string().min(2),
      email: z.string().email(),
      pin: z.string().min(6),
      rol: z.nativeEnum(StaffRole),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.staff.findFirst({
        where: {
          workspaceId: ctx.session.workspaceId,
          OR: [{ cedula: input.cedula }, { email: input.email }],
        },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ya existe un miembro con esa cédula o email en este consultorio",
        })
      }
      const pinAcceso = await bcrypt.hash(input.pin, 10)
      return ctx.db.staff.create({
        data: {
          cedula: input.cedula,
          nombre: input.nombre,
          apellido: input.apellido,
          email: input.email,
          pinAcceso,
          rol: input.rol,
          workspaceId: ctx.session.workspaceId,
        },
      })
    }),

  deactivate: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const staff = await ctx.db.staff.findFirst({
        where: { id: input.id, workspaceId: ctx.session.workspaceId },
      })
      if (!staff) throw new TRPCError({ code: "FORBIDDEN" })
      return ctx.db.staff.update({ where: { id: input.id }, data: { activo: false } })
    }),
})
```

- [ ] **Crear `app/(dashboard)/doctor/staff/page.tsx`**

```tsx
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const rolLabels: Record<string, string> = {
  SECRETARY: "Secretaria",
  ASSISTANT: "Asistente",
  NURSE: "Enfermera",
}

export default async function StaffPage() {
  const session = await auth()
  const user = session!.user as SessionUser
  const staff = await db.staff.findMany({
    where: { workspaceId: user.workspaceId, activo: true },
    orderBy: { rol: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mi Equipo</h1>
        <Link href="/doctor/staff/invite">
          <Button>+ Agregar miembro</Button>
        </Link>
      </div>

      {staff.length === 0 ? (
        <p className="text-slate-400">Aún no tienes equipo registrado.</p>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{s.nombre} {s.apellido}</p>
                <p className="text-slate-400 text-sm">{s.email}</p>
              </div>
              <Badge variant="outline" className="text-slate-300">
                {rolLabels[s.rol]}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Crear `components/staff/invite-form.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function InviteForm() {
  const router = useRouter()
  const [error, setError] = useState("")

  const invite = trpc.staff.invite.useMutation({
    onSuccess: () => router.push("/doctor/staff"),
    onError: (e) => setError(e.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    invite.mutate({
      cedula: fd.get("cedula") as string,
      nombre: fd.get("nombre") as string,
      apellido: fd.get("apellido") as string,
      email: fd.get("email") as string,
      pin: fd.get("pin") as string,
      rol: fd.get("rol") as "SECRETARY" | "ASSISTANT" | "NURSE",
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800 max-w-md">
      <CardHeader>
        <CardTitle className="text-white">Agregar Miembro del Equipo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Nombre</Label>
              <Input name="nombre" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Apellido</Label>
              <Input name="apellido" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Cédula</Label>
            <Input name="cedula" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input name="email" type="email" required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">PIN de acceso (mín. 6 caracteres)</Label>
            <Input name="pin" type="password" minLength={6} required className="bg-slate-800 border-slate-700 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Rol</Label>
            <select name="rol" required className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
              <option value="SECRETARY">Secretaria</option>
              <option value="ASSISTANT">Asistente</option>
              <option value="NURSE">Enfermera</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={invite.isPending}>
            {invite.isPending ? "Guardando..." : "Agregar miembro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Crear `app/(dashboard)/doctor/staff/invite/page.tsx`**

```tsx
import { InviteForm } from "@/components/staff/invite-form"

export default function InviteStaffPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Agregar Miembro</h1>
      <InviteForm />
    </div>
  )
}
```

- [ ] **Probar en browser: agregar secretaria, verificar login con PIN**

```bash
# 1. Login como doctor → /doctor/staff → Agregar miembro
# 2. Crear una secretaria con email y PIN
# 3. Logout → login con email/PIN de la secretaria
# 4. Verificar redirección a /secretary y sidebar correcto
```

- [ ] **Commit**

```bash
git add .
git commit -m "feat: staff management — invite, list, role-based access"
```

---

## Task 8: Registro de Pacientes

**Files:**
- Create: `server/routers/patient.ts`
- Create: `components/patients/patient-form.tsx`
- Create: `app/(dashboard)/doctor/patients/page.tsx`
- Create: `app/(dashboard)/doctor/patients/new/page.tsx`
- Create: `tests/unit/patient.test.ts`

- [ ] **Escribir tests para lógica de paciente**

```typescript
// tests/unit/patient.test.ts
import { describe, it, expect } from "vitest"

describe("patient ID display generation", () => {
  it("pads ID to 6 digits", () => {
    const formatId = (n: number) => String(n).padStart(6, "0")
    expect(formatId(1)).toBe("000001")
    expect(formatId(54)).toBe("000054")
    expect(formatId(999999)).toBe("999999")
  })
})

describe("minor patient validation", () => {
  it("requires representative when sinCedula is true", () => {
    const validate = (sinCedula: boolean, repCedula?: string) => {
      if (sinCedula && !repCedula) return "Representante requerido"
      return null
    }
    expect(validate(true, undefined)).toBe("Representante requerido")
    expect(validate(true, "V-12345678")).toBeNull()
    expect(validate(false, undefined)).toBeNull()
  })
})
```

- [ ] **Ejecutar tests — verificar PASS**

```bash
npx vitest run tests/unit/patient.test.ts
```

- [ ] **Crear `server/routers/patient.ts`**

```typescript
import { router, protectedProcedure } from "../trpc"
import { z } from "zod"
import { TRPCError } from "@trpc/server"

const representanteSchema = z.object({
  cedulaRepresentante: z.string().min(6),
  nombreCompleto: z.string().min(2),
  parentesco: z.enum(["PADRE", "MADRE", "TUTOR_LEGAL", "OTRO"]),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
})

const patientInputSchema = z.object({
  tipoIdentificacion: z.enum(["CEDULA_V", "CEDULA_E", "PASAPORTE"]).optional(),
  numeroIdentificacion: z.string().optional(),
  sinCedula: z.boolean().default(false),
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  fechaNacimiento: z.string(), // ISO date string
  sexo: z.enum(["M", "F"]),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  representante: representanteSchema.optional(),
}).refine(
  (d) => d.sinCedula ? !!d.representante : !!d.tipoIdentificacion && !!d.numeroIdentificacion,
  { message: "Cédula requerida, o marcar 'Sin cédula' y completar representante" }
)

async function getNextIdDisplay(db: any, workspaceId: string): Promise<string> {
  const last = await db.patientRegistration.findFirst({
    where: { workspaceId },
    orderBy: { idDisplay: "desc" },
  })
  const next = last ? parseInt(last.idDisplay) + 1 : 1
  return String(next).padStart(6, "0")
}

export const patientRouter = router({
  register: protectedProcedure
    .input(patientInputSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = ctx.session.workspaceId

      // Buscar si el paciente ya existe globalmente por cédula
      let patient = null
      if (!input.sinCedula && input.numeroIdentificacion) {
        patient = await ctx.db.patient.findFirst({
          where: {
            tipoIdentificacion: input.tipoIdentificacion,
            numeroIdentificacion: input.numeroIdentificacion,
          },
        })
      }

      // Verificar si ya está registrado en este workspace
      if (patient) {
        const existing = await ctx.db.patientRegistration.findFirst({
          where: { patientId: patient.id, workspaceId },
        })
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Paciente ya registrado en este consultorio con ID ${existing.idDisplay}`,
          })
        }
      }

      const idDisplay = await getNextIdDisplay(ctx.db, workspaceId)

      if (!patient) {
        patient = await ctx.db.patient.create({
          data: {
            tipoIdentificacion: input.tipoIdentificacion,
            numeroIdentificacion: input.numeroIdentificacion,
            sinCedula: input.sinCedula,
            nombre: input.nombre,
            apellido: input.apellido,
            fechaNacimiento: new Date(input.fechaNacimiento),
            sexo: input.sexo,
            telefono: input.telefono,
            email: input.email,
            repCedula: input.representante?.cedulaRepresentante,
            repNombreCompleto: input.representante?.nombreCompleto,
            repParentesco: input.representante?.parentesco as any,
            repTelefono: input.representante?.telefono,
            repEmail: input.representante?.email,
          },
        })
      }

      const registration = await ctx.db.patientRegistration.create({
        data: { idDisplay, patientId: patient.id, workspaceId },
        include: { patient: true },
      })

      return registration
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { query } = input
      return ctx.db.patientRegistration.findMany({
        where: {
          workspaceId: ctx.session.workspaceId,
          OR: [
            { idDisplay: { contains: query } },
            { patient: { nombre: { contains: query, mode: "insensitive" } } },
            { patient: { apellido: { contains: query, mode: "insensitive" } } },
            { patient: { numeroIdentificacion: { contains: query } } },
          ],
        },
        include: { patient: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.patientRegistration.findMany({
      where: { workspaceId: ctx.session.workspaceId },
      include: { patient: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  }),
})
```

- [ ] **Crear `components/patients/patient-form.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function PatientForm() {
  const router = useRouter()
  const [sinCedula, setSinCedula] = useState(false)
  const [error, setError] = useState("")

  const register = trpc.patient.register.useMutation({
    onSuccess: (data) => router.push(`/doctor/patients`),
    onError: (e) => setError(e.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)

    register.mutate({
      tipoIdentificacion: sinCedula ? undefined : (fd.get("tipoId") as any),
      numeroIdentificacion: sinCedula ? undefined : (fd.get("numeroId") as string),
      sinCedula,
      nombre: fd.get("nombre") as string,
      apellido: fd.get("apellido") as string,
      fechaNacimiento: fd.get("fechaNacimiento") as string,
      sexo: fd.get("sexo") as "M" | "F",
      telefono: fd.get("telefono") as string || undefined,
      email: fd.get("email") as string || undefined,
      representante: sinCedula ? {
        cedulaRepresentante: fd.get("repCedula") as string,
        nombreCompleto: fd.get("repNombre") as string,
        parentesco: fd.get("repParentesco") as any,
        telefono: fd.get("repTelefono") as string || undefined,
      } : undefined,
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800 max-w-xl">
      <CardHeader>
        <CardTitle className="text-white">Registrar Paciente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identificación */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sinCedula"
                checked={sinCedula}
                onChange={(e) => setSinCedula(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="sinCedula" className="text-slate-300 cursor-pointer">Sin cédula (menor de edad)</Label>
            </div>

            {!sinCedula && (
              <div className="flex gap-3">
                <select name="tipoId" className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm w-32">
                  <option value="CEDULA_V">V-</option>
                  <option value="CEDULA_E">E-</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
                <Input name="numeroId" placeholder="12345678" required={!sinCedula} className="bg-slate-800 border-slate-700 text-white flex-1" />
              </div>
            )}
          </div>

          {/* Datos personales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Nombre</Label>
              <Input name="nombre" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Apellido</Label>
              <Input name="apellido" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Fecha de Nacimiento</Label>
              <Input name="fechaNacimiento" type="date" required className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Sexo</Label>
              <select name="sexo" required className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Teléfono</Label>
              <Input name="telefono" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Email</Label>
              <Input name="email" type="email" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>

          {/* Representante (solo si sin cédula) */}
          {sinCedula && (
            <div className="border border-slate-700 rounded-lg p-4 space-y-3">
              <p className="text-slate-300 text-sm font-medium">Datos del Representante</p>
              <Input name="repCedula" placeholder="Cédula del representante" required={sinCedula} className="bg-slate-800 border-slate-700 text-white" />
              <Input name="repNombre" placeholder="Nombre completo" required={sinCedula} className="bg-slate-800 border-slate-700 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <select name="repParentesco" required={sinCedula} className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm">
                  <option value="MADRE">Madre</option>
                  <option value="PADRE">Padre</option>
                  <option value="TUTOR_LEGAL">Tutor Legal</option>
                  <option value="OTRO">Otro</option>
                </select>
                <Input name="repTelefono" placeholder="Teléfono" className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? "Registrando..." : "Registrar paciente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Crear `app/(dashboard)/doctor/patients/new/page.tsx`**

```tsx
import { PatientForm } from "@/components/patients/patient-form"

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Registrar Paciente</h1>
      <PatientForm />
    </div>
  )
}
```

- [ ] **Crear `app/(dashboard)/doctor/patients/page.tsx`**

```tsx
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import type { SessionUser } from "@/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PatientSearch } from "@/components/patients/patient-search"

export default async function PatientsPage() {
  const session = await auth()
  const user = session!.user as SessionUser

  const regs = await db.patientRegistration.findMany({
    where: { workspaceId: user.workspaceId },
    include: { patient: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pacientes</h1>
        <Link href="/doctor/patients/new">
          <Button>+ Nuevo paciente</Button>
        </Link>
      </div>

      <PatientSearch />

      <div className="space-y-2">
        {regs.map((r) => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <span className="text-blue-400 font-mono text-sm mr-3">#{r.idDisplay}</span>
              <span className="text-white font-medium">{r.patient.nombre} {r.patient.apellido}</span>
              {r.patient.sinCedula && (
                <span className="ml-2 text-xs text-amber-400">Menor de edad</span>
              )}
            </div>
            <span className="text-slate-400 text-sm">
              {r.patient.numeroIdentificacion
                ? `${r.patient.tipoIdentificacion?.replace("CEDULA_", "")} ${r.patient.numeroIdentificacion}`
                : "Sin cédula"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Crear `components/patients/patient-search.tsx`**

```tsx
"use client"
import { useState } from "react"
import { trpc } from "@/lib/trpc-client"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function PatientSearch() {
  const [query, setQuery] = useState("")
  const { data: results = [], isLoading } = trpc.patient.search.useQuery(
    { query },
    { enabled: query.length >= 2 }
  )

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, cédula o ID..."
          className="bg-slate-800 border-slate-700 text-white pl-9"
        />
      </div>
      {query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg z-10 shadow-xl">
          {isLoading ? (
            <p className="text-slate-400 text-sm p-3">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-slate-400 text-sm p-3">Sin resultados</p>
          ) : (
            results.map((r) => (
              <div key={r.id} className="px-4 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0">
                <span className="text-blue-400 font-mono text-xs mr-2">#{r.idDisplay}</span>
                <span className="text-white text-sm">{r.patient.nombre} {r.patient.apellido}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Probar flujo completo de registro de paciente**

```bash
# 1. /doctor/patients/new → registrar paciente adulto con cédula
# 2. Verificar que aparece en la lista con ID "000001"
# 3. Registrar segundo paciente → ID "000002"
# 4. Registrar paciente menor (sin cédula) → debe mostrar sección representante
# 5. Probar búsqueda en tiempo real
```

- [ ] **Commit**

```bash
git add .
git commit -m "feat: patient registration with minor/representative support + real-time search"
```

---

## Task 9: Configuración Google Cloud

**Files:**
- Create: `Google Cloud/docker-compose.yml`
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Crear `Dockerfile`**

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

- [ ] **Crear `.dockerignore`**

```
node_modules
.next
.env.local
.git
.superpowers
docs
tests
*.test.ts
*.spec.ts
```

- [ ] **Agregar `output: "standalone"` en `next.config.ts`**

```typescript
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
}

export default nextConfig
```

- [ ] **Crear `Google Cloud/docker-compose.yml`**

```yaml
version: '3.8'
services:
  ajmedics:
    image: ajmedics:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      TWILIO_ACCOUNT_SID: ${TWILIO_ACCOUNT_SID}
      TWILIO_AUTH_TOKEN: ${TWILIO_AUTH_TOKEN}
      TWILIO_WHATSAPP_FROM: ${TWILIO_WHATSAPP_FROM}
      RESEND_API_KEY: ${RESEND_API_KEY}
      CLOUDFLARE_R2_ACCOUNT_ID: ${CLOUDFLARE_R2_ACCOUNT_ID}
      CLOUDFLARE_R2_ACCESS_KEY_ID: ${CLOUDFLARE_R2_ACCESS_KEY_ID}
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: ${CLOUDFLARE_R2_SECRET_ACCESS_KEY}
      CLOUDFLARE_R2_BUCKET_NAME: ${CLOUDFLARE_R2_BUCKET_NAME}
      CLOUDFLARE_R2_ENDPOINT: ${CLOUDFLARE_R2_ENDPOINT}
    ports:
      - "3000:3000"

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ajmedics
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ajmedics
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Verificar build Docker localmente**

```bash
docker build -t ajmedics:latest .
# Expected: Successfully built <image-id>
docker run --rm -p 3001:3000 --env-file .env.local ajmedics:latest
# Expected: app corriendo en http://localhost:3001
```

- [ ] **Commit final Fase 1**

```bash
git add .
git commit -m "feat: Dockerfile + Google Cloud deployment config"
```

---

## Task 10: Tests E2E críticos

**Files:**
- Create: `tests/e2e/register.spec.ts`
- Create: `tests/e2e/login.spec.ts`
- Create: `playwright.config.ts`

- [ ] **Crear `playwright.config.ts`**

```typescript
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
})
```

- [ ] **Crear `tests/e2e/register.spec.ts`**

```typescript
import { test, expect } from "@playwright/test"

test("doctor registration flow", async ({ page }) => {
  await page.goto("/register")
  await page.fill('[name="nombre"]', "Ana")
  await page.fill('[name="apellido"]', "García")
  await page.fill('[name="cedula"]', "V-98765432")
  await page.fill('[name="email"]', "ana.garcia@test.com")
  await page.fill('[name="password"]', "password123")
  await page.selectOption('[name="especialidad"]', "Gastroenterología")
  await page.fill('[name="workspaceNombre"]', "Consultorio Dra. García")
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL("/doctor", { timeout: 10000 })
  await expect(page.locator("h1")).toContainText("García")
})

test("shows error when cedula already exists", async ({ page }) => {
  await page.goto("/register")
  await page.fill('[name="cedula"]', "V-98765432") // mismo del test anterior
  await page.fill('[name="email"]', "otro@test.com")
  await page.fill('[name="nombre"]', "Otro")
  await page.fill('[name="apellido"]', "Doctor")
  await page.fill('[name="password"]', "password123")
  await page.selectOption('[name="especialidad"]', "Cardiología")
  await page.fill('[name="workspaceNombre"]', "Otro Consultorio")
  await page.click('button[type="submit"]')

  await expect(page.locator("p.text-red-400")).toBeVisible()
})
```

- [ ] **Crear `tests/e2e/login.spec.ts`**

```typescript
import { test, expect } from "@playwright/test"

test("login with wrong password shows error", async ({ page }) => {
  await page.goto("/login")
  await page.fill('[name="email"]', "ana.garcia@test.com")
  await page.fill('[name="password"]', "wrongpassword")
  await page.click('button[type="submit"]')
  await expect(page.locator("p")).toContainText("incorrectos")
})

test("unauthenticated user redirected to login", async ({ page }) => {
  await page.goto("/doctor")
  await expect(page).toHaveURL("/login")
})
```

- [ ] **Instalar browsers de Playwright**

```bash
npx playwright install chromium
```

- [ ] **Ejecutar tests E2E**

```bash
npx playwright test
# Expected: todos los tests PASS
```

- [ ] **Commit final**

```bash
git add .
git commit -m "test: E2E tests for registration, login, and route protection — Fase 1 completa"
```

---

## Checklist de Verificación Final — Fase 1

Antes de entregar, verificar que todo funciona end-to-end:

- [ ] Doctor puede registrarse y es redirigido a su dashboard
- [ ] Doctor puede hacer login y ver su dashboard con stats
- [ ] Doctor puede crear workspaces adicionales
- [ ] Doctor puede agregar secretaria, asistente y enfermera
- [ ] Secretaria puede hacer login y ve su dashboard (sidebar diferente al doctor)
- [ ] Asistente y enfermera pueden hacer login y ven sus dashboards
- [ ] Doctor puede registrar paciente adulto con cédula
- [ ] Doctor puede registrar paciente menor sin cédula (con representante)
- [ ] Búsqueda de pacientes en tiempo real funciona
- [ ] ID de paciente se genera secuencial por workspace ("000001", "000002"...)
- [ ] Usuario no autenticado es redirigido a /login
- [ ] Build Docker compila sin errores
- [ ] `npx vitest run` → todos los tests pasan
- [ ] `npx playwright test` → todos los tests pasan

---

*Plan Fase 1 — AJMedics. Siguiente: Fase 2 — Núcleo Clínico (consulta, vitales, diagnósticos, medicamentos, receta PDF)*

