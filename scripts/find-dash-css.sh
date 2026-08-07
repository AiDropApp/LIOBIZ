#!/usr/bin/env bash
for f in /var/www/liobiz/.next/static/css/*.css; do
  c=$(grep -c 'dash-page' "$f" 2>/dev/null)
  if [ "$c" != "0" ]; then
    echo "$f : $c"
  fi
done
echo "---z-index fix check---"
grep -l 'z-index:130\|z-index:140' /var/www/liobiz/.next/static/css/*.css 2>/dev/null
