#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-/var/www/liobiz}"
MARKER='max-width:1023px){.dash-page .dash-shell,.dash-page .dash-main{z-index:auto!important}'
HOTFIX='@media (max-width:1023px){.dash-page .dash-shell,.dash-page .dash-main{z-index:auto!important}.dash-page .dash-sidebar,.dash-page .dash-sidebar.lux-card{position:fixed!important;z-index:130!important;background:var(--liobiz-navy-1)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;outline:none!important;isolation:isolate;mix-blend-mode:normal!important;box-shadow:-6px 0 32px rgba(0,0,0,.5),0 0 0 1px var(--liobiz-border)!important;border:1px solid var(--liobiz-border)!important}.dash-page .dash-sidebar::before,.dash-page .dash-sidebar.lux-card::before{display:none!important;content:none!important}.dash-page .dash-drawer-backdrop{position:fixed!important;z-index:125!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.dash-page .dash-topbar{z-index:140!important}.dash-page .dash-sidebar .dash-nav button{color:var(--liobiz-secondary)!important}.dash-page .dash-sidebar .dash-nav-icon{color:var(--liobiz-muted)!important}.dash-page .dash-sidebar .dash-sidebar-copy h1{color:var(--liobiz-ink)!important}.dash-page .dash-sidebar .dash-sidebar-copy p{color:var(--liobiz-secondary)!important}}'
patched=0
for f in "$ROOT"/.next/static/css/*.css; do
  if grep -q 'dash-page' "$f" 2>/dev/null; then
    if grep -qF "$MARKER" "$f" 2>/dev/null; then
      echo "SKIP (already patched) $f"
      continue
    fi
    BACKUP="${f}.bak-mobile-drawer-$(date -u +%Y-%m-%dT%H-%M-%S)"
    cp "$f" "$BACKUP"
    printf '%s' "$HOTFIX" >> "$f"
    echo "PATCHED $f"
    echo "BACKUP $BACKUP"
    patched=$((patched + 1))
  fi
done
if [ "$patched" -eq 0 ]; then
  echo "NOTE: no new CSS bundles patched (may already be patched)"
fi
systemctl restart liobiz
systemctl is-active liobiz
