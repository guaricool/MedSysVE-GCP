#!/bin/bash
echo "=== Keys in rclone.conf (no values) ==="
grep -oE '^[^ =]+' /root/.config/rclone/rclone.conf | sort -u

echo ""
echo "=== Has token? (keys only) ==="
grep -E 'token_type|access_token|refresh_token' /root/.config/rclone/rclone.conf | cut -d= -f1 | sort -u

echo ""
echo "=== Test list Drive root ==="
rclone lsd gdrive-medsysve: 2>&1 | head -10