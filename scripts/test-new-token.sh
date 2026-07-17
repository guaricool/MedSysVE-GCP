#!/bin/bash
echo "=== Token actualizado ==="
grep -oE '"expiry":"[^"]+"' /root/.config/rclone/rclone.conf
echo ""
echo "=== Test: listar Drive root ==="
rclone lsd gdrive-medsysve: --max-depth 1 2>&1 | head -10
echo ""
echo "=== Test: listar backups ==="
rclone lsf gdrive-medsysve:MedSysVE-Backups/ --files-only 2>&1 | head -10
echo ""
echo "=== Test: backup completo (manual) ==="
/opt/medsysve-backup/backup.sh 2>&1 | tail -15