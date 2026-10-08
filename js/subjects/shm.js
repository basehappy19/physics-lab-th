/* บทที่ 9 การเคลื่อนที่แบบซิมเปิลฮาร์มอนิก */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];

// ---------- 1 มวลติดสปริง ----------
CASES.push({
  name: 'มวลติดสปริง', aspect: 2, title: 'มวลติดสปริงแนวระดับและแนวดิ่ง',
  desc: 'ดึงมวลออกจากจุดสมดุลแล้วปล่อย ปรับ k มวล แอมพลิจูด ความเร็วต้น และการหน่วง ดูกราฟ x v a ที่ต่างเฟสกัน และพลังงานที่สลับไปมาระหว่างพลังงานจลน์กับพลังงานศักย์ยืดหยุ่น',
  formula: 'a = −ω²x &nbsp;|&nbsp; ω = √(k/m) &nbsp;|&nbsp; T = 2π√(m/k) &nbsp;|&nbsp; v<sub>max</sub> = ωA &nbsp;|&nbsp; a<sub>max</sub> = ω²A &nbsp;|&nbsp; E = ½kA²',
  params: [
    { id: 'ori', label: 'แนวการสั่น', opts: [['h', 'แนวระดับ'], ['v', 'แนวดิ่ง']], def: 'h' },
    { id: 'k', label: 'ค่าคงที่สปริง (k)', unit: 'N/m', min: 1, max: 500, step: 1, def: 40 },
    { id: 'm', label: 'มวล (m)', unit: 'kg', min: 0.05, max: 10, step: 0.05, def: 1 },
    { id: 'A', label: 'ระยะดึงเริ่มต้น', unit: 'm', min: -0.5, max: 0.5, step: 0.005, def: 0.2 },
    { id: 'v0', label: 'ความเร็วต้น', unit: 'm/s', min: -3, max: 3, step: 0.01, def: 0 },
    { id: 'b', label: 'การหน่วง (b/2m)', unit: '1/s', min: 0, max: 3, step: 0.01, def: 0 },
    { id: 'g', label: 'g (ใช้กับแนวดิ่ง)', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8, show: p => p.ori === 'v' }
  ],
  presets: [{ label: 'สั่นอิสระ', set: { b: 0 } }, { label: 'หน่วงน้อย', set: { b: 0.4 } }, { label: 'หน่วงวิกฤต', set: { b: 6.32, k: 40, m: 1 } }],
  outs: [{ id: 'w', name: 'ω', unit: 'rad/s' }, { id: 'T', name: 'คาบ T', unit: 's' }, { id: 'f', name: 'ความถี่ f', unit: 'Hz' }, { id: 'Amp', name: 'แอมพลิจูด', unit: 'm' }, { id: 'vmax', name: 'อัตราเร็วสูงสุด', unit: 'm/s' }, { id: 'amax', name: 'ความเร่งสูงสุด', unit: 'm/s²' }, { id: 'E', name: 'พลังงานรวม', unit: 'J' }, { id: 'xeq', name: 'สปริงยืดที่สมดุล (แนวดิ่ง)', unit: 'm' }],
  compute(p) { const w = Math.sqrt(p.k / p.m), Amp = Math.hypot(p.A, p.v0 / w); return { w, T: 2 * Math.PI / w, f: w / (2 * Math.PI), Amp, vmax: w * Amp, amax: w * w * Amp, E: 0.5 * p.k * Amp * Amp, xeq: p.ori === 'v' ? p.m * p.g / p.k : 0 }; },
  sim: {
    dt: 1 / 1000,
    init(p) { return { x: p.A, v: p.v0, a: -p.k / p.m * p.A }; },
    step(st, dt, p) { st.a = -p.k / p.m * st.x - 2 * p.b * st.v; st.v += st.a * dt; st.x += st.v * dt; if (st.t > 60) st.done = true; },
    view(p) { return p.ori === 'h' ? { x0: -1.05, x1: 1.05, y0: -0.08, y1: 0.7, bottom: true } : { x0: -1.2, x1: 1.2, y0: -1.25, y1: 0.12 }; },
    draw(g, st, p, o) {
      const s = 0.12 + 0.06 * Math.cbrt(p.m);
      if (p.ori === 'h') {
        g.ground(-1, 1, 0); g.wall(-0.9, 0, 0.42, -1);
        g.line(0, -0.04, 0, 0.5, { c: '--muted', dash: [4, 4], w: 1 }); g.text(0, 0.56, 'สมดุล', { fs: 10, c: '--muted' });
        if (o.Amp > 0) { g.line(-o.Amp, 0.02, -o.Amp, 0.42, { c: '--line', dash: [2, 4], w: 1 }); g.line(o.Amp, 0.02, o.Amp, 0.42, { c: '--line', dash: [2, 4], w: 1 }); g.text(o.Amp, 0.47, '+A', { fs: 10, c: '--muted' }); g.text(-o.Amp, 0.47, '−A', { fs: 10, c: '--muted' }); }
        g.spring(-0.9, s / 2, st.x - s / 2, s / 2, { n: 12, amp: 8 });
        g.box(st.x, s / 2, s, s, 0, { fill: '--c2', label: p.m + ' kg', fs: 10 });
        if (Math.abs(st.v) > 0.01) g.vec(st.x, s + 0.08, st.v * 50, 0, { px: true, c: '--c1', w: 2.5, label: 'v' });
        if (Math.abs(st.a) > 0.01) g.vec(st.x, s + 0.2, st.a * 50 / Math.max(1, o.w), 0, { px: true, c: '--c3', w: 2.5, label: 'a' });
        g.barsPx(g.W - 120, 110, [{ label: 'Eₖ', v: 0.5 * p.m * st.v * st.v, c: '--c1' }, { label: 'Eₚ', v: 0.5 * p.k * st.x * st.x, c: '--c4' }, { label: 'รวม', v: 0.5 * p.m * st.v * st.v + 0.5 * p.k * st.x * st.x, c: '--muted' }], { max: Math.max(1e-9, o.E), h: 80, bw: 20, gap: 8 });
      } else {
        const L0 = 0.35, yeq = -L0 - o.xeq * 0.6 - 0.15, y = yeq - st.x * 0.6;
        g.line(-0.4, 0, 0.4, 0, { w: 4 });
        g.spring(0, 0, 0, y + s / 2, { n: 12, amp: 8 }); g.box(0, y, s, s, 0, { fill: '--c2', label: p.m + ' kg', fs: 10 });
        g.line(-0.5, yeq, 0.5, yeq, { c: '--muted', dash: [4, 4], w: 1 }); g.text(0.52, yeq, 'สมดุล (ยืด mg/k)', { a: 'left', fs: 10, c: '--muted', base: 'middle' });
        if (Math.abs(st.v) > 0.01) g.vec(s, y, 0, -st.v * 50, { px: true, c: '--c1', w: 2.5, label: 'v' });
        g.textPx(12, 22, 'แนวดิ่ง: แรงลัพธ์ = −k × (ระยะจากจุดสมดุล) จึงสั่นแบบเดียวกับแนวระดับ', { a: 'left', fs: 12, c: '--muted' });
      }
    }
  },
  handles(p) { const s = 0.12 + 0.06 * Math.cbrt(p.m); if (p.ori === 'h') return [{ id: 'A', x: p.A, y: s / 2, set: x => ({ A: clamp(x, -0.5, 0.5) }) }]; const yeq = -0.35 - p.m * p.g / p.k * 0.6 - 0.15; return [{ id: 'A', x: 0, y: yeq - p.A * 0.6, set: (x, y) => ({ A: clamp((yeq - y) / 0.6, -0.5, 0.5) }) }]; },
  plot: { series: [{ label: 'x', unit: 'm', c: '--c2', f: s => s.x }, { label: 'v', unit: 'm/s', c: '--c1', f: s => s.v }, { label: 'a', unit: 'm/s²', c: '--c3', f: s => s.a }, { label: 'Eₖ', unit: 'J', c: '--c5', f: (s, p) => 0.5 * p.m * s.v * s.v, on: false }] },
  live: [{ name: 'x', unit: 'm', f: s => s.x }, { name: 'v', unit: 'm/s', f: s => s.v }, { name: 'a', unit: 'm/s²', f: s => s.a }],
  three: {
    cam(p) { return p.ori === 'h' ? { pos: [0.3, 0.6, 1.6], target: [0, 0.1, 0] } : { pos: [0.9, -0.4, 1.4], target: [0, -0.55, 0] }; },
    build(T, p, o) {
      const s = 0.12 + 0.06 * Math.cbrt(p.m);
      if (p.ori === 'h') { T.floor(3, { step: 0.1 }); const w = T.box(0.05, 0.4, 0.4, '--ground'); w.position.set(-0.92, 0.2, 0); }
      else { const c = T.box(0.8, 0.04, 0.4, '--ink'); c.position.y = 0.02; }
      const o3 = { r: 0.008, pad: 0.05 }, v3 = Object.assign({ kind: 'v' }, o3);
      return { spr: T.spring('--spring', { coils: 14, r: 0.035 }), box: T.box(s, s, s, '--c2'), s, aS: T.vec('--c4', 'แรงสปริง', o3), aW: T.vec('--c1', 'mg', o3), aV: T.vec('--c1', 'v', v3), aA: T.vec('--c3', 'a', v3) };
    },
    update(ob, st, p, o) {
      const Amp = Math.max(o.Amp, 0.05), kf = 0.3 / Math.max(p.k * (Amp + (p.ori === 'h' ? 0 : o.xeq)), p.m * p.g, 1e-9), kv = 0.25 / Math.max(1e-6, Amp * o.w), ka = 0.2 / Math.max(1e-6, Amp * o.w * o.w);
      if (p.ori === 'h') {
        const P = [st.x, ob.s / 2, ob.s / 2 + 0.01]; ob.box.position.set(st.x, ob.s / 2, 0); ob.spr.set2([-0.9, ob.s / 2, 0], [st.x - ob.s / 2, ob.s / 2, 0]);
        const F = -p.k * st.x; Math.abs(F) > 1e-6 ? ob.aS.set(P, [F * kf, 0, 0], 'F = −kx = ' + fmt(F) + ' N') : ob.aS.hide(); ob.aW.hide();
        Math.abs(st.v) > 1e-3 ? ob.aV.set([st.x, ob.s + 0.06, 0], [st.v * kv, 0, 0], 'v ' + fmt(st.v) + ' m/s') : ob.aV.hide();
        Math.abs(st.a) > 1e-3 ? ob.aA.set([st.x, ob.s + 0.16, 0], [st.a * ka, 0, 0], 'a ' + fmt(st.a) + ' m/s²') : ob.aA.hide();
      } else {
        const yeq = -0.35 - o.xeq * 0.6 - 0.15, y = yeq - st.x * 0.6, P = [0, y, ob.s / 2 + 0.01]; ob.box.position.set(0, y, 0); ob.spr.set2([0, 0, 0], [0, y + ob.s / 2, 0]);
        const Fs = p.k * (o.xeq + st.x); ob.aS.set(P, [0, Fs * kf, 0], 'แรงสปริง ' + fmt(Fs) + ' N'); ob.aW.set(P, [0, -p.m * p.g * kf, 0], 'mg ' + fmt(p.m * p.g) + ' N');
        Math.abs(st.v) > 1e-3 ? ob.aV.set([ob.s * 0.9, y, 0], [0, -st.v * kv, 0], 'v') : ob.aV.hide();
        Math.abs(st.a) > 1e-3 ? ob.aA.set([-ob.s * 0.9, y, 0], [0, -st.a * ka, 0], 'a') : ob.aA.hide();
      }
    }
  },
  notes: ['x กับ a มีทิศตรงข้ามเสมอ ความเร่งมากที่สุดที่ปลายสุด และเป็นศูนย์ที่จุดสมดุล', 'อัตราเร็วมากที่สุดที่จุดสมดุล เป็นศูนย์ที่ปลายสุด', 'คาบไม่ขึ้นกับแอมพลิจูด (ลองดึงมากน้อยต่างกัน)', 'สปริงแนวดิ่งมีคาบเท่าแนวระดับ แรงโน้มถ่วงเพียงเลื่อนจุดสมดุลลง', 'ลากกล่องเพื่อกำหนดระยะดึงเริ่มต้น']
});

// ---------- 2 ลูกตุ้มอย่างง่าย ----------
const agm = (a, b) => { for (let i = 0; i < 30; i++) { const a1 = (a + b) / 2, b1 = Math.sqrt(a * b); a = a1; b = b1; } return a; };
CASES.push({
  name: 'ลูกตุ้มอย่างง่าย', aspect: 16 / 9, title: 'ลูกตุ้มอย่างง่าย (เทียบสูตรมุมเล็ก)',
  desc: 'ลูกตุ้มจริง (สีส้ม) แกว่งตามสมการเต็ม ลูกตุ้มเงา (สีเทา) แกว่งตามสูตรมุมเล็ก ปล่อยที่มุมเล็กทั้งสองแทบซ้อนกัน มุมใหญ่ลูกตุ้มจริงช้ากว่า',
  formula: 'T ≈ 2π√(L/g) (มุมเล็ก) &nbsp;|&nbsp; คาบไม่ขึ้นกับมวล &nbsp;|&nbsp; a = −(g/L)x เมื่อมุมเล็ก',
  params: [
    { id: 'L', label: 'ความยาวเชือก', unit: 'm', min: 0.1, max: 5, step: 0.01, def: 1 },
    { id: 'th0', label: 'มุมปล่อย', unit: '°', min: 1, max: 170, step: 0.5, def: 20 },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 },
    { id: 'm', label: 'มวลลูกตุ้ม', unit: 'kg', min: 0.05, max: 5, step: 0.05, def: 0.5 },
    { id: 'b', label: 'การหน่วง', unit: '1/s', min: 0, max: 1, step: 0.01, def: 0 },
    { id: 'ghost', label: 'แสดงลูกตุ้มสูตรมุมเล็ก', type: 'bool', def: 1 }
  ],
  presets: [{ label: 'มุมเล็ก 5°', set: { th0: 5 } }, { label: 'มุมใหญ่ 90°', set: { th0: 90 } }, { label: 'ดวงจันทร์', set: { g: 1.6 } }],
  outs: [{ id: 'T0', name: 'คาบจากสูตรมุมเล็ก', unit: 's' }, { id: 'T', name: 'คาบจริง', unit: 's' }, { id: 'err', name: 'สูตรมุมเล็กคลาดไป', unit: '%' }, { id: 'vmax', name: 'อัตราเร็วสูงสุด', unit: 'm/s' }, { id: 'Tmax', name: 'แรงตึงสูงสุด', unit: 'N' }],
  compute(p) { const T0 = 2 * Math.PI * Math.sqrt(p.L / p.g), k = Math.sin(p.th0 * RAD / 2), T = T0 / agm(1, Math.sqrt(1 - k * k)); const vmax = Math.sqrt(2 * p.g * p.L * (1 - Math.cos(p.th0 * RAD))); return { T0, T, err: (T / T0 - 1) * 100, vmax, Tmax: p.m * (p.g + vmax * vmax / p.L) }; },
  sim: {
    dt: 1 / 1000,
    init(p) { return { th: p.th0 * RAD, w: 0, ths: p.th0 * RAD }; },
    step(st, dt, p) { st.w += (-p.g / p.L * Math.sin(st.th) - 2 * p.b * st.w) * dt; st.th += st.w * dt; const w0 = Math.sqrt(p.g / p.L), t = st.t + dt; st.ths = p.th0 * RAD * Math.exp(-p.b * t) * Math.cos(w0 * t); if (st.t > 60) st.done = true; },
    view(p) { return { x0: -p.L * 1.35, x1: p.L * 1.35, y0: -p.L * 1.12, y1: p.L * (p.th0 > 90 ? 1.1 : 0.15) }; },
    draw(g, st, p, o) {
      g.line(-p.L * 0.3, 0, p.L * 0.3, 0, { w: 4 }); g.line(0, 0, 0, -p.L * 1.05, { c: '--muted', dash: [4, 4], w: 1 });
      g.path(Array.from({ length: 61 }, (_, i) => { const a = (-1 + i / 30) * p.th0 * RAD; return [p.L * Math.sin(a), -p.L * Math.cos(a)]; }), { c: '--line', w: 1, dash: [2, 4] });
      const r = 0.05 * p.L + 0.02;
      if (p.ghost) { const x = p.L * Math.sin(st.ths), y = -p.L * Math.cos(st.ths); g.line(0, 0, x, y, { c: '--muted', w: 1.5, alpha: 0.5 }); g.circle(x, y, r, { fill: '--muted', c: 'none', alpha: 0.45 }); }
      const x = p.L * Math.sin(st.th), y = -p.L * Math.cos(st.th);
      g.line(0, 0, x, y, { c: '--rope', w: 2 }); g.circle(x, y, r, { fill: '--c1', c: '--ink', w: 1.5 });
      const v = st.w * p.L; if (Math.abs(v) > 0.02) g.vec(x, y, Math.cos(st.th) * v * 30, Math.sin(st.th) * v * 30, { px: true, c: '--c2', w: 2.5, label: 'v' });
      const Ft = -p.m * p.g * Math.sin(st.th); g.vec(x, y, Math.cos(st.th) * Ft * 15 / p.m, Math.sin(st.th) * Ft * 15 / p.m, { px: true, c: '--c3', w: 2.5, label: 'mg sin θ', lside: -1 });
      g.textPx(12, 22, `θ = ${fmt(st.th * DEG)}°`, { a: 'left', fs: 13, b: true });
    }
  },
  handles(p) { const a = p.th0 * RAD; return [{ id: 'th0', x: p.L * Math.sin(a), y: -p.L * Math.cos(a), set: (x, y) => ({ th0: clamp(Math.abs(Math.atan2(x, -y)) * DEG, 1, 170) }) }]; },
  plot: { overlay: true, yLabel: 'θ (องศา)', series: [{ label: 'θ จริง', unit: '°', c: '--c1', f: s => s.th * DEG }, { label: 'θ สูตรมุมเล็ก', unit: '°', c: '--muted', f: s => s.ths * DEG }] },
  live: [{ name: 'θ', unit: '°', f: s => s.th * DEG }, { name: 'v', unit: 'm/s', f: (s, p) => s.w * p.L }],
  three: {
    cam(p) { return { pos: [p.L * 0.8, -p.L * 0.2, p.L * 2.2], target: [0, -p.L * 0.6, 0] }; },
    build(T, p) { const c = T.box(p.L * 0.6, 0.03, 0.3, '--ink'); c.position.y = 0.015; T.floor(p.L * 4, { y: -p.L * 1.25, step: 0.25 }); const o3 = { r: 0.006 * p.L + 0.002, pad: 0.06 * p.L }; return { rope: T.line('--rope', { max: 2 }), bob: T.sphere(0.05 * p.L + 0.02, '--c1'), tr: T.trail('--c1', 600), aT: T.vec('--c4', 'T', o3), aW: T.vec('--c1', 'mg', o3), aR: T.vec('--c3', 'mg sin θ', Object.assign({ line: false, opacity: 0.6 }, o3)), aV: T.vec('--c2', 'v', Object.assign({ kind: 'v' }, o3)) }; },
    update(ob, st, p, o) {
      const s = Math.sin(st.th), c = Math.cos(st.th), x = p.L * s, y = -p.L * c; ob.rope.set([[0, 0, 0], [x, y, 0]]); ob.bob.position.set(x, y, 0); ob.tr.push([x, y, 0]);
      const W = p.m * p.g, Tn = p.m * (p.g * c + p.L * st.w * st.w), k = p.L * 0.4 / Math.max(W, o.Tmax, 1e-9), P = [x, y, 0.05 * p.L + 0.03], v = st.w * p.L;
      ob.aT.set(P, [-s * Tn * k, c * Tn * k, 0], 'T ' + fmt(Tn) + ' N'); ob.aW.set(P, [0, -W * k, 0], 'mg ' + fmt(W) + ' N');
      Math.abs(s) > 1e-3 ? ob.aR.set(P, [-c * W * s * k, -s * W * s * k, 0], 'mg sin θ') : ob.aR.hide();
      Math.abs(v) > 0.02 ? ob.aV.set([x, y, -0.05 * p.L - 0.03], [c * v * p.L * 0.15, s * v * p.L * 0.15, 0], 'v ' + fmt(Math.abs(v)) + ' m/s') : ob.aV.hide();
    }
  },
  notes: ['คาบไม่ขึ้นกับมวล และแทบไม่ขึ้นกับมุมถ้ามุมเล็ก (น้อยกว่าประมาณ 15°)', 'ที่มุม 90° คาบจริงยาวกว่าสูตรมุมเล็กประมาณ 18%', 'แรงดึงกลับคือ mg sin θ ซึ่งแปรผันตาม θ เฉพาะเมื่อมุมเล็ก จึงเป็น SHM โดยประมาณ', 'ลากลูกตุ้มเพื่อเลือกมุมปล่อย']
});

// ---------- 3 วงกลมอ้างอิง ----------
CASES.push({
  name: 'วงกลมอ้างอิง', aspect: 2.3, title: 'SHM คือเงาของการเคลื่อนที่แบบวงกลม',
  desc: 'จุดหมุนรอบวงกลมด้วยอัตราเร็วเชิงมุมคงที่ เงาของจุดบนแกนแนวดิ่งเคลื่อนที่แบบ SHM และวาดกราฟการกระจัดกับเวลาออกมาทางขวาเป็นเส้นไซน์',
  formula: 'x = A sin(ωt + φ) &nbsp;|&nbsp; v = Aω cos(ωt + φ) &nbsp;|&nbsp; a = −Aω² sin(ωt + φ) &nbsp;|&nbsp; ω = 2πf',
  params: [
    { id: 'A', label: 'แอมพลิจูด (A)', unit: 'm', min: 0.1, max: 2, step: 0.01, def: 1 },
    { id: 'f', label: 'ความถี่ (f)', unit: 'Hz', min: 0.05, max: 2, step: 0.01, def: 0.4 },
    { id: 'phi', label: 'มุมเฟสเริ่มต้น (φ)', unit: '°', min: -180, max: 180, step: 5, def: 0 }
  ],
  outs: [{ id: 'w', name: 'ω', unit: 'rad/s' }, { id: 'T', name: 'คาบ', unit: 's' }, { id: 'vmax', name: 'v สูงสุด', unit: 'm/s' }, { id: 'amax', name: 'a สูงสุด', unit: 'm/s²' }],
  compute(p) { const w = 2 * Math.PI * p.f; return { w, T: 1 / p.f, vmax: w * p.A, amax: w * w * p.A }; },
  sim: {
    dt: 1 / 240,
    init() { return { tr: [] }; },
    step(st, dt, p, o) { const ph = o.w * (st.t + dt) + p.phi * RAD; st.ph = ph; st.y = p.A * Math.sin(ph); st.tr.push([st.t + dt, st.y]); if (st.tr.length > 4000) st.tr.shift(); if (st.t > 120) st.done = true; },
    view(p) { return { x0: -p.A * 1.4, x1: p.A * 5.6, y0: -p.A * 1.25, y1: p.A * 1.25 }; },
    draw(g, st, p, o) {
      const A = p.A, ph = st.ph != null ? st.ph : p.phi * RAD, x = A * Math.cos(ph), y = A * Math.sin(ph), x0 = A * 1.5, sc = A * 3.8 / (2 * o.T);
      g.circle(0, 0, A, { c: '--line', w: 1.5 }); g.line(-A * 1.2, 0, A * 1.2, 0, { c: '--muted', w: 1 }); g.line(0, -A * 1.2, 0, A * 1.2, { c: '--muted', w: 1 });
      g.line(0, 0, x, y, { c: '--c4', w: 2 }); g.circle(x, y, 6, { px: true, fill: '--c4', c: 'none' });
      g.angle(0, 0, 26, 0, ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), 'ωt+φ');
      g.line(x, y, x0, y, { c: '--muted', dash: [3, 4], w: 1 });
      g.line(x0, -A * 1.2, x0, A * 1.2, { c: '--ink', w: 1 }); g.circle(x0, y, 7, { px: true, fill: '--c1', c: '--ink' });
      g.vec(x0, y, 0, A * o.w * Math.cos(ph) * 28 / Math.max(1e-9, A * o.w), { px: true, c: '--c2', w: 2.5, label: 'v' });
      // กราฟ x-t เลื่อน
      const gx = x0 + 0.1, tNow = st.t || 0;
      g.line(gx, 0, gx + 2 * o.T * sc, 0, { c: '--muted', w: 1 });
      g.path(st.tr.filter(q => tNow - q[0] < 2 * o.T).map(q => [gx + (tNow - q[0]) * sc, q[1]]), { c: '--c1', w: 2.2 });
      g.text(gx + 2 * o.T * sc, -A * 1.15, '← เวลาที่ผ่านมา (2 คาบ)', { a: 'right', fs: 10, c: '--muted' });
    }
  },
  plot: { series: [{ label: 'x', unit: 'm', c: '--c1', f: (s, p, o) => p.A * Math.sin(o.w * s.t + p.phi * RAD) }, { label: 'v', unit: 'm/s', c: '--c2', f: (s, p, o) => p.A * o.w * Math.cos(o.w * s.t + p.phi * RAD) }, { label: 'a', unit: 'm/s²', c: '--c3', f: (s, p, o) => -p.A * o.w * o.w * Math.sin(o.w * s.t + p.phi * RAD) }] },
  notes: ['ความเร็วของเงาเท่ากับองค์ประกอบแนวดิ่งของความเร็วจุดบนวงกลม (Aω cos)', 'v นำหน้า x อยู่ 90° และ a นำหน้า x อยู่ 180° (ตรงข้ามกัน)', 'มุมเฟส φ บอกว่าเริ่มที่ตำแหน่งใดของรอบ']
});

// ---------- 4 สปริงต่อกัน ----------
CASES.push({
  name: 'สปริงอนุกรม-ขนาน', aspect: 2.2, title: 'การต่อสปริงแบบอนุกรมและขนาน',
  desc: 'ต่อสปริงสองตัวแบบอนุกรมหรือขนานกับมวลเดียวกัน ดูค่าคงที่สปริงรวมและคาบที่เปลี่ยนไป',
  formula: 'ขนาน k = k₁ + k₂ &nbsp;|&nbsp; อนุกรม 1/k = 1/k₁ + 1/k₂ &nbsp;|&nbsp; T = 2π√(m/k)',
  params: [
    { id: 'cfg', label: 'การต่อ', opts: [['one', 'ตัวเดียว (k₁)'], ['ser', 'อนุกรม'], ['par', 'ขนาน']], def: 'ser' },
    { id: 'k1', label: 'k₁', unit: 'N/m', min: 5, max: 300, step: 1, def: 50 },
    { id: 'k2', label: 'k₂', unit: 'N/m', min: 5, max: 300, step: 1, def: 50 },
    { id: 'm', label: 'มวล', unit: 'kg', min: 0.1, max: 10, step: 0.1, def: 1 },
    { id: 'A', label: 'แอมพลิจูด', unit: 'm', min: 0.02, max: 0.3, step: 0.01, def: 0.15 }
  ],
  outs: [{ id: 'k', name: 'k รวม', unit: 'N/m' }, { id: 'T', name: 'คาบ', unit: 's' }, { id: 'T1', name: 'คาบถ้าใช้ k₁ ตัวเดียว', unit: 's' }],
  compute(p) { const k = p.cfg === 'one' ? p.k1 : p.cfg === 'ser' ? 1 / (1 / p.k1 + 1 / p.k2) : p.k1 + p.k2; return { k, T: 2 * Math.PI * Math.sqrt(p.m / k), T1: 2 * Math.PI * Math.sqrt(p.m / p.k1) }; },
  sim: {
    dt: 1 / 1000,
    init(p) { return { x: p.A, v: 0 }; },
    step(st, dt, p, o) { st.v += -o.k / p.m * st.x * dt; st.x += st.v * dt; if (st.t > 60) st.done = true; },
    view() { return { x0: -1.05, x1: 1.0, y0: -0.12, y1: 0.75 }; },
    draw(g, st, p, o) {
      const s = 0.18, X = 0.25 + st.x; g.ground(-1, 1, 0); g.wall(-0.95, 0, 0.6, -1);
      if (p.cfg === 'one') g.spring(-0.95, s / 2, X - s / 2, s / 2, { n: 12 });
      else if (p.cfg === 'ser') { const mid = -0.95 + (X - s / 2 + 0.95) * (p.k2 / (p.k1 + p.k2)); g.spring(-0.95, s / 2, mid, s / 2, { n: 8, c: '--c1' }); g.circle(mid, s / 2, 4, { px: true, fill: '--ink' }); g.spring(mid, s / 2, X - s / 2, s / 2, { n: 8, c: '--c3' }); g.text(-0.7, s + 0.08, 'k₁', { fs: 12, b: true, c: '--c1' }); g.text(mid + 0.2, s + 0.08, 'k₂', { fs: 12, b: true, c: '--c3' }); }
      else { g.spring(-0.95, s * 0.8, X - s / 2, s * 0.8, { n: 10, c: '--c1', amp: 5 }); g.spring(-0.95, s * 0.25, X - s / 2, s * 0.25, { n: 10, c: '--c3', amp: 5 }); g.text(-0.5, s + 0.12, 'k₁', { fs: 12, b: true, c: '--c1' }); g.text(-0.5, s * 0.25 - 0.08, 'k₂', { fs: 12, b: true, c: '--c3' }); }
      g.box(X, s / 2, s, s, 0, { fill: '--c2', label: p.m + ' kg', fs: 10 });
      g.textPx(12, 22, `k รวม = ${fmt(o.k)} N/m   T = ${fmt(o.T)} s`, { a: 'left', fs: 13, b: true });
    }
  },
  plot: { series: [{ label: 'x', unit: 'm', c: '--c2', f: s => s.x }] },
  notes: ['ต่ออนุกรม สปริงรวมอ่อนลง (k น้อยลง) คาบยาวขึ้น', 'ต่อขนาน สปริงรวมแข็งขึ้น คาบสั้นลง', 'สปริงเหมือนกันสองตัว อนุกรมได้ k/2 ขนานได้ 2k คาบต่างกัน 2 เท่า', 'ต่ออนุกรม สปริงแต่ละตัวรับแรงเท่ากัน ตัวที่ k น้อยยืดมากกว่า']
});

Lab.add('shm', CASES);
})();
