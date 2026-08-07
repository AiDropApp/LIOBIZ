#!/usr/bin/env bash
# Paste in Hostinger hPanel → VPS → Browser SSH (root) when outside SSH is blocked.
# Whitelists your IP, applies safe SEO patch (data/media/.env preserved), builds on-server.
set -euo pipefail

CLIENT_IP="${1:-159.26.100.229}"
APP_ROOT="/var/www/liobiz"
PATCH_DIR="/tmp/liobiz-seo-patch-files"
WHITELIST="31.171.100.101 83.122.16.3 104.167.24.117 185.184.195.56 31.171.101.171 31.171.101.135 185.183.34.64 127.0.0.1/8 ::1 $CLIENT_IP"

echo "=== 1. WHITELIST SSH ($CLIENT_IP) ==="
mkdir -p /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/liobiz-whitelist.local << EOF
[sshd]
enabled = true
backend = systemd
maxretry = 10
findtime = 10m
bantime = 30m
ignoreip = $WHITELIST
EOF
for ip in $WHITELIST; do
  fail2ban-client set sshd unbanip "$ip" 2>/dev/null || true
  ufw allow from "$ip" to any port 22 proto tcp 2>/dev/null || true
done
systemctl restart fail2ban 2>/dev/null || true
systemctl restart ssh 2>/dev/null || true
echo "WHITELIST_OK"

echo "=== 2. FETCH PATCH FILES ==="
rm -rf "$PATCH_DIR"
mkdir -p "$PATCH_DIR"

# Option A: tarball uploaded to /tmp by agent after SSH opens
if [ -f /tmp/liobiz-seo-patch.tar.gz ]; then
  tar -xzf /tmp/liobiz-seo-patch.tar.gz -C "$PATCH_DIR"
  echo "PATCH_FROM_TAR"
else
  # Option B: pull from git branch (after push)
  BRANCH="${LIOBIZ_PATCH_BRANCH:-seo-patch-safe}"
  REPO="${LIOBIZ_REPO:-https://github.com/AiDropApp/LIOBIZ.git}"
  TMP=/tmp/liobiz-seo-patch-git
  rm -rf "$TMP"
  git clone --depth 1 -b "$BRANCH" "$REPO" "$TMP"
  rsync -a --exclude='data/' --exclude='public/media/' --exclude='.env.local' \
    --exclude='node_modules/' --exclude='.next/' --exclude='.git/' \
    "$TMP/" "$PATCH_DIR/"
  echo "PATCH_FROM_GIT $BRANCH"
fi

echo "=== 3. APPLY SAFE PATCH ==="
bash "$PATCH_DIR/scripts/apply-seo-patch-on-server.sh" 2>/dev/null || \
  bash /tmp/liobiz-seo-patch-files/scripts/apply-seo-patch-on-server.sh

echo "HPANEL_SAFE_SEO_PATCH_DONE"
