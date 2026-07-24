#!/bin/bash
# Bootstrap fresh Liobiz VPS — Node 22, pnpm, nginx, systemd, firewall
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

CLIENT_IP="${1:-89.44.197.194}"
WHITELIST="$CLIENT_IP 127.0.0.1/8 ::1"

echo "=== LIOBIZ BOOTSTRAP ==="
echo "Client IP whitelist for SSH: $CLIENT_IP"

mkdir -p /root/.ssh /etc/ssh/sshd_config.d /etc/fail2ban/jail.d
chmod 700 /root/.ssh
grep -q 'liobiz-vps' /root/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDunhEwvRfeX/Zo2im03mv09aLNI2Ph8FTEBqWtbwssj liobiz-vps' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

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

apt-get update -y
apt-get install -y fail2ban ufw curl git nginx build-essential python3 ca-certificates openssl

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
ufw allow 22/tcp comment 'SSH'
ufw allow from "$CLIENT_IP" to any port 22 proto tcp comment "SSH client"
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

systemctl enable --now fail2ban
systemctl restart fail2ban
fail2ban-client set sshd unbanip "$CLIENT_IP" 2>/dev/null || true

sshd -t
systemctl restart ssh

if ! node -v 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack disable 2>/dev/null || true
npm i -g pnpm@9

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
systemctl daemon-reload
systemctl restart nginx

echo "node=$(node -v) pnpm=$(pnpm -v)"
systemctl is-active ssh nginx fail2ban
echo BOOTSTRAP_DONE
