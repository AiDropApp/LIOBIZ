# راهنمای توسعه و پشتیبانی — Liobiz

این سند برای برنامه‌نویس یا پشتیبان پروژه است: ساختار، جریان داده، نقطه‌های حساس و نحوهٔ اجرا/استقرار.

---

## خلاصهٔ پروژه

**Liobiz** یک وب‌اپ Next.js 15 (RTL / فارسی) است:

| بخش | مسیر | توضیح |
|-----|------|--------|
| لندینگ و صفحات عمومی | `/`, `/about`, `/portfolio`, `/contact`, `/services/*` | محتوا از API عمومی `/api/content` |
| احراز هویت | `/login`, `/register` | کوکی `httpOnly` |
| پنل ادمین | `/admin` | CMS، سفارش‌ها، تیکت، کاربران، **مرکز رسانه**، بک‌آپ |
| داشبورد کاربر | `/dashboard` | سفارش، تیکت، اعلان، پروفایل |

**Stack:** Next.js 15 · React 19 · Tailwind · Framer Motion · Drizzle ORM · better-sqlite3 · Files.ir (MyFile) برای رسانه

---

## ساختار پوشه‌ها

```
app/              صفحات و API (App Router)
components/       UI عمومی + admin/ + dashboard/
lib/              منطق سرور (auth, db, cms, media-center, backup)
data/             دیتابیس SQLite + JSONهای CMS و رسانه
public/           فایل‌های استاتیک + uploads محلی
scripts/          seed، deploy، backup cron
middleware.ts     محافظت /admin و /dashboard
```

---

## داده‌ها — کجا چه چیزی ذخیره می‌شود

| فایل/پوشه | نقش |
|-----------|-----|
| `data/liobiz.db` | کاربران، سفارش‌ها، تیکت‌ها، پیام تماس، اعلان‌ها |
| `data/site-content.json` | متن و تنظیمات CMS (هیرو، درباره، FAQ، پلن‌ها، …) |
| `data/media-center.json` | **متادیتای** کارت‌های رسانه (عنوان، دسته، لینک MyFile) — بدون باینری |
| `data/backups/` | ZIP بک‌آپ + فایل `.meta.json` |
| `public/uploads/` | آپلودهای محلی (تحویل سفارش، برخی تصاویر CMS قدیمی) |

فایل‌های تصویر/ویدیوی **مرکز رسانه** روی **Files.ir** هستند؛ سایت فقط `entryId` و URL را در JSON نگه می‌دارد.

---

## متغیرهای محیطی

از `.env.example` کپی به `.env.local`:

| متغیر | کاربرد |
|-------|--------|
| `NEXT_PUBLIC_SITE_URL` | URL عمومی سایت |
| `FILESIR_ACCESS_TOKEN` | توکن API Files.ir (پیشنهادی — فقط سرور) |
| `FILESIR_EMAIL` / `FILESIR_PASSWORD` | ورود جایگزین اگر توکن نباشد |
| `PORT` | پیش‌فرض `3001` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | ساخت ادمین اول در اولین اجرای DB |

---

## اجرای محلی

```bash
pnpm install
cp .env.example .env.local
# FILESIR_ACCESS_TOKEN را پر کنید
pnpm dev
```

باز کنید: http://localhost:3001

- ادمین: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- اگر `.next` خراب شد: `pnpm dev:clean`

```bash
pnpm build    # قبل از deploy
pnpm test     # vitest
pnpm test:e2e # playwright (اختیاری)
```

---

## احراز هویت

1. **ورود:** `POST /api/auth/login` → کوکی `liobiz_auth` (JSON: userId, email, name, role)
2. **middleware.ts:** `/admin` فقط `role=admin`؛ `/dashboard` برای admin و client
3. **اعتبارسنجی زنده:** `GET /api/auth/me` و `lib/require-session.ts` کاربر blocked/حذف‌شده را از DB چک می‌کنند

کد: `lib/auth.ts`, `lib/auth-session.ts`, `middleware.ts`

---

## محتوای عمومی — چطور لندینگ پر می‌شود

```
مرورگر → GET /api/content
  → readSiteContent()           // data/site-content.json + پیش‌فرضهای کد
  → readPublicSiteContentWithMedia()
      → readMediaCenterStore()  // data/media-center.json
      → applyMediaCenterToSiteContent()  // overlay کارت‌های منتشرشده
```

### قوانین overlay (`lib/media-center/public.ts`)

| بخش سایت | منبع وقتی کارت media-center وجود دارد |
|----------|----------------------------------------|
| `portfolio` + دسته‌ها | کارت‌های `section: portfolio` |
| `backstage` | کارت‌های `section: backstage` (فقط با رسانه معتبر) |
| `creativePartners` | کارت‌های `section: creative-partners` |
| بلاگ | عمدتاً از CMS (`site-content.json`) — تب بلاگ ادمین |

**مهم:** اگر حداقل یک کارت backstage در media-center باشد، آرایهٔ `backstage` CMS **کاملاً جایگزین** می‌شود.

**پشت صحنه روی لندینگ:** `components/Backstage.tsx`
- ردیف ۱: کارت‌های ۱–۱۰
- ردیف ۲: کارت‌های ۱۱–۲۰ (فقط اگر بیش از ۱۰ کارت باشد)
- marquee بی‌نهایت فقط وقتی عرض کارت‌ها از viewport بیشتر باشد؛ در غیر این صورت **یک کپی** از هر کارت (بدون duplicate برای loop)

---

## مرکز رسانه (Admin → رسانه)

### بخش‌ها

`portfolio` · `backstage` · `creative-partners` · `blog`

### جریان کار

1. **Bootstrap:** `POST /api/admin/media/bootstrap` — پوشهٔ Liobiz و زیرپوشه‌های section روی MyFile
2. **همگام‌سازی:** `POST /api/admin/media/discover` — درخت پوشه ↔ دسته‌ها؛ حذف orphan
3. **آپلود:** drawer ادمین → MyFile → ساخت/ویرایش کارت در `media-center.json`
4. **انتشار:** فقط `published: true` روی لندینگ دیده می‌شود

### APIهای اصلی

| مسیر | کار |
|------|-----|
| `/api/admin/media/cards` | CRUD کارت |
| `/api/admin/media/categories` | CRUD دسته (+ حذف پوشه MyFile) |
| `/api/admin/media/entries` | مرور کتابخانه |
| `/api/admin/media/upload` | آپلود به MyFile |
| `/api/media/filesir/[entryId]` | سرو عمومی فایل (فقط entryهای منتشرشده) |

### همگام‌سازی حذف (MyFile ↔ سایت)

- حذف فایل روی MyFile → prune کارت از JSON (`lib/media-center/sync-prune.ts`)
- حذف کارت/دسته از ادمین → حذف asset از MyFile
- صفحات عمومی هر ~۵ دقیقه یک بار prune سبک اجرا می‌کنند

کد UI: `components/admin/AdminMediaCenter.tsx`, `MediaLibraryBrowser.tsx`

### CMS قدیمی vs مرکز رسانه

تب **مدیریت لندینگ** هنوز زیرتب backstage/portfolio دارد (`AdminEditor.tsx` → `/api/content/manage`). برای **نمونه‌کار، پشت صحنه، همکاران خلاق** از **مرکز رسانه** استفاده کنید؛ وگرنه ممکن است با overlay تداخل ایجاد شود.

---

## پنل ادمین — تب‌ها و API

| تب | APIهای مرتبط |
|----|--------------|
| نمای کلی | `GET /api/admin/overview` |
| مدیریت لندینگ | `GET/PUT /api/content`, `/api/content/cms`, `/api/upload` |
| بلاگ | `/api/content/cms` |
| سفارش‌ها | `/api/orders` |
| تیکت‌ها | `/api/tickets` |
| کاربران | `/api/admin/users` |
| پیام‌ها | `/api/contact` |
| رسانه | `/api/admin/media/*` |
| بک‌آپ | `/api/admin/backup/*` |

---

## بک‌آپ و بازیابی

موتور: `lib/backup.ts` · UI: `AdminBackupPanel.tsx`

**داخل ZIP:** `liobiz.db`, `site-content.json`, `media-center.json` (اگر باشد), `public/uploads/`

**خارج از ZIP:** فایل‌های باینری MyFile — فقط متادیتا backup می‌شود.

- حداکثر ۷ نسخه روی سرور
- قبل از restore، snapshot خودکار `pre-restore-*.zip`
- cron: `pnpm backup:auto` · نصب: `scripts/install-backup-cron.sh`

---

## استقرار روی سرور (VPS)

### پیش‌نیاز

Node 20+, pnpm, nginx (در setup scripts)

### مراحل معمول

```bash
git pull
pnpm install
pnpm build
systemctl restart liobiz   # یا pm2
```

پوشه‌های **writable:** `data/`, `public/uploads/`

### اسکریپت‌های deploy

| اسکریپت | کار |
|---------|-----|
| `scripts/deploy-to-liobiz.ps1` | build + tar + SCP از ویندوز |
| `scripts/fresh-server-setup.sh` | setup اولیه VPS |
| `scripts/remote-deploy.sh` | extract + restart |
| `scripts/run-backup.ts` | بک‌آپ دستی/cron |

مسیر معمول روی سرور: `/var/www/liobiz`

بعد از deploy:
1. `.env.local` روی سرور (توکن Files.ir، رمز ادمین)
2. ادمین → رسانه → **همگام‌سازی**
3. تست لندینگ و `/api/content`

---

## تست‌ها

| فایل | موضوع |
|------|--------|
| `tests/media-center.test.ts` | overlay، دسته‌ها، backstage |
| `tests/backup.test.ts` | ZIP، restore، checksum |
| `tests/e2e/*.spec.ts` | playwright ادمین/رسانه |

---

## نکات عیب‌یابی

| مشکل | بررسی |
|------|--------|
| پشت صحنه کارت تکراری | marquee duplicate — فقط وقتی عرض > viewport؛ یا کارت duplicate در JSON |
| عکس MyFile نمی‌آید | `FILESIR_ACCESS_TOKEN`، bootstrap، `published: true` |
| CMS و media-center conflict | backstage/portfolio را فقط از media-center مدیریت کنید |
| 401 در ادمین | کوکی، role، middleware |
| build fail | dev server را stop کنید، `pnpm dev:clean` |

---

## مخزن GitHub

https://github.com/AiDropApp/LIOBIZ

قبل از push: `.env*` commit نشود، `.next/` و `data/*.db` در gitignore باشند.
