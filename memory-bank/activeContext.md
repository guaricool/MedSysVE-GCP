# Contexto Activo

El proyecto **[[MedSysVE]]** se encuentra actualmente con toda su infraestructura desplegada en **Google Cloud Run** y una conexión estable a la base de datos **Cloud SQL**.

## Modificaciones Recientes
El estado actual de la plataforma incorpora nuevos formularios especializados inyectados dinámicamente en el **[[EncounterWorkspace]]**. 
Las últimas integraciones fueron:
- **[[PsiquiatriaForm]]**: Herramienta de Historia Clínica que agrega el Examen Mental estructurado (MSE) y calculadoras clínicas como PHQ-9 (Depresión) y GAD-7 (Ansiedad), así como alertas de Riesgo Suicida.
- **[[InfectologiaForm]]**: Panel avanzado de monitoreo de infecciones y control antimicrobiano. Incluye escalas predictivas de Sepsis (**qSOFA**, **SIRS**) y campos estructurados para seguimiento crónico de VIH (Carga Viral, CD4), Hepatitis, y Tuberculosis.

- **Hardening de Seguridad & Remediación Auditoría 360° (Julio 2026)**:
  - Finalización exitosa de la auditoría 360° y saneamiento completo de credenciales (Hallazgos C1, C2, C3, C4, H1-H5).
  - Eliminación 100% de la URL PostgreSQL hardcodeada y fallbacks de `AUTH_SECRET` en `lib/auth.ts` y `lib/db.ts` (lanzando excepción explícita en producción `CRITICAL: AUTH_SECRET / DATABASE_URL missing`).
  - Protección preventiva de `createContext` y `protectedProcedure` en `server/trpc.ts` validando `ensureDbSchema()` y disponibilidad de `ctx.db`.
  - Adición de `TraumaAoClassification` en DDL `ensureDbSchema()` de `lib/db.ts` y sincronización en Prisma.
  - Invocación preventiva de `ensureDbSchema()` en endpoints REST de PDF (`app/api/pdf/allergy-report/[id]/route.ts`).
  - Inyección de secretos en Cloud Run mediante variables `env` con `value_source.secret_key_ref` desde GCP Secret Manager en `terraform/cloudrun.tf`.
  - Estado del proyecto: 100% verificado (`npx tsc --noEmit` con 0 errores), commiteado y listo para despliegue.

- **Defensas Anti-Scraping y Perímetro (Julio 2026)**: 
  - Restricción de Ingress (`terraform/cloudrun.tf`) para forzar tráfico por Cloud Armor.
  - Rate Limiter perimetral distribuido vía `@upstash/redis` en `proxy.ts` Edge.
  - Rate Limiter anti "Slow Scraping" a nivel de `tRPC` (`server/trpc.ts`), acotado por `userId`, con alertas críticas de auditoría (`PAGINATION_ANOMALY`).
## Integraciones y Dependencias 
Estos dos formularios han sido enlazados dentro del componente principal `components/encounter/encounter-workspace.tsx`. Las dependencias internas para su renderizado y comunicación via tRPC con la base de datos están intactas.

Para explorar el mapa visual del proyecto y cómo interactúan, revisa la salida en **[[graphify-out/GRAPH_REPORT]]**.
