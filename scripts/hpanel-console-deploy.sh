#!/bin/bash
# Paste in Hostinger hPanel → VPS → Terminal (Browser SSH) when port 22 is blocked from outside.
# Fixes OS firewall + opens SSH, then deploys Liobiz from GitHub.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

CLIENT_IP="${1:-89.44.197.194}"
REPO="${LIOBIZ_REPO:-https://github.com/AiDropApp/LIOBIZ.git}"
BRANCH="${LIOBIZ_BRANCH:-main}"

echo "=== 1. FIREWALL (UFW) ==="
apt-get install -y ufw fail2ban curl git nginx build-essential python3 ca-certificates openssl >/dev/null 2>&1 || true

# SSH must stay open — global + client IP
ufw --force disable >/dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow from "$CLIENT_IP" to any port 22 proto tcp comment 'SSH client' 2>/dev/null || true
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
fail2ban-client set sshd unbanip "$CLIENT_IP" 2>/dev/null || true
systemctl restart ssh 2>/dev/null || true
echo "UFW:"
ufw status numbered | head -12

echo "=== 2. NODE 22 + PNPM ==="
if ! node -v 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack disable 2>/dev/null || true
npm i -g pnpm@9
NODEBIN=$(command -v node)
echo "node=$($NODEBIN -v) pnpm=$(pnpm -v)"

echo "=== 3. APP ==="
mkdir -p /var/www/liobiz
if [ ! -d /var/www/liobiz/.git ]; then
  rm -rf /var/www/liobiz/*
  git clone --depth 1 -b "$BRANCH" "$REPO" /var/www/liobiz
else
  cd /var/www/liobiz
  git fetch origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi
cd /var/www/liobiz
mkdir -p data public/uploads

if [ ! -f .env.local ]; then
  SECRET=$(openssl rand -hex 24)
  cat > .env.local << EOF
NEXT_PUBLIC_SITE_URL=https://liobiz.com
AUTH_SECRET=${SECRET}
ADMIN_EMAIL=admin@liobiz.com
ADMIN_PASSWORD=Admin@12345
ADMIN_NAME=مدیر لیوبیز
PORT=3000
EOF
  echo "Created .env.local — add FILESIR_ACCESS_TOKEN manually later."
fi

pnpm install --frozen-lockfile
pnpm build

cat > /etc/systemd/system/liobiz.service << EOF
[Unit]
Description=Liobiz Next.js App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/liobiz
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=-/var/www/liobiz/.env.local
ExecStart=${NODEBIN} /var/www/liobiz/node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

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
    }
}
NGXEOF

ln -sfn /etc/nginx/sites-available/liobiz /etc/nginx/sites-enabled/liobiz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx liobiz
systemctl daemon-reload
systemctl restart nginx

if [ -f data/liobiz.db ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
  node scripts/ensure-admin.mjs data/liobiz.db || true
else
  pnpm db:seed 2>/dev/null || true
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
  node scripts/ensure-admin.mjs data/liobiz.db || true
fi

systemctl restart liobiz
sleep 4

echo "=== 4. VERIFY ==="
systemctl is-active ssh nginx liobiz
ss -tlnp | grep -E ':22|:80|:443|:3000' || true
curl -s -o /dev/null -w "local3000:%{http_code}\n" http://127.0.0.1:3000/ || true
curl -s -o /dev/null -w "http80:%{http_code}\n" http://127.0.0.1/ || true
echo "HPANEL_DEPLOY_DONE"
