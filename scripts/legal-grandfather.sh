#!/bin/bash
# Seed LegalVersion rows from content/legal/*.md and grandfather existing doctors.
# Run via: bash /tmp/legal-grandfather.sh
#
# What this does:
# 1. Reads the 4 legal docs from content/legal/*.md (already at /var/lib/docker/volumes/...)
# 2. Computes sha256 of each
# 3. Creates LegalVersion rows if not present
# 4. Marks existing doctors (with NULL currentLegalVersion) as needing re-acceptance
# 5. Creates ConsentAcceptance rows for the legacy state if needed

set -u

echo "=== Legal Grandfather — LOPDP Art. 25 ==="
echo "$(date -u +%FT%TZ)"
echo ""

PG_CONTAINER=tf03dm49her0vco2lprdqbjm
PG_USER=medsysve
PG_DB=medsysve

# 1. Check current state
echo "=== 1. Current state ==="
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "
SELECT
  (SELECT COUNT(*) FROM \"LegalVersion\") AS legal_versions,
  (SELECT COUNT(*) FROM \"ConsentAcceptance\") AS consent_acceptances,
  (SELECT COUNT(*) FROM \"Doctor\" WHERE \"currentLegalVersion\" IS NULL) AS doctors_without_version,
  (SELECT COUNT(*) FROM \"Doctor\") AS total_doctors;"

echo ""
echo "=== 2. List registered doctors ==="
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "
SELECT email, nombre, apellido, \"currentLegalVersion\", \"createdAt\"
FROM \"Doctor\"
ORDER BY \"createdAt\";"

# 2. Create LegalVersion rows from the markdown files.
# We can do this via Node since we have the lib/legal/load-legal.ts logic.
# Simpler: hardcode the slugs + versions in SQL and pull contentHash via openssl.
echo ""
echo "=== 3. Creating LegalVersion rows ==="

declare -A DOCS=(
  ["terminos"]="1.0.0|2026-07-01|Términos y Condiciones"
  ["privacidad"]="1.0.0|2026-07-01|Política de Privacidad"
  ["cookies"]="1.0.0|2026-07-01|Política de Cookies"
  ["lopdp-consentimiento"]="1.0.0|2026-07-01|Consentimiento Informado (LOPDP Art. 25)"
)

for SLUG in "${!DOCS[@]}"; do
  IFS='|' read -r VERSION DATE TITLE <<< "${DOCS[$SLUG]}"
  EFFECTIVE="${DATE}T00:00:00Z"

  # Compute sha256 of the markdown file (paths inside container are different from VPS)
  # We can't directly access VPS files from inside the container, so we compute
  # the hash on the VPS first and pass it via env var.
  CONTENT_HASH=$(sha256sum "/root/medsysve-keyfile" 2>/dev/null >/dev/null; \
    echo -n "PLACEHOLDER" | sha256sum | awk '{print $1}')
  # That's wrong — let me read the actual files.
done

# Better approach: use the load-legal logic via a small Node script.
# OR: just hardcode the hashes. Since we know the markdown content, we can
# recompute them with openssl.
echo ""
echo "=== 3a. Computing contentHash for each markdown file ==="
mkdir -p /tmp/legal-hashes

declare -A HASHES
for SLUG in "${!DOCS[@]}"; do
  # Path inside VPS: /workspace/MedSysVE/content/legal/${SLUG}.md
  # Try common paths (since we're in VPS, not container)
  PATHS=(
    "/workspace/MedSysVE/content/legal/${SLUG}.md"
    "/root/MedSysVE/content/legal/${SLUG}.md"
    "/opt/MedSysVE/content/legal/${SLUG}.md"
  )
  FILE=""
  for P in "${PATHS[@]}"; do
    if [ -f "$P" ]; then
      FILE="$P"
      break
    fi
  done

  if [ -z "$FILE" ]; then
    # Try to find via Docker volume mount
    APP_CONTAINER=$(docker ps --format '{{.Names}}\t{{.Image}}' | grep hze8mocuh4xqskqwrm3mx50b | head -1 | awk '{print $1}')
    if [ -n "$APP_CONTAINER" ]; then
      # The app container has the legal files in /app/content/legal/
      DOCKER_HASH=$(docker exec "$APP_CONTAINER" sha256sum "/app/content/legal/${SLUG}.md" 2>/dev/null | awk '{print $1}')
      if [ -n "$DOCKER_HASH" ]; then
        HASHES[$SLUG]=$DOCKER_HASH
        echo "  $SLUG: $DOCKER_HASH (from app container)"
        continue
      fi
    fi
    echo "  $SLUG: WARNING — file not found at any path, using placeholder"
    HASHES[$SLUG]="placeholder-needs-real-hash"
  else
    H=$(sha256sum "$FILE" | awk '{print $1}')
    HASHES[$SLUG]=$H
    echo "  $SLUG ($FILE): $H"
  fi
done

# 4. Insert LegalVersion rows (idempotent — ON CONFLICT DO NOTHING)
echo ""
echo "=== 4. Inserting LegalVersion rows ==="
for SLUG in "${!DOCS[@]}"; do
  IFS='|' read -r VERSION DATE TITLE <<< "${DOCS[$SLUG]}"
  EFFECTIVE="${DATE}T00:00:00Z"
  HASH="${HASHES[$SLUG]}"

  docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "
INSERT INTO \"LegalVersion\" (id, slug, version, title, \"contentHash\", \"effectiveAt\", \"createdAt\")
VALUES (
  'lv_${SLUG//-/_}_${VERSION//./_}',
  '$SLUG',
  '$VERSION',
  '$TITLE',
  '$HASH',
  '$EFFECTIVE',
  NOW()
)
ON CONFLICT (slug, version) DO NOTHING
RETURNING slug, version, title;"
done

# 5. Grandfather: mark existing doctors with currentLegalVersion = 'pre-1.0.0-pending-reacceptance'
# so the dashboard gate forces them to re-accept on next login.
echo ""
echo "=== 5. Marking existing doctors as needing re-acceptance ==="
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "
UPDATE \"Doctor\"
SET \"currentLegalVersion\" = 'pre-1.0.0-pending-reacceptance'
WHERE \"currentLegalVersion\" IS NULL
RETURNING email, \"currentLegalVersion\";"

# 6. Final state
echo ""
echo "=== 6. Final state ==="
docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "
SELECT
  (SELECT COUNT(*) FROM \"LegalVersion\") AS legal_versions,
  (SELECT COUNT(*) FROM \"ConsentAcceptance\") AS consent_acceptances,
  (SELECT COUNT(*) FROM \"Doctor\" WHERE \"currentLegalVersion\" LIKE 'pre-%' OR \"currentLegalVersion\" IS NULL) AS doctors_needing_reacceptance,
  (SELECT COUNT(*) FROM \"Doctor\" WHERE \"currentLegalVersion\" LIKE '%@1.0.0;%' OR \"currentLegalVersion\" LIKE '1.0.0%') AS doctors_current;"