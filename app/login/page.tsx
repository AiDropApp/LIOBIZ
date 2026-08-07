import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "ورود | لیوبیز",
  description: "ورود به حساب کاربری لیوبیز",
  pathname: "/login",
  robots: { index: false, follow: false },
});

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page">در حال بارگذاری...</div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
