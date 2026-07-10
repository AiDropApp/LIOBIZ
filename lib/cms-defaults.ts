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
  aboutLabel: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  servicesLabel: string;
  servicesTitle: string;
  processLabel: string;
  processTitle: string;
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
  heroMediaUrl: "/videos/header.mp4",
  aboutLabel: "درباره لیوبیز",
  aboutTitle: "لیوبیز، شریک رشد کسب‌وکار شما",
  aboutText1:
    "ما با ترکیب استراتژی، طراحی و اجرای دیجیتال، مسیر رشد برندها را از ایده تا نتیجه همراهی می‌کنیم؛ شفاف، حرفه‌ای و نتیجه‌محور.",
  aboutText2:
    "از هویت بصری و وب‌سایت تا شبکه‌های اجتماعی و کمپین‌های تبلیغاتی، همه چیز در یک موتور برندینگ یکپارچه کنار هم قرار می‌گیرد.",
  servicesLabel: "خدمات",
  servicesTitle: "هر آنچه برای رشد برند نیاز دارید",
  processLabel: "فرآیند همکاری",
  processTitle: "مسیر شفاف از ایده تا نتیجه",
};
