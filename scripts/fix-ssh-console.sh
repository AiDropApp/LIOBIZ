#!/bin/bash
# Run this from VPS web console (KVM) if SSH port 22 is unreachable after bootstrap.
set -euo pipefail

echo "=== Fix SSH + UFW ==="
ufw allow 22/tcp comment 'SSH open' || true
ufw allow from 89.44.197.194 to any port 22 proto tcp comment 'SSH client' || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true
fail2ban-client set sshd unbanip 89.44.197.194 2>/dev/null || true
systemctl restart ssh
ufw status numbered
ss -tlnp | grep ':22' || true
echo FIX_DONE
