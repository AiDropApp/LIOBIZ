import { buildSeoJsonLdGraph } from "@/lib/seo-schema";

export default function SeoJsonLd() {
  const graph = buildSeoJsonLdGraph();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
