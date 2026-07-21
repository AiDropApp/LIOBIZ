#!/bin/bash
# Full remote deploy after tarballs uploaded to /tmp/
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

WHITELIST="83.122.16.3 31.171.100.101 104.167.24.117 185.184.195.56 31.171.101.171 31.171.101.135 185.183.34.64 127.0.0.1/8 ::1"
PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDunhEwvRfeX/Zo2im03mv09aLNI2Ph8FTEBqWtbwssj liobiz-vps'

echo "=== STEP 1: SSH + FIREWALL ==="
mkdir -p /root/.ssh /etc/ssh/sshd_config.d /etc/fail2ban/jail.d
chmod 700 /root/.ssh
grep -q 'liobiz-vps' /root/.ssh/authorized_keys 2>/dev/null || echo "$PUBKEY" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

apt-get update -y >/tmp/apt-update.log 2>&1
apt-get install -y fail2ban ufw curl git nginx build-essential python3 ca-certificates >/tmp/apt-install.log 2>&1

cat > /etc/fail2ban/jail.d/liobiz-whitelist.local << EOF
[sshd]
enabled = true
port = 22
backend = systemd
maxretry = 15
findtime = 15m
bantime = 1h
ignoreip = $WHITELIST
EOF

ufw --force disable >/dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
for ip in $WHITELIST; do
  case "$ip" in 127.0.0.1/8|::1) continue ;; esac
  ufw allow from "$ip" to any port 22 proto tcp 2>/dev/null || true
done
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban || true
for ip in $WHITELIST; do
  case "$ip" in 127.0.0.1/8|::1) continue ;; esac
  fail2ban-client set sshd unbanip "$ip" 2>/dev/null || true
done

cat > /etc/ssh/sshd_config.d/00-liobiz.conf << 'SSHEOF'
Port 22
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
UseDNS no
GSSAPIAuthentication no
TCPKeepAlive yes
ClientAliveInterval 60
ClientAliveCountMax 10
MaxStartups 30:50:100
LoginGraceTime 120
SSHEOF
sshd -t
systemctl restart ssh

echo "=== STEP 2: NODE 22 + PNPM ==="
if ! node -v 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack disable 2>/dev/null || true
npm i -g pnpm@9
NODEBIN=$(command -v node)
echo "node=$($NODEBIN -v) pnpm=$(pnpm -v)"

echo "=== STEP 3: SYSTEMD + NGINX ==="
mkdir -p /var/www/liobiz/data /var/www/liobiz/public/uploads
cat > /etc/systemd/system/liobiz.service << SVCEOF
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
ExecStart=$NODEBIN /var/www/liobiz/node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

cat > /etc/nginx/sites-available/liobiz << 'NGXEOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name liobiz.com www.liobiz.com _;
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
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
    }
}
NGXEOF
ln -sfn /etc/nginx/sites-available/liobiz /etc/nginx/sites-enabled/liobiz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx liobiz
systemctl restart nginx

echo "=== STEP 4: DEPLOY APP ==="
test -f /tmp/deploy-full.tar
test -f /tmp/next-build.tar
cd /var/www/liobiz
tar -xf /tmp/deploy-full.tar
rm -rf .next
tar -xf /tmp/next-build.tar
test -f .next/BUILD_ID
echo "BUILD_ID=$(cat .next/BUILD_ID)"
if [ ! -f .env.local ]; then
  cat > .env.local << 'ENVEOF'
AUTH_SECRET=liobiz-prod-change-me-please-32chars
ADMIN_EMAIL=admin@liobiz.com
ADMIN_PASSWORD=Admin@12345
ENVEOF
fi
pnpm install --prod --frozen-lockfile || pnpm install --prod
systemctl daemon-reload
systemctl restart liobiz
sleep 6

echo "=== STEP 5: VERIFY ==="
systemctl is-active ssh nginx liobiz fail2ban
ss -tlnp | grep -E ':22|:80|:3000' || true
curl -s -o /dev/null -w "local3000:%{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "http80:%{http_code}\n" http://127.0.0.1/
journalctl -u liobiz -n 15 --no-pager || true
echo ALL_DONE
