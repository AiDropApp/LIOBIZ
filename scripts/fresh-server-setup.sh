#!/bin/bash
# Phase 1: SSH hardening + IP whitelist on fresh/rebuilt VPS
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

# Direct IP (no VPN) — update scripts/client-ip-registry.txt when this changes
WHITELIST="31.171.100.101 83.122.16.3 127.0.0.1/8 ::1"

echo "=== LIOBIZ FRESH SERVER SETUP — PHASE 1 (SSH) ==="
echo "Whitelist: $WHITELIST"

echo "=== 1. SSH KEY ==="
mkdir -p /root/.ssh /etc/ssh/sshd_config.d /etc/fail2ban/jail.d
chmod 700 /root/.ssh
grep -q 'liobiz-vps' /root/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDunhEwvRfeX/Zo2im03mv09aLNI2Ph8FTEBqWtbwssj liobiz-vps' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

echo "=== 2. SSH HARDEN (port 22, keepalive) ==="
cat > /etc/ssh/sshd_config.d/00-liobiz.conf << 'SSHEOF'
Port 22
PubkeyAuthentication yes
PasswordAuthentication yes
KbdInteractiveAuthentication no
PermitRootLogin yes
UseDNS no
GSSAPIAuthentication no
TCPKeepAlive yes
ClientAliveInterval 60
ClientAliveCountMax 10
MaxStartups 30:50:100
LoginGraceTime 120
SSHEOF

echo "=== 3. PACKAGES ==="
apt-get update -y >/tmp/apt-update.log 2>&1
apt-get install -y fail2ban ufw curl git nginx build-essential python3 ca-certificates >/tmp/apt-install.log 2>&1

echo "=== 4. FAIL2BAN (whitelist) ==="
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

echo "=== 5. UFW ==="
ufw --force disable >/dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
for ip in $WHITELIST; do
  case "$ip" in
    127.0.0.1/8|::1) continue ;;
  esac
  ufw allow from "$ip" to any port 22 proto tcp comment "SSH whitelist" 2>/dev/null || true
done
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

systemctl enable --now fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban || true
for ip in $WHITELIST; do
  case "$ip" in
    127.0.0.1/8|::1) continue ;;
  esac
  fail2ban-client set sshd unbanip "$ip" 2>/dev/null || true
done

sshd -t
systemctl restart ssh

echo "=== 6. NODE + APP DIRS (prep for deploy) ==="
if ! node -v 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack disable 2>/dev/null || true
npm i -g pnpm@9 >/dev/null 2>&1 || npm i -g pnpm@9
mkdir -p /var/www/liobiz/data /var/www/liobiz/public/uploads

cat > /etc/systemd/system/liobiz.service << 'SVCEOF'
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
ExecStart=/usr/bin/node /var/www/liobiz/node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

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
apt-get install -y openssl >/dev/null 2>&1 || true
mkdir -p /etc/nginx/ssl
if [ ! -f /etc/nginx/ssl/liobiz.crt ]; then
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/liobiz.key \
    -out /etc/nginx/ssl/liobiz.crt \
    -subj "/CN=liobiz.com" 2>/dev/null
fi
ln -sfn /etc/nginx/sites-available/liobiz /etc/nginx/sites-enabled/liobiz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx liobiz >/dev/null 2>&1 || true
systemctl restart nginx || true
systemctl daemon-reload

echo "=== 7. VERIFY ==="
echo "node=$(node -v 2>/dev/null || echo missing) pnpm=$(pnpm -v 2>/dev/null || echo missing)"
systemctl is-active ssh nginx fail2ban
ss -tlnp | grep -E ':22|:80' || true
ufw status numbered | head -15
fail2ban-client status sshd 2>/dev/null | head -12 || true
echo "PHASE1_DONE"
