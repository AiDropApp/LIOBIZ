import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { SITE } from "@/lib/constants";
import { CONTACT_PAGE } from "@/lib/pages-content";

export const metadata: Metadata = {
  title: "تماس با ما | لیوبیز",
  description: CONTACT_PAGE.intro,
};

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero label={CONTACT_PAGE.label} title={CONTACT_PAGE.title} intro={CONTACT_PAGE.intro} />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="lux-card flex items-start gap-4 transition-colors hover:border-primary/30">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Phone size={20} />
              </div>
              <div>
                <h2 className="mb-1 font-bold">تلفن</h2>
                <p className="text-muted" dir="ltr">
                  {SITE.phone}
                </p>
              </div>
            </a>

            <a href={`mailto:${SITE.email}`} className="lux-card flex items-start gap-4 transition-colors hover:border-primary/30">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="mb-1 font-bold">ایمیل</h2>
                <p className="text-muted" dir="ltr">
                  {SITE.email}
                </p>
              </div>
            </a>

            <div className="lux-card flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="mb-1 font-bold">آدرس</h2>
                <p className="text-muted">{SITE.address}</p>
              </div>
            </div>

            <div className="lux-card">
              <h2 className="mb-2 font-bold">ساعات پاسخ‌گویی</h2>
              <p className="leading-relaxed text-muted">شنبه تا چهارشنبه، ۹ تا ۱۸</p>
              <p className="mt-3 text-sm text-white/45">برای پروژه‌های فوری، در پیام خود زمان مدنظر را ذکر کنید.</p>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </SiteShell>
  );
}
