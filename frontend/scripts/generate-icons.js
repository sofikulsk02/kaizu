import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsDir = path.resolve(__dirname, "../public/icons");

// 1. Transparent loader SVG for icon-512.png, icon-192.png, apple-touch-icon.png
// Clean circular track + gradient spinning arc matching KaizuLoader
const loaderSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#244633" />
      <stop offset="60%" stop-color="#B83245" />
      <stop offset="100%" stop-color="#B83245" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Circular Base Track -->
  <circle
    cx="256"
    cy="256"
    r="72"
    fill="none"
    stroke="#DED6C7"
    stroke-width="10"
  />

  <!-- Active Spinner Arc -->
  <circle
    cx="256"
    cy="256"
    r="72"
    fill="none"
    stroke="url(#spinnerGrad)"
    stroke-width="10"
    stroke-linecap="round"
    stroke-dasharray="160 300"
    stroke-dashoffset="35"
  />
</svg>
`.trim();

// 2. Maskable loader SVG with #F4EFE3 background for icon-maskable-512.png
const maskableLoaderSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="spinnerGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#244633" />
      <stop offset="60%" stop-color="#B83245" />
      <stop offset="100%" stop-color="#B83245" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Full background bleed for maskable PWA spec -->
  <rect width="512" height="512" fill="#F4EFE3" />

  <!-- Circular Base Track -->
  <circle
    cx="256"
    cy="256"
    r="72"
    fill="none"
    stroke="#DED6C7"
    stroke-width="10"
  />

  <!-- Active Spinner Arc -->
  <circle
    cx="256"
    cy="256"
    r="72"
    fill="none"
    stroke="url(#spinnerGradM)"
    stroke-width="10"
    stroke-linecap="round"
    stroke-dasharray="160 300"
    stroke-dashoffset="35"
  />
</svg>
`.trim();

async function run() {
  // Save SVG sources
  fs.writeFileSync(path.join(iconsDir, "icon.svg"), loaderSvg);
  fs.writeFileSync(path.join(iconsDir, "icon-maskable.svg"), maskableLoaderSvg);

  // Generate 512x512 standard icon (used by Android splash screen)
  await sharp(Buffer.from(loaderSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));
  console.log("Generated icon-512.png");

  // Generate 192x192 standard icon
  await sharp(Buffer.from(loaderSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));
  console.log("Generated icon-192.png");

  // Generate 180x180 apple touch icon
  await sharp(Buffer.from(loaderSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");

  // Generate 512x512 maskable icon with #F4EFE3 background
  await sharp(Buffer.from(maskableLoaderSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));
  console.log("Generated icon-maskable-512.png");
}

run().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
