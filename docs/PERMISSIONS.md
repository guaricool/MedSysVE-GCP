# Permission Matrix — MedSysVE

> **Última actualización:** 2026-07-02
> **Estado:** Documentación de permissions actuales + gaps identificados (audit #9)

---

## TL;DR

- **DOCTOR**: full access a su workspace (clinical + admin + billing)
- **PATIENT**: portal-only, acceso solo a sus propios datos
- **CLINIC_ADMIN**: dashboard de clínica, NO clinical data
- **STAFF** (SECRETARY/ASSISTANT/NURSE): **NO tiene login propio todavía**. Es metadata que el doctor gestiona en su workspace. Si en el futuro se les da login, la matriz propuesta está abajo como "Pendiente".

---

## 1. Roles definidos

### Schema (Prisma)

```prisma
enum StaffRole {           // Miembros del equipo del doctor (sin login propio todavía)
  SECRETARY
  ASSISTANT
  NURSE
}

enum ClinicRole {          // Afiliación doctor-clínica (no es un role de acceso)
  OWNER
  STAFF
  CONTRACTOR
}

enum ClinicAdminRole {     // Admin de la clínica (login separado)
  OWNER
  MANAGER
}
```

### tRPC procedures (`server/trpc.ts`)

```typescript
publicProcedure      // sin auth
protectedProcedure   // cualquier session válida (cualquier role)
doctorProcedure      // role === "DOCTOR"
portalProcedure      // role === "PATIENT"
clinicAdminProcedure // role === "CLINIC_ADMIN" + tiene clinicId
```

---

## 2. Matriz de access por router

| Router | Procedure(s) | Notas |
|---|---|---|
| `_app.ts` | (root) | No expone procedures propios |
| `admin.ts` | protected | Admin-only via session.role check interno |
| `alergia.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `list` migrado a `doctorProcedure`. Mixto → single. |
| `analytics.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). 5 procedures (topDiagnoses, retention, chronics, alerts, patientVitals) migradas a `doctorProcedure`. |
| `announcement.ts` | doctor | Solo doctor |
| `appointment.ts` | doctor, portal, protected | Doctor + patient + (general protected) |
| `audit.ts` | doctor | Solo doctor |
| `auth.ts` | protected, public | Login + auth |
| `availability.ts` | doctor, public | Doctor + público (scheduling) |
| `billing.ts` | doctor | ✅ Gap #2 cerrado 2026-07-06 (audit S6). Mutaciones de billing solo DOCTOR. `createCheckoutSession` usa `doctorProcedure`. La rama `entityType=clinic` no está wired todavía; cuando se implemente, debe ser procedure separada con `clinicAdminProcedure`. |
| `clinicAdmin.ts` | clinicAdmin, public | CLINIC_ADMIN only + público |
| `clinicPublic.ts` | doctor, public | Doctor + público |
| `compliance.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). 3 procedures (requestPatientExport, listMyExports, listMyDeletions) migradas a `doctorProcedure`. `requestDeletion` ya era doctor. |
| `consent.ts` | doctor, protected | ✅ Gap #1 cerrado 2026-07-06 (audit S7). `listTemplates` + `createConsent` migrados a `doctorProcedure` (template management es doctor-only). `listPatientConsents` + `signConsent` se mantienen `protectedProcedure` (legítimos — paciente revisa/firma sus consents vía portal). |
| `doctor.ts` | doctor, protected, public | Doctor + protected + público (registro) |
| `document.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `listForEncounter` migrado a `doctorProcedure`. |
| `encounter.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `get`, `list` migrados a `doctorProcedure`. |
| `icd10.ts` | protected | General protected |
| `imagingOrder.ts` | doctor | Solo doctor |
| `insurance.ts` | doctor, protected | ✅ Gap #1 cerrado 2026-07-06 (audit S7). `listProviders` migrado a `doctorProcedure` (catálogo de proveedores es admin clínico). Las 3 operations de `PatientInsurance` (`list`, `add`, `update`) se mantienen `protectedProcedure` (legítimas — paciente gestiona su propia cobertura vía portal). |
| `invoice.ts` | doctor, protected | Mixto (queries designed for future SECRETARY) |
| `labOrder.ts` | (inline / no detectado) | Verificar manualmente |
| `labResult.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `list` migrado a `doctorProcedure`. |
| `medication.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `search` y `get` migrados a `doctorProcedure`. |
| `mensaje.ts` | portal, protected | Patient + general protected |
| `notification.ts` | protected | General protected |
| `patient.ts` | doctor, protected | 🟡 Parcial cerrado 2026-07-06 (audit S5). `search`, `list`, `updateNotes`, `updateGrupoSanguineo`, `updateAntecedentes`, `update` migradas a `doctorProcedure`. Quedan como `protectedProcedure` (legítimos, usados por portal del paciente): `lookupByCedula`, `register`, `getRegistration`. |
| `portal.ts` | portal | Patient only |
| `prescription.ts` | doctor | Solo doctor |
| `report-preferences.ts` | doctor | Solo doctor. Per-doctor customizable medical report preferences (informe sections + default instructions). Added 2026-07-11 with the customizable informe feature. |
| `staff.ts` | doctor | Doctor managing staff records |
| `staffNote.ts` | doctor | ✅ Gap #3 cerrado 2026-07-06 (audit S5). All 3 procedures migradas a `doctorProcedure`. Cuando staff login se implemente, agregar `staffProcedure`. |
| `tag.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `list` migrado a `doctorProcedure`. |
| `task.ts` | doctor | ✅ Gap #1 cerrado 2026-07-06 (audit S7). Las 6 procedures (`list`, `create`, `complete`, `update`, `delete` + resto) migradas a `doctorProcedure`. Tasks son coordinación interna del workspace (asignadas a Staff records, sin participación de PATIENT). Como staff no tiene login todavía, solo DOCTOR puede manejarlas. Cuando staff login se implemente, agregar `staffProcedure` para que SECRETARY/ASSISTANT puedan ver/crear tasks. |
| `template.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `listDoc` migrado a `doctorProcedure`. |
| `twoFactor.ts` | doctor | Solo doctor |
| `vaccine.ts` | doctor | ✅ Gap #1 parcial cerrado 2026-07-06 (audit S5). `list`, `add`, `remove` todos `doctorProcedure` (add/remove eran mutaciones clínicas accesibles a cualquier logueado). |
| `waitingRoom.ts` | doctor | ✅ Gap #1 cerrado 2026-07-06 (audit S7). Las 5 procedures (`today`, `checkin`, `callPatient`, `done`, `remove`) todas migradas a `doctorProcedure`. Recepción + sala de espera son operaciones de DOCTOR + (futuro) SECRETARY/ASSISTANT/NURSE. Como staff no tiene login todavía, solo DOCTOR opera. Cuando staff login se implemente, agregar `staffProcedure`. |
| `workspace.ts` | doctor, protected | Mixto (queries display-only diseñadas para cualquier role) |

---

## 3. Matriz de access por recurso (alto nivel)

| Recurso | DOCTOR | PATIENT | CLINIC_ADMIN | STAFF (futuro) |
|---|:---:|:---:|:---:|:---:|
| Ver motivo de consulta | ✓ | ✗ | ✗ | ⚠ pendiente |
| Ver anamnesis | ✓ | ✗ | ✗ | ⚠ pendiente |
| Ver diagnósticos | ✓ | ✗ | ✗ | ⚠ pendiente |
| Crear encounter | ✓ | ✗ | ✗ | ⚠ pendiente |
| Sign encounter | ✓ | ✗ | ✗ | ✗ |
| Ver prescripciones | ✓ | propios | ✗ | ⚠ pendiente |
| Crear prescripción | ✓ | ✗ | ✗ | ✗ (NURSE no prescribe) |
| Sign prescripción | ✓ | ✗ | ✗ | ✗ |
| Ver signos vitales | ✓ | propios | ✗ | ⚠ pendiente |
| Registrar signos vitales | ✓ | ✗ | ✗ | ✓ NURSE sí |
| Ver agenda | ✓ | propios appointments | ✗ | ✓ SECRETARY/ASSISTANT |
| Manejar agenda | ✓ | request only | ✗ | ✓ SECRETARY/ASSISTANT |
| Ver pacientes | ✓ | ✗ | ✗ | ⚠ SECRETARY sí, ASSISTANT sí |
| Crear pacientes | ✓ | ✗ | ✗ | ⚠ SECRETARY sí |
| Editar pacientes | ✓ | ✗ | ✗ | ⚠ SECRETARY sí |
| Ver facturació | ✓ | propios invoices | ✓ (clinic scope) | ✗ |
| Crear invoices | ✓ | ✗ | ✗ | ⚠ SECRETARY sí |
| Ver audit log | ✓ | ✗ | ✓ (clinic scope) | ✗ |
| Dashboard clínico | ✓ | ✗ | ✗ | ✗ |
| Dashboard clínica | ✗ | ✗ | ✓ | ✗ |
| Manage staff | ✓ | ✗ | ✗ | ✗ |
| Manage invitation codes | ✓ | ✗ | ✓ (OWNER only) | ✗ |
| Portal del paciente | ✗ | ✓ | ✗ | ✗ |

**Leyenda**:
- ✓ permitido
- ✗ denegado (403 FORBIDDEN o no-route)
- ⚠ pendiente (no implementado, decisión pendiente)
- propios = solo del propio paciente (multi-tenancy)
- clinic scope = filtrado por `ctx.clinicId`

---

## 4. Gaps identificados

### Gap #1: routers "mixto" sin role check explícito

Varios routers usan `protectedProcedure` + `doctorProcedure` en distintas operations del mismo router. Esto significa que algunas operations están abiertas a CUALQUIER user logueado (no solo DOCTOR), lo cual podría exponer data clínica.

**Routers afectados** (revisar individualmente):
- `alergia.ts` — protected
- `analytics.ts` — protected
- `compliance.ts` — protected
- `consent.ts` — protected
- `document.ts` — protected
- `encounter.ts` — protected
- `insurance.ts` — protected
- `invoice.ts` — protected
- `labResult.ts` — protected
- `medication.ts` — protected
- `patient.ts` — protected
- `tag.ts` — protected
- `template.ts` — protected
- `vaccine.ts` — protected
- `waitingRoom.ts` — protected
- `workspace.ts` — protected

**Audit recomendado**: revisar cada procedure `protected` y determinar si debería ser `doctorProcedure` (solo doctor) o si legítimamente es para CLINIC_ADMIN u otro role.

### Gap #2: ~~`billing.ts` solo usa `protected`~~ ✅ Cerrado (audit S6, 2026-07-06)

`createCheckoutSession` ahora usa `doctorProcedure`. El inline check de ownership (`input.entityId === ctx.session.id`) se mantiene. La rama `entityType="clinic"` lanza `NOT_IMPLEMENTED` con un mensaje claro apuntando a `clinicAdmin.ts` (que tendrá su propio `clinicAdminProcedure` cuando se wireé el flow).

Cierre verificado en:
- `server/routers/billing.ts`
- `tests/unit/permissions.test.ts` (billing.ts removido de `KNOWN_GAPS`)
- Commit message del audit S6

### Gap #3: ~~`staffNote.ts` solo usa `protected`~~ ✅ Cerrado (audit S5, 2026-07-06)

Los 3 procedures (`list`, `add`, `delete`) ahora usan `doctorProcedure`. La lógica es: como staff (SECRETARY/ASSISTANT/NURSE) no tiene login todavía (Gap #5), solo DOCTOR puede escribir/leer/borrar notas. Cuando staff login se implemente, se introduce un nuevo `staffProcedure` con PIN-based auth y se distribuyen los procedures apropiadamente.

Cierre verificado en:
- `server/routers/staffNote.ts`
- `tests/unit/permissions.test.ts` (staffNote.ts ahora en `["doctor"]`, removido de KNOWN_GAPS si aplica)

### Gap #4: ~~`task.ts` solo usa `protected`~~ ✅ Cerrado (audit S7, 2026-07-06)

Las 6 procedures (`list`, `create`, `complete`, `update`, `delete`) migradas a `doctorProcedure`. Tasks son coordinación interna del workspace; como staff no tiene login todavía (Gap #5), solo DOCTOR puede manejarlas. Cuando staff login se implemente, agregar `staffProcedure` y abrir `list`/`complete` a SECRETARY/ASSISTANT.

### Gap #5: staff sin login propio

Si se quiere que SECRETARY/ASSISTANT/NURSE accedan al sistema:
- Necesitan un `staffProcedure` con PIN-based auth (no password-based)
- Necesitan UI para cada role diferenciado
- Necesitan tests de permisos

---

## 5. Tests de permisos

Ver `tests/unit/permissions.test.ts`. Tests cubren:
- `doctorProcedure` rechaza role !== "DOCTOR"
- `portalProcedure` rechaza role !== "PATIENT"
- `clinicAdminProcedure` rechaza role !== "CLINIC_ADMIN" o sin clinicId
- `protectedProcedure` rechaza session null
- `publicProcedure` acepta cualquiera (incluso sin session)

---

## 6. Pendientes

| # | Gap | Effort | Plan |
|---|---|---|---|
| 1 | Auditar routers "mixto" (ver Gap #1) | 2-3 horas | ✅ **Done (audit S5 + S7, 2026-07-06)**: 14 routers migrados a `doctorProcedure` donde aplica — alergia, tag, vaccine, labResult, medication, template, staffNote (S5); task, waitingRoom, consent, insurance (S7). Pendientes legítimos (decisión clínica confirmada): `patient.ts` (lookupByCedula/register/getRegistration/update → portal), `invoice.ts` (list/get → portal), `workspace.ts` (current → cualquier user conoce su workspace), `mensaje.ts` (portal patient messaging), `icd10.ts` (autocomplete CIE-10), `appointment.ts` (mixto doctor+portal+protected). Total: **14 routers cerrados de 15 auditables**. |
| 2 | Implementar `staffProcedure` con PIN auth | 1-2 días | Crear `staffLogin.ts`, agregar `staffProcedure` a trpc.ts, proteger operations relevantes |
| 3 | UI diferenciada por rol staff | 2-3 días | Dashboards separados para SECRETARY/ASSISTANT/NURSE. Depende de Gap #1 (staffProcedure con PIN auth). |
| 4 | `billing.ts` role-check interno | 30 min | ✅ **Done (audit S6, 2026-07-06)** — `createCheckoutSession` migrado a `doctorProcedure`. |
| 5 | `staffNote.ts` role-check interno | 30 min | Decidir si es staff o doctor |

---

## 7. Changelog

- **2026-07-02**: Documentación inicial. Cierra audit #9 (read-only).
  - Crea `docs/PERMISSIONS.md` con matriz actual + gaps.
  - Crea `tests/unit/permissions.test.ts` con tests básicos.
- **2026-07-06**: Gap #2 cerrado (audit S6) + Gap #1 parcial + Gap #3 cerrado (audit S5).
  - **S6 billing.ts**: `createCheckoutSession` migrado de `protectedProcedure` a `doctorProcedure`. Inline check de ownership preservado. Rama clinic ahora `NOT_IMPLEMENTED`.
  - **S5 (8 routers)**: alergia, tag, vaccine, labResult, medication, template, staffNote, workspace (parcial) — procedures `protectedProcedure` migradas a `doctorProcedure` donde la operación es claramente clínica. Razones documentadas en cada archivo.
  - **vitest config**: excluido `.next/standalone/**` y `out/**` (stale build artifacts corrían tests duplicados contra código viejo).
  - **permissions.test.ts**: agregada exception `WORKSPACE_OPT_OUT = {"billing.ts"}` para el multi-tenancy invariant (Stripe subscriptions son doctor-scoped, no workspace-scoped).
- **2026-07-06**: Gap #1 cierre mayor + Gap #4 cerrado (audit S7).
  - **S7 task.ts**: 6 procedures (`list`, `create`, `complete`, `update`, `delete`) migradas a `doctorProcedure`. Tasks son coordinación interna del workspace; como staff no tiene login todavía (Gap #5), solo DOCTOR las maneja.
  - **S7 waitingRoom.ts**: 5 procedures (`today`, `checkin`, `callPatient`, `done`, `remove`) todas a `doctorProcedure`. Recepción es doctor-only hasta que staff login se implemente.
  - **S7 consent.ts**: `listTemplates` + `createConsent` a `doctorProcedure` (template management). `listPatientConsents` + `signConsent` se mantienen `protectedProcedure` (portal patient signature).
  - **S7 insurance.ts**: `listProviders` a `doctorProcedure` (catálogo clínico). Las 3 `PatientInsurance` ops se mantienen `protectedProcedure` (portal patient self-service).
  - **permissions.test.ts**: actualizadas `EXPECTED_PROCEDURES` para task.ts y waitingRoom.ts. `SHOULD_REQUIRE_DOCTOR` extendida con `task.ts` y `waitingRoom.ts`. **251/251 tests pass**.