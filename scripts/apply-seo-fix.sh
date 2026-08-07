#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="${1:-/var/www/liobiz}"
TAR="${2:-/tmp/seo-fix.tar}"
cd "$APP_ROOT"
test -f "$TAR"
tar -xf "$TAR" -C "$APP_ROOT"
test -f .next/BUILD_ID
echo "NEXT_BUILD_ID=$(cat .next/BUILD_ID)"
test -f .next/static/chunks/app/page-beabda6df4f3f685.js
test -f .next/static/chunks/webpack-5aa449785f4d8427.js
if [ -f scripts/patch-server-seo.mjs ]; then
  node scripts/patch-server-seo.mjs "$APP_ROOT" || true
fi
systemctl restart liobiz
sleep 2
systemctl is-active liobiz
curl -sL https://liobiz.com/ | grep -q 'name="keywords"' && echo KEYWORDS_OK || echo KEYWORDS_MISSING
curl -sL https://liobiz.com/ | grep -q 'seo-internal-links' && echo INTERNAL_LINKS_OK || echo INTERNAL_LINKS_MISSING
echo SEO_FIX_APPLIED
