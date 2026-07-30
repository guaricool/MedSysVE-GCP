# Contexto Tecnológico (Tech Context)

## Arquitectura de Seguridad y Gestión de Secretos

- **Base de Datos (`DATABASE_URL`)**:
  - PostgreSQL gestionado en GCP Cloud SQL (`34.23.154.130:5432`).
  - Inyección estricta mediante variable de entorno `DATABASE_URL`. Sin fallbacks hardcodeados en código fuente o scripts.
  - En Cloud Run (`terraform/cloudrun.tf`), la variable se inyecta desde GCP Secret Manager mediante `secret_key_ref` (secreto `medsysve-database-url`).

- **Autenticación & JWT (`AUTH_SECRET` / `NEXTAUTH_SECRET`)**:
  - Auth.js v5 con firma JWT.
  - Exclusión de fallbacks por defecto en `lib/auth.ts` y `lib/auth-edge.ts`.
  - En producción, si `AUTH_SECRET` o `NEXTAUTH_SECRET` no está presente, se lanza una excepción explícita que bloquea la inicialización insegura.
  - Inyección en Cloud Run vía GCP Secret Manager (`medsysve-auth-secret`).

- **Cifrado de Campos (PHI Encryption)**:
  - `FIELD_ENCRYPTION_KEY`: AES-256-GCM para datos de salud protegidos (cédula, nombres, historias clínicas, diagnósticos). Inyectado desde GCP Secret Manager (`medsysve-field-encryption-key`).
  - `FIELD_HMAC_KEY`: HMAC-SHA-256 para búsquedas deterministas e indexables sobre campos cifrados.
  - `FIELD_SIGN_KEY`: HMAC-SHA-256 para firma e integridad de audit trail.

- **Integraciones de Terceros & Cron**:
  - `STRIPE_SECRET_KEY`: Gestionado vía GCP Secret Manager (`medsysve-stripe-secret-key`).
  - `CRON_SECRET`: Bearer token requerido en cabecera `Authorization` para invocar tareas programadas. En la ruta `app/api/cron/appointment-reminders/route.ts`, se exige método `POST` y validación de `Bearer ${CRON_SECRET}`. Inyectado vía GCP Secret Manager (`medsysve-cron-secret`).

- **Infraestructura Cloud Run (Terraform)**:
  - `terraform/cloudrun.tf` define `google_cloud_run_v2_service` con `ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"` forzando paso por Cloud Armor.
  - Bloque `env` mapea cada variable sensible contra su respectivo secreto en Secret Manager (`version = "latest"`).
