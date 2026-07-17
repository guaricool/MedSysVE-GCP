# MedSysVE — DR Plan (Disaster Recovery)

> **Última actualización:** 2026-07-02
> **Owner:** Carlos Arturo Pierluissis Pinto (`cpierluissis@gmail.com`)
> **VPS:** `vmi3370059.contaboserver.net` (Contabo, `13.140.181.29`)
> **Dominio público:** `https://www.medsysve.com` (Traefik)
> **Almacenamiento off-site:** Google Drive (cuenta `cpierluissis@gmail.com`)

---

## 1. Resumen ejecutivo

| Métrica | Valor actual |
|---|---|
| **RPO** (Recovery Point Objective) | **≤ 24 h** — backup diario a las 07:00 UTC |
| **RTO** (Recovery Time Objective) | **~30 min** — restore.sh automatizado, asumiendo VPS disponible |
| **Retención** | **90 días** de dumps en Drive |
| **Storage off-site** | Google Drive (`MedSysVE-Backups/`), cifrado con rclone crypt layer (AES-256) |
| **Estado del último backup** | Verificar con `bash /opt/medsysve-backup/health-check.sh` |

**Gap conocido:** single point of failure del VPS Contabo. Si el VPS muere físicamente, hay que provisionar uno nuevo y restaurar (RTO estimado: **2-4 horas** contando provisioning + restore). Pendiente documentar provisioning automatizado.

---

## 2. Arquitectura del backup chain

```
┌─────────────────────────────────────────────────────────────────────┐
│ VPS Contabo (13.140.181.29)                                         │
│                                                                     │
│  ┌──────────────────┐   dump     ┌──────────────────────────────┐  │
│  │ Postgres 16      │──────────▶│ /tmp/medsysve-backup-        │  │
│  │ tf03dm49...      │  pg_dump   │ <DATE>.sql.gz                 │  │
│  └──────────────────┘   + gzip   └──────────────────────────────┘  │
│                                                                     │
│                                         │                            │
│                                         │ rclone copy                │
│                                         ▼                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ rclone remote: gdrive-medsysve-crypt:backups/                 │  │
│  │   layer 1: crypt (AES-256, key in gocryptfs vault)            │  │
│  │   layer 2: drive (OAuth token in gocryptfs vault)              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTPS (TLS Google)
                                          ▼
                              ┌──────────────────────┐
                              │ Google Drive         │
                              │ MedSysVE-Backups/    │
                              │ (carpeta propia)     │
                              └──────────────────────┘
```

**Trigger:** cron systemd a las 07:00 UTC = 03:00 America/Caracas.
**Script:** `/opt/medsysve-backup/backup.sh`
**Logs:** `/var/log/medsysve-backup.log`
**Email alerts:** vía `msmtp` a `cpierluissis@gmail.com` (configurado en `/etc/msmtprc`)

---

## 3. Procedimientos operativos

### 3.1 Verificar estado del backup (health check)

```bash
ssh root@13.140.181.29 "bash /opt/medsysve-backup/health-check.sh"
```

El script valida 7 cosas:
1. Cron schedule (`/etc/cron.d/medsysve-backup`)
2. gocryptfs mounts activos (`systemctl is-active medsysve-rclone-crypt.service`)
3. rclone token válido (`rclone lsd gdrive-medsysve:`)
4. msmtp configurado (alerts funcionan)
5. Keyfile SHA-256 matches expected (`/root/medsysve-keyfile`)
6. Containers Postgres + MedSysVE corriendo (`docker ps`)
7. Últimas 5 líneas del log de backup

### 3.2 Trigger manual del backup

```bash
ssh root@13.140.181.29 "bash /opt/medsysve-backup/backup.sh"
```

Output esperado:
```
[ISO_TIMESTAMP] ===== Backup started on <host> =====
[ISO_TIMESTAMP] Pre-flight: validating Drive auth...
[ISO_TIMESTAMP] Pre-flight OK: Drive auth valid.
[ISO_TIMESTAMP] Dumping Postgres...
[ISO_TIMESTAMP] Local dump: <N> bytes, sha256=<hash>...
[ISO_TIMESTAMP] Uploading to gdrive-medsysve-crypt:backups/<DATE>.sql.gz...
[ISO_TIMESTAMP] Verifying remote copy...
[ISO_TIMESTAMP] OK: sha256 matches (<hash>). Upload verified.
[ISO_TIMESTAMP] Rotating backups older than 90 days...
[ISO_TIMESTAMP] Retention: kept dumps from last 90 days.
[ISO_TIMESTAMP] ===== Backup finished OK =====
```

### 3.3 Restore desde backup más reciente

```bash
ssh root@13.140.181.29 "bash /opt/medsysve-backup/restore.sh"
```

Output esperado: `Restore complete from <DATE>.`

⚠️ **Esto SOBREESCRIBE la DB actual.** Si necesitas restaurar a un punto específico sin perder lo más reciente, primero haz un dump manual de la DB actual:
```bash
ssh root@13.140.181.29 "docker exec tf03dm49her0vco2lprdqbjm pg_dump -U medsysve medsysve | gzip > /tmp/pre-restore-<DATE>.sql.gz"
```

### 3.4 Restore desde fecha específica

```bash
ssh root@13.140.181.29 "bash /opt/medsysve-backup/restore.sh 20260702"
```

Lista de fechas disponibles:
```bash
ssh root@13.140.181.29 "rclone lsf gdrive-medsysve-crypt:backups --files-only"
```

---

## 4. Runbooks de incidente

### 4.1 🔑 OAuth token expirado (Drive auth falla)

**Síntoma:** email con subject `🔑 MedSysVE backup FAILED on <host> — Drive token EXPIRED (re-auth needed)` o pre-flight falla con `unauthorized_client`/`invalid_grant`.

**Causa:** Google OAuth refresh_token venció (Google suele expirarlos cada ~6 meses para apps en modo "testing", o más rápido si el user revoqueó el consentimiento en https://myaccount.google.com/permissions).

**Resolución (5 min, automated):**

> ⚠️ PowerShell + SSH en Windows: usar `Start-Process ssh -WindowStyle Hidden` para tunnel persistente (ver sección "Comandos sensibles" abajo).

```powershell
# 1. Backup del rclone.conf actual
ssh -i "C:\Users\cpier\.ssh\id_ed25519_vps" root@13.140.181.29 "cp /root/.config/rclone/rclone.conf /root/.config/rclone-enc/rclone.conf.bak-pre-rotate.$(date -u +%Y%m%dT%H%M%SZ)"

# 2. Arrancar rclone authorize en tmux en el VPS (sobrevive cierre SSH)
# (subir script /tmp/rclone-auth-portfwd.sh vía SCP, ejecutar, descubrir puerto)

# 3. Crear SSH tunnel hacia el puerto random que eligió rclone
Start-Process -FilePath "ssh.exe" -ArgumentList "-i", "C:\Users\cpier\.ssh\id_ed25519_vps", "-N", "-L", "<PORT>:127.0.0.1:<PORT>", "root@13.140.181.29" -WindowStyle Hidden

# 4. User abre Chrome en http://127.0.0.1:<PORT>/auth → Google OAuth → Allow
# 5. rclone imprime JSON en /tmp/rclone-auth.log
# 6. mavis extrae JSON y reemplaza campo "token =" en /root/.config/rclone/rclone.conf (en vault gocryptfs)
# 7. Verificar: ssh ... "rclone lsd gdrive-medsysve:"
# 8. Trigger backup manual para confirmar end-to-end
```

**Pre-flight check en GCP:** si el OAuth client está en modo "testing", el user debe estar en la lista de **Test users** del OAuth consent screen (Google Cloud Console → APIs & Services → OAuth consent screen → Test users → Add Users). Sin esto, Google devuelve HTTP 403 incluso con client/secret correctos.

### 4.2 💀 VPS muerto físicamente

**Síntoma:** SSH no responde, `http://13.140.181.29:8000/` no carga, dominio no resuelve.

**Resolución:**

1. **Provisionar VPS nuevo** (Contabo o equivalente). Instalar Docker, Coolify v4.x.
2. **Restaurar secrets vaults:**
   - El keyfile gocryptfs (`/root/medsysve-keyfile`) está **fuera del VPS** — debe estar en el backup seguro de Carlos (1Password / Bitwarden / impreso en lugar seguro). **Si se perdió, los vaults son irrecuperables.**
   - El backup de Drive no requiere secrets adicionales — los archivos están cifrados client-side.
3. **Restaurar DB desde Drive:**
   ```bash
   # En VPS nuevo, montar gocryptfs vault con keyfile
   /usr/bin/gocryptfs -passfile /root/medsysve-keyfile -allow_other \
     /root/.config/rclone-enc /root/.config/rclone

   # Re-autenticar rclone (ver 4.1)
   # ...

   # Restaurar DB
   rclone cat gdrive-medsysve-crypt:backups/<MOST_RECENT>.sql.gz | \
     docker exec -i <NEW_PG_CONTAINER> psql -U medsysve -d medsysve
   ```
4. **Re-deployar app desde repo** (Coolify detecta el cambio o manual).
5. **Actualizar DNS** si la IP cambió (en Contabo UI → cloud DNS, o en sslip.io es automático).

**RTO estimado:** 2-4 horas (provisioning + restore manual).
**RPO:** ≤ 24 h (último backup diario).

### 4.3 🔐 Keyfile gocryptfs perdido

**Síntoma:** gocryptfs refuses to mount con "password incorrect", o keyfile no existe en `/root/medsysve-keyfile`.

**Resolución:** **No hay recovery.** Los vaults (`/root/.config/rclone-enc/` y `/opt/medsysve-backup-secrets-enc/`) están cifrados con AES-256 con clave derivada del keyfile. Sin el keyfile, los datos son irrecuperables.

**Mitigación:**
- Mantener **al menos 2 copias** del keyfile en lugares físicamente separados (1Password + safe en casa del dev, por ejemplo).
- Verificar la copia cada 6 meses.
- SHA-256 expected: `44c94ce0caf3a321879dabd7fce630ddb44f73b8a31d5ecff31684972de7f8a4` (verificable con `health-check.sh` paso 5).

### 4.4 💾 DB corrupta / datos inconsistentes

**Síntoma:** queries fallan, errores de constraint, datos faltantes que deberían estar.

**Resolución:**

1. **Sacar dump de la DB actual antes de tocar nada** (por si necesitamos forensics):
   ```bash
   docker exec tf03dm49her0vco2lprdqbjm pg_dump -U medsysve medsysve | gzip > /tmp/db-corrupta-<DATE>.sql.gz
   # Subir a Drive para analysis posterior
   rclone copy /tmp/db-corrupta-<DATE>.sql.gz gdrive-medsysve-crypt:backups/_incidents/
   ```

2. **Restaurar desde último backup bueno** (ver 3.3).

3. **Si el último backup también tiene el problema**, restaurar desde fecha anterior:
   ```bash
   bash /opt/medsysve-backup/restore.sh <DATE>
   ```

4. **Si TODOS los backups están corruptos**, contactar a Carlos — no hay más opciones automatizadas.

---

## 5. Secretos y vaults

| Secreto | Ubicación física | Ubicación lógica (cuando montado) | Backup |
|---|---|---|---|
| gocryptfs keyfile | `/root/medsysve-keyfile` | (mismo) | **Externo obligatorio** (1Password) |
| OAuth token rclone | `/root/.config/rclone-enc/rclone.conf` (cifrado) | `/root/.config/rclone/rclone.conf` (decifrado via gocryptfs) | Auto (vault cifrado replicado) |
| Client ID/Secret Google | (en rclone.conf, mismo vault) | (idem) | Auto |
| DB password | `/opt/medsysve-backup-secrets-enc/PASSWORDS-NEEDED-TO-RESTORE.txt` (cifrado) | `/opt/medsysve-backup-secrets/PASSWORDS-NEEDED-TO-RESTORE.txt` | Auto (vault cifrado replicado) |
| Coolify admin password | (no en VPS, está en el panel de Coolify) | (idem) | Manual: reset desde Contabo UI si perdido |
| Gmail App Password (msmtp) | `/etc/msmtprc` (texto plano, NO en vault) | (idem) | Manual: regenerar en https://myaccount.google.com/apppasswords |
| `FIELD_ENCRYPTION_KEY` (PHI cipher, AES-256-GCM + HMAC index) | Coolify env vars (DB, cifrado) | Injectado al container en runtime | 1Password + backup manual cifrado |
| `FIELD_HMAC_KEY` (HMAC index separado de encryption) | Coolify env vars | Injectado al container en runtime | 1Password + backup manual |
| `FIELD_SIGN_KEY` (encounter signing, separada de encryption, audit #7 follow-up) | Coolify env vars | Injectado al container en runtime | 1Password + backup manual |

### 5.1 Encryption / signing keys — rotación (Audit S11, 2026-07-07)

**Por qué hay tres keys separadas:**

- `FIELD_ENCRYPTION_KEY` — cifra PHI (motivo, anamnesis, plan, cédula, etc.) usando AES-256-GCM. Rotación invalida todos los cipher existentes (necesitarían re-backfill con la nueva key).
- `FIELD_HMAC_KEY` — calcula HMAC-SHA-256 index sobre PHI searchable (motivo.normalizado, cédula, etc.). Rotación invalida todos los índices HMAC (los search-by-index fallarían hasta regenerar).
- `FIELD_SIGN_KEY` — HMAC-SHA-256 binding de encounters firmados. **Separada intencionalmente** de las otras dos (audit #7 follow-up, 2026-07-02) para que rotación de `FIELD_ENCRYPTION_KEY` NO invalide encounter signatures.

**Procedimiento para rotar `FIELD_ENCRYPTION_KEY` y/o `FIELD_HMAC_KEY` (ahora automatizado, audit S11):**

> ⚠️ Requiere **ventana de mantenimiento** (la app debe estar offline). El worker
> lee cada fila con la key vieja, la re-encripta con la nueva, y la escribe. Mientras
> corre, no puede haber readers concurrentes (key dual-key con versionado es un
> follow-up: "key versioning").

1. **Generar las nuevas keys** (PowerShell en Windows o bash en el VPS):
   ```bash
   NEW_ENC_KEY=$(openssl rand -base64 32)
   NEW_HMAC_KEY=$(openssl rand -base64 32)
   ```
   Guardarlas en 1Password y en el vault cifrado inmediatamente. NO commitear.

2. **Backup fresco** (defense-in-depth, audit #18):
   ```bash
   ssh root@13.140.181.29 "bash /opt/medsysve-backup/backup.sh"
   ```
   Confirmar que el dump terminó sin errores. Anotar el SHA del backup.

3. **Detener el contenedor de la app** (libera el puerto, previene readers concurrentes):
   ```bash
   ssh root@13.140.181.29 "docker stop hze8mocuh4xqskqwrm3mx50b-XXX"
   ```
   (Reemplazar `XXX` con el ID del container que arranca con el prefijo.)

4. **Dry-run primero** — el worker reporta cuántos rows rotaría sin escribir:
   ```bash
   ssh root@13.140.181.29 "cd /opt/medsysve && \
     FIELD_ENCRYPTION_KEY=<old-enc> \
     FIELD_HMAC_KEY=<old-hmac> \
     ROTATE_FIELD_ENCRYPTION_KEY=$NEW_ENC_KEY \
     ROTATE_FIELD_HMAC_KEY=$NEW_HMAC_KEY \
     ROTATE_DRY_RUN=1 \
     node --no-warnings -r tsx/cjs scripts/rotate-field-keys.ts"
   ```
   Verificar: `scanned` debe ser > 0, `errors=0`, `rotated=0` (porque es dry-run).

5. **Rotación real**:
   ```bash
   ssh root@13.140.181.29 "cd /opt/medsysve && \
     FIELD_ENCRYPTION_KEY=<old-enc> \
     FIELD_HMAC_KEY=<old-hmac> \
     ROTATE_FIELD_ENCRYPTION_KEY=$NEW_ENC_KEY \
     ROTATE_FIELD_HMAC_KEY=$NEW_HMAC_KEY \
     node --no-warnings -r tsx/cjs scripts/rotate-field-keys.ts"
   ```
   El worker:
   - Itera `Patient` (cedula, nombre, apellido, telefono, email, rif + 6 HMAC indexes).
   - Itera `Encounter` (motivoCifrado + motivoHmac, anamnesisCifrada, planCifrado).
   - **NO toca** `Encounter.signatureHash` (usa `FIELD_SIGN_KEY`, rotación separada).
   - Si una row ya está en formato nuevo (decrypt con NEW funciona), la skipea sin error (idempotency).
   - Termina con `scanned=N rotated=N skipped=0 errors=0` o throw si errors > 0.

6. **Actualizar Coolify** con las nuevas keys:
   - UI → application → Environment
   - `FIELD_ENCRYPTION_KEY` = `$NEW_ENC_KEY`
   - `FIELD_HMAC_KEY` = `$NEW_HMAC_KEY`
   - Save (trigger redeploy).

7. **Smoke test** (autenticar y ver un paciente conocido):
   - Login como doctor.
   - Buscar paciente por cédula (debería funcionar via HMAC index).
   - Abrir un encounter (debería descifrar motivo + anamnesis + plan).
   - Si algo falla, ROLLBACK: restore del backup pre-rotación (audit #18).

8. **Retener las keys viejas** en el vault cifrado por **30 días**. Si algún row archivado en un backup más viejo necesita ser leído con la key vieja, todavía es posible.

**Procedimiento para rotar `FIELD_SIGN_KEY` (solo, sin tocar las otras dos):**
1. Generar nuevo base64-32-bytes: `openssl rand -base64 32`
2. Actualizar valor en Coolify (UI → application → env vars)
3. Deploy (trigger webhook)
4. **Consecuencia**: todas las encounter signatures previas son inválidas. Carlos debe decidir si re-firmar los encounters existentes (requiere acción manual del doctor que firmó) o aceptar que las signatures previas se "desvanecen".

**Por qué el worker no toca `signatureHash`:**
- `signatureHash` se calcula con `FIELD_SIGN_KEY` (separada, audit #7 follow-up)
- Si lo rotamos, las firmas existentes se invalidan y，我们需要 forzar a los doctores a re-firmar manualmente
- Para la rotación de las otras dos keys (encrypt + HMAC), las signatures DEBEN sobrevivir intactas
- Rotación de `FIELD_SIGN_KEY` es un procedimiento separado, no automatizado todavía

**Tests automatizados** (6 nuevos en `tests/unit/rotate-field-keys.test.ts`):
- Happy path: Patient.cedulaCifrada + hmacCedula re-encriptados correctamente
- All 6 Patient PHI columns + 6 HMAC indexes en una sola row
- Encounter.motivoCifrado + motivoHmac (paired)
- Encounter.anamnesisCifrada + planCifrado (no HMAC pair)
- Idempotency: re-run con mismas keys skip rows ya rotadas
- Dry-run: no escribe cuando `ROTATE_DRY_RUN=1`

**Montar vaults manualmente:**
```bash
bash /opt/medsysve-backup/mount-secrets.sh
```

Esto monta automáticamente los 2 vaults si no están ya montados. Después de un reboot del VPS, hay que correr este script (o configurar systemd `medsysve-rclone-crypt.service` para auto-mount).

---

## 6. Comandos sensibles (PowerShell en Windows)

> ⚠️ Carlos opera desde PowerShell 5.1 en Windows. Estos patrones evitan las trampas comunes documentadas en `windows-deploy-gotchas.md`.

### SSH tunnel persistente (background real)

`ssh -f -N -L ...` **se cuelga** desde PowerShell cuando hay pipes/redirections posteriores. Usar:

```powershell
Start-Process -FilePath "ssh.exe" -ArgumentList "-i", "C:\Users\cpier\.ssh\id_ed25519_vps", "-N", "-L", "53682:127.0.0.1:53682", "root@13.140.181.29" -WindowStyle Hidden
```

Verificar que está escuchando:
```powershell
Get-NetTCPConnection -LocalPort 53682 -State Listen | Select-Object OwningProcess
```

Matar:
```powershell
Get-Process ssh | Where-Object { $_.Id -eq <PID> } | Stop-Process -Force
```

### Comandos SSH remotos con lógica compleja

Evitar `bash -c '...$(...)...'` inline (escaping infernal). Patrón: escribir a archivo local → SCP → ejecutar.

```powershell
# 1. Write script via Write tool a C:\Users\cpier\AppData\Local\Temp\script.sh
# 2. SCP al VPS
scp -i "C:\Users\cpier\.ssh\id_ed25519_vps" "C:\Users\cpier\AppData\Local\Temp\script.sh" root@13.140.181.29:/tmp/script.sh
# 3. SSH ejecutar
ssh -i "C:\Users\cpier\.ssh\id_ed25519_vps" root@13.140.181.29 "bash /tmp/script.sh"
```

---

## 7. Pendientes / Known gaps

| # | Gap | Impacto | Plan |
|---|---|---|---|
| 1 | **DB password rotation** | Password actual en uso desde Jun 2025, sin rotación documentada | Pendiente para otra sesión — bloquear 30 min, regenerar password en Coolify UI + actualizar secrets vault + reiniciar contenedor Postgres |
| 2 | **Coolify admin password rotation** | Igual | Regenerar desde Contabo UI / Coolify |
| 3 | **OAuth production mode** | OAuth client en modo "testing", refresh_token puede expirar cada ~6 meses. Workaround: agregar test user en GCP | Pendiente: aplicar a "production" en GCP (1-2 semanas de Google review) |
| 4 | **Documentar provisioning automatizado de VPS nuevo** | Si VPS muere, restore es manual (~2-4h RTO) | Pendiente: Terraform / Ansible script para provisionar VPS + Coolify + restore automatizado |
| 5 | **Test de restore automatizado** | El restore.sh nunca se ha ejecutado en producción real (solo smoke tests manuales) | ✅ **Done (audit #18, 2026-07-06)** — `scripts/backups/restore-test.sh` corre mensual via Coolify Scheduled Task UUID `bljazmj4u5g3cmvbpqlg5m6i`, freq `0 4 1 * *`. Verifica rowcounts de Doctor/Patient/Encounter/AuditEvent + `_prisma_migrations` en temp DB. |
| 6 | **Off-site backup adicional** | Single point of failure en Google (cuenta personal) | Pendiente: considerar 2do destino (Backblaze B2 / AWS S3) |

---

## 7a. Backup chain v2 (audit #18, 2026-07-06)

### Cambios sobre la versión legacy

| Aspecto | Legacy (`backup.sh`) | v2 (`scripts/backups/backup.sh`) |
|---|---|---|
| Filename | `<YYYYMMDD>.sql.gz` (overwrite mismo día) | `<YYYYMMDDTHHMMSSZ>.sql.gz` (full UTC, no overwrite) |
| Retention | 90 días flat | **GFS**: 7 daily + 4 weekly (ISO week) + 12 monthly |
| OAuth pre-flight | ✅ | ✅ (heredado) |
| Email alerts (msmtp) | ✅ | ✅ (heredado) |
| Hash verify local==remote | ✅ | ✅ (heredado) |
| Weekly digest | ✅ | ✅ (heredado) |
| `DRY_RUN=1` flag | ❌ | ✅ (skip upload + retention) |
| Restore drill mensual | ❌ | ✅ (`scripts/backups/restore-test.sh`, Coolify scheduled task) |
| Acceptance de formato legacy durante migración | ❌ | ✅ (regex matches both) |

### Scripts activos en VPS

- `/opt/medsysve-backup/backup.sh` — v2 (promovido 2026-07-06)
- `/opt/medsysve-backup/backup.sh.legacy` — versión vieja (preservada como referencia)
- `/opt/medsysve-backup/restore-test.sh` — drill mensual

### Cron jobs

| Job | Schedule | Mecanismo | Comando |
|---|---|---|---|
| Daily backup | `0 7 * * *` (07:00 UTC = 03:00 VE) | `/etc/cron.d/medsysve-backup` (legacy) | `/opt/medsysve-backup/backup.sh` |
| Monthly restore drill | `0 4 1 * *` (1° del mes @ 04:00 UTC) | Coolify Scheduled Task UUID `bljazmj4u5g3cmvbpqlg5m6i` | `bash /opt/medsysve-backup/restore-test.sh` |

### Variables de entorno relevantes

- `DRY_RUN=1` → corre pg_dump local + hash compute pero skip upload + retention
- `ALERT_TO` → email recipient (default `cpierluissis@gmail.com`)
- `BACKUP_RETENTION_DAILY` (default 7), `BACKUP_RETENTION_WEEKLY` (4), `BACKUP_RETENTION_MONTHLY` (12)

### Verificación end-to-end (2026-07-06)

1. **DRY_RUN=1**: PASS (100KB dump, sha256=ad73eff9b4abe169)
2. **Real backup**: PASS (sha256=6e05e477c0acf980 verified, uploaded to `20260706T232831Z.sql.gz`)
3. **Restore test**: PASS (Doctor=8 Patient=21 Encounter=25 AuditEvent=701, _prisma_migrations=26, temp DB dropped cleanly)

---

## 8. Contactos

| Rol | Persona | Contacto |
|---|---|---|
| Owner + dev | Carlos Arturo Pierluissis Pinto | `cpierluissis@gmail.com` |
| VPS provider (Contabo) | Support | https://my.contabo.com |
| Google Cloud (OAuth) | n/a | https://console.cloud.google.com/ |
| Dominio DNS | (auto via sslip.io si IP cambia) | n/a |