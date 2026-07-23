#!/bin/bash
# nginx HTTPS: Let's Encrypt (Full Strict) with self-signed fallback
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

DOMAIN="${LIOBIZ_DOMAIN:-liobiz.com}"
EMAIL="${LIOBIZ_SSL_EMAIL:-info@liobiz.com}"
LE_CERT="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

write_self_signed_nginx() {
  apt-get install -y openssl >/dev/null 2>&1 || true
  mkdir -p /etc/nginx/ssl
  if [ ! -f /etc/nginx/ssl/liobiz.crt ]; then
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/liobiz.key \
      -out /etc/nginx/ssl/liobiz.crt \
      -subj "/CN=${DOMAIN}" 2>/dev/null
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
}

ensure_letsencrypt() {
  apt-get install -y certbot python3-certbot-nginx >/dev/null 2>&1 || true
  if [ -f "$LE_CERT" ]; then
    certbot renew --quiet --no-random-sleep-on-renew 2>/dev/null || true
    echo "LETSENCRYPT_EXISTS"
    return 0
  fi

  write_self_signed_nginx
  ln -sfn /etc/nginx/sites-available/liobiz /etc/nginx/sites-enabled/liobiz
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl restart nginx

  certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --non-interactive --agree-tos -m "${EMAIL}" --redirect
  echo "LETSENCRYPT_ISSUED"
}

if [ -f "$LE_CERT" ]; then
  echo "Keeping existing Let's Encrypt certificate"
  certbot renew --quiet --no-random-sleep-on-renew 2>/dev/null || true
else
  ensure_letsencrypt || write_self_signed_nginx
fi

ln -sfn /etc/nginx/sites-available/liobiz /etc/nginx/sites-enabled/liobiz 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true

echo "NGINX_SSL_OK"
