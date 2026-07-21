#!/bin/bash
# Paste in VPS provider console (as root) when SSH from outside is flaky.
set -e
export DEBIAN_FRONTEND=noninteractive

WHITELIST="31.171.100.101 83.122.16.3 104.167.24.117 185.184.195.56 31.171.101.171 31.171.101.135 185.183.34.64 127.0.0.1/8 ::1"

echo "=== WHITELIST IPs ==="
echo "$WHITELIST"

mkdir -p /root/.ssh /etc/fail2ban/jail.d /etc/ssh/sshd_config.d
chmod 700 /root/.ssh
grep -q 'liobiz-vps' /root/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDunhEwvRfeX/Zo2im03mv09aLNI2Ph8FTEBqWtbwssj liobiz-vps' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

cat > /etc/ssh/sshd_config.d/00-liobiz-harden.conf << 'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
UseDNS no
GSSAPIAuthentication no
ClientAliveInterval 30
ClientAliveCountMax 3
MaxStartups 20:50:100
EOF

cat > /etc/fail2ban/jail.d/liobiz-whitelist.local << EOF
[sshd]
enabled = true
port = 22
backend = systemd
maxretry = 10
findtime = 10m
bantime = 30m
ignoreip = $WHITELIST
EOF

apt-get update -y
apt-get install -y fail2ban ufw curl git nginx build-essential python3 ca-certificates

for ip in $WHITELIST; do
  fail2ban-client set sshd unbanip "$ip" 2>/dev/null || true
  ufw allow from "$ip" to any port 22 proto tcp 2>/dev/null || true
done
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now fail2ban
systemctl restart fail2ban
sshd -t
systemctl restart ssh

# Node 22 + pnpm 9
if ! node -v 2>/dev/null | grep -q '^v22'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack disable || true
npm i -g pnpm@9

mkdir -p /var/www/liobiz/data /var/www/liobiz/public/uploads

cat > /etc/systemd/system/liobiz.service << 'EOF'
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
EOF

cat > /etc/nginx/sites-available/liobiz << 'EOF'
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
    }
}
EOF
ln -sfn /etc/nginx/sites-available/liobiz /etc/nginx/sites-enabled/liobiz
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx liobiz
systemctl restart nginx
systemctl daemon-reload

if [ -f /tmp/deploy-full.tar ] && [ -f /tmp/next-build.tar ]; then
  cd /var/www/liobiz
  tar -xf /tmp/deploy-full.tar
  rm -rf .next
  tar -xf /tmp/next-build.tar
  test -f .next/BUILD_ID
  if [ ! -f .env.local ]; then
    cat > .env.local << 'ENVEOF'
AUTH_SECRET=liobiz-prod-change-me-please-32chars
ADMIN_EMAIL=admin@liobiz.com
ADMIN_PASSWORD=Admin@12345
ENVEOF
  fi
  pnpm install --prod --frozen-lockfile || pnpm install --prod
  systemctl restart liobiz
  sleep 4
else
  echo "TAR files missing in /tmp — upload deploy-full.tar and next-build.tar first"
fi

echo "=== STATUS ==="
node -v
pnpm -v
systemctl is-active ssh nginx liobiz
fail2ban-client status sshd | head -20 || true
curl -s -o /dev/null -w "local3000:%{http_code}\n" http://127.0.0.1:3000/ || true
curl -s -o /dev/null -w "http80:%{http_code}\n" http://127.0.0.1/ || true
echo DONE
