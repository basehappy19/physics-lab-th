/* บทที่ 15 ความรู้ทั่วไป พลังงาน และสิ่งแวดล้อม */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];

// ---------- 1 แผงโซลาร์เซลล์ ----------
function sunVec(lat, day, hour) {
  const d = 23.45 * RAD * Math.sin(2 * Math.PI * (284 + day) / 365), H = 15 * (hour - 12) * RAD, f = lat * RAD;
  return [-Math.cos(d) * Math.sin(H), Math.cos(f) * Math.sin(d) - Math.sin(f) * Math.cos(d) * Math.cos(H), Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H)]; // ตะวันออก เหนือ ขึ้น
}
function panelPower(p, hour) {
  const s = sunVec(p.lat, p.day, hour), el = Math.asin(clamp(s[2], -1, 1));
  if (el <= 0) return { P: 0, G: 0, el, s, cos: 0 };
  const b = p.tilt * RAD, g = p.az * RAD, n = [Math.sin(b) * Math.sin(g), Math.sin(b) * Math.cos(g), Math.cos(b)], ci = Math.max(0, s[0] * n[0] + s[1] * n[1] + s[2] * n[2]);
  const eld = el * DEG, AM = 1 / (Math.sin(el) + 0.50572 * Math.pow(6.07995 + eld, -1.6364)), DNI = 1353 * Math.pow(0.7, Math.pow(AM, 0.678)) * (p.sky / 100);
  const G = DNI * ci + 0.1 * DNI * (1 + Math.cos(b)) / 2;
  return { P: G * p.A * p.eff / 100, G, el, s, cos: ci };
}
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const dayName = d => { const m = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; let k = 0; while (k < 11 && d > m[k]) { d -= m[k]; k++; } return Math.round(d) + ' ' + MONTHS[k]; };
CASES.push({
  name: 'แผงโซลาร์เซลล์', aspect: 16 / 9, title: 'แผงโซลาร์เซลล์กับตำแหน่งดวงอาทิตย์',
  desc: 'ตั้งละติจูด วันในปี มุมเอียงและทิศที่แผงหันไป กดเล่นเพื่อดูดวงอาทิตย์เคลื่อนที่ตลอดวัน กำลังไฟฟ้าที่ได้ขึ้นกับมุมที่แสงตกกระทบแผงและความหนาของบรรยากาศที่แสงผ่าน ดูแบบ 3D เพื่อเห็นแนวการโคจรของดวงอาทิตย์',
  formula: 'P = η × G × A &nbsp;|&nbsp; G ≈ ความเข้มแสงตรง × cos(มุมตกกระทบ) &nbsp;|&nbsp; พลังงานต่อวัน = ∫P dt (kWh) &nbsp;|&nbsp; ประเทศไทยหันแผงไปทางทิศใต้ เอียงประมาณเท่าละติจูด',
  params: [
    { type: 'head', label: 'สถานที่และเวลา' },
    { id: 'lat', label: 'ละติจูด', unit: '°N', min: -60, max: 60, step: 0.1, def: 16.1 },
    { id: 'day', label: 'วันที่ในปี (1 = 1 ม.ค.)', unit: '', min: 1, max: 365, step: 1, def: 80 },
    { id: 'sky', label: 'ท้องฟ้าโปร่ง', unit: '%', min: 10, max: 100, step: 1, def: 85 },
    { type: 'head', label: 'แผงโซลาร์' },
    { id: 'tilt', label: 'มุมเอียงของแผง', unit: '°', min: 0, max: 90, step: 1, def: 15 },
    { id: 'az', label: 'ทิศที่แผงหันไป (180 = ใต้)', unit: '°', min: 0, max: 359, step: 1, def: 180 },
    { id: 'A', label: 'พื้นที่แผงรวม', unit: 'm²', min: 1, max: 100, step: 0.5, def: 10 },
    { id: 'eff', label: 'ประสิทธิภาพแผง', unit: '%', min: 5, max: 25, step: 0.5, def: 20 }
  ],
  presets: [{ label: 'ภูเขียว มี.ค.', set: { lat: 16.1, day: 80 } }, { label: 'ภูเขียว มิ.ย.', set: { lat: 16.1, day: 172 } }, { label: 'ภูเขียว ธ.ค.', set: { lat: 16.1, day: 355 } }, { label: 'แผงหันทิศเหนือ', set: { az: 0, tilt: 30 } }],
  outs: [{ id: 'date', name: 'วันที่', unit: '' }, { id: 'noon', name: 'มุมเงยดวงอาทิตย์ตอนเที่ยง', unit: '°' }, { id: 'Pmax', name: 'กำลังสูงสุดในวัน', unit: 'kW' }, { id: 'E', name: 'พลังงานต่อวัน', unit: 'kWh' }, { id: 'Ey', name: 'ประมาณต่อปี (ถ้าทุกวันเหมือนวันนี้)', unit: 'kWh' }],
  compute(p) { let E = 0, Pm = 0; const prof = []; for (let h = 0; h <= 24; h += 0.1) { const r = panelPower(p, h); E += r.P * 0.1; Pm = Math.max(Pm, r.P); prof.push([h, r.P]); } return { date: dayName(p.day), noon: panelPower(p, 12).el * DEG, Pmax: Pm / 1000, E: E / 1000, Ey: E / 1000 * 365, _prof: prof }; },
  sim: {
    dt: 1 / 60,
    init() { return { h: 5 }; },
    step(st, dt) { st.h = 5 + st.t * 1.2; if (st.h >= 19.5) st.done = true; },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 4 }; },
    draw(g, st, p, o) {
      const r = panelPower(p, st.h), cx = 4.2, cy = 1.6, R = 3.4;
      // แผนภาพทางเดินดวงอาทิตย์ (มองจากด้านบน ขอบวง = ขอบฟ้า ศูนย์กลาง = กลางฟ้า)
      g.circle(cx, cy + R + 0.2, R, { fill: '--bg', c: '--line' }); g.circle(cx, cy + R + 0.2, R * 2 / 3, { c: '--grid' }); g.circle(cx, cy + R + 0.2, R / 3, { c: '--grid' });
      [['N', 0, 1], ['S', 0, -1], ['E', 1, 0], ['W', -1, 0]].forEach(([l, x, y]) => g.text(cx + x * (R + 0.3), cy + R + 0.2 + y * (R + 0.3), l, { fs: 12, b: true, base: 'middle', c: '--muted' }));
      const P = (s) => { const el = Math.asin(clamp(s[2], -1, 1)), rr = R * (1 - el / (Math.PI / 2)), a = Math.atan2(s[0], s[1]); return [cx + rr * Math.sin(a), cy + R + 0.2 + rr * Math.cos(a)]; };
      const path = []; for (let h = 4; h <= 20; h += 0.1) { const s = sunVec(p.lat, p.day, h); if (s[2] > 0) path.push(P(s)); } g.path(path, { c: '--c5', w: 2 });
      for (let h = 6; h <= 18; h += 2) { const s = sunVec(p.lat, p.day, h); if (s[2] > 0) { const q = P(s); g.circle(q[0], q[1], 3, { px: true, fill: '--c5', c: 'none' }); g.text(q[0], q[1] + 0.25, h + ':00', { fs: 9, c: '--muted' }); } }
      // แผง (ลูกศรตั้งฉาก)
      const nb = p.tilt * RAD, ng = p.az * RAD, nrm = [Math.sin(nb) * Math.sin(ng), Math.sin(nb) * Math.cos(ng), Math.cos(nb)], qn = P(nrm); g.arrow(cx, cy + R + 0.2, qn[0], qn[1], { c: '--c2', w: 2, label: 'แผงหันไป' });
      if (r.el > 0) { const q = P(r.s); g.circle(q[0], q[1], 10, { px: true, fill: '--c5', c: '--ink' }); }
      g.text(cx, 0.4, 'ทางเดินดวงอาทิตย์บนท้องฟ้า (มองจากด้านบน)', { fs: 10, c: '--muted' });
      // กราฟกำลังตามเวลา
      const gx = 8.6, gy = 1.2, gw = 7, gh = 6.4, Pm = Math.max(1, ...o._prof.map(q => q[1])), X = h => gx + (h - 4) / 16 * gw, Y = w => gy + w / Pm * gh;
      g.rect(gx, gy, gw, gh, { fill: '--bg', c: '--line' }); for (let h = 6; h <= 18; h += 3) { g.line(X(h), gy, X(h), gy + gh, { c: '--grid', w: 1 }); g.text(X(h), gy - 0.35, h + ':00', { fs: 10, c: '--muted' }); }
      g.path(o._prof.filter(q => q[0] >= 4 && q[0] <= 20).map(q => [X(q[0]), Y(q[1])]), { c: '--c5', w: 2.5, fill: '--c5', fillAlpha: 0.15 });
      g.line(X(st.h), gy, X(st.h), gy + gh, { c: '--c1', w: 1.5, dash: [4, 4] });
      g.text(gx + gw, gy + gh + 0.3, `สูงสุด ${fmt(Pm / 1000)} kW  พื้นที่ใต้กราฟ = ${fmt(o.E)} kWh`, { a: 'right', fs: 11, c: '--muted' });
      const tm = Math.floor(st.h * 60 + 1e-6), hh = Math.floor(tm / 60), mm = tm % 60;
      g.textPx(12, 22, `${dayName(p.day)}  เวลา ${hh}:${String(mm).padStart(2, '0')}  มุมเงย ${fmt(Math.max(0, r.el * DEG))}°  กำลัง ${fmt(r.P / 1000)} kW`, { a: 'left', fs: 13, b: true });
    }
  },
  plot: { x: { label: 'เวลา', unit: 'ชั่วโมง', f: s => s.h }, series: [{ label: 'กำลัง', unit: 'kW', c: '--c5', f: (s, p) => panelPower(p, s.h).P / 1000 }] },
  three: {
    cam() { return { pos: [9, 7, 9], target: [0, 1, 0] }; },
    build(T, p) {
      const g = T.cyl(8, 8, 0.1, '--ground', { receive: true, cast: false }); g.position.y = -0.05;
      [['N', 0, -8.6], ['S', 0, 8.6], ['E', 8.6, 0], ['W', -8.6, 0]].forEach(([l, x, z]) => T.label(l, '--muted', { pos: [x, 0.2, z] }));
      const path = []; for (let h = 4; h <= 20; h += 0.1) { const s = sunVec(p.lat, p.day, h); if (s[2] > -0.05) path.push([s[0] * 7, s[2] * 7, -s[1] * 7]); } T.line('--c5', { pts: path, max: path.length });
      const pnl = T.group(); const board = T.box(2.4, 0.08, 1.6, '--neg', { parent: pnl }); board.position.y = 0;
      for (let i = 1; i < 4; i++) { const l = T.box(0.02, 0.09, 1.6, '--panel', { parent: pnl }); l.position.x = -1.2 + i * 0.6; }
      pnl.position.y = 0.9; pnl.rotation.order = 'YXZ'; pnl.rotation.y = -(p.az * RAD) + Math.PI; pnl.rotation.x = -p.tilt * RAD;
      const leg = T.cyl(0.06, 0.06, 0.9, '--muted'); leg.position.y = 0.45;
      const sun = T.sphere(0.45, '--c5', { emissive: '--c5', ei: 0.9, cast: false });
      const b = p.tilt * RAD, g2 = p.az * RAD, n = [Math.sin(b) * Math.sin(g2), Math.sin(b) * Math.cos(g2), Math.cos(b)];
      T.vec('--c2', '', { kind: 'v', r: 0.035, pad: 0.3 }).set([0, 0.95, 0], [n[0] * 1.8, n[2] * 1.8, -n[1] * 1.8], 'แนวตั้งฉากแผง');
      return { sun, lab: T.label('', '--c5'), ray: T.vec('--c5', '', { kind: 'v', r: 0.045, pad: 0.3, tail: true }) };
    },
    update(ob, st, p, o, T) {
      const s = sunVec(p.lat, p.day, st.h); ob.sun.position.set(s[0] * 7, s[2] * 7, -s[1] * 7); ob.sun.visible = s[2] > 0;
      const V3 = T.scene.children.find(c => c.isDirectionalLight); if (V3) { V3.position.set(s[0] * 30, Math.max(0.5, s[2] * 30), -s[1] * 30); V3.intensity = s[2] > 0 ? 0.9 : 0.05; }
      const r = panelPower(p, st.h); ob.lab.set(fmt(r.P / 1000) + ' kW', [0, 2.2, 0]);
      if (s[2] > 0) { const L = 2.6, c = [0, 0.95, 0]; ob.ray.set([c[0] + s[0] * (L + 0.3), c[1] + s[2] * (L + 0.3), c[2] - s[1] * (L + 0.3)], [-s[0] * L, -s[2] * L, s[1] * L], 'แสงอาทิตย์ มุมตกกระทบ ' + fmt(Math.acos(clamp(r.cos, 0, 1)) * DEG) + '°'); } else ob.ray.hide();
    }
  },
  notes: ['แสงตั้งฉากกับแผงได้กำลังมากที่สุด เช้าเย็นแสงต้องผ่านบรรยากาศหนาจึงอ่อนลง', 'ประเทศไทยอยู่เหนือเส้นศูนย์สูตร ดวงอาทิตย์อยู่ค่อนไปทางใต้เกือบทั้งปี แผงจึงหันทิศใต้', 'ฤดูร้อน (เม.ย.–มิ.ย.) ดวงอาทิตย์ขึ้นสูงและวันยาว ธันวาคมดวงอาทิตย์ต่ำกว่า', 'ค่าในแบบจำลองเป็นการประมาณท้องฟ้าโปร่ง ค่าจริงขึ้นกับเมฆ ฝุ่น และอุณหภูมิแผง']
});

// ---------- 2 ค่าไฟฟ้าในบ้าน ----------
const APP = ['เครื่องปรับอากาศ', 'ตู้เย็น', 'หลอดไฟ LED', 'พัดลม', 'โทรทัศน์', 'คอมพิวเตอร์', 'เตารีด', 'กาต้มน้ำไฟฟ้า', 'เครื่องทำน้ำอุ่น', 'หม้อหุงข้าว', 'เครื่องซักผ้า', 'อื่นๆ'];
CASES.push({
  name: 'ค่าไฟฟ้าในบ้าน', aspect: 16 / 9, sens: false, title: 'คำนวณพลังงานไฟฟ้า ค่าไฟ และคาร์บอนจากเครื่องใช้ไฟฟ้า',
  desc: 'เพิ่มเครื่องใช้ไฟฟ้า ใส่กำลังไฟฟ้า จำนวน และชั่วโมงที่ใช้ต่อวัน ดูว่าเครื่องใดใช้ไฟมากที่สุด ค่าไฟต่อเดือน และการปล่อยคาร์บอนไดออกไซด์ ปรับอัตราค่าไฟและค่าการปล่อยได้',
  formula: 'พลังงาน (kWh หรือ "หน่วย") = กำลัง (kW) × เวลา (h) &nbsp;|&nbsp; ค่าไฟ = หน่วย × ราคาต่อหน่วย &nbsp;|&nbsp; CO₂ = หน่วย × ค่าการปล่อยต่อหน่วย',
  params: [
    { id: 'items', type: 'list', label: 'เครื่องใช้ไฟฟ้า', item: 'เครื่อง', min: 1, max: 12, fields: [{ id: 'k', label: 'ชนิด', opts: APP.map((a, i) => [i, a]) }, { id: 'W', label: 'กำลังไฟฟ้า', unit: 'W', min: 1, max: 5000, step: 1 }, { id: 'n', label: 'จำนวน', unit: 'เครื่อง', min: 1, max: 20, step: 1 }, { id: 'h', label: 'ใช้ต่อวัน', unit: 'ชั่วโมง', min: 0, max: 24, step: 0.25 }],
      def: [{ k: 0, W: 1000, n: 1, h: 8 }, { k: 1, W: 150, n: 1, h: 24 }, { k: 2, W: 10, n: 8, h: 6 }, { k: 3, W: 50, n: 2, h: 10 }, { k: 4, W: 100, n: 1, h: 4 }, { k: 8, W: 3500, n: 1, h: 0.5 }], add: () => ({ k: 11, W: 100, n: 1, h: 2 }) },
    { type: 'head', label: 'อัตรา' },
    { id: 'rate', label: 'ค่าไฟเฉลี่ยต่อหน่วย (รวมค่า Ft)', unit: 'บาท', min: 2, max: 8, step: 0.01, def: 4.2 },
    { id: 'ef', label: 'การปล่อย CO₂ ต่อหน่วย', unit: 'kg/kWh', min: 0.1, max: 1, step: 0.01, def: 0.5 },
    { id: 'days', label: 'จำนวนวันต่อเดือน', unit: 'วัน', min: 28, max: 31, step: 1, def: 30 }
  ],
  outs: [{ id: 'day', name: 'ใช้ไฟต่อวัน', unit: 'kWh' }, { id: 'mon', name: 'ใช้ไฟต่อเดือน', unit: 'kWh' }, { id: 'bill', name: 'ค่าไฟต่อเดือน (ประมาณ)', unit: 'บาท' }, { id: 'co2', name: 'CO₂ ต่อเดือน', unit: 'kg' }, { id: 'top', name: 'ใช้ไฟมากที่สุด', unit: '' }],
  compute(p) { const e = p.items.map(it => it.W * it.n * it.h / 1000), day = e.reduce((a, b) => a + b, 0), mon = day * p.days; let k = 0; e.forEach((v, i) => { if (v > e[k]) k = i; }); return { day, mon, bill: mon * p.rate, co2: mon * p.ef, top: APP[p.items[k].k] + ` (${fmt(e[k] / day * 100)}%)`, _e: e }; },
  sim: {
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 4 }; },
    draw(g, st, p, o) {
      const e = o._e, n = e.length, mx = Math.max(1e-9, ...e), rowH = Math.min(0.9, 7.6 / n), cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];
      g.text(0.3, 8.5, 'พลังงานต่อเดือน (kWh) แยกตามเครื่องใช้ไฟฟ้า', { a: 'left', fs: 13, b: true });
      e.forEach((v, i) => { const y = 7.8 - (i + 1) * rowH, it = p.items[i]; g.text(4.3, y + rowH * 0.4, APP[it.k] + (it.n > 1 ? ' ×' + it.n : ''), { a: 'right', fs: 12, base: 'middle' }); g.rect(4.5, y + rowH * 0.12, v / mx * 9, rowH * 0.62, { fill: cols[i % 6], c: 'none' }); g.text(4.6 + v / mx * 9, y + rowH * 0.4, `${fmt(v * p.days)} kWh  ${fmt(v * p.days * p.rate)} บาท`, { a: 'left', fs: 11, base: 'middle' }); });
      g.textPx(g.W - 12, g.H - 14, `รวม ${fmt(o.mon)} หน่วย/เดือน ≈ ${fmt(o.bill)} บาท  CO₂ ${fmt(o.co2)} kg`, { a: 'right', fs: 14, b: true });
    }
  },
  notes: ['เครื่องใช้ไฟฟ้าที่สร้างความร้อน (เครื่องทำน้ำอุ่น เตารีด) กำลังสูงมาก แม้ใช้ไม่นานก็กินไฟมาก', 'ตู้เย็นกำลังไม่สูงแต่เปิด 24 ชั่วโมง (คอมเพรสเซอร์ทำงานเป็นช่วงๆ ค่าจริงจึงมักน้อยกว่า)', 'อัตราค่าไฟจริงเป็นอัตราก้าวหน้าและมีค่า Ft เปลี่ยนทุกงวด ค่าในแบบจำลองเป็นอัตราเฉลี่ยโดยประมาณ ปรับให้ตรงกับบิลได้', 'ลดชั่วโมงใช้แอร์ 1 ชั่วโมงต่อวัน ดูว่าประหยัดได้เดือนละเท่าใด']
});

// ---------- 3 ภาวะเรือนกระจก ----------
const SIG = 5.67e-8;
CASES.push({
  name: 'ภาวะเรือนกระจก', aspect: 16 / 9, title: 'สมดุลพลังงานของโลกและภาวะเรือนกระจก',
  desc: 'แสงอาทิตย์ส่วนหนึ่งสะท้อนกลับ (อัลบีโด) ส่วนที่เหลือทำให้ผิวโลกร้อนและแผ่รังสีอินฟราเรดออก ก๊าซเรือนกระจกดูดกลืนรังสีอินฟราเรดแล้วแผ่กลับลงมาครึ่งหนึ่ง ผิวโลกจึงอุ่นกว่ากรณีไม่มีบรรยากาศ',
  formula: 'พลังงานที่โลกได้รับเฉลี่ย = S(1 − α)/4 &nbsp;|&nbsp; ไม่มีบรรยากาศ: σT⁴ = S(1 − α)/4 &nbsp;|&nbsp; บรรยากาศชั้นเดียว: T<sub>ผิว</sub> = T<sub>e</sub>(2/(2 − ε))<sup>¼</sup>',
  params: [
    { id: 'S', label: 'ค่าคงที่สุริยะ', unit: 'W/m²', min: 1000, max: 1600, step: 1, def: 1361 },
    { id: 'alb', label: 'อัลบีโด (การสะท้อน)', unit: '', min: 0.05, max: 0.8, step: 0.01, def: 0.3 },
    { id: 'eps', label: 'การดูดกลืนรังสีอินฟราเรดของบรรยากาศ', unit: '', min: 0, max: 1, step: 0.01, def: 0.78 }
  ],
  presets: [{ label: 'โลกปัจจุบัน', set: { alb: 0.3, eps: 0.78 } }, { label: 'ไม่มีก๊าซเรือนกระจก', set: { eps: 0 } }, { label: 'ก๊าซเรือนกระจกเพิ่ม', set: { eps: 0.85 } }, { label: 'น้ำแข็งปกคลุมมาก', set: { alb: 0.5 } }],
  outs: [{ id: 'Te', name: 'อุณหภูมิถ้าไม่มีบรรยากาศ', unit: '°C' }, { id: 'Ts', name: 'อุณหภูมิผิวโลก', unit: '°C' }, { id: 'dT', name: 'อุ่นขึ้นจากเรือนกระจก', unit: '°C' }, { id: 'In', name: 'พลังงานที่ผิวโลกดูดกลืน', unit: 'W/m²' }],
  compute(p) { const In = p.S * (1 - p.alb) / 4, Te = Math.pow(In / SIG, 0.25), Ts = Te * Math.pow(2 / (2 - p.eps), 0.25); return { Te: Te - 273.15, Ts: Ts - 273.15, dT: Ts - Te, In }; },
  sim: {
    dt: 1 / 60,
    init() { return { ph: [], rn: K.rng(9), acc: 0 }; },
    step(st, dt, p) {
      st.acc += dt * 10; while (st.acc > 1) { st.acc--; st.ph.push({ k: 'sun', x: 1 + st.rn() * 12, y: 8.6, alive: true }); }
      st.ph.forEach(q => {
        const sp = 3.2 * dt;
        if (q.k === 'sun') { q.y -= sp; q.x += sp * 0.25; if (q.y < 3.6 && !q.d1) { q.d1 = true; if (st.rn() < p.alb) q.k = 'ref'; } if (q.y <= 1.2) { q.k = 'ir'; q.vy = 1; } }
        else if (q.k === 'ref') { q.y += sp; q.x += sp * 0.25; if (q.y > 9) q.alive = false; }
        else if (q.k === 'ir' || q.k === 'irdown') { q.y += sp * q.vy * 0.8; if (q.vy > 0 && q.y > 3.6 && !q.d2) { q.d2 = true; if (st.rn() < p.eps) { if (st.rn() < 0.5) { q.vy = -1; q.k = 'irdown'; } else q.k = 'irup'; } } if (q.vy < 0 && q.y <= 1.2) { q.vy = 1; q.k = 'ir'; q.d2 = false; } if (q.y > 9) q.alive = false; }
        else if (q.k === 'irup') { q.y += sp * 0.8; if (q.y > 9) q.alive = false; }
      });
      st.ph = st.ph.filter(q => q.alive && q.x < 16); if (st.t > 3600) st.done = true;
    },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 0 }; },
    draw(g, st, p, o) {
      g.rect(0, 0, 16, 1.2, { fill: '--c3', c: 'none', alpha: 0.35 }); g.text(15.8, 0.5, 'ผิวโลก ' + fmt(o.Ts) + ' °C', { a: 'right', fs: 13, b: true });
      g.rect(0, 3.2, 16, 0.8, { fill: '--c4', c: 'none', alpha: 0.06 + 0.25 * p.eps }); g.text(15.8, 3.6, 'บรรยากาศ (ก๊าซเรือนกระจก)', { a: 'right', fs: 11, c: '--muted', base: 'middle' });
      g.circle(15.3, 8.3, 0.55, { fill: '#f5c518', c: 'none' });
      st.ph.forEach(q => { const col = q.k === 'sun' || q.k === 'ref' ? '#e8b400' : '--bad'; g.circle(q.x, q.y, q.k === 'sun' || q.k === 'ref' ? 4 : 3.5, { px: true, fill: col, c: 'none', alpha: 0.9 }); });
      g.textPx(12, 22, `แสงอาทิตย์ (เหลือง) ${fmt(p.alb * 100)}% สะท้อนกลับ  อินฟราเรด (แดง) ${fmt(p.eps * 100)}% ถูกบรรยากาศดูดกลืน`, { a: 'left', fs: 12, b: true, bg: true });
    }
  },
  three: {
    cam() { return { pos: [8, 6.5, 15], target: [8, 3.6, 0] }; },
    build(T, p, o) {
      const gr = T.box(16, 1.2, 6, '--c3', { opacity: 0.55, receive: true }); gr.position.set(8, 0.6, 0);
      const at = T.box(16, 0.8, 6, '--c4', { opacity: 0.06 + 0.3 * p.eps, cast: false }); at.position.set(8, 3.6, 0);
      const sun = T.sphere(0.7, '--c5', { emissive: '--c5', ei: 1, cast: false }); sun.position.set(15.3, 8.3, -1);
      T.label('ผิวโลก ' + fmt(o.Ts) + ' °C', '--ink', { pos: [13.5, 1.5, 3] }); T.label('บรรยากาศ (ก๊าซเรือนกระจก)', '--muted', { pos: [13, 4.3, 3] });
      // โฟตอนทั้งหมดใช้ InstancedMesh สองก้อน (แสงอาทิตย์ / อินฟราเรด)
      const mk = (c, r) => { const m = new T.THREE.InstancedMesh(new T.THREE.SphereGeometry(r, 10, 8), new T.THREE.MeshStandardMaterial({ color: T.color(c), emissive: T.color(c), emissiveIntensity: 0.5 }), 400); m.count = 0; T.scene.add(m); return m; };
      return { sunM: mk('#f5c518', 0.12), irM: mk('--bad', 0.1), M: new T.THREE.Matrix4() };
    },
    update(ob, st) {
      let a = 0, b = 0; (st.ph || []).forEach((q, i) => { const z = ((i * 0.618) % 1 - 0.5) * 4.5; ob.M.setPosition(q.x, q.y, z); if (q.k === 'sun' || q.k === 'ref') { if (a < 400) ob.sunM.setMatrixAt(a++, ob.M); } else if (b < 400) ob.irM.setMatrixAt(b++, ob.M); });
      ob.sunM.count = a; ob.irM.count = b; ob.sunM.instanceMatrix.needsUpdate = true; ob.irM.instanceMatrix.needsUpdate = true;
    }
  },
  notes: ['ถ้าไม่มีบรรยากาศ ผิวโลกจะเย็นประมาณ −18 °C ก๊าซเรือนกระจกทำให้อุ่นขึ้นราว 33 °C จนเหมาะกับสิ่งมีชีวิต', 'เพิ่มการดูดกลืนรังสีอินฟราเรด (ก๊าซเรือนกระจกมากขึ้น) อุณหภูมิผิวสูงขึ้น', 'น้ำแข็งที่ขั้วโลกละลาย อัลบีโดลด โลกดูดกลืนแสงมากขึ้น ยิ่งร้อนขึ้น (ป้อนกลับเชิงบวก)', 'แบบจำลองบรรยากาศชั้นเดียวนี้ง่ายกว่าความจริงมาก ใช้ดูแนวโน้ม']
});

// ---------- 4 ประสิทธิภาพการแปลงพลังงาน ----------
const STG = [['โรงไฟฟ้าถ่านหิน', 35], ['โรงไฟฟ้าก๊าซ (วงจรร่วม)', 55], ['โรงไฟฟ้าพลังน้ำ', 90], ['แผงโซลาร์เซลล์', 20], ['กังหันลม', 40], ['สายส่งไฟฟ้า', 92], ['หม้อแปลง', 98], ['แบตเตอรี่ (ชาร์จ-จ่าย)', 90], ['มอเตอร์ไฟฟ้า', 85], ['หลอด LED (เป็นแสง)', 40], ['หลอดไส้ (เป็นแสง)', 5], ['เครื่องยนต์เบนซิน', 25]];
CASES.push({
  name: 'ประสิทธิภาพการแปลงพลังงาน', aspect: 2, sens: false, title: 'การแปลงพลังงานหลายทอดและแผนภาพแซงคีย์',
  desc: 'เรียงขั้นการแปลงพลังงานเอง เช่น โรงไฟฟ้า → สายส่ง → หม้อแปลง → หลอดไฟ แต่ละขั้นมีประสิทธิภาพของตัวเอง ความกว้างของแถบคือปริมาณพลังงาน ส่วนที่แยกลงด้านล่างคือพลังงานที่สูญเสีย (ส่วนใหญ่เป็นความร้อน)',
  formula: 'ประสิทธิภาพ η = พลังงานที่ได้ใช้ประโยชน์ / พลังงานที่ใส่ &nbsp;|&nbsp; หลายทอด: η<sub>รวม</sub> = η₁ × η₂ × η₃ × …',
  params: [
    { id: 'Ein', label: 'พลังงานตั้งต้น', unit: 'kWh', min: 1, max: 1000, step: 1, def: 100 },
    { id: 'st', type: 'list', label: 'ขั้นการแปลงพลังงาน', item: 'ขั้น', min: 1, max: 7, fields: [{ id: 'k', label: 'ชนิด', opts: STG.map((s, i) => [i, s[0]]) }, { id: 'eta', label: 'ประสิทธิภาพ', unit: '%', min: 1, max: 100, step: 1 }], def: [{ k: 0, eta: 35 }, { k: 5, eta: 92 }, { k: 6, eta: 98 }, { k: 9, eta: 40 }], add: () => ({ k: 8, eta: 85 }) }
  ],
  presets: [{ label: 'ถ่านหิน → หลอดไส้', set: { st: [{ k: 0, eta: 35 }, { k: 5, eta: 92 }, { k: 6, eta: 98 }, { k: 10, eta: 5 }] } }, { label: 'โซลาร์ → แบตเตอรี่ → LED', set: { st: [{ k: 3, eta: 20 }, { k: 7, eta: 90 }, { k: 9, eta: 40 }] } }, { label: 'รถยนต์เบนซิน', set: { st: [{ k: 11, eta: 25 }] } }],
  outs: [{ id: 'eta', name: 'ประสิทธิภาพรวม', unit: '%' }, { id: 'out', name: 'พลังงานที่ใช้ประโยชน์ได้', unit: 'kWh' }, { id: 'loss', name: 'สูญเสียรวม', unit: 'kWh' }],
  compute(p) { let E = p.Ein; const flow = [E]; p.st.forEach(s => { E *= s.eta / 100; flow.push(E); }); return { eta: E / p.Ein * 100, out: E, loss: p.Ein - E, _f: flow }; },
  sim: {
    dt: 1 / 60,
    init() { return {}; },
    step(st) { if (st.t > 3600) st.done = true; },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 8, pad: 4 }; },
    draw(g, st, p, o) {
      const f = o._f, n = p.st.length, W = 14.4 / (n + 1), sc = 4.0 / p.Ein, top = 6.3;
      for (let i = 0; i <= n; i++) {
        const x0 = 0.8 + i * W, h = f[i] * sc;
        if (i < n) {
          const h2 = f[i + 1] * sc, lost = h - h2;
          g.path([[x0, top], [x0 + W, top], [x0 + W, top - h2], [x0 + W * 0.45, top - h2], [x0, top - h]], { close: true, fill: '--c2', c: 'none', alpha: 0.8 });
          if (lost > 0.001) g.path([[x0 + W * 0.2, top - h2 - 0.0], [x0 + W * 0.45, top - h2], [x0 + W * 0.45 + 0.05, top - h2], [x0 + W * 0.45 + 0.05, 0.6], [x0 + W * 0.45 - lost, 0.6], [x0 + W * 0.45 - lost, top - h2 - lost * 0.4]], { close: true, fill: '--c1', c: 'none', alpha: 0.55 });
          if (lost > 0.05) g.text(x0 + W * 0.45 - lost / 2, 0.3, 'เสีย ' + fmt(f[i] - f[i + 1]), { fs: 10, c: '--c1' });
          g.text(x0 + W * 0.7, top + 0.35, STG[p.st[i].k][0], { fs: 11, b: true }); g.text(x0 + W * 0.7, top + 0.7, 'η ' + p.st[i].eta + '%', { fs: 10, c: '--muted' });
          // เส้นไหล
          const ph = (st.t * 0.8) % 0.6; for (let x = x0 + ph; x < x0 + W; x += 0.6) g.line(x, top - 0.08, x + 0.25, top - 0.08, { c: '--panel', w: 2, alpha: 0.7 });
        }
        g.text(x0, top - f[i] * sc - 0.3, fmt(f[i]), { fs: 11, b: true, c: '--c2' });
      }
      g.textPx(12, 22, `ใส่ ${fmt(p.Ein)} kWh ได้ใช้จริง ${fmt(o.out)} kWh (${fmt(o.eta)}%)`, { a: 'left', fs: 14, b: true });
    }
  },
  notes: ['ประสิทธิภาพรวมคือผลคูณของทุกขั้น จึงต่ำกว่าขั้นที่ต่ำที่สุดเสมอ', 'เปลี่ยนหลอดไส้เป็นหลอด LED ประหยัดพลังงานต้นทางได้หลายเท่า เพราะขั้นสุดท้ายดีขึ้นมาก', 'พลังงานที่สูญเสียไม่ได้หายไป ส่วนใหญ่กลายเป็นความร้อนสู่สิ่งแวดล้อม', 'ค่าประสิทธิภาพตั้งต้นเป็นค่าประมาณทั่วไป ปรับได้']
});

Lab.add('env', CASES);
})();
