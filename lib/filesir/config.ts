export const FILESIR_API_BASE = process.env.FILESIR_API_BASE || "https://my.files.ir/api/v1";
export const FILESIR_PUBLIC_BASE = process.env.FILESIR_PUBLIC_BASE || "https://my.files.ir";

export function isFilesIrConfigured(): boolean {
  return Boolean(process.env.FILESIR_ACCESS_TOKEN?.trim() || (process.env.FILESIR_EMAIL?.trim() && process.env.FILESIR_PASSWORD));
}

export function buildShareablePublicUrl(hash: string): string {
  return `${FILESIR_PUBLIC_BASE}/drive/s/${hash}`;
}
