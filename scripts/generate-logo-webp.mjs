import sharp from "sharp";
import fs from "fs";
import path from "path";

const root = process.cwd();
const logoPath = path.join(root, "public", "images", "logo.png");
const webpPath = path.join(root, "public", "images", "logo.webp");

if (!fs.existsSync(logoPath)) {
  console.error("Missing logo:", logoPath);
  process.exit(1);
}

await sharp(logoPath).webp({ quality: 85 }).toFile(webpPath);
console.log("logo_webp_ok", webpPath);
