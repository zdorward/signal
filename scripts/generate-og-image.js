const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create canvas with OG image dimensions
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#0a0a0a';
ctx.fillRect(0, 0, width, height);

// Green diamond
ctx.fillStyle = '#00ff88';
ctx.font = '200px serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('◆', width / 2, height / 2 - 100);

// SIGNAL text
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 120px monospace';
ctx.fillText('SIGNAL', width / 2, height / 2 + 100);

// Save to file
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '..', 'public', 'og-image.png');
fs.writeFileSync(outputPath, buffer);

console.log('OG image generated at:', outputPath);
