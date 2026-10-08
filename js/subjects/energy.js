/* บทที่ 5 งาน พลังงาน และเครื่องกล */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
const sgn = x => x > 0 ? 1 : x < 0 ? -1 : 0;
const ebars = (g, st, items, max) => { const x0 = g.W - 24 - items.length * 34; g.barsPx(x0, 120, items, { max, h: 90, bw: 24, gap: 10, values: it => fmt(it.v) }); g.textPx(x0 - 6, 24, 'พลังงาน (J)', { a: 'left', fs: 11, c: '--muted' }); };

// ---------- 1 รางเลื่อน ----------
CASES.push({
  name: 'รางเลื่อนแก้ไขได้', aspect: 2, title: 'การอนุรักษ์พลังงานบนรางเลื่อน',
  desc: 'ลากจุดควบคุมเพื่อปั้นรางเอง เพิ่มหรือลบจุดได้ ลูกบอลวิ่งตามรางโดยไม่หลุด ดูแท่งพลังงานจลน์ ศักย์ และความร้อนจากแรงเสียดทานเปลี่ยนไปตลอดทาง',
  formula: 'E<sub>k</sub> + E<sub>p</sub> + Q = ค่าคงที่ &nbsp;|&nbsp; E<sub>k</sub> = ½mv² &nbsp;|&nbsp; E<sub>p</sub> = mgh &nbsp;|&nbsp; Q = งานของแรงเสียดทาน = ∫μN ds',
  params: [
    { id: 'm', label: 'มวลลูกบอล', unit: 'kg', min: 0.1, max: 20, step: 0.1, def: 2 },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 },
    { id: 'mu', label: 'สัมประสิทธิ์แรงเสียดทาน (μ)', unit: '', min: 0, max: 0.5, step: 0.005, def: 0 },
    { id: 'v0', label: 'ความเร็วต้นตามราง', unit: 'm/s', min: -15, max: 15, step: 0.1, def: 0 },
    { id: 's0', label: 'จุดปล่อย (สัดส่วนความยาวราง)', unit: '', min: 0, max: 1, step: 0.005, def: 0.01 },
    { id: 'pts', type: 'list', label: 'จุดควบคุมราง', item: 'จุด', min: 3, max: 10, fields: [{ id: 'x', label: 'x', unit: 'm', min: -5, max: 40, step: 0.1 }, { id: 'y', label: 'ความสูง y', unit: 'm', min: 0, max: 20, step: 0.1 }],
      def: [{ x: 0, y: 8 }, { x: 4, y: 1 }, { x: 8, y: 5.5 }, { x: 11.5, y: 2 }, { x: 15, y: 4 }, { x: 18.5, y: 0.6 }, { x: 21, y: 3 }],
      add: p => { const l = p.pts[p.pts.length - 1]; return { x: +(l.x + 3).toFixed(1), y: l.y }; } }
  ],
  presets: [
    { label: 'ไร้แรงเสียดทาน', set: { mu: 0 } }, { label: 'มีแรงเสียดทาน 0.05', set: { mu: 0.05 } },
    { label: 'ราง U', set: { pts: [{ x: 0, y: 6 }, { x: 3, y: 1.2 }, { x: 6, y: 0.5 }, { x: 9, y: 1.2 }, { x: 12, y: 6 }], s0: 0.01, v0: 0 } },
    { label: 'ขึ้นเนินไม่พ้น', set: { pts: [{ x: 0, y: 4 }, { x: 4, y: 0.5 }, { x: 8, y: 6 }, { x: 11, y: 1 }], s0: 0.01, v0: 0, mu: 0 } }
  ],
  outs: [{ id: 'E', name: 'พลังงานกลเริ่มต้น', unit: 'J' }, { id: 'hmax', name: 'ความสูงสูงสุดที่ขึ้นได้ (ไม่มีแรงเสียดทาน)', unit: 'm' }, { id: 'vlow', name: 'อัตราเร็วที่จุดต่ำสุด (ไม่มีแรงเสียดทาน)', unit: 'm/s' }, { id: 'L', name: 'ความยาวราง', unit: 'm' }],
  compute(p) {
    const T = K.track(p.pts), a = T.at(p.s0 * T.L), E = 0.5 * p.m * p.v0 * p.v0 + p.m * p.g * a.y, ymin = Math.min(...T.pts.map(q => q[1]));
    return { E, hmax: E / (p.m * p.g), vlow: Math.sqrt(Math.max(0, 2 * (E / p.m - p.g * ymin))), L: T.L, _T: T };
  },
  sim: {
    dt: 1 / 1000,
    init(p, o) { const s = p.s0 * o._T.L; return { s, v: p.v0, Q: 0, a0: o._T.at(s), end: '' }; },
    step(st, dt, p, o) {
      const T = o._T, q = T.at(st.s), Nm = Math.abs(p.g * Math.cos(q.ang) + q.k * st.v * st.v), fr = p.mu * Nm;
      let a = -p.g * Math.sin(q.ang);
      if (Math.abs(st.v) < 1e-4) { if (Math.abs(a) <= fr) { st.v = 0; if (st.t > 0.3) { st.done = true; st.end = 'หยุดนิ่งด้วยแรงเสียดทาน'; } return; } a -= sgn(a) * fr; }
      else a -= sgn(st.v) * fr;
      const v1 = st.v + a * dt; if (st.v !== 0 && sgn(v1) !== sgn(st.v) && p.mu > 0) { st.v = 0; return; }
      st.Q += p.m * fr * Math.abs(st.v) * dt; st.s += st.v * dt + 0.5 * a * dt * dt; st.v = v1;
      if (st.s <= 0) { st.s = 0; st.done = true; st.end = 'ถึงปลายรางด้านซ้าย'; } if (st.s >= T.L) { st.s = T.L; st.done = true; st.end = 'ถึงปลายรางด้านขวา'; }
      if (st.t > 60) st.done = true;
    },
    view(p, o) { const P = o._T.pts, xs = P.map(q => q[0]), ys = P.map(q => q[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y1 = Math.max(...ys); return { x0: x0 - 1, x1: x1 + 1, y0: -0.6, y1: Math.max(y1, o.hmax) + 1.4 }; },
    draw(g, st, p, o) {
      const T = o._T, v = g.visible(); g.ground(v.x0, v.x1, 0);
      for (let s = 0; s <= T.L; s += Math.max(0.6, T.L / 40)) { const q = T.at(s); if (q.y > 0.05) g.line(q.x, 0, q.x, q.y, { c: '--line', w: 2 }); }
      g.line(v.x0, o.hmax, v.x1, o.hmax, { c: '--muted', dash: [5, 5], w: 1 }); g.text(v.x0 + 0.1, o.hmax + 0.15, 'ระดับพลังงานเริ่มต้น (ไม่มีแรงเสียดทานจะไม่ขึ้นเกินเส้นนี้)', { a: 'left', fs: 10, c: '--muted' });
      g.path(T.pts, { c: '--ink', w: 5 }); g.path(T.pts, { c: '--block2', w: 2.5 });
      const q = T.at(st.s), r = 0.32, bx = q.x - Math.sin(q.ang) * r, by = q.y + Math.cos(q.ang) * r;
      K.ball(g, bx, by, r);
      if (Math.abs(st.v) > 0.05) g.vec(bx, by, Math.cos(q.ang) * st.v * 8, Math.sin(q.ang) * st.v * 8, { px: true, c: '--c1', w: 3, label: fmt(Math.abs(st.v)) + ' m/s' });
      const KE = 0.5 * p.m * st.v * st.v, PE = p.m * p.g * q.y;
      ebars(g, st, [{ label: 'Eₖ', v: KE, c: '--c1' }, { label: 'Eₚ', v: PE, c: '--c2' }, { label: 'Q', v: st.Q, c: '--c5' }, { label: 'รวม', v: KE + PE + st.Q, c: '--muted' }], Math.max(1e-9, o.E));
      if (st.end) g.textPx(12, 22, st.end, { a: 'left', fs: 13, b: true });
    }
  },
  handles(p, o, st) { const T = o._T, h = p.pts.map((c, i) => ({ id: 'p' + i, x: c.x, y: c.y, set: (x, y) => ({ ['pts.' + i + '.x']: x, ['pts.' + i + '.y']: clamp(y, 0, 20) }) })); const a = T.at(p.s0 * T.L); h.push({ id: 's0', x: a.x, y: a.y + 0.75, set: (x, y) => ({ s0: clamp(T.nearest(x, y - 0.75) / T.L, 0, 1) }) }); return h; },
  plot: { overlay: true, yLabel: 'พลังงาน (J)', series: [{ label: 'Eₖ', unit: 'J', c: '--c1', f: (s, p) => 0.5 * p.m * s.v * s.v }, { label: 'Eₚ', unit: 'J', c: '--c2', f: (s, p, o) => p.m * p.g * o._T.at(s.s).y }, { label: 'Q', unit: 'J', c: '--c5', f: s => s.Q }, { label: 'รวม', unit: 'J', c: '--muted', f: (s, p, o) => 0.5 * p.m * s.v * s.v + p.m * p.g * o._T.at(s.s).y + s.Q }] },
  live: [{ name: 'v', unit: 'm/s', f: s => s.v }, { name: 'h', unit: 'm', f: (s, p, o) => o._T.at(s.s).y }, { name: 'Q', unit: 'J', f: s => s.Q }],
  three: {
    cam(p, o) { const P = o._T.pts, xs = P.map(q => q[0]); const c = (Math.min(...xs) + Math.max(...xs)) / 2, w = Math.max(...xs) - Math.min(...xs); return { pos: [c - w * 0.25, w * 0.35, w * 0.75], target: [c, 2, 0] }; },
    build(T, p, o) {
      const tr = o._T, xs = tr.pts.map(q => q[0]); T.floor(Math.max(30, (Math.max(...xs) - Math.min(...xs)) * 1.6), { step: 1 }).position.x = (Math.min(...xs) + Math.max(...xs)) / 2;
      const P3 = tr.pts.filter((_, i) => i % 3 === 0).map(q => [q[0], q[1], 0]); P3.push([tr.pts[tr.pts.length - 1][0], tr.pts[tr.pts.length - 1][1], 0]);
      [-0.35, 0.35].forEach(z => T.tube(P3.map(q => [q[0], q[1], z]), 0.06, '--ink'));
      for (let s = 0; s <= tr.L; s += 1.2) { const q = tr.at(s); if (q.y > 0.1) { const c = T.cyl(0.06, 0.06, q.y, '--muted'); c.position.set(q.x, q.y / 2, 0); } }
      const o3 = { r: 0.05, pad: 0.3 };
      return { ball: T.sphere(0.3, '--c1'), aW: T.vec('--c1', 'mg', o3), aN: T.vec('--c2', 'N', o3), aF: T.vec('--c3', 'f', o3), aV: T.vec('--c6', 'v', Object.assign({ kind: 'v' }, o3)) };
    },
    update(ob, st, p, o) {
      const q = o._T.at(st.s), c = Math.cos(q.ang), s = Math.sin(q.ang), P = [q.x - s * 0.36, q.y + c * 0.36, 0]; ob.ball.position.set(...P);
      const W = p.m * p.g, k = 1.6 / W, N = p.m * (p.g * c + q.k * st.v * st.v), fr = p.mu * Math.abs(N), Pf = [P[0], P[1], 0.4];
      ob.aW.set(Pf, [0, -W * k, 0], 'mg ' + fmt(W) + ' N'); ob.aN.set(Pf, [-s * N * k, c * N * k, 0], 'N ' + fmt(N) + ' N');
      if (p.mu > 0 && Math.abs(st.v) > 0.02) ob.aF.set(Pf, [-sgn(st.v) * c * fr * k, -sgn(st.v) * s * fr * k, 0], 'f ' + fmt(fr) + ' N'); else ob.aF.hide();
      if (Math.abs(st.v) > 0.05) ob.aV.set([P[0], P[1], -0.4], [c * st.v * 0.25, s * st.v * 0.25, 0], 'v ' + fmt(Math.abs(st.v)) + ' m/s'); else ob.aV.hide();
    }
  },
  notes: ['ไม่มีแรงเสียดทาน ลูกบอลขึ้นได้สูงสุดเท่าระดับพลังงานเริ่มต้น (เส้นประ) ไม่ว่ารางจะคดเคี้ยวอย่างไร', 'อัตราเร็วที่ตำแหน่งใดขึ้นกับความสูงของตำแหน่งนั้นเท่านั้น v = √(2g(h₀ − h)) ไม่ขึ้นกับมวล', 'มีแรงเสียดทาน พลังงานกลค่อยๆ กลายเป็นความร้อน แต่พลังงานรวมยังคงที่', 'ลากจุดวงกลมเพื่อปั้นราง ลากจุดเหนือลูกบอลเพื่อเลือกจุดปล่อย']
});

// ---------- 2 สปริงยิงวัตถุ ----------
function launcher(p) {
  const g = 9.8, mu = p.mu, th = p.th * RAD;
  if (p.k * p.x <= mu * p.m * g) return { v1: 0, v2: 0, up: 0, h: 0, stuck: true };
  const v1s = (p.k * p.x * p.x - 2 * mu * p.m * g * p.x) / p.m, v1 = Math.sqrt(Math.max(0, v1s));
  const v2s = v1s - 2 * mu * g * p.d, v2 = Math.sqrt(Math.max(0, v2s));
  const up = v2s > 0 ? Math.min(p.Li, v2s / (2 * g * (Math.sin(th) + mu * Math.cos(th)))) : 0;
  return { v1, v2, up, h: up * Math.sin(th), stopFlat: v2s <= 0 ? (v1s / (2 * mu * g)) : null, back: up > 0 && Math.tan(th) > mu };
}
const pathPos = (p, s) => { const th = p.th * RAD; if (s <= p.d) return { x: s, y: 0, ang: 0 }; const u = s - p.d; return { x: p.d + u * Math.cos(th), y: u * Math.sin(th), ang: th }; };
CASES.push({
  name: 'สปริงยิงวัตถุ', aspect: 2.2, title: 'สปริงดันวัตถุผ่านพื้นราบขึ้นพื้นเอียง',
  desc: 'อัดสปริงแล้วปล่อย วัตถุไถลผ่านพื้นราบที่มีแรงเสียดทานแล้วขึ้นพื้นเอียง ดูพลังงานศักย์ยืดหยุ่นเปลี่ยนเป็นพลังงานจลน์ ศักย์โน้มถ่วง และความร้อน',
  formula: '½kx² = ½mv² + mgh + Q &nbsp;|&nbsp; Q = μmg·(ระยะบนพื้นราบ) + μmg cos θ·(ระยะบนพื้นเอียง)',
  params: [
    { id: 'k', label: 'ค่าคงที่สปริง (k)', unit: 'N/m', min: 50, max: 5000, step: 10, def: 500 },
    { id: 'x', label: 'ระยะอัดสปริง (x)', unit: 'm', min: 0.02, max: 0.8, step: 0.01, def: 0.3 },
    { id: 'm', label: 'มวลวัตถุ', unit: 'kg', min: 0.1, max: 10, step: 0.1, def: 1 },
    { id: 'mu', label: 'μ (พื้นราบและพื้นเอียง)', unit: '', min: 0, max: 0.8, step: 0.01, def: 0.1 },
    { id: 'd', label: 'ความยาวพื้นราบ', unit: 'm', min: 0.2, max: 6, step: 0.1, def: 2 },
    { id: 'th', label: 'มุมพื้นเอียง', unit: '°', min: 5, max: 70, step: 1, def: 30 },
    { id: 'Li', label: 'ความยาวพื้นเอียง', unit: 'm', min: 1, max: 8, step: 0.1, def: 4 }
  ],
  outs: [{ id: 'Us', name: 'พลังงานในสปริง ½kx²', unit: 'J' }, { id: 'v1', name: 'อัตราเร็วเมื่อพ้นสปริง', unit: 'm/s' }, { id: 'v2', name: 'อัตราเร็วที่ตีนพื้นเอียง', unit: 'm/s' }, { id: 'up', name: 'ระยะที่ขึ้นพื้นเอียงได้', unit: 'm' }, { id: 'h', name: 'ความสูงสูงสุด', unit: 'm' }],
  compute(p) { const r = launcher(p); return { Us: 0.5 * p.k * p.x * p.x, v1: r.v1, v2: r.v2, up: r.up, h: r.h, _r: r }; },
  check(p, o) { const r = o._r, w = []; if (r.stuck) w.push('แรงสปริง kx ไม่ชนะแรงเสียดทานสถิต วัตถุไม่ขยับ'); else if (r.stopFlat != null) w.push('วัตถุหยุดบนพื้นราบก่อนถึงพื้นเอียง'); if (o.up >= p.Li - 1e-9) w.push('วัตถุพุ่งพ้นยอดพื้นเอียง (แบบจำลองหยุดที่ยอด)'); if (r.back) w.push('tan θ > μ วัตถุจะไถลกลับลงมา'); return w; },
  sim: {
    dt: 1 / 2000,
    init(p) { return { s: -p.x, v: 0, Q: 0, maxS: -p.x }; },
    step(st, dt, p) {
      const g = 9.8, q = pathPos(p, Math.max(0, st.s)), th = q.ang;
      let F = (st.s < 0 ? -p.k * st.s : 0) / p.m - g * Math.sin(th);
      const fr = p.mu * g * Math.cos(th);
      if (Math.abs(st.v) < 1e-5) { if (Math.abs(F) <= fr) { st.v = 0; if (st.t > 0.2) st.done = true; return; } F -= sgn(F) * fr; } else F -= sgn(st.v) * fr;
      const v1 = st.v + F * dt; if (st.v !== 0 && sgn(v1) !== sgn(st.v)) { st.v = 0; return; }
      st.Q += p.m * fr * Math.abs(st.v) * dt; st.s += st.v * dt; st.v = v1;
      if (st.s >= p.d + p.Li) { st.s = p.d + p.Li; st.done = true; } if (st.t > 30) st.done = true;
    },
    view(p) { const th = p.th * RAD; return { x0: -1.4, x1: p.d + p.Li * Math.cos(th) + 0.5, y0: -0.5, y1: Math.max(1.6, p.Li * Math.sin(th) + 0.8) }; },
    draw(g, st, p) {
      const th = p.th * RAD, Xe = p.d + p.Li * Math.cos(th), Ye = p.Li * Math.sin(th), v = g.visible();
      g.ground(v.x0, v.x1, 0); g.path([[p.d, 0], [Xe, 0], [Xe, Ye]], { close: true, fill: '--block2', c: '--ink', w: 2 });
      g.wall(-1.2, 0, 0.8, -1);
      const bw = 0.3, bh = 0.24, q = pathPos(p, Math.max(0, st.s)), sL = Math.min(st.s, 0);
      g.spring(-1.2, bh / 2, sL, bh / 2, { n: 12, amp: 9 });
      const cx = (st.s < 0 ? st.s : q.x) + Math.cos(q.ang) * bw / 2 - Math.sin(q.ang) * bh / 2, cy = (st.s < 0 ? 0 : q.y) + Math.sin(q.ang) * bw / 2 + Math.cos(q.ang) * bh / 2;
      g.box(cx, cy, bw, bh, q.ang, { fill: '--c2' });
      g.line(0, -0.15, 0, 0.6, { c: '--muted', dash: [3, 4], w: 1 }); g.text(0, 0.68, 'ปลายสปริงอิสระ', { fs: 10, c: '--muted' });
      const KE = 0.5 * p.m * st.v * st.v, Us = st.s < 0 ? 0.5 * p.k * st.s * st.s : 0, Ug = p.m * 9.8 * (st.s > p.d ? q.y : 0);
      ebars(g, st, [{ label: 'สปริง', v: Us, c: '--c4' }, { label: 'Eₖ', v: KE, c: '--c1' }, { label: 'Eₚ', v: Ug, c: '--c2' }, { label: 'Q', v: st.Q, c: '--c5' }], 0.5 * p.k * p.x * p.x);
    }
  },
  handles(p) { return [{ id: 'x', x: -p.x + 0.15, y: 0.12, set: x => ({ x: clamp(-(x - 0.15), 0.02, 0.8) }) }]; },
  plot: { overlay: true, yLabel: 'พลังงาน (J)', series: [{ label: 'สปริง', unit: 'J', c: '--c4', f: (s, p) => s.s < 0 ? 0.5 * p.k * s.s * s.s : 0 }, { label: 'Eₖ', unit: 'J', c: '--c1', f: (s, p) => 0.5 * p.m * s.v * s.v }, { label: 'Eₚ', unit: 'J', c: '--c2', f: (s, p) => s.s > p.d ? p.m * 9.8 * pathPos(p, s.s).y : 0 }, { label: 'Q', unit: 'J', c: '--c5', f: s => s.Q }] },
  live: [{ name: 'v', unit: 'm/s', f: s => s.v }, { name: 'Q', unit: 'J', f: s => s.Q }],
  three: {
    cam(p) { const th = p.th * RAD, Xe = p.d + p.Li * Math.cos(th); return { pos: [(Xe - 1.2) / 2 - 0.5, 1.2 + p.Li * Math.sin(th) * 0.35, Xe * 0.5 + 1.6], target: [(Xe - 1.2) / 2, 0.5, 0] }; },
    build(T, p) {
      const th = p.th * RAD, Xe = p.d + p.Li * Math.cos(th), Ye = p.Li * Math.sin(th);
      T.floor(Math.max(10, Xe * 2.4), { step: 0.5 }).position.x = Xe / 2; T.extrude([[p.d, 0], [Xe, 0], [Xe, Ye]], 0.8, '--block2', { receive: true });
      const wall = T.box(0.1, 0.8, 0.8, '--ground'); wall.position.set(-1.25, 0.4, 0);
      const o3 = { r: 0.012, pad: 0.08 };
      return { blk: T.box(0.3, 0.24, 0.3, '--c2'), spr: T.spring('--spring', { coils: 12, r: 0.07 }), aV: T.vec('--c1', 'v', Object.assign({ kind: 'v' }, o3)), aS: T.vec('--c4', 'kx', o3), aW: T.vec('--c5', 'mg', o3), aF: T.vec('--c3', 'f', o3), aN: T.vec('--c2', 'N', o3) };
    },
    update(ob, st, p) {
      const bw = 0.3, bh = 0.24, q = pathPos(p, Math.max(0, st.s)), c = Math.cos(q.ang), s = Math.sin(q.ang);
      const cx = (st.s < 0 ? st.s : q.x) + c * bw / 2 - s * bh / 2, cy = (st.s < 0 ? 0 : q.y) + s * bw / 2 + c * bh / 2;
      K.place3d(ob.blk, cx, cy, q.ang); ob.spr.set2([-1.2, bh / 2, 0], [Math.min(st.s, 0), bh / 2, 0]);
      const W = p.m * 9.8, Fs = st.s < 0 ? -p.k * st.s : 0, N = W * c, fr = p.mu * N, k = 0.7 / Math.max(W, p.k * p.x), P = [cx, cy, 0.17];
      ob.aW.set(P, [0, -W * k, 0], 'mg'); ob.aN.set(P, [-s * N * k, c * N * k, 0], 'N');
      Fs > 0 ? ob.aS.set(P, [Fs * k, 0, 0], 'kx ' + fmt(Fs) + ' N') : ob.aS.hide();
      (Math.abs(st.v) > 1e-3 && fr > 0) ? ob.aF.set([cx, cy - bh / 2 * c, 0.17], [-sgn(st.v) * c * fr * k, -sgn(st.v) * s * fr * k, 0], 'f') : ob.aF.hide();
      Math.abs(st.v) > 1e-3 ? ob.aV.set([cx, cy + 0.2, -0.17], [c * st.v * 0.12, s * st.v * 0.12, 0], 'v ' + fmt(Math.abs(st.v)) + ' m/s') : ob.aV.hide();
    }
  },
  notes: ['อัดสปริงเพิ่มเป็น 2 เท่า พลังงานในสปริงเพิ่มเป็น 4 เท่า', 'ลากกล่องไปทางซ้ายเพื่อเปลี่ยนระยะอัดสปริง', 'แรงเสียดทานบนพื้นเอียงน้อยกว่าบนพื้นราบเพราะ N = mg cos θ']
});

// ---------- 3 งานจากกราฟ F-x ----------
const Fat = (pts, x) => { const P = pts.slice().sort((a, b) => a.x - b.x); if (x < P[0].x || x > P[P.length - 1].x) return 0; for (let i = 0; i < P.length - 1; i++) if (x >= P[i].x && x <= P[i + 1].x) { const f = (x - P[i].x) / Math.max(1e-9, P[i + 1].x - P[i].x); return P[i].F + (P[i + 1].F - P[i].F) * f; } return P[P.length - 1].F; };
const Wto = (pts, x) => { let W = 0; const n = 400; const P = pts.slice().sort((a, b) => a.x - b.x), a = 0; for (let i = 0; i < n; i++) { const x1 = a + (x - a) * i / n, x2 = a + (x - a) * (i + 1) / n; W += 0.5 * (Fat(P, x1) + Fat(P, x2)) * (x2 - x1); } return W; };
CASES.push({
  name: 'งานจากกราฟ F-x', aspect: 16 / 9, title: 'งาน = พื้นที่ใต้กราฟแรงกับระยะทาง',
  desc: 'ลากจุดบนกราฟ F-x เพื่อกำหนดแรงที่เปลี่ยนตามตำแหน่ง วัตถุบนพื้นลื่นเคลื่อนที่ตามแรงนั้น พื้นที่ที่ระบายคืองานที่ทำได้ถึงตำแหน่งปัจจุบัน ซึ่งเท่ากับพลังงานจลน์ที่เปลี่ยนไป',
  formula: 'W = ∫F dx = พื้นที่ใต้กราฟ F-x &nbsp;|&nbsp; W<sub>รวม</sub> = ΔE<sub>k</sub> = ½mv² − ½mu² &nbsp;|&nbsp; กำลัง P = Fv',
  params: [
    { id: 'm', label: 'มวลวัตถุ', unit: 'kg', min: 0.2, max: 20, step: 0.1, def: 2 },
    { id: 'v0', label: 'ความเร็วต้น', unit: 'm/s', min: 0, max: 20, step: 0.1, def: 0 },
    { id: 'pts', type: 'list', label: 'จุดบนกราฟ F-x', item: 'จุด', min: 2, max: 10, fields: [{ id: 'x', label: 'x', unit: 'm', min: 0, max: 20, step: 0.1 }, { id: 'F', label: 'F', unit: 'N', min: -50, max: 50, step: 0.5 }], def: [{ x: 0, F: 8 }, { x: 2, F: 20 }, { x: 6, F: 20 }, { x: 8, F: -10 }, { x: 10, F: -10 }], add: p => { const l = p.pts[p.pts.length - 1]; return { x: Math.min(20, l.x + 2), F: 0 }; } }
  ],
  presets: [{ label: 'แรงคงที่', set: { pts: [{ x: 0, F: 10 }, { x: 8, F: 10 }] } }, { label: 'แรงสปริง (F = −kx เลื่อน)', set: { v0: 6, pts: [{ x: 0, F: 0 }, { x: 10, F: -40 }] } }, { label: 'เพิ่มขึ้นเชิงเส้น', set: { v0: 0, pts: [{ x: 0, F: 0 }, { x: 10, F: 30 }] } }],
  outs: [{ id: 'W', name: 'งานรวม (พื้นที่ทั้งหมด)', unit: 'J' }, { id: 'KE', name: 'Eₖ ปลายช่วงแรง', unit: 'J' }, { id: 'vf', name: 'อัตราเร็วปลายช่วงแรง', unit: 'm/s' }],
  compute(p) { const xe = Math.max(...p.pts.map(q => q.x)), W = Wto(p.pts, xe), KE = 0.5 * p.m * p.v0 * p.v0 + W; return { W, KE: KE >= 0 ? KE : 'หยุดก่อนถึงปลาย', vf: KE >= 0 ? Math.sqrt(2 * KE / p.m) : 0, _xe: xe }; },
  sim: {
    dt: 1 / 1000,
    init(p) { return { x: 0, v: p.v0, W: 0 }; },
    step(st, dt, p, o) { const F = Fat(p.pts, st.x), a = F / p.m; st.W += F * st.v * dt; st.x += st.v * dt + 0.5 * a * dt * dt; st.v += a * dt; if (st.x > o._xe + 3 || st.x < -0.5 || st.t > 30) st.done = true; if (Math.abs(st.v) < 1e-3 && Math.abs(F) < 1e-6 && st.t > 0.5) st.done = true; },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 4 }; },
    draw(g, st, p, o) {
      const xmax = o._xe + 3, X = x => 1.2 + x / xmax * 14.2, Fm = Math.max(10, ...p.pts.map(q => Math.abs(q.F))), Y = F => 6 + F / Fm * 2.4;
      g.rect(1.2, 3.4, 14.2, 5.2, { fill: '--bg', c: '--line' }); g.line(1.2, 6, 15.4, 6, { c: '--muted' });
      for (let x = 0; x <= xmax; x += K.niceStep(xmax / 8)) { g.line(X(x), 3.4, X(x), 8.6, { c: '--grid', w: 1 }); g.text(X(x), 3.05, String(+x.toFixed(2)), { fs: 10, c: '--muted' }); }
      [Fm, Fm / 2, -Fm / 2, -Fm].forEach(F => g.text(1.05, Y(F), fmt(F), { a: 'right', fs: 10, c: '--muted', base: 'middle' }));
      g.text(1.05, 8.75, 'F (N)', { a: 'right', fs: 11, b: true }); g.text(15.4, 3.05, 'x (m)', { a: 'right', fs: 11, b: true, dy: 12 });
      // พื้นที่ถึงตำแหน่งปัจจุบัน
      const xn = clamp(st.x, 0, xmax), N = 160;
      for (let i = 0; i < N; i++) { const a = xn * i / N, b = xn * (i + 1) / N, Fa = Fat(p.pts, a), Fb = Fat(p.pts, b); g.path([[X(a), Y(0)], [X(a), Y(Fa)], [X(b), Y(Fb)], [X(b), Y(0)]], { close: true, fill: (Fa + Fb) >= 0 ? '--good' : '--bad', c: 'none', alpha: 0.3 }); }
      const S = p.pts.slice().sort((a, b) => a.x - b.x); g.path(S.map(q => [X(q.x), Y(q.F)]), { c: '--c2', w: 2.5 });
      g.line(X(xn), 3.4, X(xn), 8.6, { c: '--c1', w: 1.5, dash: [4, 4] });
      // ราง
      g.line(1.2, 1.2, 15.4, 1.2, { c: '--ink', w: 2 });
      const bx = X(clamp(st.x, -0.3, xmax)); g.box(bx, 1.55, 0.7, 0.7, 0, { fill: '--c2', label: p.m + ' kg', fs: 10 });
      const F = Fat(p.pts, st.x); if (Math.abs(F) > 1e-6) g.vec(bx, 1.55, F / Fm * 70, 0, { px: true, c: '--c4', w: 3, label: 'F ' + fmt(F) + ' N' });
      g.textPx(12, 20, `งานถึงตอนนี้ W = ${fmt(Wto(p.pts, clamp(st.x, 0, xmax)))} J    Eₖ = ${fmt(0.5 * p.m * st.v * st.v)} J    v = ${fmt(st.v)} m/s`, { a: 'left', fs: 13, b: true });
    }
  },
  handles(p, o) { const xmax = o._xe + 3, Fm = Math.max(10, ...p.pts.map(q => Math.abs(q.F))), X = x => 1.2 + x / xmax * 14.2, Y = F => 6 + F / Fm * 2.4; return p.pts.map((q, i) => ({ id: 'q' + i, x: X(q.x), y: Y(q.F), set: (x, y) => ({ ['pts.' + i + '.x']: clamp((x - 1.2) / 14.2 * xmax, 0, 20), ['pts.' + i + '.F']: clamp((y - 6) / 2.4 * Fm, -50, 50) }) })); },
  plot: { series: [{ label: 'v', unit: 'm/s', c: '--c1', f: s => s.v }, { label: 'กำลัง P = Fv', unit: 'W', c: '--c4', f: (s, p) => Fat(p.pts, s.x) * s.v }] },
  notes: ['พื้นที่เหนือแกน x เป็นงานบวก (วัตถุได้พลังงาน) ใต้แกนเป็นงานลบ (เสียพลังงาน)', 'พลังงานจลน์ ณ ตำแหน่งใดเท่ากับ Eₖ เริ่มต้นบวกพื้นที่ใต้กราฟถึงตำแหน่งนั้น', 'ถ้างานลบมากกว่าพลังงานที่มี วัตถุจะหยุดแล้วเคลื่อนกลับ', 'ลากจุดบนกราฟเพื่อเปลี่ยนรูปแรง']
});

// ---------- 4 เครื่องกลอย่างง่าย ----------
CASES.push({
  name: 'เครื่องกลอย่างง่าย', aspect: 16 / 9, title: 'รอกพวงและคานดีดคานงัด',
  desc: 'เลือกรอกพวงที่มีจำนวนเส้นเชือกรับน้ำหนักต่างๆ หรือคานสามแบบ ปรับประสิทธิภาพ ดูแรงพยายาม การได้เปรียบเชิงกล และงานที่ใส่เทียบงานที่ได้',
  formula: 'การได้เปรียบเชิงกล MA = W/E &nbsp;|&nbsp; รอกพวง IMA = จำนวนเส้นเชือกที่รับน้ำหนัก &nbsp;|&nbsp; คาน: E × แขนแรงพยายาม = W × แขนน้ำหนัก &nbsp;|&nbsp; ประสิทธิภาพ = งานที่ได้/งานที่ใส่',
  params: [
    { id: 'type', label: 'ชนิดเครื่องกล', opts: [['pulley', 'รอกพวง'], ['lever', 'คาน']], def: 'pulley' },
    { id: 'M', label: 'มวลของที่ยก', unit: 'kg', min: 1, max: 500, step: 1, def: 60 },
    { id: 'n', label: 'จำนวนเส้นเชือกที่รับน้ำหนัก', unit: 'เส้น', min: 1, max: 6, step: 1, def: 3, show: p => p.type === 'pulley' },
    { id: 'mp', label: 'มวลรอกล่าง', unit: 'kg', min: 0, max: 20, step: 0.5, def: 0, show: p => p.type === 'pulley' },
    { id: 'cls', label: 'ชนิดคาน', opts: [['1', 'อันดับ 1 จุดหมุนกลาง'], ['2', 'อันดับ 2 น้ำหนักกลาง'], ['3', 'อันดับ 3 แรงพยายามกลาง']], def: '1', show: p => p.type === 'lever' },
    { id: 'a', label: 'แขนของแรงพยายาม', unit: 'm', min: 0.1, max: 4, step: 0.05, def: 2, show: p => p.type === 'lever' },
    { id: 'b', label: 'แขนของน้ำหนัก', unit: 'm', min: 0.1, max: 4, step: 0.05, def: 0.5, show: p => p.type === 'lever' },
    { id: 'eff', label: 'ประสิทธิภาพ', unit: '%', min: 10, max: 100, step: 1, def: 80 },
    { id: 'h', label: 'ยกของขึ้นสูง', unit: 'm', min: 0.1, max: 3, step: 0.05, def: 1 },
    { id: 'T', label: 'ใช้เวลา', unit: 's', min: 0.5, max: 20, step: 0.5, def: 4 }
  ],
  outs: [{ id: 'IMA', name: 'การได้เปรียบเชิงกลในอุดมคติ', unit: 'เท่า' }, { id: 'E', name: 'แรงพยายามที่ต้องใช้', unit: 'N' }, { id: 'MA', name: 'การได้เปรียบเชิงกลจริง', unit: 'เท่า' }, { id: 'dE', name: 'ระยะที่ต้องดึง/กด', unit: 'm' }, { id: 'Win', name: 'งานที่ใส่', unit: 'J' }, { id: 'Wout', name: 'งานที่ได้ (Mgh)', unit: 'J' }, { id: 'P', name: 'กำลังที่ใส่', unit: 'W' }],
  compute(p) {
    const g = 9.8, W = p.M * g, eta = p.eff / 100;
    let IMA, E, dE;
    if (p.type === 'pulley') { IMA = p.n; E = (W + p.mp * g) / (p.n * eta); dE = p.h * p.n; }
    else { IMA = p.cls === '2' ? (p.a + p.b) / p.b : p.cls === '3' ? p.a / (p.a + p.b) : p.a / p.b; E = W / (IMA * eta); dE = p.h * IMA; }
    const Win = E * dE; return { IMA, E, MA: W / E, dE, Win, Wout: W * p.h, P: Win / p.T, _W: W };
  },
  sim: {
    init() { return { f: 0 }; },
    step(st, dt, p) { st.f = Math.min(1, st.t / p.T); if (st.t >= p.T) st.done = true; },
    view(p) { return p.type === 'pulley' ? { x0: -4, x1: 5, y0: -0.3, y1: 5.2 } : { x0: -0.8, x1: 9.6, y0: -0.6, y1: 4.2 }; },
    draw(g, st, p, o) {
      const v = g.visible(); g.ground(v.x0, v.x1, 0);
      if (p.type === 'pulley') {
        const n = p.n, top = 4.8, yl = 0.9 + st.f * p.h * 0.6, R = 0.22, nu = Math.max(1, Math.ceil(n / 2)), nl = Math.floor(n / 2);
        g.line(-2.5, top + 0.25, 2.8, top + 0.25, { w: 4 });
        const xs = []; for (let i = 0; i < n; i++) xs.push(-0.9 + i * 0.36);
        // เส้นเชือก
        for (let i = 0; i < n; i++) K.rope(g, [[xs[i], top - R], [xs[i], yl + 0.55]]);
        const xe = xs[n - 1] + 0.36; K.rope(g, [[xe, top - R], [xe, 1.6 - st.f * 0.5]]);
        g.rect(xs[0] - 0.25, top - 0.45, xe - xs[0] + 0.5, 0.45, { fill: '--block', c: '--ink' });
        for (let i = 0; i < nu; i++) g.pulley(xs[0] + 0.18 + i * 0.72, top - 0.22, R, -st.f * 20);
        if (n > 1) { g.rect(xs[0] - 0.2, yl + 0.55, xs[n - 1] - xs[0] + 0.4, 0.38, { fill: '--block', c: '--ink' }); for (let i = 0; i < Math.max(1, nl); i++) g.pulley(xs[0] + 0.18 + i * 0.72, yl + 0.74, R * 0.9, st.f * 20); }
        g.line((xs[0] + xs[n - 1]) / 2, yl + 0.55, (xs[0] + xs[n - 1]) / 2, yl + 0.4, { w: 2 });
        g.box((xs[0] + xs[n - 1]) / 2, yl + 0.1, 0.9, 0.6, 0, { fill: '--c2', label: p.M + ' kg' });
        g.vec(xe, 1.6 - st.f * 0.5, 0, -o.E / o._W * 60 - 10, { px: true, c: '--c4', w: 3, label: 'E ' + fmt(o.E) + ' N' });
        g.text(2.2, 4.0, `${n} เส้นรับน้ำหนัก`, { a: 'left', fs: 13, b: true }); g.text(2.2, 3.6, `ดึงเชือก ${fmt(o.dE * st.f)} m`, { a: 'left', fs: 12 }); g.text(2.2, 3.25, `ของขึ้น ${fmt(p.h * st.f)} m`, { a: 'left', fs: 12 });
      } else {
        const a = p.a, b = p.b, Lt = p.cls === '1' ? a + b : a + b, scale = 8 / Lt, phi = -st.f * Math.atan2(Math.min(p.h, 1.2), Math.max(b, 0.1)) * (p.cls === '3' ? -1 : 1) * 0.5;
        let xf, xl, xe; // ตำแหน่งตามแนวคาน (หน่วยจริง) จากปลายซ้าย
        if (p.cls === '1') { xe = 0; xf = a; xl = a + b; } else if (p.cls === '2') { xf = 0; xl = b; xe = a + b; } else { xf = 0; xe = a; xl = a + b; }
        const fy = 1.2, Px = x => [0.4 + xf * scale + (x - xf) * scale * Math.cos(phi), fy + (x - xf) * scale * Math.sin(phi)];
        g.path([[0.4 + xf * scale - 0.3, 0], [0.4 + xf * scale + 0.3, 0], [0.4 + xf * scale, fy]], { close: true, fill: '--c6', c: '--ink' });
        const A = Px(-0.2 + Math.min(xe, xl, xf)), B = Px(Math.max(xe, xl, xf) + 0.2); g.line(A[0], A[1], B[0], B[1], { c: '--block2', w: 12 }); g.line(A[0], A[1], B[0], B[1], { c: '--ink', w: 1 });
        const L = Px(xl); g.box(L[0], L[1] + 0.35, 0.7, 0.55, phi, { fill: '--c2', label: p.M + ' kg', fs: 10 });
        const E = Px(xe); g.vec(E[0], E[1] + (p.cls === '3' ? -0.1 : 0.1), 0, (p.cls === '3' ? 1 : -1) * 55, { px: true, c: '--c4', w: 3, label: 'E ' + fmt(o.E) + ' N' });
        g.text(0.4, 3.9, `คานอันดับ ${p.cls}   IMA = ${fmt(o.IMA)}`, { a: 'left', fs: 13, b: true });
      }
    }
  },
  three: {
    cam(p) { return p.type === 'pulley' ? { pos: [2.2, 3.2, 6.4], target: [0, 2.4, 0] } : { pos: [4.6, 3.2, 8.2], target: [4.4, 1.2, 0] }; },
    build(T, p, o) {
      const ob = { o3: { r: 0.03, pad: 0.15 } }; T.floor(14, { step: 0.5 }).position.x = p.type === 'pulley' ? 0 : 4.4;
      if (p.type === 'pulley') {
        const n = p.n, top = 4.8, R = 0.22, nu = Math.max(1, Math.ceil(n / 2)), nl = Math.floor(n / 2), xs = []; for (let i = 0; i < n; i++) xs.push(-0.9 + i * 0.36);
        const xe = xs[n - 1] + 0.36; Object.assign(ob, { n, top, R, xs, xe, nl });
        K.ceil3d(T, -2.5, 2.8, top + 0.25, 1.2);
        const tb = T.box(xe - xs[0] + 0.5, 0.45, 0.4, '--block'); tb.position.set((xs[0] + xe) / 2, top - 0.225, 0);
        ob.up = []; for (let i = 0; i < nu; i++) ob.up.push(K.pulley3d(T, R, xs[0] + 0.18 + i * 0.72, top - 0.22, 0.26, 0.08));
        ob.ropes = []; for (let i = 0; i <= n; i++) ob.ropes.push(T.line('--rope', { max: 2 }));
        ob.low = T.group(); if (n > 1) { const lb = T.box(xs[n - 1] - xs[0] + 0.4, 0.38, 0.4, '--block', { parent: ob.low }); lb.position.set((xs[0] + xs[n - 1]) / 2, 0.19, 0); for (let i = 0; i < Math.max(1, nl); i++) { const pw = K.pulley3d(T, R * 0.9, xs[0] + 0.18 + i * 0.72, 0.19, 0.26, 0.08); ob.low.add(pw); } }
        ob.load = T.box(0.9, 0.6, 0.6, '--c2'); ob.hook = T.line('--ink', { max: 2 });
      } else {
        const a = p.a, b = p.b, Lt = a + b, scale = 8 / Lt; let xf, xl, xe;
        if (p.cls === '1') { xe = 0; xf = a; xl = a + b; } else if (p.cls === '2') { xf = 0; xl = b; xe = a + b; } else { xf = 0; xe = a; xl = a + b; }
        Object.assign(ob, { scale, xf, xl, xe, x0: Math.min(xe, xl, xf) - 0.2, x1: Math.max(xe, xl, xf) + 0.2 });
        T.extrude([[0.4 + xf * scale - 0.3, 0], [0.4 + xf * scale + 0.3, 0], [0.4 + xf * scale, 1.2]], 0.6, '--c6');
        ob.beam = T.box((ob.x1 - ob.x0) * scale, 0.12, 0.5, '--block2'); ob.load = T.box(0.7, 0.55, 0.5, '--c2');
      }
      ob.aE = T.vec('--c4', 'E', ob.o3); ob.aW = T.vec('--c1', 'W', ob.o3); ob.lab = T.label('', '--ink');
      return ob;
    },
    update(ob, st, p, o) {
      const k = 1.0 / Math.max(o._W, o.E), z = 0.4;
      if (p.type === 'pulley') {
        const yl = 0.9 + st.f * p.h * 0.6, n = ob.n, xs = ob.xs, top = ob.top, R = ob.R, ye = 1.6 - st.f * 0.5;
        for (let i = 0; i < n; i++) ob.ropes[i].set([[xs[i], top - R, 0], [xs[i], yl + 0.55, 0]]);
        ob.ropes[n].set([[ob.xe, top - R, 0], [ob.xe, ye, 0]]);
        ob.up.forEach(w => w.spin(-st.f * 20)); ob.low.position.y = n > 1 ? yl + 0.55 : -50;
        const cx = (xs[0] + xs[n - 1]) / 2; ob.load.position.set(cx, yl + 0.1, 0); ob.hook.set([[cx, yl + 0.55, 0], [cx, yl + 0.4, 0]]);
        ob.aE.set([ob.xe, ye, z], [0, -o.E * k, 0], 'E ' + fmt(o.E) + ' N'); ob.aW.set([cx, yl + 0.1, z], [0, -o._W * k, 0], 'W ' + fmt(o._W) + ' N');
        ob.lab.set(`ดึงเชือก ${fmt(o.dE * st.f)} m · ของขึ้น ${fmt(p.h * st.f)} m`, [2.2, 4.0, 0]);
      } else {
        const sc = ob.scale, phi = -st.f * Math.atan2(Math.min(p.h, 1.2), Math.max(p.b, 0.1)) * (p.cls === '3' ? -1 : 1) * 0.5;
        const Px = x => [0.4 + ob.xf * sc + (x - ob.xf) * sc * Math.cos(phi), 1.2 + (x - ob.xf) * sc * Math.sin(phi)];
        const m = Px((ob.x0 + ob.x1) / 2); ob.beam.position.set(m[0], m[1] + 0.06, 0); ob.beam.rotation.z = phi;
        const L = Px(ob.xl); K.place3d(ob.load, L[0] - Math.sin(phi) * 0.4, L[1] + Math.cos(phi) * 0.4, phi);
        const E = Px(ob.xe), up = p.cls === '3';
        ob.aE.set([E[0], E[1] + (up ? -0.1 : 0.15), z], [0, (up ? 1 : -1) * o.E * k, 0], 'E ' + fmt(o.E) + ' N'); ob.aW.set([L[0], L[1] + 0.2, z], [0, -o._W * k, 0], 'W ' + fmt(o._W) + ' N');
        ob.lab.set(`คานอันดับ ${p.cls} · IMA = ${fmt(o.IMA)}`, [0.4 + ob.xf * sc, 3.4, 0]);
      }
    }
  },
  notes: ['รอกพวงที่มีเชือกรับน้ำหนัก n เส้น ดึงแรงน้อยลง n เท่า แต่ต้องดึงเชือกยาวขึ้น n เท่า งานที่ใส่ไม่ลดลง', 'คานอันดับ 3 (เช่น ตะเกียบ แขนคน) ได้เปรียบเชิงกลน้อยกว่า 1 แต่ได้ระยะและความเร็ว', 'ประสิทธิภาพน้อยกว่า 100% เพราะแรงเสียดทานและน้ำหนักชิ้นส่วนที่เคลื่อนที่ งานที่ใส่จึงมากกว่างานที่ได้', 'กำลัง = งาน/เวลา ยกเร็วขึ้นต้องใช้กำลังมากขึ้นแม้งานเท่าเดิม']
});

Lab.add('energy', CASES);
})();
