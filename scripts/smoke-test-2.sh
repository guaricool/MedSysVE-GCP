#!/bin/bash
echo "=== Legal pages with trailing slash ==="
for p in /legal /legal/ /legal/terminos/ /legal/privacidad/ /legal/cookies/ /legal/lopdp-consentimiento/; do
  code=$(curl -k -s -o /dev/null -w '%{http_code}' https://medsysve.13.140.181.29.sslip.io$p)
  echo "$p -> HTTP $code"
done

echo ""
echo "=== Yoguitech.LLC search on login page HTML ==="
curl -k -s https://medsysve.13.140.181.29.sslip.io/login | grep -oE '(Yoguitech[^<]{0,40}|operado por[^<]{0,40})' | head -5

echo ""
echo "=== Search in /legal/ index ==="
curl -k -s https://medsysve.13.140.181.29.sslip.io/legal | grep -oE '(Yoguitech[^<]{0,40}|Marco Legal[^<]{0,40}|operado por[^<]{0,40})' | head -5

echo ""
echo "=== Search in /legal/terminos ==="
curl -k -s https://medsysve.13.140.181.29.sslip.io/legal/terminos/ | grep -oE 'Yoguitech[^<]{0,40}' | head -5

echo ""
echo "=== Look for legal doc title in /legal/terminos ==="
curl -k -s https://medsysve.13.140.181.29.sslip.io/legal/terminos/ | grep -oE '(T.rminos y Condiciones|Yoguitech|Aviso Importante)' | head -5