import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
        <p className="mb-2 text-sm font-semibold text-primary">۴۰۴</p>
        <h1 className="mb-3 text-3xl font-extrabold">صفحه پیدا نشد</h1>
        <p className="mb-8 max-w-md text-muted">
          آدرس واردشده وجود ندارد یا جابه‌جا شده است.
        </p>
        <Link href="/" className="btn-primary px-8 py-3.5">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </SiteShell>
  );
}
