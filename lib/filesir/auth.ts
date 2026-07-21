import { FILESIR_API_BASE } from "@/lib/filesir/config";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export class FilesIrError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "FilesIrError";
    this.status = status;
    this.body = body;
  }
}

async function loginForToken(): Promise<string> {
  const email = process.env.FILESIR_EMAIL?.trim();
  const password = process.env.FILESIR_PASSWORD;
  if (!email || !password) {
    throw new FilesIrError("FILESIR_ACCESS_TOKEN یا FILESIR_EMAIL/PASSWORD تنظیم نشده.", 503);
  }

  const res = await fetch(`${FILESIR_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email,
      password,
      token_name: process.env.FILESIR_TOKEN_NAME || "liobiz-server",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    user?: { access_token?: string };
    message?: string;
  };

  if (!res.ok || !data.user?.access_token) {
    throw new FilesIrError(data.message || "ورود Files.ir ناموفق بود.", res.status || 401, data);
  }

  cachedToken = data.user.access_token;
  tokenExpiresAt = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

export async function getFilesIrToken(): Promise<string> {
  const envToken = process.env.FILESIR_ACCESS_TOKEN?.trim();
  if (envToken) return envToken;

  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  return loginForToken();
}

export async function filesIrRequest<T>(
  path: string,
  init: RequestInit & { rawBody?: boolean } = {},
): Promise<T> {
  const token = await getFilesIrToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");

  const res = await fetch(`${FILESIR_API_BASE}${path}`, { ...init, headers });

  if (init.rawBody && res.ok) {
    return res as unknown as T;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => "");

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: string }).message)
        : `Files.ir error ${res.status}`;
    throw new FilesIrError(message, res.status, data);
  }

  return data as T;
}

export async function filesIrFormRequest<T>(path: string, form: FormData): Promise<T> {
  const token = await getFilesIrToken();
  const res = await fetch(`${FILESIR_API_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message: string }).message)
        : `Files.ir error ${res.status}`;
    throw new FilesIrError(message, res.status, data);
  }
  return data as T;
}
