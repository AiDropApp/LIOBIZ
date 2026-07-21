const TTL_MS = 45_000;
const cache = new Map<string, { expires: number; payload: unknown }>();

export function getEntriesCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit || hit.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.payload as T;
}

export function setEntriesCache(key: string, payload: unknown, ttlMs = TTL_MS) {
  cache.set(key, { expires: Date.now() + ttlMs, payload });
}

export function clearEntriesCache() {
  cache.clear();
}
