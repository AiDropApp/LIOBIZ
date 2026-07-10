import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page">در حال بارگذاری...</div>}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
