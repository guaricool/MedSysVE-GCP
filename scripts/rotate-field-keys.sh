#!/usr/bin/env bash
#
# rotate-field-keys.sh — Audit S11 (2026-07-07, closes audit #4).
#
# Rotates FIELD_ENCRYPTION_KEY and FIELD_HMAC_KEY in production. Re-encrypts
# every PHI column under the new keys while keeping the app offline (downtime
# window) for safety. HMAC indexes are recomputed under the new HMAC key
# (the index is deterministic, so the lookup is still correct after rotation).
#
# ## When to run
#
#   - Quarterly (recommended by lib/field-crypto.ts header comment).
#   - Immediately if a key is suspected of compromise.
#   - After migrating to a new deployment region.
#
# ## Pre-flight (manual)
#
#   1. Generate the new keys:
#        export NEW_FIELD_ENCRYPTION_KEY=$(openssl rand -base64 32)
#        export NEW_FIELD_HMAC_KEY=$(openssl rand -base64 32)
#   2. Set the new keys in Coolify → Environment (don't redeploy yet).
#   3. Stop the running MedSysVE container:
#        docker stop hze8mocuh4xqskqwrm3mx50b-<ID>
#   4. Take a fresh DB backup (defense in depth):
#        bash /opt/medsysve-backup/backup.sh
#   5. Run this script with --dry-run first; inspect the output.
#   6. Run again without --dry-run to actually rotate.
#   7. Update Coolify's env to use the new keys and redeploy.
#   8. Verify with a smoke test (login + view a known patient).
#   9. Retain the old keys in a backup vault for 30 days in case any
#      archived row needs to be read with the old key (rolling
#      decommissioning).
#
# ## Why downtime?
#
# The current encryption layer is single-key (lib/field-crypto.ts). During
# rotation, rows exist in both old and new ciphertext until the worker
# finishes. Supporting concurrent reads mid-rotation requires dual-key
# decryption with a versioned prefix on each ciphertext — that's a
# follow-up ("key versioning"), not part of this audit.
#
# ## Idempotency
#
# Safe to re-run after a failure. The worker is per-row idempotent: each
# row is decrypted with the old key, re-encrypted with the new key, and
# written back. If a row was already rotated (e.g. re-run after partial
# success), the worker detects the new ciphertext and skips it.

set -euo pipefail

# ---------------------------------------------------------------------------
# Args
# ---------------------------------------------------------------------------

DRY_RUN=0
WORKER_PATH=""
BACKUP_PATH=""

usage() {
  cat <<EOF
Usage: $0 --old-enc-key <key> --new-enc-key <key> --old-hmac-key <key> --new-hmac-key <key> [--dry-run] [--worker <path>]

Options:
  --old-enc-key <key>     Base64 32-byte key currently used for AES-256-GCM.
  --new-enc-key <key>     Base64 32-byte new key.
  --old-hmac-key <key>    Base64 32-byte key currently used for HMAC-SHA-256.
  --new-hmac-key <key>    Base64 32-byte new key.
  --dry-run               Validate inputs + report row counts; do NOT write.
  --worker <path>         Path to the worker (default: ./rotate-field-keys.ts).
  --backup <path>         Path to a SQL dump; rows not in the dump won't be touched.
  --help                  Show this help.

Example:
  bash scripts/rotate-field-keys.sh \\
    --old-enc-key "abc..." --new-enc-key "xyz..." \\
    --old-hmac-key "def..." --new-hmac-key "uvw..." \\
    --backup /var/backups/medsysve/medsysve-pre-rotate-2026-07-07.sql.gz
EOF
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --old-enc-key)   OLD_ENC_KEY="$2"; shift 2 ;;
    --new-enc-key)   NEW_ENC_KEY="$2"; shift 2 ;;
    --old-hmac-key)  OLD_HMAC_KEY="$2"; shift 2 ;;
    --new-hmac-key)  NEW_HMAC_KEY="$2"; shift 2 ;;
    --dry-run)       DRY_RUN=1; shift ;;
    --worker)        WORKER_PATH="$2"; shift 2 ;;
    --backup)        BACKUP_PATH="$2"; shift 2 ;;
    --help)          usage; exit 0 ;;
    *)               echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

# Default worker path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_PATH="${WORKER_PATH:-${SCRIPT_DIR}/rotate-field-keys.ts}"

# ---------------------------------------------------------------------------
# Validate inputs
# ---------------------------------------------------------------------------

if [[ -z "${OLD_ENC_KEY:-}" || -z "${NEW_ENC_KEY:-}" || -z "${OLD_HMAC_KEY:-}" || -z "${NEW_HMAC_KEY:-}" ]]; then
  echo "ERROR: all four key args are required." >&2
  usage
  exit 2
fi

for k_var in OLD_ENC_KEY NEW_ENC_KEY OLD_HMAC_KEY NEW_HMAC_KEY; do
  k_val="${!k_var}"
  decoded_len=$(echo -n "$k_val" | base64 -d 2>/dev/null | wc -c || echo 0)
  if [[ "$decoded_len" != "32" ]]; then
    echo "ERROR: $k_var must decode to 32 bytes (got $decoded_len)." >&2
    exit 2
  fi
done

if [[ ! -f "$WORKER_PATH" ]]; then
  echo "ERROR: worker not found at $WORKER_PATH" >&2
  exit 2
fi

if [[ -n "$BACKUP_PATH" && ! -f "$BACKUP_PATH" ]]; then
  echo "ERROR: backup not found at $BACKUP_PATH" >&2
  exit 2
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: 'node' not found in PATH." >&2
  exit 2
fi

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

echo "=== MedSysVE field-key rotation ==="
echo "  dry-run:       $DRY_RUN"
echo "  worker:        $WORKER_PATH"
echo "  backup:        ${BACKUP_PATH:-<none — operating on live DB>}"
echo "  enc key:       old → new ($(echo -n "$OLD_ENC_KEY" | base64 -d | wc -c) bytes each)"
echo "  hmac key:      old → new"
echo

# The worker reads from the live DB. We pass the keys via env so the
# process can use lib/field-crypto.ts's getKey() helpers.
exec env \
  FIELD_ENCRYPTION_KEY="$OLD_ENC_KEY" \
  FIELD_HMAC_KEY="$OLD_HMAC_KEY" \
  ROTATE_FIELD_ENCRYPTION_KEY="$NEW_ENC_KEY" \
  ROTATE_FIELD_HMAC_KEY="$NEW_HMAC_KEY" \
  ROTATE_DRY_RUN="$DRY_RUN" \
  ROTATE_BACKUP_PATH="$BACKUP_PATH" \
  node --no-warnings -r tsx/cjs "$WORKER_PATH"
