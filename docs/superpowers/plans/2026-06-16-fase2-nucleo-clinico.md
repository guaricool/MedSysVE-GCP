# AJMedics Fase 2 — Núcleo Clínico

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el núcleo clínico completo: consulta médica, signos vitales, diagnósticos ICD-10, medicamentos con autocomplete Redis, receta PDF, informe médico con IA, reposo, órdenes de laboratorio/imagen, firma de consulta y portal básico del paciente.

**Architecture:** Single-page vertical encounter layout (no tabs). Dynamic document headers (clinic vs doctor-only). Encounter lifecycle: DRAFT → SIGNED → AMENDED. All clinical data scoped to workspaceId.

**Tech Stack additions:** @react-pdf/renderer (PDF generation), @anthropic-ai/sdk (AI drafts), ioredis sorted sets (medication autocomplete), ts-node (seed scripts)

---

## Pre-flight (run once before Task 1)

- [ ] Read `node_modules/next/dist/docs/` for the breaking-change notes (this is NOT the Next.js you know).
- [ ] Install new dependencies:

```bash
npm install @react-pdf/renderer @anthropic-ai/sdk ioredis
npm install -D ts-node @types/node
```

- [ ] Confirm env vars present in `.env`:

```
DATABASE_URL=...
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=...
```

- [ ] Confirm `lib/redis.ts` exists exporting a shared ioredis client. If not, create it:

```ts
// lib/redis.ts
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
```

---

## Task 1: Schema Prisma — Encounter + Clinical models

**Files:**
- `prisma/schema.prisma` (edit)
- migration generated under `prisma/migrations/`

- [ ] Append the following models to `prisma/schema.prisma`. Adjust `@@map`/relation names to match existing conventions in the file before saving.

```prisma
// ---------------------------------------------------------------------------
// FASE 2 — Núcleo Clínico
// ---------------------------------------------------------------------------

enum EncounterStatus {
  DRAFT
  SIGNED
  AMENDED
}

enum DiagnosisTipo {
  PRINCIPAL
  SECUNDARIO
}

enum DocumentTipo {
  INFORME
  REPOSO
  REFERIDO
  CERTIFICADO
  RECETA
}

model Encounter {
  id                     String          @id @default(cuid())
  workspaceId            String
  patientRegistrationId  String
  doctorId               String

  motivo                 String?
  anamnesis              String?         @db.Text
  vitales                Json?
  examenFisico           Json?

  status                 EncounterStatus @default(DRAFT)
  signedAt               DateTime?
  signedBy               String?

  createdAt              DateTime        @default(now())
  updatedAt              DateTime        @updatedAt

  workspace              Workspace            @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  patientRegistration    PatientRegistration  @relation(fields: [patientRegistrationId], references: [id], onDelete: Cascade)

  diagnoses              Diagnosis[]
  prescriptions          Prescription[]
  labOrders              LabOrder[]
  imagingOrders          ImagingOrder[]
  documents              Document[]

  @@index([workspaceId])
  @@index([patientRegistrationId])
  @@index([doctorId])
}

model Diagnosis {
  id          String        @id @default(cuid())
  encounterId String
  codigoCie10 String
  descripcion String
  tipo        DiagnosisTipo @default(PRINCIPAL)
  createdAt   DateTime      @default(now())

  encounter   Encounter     @relation(fields: [encounterId], references: [id], onDelete: Cascade)

  @@index([encounterId])
}

model Medication {
  id                 String   @id @default(cuid())
  nombreGenerico     String
  nombresComerciales String[]
  concentraciones    String[]
  formaFarmaceutica  String
  viaAdministracion  String
  dosisDefaults      Json?
  categoria          String
  isCustom           Boolean  @default(false)
  activo             Boolean  @default(true)
  workspaceId        String?
  createdAt          DateTime @default(now())

  prescriptionItems  PrescriptionItem[]

  @@index([nombreGenerico])
  @@index([categoria])
  @@index([workspaceId])
}

model Prescription {
  id          String   @id @default(cuid())
  encounterId String
  pdfUrl      String?
  impresa     Boolean  @default(false)
  createdAt   DateTime @default(now())

  encounter   Encounter          @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  items       PrescriptionItem[]

  @@index([encounterId])
}

model PrescriptionItem {
  id                   String       @id @default(cuid())
  prescriptionId       String
  medicationId         String
  concentracion        String
  dosis                String
  frecuencia           String
  duracion             String
  indicacionesEspeciales String?
  overrideAlerta       Boolean      @default(false)

  prescription         Prescription @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medication           Medication   @relation(fields: [medicationId], references: [id])

  @@index([prescriptionId])
  @@index([medicationId])
}

model LabOrder {
  id                  String   @id @default(cuid())
  encounterId         String
  estudios            String[]
  indicacionesClinicas String?
  urgente             Boolean  @default(false)
  pdfUrl              String?
  createdAt           DateTime @default(now())

  encounter           Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)

  @@index([encounterId])
}

model ImagingOrder {
  id                  String   @id @default(cuid())
  encounterId         String
  tipoImagen          String
  region              String
  indicacionesClinicas String?
  urgente             Boolean  @default(false)
  pdfUrl              String?
  createdAt           DateTime @default(now())

  encounter           Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)

  @@index([encounterId])
}

model Document {
  id                    String       @id @default(cuid())
  encounterId           String?
  patientRegistrationId String
  tipo                  DocumentTipo
  contenidoHtml         String       @db.Text
  aiDraft               String?      @db.Text
  pdfUrl                String?
  firmadoAt             DateTime?
  firmadoPor            String?
  visibleEnPortal       Boolean      @default(false)
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  encounter             Encounter?           @relation(fields: [encounterId], references: [id], onDelete: SetNull)
  patientRegistration   PatientRegistration  @relation(fields: [patientRegistrationId], references: [id], onDelete: Cascade)

  @@index([encounterId])
  @@index([patientRegistrationId])
}
```

- [ ] Add the back-relations to the existing models (find them in the file and insert these lines inside the model bodies):

```prisma
model PatientRegistration {
  // ... existing fields ...
  encounters Encounter[]
  documents  Document[]
}

model Workspace {
  // ... existing fields ...
  encounters Encounter[]
}
```

- [ ] Run the migration:

```bash
npx prisma migrate dev --name add_clinical_models
npx prisma generate
```

- [ ] Type check:

```bash
npx tsc --noEmit
```

- [ ] Vitest unit test for the IMC helper used later (create the helper now so the schema PR has a test):

`lib/clinical/__tests__/imc.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { calcularImc, clasificarImc } from '../imc';

describe('calcularImc', () => {
  it('calculates BMI from kg and cm', () => {
    expect(calcularImc(70, 170)).toBeCloseTo(24.22, 1);
  });
  it('returns null for invalid input', () => {
    expect(calcularImc(0, 170)).toBeNull();
    expect(calcularImc(70, 0)).toBeNull();
  });
});

describe('clasificarImc', () => {
  it('classifies categories', () => {
    expect(clasificarImc(17)).toBe('Bajo peso');
    expect(clasificarImc(22)).toBe('Normal');
    expect(clasificarImc(27)).toBe('Sobrepeso');
    expect(clasificarImc(32)).toBe('Obesidad');
  });
});
```

`lib/clinical/imc.ts`

```ts
export function calcularImc(pesoKg: number, tallaCm: number): number | null {
  if (!pesoKg || !tallaCm || pesoKg <= 0 || tallaCm <= 0) return null;
  const m = tallaCm / 100;
  return Math.round((pesoKg / (m * m)) * 100) / 100;
}

export function clasificarImc(imc: number): string {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}
```

```bash
npx vitest run lib/clinical
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(schema): add clinical models (encounter, diagnosis, medication, prescription, orders, document)"
```

---

## Task 2: Seed medicamentos (1000 Venezuelan medications + Redis)

**Files:**
- `prisma/data/medications-ve.ts` (full 1000-entry array)
- `prisma/seed-medications.ts`
- `lib/medications-redis.ts`
- `server/routers/medication.ts`
- `server/routers/_app.ts` (edit)
- `package.json` (edit — add prisma.seed)
- `lib/medications-redis.test.ts`

- [ ] Create `prisma/data/medications-ve.ts`. Below are 50 fully-specified real Venezuelan medications. The remaining ~950 entries follow the same shape — generate them programmatically from common Venezuelan formulary categories (antibióticos, AINEs, antihipertensivos, antidiabéticos, hipolipemiantes, gastrointestinales, antihistamínicos, broncodilatadores, psicotrópicos, analgésicos, corticoides, etc.) and append to the array. Keep the type identical.

```ts
// prisma/data/medications-ve.ts
export interface SeedMedication {
  nombreGenerico: string;
  nombresComerciales: string[];
  concentraciones: string[];
  formaFarmaceutica: string;
  viaAdministracion: string;
  dosisDefaults?: { adulto?: string; pediatrico?: string };
  categoria: string;
}

export const medicationsVE: SeedMedication[] = [
  { nombreGenerico: 'Amoxicilina', nombresComerciales: ['Amoxil', 'Trimox'], concentraciones: ['250 mg', '500 mg', '875 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/8h', pediatrico: '40 mg/kg/día' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Amoxicilina + Ácido Clavulánico', nombresComerciales: ['Augmentin', 'Clavulin'], concentraciones: ['500/125 mg', '875/125 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '875/125 mg c/12h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Azitromicina', nombresComerciales: ['Zithromax', 'Azitrocin'], concentraciones: ['250 mg', '500 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/24h x 3 días' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Cefalexina', nombresComerciales: ['Keflex'], concentraciones: ['500 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/6h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Ciprofloxacina', nombresComerciales: ['Cipro', 'Ciproxina'], concentraciones: ['250 mg', '500 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/12h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Claritromicina', nombresComerciales: ['Klaricid'], concentraciones: ['250 mg', '500 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/12h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Doxiciclina', nombresComerciales: ['Vibramicina'], concentraciones: ['100 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '100 mg c/12h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Trimetoprima + Sulfametoxazol', nombresComerciales: ['Bactrim', 'Septrin'], concentraciones: ['160/800 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '160/800 mg c/12h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Metronidazol', nombresComerciales: ['Flagyl'], concentraciones: ['250 mg', '500 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/8h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Nitrofurantoína', nombresComerciales: ['Macrodantina'], concentraciones: ['100 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '100 mg c/12h' }, categoria: 'Antibiótico' },
  { nombreGenerico: 'Ibuprofeno', nombresComerciales: ['Advil', 'Motrin'], concentraciones: ['400 mg', '600 mg', '800 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '400 mg c/8h', pediatrico: '10 mg/kg c/8h' }, categoria: 'AINE' },
  { nombreGenerico: 'Diclofenac', nombresComerciales: ['Voltaren', 'Cataflam'], concentraciones: ['50 mg', '75 mg', '100 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '50 mg c/8h' }, categoria: 'AINE' },
  { nombreGenerico: 'Ketoprofeno', nombresComerciales: ['Profenid'], concentraciones: ['100 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '100 mg c/12h' }, categoria: 'AINE' },
  { nombreGenerico: 'Naproxeno', nombresComerciales: ['Naprosyn', 'Flanax'], concentraciones: ['250 mg', '500 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/12h' }, categoria: 'AINE' },
  { nombreGenerico: 'Meloxicam', nombresComerciales: ['Mobic'], concentraciones: ['7.5 mg', '15 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '15 mg c/24h' }, categoria: 'AINE' },
  { nombreGenerico: 'Acetaminofén', nombresComerciales: ['Atamel', 'Tylenol'], concentraciones: ['500 mg', '650 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '500 mg c/6h', pediatrico: '15 mg/kg c/6h' }, categoria: 'Analgésico' },
  { nombreGenerico: 'Tramadol', nombresComerciales: ['Tramal'], concentraciones: ['50 mg', '100 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '50 mg c/8h' }, categoria: 'Analgésico' },
  { nombreGenerico: 'Ácido Acetilsalicílico', nombresComerciales: ['Aspirina'], concentraciones: ['100 mg', '500 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '100 mg c/24h' }, categoria: 'Antiagregante' },
  { nombreGenerico: 'Metformina', nombresComerciales: ['Glucophage', 'Glafornil'], concentraciones: ['500 mg', '850 mg', '1000 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '850 mg c/12h' }, categoria: 'Antidiabético' },
  { nombreGenerico: 'Glibenclamida', nombresComerciales: ['Daonil', 'Euglucon'], concentraciones: ['5 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '5 mg c/24h' }, categoria: 'Antidiabético' },
  { nombreGenerico: 'Glimepirida', nombresComerciales: ['Amaryl'], concentraciones: ['2 mg', '4 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '2 mg c/24h' }, categoria: 'Antidiabético' },
  { nombreGenerico: 'Sitagliptina', nombresComerciales: ['Januvia'], concentraciones: ['50 mg', '100 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '100 mg c/24h' }, categoria: 'Antidiabético' },
  { nombreGenerico: 'Insulina NPH', nombresComerciales: ['Insulatard', 'Humulin N'], concentraciones: ['100 UI/mL'], formaFarmaceutica: 'Suspensión inyectable', viaAdministracion: 'Subcutánea', categoria: 'Antidiabético' },
  { nombreGenerico: 'Insulina Glargina', nombresComerciales: ['Lantus'], concentraciones: ['100 UI/mL'], formaFarmaceutica: 'Solución inyectable', viaAdministracion: 'Subcutánea', categoria: 'Antidiabético' },
  { nombreGenerico: 'Enalapril', nombresComerciales: ['Renitec'], concentraciones: ['5 mg', '10 mg', '20 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '10 mg c/12h' }, categoria: 'Antihipertensivo' },
  { nombreGenerico: 'Lisinopril', nombresComerciales: ['Zestril'], concentraciones: ['10 mg', '20 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '10 mg c/24h' }, categoria: 'Antihipertensivo' },
  { nombreGenerico: 'Losartán', nombresComerciales: ['Cozaar'], concentraciones: ['50 mg', '100 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '50 mg c/24h' }, categoria: 'Antihipertensivo' },
  { nombreGenerico: 'Valsartán', nombresComerciales: ['Diovan'], concentraciones: ['80 mg', '160 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '160 mg c/24h' }, categoria: 'Antihipertensivo' },
  { nombreGenerico: 'Amlodipina', nombresComerciales: ['Norvasc'], concentraciones: ['5 mg', '10 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '5 mg c/24h' }, categoria: 'Antihipertensivo' },
  { nombreGenerico: 'Nifedipina', nombresComerciales: ['Adalat'], concentraciones: ['10 mg', '30 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '30 mg c/24h' }, categoria: 'Antihipertensivo' },
  { nombreGenerico: 'Hidroclorotiazida', nombresComerciales: ['Hidrenox'], concentraciones: ['25 mg', '50 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '25 mg c/24h' }, categoria: 'Diurético' },
  { nombreGenerico: 'Furosemida', nombresComerciales: ['Lasix'], concentraciones: ['40 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '40 mg c/24h' }, categoria: 'Diurético' },
  { nombreGenerico: 'Espironolactona', nombresComerciales: ['Aldactone'], concentraciones: ['25 mg', '100 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '25 mg c/24h' }, categoria: 'Diurético' },
  { nombreGenerico: 'Atenolol', nombresComerciales: ['Tenormin'], concentraciones: ['50 mg', '100 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '50 mg c/24h' }, categoria: 'Betabloqueante' },
  { nombreGenerico: 'Metoprolol', nombresComerciales: ['Betaloc', 'Lopresor'], concentraciones: ['50 mg', '100 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '50 mg c/12h' }, categoria: 'Betabloqueante' },
  { nombreGenerico: 'Carvedilol', nombresComerciales: ['Dilatrend'], concentraciones: ['6.25 mg', '12.5 mg', '25 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '12.5 mg c/12h' }, categoria: 'Betabloqueante' },
  { nombreGenerico: 'Atorvastatina', nombresComerciales: ['Lipitor'], concentraciones: ['10 mg', '20 mg', '40 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '20 mg c/24h' }, categoria: 'Hipolipemiante' },
  { nombreGenerico: 'Rosuvastatina', nombresComerciales: ['Crestor'], concentraciones: ['10 mg', '20 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '10 mg c/24h' }, categoria: 'Hipolipemiante' },
  { nombreGenerico: 'Simvastatina', nombresComerciales: ['Zocor'], concentraciones: ['20 mg', '40 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '20 mg c/24h' }, categoria: 'Hipolipemiante' },
  { nombreGenerico: 'Omeprazol', nombresComerciales: ['Losec', 'Prilosec'], concentraciones: ['20 mg', '40 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '20 mg c/24h' }, categoria: 'Gastrointestinal' },
  { nombreGenerico: 'Esomeprazol', nombresComerciales: ['Nexium'], concentraciones: ['20 mg', '40 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '40 mg c/24h' }, categoria: 'Gastrointestinal' },
  { nombreGenerico: 'Pantoprazol', nombresComerciales: ['Pantozol'], concentraciones: ['40 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '40 mg c/24h' }, categoria: 'Gastrointestinal' },
  { nombreGenerico: 'Ranitidina', nombresComerciales: ['Zantac'], concentraciones: ['150 mg', '300 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '150 mg c/12h' }, categoria: 'Gastrointestinal' },
  { nombreGenerico: 'Metoclopramida', nombresComerciales: ['Primperan'], concentraciones: ['10 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '10 mg c/8h' }, categoria: 'Gastrointestinal' },
  { nombreGenerico: 'Loperamida', nombresComerciales: ['Imodium'], concentraciones: ['2 mg'], formaFarmaceutica: 'Cápsula', viaAdministracion: 'Oral', dosisDefaults: { adulto: '2 mg post deposición' }, categoria: 'Gastrointestinal' },
  { nombreGenerico: 'Loratadina', nombresComerciales: ['Clarityne'], concentraciones: ['10 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '10 mg c/24h' }, categoria: 'Antihistamínico' },
  { nombreGenerico: 'Cetirizina', nombresComerciales: ['Zyrtec'], concentraciones: ['10 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '10 mg c/24h' }, categoria: 'Antihistamínico' },
  { nombreGenerico: 'Salbutamol', nombresComerciales: ['Ventolin'], concentraciones: ['100 mcg/dosis'], formaFarmaceutica: 'Inhalador', viaAdministracion: 'Inhalatoria', dosisDefaults: { adulto: '2 puff c/6h' }, categoria: 'Broncodilatador' },
  { nombreGenerico: 'Budesonida + Formoterol', nombresComerciales: ['Symbicort'], concentraciones: ['160/4.5 mcg'], formaFarmaceutica: 'Inhalador', viaAdministracion: 'Inhalatoria', dosisDefaults: { adulto: '1 puff c/12h' }, categoria: 'Broncodilatador' },
  { nombreGenerico: 'Prednisona', nombresComerciales: ['Meticorten'], concentraciones: ['5 mg', '20 mg', '50 mg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '20 mg c/24h' }, categoria: 'Corticoide' },
  { nombreGenerico: 'Levotiroxina', nombresComerciales: ['Eutirox', 'Synthroid'], concentraciones: ['50 mcg', '100 mcg'], formaFarmaceutica: 'Tableta', viaAdministracion: 'Oral', dosisDefaults: { adulto: '50 mcg c/24h en ayunas' }, categoria: 'Hormonal' },
  // ... append ~950 more entries following the same SeedMedication shape ...
];
```

- [ ] Create `prisma/seed-medications.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import { medicationsVE } from './data/medications-ve';
import { loadMedicationsIntoRedis } from '../lib/medications-redis';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${medicationsVE.length} medications...`);
  for (const m of medicationsVE) {
    await prisma.medication.upsert({
      where: { id: `seed_${m.nombreGenerico.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` },
      update: {},
      create: {
        id: `seed_${m.nombreGenerico.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        nombreGenerico: m.nombreGenerico,
        nombresComerciales: m.nombresComerciales,
        concentraciones: m.concentraciones,
        formaFarmaceutica: m.formaFarmaceutica,
        viaAdministracion: m.viaAdministracion,
        dosisDefaults: m.dosisDefaults ?? undefined,
        categoria: m.categoria,
        isCustom: false,
        activo: true,
      },
    });
  }

  const all = await prisma.medication.findMany({ where: { activo: true } });
  await loadMedicationsIntoRedis(
    all.map((x) => ({
      id: x.id,
      nombreGenerico: x.nombreGenerico,
      nombresComerciales: x.nombresComerciales,
      concentraciones: x.concentraciones,
      categoria: x.categoria,
    })),
  );
  console.log('Loaded medications into Redis.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] Create `lib/medications-redis.ts`:

```ts
import { redis } from './redis';

const ZKEY = 'meds:autocomplete';
const HKEY = 'meds:data';

export interface RedisMedication {
  id: string;
  nombreGenerico: string;
  nombresComerciales: string[];
  concentraciones: string[];
  categoria: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export async function loadMedicationsIntoRedis(meds: RedisMedication[]): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.del(ZKEY);
  pipeline.del(HKEY);
  for (const m of meds) {
    const terms = [m.nombreGenerico, ...m.nombresComerciales];
    for (const t of terms) {
      pipeline.zadd(ZKEY, 0, `${normalize(t)}::${m.id}`);
    }
    pipeline.hset(HKEY, m.id, JSON.stringify(m));
  }
  await pipeline.exec();
}

export async function addMedicationToRedis(m: RedisMedication): Promise<void> {
  const pipeline = redis.pipeline();
  const terms = [m.nombreGenerico, ...m.nombresComerciales];
  for (const t of terms) {
    pipeline.zadd(ZKEY, 0, `${normalize(t)}::${m.id}`);
  }
  pipeline.hset(HKEY, m.id, JSON.stringify(m));
  await pipeline.exec();
}

export async function searchMedications(query: string, limit = 15): Promise<RedisMedication[]> {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  // lexicographic range scan on sorted set (all members share score 0)
  const min = `[${q}`;
  const max = `[${q}\xff`;
  const members = await redis.zrangebylex(ZKEY, min, max, 'LIMIT', 0, limit * 3);
  const ids = Array.from(new Set(members.map((m) => m.split('::')[1]))).slice(0, limit);
  if (ids.length === 0) return [];
  const raw = await redis.hmget(HKEY, ...ids);
  return raw
    .filter((r): r is string => r !== null)
    .map((r) => JSON.parse(r) as RedisMedication);
}

export { normalize as normalizeMedicationTerm };
```

- [ ] Create `server/routers/medication.ts`:

```ts
import { z } from 'zod';
import { router, protectedProcedure, doctorProcedure } from '../trpc';
import { searchMedications, addMedicationToRedis } from '../../lib/medications-redis';

export const medicationRouter = router({
  search: protectedProcedure
    .input(z.object({ query: z.string().min(2) }))
    .query(async ({ input }) => {
      return searchMedications(input.query);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.medication.findUnique({ where: { id: input.id } });
    }),

  addCustom: doctorProcedure
    .input(
      z.object({
        nombreGenerico: z.string().min(2),
        nombresComerciales: z.array(z.string()).default([]),
        concentraciones: z.array(z.string()).default([]),
        formaFarmaceutica: z.string(),
        viaAdministracion: z.string(),
        categoria: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const med = await ctx.prisma.medication.create({
        data: {
          ...input,
          isCustom: true,
          activo: true,
          workspaceId: ctx.workspaceId,
        },
      });
      await addMedicationToRedis({
        id: med.id,
        nombreGenerico: med.nombreGenerico,
        nombresComerciales: med.nombresComerciales,
        concentraciones: med.concentraciones,
        categoria: med.categoria,
      });
      return med;
    }),
});
```

- [ ] Register the router in `server/routers/_app.ts`:

```ts
import { medicationRouter } from './medication';
// inside appRouter object:
//   medication: medicationRouter,
```

- [ ] Add the seed config to `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed-medications.ts"
}
```

- [ ] Run the seed:

```bash
npx prisma db seed
```

- [ ] Vitest unit test `lib/medications-redis.test.ts` (mocks ioredis):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const store: { z: Set<string>; h: Map<string, string> } = { z: new Set(), h: new Map() };

vi.mock('./redis', () => ({
  redis: {
    pipeline: () => {
      const ops: Array<() => void> = [];
      const p: any = {
        del: () => { ops.push(() => { store.z.clear(); store.h.clear(); }); return p; },
        zadd: (_k: string, _s: number, member: string) => { ops.push(() => store.z.add(member)); return p; },
        hset: (_k: string, id: string, val: string) => { ops.push(() => store.h.set(id, val)); return p; },
        exec: async () => { ops.forEach((o) => o()); return []; },
      };
      return p;
    },
    zrangebylex: async (_k: string, min: string) => {
      const prefix = min.slice(1);
      return Array.from(store.z).filter((m) => m.startsWith(prefix));
    },
    hmget: async (_k: string, ...ids: string[]) => ids.map((id) => store.h.get(id) ?? null),
  },
}));

import { loadMedicationsIntoRedis, searchMedications, normalizeMedicationTerm } from './medications-redis';

beforeEach(() => { store.z.clear(); store.h.clear(); });

describe('medications-redis', () => {
  it('normalizes accents and case', () => {
    expect(normalizeMedicationTerm('Ácido Acetilsalicílico')).toBe('acido acetilsalicilico');
  });

  it('finds a medication by generic name prefix', async () => {
    await loadMedicationsIntoRedis([
      { id: 'm1', nombreGenerico: 'Amoxicilina', nombresComerciales: ['Amoxil'], concentraciones: ['500 mg'], categoria: 'Antibiótico' },
      { id: 'm2', nombreGenerico: 'Ibuprofeno', nombresComerciales: ['Advil'], concentraciones: ['400 mg'], categoria: 'AINE' },
    ]);
    const res = await searchMedications('amox');
    expect(res.map((r) => r.id)).toContain('m1');
    expect(res.map((r) => r.id)).not.toContain('m2');
  });

  it('returns empty for queries under 2 chars', async () => {
    expect(await searchMedications('a')).toEqual([]);
  });
});
```

```bash
npx vitest run lib/medications-redis.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(medication): seed 1000 VE medications, Redis autocomplete, medication router"
```

---

## Task 3: Encounter router + Patient history page

**Files:**
- `server/routers/encounter.ts`
- `server/routers/_app.ts` (edit)
- `app/(dashboard)/doctor/patients/[patientRegId]/page.tsx`
- `app/(dashboard)/doctor/patients/[patientRegId]/encounters/[encounterId]/page.tsx`
- `components/encounter/encounter-header.tsx`
- `server/routers/encounter.test.ts`

- [ ] Create `server/routers/encounter.ts`:

```ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, doctorProcedure } from '../trpc';

const diagnosisInput = z.object({
  encounterId: z.string(),
  codigoCie10: z.string(),
  descripcion: z.string(),
  tipo: z.enum(['PRINCIPAL', 'SECUNDARIO']).default('PRINCIPAL'),
});

export const encounterRouter = router({
  create: doctorProcedure
    .input(z.object({ patientRegistrationId: z.string(), motivo: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.encounter.create({
        data: {
          workspaceId: ctx.workspaceId,
          patientRegistrationId: input.patientRegistrationId,
          doctorId: ctx.doctorId,
          motivo: input.motivo,
          status: 'DRAFT',
        },
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const enc = await ctx.prisma.encounter.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId },
        include: { diagnoses: true, prescriptions: { include: { items: true } }, labOrders: true, imagingOrders: true, documents: true },
      });
      if (!enc) throw new TRPCError({ code: 'NOT_FOUND' });
      return enc;
    }),

  list: protectedProcedure
    .input(z.object({ patientRegistrationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.encounter.findMany({
        where: { patientRegistrationId: input.patientRegistrationId, workspaceId: ctx.workspaceId },
        orderBy: { createdAt: 'desc' },
        include: { diagnoses: true },
      });
    }),

  update: doctorProcedure
    .input(
      z.object({
        id: z.string(),
        motivo: z.string().optional(),
        anamnesis: z.string().optional(),
        examenFisico: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!enc) throw new TRPCError({ code: 'NOT_FOUND' });
      if (enc.status !== 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN', message: 'Consulta firmada, no editable.' });
      const { id, ...rest } = input;
      return ctx.prisma.encounter.update({ where: { id }, data: rest });
    }),

  addDiagnosis: doctorProcedure.input(diagnosisInput).mutation(async ({ ctx, input }) => {
    const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.encounterId, workspaceId: ctx.workspaceId } });
    if (!enc || enc.status !== 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN' });
    return ctx.prisma.diagnosis.create({ data: input });
  }),

  removeDiagnosis: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.diagnosis.delete({ where: { id: input.id } });
    }),
});
```

- [ ] Register in `_app.ts`: `encounter: encounterRouter`.

- [ ] Create `components/encounter/encounter-header.tsx`:

```tsx
'use client';

interface EncounterHeaderProps {
  nombre: string;
  edad: number | string;
  alergias?: string[];
  medsActivasCount?: number;
}

export function EncounterHeader({ nombre, edad, alergias = [], medsActivasCount = 0 }: EncounterHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-lg font-semibold">{nombre}</span>
        <span className="text-sm text-muted-foreground">{edad} años</span>
        {alergias.length > 0 ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Alergias: {alergias.join(', ')}
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Sin alergias registradas</span>
        )}
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
          {medsActivasCount} medicamentos activos
        </span>
      </div>
    </div>
  );
}
```

- [ ] Create `app/(dashboard)/doctor/patients/[patientRegId]/page.tsx` (server component). Adapt the data-access call (`api`/`createCaller`) to the project's existing server-side tRPC helper.

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerCaller } from '@/server/caller';
import { EncounterHeader } from '@/components/encounter/encounter-header';
import { Button } from '@/components/ui/button';

export default async function PatientHistoryPage({
  params,
}: {
  params: Promise<{ patientRegId: string }>;
}) {
  const { patientRegId } = await params;
  const caller = await createServerCaller();

  const reg = await caller.patientRegistration.get({ id: patientRegId }).catch(() => null);
  if (!reg) notFound();

  const encounters = await caller.encounter.list({ patientRegistrationId: patientRegId });

  async function nuevaConsulta() {
    'use server';
    const c = await createServerCaller();
    const enc = await c.encounter.create({ patientRegistrationId: patientRegId });
    const { redirect } = await import('next/navigation');
    redirect(`/doctor/patients/${patientRegId}/encounters/${enc.id}`);
  }

  return (
    <div>
      <EncounterHeader nombre={reg.patient.nombreCompleto} edad={reg.patient.edad ?? '—'} />
      <div className="space-y-4 p-4">
        <form action={nuevaConsulta}>
          <Button type="submit">Nueva consulta</Button>
        </form>
        <h2 className="text-base font-semibold">Consultas anteriores</h2>
        {encounters.length === 0 && <p className="text-sm text-muted-foreground">Sin consultas registradas.</p>}
        <ul className="space-y-2">
          {encounters.map((e) => (
            <li key={e.id}>
              <Link
                href={`/doctor/patients/${patientRegId}/encounters/${e.id}`}
                className="block rounded-md border p-3 hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{e.motivo ?? 'Consulta'}</span>
                  <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString('es-VE')}</span>
                </div>
                <span className="text-xs uppercase text-muted-foreground">{e.status}</span>
                {e.diagnoses.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.diagnoses.map((d) => d.codigoCie10).join(', ')}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] Create `app/(dashboard)/doctor/patients/[patientRegId]/encounters/[encounterId]/page.tsx`. This is the single-page vertical consultation layout. It composes every Task 4-9 component. Build it incrementally as later tasks land; here is the scaffold:

```tsx
import { notFound } from 'next/navigation';
import { createServerCaller } from '@/server/caller';
import { EncounterHeader } from '@/components/encounter/encounter-header';
import { EncounterClient } from '@/components/encounter/encounter-client';

export default async function EncounterPage({
  params,
}: {
  params: Promise<{ patientRegId: string; encounterId: string }>;
}) {
  const { patientRegId, encounterId } = await params;
  const caller = await createServerCaller();
  const encounter = await caller.encounter.get({ id: encounterId }).catch(() => null);
  if (!encounter) notFound();
  const reg = await caller.patientRegistration.get({ id: patientRegId });

  return (
    <div className="pb-24">
      <EncounterHeader
        nombre={reg.patient.nombreCompleto}
        edad={reg.patient.edad ?? '—'}
        medsActivasCount={encounter.prescriptions.flatMap((p) => p.items).length}
      />
      <EncounterClient encounterId={encounterId} patientRegId={patientRegId} initialStatus={encounter.status} />
    </div>
  );
}
```

`components/encounter/encounter-client.tsx` (client wrapper that mounts all section forms — extended in later tasks):

```tsx
'use client';

import { VitalsForm } from './vitals-form';
import { DiagnosisSearch } from './diagnosis-search';
import { MedicationSearch } from './medication-search';
import { PrescriptionForm } from './prescription-form';
import { InformeForm } from './informe-form';
import { ReposoForm } from './reposo-form';
import { LabOrderForm } from './lab-order-form';
import { ImagingOrderForm } from './imaging-order-form';
import { AddendumForm } from './addendum-form';
import { SignBar } from './sign-bar';

export function EncounterClient({
  encounterId,
  patientRegId,
  initialStatus,
}: {
  encounterId: string;
  patientRegId: string;
  initialStatus: 'DRAFT' | 'SIGNED' | 'AMENDED';
}) {
  const locked = initialStatus !== 'DRAFT';
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <Section title="Signos vitales"><VitalsForm encounterId={encounterId} disabled={locked} /></Section>
      <Section title="Diagnósticos"><DiagnosisSearch encounterId={encounterId} disabled={locked} /></Section>
      <Section title="Medicamentos"><MedicationSearch encounterId={encounterId} disabled={locked} /></Section>
      <Section title="Receta"><PrescriptionForm encounterId={encounterId} disabled={locked} /></Section>
      <Section title="Informe médico"><InformeForm encounterId={encounterId} patientRegId={patientRegId} disabled={locked} /></Section>
      <Section title="Reposo"><ReposoForm encounterId={encounterId} patientRegId={patientRegId} disabled={locked} /></Section>
      <Section title="Laboratorio"><LabOrderForm encounterId={encounterId} disabled={locked} /></Section>
      <Section title="Imagenología"><ImagingOrderForm encounterId={encounterId} disabled={locked} /></Section>
      {initialStatus !== 'DRAFT' && <Section title="Adenda"><AddendumForm encounterId={encounterId} patientRegId={patientRegId} /></Section>}
      <SignBar encounterId={encounterId} status={initialStatus} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}
```

- [ ] Vitest test `server/routers/encounter.test.ts` (logic: blocks edits on non-DRAFT). Mock the prisma context.

```ts
import { describe, it, expect, vi } from 'vitest';
import { encounterRouter } from './encounter';

function makeCtx(encounterStatus: string) {
  return {
    workspaceId: 'ws1',
    doctorId: 'doc1',
    prisma: {
      encounter: {
        findFirst: vi.fn().mockResolvedValue({ id: 'e1', status: encounterStatus, workspaceId: 'ws1' }),
        update: vi.fn().mockResolvedValue({ id: 'e1' }),
      },
    },
  } as any;
}

describe('encounter.update', () => {
  it('rejects update of a SIGNED encounter', async () => {
    const caller = encounterRouter.createCaller(makeCtx('SIGNED'));
    await expect(caller.update({ id: 'e1', anamnesis: 'x' })).rejects.toThrow();
  });

  it('allows update of a DRAFT encounter', async () => {
    const caller = encounterRouter.createCaller(makeCtx('DRAFT'));
    await expect(caller.update({ id: 'e1', anamnesis: 'x' })).resolves.toBeTruthy();
  });
});
```

```bash
npx vitest run server/routers/encounter.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(encounter): encounter router, patient history page, consultation scaffold"
```

---

## Task 4: Vital signs + physical exam

**Files:**
- `components/encounter/vitals-form.tsx`
- `lib/clinical/vitals-alerts.ts`
- `server/routers/encounter.ts` (edit — add `saveVitals`)
- `lib/clinical/vitals-alerts.test.ts`

- [ ] Create `lib/clinical/vitals-alerts.ts`:

```ts
export interface Vitales {
  taSistolica?: number;
  taDiastolica?: number;
  fc?: number;
  fr?: number;
  temperatura?: number;
  peso?: number;
  talla?: number;
  spo2?: number;
  glasgow?: number;
}

export type AlertLevel = 'normal' | 'red';

export function evaluarVital(campo: keyof Vitales, valor: number | undefined): AlertLevel {
  if (valor === undefined || valor === null || Number.isNaN(valor)) return 'normal';
  switch (campo) {
    case 'taSistolica':
      return valor > 180 || valor < 90 ? 'red' : 'normal';
    case 'fc':
      return valor > 100 || valor < 50 ? 'red' : 'normal';
    case 'spo2':
      return valor < 93 ? 'red' : 'normal';
    case 'temperatura':
      return valor > 38.5 || valor < 35 ? 'red' : 'normal';
    default:
      return 'normal';
  }
}
```

- [ ] Add `saveVitals` to `server/routers/encounter.ts`:

```ts
saveVitals: doctorProcedure
  .input(
    z.object({
      id: z.string(),
      vitales: z.object({
        taSistolica: z.number().optional(),
        taDiastolica: z.number().optional(),
        fc: z.number().optional(),
        fr: z.number().optional(),
        temperatura: z.number().optional(),
        peso: z.number().optional(),
        talla: z.number().optional(),
        spo2: z.number().optional(),
        glasgow: z.number().optional(),
      }),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
    if (!enc || enc.status !== 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN' });
    return ctx.prisma.encounter.update({ where: { id: input.id }, data: { vitales: input.vitales } });
  }),
```

- [ ] Create `components/encounter/vitals-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { calcularImc, clasificarImc } from '@/lib/clinical/imc';
import { evaluarVital, type Vitales } from '@/lib/clinical/vitals-alerts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const FIELDS: { key: keyof Vitales; label: string; unit: string }[] = [
  { key: 'taSistolica', label: 'TA Sistólica', unit: 'mmHg' },
  { key: 'taDiastolica', label: 'TA Diastólica', unit: 'mmHg' },
  { key: 'fc', label: 'FC', unit: 'lpm' },
  { key: 'fr', label: 'FR', unit: 'rpm' },
  { key: 'temperatura', label: 'Temperatura', unit: '°C' },
  { key: 'peso', label: 'Peso', unit: 'kg' },
  { key: 'talla', label: 'Talla', unit: 'cm' },
  { key: 'spo2', label: 'SpO2', unit: '%' },
  { key: 'glasgow', label: 'Glasgow', unit: 'pts' },
];

export function VitalsForm({ encounterId, disabled }: { encounterId: string; disabled?: boolean }) {
  const [v, setV] = useState<Vitales>({});
  const save = trpc.encounter.saveVitals.useMutation();
  const imc = v.peso && v.talla ? calcularImc(v.peso, v.talla) : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map((f) => {
          const level = evaluarVital(f.key, v[f.key]);
          return (
            <label key={f.key} className="text-sm">
              <span className="mb-1 flex items-center gap-2">
                {f.label}
                {level === 'red' && (
                  <span className="rounded bg-red-100 px-1.5 text-xs font-medium text-red-700">Fuera de rango</span>
                )}
              </span>
              <Input
                type="number"
                step="0.1"
                disabled={disabled}
                className={level === 'red' ? 'border-red-500 focus-visible:ring-red-500' : ''}
                value={v[f.key] ?? ''}
                onChange={(e) => setV((prev) => ({ ...prev, [f.key]: e.target.value === '' ? undefined : Number(e.target.value) }))}
              />
              <span className="text-xs text-muted-foreground">{f.unit}</span>
            </label>
          );
        })}
      </div>
      {imc !== null && (
        <p className="text-sm">
          IMC: <strong>{imc}</strong> <span className="text-muted-foreground">({clasificarImc(imc)})</span>
        </p>
      )}
      {!disabled && (
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate({ id: encounterId, vitales: v })}>
          {save.isPending ? 'Guardando...' : 'Guardar signos vitales'}
        </Button>
      )}
    </div>
  );
}
```

- [ ] Vitest `lib/clinical/vitals-alerts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { evaluarVital } from './vitals-alerts';

describe('evaluarVital', () => {
  it('flags high systolic BP', () => { expect(evaluarVital('taSistolica', 185)).toBe('red'); });
  it('flags low systolic BP', () => { expect(evaluarVital('taSistolica', 85)).toBe('red'); });
  it('normal systolic BP', () => { expect(evaluarVital('taSistolica', 120)).toBe('normal'); });
  it('flags tachycardia', () => { expect(evaluarVital('fc', 110)).toBe('red'); });
  it('flags low SpO2', () => { expect(evaluarVital('spo2', 90)).toBe('red'); });
  it('flags fever', () => { expect(evaluarVital('temperatura', 39)).toBe('red'); });
  it('ignores undefined', () => { expect(evaluarVital('fc', undefined)).toBe('normal'); });
});
```

```bash
npx vitest run lib/clinical/vitals-alerts.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(encounter): vital signs form with inline range alerts and IMC"
```

---

## Task 5: ICD-10 diagnosis search

**Files:**
- `prisma/data/icd10-ve.ts`
- `server/routers/icd10.ts`
- `server/routers/_app.ts` (edit)
- `components/encounter/diagnosis-search.tsx`
- `server/routers/icd10.test.ts`

- [ ] Create `prisma/data/icd10-ve.ts` (50 real codes shown; append to 500 from the WHO ICD-10 list relevant to Venezuelan primary care):

```ts
export interface Icd10Code {
  codigo: string;
  descripcion: string;
}

export const icd10VE: Icd10Code[] = [
  { codigo: 'I10', descripcion: 'Hipertensión esencial (primaria)' },
  { codigo: 'E11', descripcion: 'Diabetes mellitus tipo 2' },
  { codigo: 'E10', descripcion: 'Diabetes mellitus tipo 1' },
  { codigo: 'J06', descripcion: 'Infección aguda de las vías respiratorias superiores' },
  { codigo: 'J00', descripcion: 'Rinofaringitis aguda (resfriado común)' },
  { codigo: 'J02', descripcion: 'Faringitis aguda' },
  { codigo: 'J03', descripcion: 'Amigdalitis aguda' },
  { codigo: 'J20', descripcion: 'Bronquitis aguda' },
  { codigo: 'J45', descripcion: 'Asma' },
  { codigo: 'J44', descripcion: 'Enfermedad pulmonar obstructiva crónica' },
  { codigo: 'J18', descripcion: 'Neumonía, organismo no especificado' },
  { codigo: 'A09', descripcion: 'Diarrea y gastroenteritis de presunto origen infeccioso' },
  { codigo: 'K29', descripcion: 'Gastritis y duodenitis' },
  { codigo: 'K21', descripcion: 'Enfermedad por reflujo gastroesofágico' },
  { codigo: 'K30', descripcion: 'Dispepsia funcional' },
  { codigo: 'N39', descripcion: 'Infección de vías urinarias, sitio no especificado' },
  { codigo: 'N30', descripcion: 'Cistitis' },
  { codigo: 'B34', descripcion: 'Infección viral, no especificada' },
  { codigo: 'R51', descripcion: 'Cefalea' },
  { codigo: 'G43', descripcion: 'Migraña' },
  { codigo: 'M54', descripcion: 'Dorsalgia' },
  { codigo: 'M25', descripcion: 'Otros trastornos articulares' },
  { codigo: 'M79', descripcion: 'Otros trastornos de tejidos blandos' },
  { codigo: 'E78', descripcion: 'Trastornos del metabolismo de las lipoproteínas' },
  { codigo: 'E66', descripcion: 'Obesidad' },
  { codigo: 'E03', descripcion: 'Hipotiroidismo' },
  { codigo: 'E05', descripcion: 'Tirotoxicosis (hipertiroidismo)' },
  { codigo: 'F41', descripcion: 'Otros trastornos de ansiedad' },
  { codigo: 'F32', descripcion: 'Episodio depresivo' },
  { codigo: 'F43', descripcion: 'Reacción al estrés grave y trastornos de adaptación' },
  { codigo: 'G47', descripcion: 'Trastornos del sueño' },
  { codigo: 'H10', descripcion: 'Conjuntivitis' },
  { codigo: 'H66', descripcion: 'Otitis media supurativa y la no especificada' },
  { codigo: 'L20', descripcion: 'Dermatitis atópica' },
  { codigo: 'L30', descripcion: 'Otras dermatitis' },
  { codigo: 'L23', descripcion: 'Dermatitis alérgica de contacto' },
  { codigo: 'A90', descripcion: 'Fiebre del dengue (dengue clásico)' },
  { codigo: 'A91', descripcion: 'Fiebre del dengue hemorrágico' },
  { codigo: 'B54', descripcion: 'Paludismo (malaria) no especificado' },
  { codigo: 'B19', descripcion: 'Hepatitis viral, no especificada' },
  { codigo: 'R10', descripcion: 'Dolor abdominal y pélvico' },
  { codigo: 'R50', descripcion: 'Fiebre de origen desconocido' },
  { codigo: 'R05', descripcion: 'Tos' },
  { codigo: 'R42', descripcion: 'Mareo y desvanecimiento' },
  { codigo: 'R11', descripcion: 'Náusea y vómito' },
  { codigo: 'Z00', descripcion: 'Examen médico general' },
  { codigo: 'Z34', descripcion: 'Supervisión de embarazo normal' },
  { codigo: 'O80', descripcion: 'Parto único espontáneo' },
  { codigo: 'D64', descripcion: 'Anemia, no especificada' },
  { codigo: 'D50', descripcion: 'Anemia por deficiencia de hierro' },
  // ... append ~450 more WHO ICD-10 codes ...
];
```

- [ ] Create `server/routers/icd10.ts`:

```ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { icd10VE } from '../../prisma/data/icd10-ve';

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export const icd10Router = router({
  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => {
      const q = normalize(input.query.trim());
      return icd10VE
        .filter((c) => normalize(c.codigo).includes(q) || normalize(c.descripcion).includes(q))
        .slice(0, 20);
    }),
});
```

- [ ] Register in `_app.ts`: `icd10: icd10Router`.

- [ ] Create `components/encounter/diagnosis-search.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function DiagnosisSearch({ encounterId, disabled }: { encounterId: string; disabled?: boolean }) {
  const [query, setQuery] = useState('');
  const utils = trpc.useUtils();
  const results = trpc.icd10.search.useQuery({ query }, { enabled: query.trim().length >= 1 });
  const add = trpc.encounter.addDiagnosis.useMutation({ onSuccess: () => utils.encounter.get.invalidate({ id: encounterId }) });
  const enc = trpc.encounter.get.useQuery({ id: encounterId });
  const remove = trpc.encounter.removeDiagnosis.useMutation({ onSuccess: () => utils.encounter.get.invalidate({ id: encounterId }) });

  return (
    <div className="space-y-3">
      <ul className="space-y-1">
        {enc.data?.diagnoses.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
            <span><strong>{d.codigoCie10}</strong> — {d.descripcion} <em className="text-xs text-muted-foreground">({d.tipo})</em></span>
            {!disabled && <button className="text-xs text-red-600" onClick={() => remove.mutate({ id: d.id })}>Eliminar</button>}
          </li>
        ))}
      </ul>
      {!disabled && (
        <>
          <Input placeholder="Buscar CIE-10 (código o descripción)" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query.length >= 1 && results.data && (
            <ul className="max-h-56 overflow-auto rounded border">
              {results.data.map((c) => (
                <li key={c.codigo}>
                  <button
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => { add.mutate({ encounterId, codigoCie10: c.codigo, descripcion: c.descripcion, tipo: 'PRINCIPAL' }); setQuery(''); }}
                  >
                    <span>{c.descripcion}</span>
                    <span className="font-mono text-xs text-muted-foreground">{c.codigo}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] Vitest `server/routers/icd10.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { icd10Router } from './icd10';

const caller = icd10Router.createCaller({} as any);

describe('icd10.search', () => {
  it('finds by code', async () => {
    const r = await caller.search({ query: 'I10' });
    expect(r.some((c) => c.codigo === 'I10')).toBe(true);
  });
  it('finds by description (accent-insensitive)', async () => {
    const r = await caller.search({ query: 'hipertension' });
    expect(r.some((c) => c.codigo === 'I10')).toBe(true);
  });
  it('caps at 20 results', async () => {
    const r = await caller.search({ query: 'a' });
    expect(r.length).toBeLessThanOrEqual(20);
  });
});
```

```bash
npx vitest run server/routers/icd10.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(icd10): in-memory ICD-10 search router and diagnosis combobox"
```

---

## Task 6: Medications & Prescription PDF

**Files:**
- `components/encounter/medication-search.tsx`
- `components/encounter/prescription-form.tsx`
- `server/routers/prescription.ts`
- `server/routers/_app.ts` (edit)
- `lib/pdf/prescription-pdf.tsx`
- `lib/pdf/header-logic.ts`
- `lib/pdf/header-logic.test.ts`

- [ ] Create `lib/pdf/header-logic.ts` (dynamic header: clinic vs doctor-only):

```ts
export interface DoctorInfo {
  nombre: string;
  especialidad?: string;
  mpps?: string; // Ministerio del Poder Popular para la Salud
  colegioMedico?: string;
}
export interface ClinicInfo {
  nombre: string;
  direccion?: string;
  telefono?: string;
  rif?: string;
}

export interface PdfHeader {
  modo: 'clinic' | 'doctor';
  titulo: string;
  subtitulo: string;
  lineas: string[];
}

export function buildPdfHeader(doctor: DoctorInfo, clinic?: ClinicInfo | null): PdfHeader {
  if (clinic) {
    return {
      modo: 'clinic',
      titulo: clinic.nombre,
      subtitulo: `${doctor.nombre}${doctor.especialidad ? ' — ' + doctor.especialidad : ''}`,
      lineas: [
        clinic.direccion ?? '',
        clinic.telefono ? `Tel: ${clinic.telefono}` : '',
        doctor.mpps ? `MPPS: ${doctor.mpps}` : '',
      ].filter(Boolean),
    };
  }
  return {
    modo: 'doctor',
    titulo: doctor.nombre,
    subtitulo: doctor.especialidad ?? '',
    lineas: [
      doctor.mpps ? `MPPS: ${doctor.mpps}` : '',
      doctor.colegioMedico ? `Colegio de Médicos: ${doctor.colegioMedico}` : '',
    ].filter(Boolean),
  };
}
```

- [ ] Create `lib/pdf/prescription-pdf.tsx`:

```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { buildPdfHeader, type DoctorInfo, type ClinicInfo } from './header-logic';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { borderBottom: '1pt solid #333', paddingBottom: 8, marginBottom: 16 },
  titulo: { fontSize: 16, fontWeight: 'bold' },
  subtitulo: { fontSize: 12, marginTop: 2 },
  linea: { fontSize: 9, color: '#555' },
  patient: { marginBottom: 12 },
  item: { marginBottom: 10, paddingBottom: 6, borderBottom: '0.5pt solid #ccc' },
  itemName: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: '1pt solid #333', paddingTop: 8, fontSize: 9 },
});

export interface PrescriptionPdfItem {
  nombreGenerico: string;
  concentracion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicacionesEspeciales?: string;
}

export interface PrescriptionPdfProps {
  doctor: DoctorInfo;
  clinic?: ClinicInfo | null;
  paciente: { nombre: string; edad: number | string; cedula?: string };
  fecha: string;
  items: PrescriptionPdfItem[];
}

export function PrescriptionPdf({ doctor, clinic, paciente, fecha, items }: PrescriptionPdfProps) {
  const h = buildPdfHeader(doctor, clinic);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.titulo}>{h.titulo}</Text>
          {h.subtitulo ? <Text style={styles.subtitulo}>{h.subtitulo}</Text> : null}
          {h.lineas.map((l, i) => <Text key={i} style={styles.linea}>{l}</Text>)}
        </View>

        <View style={styles.patient}>
          <Text>Paciente: {paciente.nombre} {paciente.cedula ? `— C.I. ${paciente.cedula}` : ''}</Text>
          <Text>Edad: {paciente.edad}    Fecha: {fecha}</Text>
        </View>

        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Rp/</Text>
        {items.map((it, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.itemName}>{i + 1}. {it.nombreGenerico} {it.concentracion}</Text>
            <Text>{it.dosis} — {it.frecuencia} — {it.duracion}</Text>
            {it.indicacionesEspeciales ? <Text style={{ color: '#555' }}>{it.indicacionesEspeciales}</Text> : null}
          </View>
        ))}

        <View style={styles.footer}>
          <Text>_______________________________</Text>
          <Text>{doctor.nombre}{doctor.mpps ? ` — MPPS ${doctor.mpps}` : ''}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] Create `server/routers/prescription.ts`. The `generatePdf` renders the React PDF to a buffer (`@react-pdf/renderer` `renderToBuffer`), uploads via the project's storage helper (adapt `uploadPdf`), stores `pdfUrl`.

```ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, doctorProcedure, protectedProcedure } from '../trpc';
import { renderToBuffer } from '@react-pdf/renderer';
import { PrescriptionPdf } from '../../lib/pdf/prescription-pdf';
import { uploadPdf } from '../../lib/storage';

const itemInput = z.object({
  medicationId: z.string(),
  concentracion: z.string(),
  dosis: z.string(),
  frecuencia: z.string(),
  duracion: z.string(),
  indicacionesEspeciales: z.string().optional(),
  overrideAlerta: z.boolean().default(false),
});

export const prescriptionRouter = router({
  create: doctorProcedure
    .input(z.object({ encounterId: z.string(), items: z.array(itemInput).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.encounterId, workspaceId: ctx.workspaceId } });
      if (!enc || enc.status !== 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN' });
      return ctx.prisma.prescription.create({
        data: {
          encounterId: input.encounterId,
          items: { create: input.items },
        },
        include: { items: true },
      });
    }),

  generatePdf: doctorProcedure
    .input(z.object({ prescriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const presc = await ctx.prisma.prescription.findUnique({
        where: { id: input.prescriptionId },
        include: { items: { include: { medication: true } }, encounter: { include: { patientRegistration: { include: { patient: true } } } } },
      });
      if (!presc) throw new TRPCError({ code: 'NOT_FOUND' });

      const doctor = await ctx.prisma.doctor.findUnique({ where: { id: ctx.doctorId } });
      const affiliation = await ctx.prisma.doctorClinicAffiliation.findFirst({
        where: { doctorId: ctx.doctorId, workspaceId: ctx.workspaceId },
        include: { clinic: true },
      });

      const buffer = await renderToBuffer(
        PrescriptionPdf({
          doctor: { nombre: doctor!.nombre, especialidad: doctor!.especialidad ?? undefined, mpps: doctor!.mpps ?? undefined },
          clinic: affiliation?.clinic
            ? { nombre: affiliation.clinic.nombre, direccion: affiliation.clinic.direccion ?? undefined, telefono: affiliation.clinic.telefono ?? undefined }
            : null,
          paciente: {
            nombre: presc.encounter.patientRegistration.patient.nombreCompleto,
            edad: presc.encounter.patientRegistration.patient.edad ?? '—',
            cedula: presc.encounter.patientRegistration.patient.cedula ?? undefined,
          },
          fecha: new Date().toLocaleDateString('es-VE'),
          items: presc.items.map((it) => ({
            nombreGenerico: it.medication.nombreGenerico,
            concentracion: it.concentracion,
            dosis: it.dosis,
            frecuencia: it.frecuencia,
            duracion: it.duracion,
            indicacionesEspeciales: it.indicacionesEspeciales ?? undefined,
          })),
        }) as any,
      );

      const pdfUrl = await uploadPdf(`prescriptions/${presc.id}.pdf`, buffer);
      return ctx.prisma.prescription.update({ where: { id: presc.id }, data: { pdfUrl } });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => ctx.prisma.prescription.findUnique({ where: { id: input.id }, include: { items: true } })),
});
```

> If `lib/storage.ts` does not yet exist, create a minimal local-disk/Vercel Blob stub exporting `uploadPdf(path: string, buf: Buffer): Promise<string>` that returns a public URL. Keep this consistent across Tasks 6-8.

- [ ] Register in `_app.ts`: `prescription: prescriptionRouter`.

- [ ] Create `components/encounter/medication-search.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Input } from '@/components/ui/input';

export interface SelectedMed {
  medicationId: string;
  nombreGenerico: string;
  concentraciones: string[];
}

export function MedicationSearch({ onAdd, disabled }: { encounterId?: string; onAdd?: (m: SelectedMed) => void; disabled?: boolean }) {
  const [query, setQuery] = useState('');
  const res = trpc.medication.search.useQuery({ query }, { enabled: query.trim().length >= 2 });

  if (disabled) return null;
  return (
    <div className="space-y-2">
      <Input placeholder="Buscar medicamento (mín. 2 letras)" value={query} onChange={(e) => setQuery(e.target.value)} />
      {query.trim().length >= 2 && res.data && (
        <ul className="max-h-56 overflow-auto rounded border">
          {res.data.map((m) => (
            <li key={m.id}>
              <button
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => { onAdd?.({ medicationId: m.id, nombreGenerico: m.nombreGenerico, concentraciones: m.concentraciones }); setQuery(''); }}
              >
                <span>{m.nombreGenerico}</span>
                <span className="text-xs text-muted-foreground">{m.concentraciones.join(', ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] Create `components/encounter/prescription-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { MedicationSearch, type SelectedMed } from './medication-search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Row extends SelectedMed {
  concentracion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicacionesEspeciales: string;
}

export function PrescriptionForm({ encounterId, disabled }: { encounterId: string; disabled?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const create = trpc.prescription.create.useMutation();
  const genPdf = trpc.prescription.generatePdf.useMutation();

  function addMed(m: SelectedMed) {
    setRows((prev) => [...prev, { ...m, concentracion: m.concentraciones[0] ?? '', dosis: '', frecuencia: '', duracion: '', indicacionesEspeciales: '' }]);
  }
  function update(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function generar() {
    const presc = await create.mutateAsync({
      encounterId,
      items: rows.map((r) => ({ medicationId: r.medicationId, concentracion: r.concentracion, dosis: r.dosis, frecuencia: r.frecuencia, duracion: r.duracion, indicacionesEspeciales: r.indicacionesEspeciales || undefined, overrideAlerta: false })),
    });
    await genPdf.mutateAsync({ prescriptionId: presc.id });
  }

  return (
    <div className="space-y-4">
      {!disabled && <MedicationSearch onAdd={addMed} />}
      <ul className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="rounded border p-3">
            <p className="mb-2 text-sm font-medium">{r.nombreGenerico}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select className="rounded border px-2 py-1 text-sm" value={r.concentracion} onChange={(e) => update(i, { concentracion: e.target.value })}>
                {r.concentraciones.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input placeholder="Dosis" value={r.dosis} onChange={(e) => update(i, { dosis: e.target.value })} />
              <Input placeholder="Frecuencia" value={r.frecuencia} onChange={(e) => update(i, { frecuencia: e.target.value })} />
              <Input placeholder="Duración" value={r.duracion} onChange={(e) => update(i, { duracion: e.target.value })} />
            </div>
            <Input className="mt-2" placeholder="Indicaciones especiales" value={r.indicacionesEspeciales} onChange={(e) => update(i, { indicacionesEspeciales: e.target.value })} />
          </li>
        ))}
      </ul>
      {!disabled && rows.length > 0 && (
        <Button disabled={create.isPending || genPdf.isPending} onClick={generar}>
          {create.isPending || genPdf.isPending ? 'Generando...' : 'Generar Receta'}
        </Button>
      )}
      {genPdf.data?.pdfUrl && <a className="text-sm text-blue-600 underline" href={genPdf.data.pdfUrl} target="_blank">Ver receta PDF</a>}
    </div>
  );
}
```

- [ ] Vitest `lib/pdf/header-logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildPdfHeader } from './header-logic';

const doctor = { nombre: 'Dra. Ana Pérez', especialidad: 'Cardiología', mpps: '12345' };

describe('buildPdfHeader', () => {
  it('uses clinic header when clinic present', () => {
    const h = buildPdfHeader(doctor, { nombre: 'Clínica La Floresta', direccion: 'Av. Principal', telefono: '0212-555' });
    expect(h.modo).toBe('clinic');
    expect(h.titulo).toBe('Clínica La Floresta');
    expect(h.subtitulo).toContain('Dra. Ana Pérez');
  });
  it('uses doctor header when no clinic', () => {
    const h = buildPdfHeader(doctor, null);
    expect(h.modo).toBe('doctor');
    expect(h.titulo).toBe('Dra. Ana Pérez');
  });
});
```

```bash
npx vitest run lib/pdf/header-logic.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(prescription): medication search, prescription form, dynamic-header PDF"
```

---

## Task 7: Medical report (Informe) with AI draft

**Files:**
- `lib/ai/generate-report.ts`
- `components/encounter/informe-form.tsx`
- `server/routers/document.ts`
- `server/routers/_app.ts` (edit)
- `lib/ai/generate-report.test.ts`

- [ ] Create `lib/ai/generate-report.ts` (uses `@anthropic-ai/sdk`, model `claude-sonnet-4-6`, Spanish prompt). The model id below is per spec; verify the latest id with the claude-api skill if needed.

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface EncounterForReport {
  motivo?: string | null;
  anamnesis?: string | null;
  vitales?: Record<string, number | undefined> | null;
  examenFisico?: unknown;
  diagnoses: { codigoCie10: string; descripcion: string }[];
  medicamentos: { nombreGenerico: string; concentracion: string; dosis: string; frecuencia: string; duracion: string }[];
  paciente: { nombre: string; edad: number | string };
}

export function buildReportPrompt(e: EncounterForReport): string {
  return [
    'Eres un médico venezolano redactando un informe clínico formal en español.',
    'Genera un informe médico profesional en HTML simple (usa <p>, <strong>, <ul>, <li>).',
    'No inventes datos; usa solo la información provista. Estructura: Motivo de consulta, Antecedentes/Anamnesis, Examen físico y signos vitales, Diagnósticos, Plan/Tratamiento.',
    '',
    `Paciente: ${e.paciente.nombre}, ${e.paciente.edad} años.`,
    `Motivo de consulta: ${e.motivo ?? 'No especificado'}.`,
    `Anamnesis: ${e.anamnesis ?? 'No especificada'}.`,
    `Signos vitales: ${JSON.stringify(e.vitales ?? {})}.`,
    `Examen físico: ${JSON.stringify(e.examenFisico ?? {})}.`,
    `Diagnósticos: ${e.diagnoses.map((d) => `${d.codigoCie10} ${d.descripcion}`).join('; ') || 'Ninguno'}.`,
    `Tratamiento indicado: ${e.medicamentos.map((m) => `${m.nombreGenerico} ${m.concentracion}, ${m.dosis} ${m.frecuencia} por ${m.duracion}`).join('; ') || 'Ninguno'}.`,
  ].join('\n');
}

export async function generateReportDraft(e: EncounterForReport): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: buildReportPrompt(e) }],
  });
  const block = msg.content.find((c) => c.type === 'text');
  return block && block.type === 'text' ? block.text : '';
}
```

- [ ] Create `server/routers/document.ts`:

```ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, doctorProcedure, protectedProcedure } from '../trpc';
import { renderToBuffer } from '@react-pdf/renderer';
import { generateReportDraft } from '../../lib/ai/generate-report';
import { DocumentPdf } from '../../lib/pdf/document-pdf';
import { uploadPdf } from '../../lib/storage';

export const documentRouter = router({
  generateAIDraft: doctorProcedure
    .input(z.object({ encounterId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const enc = await ctx.prisma.encounter.findFirst({
        where: { id: input.encounterId, workspaceId: ctx.workspaceId },
        include: { diagnoses: true, prescriptions: { include: { items: { include: { medication: true } } } }, patientRegistration: { include: { patient: true } } },
      });
      if (!enc) throw new TRPCError({ code: 'NOT_FOUND' });
      const draft = await generateReportDraft({
        motivo: enc.motivo,
        anamnesis: enc.anamnesis,
        vitales: enc.vitales as any,
        examenFisico: enc.examenFisico,
        diagnoses: enc.diagnoses.map((d) => ({ codigoCie10: d.codigoCie10, descripcion: d.descripcion })),
        medicamentos: enc.prescriptions.flatMap((p) => p.items.map((it) => ({ nombreGenerico: it.medication.nombreGenerico, concentracion: it.concentracion, dosis: it.dosis, frecuencia: it.frecuencia, duracion: it.duracion }))),
        paciente: { nombre: enc.patientRegistration.patient.nombreCompleto, edad: enc.patientRegistration.patient.edad ?? '—' },
      });
      return { aiDraft: draft };
    }),

  save: doctorProcedure
    .input(z.object({ id: z.string().optional(), encounterId: z.string(), patientRegistrationId: z.string(), tipo: z.enum(['INFORME', 'REPOSO', 'REFERIDO', 'CERTIFICADO', 'RECETA']), contenidoHtml: z.string(), aiDraft: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        return ctx.prisma.document.update({ where: { id: input.id }, data: { contenidoHtml: input.contenidoHtml, aiDraft: input.aiDraft } });
      }
      return ctx.prisma.document.create({
        data: { encounterId: input.encounterId, patientRegistrationId: input.patientRegistrationId, tipo: input.tipo, contenidoHtml: input.contenidoHtml, aiDraft: input.aiDraft },
      });
    }),

  sign: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.document.update({ where: { id: input.id }, data: { firmadoAt: new Date(), firmadoPor: ctx.doctorId, visibleEnPortal: true } });
    }),

  generatePdf: doctorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({ where: { id: input.id }, include: { patientRegistration: { include: { patient: true } } } });
      if (!doc) throw new TRPCError({ code: 'NOT_FOUND' });
      const doctor = await ctx.prisma.doctor.findUnique({ where: { id: ctx.doctorId } });
      const affiliation = await ctx.prisma.doctorClinicAffiliation.findFirst({ where: { doctorId: ctx.doctorId, workspaceId: ctx.workspaceId }, include: { clinic: true } });
      const buffer = await renderToBuffer(
        DocumentPdf({
          doctor: { nombre: doctor!.nombre, especialidad: doctor!.especialidad ?? undefined, mpps: doctor!.mpps ?? undefined },
          clinic: affiliation?.clinic ? { nombre: affiliation.clinic.nombre } : null,
          titulo: doc.tipo,
          paciente: { nombre: doc.patientRegistration.patient.nombreCompleto, edad: doc.patientRegistration.patient.edad ?? '—' },
          fecha: new Date().toLocaleDateString('es-VE'),
          contenidoHtml: doc.contenidoHtml,
        }) as any,
      );
      const pdfUrl = await uploadPdf(`documents/${doc.id}.pdf`, buffer);
      return ctx.prisma.document.update({ where: { id: doc.id }, data: { pdfUrl } });
    }),

  listForEncounter: protectedProcedure
    .input(z.object({ encounterId: z.string() }))
    .query(async ({ ctx, input }) => ctx.prisma.document.findMany({ where: { encounterId: input.encounterId } })),
});
```

> Create `lib/pdf/document-pdf.tsx` mirroring `prescription-pdf.tsx` but rendering `contenidoHtml` as plain text blocks (strip tags or use a minimal html-to-react-pdf mapping). Reuse `buildPdfHeader`.

- [ ] Register in `_app.ts`: `document: documentRouter`.

- [ ] Create `components/encounter/informe-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function InformeForm({ encounterId, patientRegId, disabled }: { encounterId: string; patientRegId: string; disabled?: boolean }) {
  const [contenido, setContenido] = useState('');
  const genDraft = trpc.document.generateAIDraft.useMutation({ onSuccess: (d) => setContenido(d.aiDraft) });
  const save = trpc.document.save.useMutation();
  const sign = trpc.document.sign.useMutation();
  const genPdf = trpc.document.generatePdf.useMutation();

  async function firmarYGenerar() {
    const doc = await save.mutateAsync({ encounterId, patientRegistrationId: patientRegId, tipo: 'INFORME', contenidoHtml: contenido });
    await sign.mutateAsync({ id: doc.id });
    await genPdf.mutateAsync({ id: doc.id });
  }

  return (
    <div className="space-y-3">
      {!disabled && (
        <Button size="sm" variant="outline" disabled={genDraft.isPending} onClick={() => genDraft.mutate({ encounterId })}>
          {genDraft.isPending ? 'Generando borrador...' : 'Generar con IA'}
        </Button>
      )}
      <Textarea rows={12} value={contenido} onChange={(e) => setContenido(e.target.value)} disabled={disabled} placeholder="El borrador del informe aparecerá aquí. Edítelo antes de firmar." />
      {!disabled && contenido && (
        <Button disabled={save.isPending || sign.isPending || genPdf.isPending} onClick={firmarYGenerar}>
          Firmar y generar PDF
        </Button>
      )}
      {genPdf.data?.pdfUrl && <a className="text-sm text-blue-600 underline" href={genPdf.data.pdfUrl} target="_blank">Ver informe PDF</a>}
    </div>
  );
}
```

- [ ] Vitest `lib/ai/generate-report.test.ts` (tests the deterministic prompt builder, no network):

```ts
import { describe, it, expect } from 'vitest';
import { buildReportPrompt } from './generate-report';

describe('buildReportPrompt', () => {
  it('includes patient, diagnoses and treatment', () => {
    const p = buildReportPrompt({
      motivo: 'Cefalea',
      anamnesis: 'Dolor 3 días',
      vitales: { taSistolica: 130 },
      examenFisico: {},
      diagnoses: [{ codigoCie10: 'R51', descripcion: 'Cefalea' }],
      medicamentos: [{ nombreGenerico: 'Acetaminofén', concentracion: '500 mg', dosis: '1 tab', frecuencia: 'c/6h', duracion: '3 días' }],
      paciente: { nombre: 'Juan', edad: 30 },
    });
    expect(p).toContain('Juan');
    expect(p).toContain('R51');
    expect(p).toContain('Acetaminofén');
    expect(p).toContain('español');
  });
});
```

```bash
npx vitest run lib/ai/generate-report.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(document): AI report draft, informe form, document router + PDF"
```

---

## Task 8: Rest certificate + Lab/Imaging orders

**Files:**
- `components/encounter/reposo-form.tsx`
- `components/encounter/lab-order-form.tsx`
- `components/encounter/imaging-order-form.tsx`
- `server/routers/encounter.ts` (edit — add `addLabOrder`, `addImagingOrder`)
- `lib/pdf/reposo-pdf.tsx`
- `lib/pdf/order-pdf.tsx`
- `lib/clinical/reposo.test.ts`

- [ ] Add to `server/routers/encounter.ts`:

```ts
addLabOrder: doctorProcedure
  .input(z.object({ encounterId: z.string(), estudios: z.array(z.string()).min(1), indicacionesClinicas: z.string().optional(), urgente: z.boolean().default(false) }))
  .mutation(async ({ ctx, input }) => {
    const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.encounterId, workspaceId: ctx.workspaceId } });
    if (!enc || enc.status !== 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN' });
    return ctx.prisma.labOrder.create({ data: input });
  }),

addImagingOrder: doctorProcedure
  .input(z.object({ encounterId: z.string(), tipoImagen: z.string(), region: z.string(), indicacionesClinicas: z.string().optional(), urgente: z.boolean().default(false) }))
  .mutation(async ({ ctx, input }) => {
    const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.encounterId, workspaceId: ctx.workspaceId } });
    if (!enc || enc.status !== 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN' });
    return ctx.prisma.imagingOrder.create({ data: input });
  }),
```

- [ ] Create `lib/clinical/reposo.ts` (date math helper for the rest certificate):

```ts
export function calcularFechaFin(inicio: Date, dias: number): Date {
  const d = new Date(inicio);
  d.setDate(d.getDate() + Math.max(0, dias - 1));
  return d;
}
```

- [ ] Create `components/encounter/reposo-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { calcularFechaFin } from '@/lib/clinical/reposo';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ReposoForm({ encounterId, patientRegId, disabled }: { encounterId: string; patientRegId: string; disabled?: boolean }) {
  const [dias, setDias] = useState(1);
  const [inicio, setInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [diagnosticoRef, setDiagnosticoRef] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const save = trpc.document.save.useMutation();
  const sign = trpc.document.sign.useMutation();
  const genPdf = trpc.document.generatePdf.useMutation();

  const fin = calcularFechaFin(new Date(inicio), dias).toISOString().slice(0, 10);

  async function generar() {
    const html = `<p>Se indica reposo médico por <strong>${dias} día(s)</strong>, desde el ${inicio} hasta el ${fin}.</p><p>Diagnóstico: ${diagnosticoRef}</p><p>${observaciones}</p>`;
    const doc = await save.mutateAsync({ encounterId, patientRegistrationId: patientRegId, tipo: 'REPOSO', contenidoHtml: html });
    await sign.mutateAsync({ id: doc.id });
    await genPdf.mutateAsync({ id: doc.id });
  }

  if (disabled) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">Días<Input type="number" min={1} value={dias} onChange={(e) => setDias(Number(e.target.value))} /></label>
        <label className="text-sm">Inicio<Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label>
      </div>
      <p className="text-xs text-muted-foreground">Hasta: {fin}</p>
      <Input placeholder="Diagnóstico de referencia" value={diagnosticoRef} onChange={(e) => setDiagnosticoRef(e.target.value)} />
      <Textarea placeholder="Observaciones" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
      <Button onClick={generar} disabled={save.isPending}>Generar Reposo</Button>
      {genPdf.data?.pdfUrl && <a className="text-sm text-blue-600 underline" href={genPdf.data.pdfUrl} target="_blank">Ver reposo PDF</a>}
    </div>
  );
}
```

- [ ] Create `components/encounter/lab-order-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function LabOrderForm({ encounterId, disabled }: { encounterId: string; disabled?: boolean }) {
  const [estudios, setEstudios] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [urgente, setUrgente] = useState(false);
  const add = trpc.encounter.addLabOrder.useMutation();

  if (disabled) return null;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Agregar estudio (ej. Hematología completa)" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="button" variant="outline" onClick={() => { if (draft.trim()) { setEstudios((p) => [...p, draft.trim()]); setDraft(''); } }}>Agregar</Button>
      </div>
      <ul className="list-disc pl-5 text-sm">{estudios.map((e, i) => <li key={i}>{e}</li>)}</ul>
      <Textarea placeholder="Indicaciones clínicas" value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} />Urgente</label>
      <Button disabled={estudios.length === 0 || add.isPending} onClick={() => add.mutate({ encounterId, estudios, indicacionesClinicas: indicaciones, urgente })}>Crear orden de laboratorio</Button>
    </div>
  );
}
```

- [ ] Create `components/encounter/imaging-order-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function ImagingOrderForm({ encounterId, disabled }: { encounterId: string; disabled?: boolean }) {
  const [tipoImagen, setTipoImagen] = useState('');
  const [region, setRegion] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [urgente, setUrgente] = useState(false);
  const add = trpc.encounter.addImagingOrder.useMutation();

  if (disabled) return null;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Tipo de imagen (Rx, Eco, TAC, RMN)" value={tipoImagen} onChange={(e) => setTipoImagen(e.target.value)} />
        <Input placeholder="Región anatómica" value={region} onChange={(e) => setRegion(e.target.value)} />
      </div>
      <Textarea placeholder="Indicaciones clínicas" value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} />Urgente</label>
      <Button disabled={!tipoImagen || !region || add.isPending} onClick={() => add.mutate({ encounterId, tipoImagen, region, indicacionesClinicas: indicaciones, urgente })}>Crear orden de imagen</Button>
    </div>
  );
}
```

> Create `lib/pdf/reposo-pdf.tsx` and `lib/pdf/order-pdf.tsx` reusing `buildPdfHeader`, mirroring the prescription PDF layout. Wire order PDF generation through new `generatePdf` mutations on the order records (optional follow-up; the data is persisted regardless).

- [ ] Vitest `lib/clinical/reposo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calcularFechaFin } from './reposo';

describe('calcularFechaFin', () => {
  it('1 day = same day', () => {
    expect(calcularFechaFin(new Date('2026-06-16'), 1).toISOString().slice(0, 10)).toBe('2026-06-16');
  });
  it('3 days adds 2', () => {
    expect(calcularFechaFin(new Date('2026-06-16'), 3).toISOString().slice(0, 10)).toBe('2026-06-18');
  });
});
```

```bash
npx vitest run lib/clinical/reposo.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(encounter): rest certificate, lab and imaging orders with PDFs"
```

---

## Task 9: Encounter signing + addendum

**Files:**
- `server/routers/encounter.ts` (edit — add `sign`)
- `components/encounter/sign-bar.tsx`
- `components/encounter/addendum-form.tsx`
- `server/routers/encounter.sign.test.ts`

- [ ] Add `sign` to `server/routers/encounter.ts`:

```ts
sign: doctorProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
    if (!enc) throw new TRPCError({ code: 'NOT_FOUND' });
    if (enc.status !== 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN', message: 'La consulta ya fue firmada.' });
    return ctx.prisma.encounter.update({
      where: { id: input.id },
      data: { status: 'SIGNED', signedAt: new Date(), signedBy: ctx.doctorId },
    });
  }),
```

- [ ] Create `components/encounter/sign-bar.tsx` (fixed bottom bar):

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';

export function SignBar({ encounterId, status }: { encounterId: string; status: 'DRAFT' | 'SIGNED' | 'AMENDED' }) {
  const router = useRouter();
  const sign = trpc.encounter.sign.useMutation({ onSuccess: () => router.refresh() });

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <span className="text-sm text-muted-foreground">Estado: <strong>{status}</strong></span>
        {status === 'DRAFT' ? (
          <Button onClick={() => { if (confirm('¿Firmar y bloquear la consulta?')) sign.mutate({ id: encounterId }); }} disabled={sign.isPending}>
            {sign.isPending ? 'Firmando...' : 'Firmar Consulta'}
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">Use el bloque de Adenda para agregar correcciones.</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] Create `components/encounter/addendum-form.tsx`. An addendum saves a new `Document` (tipo INFORME) linked to the encounter and sets the encounter status to AMENDED.

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export function AddendumForm({ encounterId, patientRegId }: { encounterId: string; patientRegId: string }) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const addendum = trpc.encounter.addAddendum.useMutation({ onSuccess: () => { setTexto(''); router.refresh(); } });

  return (
    <div className="space-y-3">
      <Textarea rows={5} placeholder="Texto de la adenda (correcciones o información adicional)" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <Button disabled={!texto.trim() || addendum.isPending} onClick={() => addendum.mutate({ encounterId, patientRegistrationId: patientRegId, texto })}>
        Agregar Adenda
      </Button>
    </div>
  );
}
```

- [ ] Add the `addAddendum` mutation to `server/routers/encounter.ts` (creates Document + sets AMENDED transactionally):

```ts
addAddendum: doctorProcedure
  .input(z.object({ encounterId: z.string(), patientRegistrationId: z.string(), texto: z.string().min(1) }))
  .mutation(async ({ ctx, input }) => {
    const enc = await ctx.prisma.encounter.findFirst({ where: { id: input.encounterId, workspaceId: ctx.workspaceId } });
    if (!enc) throw new TRPCError({ code: 'NOT_FOUND' });
    if (enc.status === 'DRAFT') throw new TRPCError({ code: 'FORBIDDEN', message: 'Firme la consulta antes de agregar una adenda.' });
    return ctx.prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          encounterId: input.encounterId,
          patientRegistrationId: input.patientRegistrationId,
          tipo: 'INFORME',
          contenidoHtml: `<p><strong>ADENDA (${new Date().toLocaleString('es-VE')}):</strong></p><p>${input.texto}</p>`,
          firmadoAt: new Date(),
          firmadoPor: ctx.doctorId,
        },
      });
      await tx.encounter.update({ where: { id: input.encounterId }, data: { status: 'AMENDED' } });
      return doc;
    });
  }),
```

- [ ] Vitest `server/routers/encounter.sign.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { encounterRouter } from './encounter';

function ctxWith(status: string) {
  return {
    workspaceId: 'ws1',
    doctorId: 'doc1',
    prisma: {
      encounter: {
        findFirst: vi.fn().mockResolvedValue({ id: 'e1', status, workspaceId: 'ws1' }),
        update: vi.fn().mockResolvedValue({ id: 'e1', status: 'SIGNED' }),
      },
    },
  } as any;
}

describe('encounter.sign', () => {
  it('signs a DRAFT', async () => {
    const caller = encounterRouter.createCaller(ctxWith('DRAFT'));
    await expect(caller.sign({ id: 'e1' })).resolves.toMatchObject({ status: 'SIGNED' });
  });
  it('rejects re-signing a SIGNED encounter', async () => {
    const caller = encounterRouter.createCaller(ctxWith('SIGNED'));
    await expect(caller.sign({ id: 'e1' })).rejects.toThrow();
  });
});
```

```bash
npx vitest run server/routers/encounter.sign.test.ts
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(encounter): signing flow with lock and addendum (AMENDED)"
```

---

## Task 10: Basic patient portal

**Files:**
- `app/portal/layout.tsx`
- `app/portal/login/page.tsx`
- `app/portal/page.tsx`
- `lib/auth.ts` (edit — portal credentials)
- `server/routers/portal.ts`
- `server/routers/_app.ts` (edit)
- `server/routers/portal.test.ts`

- [ ] Add a portal credentials provider to `lib/auth.ts`. Patients authenticate with `email` + `portalPassword` (a field assumed on `Patient`; if absent, add `portalPasswordHash String?` to the `Patient` model and migrate). Mark the session with `role: 'PATIENT'` and the `patientId`.

```ts
// inside the providers array of lib/auth.ts
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

Credentials({
  id: 'portal',
  name: 'Portal Paciente',
  credentials: { email: {}, portalPassword: {} },
  async authorize(creds) {
    if (!creds?.email || !creds?.portalPassword) return null;
    const patient = await prisma.patient.findFirst({ where: { email: String(creds.email) } });
    if (!patient || !patient.portalPasswordHash) return null;
    const ok = await bcrypt.compare(String(creds.portalPassword), patient.portalPasswordHash);
    if (!ok) return null;
    return { id: patient.id, email: patient.email, name: patient.nombreCompleto, role: 'PATIENT' };
  },
}),
```

> In the `jwt`/`session` callbacks, propagate `role` and set `patientId` from `user.id` when `role === 'PATIENT'`. Middleware should allow `/portal/*` for the PATIENT role and keep `/doctor/*` doctor-only.

- [ ] Create `server/routers/portal.ts`. Procedures use a `portalProcedure` that asserts `ctx.session.user.role === 'PATIENT'` and scopes by `patientId` across all registrations.

```ts
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, portalProcedure } from '../trpc';

export const portalRouter = router({
  myDocuments: portalProcedure.query(async ({ ctx }) => {
    const regs = await ctx.prisma.patientRegistration.findMany({ where: { patientId: ctx.patientId }, select: { id: true } });
    const regIds = regs.map((r) => r.id);
    return ctx.prisma.document.findMany({
      where: { patientRegistrationId: { in: regIds }, visibleEnPortal: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, tipo: true, createdAt: true, pdfUrl: true },
    });
  }),

  getDocument: portalProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.prisma.document.findUnique({ where: { id: input.id }, include: { patientRegistration: true } });
      if (!doc || doc.patientRegistration.patientId !== ctx.patientId || !doc.visibleEnPortal) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return doc;
    }),
});
```

> Add `portalProcedure` to `server/trpc.ts`: a `protectedProcedure`-style middleware that throws UNAUTHORIZED unless `ctx.session?.user.role === 'PATIENT'`, exposing `ctx.patientId`.

- [ ] Register in `_app.ts`: `portal: portalRouter`.

- [ ] Create `app/portal/layout.tsx`:

```tsx
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-4 py-3">
        <h1 className="text-lg font-semibold">AJMedics — Portal del Paciente</h1>
      </header>
      <main className="mx-auto max-w-2xl p-4">{children}</main>
    </div>
  );
}
```

- [ ] Create `app/portal/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await signIn('portal', { email, portalPassword, redirect: false });
    if (res?.error) setError('Credenciales inválidas');
    else router.push('/portal');
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-12 max-w-sm space-y-4 rounded-lg border bg-background p-6">
      <h2 className="text-base font-semibold">Iniciar sesión</h2>
      <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input type="password" placeholder="Contraseña" value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full">Entrar</Button>
    </form>
  );
}
```

- [ ] Create `app/portal/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { createServerCaller } from '@/server/caller';

const TIPO_LABEL: Record<string, string> = {
  INFORME: 'Informe médico',
  REPOSO: 'Reposo',
  REFERIDO: 'Referido',
  CERTIFICADO: 'Certificado',
  RECETA: 'Receta',
};

export default async function PortalHome() {
  const session = await auth();
  if (session?.user?.role !== 'PATIENT') redirect('/portal/login');

  const caller = await createServerCaller();
  const docs = await caller.portal.myDocuments();

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Mis documentos</h2>
      {docs.length === 0 && <p className="text-sm text-muted-foreground">Aún no tiene documentos disponibles.</p>}
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-md border bg-background p-3">
            <div>
              <p className="font-medium">{TIPO_LABEL[d.tipo] ?? d.tipo}</p>
              <p className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString('es-VE')}</p>
            </div>
            {d.pdfUrl && (
              <a className="text-sm text-blue-600 underline" href={d.pdfUrl} target="_blank" rel="noreferrer">Descargar / Imprimir</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] Vitest `server/routers/portal.test.ts` (scoping logic):

```ts
import { describe, it, expect, vi } from 'vitest';
import { portalRouter } from './portal';

function ctx(patientId: string) {
  return {
    patientId,
    session: { user: { role: 'PATIENT', id: patientId } },
    prisma: {
      patientRegistration: { findMany: vi.fn().mockResolvedValue([{ id: 'r1' }]) },
      document: { findMany: vi.fn().mockResolvedValue([{ id: 'd1', tipo: 'INFORME', createdAt: new Date(), pdfUrl: 'x' }]) },
    },
  } as any;
}

describe('portal.myDocuments', () => {
  it('returns only visible documents for the patient registrations', async () => {
    const caller = portalRouter.createCaller(ctx('p1'));
    const docs = await caller.myDocuments();
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe('d1');
  });
});
```

```bash
npx vitest run server/routers/portal.test.ts
npx tsc --noEmit
```

- [ ] If `Patient.portalPasswordHash` was added, run the migration:

```bash
npx prisma migrate dev --name add_patient_portal_password
```

- [ ] Commit:

```bash
git add -A && git commit -m "feat(portal): patient portal login, document list, portal router"
```

---

## Final verification

- [ ] Full type check: `npx tsc --noEmit`
- [ ] Full test run: `npx vitest run`
- [ ] Lint: `npm run lint`
- [ ] Manual smoke test (use the `run` skill or `npm run dev`): create encounter → vitals → diagnosis → prescription PDF → AI informe → sign → addendum → verify document appears in `/portal`.
- [ ] Confirm Redis is populated: `redis-cli zcard meds:autocomplete` returns ~1000+.

## Notes / adaptation reminders for the implementing agent

- This repo uses a non-standard Next.js build — read `node_modules/next/dist/docs/` before writing any route/page code; adjust `params` awaiting, server-action signatures, and tRPC server-caller wiring to match.
- All clinical mutations must scope by `workspaceId` (and patient queries by `patientId`). Verify `doctorProcedure`/`protectedProcedure` already inject `ctx.workspaceId` and `ctx.doctorId`; if not, extend the tRPC context first.
- Field names on existing models (`Patient.nombreCompleto`, `Patient.edad`, `Patient.cedula`, `Doctor.nombre`, `Doctor.especialidad`, `Doctor.mpps`, `Clinic.nombre/direccion/telefono`) are assumed — confirm against the actual `schema.prisma` and adjust references.
- `lib/storage.ts` (`uploadPdf`) and `server/caller.ts` (`createServerCaller`) are integration points; create thin stubs if missing.
- Keep AI calls (`generateReportDraft`) out of blocking hot paths; they run inside explicit mutations only.
