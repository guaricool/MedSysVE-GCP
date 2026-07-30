# Progreso del Proyecto

## Estado Actual de Tareas

### Completed (Julio 2026)
- [x] **Hardening de Seguridad & Remedación Auditoría C1-C3 / H1-H5 (2026-07-30)**:
  - Remoción de fallbacks inseguros en `lib/auth.ts` y `lib/db.ts` (excepción crítica en producción si faltan variables).
  - Protección de `createContext` y `protectedProcedure` en `server/trpc.ts` validando disponibilidad de `ctx.db` y `ensureDbSchema()`.
  - Adición de `TraumaAoClassification` en DDL `ensureDbSchema()` de `lib/db.ts` y sincronización en Prisma.
  - Invocación preventiva de `ensureDbSchema()` en endpoints REST de PDF (`app/api/pdf/allergy-report/[id]/route.ts`).
  - Verificación `npx tsc --noEmit` completada con **0 errores**.
- [x] **Gemini Spark Ambient Clinical AI Scribe**: `/api/ai/ambient-scribe` con filtrado de ruido social y auto-llenado SOAP en tiempo real.
- [x] **27 Especialidades Médicas & PACS/DICOM Integrado**: Infraestructura DICOM nativa y formularios especializados.
- [x] **Defensas Anti-Scraping & Perímetro**: Rate limiters en Edge y tRPC + Ingress restrictivo en Cloud Run.

### In Progress / Upcoming
- [ ] Monitoreo continuo de logs en producción vía GCP Cloud Logging / GlitchTip.
- [ ] Optimización periódica de índices PostgreSQL HMAC.
