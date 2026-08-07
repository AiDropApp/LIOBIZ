import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import ContactPageContent from "@/components/pages/ContactPageContent";
import { readSiteContent } from "@/lib/content-store";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readSiteContent();
  return buildPageMetadata({
    title: `${content.pages.contact.title} | لیوبیز`,
    description: content.pages.contact.intro,
    pathname: "/contact",
  });
}

export default async function ContactPage() {
  const content = await readSiteContent();

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <ContactPageContent contact={content.pages.contact} site={content.site} />
      </div>
    </SiteShell>
  );
}
