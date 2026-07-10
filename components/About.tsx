"use client";

import { motion } from "framer-motion";
import { Lightbulb, Target, Handshake, Sparkles } from "lucide-react";

const items = [
  {
    title: "خلاقیت متمرکز",
    description: "راهکارهای طراحی و کمپین‌های نوآورانه که توجه را جلب می‌کند.",
    icon: Lightbulb,
  },
  {
    title: "استراتژی دقیق",
    description: "برنامه‌ریزی داده‌محور برای ساختن یک برند معتبر و پایدار.",
    icon: Target,
  },
  {
    title: "پشتیبانی بلندمدت",
    description: "همراهی مستمر برای رشد هوشمندانه و بهینه‌سازی نتایج.",
    icon: Handshake,
  },
  {
    title: "اجرا با دقت",
    description: "تحویل بدون نقص و هماهنگی کامل در هر مرحله از پروژه.",
    icon: Sparkles,
  },
];

export default function About() {
  return (
    <section id="about" className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="section-label">درباره ما</span>
          <h2 className="section-title">چطور هویت دیجیتال شما را تبدیل به میراث می‌کنیم</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted">
            در لیوبیز، هر پروژه آغاز یک سفر برندینگ است؛ از تعریف هویت تا خلق
            تجربه‌ای که مشتریان را شیفته می‌کند.
          </p>
          <a href="/about" className="mt-4 inline-flex text-sm text-primary-soft transition-colors hover:text-white">
            بیشتر درباره لیوبیز
          </a>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="lux-card"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <item.icon size={22} />
              </div>
              <h3 className="mb-3 text-xl font-bold">{item.title}</h3>
              <p className="leading-relaxed text-muted">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
