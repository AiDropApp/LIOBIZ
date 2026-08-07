/** Detect labels broken by wrong encoding (mojibake / box-drawing garbage). */
export function isCorruptedLabel(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (/[\u2500-\u257f\u2550-\u256c]/.test(value)) return true;
  if (/[┌└├─┐┘│]/.test(value)) return true;
  if (/╪|█|⌐|┘|┌|▒|▓/.test(value)) return true;
  // Mostly non-letter symbols with very few Persian/Arabic letters
  const letters = value.match(/[\p{L}]/gu)?.length ?? 0;
  const symbols = value.match(/[^\p{L}\p{N}\s]/gu)?.length ?? 0;
  if (letters > 0 && symbols > letters * 1.5) return true;
  return false;
}

export function cleanLabel(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Deduplicate category-like rows by visible name (keep first valid). */
export function dedupeByName<T extends { name: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const name = cleanLabel(row.name);
    if (!name || isCorruptedLabel(name)) continue;
    const key = name.normalize("NFC");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...row, name } as T);
  }
  return out;
}
