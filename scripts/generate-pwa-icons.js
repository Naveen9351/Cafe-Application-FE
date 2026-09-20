const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = Math.max(0, Math.min(255, Math.round(r)));
      rawData[pxOffset + 1] = Math.max(0, Math.min(255, Math.round(g)));
      rawData[pxOffset + 2] = Math.max(0, Math.min(255, Math.round(b)));
      rawData[pxOffset + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crc ^ buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Distance to rounded rectangle
function sdRoundBox(px, py, bx, by, r) {
  const dx = Math.abs(px) - bx + r;
  const dy = Math.abs(py) - by + r;
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.min(Math.max(dx, dy), 0) + Math.sqrt(ax * ax + ay * ay) - r;
}

// Distance to line segment
function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy);
}

// Distance to circle arc approximate
function sdCircle(px, py, cx, cy, radius) {
  const dx = px - cx;
  const dy = py - cy;
  return Math.abs(Math.sqrt(dx * dx + dy * dy) - radius);
}

function renderServiqIcon(isMaskable) {
  return (x, y, w, h) => {
    const u = (x / w) * 2 - 1; // -1 to 1
    const v = (y / h) * 2 - 1; // -1 to 1

    // Background gradient: dark slate/indigo/black
    const gradT = (u + v + 2) / 4;
    let bgR = 11 + gradT * (15 - 11);
    let bgG = 15 + gradT * (23 - 15);
    let bgB = 25 + gradT * (45 - 25);
    let bgA = 255;

    // Glowing subtle radial center
    const distCenter = Math.sqrt(u * u + v * v);
    const glow = Math.max(0, 1 - distCenter * 1.1);
    bgR += glow * 25;
    bgG += glow * 40;
    bgB += glow * 95;

    // Scale for icon elements: maskable has safe zone (0.65 scale), standard is 0.85
    const scale = isMaskable ? 0.65 : 0.82;
    const su = u / scale;
    const sv = v / scale;

    // Squircle card background
    const squircleDist = sdRoundBox(su, sv, 0.82, 0.82, 0.32);
    
    // Smooth anti-aliased card fill & border
    const pixelSize = 2 / (w * scale);
    const cardAlpha = Math.max(0, Math.min(1, 0.5 - squircleDist / pixelSize));

    let r = bgR;
    let g = bgG;
    let b = bgB;
    let a = bgA;

    if (cardAlpha > 0) {
      // Inside card gradient: Luxury dark navy glass
      const cardGrad = (su + sv + 2) / 4;
      let cardR = 15 + cardGrad * 20;
      let cardG = 23 + cardGrad * 35;
      let cardB = 42 + cardGrad * 60;

      // Card border neon blue/cyan stroke
      const borderDist = Math.abs(squircleDist + 0.02);
      if (borderDist < 0.035) {
        const borderAlpha = Math.max(0, 1 - borderDist / 0.035);
        const borderGradY = (sv + 1) / 2;
        cardR += borderAlpha * (37 + (6 - 37) * borderGradY);
        cardG += borderAlpha * (99 + (182 - 99) * borderGradY);
        cardB += borderAlpha * (235 + (212 - 235) * borderGradY);
      }

      // Draw SERVIQ "S" Monogram inside card
      // Define S segments and curves
      // Top bar & loop
      const s1 = sdSegment(su, sv, -0.32, -0.45, 0.25, -0.45);
      const s2 = sdSegment(su, sv, 0.25, -0.45, 0.32, -0.22);
      const s3 = sdSegment(su, sv, 0.32, -0.22, -0.28, 0.05);
      const s4 = sdSegment(su, sv, -0.28, 0.05, -0.32, 0.32);
      const s5 = sdSegment(su, sv, -0.32, 0.32, 0.30, 0.45);

      // Node circles
      const n1 = Math.sqrt((su - 0.25) * (su - 0.25) + (sv - -0.45) * (sv - -0.45));
      const n2 = Math.sqrt((su - 0) * (su - 0) + (sv - -0.08) * (sv - -0.08));
      const n3 = Math.sqrt((su - -0.30) * (su - -0.30) + (sv - 0.35) * (sv - 0.35));
      const n4 = Math.sqrt((su - 0.30) * (su - 0.30) + (sv - 0.45) * (sv - 0.45));

      const minDist = Math.min(s1, s2, s3, s4, s5);
      const strokeWidth = 0.095;
      const sAlpha = Math.max(0, Math.min(1, (strokeWidth - minDist) / pixelSize));

      // Fork / Spoon / Cafe indicator dots & accents
      const nodeAlpha1 = Math.max(0, Math.min(1, (0.075 - n1) / pixelSize));
      const nodeAlpha2 = Math.max(0, Math.min(1, (0.085 - n2) / pixelSize));
      const nodeAlpha3 = Math.max(0, Math.min(1, (0.065 - n3) / pixelSize));
      const nodeAlpha4 = Math.max(0, Math.min(1, (0.075 - n4) / pixelSize));

      // Gradient along the S (Royal Blue #2563eb to Cyan #06b6d4)
      const sColorT = (sv + 0.5);
      const sR = 37 + sColorT * (6 - 37);
      const sG = 99 + sColorT * (182 - 99);
      const sB = 235 + sColorT * (212 - 235);

      // Apply S stroke
      if (sAlpha > 0) {
        cardR = cardR * (1 - sAlpha) + sR * sAlpha;
        cardG = cardG * (1 - sAlpha) + sG * sAlpha;
        cardB = cardB * (1 - sAlpha) + sB * sAlpha;
      }

      // Apply Nodes (Glowing Cyan/White nodes)
      if (nodeAlpha1 > 0) {
        cardR = cardR * (1 - nodeAlpha1) + 255 * nodeAlpha1;
        cardG = cardG * (1 - nodeAlpha1) + 255 * nodeAlpha1;
        cardB = cardB * (1 - nodeAlpha1) + 255 * nodeAlpha1;
      }
      if (nodeAlpha2 > 0) {
        cardR = cardR * (1 - nodeAlpha2) + 6 * nodeAlpha2;
        cardG = cardG * (1 - nodeAlpha2) + 182 * nodeAlpha2;
        cardB = cardB * (1 - nodeAlpha2) + 212 * nodeAlpha2;
      }
      if (nodeAlpha4 > 0) {
        cardR = cardR * (1 - nodeAlpha4) + 255 * nodeAlpha4;
        cardG = cardG * (1 - nodeAlpha4) + 255 * nodeAlpha4;
        cardB = cardB * (1 - nodeAlpha4) + 255 * nodeAlpha4;
      }

      // Blend Card over Background
      r = r * (1 - cardAlpha) + cardR * cardAlpha;
      g = g * (1 - cardAlpha) + cardG * cardAlpha;
      b = b * (1 - cardAlpha) + cardB * cardAlpha;
    }

    return [r, g, b, a];
  };
}

const publicDir = path.join(__dirname, '..', 'public');

const iconConfigs = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-192.png', size: 192, maskable: true },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'favicon-32x32.png', size: 32, maskable: false },
  { file: 'pwa-icon.png', size: 512, maskable: false }
];

console.log('Generating PWA icons...');
for (const config of iconConfigs) {
  const buffer = createPNG(config.size, config.size, renderServiqIcon(config.maskable));
  const targetPath = path.join(publicDir, config.file);
  fs.writeFileSync(targetPath, buffer);
  console.log(`✓ Generated ${config.file} (${config.size}x${config.size}, ${buffer.length} bytes)`);
}

console.log('All PWA icons generated successfully!');
