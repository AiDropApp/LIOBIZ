/** Shared form validators */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  const v = email.trim().toLowerCase();
  if (!v || v.length > 254) return false;
  if (!EMAIL_RE.test(v)) return false;
  const [local, domain] = v.split("@");
  if (!local || !domain || domain.startsWith(".") || domain.endsWith(".")) return false;
  return true;
}

export function isValidIranPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 14) return false;
  return true;
}

export function normalizeBlogTags(raw: string): string[] {
  return raw
    .split(/[,،]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function isBlogPublished(post: {
  published: boolean;
  publishedAt: string;
}): boolean {
  if (!post.published) return false;
  const at = Date.parse(post.publishedAt);
  if (Number.isNaN(at)) return true;
  return at <= Date.now();
}
