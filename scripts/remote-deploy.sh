#!/usr/bin/env bash
# Safe code-only deploy: updates app code without touching server data/media/db.
set -euo pipefail

APP_ROOT="/var/www/liobiz"
DEPLOY_TAR="/tmp/deploy-full.tar"
NEXT_TAR="/tmp/next-build.tar"
STAGING="$(mktemp -d /tmp/liobiz-staging.XXXXXX)"

cleanup() {
  rm -rf "$STAGING"
}
trap cleanup EXIT

cd "$APP_ROOT"

echo "=== PRE ==="
if [ -d .next ] && [ ! -f .next/BUILD_ID ]; then
  echo "INCOMPLETE_NEXT_FOUND"
  rm -rf .next.broken
  mv .next .next.broken
fi

if [ ! -f "$DEPLOY_TAR" ]; then
  echo "MISSING_DEPLOY_TAR"
  exit 1
fi

echo "=== SAFETY CHECK ==="
if tar -tf "$DEPLOY_TAR" | grep -qE '^(\./)?data/'; then
  echo "ABORT: deploy tar contains data/ — refusing to deploy."
  exit 1
fi
if tar -tf "$DEPLOY_TAR" | grep -qE '^(\./)?\.env\.local$'; then
  echo "ABORT: deploy tar contains .env.local — refusing to deploy."
  exit 1
fi
for blocked in public/media public/uploads public/video public/videos; do
  if tar -tf "$DEPLOY_TAR" | grep -qE "^(\./)?${blocked}/"; then
    echo "ABORT: deploy tar contains ${blocked}/ — refusing to deploy."
    exit 1
  fi
done
echo "SAFETY_OK"

echo "=== BACKUP SNAPSHOT ==="
SNAP_DIR="$APP_ROOT/data/pre-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SNAP_DIR"
for f in media-center.json site-content.json liobiz.db; do
  if [ -f "$APP_ROOT/data/$f" ]; then
    cp "$APP_ROOT/data/$f" "$SNAP_DIR/"
  fi
done
echo "SNAPSHOT=$SNAP_DIR"

echo "=== STAGE SOURCE ==="
tar -xf "$DEPLOY_TAR" -C "$STAGING"
echo "SOURCE_OK"

echo "=== SYNC CODE (protected paths skipped) ==="
rsync -a --delete \
  --exclude='data/' \
  --exclude='public/media/' \
  --exclude='public/uploads/' \
  --exclude='public/video/' \
  --exclude='public/videos/' \
  --exclude='.env.local' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='.git/' \
  "$STAGING/" "$APP_ROOT/"
echo "SYNC_OK"

echo "=== NEXT ==="
rm -rf "$APP_ROOT/.next"
if [ -f "$NEXT_TAR" ]; then
  tar -xf "$NEXT_TAR" -C "$APP_ROOT"
elif [ -f /tmp/liobiz-next.tar ]; then
  tar -xf /tmp/liobiz-next.tar -C "$APP_ROOT"
else
  echo "MISSING_NEXT_TAR"
  exit 1
fi
test -f "$APP_ROOT/.next/BUILD_ID"
echo "NEXT_BUILD_ID=$(cat "$APP_ROOT/.next/BUILD_ID")"

echo "=== INSTALL ==="
pnpm install --frozen-lockfile

echo "=== CLEANUP ==="
rm -f "$DEPLOY_TAR" "$NEXT_TAR" /tmp/liobiz-next.tar /tmp/liobiz-deploy.tar
rm -rf "$APP_ROOT/.next.broken"

chown -R ubuntu24:ubuntu24 \
  "$APP_ROOT/app" \
  "$APP_ROOT/components" \
  "$APP_ROOT/lib" \
  "$APP_ROOT/public" \
  "$APP_ROOT/scripts" \
  "$APP_ROOT/.next" 2>/dev/null || true

echo "=== SSL ==="
sed -i 's/\r$//' scripts/setup-nginx-ssl.sh scripts/install-backup-cron.sh 2>/dev/null || true
bash scripts/setup-nginx-ssl.sh

echo "=== ADMIN ==="
if [ -f data/liobiz.db ]; then
  sed -i 's/\r$//' .env.local 2>/dev/null || true
  set -a
  # shellcheck disable=SC1091
  source .env.local 2>/dev/null || true
  set +a
  node scripts/ensure-admin.mjs data/liobiz.db || true
fi

echo "=== BACKUP CRON ==="
bash scripts/install-backup-cron.sh "$APP_ROOT" || true

echo "=== RESTART ==="
systemctl restart liobiz
sleep 3
systemctl is-active liobiz
curl -s -o /dev/null -w "local:%{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "local443:%{http_code}\n" -k https://127.0.0.1/
curl -s -o /dev/null -w "public:%{http_code}\n" https://liobiz.com/

echo "PROTECTED_DATA_OK"
echo "DEPLOY_COMPLETE"
