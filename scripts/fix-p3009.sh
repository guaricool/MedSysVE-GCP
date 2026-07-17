#!/bin/bash
set -e

echo "=== Inspect _prisma_migrations BEFORE cleanup ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c \
  "SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10;"

echo ""
echo "=== Cleaning the failed legal_compliance migration ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c \
  "DELETE FROM _prisma_migrations WHERE migration_name = '20260625130000_legal_compliance_foundation';"

echo ""
echo "=== Confirm partial state in public schema ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c "\dt" | grep -E "LegalVersion|ConsentAcceptance|DataExport|DataDeletion|BreachIncident|Doctor" || true

echo ""
echo "=== Verify Doctor.currentLegalVersion column state ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c \
  "SELECT column_name FROM information_schema.columns WHERE table_name='Doctor' AND column_name='currentLegalVersion';"

echo ""
echo "=== _prisma_migrations AFTER cleanup ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c \
  "SELECT migration_name, finished_at IS NOT NULL AS applied FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10;"