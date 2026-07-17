#!/bin/sh
# Automated encrypted PostgreSQL backup.
# Designed to run as a CronJob in Coolify or as a system cron.
#
# Schedule: daily at 03:00 UTC (off-peak)
# Retention: 30 days local + uploaded to R2
# Encryption: AES-256-GCM via openssl
#
# Required env vars (set in Coolify container env):
#   DATABASE_URL       — postgres:// connection string
#   BACKUP_ENCRYPTION_KEY — base64 of 32 random bytes (openssl rand -base64 32)
#   R2_ENDPOINT        — Cloudflare R2 endpoint (optional)
#   R2_ACCESS_KEY_ID
#   R2_SECRET_ACCESS_KEY
#   R2_BUCKET          — bucket name

set -e

TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
BACKUP_DIR="/tmp/backups"
BACKUP_FILE="${BACKUP_DIR}/medsysve-${TIMESTAMP}.sql.gz"
ENC_FILE="${BACKUP_DIR}/medsysve-${TIMESTAMP}.sql.gz.enc"

mkdir -p "${BACKUP_DIR}"

if [ -z "${DATABASE_URL}" ]; then
  echo "ERROR: DATABASE_URL not set" >&2
  exit 1
fi

if [ -z "${BACKUP_ENCRYPTION_KEY}" ]; then
  echo "ERROR: BACKUP_ENCRYPTION_KEY not set" >&2
  echo "Generate with: openssl rand -base64 32" >&2
  exit 1
fi

# ─── 1. Dump DB ───
echo "[$(date -u +%FT%TZ)] Dumping database..."
# Parse DB host/port/user/pass/db from DATABASE_URL
DB_HOST=$(echo "${DATABASE_URL}" | sed -n 's|.*@\(.*\):.*|\1|p')
DB_PORT=$(echo "${DATABASE_URL}" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_USER=$(echo "${DATABASE_URL}" | sed -n 's|.*://\(.*\):.*|\1|p')
DB_PASS=$(echo "${DATABASE_URL}" | sed -n 's|.*://.*:\(.*\)@.*|\1|p')
DB_NAME=$(echo "${DATABASE_URL}" | sed -n 's|.*/\([^?]*\).*|\1|p')

if [ -z "${DB_NAME}" ]; then
  echo "ERROR: Could not parse DB name from DATABASE_URL" >&2
  exit 1
fi

PGPASSWORD="${DB_PASS}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip -9 > "${BACKUP_FILE}"

DUMP_SIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}")
echo "[$(date -u +%FT%TZ)] Dump size: ${DUMP_SIZE} bytes"

# ─── 2. Encrypt ───
echo "[$(date -u +%FT%TZ)] Encrypting with AES-256-GCM..."
# openssl enc supports -pbkdf2 for key derivation; key is base64-decoded first
echo -n "${BACKUP_ENCRYPTION_KEY}" | base64 -d > /tmp/backup.key
chmod 600 /tmp/backup.key

openssl enc -aes-256-gcm \
  -salt \
  -pbkdf2 \
  -iter 100000 \
  -in "${BACKUP_FILE}" \
  -out "${ENC_FILE}" \
  -pass file:/tmp/backup.key

# GCM doesn't have a built-in MAC in openssl enc output; we add HMAC-SHA256 separately
HMAC=$(openssl dgst -sha256 -hmac "$(cat /tmp/backup.key)" "${ENC_FILE}" | awk '{print $2}')
echo "${HMAC}  ${TIMESTAMP}  ${DUMP_SIZE}" > "${ENC_FILE}.hmac"

# Remove the unencrypted dump
rm -f "${BACKUP_FILE}" /tmp/backup.key

ENC_SIZE=$(stat -c%s "${ENC_FILE}" 2>/dev/null || stat -f%z "${ENC_FILE}")
echo "[$(date -u +%FT%TZ)] Encrypted size: ${ENC_SIZE} bytes"

# ─── 3. Upload to R2 (if configured) ───
if [ -n "${R2_ENDPOINT}" ] && [ -n "${R2_ACCESS_KEY_ID}" ]; then
  echo "[$(date -u +%FT%TZ)] Uploading to R2..."
  # Use AWS CLI with R2 endpoint
  AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
  aws s3 cp "${ENC_FILE}" "s3://${R2_BUCKET}/backups/medsysve-${TIMESTAMP}.sql.gz.enc" \
    --endpoint-url "${R2_ENDPOINT}" \
    --no-progress

  AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}" \
  aws s3 cp "${ENC_FILE}.hmac" "s3://${R2_BUCKET}/backups/medsysve-${TIMESTAMP}.sql.gz.enc.hmac" \
    --endpoint-url "${R2_ENDPOINT}" \
    --no-progress

  echo "[$(date -u +%FT%TZ)] Uploaded to s3://${R2_BUCKET}/backups/"
else
  echo "[$(date -u +%FT%TZ)] R2 not configured; keeping local copy only"
fi

# ─── 4. Cleanup: delete local backups older than 7 days ───
find "${BACKUP_DIR}" -name "medsysve-*.enc*" -mtime +7 -delete
echo "[$(date -u +%FT%TZ)] Cleanup complete. Remaining files:"
ls -la "${BACKUP_DIR}"

echo "[$(date -u +%FT%TZ)] Backup done."