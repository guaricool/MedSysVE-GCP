# Progreso del Proyecto

## Estado Actual de Tareas

### Completed (Julio 2026)
- [x] **Hardening de Seguridad & Sanitización de Secretos (2026-07-29)**:
  - Eliminación total de credenciales PostgreSQL hardcodeadas (`lib/db.ts`, `scripts/*`, `restore-dump.js`, etc.).
  - Remoción de fallbacks inseguros de `AUTH_SECRET` / `NEXTAUTH_SECRET` (`lib/auth.ts`, `lib/auth-edge.ts`).
  - Mapeo de secretos GCP Secret Manager en Terraform (`terraform/cloudrun.tf`).
  - Migración del endpoint de cron a método `POST` (`app/api/cron/appointment-reminders/route.ts`).
  - Alineación de modelos de Bots en `prisma/schema.prisma` (`BotConfig`, `BotConversation`, `BotMessage`, `BotLead`).
  - Reglas de exclusión en `.gitignore` para dumps `*.sql`, `*.dump` y archivos de claves.
  - Verificación `npx tsc --noEmit` completada con **0 errores**.
- [x] **Gemini Spark Ambient Clinical AI Scribe**: `/api/ai/ambient-scribe` con filtrado de ruido social y auto-llenado SOAP en tiempo real.
- [x] **27 Especialidades Médicas & PACS/DICOM Integrado**: Infraestructura DICOM nativa y formularios especializados.
- [x] **Defensas Anti-Scraping & Perímetro**: Rate limiters en Edge y tRPC + Ingress restrictivo en Cloud Run.

### In Progress / Upcoming
- [ ] Monitoreo continuo de logs en producción vía GCP Cloud Logging / GlitchTip.
- [ ] Optimización periódica de índices PostgreSQL HMAC.
