const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Generate PNG favicons at different sizes
const sizes = [16, 32, 180]; // 180 for apple-touch-icon

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Green diamond (no background - transparent)
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(size / 2, size * 0.125);  // top
  ctx.lineTo(size * 0.875, size / 2);   // right
  ctx.lineTo(size / 2, size * 0.875);   // bottom
  ctx.lineTo(size * 0.125, size / 2);   // left
  ctx.closePath();
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');

  let filename;
  if (size === 180) {
    filename = 'apple-touch-icon.png';
  } else if (size === 32) {
    filename = 'favicon-32x32.png';
  } else {
    filename = 'favicon-16x16.png';
  }

  const outputPath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${filename}`);
});

// Also generate a 32x32 as favicon.png for general use
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#00ff88';
ctx.beginPath();
ctx.moveTo(16, 4);
ctx.lineTo(28, 16);
ctx.lineTo(16, 28);
ctx.lineTo(4, 16);
ctx.closePath();
ctx.fill();
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.png'), canvas.toBuffer('image/png'));
console.log('Generated: favicon.png');
