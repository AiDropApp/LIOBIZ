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
    <div className={`min-h-screen bg-dark text-white ${className}`}>
      <Header />
      <main className="pt-28 lg:pt-32">{children}</main>
      <Footer />
    </div>
  );
}
