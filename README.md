# Liobiz

وب‌سایت رسمی و پنل مدیریت **لیوبیز** — آژانس خلاقیت و تبلیغات دیجیتال (RTL / فارسی).

لندینگ، صفحات خدمات، احراز هویت، **پنل ادمین**، **داشبورد کاربر** و **مرکز رسانه** (Files.ir).

---

## اجرای سریع

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

http://localhost:3001

---

## مستندات

**راهنمای کامل توسعه و پشتیبانی:** [`docs/DEVELOPER-GUIDE.md`](docs/DEVELOPER-GUIDE.md)

شامل: ساختار پروژه، CMS vs مرکز رسانه، auth، APIها، بک‌آپ، deploy و عیب‌یابی.

---

## Stack

- Next.js 15 + React 19
- Tailwind CSS + Framer Motion
- Drizzle ORM + SQLite (`data/liobiz.db`)
- Files.ir برای فایل‌های مرکز رسانه

---

## مسیرهای مهم

| مسیر | نقش |
|------|-----|
| `/` | لندینگ |
| `/login` `/register` | ورود / ثبت‌نام |
| `/admin` | پنل ادمین |
| `/dashboard` | پنل کاربر |
| `/portfolio` | نمونه کارها |
| `/contact` | تماس |
