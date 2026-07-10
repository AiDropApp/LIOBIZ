import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import "./auth.css";
import "./admin.css";
import { SITE } from "@/lib/constants";
import PwaRegister from "@/components/PwaRegister";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "لیوبیز",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} font-vazir`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
