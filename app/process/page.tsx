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
import { PROCESS_PAGE } from "@/lib/pages-content";

const iconMap: Record<string, LucideIcon> = {
  search: Search,
  "pen-tool": PenTool,
  rocket: Rocket,
  "bar-chart": BarChart3,
  headphones: Headphones,
};

export const metadata: Metadata = {
  title: "فرآیند همکاری | لیوبیز",
  description: PROCESS_PAGE.intro,
};

export default function ProcessPage() {
  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero label={PROCESS_PAGE.label} title={PROCESS_PAGE.title} intro={PROCESS_PAGE.intro} />

        <div className="grid gap-5 lg:grid-cols-1">
          {PROCESS_STEPS.map((step) => {
            const Icon = iconMap[step.icon] ?? Search;
            return (
              <article key={step.id} className="lux-card grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
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
