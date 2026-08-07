import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import ProcessPageContent from "@/components/pages/ProcessPageContent";
import { PROCESS_STEPS } from "@/lib/constants";
import { readSiteContent } from "@/lib/content-store";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readSiteContent();
  return buildPageMetadata({
    title: `${content.pages.process.title} | لیوبیز`,
    description: content.pages.process.intro,
    pathname: "/process",
  });
}

export default async function ProcessPage() {
  const content = await readSiteContent();
  const steps =
    content.pages.processSteps?.length > 0
      ? content.pages.processSteps.map((s, i) => ({
          id: s.id || String(i + 1).padStart(2, "0"),
          title: s.title,
          description: s.description,
          icon: PROCESS_STEPS[i]?.icon || "search",
        }))
      : PROCESS_STEPS;

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <ProcessPageContent process={content.pages.process} steps={steps} />
      </div>
    </SiteShell>
  );
}
