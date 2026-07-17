#!/bin/sh
# Restore an encrypted backup.
#
# Usage: ./restore-db.sh /path/to/backup.sql.gz.enc
#
# Required env:
#   DATABASE_URL
#   BACKUP_ENCRYPTION_KEY — same key used at backup time.

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <encrypted-backup-file>"
  exit 1
fi

ENC_FILE="$1"
TMP_DEC="/tmp/restore-$$.sql.gz"
TMP_PLAIN="/tmp/restore-plain-$$.sql"

if [ -z "${DATABASE_URL}" ]; then
  echo "ERROR: DATABASE_URL not set" >&2
  exit 1
fi

if [ -z "${BACKUP_ENCRYPTION_KEY}" ]; then
  echo "ERROR: BACKUP_ENCRYPTION_KEY not set" >&2
  exit 1
fi

# Verify HMAC if .hmac sidecar exists
HMAC_FILE="${ENC_FILE}.hmac"
if [ -f "${HMAC_FILE}" ]; then
  echo "[$(date -u +%FT%TZ)] Verifying HMAC..."
  echo -n "${BACKUP_ENCRYPTION_KEY}" | base64 -d > /tmp/restore.key
  chmod 600 /tmp/restore.key
  EXPECTED=$(awk '{print $1}' "${HMAC_FILE}")
  ACTUAL=$(openssl dgst -sha256 -hmac "$(cat /tmp/restore.key)" "${ENC_FILE}" | awk '{print $2}')
  if [ "${EXPECTED}" != "${ACTUAL}" ]; then
    echo "ERROR: HMAC mismatch — backup file tampered!" >&2
    rm -f /tmp/restore.key
    exit 1
  fi
  echo "[$(date -u +%FT%TZ)] HMAC OK"
fi

echo "[$(date -u +%FT%TZ)] Decrypting..."
openssl enc -d -aes-256-gcm \
  -pbkdf2 \
  -iter 100000 \
  -in "${ENC_FILE}" \
  -out "${TMP_DEC}" \
  -pass file:/tmp/restore.key
rm -f /tmp/restore.key

echo "[$(date -u +%FT%TZ)] Decompressing..."
gunzip -c "${TMP_DEC}" > "${TMP_PLAIN}"
rm -f "${TMP_DEC}"

# Parse connection
DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's|.*@\(.*\):.*|\1|p')
DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo "${DATABASE_URL}" | sed -n 's|.*://\(.*\):.*|\1|p')
DB_PASS=$(echo "${DATABASE_URL}" | sed -n 's|.*://.*:\(.*\)@.*|\1|p')
DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "[$(date -u +%FT%TZ)] Restoring into ${DB_NAME} on ${DB_HOST}..."
PGPASSWORD="${DB_PASS}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -v ON_ERROR_STOP=1 \
  -f "${TMP_PLAIN}"

rm -f "${TMP_PLAIN}"
echo "[$(date -u +%FT%TZ)] Restore complete."