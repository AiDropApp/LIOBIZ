#!/usr/bin/env node
/** Strip inline style attributes from HTML strings in site-content.json (SEO audit). */
import fs from "fs";
import path from "path";

const root = process.argv[2] || process.cwd();
const file = path.join(root, "data/site-content.json");

function stripStyles(html) {
  if (typeof html !== "string" || !html.includes("style=")) return html;
  return html
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sstyle='[^']*'/gi, "");
}

function walk(value) {
  if (typeof value === "string") return stripStyles(value);
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v);
    return out;
  }
  return value;
}

const raw = fs.readFileSync(file, "utf8");
const before = (raw.match(/\sstyle=/gi) || []).length;
const data = walk(JSON.parse(raw));
const out = `${JSON.stringify(data, null, 2)}\n`;
const after = (out.match(/\sstyle=/gi) || []).length;

const backup = `${file}.bak-strip-styles-${Date.now()}`;
fs.writeFileSync(backup, raw, "utf8");
fs.writeFileSync(file, out, "utf8");

console.log("BACKUP", backup);
console.log("inline_style_attrs_before", before);
console.log("inline_style_attrs_after", after);
