"use client";

import { Instagram, Linkedin, Send } from "lucide-react";
import Link from "next/link";
import {
  FOOTER_QUICK_LINKS,
  FOOTER_SERVICES,
  SITE,
  SOCIAL_LINKS,
} from "@/lib/constants";
import Logo from "./Logo";

function SocialIcon({ name }: { name: string }) {
  if (name === "Instagram") return <Instagram size={18} />;
  if (name === "LinkedIn") return <Linkedin size={18} />;
  if (name === "Telegram") return <Send size={18} />;
  return <span className="text-xs font-bold">Be</span>;
}

export default function Footer() {
  return (
    <footer id="contact" className="site-footer border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="footer-cta lux-card mb-14 flex flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-right">
          <div>
            <h3 className="text-2xl font-bold md:text-3xl">آمادهٔ ساختن برند بعدی هستید؟</h3>
            <p className="mt-2 text-muted">یک گفتگوی کوتاه کافی است تا مسیر رشد را طراحی کنیم.</p>
          </div>
          <Link href="/contact" className="btn-primary px-8 py-3.5">
            شروع همکاری
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Logo className="mb-4" width={130} />
            <p className="mb-6 max-w-sm leading-relaxed text-muted">{SITE.description}</p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-white"
                  aria-label={link.name}
                >
                  <SocialIcon name={link.name} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">دسترسی سریع</h3>
            <ul className="space-y-3">
              {FOOTER_QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">خدمات</h3>
            <ul className="space-y-3">
              {FOOTER_SERVICES.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-bold">تماس با ما</h3>
            <ul className="space-y-3 text-muted">
              <li>
                <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-white" dir="ltr">
                  {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-white" dir="ltr">
                  {SITE.email}
                </a>
              </li>
              <li>{SITE.address}</li>
              <li>
                <Link href="/contact" className="text-primary-soft transition-colors hover:text-white">
                  صفحه تماس و فرم پیام
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-sm text-white/40">
          © {new Date().getFullYear()} لیوبیز. تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
