# استقرار لیوبیز روی VPS (۲ هسته / ۴GB رم / ۶۰GB)

## پیش‌نیاز سرور
```bash
sudo apt update
sudo apt install -y curl git build-essential python3
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
corepack enable
corepack prepare pnpm@latest --activate
```

## دیتابیس
پروژه از **SQLite** استفاده می‌کند (`data/liobiz.db`) — برای این VPS بهترین گزینه است:
- بدون نصب Postgres/MySQL
- سبک روی ۴GB رم
- بکاپ = کپی پوشه `data/`

جداول خودکار ساخته می‌شوند:
- users (با blocked)
- contact_messages
- orders / order_files
- tickets / ticket_messages
- notifications

محتوای CMS در `data/site-content.json` ذخیره می‌شود.

## اجرای پروژه
```bash
git clone <repo> && cd liobiz
pnpm install
cp .env.example .env.local
pnpm build
pnpm start
```

ادمین پیش‌فرض:
- ایمیل: `admin@liobiz.com`
- رمز: `Admin@12345`
(حتماً بعد از ورود عوض کنید)

## پوشه‌های مهم برای بکاپ
- `data/` (دیتابیس + محتوای CMS)
- `public/uploads/` (عکس/ویدیو/فایل‌های تحویل)
- `public/videos/` (ویدیوی هیرو)

## PM2 (پیشنهادی)
```bash
npm i -g pm2
pm2 start pnpm --name liobiz -- start
pm2 save
pm2 startup
```

## Nginx (نمونه)
پروکسی به `localhost:3000` + SSL با certbot.
