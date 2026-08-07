export type LinkZone = "card" | "dropdown" | "mobile" | "footer";

const SERVICE_ZONE_LABELS: Record<string, Record<LinkZone, string>> = {
  content: {
    card: "مشاهده جزئیات تولید محتوا",
    dropdown: "صفحه خدمت تولید محتوا",
    mobile: "منو — تولید محتوا",
    footer: "راهنمای تولید محتوای برند",
  },
  web: {
    card: "مشاهده جزئیات طراحی وب",
    dropdown: "صفحه طراحی و توسعه وب",
    mobile: "منو — طراحی وب‌سایت",
    footer: "راهکار طراحی وب‌سایت",
  },
  social: {
    card: "مشاهده جزئیات شبکه‌های اجتماعی",
    dropdown: "صفحه مدیریت شبکه‌های اجتماعی",
    mobile: "منو — شبکه‌های اجتماعی",
    footer: "خدمت مدیریت شبکه‌های اجتماعی",
  },
  branding: {
    card: "مشاهده جزئیات هویت بصری",
    dropdown: "صفحه طراحی هویت بصری",
    mobile: "منو — هویت بصری",
    footer: "راهنمای طراحی هویت بصری",
  },
  ads: {
    card: "مشاهده جزئیات تبلیغات",
    dropdown: "صفحه تبلیغات و رشد برند",
    mobile: "منو — تبلیغات و رشد",
    footer: "خدمت تبلیغات و رشد برند",
  },
};

const MOBILE_NAV_LABELS: Record<string, string> = {
  "/#services": "فهرست خدمات لیوبیز",
  "/portfolio": "گالری نمونه کارها",
  "/blog": "آخرین مقالات بلاگ",
  "/process": "فرآیند همکاری با ما",
  "/about": "معرفی آژانس لیوبیز",
  "/contact": "تماس سریع با لیوبیز",
};

export function serviceSlugFromHref(href: string): string {
  const match = href.match(/\/services\/([^/?#]+)/);
  return match?.[1] ?? "";
}

export function getServiceLinkLabel(
  href: string,
  slug: string | undefined,
  title: string,
  zone: LinkZone,
): string {
  const key = slug || serviceSlugFromHref(href);
  return SERVICE_ZONE_LABELS[key]?.[zone] ?? title;
}

export function getMobileNavLabel(href: string, fallback: string): string {
  return MOBILE_NAV_LABELS[href] ?? fallback;
}
