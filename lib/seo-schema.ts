import { FAQ_ITEMS, SITE, SOCIAL_LINKS } from "@/lib/constants";

const POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: SITE.streetAddress,
  addressLocality: SITE.addressLocality,
  addressRegion: SITE.addressRegion,
  postalCode: "91879",
  addressCountry: SITE.addressCountry,
};

export function buildOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: "لیوبیز",
    alternateName: "Liobiz",
    url: SITE.url,
    logo: `${SITE.url}/images/logo.png`,
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone.replace(/\s/g, ""),
    address: POSTAL_ADDRESS,
    sameAs: SOCIAL_LINKS.map((link) => link.href),
  };
}

export function buildWebSiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: "لیوبیز",
    alternateName: "Liobiz",
    url: SITE.url,
    description: SITE.description,
    inLanguage: "fa-IR",
    publisher: { "@id": `${SITE.url}/#organization` },
  };
}

export function buildLocalBusinessSchema() {
  return {
    "@type": "LocalBusiness",
    "@id": `${SITE.url}/#localbusiness`,
    name: "لیوبیز",
    alternateName: "Liobiz",
    url: SITE.url,
    image: `${SITE.url}/images/logo.png`,
    description: SITE.description,
    telephone: SITE.phone.replace(/\s/g, ""),
    email: SITE.email,
    address: POSTAL_ADDRESS,
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
    areaServed: { "@type": "City", name: "مشهد" },
    priceRange: "$$",
    parentOrganization: { "@id": `${SITE.url}/#organization` },
  };
}

export function buildFaqSchema() {
  return {
    "@type": "FAQPage",
    "@id": `${SITE.url}/#faq`,
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildSeoJsonLdGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildLocalBusinessSchema(),
      buildFaqSchema(),
    ],
  };
}
