#!/usr/bin/env bash
# MedSysVE daily database backup (audit #18)
#
# Runs pg_dump against the production Postgres container, compresses with gzip,
# uploads to the encrypted Google Drive remote (gdrive-medsysve-crypt:backups/),
# and enforces a retention policy:
#   - 7 most recent daily backups
#   - 4 weekly snapshots (one per ISO week, for the last 4 weeks)
#   - 12 monthly snapshots (one per calendar month, for the last 12 months)
# Any backup older than the monthly window is deleted.
#
# Cron: daily at 02:00 UTC (configured via Coolify scheduled task `backup-daily`)
#
# Exit codes:
#   0 - backup succeeded
#   1 - pg_dump, gzip, or rclone failed
#   2 - retention cleanup failed (backup still succeeded, but cleanup needs attention)
#
# Environment overrides (all optional):
#   BACKUP_PG_CONTAINER  - name of the Postgres container (default: tf03dm49her0vco2lprdqbjm)
#   BACKUP_PG_USER       - DB user (default: medsysve)
#   BACKUP_PG_DB         - DB name (default: medsysve)
#   BACKUP_RCLONE_REMOTE - rclone remote path (default: gdrive-medsysve-crypt:backups)
#   AUTH_CHECK_REMOTE    - rclone remote used for OAuth pre-flight (default: gdrive-medsysve:)
#   ALERT_TO             - email recipient for alerts (default: cpierluissis@gmail.com)
#   BACKUP_RETENTION_DAILY   (default: 7)
#   BACKUP_RETENTION_WEEKLY  (default: 4)
#   BACKUP_RETENTION_MONTHLY (default: 12)
#   BACKUP_LOG_FILE      - log destination (default: /var/log/medsysve-backup.log)
#   DRY_RUN              - 1 = skip upload/retention/remote ops (test mode only)

set -euo pipefail

# ---- Config ----------------------------------------------------------------

PG_CONTAINER="${BACKUP_PG_CONTAINER:-tf03dm49her0vco2lprdqbjm}"
PG_USER="${BACKUP_PG_USER:-medsysve}"
PG_DB="${BACKUP_PG_DB:-medsysve}"
RCLONE_REMOTE="${BACKUP_RCLONE_REMOTE:-gdrive-medsysve-crypt:backups}"
AUTH_CHECK_REMOTE="${AUTH_CHECK_REMOTE:-gdrive-medsysve:}"
ALERT_TO="${ALERT_TO:-cpierluissis@gmail.com}"

RETENTION_DAILY="${BACKUP_RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-4}"
RETENTION_MONTHLY="${BACKUP_RETENTION_MONTHLY:-12}"

LOG_FILE="${BACKUP_LOG_FILE:-/var/log/medsysve-backup.log}"
VPS_HOST=$(hostname -f 2>/dev/null || hostname)

# Flags
DRY_RUN="${DRY_RUN:-0}"

# ---- Helpers ---------------------------------------------------------------

log() {
  local ts
  ts="$(date -u +%FT%TZ)"
  echo "[$ts] $*" | tee -a "$LOG_FILE"
}

fail() {
  local code="$1"; shift
  log "ERROR ($code): $*"
  exit "$code"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail 1 "missing required command: $1"
}

send_alert() {
  local subject="$1"
  local body="$2"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "DRY-RUN ALERT (not sent): subject='$subject'"
    return 0
  fi
  if grep -q "__GMAIL_APP_PASSWORD_PLACEHOLDER__" /etc/msmtprc 2>/dev/null; then
    log "ALERT (msmtp not configured): $subject"
    log "ALERT body: $body"
    return 0
  fi
  if printf "From: MedSysVE Backup <noreply@medsysve.com>\nTo: %s\nSubject: %s\nDate: %s\n\n%s\n" \
       "${ALERT_TO}" "${subject}" "$(date -R)" "${body}" \
       | msmtp --from=cpierluissis@gmail.com "${ALERT_TO}" 2>>"$LOG_FILE"; then
    log "Alert email sent to ${ALERT_TO}"
  else
    log "ALERT email FAILED to send. Check /var/log/msmtp.log"
  fi
}

# ---- Pre-flight ------------------------------------------------------------

mkdir -p "$(dirname "$LOG_FILE")"
require_cmd docker
require_cmd gzip
require_cmd rclone

# Verify Postgres container is reachable and healthy
if ! docker inspect --format='{{.State.Health.Status}}' "$PG_CONTAINER" 2>/dev/null \
   | grep -qE '^(healthy|starting)$'; then
  fail 1 "postgres container '$PG_CONTAINER' is not healthy/starting"
fi

# Validate Drive OAuth BEFORE we waste time on pg_dump.
# Distinguish auth failure (re-auth needed) from other failures.
log "Pre-flight: validating Drive auth against $AUTH_CHECK_REMOTE..."
if ! AUTH_OUT=$(rclone lsd "$AUTH_CHECK_REMOTE" --max-depth 1 2>&1); then
  if echo "$AUTH_OUT" | grep -qE "unauthorized_client|invalid_grant|401|expired"; then
    send_alert "🔑 MedSysVE backup FAILED on ${VPS_HOST} — Drive token EXPIRED (re-auth needed)" \
"OAuth token expired. Refresh failed.

Likely causes:
1. Google revoked the OAuth consent at https://myaccount.google.com/permissions
2. The refresh_token was invalidated (Testing-mode OAuth apps)
3. The app needs re-authorization with a fresh OAuth flow

Action (3 min, from Windows PowerShell):
    ssh -i \"C:\Users\cpier\.ssh\id_ed25519_vps\" -L 53682:127.0.0.1:53682 root@13.140.181.29 -t \"rclone authorize drive\"

Open the URL in Chrome (use 127.0.0.1, NOT 13.140.181.29). Login as cpierluissis@gmail.com.
rclone will print a JSON block — paste it back to mavis to update rclone.conf.

Last log lines:
$(tail -20 "$LOG_FILE" 2>/dev/null)

VPS: ${VPS_HOST}
Time: $(date -u +%FT%TZ)"
    fail 1 "Drive OAuth token expired"
  else
    send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — Drive pre-flight error" \
"rclone lsd $AUTH_CHECK_REMOTE failed with:
$AUTH_OUT

Last log lines:
$(tail -20 "$LOG_FILE" 2>/dev/null)"
    fail 1 "Drive pre-flight failed"
  fi
fi
log "Pre-flight OK: Drive auth valid."

# ---- Backup ----------------------------------------------------------------

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_BASENAME="${TIMESTAMP}.sql.gz"
LOCAL_BACKUP="/tmp/${BACKUP_BASENAME}"

log "starting backup of ${PG_DB}@${PG_CONTAINER} -> ${RCLONE_REMOTE}/${BACKUP_BASENAME}"

# pg_dump | gzip to local temp file
if ! docker exec "$PG_CONTAINER" \
     pg_dump -U "$PG_USER" -d "$PG_DB" --no-owner --no-privileges \
     2>>"$LOG_FILE" \
   | gzip -c > "$LOCAL_BACKUP"; then
  rm -f "$LOCAL_BACKUP"
  send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — pg_dump error" \
"The Postgres dump failed at $(date -u).

Last log lines:
$(tail -20 "$LOG_FILE" 2>/dev/null)

Action: SSH to ${VPS_HOST} and check:
  docker logs $PG_CONTAINER --tail 20
  df -h /var/lib/docker"
  fail 1 "pg_dump or gzip failed (see log)"
fi

LOCAL_SIZE=$(stat -c '%s' "$LOCAL_BACKUP" 2>/dev/null || stat -f '%z' "$LOCAL_BACKUP")
LOCAL_SHA=$(sha256sum "$LOCAL_BACKUP" 2>/dev/null | awk '{print $1}' || shasum -a 256 "$LOCAL_BACKUP" | awk '{print $1}')
log "local dump written: ${LOCAL_BACKUP} (${LOCAL_SIZE} bytes, sha256=${LOCAL_SHA:0:16}...)"

if [[ "$DRY_RUN" == "1" ]]; then
  log "DRY-RUN: skipping upload, retention cleanup, and remote ops"
  rm -f "$LOCAL_BACKUP"
  log "backup dry-run complete"
  exit 0
fi

# Upload to encrypted Drive remote
if ! rclone copyto "$LOCAL_BACKUP" "${RCLONE_REMOTE}/${BACKUP_BASENAME}" \
     --stats 0 --stats-one-line 2>>"$LOG_FILE"; then
  rm -f "$LOCAL_BACKUP"
  send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — rclone upload error" \
"The Postgres dump succeeded (${LOCAL_SIZE} bytes, sha256=${LOCAL_SHA:0:16}...) but upload failed.

Check on VPS:
  systemctl status medsysve-rclone-crypt
  mount | grep gocryptfs
  rclone lsd ${AUTH_CHECK_REMOTE}"
  fail 1 "rclone upload failed"
fi

log "upload complete: ${RCLONE_REMOTE}/${BACKUP_BASENAME}"

# ---- Verify: hash of remote file must match local ---------------------------
if REMOTE_SHA=$(rclone cat "${RCLONE_REMOTE}/${BACKUP_BASENAME}" 2>/dev/null \
                | sha256sum | awk '{print $1}'); then
  if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
    log "verify OK: sha256 matches (${LOCAL_SHA:0:16}...)"
  else
    send_alert "❌ MedSysVE backup FAILED on ${VPS_HOST} — hash mismatch" \
"Local dump sha256:  ${LOCAL_SHA}
Remote dump sha256: ${REMOTE_SHA}

The upload completed but integrity check failed.
Action: investigate network or rclone config. Latest dump may be corrupt."
    fail 1 "sha256 mismatch after upload"
  fi
else
  log "WARN: could not verify remote hash (rclone cat failed)"
fi

rm -f "$LOCAL_BACKUP"

# ---- Retention cleanup -----------------------------------------------------
# Lists remote files (cleartext names after rclone decrypts), parses dates,
# and deletes any file that is neither in the daily, weekly, nor monthly window.

REMOTE_FILES=$(rclone lsf "$RCLONE_REMOTE" --format 'tp' 2>/dev/null \
               | awk '$1 ~ /^[0-9]{8}(T[0-9]{6}Z)?\.sql\.gz$/ {print $1, $2}' \
               | sort -r)

NOW_EPOCH=$(date -u +%s)
KEEP=()

# Daily: keep newest N
COUNT=0
while IFS=$' \t' read -r name ts; do
  [[ -z "$name" ]] && continue
  if (( COUNT < RETENTION_DAILY )); then
    KEEP+=("$name")
    ((COUNT++))
  else
    break
  fi
done <<< "$REMOTE_FILES"

# Weekly: for each of the last RETENTION_WEEKLY ISO weeks, keep the most
# recent file whose ISO week is that week
for w in $(seq 1 "$RETENTION_WEEKLY"); do
  TARGET_WEEK=$(date -u -d "$NOW_EPOCH seconds ago -$(( (w-1) * 7 )) days" +%G-W%V 2>/dev/null \
                || date -u -v -$(( (w-1) * 7 ))d +%G-W%V)
  WEEK_FILE=$(echo "$REMOTE_FILES" \
              | while IFS=$' \t' read -r n t; do
                  [[ -z "$n" ]] && continue
                  # Extract YYYY-MM-DD from both old (YYYYMMDD.sql.gz) and
                  # new (YYYYMMDDTHHMMSSZ.sql.gz) formats.
                  fdate=$(echo "$n" | sed -E 's/^([0-9]{4})([0-9]{2})([0-9]{2})(T.*)?\.sql\.gz$/\1-\2-\3/')
                  fweek=$(date -u -d "$fdate" +%G-W%V 2>/dev/null || date -u -j -f "%Y-%m-%d" "$fdate" +%G-W%V)
                  [[ "$fweek" == "$TARGET_WEEK" ]] && echo "$n" && break
                done | head -1)
  [[ -n "$WEEK_FILE" ]] && KEEP+=("$WEEK_FILE")
done

# Monthly: for each of the last RETENTION_MONTHLY months, keep the most
# recent file whose YYYY-MM is that month
for m in $(seq 0 $((RETENTION_MONTHLY - 1))); do
  TARGET_MONTH=$(date -u -d "$NOW_EPOCH seconds ago -$(( m * 31 )) days" +%Y-%m 2>/dev/null \
                 || date -u -v -$(( m * 31 ))d +%Y-%m)
  MONTH_FILE=$(echo "$REMOTE_FILES" \
               | while IFS=$' \t' read -r n t; do
                   [[ -z "$n" ]] && continue
                   # Extract YYYY-MM from both old and new formats.
                   fmonth=$(echo "$n" | sed -E 's/^([0-9]{4})([0-9]{2})[0-9]{2}(T.*)?\.sql\.gz$/\1-\2/')
                   [[ "$fmonth" == "$TARGET_MONTH" ]] && echo "$n" && break
                 done | head -1)
  [[ -n "$MONTH_FILE" ]] && KEEP+=("$MONTH_FILE")
done

# Anything not in KEEP gets deleted
DELETED=0
while IFS=$' \t' read -r name ts; do
  [[ -z "$name" ]] && continue
  if ! printf '%s\n' "${KEEP[@]}" | grep -qx "$name"; then
    log "retention: deleting $name"
    rclone deletefile "${RCLONE_REMOTE}/${name}" 2>>"$LOG_FILE" \
      && DELETED=$((DELETED + 1)) \
      || log "WARN: failed to delete $name"
  fi
done <<< "$REMOTE_FILES"

log "retention: kept=${#KEEP[@]} deleted=$DELETED"

log "backup complete: ${BACKUP_BASENAME} (size=${LOCAL_SIZE})"

# Sunday weekly digest (skip on dry-run)
if [[ "$(date -u +%u)" == "7" && "$DRY_RUN" != "1" ]]; then
  BACKUPS_TOTAL=$(rclone lsf "$RCLONE_REMOTE" --files-only 2>/dev/null | wc -l)
  send_alert "✅ MedSysVE backup weekly digest — ${VPS_HOST} OK" \
"Sunday digest:
- Backups in Drive: ${BACKUPS_TOTAL}
- Latest: ${BACKUP_BASENAME} (sha256 ${LOCAL_SHA:0:16}...)
- Retention: GFS — ${RETENTION_DAILY} daily / ${RETENTION_WEEKLY} weekly / ${RETENTION_MONTHLY} monthly

System healthy."
fi

exit 0