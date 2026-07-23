import type { HeroStatItem } from "@/lib/landing-defaults";
import { defaultHeroStats } from "@/lib/landing-defaults";

export type LandingContent = {
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  heroPrimaryCta: string;
  heroPrimaryHref: string;
  heroSecondaryCta: string;
  heroSecondaryHref: string;
  heroMediaType: "video" | "image";
  heroMediaUrl: string;
  heroStats: HeroStatItem[];
  aboutLabel: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  aboutImage1: string;
  aboutImage2: string;
  aboutBadge: string;
  servicesLabel: string;
  servicesTitle: string;
  servicesIntro: string;
  portfolioLabel: string;
  portfolioTitle: string;
  processLabel: string;
  processTitle: string;
  processIntro: string;
  processLinkText: string;
  processLinkHref: string;
  plansLabel: string;
  plansTitle: string;
  plansIntro: string;
  backstageLabel: string;
  backstageTitle: string;
  backstageIntro: string;
  creativePartnersLabel: string;
  creativePartnersTitle: string;
  creativePartnersIntro: string;
  faqLabel: string;
  faqTitle: string;
  faqIntro: string;
  testimonialsLabel: string;
  testimonialsTitle: string;
  testimonialsIntro: string;
  partnersLabel: string;
  partnersTitle: string;
  footerCtaTitle: string;
  footerCtaText: string;
  footerCtaButton: string;
  footerCtaHref: string;
  footerCopyright: string;
};

export const defaultLanding: LandingContent = {
  heroBadge: "آژانس رشد کسب‌وکار",
  heroTitle: "ما رشد",
  heroTitleHighlight: "کسب‌وکار شما",
  heroDescription:
    "تبلیغات خلاقانه، فروش هدفمند و پشتیبانی حرفه‌ای؛ همه در یک مسیر رشد یکپارچه برای برند شما.",
  heroPrimaryCta: "شروع همکاری",
  heroPrimaryHref: "/contact",
  heroSecondaryCta: "مشاهده خدمات",
  heroSecondaryHref: "/#services",
  heroMediaType: "video",
  heroMediaUrl: "",
  heroStats: defaultHeroStats,
  aboutLabel: "درباره لیوبیز",
  aboutTitle: "لیوبیز، شریک رشد کسب‌وکار شما",
  aboutText1:
    "ما با ترکیب استراتژی، طراحی و اجرای دیجیتال، مسیر رشد برندها را از ایده تا نتیجه همراهی می‌کنیم؛ شفاف، حرفه‌ای و نتیجه‌محور.",
  aboutText2:
    "از هویت بصری و وب‌سایت تا شبکه‌های اجتماعی و کمپین‌های تبلیغاتی، همه چیز در یک موتور برندینگ یکپارچه کنار هم قرار می‌گیرد.",
  aboutImage1: "/images/about-liobiz-office.png",
  aboutImage2: "/images/about-liobiz-float.png",
  aboutBadge: "ارزش ما رشد شماست؛ افتخار ما",
  servicesLabel: "خدمات ما",
  servicesTitle: "راهکارهای جامع برای رشد کسب‌وکار شما",
  servicesIntro: "از هویت برند تا تبلیغات و محتوا؛ همه خدمات در یک مسیر هماهنگ.",
  portfolioLabel: "نمونه کارها",
  portfolioTitle: "پروژه‌هایی که به آن‌ها افتخار می‌کنیم",
  processLabel: "فرآیند همکاری",
  processTitle: "از ایده تا رشد، در کنار شما هستیم",
  processIntro: "",
  processLinkText: "جزئیات فرآیند همکاری",
  processLinkHref: "/process",
  plansLabel: "پلن‌های همکاری",
  plansTitle: "پلنی انتخاب کنید که مناسب شماست",
  plansIntro: "سه سطح همکاری شفاف؛ از شروع حرفه‌ای تا همراهی جامع برای مقیاس‌پذیری برند.",
  backstageLabel: "تیم لیوبیز",
  backstageTitle: "پشت صحنهٔ ساخت برندهای ماندگار",
  backstageIntro: "لحظه‌های واقعی تیم، جلسات استراتژی، تولید محتوا و اجرای کمپین.",
  creativePartnersLabel: "همکاران خلاق",
  creativePartnersTitle: "خالقانی که با لیوبیز مرزها را جابه‌جا می‌کنند",
  creativePartnersIntro:
    "از تصویربردار تا موشن‌گر — روی هر پروفایل بزنید تا نمونه کارشان را ببینید.",
  faqLabel: "سوالات متداول",
  faqTitle: "پاسخ سوالات رایج",
  faqIntro: "اگر سوال دیگری دارید، از طریق تماس با ما در ارتباط باشید.",
  testimonialsLabel: "گواهی مشتریان",
  testimonialsTitle: "وقتی برندها، نتیجه را می‌بینند",
  testimonialsIntro: "هر همکاری برای ما یک پروژهٔ رشد و یک داستان موفقیت است؛ نه فقط یک سفارش.",
  partnersLabel: "همکاران ما",
  partnersTitle: "برندهایی که به ما اعتماد کردند",
  footerCtaTitle: "آمادهٔ ساختن برند بعدی هستید؟",
  footerCtaText: "یک گفتگوی کوتاه کافی است تا مسیر رشد را طراحی کنیم.",
  footerCtaButton: "شروع همکاری",
  footerCtaHref: "/contact",
  footerCopyright: "لیوبیز. تمامی حقوق محفوظ است.",
};
