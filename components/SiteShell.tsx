import { cookies } from "next/headers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CmsEditShell from "@/components/cms-edit/CmsEditShell";
import { defaultLanding } from "@/lib/cms-defaults";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth-session";
import { readPublicSiteContent } from "@/lib/content-store";

export default async function SiteShell({
  children,
  className = "",
  mainClassName = "pt-[calc(var(--header-h)+1.5rem)]",
}: {
  children: React.ReactNode;
  className?: string;
  /** empty string for full-bleed home hero */
  mainClassName?: string;
}) {
  const content = await readPublicSiteContent();
  const landing = { ...defaultLanding, ...content.landing };
  const session = parseAuthCookie((await cookies()).get(AUTH_COOKIE)?.value);
  const initialIsAdmin = session?.role === "admin";

  return (
    <CmsEditShell initialLanding={landing} initialIsAdmin={initialIsAdmin} initialContent={content}>
      <div className={`min-h-screen w-full overflow-x-clip bg-background text-foreground ${className}`}>
        <Header initialLogoUrl={content.site.logoUrl} />
        <main className={mainClassName}>{children}</main>
        <Footer />
      </div>
    </CmsEditShell>
  );
}
