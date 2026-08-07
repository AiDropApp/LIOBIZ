import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { SEO_OG_IMAGE } from "@/lib/seo";
import SeoJsonLd from "@/components/SeoJsonLd";
import SeoKeywordsMeta from "@/components/SeoKeywordsMeta";
import DeferredAnalytics from "@/components/DeferredAnalytics";
import PwaBoot from "@/components/PwaBoot";
import PwaRegister from "@/components/PwaRegister";
import ThemeProvider from "@/components/ThemeProvider";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  alternates: {
    canonical: SITE.url,
  },
  manifest: "/manifest.json",
  applicationName: "لیوبیز",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "لیوبیز",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: SITE.url,
    siteName: "لیوبیز",
    title: SITE.title,
    description: SITE.description,
    images: [{ url: SEO_OG_IMAGE, width: 512, height: 512, alt: "لیوبیز" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: [SEO_OG_IMAGE],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  verification: {
    google: "googlef7e58775fcd4e139",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF4D24" },
    { media: "(prefers-color-scheme: dark)", color: "#FF4D24" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") || undefined;

  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth">
      <head>
        <meta charSet="utf-8" />
        <SeoKeywordsMeta />
      </head>
      <body className={`${vazirmatn.variable} font-vazir`}>
        <SeoJsonLd />
        <DeferredAnalytics nonce={nonce} />
        <PwaBoot nonce={nonce} />
        <ThemeProvider>{children}</ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
