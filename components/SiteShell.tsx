import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-h-screen w-full overflow-x-clip bg-background text-foreground ${className}`}>
      <Header />
      <main className="pt-[calc(var(--header-h)+1.5rem)]">{children}</main>
      <Footer />
    </div>
  );
}
