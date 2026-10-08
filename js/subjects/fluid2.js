/* บทที่ 13 ของไหล — แบบจำลองเคลื่อนไหว (ส่วนภาพนิ่งอยู่ใน fluid.js) */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
const G = 9.8;
const LIQ = { water: ['น้ำ', 1000], salt: ['น้ำเกลือ', 1200], oil: ['น้ำมันพืช', 920], alc: ['แอลกอฮอล์', 790], hg: ['ปรอท', 13600] };
const LOPT = Object.keys(LIQ).map(k => [k, LIQ[k][0]]);

// ---------- 1 ลอยหรือจม ----------
CASES.push({
  name: 'ปล่อยวัตถุลงน้ำ', group: 'แบบจำลองเคลื่อนไหว', aspect: 16 / 10, title: 'ปล่อยกล่องลงในของเหลว ลอย ปริ่ม หรือจม',
  desc: 'ปล่อยกล่องลูกบาศก์จากเหนือผิวของเหลว กล่องตกลงไป แรงลอยตัวเพิ่มตามปริมาตรส่วนที่จม จนสมดุลหรือจมถึงก้น ระดับของเหลวสูงขึ้นตามปริมาตรที่ถูกแทนที่ ลากกล่องเพื่อเลือกจุดปล่อย',
  formula: 'B = ρ<sub>ของเหลว</sub>gV<sub>จม</sub> &nbsp;|&nbsp; ลอย: V<sub>จม</sub>/V = ρ<sub>วัตถุ</sub>/ρ<sub>ของเหลว</sub> &nbsp;|&nbsp; น้ำหนักปรากฏ = mg − B',
  params: [
    { id: 'rho', label: 'ความหนาแน่นกล่อง', unit: 'kg/m³', min: 100, max: 8000, step: 10, def: 600 },
    { id: 'a', label: 'ขนาดกล่อง (ด้าน)', unit: 'cm', min: 5, max: 40, step: 1, def: 20 },
    { id: 'liq', label: 'ของเหลว', opts: LOPT, def: 'water' },
    { id: 'h0', label: 'ความสูงจุดปล่อยเหนือผิว', unit: 'cm', min: 0, max: 40, step: 1, def: 15 },
    { id: 'W', label: 'ความกว้างถัง', unit: 'cm', min: 40, max: 120, step: 1, def: 60 }
  ],
  presets: [{ label: 'ไม้ลอย', set: { rho: 600, liq: 'water' } }, { label: 'น้ำแข็ง', set: { rho: 917, liq: 'water' } }, { label: 'เหล็กในปรอท', set: { rho: 7800, liq: 'hg' } }, { label: 'เหล็กในน้ำ', set: { rho: 7800, liq: 'water' } }],
  outs: [{ id: 'm', name: 'มวลกล่อง', unit: 'kg' }, { id: 'frac', name: 'ส่วนที่จม (ตอนสมดุล)', unit: '%' }, { id: 'B', name: 'แรงลอยตัวตอนสมดุล', unit: 'N' }, { id: 'Wa', name: 'น้ำหนักปรากฏ (ถ้าจม)', unit: 'N' }, { id: 'res', name: 'ผล', unit: '' }],
  compute(p) { const a = p.a / 100, V = a ** 3, m = p.rho * V, rl = LIQ[p.liq][1], fr = Math.min(1, p.rho / rl); return { m, frac: fr * 100, B: rl * G * V * fr, Wa: p.rho > rl ? (p.rho - rl) * G * V : 0, res: p.rho < rl ? 'ลอย' : p.rho === rl ? 'ลอยปริ่ม' : 'จม', _rl: rl }; },
  sim: {
    dt: 1 / 1000,
    init(p) { const a = p.a / 100; return { y: 0.5 + p.h0 / 100, v: 0, a }; },   // y = ก้นกล่องวัดจากก้นถัง
    step(st, dt, p, o) {
      const a = st.a, W = p.W / 100, H0 = 0.5, Vb = a * a * a, m = p.rho * Vb, rl = o._rl;
      // ระดับน้ำเมื่อกล่องจมลึก d: H = H0 + a²d/W² (ถังลึก W)
      let sub = 0; for (let i = 0; i < 3; i++) { const H = H0 + a * a * sub / (W * W); sub = clamp(H - st.y, 0, a); }
      st.sub = sub; st.H = H0 + a * a * sub / (W * W);
      const B = rl * G * a * a * sub, drag = -(sub > 0 ? 30 * rl * a * a : 0.5) * st.v * Math.abs(st.v) - (sub > 0 ? 4 * m : 0) * st.v;
      let F = B - m * G + drag; let acc = F / m;
      st.v += acc * dt; st.y += st.v * dt; st.B = B;
      if (st.y <= 0) { st.y = 0; st.v = Math.max(0, st.v); st.N = Math.max(0, m * G - B); } else st.N = 0;
      if (st.t > 1 && Math.abs(st.v) < 1e-3) { st.calm = (st.calm || 0) + dt; if (st.calm > 0.5) st.done = true; } else st.calm = 0;
      if (st.t > 15) st.done = true;
    },
    view(p) { const W = p.W / 100; return { x0: -W * 0.75, x1: W * 0.75 + 0.4, y0: -0.05, y1: 1.1 + p.h0 / 100 * 0.3 }; },
    draw(g, st, p, o) {
      const W = p.W / 100, a = st.a, H = st.H || 0.5;
      g.rect(-W / 2, 0, W, H, { fill: '--water-soft', c: 'none', alpha: 0.9 }); g.line(-W / 2, H, W / 2, H, { c: '--water', w: 2 });
      g.path([[-W / 2, 0.95], [-W / 2, 0], [W / 2, 0], [W / 2, 0.95]], { c: '--ink', w: 3 });
      g.line(-W / 2 - 0.02, 0.5, -W / 2 + 0.03, 0.5, { c: '--muted' }); g.text(-W / 2 - 0.03, 0.5, 'ระดับเดิม', { a: 'right', fs: 10, c: '--muted', base: 'middle' });
      g.box(0, st.y + a / 2, a, a, 0, { fill: '--block2', label: fmt(p.rho) });
      const k = 80 / Math.max(o.m * G, st.B || 0, 1e-9);
      g.vec(0, st.y + a / 2, 0, -o.m * G * k, { px: true, c: '--c1', w: 3, label: 'mg' });
      if (st.B > 0.01) g.vec(a * 0.3, st.y + a / 2, 0, st.B * k, { px: true, c: '--c2', w: 3, label: 'B ' + fmt(st.B) + ' N' });
      if (st.N > 0.01) g.vec(-a * 0.3, st.y, 0, st.N * k, { px: true, c: '--c3', w: 2.5, label: 'N พื้น', lside: -1 });
      // แท่งแสดงแรง
      g.textPx(12, 22, `จม ${fmt((st.sub || 0) / a * 100)}%  ระดับของเหลวสูงขึ้น ${fmt(((H - 0.5) * 100))} cm`, { a: 'left', fs: 13, b: true });
    }
  },
  handles(p) { return [{ id: 'h0', x: 0, y: 0.5 + p.h0 / 100 + p.a / 200, set: (x, y) => ({ h0: clamp((y - 0.5 - p.a / 200) * 100, 0, 40) }) }]; },
  plot: { series: [{ label: 'แรงลอยตัว', unit: 'N', c: '--c2', f: s => s.B || 0 }, { label: 'ความลึกก้นกล่อง', unit: 'cm', c: '--c1', f: s => ((s.H || 0.5) - s.y) * 100 }] },
  live: [{ name: 'B', unit: 'N', f: s => s.B || 0 }, { name: 'v', unit: 'm/s', f: s => s.v }],
  three: {
    cam(p) { const W = p.W / 100; return { pos: [W * 0.9, 0.9, W * 1.6], target: [0, 0.4, 0] }; },
    build(T, p) { const W = p.W / 100; T.floor(3, { step: 0.1 }); const glass = T.box(W, 1, W, '--water', { opacity: 0.08, cast: false }); glass.position.y = 0.5; const eg = new T.THREE.LineSegments(new T.THREE.EdgesGeometry(new T.THREE.BoxGeometry(W, 1, W)), new T.THREE.LineBasicMaterial({ color: T.color('--ink') })); eg.position.y = 0.5; T.scene.add(eg); const wat = T.box(W * 0.98, 1, W * 0.98, '--water', { opacity: 0.35, cast: false }); const blk = T.box(p.a / 100, p.a / 100, p.a / 100, '--block2'), o3 = { r: 0.008, pad: 0.05 }; return { wat, blk, aW: T.vec('--c1', 'mg', o3), aB: T.vec('--c2', 'B', o3), aN: T.vec('--c3', 'N', o3) }; },
    update(ob, st, p, o) {
      const H = st.H || 0.5, a = st.a; ob.wat.scale.y = H; ob.wat.position.y = H / 2; ob.blk.position.y = st.y + a / 2;
      const k = 0.32 / Math.max(o.m * G, st.B || 0, 1e-9), z = a / 2 + 0.01, yc = st.y + a / 2;
      ob.aW.set([0, yc, z], [0, -o.m * G * k, 0], 'mg ' + fmt(o.m * G) + ' N');
      if (st.B > 0.01) ob.aB.set([a * 0.3, yc, z], [0, st.B * k, 0], 'B ' + fmt(st.B) + ' N'); else ob.aB.hide();
      if (st.N > 0.01) ob.aN.set([-a * 0.3, st.y, z], [0, st.N * k, 0], 'N ' + fmt(st.N) + ' N'); else ob.aN.hide();
    }
  },
  notes: ['วัตถุลอย แรงลอยตัวเท่ากับน้ำหนักพอดี ไม่ว่าจะเป็นของเหลวอะไร แต่จมลึกต่างกัน', 'ส่วนที่จม = ρวัตถุ/ρของเหลว เช่น น้ำแข็งในน้ำจมประมาณ 92%', 'วัตถุจม แรงลอยตัวสูงสุด = ρของเหลว gV ที่เหลือพื้นรับไว้', 'ลากกล่องขึ้นลงเพื่อเปลี่ยนความสูงที่ปล่อย']
});

// ---------- 2 หลอดรูปตัวยู ----------
CASES.push({
  name: 'หลอดรูปตัวยู', group: 'แบบจำลองเคลื่อนไหว', aspect: 16 / 9, title: 'หลอดรูปตัวยูกับของเหลวสองชนิดที่ไม่ผสมกัน',
  desc: 'เทของเหลวชนิดที่สองลงในแขนขวาของหลอดที่มีของเหลวชนิดแรกอยู่ ระดับในสองแขนต่างกัน ความดันที่ระดับรอยต่อเท่ากันทั้งสองข้าง',
  formula: 'ระดับเดียวกันในของเหลวเดียวกันความดันเท่ากัน &nbsp;|&nbsp; ρ₁gh₁ = ρ₂gh₂ (วัดจากระดับรอยต่อ)',
  params: [
    { id: 'l1', label: 'ของเหลวในหลอด (ล่าง)', opts: LOPT, def: 'water' },
    { id: 'l2', label: 'ของเหลวที่เทเพิ่ม (แขนขวา)', opts: LOPT, def: 'oil' },
    { id: 'h2', label: 'ความสูงของเหลวที่เท', unit: 'cm', min: 1, max: 40, step: 0.5, def: 20 }
  ],
  outs: [{ id: 'h1', name: 'ความสูงของเหลวแขนซ้ายเหนือรอยต่อ', unit: 'cm' }, { id: 'dh', name: 'ผิวของเหลวต่างระดับกัน', unit: 'cm' }, { id: 'P', name: 'ความดันเกจที่ระดับรอยต่อ', unit: 'Pa' }],
  compute(p) { const r1 = LIQ[p.l1][1], r2 = LIQ[p.l2][1], h1 = r2 * p.h2 / r1; return { h1, dh: p.h2 - h1, P: r2 * G * p.h2 / 100, _r1: r1, _r2: r2 }; },
  check(p, o) { return o._r2 > o._r1 ? ['ของเหลวที่เทหนาแน่นกว่าของเหลวเดิม ในความจริงจะจมลงไปอยู่ด้านล่าง แบบจำลองนี้ถือว่าอยู่ด้านบนตามโจทย์'] : []; },
  sim: {
    dt: 1 / 60, tmax: 5,
    init() { return { f: 0 }; },
    step(st) { st.f = clamp(st.t / 4, 0, 1); },
    view() { return { x0: -40, x1: 60, y0: -12, y1: 72 }; },
    draw(g, st, p, o) {
      const f = st.f, h2 = p.h2 * f, h1 = o._r2 * h2 / o._r1, base = 25, wA = 8, xL = -14, xR = 14;
      // ระดับเริ่มต้น base ทั้งสองข้าง ต่อมาแขนขวารอยต่อลด d แขนซ้ายเพิ่ม d (หน้าตัดเท่ากัน): base + d = interface + h1, interface = base − d
      const d = h1 / 2, yi = base - d, yl = base + d, yr = yi + h2;
      g.path([[xL - wA / 2, 60], [xL - wA / 2, 0], [xR + wA / 2, 0], [xR + wA / 2, 60]], { c: '--ink', w: 3 });
      g.path([[xL + wA / 2, 60], [xL + wA / 2, 8], [xR - wA / 2, 8], [xR - wA / 2, 60]], { c: '--ink', w: 3 });
      g.path([[xL - wA / 2, 0], [xR + wA / 2, 0], [xR + wA / 2, yi], [xR - wA / 2, yi], [xR - wA / 2, 8], [xL + wA / 2, 8], [xL + wA / 2, yl], [xL - wA / 2, yl]], { close: true, fill: '--water-soft', c: 'none' });
      if (h2 > 0) g.rect(xR - wA / 2, yi, wA, h2, { fill: '--block2', c: 'none', alpha: 0.9 });
      g.line(xL - 10, yi, xR + 14, yi, { c: '--c4', dash: [5, 4], w: 1.5 }); g.text(xR + 15, yi, 'ระดับรอยต่อ (ความดันเท่ากัน)', { a: 'left', fs: 11, c: '--c4', base: 'middle' });
      if (h2 > 0.5) { g.dim(xR + 7, yi, xR + 7, yr, 'h₂ ' + fmt(h2) + ' cm', { off: 0 }); g.dim(xL - 7, yi, xL - 7, yl, 'h₁ ' + fmt(h1) + ' cm', { off: 0 }); }
      g.text(xL, yl + 3, LIQ[p.l1][0], { fs: 11 }); if (h2 > 0) g.text(xR, yr + 3, LIQ[p.l2][0], { fs: 11 });
      if (f < 1) g.vec(xR, yr + 18, 0, -25, { px: true, c: '--c5', w: 3, label: 'กำลังเท' });
    }
  },
  notes: ['ของเหลวที่หนาแน่นน้อยกว่าต้องสูงกว่าจึงให้ความดันเท่ากันที่ระดับรอยต่อ', 'ความต่างระดับของผิวใช้หาความหนาแน่นของของเหลวที่ไม่ทราบค่าได้', 'ระดับที่สูงกว่ารอยต่อในแขนซ้ายไม่ใช่ระดับที่ความดันเท่ากัน เพราะอยู่ในของเหลวต่างชนิดกับแขนขวา']
});

// ---------- 3 การไหลในท่อ ----------
CASES.push({
  name: 'การไหลในท่อ', group: 'แบบจำลองเคลื่อนไหว', aspect: 2.3, title: 'อนุภาคของไหลวิ่งผ่านท่อที่ขนาดไม่เท่ากัน',
  desc: 'จุดเล็กแทนอนุภาคของไหล วิ่งเร็วขึ้นในท่อแคบตามสมการความต่อเนื่อง หลอดวัดความดันแสดงว่าความดันต่ำลงในช่วงที่ไหลเร็ว ดูท่อแบบ 3D ได้',
  formula: 'A₁v₁ = A₂v₂ &nbsp;|&nbsp; P₁ + ½ρv₁² = P₂ + ½ρv₂² &nbsp;|&nbsp; อัตราการไหล Q = Av',
  params: [
    { id: 'r1', label: 'รัศมีท่อกว้าง', unit: 'cm', min: 2, max: 10, step: 0.1, def: 6 },
    { id: 'r2', label: 'รัศมีท่อแคบ', unit: 'cm', min: 1, max: 10, step: 0.1, def: 3 },
    { id: 'v1', label: 'ความเร็วในท่อกว้าง', unit: 'm/s', min: 0.1, max: 4, step: 0.05, def: 1 },
    { id: 'P1', label: 'ความดันเกจในท่อกว้าง', unit: 'kPa', min: 5, max: 100, step: 1, def: 30 }
  ],
  outs: [{ id: 'v2', name: 'ความเร็วในท่อแคบ', unit: 'm/s' }, { id: 'P2', name: 'ความดันในท่อแคบ', unit: 'kPa' }, { id: 'Q', name: 'อัตราการไหล', unit: 'L/s' }],
  compute(p) { const v2 = p.v1 * (p.r1 / p.r2) ** 2, P2 = p.P1 - 0.5 * 1000 * (v2 * v2 - p.v1 * p.v1) / 1000; return { v2, P2, Q: Math.PI * (p.r1 / 100) ** 2 * p.v1 * 1000 }; },
  sim: {
    dt: 1 / 120,
    init(p) { const rn = K.rng(5), P = []; for (let i = 0; i < 140; i++) P.push({ x: rn() * 100, y: rn() * 2 - 1 }); return { P }; },
    step(st, dt, p, o) { st.P.forEach(q => { const r = rad(p, q.x); q.x += p.v1 * (p.r1 / r) ** 2 * dt * 12; if (q.x > 100) { q.x -= 100; } }); },
    view() { return { x0: -2, x1: 102, y0: -18, y1: 36 }; },
    draw(g, st, p, o) {
      const R = x => rad(p, x);
      const top = [], bot = []; for (let x = 0; x <= 100; x += 1) { top.push([x, R(x)]); bot.push([x, -R(x)]); }
      g.path(top.concat(bot.slice().reverse()), { close: true, fill: '--water-soft', c: 'none' }); g.path(top, { c: '--ink', w: 2.5 }); g.path(bot, { c: '--ink', w: 2.5 });
      st.P.forEach(q => { const r = R(q.x); g.circle(q.x, q.y * r * 0.9, 2.5, { px: true, fill: '--c2', c: 'none' }); });
      const tube = (x, P, lab) => { const h = P / 100 * 22 + 1; g.rect(x - 1.2, R(x), 2.4, 30, { fill: '--panel', c: '--ink', w: 1.2 }); g.rect(x - 1.1, R(x), 2.2, h, { fill: '--water', c: 'none', alpha: 0.7 }); g.text(x, R(x) + h + 2, lab + ' ' + fmt(P) + ' kPa', { fs: 11, b: true }); };
      tube(15, p.P1, 'P₁'); tube(50, o.P2, 'P₂');
      g.text(15, -R(15) - 4, 'v₁ = ' + fmt(p.v1) + ' m/s', { fs: 11, c: '--c2' }); g.text(50, -R(50) - 4, 'v₂ = ' + fmt(o.v2) + ' m/s', { fs: 11, c: '--c2' });
    }
  },
  three: {
    cam() { return { pos: [50, 30, 90], target: [50, 0, 0] }; },
    build(T, p) {
      const pts = []; for (let x = 0; x <= 100; x += 1) pts.push(new T.THREE.Vector2(rad(p, x), x));
      const geo = new T.THREE.LatheGeometry(pts, 48); geo.rotateZ(-Math.PI / 2);
      T.mesh(geo, '--water', { opacity: 0.25, side: T.THREE.DoubleSide, cast: false });
      const balls = []; for (let i = 0; i < 140; i++) balls.push(T.sphere(0.5, '--c2', { cast: false }));
      // เวกเตอร์ความเร็วของไหลที่หน้าตัดกว้างและแคบ
      const v2 = p.v1 * (p.r1 / p.r2) ** 2, kv = 14 / Math.max(p.v1, v2), o3 = { kind: 'v', r: 0.45, pad: 3 };
      [[15, p.v1, 'v₁'], [50, v2, 'v₂']].forEach(([x, v, n]) => { const r = rad(p, x); [[0, 0], [0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]].forEach(([a, b], j) => T.vec('--c1', j ? null : '', o3).set([x - v * kv / 2, a * r, b * r], [v * kv, 0, 0], n + ' = ' + fmt(v) + ' m/s')); });
      return { balls };
    },
    update(ob, st, p) { st.P.forEach((q, i) => { const r = rad(p, q.x) * 0.85, a = i * 2.39996; ob.balls[i].position.set(q.x, q.y * r * Math.cos(a), q.y * r * Math.sin(a)); }); }
  },
  notes: ['อนุภาควิ่งเร็วขึ้นในท่อแคบ ปริมาตรที่ไหลผ่านต่อวินาทีเท่ากันทุกหน้าตัด', 'ช่วงท่อแคบความเร็วสูง ความดันต่ำ หลอดวัดจึงมีระดับต่ำกว่า', 'รัศมีลดครึ่งหนึ่ง พื้นที่ลด 4 เท่า ความเร็วเพิ่ม 4 เท่า']
});
function rad(p, x) { const s = t => 1 / (1 + Math.exp(-t)); const k = s((x - 35) / 2.5) - s((x - 65) / 2.5); return p.r1 + (p.r2 - p.r1) * k; }

Lab.add('fluid', CASES);
})();
