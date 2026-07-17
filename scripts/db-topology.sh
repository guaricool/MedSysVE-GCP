#!/bin/bash
echo "=========================================="
echo "  TOPOLOGÍA DE DATABASES EN TU VPS"
echo "=========================================="

echo ""
echo "=== 1. TODOS los contenedores con 'postgres' en el nombre ==="
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}' | grep -iE 'postgres|supabase-db' || echo "(ninguno)"

echo ""
echo "=== 2. Volumes de Postgres (dónde se guardan los datos en disco) ==="
docker volume ls --format 'table {{.Name}}\t{{.Driver}}' | grep -iE 'postgres|pgdata|supabase' || echo "(ninguno)"

echo ""
echo "=== 3. Tamaño de cada DB en disco (lo que ocupa realmente) ==="
for vol in $(docker volume ls -q | grep -iE 'postgres|pgdata'); do
  size=$(docker system df -v --format '{{.Size}}' 2>/dev/null | grep "$vol" | awk '{print $1}')
  echo "  Volume $vol: ${size:-<unknown>}"
done

echo ""
echo "=== 4. Stats de la DB de MedSysVE (tablas + conteos) ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c "
SELECT
  schemaname,
  COUNT(*) AS num_tables,
  pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename))) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;"

echo ""
echo "=== 5. Conteos por tabla principal de MedSysVE ==="
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -c "
SELECT 'Doctor' AS tabla, COUNT(*) AS registros FROM \"Doctor\"
UNION ALL SELECT 'Patient', COUNT(*) FROM \"Patient\"
UNION ALL SELECT 'Encounter', COUNT(*) FROM \"Encounter\"
UNION ALL SELECT 'Prescription', COUNT(*) FROM \"Prescription\"
UNION ALL SELECT 'Appointment', COUNT(*) FROM \"Appointment\"
UNION ALL SELECT 'Invoice', COUNT(*) FROM \"Invoice\"
UNION ALL SELECT 'AuditEvent', COUNT(*) FROM \"AuditEvent\"
UNION ALL SELECT 'LegalVersion', COUNT(*) FROM \"LegalVersion\"
UNION ALL SELECT 'ConsentAcceptance', COUNT(*) FROM \"ConsentAcceptance\"
ORDER BY tabla;"

echo ""
echo "=== 6. Tamaño en disco del volume de MedSysVE ==="
VOL=$(docker inspect tf03dm49her0vco2lprdqbjm --format '{{ range .Mounts }}{{ if eq .Type "volume" }}{{ .Name }}{{ end }}{{ end }}')
echo "Volume montado en tf03dm49her0vco2lprdqbjm: $VOL"
if [ -n "$VOL" ]; then
  docker run --rm -v "$VOL:/data" alpine du -sh /data 2>&1 | tail -1
fi

echo ""
echo "=== 7. ¿Dónde está físicamente el volumen en el VPS? ==="
if [ -n "$VOL" ]; then
  MOUNTPOINT=$(docker volume inspect "$VOL" --format '{{ .Mountpoint }}')
  echo "Mountpoint en el VPS: $MOUNTPOINT"
  ls -la "$MOUNTPOINT" 2>&1 | head -5
fi

echo ""
echo "=== 8. ¿Hay backups automatizados? ==="
echo "--- crontab del usuario actual ---"
crontab -l 2>&1 | head -20
echo "--- systemd timers activos ---"
systemctl list-timers --all 2>&1 | grep -iE 'backup|postgres|pg_dump' | head -5 || echo "(ninguno)"
echo "--- buscando scripts de backup ---"
ls -la /root/*.sh /opt/*backup* /var/backups/ 2>&1 | grep -iE 'backup|postgres|medsysve' | head -10 || echo "(no encontré scripts)"

echo ""
echo "=== 9. Encryption at rest (¿el disco está cifrado?) ==="
df -h / 2>&1 | tail -1
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE 2>&1 | head -10