#!/bin/bash
echo "=== rclone config show (no secrets) ==="
rclone config show gdrive-medsysve 2>&1 | sed 's/password =.*/password = <REDACTED>/' | sed 's/refresh_token" = "[^"]*/refresh_token" = <REDACTED>/' | sed 's/access_token" = "[^"]*/access_token" = <REDACTED>/'

echo ""
echo "=== Token expiry ==="
grep -oE '"expiry":"[^"]*"' /root/.config/rclone/rclone.conf 2>&1

echo ""
echo "=== Current time (UTC) ==="
date -u

echo ""
echo "=== rclone -v test ==="
rclone -v lsd gdrive-medsysve: --max-depth 1 2>&1 | head -25

echo ""
echo "=== rclone lsf (crypt layer) ==="
rclone -v lsf gdrive-medsysve-crypt:backups/ 2>&1 | head -10

echo ""
echo "=== Direct download test of existing backup ==="
LATEST=$(rclone lsf gdrive-medsysve:MedSysVE-Backups/ --files-only 2>/dev/null | sort -r | head -1)
echo "Latest file in Drive (via gdrive-medsysve): '$LATEST'"
echo "Latest file in Drive (via gdrive-medsysve-crypt): $(rclone lsf gdrive-medsysve-crypt:backups/ 2>/dev/null | sort -r | head -1)"

echo ""
echo "=== Trying lsf just on the MedSysVE-Backups folder ==="
rclone -v lsf gdrive-medsysve:MedSysVE-Backups/ 2>&1 | head -10