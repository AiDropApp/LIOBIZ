"use client";

import { useEffect, useState } from "react";
import { Instagram, Linkedin, Send } from "lucide-react";
import Link from "next/link";
import {
  FOOTER_QUICK_LINKS,
  FOOTER_SERVICES,
  SITE,
  SOCIAL_LINKS,
} from "@/lib/constants";

function SocialIcon({ name }: { name: string }) {
  if (name === "Instagram") return <Instagram size={18} />;
  if (name === "LinkedIn") return <Linkedin size={18} />;
  if (name === "Telegram") return <Send size={18} />;
  return <span className="text-xs font-bold">Be</span>;
}

type SiteInfo = {
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  footerText?: string;
  socials?: Array<{ name: string; href: string }>;
};

export default function Footer() {
  const [site, setSite] = useState<SiteInfo>({
    description: SITE.description,
    phone: SITE.phone,
    email: SITE.email,
    address: SITE.address,
    footerText: SITE.description,
    socials: SOCIAL_LINKS,
  });

  useEffect(() => {
    fetch("/api/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.site) {
          setSite({
            description: data.site.description || SITE.description,
            phone: data.site.phone || SITE.phone,
            email: data.site.email || SITE.email,
            address: data.site.address || SITE.address,
            footerText: data.site.footerText || data.site.description || SITE.description,
            socials:
              Array.isArray(data.site.socials) && data.site.socials.length > 0
                ? data.site.socials
                : SOCIAL_LINKS,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  const phone = site.phone || SITE.phone;
  const email = site.email || SITE.email;
  const socials = site.socials || SOCIAL_LINKS;

  return (
    <footer id="contact" className="site-footer">
      <div className="footer-panel">
        <div className="footer-panel-inner">
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
              <p className="mb-2 text-xl font-extrabold tracking-wide text-white">LIOBIZ</p>
              <p className="mb-6 max-w-sm leading-relaxed text-muted">
                {site.footerText || site.description || SITE.description}
              </p>
              <div className="flex items-center gap-3">
                {socials.map((link) => (
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
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="transition-colors hover:text-white"
                    dir="ltr"
                  >
                    {phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`} className="transition-colors hover:text-white" dir="ltr">
                    {email}
                  </a>
                </li>
                <li>{site.address || SITE.address}</li>
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
      </div>
    </footer>
  );
}
