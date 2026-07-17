#!/bin/bash
# Quick health check for the MedSysVE backup chain.
# Run this whenever you suspect something is broken.
#
# Usage: bash /opt/medsysve-backup/health-check.sh

echo "=========================================="
echo "  MedSysVE Backup — Health Check"
echo "  $(date -u +%FT%TZ)"
echo "=========================================="

echo ""
echo "=== 1. CRON schedule ==="
echo "--- /etc/cron.d/medsysve-backup ---"
cat /etc/cron.d/medsysve-backup
echo ""
NEXT_RUN=$(grep -oE '[0-9]+ [0-9]+ \* \* \*' /etc/cron.d/medsysve-backup | awk '{printf "%s:%s UTC daily\n", $2, $1}')
echo "Schedule: daily at $NEXT_RUN"

echo ""
echo "=== 2. GOCRYPTFS mounts ==="
mount | grep -E "gocryptfs" | head -5 || echo "WARNING: no gocryptfs mounts"
echo ""
systemctl is-active medsysve-rclone-crypt.service 2>&1

echo ""
echo "=== 3. RCLONE token validity ==="
echo "--- Drive auth check ---"
if rclone lsd gdrive-medsysve: --max-depth 1 >/dev/null 2>&1; then
  echo "OK: Drive token valid"
  EXPIRY=$(grep -oE '"expiry":"[^"]+"' /root/.config/rclone/rclone.conf | head -1)
  echo "Token expiry: $EXPIRY"
else
  echo "FAIL: Drive auth invalid. Re-auth needed."
  echo ""
  echo "To re-auth from your Windows PowerShell:"
  echo ""
  echo '  ssh -i "C:\Users\cpier\.ssh\id_ed25519_vps" -L 53682:127.0.0.1:53682 root@13.140.181.29 -t "rclone authorize drive"'
  echo ""
  echo "Open http://127.0.0.1:53682/auth in Chrome, login, Allow, paste the JSON in chat."
fi

echo ""
echo "=== 4. EMAIL alerts ==="
echo "--- msmtp config ---"
ls -la /etc/msmtprc 2>/dev/null | awk '{print $1, $3, $4, $9}'
grep -c "__GMAIL_APP_PASSWORD_PLACEHOLDER__" /etc/msmtprc 2>/dev/null && echo "WARNING: App Password not configured" || echo "OK: App Password configured"
echo "--- last 3 msmtp sends ---"
tail -3 /var/log/msmtp.log 2>/dev/null

echo ""
echo "=== 5. Keyfile integrity ==="
ACTUAL=$(sha256sum /root/medsysve-keyfile 2>/dev/null | awk '{print $1}')
EXPECTED="44c94ce0caf3a321879dabd7fce630ddb44f73b8a31d5ecff31684972de7f8a4"
if [ "$ACTUAL" = "$EXPECTED" ]; then
  echo "OK: keyfile matches expected sha256"
else
  echo "WARNING: keyfile sha256 mismatch!"
  echo "  actual:   $ACTUAL"
  echo "  expected: $EXPECTED"
fi

echo ""
echo "=== 6. Postgres + MedSysVE containers ==="
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E "tf03dm49|hze8mocu" | head -5

echo ""
echo "=== 7. Backup log (last 5 lines) ==="
tail -5 /var/log/medsysve-backup.log 2>/dev/null

echo ""
echo "=========================================="
echo "  END HEALTH CHECK"
echo "=========================================="