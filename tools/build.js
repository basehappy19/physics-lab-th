#!/usr/bin/env node
/* รวม index.html + css + js + ฟอนต์ + ไอคอน เป็นไฟล์เดียว dist/tpat3-single.html
 * ใช้: node tools/build.js
 * ไฟล์ที่ได้เปิดได้ทันทีโดยไม่ต้องมีโฟลเดอร์อื่น (ออฟไลน์ได้) เหมาะส่งให้นักเรียนหรืออัปโหลดขึ้นเว็บ
 * three.js ฝังเป็น <script type="text/plain"> เบราว์เซอร์จึงยังไม่ประมวลผลจนกว่าจะเปิดมุมมอง 3D
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const b64 = p => fs.readFileSync(path.join(root, p)).toString('base64');
const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const dataUri = p => `data:${MIME[path.extname(p)]};base64,${b64(p)}`;

require('./stamp')();
let html = read('index.html');
// CSS (ฟอนต์ใน fonts.css แปลงเป็น data URI)
html = html.replace(/<link rel="stylesheet" href="(css\/[^"?]+)(?:\?v=[^"]*)?">/g, (_, p) => {
  const css = read(p).replace(/url\(\.\.\/(fonts\/[^)]+)\)/g, (m, f) => `url(${dataUri(f)})`);
  return `<style>\n${css}\n</style>`;
});
// ไอคอนฝังในไฟล์ ไม่ใช้ manifest และสคริปต์ preload ฟอนต์ (ฟอนต์ฝังแล้ว)
html = html.replace(/(<link rel="(?:icon|apple-touch-icon)" href=")(assets\/[^"]+)"/g, (_, a, p) => `${a}${dataUri(p)}"`);
html = html.replace(/<link rel="manifest"[^>]*>\n?/, '');
html = html.replace(/<script>if \(\/\^https\?:\/[\s\S]*?<\/script>\n?/, '');
html = html.replace(/<script src="([^"?]+)(?:\?v=[^"]*)?"><\/script>/g, (_, p) => `<script>\n${read(p)}\n</script>`);
html = html.replace('</body>', `<script type="text/plain" id="three-src">\n${read('vendor/three.min.js')}\n</script>\n</body>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'tpat3-single.html');
fs.writeFileSync(out, html);
console.log('เขียนแล้ว:', path.relative(root, out), '(' + Math.round(html.length / 1024) + ' KB)');
