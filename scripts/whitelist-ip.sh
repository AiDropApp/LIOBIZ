#!/bin/bash
set -e
IP="31.171.100.101"
echo "Whitelisting $IP"
JAIL=/etc/fail2ban/jail.d/liobiz-whitelist.local
mkdir -p /etc/fail2ban/jail.d
if [ -f "$JAIL" ] && grep -q "$IP" "$JAIL"; then
  echo "Already in fail2ban config"
else
  if [ -f "$JAIL" ]; then
    sed -i "s/^ignoreip = /ignoreip = $IP /" "$JAIL"
  else
    cat > "$JAIL" << EOF
[sshd]
enabled = true
backend = systemd
maxretry = 10
findtime = 10m
bantime = 30m
ignoreip = $IP 83.122.16.3 104.167.24.117 185.184.195.56 31.171.101.171 31.171.101.135 185.183.34.64 127.0.0.1/8 ::1
EOF
  fi
  echo "Updated fail2ban config"
fi
fail2ban-client set sshd unbanip "$IP" 2>/dev/null || true
systemctl restart fail2ban 2>/dev/null || true
ufw allow from "$IP" to any port 22 proto tcp 2>/dev/null || true
ufw allow from "$IP" to any port 2222 proto tcp 2>/dev/null || true
grep ignoreip "$JAIL"
echo "WHITELIST_OK $IP"
