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

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="lux-card flex items-start gap-4 transition-colors hover:border-primary/30"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
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
              className="lux-card flex items-start gap-4 transition-colors hover:border-primary/30"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="mb-1 font-bold">ایمیل</h2>
                <p className="text-muted" dir="ltr">
                  {site.email}
                </p>
              </div>
            </a>

            <div className="lux-card flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
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
