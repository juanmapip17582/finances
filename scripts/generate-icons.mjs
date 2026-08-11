import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

const ACCENT = "#FF4620";
const CREAM = "#FFF3E0";

// Minimal camera-shutter mark on a solid accent field.
// Content is kept inside the centered 80% safe-zone circle so it also works as a maskable icon.
const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${ACCENT}"/>
  <rect x="196" y="140" width="120" height="50" rx="14" fill="${CREAM}"/>
  <rect x="96" y="176" width="320" height="220" rx="28" fill="${CREAM}"/>
  <circle cx="256" cy="286" r="78" fill="${ACCENT}"/>
  <circle cx="256" cy="286" r="78" fill="none" stroke="${CREAM}" stroke-width="14"/>
  <circle cx="256" cy="286" r="24" fill="${CREAM}"/>
  <rect x="330" y="200" width="34" height="12" rx="6" fill="${ACCENT}"/>
</svg>
`;

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  await sharp(Buffer.from(svg))
    .resize(t.size, t.size)
    .png()
    .toFile(path.join(outDir, t.file));
  console.log("wrote", t.file);
}
