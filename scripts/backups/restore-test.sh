#!/usr/bin/env bash
# MedSysVE monthly restore drill (audit #18)
#
# Downloads the most recent backup from the encrypted Google Drive remote,
# restores it into a TEMPORARY database (medsysve_restore_test_<timestamp>),
# runs a basic schema/rowcount sanity check, then drops the temp DB.
# If anything fails, exits non-zero so the cron can alert.
#
# This script never touches the production database.
#
# Cron: monthly on the 1st at 04:00 UTC (Coolify scheduled task `backup-restore-test`)
#
# Exit codes:
#   0 - restore + checks all passed, temp DB cleaned up
#   1 - download, restore, or check failed (see log)
#
# Environment overrides:
#   BACKUP_PG_CONTAINER  (default: tf03dm49her0vco2lprdqbjm)
#   BACKUP_PG_USER       (default: medsysve)
#   BACKUP_RCLONE_REMOTE (default: gdrive-medsysve-crypt:backups)
#   BACKUP_RESTORE_DB_PREFIX (default: medsysve_restore_test_)
#   BACKUP_REQUIRED_TABLES  (default: "User Doctor Patient Encounter AuditEvent")
#     space-separated list of tables that MUST exist with rowcount >= 1

set -euo pipefail

PG_CONTAINER="${BACKUP_PG_CONTAINER:-tf03dm49her0vco2lprdqbjm}"
PG_USER="${BACKUP_PG_USER:-medsysve}"
RCLONE_REMOTE="${BACKUP_RCLONE_REMOTE:-gdrive-medsysve-crypt:backups}"
DB_PREFIX="${BACKUP_RESTORE_DB_PREFIX:-medsysve_restore_test_}"
# Required tables for sanity check. Note: MedSysVE does NOT have a `User`
# table — it uses `Doctor` directly as the user entity (no separate User
# model in Prisma). Override via env var if schema changes.
REQUIRED_TABLES="${BACKUP_REQUIRED_TABLES:-Doctor Patient Encounter AuditEvent _prisma_migrations}"

LOG_FILE="${BACKUP_LOG_FILE:-/var/log/medsysve-restore-test.log}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TEMP_DB="${DB_PREFIX}${TIMESTAMP}"

log() {
  local ts
  ts="$(date -u +%FT%TZ)"
  echo "[$ts] $*" | tee -a "$LOG_FILE"
}

fail() {
  local code="$1"; shift
  log "ERROR ($code): $*"
  cleanup_on_fail
  exit "$code"
}

cleanup_on_fail() {
  if [[ -n "${TEMP_DB:-}" ]]; then
    log "cleanup: dropping temp DB $TEMP_DB"
    docker exec "$PG_CONTAINER" dropdb -U "$PG_USER" --if-exists "$TEMP_DB" 2>>"$LOG_FILE" || true
  fi
  [[ -n "${LOCAL_BACKUP:-}" ]] && rm -f "$LOCAL_BACKUP"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail 1 "missing required command: $1"
}

mkdir -p "$(dirname "$LOG_FILE")"
require_cmd docker
require_cmd gunzip
require_cmd rclone

log "=== restore drill starting (target: $TEMP_DB) ==="

# ---- 1. Verify container ----
if ! docker inspect --format='{{.State.Health.Status}}' "$PG_CONTAINER" 2>/dev/null \
   | grep -qE '^(healthy|starting)$'; then
  fail 1 "postgres container '$PG_CONTAINER' not healthy/starting"
fi

# ---- 2. Pick latest backup from remote ----
# Accept both formats during migration:
#   OLD: YYYYMMDD.sql.gz            (e.g. 20260706.sql.gz)
#   NEW: YYYYMMDDTHHMMSSZ.sql.gz    (e.g. 20260706T232420Z.sql.gz)
LATEST=$(rclone lsf "$RCLONE_REMOTE" --format 'p' 2>/dev/null \
         | grep -E '^[0-9]{8}(T[0-9]{6}Z)?\.sql\.gz$' \
         | sort -r | head -1)
[[ -z "$LATEST" ]] && fail 1 "no backup files found in $RCLONE_REMOTE"
log "latest backup: $LATEST"

# ---- 3. Download ----
LOCAL_BACKUP="/tmp/restore-test-${TIMESTAMP}.sql.gz"
if ! rclone copyto "${RCLONE_REMOTE}/${LATEST}" "$LOCAL_BACKUP" --stats 0 2>>"$LOG_FILE"; then
  fail 1 "rclone download failed"
fi
DOWNLOAD_SIZE=$(stat -c '%s' "$LOCAL_BACKUP" 2>/dev/null || stat -f '%z' "$LOCAL_BACKUP")
log "downloaded: $LOCAL_BACKUP ($DOWNLOAD_SIZE bytes)"

# ---- 4. Create temp DB ----
if ! docker exec "$PG_CONTAINER" createdb -U "$PG_USER" "$TEMP_DB" 2>>"$LOG_FILE"; then
  fail 1 "createdb failed for $TEMP_DB"
fi
log "created temp DB: $TEMP_DB"

# ---- 5. Restore ----
if ! gunzip -c "$LOCAL_BACKUP" | docker exec -i "$PG_CONTAINER" \
     psql -U "$PG_USER" -d "$TEMP_DB" -v ON_ERROR_STOP=1 2>>"$LOG_FILE" >/tmp/restore-test-out.log; then
  log "psql output (last 30 lines):"
  tail -30 /tmp/restore-test-out.log | tee -a "$LOG_FILE"
  fail 1 "psql restore failed"
fi
log "restore complete"

# ---- 6. Sanity checks ----
# 6a. Tables exist and have rows (covers _prisma_migrations if listed)
for table in $REQUIRED_TABLES; do
  COUNT=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$TEMP_DB" -tA \
          -c "SELECT COUNT(*) FROM \"$table\";" 2>>"$LOG_FILE" || echo "ERR")
  if [[ "$COUNT" == "ERR" || "$COUNT" -lt 1 ]]; then
    log "FAIL: table $table missing or empty (count=$COUNT)"
    fail 1 "schema/rowcount check failed: $table"
  fi
  log "  ok: $table has $COUNT rows"
done

# 6b. Migrations table not empty (defense-in-depth if _prisma_migrations
# wasn't listed in REQUIRED_TABLES)
MIG_COUNT=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$TEMP_DB" -tA \
            -c "SELECT COUNT(*) FROM _prisma_migrations;" 2>>"$LOG_FILE")
if [[ "$MIG_COUNT" -lt 1 ]]; then
  fail 1 "_prisma_migrations empty — schema looks uninitialised"
fi
log "  ok: _prisma_migrations has $MIG_COUNT entries"

# ---- 7. Cleanup ----
docker exec "$PG_CONTAINER" dropdb -U "$PG_USER" "$TEMP_DB" 2>>"$LOG_FILE" \
  || log "WARN: failed to drop $TEMP_DB"
rm -f "$LOCAL_BACKUP" /tmp/restore-test-out.log

log "=== restore drill PASSED ($LATEST, ${DOWNLOAD_SIZE} bytes) ==="
exit 0