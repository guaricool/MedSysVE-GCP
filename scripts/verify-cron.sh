#!/bin/bash
echo "=== Cron file ==="
cat /etc/cron.d/medsysve-backup

echo ""
echo "=== Cron daemon activo? ==="
if systemctl is-active cron >/dev/null 2>&1; then
  echo "cron: ACTIVE"
elif systemctl is-active crond >/dev/null 2>&1; then
  echo "crond: ACTIVE"
else
  echo "cron status:"
  systemctl is-active cron crond 2>&1 || true
fi

echo ""
echo "=== Files in /etc/cron.d/ ==="
ls -la /etc/cron.d/

echo ""
echo "=== run-parts test for medsysve ==="
run-parts --test /etc/cron.d/ 2>&1 | grep medsysve

echo ""
echo "=== Manual: would cron pick this up? ==="
echo "File basename: medsysve-backup"
echo "Cron runs /etc/cron.d/* daily at 07:00 UTC via /etc/cron.daily (no, this is wrong)."
echo "Actually /etc/cron.d/ files use the SCHEDULE inside them — they're picked up by cron every minute."