import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  PenTool,
  Rocket,
  BarChart3,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import { PROCESS_STEPS } from "@/lib/constants";
import { readSiteContent } from "@/lib/content-store";

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  "pen-tool": PenTool,
  rocket: Rocket,
  "bar-chart": BarChart3,
  headphones: Headphones,
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readSiteContent();
  return {
    title: `${content.pages.process.title} | لیوبیز`,
    description: content.pages.process.intro,
  };
}

export default async function ProcessPage() {
  const content = await readSiteContent();
  const process = content.pages.process;
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
        <PageHero label={process.label} title={process.title} intro={process.intro} />

        <div className="grid gap-5 md:grid-cols-2">
          {steps.map((step) => {
            const Icon = iconMap[step.icon] ?? Search;
            return (
              <article key={step.id} className="lux-card grid gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon size={24} />
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary">{step.id}</span>
                    <h2 className="text-xl font-bold">{step.title}</h2>
                  </div>
                  <p className="leading-relaxed text-muted">{step.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/contact" className="btn-primary px-8 py-3.5">
            شروع همکاری
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
