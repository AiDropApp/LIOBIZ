Deploy مینیمال — فقط تغییرات SEO + منوی موبایل
================================================

پوشه deploy شامل:
  deploy-changes.tar   (~1 MB)  فقط فایل‌های تغییرکرده (نه کل پروژه)
  next-build.tar       (~270 MB) بیلد Next.js — الزامی
  apply-deploy-changes.sh       اسکript نصب روی سرور
  BUILD_INFO.txt                BUILD_ID و تاریخ

--- مرحله ۱ — ساخت بسته (روی PC، PowerShell) ---

cd d:\liobiz\liobiz
powershell -ExecutionPolicy Bypass -File scripts\prepare-minimal-deploy.ps1

--- مرحله ۲ — آپلود به سرور ---

scp -O deploy\deploy-changes.tar liobiz:/tmp/deploy-changes.tar
scp -O deploy\next-build.tar liobiz:/tmp/next-build.tar
scp -O deploy\apply-deploy-changes.sh liobiz:/tmp/apply-deploy-changes.sh

اگر next-build.tar قطع شد، دوباره همان دستور scp را بزن (resume ندارد؛ از اول).

--- مرحله ۳ — اجرا روی سرور ---

ssh liobiz "sed -i 's/\r$//' /tmp/apply-deploy-changes.sh && bash /tmp/apply-deploy-changes.sh"

--- مرحله ۴ — تایید ---

ssh liobiz "cat /var/www/liobiz/.next/BUILD_ID"
# باید با BUILD_INFO.txt روی PC یکی باشد

curl -I https://liobiz.com/

--- نکات ---

* data/ و media/ و .env.local روی سرور دست نخورده می‌مانند
* روی سرور pnpm build نزن
* deploy-full.tar لازم نیست — فقط همین ۳ فایل
