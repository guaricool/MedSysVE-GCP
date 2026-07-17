#!/bin/bash
set -euo pipefail

echo "=========================================="
echo "  ALERTAS POR EMAIL — msmtp + Gmail SMTP"
echo "=========================================="

# 1. Install msmtp
echo ""
echo "[1/4] Installing msmtp..."
if command -v msmtp >/dev/null 2>&1; then
  echo "    msmtp already installed: $(msmtp --version | head -1)"
else
  apt-get install -y msmtp msmtp-mta bsd-mailx 2>&1 | tail -3
fi

# 2. Write msmtp config (Gmail SMTP with STARTTLS on port 587)
echo ""
echo "[2/4] Writing /etc/msmtprc..."
cat > /etc/msmtprc <<'EOF'
# MedSysVE VPS — Gmail SMTP relay for backup alerts.
# File mode 600. NEVER commit to git.
# Setup: see https://support.google.com/accounts/answer/185833
#   1. Enable 2FA on the Google account
#   2. Create an App Password (Mail + cpierluissis@gmail.com)
#   3. Paste the 16-char app password below (no spaces)

defaults
auth           on
tls            on
tls_starttls   on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

account        default
host           smtp.gmail.com
port           587
from           cpierluissis@gmail.com
user           cpierluissis@gmail.com
password       __GMAIL_APP_PASSWORD_PLACEHOLDER__

account default : default
EOF

chmod 600 /etc/msmtprc
echo "    /etc/msmtprc written (chmod 600)"
echo ""
echo "    ============================================================"
echo "    ACCIÓN REQUERIDA:"
echo "    ============================================================"
echo "    1. Ir a https://myaccount.google.com/apppasswords"
echo "    2. Si pide, habilita 2FA primero"
echo "    3. App name: 'MedSysVE VPS backup alerts'"
echo "    4. Click 'Create'"
echo "    5. Copiá los 16 caracteres (sin espacios)"
echo "    6. Pegámelos en el chat y reemplazo el placeholder en /etc/msmtprc"
echo "    ============================================================"

# 3. Set up mail alias for root -> cpierluissis@gmail.com
echo ""
echo "[3/4] Setting up mail alias..."
grep -q "^root:" /etc/aliases 2>/dev/null && sed -i 's/^root:.*/root: cpierluissis@gmail.com/' /etc/aliases || echo "root: cpierluissis@gmail.com" >> /etc/aliases
newaliases 2>/dev/null || true
echo "    /etc/aliases: root -> cpierluissis@gmail.com"

# 4. Test (will fail until Carlos pastes the App Password, but we'll see the error type)
echo ""
echo "[4/4] Testing msmtp (expected to fail until App Password is set)..."
echo "Subject: MedSysVE backup alerts test
From: cpierluissis@gmail.com
To: cpierluissis@gmail.com

This is a smoke test of the msmtp config.
If you receive this, the alert chain works.
" | msmtp --debug cpierluissis@gmail.com 2>&1 | tail -20 || echo "    (send failed — expected until App Password is set)"

echo ""
echo "=========================================="
echo "  NEXT STEPS"
echo "=========================================="
echo "  1. Carlos: create Gmail App Password at the URL above"
echo "  2. Carlos: paste the 16-char password in chat"
echo "  3. mavis: replace __GMAIL_APP_PASSWORD_PLACEHOLDER__ in /etc/msmtprc"
echo "  4. mavis: re-test msmtp send"
echo "  5. mavis: update backup.sh to send mail on failure"
echo "=========================================="