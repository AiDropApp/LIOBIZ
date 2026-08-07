"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

type Mode = "login" | "register";

function safeNextPath(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.startsWith("/login") || raw.startsWith("/register")) return null;
  return raw;
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLogin = mode === "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => (isLogin ? "ورود به لیوبیز" : "ساخت حساب کاربری"), [isLogin]);
  const subtitle = useMemo(
    () =>
      isLogin
        ? "وارد حساب خود شوید تا به پنل ادمین یا داشبورد کاربری دسترسی بگیرید."
        : "ثبت‌نام کنید تا داشبورد اختصاصی خود را داشته باشید.",
    [isLogin],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "خطایی رخ داد.");
        return;
      }

      const next = safeNextPath(searchParams.get("next"));
      const fallback = data.redirect || (data.user?.role === "admin" ? "/admin" : "/dashboard");
      // Only honor next if it matches the user's role destination family
      let dest = fallback;
      if (next) {
        if (data.user?.role === "admin" && next.startsWith("/admin")) dest = next;
        else if (data.user?.role === "client" && next.startsWith("/dashboard")) dest = next;
        else if (data.user?.role === "admin" && next.startsWith("/dashboard")) dest = next;
      }

      router.push(dest);
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-top">
          <div className="auth-logo-wrap">
            <Logo width={140} />
          </div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {!isLogin && (
            <label className="auth-field">
              <span>نام</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>ایمیل</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              dir="ltr"
              autoComplete="email"
            />
          </label>

          <label className="auth-field">
            <span>رمز عبور</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              dir="ltr"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? "لطفاً صبر کنید..." : isLogin ? "ورود" : "ثبت‌نام و ورود"}
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-switch">
            {isLogin ? (
              <>
                حساب ندارید؟ <Link href="/register">ثبت‌نام</Link>
              </>
            ) : (
              <>
                قبلاً ثبت‌نام کرده‌اید؟ <Link href="/login">ورود</Link>
              </>
            )}
          </div>
          <Link href="/" className="auth-back">
            بازگشت به لندینگ
          </Link>
        </div>
      </div>
    </div>
  );
}
