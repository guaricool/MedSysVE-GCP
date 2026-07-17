#!/bin/bash
echo "=== 1. Proveedor cloud (via metadata) ==="
TOKEN=$(curl -s -m 3 -H "X-aws-ec2-metadata-token: $(curl -s -m 3 -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' 2>/dev/null)" http://169.254.169.254/latest/meta-data/ 2>/dev/null)
if [ -n "$TOKEN" ]; then
  echo "AWS EC2/Lightsail detectado."
  echo "Instance ID: $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)"
  echo "Region: $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)"
  echo "AZ: $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)"
  echo "Public hostname: $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-hostname)"
  echo ""
  echo "Block devices (cifrado at-rest a nivel EBS):"
  for blk in $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/block-device-mapping/ 2>/dev/null | grep -v "^$"); do
    DEV=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/block-device-mapping/$blk")
    echo "  $blk -> $DEV"
  done
else
  echo "No parece ser AWS Lightsail/EC2 (o IMDSv2 deshabilitado)."
fi

echo ""
echo "=== 2. Filesystem + bloques ==="
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,UUID 2>&1 | head -15

echo ""
echo "=== 3. ¿LUKS en algún lado? ==="
if [ -f /etc/crypttab ]; then
  echo "Contenido de /etc/crypttab:"
  cat /etc/crypttab
fi
dmsetup ls 2>&1 | head -5 || echo "(dmsetup no instalado)"

echo ""
echo "=== 4. ¿fstab tiene disco cifrado? ==="
grep -E "ext4|xfs|crypt" /etc/fstab | head -10

echo ""
echo "=== 5. ¿Cómo se aprovisionó el disco originalmente? (cloud-init / provision) ==="
if [ -f /var/log/cloud-init-output.log ]; then
  echo "cloud-init log size: $(stat -c %s /var/log/cloud-init-output.log) bytes"
  grep -iE "encrypt|cryptsetup|luks" /var/log/cloud-init-output.log 2>/dev/null | head -5 || echo "(sin menciones de encryption)"
fi

echo ""
echo "=== 6. Auditoría rápida: qué hay en plaintext en el volumen Postgres ==="
echo "(la DB en reposo tiene PHI — verificar si está cifrada o no)"
PG_VOL=$(docker inspect tf03dm49her0vco2lprdqbjm --format '{{ range .Mounts }}{{ if eq .Type "volume" }}{{ .Name }}{{ end }}{{ end }}')
echo "PG volume: $PG_VOL"
PG_MOUNT=$(docker volume inspect "$PG_VOL" --format '{{ .Mountpoint }}')
echo "PG mountpoint: $PG_MOUNT"
echo ""
echo "Sample files (solo nombres, no contenido):"
ls "$PG_MOUNT/base/" 2>&1 | head -5
echo ""
echo "¿Hay files con contenido en texto plano? (test: buscar patrones de cédula V-)"
docker exec tf03dm49her0vco2lprdqbjm psql -U medsysve -d medsysve -t -c \
  "SELECT 'HAS PLAINTEXT DATA' WHERE EXISTS (SELECT 1 FROM \"Patient\" WHERE numeroIdentificacion LIKE '%-%' OR LENGTH(numeroIdentificacion) < 50);" 2>&1 | head -3