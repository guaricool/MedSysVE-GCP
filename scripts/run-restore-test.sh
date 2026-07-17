#!/bin/bash
rm -f /tmp/restore-test.log /tmp/restore-pg.log
bash /tmp/restore-test.sh > /tmp/restore-test.log 2>&1
EXIT=$?
echo "---EXIT CODE: $EXIT"
echo ""
echo "=== Full log ==="
cat /tmp/restore-test.log