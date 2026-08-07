"use client";

import EditablePageHero from "@/components/cms-edit/EditablePageHero";
import EditableText from "@/components/cms-edit/EditableText";
import EditableCta from "@/components/cms-edit/EditableCta";
import type { PagesContent } from "@/lib/content-store";
import type { HeroStatItem } from "@/lib/landing-defaults";

type Props = {
  about: PagesContent["about"];
  heroStats: HeroStatItem[];
};

export default function AboutPageContent({ about, heroStats }: Props) {
  return (
    <>
      <EditablePageHero
        labelPath="pages.about.label"
        titlePath="pages.about.title"
        introPath="pages.about.intro"
        label={about.label}
        title={about.title}
        intro={about.intro}
      />

      <section className="mb-12 lux-card cms-editable-card">
        <EditableText path="pages.about.storyHeading" as="h2" className="mb-4 text-xl font-bold">
          {about.storyHeading}
        </EditableText>
        <EditableText path="pages.about.story" as="p" className="max-w-4xl leading-8 text-muted" multiline>
          {about.story}
        </EditableText>
      </section>

      <section className="mb-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {heroStats.map((stat, index) => (
          <div key={stat.label} className="service-deliverable lux-card cms-editable-card text-center">
            <EditableText
              path={`landing.heroStats.${index}.value`}
              as="p"
              className="text-3xl font-extrabold text-primary"
            >
              {stat.value}
            </EditableText>
            <EditableText path={`landing.heroStats.${index}.label`} as="p" className="mt-2 text-muted">
              {stat.label}
            </EditableText>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <EditableText path="pages.about.valuesHeading" as="h2" className="mb-6 text-center text-2xl font-bold">
          {about.valuesHeading}
        </EditableText>
        <div className="grid gap-5 sm:grid-cols-2">
          {about.values.map((item, index) => (
            <article key={item.title} className="service-deliverable lux-card cms-editable-card">
              <EditableText path={`pages.about.values.${index}.title`} as="h3" className="mb-2 text-lg font-bold">
                {item.title}
              </EditableText>
              <EditableText
                path={`pages.about.values.${index}.description`}
                as="p"
                className="leading-relaxed text-muted"
                multiline
              >
                {item.description}
              </EditableText>
            </article>
          ))}
        </div>
      </section>

      <div className="text-center">
        <EditableCta
          labelPath="pages.about.contactCta"
          hrefPath="pages.about.contactHref"
          label={about.contactCta}
          href={about.contactHref}
          className="btn-accent px-8 py-3.5"
        />
      </div>
    </>
  );
}
