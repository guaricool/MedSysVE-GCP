#!/bin/bash
echo "=== Follow redirect on /legal/terminos/ ==="
curl -k -s -I https://medsysve.13.140.181.29.sslip.io/legal/terminos/ | head -10

echo ""
echo "=== With -L follow ==="
curl -k -sL -o /dev/null -w 'Final: HTTP %{http_code} URL %{url_effective} after %{num_redirects} redirects\n' https://medsysve.13.140.181.29.sslip.io/legal/terminos/

echo ""
echo "=== /legal/ (with slash) ==="
curl -k -s -I https://medsysve.13.140.181.29.sslip.io/legal/ | head -10

echo ""
echo "=== /legal (no slash) body grep ==="
curl -k -s https://medsysve.13.140.181.29.sslip.io/legal | grep -oE '(href="/legal/[^"]+|T.rminos y Condiciones|Pol.tica de Privacidad|Yoguitech)' | head -10

echo ""
echo "=== Health check from VPS to app container ==="
docker exec hze8mocuh4xqskqwrm3mx50b-184117868538 curl -s -o /dev/null -w 'Local healthcheck: HTTP %{http_code}\n' http://localhost:3000/login

echo ""
echo "=== App container processes ==="
docker exec hze8mocuh4xqskqwrm3mx50b-184117868538 ps aux 2>&1 | grep -E 'node|prisma' | head -5