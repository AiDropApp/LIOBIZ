import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-page">در حال بارگذاری...</div>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
