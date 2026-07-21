/** Parse API JSON safely — dev server errors often return HTML and crash React. */
export async function readResponseJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "پاسخ سرور نامعتبر بود."
        : `خطای سرور (${res.status}). لطفاً dev server را ری‌استارت کنید.`,
    );
  }
}
