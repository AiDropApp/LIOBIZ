"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Layout,
  BookOpen,
  ShoppingBag,
  MessageSquare,
  Users,
  Mail,
  UserPlus,
  Inbox,
  Ticket,
  Shield,
  Cloud,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashQuickCard from "@/components/dashboard/DashQuickCard";
import DashStatCard from "@/components/dashboard/DashStatCard";
import CountUp from "@/components/dashboard/CountUp";
import AdminLandingEditor from "@/components/admin/AdminLandingEditor";
import AdminBlogEditor from "@/components/admin/AdminBlogEditor";
import AdminBackupPanel from "@/components/admin/AdminBackupPanel";
import AdminMediaCenter from "@/components/admin/AdminMediaCenter";
import {
  ORDER_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  orderBadgeClass,
  ticketBadgeClass,
} from "@/lib/dashboard-ui";

type Tab =
  | "overview"
  | "landing"
  | "blog"
  | "orders"
  | "tickets"
  | "users"
  | "messages"
  | "backup"
  | "media";

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
  { id: "landing", label: "مدیریت لندینگ", icon: Layout },
  { id: "blog", label: "بلاگ", icon: BookOpen },
  { id: "orders", label: "سفارش‌ها", icon: ShoppingBag },
  { id: "tickets", label: "تیکت‌ها", icon: MessageSquare },
  { id: "users", label: "کاربران", icon: Users },
  { id: "messages", label: "پیام‌های تماس", icon: Mail },
  { id: "media", label: "رسانه", icon: Cloud },
  { id: "backup", label: "بک‌آپ", icon: Shield },
];

const ORDER_STATUS = ORDER_STATUS_LABELS;
const TICKET_STATUS = TICKET_STATUS_LABELS;

type OrderFilter = "all" | keyof typeof ORDER_STATUS;
type MessageFilter = "all" | ContactRow["status"];

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [messages, setMessages] = useState<ContactRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [reply, setReply] = useState<Record<number, string>>({});
  const [toast, setToast] = useState("");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [messageFilter, setMessageFilter] = useState<MessageFilter>("all");
  const [userQuery, setUserQuery] = useState("");

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

  const newOrders = overview?.stats.newOrders ?? orders.filter((o) => o.status === "new").length;
  const openTickets = overview?.stats.openTickets ?? tickets.filter((t) => t.status === "open").length;
  const newMessages = overview?.stats.newMessages ?? messages.filter((m) => m.status === "new").length;

  const navWithBadges = NAV.map((item) => {
    if (item.id === "orders") return { ...item, badge: newOrders };
    if (item.id === "tickets") return { ...item, badge: openTickets };
    if (item.id === "messages") return { ...item, badge: newMessages };
    return item;
  });

  const filteredOrders =
    orderFilter === "all" ? orders : orders.filter((order) => order.status === orderFilter);

  const filteredMessages =
    messageFilter === "all" ? messages : messages.filter((item) => item.status === messageFilter);

  const filteredUsers = users.filter((user) => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.phone || "").includes(q)
    );
  });

  const recentOrders = [...orders].slice(0, 4);
  const recentMessages = [...messages].slice(0, 4);

  return (
    <DashboardShell
      title="پنل ادمین"
      subtitle="مدیریت محتوا، کاربران، سفارش‌ها و تیکت‌ها"
      nav={navWithBadges}
      active={tab}
      onNavigate={(id) => setTab(id as Tab)}
      variant="admin"
    >
      {toast && <div className="admin-toast">{toast}</div>}

      {tab === "overview" && (
        <section className="dash-overview">
          <div className="dash-hero">
            <h2>سلام، به پنل مدیریت لیوبیز خوش آمدید</h2>
            <p>
              از اینجا می‌توانید لندینگ، سفارش‌ها، تیکت‌ها و پیام‌های تماس را مدیریت کنید. وضعیت
              امروز را در یک نگاه ببینید.
            </p>
            <div className="dash-hero-meta">
              <span className="dash-hero-chip">
                <CountUp value={overview?.stats.users ?? users.length} duration={700} /> کاربر
              </span>
              <span className="dash-hero-chip">
                <CountUp value={newOrders} duration={700} /> سفارش جدید
              </span>
              <span className="dash-hero-chip">
                <CountUp value={openTickets} duration={700} /> تیکت باز
              </span>
            </div>
          </div>

          <div className="dash-stats">
            <DashStatCard
              seed="users"
              icon={Users}
              label="کاربر"
              value={overview?.stats.users}
              onClick={() => setTab("users")}
            />
            <DashStatCard
              seed="new-orders"
              icon={ShoppingBag}
              label="سفارش جدید"
              value={newOrders}
              onClick={() => setTab("orders")}
            />
            <DashStatCard
              seed="new-messages"
              icon={Inbox}
              label="پیام جدید"
              value={newMessages}
              onClick={() => setTab("messages")}
            />
            <DashStatCard
              seed="open-tickets"
              icon={Ticket}
              label="تیکت باز"
              value={openTickets}
              onClick={() => setTab("tickets")}
            />
            <DashStatCard
              seed="portfolio"
              icon={Layout}
              label="نمونه کار"
              value={overview?.stats.portfolio}
              onClick={() => setTab("landing")}
            />
            <DashStatCard
              seed="backstage"
              icon={LayoutDashboard}
              label="بک‌استیج"
              value={overview?.stats.backstage}
              onClick={() => setTab("landing")}
            />
          </div>

          <div className="dash-quick-grid">
            <DashQuickCard
              icon={Layout}
              title="مدیریت لندینگ"
              description="ویرایش هیرو، پلن‌ها، FAQ و بیشتر"
              onClick={() => setTab("landing")}
            />
            <DashQuickCard
              icon={ShoppingBag}
              title="سفارش‌ها"
              description="تغییر وضعیت و آپلود فایل تحویل"
              onClick={() => setTab("orders")}
            />
            <DashQuickCard
              icon={MessageSquare}
              title="تیکت‌ها"
              description="پاسخ به گفتگوهای کاربران"
              onClick={() => setTab("tickets")}
            />
          </div>

          <div className="dash-split-grid">
            <div className="lux-card">
              <div className="dash-panel-title">
                <h3>آخرین سفارش‌ها</h3>
                <button type="button" className="btn-outline" onClick={() => setTab("orders")}>
                  همه
                </button>
              </div>
              <div className="dash-mini-list">
                {recentOrders.length === 0 ? (
                  <p className="text-muted text-sm">سفارشی ثبت نشده.</p>
                ) : (
                  recentOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className="dash-mini-item"
                      onClick={() => setTab("orders")}
                    >
                      <div>
                        <strong>{order.title}</strong>
                        <span>{order.user?.name || "کاربر"}</span>
                      </div>
                      <span className={orderBadgeClass(order.status)}>
                        {ORDER_STATUS[order.status] || order.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="lux-card">
              <div className="dash-panel-title">
                <h3>آخرین پیام‌های تماس</h3>
                <button type="button" className="btn-outline" onClick={() => setTab("messages")}>
                  همه
                </button>
              </div>
              <div className="dash-mini-list">
                {recentMessages.length === 0 ? (
                  <p className="text-muted text-sm">پیامی ثبت نشده.</p>
                ) : (
                  recentMessages.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="dash-mini-item"
                      onClick={() => setTab("messages")}
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.message.length > 48 ? `${item.message.slice(0, 48)}…` : item.message}</span>
                      </div>
                      <span className={`dash-badge status-${item.status}`}>
                        {item.status === "new" ? "جدید" : item.status === "read" ? "خوانده" : "بسته"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "landing" && <AdminLandingEditor />}

      {tab === "blog" && <AdminBlogEditor />}

      {tab === "orders" && (
        <section>
          <div className="dash-section-head">
            <h2>سفارش‌ها</h2>
            <p>درخواست‌های همکاری کاربران — تغییر وضعیت و تحویل فایل</p>
          </div>
          <div className="dash-filter-bar">
            <button
              type="button"
              className={`dash-filter-chip ${orderFilter === "all" ? "is-active" : ""}`}
              onClick={() => setOrderFilter("all")}
            >
              همه ({orders.length})
            </button>
            {Object.entries(ORDER_STATUS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`dash-filter-chip ${orderFilter === key ? "is-active" : ""}`}
                onClick={() => setOrderFilter(key as OrderFilter)}
              >
                {label} ({orders.filter((o) => o.status === key).length})
              </button>
            ))}
          </div>
          <div className="dash-list">
            {filteredOrders.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <ShoppingBag size={22} />
                </span>
                <h3>سفارشی یافت نشد</h3>
                <p>با فیلتر دیگری جستجو کنید یا منتظر ثبت سفارش جدید بمانید.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <article key={order.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{order.title}</h3>
                      <p>
                        {order.user?.name || "کاربر"} · {order.service} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                    <span className={orderBadgeClass(order.status)}>
                      {ORDER_STATUS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="dash-message-body">{order.description}</p>
                  <div className="dash-order-meta">
                    <span>{order.user?.email || "—"}</span>
                    <span>#{order.id}</span>
                  </div>
                  <div className="dash-order-actions">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrder(order.id, e.target.value)}
                      aria-label="تغییر وضعیت سفارش"
                    >
                      {Object.entries(ORDER_STATUS).map(([status, label]) => (
                        <option key={status} value={status}>
                          {label}
                        </option>
                      ))}
                    </select>
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
            <p>گفتگو با کاربران — پاسخ‌ها به‌صورت چت نمایش داده می‌شوند</p>
          </div>
          <div className="dash-list">
            {tickets.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <MessageSquare size={22} />
                </span>
                <h3>تیکتی ثبت نشده</h3>
                <p>وقتی کاربران تیکت بزنند، اینجا ظاهر می‌شود.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <article key={ticket.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{ticket.subject}</h3>
                      <p>{ticket.user?.name || "کاربر"} · {ticket.user?.email}</p>
                    </div>
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
                          {m.senderRole === "admin" ? "ادمین" : "کاربر"} ·{" "}
                          {new Date(m.createdAt).toLocaleString("fa-IR")}
                        </span>
                        {m.body}
                      </div>
                    ))}
                  </div>
                  <div className="dash-reply-row">
                    <input
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
          <div className="dash-toolbar">
            <input
              className="dash-search"
              placeholder="جستجو بر اساس نام، ایمیل یا تلفن..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <span className="text-muted text-sm">{filteredUsers.length} کاربر</span>
          </div>
          <div className="dash-table lux-card">
            {filteredUsers.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <UserPlus size={22} />
                </span>
                <h3>کاربری یافت نشد</h3>
                <p>هنوز کسی ثبت‌نام نکرده یا نتیجه‌ای برای جستجو نیست.</p>
              </div>
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td data-label="نام">{user.name}</td>
                      <td data-label="ایمیل" dir="ltr">
                        {user.email}
                      </td>
                      <td data-label="تلفن" dir="ltr">
                        {user.phone || "—"}
                      </td>
                      <td data-label="وضعیت">
                        <span className={`dash-badge ${user.blocked ? "order-cancelled" : "order-completed"}`}>
                          {user.blocked ? "مسدود" : "فعال"}
                        </span>
                      </td>
                      <td data-label="عملیات" className="space-x-2 space-x-reverse">
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
          <div className="dash-filter-bar">
            {(
              [
                ["all", "همه"],
                ["new", "جدید"],
                ["read", "خوانده‌شده"],
                ["closed", "بسته"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`dash-filter-chip ${messageFilter === key ? "is-active" : ""}`}
                onClick={() => setMessageFilter(key)}
              >
                {label}
                {key === "all"
                  ? ` (${messages.length})`
                  : ` (${messages.filter((m) => m.status === key).length})`}
              </button>
            ))}
          </div>
          <div className="dash-list">
            {filteredMessages.length === 0 ? (
              <div className="dash-empty">
                <span className="dash-empty-icon">
                  <Mail size={22} />
                </span>
                <h3>پیامی یافت نشد</h3>
                <p>پیام‌های فرم تماس اینجا نمایش داده می‌شوند.</p>
              </div>
            ) : (
              filteredMessages.map((item) => (
                <article key={item.id} className="lux-card dash-message">
                  <div className="dash-message-top">
                    <div>
                      <h3>{item.name}</h3>
                      <p dir="ltr">
                        {item.email} · {item.phone} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString("fa-IR")}
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

      {tab === "backup" && <AdminBackupPanel onToast={flash} />}

      {tab === "media" && <AdminMediaCenter onToast={flash} />}
    </DashboardShell>
  );
}
