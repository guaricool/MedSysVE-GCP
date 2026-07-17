#!/bin/bash
echo "=== msmtprc (password redacted) ==="
grep -v password /etc/msmtprc
echo "password       <REDACTED>"

echo ""
echo "=== Smoke test email ==="
NOW=$(date -u +%FT%TZ)
RFC=$(date -R)

{
  echo "From: MedSysVE Backup <cpierluissis@gmail.com>"
  echo "To: cpierluissis@gmail.com"
  echo "Subject: [smoke test] MedSysVE backup alerts working"
  echo "Date: $RFC"
  echo ""
  echo "If you see this in your Gmail, the msmtp + Gmail relay works."
  echo "VPS: $(hostname)"
  echo "Sent: $NOW"
  echo ""
  echo "If you DID NOT receive this email, the msmtp config is broken."
} | msmtp cpierluissis@gmail.com

echo ""
echo "=== msmtp log (last 10 lines) ==="
tail -10 /var/log/msmtp.log 2>/dev/null