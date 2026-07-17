#!/bin/bash
# Wrapper for systemd medsysve-rclone-crypt.service.
# Mounts both gocryptfs vaults (rclone config + backup secrets).

set -e

LOG=/var/log/medsysve-crypt-mount.log
log() { echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOG"; }

KEYFILE=/root/medsysve-keyfile

# Sanity: keyfile exists?
if [ ! -r "$KEYFILE" ]; then
  log "FATAL: keyfile $KEYFILE not readable. Run the gocryptfs setup script."
  exit 1
fi

# Mount rclone config vault
if ! mountpoint -q /root/.config/rclone; then
  log "Mounting /root/.config/rclone-enc -> /root/.config/rclone..."
  /usr/bin/gocryptfs -passfile "$KEYFILE" -allow_other \
    /root/.config/rclone-enc /root/.config/rclone 2>&1 | tee -a "$LOG"
fi

# Mount backup secrets vault
if ! mountpoint -q /opt/medsysve-backup-secrets; then
  log "Mounting /opt/medsysve-backup-secrets-enc -> /opt/medsysve-backup-secrets..."
  /usr/bin/gocryptfs -passfile "$KEYFILE" -allow_other \
    /opt/medsysve-backup-secrets-enc /opt/medsysve-backup-secrets 2>&1 | tee -a "$LOG"
fi

log "Mounts active: $(mount | grep -c gocryptfs) gocryptfs filesystem(s)"
