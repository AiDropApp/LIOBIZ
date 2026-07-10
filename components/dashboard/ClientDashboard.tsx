"use client";

import { useEffect, useState, type FormEvent } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";

type Tab = "home" | "profile" | "messages";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
};

type ContactRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: "new" | "read" | "closed";
  createdAt: string;
};

const NAV = [
  { id: "home", label: "خانه" },
  { id: "profile", label: "پروفایل" },
  { id: "messages", label: "پیام‌های من" },
];

export default function ClientDashboard() {
  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ContactRow[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [meRes, msgRes] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/contact", { cache: "no-store" }),
    ]);
    if (meRes.ok) {
      const data = await meRes.json();
      setUser(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
      setCompany(data.user.company || "");
    }
    if (msgRes.ok) {
      const data = await msgRes.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.message || "ذخیره ناموفق بود");
        return;
      }
      setUser(data.user);
      setToast("پروفایل ذخیره شد.");
      setTimeout(() => setToast(""), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell
      title="پنل کاربری"
      subtitle={user ? `سلام ${user.name}` : "حساب مشتری لیوبیز"}
      nav={NAV}
      active={tab}
      onNavigate={(id) => setTab(id as Tab)}
    >
      {toast && <div className="admin-toast">{toast}</div>}

      {tab === "home" && (
        <section>
          <div className="dash-section-head">
            <h2>خانه</h2>
            <p>خلاصه وضعیت حساب شما</p>
          </div>
          <div className="dash-stats">
            <article className="lux-card">
              <strong>{messages.length}</strong>
              <span>پیام ثبت‌شده</span>
            </article>
            <article className="lux-card">
              <strong>{messages.filter((m) => m.status === "new").length}</strong>
              <span>در انتظار بررسی</span>
            </article>
            <article className="lux-card">
              <strong>{user?.company || "—"}</strong>
              <span>شرکت / برند</span>
            </article>
          </div>
          <div className="lux-card mt-5">
            <h3 className="mb-2 text-lg font-bold">قدم بعدی</h3>
            <p className="text-muted leading-relaxed">
              از صفحه تماس می‌توانید درخواست پروژه بفرستید. به‌زودی بخش پروژه‌ها و فایل‌های اختصاصی هم به پنل شما اضافه می‌شود.
            </p>
          </div>
        </section>
      )}

      {tab === "profile" && (
        <section>
          <div className="dash-section-head">
            <h2>پروفایل</h2>
            <p>اطلاعات حساب خود را به‌روز کنید</p>
          </div>
          <form className="lux-card contact-form max-w-xl" onSubmit={saveProfile}>
            <label className="contact-field">
              <span>نام</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="contact-field">
              <span>ایمیل</span>
              <input value={user?.email || ""} disabled dir="ltr" />
            </label>
            <label className="contact-field">
              <span>تلفن</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </label>
            <label className="contact-field">
              <span>شرکت / برند</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <button type="submit" className="btn-primary justify-center py-3" disabled={busy}>
              {busy ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </form>
        </section>
      )}

      {tab === "messages" && (
        <section>
          <div className="dash-section-head">
            <h2>پیام‌های من</h2>
            <p>پیام‌هایی که با ایمیل حساب شما ارسال شده‌اند</p>
          </div>
          <div className="dash-list">
            {messages.length === 0 ? (
              <div className="lux-card text-muted">هنوز پیامی ندارید.</div>
            ) : (
              messages.map((item) => (
                <article key={item.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{item.name}</h3>
                      <p>{new Date(item.createdAt).toLocaleString("fa-IR")}</p>
                    </div>
                    <span className={`dash-badge status-${item.status}`}>
                      {item.status === "new" ? "جدید" : item.status === "read" ? "در حال بررسی" : "بسته"}
                    </span>
                  </div>
                  <p className="dash-message-body">{item.message}</p>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
