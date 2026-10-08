#!/usr/bin/env node
/* ใส่ ?v=<แฮชเนื้อไฟล์> ให้ css/js ทุกตัวใน index.html กันเบราว์เซอร์/CDN ใช้ไฟล์เก่าจากแคช
 * ใช้: node tools/stamp.js   (รันก่อน commit/deploy ทุกครั้ง หรือรัน node tools/build.js ซึ่งเรียกให้อัตโนมัติ)
 * ไฟล์ไหนไม่เปลี่ยน แฮชก็เหมือนเดิม ผู้ใช้จึงยังได้ใช้แคชของไฟล์นั้นต่อ
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.join(__dirname, '..');
const hash = p => crypto.createHash('md5').update(fs.readFileSync(path.join(root, p))).digest('hex').slice(0, 8);

function stamp() {
  const file = path.join(root, 'index.html');
  const src = fs.readFileSync(file, 'utf8');
  let n = 0;
  const out = src.replace(/((?:src|href)=")((?:css|js)\/[^"?]+\.(?:css|js))(?:\?v=[^"]*)?"/g, (_, a, p) => {
    n++;
    return `${a}${p}?v=${hash(p)}"`;
  });
  if (out !== src) fs.writeFileSync(file, out);
  console.log(`stamp: ${n} ไฟล์`, out !== src ? '(อัปเดต index.html)' : '(ไม่มีอะไรเปลี่ยน)');
}

module.exports = stamp;
if (require.main === module) stamp();
