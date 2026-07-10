"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdminEditor from "@/components/admin/AdminEditor";

type Tab = "overview" | "content" | "users" | "messages";

type Overview = {
  stats: {
    users: number;
    messages: number;
    newMessages: number;
    portfolio: number;
    backstage: number;
  };
  users: Array<{
    id: number;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    createdAt: string;
  }>;
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
  { id: "overview", label: "نمای کلی" },
  { id: "content", label: "محتوای سایت" },
  { id: "users", label: "کاربران" },
  { id: "messages", label: "پیام‌های تماس" },
];

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [messages, setMessages] = useState<ContactRow[]>([]);
  const [toast, setToast] = useState("");

  const loadOverview = async () => {
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    if (!res.ok) return;
    setOverview(await res.json());
  };

  const loadMessages = async () => {
    const res = await fetch("/api/contact", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  };

  useEffect(() => {
    loadOverview();
    loadMessages();
  }, []);

  const setMessageStatus = async (id: number, status: ContactRow["status"]) => {
    const res = await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setToast(data.message || "خطا");
      return;
    }
    setMessages(data.messages || []);
    setToast("وضعیت پیام به‌روز شد.");
    loadOverview();
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <DashboardShell
      title="پنل ادمین"
      subtitle="مدیریت محتوا، کاربران و پیام‌ها"
      nav={NAV}
      active={tab}
      onNavigate={(id) => setTab(id as Tab)}
    >
      {toast && <div className="admin-toast">{toast}</div>}

      {tab === "overview" && (
        <section>
          <div className="dash-section-head">
            <h2>نمای کلی</h2>
            <p>خلاصه وضعیت پنل لیوبیز</p>
          </div>
          <div className="dash-stats">
            <article className="lux-card">
              <strong>{overview?.stats.users ?? "—"}</strong>
              <span>کاربر ثبت‌نام‌شده</span>
            </article>
            <article className="lux-card">
              <strong>{overview?.stats.newMessages ?? "—"}</strong>
              <span>پیام جدید</span>
            </article>
            <article className="lux-card">
              <strong>{overview?.stats.portfolio ?? "—"}</strong>
              <span>نمونه کار</span>
            </article>
            <article className="lux-card">
              <strong>{overview?.stats.backstage ?? "—"}</strong>
              <span>بک‌استیج</span>
            </article>
          </div>
        </section>
      )}

      {tab === "content" && <AdminEditor embedded />}

      {tab === "users" && (
        <section>
          <div className="dash-section-head">
            <h2>کاربران</h2>
            <p>حساب‌هایی که از طریق ثبت‌نام ساخته شده‌اند</p>
          </div>
          <div className="dash-table lux-card">
            {(overview?.users || []).length === 0 ? (
              <p className="text-muted">هنوز کاربری ثبت‌نام نکرده است.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>ایمیل</th>
                    <th>تلفن</th>
                    <th>شرکت</th>
                    <th>تاریخ</th>
                  </tr>
                </thead>
                <tbody>
                  {overview?.users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td dir="ltr">{user.email}</td>
                      <td dir="ltr">{user.phone || "—"}</td>
                      <td>{user.company || "—"}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString("fa-IR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {tab === "messages" && (
        <section>
          <div className="dash-section-head">
            <h2>پیام‌های تماس</h2>
            <p>درخواست‌هایی که از صفحه تماس ارسال شده‌اند</p>
          </div>
          <div className="dash-list">
            {messages.length === 0 ? (
              <div className="lux-card text-muted">پیامی ثبت نشده است.</div>
            ) : (
              messages.map((item) => (
                <article key={item.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{item.name}</h3>
                      <p dir="ltr">
                        {item.email} · {item.phone}
                      </p>
                    </div>
                    <span className={`dash-badge status-${item.status}`}>
                      {item.status === "new" ? "جدید" : item.status === "read" ? "خوانده‌شده" : "بسته"}
                    </span>
                  </div>
                  <p className="dash-message-body">{item.message}</p>
                  <div className="dash-message-actions">
                    <button type="button" className="btn-outline" onClick={() => setMessageStatus(item.id, "read")}>
                      خوانده شد
                    </button>
                    <button type="button" className="btn-primary" onClick={() => setMessageStatus(item.id, "closed")}>
                      بستن
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
