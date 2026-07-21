#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive
echo FIX522_START

echo "=== BEFORE ==="
systemctl is-active nginx liobiz ssh || true
ss -tlnp | grep -E ':80|:443|:3000' || true
curl -s -o /dev/null -w "local80:%{http_code}\n" http://127.0.0.1/ || true
curl -s -o /dev/null -w "local3000:%{http_code}\n" http://127.0.0.1:3000/ || true

# Restart stack if anything down
systemctl restart liobiz || true
sleep 3
systemctl restart nginx || true

# Open HTTP/HTTPS for everyone (Cloudflare needs this)
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 22/tcp || true
# Remove overly restrictive limits if any
ufw --force enable || true

# Self-signed SSL for Cloudflare Full mode (port 443)
apt-get install -y openssl >/dev/null 2>&1 || true
mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/liobiz.crt ]; then
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/liobiz.key \
    -out /etc/nginx/ssl/liobiz.crt \
    -subj "/CN=liobiz.com" 2>/dev/null
fi

cat > /etc/nginx/sites-available/liobiz << 'NGXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name liobiz.com www.liobiz.com _;

    ssl_certificate     /etc/nginx/ssl/liobiz.crt;
    ssl_certificate_key /etc/nginx/ssl/liobiz.key;
    ssl_protocols       TLSv1.2 TLSv1.3;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGXEOF

ln -sfn /etc/nginx/sites-available/liobiz /etc/nginx/sites-enabled/liobiz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx liobiz
systemctl restart nginx
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
