import Link from "next/link";

export default function PageHero({
  label,
  title,
  intro,
}: {
  label: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="page-hero mb-12 text-center lg:mb-16">
      <span className="section-label">{label}</span>
      <h1 className="section-title mx-auto max-w-4xl">{title}</h1>
      {intro && <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted">{intro}</p>}
      <div className="mt-6 flex justify-center">
        <Link href="/" className="text-sm text-white/45 transition-colors hover:text-white">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
