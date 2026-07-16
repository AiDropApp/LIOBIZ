# مدیریت لندینگ — سند پیگیری

> آخرین به‌روزرسانی: ۱۴۰۴/۰۴/۲۵  
> هدف: همه بخش‌های لندینگ از **تب «مدیریت لندینگ»** در `/admin` قابل ویرایش باشند.

---

## ساختار داشبورد

```
📋 مدیریت لندینگ  (/admin → تب landing)
├── 🏠 هیرو
├── 📊 آمار هیرو
├── ℹ️ درباره لیوبیز
├── 🛠️ خدمات
├── 🎨 نمونه کارها
├── 🔄 فرایند همکاری
├── 💰 پلن‌ها
├── 📸 بک‌استیج
├── 🎬 Creative Partners
├── ❓ FAQ
├── 💬 نظرات مشتریان
├── 🤝 برندهای همکار
└── 📞 فوتر
```

---

## وضعیت پیاده‌سازی

| بخش | CMS | کامپوننت متصل | ادیتور داشبورد | وضعیت |
|-----|-----|---------------|----------------|--------|
| هیرو | `landing.*` | Hero | ✅ | ✅ انجام شد |
| آمار هیرو | `landing.heroStats[]` | HeroStats | ✅ | ✅ انجام شد |
| درباره | `landing.about*` + تصاویر | AboutLiobiz | ✅ | ✅ انجام شد |
| خدمات | `pages.services[]` + عناوین | Services | ✅ | ✅ انجام شد |
| نمونه کار | `portfolio[]` + عناوین | Portfolio | ✅ | ✅ انجام شد |
| فرایند | `pages.processSteps[]` + عناوین | Process | ✅ | ✅ انجام شد |
| پلن‌ها | `plans[]` | Plans | ✅ | ✅ انجام شد |
| بک‌استیج | `backstage[]` + عناوین + آمار | Backstage | ✅ | ✅ انجام شد |
| Creative Partners | `creativePartners[]` | CreativePartners | ✅ | ✅ انجام شد |
| FAQ | `faq[]` | FAQ | ✅ | ✅ انجام شد |
| Testimonials | `testimonials[]` | Testimonials | ✅ | ✅ انجام شد |
| Partners | `partners[]` | Partners | ✅ | ✅ انجام شد |
| فوتر | `site.*` + `landing.footer*` + لینک‌ها | Footer | ✅ | ✅ انجام شد |

---

## ایرادهای شناسایی‌شده (قبل از CMS)

| # | ایراد | شدت | وضعیت رفع |
|---|--------|-----|-----------|
| 1 | تصاویر `/api/media/*` — پوشه `public/uploads` خالی | 🔴 بالا | ✅ mkdir خودکار + fallback |
| 2 | Unsplash در بک‌استیج — خطای شبکه Next Image | 🟠 متوسط | ✅ unoptimized برای URL خارجی |
| 3 | Services/Process/Plans از constants — CMS نادیده | 🔴 بالا | ✅ وصل به CMS |
| 4 | Creative Partners hardcoded انگلیسی | 🟠 متوسط | ✅ CMS + فارسی‌سازی |
| 5 | FAQ/Testimonials/Partners hardcoded | 🟠 متوسط | ✅ CMS |
| 6 | Footer CTA و لینک‌ها hardcoded | 🟡 پایین | ✅ CMS |
| 7 | Hero Stats hardcoded | 🟡 پایین | ✅ CMS |
| 8 | About تصاویر hardcoded | 🟡 پایین | ✅ CMS |
| 9 | تب‌های پراکنده cms/content در ادمین | 🟡 UX | ✅ یک تب «مدیریت لندینگ» |
| 10 | `/billing/plans` 404 | 🟢 خارجی | ⏳ extension مرورگر — نادیده |
| 11 | تکرار «پنل ادمین» در سایدبار | 🟡 UX | ⏳ DashboardShell |

---

## فایل‌های کلیدی

| فایل | نقش |
|------|-----|
| `data/site-content.json` | ذخیره همه محتوا |
| `lib/content-store.ts` | تایپ‌ها + merge + read/write |
| `lib/cms-defaults.ts` | پیش‌فرض فیلدهای landing |
| `lib/landing-defaults.ts` | پیش‌فرض آرایه‌ها (plans, faq, …) |
| `components/admin/AdminLandingEditor.tsx` | UI مدیریت لندینگ |
| `app/api/content/cms/route.ts` | ذخیره PATCH |
| `app/api/content/manage/route.ts` | CRUD portfolio/backstage |
| `app/api/upload/route.ts` | آپلود فایل |
| `hooks/useSiteContent.ts` | هوک مشترک فرانت |

---

## قابلیت مدia

- **آپلود فایل**: hero, about, portfolio, backstage, creative-partners
- **لینک URL**: hero, portfolio, backstage, creative-partners
- **فرمت ویدیو**: mp4, webm (تا ۴۰MB)

### فیلدهای رسانه (portfolio / backstage / creative-partners)

| فیلد | توضیح |
|------|--------|
| `mediaKind` | `image` یا `video` — نوع نمایش در لندینگ |
| `videoSrc` | URL ویدیو (آپلود یا لینk) — در حالت video |
| `aspectRatio` | `portrait` (۴:۵) · `landscape` (۱۶:۹) · `square` (۱:۱) |
| `image` / `avatarSrc` | تصویر یا پوستر ویدیو |

**کامپوننت‌ها:** `CmsMedia` · **ادیتور:** `MediaItemFields` در تب مدیریت لندینگ و CRUD نمونه‌کار/بک‌استیج.

---

## یادداشت برای توسعه بعدی

- [ ] پیش‌نمایش زنده (iframe) داخل ادیتور
- [ ] Drag & drop مرتب‌سازی آیتم‌ها
- [ ] نسخه‌بندی / بازگشت تغییرات
- [ ] Header nav از CMS (اختیاری)
