/* บทที่ 8 การเคลื่อนที่แบบวงกลม */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];

// ---------- 1 ลูกตุ้มกรวย ----------
CASES.push({
  name: 'ลูกตุ้มกรวย', aspect: 16 / 9, title: 'ลูกตุ้มกรวย (วงกลมแนวระดับ)',
  desc: 'มวลผูกเชือกหมุนเป็นวงกลมแนวระดับ เชือกกวาดเป็นรูปกรวย องค์ประกอบแนวระดับของแรงตึงเป็นแรงสู่ศูนย์กลาง ส่วนองค์ประกอบแนวดิ่งรับน้ำหนัก ดูในมุมมอง 3D ได้',
  formula: 'T cos θ = mg &nbsp;|&nbsp; T sin θ = mv²/r = mω²r &nbsp;|&nbsp; tan θ = v²/(rg) &nbsp;|&nbsp; คาบ = 2π√(L cos θ / g)',
  params: [
    { id: 'L', label: 'ความยาวเชือก', unit: 'm', min: 0.2, max: 3, step: 0.01, def: 1 },
    { id: 'th', label: 'มุมเชือกกับแนวดิ่ง (θ)', unit: '°', min: 2, max: 85, step: 0.5, def: 35 },
    { id: 'm', label: 'มวล', unit: 'kg', min: 0.05, max: 5, step: 0.05, def: 0.5 },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 }
  ],
  outs: [{ id: 'r', name: 'รัศมีวงกลม', unit: 'm' }, { id: 'v', name: 'อัตราเร็ว', unit: 'm/s' }, { id: 'w', name: 'อัตราเร็วเชิงมุม', unit: 'rad/s' }, { id: 'P', name: 'คาบ', unit: 's' }, { id: 'T', name: 'แรงตึงเชือก', unit: 'N' }, { id: 'Fc', name: 'แรงสู่ศูนย์กลาง', unit: 'N' }],
  compute(p) { const th = p.th * RAD, r = p.L * Math.sin(th), w = Math.sqrt(p.g / (p.L * Math.cos(th))); return { r, v: w * r, w, P: 2 * Math.PI / w, T: p.m * p.g / Math.cos(th), Fc: p.m * p.g * Math.tan(th) }; },
  sim: {
    dt: 1 / 240,
    init() { return { ph: 0 }; },
    step(st, dt, p, o) { st.ph += o.w * dt; },
    view(p) { return { x0: -p.L * 2.3, x1: p.L * 2.3, y0: -p.L * 1.15, y1: p.L * 0.25 }; },
    draw(g, st, p, o) {
      const th = p.th * RAD, h = p.L * Math.cos(th), r = o.r, x = r * Math.cos(st.ph), z = r * Math.sin(st.ph);
      // มุมมองด้านข้าง (ซ้าย)
      const ox = -p.L * 1.05; g.line(ox - p.L * 0.3, 0, ox + p.L * 0.3, 0, { w: 4 }); g.text(ox, p.L * 0.15, 'ด้านข้าง', { fs: 11, c: '--muted' });
      g.line(ox, 0, ox, -h, { c: '--muted', dash: [4, 4], w: 1 }); g.line(ox - r, -h, ox + r, -h, { c: '--muted', dash: [2, 4], w: 1 });
      g.line(ox, 0, ox + x, -h, { c: '--rope', w: 2 }); g.circle(ox + x, -h, 0.06 * p.L + 0.02, { fill: '--c1', c: '--ink' });
      const k = 70 / o.T; g.vec(ox + x, -h, -Math.sign(x || 1) * 0 + (-x / p.L) * o.T * k * 0 + (-x / Math.max(1e-9, Math.hypot(x, h))) * o.T * k, h / Math.hypot(x, h) * o.T * k, { px: true, c: '--c3', w: 2.5, label: 'T' });
      g.vec(ox + x, -h, 0, -p.m * p.g * k, { px: true, c: '--c1', w: 2.5, label: 'mg' });
      g.vec(ox + x, -h, -Math.sign(x) * o.Fc * k * Math.abs(Math.cos(st.ph)), 0, { px: true, c: '--c4', w: 2, dash: [5, 3], label: 'ΣF' });
      g.angle(ox, 0, 30, -Math.PI / 2, -Math.PI / 2 + th, 'θ');
      // มุมมองด้านบน (ขวา)
      const cx = p.L * 1.15, cy = -p.L * 0.45; g.text(cx, p.L * 0.15, 'ด้านบน', { fs: 11, c: '--muted' });
      g.circle(cx, cy, r, { c: '--muted', dash: [4, 4], w: 1 }); g.circle(cx, cy, 0.03, { fill: '--ink', c: 'none' });
      g.line(cx, cy, cx + x, cy + z, { c: '--rope', w: 1.5 }); g.circle(cx + x, cy + z, 0.06 * p.L + 0.02, { fill: '--c1', c: '--ink' });
      g.vec(cx + x, cy + z, -z / r * 45, x / r * 45, { px: true, c: '--c2', w: 2.5, label: 'v' }); g.vec(cx + x, cy + z, -x / r * 40, -z / r * 40, { px: true, c: '--c4', w: 2.5, label: 'a_c' });
    }
  },
  plot: null,
  live: [{ name: 'มุมที่หมุนไป', unit: 'รอบ', f: s => s.ph / (2 * Math.PI) }],
  three: {
    cam(p) { return { pos: [p.L * 1.6, p.L * 0.5, p.L * 2.2], target: [0, -p.L * 0.6, 0] }; },
    build(T, p, o) {
      const th = p.th * RAD, h = p.L * Math.cos(th); const top = T.box(p.L * 0.8, 0.03, p.L * 0.8, '--ink'); top.position.y = 0.015;
      T.floor(p.L * 4, { y: -p.L * 1.3, step: 0.25 });
      const circ = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * 2 * Math.PI; circ.push([o.r * Math.cos(a), -h, o.r * Math.sin(a)]); } T.line('--muted', { pts: circ, max: 65 });
      const cone = T.mesh(new T.THREE.ConeGeometry(o.r, h, 48, 1, true), '--water', { opacity: 0.12, side: T.THREE.DoubleSide, cast: false }); cone.position.y = -h / 2; cone.rotation.x = Math.PI;
      return { rope: T.line('--rope', { max: 2 }), bob: T.sphere(0.06 * p.L + 0.02, '--c1'), aT: T.vec('--c3', 'T', { r: 0.012, pad: 0.08 }), aW: T.vec('--c1', 'mg', { r: 0.012, pad: 0.08 }), aC: T.vec('--c4', 'ΣF', { r: 0.012, pad: 0.08 }), aV: T.vec('--c2', 'v', { kind: 'v', r: 0.012, pad: 0.08 }), h };
    },
    update(ob, st, p, o) {
      const x = o.r * Math.cos(st.ph), z = o.r * Math.sin(st.ph), P = [x, -ob.h, z], k = p.L * 0.45 / o.T;
      ob.rope.set([[0, 0, 0], P]); ob.bob.position.set(...P);
      ob.aT.set(P, [-x / p.L * o.T * k, ob.h / p.L * o.T * k, -z / p.L * o.T * k], 'T ' + fmt(o.T) + ' N'); ob.aW.set(P, [0, -p.m * p.g * k, 0], 'mg ' + fmt(p.m * p.g) + ' N'); ob.aC.set(P, [-x / o.r * o.Fc * k, 0, -z / o.r * o.Fc * k], 'ΣF ' + fmt(o.Fc) + ' N'); ob.aV.set(P, [-z / o.r * p.L * 0.3, 0, x / o.r * p.L * 0.3], 'v ' + fmt(o.v) + ' m/s');
    }
  },
  notes: ['มุมกว้างขึ้น ต้องหมุนเร็วขึ้น และแรงตึงเพิ่มขึ้นมาก (T = mg/cos θ)', 'คาบขึ้นกับความสูงของกรวย L cos θ ไม่ขึ้นกับมวล', 'แรงลัพธ์ (ΣF) ชี้เข้าหาศูนย์กลางวงกลมแนวระดับเสมอ ไม่ใช่ชี้ไปที่จุดแขวน', 'หมุนมุมกล้องในมุมมอง 3D เพื่อดูรูปกรวย']
});

// ---------- 2 วงกลมแนวดิ่ง ----------
const VT = [['string', 'เชือก'], ['rod', 'แท่งแข็ง'], ['track', 'รางวงในวง']];
function vcirc(p) { const g = p.g, R = p.R; const vmin = p.type === 'rod' ? 2 * Math.sqrt(g * R) : Math.sqrt(5 * g * R); const vt2 = p.v0 * p.v0 - 4 * g * R; return { vmin, vtop: vt2 >= 0 ? Math.sqrt(vt2) : NaN, Nb: p.m * (p.v0 * p.v0 / R + g), Nt: vt2 >= 0 ? p.m * (vt2 / R - g) : NaN, full: p.v0 >= vmin - 1e-9 }; }
CASES.push({
  name: 'วงกลมแนวดิ่ง', aspect: 16 / 9, title: 'การเคลื่อนที่เป็นวงกลมในแนวดิ่ง',
  desc: 'มวลผูกเชือก ติดแท่งแข็ง หรือวิ่งในรางวง เริ่มจากจุดต่ำสุดด้วยอัตราเร็วที่ปรับได้ ดูแรงตึงหรือแรงปฏิกิริยาที่แต่ละตำแหน่ง และดูว่าครบรอบหรือหลุดจากวง',
  formula: 'T − mg cos φ = mv²/R (φ วัดจากจุดต่ำสุด) &nbsp;|&nbsp; v² = v₀² − 2gR(1 − cos φ) &nbsp;|&nbsp; เชือก/ราง ครบรอบเมื่อ v₀ ≥ √(5gR) &nbsp;|&nbsp; แท่งแข็ง v₀ ≥ 2√(gR)',
  params: [
    { id: 'type', label: 'ยึดด้วย', opts: VT, def: 'string' },
    { id: 'R', label: 'รัศมี', unit: 'm', min: 0.2, max: 5, step: 0.05, def: 1 },
    { id: 'v0', label: 'อัตราเร็วที่จุดต่ำสุด', unit: 'm/s', min: 0.5, max: 20, step: 0.05, def: 7.5 },
    { id: 'm', label: 'มวล', unit: 'kg', min: 0.05, max: 10, step: 0.05, def: 0.5 },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 }
  ],
  presets: [{ label: 'พอดีครบรอบ (เชือก)', set: { type: 'string', v0: 7.0, R: 1, g: 9.8 } }, { label: 'ไม่ครบรอบ หลุดวง', set: { type: 'string', v0: 6, R: 1 } }, { label: 'แท่งแข็งช้าๆ', set: { type: 'rod', v0: 6.3, R: 1 } }],
  outs: [{ id: 'vmin', name: 'v₀ ต่ำสุดที่ครบรอบ', unit: 'm/s' }, { id: 'vtop', name: 'อัตราเร็วที่จุดสูงสุด', unit: 'm/s' }, { id: 'Nb', name: 'แรงตึง/แรงปฏิกิริยาที่จุดต่ำสุด', unit: 'N' }, { id: 'Nt', name: 'ที่จุดสูงสุด', unit: 'N' }, { id: 'res', name: 'ผล', unit: '' }],
  compute(p) { const r = vcirc(p); return { vmin: r.vmin, vtop: isNaN(r.vtop) ? 'ขึ้นไม่ถึง' : r.vtop, Nb: r.Nb, Nt: isNaN(r.Nt) ? '—' : r.Nt, res: r.full ? 'ครบรอบ' : 'ไม่ครบรอบ', _r: r }; },
  sim: {
    dt: 1 / 2000,
    init(p) { return { phi: 0, w: p.v0 / p.R, free: false, x: 0, y: -p.R, vx: p.v0, vy: 0, tr: [], N: p.m * (p.v0 * p.v0 / p.R + p.g), laps: 0 }; },
    step(st, dt, p) {
      const R = p.R, g = p.g;
      if (!st.free) {
        st.w += -g / R * Math.sin(st.phi) * dt; st.phi += st.w * dt;
        const v = st.w * R; st.N = p.m * (v * v / R + g * Math.cos(st.phi));
        st.x = R * Math.sin(st.phi); st.y = -R * Math.cos(st.phi);
        if (st.N < 0 && p.type !== 'rod') { st.free = true; st.vx = v * Math.cos(st.phi); st.vy = v * Math.sin(st.phi); st.N = 0; st.leave = st.phi; }
      } else {
        st.vy -= g * dt; st.x += st.vx * dt; st.y += st.vy * dt; st.N = 0;
        if (Math.hypot(st.x, st.y) >= R && st.t > 0.05 && Math.hypot(st.x, st.y) - R > 1e-3) { st.done = true; }
        if (st.y < -R * 1.6) st.done = true;
      }
      if (st.tr.length === 0 || st.t - (st.lt || 0) > 0.01) { st.tr.push([st.x, st.y]); st.lt = st.t; if (st.tr.length > 900) st.tr.shift(); }
      if (st.t > 8) st.done = true;
    },
    view(p) { return { x0: -p.R * 2.6, x1: p.R * 2.6, y0: -p.R * 1.35, y1: p.R * 1.35 }; },
    draw(g, st, p, o) {
      const R = p.R; if (p.type === 'track') { g.circle(0, 0, R * 1.06, { c: '--ink', w: 4 }); g.circle(0, 0, R * 1.12, { c: '--ground', w: 6 }); } else g.circle(0, 0, R, { c: '--line', w: 1.5, dash: [4, 5] });
      g.circle(0, 0, 0.04 * R, { fill: '--ink', c: 'none' });
      g.path(st.tr, { c: '--c1', w: 1.5, alpha: 0.5 });
      if (!st.free && p.type !== 'track') g.line(0, 0, st.x, st.y, { c: p.type === 'rod' ? '--block2' : '--rope', w: p.type === 'rod' ? 5 : 2 });
      g.circle(st.x, st.y, 0.09 * R, { fill: '--c1', c: '--ink' });
      if (!st.free) { const k = 60 / Math.max(o._r.Nb, 1e-9); const ux = -st.x / R, uy = -st.y / R; g.vec(st.x, st.y, ux * st.N * k, uy * st.N * k, { px: true, c: st.N >= 0 ? '--c3' : '--bad', w: 3, label: (p.type === 'track' ? 'N ' : 'T ') + fmt(st.N) }); g.vec(st.x, st.y, 0, -p.m * p.g * k, { px: true, c: '--c1', w: 2.5, label: 'mg' }); }
      if (st.leave != null) g.text(R * 1.3, R * 1.1, 'หลุดจากวงที่มุม ' + fmt(st.leave * DEG) + '° จากจุดต่ำสุด', { a: 'left', fs: 12, b: true, c: '--bad' });
      // กราฟแรงรอบวง (ขวา)
      const ox = R * 1.45, oy = -R * 1.1, W = R * 1.05, H = R * 1.6, Nm = Math.max(o._r.Nb, 1e-9) * 1.1;
      g.rect(ox, oy, W, H, { fill: '--bg', c: '--line' }); g.line(ox, oy + H / 2, ox + W, oy + H / 2, { c: '--muted', w: 1 });
      g.fn(x => { const ph = (x - ox) / W * 2 * Math.PI, v2 = p.v0 * p.v0 - 2 * p.g * R * (1 - Math.cos(ph)); return v2 < 0 ? NaN : oy + H / 2 + p.m * (v2 / R + p.g * Math.cos(ph)) / Nm * H / 2; }, ox, ox + W, { c: '--c3', w: 2 });
      g.text(ox + W / 2, oy + H + 0.06 * R, 'แรงตึง/N ตามมุม 0° → 360°', { fs: 10, c: '--muted' }); g.text(ox + W / 2, oy - 0.1 * R, 'จุดสูงสุดอยู่กลางกราฟ', { fs: 9, c: '--muted' });
    }
  },
  plot: { series: [{ label: 'แรงตึง/N', unit: 'N', c: '--c3', f: s => s.N }, { label: 'อัตราเร็ว', unit: 'm/s', c: '--c1', f: (s, p) => s.free ? Math.hypot(s.vx, s.vy) : Math.abs(s.w * p.R) }] },
  notes: ['แรงตึงมากที่สุดที่จุดต่ำสุด เพราะต้องทั้งรับน้ำหนักและให้แรงสู่ศูนย์กลาง', 'ที่จุดสูงสุดถ้าเชือกพอดีหย่อน (T = 0) น้ำหนักทำหน้าที่เป็นแรงสู่ศูนย์กลางพอดี v_top = √(gR)', 'แท่งแข็งดันได้ จึงครบรอบได้แม้ v_top = 0 แต่เชือกหย่อนแล้วมวลตกเป็นโพรเจกไทล์', 'ลองตั้ง v₀ ต่ำกว่าค่าต่ำสุดเล็กน้อย ดูจุดที่หลุดจากวง']
});

// ---------- 3 รถเลี้ยวโค้งเอียง ----------
function bank(p) {
  const th = p.th * RAD, g = 9.8, r = p.r, mu = p.mu;
  const v0 = Math.sqrt(r * g * Math.tan(th));
  const vmax2 = r * g * (Math.sin(th) + mu * Math.cos(th)) / (Math.cos(th) - mu * Math.sin(th)), vmin2 = r * g * (Math.sin(th) - mu * Math.cos(th)) / (Math.cos(th) + mu * Math.sin(th));
  const v = p.v / 3.6, a = v * v / r;
  const N = p.m * (g * Math.cos(th) + a * Math.sin(th)), f = p.m * (a * Math.cos(th) - g * Math.sin(th));
  return { v0, vmax: vmax2 > 0 && Math.cos(th) - mu * Math.sin(th) > 0 ? Math.sqrt(vmax2) : Infinity, vmin: vmin2 > 0 ? Math.sqrt(vmin2) : 0, N, f, need: N > 0 ? Math.abs(f) / N : Infinity, v };
}
CASES.push({
  name: 'ถนนโค้งเอียง', aspect: 16 / 9, title: 'รถเลี้ยวบนถนนโค้งที่ยกขอบ',
  desc: 'ปรับรัศมีโค้ง มุมยกขอบถนน สัมประสิทธิ์แรงเสียดทาน และความเร็วรถ ดูว่าแรงเสียดทานต้องชี้ขึ้นหรือลงตามพื้นเอียง และรถไถลออกหรือไถลลงหรือไม่',
  formula: 'ไม่ต้องอาศัยแรงเสียดทานเมื่อ v = √(rg tan θ) &nbsp;|&nbsp; v<sub>max</sub> = √(rg (sin θ + μ cos θ)/(cos θ − μ sin θ)) &nbsp;|&nbsp; ถนนราบ v<sub>max</sub> = √(μrg)',
  params: [
    { id: 'r', label: 'รัศมีโค้ง', unit: 'm', min: 10, max: 500, step: 1, def: 80 },
    { id: 'th', label: 'มุมยกขอบถนน', unit: '°', min: 0, max: 45, step: 0.5, def: 15 },
    { id: 'mu', label: 'μ ระหว่างยางกับถนน', unit: '', min: 0, max: 1.2, step: 0.01, def: 0.5 },
    { id: 'v', label: 'ความเร็วรถ', unit: 'km/h', min: 5, max: 250, step: 1, def: 90 },
    { id: 'm', label: 'มวลรถ', unit: 'kg', min: 500, max: 3000, step: 50, def: 1200 }
  ],
  outs: [{ id: 'v0', name: 'ความเร็วที่ไม่ต้องใช้แรงเสียดทาน', unit: 'km/h' }, { id: 'vmax', name: 'ความเร็วสูงสุดที่ไม่ไถลออก', unit: 'km/h' }, { id: 'vmin', name: 'ความเร็วต่ำสุดที่ไม่ไถลลง', unit: 'km/h' }, { id: 'f', name: 'แรงเสียดทานที่ต้องการ (+ ลงตามพื้นเอียง)', unit: 'N' }, { id: 'N', name: 'แรงปฏิกิริยาตั้งฉาก', unit: 'N' }, { id: 'res', name: 'ผล', unit: '' }],
  compute(p) { const b = bank(p), ok = b.need <= p.mu + 1e-9; return { v0: b.v0 * 3.6, vmax: isFinite(b.vmax) ? b.vmax * 3.6 : 'ไม่จำกัด', vmin: b.vmin * 3.6, f: b.f, N: b.N, res: ok ? 'เลี้ยวได้' : (b.f > 0 ? 'เร็วไป ไถลออกนอกโค้ง' : 'ช้าไป ไถลลงในโค้ง'), _b: b, _ok: ok }; },
  sim: {
    dt: 1 / 240,
    init() { return { ang: 0, drift: 0 }; },
    step(st, dt, p, o) { st.ang += o._b.v / p.r * dt; if (!o._ok) st.drift += (o._b.f > 0 ? 1 : -1) * dt * 0.4; if (Math.abs(st.drift) > 1.2) st.done = true; if (st.t > 30) st.done = true; },
    view() { return { x0: -3, x1: 3.4, y0: -0.6, y1: 2.4 }; },
    draw(g, st, p, o) {
      const th = p.th * RAD, c = Math.cos(th), s = Math.sin(th), b = o._b, W = 3.2;
      g.text(0, 2.25, 'ภาพตัดขวาง (จุดศูนย์กลางโค้งอยู่ทางซ้าย)', { fs: 11, c: '--muted' });
      g.path([[-W / 2 * c, -W / 2 * s + 0.4], [W / 2 * c, W / 2 * s + 0.4], [W / 2 * c, -0.6], [-W / 2 * c, -0.6]], { close: true, fill: '--ground', c: '--ink', w: 2 });
      const d = clamp(st.drift, -1.2, 1.2), cx = d * c - s * 0.32, cy = 0.4 + d * s + c * 0.32;
      g.box(cx, cy, 1.0, 0.55, th, { fill: '--c2', label: '' });
      const k = 80 / (p.m * 9.8);
      K.force(g, cx, cy, -Math.PI / 2, p.m * 9.8 * k, 'mg', '--c1'); K.force(g, cx, cy, Math.PI / 2 + th, b.N * k, 'N', '--c2');
      if (Math.abs(b.f) > 1) K.force(g, cx - s * 0, cy - c * 0.25, th + Math.PI, b.f * k, 'f', '--c3');
      g.vec(cx, cy, -p.m * b.v * b.v / p.r * k, 0, { px: true, c: '--c4', w: 2, dash: [5, 3], label: 'ΣF = mv²/r' });
      g.angle(-W / 2 * c, -W / 2 * s + 0.4, 34, 0, th, 'θ');
      g.textPx(12, 22, o.res, { a: 'left', fs: 14, b: true, c: o._ok ? '--good' : '--bad' });
    }
  },
  three: {
    cam(p) { return { pos: [p.r * 0.2, p.r * 0.45, p.r * 1.45], target: [0, 0, p.r * 0.3] }; },
    build(T, p) {
      const th = p.th * RAD, w = Math.max(6, p.r * 0.08), seg = 96; const geo = new T.THREE.BufferGeometry(), pos = [], idx = [];
      for (let i = 0; i <= seg; i++) { const a = i / seg * 2 * Math.PI; [-1, 1].forEach(sd => { const rr = p.r + sd * w / 2 * Math.cos(th), y = sd * w / 2 * Math.sin(th); pos.push(rr * Math.cos(a), y, rr * Math.sin(a)); }); if (i < seg) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      geo.setAttribute('position', new T.THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      T.mesh(geo, '--ground', { side: T.THREE.DoubleSide, receive: true, cast: false });
      T.floor(p.r * 3, { y: -w * 0.6, step: K.niceStep(p.r / 4) });
      const cs = Math.max(6, p.r * 0.11), car = K.car3d(T, '--c1', cs), o3 = { r: cs * 0.03, pad: cs * 0.25 };
      return { car, th, w, cs, lab: T.label('', '--ink'), aW: T.vec('--c1', 'mg', o3), aN: T.vec('--c2', 'N', o3), aF: T.vec('--c3', 'f', o3), aS: T.vec('--c4', 'ΣF', o3), aV: T.vec('--c6', 'v', Object.assign({ kind: 'v' }, o3)) };
    },
    update(ob, st, p, o) { const a = st.ang, d = clamp(st.drift, -1.2, 1.2) * ob.w * 0.4, rr = p.r + d * Math.cos(ob.th), y = d * Math.sin(ob.th); ob.car.position.set(rr * Math.cos(a), y + 0.1, -rr * Math.sin(a)); ob.car.rotation.set(0, a + Math.PI, 0); ob.car.rotateX(-ob.th * 0); ob.car.rotateZ(0); ob.car.children.forEach(() => {}); ob.lab.set(fmt(p.v) + ' km/h', [(rr + ob.cs * 1.6) * Math.cos(a), y, -(rr + ob.cs * 1.6) * Math.sin(a)]);
      const b = o._b, k = ob.cs * 2 / (p.m * 9.8), c = Math.cos(ob.th), s = Math.sin(ob.th), ix = -Math.cos(a), iz = Math.sin(a), P = [rr * Math.cos(a), y + ob.cs * 0.35, -rr * Math.sin(a)];
      const Fc = p.m * b.v * b.v / p.r;
      ob.aW.set(P, [0, -p.m * 9.8 * k, 0], 'mg'); ob.aN.set(P, [ix * s * b.N * k, c * b.N * k, iz * s * b.N * k], 'N ' + fmt(b.N) + ' N');
      if (Math.abs(b.f) > 1) ob.aF.set(P, [ix * c * b.f * k, -s * b.f * k, iz * c * b.f * k], 'f ' + fmt(Math.abs(b.f)) + ' N'); else ob.aF.hide();
      ob.aS.set(P, [ix * Fc * k, 0, iz * Fc * k], 'ΣF = mv²/r'); ob.aV.set(P, [-Math.sin(a) * ob.cs * 1.6, 0, -Math.cos(a) * ob.cs * 1.6], 'v');
    }
  },
  notes: ['ความเร็วพอดี (v₀) แรงเสียดทานเป็นศูนย์ แรงปฏิกิริยาตั้งฉากแนวระดับทำหน้าที่เป็นแรงสู่ศูนย์กลาง', 'เร็วกว่า v₀ แรงเสียดทานต้องชี้ลงตามพื้นเอียง ช้ากว่า v₀ ต้องชี้ขึ้น', 'ถนนเอียงมากขึ้น ความเร็วที่ปลอดภัยสูงขึ้น', 'ดูมุมมอง 3D เพื่อเห็นรถวิ่งรอบสนาม']
});

// ---------- 4 วงโคจรดาวเทียม ----------
const GM_E = 3.986e14, RE = 6.371e6;
CASES.push({
  name: 'วงโคจรดาวเทียม', aspect: 16 / 10, title: 'ดาวเทียมรอบดาวเคราะห์',
  desc: 'ยิงดาวเทียมในแนวระดับที่ความสูงต่างๆ ด้วยความเร็วเป็นสัดส่วนของความเร็ววงโคจรวงกลม ดูวงโคจรวงกลม วงรี หรือหลุดพ้น พร้อมคาบตามกฎของเคปเลอร์',
  formula: 'GMm/r² = mv²/r → v = √(GM/r) &nbsp;|&nbsp; T² = 4π²r³/GM &nbsp;|&nbsp; ความเร็วหลุดพ้น v<sub>e</sub> = √(2GM/r) = √2 × v วงกลม',
  params: [
    { id: 'M', label: 'มวลดาวเคราะห์ (เท่าของโลก)', unit: '', min: 0.1, max: 10, step: 0.1, def: 1 },
    { id: 'Rp', label: 'รัศมีดาวเคราะห์ (เท่าของโลก)', unit: '', min: 0.3, max: 3, step: 0.05, def: 1 },
    { id: 'h', label: 'ความสูงจากผิว', unit: 'km', min: 100, max: 40000, step: 50, def: 2000 },
    { id: 'f', label: 'ความเร็วต้น ÷ ความเร็ววงกลม', unit: '', min: 0.3, max: 1.6, step: 0.01, def: 1 }
  ],
  presets: [{ label: 'วงกลม', set: { f: 1 } }, { label: 'วงรี', set: { f: 1.2 } }, { label: 'ช้าไป ตกลงพื้น', set: { f: 0.6 } }, { label: 'หลุดพ้น', set: { f: 1.45 } }, { label: 'ค้างฟ้า (โลก)', set: { M: 1, Rp: 1, h: 35786, f: 1 } }],
  outs: [{ id: 'vc', name: 'ความเร็ววงโคจรวงกลม', unit: 'km/s' }, { id: 'v', name: 'ความเร็วที่ยิง', unit: 'km/s' }, { id: 've', name: 'ความเร็วหลุดพ้นที่ระดับนี้', unit: 'km/s' }, { id: 'Tc', name: 'คาบวงโคจร (ถ้าเป็นวงรี/วงกลม)', unit: 'ชั่วโมง' }, { id: 'kind', name: 'ชนิดวงโคจร', unit: '' }, { id: 'g', name: 'g ที่ระดับนี้', unit: 'm/s²' }],
  compute(p) {
    const GM = GM_E * p.M, R = RE * p.Rp, r = R + p.h * 1000, vc = Math.sqrt(GM / r), v = p.f * vc, E = v * v / 2 - GM / r;
    const a = E < 0 ? -GM / (2 * E) : Infinity, T = E < 0 ? 2 * Math.PI * Math.sqrt(a ** 3 / GM) : NaN, rp = E < 0 ? 2 * a - r : r;
    const kind = E >= 0 ? 'หลุดพ้น' : Math.abs(p.f - 1) < 0.005 ? 'วงกลม' : (p.f < 1 && rp < R) ? 'วงรีที่ชนดาวเคราะห์' : 'วงรี';
    return { vc: vc / 1000, v: v / 1000, ve: Math.sqrt(2) * vc / 1000, Tc: E < 0 ? T / 3600 : 'ไม่กลับมา', kind, g: GM / (r * r), _GM: GM, _R: R, _r: r, _v: v, _T: T, _a: a };
  },
  sim: {
    dt: 1 / 600,
    init(p, o) { const scale = isFinite(o._T) ? o._T / 8 : 2 * Math.PI * o._r / o._v; return { x: o._r, y: 0, vx: 0, vy: o._v, tr: [], hit: false, sc: scale }; },
    step(st, dt, p, o) {
      const h = dt * st.sc, sub = 20, hh = h / sub;
      for (let i = 0; i < sub; i++) { const r = Math.hypot(st.x, st.y), a = -o._GM / (r * r * r); st.vx += a * st.x * hh; st.vy += a * st.y * hh; st.x += st.vx * hh; st.y += st.vy * hh; if (r < o._R) { st.hit = true; st.done = true; break; } }
      st.tr.push([st.x, st.y]); if (st.tr.length > 2500) st.tr.shift();
      if (Math.hypot(st.x, st.y) > o._r * 6) st.done = true; if (st.t > 16) st.done = true;
    },
    view(p, o) { const R = isFinite(o._a) ? Math.max(o._r, 2 * o._a - o._r) * 1.15 : o._r * 3; return { x0: -R * 1.4, x1: R * 1.4, y0: -R, y1: R }; },
    draw(g, st, p, o) {
      g.circle(0, 0, o._R, { fill: '--c2', c: '--ink', w: 1.5 }); g.circle(0, 0, o._r, { c: '--line', dash: [4, 6], w: 1 });
      g.path(st.tr, { c: '--c1', w: 2 });
      g.circle(st.x, st.y, 5, { px: true, fill: '--c1', c: '--ink', w: 1.5 });
      const r = Math.hypot(st.x, st.y), k = 30 / o._v; g.vec(st.x, st.y, st.vx * k, st.vy * k, { px: true, c: '--c3', w: 2.5, label: fmt(Math.hypot(st.vx, st.vy) / 1000) + ' km/s' });
      g.vec(st.x, st.y, -st.x / r * 28, -st.y / r * 28, { px: true, c: '--c4', w: 2, label: 'F_G' });
      g.textPx(12, 22, st.hit ? 'ชนผิวดาวเคราะห์' : o.kind, { a: 'left', fs: 14, b: true });
      g.textPx(12, 42, 'เวลาจริงที่ผ่านไป ' + fmt(st.t * st.sc / 3600) + ' ชั่วโมง', { a: 'left', fs: 12, c: '--muted' });
    }
  },
  live: [{ name: 'ระยะจากศูนย์กลาง', unit: 'km', f: s => Math.hypot(s.x, s.y) / 1000 }, { name: 'อัตราเร็ว', unit: 'km/s', f: s => Math.hypot(s.vx, s.vy) / 1000 }],
  three: {
    cam(p, o) { const R = isFinite(o._a) ? Math.max(o._r, 2 * o._a - o._r) : o._r * 2; const s = 1e-6; return { pos: [0, R * s * 2.4, R * s * 1.1], target: [0, 0, 0] }; },
    build(T, p, o) { const s = 1e-6; const pl = T.sphere(o._R * s, '--c2'); pl.castShadow = false; const ring = []; for (let i = 0; i <= 96; i++) { const a = i / 96 * 2 * Math.PI; ring.push([o._r * s * Math.cos(a), 0, -o._r * s * Math.sin(a)]); } T.line('--line', { pts: ring, max: 97 }); const o3 = { r: o._R * s * 0.018, pad: o._R * s * 0.2 }; return { sat: T.sphere(o._R * s * 0.06, '--c1'), tr: T.trail('--c1', 3000), s, aV: T.vec('--c3', 'v', Object.assign({ kind: 'v' }, o3)), aF: T.vec('--c4', 'F_G', Object.assign({ ext: 0 }, o3)) }; },
    update(ob, st, p, o) {
      const P = [st.x * ob.s, 0, -st.y * ob.s]; ob.sat.position.set(...P); if (st.t === 0) ob.tr.clear(); ob.tr.push(P);
      const r = Math.hypot(st.x, st.y), v = Math.hypot(st.vx, st.vy), L = o._r * ob.s * 0.45;
      ob.aV.set(P, [st.vx / o._v * L, 0, -st.vy / o._v * L], 'v ' + fmt(v / 1000) + ' km/s');
      const fl = L * 0.35 * Math.min(3, (o._r / r) ** 2); ob.aF.set(P, [-st.x / r * fl, 0, st.y / r * fl], 'F_G');
    }
  },
  notes: ['ความเร็วพอดีกับ √(GM/r) ได้วงกลม มากกว่าได้วงรีที่จุดยิงเป็นจุดใกล้สุด น้อยกว่าได้วงรีที่จุดยิงเป็นจุดไกลสุด', 'ดาวเทียมเคลื่อนที่เร็วเมื่ออยู่ใกล้และช้าเมื่ออยู่ไกล (กฎข้อ 2 ของเคปเลอร์)', 'ความเร็ววงโคจรวงกลมไม่ขึ้นกับมวลดาวเทียม', 'ภาพเร่งเวลาให้ 1 รอบใช้ประมาณ 8 วินาที']
});

// ---------- 5 จานหมุน ----------
CASES.push({
  name: 'เหรียญบนจานหมุน', aspect: 16 / 9, title: 'เหรียญบนจานหมุนและแรงเสียดทานสถิต',
  desc: 'วางเหรียญบนจานหมุนที่ระยะต่างๆ จากแกน แรงเสียดทานสถิตเป็นแรงสู่ศูนย์กลาง ถ้าหมุนเร็วจนแรงที่ต้องการเกิน μₛmg เหรียญจะไถลออกในแนวเส้นสัมผัส',
  formula: 'แรงสู่ศูนย์กลาง = mω²r ≤ μₛmg &nbsp;|&nbsp; ไถลเมื่อ ω > √(μₛg/r) &nbsp;|&nbsp; ω = 2π × รอบต่อนาที / 60',
  params: [
    { id: 'rpm', label: 'อัตราการหมุน', unit: 'รอบ/นาที', min: 5, max: 120, step: 0.5, def: 45 },
    { id: 'r', label: 'ระยะเหรียญจากแกน', unit: 'cm', min: 1, max: 15, step: 0.1, def: 10 },
    { id: 'mu', label: 'μₛ', unit: '', min: 0.05, max: 1, step: 0.01, def: 0.3 }
  ],
  outs: [{ id: 'w', name: 'อัตราเร็วเชิงมุม', unit: 'rad/s' }, { id: 'need', name: 'ความเร่งสู่ศูนย์กลางที่ต้องการ', unit: 'm/s²' }, { id: 'have', name: 'ที่แรงเสียดทานให้ได้สูงสุด', unit: 'm/s²' }, { id: 'rpmMax', name: 'รอบสูงสุดที่ระยะนี้', unit: 'รอบ/นาที' }, { id: 'res', name: 'ผล', unit: '' }],
  compute(p) { const w = p.rpm * 2 * Math.PI / 60, r = p.r / 100, need = w * w * r, have = p.mu * 9.8; return { w, need, have, rpmMax: Math.sqrt(have / r) * 60 / (2 * Math.PI), res: need <= have ? 'เหรียญหมุนไปกับจาน' : 'เหรียญไถลออก', _slip: need > have }; },
  sim: {
    dt: 1 / 600,
    init(p) { return { ang: 0, x: p.r / 100, y: 0, vx: 0, vy: 0, slip: false, off: false }; },
    step(st, dt, p, o) {
      const w = o.w; st.ang += w * dt;
      if (!st.slip) { const r = p.r / 100; st.x = r * Math.cos(st.ang); st.y = r * Math.sin(st.ang); if (o._slip && st.t > 0.6) { st.slip = true; st.vx = -w * st.y; st.vy = w * st.x; } }
      else { const rr = Math.hypot(st.x, st.y); if (rr < 0.17) { const rvx = st.vx + w * st.y, rvy = st.vy - w * st.x, rv = Math.hypot(rvx, rvy) || 1; st.vx -= p.mu * 0.8 * 9.8 * rvx / rv * dt; st.vy -= p.mu * 0.8 * 9.8 * rvy / rv * dt; } st.x += st.vx * dt; st.y += st.vy * dt; if (rr > 0.3) st.done = true; }
      if (st.t > 10) st.done = true;
    },
    view() { return { x0: -0.32, x1: 0.32, y0: -0.19, y1: 0.19 }; },
    draw(g, st, p, o) {
      g.circle(0, 0, 0.17, { fill: '--block', c: '--ink', w: 2 });
      for (let k = 0; k < 8; k++) { const a = st.ang + k * Math.PI / 4; g.line(0, 0, 0.17 * Math.cos(a), 0.17 * Math.sin(a), { c: '--line', w: 1 }); }
      g.circle(0, 0, p.r / 100, { c: '--muted', dash: [3, 4], w: 1 });
      g.circle(st.x, st.y, 0.012, { fill: '--c5', c: '--ink' });
      if (!st.slip) { const r = Math.hypot(st.x, st.y); g.vec(st.x, st.y, -st.x / r * 36, -st.y / r * 36, { px: true, c: '--c3', w: 2.5, label: 'fₛ' }); g.vec(st.x, st.y, -st.y / r * 40, st.x / r * 40, { px: true, c: '--c2', w: 2, label: 'v' }); }
      g.textPx(12, 22, st.slip ? 'แรงเสียดทานไม่พอ เหรียญไถลออกตามแนวเส้นสัมผัส' : 'แรงเสียดทานสถิตเป็นแรงสู่ศูนย์กลาง', { a: 'left', fs: 13, b: true, c: st.slip ? '--bad' : '--ink' });
    }
  },
  handles(p) { return [{ id: 'r', x: p.r / 100, y: 0, set: (x, y) => ({ r: clamp(Math.hypot(x, y) * 100, 1, 15) }) }]; },
  three: {
    cam() { return { pos: [0, 0.35, 0.45], target: [0, 0, 0] }; },
    build(T) { const d = T.cyl(0.17, 0.17, 0.012, '--block', { receive: true }); d.position.y = -0.006; const sp = T.box(0.17, 0.002, 0.01, '--c4'); sp.position.y = 0.001; const c = T.cyl(0.012, 0.012, 0.004, '--c5'), o3 = { r: 0.0035, pad: 0.018 }; return { d, sp, c, aF: T.vec('--c3', 'fₛ', o3), aV: T.vec('--c2', 'v', Object.assign({ kind: 'v' }, o3)) }; },
    update(ob, st, p, o) {
      const P = [st.x, 0.012, -st.y], r = Math.hypot(st.x, st.y) || 1;
      if (!st.slip) { ob.aF.set(P, [-st.x / r * 0.07, 0, st.y / r * 0.07], 'fₛ = mω²r'); ob.aV.set(P, [-st.y / r * 0.08, 0, -st.x / r * 0.08], 'v'); }
      else { ob.aF.hide(); const vv = Math.hypot(st.vx, st.vy) || 1; ob.aV.set(P, [st.vx / vv * 0.08, 0, -st.vy / vv * 0.08], 'v'); } ob.d.rotation.y = -st.ang; ob.sp.rotation.y = -st.ang; ob.sp.position.set(0.085 * Math.cos(st.ang), 0.001, -0.085 * Math.sin(st.ang)); ob.c.position.set(st.x, 0.004, -st.y); }
  },
  notes: ['ระยะจากแกนมากขึ้น ต้องการแรงสู่ศูนย์กลางมากขึ้น (mω²r) จึงไถลง่ายกว่า', 'เหรียญที่ไถลออกไปในแนวเส้นสัมผัส ไม่ได้พุ่งออกตามแนวรัศมี', 'ลากเหรียญเพื่อเปลี่ยนระยะจากแกน']
});

Lab.add('circ', CASES);
})();
