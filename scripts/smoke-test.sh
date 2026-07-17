#!/bin/bash
echo "=== Login page (smoke test) ==="
curl -k -s -o /dev/null -w 'HTTP %{http_code} en %{time_total}s\n' https://medsysve.13.140.181.29.sslip.io/login

echo ""
echo "=== Public legal pages (no auth required) ==="
for p in /legal /legal/terminos /legal/privacidad /legal/cookies /legal/lopdp-consentimiento; do
  code=$(curl -k -s -o /dev/null -w '%{http_code}' https://medsysve.13.140.181.29.sslip.io$p)
  echo "$p -> HTTP $code"
done

echo ""
echo "=== Yoguitech.LLC visible on /login? ==="
curl -k -s https://medsysve.13.140.181.29.sslip.io/login | grep -oE 'Yoguitech[^<]*' | head -3