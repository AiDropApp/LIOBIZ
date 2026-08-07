#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.argv[2] || "/var/www/liobiz";
const file = path.join(root, "data/site-content.json");
const backup = `${file}.bak-seo-${new Date().toISOString().replace(/[:.]/g, "-")}`;

const FOOTER_QUICK_LABELS = {
  "/": "صفحه اصلی لیوبیز",
  "/portfolio": "گالری پروژه‌ها",
  "/blog": "مقالات و بلاگ",
  "/process": "مراحل همکاری",
  "/about": "درباره آژانس",
  "/contact": "فرم تماس با ما",
  "/site-map": "نقشه سایت",
};

const FOOTER_SERVICE_LINKS = [
  { label: "راهنمای تولید محتوای برند", href: "/services/content" },
  { label: "راهکار طراحی وب‌سایت", href: "/services/web" },
  { label: "خدمت مدیریت شبکه‌های اجتماعی", href: "/services/social" },
  { label: "راهنمای طراحی هویت بصری", href: "/services/branding" },
  { label: "خدمت تبلیغات و رشد برند", href: "/services/ads" },
];

const NAV_LINKS = [
  { label: "خدمات", href: "/#services" },
  { label: "نمونه کارها", href: "/portfolio" },
  { label: "بلاگ", href: "/blog" },
  { label: "فرآیند همکاری", href: "/process" },
  { label: "درباره ما", href: "/about" },
  { label: "ارتباط با ما", href: "/contact" },
];

const PLAN_CTA_BY_ID = {
  basic: "انتخاب پلن پایه",
  pro: "انتخاب پلن حرفه‌ای",
  full: "انتخاب پلن جامع",
};

const SITE_ADDRESS = "مشهد، بلوار وکیل‌آباد، خراسان رضوی، ایران";

const SITE_TITLE = "لیوبیز | آژانس خلاقیت، برندینگ و تبلیغات دیجیتال در مشهد";

const SITE_DESCRIPTION =
  "آژانس خلاقیت و تبلیغات دیجیتال لیوبیز در مشهد؛ برندینگ، طراحی وب، مدیریت شبکه‌های اجتماعی و کمپین‌های تبلیغاتی برای رشد برند و فروش کسب‌وکار شما.";

const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://instagram.com/liobiz", icon: "instagram" },
  { name: "LinkedIn", href: "https://linkedin.com/company/liobiz", icon: "linkedin" },
  { name: "Facebook", href: "https://facebook.com/liobiz", icon: "facebook" },
  { name: "X", href: "https://x.com/liobiz", icon: "x" },
  { name: "YouTube", href: "https://youtube.com/@liobiz", icon: "youtube" },
  { name: "Behance", href: "https://www.behance.net/liobiz", icon: "behance" },
  { name: "Telegram", href: "https://t.me/liobiz", icon: "send" },
];

const raw = fs.readFileSync(file, "utf8");
fs.writeFileSync(backup, raw, "utf8");

const data = JSON.parse(raw);
const landing = data.landing ?? (data.landing = {});
const site = data.site ?? (data.site = {});

landing.heroBadge = "آژانس خلاقیت و تبلیغات دیجیتال";
landing.heroTitleBrand = "لیوبیز";
landing.footerCtaButton = "درخواست مشاوره رایگان";
landing.heroSecondaryCta = "مشاهدهٔ خدمات لیوبیز";
landing.headerContactButton = "مشاوره تخصصی";

landing.heroDescription =
  "آژانس تبلیغات دیجیتال لیوبیز در مشهد؛ برندینگ، طراحی وب، مدیریت شبکه‌های اجتماعی و تولید محتوا را با تبلیغات خلاقانه برای رشد برند و فروش کسب‌وکار شما یکپارچه می‌کند.";

landing.aboutTitle = "لیوبیز، آژانس برندینگ و تبلیغات دیجیتال در مشهد";
landing.aboutText1 =
  "به‌عنوان آژانس خلاقیت در مشهد، با ترکیب استراتژی برندینگ، طراحی و اجرای دیجیتال، مسیر رشد برندها را از ایده تا نتیجه همراهی می‌کنیم؛ شفاف، حرفه‌ای و نتیجه‌محور.";
landing.aboutText2 =
  "از هویت بصری و طراحی وب‌سایت تا مدیریت شبکه‌های اجتماعی و کمپین‌های تبلیغاتی، همه خدمات تبلیغات دیجیتال در یک موتور برندینگ یکپارچه کنار هم قرار می‌گیرد.";
landing.servicesIntro =
  "خدمات برندینگ، طراحی وب، تولید محتوا و مدیریت شبکه‌های اجتماعی در مشهد؛ همه در یک مسیر هماهنگ برای رشد کسب‌وکار شما.";

if (String(landing.heroMediaUrl || "").includes("aidrop.app")) {
  landing.heroMediaUrl = "/video/landing/aidrop/aidrop-partner-07.mp4";
  landing.heroMediaType = "video";
}

site.address = SITE_ADDRESS;
site.streetAddress = "بلوار وکیل‌آباد";
site.addressLocality = "مشهد";
site.addressRegion = "خراسان رضوی";

site.socials = SOCIAL_LINKS.map((link, index) => {
  const existing = Array.isArray(site.socials) ? site.socials[index] : undefined;
  return {
    name: existing?.name || link.name,
    href: link.href,
    ...(existing?.icon || link.icon ? { icon: existing?.icon || link.icon } : {}),
  };
});

if (Object.prototype.hasOwnProperty.call(site, "title")) {
  site.title = SITE_TITLE;
}

if (Object.prototype.hasOwnProperty.call(site, "description")) {
  site.description = SITE_DESCRIPTION;
}

site.navLinks = NAV_LINKS;

data.footerQuickLinks = (Array.isArray(data.footerQuickLinks) ? data.footerQuickLinks : []).map((link) => ({
  ...link,
  label: FOOTER_QUICK_LABELS[link.href] || link.label,
}));

if (!Array.isArray(data.footerQuickLinks) || data.footerQuickLinks.length === 0) {
  data.footerQuickLinks = Object.entries(FOOTER_QUICK_LABELS).map(([href, label]) => ({ href, label }));
}

data.footerServiceLinks = FOOTER_SERVICE_LINKS;

if (Array.isArray(data.plans)) {
  data.plans = data.plans.map((plan) => ({
    ...plan,
    ctaLabel: plan.ctaLabel || PLAN_CTA_BY_ID[plan.id] || `انتخاب پلن ${plan.name || ""}`.trim(),
  }));
}

const tmp = `${file}.tmp-${process.pid}`;
fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
JSON.parse(fs.readFileSync(tmp, "utf8"));
fs.renameSync(tmp, file);

console.log("BACKUP", backup);
console.log("navLinks", site.navLinks.length);
console.log("footerServiceLinks", data.footerServiceLinks.length);
console.log("heroTitleBrand", landing.heroTitleBrand);
console.log("site.address", site.address);
console.log("site.socials", site.socials.length);
if (Object.prototype.hasOwnProperty.call(site, "title")) console.log("site.title", site.title);
if (Object.prototype.hasOwnProperty.call(site, "description")) console.log("site.description", site.description);
