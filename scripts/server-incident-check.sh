#!/bin/bash
set -u
echo "===== BASIC ====="
hostname; date -u; uptime
echo
echo "===== SERVICES ====="
systemctl is-active liobiz nginx ssh 2>/dev/null || true
systemctl status liobiz --no-pager -l | head -60
echo
echo "===== PORTS ====="
ss -tlnp | grep -E ':22|:80|:443|:3000' || true
echo
echo "===== CURL LOCAL ====="
curl -s -o /dev/null -w "3000:%{http_code}\n" --connect-timeout 3 http://127.0.0.1:3000/ || echo 3000:fail
curl -s -o /dev/null -w "80:%{http_code}\n" --connect-timeout 3 http://127.0.0.1/ || echo 80:fail
echo
echo "===== LIOBIZ JOURNAL ====="
journalctl -u liobiz -n 120 --no-pager
echo
echo "===== UNIT FILE ====="
systemctl cat liobiz 2>/dev/null || true
echo
echo "===== BOOT HISTORY ====="
journalctl --list-boots --no-pager | tail -8
echo
echo "===== PREV BOOT ERRORS ====="
journalctl -b -1 -p err --no-pager 2>/dev/null | tail -50 || true
echo
echo "===== CURRENT BOOT ERRORS ====="
journalctl -b 0 -p err --no-pager 2>/dev/null | tail -50 || true
echo
echo "===== NGINX ERROR TAIL ====="
tail -80 /var/log/nginx/error.log 2>/dev/null || true
echo
echo "===== SSH FAILED TOP IPS ====="
grep -hE "Failed password|Invalid user" /var/log/auth.log /var/log/auth.log.* 2>/dev/null \
  | grep -oE "from [0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" \
  | awk '{print $2}' | sort | uniq -c | sort -rn | head -25
echo
echo "===== SSH FAIL COUNTS ====="
echo -n "Failed password: "; grep -h "Failed password" /var/log/auth.log /var/log/auth.log.* 2>/dev/null | wc -l
echo -n "Invalid user: "; grep -h "Invalid user" /var/log/auth.log /var/log/auth.log.* 2>/dev/null | wc -l
echo -n "Accepted logins: "; grep -h "Accepted" /var/log/auth.log /var/log/auth.log.* 2>/dev/null | wc -l
echo
echo "===== ACCEPTED LOGINS ====="
grep -hE "Accepted (password|publickey)" /var/log/auth.log /var/log/auth.log.* 2>/dev/null | tail -40
echo
echo "===== RECENT /var/www/liobiz FILES ====="
find /var/www/liobiz -type f -printf "%TY-%Tm-%Td %TH:%TM %p\n" 2>/dev/null | sort -rn | head -40
echo
echo "===== WORLD WRITABLE / SUID ODDITIES (quick) ====="
find /tmp /var/tmp /dev/shm -type f -mtime -14 -printf "%TY-%Tm-%Td %TH:%TM %p\n" 2>/dev/null | sort -rn | head -40
ls -la /tmp /var/tmp /dev/shm 2>/dev/null | head -60
echo
echo "===== CRON ====="
crontab -l 2>/dev/null || echo no-root-cron
ls /etc/cron.d 2>/dev/null
echo
echo "===== SUSPICIOUS NAMES ====="
find /var/www /tmp /var/tmp /home -type f \( -iname "*shell*" -o -iname "*backdoor*" -o -iname "*cmd*" -o -iname "c99*" -o -iname "r57*" -o -name "*.php" \) 2>/dev/null | head -40
echo
echo "===== LAST DEPLOY / BUILD ====="
ls -la /var/www/liobiz/.next/BUILD_ID /var/www/liobiz/package.json 2>/dev/null
stat /var/www/liobiz/.next/BUILD_ID /var/www/liobiz/package.json 2>/dev/null | sed -n "1,20p"
echo
echo "===== FAIL2BAN ====="
systemctl is-active fail2ban; fail2ban-client status 2>/dev/null || echo no-fail2ban
echo DONE
