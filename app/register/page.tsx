import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "ثبت‌نام | لیوبیز",
  description: "ثبت‌نام در لیوبیز",
  pathname: "/register",
  robots: { index: false, follow: false },
});

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-page">در حال بارگذاری...</div>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
