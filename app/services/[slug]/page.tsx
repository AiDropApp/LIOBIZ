import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import PageHero from "@/components/PageHero";
import { getServiceBySlug, SERVICE_PAGES } from "@/lib/pages-content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICE_PAGES.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "خدمات | لیوبیز" };
  return {
    title: `${service.title} | لیوبیز`,
    description: service.intro,
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);

  if (!service) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-20 text-center lg:px-8">
          <h1 className="section-title">خدمت پیدا نشد</h1>
          <Link href="/" className="btn-primary mt-8 inline-flex">
            بازگشت به خانه
          </Link>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="container mx-auto px-4 pb-20 lg:px-8 lg:pb-28">
        <PageHero label={service.label} title={service.headline} intro={service.intro} />

        <section className="mb-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="lux-card">
            <h2 className="mb-4 text-xl font-bold">این خدمت برای چه کسانی مناسب است؟</h2>
            <p className="leading-relaxed text-muted">{service.audience}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {service.outcomes.map((item) => (
                <li key={item} className="rounded-xl border border-black/8 bg-background-soft px-4 py-3 text-sm text-foreground/85">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lux-card flex flex-col justify-between">
            <div>
              <h2 className="mb-3 text-xl font-bold">{service.title}</h2>
              <p className="leading-relaxed text-muted">
                اگر می‌خواهید این خدمت را برای برند خود شروع کنید، یک گفتگوی کوتاه کافی است تا مسیر را طراحی کنیم.
              </p>
            </div>
            <Link href="/contact" className="btn-primary mt-8 w-full justify-center py-3.5">
              شروع همکاری
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-center text-2xl font-bold">چه چیزهایی تحویل می‌گیرید؟</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {service.deliverables.map((item) => (
              <article key={item.title} className="lux-card">
                <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                <p className="leading-relaxed text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-center text-2xl font-bold">فرآیند اجرای این خدمت</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {service.process.map((step, index) => (
              <article key={step.title} className="lux-card">
                <span className="mb-3 inline-flex text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
