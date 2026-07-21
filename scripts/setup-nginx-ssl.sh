#!/bin/bash
# nginx reverse proxy with self-signed TLS for Cloudflare Full mode
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

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
systemctl enable nginx
systemctl restart nginx

ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true

echo "NGINX_SSL_OK"
