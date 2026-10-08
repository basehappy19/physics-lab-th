/* บทที่ 11 ความร้อนและแก๊ส */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
const R = 8.314;

// ---------- 1 แก๊สในกระบอกสูบ ----------
const PROC = [['T', 'อุณหภูมิคงที่'], ['P', 'ความดันคงที่'], ['V', 'ปริมาตรคงที่'], ['Q', 'แอเดียแบติก']];
function gas(p) {
  const g = p.dof === '3' ? 5 / 3 : 7 / 5, Cv = p.dof === '3' ? 1.5 * R : 2.5 * R, n = p.n, V1 = p.V1 / 1000, T1 = p.T1, P1 = n * R * T1 / V1;
  let V2 = p.V2 / 1000, T2, P2;
  if (p.proc === 'T') { T2 = T1; P2 = n * R * T2 / V2; }
  else if (p.proc === 'P') { P2 = P1; T2 = P2 * V2 / (n * R); }
  else if (p.proc === 'V') { V2 = V1; T2 = p.T2; P2 = n * R * T2 / V2; }
  else { P2 = P1 * Math.pow(V1 / V2, g); T2 = P2 * V2 / (n * R); }
  const dU = n * Cv * (T2 - T1);
  const W = p.proc === 'T' ? n * R * T1 * Math.log(V2 / V1) : p.proc === 'P' ? P1 * (V2 - V1) : p.proc === 'V' ? 0 : -dU;
  const path = s => { // s: 0..1
    if (p.proc === 'V') { const T = T1 + (T2 - T1) * s; return { V: V1, T, P: n * R * T / V1 }; }
    const V = V1 + (V2 - V1) * s;
    if (p.proc === 'T') return { V, T: T1, P: n * R * T1 / V };
    if (p.proc === 'P') return { V, T: P1 * V / (n * R), P: P1 };
    const P = P1 * Math.pow(V1 / V, g); return { V, T: P * V / (n * R), P };
  };
  return { P1, P2, V1, V2, T1, T2, dU, W, Q: dU + W, path, g };
}
CASES.push({
  name: 'แก๊สในกระบอกสูบ', aspect: 16 / 9, title: 'แก๊สอุดมคติและกระบวนการทางอุณหพลศาสตร์',
  desc: 'เลือกกระบวนการ ปรับจำนวนโมล ปริมาตร และอุณหภูมิ ลูกบอลเล็กแทนโมเลกุลแก๊สที่วิ่งเร็วขึ้นเมื่อร้อนขึ้น ลูกสูบเลื่อนตามปริมาตร กราฟ P-V วาดตามกระบวนการ พื้นที่ใต้กราฟคืองานที่แก๊สทำ',
  formula: 'PV = nRT &nbsp;|&nbsp; ΔU = Q − W (W = งานที่แก๊สทำ) &nbsp;|&nbsp; E<sub>k</sub> เฉลี่ยต่อโมเลกุล = (3/2)k<sub>B</sub>T &nbsp;|&nbsp; แอเดียแบติก PV<sup>γ</sup> คงที่',
  params: [
    { id: 'proc', label: 'กระบวนการ', opts: PROC, def: 'P' },
    { id: 'dof', label: 'ชนิดแก๊ส', opts: [['3', 'อะตอมเดี่ยว (He, Ar)'], ['5', 'อะตอมคู่ (N₂, O₂)']], def: '3' },
    { id: 'n', label: 'จำนวนโมล (n)', unit: 'mol', min: 0.05, max: 5, step: 0.05, def: 1 },
    { id: 'V1', label: 'ปริมาตรเริ่มต้น', unit: 'L', min: 2, max: 60, step: 0.5, def: 20 },
    { id: 'T1', label: 'อุณหภูมิเริ่มต้น', unit: 'K', min: 50, max: 1200, step: 5, def: 300 },
    { id: 'V2', label: 'ปริมาตรสุดท้าย', unit: 'L', min: 2, max: 60, step: 0.5, def: 40, show: p => p.proc !== 'V' },
    { id: 'T2', label: 'อุณหภูมิสุดท้าย', unit: 'K', min: 50, max: 1200, step: 5, def: 600, show: p => p.proc === 'V' }
  ],
  outs: [{ id: 'P1', name: 'ความดันเริ่มต้น', unit: 'kPa' }, { id: 'P2', name: 'ความดันสุดท้าย', unit: 'kPa' }, { id: 'T2o', name: 'อุณหภูมิสุดท้าย', unit: 'K' }, { id: 'W', name: 'งานที่แก๊สทำ (W)', unit: 'J' }, { id: 'dU', name: 'พลังงานภายในเปลี่ยน (ΔU)', unit: 'J' }, { id: 'Q', name: 'ความร้อนที่ได้รับ (Q)', unit: 'J' }, { id: 'vr', name: 'อัตราเร็ว rms (He) ตอนท้าย', unit: 'm/s' }],
  compute(p) { const r = gas(p); return { P1: r.P1 / 1000, P2: r.P2 / 1000, T2o: r.T2, W: r.W, dU: r.dU, Q: r.Q, vr: Math.sqrt(3 * R * r.T2 / 0.004), _r: r }; },
  sim: {
    dt: 1 / 120, tmax: 7,
    init(p) { const rn = K.rng(11), M = []; for (let i = 0; i < 60; i++) { const a = rn() * 2 * Math.PI; M.push({ x: rn(), y: rn(), z: rn(), vx: Math.cos(a) * (0.6 + rn()), vy: Math.sin(a) * (0.6 + rn()), vz: (rn() - 0.5) * 1.4 }); } return { s: 0, M }; },
    step(st, dt, p, o) {
      st.s = clamp((st.t - 1) / 5, 0, 1); const q = o._r.path(st.s), sp = Math.sqrt(q.T / 300) * 0.9;
      const w = q.V / 0.06; st.q = q;
      st.M.forEach(m => { m.x += m.vx * sp * dt / Math.max(0.15, w); m.y += m.vy * sp * dt; m.z += m.vz * sp * dt; if (m.x < 0) { m.x = -m.x; m.vx = Math.abs(m.vx); } if (m.x > 1) { m.x = 2 - m.x; m.vx = -Math.abs(m.vx); } if (m.y < 0) { m.y = -m.y; m.vy = Math.abs(m.vy); } if (m.y > 1) { m.y = 2 - m.y; m.vy = -Math.abs(m.vy); } if (m.z < 0) { m.z = -m.z; m.vz = Math.abs(m.vz); } if (m.z > 1) { m.z = 2 - m.z; m.vz = -Math.abs(m.vz); } });
    },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 4 }; },
    draw(g, st, p, o) {
      const q = st.q || o._r.path(0), w = q.V / 0.06 * 8.4, x0 = 0.8, y0 = 2.2, H = 4.6;
      g.rect(x0 - 0.15, y0 - 0.15, 9.3, H + 0.3, { fill: '--bg', c: '--ink', w: 2 });
      g.rect(x0, y0, w, H, { fill: '--water-soft', c: 'none', alpha: 0.5 });
      g.rect(x0 + w, y0 - 0.1, 0.3, H + 0.2, { fill: '--muted', c: '--ink' }); g.line(x0 + w + 0.3, y0 + H / 2, 9.9, y0 + H / 2, { c: '--ink', w: 5 });
      const tcol = q.T > o._r.T1 + 1 ? '--c1' : q.T < o._r.T1 - 1 ? '--c2' : '--c5';
      st.M.forEach(m => g.circle(x0 + m.x * w, y0 + m.y * H, 4, { px: true, fill: tcol, c: 'none' }));
      if (p.proc !== 'Q' && Math.abs(o.Q) > 1) { g.vec(x0 + w / 2, y0 - 1.3, 0, (o.Q > 0 ? 1 : -1) * 28, { px: true, c: o.Q > 0 ? '--c1' : '--c2', w: 3, label: o.Q > 0 ? 'ให้ความร้อน' : 'คายความร้อน' }); }
      g.text(x0, y0 + H + 0.55, `P = ${fmt(q.P / 1000)} kPa   V = ${fmt(q.V * 1000)} L   T = ${fmt(q.T)} K`, { a: 'left', fs: 13, b: true });
      // P-V
      const gx = 10.6, gy = 2.2, gw = 5, gh = 5.2, r = o._r, Vm = Math.max(r.V1, r.V2) * 1.2, Pm = Math.max(r.P1, r.P2) * 1.25;
      g.rect(gx, gy, gw, gh, { fill: '--bg', c: '--line' }); g.text(gx + gw, gy - 0.4, 'V', { a: 'right', fs: 12, b: true }); g.text(gx - 0.15, gy + gh, 'P', { a: 'right', fs: 12, b: true });
      const X = V => gx + V / Vm * gw, Y = P => gy + P / Pm * gh;
      const pts = []; for (let i = 0; i <= 60; i++) { const s = r.path(i / 60); pts.push([X(s.V), Y(s.P)]); }
      if (p.proc !== 'V') g.path([[X(r.V1), gy]].concat(pts.slice(0, Math.round(st.s * 60) + 1)).concat([[X((st.q || r.path(0)).V), gy]]), { close: true, fill: '--c4', c: 'none', alpha: 0.18 });
      g.path(pts, { c: '--muted', w: 1.5, dash: [4, 4] }); g.path(pts.slice(0, Math.round(st.s * 60) + 1), { c: '--c4', w: 3 });
      g.circle(X(q.V), Y(q.P), 5, { px: true, fill: '--c4' });
      g.text(gx + gw / 2, gy + gh + 0.3, 'กราฟ P-V  พื้นที่ใต้กราฟ = งาน', { fs: 11, c: '--muted' });
    }
  },
  plot: { x: { label: 'V', unit: 'L', f: s => (s.q ? s.q.V : NaN) * 1000 }, series: [{ label: 'P', unit: 'kPa', c: '--c4', f: s => s.q ? s.q.P / 1000 : NaN }] },
  three: {
    cam() { return { pos: [1.2, 0.8, 1.6], target: [0.3, 0.2, 0] }; },
    build(T, p) { const box = T.box(1, 0.5, 0.5, '--water', { opacity: 0.12, cast: false }); box.position.set(0.5, 0.25, 0); const edges = new T.THREE.LineSegments(new T.THREE.EdgesGeometry(new T.THREE.BoxGeometry(1, 0.5, 0.5)), new T.THREE.LineBasicMaterial({ color: T.color('--ink') })); edges.position.set(0.5, 0.25, 0); T.scene.add(edges); const pis = T.box(0.03, 0.5, 0.5, '--muted'); const rod = T.cyl(0.02, 0.02, 1, '--ink'); rod.rotation.z = Math.PI / 2; const balls = Array.from({ length: 60 }, () => T.sphere(0.015, '--c5', { cast: false })); return { pis, rod, balls }; },
    update(ob, st, p, o) { const q = st.q || o._r.path(0), w = q.V / 0.06; ob.pis.position.set(w, 0.25, 0); ob.rod.position.set(w + 0.5, 0.25, 0); const c = q.T > o._r.T1 + 1 ? '--c1' : q.T < o._r.T1 - 1 ? '--c2' : '--c5'; st.M.forEach((m, i) => { ob.balls[i].position.set(m.x * w, m.y * 0.5, (m.z - 0.5) * 0.5); }); ob.balls[0].material.color.copy(Lab.V3 ? new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(c).trim()) : ob.balls[0].material.color); ob.balls.forEach(b => { b.material = ob.balls[0].material; }); }
  },
  notes: ['อุณหภูมิคงที่: พลังงานภายในไม่เปลี่ยน ความร้อนที่ให้กลายเป็นงานทั้งหมด', 'ความดันคงที่: ขยายตัวแล้วอุณหภูมิเพิ่ม ต้องให้ความร้อนมากกว่างานที่ได้', 'ปริมาตรคงที่: ไม่มีงาน ความร้อนทั้งหมดเพิ่มพลังงานภายใน', 'แอเดียแบติก: ไม่มีความร้อนเข้าออก ขยายตัวแล้วเย็นลง (โมเลกุลช้าลง)', 'ความเร็วโมเลกุลแปรผันตาม √T สีส้ม = ร้อนกว่าเริ่มต้น สีน้ำเงิน = เย็นกว่า']
});

// ---------- 2 การเปลี่ยนสถานะของน้ำ ----------
const H2O = { ci: 2100, cw: 4186, cs: 2010, Lf: 334000, Lv: 2.26e6 };
function heating(p) {
  const m = p.m, P = p.P, s = []; let T = p.T0, E = 0;
  const seg = (label, dE, T1, T2) => { s.push({ label, E0: E, E1: E + dE, T1, T2 }); E += dE; };
  if (T < 0) seg('น้ำแข็งร้อนขึ้น', m * H2O.ci * (0 - T), T, 0);
  if (p.T0 <= 0) seg('น้ำแข็งละลาย (0 °C)', m * H2O.Lf, 0, 0);
  const tw = Math.max(0, p.T0); if (tw < 100) seg('น้ำร้อนขึ้น', m * H2O.cw * (100 - tw), tw, 100);
  seg('น้ำเดือดเป็นไอ (100 °C)', m * H2O.Lv, 100, 100);
  seg('ไอน้ำร้อนขึ้น', m * H2O.cs * 30, 100, 130);
  s.forEach(q => { q.t0 = q.E0 / P; q.t1 = q.E1 / P; });
  return { s, Etot: E, ttot: E / P };
}
const Tof = (h, E) => { for (const q of h.s) if (E <= q.E1) { const f = (E - q.E0) / Math.max(1e-9, q.E1 - q.E0); return { T: q.T1 + (q.T2 - q.T1) * f, q, f }; } const q = h.s[h.s.length - 1]; return { T: q.T2, q, f: 1 }; };
CASES.push({
  name: 'การเปลี่ยนสถานะของน้ำ', aspect: 2, title: 'กราฟอุณหภูมิกับเวลาเมื่อให้ความร้อนน้ำแข็งจนเป็นไอ',
  desc: 'ให้ความร้อนด้วยอัตราคงที่ อุณหภูมิเพิ่มขึ้นเป็นช่วงๆ และคงที่ขณะเปลี่ยนสถานะ ช่วงเดือดยาวกว่าช่วงละลายมาก เพราะความร้อนแฝงของการกลายเป็นไอสูงกว่า',
  formula: 'Q = mcΔT (เปลี่ยนอุณหภูมิ) &nbsp;|&nbsp; Q = mL (เปลี่ยนสถานะ) &nbsp;|&nbsp; c น้ำแข็ง 2100, น้ำ 4186, ไอ 2010 J/(kg·K) &nbsp;|&nbsp; L หลอมเหลว 3.34×10⁵, กลายเป็นไอ 2.26×10⁶ J/kg',
  params: [
    { id: 'm', label: 'มวลน้ำ', unit: 'kg', min: 0.05, max: 2, step: 0.01, def: 0.5 },
    { id: 'T0', label: 'อุณหภูมิเริ่มต้น', unit: '°C', min: -40, max: 99, step: 1, def: -20 },
    { id: 'P', label: 'กำลังของเครื่องให้ความร้อน', unit: 'W', min: 100, max: 5000, step: 50, def: 2000 }
  ],
  sens: false,
  outs(p, o) { const a = [{ id: 'Et', name: 'พลังงานทั้งหมด', unit: 'kJ' }, { id: 'tt', name: 'เวลาทั้งหมด', unit: 's' }]; (o && o._h ? o._h.s : []).forEach((q, i) => a.push({ id: 's' + i, name: q.label, unit: 'kJ / s' })); return a; },
  compute(p) { const h = heating(p), o = { Et: h.Etot / 1000, tt: h.ttot, _h: h }; h.s.forEach((q, i) => { o['s' + i] = `${fmt((q.E1 - q.E0) / 1000)} / ${fmt(q.t1 - q.t0)}`; }); return o; },
  sim: {
    dt: 1 / 60,
    init() { return { E: 0 }; },
    step(st, dt, p, o) { const sc = o._h.ttot / 14; st.E += p.P * dt * sc; st.tr = st.E / p.P; if (st.E >= o._h.Etot) { st.E = o._h.Etot; st.done = true; } },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 8, pad: 4 }; },
    draw(g, st, p, o) {
      const h = o._h, cur = Tof(h, st.E), T = cur.T;
      // บีกเกอร์
      g.rect(1, 1, 3.2, 4.4, { fill: '--bg', c: '--ink', w: 2.5 });
      const lab = cur.q.label, ice = lab.startsWith('น้ำแข็ง'), steam = lab.startsWith('ไอ');
      const iceFrac = lab.includes('ละลาย') ? 1 - cur.f : ice ? 1 : 0, water = steam ? 0 : lab.includes('เดือด') ? 1 - cur.f : 1 - iceFrac;
      const hw = 2.4 * water; if (hw > 0) g.rect(1.1, 1.1, 3, hw, { fill: '--water-soft', c: 'none' });
      for (let k = 0; k < Math.round(6 * iceFrac); k++) g.rect(1.3 + (k % 3) * 0.95, 1.2 + Math.floor(k / 3) * 0.75, 0.7, 0.6, { fill: '--panel', c: '--water', w: 1.5 });
      if (lab.includes('เดือด')) for (let k = 0; k < 10; k++) g.circle(1.4 + ((k * 0.37 + st.t * 0.9) % 2.6), 1.2 + ((k * 0.53 + st.t * 1.7) % (hw || 0.5)), 3, { px: true, c: '--water', w: 1 });
      if (steam || lab.includes('เดือด')) for (let k = 0; k < 6; k++) g.circle(1.6 + k * 0.4, 5.6 + ((k * 0.3 + st.t) % 1.2), 7, { px: true, fill: '--line', c: 'none', alpha: 0.6 });
      g.path([[1.4, 0.6], [3.8, 0.6]], { c: '--c1', w: 6 }); g.text(2.6, 0.2, 'ให้ความร้อน ' + p.P + ' W', { fs: 11, c: '--c1' });
      // เทอร์โมมิเตอร์
      g.rect(4.8, 1, 0.3, 5.2, { fill: '--panel', c: '--ink' }); const ty = 1 + (T + 40) / 180 * 5.2; g.rect(4.85, 1, 0.2, ty - 1, { fill: '--bad', c: 'none' }); g.text(5.25, ty, fmt(T) + ' °C', { a: 'left', fs: 12, b: true, base: 'middle' });
      g.text(2.6, 6.9, lab, { fs: 13, b: true });
      // กราฟ T-t
      const gx = 7.3, gy = 1, gw = 8.2, gh = 6, X = t => gx + t / h.ttot * gw, Y = Tc => gy + (Tc + 40) / 180 * gh;
      g.rect(gx, gy, gw, gh, { fill: '--bg', c: '--line' }); [0, 100].forEach(Tc => { g.line(gx, Y(Tc), gx + gw, Y(Tc), { c: '--muted', dash: [4, 4], w: 1 }); g.text(gx - 0.1, Y(Tc), Tc + ' °C', { a: 'right', fs: 10, c: '--muted', base: 'middle' }); });
      g.path(h.s.map(q => [X(q.t0), Y(q.T1)]).concat([[X(h.ttot), Y(h.s[h.s.length - 1].T2)]]), { c: '--line', w: 2 });
      const done = h.s.filter(q => q.E1 <= st.E); const pts = done.map(q => [X(q.t0), Y(q.T1)]); pts.push([X(cur.q.t0), Y(cur.q.T1)]); pts.push([X(st.E / p.P), Y(T)]);
      g.path(pts, { c: '--c1', w: 3 }); g.circle(X(st.E / p.P), Y(T), 5, { px: true, fill: '--c1' });
      h.s.forEach(q => { if (q.T1 === q.T2) g.text((X(q.t0) + X(q.t1)) / 2, Y(q.T1) + 0.3, q.label.includes('ละลาย') ? 'ละลาย' : 'เดือด', { fs: 10, c: '--muted' }); });
      g.text(gx + gw, gy - 0.4, 'เวลา (s) รวม ' + fmt(h.ttot) + ' s', { a: 'right', fs: 10, c: '--muted' });
    }
  },
  notes: ['ขณะเปลี่ยนสถานะ อุณหภูมิคงที่ ความร้อนที่ให้ไปใช้ทำลายพันธะระหว่างโมเลกุล', 'ช่วงเดือดยาวกว่าช่วงละลายประมาณ 6.8 เท่า (2.26×10⁶ ÷ 3.34×10⁵)', 'ความชันช่วงน้ำแข็งชันกว่าช่วงน้ำ เพราะ c ของน้ำแข็งน้อยกว่า', 'เพิ่มกำลังเครื่องให้ความร้อน รูปกราฟเหมือนเดิมแต่ใช้เวลาน้อยลง']
});

// ---------- 3 การผสมและสมดุลความร้อน ----------
const MAT = { water: ['น้ำ', 4186], ice: ['น้ำแข็ง', 2100], cu: ['ทองแดง', 385], al: ['อะลูมิเนียม', 900], fe: ['เหล็ก', 450], glass: ['แก้ว', 840] };
const MOPT = Object.keys(MAT).map(k => [k, MAT[k][0]]);
const isH2O = k => k === 'water' || k === 'ice';
// เอนทาลปีเทียบน้ำเหลวที่ 0 °C
const Hof = (mat, m, T) => { if (!isH2O(mat)) return m * MAT[mat][1] * T; return T < 0 ? m * (2100 * T - 334000) : m * 4186 * T; };
function mix(p) {
  const A = { mat: p.ma, m: p.mA, T: p.ma === 'ice' ? Math.min(p.TA, 0) : p.ma === 'water' ? Math.max(p.TA, 0) : p.TA }, B = { mat: p.mb, m: p.mB, T: p.mb === 'ice' ? Math.min(p.TB, 0) : p.mb === 'water' ? Math.max(p.TB, 0) : p.TB };
  const Htot = Hof(A.mat, A.m, A.T) + Hof(B.mat, B.m, B.T);
  const Hsum = T => Hof(A.mat, A.m, T) + Hof(B.mat, B.m, T);
  const h2o = (isH2O(A.mat) ? A.m : 0) + (isH2O(B.mat) ? B.m : 0);
  const plate0 = Hsum(-1e-9), plate1 = Hsum(1e-9);  // ช่วงคงที่ที่ 0 °C
  let Tf, iceLeft = 0;
  if (h2o > 0 && Htot >= plate0 - 1e-9 && Htot <= plate1 + 1e-9) { Tf = 0; iceLeft = (plate1 - Htot) / 334000; }
  else { let lo = -100, hi = 200; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; Hsum(mid) < Htot ? lo = mid : hi = mid; } Tf = (lo + hi) / 2; iceLeft = Tf < 0 ? h2o : 0; }
  const QA = Hof(A.mat, A.m, Tf) - Hof(A.mat, A.m, A.T) - (isH2O(A.mat) && Tf === 0 ? 0 : 0);
  return { A, B, Tf, iceLeft, QA };
}
CASES.push({
  name: 'การผสมสาร', aspect: 2, title: 'สมดุลความร้อนเมื่อนำวัตถุสองชิ้นมาสัมผัสกัน',
  desc: 'เลือกวัสดุ มวล และอุณหภูมิของวัตถุสองชิ้น รวมถึงน้ำแข็ง ความร้อนไหลจากร้อนไปเย็นจนอุณหภูมิเท่ากัน ถ้ามีน้ำแข็งอาจละลายไม่หมดและหยุดที่ 0 °C',
  formula: 'ความร้อนที่ให้ = ความร้อนที่รับ &nbsp;|&nbsp; Σmc(T<sub>f</sub> − T) + (mL ถ้ามีการเปลี่ยนสถานะ) = 0',
  params: [
    { type: 'head', label: 'วัตถุ A' },
    { id: 'ma', label: 'วัสดุ A', opts: MOPT, def: 'cu' },
    { id: 'mA', label: 'มวล A', unit: 'kg', min: 0.01, max: 5, step: 0.01, def: 0.5 },
    { id: 'TA', label: 'อุณหภูมิ A', unit: '°C', min: -50, max: 300, step: 1, def: 200 },
    { type: 'head', label: 'วัตถุ B' },
    { id: 'mb', label: 'วัสดุ B', opts: MOPT, def: 'water' },
    { id: 'mB', label: 'มวล B', unit: 'kg', min: 0.01, max: 5, step: 0.01, def: 1 },
    { id: 'TB', label: 'อุณหภูมิ B', unit: '°C', min: -50, max: 99, step: 1, def: 20 }
  ],
  presets: [{ label: 'โลหะร้อนลงน้ำ', set: { ma: 'cu', mA: 0.5, TA: 200, mb: 'water', mB: 1, TB: 20 } }, { label: 'น้ำแข็งในน้ำ (ละลายหมด)', set: { ma: 'ice', mA: 0.1, TA: -10, mb: 'water', mB: 1, TB: 40 } }, { label: 'น้ำแข็งเหลือ', set: { ma: 'ice', mA: 1, TA: -10, mb: 'water', mB: 0.5, TB: 30 } }],
  outs: [{ id: 'Tf', name: 'อุณหภูมิสุดท้าย', unit: '°C' }, { id: 'ice', name: 'น้ำแข็งเหลือ', unit: 'kg' }, { id: 'Q', name: 'ความร้อนที่ A ให้ออก', unit: 'kJ' }],
  compute(p) { const r = mix(p); return { Tf: r.Tf, ice: r.iceLeft, Q: -(Hof(r.A.mat, r.A.m, r.Tf) - Hof(r.A.mat, r.A.m, r.A.T)) / 1000 + (isH2O(r.A.mat) && r.Tf === 0 ? 0 : 0), _r: r }; },
  sim: {
    dt: 1 / 60, tmax: 8,
    init(p, o) { return { k: 0, TA: o._r.A.T, TB: o._r.B.T }; },
    step(st, dt, p, o) { const r = o._r, f = 1 - Math.exp(-st.t / 1.5); st.TA = r.A.T + (r.Tf - r.A.T) * f; st.TB = r.B.T + (r.Tf - r.B.T) * f; st.f = f; },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 8, pad: 4 }; },
    draw(g, st, p, o) {
      const r = o._r, col = T => T > 60 ? '--c1' : T > 25 ? '--c5' : T > 0 ? '--c3' : '--c2';
      const box = (x, mat, m, T, lab) => { g.rect(x, 1.5, 4.2, 4.2, { fill: col(T), c: '--ink', w: 2, alpha: 0.85 }); g.text(x + 2.1, 4.2, `${lab}: ${MAT[mat][0]}`, { fs: 13, b: true, c: '--panel' }); g.text(x + 2.1, 3.5, `${m} kg`, { fs: 12, c: '--panel' }); g.text(x + 2.1, 2.4, fmt(T) + ' °C', { fs: 18, b: true, c: '--panel' }); };
      box(1.6, r.A.mat, r.A.m, st.TA, 'A'); box(10.2, r.B.mat, r.B.m, st.TB, 'B');
      const hot = st.TA > st.TB ? 1 : -1, mag = Math.abs(st.TA - st.TB);
      if (mag > 0.05) g.arrow(hot > 0 ? 6.3 : 9.7, 3.6, hot > 0 ? 9.7 : 6.3, 3.6, { c: '--c1', w: 3 + Math.min(6, mag / 20), label: 'ความร้อน', lpos: 0.5 });
      g.text(8, 6.6, st.f > 0.98 ? `สมดุลที่ ${fmt(r.Tf)} °C` + (r.iceLeft > 1e-6 ? ` (น้ำแข็งเหลือ ${fmt(r.iceLeft)} kg)` : '') : 'กำลังถ่ายเทความร้อน', { fs: 14, b: true });
    }
  },
  plot: { overlay: true, yLabel: 'T (°C)', series: [{ label: 'T_A', unit: '°C', c: '--c1', f: s => s.TA }, { label: 'T_B', unit: '°C', c: '--c2', f: s => s.TB }] },
  notes: ['น้ำมีความจุความร้อนจำเพาะสูง อุณหภูมิสุดท้ายจึงมักใกล้อุณหภูมิของน้ำ', 'ใส่น้ำแข็งมาก ความร้อนจากน้ำไม่พอละลายทั้งหมด อุณหภูมิสุดท้ายหยุดที่ 0 °C', 'แบบจำลองไม่คิดความร้อนที่เสียให้ภาชนะและสิ่งแวดล้อม', 'ภาพแสดงการถ่ายเทแบบค่อยเป็นค่อยไปเพื่อให้เห็นทิศ ค่าสุดท้ายคำนวณจากสมดุลพลังงาน']
});

// ---------- 4 การขยายตัวเชิงความร้อน ----------
const ALPHA = { fe: ['เหล็ก', 12e-6], cu: ['ทองแดง', 17e-6], al: ['อะลูมิเนียม', 23e-6], brass: ['ทองเหลือง', 19e-6], glass: ['แก้ว', 9e-6], invar: ['อินวาร์', 1.2e-6] };
const AOPT = Object.keys(ALPHA).map(k => [k, ALPHA[k][0]]);
CASES.push({
  name: 'การขยายตัวเชิงความร้อน', aspect: 2.2, title: 'การขยายตัวตามยาวและแผ่นโลหะคู่',
  desc: 'ให้ความร้อนแท่งโลหะสองชนิดที่ยาวเท่ากัน ดูว่ายืดออกต่างกันเท่าใด และถ้าประกบเป็นแผ่นโลหะคู่ แผ่นจะโค้งไปทางโลหะที่ขยายตัวน้อยกว่า',
  formula: 'ΔL = αL₀ΔT &nbsp;|&nbsp; ΔA ≈ 2αA₀ΔT &nbsp;|&nbsp; ΔV ≈ 3αV₀ΔT',
  params: [
    { id: 'a', label: 'โลหะ 1', opts: AOPT, def: 'al' },
    { id: 'b', label: 'โลหะ 2', opts: AOPT, def: 'fe' },
    { id: 'L', label: 'ความยาวเริ่มต้น', unit: 'm', min: 0.1, max: 100, step: 0.1, def: 1 },
    { id: 'dT', label: 'อุณหภูมิเปลี่ยน ΔT', unit: '°C', min: -100, max: 500, step: 1, def: 200 },
    { id: 'ex', label: 'ขยายภาพการยืด', unit: 'เท่า', min: 1, max: 200, step: 1, def: 50 }
  ],
  outs: [{ id: 'd1', name: 'โลหะ 1 ยืด', unit: 'mm' }, { id: 'd2', name: 'โลหะ 2 ยืด', unit: 'mm' }, { id: 'diff', name: 'ต่างกัน', unit: 'mm' }],
  compute(p) { const d1 = ALPHA[p.a][1] * p.L * p.dT * 1000, d2 = ALPHA[p.b][1] * p.L * p.dT * 1000; return { d1, d2, diff: d1 - d2 }; },
  sim: {
    dt: 1 / 60, tmax: 4,
    init() { return { f: 0 }; },
    step(st) { st.f = clamp(st.t / 3, 0, 1); },
    view() { return { x0: -0.3, x1: 1.6, y0: -0.75, y1: 0.55 }; },
    draw(g, st, p, o) {
      const s = st.f * p.ex / 1000 / p.L, l1 = 1 + o.d1 * s, l2 = 1 + o.d2 * s;
      g.wall(0, 0.05, 0.5, -1);
      g.rect(0, 0.33, l1, 0.08, { fill: '--c1', c: '--ink' }); g.text(l1 + 0.02, 0.37, `${ALPHA[p.a][0]} +${fmt(o.d1 * st.f)} mm`, { a: 'left', fs: 11, base: 'middle' });
      g.rect(0, 0.15, l2, 0.08, { fill: '--c2', c: '--ink' }); g.text(l2 + 0.02, 0.19, `${ALPHA[p.b][0]} +${fmt(o.d2 * st.f)} mm`, { a: 'left', fs: 11, base: 'middle' });
      g.line(1, 0.05, 1, 0.5, { c: '--muted', dash: [3, 4], w: 1 }); g.text(1, 0.52, 'L₀', { fs: 10, c: '--muted' });
      // แผ่นโลหะคู่
      const k = (ALPHA[p.a][1] - ALPHA[p.b][1]) * p.dT * st.f * p.ex * 3;
      const curve = off => { const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40, th = k * u; const x = Math.abs(k) < 1e-6 ? u : Math.sin(th) / k, y = Math.abs(k) < 1e-6 ? 0 : (1 - Math.cos(th)) / k; pts.push([x - Math.sin(th) * off, -0.35 + y + Math.cos(th) * off]); } return pts; };
      g.wall(0, -0.6, -0.15, -1);
      g.path(curve(0.025), { c: '--c1', w: 7 }); g.path(curve(-0.025), { c: '--c2', w: 7 });
      g.text(0.6, -0.68, 'แผ่นโลหะคู่ (บน = โลหะ 1, ล่าง = โลหะ 2)', { fs: 11, c: '--muted' });
    }
  },
  notes: ['โลหะที่ α มากขยายตัวมากกว่า แผ่นโลหะคู่จึงโค้งไปทางด้านโลหะที่ α น้อย', 'ทำให้เย็นลง (ΔT ติดลบ) แผ่นโค้งกลับทิศ หลักนี้ใช้ในเทอร์โมสตัท', 'การยืดจริงเล็กมาก ภาพขยายตามตัวเลือก "ขยายภาพการยืด"']
});

Lab.add('thermo', CASES);
})();
