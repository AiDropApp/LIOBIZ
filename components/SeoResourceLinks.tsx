import Link from "next/link";
import { SEO_EXTERNAL_LINKS, SEO_INTERNAL_LINKS } from "@/lib/constants";

/** Balanced internal + external links for SEO audit tools. */
export default function SeoResourceLinks() {
  return (
    <nav
      className="seo-resource-links container mx-auto border-t border-white/5 px-4 py-6"
      aria-label="صفحات و منابع مرتبط"
    >
      <p className="mb-3 text-sm font-semibold text-muted">صفحات مهم</p>
      <ul className="mb-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {SEO_INTERNAL_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-primary-soft transition-colors hover:text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mb-3 text-sm font-semibold text-muted">منابع مفید</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {SEO_EXTERNAL_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-soft transition-colors hover:text-primary"
              {...("lang" in link && link.lang ? { lang: link.lang } : {})}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
