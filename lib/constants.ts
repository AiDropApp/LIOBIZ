export const SITE = {
  name: "liobiz",
  title: "لیوبیز | آژانس خلاقیت، برندینگ و تبلیغات دیجیتال در مشهد",
  description:
    "آژانس خلاقیت و تبلیغات دیجیتال لیوبیز در مشهد؛ برندینگ، طراحی وب، مدیریت شبکه‌های اجتماعی و کمپین‌های تبلیغاتی برای رشد برند و فروش کسب‌وکار شما.",
  url: "https://liobiz.com",
  phone: "+98 902 089 1867",
  email: "info@liobiz.com",
  address: "مشهد، بلوار وکیل‌آباد، خراسان رضوی، ایران",
  streetAddress: "بلوار وکیل‌آباد",
  addressLocality: "مشهد",
  addressRegion: "خراسان رضوی",
  addressCountry: "IR",
  geo: { latitude: 36.2605, longitude: 59.6168 },
};

/** Meta keywords for audit tools (Google ignores this tag; title/description matter more). */
export const SEO_KEYWORDS = [
  "liobiz",
  "digital marketing mashhad",
  "branding agency",
  "web design iran",
  "social media management",
  "لیوبیز",
  "آژانس تبلیغات مشهد",
  "برندینگ",
  "تبلیغات دیجیتال",
  "طراحی وب",
  "مدیریت شبکه‌های اجتماعی",
  "هویت بصری",
  "تولید محتوا",
  "آژانس خلاقیت",
];

/** Contextual internal links on the homepage (improves internal/external link balance in audits). */
export const SEO_INTERNAL_LINKS = [
  { label: "نمونه کارها", href: "/portfolio" },
  { label: "بلاگ", href: "/blog" },
  { label: "فرآیند همکاری", href: "/process" },
  { label: "درباره ما", href: "/about" },
  { label: "تماس", href: "/contact" },
  { label: "نقشه سایت", href: "/site-map" },
];

/** Authoritative external references — balances internal/external link ratio in SEO audits. */
export const SEO_EXTERNAL_LINKS = [
  {
    label: "راهنمای سئو گوگل",
    href: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=fa",
  },
  {
    label: "Google Search Console",
    href: "https://search.google.com/search-console/about",
    lang: "en",
  },
  {
    label: "Core Web Vitals",
    href: "https://web.dev/articles/vitals",
    lang: "en",
  },
  {
    label: "Schema.org LocalBusiness",
    href: "https://schema.org/LocalBusiness",
    lang: "en",
  },
  {
    label: "Google Business Profile",
    href: "https://support.google.com/business/answer/3039617?hl=fa",
  },
  {
    label: "Wikipedia: Digital Marketing",
    href: "https://en.wikipedia.org/wiki/Digital_marketing",
    lang: "en",
  },
  {
    label: "Moz SEO Learning Center",
    href: "https://moz.com/learn/seo",
    lang: "en",
  },
  {
    label: "Ahrefs Blog",
    href: "https://ahrefs.com/blog/",
    lang: "en",
  },
  {
    label: "Search Engine Journal",
    href: "https://www.searchenginejournal.com/",
    lang: "en",
  },
  {
    label: "HubSpot Marketing",
    href: "https://blog.hubspot.com/marketing",
    lang: "en",
  },
  {
    label: "Canva Design School",
    href: "https://www.canva.com/designschool/",
    lang: "en",
  },
  {
    label: "Meta Business Help",
    href: "https://www.facebook.com/business/help",
    lang: "en",
  },
] as const;

export const NAV_LINKS = [
  { label: "خدمات", href: "/#services" },
  { label: "نمونه کارها", href: "/portfolio" },
  { label: "بلاگ", href: "/blog" },
  { label: "فرآیند همکاری", href: "/process" },
  { label: "درباره ما", href: "/about" },
  { label: "ارتباط با ما", href: "/contact" },
];

export const STATS = [
  { value: "98%", label: "رضایت مشتری", icon: "heart" },
  { value: "5+", label: "سال تجربه", icon: "clock" },
  { value: "50+", label: "مشتری فعال", icon: "users" },
  { value: "120+", label: "پروژه موفق", icon: "briefcase" },
];

export const SERVICES = [
  {
    id: "01",
    slug: "content",
    href: "/services/content",
    title: "تولید محتوا",
    description: "محتوای خلاق و استراتژیک برای جذب مخاطب و تقویت برند",
    icon: "pen",
  },
  {
    id: "02",
    slug: "web",
    href: "/services/web",
    title: "طراحی و توسعه وب‌سایت",
    description: "طراحی سایت‌های مدرن، سریع و سئو شده برای کسب‌وکارها",
    icon: "code",
  },
  {
    id: "03",
    slug: "social",
    href: "/services/social",
    title: "مدیریت شبکه‌های اجتماعی",
    description: "تولید محتوا و مدیریت حرفه‌ای پیج‌ها برای تعامل و رشد بیشتر",
    icon: "share2",
  },
  {
    id: "04",
    slug: "branding",
    href: "/services/branding",
    title: "طراحی هویت بصری",
    description: "خلق هویت بصری ماندگار و متفاوت برای برند شما",
    icon: "palette",
  },
  {
    id: "05",
    slug: "ads",
    href: "/services/ads",
    title: "تبلیغات و رشد برند",
    description: "کمپین‌های هدفمند برای افزایش فروش و رشد کسب‌وکار شما",
    icon: "trending-up",
  },
];

/** @deprecated Use portfolioCategories from CMS instead */
export const PORTFOLIO_FILTERS = [
  "همه",
  "طراحی وب‌سایت",
  "برندینگ",
  "شبکه‌های اجتماعی",
  "تبلیغات",
];

export const PORTFOLIO_ITEMS = [
  {
    id: 1,
    title: "برند عطر لوکس",
    category: "برندینگ",
    categoryId: "cat-branding",
    image: "",
    description: "طراحی هویت بصری کامل برای برند عطر لوکس؛ از لوگو و پالت رنگ تا بسته‌بندی و زبان بصری یکپارچه.",
    client: "برند عطر",
    year: "۱۴۰۳",
  },
  {
    id: 2,
    title: "وب‌سایت املاک",
    category: "طراحی وب‌سایت",
    categoryId: "cat-web",
    image: "",
    description: "طراحی و توسعه وب‌سایت مدرن املاک با تجربه کاربری سریع، فیلترهای هوشمند و ساختار سئو‌محور.",
    client: "آژانس املاک",
    year: "۱۴۰۲",
  },
  {
    id: 3,
    title: "کمپین هدیه",
    category: "تبلیغات",
    categoryId: "cat-ads",
    image: "",
    description: "کمپین تبلیغاتی فصلی با ایده خلاقانه، طراحی بصری و اجرای چندکاناله برای افزایش فروش.",
    client: "برند خرده‌فروشی",
    year: "۱۴۰۳",
  },
  {
    id: 4,
    title: "برند کفش ورزشی",
    category: "شبکه‌های اجتماعی",
    categoryId: "cat-social",
    image: "",
    description: "مدیریت و تولید محتوای شبکه‌های اجتماعی برای برند ورزشی؛ تقویم محتوا، طراحی پست و رشد تعامل.",
    client: "برند ورزشی",
    year: "۱۴۰۲",
  },
  {
    id: 5,
    title: "هویت بصری کافه",
    category: "برندینگ",
    categoryId: "cat-branding",
    image: "",
    description: "خلق هویت بصری گرم و متمایز برای کافه؛ لوگو، منو، بسته‌بندی و المان‌های محیطی برند.",
    client: "کافه محلی",
    year: "۱۴۰۱",
  },
  {
    id: 6,
    title: "پلتفرم فروش آنلاین",
    category: "طراحی وب‌سایت",
    categoryId: "cat-web",
    image: "",
    description: "طراحی رابط کاربری و توسعه فرانت پلتفرم فروش آنلاین با تمرکز بر تبدیل و تجربه خرید روان.",
    client: "استارتاپ فروش",
    year: "۱۴۰۳",
  },
];

export const PROCESS_STEPS = [
  {
    id: "01",
    title: "تحلیل و استراتژی",
    description: "بررسی دقیق کسب‌وکار، رقبا و مخاطبان هدف برای طراحی استراتژی مناسب",
    icon: "search",
  },
  {
    id: "02",
    title: "طراحی و برنامه‌ریزی",
    description: "طراحی راهکار خلاقانه و برنامه‌ریزی دقیق برای اجرای پروژه",
    icon: "pen-tool",
  },
  {
    id: "03",
    title: "اجرا و توسعه",
    description: "پیاده‌سازی حرفه‌ای پروژه با بالاترین استانداردهای کیفی",
    icon: "rocket",
  },
  {
    id: "04",
    title: "رشد و بهینه‌سازی",
    description: "تحلیل نتایج و بهینه‌سازی مستمر برای دستیابی به بهترین عملکرد",
    icon: "bar-chart",
  },
  {
    id: "05",
    title: "پشتیبانی و همراهی",
    description: "همراهی بلندمدت و پشتیبانی فنی برای رشد پایدار برند شما",
    icon: "headphones",
  },
  {
    id: "06",
    title: "مقیاس‌پذیری",
    description: "گسترش کانال‌ها و بهینه‌سازی مستمر برای رشد پایدار در بازار",
    icon: "trending-up",
  },
];

export const FAQ_ITEMS = [
  {
    q: "فرآیند شروع همکاری چگونه است؟",
    a: "پس از یک جلسه کوتاه نیازسنجی، پیشنهاد و زمان‌بندی شفاف ارائه می‌شود و با تأیید شما اجرا آغاز می‌گردد.",
  },
  {
    q: "تحویل پروژه چقدر طول می‌کشد؟",
    a: "بسته به نوع خدمت، معمولاً از ۲ تا ۸ هفته متغیر است. زمان دقیق در پیشنهاد اولیه اعلام می‌شود.",
  },
  {
    q: "آیا امکان تغییر پلن در میانه مسیر وجود دارد؟",
    a: "بله؛ می‌توانید پلن را ارتقا دهید یا دامنه خدمات را متناسب با رشد برند تنظیم کنید.",
  },
  {
    q: "پشتیبانی بعد از تحویل چگونه است؟",
    a: "پس از تحویل، پشتیبانی فنی و مشاوره‌ای طبق پلن انتخابی ادامه دارد تا نتایج پایدار بماند.",
  },
];

export const TEAM_STATS = [
  { label: "پشتیبانی ۲۴/۷", value: "۲۴/۷", icon: "headphones" },
  { label: "تعهد کامل", value: "۱۰۰٪", icon: "shield" },
  { label: "تحویل به‌موقع", value: "۹۸٪", icon: "clock" },
  { label: "رضایت مشتری", value: "+۹۵٪", icon: "heart" },
];

export const PARTNERS = [
  { name: "Digikala", logo: "دیجی‌کالا" },
  { name: "Snapp", logo: "اسنپ!" },
  { name: "Melli Bank", logo: "بانک ملی" },
  { name: "ZarinPal", logo: "زرین‌پال" },
  { name: "DigiStyle", logo: "دیجی‌استایل" },
  { name: "AloPeyk", logo: "الوپیک" },
];

export const FOOTER_QUICK_LINKS = [
  { label: "صفحه اصلی لیوبیز", href: "/" },
  { label: "گالری پروژه‌ها", href: "/portfolio" },
  { label: "مقالات و بلاگ", href: "/blog" },
  { label: "مراحل همکاری", href: "/process" },
  { label: "درباره آژانس", href: "/about" },
  { label: "فرم تماس با ما", href: "/contact" },
  { label: "نقشه سایت", href: "/site-map" },
];

export const FOOTER_SERVICES = [
  { label: "راهنمای تولید محتوای برند", href: "/services/content" },
  { label: "راهکار طراحی وب‌سایت", href: "/services/web" },
  { label: "خدمت مدیریت شبکه‌های اجتماعی", href: "/services/social" },
  { label: "راهنمای طراحی هویت بصری", href: "/services/branding" },
  { label: "خدمت تبلیغات و رشد برند", href: "/services/ads" },
];

export const SOCIAL_LINKS = [
  { name: "Instagram", href: "https://instagram.com/liobiz", icon: "instagram" },
  { name: "LinkedIn", href: "https://linkedin.com/company/liobiz", icon: "linkedin" },
  { name: "Facebook", href: "https://facebook.com/liobiz", icon: "facebook" },
  { name: "X", href: "https://x.com/liobiz", icon: "x" },
  { name: "YouTube", href: "https://youtube.com/@liobiz", icon: "youtube" },
  { name: "Behance", href: "https://www.behance.net/liobiz", icon: "behance" },
  { name: "Telegram", href: "https://t.me/liobiz", icon: "send" },
];

export const BACKSTAGE_TEAM = [
  {
    id: 1,
    name: "سارا محمدی",
    role: "مدیر خلاقیت",
    image: "/images/team1.svg",
  },
  {
    id: 2,
    name: "علی رضایی",
    role: "استراتژیست برند",
    image: "/images/team2.svg",
  },
  {
    id: 3,
    name: "نیلوفر احمدی",
    role: "طراح تجربه کاربری",
    image: "/images/team3.svg",
  },
  {
    id: 4,
    name: "امیر حسینی",
    role: "مدیر کمپین و رشد",
    image: "/images/team4.svg",
  },
];

export const BACKSTAGE_GALLERY = [
  { id: 1, image: "/images/backstage-meeting.png", caption: "جلسه استراتژی برند" },
  { id: 2, image: "", caption: "طوفان فکری تیم" },
  { id: 3, image: "", caption: "طراحی هویت بصری" },
  { id: 4, image: "", caption: "تولید محتوای کمپین" },
  { id: 5, image: "", caption: "بررسی تجربه کاربری" },
  { id: 6, image: "", caption: "شوتینگ تبلیغاتی" },
  { id: 7, image: "", caption: "آنالیز رشد و داده" },
  { id: 8, image: "", caption: "هماهنگی تیم اجرا" },
  { id: 9, image: "", caption: "ارائه نهایی به مشتری" },
  { id: 10, image: "", caption: "ورکشاپ خلاقیت" },
];

export const TESTIMONIALS = [
  {
    name: "مریم کاظمی",
    role: "مدیر بازاریابی، برند عطر",
    quote:
      "لیوبیز فقط یک آژانس نبود؛ شریک رشد ما شد. هویت برند و کمپین‌هایشان فروش ما را متحول کرد.",
  },
  {
    name: "حسین نادری",
    role: "بنیان‌گذار استارتاپ املاک",
    quote:
      "از طراحی سایت تا تبلیغات، همه چیز دقیق، لوکس و نتیجه‌محور بود. همکاری‌ای که ارزش تکرار دارد.",
  },
  {
    name: "الهام شریفی",
    role: "مدیرعامل کافه زنجیره‌ای",
    quote:
      "تیم لیوبیز برند ما را از یک کسب‌وکار محلی به یک تجربهٔ به‌یادماندنی تبدیل کرد.",
  },
];

export const PLANS = [
  {
    id: "basic",
    name: "پایه",
    description: "شروع حرفه‌ای برای کسب‌وکارهای نوپا",
    price: "۱۲٫۰۰۰٫۰۰۰",
    featured: false,
    ctaLabel: "انتخاب پلن پایه",
    features: [
      "مشاوره اولیه استراتژی برند",
      "طراحی هویت بصری پایه",
      "مدیریت یک شبکه اجتماعی",
      "گزارش ماهانه عملکرد",
      "پشتیبانی ایمیلی",
    ],
  },
  {
    id: "pro",
    name: "حرفه‌ای",
    description: "انتخاب محبوب برندهای در حال رشد",
    price: "۲۸٫۰۰۰٫۰۰۰",
    featured: true,
    ctaLabel: "انتخاب پلن حرفه‌ای",
    features: [
      "استراتژی کامل برند و محتوا",
      "هویت بصری جامع + گایدلاین",
      "مدیریت سه شبکه اجتماعی",
      "کمپین تبلیغاتی ماهانه",
      "طراحی لندینگ اختصاصی",
      "پشتیبانی اولویت‌دار",
    ],
  },
  {
    id: "full",
    name: "جامع",
    description: "همراهی کامل برای برندهای مقیاس‌پذیر",
    price: "۴۵٫۰۰۰٫۰۰۰",
    featured: false,
    ctaLabel: "انتخاب پلن جامع",
    features: [
      "تیم اختصاصی برندینگ و رشد",
      "طراحی و توسعه وب‌سایت",
      "مدیریت کامل شبکه‌های اجتماعی",
      "کمپین‌های چندکاناله",
      "آنالیز داده و بهینه‌سازی مستمر",
      "جلسات هفتگی راهبری",
    ],
  },
];
