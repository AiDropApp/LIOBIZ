import sharp from "sharp";
import fs from "fs";
import path from "path";

const root = process.cwd();
const logoPath = path.join(root, "public", "images", "logo.png");
const iconsDir = path.join(root, "public", "icons");
const appDir = path.join(root, "app");

fs.mkdirSync(iconsDir, { recursive: true });

if (!fs.existsSync(logoPath)) {
  console.error("Missing logo:", logoPath);
  process.exit(1);
}

async function squareLogo(size, { padded = false, bg = "#0a0a0a" } = {}) {
  const inner = padded ? Math.round(size * 0.62) : Math.round(size * 0.78);
  const logo = await sharp(logoPath)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

const sizes = [16, 32, 48, 180, 192, 512];
for (const size of sizes) {
  const buf = await squareLogo(size);
  await sharp(buf).toFile(path.join(iconsDir, `icon-${size}.png`));
}

const maskable = await squareLogo(512, { padded: true, bg: "#111111" });
await sharp(maskable).toFile(path.join(iconsDir, "icon-512-maskable.png"));

// Next.js app directory favicon only (avoid conflict with public/favicon.ico)
await sharp(await squareLogo(32))
  .resize(32, 32)
  .png()
  .toFile(path.join(appDir, "favicon.ico"));

// Apple touch
await sharp(await squareLogo(180)).toFile(path.join(iconsDir, "apple-touch-icon.png"));

console.log(
  "logo_icons_ok",
  ["favicon.ico", ...sizes.map((s) => `icon-${s}.png`), "icon-512-maskable.png", "apple-touch-icon.png"].join(", "),
);
