#!/bin/bash
# MedSysVE daily backup — runs at 07:00 UTC (03:00 America/Caracas).
# Dumps Postgres, gzips, pushes to encrypted rclone remote, verifies hash.
# On success: logs digest.
# On failure: sends email alert with specific remediation steps.

set -euo pipefail

LOG=/var/log/medsysve-backup.log
PG_CONTAINER=tf03dm49her0vco2lprdqbjm
PG_USER=medsysve
PG_DB=medsysve
REMOTE=gdrive-medsysve-crypt:backups
RETENTION_DAYS=90
ALERT_TO=cpierluissis@gmail.com
VPS_HOST=$(hostname -f 2>/dev/null || hostname)
AUTH_CHECK_REMOTE=gdrive-medsysve:

log() { echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOG"; }

send_alert() {
  local subject="$1"
  local body="$2"

  if grep -q "__GMAIL_APP_PASSWORD_PLACEHOLDER__" /etc/msmtprc 2>/dev/null; then
    log "ALERT (would email but msmtp not configured): $subject"
    log "ALERT body: $body"
    return 0
  fi

  log "Sending alert email to ${ALERT_TO}..."
  if printf "From: MedSysVE Backup <noreply@medsysve.com>\nTo: %s\nSubject: %s\nDate: %s\n\n%s\n" \
       "${ALERT_TO}" "${subject}" "$(date -R)" "${body}" \
       | msmtp --from=cpierluissis@gmail.com "${ALERT_TO}" 2>>"$LOG"; then
    log "Alert email sent."
  else
    log "ALERT email FAILED to send. Check /var/log/msmtp.log"
  fi
}

# ---------------------------------------------------------------------------
# Pre-flight: validate Drive auth BEFORE we waste time on the dump.
# ---------------------------------------------------------------------------
log "===== Backup started on ${VPS_HOST} ====="
log "Pre-flight: validating Drive auth..."
if ! AUTH_OUT=$(rclone lsd "$AUTH_CHECK_REMOTE" --max-depth 1 2>&1); then
  # Distinguish between OAuth failure (re-auth needed) and other failures.
  if echo "$AUTH_OUT" | grep -qE "unauthorized_client|invalid_grant|401|expired"; then
    send_alert "🔑 MedSysVE backup FAILED on ${VPS_HOST} — Drive token EXPIRED (re-auth needed)" \
"YOUR OAUTH TOKEN EXPIRED AND REFRESH FAILED.

This is the THIRD possible cause of backup failure:
1. Google revoked the OAuth consent at https://myaccount.google.com/permissions
2. The refresh_token was invalidated (Testing-mode OAuth apps expire refresh after some use)
3. The app needs re-authorization with a fresh OAuth flow

WHAT TO DO (3 minutes):

From your Windows PowerShell, run this command:

    ssh -i \"C:\\Users\\cpier\\.ssh\\id_ed25519_vps\" -L 53682:127.0.0.1:53682 root@13.140.181.29 -t \"rclone authorize drive\"

When rclone prints the URL, open it in Chrome (use 127.0.0.1, NOT 13.140.181.29).
Login with cpierluissis@gmail.com. Click Allow.
rclone will print a JSON block with 'access_token' and 'refresh_token'.
Paste that JSON in your next message to mavis. mavis will update rclone.conf
and the next cron run will work.

After that, mavis will investigate why the refresh keeps failing and fix it permanently.

Last log lines:
$(tail -20 "$LOG" 2>/dev/null)

VPS: ${VPS_HOST}
Time: $(date -u +%FT%TZ)"
    log "===== Backup FAILED at pre-flight (token expired) ====="
    exit 1
  else
    # Other Drive error (network, perms, etc.) — generic alert
    send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — Drive pre-flight error" \
"rclone lsd gdrive-medsysve failed with:
$AUTH_OUT

Last log lines:
$(tail -20 "$LOG" 2>/dev/null)"
    log "===== Backup FAILED at pre-flight (other Drive error) ====="
    exit 1
  fi
fi
log "Pre-flight OK: Drive auth valid."

# ---------------------------------------------------------------------------
# 1. Dump + gzip
# ---------------------------------------------------------------------------
DUMP_FILE="/tmp/medsysve-$(date -u +%Y%m%d-%H%M%S).sql.gz"
SHA_BEFORE=$(mktemp)

log "Dumping Postgres..."
if ! docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" -d "$PG_DB" --no-owner --no-privileges 2>>"$LOG" \
     | gzip -9 > "$DUMP_FILE"; then
  rm -f "$DUMP_FILE" "$SHA_BEFORE"
  send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — pg_dump error" \
"The Postgres dump failed at $(date -u).

Last log lines:
$(tail -20 "$LOG" 2>/dev/null)

Action: SSH to ${VPS_HOST} and check:
  docker logs $PG_CONTAINER --tail 20
  df -h /var/lib/docker"
  log "===== Backup FAILED at pg_dump ====="
  exit 1
fi

LOCAL_SIZE=$(stat -c %s "$DUMP_FILE")
LOCAL_SHA=$(sha256sum "$DUMP_FILE" | awk '{print $1}')
echo "$LOCAL_SHA" > "$SHA_BEFORE"
log "Local dump: ${LOCAL_SIZE} bytes, sha256=${LOCAL_SHA:0:16}..."

# ---------------------------------------------------------------------------
# 2. Push to encrypted remote
# ---------------------------------------------------------------------------
DATE_STAMP=$(date -u +%Y%m%d)
log "Uploading to ${REMOTE}/${DATE_STAMP}.sql.gz..."
if ! rclone rcat "$REMOTE/${DATE_STAMP}.sql.gz" < "$DUMP_FILE" 2>>"$LOG"; then
  rm -f "$DUMP_FILE" "$SHA_BEFORE"
  # Was this another auth failure?
  send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — rclone upload error" \
"The Postgres dump succeeded (${LOCAL_SIZE} bytes, sha256=${LOCAL_SHA:0:16}...) but uploading failed.

Common causes:
- OAuth token expired during upload (see the token alert above)
- Drive quota exceeded (check https://drive.google.com/drive/quota)
- Network outage
- rclone.conf not mounted (gocryptfs automount failed)

Check on VPS:
  systemctl status medsysve-rclone-crypt
  mount | grep gocryptfs
  rclone lsd gdrive-medsysve:"
  log "===== Backup FAILED at rclone upload ====="
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Verify
# ---------------------------------------------------------------------------
log "Verifying remote copy..."
REMOTE_SHA=$(rclone cat "$REMOTE/${DATE_STAMP}.sql.gz" 2>/dev/null | sha256sum | awk '{print $1}')

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  log "OK: sha256 matches (${LOCAL_SHA:0:16}...). Upload verified."
  UPLOAD_OK=1
else
  UPLOAD_OK=0
  log "FAIL: sha256 mismatch. local=${LOCAL_SHA:0:16} remote=${REMOTE_SHA:0:16}..."
fi

rm -f "$DUMP_FILE" "$SHA_BEFORE"

# ---------------------------------------------------------------------------
# 4. Rotate + alert
# ---------------------------------------------------------------------------
if [ "$UPLOAD_OK" = "1" ]; then
  log "Rotating backups older than ${RETENTION_DAYS} days..."
  rclone delete "$REMOTE" --min-age "${RETENTION_DAYS}d" 2>>"$LOG" || true
  log "Retention: kept dumps from last ${RETENTION_DAYS} days."
fi

if [ "$UPLOAD_OK" != "1" ]; then
  send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — hash mismatch" \
"Local dump sha256: ${LOCAL_SHA}
Remote dump sha256: ${REMOTE_SHA}

Action: SSH to ${VPS_HOST} and check tail -50 /var/log/medsysve-backup.log
Then run /opt/medsysve-backup/backup.sh manually."
  log "===== Backup FAILED at hash verification ====="
  exit 1
fi

BACKUPS_TOTAL=$(rclone lsf "$REMOTE" --files-only 2>/dev/null | wc -l)
TOTAL_SIZE=$(rclone size "$REMOTE" --json 2>/dev/null | grep -oE '"bytes":[0-9]+' | head -1 | cut -d: -f2)
TOTAL_HUMAN=$(numfmt --to=iec --suffix=B "${TOTAL_SIZE:-0}" 2>/dev/null || echo "${TOTAL_SIZE:-0} bytes")

log "===== Backup finished OK ====="
log "Daily digest: ${BACKUPS_TOTAL} backups in Drive, total ${TOTAL_HUMAN}"

# Sunday weekly digest
if [ "$(date -u +%u)" = "7" ]; then
  send_alert "✅ MedSysVE backup weekly digest — ${VPS_HOST} OK" \
"Sunday digest:
- Backups in Drive: ${BACKUPS_TOTAL}
- Total size: ${TOTAL_HUMAN}
- Latest: ${DATE_STAMP}.sql.gz (sha256 ${LOCAL_SHA:0:16}...)
- Retention: last ${RETENTION_DAYS} days

System healthy."
fi