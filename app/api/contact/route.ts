import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";
import { contactMessages, getDb } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { isValidEmail, isValidIranPhone } from "@/lib/validation";
import { turnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

function verifyMathCaptcha(token: string): boolean {
  const m = token.match(/^math:(\d+)\+(\d+)=(\d+)$/);
  if (!m) return false;
  return Number(m[1]) + Number(m[2]) === Number(m[3]);
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = checkRateLimit(`contact:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { message: `تعداد درخواست زیاد است. ${limited.retryAfterSec} ثانیه دیگر تلاش کنید.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = String(body?.phone || "").trim();
  const message = String(body?.message || "").trim();
  const honeypot = String(body?.website || "").trim();
  const turnstileToken = String(body?.turnstileToken || "").trim();

  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  if (turnstileConfigured()) {
    if (!turnstileToken) {
      return NextResponse.json({ message: "لطفاً تأیید امنیتی را تکمیل کنید." }, { status: 400 });
    }
    const ok = await verifyTurnstileToken(turnstileToken, ip);
    if (!ok) {
      return NextResponse.json({ message: "تأیید امنیتی ناموفق بود. دوباره تلاش کنید." }, { status: 400 });
    }
  } else if (!verifyMathCaptcha(turnstileToken)) {
    return NextResponse.json({ message: "لطفاً تأیید امنیتی (جمع اعداد) را انجام دهید." }, { status: 400 });
  }

  if (!name || !email || !phone || !message) {
    return NextResponse.json({ message: "لطفاً همه فیلدها را تکمیل کنید." }, { status: 400 });
  }

  if (name.length > 120 || message.length > 5000) {
    return NextResponse.json({ message: "متن پیام بیش از حد مجاز است." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ message: "ایمیل معتبر نیست." }, { status: 400 });
  }

  if (!isValidIranPhone(phone)) {
    return NextResponse.json({ message: "شماره تماس معتبر نیست." }, { status: 400 });
  }

  const db = getDb();
  db.insert(contactMessages)
    .values({
      name,
      email,
      phone,
      message,
      status: "new",
      createdAt: new Date().toISOString(),
    })
    .run();

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const db = getDb();

  if (session.role === "admin") {
    const rows = db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).all();
    return NextResponse.json({ messages: rows });
  }

  const rows = db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.email, session.email))
    .orderBy(desc(contactMessages.createdAt))
    .all();
  return NextResponse.json({ messages: rows });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const session = parseAuthCookie(cookieStore.get(AUTH_COOKIE)?.value);
  if (session?.role !== "admin") {
    return NextResponse.json({ message: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const status = String(body?.status || "");
  if (!id || !["new", "read", "closed"].includes(status)) {
    return NextResponse.json({ message: "داده نامعتبر" }, { status: 400 });
  }

  const db = getDb();
  db.update(contactMessages)
    .set({ status: status as "new" | "read" | "closed" })
    .where(eq(contactMessages.id, id))
    .run();

  const rows = db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).all();
  return NextResponse.json({ ok: true, messages: rows });
}
