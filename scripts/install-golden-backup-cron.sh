#!/usr/bin/env bash
# Install nightly golden backup cron (MyFiles only, 23:30)
set -euo pipefail
CRON_LINE='30 23 * * * cd /var/www/liobiz && /usr/bin/node /var/www/liobiz/node_modules/tsx/dist/cli.mjs /var/www/liobiz/scripts/run-golden-backup.ts >> /var/log/liobiz-golden-backup.log 2>&1'
TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -v 'run-golden-backup.ts' | grep -v '^$' > "$TMP" || true
echo "$CRON_LINE" >> "$TMP"
crontab "$TMP"
rm -f "$TMP"
echo "Installed: $CRON_LINE"
