#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/var/www/liobiz}"
HOTFIX='@media (max-width:1023px){.dash-page .dash-topbar{display:flex!important;align-items:center;gap:.65rem;z-index:120}.dash-page .dash-topbar>.header-logo,.dash-page .dash-topbar-logo{flex:0 1 auto;min-width:0;max-width:38vw}.dash-page .dash-topbar>.header-logo .header-logo-image,.dash-page .dash-topbar-logo .header-logo-image{max-height:36px!important;width:auto!important}.dash-page .dash-topbar-copy{flex:1 1 auto;min-width:0}.dash-page .dash-topbar-copy strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.88rem}.dash-page .dash-menu-btn{display:inline-flex!important;flex:0 0 2.75rem;width:2.75rem;height:2.75rem;margin-inline-start:auto;position:relative;z-index:121;border:1px solid rgba(255,255,255,.35)!important;background:linear-gradient(135deg,rgba(255,77,36,.35),rgba(255,106,0,.22))!important;color:#fff!important;box-shadow:0 4px 16px rgba(0,0,0,.35)!important}}'
patched=0
for f in "$ROOT"/.next/static/css/*.css; do
  if grep -q 'dash-page .dash-menu-btn' "$f" 2>/dev/null || grep -q 'dash-menu-btn' "$f" 2>/dev/null; then
    if grep -q 'max-width:38vw' "$f" 2>/dev/null; then
      echo "SKIP (already patched) $f"
      continue
    fi
    BACKUP="${f}.bak-mobile-menu-$(date -u +%Y-%m-%dT%H-%M-%S)"
    cp "$f" "$BACKUP"
    printf '%s' "$HOTFIX" >> "$f"
    echo "PATCHED $f"
    echo "BACKUP $BACKUP"
    patched=$((patched + 1))
  fi
done
if [ "$patched" -eq 0 ]; then
  echo "ERROR: no CSS bundles patched"
  exit 1
fi
systemctl restart liobiz
systemctl is-active liobiz
