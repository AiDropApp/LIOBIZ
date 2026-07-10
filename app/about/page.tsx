import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import { STATS } from "@/lib/constants";
import { ABOUT_PAGE } from "@/lib/pages-content";

export const metadata: Metadata = {
  title: "درباره ما | لیوبیز",
  description: ABOUT_PAGE.intro,
};

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero label={ABOUT_PAGE.label} title={ABOUT_PAGE.title} intro={ABOUT_PAGE.intro} />

        <section className="mb-12 lux-card">
          <h2 className="mb-4 text-xl font-bold">داستان ما</h2>
          <p className="max-w-4xl leading-8 text-muted">{ABOUT_PAGE.story}</p>
        </section>

        <section className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="lux-card text-center">
              <p className="text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-2 text-muted">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-center text-2xl font-bold">ارزش‌های لیوبیز</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {ABOUT_PAGE.values.map((item) => (
              <article key={item.title} className="lux-card">
                <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                <p className="leading-relaxed text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Link href="/contact" className="btn-primary px-8 py-3.5">
            گفتگو با تیم لیوبیز
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
