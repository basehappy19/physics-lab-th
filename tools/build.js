#!/usr/bin/env node
/* รวม index.html + css + js ทั้งหมดเป็นไฟล์เดียว dist/tpat3-single.html
 * ใช้: node tools/build.js
 * ไฟล์ที่ได้เปิดได้ทันทีโดยไม่ต้องมีโฟลเดอร์อื่น เหมาะส่งให้นักเรียนหรืออัปโหลดขึ้นเว็บ
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">/g, (_, p) => `<style>\n${read(p)}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, p) => `<script>\n${read(p)}\n</script>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'tpat3-single.html');
fs.writeFileSync(out, html);
console.log('เขียนแล้ว:', path.relative(root, out), '(' + Math.round(html.length / 1024) + ' KB)');
