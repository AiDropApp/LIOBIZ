set -e
cd /var/www/liobiz

echo "=== PRE ==="
if [ -d .next ] && [ ! -f .next/BUILD_ID ]; then
  echo "INCOMPLETE_NEXT_FOUND"
  rm -rf .next.broken
  mv .next .next.broken
fi

echo "=== SOURCE ==="
tar -xf /tmp/deploy-full.tar
echo SOURCE_OK

echo "=== NEXT ==="
rm -rf .next
if [ -f /tmp/next-build.tar ]; then
  tar -xf /tmp/next-build.tar
elif [ -f /tmp/liobiz-next.tar ]; then
  tar -xf /tmp/liobiz-next.tar
else
  echo "MISSING_NEXT_TAR"
  exit 1
fi
test -f .next/BUILD_ID
echo "NEXT_BUILD_ID=$(cat .next/BUILD_ID)"

echo "=== INSTALL ==="
pnpm install --frozen-lockfile --prod

echo "=== CLEANUP ==="
rm -f /tmp/deploy-full.tar /tmp/next-build.tar /tmp/liobiz-next.tar /tmp/liobiz-deploy.tar
rm -rf .next.broken

chown -R ubuntu24:ubuntu24 \
  /var/www/liobiz/app \
  /var/www/liobiz/components \
  /var/www/liobiz/lib \
  /var/www/liobiz/public \
  /var/www/liobiz/scripts \
  /var/www/liobiz/.next 2>/dev/null || true

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
bash scripts/install-backup-cron.sh /var/www/liobiz || true

echo "=== RESTART ==="
systemctl restart liobiz
sleep 3
systemctl is-active liobiz
curl -s -o /dev/null -w "local:%{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "local443:%{http_code}\n" -k https://127.0.0.1/
curl -s -o /dev/null -w "public:%{http_code}\n" https://liobiz.com/

grep -q "Do NOT pre-encode" lib/auth.ts && echo AUTH_FIX_OK
grep -q 'dir="ltr"' components/Backstage.tsx && echo BACKSTAGE_OK
grep -q "background: #0a0a0a" app/globals.css && echo DARK_PORTFOLIO_OK
test -f components/FAQ.tsx && echo FAQ_OK
test -f public/images/about-liobiz-office.png && echo IMAGE_OK
echo DEPLOY_COMPLETE
