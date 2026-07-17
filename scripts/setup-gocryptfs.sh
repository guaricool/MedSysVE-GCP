#!/bin/bash
# Install + set up gocryptfs to encrypt the sensitive secrets on the VPS.
# This is "encryption at rest" for the specific files that would compromise
# the backup chain if leaked (rclone.conf, OAuth tokens, crypt passphrases).
#
# Layout after this script:
#   /root/.config/rclone-enc/        ← ciphertext (always on disk)
#   /root/.config/rclone/            ← plaintext mount (only when mounted)
#   /opt/medsysve-backup-enc/        ← ciphertext (always on disk)
#   /opt/medsysve-backup-secrets/    ← plaintext mount (only when mounted)
#   /root/medsysve-keyfile           ← the gocryptfs key (chmod 400)
#
# Recovery: if the VPS dies, you restore the .enc directories from a backup
# (or recreate them from scratch) and mount with the keyfile to recover the
# plaintext config.

set -euo pipefail

echo "=========================================="
echo "  GOCRYPTFS — Encryption at Rest Setup"
echo "=========================================="

# 1. Install gocryptfs
if ! command -v gocryptfs >/dev/null 2>&1; then
  echo ""
  echo "[1/5] Installing gocryptfs..."
  apt-get update -qq
  apt-get install -y gocryptfs fuse 2>&1 | tail -5
else
  echo "[1/5] gocryptfs already installed: $(gocryptfs --version 2>&1 | head -1)"
fi

# 2. Generate keyfile (384 bits entropy, base64)
echo ""
echo "[2/5] Generating encryption keyfile..."
KEYFILE=/root/medsysve-keyfile
mkdir -p /root
chmod 700 /root
dd if=/dev/urandom bs=48 count=1 2>/dev/null | base64 > "$KEYFILE"
chmod 400 "$KEYFILE"
echo "    Keyfile: $KEYFILE (chmod 400)"

# 3. Create encrypted dirs + initial empty plaintext mounts
echo ""
echo "[3/5] Creating encrypted directories..."

# rclone config encryption
mkdir -p /root/.config/rclone-enc
gocryptfs -init -scryptn=17 -passfile "$KEYFILE" /root/.config/rclone-enc 2>&1 | tail -3

# Move existing rclone.conf into the encrypted vault BEFORE mounting
# (otherwise mounting over an existing dir hides files, doesn't replace them)
if [ -f /root/.config/rclone/rclone.conf ] && [ ! -f /root/.config/rclone/rclone.conf.preserved ]; then
  cp /root/.config/rclone/rclone.conf /root/.config/rclone/rclone.conf.preserved
  echo "    Preserved current rclone.conf at /root/.config/rclone/rclone.conf.preserved"
fi
rm -rf /root/.config/rclone
mkdir -p /root/.config/rclone
gocryptfs -passfile "$KEYFILE" -allow_other /root/.config/rclone-enc /root/.config/rclone 2>&1 | tail -3
if [ -f /root/.config/rclone/rclone.conf.preserved ]; then
  cp /root/.config/rclone/rclone.conf.preserved /root/.config/rclone/rclone.conf
  chmod 600 /root/.config/rclone/rclone.conf
  rm /root/.config/rclone/rclone.conf.preserved
  echo "    Moved rclone.conf into encrypted mount"
fi

# Backup secrets encryption (the passphrase file)
mkdir -p /opt/medsysve-backup-secrets-enc
gocryptfs -init -scryptn=17 -passfile "$KEYFILE" /opt/medsysve-backup-secrets-enc 2>&1 | tail -3
if [ -f /root/medsysve-passphrase-backup/PASSWORDS-NEEDED-TO-RESTORE.txt ]; then
  mkdir -p /opt/medsysve-backup-secrets
  gocryptfs -passfile "$KEYFILE" -allow_other /opt/medsysve-backup-secrets-enc /opt/medsysve-backup-secrets 2>&1 | tail -3
  cp /root/medsysve-passphrase-backup/PASSWORDS-NEEDED-TO-RESTORE.txt /opt/medsysve-backup-secrets/
  chmod 600 /opt/medsysve-backup-secrets/PASSWORDS-NEEDED-TO-RESTORE.txt
  echo "    Moved passphrase into encrypted mount"
fi

# 4. Set up automount via systemd (mounts on boot, no interactive prompt needed)
echo ""
echo "[4/5] Configuring systemd automount..."

cat > /etc/systemd/system/medsysve-rclone-crypt.service <<EOF
[Unit]
Description=MedSysVE rclone + secrets gocryptfs mounts
After=local-fs.target
Before=cron.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/gocryptfs -passfile /root/medsysve-keyfile -allow_other /root/.config/rclone-enc /root/.config/rclone
ExecStart=/usr/bin/gocryptfs -passfile /root/medsysve-keyfile -allow_other /opt/medsysve-backup-secrets-enc /opt/medsysve-backup-secrets
ExecStop=/bin/umount /root/.config/rclone
ExecStop=/bin/umount /opt/medsysve-backup-secrets

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable medsysve-rclone-crypt.service
systemctl start medsysve-rclone-crypt.service
sleep 1

# 5. Verify
echo ""
echo "[5/5] Verifying mounts..."
mount | grep -E "rclone|medsysve-backup-secrets" | head -5
echo ""
echo "rclone.conf readable?"
test -r /root/.config/rclone/rclone.conf && echo "  YES — rclone.conf mounted and accessible"
echo "passphrase file readable?"
test -r /opt/medsysve-backup-secrets/PASSWORDS-NEEDED-TO-RESTORE.txt && echo "  YES — passphrase mounted and accessible"
echo ""
echo "Smoke test: list Drive (should work without re-auth)"
rclone lsd gdrive-medsysve: --max-depth 1 2>&1 | head -5

echo ""
echo "=========================================="
echo "  DONE"
echo "=========================================="
echo ""
echo "KEYFILE: $KEYFILE"
echo ""
echo "    Carlos must save this keyfile to:"
echo "    - His password manager (1Password / Bitwarden / etc.)"
echo "    - A USB drive or printed paper in a safe (offline backup)"
echo ""
echo "    If the VPS dies, restore procedure:"
echo "    1. Install gocryptfs on a new system"
echo "    2. Copy $KEYFILE to /root/medsysve-keyfile (chmod 400)"
echo "    3. Restore the .enc directories (from backup or recreate empty)"
echo "    4. Run: gocryptfs -passfile /root/medsysve-keyfile /root/.config/rclone-enc /root/.config/rclone"
echo "    5. Done. The plaintext rclone.conf + secrets are accessible."
echo ""
echo "    WITHOUT THIS KEYFILE, ALL BACKUPS ARE UNRECOVERABLE."
echo "=========================================="