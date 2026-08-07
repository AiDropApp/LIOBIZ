#!/usr/bin/env bash
# Apply minimal deploy: changed source files + pre-built .next (no full repo sync)
set -euo pipefail

APP_ROOT="${1:-/var/www/liobiz}"
CHANGES_TAR="${2:-/tmp/deploy-changes.tar}"
NEXT_TAR="${3:-/tmp/next-build.tar}"

cd "$APP_ROOT"

echo "=== PRE-CHECK ==="
for f in "$CHANGES_TAR" "$NEXT_TAR"; do
  if [ ! -f "$f" ]; then
    echo "MISSING: $f"
    exit 1
  fi
done

if [ -d .next ] && [ ! -f .next/BUILD_ID ]; then
  echo "INCOMPLETE .next — backing up"
  rm -rf .next.broken
  mv .next .next.broken
fi

echo "=== SNAPSHOT (data only) ==="
SNAP="$APP_ROOT/data/pre-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SNAP"
for f in site-content.json media-center.json liobiz.db; do
  [ -f "data/$f" ] && cp "data/$f" "$SNAP/" || true
done
echo "SNAPSHOT=$SNAP"

echo "=== APPLY SOURCE CHANGES ==="
tar -xf "$CHANGES_TAR" -C "$APP_ROOT"
echo "CHANGES_OK"

echo "=== REPLACE .next ==="
rm -rf "$APP_ROOT/.next"
tar -xf "$NEXT_TAR" -C "$APP_ROOT"
test -f "$APP_ROOT/.next/BUILD_ID"
echo "NEXT_BUILD_ID=$(cat "$APP_ROOT/.next/BUILD_ID")"

echo "=== INSTALL (lockfile only) ==="
pnpm install --frozen-lockfile

echo "=== CMS SEO PATCH ==="
if [ -f scripts/patch-server-seo.mjs ]; then
  node scripts/patch-server-seo.mjs "$APP_ROOT" || true
fi

echo "=== RESTART ==="
systemctl restart liobiz
sleep 2
systemctl is-active liobiz
curl -sI http://127.0.0.1:3000/ | head -3

echo "DEPLOY_CHANGES_COMPLETE"
