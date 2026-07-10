import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { readSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readSiteContent();
  return {
    title: `${content.pages.contact.title} | لیوبیز`,
    description: content.pages.contact.intro,
  };
}

export default async function ContactPage() {
  const content = await readSiteContent();
  const { contact } = content.pages;
  const site = content.site;

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero label={contact.label} title={contact.title} intro={contact.intro} />

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div className="space-y-4">
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="contact-info-card lux-card flex items-start gap-4"
            >
              <div className="contact-info-icon" aria-hidden="true">
                <Phone size={20} />
              </div>
              <div>
                <h2 className="mb-1 font-bold">تلفن</h2>
                <p className="text-muted" dir="ltr">
                  {site.phone}
                </p>
              </div>
            </a>

            <a
              href={`mailto:${site.email}`}
              className="contact-info-card lux-card flex items-start gap-4"
            >
              <div className="contact-info-icon" aria-hidden="true">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="mb-1 font-bold">ایمیل</h2>
                <p className="text-muted" dir="ltr">
                  {site.email}
                </p>
              </div>
            </a>

            <div className="contact-info-card lux-card flex items-start gap-4">
              <div className="contact-info-icon" aria-hidden="true">
                <MapPin size={20} />
              </div>
              <div>
                <h2 className="mb-1 font-bold">آدرس</h2>
                <p className="text-muted">{site.address}</p>
                <p className="mt-2 text-sm text-muted">{contact.hours}</p>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </SiteShell>
  );
}
