#!/usr/bin/env bash
set -uo pipefail
CONTAINER=hze8mocuh4xqskqwrm3mx50b-154008193618

echo "=== CSS files in container ==="
docker exec "$CONTAINER" ls /app/.next/static/chunks/*.css | head -5

echo
echo "=== HEAD 1a1pvqwrhyrnu.css ==="
docker exec "$CONTAINER" sh -c 'curl -sI https://www.medsysve.com/_next/static/chunks/1a1pvqwrhyrnu.css | head -10'

echo
echo "=== HEAD 045f4dbglm61r.css ==="
docker exec "$CONTAINER" sh -c 'curl -sI https://www.medsysve.com/_next/static/chunks/045f4dbglm61r.css | head -10'

echo
echo "=== Confirming CSS content ==="
docker exec "$CONTAINER" sh -c 'curl -s https://www.medsysve.com/_next/static/chunks/1a1pvqwrhyrnu.css | head -c 200'