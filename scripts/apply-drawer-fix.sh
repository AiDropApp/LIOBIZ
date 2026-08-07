#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="${1:-/var/www/liobiz}"
TAR="${2:-/tmp/drawer-fix.tar}"
cd "$APP_ROOT"
test -f "$TAR"
tar -xf "$TAR" -C "$APP_ROOT"
test -f .next/BUILD_ID
echo "NEXT_BUILD_ID=$(cat .next/BUILD_ID)"
grep -q dash-mobile-drawer-sidebar .next/static/css/09c0ffc79e584d86.css
grep -q dash-mobile-drawer-backdrop .next/static/chunks/app/admin/page-6a9f107ab612afb9.js
systemctl restart liobiz
sleep 2
systemctl is-active liobiz
echo "DRAWER_FIX_APPLIED"
