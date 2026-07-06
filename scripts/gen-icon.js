const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;

const ACCENT = [78, 129, 88];
const ACCENT2 = [62, 107, 72];
const CREAM = [244, 241, 235];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const mix = (c1, c2, t) => [
  Math.round(c1[0] + (c2[0] - c1[0]) * t),
  Math.round(c1[1] + (c2[1] - c1[1]) * t),
  Math.round(c1[2] + (c2[2] - c1[2]) * t),
];

function sdRoundRect(x, y, cx, cy, hw, hh, r) {
  const qx = Math.abs(x - cx) - (hw - r);
  const qy = Math.abs(y - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function sdSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const t = clamp((wx * vx + wy * vy) / (vx * vx + vy * vy), 0, 1);
  return Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
}

const APEX = [128, 66];
const BL = [84, 192];
const BR = [172, 192];
const BAR_L = [103, 150];
const BAR_R = [153, 150];
const HALF = 13;

function letterCoverage(x, y) {
  const d = Math.min(
    sdSegment(x, y, APEX[0], APEX[1], BL[0], BL[1]),
    sdSegment(x, y, APEX[0], APEX[1], BR[0], BR[1]),
    sdSegment(x, y, BAR_L[0], BAR_L[1], BAR_R[0], BAR_R[1]),
  );
  return clamp(HALF + 0.5 - d, 0, 1);
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
let o = 0;
for (let y = 0; y < SIZE; y++) {
  raw[o++] = 0;
  for (let x = 0; x < SIZE; x++) {
    const px = x + 0.5, py = y + 0.5;
    const dRect = sdRoundRect(px, py, 128, 128, 120, 120, 54);
    const rectCov = clamp(0.5 - dRect, 0, 1);
    const g = clamp(py / SIZE, 0, 1);
    let col = mix(ACCENT, ACCENT2, g * 0.85);
    const aCov = letterCoverage(px, py);
    col = mix(col, CREAM, aCov);
    const alpha = Math.round(rectCov * 255);
    raw[o++] = col[0];
    raw[o++] = col[1];
    raw[o++] = col[2];
    raw[o++] = alpha;
  }
}

const CRC = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(CRC(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;
ihdr[9] = 6;
const idat = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);

const outDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'icon.png');
fs.writeFileSync(outFile, png);
console.log('Wrote', outFile, '(' + png.length + ' bytes)');
