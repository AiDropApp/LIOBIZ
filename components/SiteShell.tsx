import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { readPublicSiteContent } from "@/lib/content-store";

export default async function SiteShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const content = await readPublicSiteContent();

  return (
    <div className={`min-h-screen w-full overflow-x-clip bg-background text-foreground ${className}`}>
      <Header initialLogoUrl={content.site.logoUrl} />
      <main className="pt-[calc(var(--header-h)+1.5rem)]">{children}</main>
      <Footer />
    </div>
  );
}
