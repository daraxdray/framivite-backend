const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createDefaultFrame() {
  const targetDir = path.join(__dirname, '..', 'uploads', 'frames');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetPath = path.join(targetDir, 'default-frame.png');
  const width = 1080;
  const height = 1080;

  // Create a stylish gradient frame with transparent cutout at (240, 240, 600, 600)
  const svgOverlay = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="50%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
      <text x="540" y="140" font-family="sans-serif" font-size="42" font-weight="bold" fill="white" text-anchor="middle">
        VIP EVENT PASS
      </text>
      <rect x="240" y="240" width="600" height="600" rx="30" ry="30" fill="black" />
      <text x="540" y="940" font-family="sans-serif" font-size="32" font-weight="600" fill="#a5f3fc" text-anchor="middle">
        #FRAMIVITE2026
      </text>
    </svg>
  `;

  const frameBuffer = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(svgOverlay),
      },
      {
        input: Buffer.from(`
          <svg width="${width}" height="${height}">
            <rect x="240" y="240" width="600" height="600" rx="30" ry="30" fill="black" />
          </svg>
        `),
        blend: 'dest-out',
      },
    ])
    .png()
    .toBuffer();

  await fs.promises.writeFile(targetPath, frameBuffer);
  console.log('Created default frame PNG at:', targetPath);
}

createDefaultFrame().catch(console.error);
