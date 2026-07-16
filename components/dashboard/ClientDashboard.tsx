"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  ShoppingBag,
  MessageSquare,
  FolderOpen,
  Bell,
  UserRound,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SERVICES } from "@/lib/constants";
import {
  ORDER_STATUS_CLIENT,
  TICKET_STATUS_LABELS,
  ORDER_FLOW,
  orderBadgeClass,
  ticketBadgeClass,
  orderProgressIndex,
} from "@/lib/dashboard-ui";

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
  { id: "home", label: "خانه", icon: Home },
  { id: "orders", label: "سفارش‌ها", icon: ShoppingBag },
  { id: "tickets", label: "تیکت‌ها", icon: MessageSquare },
  { id: "files", label: "فایل‌ها", icon: FolderOpen },
  { id: "notifications", label: "اعلان‌ها", icon: Bell },
  { id: "profile", label: "پروفایل", icon: UserRound },
];

const ORDER_STATUS = ORDER_STATUS_CLIENT;
const TICKET_STATUS = TICKET_STATUS_LABELS;

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
    } else if (orderRes.status === 401) {
      flash("نشست منقضی شده؛ دوباره وارد شوید.");
    }
    if (ticketRes.ok) {
      const data = await ticketRes.json();
      setTickets(data.tickets || []);
    } else if (ticketRes.status === 401) {
      flash("نشست منقضی شده؛ دوباره وارد شوید.");
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
      await load();
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
      await load();
      setTab("tickets");
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

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const activeTickets = tickets.filter((t) => t.status !== "closed").length;

  const navWithBadges = NAV.map((item) => {
    if (item.id === "notifications") return { ...item, badge: unreadNotifs };
    if (item.id === "tickets") return { ...item, badge: activeTickets };
    return item;
  });

  return (
    <DashboardShell
      title="پنل کاربری"
      subtitle={user ? `سلام ${user.name}` : "حساب مشتری لیوبیز"}
      nav={navWithBadges}
      active={tab}
      onNavigate={(id) => setTab(id as Tab)}
      variant="client"
    >
      {toast && <div className="admin-toast">{toast}</div>}

      {tab === "home" && (
        <section>
          <div className="dash-hero">
            <h2>{user ? `سلام ${user.name}، خوش آمدید` : "پنل کاربری لیوبیز"}</h2>
            <p>
              از اینجا سفارش جدید ثبت کنید، وضعیت پروژه‌ها را ببینید و با پشتیبانی گفتگو کنید.
            </p>
            <div className="dash-hero-meta">
              <span className="dash-hero-chip">{orders.length} سفارش</span>
              <span className="dash-hero-chip">{activeTickets} تیکت فعال</span>
              <span className="dash-hero-chip">{unreadNotifs} اعلان جدید</span>
            </div>
          </div>
          <div className="dash-stats">
            <article className="dash-stat-card">
              <span className="dash-stat-icon">
                <ShoppingBag size={18} />
              </span>
              <strong>{orders.length}</strong>
              <span>سفارش</span>
            </article>
            <article className="dash-stat-card">
              <span className="dash-stat-icon">
                <MessageSquare size={18} />
              </span>
              <strong>{activeTickets}</strong>
              <span>تیکت فعال</span>
            </article>
            <article className="dash-stat-card">
              <span className="dash-stat-icon">
                <Bell size={18} />
              </span>
              <strong>{unreadNotifs}</strong>
              <span>اعلان خوانده‌نشده</span>
            </article>
          </div>
          <div className="lux-card mt-5">
            <h3 className="mb-2 text-lg font-bold">ثبت سفارش جدید</h3>
            <p className="mb-4 text-sm text-muted">نیاز پروژه خود را توضیح دهید تا تیم لیوبیز بررسی کند.</p>
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
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <ShoppingBag size={22} />
                </span>
                <h3>هنوز سفارشی ندارید</h3>
                <p>از تب خانه یک درخواست همکاری جدید ثبت کنید.</p>
                <button type="button" className="btn-primary mt-2" onClick={() => setTab("home")}>
                  ثبت سفارش
                </button>
              </div>
            ) : (
              orders.map((order) => {
                const progress = orderProgressIndex(order.status);
                return (
                  <article key={order.id} className="lux-card dash-message">
                    <div className="dash-message-top">
                      <div>
                        <h3>{order.title}</h3>
                        <p>
                          {order.service} · {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                        </p>
                      </div>
                      <span className={orderBadgeClass(order.status)}>
                        {ORDER_STATUS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="dash-message-body">{order.description}</p>
                    {order.status !== "cancelled" && (
                      <div className="dash-progress" aria-label="پیشرفت سفارش">
                        {ORDER_FLOW.map((step, index) => (
                          <span
                            key={step}
                            className={`dash-progress-step ${
                              index < progress ? "is-done" : index === progress ? "is-current" : ""
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })
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
            {tickets.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <MessageSquare size={22} />
                </span>
                <h3>تیکتی ثبت نشده</h3>
                <p>برای سوال یا پیگیری، یک تیکت جدید بسازید.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <article key={ticket.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <h3>{ticket.subject}</h3>
                    <span className={ticketBadgeClass(ticket.status)}>
                      {TICKET_STATUS[ticket.status] || ticket.status}
                    </span>
                  </div>
                  <div className="dash-chat">
                    {(ticket.messages || []).map((m) => (
                      <div
                        key={m.id}
                        className={`dash-chat-bubble ${m.senderRole === "admin" ? "is-admin" : "is-user"}`}
                      >
                        <span className="dash-chat-meta">
                          {m.senderRole === "admin" ? "پشتیبانی" : "شما"} ·{" "}
                          {new Date(m.createdAt).toLocaleString("fa-IR")}
                        </span>
                        {m.body}
                      </div>
                    ))}
                  </div>
                  <div className="dash-reply-row">
                    <input
                      placeholder="پاسخ شما..."
                      value={reply[ticket.id] || ""}
                      onChange={(e) => setReply((v) => ({ ...v, [ticket.id]: e.target.value }))}
                    />
                    <button type="button" className="btn-primary" onClick={() => replyTicket(ticket.id)}>
                      ارسال
                    </button>
                  </div>
                </article>
              ))
            )}
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
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <FolderOpen size={22} />
                </span>
                <h3>فایلی موجود نیست</h3>
                <p>پس از تکمیل سفارش، فایل‌های تحویل اینجا قرار می‌گیرند.</p>
              </div>
            ) : (
              allFiles.map((f) => (
                <article key={f.id} className="lux-card dash-message">
                  <div className="dash-file-card">
                    <span className="dash-file-icon">
                      <FolderOpen size={18} />
                    </span>
                    <div>
                      <h3>{f.fileName}</h3>
                      <p className="text-muted">سفارش: {f.orderTitle}</p>
                    </div>
                  </div>
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
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <Bell size={22} />
                </span>
                <h3>اعلانی نیست</h3>
                <p>به‌روزرسانی‌های سفارش و تیکت اینجا نمایش داده می‌شود.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <article
                  key={n.id}
                  className={`lux-card dash-message ${n.read ? "opacity-70" : "dash-notif-unread"}`}
                  onClick={() => markNotif(n.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") markNotif(n.id);
                  }}
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
            <div className="dash-profile-avatar" aria-hidden="true">
              {(user?.name || "؟").charAt(0)}
            </div>
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
