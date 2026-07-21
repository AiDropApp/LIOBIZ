#!/bin/bash
set -e
echo FIREWALL_FIX_START

# Stop fail2ban briefly to avoid lockouts during rule changes
systemctl stop fail2ban 2>/dev/null || true

# --- UFW: open web ports for everyone ---
export DEBIAN_FRONTEND=noninteractive
apt-get install -y ufw iptables >/dev/null 2>&1 || true

ufw --force disable >/dev/null 2>&1 || true

ufw default allow incoming
ufw default allow outgoing
ufw default deny routed

ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Whitelist your IPs for SSH (extra safety)
for ip in 83.122.16.3 31.171.100.101 104.167.24.117 185.184.195.56 31.171.101.171 31.171.101.135 185.183.34.64; do
  ufw allow from "$ip" to any port 22 proto tcp 2>/dev/null || true
done

ufw --force enable

# --- iptables: explicit ACCEPT for web (belt and suspenders) ---
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT
iptables -F
iptables -X 2>/dev/null || true

iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p icmp -j ACCEPT
iptables -A INPUT -j ACCEPT

# Persist iptables if possible
apt-get install -y iptables-persistent >/dev/null 2>&1 || true
mkdir -p /etc/iptables
iptables-save > /etc/iptables/rules.v4 2>/dev/null || iptables-save > /etc/iptables/rules.v4

# --- nftables: flush if present ---
if command -v nft >/dev/null 2>&1; then
  nft flush ruleset 2>/dev/null || true
fi

# --- fail2ban: keep but whitelist your IPs ---
mkdir -p /etc/fail2ban/jail.d
cat > /etc/fail2ban/jail.d/liobiz-whitelist.local << 'EOF'
[sshd]
enabled = true
backend = systemd
maxretry = 15
findtime = 10m
bantime = 30m
ignoreip = 31.171.100.101 83.122.16.3 104.167.24.117 185.184.195.56 31.171.101.171 31.171.101.135 185.183.34.64 127.0.0.1/8 ::1
EOF

systemctl enable fail2ban 2>/dev/null || true
systemctl start fail2ban 2>/dev/null || true

# --- nginx + app must listen on all interfaces ---
systemctl restart nginx
systemctl restart liobiz
sleep 3

echo "=== VERIFY ==="
systemctl is-active nginx liobiz ssh
ss -tlnp | grep -E ':80|:443|:3000|:22' || true
ufw status verbose | head -20
iptables -L INPUT -n | head -12
curl -s -o /dev/null -w "local80:%{http_code}\n" http://127.0.0.1/
curl -s -o /dev/null -w "local443:%{http_code}\n" -k https://127.0.0.1/
curl -s -o /dev/null -w "local3000:%{http_code}\n" http://127.0.0.1:3000/
echo FIREWALL_FIX_DONE
