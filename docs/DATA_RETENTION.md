# Data Retention Policy — MedSysVE

> **Última actualización:** 2026-07-02
> **Aplicabilidad:** Venezuela (clínicas usando MedSysVE)
> **Compliance base:** LOPDP (Ley Orgánica de Protección de Datos Personales, Venezuela)

---

## TL;DR

- **Audit log (`AuditEvent`)**: 5 años hot (consultable normalmente), después archived (sigue en DB pero flag `archivedAt` set). Retenido **indefinidamente** para compliance.
- **PHI cifrado (Patient, Doctor, etc.)**: retenido mientras la historia clínica esté activa. No hay TTL automático — la retención está atada al ciclo de vida del paciente.
- **Backups cifrados en Google Drive**: 90 días rotativos (ver `docs/DR-PLAN.md`).

---

## 1. Compliance base — LOPDP Venezuela

MedSysVE sirve a clínicas **venezolanas** y por tanto está sujeto a:

- **LOPDP** (Ley Orgánica de Protección de Datos Personales, Gaceta Oficial 2021) — base legal para protección de datos personales, incluyendo datos de salud.
- **Normativa del MPPS** (Ministerio del Poder Popular para la Salud) — regulación específica del sector salud.

**HIPAA (Estados Unidos) NO aplica** a MedSysVE. Es借鉴 como referencia de buenas prácticas (encryption at rest, audit log comprehensivo, access controls), pero **NO es base legal**.

---

## 2. Audit log retention (5 años + archived indefinido)

### Por qué 5 años

- LOPDP venezolano no específica un período exacto para audit logs de sistemas de salud, pero la práctica internacional y la jurisprudencia comparable sugiere 5-7 años.
- 5 años es suficiente para:
  - Investigaciones de breach internas (ventana típica: 1-2 años)
  - Requerimientos de fiscalización del MPPS
  - Compliance con potenciales demandas civiles (prescripción típica: 5-10 años)

### Cómo funciona

El modelo `AuditEvent` tiene una columna `archivedAt DateTime?`:

```sql
-- Filas archivadas (>5 años)
SELECT COUNT(*) FROM "AuditEvent" WHERE "archivedAt" IS NOT NULL;

-- Filas activas (default query path)
SELECT * FROM "AuditEvent" WHERE "archivedAt" IS NULL;
```

Las filas archivadas siguen en la DB (cumplen retention indefinida), pero están excluidas de queries por default. Para incluirlas explícitamente:

```typescript
await prisma.auditEvent.findMany({
  where: {
    OR: [
      { archivedAt: null },
      { archivedAt: { not: null } } // explícito para compliance review
    ]
  }
})
```

### Script de archivo

```bash
# Dry-run (no escribe)
npx tsx scripts/archive-old-audit-events.ts --dry-run

# Aplicar (5 años por default)
npx tsx scripts/archive-old-audit-events.ts

# Custom retention (ej. 7 años)
npx tsx scripts/archive-old-audit-events.ts --retention-years=7
```

**Requisitos**:
- `DATABASE_URL` debe estar set (lo lee del env)
- Acceso de red al Postgres container
- Prisma 7 client + adapter (ya configurados en el repo)

**Idempotente**: corre múltiples veces sin duplicar efecto.

### Cron recomendado (mensual)

Configurar en Coolify UI → Scheduled Tasks:

```bash
0 3 1 * * cd /app && npx tsx scripts/archive-old-audit-events.ts >> /var/log/medsysve-archive.log 2>&1
```

- Día 1 de cada mes, 03:00 UTC
- Output al log para auditoría
- Si falla, alerta por email (configurar msmtp)

---

## 3. PHI cifrado (Patient, Doctor, etc.)

### Retention atada al ciclo de vida del paciente

No hay TTL automático para PHI cifrado. La retención depende de:

- **Paciente activo**: PHI retenido mientras el paciente siga registrado en el workspace.
- **Baja de paciente (LOPDP Art. 61 — Derecho de Cancelación)**:
  - Soft-delete via `DataDeletionRequest` (ya implementado en `prisma/schema.prisma`)
  - Tombstone + audit trail preservado
  - El doctor owner aprueba vía UI
- **Soft-delete de historia clínica**: NO permitido. Una vez firmada, la historia es inmutable (signed encounters).

### Compliance check

```sql
-- Pacientes activos
SELECT COUNT(*) FROM "Patient" WHERE "deletedAt" IS NULL;

-- Pacientes soft-deleted (LOPDP Art. 61)
SELECT COUNT(*) FROM "DataDeletionRequest" WHERE status = 'COMPLETED';

-- PHI cifrado sin cifrar (debe ser 0 después de #1)
SELECT COUNT(*) FROM "Patient" WHERE "nombreCifrado" IS NULL AND nombre IS NOT NULL;
```

---

## 4. Backups cifrados en Google Drive

Ver `docs/DR-PLAN.md` para detalles completos.

- **Frecuencia**: diaria (07:00 UTC)
- **Retención**: 90 días rotativos (script borra backups >90 días)
- **Storage**: cifrado AES-256 (rclone crypt layer) sobre Google Drive (`MedSysVE-Backups/`)
- **Restore**: `bash /opt/medsysve-backup/restore.sh [YYYYMMDD]`

---

## 5. Otros datos con retention específica

| Dato | Retention | Compliance |
|---|---|---|
| `LegalVersion` (ToS, Privacy, etc.) | Indefinido | LOPDP — versiones publicadas con sha256 + metadata |
| `ConsentAcceptance` | Indefinido | LOPDP Art. 12 — consentimiento explícito + audit trail |
| `BreachIncident` | 7 años post-resolución | LOPDP + buenas prácticas |
| `DataExportRequest` | 90 días post-completado | Operacional (no compliance) |
| `DataDeletionRequest` | 5 años post-completado | LOPDP Art. 61 — auditoría de cancelaciones |
| `Session` (NextAuth) | 30 días post-expiración | Operacional |
| `Notification` | 90 días post-creación | Operacional (no regulado) |

---

## 6. Pendientes / Known gaps

| # | Gap | Plan | Status |
|---|---|---|---|
| 1 | Cron de archive no configurado en Coolify UI | Configurar manualmente en Coolify (no commiteo config) | ✅ **Done** — Scheduled Task `archive-old-audit-events` creado via Coolify API (UUID `nllwougfbwz0tanqw0ud05x0`, frequency `0 3 1 * *`, próx corrida 2026-08-01 03:00 UTC). Verificado end-to-end con `--dry-run`. |
| 2 | App code no filtra `archivedAt IS NULL` por default | Pendiente para otra sesión (búsqueda en routers de `prisma.auditEvent.findMany` para agregar filter) | ✅ **Done** — Helpers en `lib/audit.ts`: `listActiveAuditEvents`, `getActiveAuditEvent`, `countActiveAuditEvents`. Todos default a `archivedAt: null`. Para queries de compliance/LOPDP que sí quieren archived rows, pasar `includeArchived: true`. Búsqueda en app code actual: NO hay `prisma.auditEvent.findMany` en routers (audit events solo se escriben, no se leen desde app); los helpers están listos para uso futuro. |
| 3 | Sin alerta si archive script falla | Configurar monitoreo de `/var/log/medsysve-archive.log` | Pendiente |

---

## 7. Changelog

- **2026-07-02 — Phase 43 Item 2**: Archived-events helpers en `lib/audit.ts`. Gap #2 cerrado. No requirió migración (cambió solo el código de lectura).
- **2026-07-02**: Policy inicial. Cierra audit item #10.
  - Migration: `20260702191500_audit_event_archival` (adds `archivedAt` + index).
  - Schema: `prisma/schema.prisma` (modelo `AuditEvent` con `archivedAt DateTime?`).
  - Script: `scripts/archive-old-audit-events.ts` (idempotente, --dry-run, --retention-years).
  - Doc: este archivo.