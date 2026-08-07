import { SEO_EXTERNAL_LINKS } from "@/lib/constants";

/** Visible external resource links — improves internal/external link balance in SEO audits. */
export default function SeoExternalLinks() {
  return (
    <nav
      className="seo-external-links container mx-auto border-t border-white/5 px-4 py-6"
      aria-label="منابع مفید"
    >
      <p className="mb-3 text-sm font-semibold text-muted">منابع مفید</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {SEO_EXTERNAL_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-soft transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
