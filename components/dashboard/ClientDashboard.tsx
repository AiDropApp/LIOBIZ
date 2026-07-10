"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SERVICES } from "@/lib/constants";

type Tab = "home" | "profile" | "orders" | "tickets" | "files" | "notifications";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
};

type OrderRow = {
  id: number;
  title: string;
  service: string;
  description: string;
  status: string;
  createdAt: string;
  files?: Array<{ id: number; fileName: string; fileUrl: string; kind: string }>;
};

type TicketRow = {
  id: number;
  subject: string;
  status: string;
  messages?: Array<{ id: number; body: string; senderRole: string; createdAt: string }>;
};

type Notif = {
  id: number;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

const NAV = [
  { id: "home", label: "خانه" },
  { id: "orders", label: "سفارش‌ها" },
  { id: "tickets", label: "تیکت‌ها" },
  { id: "files", label: "فایل‌ها" },
  { id: "notifications", label: "اعلان‌ها" },
  { id: "profile", label: "پروفایل" },
];

const ORDER_STATUS: Record<string, string> = {
  new: "جدید",
  review: "در حال بررسی",
  in_progress: "در حال انجام",
  completed: "تکمیل‌شده",
  cancelled: "لغو شده",
};

const TICKET_STATUS: Record<string, string> = {
  open: "باز",
  answered: "پاسخ‌داده‌شده",
  closed: "بسته",
};

export default function ClientDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  const [orderForm, setOrderForm] = useState({
    title: "",
    service: SERVICES[0]?.title || "برندینگ",
    description: "",
    budget: "",
  });
  const [ticketForm, setTicketForm] = useState({ subject: "", message: "" });
  const [reply, setReply] = useState<Record<number, string>>({});

  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  const load = async () => {
    const [meRes, orderRes, ticketRes, notifRes] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/orders", { cache: "no-store" }),
      fetch("/api/tickets", { cache: "no-store" }),
      fetch("/api/notifications", { cache: "no-store" }),
    ]);
    if (!meRes.ok) {
      router.push("/login?next=/dashboard");
      return;
    }
    if (meRes.ok) {
      const data = await meRes.json();
      setUser(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
      setCompany(data.user.company || "");
    }
    if (orderRes.ok) {
      const data = await orderRes.json();
      setOrders(data.orders || []);
    }
    if (ticketRes.ok) {
      const data = await ticketRes.json();
      setTickets(data.tickets || []);
    }
    if (notifRes.ok) {
      const data = await notifRes.json();
      setNotifications(data.notifications || []);
    }
    setBootstrapping(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (!res.ok) return flash(data.message || "ذخیره ناموفق بود");
      setUser(data.user);
      flash("پروفایل ذخیره شد.");
    } finally {
      setBusy(false);
    }
  };

  const createOrder = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderForm),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.message || "ثبت سفارش ناموفق بود");
      setOrderForm({ title: "", service: SERVICES[0]?.title || "برندینگ", description: "", budget: "" });
      flash("سفارش ثبت شد.");
      load();
      setTab("orders");
    } finally {
      setBusy(false);
    }
  };

  const createTicket = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      });
      const data = await res.json();
      if (!res.ok) return flash(data.message || "ثبت تیکت ناموفق بود");
      setTicketForm({ subject: "", message: "" });
      flash("تیکت ثبت شد.");
      load();
    } finally {
      setBusy(false);
    }
  };

  const replyTicket = async (id: number) => {
    const message = (reply[id] || "").trim();
    if (!message) return;
    const res = await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message }),
    });
    if (!res.ok) return flash("ارسال ناموفق بود");
    setReply((v) => ({ ...v, [id]: "" }));
    flash("پیام ارسال شد.");
    load();
  };

  const markNotif = async (id?: number) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    load();
  };

  const allFiles = orders.flatMap((o) =>
    (o.files || [])
      .filter((f) => f.kind === "delivery")
      .map((f) => ({ ...f, orderTitle: o.title })),
  );

  if (bootstrapping) {
    return <div className="dash-loading">در حال بارگذاری پنل...</div>;
  }

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
              <strong>{orders.length}</strong>
              <span>سفارش</span>
            </article>
            <article className="lux-card">
              <strong>{tickets.filter((t) => t.status !== "closed").length}</strong>
              <span>تیکت فعال</span>
            </article>
            <article className="lux-card">
              <strong>{notifications.filter((n) => !n.read).length}</strong>
              <span>اعلان خوانده‌نشده</span>
            </article>
          </div>
          <div className="lux-card mt-5">
            <h3 className="mb-2 text-lg font-bold">ثبت سفارش جدید</h3>
            <form className="contact-form" onSubmit={createOrder}>
              <input
                placeholder="عنوان پروژه"
                value={orderForm.title}
                onChange={(e) => setOrderForm((v) => ({ ...v, title: e.target.value }))}
                required
              />
              <select
                value={orderForm.service}
                onChange={(e) => setOrderForm((v) => ({ ...v, service: e.target.value }))}
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                placeholder="توضیحات نیاز شما"
                value={orderForm.description}
                onChange={(e) => setOrderForm((v) => ({ ...v, description: e.target.value }))}
                required
              />
              <input
                placeholder="بودجه تقریبی (اختیاری)"
                value={orderForm.budget}
                onChange={(e) => setOrderForm((v) => ({ ...v, budget: e.target.value }))}
              />
              <button type="submit" className="btn-primary justify-center py-3" disabled={busy}>
                ثبت سفارش
              </button>
            </form>
          </div>
        </section>
      )}

      {tab === "orders" && (
        <section>
          <div className="dash-section-head">
            <h2>سفارش‌های من</h2>
            <p>پیگیری وضعیت پروژه‌ها</p>
          </div>
          <div className="dash-list">
            {orders.length === 0 ? (
              <div className="lux-card text-muted">هنوز سفارشی ندارید.</div>
            ) : (
              orders.map((order) => (
                <article key={order.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{order.title}</h3>
                      <p>
                        {order.service} · {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                    <span className="dash-badge">{ORDER_STATUS[order.status] || order.status}</span>
                  </div>
                  <p className="dash-message-body">{order.description}</p>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "tickets" && (
        <section>
          <div className="dash-section-head">
            <h2>تیکت‌ها</h2>
            <p>گفتگو با پشتیبانی لیوبیز</p>
          </div>
          <form className="lux-card contact-form mb-5" onSubmit={createTicket}>
            <input
              placeholder="موضوع"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm((v) => ({ ...v, subject: e.target.value }))}
              required
            />
            <textarea
              rows={3}
              placeholder="پیام شما"
              value={ticketForm.message}
              onChange={(e) => setTicketForm((v) => ({ ...v, message: e.target.value }))}
              required
            />
            <button type="submit" className="btn-primary justify-center py-3" disabled={busy}>
              ثبت تیکت
            </button>
          </form>
          <div className="dash-list">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="lux-card dash-message">
                <div className="dash-message-top">
                  <h3>{ticket.subject}</h3>
                  <span className="dash-badge">{TICKET_STATUS[ticket.status] || ticket.status}</span>
                </div>
                <div className="space-y-2 text-sm">
                  {(ticket.messages || []).map((m) => (
                    <p key={m.id} className="rounded-lg bg-black/5 p-2">
                      <strong>{m.senderRole === "admin" ? "پشتیبانی" : "شما"}:</strong> {m.body}
                    </p>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 rounded-lg border px-3 py-2"
                    placeholder="پاسخ شما..."
                    value={reply[ticket.id] || ""}
                    onChange={(e) => setReply((v) => ({ ...v, [ticket.id]: e.target.value }))}
                  />
                  <button type="button" className="btn-primary" onClick={() => replyTicket(ticket.id)}>
                    ارسال
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === "files" && (
        <section>
          <div className="dash-section-head">
            <h2>فایل‌های تحویل</h2>
            <p>فایل‌هایی که تیم لیوبیز برای سفارش‌های شما آپلود کرده</p>
          </div>
          <div className="dash-list">
            {allFiles.length === 0 ? (
              <div className="lux-card text-muted">فایلی موجود نیست.</div>
            ) : (
              allFiles.map((f) => (
                <article key={f.id} className="lux-card dash-message">
                  <h3>{f.fileName}</h3>
                  <p className="text-muted">سفارش: {f.orderTitle}</p>
                  <a href={f.fileUrl} className="btn-primary mt-3 inline-flex" target="_blank" rel="noreferrer">
                    دانلود
                  </a>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {tab === "notifications" && (
        <section>
          <div className="dash-section-head flex items-center justify-between gap-3">
            <div>
              <h2>اعلان‌ها</h2>
              <p>آخرین به‌روزرسانی‌ها</p>
            </div>
            <button type="button" className="btn-outline" onClick={() => markNotif()}>
              همه خوانده شد
            </button>
          </div>
          <div className="dash-list">
            {notifications.length === 0 ? (
              <div className="lux-card text-muted">اعلانی نیست.</div>
            ) : (
              notifications.map((n) => (
                <article
                  key={n.id}
                  className={`lux-card dash-message ${n.read ? "opacity-70" : ""}`}
                  onClick={() => markNotif(n.id)}
                >
                  <h3>{n.title}</h3>
                  <p className="dash-message-body">{n.body}</p>
                  <small className="text-muted">{new Date(n.createdAt).toLocaleString("fa-IR")}</small>
                </article>
              ))
            )}
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
    </DashboardShell>
  );
}
