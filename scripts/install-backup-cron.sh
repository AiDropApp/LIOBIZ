#!/usr/bin/env bash
# Install nightly auto backup cron (server-only ZIP, once at 23:00)
set -euo pipefail
CRON_LINE='0 23 * * * cd /var/www/liobiz && /usr/bin/node /var/www/liobiz/node_modules/tsx/dist/cli.mjs /var/www/liobiz/scripts/run-backup.ts >> /var/log/liobiz-backup.log 2>&1'
TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v 'run-backup.ts' | grep -v '^$' > "$TMP" || true
echo "$CRON_LINE" >> "$TMP"
crontab "$TMP"
rm -f "$TMP"
echo "Installed: $CRON_LINE"
