// Script to generate PWA icons from logo.png
// Run with: node scripts/generate-icons.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const INPUT = path.join(__dirname, '..', '..', 'logo.png'); // d:\Full Stack Web Dev\All Spend\logo.png
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const size of SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(INPUT)
      .resize(size, size, { fit: 'cover', background: { r: 248, g: 250, b: 249, alpha: 1 } })
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${outputPath}`);
  }

  // Also copy as favicon
  await sharp(INPUT).resize(32, 32).png().toFile(path.join(__dirname, '..', 'public', 'favicon-32x32.png'));
  await sharp(INPUT).resize(16, 16).png().toFile(path.join(__dirname, '..', 'public', 'favicon-16x16.png'));

  console.log('All icons generated!');
}

generateIcons().catch(console.error);
