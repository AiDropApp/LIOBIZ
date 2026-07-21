#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive
echo FIX522_START

echo "=== BEFORE ==="
systemctl is-active nginx liobiz ssh || true
ss -tlnp | grep -E ':80|:443|:3000' || true
curl -s -o /dev/null -w "local80:%{http_code}\n" http://127.0.0.1/ || true
curl -s -o /dev/null -w "local3000:%{http_code}\n" http://127.0.0.1:3000/ || true

systemctl restart liobiz || true
sleep 3

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/setup-nginx-ssl.sh"

ufw allow 22/tcp || true
ufw --force enable || true

systemctl restart liobiz
sleep 4

echo "=== AFTER ==="
systemctl is-active nginx liobiz
ss -tlnp | grep -E ':80|:443|:3000' || true
curl -s -o /dev/null -w "local80:%{http_code}\n" http://127.0.0.1/
curl -s -o /dev/null -w "local443:%{http_code}\n" -k https://127.0.0.1/
curl -s -o /dev/null -w "local3000:%{http_code}\n" http://127.0.0.1:3000/
journalctl -u liobiz -n 8 --no-pager || true
tail -5 /var/log/nginx/error.log 2>/dev/null || true
ufw status | head -15
echo FIX522_DONE
