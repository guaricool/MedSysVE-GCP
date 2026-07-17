#!/bin/bash
# Restore test — verify the backup can actually be restored.
# Creates a TEMPORARY database (medsysve_restore_test) from the latest backup,
# runs sanity checks, then drops it. The real DB is never touched.
#
# Note: deliberately does NOT use `set -e` because gunzip | head exits with
# SIGPIPE (head closes the pipe early) which would kill the script.

set -u

LOG=/tmp/restore-test.log
PG_CONTAINER=tf03dm49her0vco2lprdqbjm
PG_USER=medsysve
REAL_DB=medsysve
TEST_DB=medsysve_restore_test
RESTORE_DIR=/tmp/restore-test

echo "=== Restore test started at $(date -u +%FT%TZ) ===" | tee -a "$LOG"

# 1. Make sure gocryptfs mount is active
if ! mountpoint -q /root/.config/rclone; then
  echo "Mounting gocryptfs secrets..."
  systemctl start medsysve-rclone-crypt.service
  sleep 1
fi

# 2. Get the latest backup from Drive (use crypt layer so file names are readable)
echo ""
echo "=== Listing backups from Drive (decrypted view) ===" | tee -a "$LOG"

# In the crypt layer, files appear as files. Use rclone lsf directly.
# rclone lsf output format: "  SIZE DATE NAME" for files, "  DATE NAME" for dirs.
ALL=$(rclone lsf gdrive-medsysve-crypt:backups/ 2>/dev/null || true)
echo "All entries in crypt layer:"
echo "$ALL"

# Pick the .sql.gz file with the latest YYYYMMDD prefix (alphabetical = chronological).
LATEST_FILE=$(echo "$ALL" | awk '{print $NF}' | grep '\.sql\.gz$' | sort -r | head -1)
echo "Latest backup file: $LATEST_FILE"

if [ -z "$LATEST_FILE" ]; then
  echo "FAIL: no .sql.gz files found in crypt layer" | tee -a "$LOG"
  echo "Trying plain Drive layer..." | tee -a "$LOG"
  # Fallback: list plain drive
  rclone lsf gdrive-medsysve:MedSysVE-Backups/ 2>&1 | tee -a "$LOG"
  exit 1
fi

# 3. Download the decrypted file
echo ""
echo "=== Downloading + decrypting ===" | tee -a "$LOG"
mkdir -p "$RESTORE_DIR"
cd "$RESTORE_DIR"

rclone copy "gdrive-medsysve-crypt:backups/$LATEST_FILE" "$RESTORE_DIR/" 2>&1 | tail -3 | tee -a "$LOG"
DECRYPTED="$RESTORE_DIR/$LATEST_FILE"
echo "Decrypted file: $DECRYPTED"

if [ ! -f "$DECRYPTED" ]; then
  echo "FAIL: download didn't produce expected file" | tee -a "$LOG"
  ls -laR "$RESTORE_DIR" | tee -a "$LOG"
  exit 1
fi

LOCAL_SIZE=$(stat -c %s "$DECRYPTED")
LOCAL_SHA=$(sha256sum "$DECRYPTED" | awk '{print $1}')
echo "Decrypted size: $LOCAL_SIZE bytes, sha256: ${LOCAL_SHA:0:16}..."

# 4. Verify gzip + Postgres format
echo ""
echo "=== Sanity check on the dump ===" | tee -a "$LOG"
FILE_TYPE=$(file "$DECRYPTED" | awk -F: '{print $2}')
echo "File type: $FILE_TYPE"

if ! gunzip -t "$DECRYPTED" 2>/dev/null; then
  echo "FAIL: file is not valid gzip" | tee -a "$LOG"
  exit 1
fi
echo "OK: gzip integrity verified"

FIRST_LINE=$(gunzip -c "$DECRYPTED" | head -1)
echo "First line: ${FIRST_LINE:0:100}..."
if [[ "$FIRST_LINE" == *"PostgreSQL database dump"* ]]; then
  echo "OK: looks like a valid Postgres dump"
else
  echo "WARNING: first line doesn't match expected Postgres dump header"
fi

# 5. Create test DB
echo ""
echo "=== Creating test database ===" | tee -a "$LOG"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEST_DB;" 2>&1 | tail -1 | tee -a "$LOG"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -c "CREATE DATABASE $TEST_DB;" 2>&1 | tail -1 | tee -a "$LOG"

# 6. Restore into test DB
echo ""
echo "=== Restoring into $TEST_DB ===" | tee -a "$LOG"
if gunzip -c "$DECRYPTED" | docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$TEST_DB" >/tmp/restore-pg.log 2>&1; then
  echo "OK: psql completed" | tee -a "$LOG"
else
  echo "FAIL: psql returned non-zero (check /tmp/restore-pg.log)"
  tail -10 /tmp/restore-pg.log | tee -a "$LOG"
  # Don't exit — the restore might have mostly worked, count check will tell us
fi

# 7. Compare counts
echo ""
echo "=== Comparing counts: real DB vs restored DB ===" | tee -a "$LOG"
ALL_MATCH=1
for TABLE in Doctor Patient Encounter Appointment Invoice AuditEvent ConsentAcceptance LegalVersion BreachIncident DataExportRequest DataDeletionRequest; do
  REAL=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$REAL_DB" -t -c "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null | tr -d ' ')
  TEST=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$TEST_DB"  -t -c "SELECT COUNT(*) FROM \"$TABLE\";" 2>/dev/null | tr -d ' ')
  if [ "$REAL" = "$TEST" ]; then
    printf "  %-25s real=%-4s restored=%-4s  OK\n" "$TABLE" "$REAL" "$TEST" | tee -a "$LOG"
  else
    printf "  %-25s real=%-4s restored=%-4s  MISMATCH\n" "$TABLE" "$REAL" "$TEST" | tee -a "$LOG"
    ALL_MATCH=0
  fi
done

# 8. Spot-check: cpierluissis@gmail.com
echo ""
echo "=== Spot-check: cpierluissis@gmail.com ===" | tee -a "$LOG"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$TEST_DB" -c \
  "SELECT email, nombre, apellido, plan FROM \"Doctor\" WHERE email = 'cpierluissis@gmail.com';" 2>&1 | tee -a "$LOG"

# 9. Cleanup
echo ""
echo "=== Cleanup ===" | tee -a "$LOG"
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d postgres -c "DROP DATABASE $TEST_DB;" 2>&1 | tail -1 | tee -a "$LOG"
rm -rf "$RESTORE_DIR"

echo ""
if [ "$ALL_MATCH" = "1" ]; then
  echo "=== Restore test PASSED at $(date -u +%FT%TZ) ===" | tee -a "$LOG"
else
  echo "=== Restore test COMPLETED WITH MISMATCHES at $(date -u +%FT%TZ) ===" | tee -a "$LOG"
fi
echo "Real DB was NOT touched. Test DB dropped. Restore dir cleaned up."