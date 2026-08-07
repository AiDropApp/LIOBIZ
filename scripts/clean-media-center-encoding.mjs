import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const storePath = path.join(root, "data", "media-center.json");

function isCorruptedLabel(text) {
  const value = String(text || "").trim();
  if (!value) return true;
  if (/[\u2500-\u257f\u2550-\u256c]/.test(value)) return true;
  if (/[┌└├─┐┘│]/.test(value)) return true;
  if (/╪|█|⌐|┘|┌|▒|▓/.test(value)) return true;
  const letters = value.match(/[\p{L}]/gu)?.length ?? 0;
  const symbols = value.match(/[^\p{L}\p{N}\s]/gu)?.length ?? 0;
  if (letters > 0 && symbols > letters * 1.5) return true;
  return false;
}

const raw = fs.readFileSync(storePath, "utf8");
const store = JSON.parse(raw);
const before = store.categories.length;
const badIds = new Set(store.categories.filter((c) => isCorruptedLabel(c.name)).map((c) => c.id));
store.categories = store.categories.filter((c) => !badIds.has(c.id));
store.cards = store.cards.map((card) =>
  card.categoryId && badIds.has(card.categoryId) ? { ...card, categoryId: null } : card,
);
fs.writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
console.log(`Removed ${before - store.categories.length} corrupted categories.`);
