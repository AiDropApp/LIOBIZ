import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentPath = path.join(root, "data", "site-content.json");
const partnersPath = path.join(root, "lib", "creative-partners.data.ts");

const raw = fs.readFileSync(contentPath, "utf8");
const data = JSON.parse(raw);

const partnersSrc = fs.readFileSync(partnersPath, "utf8");
const partnerBlocks = [...partnersSrc.matchAll(/\{\s*id:\s*"([^"]+)"[\s\S]*?quote:\s*\n\s*"([^"]+)"[\s\S]*?bio:\s*\n\s*"([^"]+)"[\s\S]*?role:\s*\n\s*"([^"]+)"/g)];
const partnerPatch = new Map(
  partnerBlocks.map((m) => [m[1], { quote: m[2], bio: m[3], role: m[4] }]),
);

if (Array.isArray(data.creativePartners)) {
  data.creativePartners = data.creativePartners.map((p) => {
    const patch = partnerPatch.get(p.id);
    return patch ? { ...p, ...patch } : p;
  });
}

const stripUnsplash = (url) =>
  typeof url === "string" && url.includes("images.unsplash.com") ? "" : url;

for (const item of data.portfolio || []) {
  item.image = stripUnsplash(item.image);
}
for (const item of data.backstage || []) {
  item.image = stripUnsplash(item.image);
}
for (const post of data.blogPosts || []) {
  post.coverImage = stripUnsplash(post.coverImage);
}

if (data.landing?.heroMediaUrl?.includes("aidrop.app")) {
  data.landing.heroMediaUrl = "/video/landing/aidrop/aidrop-partner-07.mp4";
}

fs.writeFileSync(contentPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log("Cleaned site-content.json");
