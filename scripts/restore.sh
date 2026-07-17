#!/bin/bash
# MedSysVE restore script.
# Usage: ./restore.sh [YYYYMMDD]
#   - with no arg: restores most recent backup
#   - with arg: restores that date's backup (e.g. 20260625)

set -euo pipefail

REMOTE=gdrive-medsysve-crypt:backups
PG_CONTAINER=tf03dm49her0vco2lprdqbjm
PG_USER=medsysve
PG_DB=medsysve

if [ -n "${1:-}" ]; then
  DATE="$1"
else
  # Find most recent backup file
  LATEST=$(rclone lsf "$REMOTE" --files-only 2>/dev/null | sort -r | head -1)
  if [ -z "$LATEST" ]; then
    echo "ERROR: no backups found."
    exit 1
  fi
  DATE=$(echo "$LATEST" | grep -oE '[0-9]{8}' | head -1)
fi

FILE="${REMOTE}/${DATE}.sql.gz"
RESTORE_FILE="/tmp/medsysve-restore-${DATE}.sql.gz"

echo "Restoring from $FILE..."
rclone cat "$FILE" > "$RESTORE_FILE"

echo "Applying dump to $PG_DB..."
gunzip -c "$RESTORE_FILE" | docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB"

rm -f "$RESTORE_FILE"
echo "Restore complete from $DATE."