import Link from "next/link";
import { SEO_INTERNAL_LINKS } from "@/lib/constants";

/** Visible internal links block — helps crawlers and audit internal/external link balance. */
export default function SeoInternalLinks() {
  return (
    <nav
      className="seo-internal-links container mx-auto px-4 py-6"
      aria-label="صفحات مهم سایت"
    >
      <p className="mb-3 text-sm font-semibold text-muted">صفحات مهم لیوبیز</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {SEO_INTERNAL_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-primary transition-colors hover:text-primary/80">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
