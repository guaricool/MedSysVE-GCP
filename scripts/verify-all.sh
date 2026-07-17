#!/bin/bash
echo "=== /login en container local (con follow) ==="
docker exec hze8mocuh4xqskqwrm3mx50b-184117868538 sh -c 'curl -sL -o /dev/null -w "HTTP %{http_code} URL %{url_effective} después de %{num_redirects} redirects\n" http://localhost:3000/login'

echo ""
echo "=== /legal/terminos en container local ==="
docker exec hze8mocuh4xqskqwrm3mx50b-184117868538 sh -c 'curl -sL -o /dev/null -w "HTTP %{http_code} URL %{url_effective} después de %{num_redirects} redirects\n" http://localhost:3000/legal/terminos'

echo ""
echo "=== Content sanity: /legal contiene Yoguitech ==="
COUNT=$(docker exec hze8mocuh4xqskqwrm3mx50b-184117868538 sh -c 'curl -sL http://localhost:3000/legal | grep -c Yoguitech')
echo "Yoguitech aparece $COUNT veces en /legal"

echo ""
echo "=== Container status ==="
docker ps --format '{{.Names}} {{.Status}}' | grep hze8mocuh4xqskqwrm3mx50b-184117868538

echo ""
echo "=== DB sanity: count new tables ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -t -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('LegalVersion','ConsentAcceptance','DataExportRequest','DataDeletionRequest','BreachIncident') ORDER BY tablename;"

echo ""
echo "=== Migration status final ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c \
  "SELECT migration_name, started_at, finished_at IS NOT NULL AS applied FROM _prisma_migrations ORDER BY started_at DESC LIMIT 3;"