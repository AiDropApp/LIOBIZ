"use client";

import { useState, type FormEvent } from "react";
import { SITE } from "@/lib/constants";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setFeedback(data.message || "ارسال پیام ناموفق بود.");
        return;
      }
      setStatus("ok");
      setFeedback("پیام شما دریافت شد. به‌زودی با شما تماس می‌گیریم.");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("ارتباط با سرور برقرار نشد.");
    }
  };

  return (
    <form className="contact-form lux-card" onSubmit={onSubmit}>
      <h2 className="mb-2 text-xl font-bold">فرم ارتباط سریع</h2>
      <p className="mb-6 text-sm text-muted">
        جزئیات درخواست‌تان را بنویسید تا تیم لیوبیز با شما هماهنگ شود.
      </p>

      <label className="contact-field">
        <span>نام و نام خانوادگی</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثلاً سارا محمدی" />
      </label>

      <label className="contact-field">
        <span>ایمیل</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          dir="ltr"
          placeholder={SITE.email}
        />
      </label>

      <label className="contact-field">
        <span>شماره تماس</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          dir="ltr"
          placeholder={SITE.phone}
        />
      </label>

      <label className="contact-field">
        <span>پیام شما</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="درباره پروژه، هدف و زمان‌بندی مدنظرتان بنویسید..."
        />
      </label>

      {feedback && (
        <p className={`text-sm ${status === "ok" ? "text-emerald-700" : "text-red-600"}`}>{feedback}</p>
      )}

      <button type="submit" className="btn-primary w-full justify-center py-3.5" disabled={status === "loading"}>
        {status === "loading" ? "در حال ارسال..." : "ارسال پیام"}
      </button>
    </form>
  );
}
