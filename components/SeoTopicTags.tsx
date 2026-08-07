import { SEO_KEYWORDS } from "@/lib/constants";

/** Visible topic tags — SEO audit tools (e.g. SEOptimer) tokenize body text, not only meta tags. */
export default function SeoTopicTags() {
  const persian = SEO_KEYWORDS.filter((k) => /[\u0600-\u06FF]/.test(k));
  const english = SEO_KEYWORDS.filter((k) => !/[\u0600-\u06FF]/.test(k));

  return (
    <section className="seo-topic-tags border-t border-white/5 py-5" aria-label="حوزه‌های تخصصی">
      <div className="container mx-auto px-4 text-xs leading-7 text-muted">
        <p>
          <span className="font-semibold text-foreground/80">کلمات کلیدی: </span>
          {persian.join("، ")}
        </p>
        <p className="mt-1" lang="en" dir="ltr">
          <span className="font-semibold text-foreground/80">Keywords: </span>
          {english.join(", ")}
        </p>
      </div>
    </section>
  );
}
