import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputImagePath = "C:/Users/deskop/.gemini/antigravity-ide/brain/775af432-30cb-4818-815a-38a9bca464e9/.user_uploaded/media_1792353430743.png";
const iconsDir = path.resolve(__dirname, "../public/icons");
const publicDir = path.resolve(__dirname, "../public");

async function generate() {
  console.log("Reading source image from:", inputImagePath);
  
  // Trim transparent padding from the original character image
  const trimmedBuffer = await sharp(inputImagePath)
    .trim()
    .toBuffer();

  const metadata = await sharp(trimmedBuffer).metadata();
  console.log(`Trimmed character dimensions: ${metadata.width}x${metadata.height}`);

  // Also save a direct copy in public for UI reference
  await sharp(inputImagePath).toFile(path.join(publicDir, "character-reading.png"));

  // Background color matching Kaizu paper minimalism
  // #FAF7F0 (Kaizu surface primary) or #F4EFE3 (Kaizu washi paper main)
  const bgMainColor = "#FAF7F0";

  // 1. Generate MASKABLE 512x512 icon
  // In maskable icons, the safe zone is the central 80% circle (radius ~200px, width/height ~400px).
  // The character should fit nicely inside the safe area with full background bleed.
  const charMaskableHeight = 360;
  const resizedForMaskable = await sharp(trimmedBuffer)
    .resize({ height: charMaskableHeight, fit: "inside" })
    .toBuffer();

  const maskableMeta = await sharp(resizedForMaskable).metadata();
  const maskableLeft = Math.round((512 - maskableMeta.width) / 2);
  const maskableTop = Math.round((512 - maskableMeta.height) / 2) + 10; // slightly down for visual balance

  // Background for maskable: solid #FAF7F0 with subtle radial warmth
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 250, g: 247, b: 240, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedForMaskable,
        top: maskableTop,
        left: maskableLeft,
      },
    ])
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));
  console.log("Generated icon-maskable-512.png");

  // 2. Generate STANDARD 512x512 icon
  // For standard icon, create an elegant squircle on transparent background, or full solid squircle
  // Squircle with rounded corners (rx=100) and soft subtle shadow/rim
  const squircleSvg = Buffer.from(`
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="paperGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="60%" stop-color="#FAF7F0"/>
          <stop offset="100%" stop-color="#F2EBDC"/>
        </radialGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#244633" flood-opacity="0.14"/>
        </filter>
      </defs>
      <!-- Squircle Base with smooth corners -->
      <rect x="20" y="20" width="472" height="472" rx="112" fill="url(#paperGrad)" filter="url(#softShadow)"/>
      <!-- Refined Forest Green / Sage border accent -->
      <rect x="20" y="20" width="472" height="472" rx="112" fill="none" stroke="#244633" stroke-width="3" stroke-opacity="0.25"/>
    </svg>
  `);

  const squircleBase = await sharp(squircleSvg).resize(512, 512).png().toBuffer();

  // Character inside standard 512 icon (fits gracefully inside squircle)
  const charStandardHeight = 390;
  const resizedForStandard = await sharp(trimmedBuffer)
    .resize({ height: charStandardHeight, fit: "inside" })
    .toBuffer();

  const stdMeta = await sharp(resizedForStandard).metadata();
  const stdLeft = Math.round((512 - stdMeta.width) / 2);
  const stdTop = Math.round((512 - stdMeta.height) / 2) + 12;

  const icon512 = await sharp(squircleBase)
    .composite([
      {
        input: resizedForStandard,
        top: stdTop,
        left: stdLeft,
      },
    ])
    .png()
    .toBuffer();

  await sharp(icon512).toFile(path.join(iconsDir, "icon-512.png"));
  console.log("Generated icon-512.png");

  // 3. Generate 192x192 icon
  await sharp(icon512)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));
  console.log("Generated icon-192.png");

  // 4. Generate 180x180 Apple Touch Icon (solid background, iOS doesn't support alpha)
  // iOS automatically applies squircle mask to apple-touch-icon, so provide solid 180x180 with character
  const charAppleHeight = 145;
  const resizedForApple = await sharp(trimmedBuffer)
    .resize({ height: charAppleHeight, fit: "inside" })
    .toBuffer();

  const appleMeta = await sharp(resizedForApple).metadata();
  const appleLeft = Math.round((180 - appleMeta.width) / 2);
  const appleTop = Math.round((180 - appleMeta.height) / 2) + 4;

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 250, g: 247, b: 240, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedForApple,
        top: appleTop,
        left: appleLeft,
      },
    ])
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));
  console.log("Generated apple-touch-icon.png");

  // 5. Generate Favicons (48x48, 32x32, 16x16)
  await sharp(icon512)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, "favicon-48x48.png"));

  await sharp(icon512)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, "favicon.png"));

  console.log("All app icons successfully generated!");
}

generate().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
