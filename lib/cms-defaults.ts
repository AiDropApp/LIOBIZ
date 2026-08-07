import type { HeroStatItem } from "@/lib/landing-defaults";
import { defaultHeroStats } from "@/lib/landing-defaults";

export type LandingContent = {
  heroBadge: string;
  heroTitleBrand: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroTitlePart3: string;
  heroTitlePart4: string;
  heroDescription: string;
  aboutLinkCta: string;
  aboutLinkHref: string;
  planSelectHref: string;
  portfolioViewAllHref: string;
  blogViewAllHref: string;
  headerLoginHref: string;
  headerContactHref: string;
  footerContactPageHref: string;
  portfolioModalCtaHref: string;
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
  portfolioViewAllCta: string;
  portfolioFilterAll: string;
  portfolioEmptyText: string;
  portfolioLoadMoreLabel: string;
  portfolioModalCta: string;
  portfolioModalCategoryLabel: string;
  portfolioModalClientLabel: string;
  portfolioModalYearLabel: string;
  blogViewAllCta: string;
  planPriceSuffix: string;
  planSelectCta: string;
  creativePartnersShowcaseLabel: string;
  footerQuickLinksTitle: string;
  footerServicesTitle: string;
  footerContactTitle: string;
  footerContactPageLink: string;
  headerLoginLabel: string;
  headerMobileLoginLabel: string;
  headerContactButton: string;
  headerMobileServicesLabel: string;
  loadingTagline: string;
};

export const defaultLanding: LandingContent = {
  heroBadge: "آژانس خلاقیت و تبلیغات دیجیتال",
  heroTitleBrand: "لیوبیز | آژانس خلاقیت و تبلیغات دیجیتال",
  heroTitle: "ما رشد",
  heroTitleHighlight: "کسب‌وکار شما",
  heroTitlePart3: "را",
  heroTitlePart4: "می‌سازیم",
  aboutLinkCta: "بیشتر درباره ما",
  aboutLinkHref: "/about",
  planSelectHref: "/contact",
  portfolioViewAllHref: "/portfolio",
  blogViewAllHref: "/blog",
  headerLoginHref: "/login",
  headerContactHref: "/contact",
  footerContactPageHref: "/contact",
  portfolioModalCtaHref: "/contact",
  heroDescription:
    "آژانس تبلیغات دیجیتال لیوبیز در مشهد؛ برندینگ، طراحی وب، مدیریت شبکه‌های اجتماعی و تولید محتوا را با تبلیغات خلاقانه برای رشد برند و فروش کسب‌وکار شما یکپارچه می‌کند.",
  heroPrimaryCta: "شروع همکاری",
  heroPrimaryHref: "/contact",
  heroSecondaryCta: "مشاهدهٔ خدمات لیوبیز",
  heroSecondaryHref: "/#services",
  heroMediaType: "image",
  heroMediaUrl: "/images/hero-lion.png",
  heroStats: defaultHeroStats,
  aboutLabel: "درباره لیوبیز",
  aboutTitle: "لیوبیز، آژانس برندینگ و تبلیغات دیجیتال در مشهد",
  aboutText1:
    "به‌عنوان آژانس خلاقیت در مشهد، با ترکیب استراتژی برندینگ، طراحی و اجرای دیجیتال، مسیر رشد برندها را از ایده تا نتیجه همراهی می‌کنیم؛ شفاف، حرفه‌ای و نتیجه‌محور.",
  aboutText2:
    "از هویت بصری و طراحی وب‌سایت تا مدیریت شبکه‌های اجتماعی و کمپین‌های تبلیغاتی، همه خدمات تبلیغات دیجیتال در یک موتور برندینگ یکپارچه کنار هم قرار می‌گیرد.",
  aboutImage1: "/images/about-liobiz-office.png",
  aboutImage2: "/images/about-liobiz-float.png",
  aboutBadge: "ارزش ما رشد شماست؛ افتخار ما",
  servicesLabel: "خدمات ما",
  servicesTitle: "راهکارهای جامع برای رشد کسب‌وکار شما",
  servicesIntro: "خدمات برندینگ، طراحی وب، تولید محتوا و مدیریت شبکه‌های اجتماعی در مشهد؛ همه در یک مسیر هماهنگ برای رشد کسب‌وکار شما.",
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
  footerCtaButton: "درخواست مشاوره رایگان",
  footerCtaHref: "/contact",
  footerCopyright: "لیوبیز. تمامی حقوق محفوظ است.",
  portfolioViewAllCta: "مشاهده همه پروژه‌ها",
  portfolioFilterAll: "همه",
  portfolioEmptyText: "هنوز نمونه‌کاری در این دسته ثبت نشده است.",
  portfolioLoadMoreLabel: "نمایش بیشتر",
  portfolioModalCta: "سفارش پروژه مشابه",
  portfolioModalCategoryLabel: "دسته‌بندی",
  portfolioModalClientLabel: "کارفرما",
  portfolioModalYearLabel: "سال",
  blogViewAllCta: "همه مقالات",
  planPriceSuffix: "تومان / ماه",
  planSelectCta: "انتخاب پلن",
  creativePartnersShowcaseLabel: "نمونه کار:",
  footerQuickLinksTitle: "دسترسی سریع",
  footerServicesTitle: "خدمات",
  footerContactTitle: "تماس با ما",
  footerContactPageLink: "صفحه تماس و فرم پیام",
  headerLoginLabel: "ورود",
  headerMobileLoginLabel: "ورود به حساب",
  headerContactButton: "مشاوره تخصصی",
  headerMobileServicesLabel: "خدمات",
  loadingTagline: "Liobiz • Brand Engine",
};
