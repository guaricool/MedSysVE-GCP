#!/bin/bash
echo "=== ¿Qué tiene instalado el VPS? ==="
for cmd in mail sendmail msmtp ssmtp postfix; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "OK   $cmd: $(which $cmd)"
  else
    echo "NO   $cmd: not installed"
  fi
done

echo ""
echo "=== Local mail spool ==="
ls -la /var/mail/ 2>&1 | head -5 || echo "(no /var/mail)"

echo ""
echo "=== Extract Resend API key from MedSysVE container ==="
APP_CONTAINER=$(docker ps --format '{{.Names}}\t{{.Image}}' | grep -E 'hze8mocuh4xqskqwrm3mx50b' | head -1 | awk '{print $1}')
echo "App container: $APP_CONTAINER"
if [ -n "$APP_CONTAINER" ]; then
  RESEND_KEY=$(docker exec "$APP_CONTAINER" sh -c 'echo $RESEND_API_KEY' 2>/dev/null)
  if [ -n "$RESEND_KEY" ]; then
    echo "RESEND_API_KEY presente: YES"
    echo "Primeros 10 chars: ${RESEND_KEY:0:10}..."
  else
    echo "RESEND_API_KEY presente: NO"
  fi
  EMAIL_FROM=$(docker exec "$APP_CONTAINER" sh -c 'echo $EMAIL_FROM' 2>/dev/null)
  echo "EMAIL_FROM: $EMAIL_FROM"
fi