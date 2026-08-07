#!/usr/bin/env bash
# Safe incremental SEO patch — runs ON the server.
# Does NOT replace data/, media/, .env.local, or wipe the whole app.
# Builds .next on-server so production env + CMS data stay intact.
set -euo pipefail

APP_ROOT="/var/www/liobiz"
PATCH_DIR="/tmp/liobiz-seo-patch-files"
SNAP_DIR="$APP_ROOT/data/pre-seo-patch-$(date +%Y%m%d-%H%M%S)"

echo "=== SAFE SEO PATCH ==="
echo "APP=$APP_ROOT"
echo "SNAPSHOT=$SNAP_DIR"

mkdir -p "$SNAP_DIR"
for f in site-content.json media-center.json liobiz.db; do
  if [ -f "$APP_ROOT/data/$f" ]; then
    cp -a "$APP_ROOT/data/$f" "$SNAP_DIR/"
    echo "BACKED_UP data/$f"
  fi
done
if [ -f "$APP_ROOT/.next/BUILD_ID" ]; then
  cp -a "$APP_ROOT/.next/BUILD_ID" "$SNAP_DIR/BUILD_ID.before"
  echo "BUILD_BEFORE=$(cat "$APP_ROOT/.next/BUILD_ID")"
fi

if [ ! -d "$PATCH_DIR" ]; then
  echo "MISSING_PATCH_DIR: $PATCH_DIR"
  exit 1
fi

echo "=== SYNC PATCH FILES (protected paths skipped) ==="
rsync -a \
  --exclude='data/' \
  --exclude='public/media/' \
  --exclude='public/uploads/' \
  --exclude='public/video/' \
  --exclude='public/videos/' \
  --exclude='.env.local' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='.git/' \
  "$PATCH_DIR/" "$APP_ROOT/"
echo "SYNC_OK"

echo "=== PATCH CMS JSON (creates its own .bak files) ==="
sed -i 's/\r$//' "$APP_ROOT/scripts/strip-cms-inline-styles.mjs" 2>/dev/null || true
sed -i 's/\r$//' "$APP_ROOT/scripts/patch-server-seo.mjs" 2>/dev/null || true
node "$APP_ROOT/scripts/strip-cms-inline-styles.mjs" "$APP_ROOT"
node "$APP_ROOT/scripts/patch-server-seo.mjs" "$APP_ROOT"

echo "=== BUILD ON SERVER (keeps server .env.local + data) ==="
cd "$APP_ROOT"
pnpm install --frozen-lockfile
pnpm build
test -f "$APP_ROOT/.next/BUILD_ID"
echo "BUILD_AFTER=$(cat "$APP_ROOT/.next/BUILD_ID")"

echo "=== RESTART ==="
systemctl restart liobiz
sleep 3
systemctl is-active liobiz
curl -s -o /dev/null -w "local:%{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "public:%{http_code}\n" https://liobiz.com/

echo "SNAPSHOT=$SNAP_DIR"
echo "PATCH_COMPLETE"
