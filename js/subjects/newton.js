/* บทที่ 3 กฎการเคลื่อนที่ของนิวตัน */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const G = 9.8;
const CASES = [];
const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0;

// ---------- 1 พื้นเอียง ----------
// แรงตามแนวพื้นเอียง (บวก = ขึ้นพื้นเอียง)
function inclineForces(p, v) {
  const th = p.th * RAD, ph = p.phi * RAD, m = p.m;
  const W = m * G, Wpar = -W * Math.sin(th), Fpar = p.F * Math.cos(ph);
  let N = W * Math.cos(th) - p.F * Math.sin(ph); const lift = N < 0; N = Math.max(0, N);
  const Fn = Wpar + Fpar; let f, state;
  if (Math.abs(v) < 1e-6) {
    if (Math.abs(Fn) <= p.mus * N + 1e-12) { f = -Fn; state = 'นิ่ง'; }
    else { f = -sgn(Fn) * p.muk * N; state = Fn > 0 ? 'เริ่มขึ้น' : 'เริ่มลง'; }
  } else { f = -sgn(v) * p.muk * N; state = v > 0 ? 'ขึ้น' : 'ลง'; }
  return { W, Wpar, Wperp: W * Math.cos(th), Fpar, N, f, net: Fn + f, a: (Fn + f) / m, lift, state, Fn };
}
CASES.push({
  name: 'พื้นเอียง', title: 'วัตถุบนพื้นเอียงที่มีแรงเสียดทาน',
  desc: 'ปรับมุมพื้นเอียง มวล สัมประสิทธิ์แรงเสียดทานสถิตและจลน์ แรงดึงพร้อมทิศ และความเร็วต้น ลากกล่องไปวางตรงไหนก็ได้ หรือลากยอดพื้นเอียงเพื่อเปลี่ยนมุม',
  formula: 'ΣF = ma &nbsp;|&nbsp; N = mg cos θ − F sin φ &nbsp;|&nbsp; f<sub>s</sub> ≤ μ<sub>s</sub>N &nbsp;|&nbsp; f<sub>k</sub> = μ<sub>k</sub>N &nbsp;|&nbsp; เริ่มไถลเองเมื่อ tan θ > μ<sub>s</sub>',
  params: [
    { type: 'head', label: 'พื้นเอียงและวัตถุ' },
    { id: 'th', label: 'มุมพื้นเอียง (θ)', unit: '°', min: 0, max: 70, step: 0.5, def: 30 },
    { id: 'L', label: 'ความยาวพื้นเอียง', unit: 'm', min: 2, max: 20, step: 0.5, def: 8 },
    { id: 'm', label: 'มวล (m)', unit: 'kg', min: 0.5, max: 50, step: 0.5, def: 5 },
    { id: 's0', label: 'ตำแหน่งเริ่มจากฐาน', unit: 'm', min: 0, max: 20, step: 0.1, def: 4 },
    { id: 'v0', label: 'ความเร็วต้น (ขึ้น = +)', unit: 'm/s', min: -10, max: 10, step: 0.1, def: 0 },
    { type: 'head', label: 'แรงเสียดทาน' },
    { id: 'mus', label: 'μ สถิต (μₛ)', unit: '', min: 0, max: 1.5, step: 0.01, def: 0.4 },
    { id: 'muk', label: 'μ จลน์ (μₖ)', unit: '', min: 0, max: 1.5, step: 0.01, def: 0.3 },
    { type: 'head', label: 'แรงที่ออก (F)' },
    { id: 'F', label: 'ขนาดแรง F', unit: 'N', min: 0, max: 300, step: 1, def: 0 },
    { id: 'phi', label: 'มุมของ F กับพื้นเอียง (φ)', unit: '°', min: -80, max: 80, step: 1, def: 0 },
    { type: 'head', label: 'การแสดงผล' },
    { id: 'comp', label: 'แตกองค์ประกอบน้ำหนัก', type: 'bool', def: 1 }
  ],
  presets: [
    { label: 'ไถลเอง (θ > มุมวิกฤต)', set: { th: 35, mus: 0.4, muk: 0.3, F: 0, v0: 0 } },
    { label: 'ดันขึ้นพอดีเริ่มขยับ', set: { th: 30, m: 5, mus: 0.4, muk: 0.3, F: 41.5, phi: 0, v0: 0 } },
    { label: 'ไถลขึ้นแล้วหยุด', set: { th: 20, mus: 0.6, muk: 0.3, F: 0, v0: 6, s0: 1 } },
    { label: 'ไร้แรงเสียดทาน', set: { mus: 0, muk: 0 } }
  ],
  outs: [
    { id: 'state', name: 'สถานะเริ่มต้น', unit: '' }, { id: 'a', name: 'ความเร่งเริ่มต้น', unit: 'm/s²' },
    { id: 'N', name: 'แรงปฏิกิริยาตั้งฉาก (N)', unit: 'N' }, { id: 'f', name: 'แรงเสียดทาน (f)', unit: 'N' },
    { id: 'fsmax', name: 'แรงเสียดทานสถิตสูงสุด', unit: 'N' }, { id: 'thc', name: 'มุมที่เริ่มไถลเอง', unit: '°' },
    { id: 'Fup', name: 'แรงขนานพื้นที่ต้องใช้เริ่มดันขึ้น', unit: 'N' }
  ],
  compute(p) {
    const r = inclineForces(p, p.v0), th = p.th * RAD;
    return { state: r.state, a: r.a, N: r.N, f: r.f, fsmax: p.mus * r.N, thc: Math.atan(p.mus) * DEG, Fup: p.m * G * (Math.sin(th) + p.mus * Math.cos(th)), _r: r };
  },
  check(p, o) { const w = []; if (p.muk > p.mus) w.push('ปกติ μₖ ≤ μₛ ตอนนี้ μₖ มากกว่า μₛ'); if (o._r.lift) w.push('แรง F ดึงขึ้นมากจนวัตถุลอยจากพื้นเอียง (N = 0) แบบจำลองนี้ไม่คิดการลอย'); if (p.s0 > p.L) w.push('ตำแหน่งเริ่มเกินความยาวพื้นเอียง จะวางไว้ที่ยอด'); return w; },
  sim: {
    dt: 1 / 600,
    init(p) { const r = inclineForces(p, p.v0); return { s: Math.min(p.s0, p.L), v: p.v0, a: r.a, r }; },
    step(st, dt, p) {
      let r = inclineForces(p, st.v); const v1 = st.v + r.a * dt;
      if (st.v !== 0 && sgn(v1) !== sgn(st.v)) { st.v = 0; r = inclineForces(p, 0); }
      else { st.s += st.v * dt + 0.5 * r.a * dt * dt; st.v = v1; if (Math.abs(st.v) < 1e-9) st.v = 0; }
      if (st.v === 0) { r = inclineForces(p, 0); if (r.state === 'นิ่ง') { st.a = 0; st.r = r; if (st.t > 1.5) st.done = true; return; } }
      st.a = r.a; st.r = r;
      if (st.s <= 0) { st.s = 0; st.done = true; } if (st.s >= p.L) { st.s = p.L; st.done = true; }
      if (st.t > 20) st.done = true;
    },
    view(p) { const th = p.th * RAD, X = p.L * Math.cos(th), Y = p.L * Math.sin(th); return { x0: -p.L * 0.25, x1: X + p.L * 0.25, y0: -p.L * 0.08, y1: Math.max(Y, p.L * 0.35) + p.L * 0.22 }; },
    draw(g, st, p) {
      const th = p.th * RAD, c = Math.cos(th), s = Math.sin(th), X = p.L * c, Y = p.L * s, v = g.visible();
      g.ground(v.x0, v.x1, 0);
      g.path([[0, 0], [X, 0], [X, Y]], { close: true, fill: '--block2', c: '--ink', w: 2 });
      g.angle(0, 0, 40, 0, th, 'θ');
      const bw = p.L * 0.11, bh = p.L * 0.075, cx = st.s * c - s * bh / 2, cy = st.s * s + c * bh / 2;
      g.box(cx, cy, bw, bh, th, { label: p.m + ' kg' });
      const r = st.r, fs = K.forceScale([r.W, r.N, r.f, p.F], 85);
      // แรง
      K.force(g, cx, cy, -Math.PI / 2, fs(r.W), 'mg', '--c1');
      if (p.comp) { g.vec(cx, cy, fs(r.Wpar) * c * 1, fs(r.Wpar) * s, { px: true, c: '--c1', w: 1.5, dash: [5, 4], label: 'mg sin θ', fs: 11 }); g.vec(cx, cy, fs(r.Wperp) * s, -fs(r.Wperp) * c, { px: true, c: '--c1', w: 1.5, dash: [5, 4], label: 'mg cos θ', fs: 11, lside: -1 }); }
      K.force(g, cx, cy, th + Math.PI / 2, fs(r.N), 'N', '--c2');
      if (Math.abs(r.f) > 1e-6) K.force(g, cx - c * bw * 0.3 - s * (-bh * 0.45), cy - s * bw * 0.3 + c * (-bh * 0.45), th, fs(r.f), 'f', '--c3');
      if (p.F > 0) K.force(g, cx, cy, th + p.phi * RAD, fs(p.F), 'F', '--c4');
      g.textPx(12, 22, 'สถานะ: ' + (st.v === 0 && r.state === 'นิ่ง' ? 'อยู่นิ่ง' : st.v > 0 ? 'ไถลขึ้น' : st.v < 0 ? 'ไถลลง' : r.state), { a: 'left', fs: 13, b: true });
    }
  },
  handles(p) {
    const th = p.th * RAD, s0 = Math.min(p.s0, p.L);
    return [
      { id: 'blk', x: s0 * Math.cos(th) - Math.sin(th) * p.L * 0.0375, y: s0 * Math.sin(th) + Math.cos(th) * p.L * 0.0375, set: (x, y) => ({ s0: clamp(x * Math.cos(th) + y * Math.sin(th), 0, p.L) }) },
      { id: 'top', x: p.L * Math.cos(th), y: p.L * Math.sin(th), set: (x, y) => ({ th: clamp(Math.atan2(Math.max(0, y), Math.max(0.01, x)) * DEG, 0, 70) }) }
    ];
  },
  plot: { series: [{ label: 's (ตามพื้นเอียง)', unit: 'm', c: '--c2', f: s => s.s }, { label: 'v', unit: 'm/s', c: '--c1', f: s => s.v }, { label: 'f', unit: 'N', c: '--c3', f: s => s.r.f, on: false }] },
  live: [{ name: 's', unit: 'm', f: s => s.s }, { name: 'v', unit: 'm/s', f: s => s.v }, { name: 'a', unit: 'm/s²', f: s => s.a }, { name: 'f', unit: 'N', f: s => s.r.f }],
  three: {
    cam(p) { const X = p.L * Math.cos(p.th * RAD); return { pos: [X * 0.4, p.L * 0.55, p.L * 1.25], target: [X * 0.5, p.L * Math.sin(p.th * RAD) * 0.4, 0] }; },
    build(T, p) {
      const th = p.th * RAD, X = p.L * Math.cos(th), Y = p.L * Math.sin(th);
      T.floor(Math.max(10, p.L * 2.4), { step: 1 });
      T.extrude([[0, 0], [X, 0], [X, Y]], p.L * 0.35, '--block2', { receive: true });
      const bw = p.L * 0.11, bh = p.L * 0.075, blk = T.box(bw, bh, p.L * 0.12, '--c2');
      const ar = { W: T.arrow('--c1'), N: T.arrow('--c2'), f: T.arrow('--c3'), F: T.arrow('--c4') };
      const lab = { W: T.label('mg', '--c1'), N: T.label('N', '--c2'), f: T.label('f', '--c3'), F: T.label('F', '--c4') };
      return { blk, ar, lab, bh, th };
    },
    update(ob, st, p) {
      const th = ob.th, c = Math.cos(th), s = Math.sin(th), cx = st.s * c - s * ob.bh / 2, cy = st.s * s + c * ob.bh / 2;
      ob.blk.position.set(cx, cy, 0); ob.blk.rotation.z = th;
      const r = st.r, k = p.L * 0.25 / Math.max(r.W, r.N, Math.abs(r.f), p.F, 1e-9), o = [cx, cy, p.L * 0.07];
      const set = (n, vx, vy, mag) => { ob.ar[n].set(o, [vx * mag * k, vy * mag * k, 0]); ob.lab[n].visible = mag * k > 0.05; ob.lab[n].set(null, [cx + vx * mag * k * 1.12, cy + vy * mag * k * 1.12, p.L * 0.07]); };
      set('W', 0, -1, r.W); set('N', -s, c, r.N); set('f', c, s, r.f); set('F', Math.cos(th + p.phi * RAD), Math.sin(th + p.phi * RAD), p.F);
    }
  },
  notes: ['เพิ่มมุมจนเกินมุมวิกฤต tan⁻¹μₛ กล่องจะเริ่มไถลเองแม้ไม่มีแรงดึง', 'ขณะกล่องนิ่ง แรงเสียดทานสถิตมีค่าเท่าที่จำเป็น (ไม่ใช่ μₛN เสมอ) ดูค่า f เทียบกับแรงเสียดทานสถิตสูงสุด', 'ดึงด้วยมุม φ บวก (เชิดขึ้นจากผิว) ทำให้ N ลดลง แรงเสียดทานจึงลดตาม', 'ลากกล่องเพื่อเปลี่ยนตำแหน่งเริ่ม ลากยอดพื้นเอียงเพื่อเปลี่ยนมุม']
});

// ---------- 2 ระบบรอก ----------
const CFG = [['atwood', 'แขวนสองข้าง'], ['table', 'โต๊ะ + แขวน'], ['incline', 'พื้นเอียง + แขวน'], ['double', 'พื้นเอียงสองด้าน']];
function pulley(p) {
  const t1 = p.t1 * RAD, t2 = p.t2 * RAD, m1 = p.m1, m2 = p.m2;
  let D, Nf, res1 = 0;
  if (p.cfg === 'atwood') { D = (m2 - m1) * G; Nf = 0; }
  else if (p.cfg === 'table') { D = m2 * G; Nf = m1 * G; }
  else if (p.cfg === 'incline') { D = m2 * G - m1 * G * Math.sin(t1); Nf = m1 * G * Math.cos(t1); }
  else { D = m2 * G * Math.sin(t2) - m1 * G * Math.sin(t1); Nf = m1 * G * Math.cos(t1) + m2 * G * Math.cos(t2); }
  let a, state, fric;
  if (Math.abs(D) <= p.mus * Nf + 1e-12) { a = 0; state = 'อยู่นิ่ง'; fric = -D; }
  else { fric = -sgn(D) * p.muk * Nf; a = (D + fric) / (m1 + m2); state = D > 0 ? 'มวล 2 เคลื่อนลง' : 'มวล 1 เคลื่อนลง'; }
  // แรงตึงจากสมการของมวล 1: T − (แรงต้านฝั่ง 1) = m1 a
  const N1 = p.cfg === 'table' ? m1 * G : (p.cfg === 'incline' || p.cfg === 'double') ? m1 * G * Math.cos(t1) : 0;
  const g1 = p.cfg === 'atwood' ? m1 * G : (p.cfg === 'incline' || p.cfg === 'double') ? m1 * G * Math.sin(t1) : 0;
  const f1 = a === 0 ? 0 : -sgn(D) * p.muk * N1;
  let T = a === 0 ? (p.cfg === 'atwood' ? m1 * G : p.cfg === 'double' ? NaN : m2 * G) : m1 * a + g1 - f1;
  if (a === 0 && p.cfg === 'table') T = Math.min(m2 * G, m2 * G);
  return { a, T, state, D, Nf, fric };
}
CASES.push({
  name: 'รอกและเชือก', title: 'ระบบมวลผูกเชือกผ่านรอก',
  desc: 'เลือกรูปแบบระบบ ปรับมวลแต่ละก้อน มุมพื้นเอียง และแรงเสียดทาน หาความเร่งของระบบและแรงตึงเชือก',
  formula: 'a = (แรงขับ − แรงเสียดทาน)/(m₁ + m₂) &nbsp;|&nbsp; ระบบอยู่นิ่งถ้าแรงขับ ≤ μₛΣN &nbsp;|&nbsp; หา T จากสมการของมวลก้อนเดียว',
  params: [
    { id: 'cfg', label: 'รูปแบบระบบ', opts: CFG, def: 'incline' },
    { id: 'm1', label: 'มวล 1 (m₁)', unit: 'kg', min: 0.5, max: 30, step: 0.5, def: 4 },
    { id: 'm2', label: 'มวล 2 (m₂, ด้านแขวน)', unit: 'kg', min: 0.5, max: 30, step: 0.5, def: 3 },
    { id: 't1', label: 'มุมพื้นเอียงของมวล 1', unit: '°', min: 0, max: 80, step: 1, def: 30, show: p => p.cfg === 'incline' || p.cfg === 'double' },
    { id: 't2', label: 'มุมพื้นเอียงของมวล 2', unit: '°', min: 0, max: 80, step: 1, def: 45, show: p => p.cfg === 'double' },
    { id: 'mus', label: 'μ สถิต', unit: '', min: 0, max: 1, step: 0.01, def: 0.2, show: p => p.cfg !== 'atwood' },
    { id: 'muk', label: 'μ จลน์', unit: '', min: 0, max: 1, step: 0.01, def: 0.1, show: p => p.cfg !== 'atwood' }
  ],
  presets: [{ label: 'แอตวูด 3:2', set: { cfg: 'atwood', m1: 2, m2: 3 } }, { label: 'โต๊ะลื่น', set: { cfg: 'table', m1: 5, m2: 2, mus: 0, muk: 0 } }, { label: 'ติดอยู่นิ่ง', set: { cfg: 'incline', m1: 5, m2: 2, t1: 30, mus: 0.3, muk: 0.2 } }],
  outs: [{ id: 'state', name: 'สถานะ', unit: '' }, { id: 'a', name: 'ความเร่งของระบบ', unit: 'm/s²' }, { id: 'T', name: 'แรงตึงเชือก (T)', unit: 'N' }, { id: 'D', name: 'แรงขับ (ไม่รวมแรงเสียดทาน)', unit: 'N' }, { id: 'fr', name: 'แรงเสียดทานรวม', unit: 'N' }],
  compute(p) { const r = pulley(p); return { state: r.state, a: r.a, T: isNaN(r.T) ? 'แบ่งไม่ได้ (นิ่ง)' : r.T, D: r.D, fr: r.fric, _r: r }; },
  sim: {
    dt: 1 / 480,
    init(p, o) { return { s: 0, v: 0 }; },
    step(st, dt, p, o) { const a = o._r.a; st.s += st.v * dt + 0.5 * a * dt * dt; st.v += a * dt; if (Math.abs(st.s) > 1.6 || st.t > 8) st.done = true; if (a === 0 && st.t > 1) st.done = true; },
    view(p) { return p.cfg === 'atwood' ? { x0: -2.2, x1: 2.2, y0: -0.2, y1: 4 } : p.cfg === 'double' ? { x0: -3.6, x1: 3.6, y0: -0.2, y1: 3.4 } : { x0: -4.2, x1: 2.4, y0: -2.6, y1: 2.6 }; },
    draw(g, st, p, o) {
      const s = st.s, r = o._r, sz = m => 0.32 + 0.18 * Math.cbrt(m / 4);
      const lab = (x, y, m, n) => g.text(x, y, `m${n} ${m} kg`, { fs: 11, b: true, base: 'middle' });
      if (p.cfg === 'atwood') {
        const py = 3.4, R = 0.35; g.line(-1.4, 3.85, 1.4, 3.85, { c: '--ink', w: 4 }); g.line(0, 3.85, 0, py, { w: 2 }); g.pulley(0, py, R, s / R);
        const y1 = 1.6 + s, y2 = 1.6 - s, b1 = sz(p.m1), b2 = sz(p.m2);
        K.rope(g, [[-R, y1 + b1 / 2], [-R, py]]); K.rope(g, [[R, y2 + b2 / 2], [R, py]]);
        g.box(-R, y1, b1, b1, 0, {}); lab(-R, y1, p.m1, 1); g.box(R, y2, b2, b2, 0, { fill: '--block2' }); lab(R, y2, p.m2, 2);
        g.ground(-2.2, 2.2, 0);
      } else if (p.cfg === 'table' || p.cfg === 'incline') {
        const th = p.cfg === 'table' ? 0 : p.t1 * RAD, c = Math.cos(th), sn = Math.sin(th), Lr = 3.6;
        const P0 = [0, 0], Bt = [-Lr * c, -Lr * sn];
        g.path([P0, Bt, [Bt[0], -2.5], [0.25, -2.5], [0.25, 0]], { close: true, fill: '--block2', c: '--ink', w: 2 });
        const R = 0.22, pc = [0.15, 0.22]; g.pulley(pc[0], pc[1], R, s / R);
        const b1 = sz(p.m1), d = 1.9 - s, cx = -d * c - sn * b1 / 2, cy = -d * sn + c * b1 / 2;
        g.box(cx, cy, b1 * 1.3, b1, th, {}); lab(cx, cy, p.m1, 1);
        K.rope(g, [[cx + c * b1 * 0.65, cy + sn * b1 * 0.65], [pc[0] - 0.02, pc[1] + R]]);
        const b2 = sz(p.m2), y2 = -0.9 - s; K.rope(g, [[pc[0] + R, pc[1]], [pc[0] + R, y2 + b2 / 2]]); g.box(pc[0] + R, y2, b2, b2, 0, { fill: '--block2' }); lab(pc[0] + R, y2, p.m2, 2);
        if (th > 0) g.angle(Bt[0], Bt[1], 40, 0, th, 'θ');
      } else {
        const t1 = p.t1 * RAD, t2 = p.t2 * RAD, Hh = 2.6, L1 = Hh / Math.max(0.2, Math.sin(t1)), L2 = Hh / Math.max(0.2, Math.sin(t2));
        const X1 = -Math.min(3.4, Hh / Math.tan(Math.max(0.2, t1))), X2 = Math.min(3.4, Hh / Math.tan(Math.max(0.2, t2)));
        g.path([[X1, 0], [0, Hh], [X2, 0]], { close: true, fill: '--block2', c: '--ink', w: 2 }); g.ground(-3.6, 3.6, 0);
        const R = 0.18; g.pulley(0, Hh + R, R, s / R);
        const b1 = sz(p.m1), d1 = 1.3 - s, u1 = [-Math.cos(t1), -Math.sin(t1)], c1 = [d1 * u1[0] - Math.sin(t1) * b1 / 2, Hh + d1 * u1[1] + Math.cos(t1) * b1 / 2];
        const b2 = sz(p.m2), d2 = 1.3 + s, u2 = [Math.cos(t2), -Math.sin(t2)], c2 = [d2 * u2[0] + Math.sin(t2) * b2 / 2, Hh + d2 * u2[1] + Math.cos(t2) * b2 / 2];
        g.box(c1[0], c1[1], b1 * 1.2, b1, t1, {}); lab(c1[0], c1[1], p.m1, 1); g.box(c2[0], c2[1], b2 * 1.2, b2, -t2, { fill: '--block2' }); lab(c2[0], c2[1], p.m2, 2);
        K.rope(g, [[c1[0] - u1[0] * b1 * 0.6, c1[1] - u1[1] * b1 * 0.6], [-R * 0.7, Hh + R * 1.5], [R * 0.7, Hh + R * 1.5], [c2[0] - u2[0] * b2 * 0.6, c2[1] - u2[1] * b2 * 0.6]]);
      }
      g.textPx(12, 22, `a = ${fmt(r.a)} m/s²   T = ${fmt(r.T)} N`, { a: 'left', fs: 13, b: true });
    }
  },
  plot: { series: [{ label: 'ระยะที่เชือกเลื่อน', unit: 'm', c: '--c2', f: s => s.s }, { label: 'v', unit: 'm/s', c: '--c1', f: s => s.v }] },
  live: [{ name: 'v', unit: 'm/s', f: s => s.v }],
  notes: ['ระบบแอตวูด a = (m₂ − m₁)g/(m₁ + m₂) ถ้ามวลเท่ากันจะไม่เคลื่อนที่', 'แรงตึงเชือกน้อยกว่าน้ำหนักของมวลที่เคลื่อนลงเสมอ เพราะมวลนั้นมีความเร่งลง', 'แรงเสียดทานสถิตอาจทำให้ระบบนิ่งได้แม้แรงขับไม่เป็นศูนย์ ดูที่ "ติดอยู่นิ่ง"', 'ภาพแสดงการเคลื่อนที่ช่วงสั้นๆ เพื่อให้เห็นทิศ ค่าในตารางคือค่าที่คำนวณได้']
});

// ---------- 3 ลิฟต์ ----------
function liftInfo(p) {
  let t = 0, y = 0, v = 0, ymin = 0, ymax = 0; const b = [];
  p.phases.forEach(ph => { b.push({ t0: t, t1: t + ph.dur, a: ph.a }); y += v * ph.dur + 0.5 * ph.a * ph.dur * ph.dur; v += ph.a * ph.dur; t += ph.dur; ymin = Math.min(ymin, y); ymax = Math.max(ymax, y); });
  return { b, T: t, yf: y, vf: v, ymin, ymax };
}
CASES.push({
  name: 'ลิฟต์', title: 'น้ำหนักปรากฏในลิฟต์',
  desc: 'คนยืนบนตาชั่งในลิฟต์ กำหนดความเร่งของลิฟต์เป็นช่วงๆ ได้ ตาชั่งอ่านค่าแรงที่พื้นดันคน ซึ่งไม่เท่ากับ mg เมื่อลิฟต์มีความเร่ง',
  formula: 'N − mg = ma &nbsp;→&nbsp; N = m(g + a) &nbsp;|&nbsp; ตาชั่งอ่านเป็นกิโลกรัม = N/g',
  params: [
    { id: 'm', label: 'มวลคน (m)', unit: 'kg', min: 10, max: 150, step: 1, def: 60 },
    { id: 'phases', type: 'list', label: 'ช่วงการเคลื่อนที่ของลิฟต์ (ขึ้น = +)', item: 'ช่วง', min: 1, max: 6, fields: [{ id: 'a', label: 'ความเร่ง', unit: 'm/s²', min: -9.8, max: 10, step: 0.1 }, { id: 'dur', label: 'ระยะเวลา', unit: 's', min: 0.5, max: 10, step: 0.5 }], def: [{ a: 2, dur: 2 }, { a: 0, dur: 3 }, { a: -2, dur: 2 }], add: () => ({ a: 0, dur: 2 }) }
  ],
  presets: [{ label: 'ขึ้น: เร่ง-คงที่-ชะลอ', set: { phases: [{ a: 2, dur: 2 }, { a: 0, dur: 3 }, { a: -2, dur: 2 }] } }, { label: 'ลง: เร่ง-คงที่-ชะลอ', set: { phases: [{ a: -2, dur: 2 }, { a: 0, dur: 3 }, { a: 2, dur: 2 }] } }, { label: 'สายขาด (ตกอิสระ)', set: { phases: [{ a: -9.8, dur: 1.5 }] } }],
  outs: [{ id: 'W', name: 'น้ำหนักจริง mg', unit: 'N' }, { id: 'Nmax', name: 'ตาชั่งอ่านสูงสุด', unit: 'N' }, { id: 'Nmin', name: 'ตาชั่งอ่านต่ำสุด', unit: 'N' }, { id: 'yf', name: 'ลิฟต์เลื่อนไปรวม', unit: 'm' }],
  compute(p) { const i = liftInfo(p), Ns = p.phases.map(q => p.m * (G + q.a)); return { W: p.m * G, Nmax: Math.max(...Ns), Nmin: Math.max(0, Math.min(...Ns)), yf: i.yf, _i: i }; },
  sim: {
    init(p) { return { y: 0, v: 0, a: p.phases[0].a, k: 0 }; },
    step(st, dt, p, o) { const b = o._i.b; let k = b.findIndex(q => st.t < q.t1 - 1e-12); if (k < 0) k = b.length - 1; st.k = k; st.a = b[k].a; st.y += st.v * dt + 0.5 * st.a * dt * dt; st.v += st.a * dt; if (st.t + dt >= o._i.T) st.done = true; },
    view(p, o, st) { const y = st ? st.y : 0; return { x0: -3.4, x1: 4.6, y0: y - 1.6, y1: y + 4.4 }; },
    draw(g, st, p, o) {
      const i = o._i, W = 2.2, H = 2.8, y = st.y, N = Math.max(0, p.m * (G + st.a));
      g.rect(-W / 2 - 0.25, y - 30, W + 0.5, 70, { fill: '--bg', c: '--line', w: 1 });
      for (let f = Math.floor((y - 3) / 3) * 3; f <= y + 6; f += 3) { g.line(-W / 2 - 0.25, f, -W / 2 - 0.6, f, { c: '--muted', w: 1 }); g.text(-W / 2 - 0.7, f, 'ชั้น ' + (f / 3 + 1), { a: 'right', fs: 10, c: '--muted', base: 'middle' }); }
      g.line(0, y + H, 0, y + 20, { c: '--rope', w: 2 });
      g.rect(-W / 2, y, W, H, { fill: '--panel', c: '--ink', w: 2.5 });
      g.rect(-0.45, y + 0.05, 0.9, 0.15, { fill: '--c4', c: '--ink', w: 1 });
      // คน
      const py = y + 0.2; g.circle(0, py + 1.55, 0.18, { fill: '--block2', c: '--ink' }); g.line(0, py + 1.37, 0, py + 0.75, { w: 3 }); g.line(0, py + 0.75, -0.18, py, { w: 3 }); g.line(0, py + 0.75, 0.18, py, { w: 3 }); g.line(0, py + 1.25, -0.3, py + 0.9, { w: 3 }); g.line(0, py + 1.25, 0.3, py + 0.9, { w: 3 });
      const k = 70 / (p.m * G * 1.6);
      K.force(g, 0.55, y + 1.1, -Math.PI / 2, p.m * G * k, 'mg', '--c1'); K.force(g, 0.85, y + 1.1, Math.PI / 2, N * k, 'N', '--c2');
      if (Math.abs(st.a) > 0.01) g.vec(-0.7, y + H * 0.5, 0, sgn(st.a) * 40, { px: true, c: '--c3', w: 3, label: 'a' });
      // หน้าปัดตาชั่ง
      const dx = W * 0.9 + 1.4, dy = y + H / 2, R = 1.1, frac = clamp(N / (p.m * G * 2), 0, 1), ang = Math.PI * (1.25 - 1.5 * frac);
      g.circle(dx, dy, R, { fill: '--panel', c: '--ink', w: 2 });
      for (let q = 0; q <= 4; q++) { const aa = Math.PI * (1.25 - 1.5 * q / 4); g.line(dx + R * 0.82 * Math.cos(aa), dy + R * 0.82 * Math.sin(aa), dx + R * Math.cos(aa), dy + R * Math.sin(aa), { c: '--muted' }); }
      const a0 = Math.PI * (1.25 - 1.5 * 0.5); g.line(dx + R * 0.7 * Math.cos(a0), dy + R * 0.7 * Math.sin(a0), dx + R * Math.cos(a0), dy + R * Math.sin(a0), { c: '--c1', w: 2.5 });
      g.line(dx, dy, dx + R * 0.85 * Math.cos(ang), dy + R * 0.85 * Math.sin(ang), { c: '--c2', w: 3 });
      g.text(dx, dy - R * 0.45, fmt(N / G) + ' kg', { fs: 13, b: true }); g.text(dx, dy - R - 0.35, 'เส้นแดง = mg จริง', { fs: 10, c: '--muted' });
    }
  },
  plot: { series: [{ label: 'ตาชั่ง N', unit: 'N', c: '--c2', f: (s, p) => Math.max(0, p.m * (G + s.a)) }, { label: 'v ลิฟต์', unit: 'm/s', c: '--c1', f: s => s.v }, { label: 'y ลิฟต์', unit: 'm', c: '--c4', f: s => s.y, on: false }] },
  live: [{ name: 'ตาชั่ง', unit: 'N', f: (s, p) => Math.max(0, p.m * (G + s.a)) }, { name: 'a', unit: 'm/s²', f: s => s.a }, { name: 'v', unit: 'm/s', f: s => s.v }],
  notes: ['ตาชั่งขึ้นกับความเร่ง ไม่ใช่ความเร็ว ลิฟต์ขึ้นด้วยความเร็วคงที่ตาชั่งอ่านเท่ากับ mg', 'ลิฟต์เร่งขึ้นหรือชะลอขณะลง (a ชี้ขึ้น) ตาชั่งอ่านมากกว่า mg', 'ตกอิสระ a = −g ตาชั่งอ่านศูนย์ คือสภาพไร้น้ำหนัก']
});

// ---------- 4 บล็อกซ้อน ----------
function stack(p) {
  const m1 = p.m1, m2 = p.m2, N2 = m2 * G, Ng = (m1 + m2) * G, fg = p.mug * Ng;
  let a1 = 0, a2 = 0, f12 = 0, state;
  if (p.on === 'bottom') {
    if (p.F <= fg) { state = 'ไม่เคลื่อนที่'; }
    else { const a = (p.F - fg) / (m1 + m2), need = m2 * a; if (need <= p.mus * N2) { a1 = a2 = a; f12 = need; state = 'เคลื่อนที่ไปด้วยกัน'; } else { a2 = p.muk * G; f12 = p.muk * N2; a1 = (p.F - fg - f12) / m1; state = 'ก้อนบนไถลบนก้อนล่าง'; } }
  } else {
    const a = Math.max(0, (p.F - fg) / (m1 + m2)), need = p.F - m2 * a;
    if (p.F <= p.mus * N2 && p.F <= fg) { state = 'ไม่เคลื่อนที่'; f12 = p.F; }
    else if (need <= p.mus * N2 && p.F > fg) { a1 = a2 = a; f12 = need; state = 'เคลื่อนที่ไปด้วยกัน'; }
    else { f12 = p.muk * N2; a2 = (p.F - f12) / m2; a1 = f12 > fg ? (f12 - fg) / m1 : 0; state = a1 > 0 ? 'ไถลกัน ก้อนล่างถูกลากไปด้วย' : 'ก้อนบนไถล ก้อนล่างนิ่ง'; }
  }
  return { a1, a2, f12, fg: (a1 > 0 || a2 > 0) && (a1 > 0) ? fg : (p.on === 'bottom' ? Math.min(p.F, fg) : Math.min(f12, fg)), state };
}
CASES.push({
  name: 'บล็อกซ้อน', title: 'กล่องซ้อนกันกับแรงเสียดทานระหว่างผิว',
  desc: 'ออกแรงดึงที่ก้อนล่างหรือก้อนบน ดูว่าทั้งสองก้อนไปด้วยกันหรือก้อนบนไถล โดยพิจารณาแรงเสียดทานระหว่างก้อนและกับพื้น',
  formula: 'ไปด้วยกัน: a = (F − f_พื้น)/(m₁+m₂) ต้องการ f₁₂ = m₂a ≤ μₛm₂g &nbsp;|&nbsp; ไถล: f₁₂ = μₖm₂g',
  params: [
    { id: 'on', label: 'ออกแรงที่', opts: [['bottom', 'ก้อนล่าง'], ['top', 'ก้อนบน']], def: 'bottom' },
    { id: 'F', label: 'แรงดึง F', unit: 'N', min: 0, max: 200, step: 1, def: 60 },
    { id: 'm1', label: 'มวลก้อนล่าง (m₁)', unit: 'kg', min: 1, max: 20, step: 0.5, def: 6 },
    { id: 'm2', label: 'มวลก้อนบน (m₂)', unit: 'kg', min: 0.5, max: 20, step: 0.5, def: 3 },
    { id: 'mus', label: 'μ สถิตระหว่างก้อน', unit: '', min: 0, max: 1, step: 0.01, def: 0.4 },
    { id: 'muk', label: 'μ จลน์ระหว่างก้อน', unit: '', min: 0, max: 1, step: 0.01, def: 0.3 },
    { id: 'mug', label: 'μ จลน์ก้อนล่างกับพื้น', unit: '', min: 0, max: 1, step: 0.01, def: 0.1 }
  ],
  outs: [{ id: 'state', name: 'ผล', unit: '' }, { id: 'a1', name: 'ความเร่งก้อนล่าง', unit: 'm/s²' }, { id: 'a2', name: 'ความเร่งก้อนบน', unit: 'm/s²' }, { id: 'f12', name: 'แรงเสียดทานระหว่างก้อน', unit: 'N' }, { id: 'Fmax', name: 'F มากสุดที่ยังไปด้วยกัน', unit: 'N' }],
  compute(p) {
    const r = stack(p), Ng = (p.m1 + p.m2) * G;
    const Fmax = p.on === 'bottom' ? p.mug * Ng + (p.m1 + p.m2) * p.mus * G : (p.mus * p.m2 * G * (p.m1 + p.m2) - p.m2 * p.mug * Ng) / p.m1;
    return { state: r.state, a1: r.a1, a2: r.a2, f12: r.f12, Fmax: Fmax > 0 ? Fmax : 'ไปด้วยกันไม่ได้', _r: r };
  },
  sim: {
    dt: 1 / 480,
    init() { return { x1: 0, x2: 0, v1: 0, v2: 0, y2: 0.55, vy: 0, off: false }; },
    step(st, dt, p, o) {
      const r = o._r; st.x1 += st.v1 * dt + 0.5 * r.a1 * dt * dt; st.v1 += r.a1 * dt;
      const rel = st.x2 - st.x1;
      if (!st.off && (rel > 1.75 || rel < -0.65)) st.off = true;
      if (st.off) { if (st.y2 > 0) { st.vy -= G * dt; st.y2 = Math.max(0, st.y2 + st.vy * dt); st.x2 += st.v2 * dt; } else { st.v2 = Math.max(0, st.v2 - 0.5 * G * dt); st.x2 += st.v2 * dt; if (st.v2 === 0 && !st.end) st.end = st.t; } }
      else { st.x2 += st.v2 * dt + 0.5 * r.a2 * dt * dt; st.v2 += r.a2 * dt; }
      if (st.t > 6 || (st.end && st.t > st.end + 0.5) || (r.a1 === 0 && r.a2 === 0 && st.t > 1)) st.done = true;
    },
    view() { return { x0: -1.5, x1: 9, y0: -0.4, y1: 2.6 }; },
    draw(g, st, p, o) {
      const L1 = 2.4, h1 = 0.55, L2 = 0.9, h2 = 0.5; const v = g.visible(); g.ground(v.x0, v.x1, 0);
      const off = ((st.x1) % 2 + 2) % 2; for (let x = Math.floor(v.x0) - off; x < v.x1; x += 1) g.line(x, 0, x - 0.15, -0.15, { c: '--muted', w: 1 });
      const cam = Math.max(0, st.x1 - 3), X1 = st.x1 - cam, rel = st.x2 - st.x1, X2 = X1 + 0.2 + rel;
      g.box(X1 + L1 / 2, h1 / 2, L1, h1, 0, { label: 'm₁ ' + p.m1 + ' kg' });
      const fall = st.off;
      g.box(X2 + L2 / 2, st.y2 + h2 / 2, L2, h2, 0, { fill: '--block2', label: 'm₂' });
      const ky = 80 / Math.max(p.F, 1e-9, o._r.f12);
      if (p.on === 'bottom') g.vec(X1 + L1, h1 / 2, p.F * ky, 0, { px: true, c: '--c4', w: 3, label: 'F' }); else if (!st.off) g.vec(X2 + L2, h1 + h2 / 2, p.F * ky, 0, { px: true, c: '--c4', w: 3, label: 'F' });
      if (o._r.f12 > 0 && !st.off) g.vec(X2 + L2 / 2, h1 + 0.03, (p.on === 'bottom' ? 1 : -1) * o._r.f12 * ky, 0, { px: true, c: '--c3', w: 2.5, label: 'f บน', lside: -1 });
      g.textPx(12, 22, o._r.state + (fall ? ' — ก้อนบนหลุดแล้ว' : ''), { a: 'left', fs: 13, b: true });
      g.textPx(12, 42, `v₁ = ${fmt(st.v1)} m/s   v₂ = ${fmt(st.v2)} m/s`, { a: 'left', fs: 12, c: '--muted' });
    }
  },
  plot: { overlay: true, yLabel: 'v (m/s)', series: [{ label: 'v ก้อนล่าง', unit: 'm/s', c: '--c2', f: s => s.v1 }, { label: 'v ก้อนบน', unit: 'm/s', c: '--c1', f: s => s.v2 }] },
  notes: ['ดึงก้อนล่างแรงเกินไป ก้อนบนจะไถลไปข้างหลังเมื่อเทียบกับก้อนล่าง (แม้ยังเคลื่อนไปข้างหน้าเทียบพื้น)', 'แรงเสียดทานที่ก้อนล่างกระทำต่อก้อนบนเป็นแรงที่ทำให้ก้อนบนมีความเร่ง', 'ค่า "F มากสุดที่ยังไปด้วยกัน" คือเงื่อนไขที่พบบ่อยในข้อสอบ']
});

Lab.add('newton', CASES);
})();
