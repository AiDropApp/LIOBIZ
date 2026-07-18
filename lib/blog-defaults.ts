export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  published: boolean;
  tags: string[];
};

export const defaultBlogPosts: BlogPost[] = [
  {
    id: "post-1",
    slug: "brand-growth-strategy",
    title: "۵ اصل طلایی برای رشد برند در فضای دیجیتال",
    excerpt:
      "رشد برند فقط تبلیغات نیست؛ ترکیب استراتژی، محتوا و تجربه مشتری است که نتیجه پایدار می‌سازد.",
    content: `# مقدمه
رشد برند در بازار رقابتی امروز نیازمند نگاه یکپارچه است.

## ۱. شناخت دقیق مخاطب
قبل از هر کمپین، پرسونای مخاطب را شفاف کنید.

## ۲. پیام یکپارچه
همه کانال‌ها باید یک داستان برند را روایت کنند.

## ۳. اندازه‌گیری مستمر
بدون داده، بهینه‌سازی غیرممکن است.`,
    coverImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80",
    author: "تیم لیوبیز",
    publishedAt: "2026-03-01T10:00:00.000Z",
    published: true,
    tags: ["برندینگ", "رشد", "دیجیتال"],
  },
  {
    id: "post-2",
    slug: "social-media-content-calendar",
    title: "چطور تقویم محتوای شبکه‌های اجتماعی بسازیم؟",
    excerpt:
      "یک تقویم محتوای منظم، استرس تیم را کم می‌کند و کیفیت خروجی را بالا می‌برد.",
    content: `# چرا تقویم محتوا مهم است؟
بدون برنامه، محتوا پراکنده و غیرهماهنگ می‌شود.

## گام‌های ساخت تقویم
### تحلیل کانال‌ها
هر پلتفرم مخاطب و فرمت خاص خود را دارد.

### تعریف ستون‌های محتوایی
آموزشی، تبلیغاتی، پشت‌صحنه و تعامل.`,
    coverImage:
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=1200&h=630&q=80",
    author: "تیم لیوبیز",
    publishedAt: "2026-02-15T10:00:00.000Z",
    published: true,
    tags: ["شبکه‌های اجتماعی", "محتوا"],
  },
  {
    id: "post-3",
    slug: "landing-page-conversion",
    title: "لندینگ‌پیج حرفه‌ای؛ از کلیک تا تبدیل",
    excerpt:
      "طراحی لندینگ موفق ترکیبی از پیام شفاف، اعتمادسازی و فراخوان به اقدام درست است.",
    content: `# عناصر یک لندینگ مؤثر
## تیتر واضح
کاربر در ۳ ثانیه باید بفهمد چه ارزشی دریافت می‌کند.

## اثبات اجتماعی
نظر مشتریان و نمونه کارها اعتماد می‌سازند.

## CTA مشخص
دکمه اقدام باید برجسته و تک‌مرحله‌ای باشد.`,
    coverImage:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&h=630&q=80",
    author: "تیم لیوبیز",
    publishedAt: "2026-01-20T10:00:00.000Z",
    published: true,
    tags: ["لندینگ", "تبدیل", "وب"],
  },
];

export function slugifyBlogTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
