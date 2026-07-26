const sharp = require('sharp');
const path = require('path');

async function createTestSelfie() {
  const targetPath = path.join(__dirname, 'test-selfie.png');
  const buffer = await sharp({
    create: {
      width: 800,
      height: 800,
      channels: 4,
      background: { r: 255, g: 105, b: 180, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(`
          <svg width="800" height="800">
            <circle cx="400" cy="350" r="180" fill="#fde047" />
            <circle cx="330" cy="300" r="25" fill="#1e1b4b" />
            <circle cx="470" cy="300" r="25" fill="#1e1b4b" />
            <path d="M 300 420 Q 400 500 500 420" stroke="#1e1b4b" stroke-width="15" fill="none" stroke-linecap="round" />
            <text x="400" y="700" font-family="sans-serif" font-size="36" font-weight="bold" fill="white" text-anchor="middle">Selfie Test</text>
          </svg>
        `),
      },
    ])
    .png()
    .toBuffer();

  await sharp(buffer).toFile(targetPath);
  console.log('Test selfie generated at:', targetPath);
}

createTestSelfie().catch(console.error);
