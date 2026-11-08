// Draws assets/icon.png (1024x1024, opaque): an open book on a warm cream
// background, in the app's dictionary-green / encyclopedia-indigo colors.
const fs = require('fs'), zlib = require('zlib');
const N = 1024, px = Buffer.alloc(N * N * 3);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  let c = mix([250, 247, 240], [238, 231, 214], y / N);

  const cx = 512, cy = 560, w = 760, h = 420;
  const dx = x - cx, dy = y - cy;
  // two page "fans" meeting at a spine, like an open book viewed from above
  const leftPage = dx < 0 && Math.abs(dy) < h / 2 + dx * 0.18 && dx > -w / 2;
  const rightPage = dx >= 0 && Math.abs(dy) < h / 2 - dx * 0.18 && dx < w / 2;
  if (leftPage) c = mix([43, 93, 79], [33, 73, 62], (dy + h / 2) / h); // dictionary green
  if (rightPage) c = mix([62, 77, 140], [48, 60, 112], (dy + h / 2) / h); // encyclopedia indigo
  if (Math.abs(dx) < 6 && Math.abs(dy) < h / 2) c = [250, 247, 240]; // spine highlight

  // a few page-line strokes for texture
  if (leftPage && (y - cy) % 46 < 3 && x < cx - 40) c = mix(c, [255, 255, 255], 0.18);
  if (rightPage && (y - cy) % 46 < 3 && x > cx + 40) c = mix(c, [255, 255, 255], 0.18);

  px.set(c, (y * N + x) * 3);
}
const raw = Buffer.alloc(N * (N * 3 + 1));
for (let y = 0; y < N; y++) px.copy(raw, y * (N * 3 + 1) + 1, y * N * 3, (y + 1) * N * 3);
const crc = (b) => { let c = ~0; for (const v of b) { c ^= v; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1; } return ~c >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync('assets/icon.png', Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('assets/icon.png written');
