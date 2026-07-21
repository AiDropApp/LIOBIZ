const PREFIX = "liobiz-media-thumb:";
const MAX_ENTRIES = 400;

type Entry = { ok: boolean; at: number };

function readMap(): Record<string, Entry> {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(PREFIX);
    return raw ? (JSON.parse(raw) as Record<string, Entry>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, Entry>) {
  if (typeof sessionStorage === "undefined") return;
  const keys = Object.keys(map).sort((a, b) => map[a].at - map[b].at);
  while (keys.length > MAX_ENTRIES) {
    const drop = keys.shift();
    if (drop) delete map[drop];
  }
  try {
    sessionStorage.setItem(PREFIX, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function isThumbCached(entryId: number, thumb: boolean): boolean {
  const map = readMap();
  return Boolean(map[`${entryId}:${thumb ? "t" : "f"}`]?.ok);
}

export function markThumbCached(entryId: number, thumb: boolean, ok: boolean) {
  const map = readMap();
  map[`${entryId}:${thumb ? "t" : "f"}`] = { ok, at: Date.now() };
  writeMap(map);
}
