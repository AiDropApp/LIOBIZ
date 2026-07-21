#!/bin/bash
# Install nightly auto-backup (03:00) on VPS
set -e
ROOT="${1:-/var/www/liobiz}"
CRON_LINE="0 3 * * * cd $ROOT && /usr/bin/node $ROOT/node_modules/tsx/dist/cli.mjs $ROOT/scripts/run-backup.ts >> /var/log/liobiz-backup.log 2>&1"

if crontab -l 2>/dev/null | grep -q 'run-backup.ts'; then
  echo "Backup cron already installed"
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Installed: $CRON_LINE"
fi

echo "Manual test:"
cd "$ROOT" && pnpm backup:auto
