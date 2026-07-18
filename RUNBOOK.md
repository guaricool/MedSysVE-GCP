# MedSysVE — Runbook de Producción

> **Última actualización:** 2026-07-02
> **HEAD actual:** `fd73314` en `master`
> **Dominio público:** `https://www.medsysve.com` (siempre usar `www`, apex pierde cookies — ver AGENTS.md / MEMORY.md sobre Traefik apex→www cookie drop)
> **Cloud Run dashboard:** `http://13.140.181.29:8000/`

---

## 🔐 Credenciales

| Sistema | Usuario | Password | URL |
|---|---|---|---|
| **MedSysVE (doctor)** | `joguelpinto0810@gmail.com` | `<joel-password>` | https://medsysve.13.140.181.29.sslip.io/login |
| **Cloud Run** | `cpierluissis@gmail.com` | `<Cloud Run-admin-password>` | http://13.140.181.29:8000/login |
| **PostgreSQL** | `medsysve` | `<db-password>` | host: `tf03dm49her0vco2lprdqbjm:5432`, db: `medsysve` (solo accesible desde dentro del GCP) |

> **Importante:** Las passwords reales NO viven en este documento (audit de seguridad #3 — ver git log). Para reset operacional, contactar al dev owner o rotar desde Cloud Run UI / psql directo.

---

## 🏗 Arquitectura

| Componente | Tecnología | Estado |
|---|---|---|
| App | Next.js 16.2.9 standalone | Running (HEAD `5b65856`) |
| DB | PostgreSQL 16 (Cloud Run container) | Running |
| Cache | Redis 7 (Cloud Run container) | Running |
| Reverse proxy | Cloud Run v4.1.2 / Traefik | OK |
| Build pack | Dockerfile | OK |
| Dominio | `*.13.140.181.29.sslip.io` (wildcard sslip.io) | OK |

**Importante:** el FS de Cloud Run es **efímero**. Los archivos en `public/uploads/` se borran al reiniciar el contenedor. Por eso **todos los PDFs se generan on-demand** desde la DB (no se guardan en disco).

---

## 📄 Rutas de PDF (todas validadas)

| PDF | Ruta | Estado |
|---|---|---|
| Historia clínica | `GET /api/pdf/history/[patientRegId]` | ✅ 200, ~3 KB |
| Encuentro firmado | `GET /api/pdf/encounter/[id]` | ✅ 200, ~4.5 KB |
| Factura | `GET /api/pdf/invoice/[id]` | ✅ 200, ~3 KB |
| Reporte financiero mensual | `GET /api/pdf/report/[year]/[month]` | ✅ 200, ~4.5 KB |
| Carné de vacunas | `GET /api/pdf/vaccine-carnet/[patientRegId]` | ✅ 200, ~3.8 KB |
| Receta médica | `GET /api/pdf/prescription/[id]` | ✅ ruta existe, no testeada sin receta |
| Orden de laboratorio | `GET /api/pdf/lab-order/[id]` | ✅ ruta existe |
| Orden de imagen | `GET /api/pdf/imaging-order/[id]` | ✅ ruta existe |
| Documento (reposo/informe/referido/certificado) | `GET /api/pdf/document/[id]` | ✅ ruta existe, valida ID |

**Convención de filenames:** `tipo-NombreApellido-DDMMYYYY.pdf` (ej: `factura-F-000001.pdf`, `consulta-PacientePrueba-22062026.pdf`)

---

## 🔄 Deploys

### Deploy normal (cuando hay cambios en el repo)

1. Push al fork (`https://github.com/cpierluissis/MedSysVE`) — **PRIMERO: hay que forkear el repo**
2. Cloud Run detecta el push (webhook) y rebuildea automáticamente
3. El pre-deployment command (`npx prisma migrate deploy`) corre antes del nuevo contenedor
4. El nuevo contenedor levanta con `CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]` (ya arreglado en commit `112ed33`)

### Deploy manual desde Cloud Run UI

1. Cloud Run → Project `MedSysVE` → Environment `production` → Application `medsysve`
2. Click en **"Redeploy"** (header de la app)
3. Esperar ~2-3 min para build + deploy

### Revertir a una versión anterior

1. Cloud Run → Application `medsysve` → tab **"Rollback"**
2. Seleccionar el commit/tag al que quieres volver
3. Confirmar

### Migraciones Prisma: drift P3009 (ALTER TABLE pre-deploy)

**Síntoma**: el deploy de Cloud Run revienta con `prisma migrate deploy` corriendo `P3009: failed to migrate database; the database is not empty` o `drift detected: migration X was modified after it was applied`.

**Cuándo pasa**: cuando se aplicó una migration manualmente (ej. `psql -c "ALTER TABLE ..."`) ANTES del deploy, sin que `_prisma_migrations` se actualizara. Prisma detecta que la columna existe en la DB pero la migration está marcada como "no aplicada", y rechaza correr el SQL de nuevo.

**Caso real**: 2026-07-02 — Carlos aplicó `ALTER TABLE "AuditEvent" ADD COLUMN "archivedAt" TIMESTAMP(3)` directamente con `psql` para desbloquear el deploy del audit #10, pero no actualizó `_prisma_migrations`. El deploy de Cloud Run no podía avanzar porque Prisma asumía que la migration era nueva y se quejaba de drift.

**Workaround de 2 pasos**:

1. **Antes del deploy** (idealmente en un commit follow-up, ver paso 2):
   ```sql
   -- Conectar al Postgres de prod (container `tf03dm49her0vco2lprdqbjm`)
   psql -U medsysve -d medsysve
   -- Confirmar que la columna existe
   \d "AuditEvent"  -- verificar que archivedAt está ahí
   -- Marcar la migration como aplicada manualmente
   INSERT INTO "_prisma_migrations" (
     "id", "checksum", "migration_name", "started_at", "finished_at", "applied_steps_count"
   ) VALUES (
     gen_random_uuid()::text,
     '<checksum del archivo migration.sql>',
     '20260702191500_audit_event_archival',
     NOW(), NOW(), 1
   );
   ```
   - El `checksum` se saca del archivo `migration.sql` (Prisma lo calcula al `migrate dev`) — alternativa pragmática: copiar el checksum de cualquier otra fila de `_prisma_migrations` que tenga el mismo nombre-prefix.
2. **Push de un retrigger vacío** (`git commit --allow-empty -m "chore: retrigger Cloud Run deploy after migration resolve"`) para forzar al webhook a reintentar el deploy sobre el mismo SHA. Esta es la técnica usada en `8b66522`.

**Workaround moderno (preferido a futuro)**:

Una vez que Cloud Run ya levantó la app con la migration aplicada, podemos normalizar desde la consola del container:

```bash
# Dentro del container de la app
npx prisma migrate resolve --applied 20260702191500_audit_event_archival
npx prisma migrate deploy  # ahora corre limpio
```

Esto evita el workaround manual de `INSERT INTO _prisma_migrations` y deja a Prisma registrar la migration como aplicada correctamente. **Recomendado para futuras migraciones pre-aplicadas.**

**Prevención**: si necesitás aplicar un ALTER antes del deploy (ej. para desbloquear un hotfix urgente), **siempre** hacelo desde la consola del container via `npx prisma migrate deploy` (que registra correctamente), o aplicá manualmente pero usá `prisma migrate resolve --applied` inmediatamente después para que `_prisma_migrations` quede consistente.

---

## 💊 Redis — medicamentos cacheados

**Problema conocido:** Redis se vacía al reiniciar el contenedor. El catálogo de medicamentos (~501 fármacos) se vuelve a cargar con este endpoint:

```bash
# Desde el browser con sesión de doctor activa:
fetch('/api/admin/seed-medications', { method: 'POST' })
  .then(r => r.json()).then(console.log)
# Esperado: { ok: true, upserted: ~501, redisLoaded: ~501 }
```

**Hacerlo después de cada deploy o reinicio.**

---

## ⏰ Cron jobs (a configurar)

Hay 2 cron jobs definidos pero no están corriendo. Configurar con un cron externo (ej: `cron-job.org`, `EasyCron`, o un cron en Cloud Run):

| Endpoint | Schedule | Header |
|---|---|---|
| `POST /api/cron/appointment-reminders` | Diario 8:00 AM | `Authorization: Bearer $CRON_SECRET` |
| `POST /api/cron/bcv-update` | Cada 6 horas | `Authorization: Bearer $CRON_SECRET` |

El `CRON_SECRET` está en las env vars de Cloud Run.

### Env vars requeridas (Cloud Run → app `medsysve` → Environment)

| Variable | Tipo | Generar con | Notas |
|---|---|---|---|
| `DATABASE_URL` | URL | (auto desde Cloud Run DB) | Connection string de Postgres. Si rota, actualizar aquí Y correr `ALTER USER` en Postgres. Ver sección "Drift P3009" arriba. |
| `FIELD_ENCRYPTION_KEY` | base64 (32 bytes) | `openssl rand -base64 32` | AES-256-GCM para cifrar PHI. Rotar quarterly (ver `docs/DR-PLAN.md`). |
| `FIELD_HMAC_KEY` | base64 (≥16 bytes) | `openssl rand -base64 32` | HMAC-SHA-256 para índices buscables (cédula, motivo). Rotar invalida búsquedas. |
| `FIELD_SIGN_KEY` | base64 (32 bytes) | `openssl rand -base64 32` | **Agregado en commit `32ae673`** (audit #23). HMAC para sign de encounters. Separado de `FIELD_ENCRYPTION_KEY` para que rotar una no invalide la otra. Si falta, **todo `encounter.sign` falla con `FIELD_ENCRYPTION_KEY required to sign encounters`** (mensaje engañoso). |
| `FEATURE_FLAGS` | JSON | `{"ai":{"enabled":true,"rolloutPercent":100}}` | Ver `docs/FEATURE_FLAGS.md`. Default si falta: AI on 100%. |
| `STRIPE_SECRET_KEY` | string | Stripe dashboard | `sk_live_*` = producción, `sk_test_*` = test. Auto-detectado por `isStripeLiveMode()`. |
| `STRIPE_WEBHOOK_SECRET` | string | Stripe dashboard | `whsec_*` para verificar firmas de webhook. |
| `ANTHROPIC_API_KEY` | string | console.anthropic.com | Para AI features (dose-suggestion, drug-interactions, etc.). |
| `GOOGLE_SMTP_USER` + `GOOGLE_SMTP_APP_PASSWORD` | creds | Google App Passwords | Para emails transaccionales. |
| `NEXTAUTH_SECRET` | string | `openssl rand -base64 32` | Auth.js v5 secret. |
| `NEXTAUTH_URL` | URL | `https://www.medsysve.com` | Para Auth.js callbacks. |

**Verificación rápida** (desde GCP, sin app):
```bash
docker exec <medsysve-container> sh -c 'for v in DATABASE_URL FIELD_ENCRYPTION_KEY FIELD_HMAC_KEY FIELD_SIGN_KEY FEATURE_FLAGS STRIPE_SECRET_KEY ANTHROPIC_API_KEY NEXTAUTH_SECRET; do echo -n "$v: "; if printenv "$v" >/dev/null 2>&1; then echo "set"; else echo "MISSING"; fi; done'
```

---

## 🐛 Bugs conocidos y workarounds

| # | Bug | Severidad | Workaround / Fix |
|---|---|---|---|
| 1 | Lista de pacientes no muestra sin búsqueda activa | Baja (UX) | Decisión de diseño (lazy-load). El paciente existe, solo hay que buscarlo. |
| 2 | Pre/Post deployment commands vacíos en Cloud Run | Media | **Arreglado**: pre-deployment ahora es `npx prisma migrate deploy` |
| 3 | Dockerfile no ejecutaba `prisma migrate deploy` al startup | Alta | **Arreglado en commit `112ed33`**: CMD ahora es `sh -c "npx prisma migrate deploy && node server.js"`. Requiere fork + push para que tome efecto. |
| 4 | Redis se vacía al reiniciar | Media | Documentado. Ejecutar `seed-medications` después de cada restart. |
| 5 | Docs dicen Twilio pero código usa Meta Cloud API | Baja | **Arreglado**: actualizados `.env.example`, `Cloud Run/docker-compose.yml`, `SISTEMA.md`, `docs/MEMORIA-SISTEMA.md`. |

---

## 🆘 Troubleshooting

### El sistema no responde (`sysve.13.140.181.29.sslip.io` da 404)

**Causa probable:** El contenedor app está corriendo pero el proxy de Cloud Run no enrutó, o el contenedor crasheó al startup.

**Diagnóstico:**
1. Cloud Run → Application `medsysve` → tab **"Logs"**
2. Buscar errores en el startup
3. Si hay error de `prisma migrate deploy` (porque no puede conectar a la DB), revisar env vars de la DB
5. Si el contenedor está "running" pero la app no responde, hacer **"Restart"**

### La DB no responde

**Causa probable:** El contenedor de Postgres está caído o la red entre contenedores se rompió.

**Diagnóstico:**
1. Cloud Run → Databases → `medsysve-db` → tab **"Logs"**
2. Verificar que el contenedor está running
3. Si está caído, hacer **"Start"**

### La búsqueda de paciente tarda mucho (>5s) o cuelga

**Causa probable:** Redis no tiene medicamentos cacheados, y la query de autocomplete intenta ir a la DB.

**Fix:**
```bash
fetch('/api/admin/seed-medications', { method: 'POST' })
```

---

## 📞 Contacto soporte

- **Dev owner:** Carlos Pierluissi
- **Repo fork:** `https://github.com/cpierluissis/MedSysVE` (a crear)
- **Repo upstream:** `https://github.com/guaricool/MedSysVE`
- **Stack:** Next.js 16, Prisma 7, PostgreSQL 16, Redis 7, tRPC 11, Auth.js 5

---

**Nota final:** Este runbook se actualizó después de la sesión de validación 2026-06-21. Los 5 PDFs prioritarios (historia, encuentro, factura, reporte, carné) están validados y funcionando en producción.
