"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Palette,
  Images,
  ShoppingBag,
  MessageSquare,
  Users,
  Mail,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AdminEditor from "@/components/admin/AdminEditor";
import AdminCmsEditor from "@/components/admin/AdminCmsEditor";

type Tab =
  | "overview"
  | "cms"
  | "content"
  | "users"
  | "orders"
  | "tickets"
  | "messages";

type UserRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  blocked: boolean;
  createdAt: string;
};

type Overview = {
  stats: {
    users: number;
    messages: number;
    newMessages: number;
    portfolio: number;
    backstage: number;
    orders?: number;
    newOrders?: number;
    tickets?: number;
    openTickets?: number;
  };
  users?: UserRow[];
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

type OrderRow = {
  id: number;
  title: string;
  service: string;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
  files?: Array<{ id: number; fileName: string; fileUrl: string; kind: string }>;
};

type TicketRow = {
  id: number;
  subject: string;
  status: string;
  updatedAt: string;
  user?: { name: string; email: string } | null;
  messages?: Array<{ id: number; body: string; senderRole: string; createdAt: string }>;
};

const NAV = [
  { id: "overview", label: "نمای کلی", icon: LayoutDashboard },
  { id: "cms", label: "صفحات و ظاهر", icon: Palette },
  { id: "content", label: "نمونه کار / بک‌استیج", icon: Images },
  { id: "orders", label: "سفارش‌ها", icon: ShoppingBag },
  { id: "tickets", label: "تیکت‌ها", icon: MessageSquare },
  { id: "users", label: "کاربران", icon: Users },
  { id: "messages", label: "پیام‌های تماس", icon: Mail },
];

const ORDER_STATUS: Record<string, string> = {
  new: "جدید",
  review: "بررسی",
  in_progress: "در حال انجام",
  completed: "تکمیل",
  cancelled: "لغو",
};

const TICKET_STATUS: Record<string, string> = {
  open: "باز",
  answered: "پاسخ‌داده‌شده",
  closed: "بسته",
};

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [messages, setMessages] = useState<ContactRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [reply, setReply] = useState<Record<number, string>>({});
  const [toast, setToast] = useState("");

  const flash = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(""), 2200);
  };

  const loadOverview = async () => {
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as Overview;
    setOverview(data);
    // Keep users list in sync with overview when users API is empty/unavailable
    if (Array.isArray(data.users) && data.users.length > 0) {
      setUsers((prev) => (prev.length === 0 ? data.users! : prev));
    }
  };

  const loadUsers = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) {
      flash("بارگذاری کاربران ناموفق بود");
      // Fallback: reuse overview payload if available
      await loadOverview();
      return;
    }
    const data = await res.json();
    const list = Array.isArray(data.users) ? data.users : [];
    setUsers(list);
    if (list.length === 0) {
      // Second chance via overview (same DB source)
      const ov = await fetch("/api/admin/overview", { cache: "no-store" });
      if (ov.ok) {
        const od = (await ov.json()) as Overview;
        setOverview(od);
        if (Array.isArray(od.users)) setUsers(od.users);
      }
    }
  };

  const loadMessages = async () => {
    const res = await fetch("/api/contact", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  };

  const loadOrders = async () => {
    const res = await fetch("/api/orders", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const loadTickets = async () => {
    const res = await fetch("/api/tickets", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setTickets(data.tickets || []);
  };

  useEffect(() => {
    loadOverview();
    loadMessages();
    loadUsers();
    loadOrders();
    loadTickets();
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
    if (tab === "orders") loadOrders();
    if (tab === "tickets") loadTickets();
    if (tab === "messages") loadMessages();
    if (tab === "overview") loadOverview();
  }, [tab]);

  const setMessageStatus = async (id: number, status: ContactRow["status"]) => {
    const res = await fetch("/api/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) return flash(data.message || "خطا");
    setMessages(data.messages || []);
    flash("وضعیت پیام به‌روز شد.");
    loadOverview();
  };

  const toggleBlock = async (id: number, blocked: boolean) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, blocked }),
    });
    if (!res.ok) return flash("خطا در تغییر وضعیت کاربر");
    flash(blocked ? "کاربر مسدود شد." : "مسدودیت برداشته شد.");
    loadUsers();
  };

  const deleteUser = async (id: number) => {
    if (!confirm("حذف این کاربر قطعی است. ادامه می‌دهید؟")) return;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return flash("حذف ناموفق بود");
    flash("کاربر حذف شد.");
    loadUsers();
    loadOverview();
  };

  const updateOrder = async (id: number, status: string) => {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) return flash("به‌روزرسانی سفارش ناموفق بود");
    flash("وضعیت سفارش ذخیره شد.");
    loadOrders();
  };

  const uploadDelivery = async (orderId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "delivery");
    form.append("orderId", String(orderId));
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) return flash(data.message || "آپلود ناموفق");
    flash("فایل تحویل آپلود شد.");
    loadOrders();
  };

  const replyTicket = async (id: number) => {
    const message = (reply[id] || "").trim();
    if (!message) return;
    const res = await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message }),
    });
    if (!res.ok) return flash("ارسال پاسخ ناموفق بود");
    setReply((v) => ({ ...v, [id]: "" }));
    flash("پاسخ ارسال شد.");
    loadTickets();
  };

  return (
    <DashboardShell
      title="پنل ادمین"
      subtitle="مدیریت محتوا، کاربران، سفارش‌ها و تیکت‌ها"
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
              <span>کاربر</span>
            </article>
            <article className="lux-card">
              <strong>{overview?.stats.newOrders ?? orders.filter((o) => o.status === "new").length}</strong>
              <span>سفارش جدید</span>
            </article>
            <article className="lux-card">
              <strong>{overview?.stats.newMessages ?? "—"}</strong>
              <span>پیام جدید</span>
            </article>
            <article className="lux-card">
              <strong>{overview?.stats.openTickets ?? tickets.filter((t) => t.status === "open").length}</strong>
              <span>تیکت باز</span>
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

      {tab === "cms" && <AdminCmsEditor />}
      {tab === "content" && <AdminEditor embedded />}

      {tab === "orders" && (
        <section>
          <div className="dash-section-head">
            <h2>سفارش‌ها</h2>
            <p>درخواست‌های همکاری کاربران</p>
          </div>
          <div className="dash-list">
            {orders.length === 0 ? (
              <div className="lux-card text-muted">سفارشی ثبت نشده است.</div>
            ) : (
              orders.map((order) => (
                <article key={order.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{order.title}</h3>
                      <p>
                        {order.user?.name || "کاربر"} · {order.service} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                    <span className="dash-badge">{ORDER_STATUS[order.status] || order.status}</span>
                  </div>
                  <p className="dash-message-body">{order.description}</p>
                  <div className="dash-message-actions flex-wrap">
                    {Object.keys(ORDER_STATUS).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="btn-outline"
                        onClick={() => updateOrder(order.id, status)}
                      >
                        {ORDER_STATUS[status]}
                      </button>
                    ))}
                    <label className="btn-primary cursor-pointer">
                      آپلود فایل تحویل
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadDelivery(order.id, file);
                        }}
                      />
                    </label>
                  </div>
                  {!!order.files?.length && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {order.files.map((f) => (
                        <li key={f.id}>
                          <a href={f.fileUrl} className="text-primary" target="_blank" rel="noreferrer">
                            {f.fileName} ({f.kind})
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
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
            <p>گفتگو با کاربران</p>
          </div>
          <div className="dash-list">
            {tickets.length === 0 ? (
              <div className="lux-card text-muted">تیکتی نیست.</div>
            ) : (
              tickets.map((ticket) => (
                <article key={ticket.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{ticket.subject}</h3>
                      <p>{ticket.user?.name || "کاربر"}</p>
                    </div>
                    <span className="dash-badge">{TICKET_STATUS[ticket.status] || ticket.status}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {(ticket.messages || []).map((m) => (
                      <p key={m.id} className="rounded-lg bg-black/5 p-2">
                        <strong>{m.senderRole === "admin" ? "ادمین" : "کاربر"}:</strong> {m.body}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="flex-1 rounded-lg border px-3 py-2"
                      placeholder="پاسخ ادمین..."
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

      {tab === "users" && (
        <section>
          <div className="dash-section-head">
            <h2>کاربران</h2>
            <p>مسدودسازی، فعال‌سازی و حذف کاربران</p>
          </div>
          <div className="dash-table lux-card">
            {users.length === 0 ? (
              <p className="text-muted">هنوز کاربری ثبت‌نام نکرده است.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>ایمیل</th>
                    <th>تلفن</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td dir="ltr">{user.email}</td>
                      <td dir="ltr">{user.phone || "—"}</td>
                      <td>{user.blocked ? "مسدود" : "فعال"}</td>
                      <td className="space-x-2 space-x-reverse">
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => toggleBlock(user.id, !user.blocked)}
                        >
                          {user.blocked ? "رفع مسدودی" : "مسدود"}
                        </button>
                        <button type="button" className="btn-primary" onClick={() => deleteUser(user.id)}>
                          حذف
                        </button>
                      </td>
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
