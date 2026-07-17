#!/bin/bash
# Simulate a backup failure to test the alert email.
# We call the SAME send_alert function the backup script uses,
# but with a FAKE failure message — no real damage to the system.

set -euo pipefail

LOG=/var/log/medsysve-backup.log
ALERT_TO=cpierluissis@gmail.com

echo "=== Sending simulated FAILURE alert email ==="

# Inline copy of the send_alert function (mirrors backup.sh exactly).
send_alert() {
  local subject="$1"
  local body="$2"

  log() { echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOG"; }
  log "Sending alert email to ${ALERT_TO}..."
  if printf "From: MedSysVE Backup <noreply@medsysve.com>\nTo: %s\nSubject: %s\nDate: %s\n\n%s\n" \
       "${ALERT_TO}" "${subject}" "$(date -R)" "${body}" \
       | msmtp --from=cpierluissis@gmail.com "${ALERT_TO}" 2>>"$LOG"; then
    log "Alert email sent."
  else
    log "ALERT email FAILED to send. Check /var/log/msmtp.log"
  fi
}

send_alert "❌ [TEST] MedSysVE backup FAILED on $(hostname -f 2>/dev/null || hostname) — simulated failure" \
  "THIS IS A TEST ALERT. No actual problem.

The simulated failure scenario: pg_dump returned non-zero exit code.

Last log lines:
$(tail -10 "$LOG" 2>/dev/null)

This message was sent by /tmp/test-alert-failure.sh to verify the
msmtp + Gmail alert channel works end-to-end.

If you received this in your Gmail, the alert system is operational.
Real alerts will use this same channel with similar subject lines
(prefixed with ❌) when the daily backup fails."

echo ""
echo "=== msmtp log (last 5 lines) ==="
tail -5 /var/log/msmtp.log 2>/dev/null