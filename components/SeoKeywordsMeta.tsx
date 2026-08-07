import { SEO_KEYWORDS } from "@/lib/constants";

/** Classic meta keywords tag — some audit tools miss Next.js Metadata API output. */
export default function SeoKeywordsMeta() {
  const content = SEO_KEYWORDS.join(", ");
  return <meta name="keywords" content={content} />;
}
