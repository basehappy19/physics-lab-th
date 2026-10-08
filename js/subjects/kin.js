/* บทที่ 2 การเคลื่อนที่แนวตรง */
(function () {
'use strict';
const { fmt, clamp } = Lab.h, K = Lab.kit;
const CASES = [];

// ---------- 1 รถเคลื่อนที่หลายช่วง ----------
function phasesInfo(p) {
  let t = 0, x = p.x0, v = p.u, dist = 0, xmin = x, xmax = x, vmax = Math.abs(v), amax = 0;
  const b = [];
  p.phases.forEach(ph => {
    const a = ph.a, T = ph.dur, x1 = x + v * T + 0.5 * a * T * T, v1 = v + a * T;
    if (a !== 0) { const tt = -v / a; if (tt > 0 && tt < T) { const xt = x + v * tt + 0.5 * a * tt * tt; dist += Math.abs(xt - x) + Math.abs(x1 - xt); xmin = Math.min(xmin, xt); xmax = Math.max(xmax, xt); } else dist += Math.abs(x1 - x); } else dist += Math.abs(x1 - x);
    b.push({ t0: t, t1: t + T, a, x0: x, v0: v });
    t += T; x = x1; v = v1; xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); vmax = Math.max(vmax, Math.abs(v)); amax = Math.max(amax, Math.abs(a));
  });
  return { T: t, xf: x, vf: v, dist, xmin, xmax, vmax, amax, b };
}
CASES.push({
  name: 'รถหลายช่วง', aspect: 2.3, title: 'การเคลื่อนที่ด้วยความเร่งคงที่หลายช่วง',
  desc: 'กำหนดความเร่งและเวลาของแต่ละช่วงเอง เพิ่มหรือลบช่วงได้ ดูรถเคลื่อนที่พร้อมกราฟ x-t, v-t, a-t และจุดบนเทปกระดาษทุก 1 วินาที',
  formula: 'v = u + at &nbsp;|&nbsp; s = ut + ½at² &nbsp;|&nbsp; v² = u² + 2as &nbsp;|&nbsp; ความชัน x-t = v, ความชัน v-t = a, พื้นที่ใต้ v-t = การกระจัด',
  params: [
    { type: 'head', label: 'สภาพเริ่มต้น' },
    { id: 'x0', label: 'ตำแหน่งเริ่มต้น (x₀)', unit: 'm', min: -100, max: 100, step: 0.5, def: 0 },
    { id: 'u', label: 'ความเร็วต้น (u)', unit: 'm/s', min: -40, max: 40, step: 0.5, def: 4 },
    { id: 'phases', type: 'list', label: 'ช่วงการเคลื่อนที่', item: 'ช่วง', min: 1, max: 6,
      fields: [{ id: 'a', label: 'ความเร่ง a', unit: 'm/s²', min: -15, max: 15, step: 0.1 }, { id: 'dur', label: 'ระยะเวลา', unit: 's', min: 0.5, max: 30, step: 0.5 }],
      def: [{ a: 2, dur: 4 }, { a: 0, dur: 3 }, { a: -3, dur: 5 }], add: () => ({ a: 0, dur: 3 }) },
    { type: 'head', label: 'การแสดงผล' },
    { id: 'tape', label: 'จุดเทปกระดาษทุก 1 s', type: 'bool', def: 1 },
    { id: 'vec', label: 'ลูกศร v และ a', type: 'bool', def: 1 }
  ],
  presets: [
    { label: 'เร่ง-คงที่-เบรก', set: { x0: 0, u: 0, phases: [{ a: 3, dur: 4 }, { a: 0, dur: 4 }, { a: -4, dur: 3 }] } },
    { label: 'ขว้างแล้วย้อนกลับ', set: { x0: 0, u: 12, phases: [{ a: -3, dur: 8 }] } },
    { label: 'ความเร็วคงที่', set: { x0: -20, u: 5, phases: [{ a: 0, dur: 8 }] } }
  ],
  outs: [
    { id: 'T', name: 'เวลารวม', unit: 's' }, { id: 'vf', name: 'ความเร็วสุดท้าย', unit: 'm/s' },
    { id: 'dx', name: 'การกระจัด', unit: 'm' }, { id: 'dist', name: 'ระยะทาง', unit: 'm' },
    { id: 'vavg', name: 'ความเร็วเฉลี่ย', unit: 'm/s' }, { id: 'savg', name: 'อัตราเร็วเฉลี่ย', unit: 'm/s' }
  ],
  compute(p) { const i = phasesInfo(p); return { T: i.T, vf: i.vf, dx: i.xf - p.x0, dist: i.dist, vavg: (i.xf - p.x0) / i.T, savg: i.dist / i.T, _i: i }; },
  check(p, o) { return Math.abs(o.dist - Math.abs(o.dx)) > 1e-6 ? ['รถกลับทิศระหว่างทาง ระยะทางจึงมากกว่าขนาดการกระจัด'] : []; },
  sim: {
    init(p, o) { return { x: p.x0, v: p.u, a: p.phases[0].a, ph: 0, marks: [p.x0], nm: 1 }; },
    step(st, dt, p, o) {
      const b = o._i.b, t = st.t; let k = b.findIndex(q => t < q.t1 - 1e-12); if (k < 0) k = b.length - 1;
      st.ph = k; st.a = b[k].a; st.x += st.v * dt + 0.5 * st.a * dt * dt; st.v += st.a * dt;
      if (t + dt >= st.nm - 1e-9) { st.marks.push(st.x); st.nm++; }
      if (t + dt >= o._i.T - 1e-9) st.done = true;
    },
    view(p, o) { const i = o._i, span = Math.max(20, i.xmax - i.xmin), pad = span * 0.12; return { x0: i.xmin - pad, x1: i.xmax + pad, y0: -span * 0.06, y1: span * 0.3, bottom: true }; },
    draw(g, st, p, o) {
      const i = o._i, span = Math.max(20, i.xmax - i.xmin), v = g.visible(), Lc = span * 0.07;
      g.ground(v.x0, v.x1, 0); K.axisX(g, v.x0, v.x1, -span * 0.03, { label: 'x (m)' });
      if (p.tape) st.marks.forEach((m, k) => { g.circle(m, -span * 0.012, 3.2, { px: true, fill: '--c4', c: 'none' }); if (k % 2 === 0) g.text(m, -span * 0.012, k + 's', { fs: 9, c: '--muted', dy: -8 }); });
      g.line(p.x0, 0, p.x0, span * 0.18, { c: '--muted', dash: [4, 4], w: 1 }); g.text(p.x0, span * 0.19, 'เริ่ม', { fs: 10, c: '--muted' });
      K.car(g, st.x, 0, Lc, { c: '--c2', dir: st.v < 0 ? -1 : 1 });
      if (p.vec) {
        const ky = 90 / Math.max(1, i.vmax), ka = 70 / Math.max(0.5, i.amax), y0 = Lc * 0.9;
        if (Math.abs(st.v) > 1e-3) g.vec(st.x, y0, st.v * ky, 0, { px: true, c: '--c1', w: 3, label: 'v = ' + fmt(st.v) + ' m/s' });
        if (Math.abs(st.a) > 1e-3) g.vec(st.x, y0 + span * 0.07, st.a * ka, 0, { px: true, c: '--c3', w: 3, label: 'a = ' + fmt(st.a) + ' m/s²' });
      }
      g.textPx(12, 20, `ช่วงที่ ${st.ph + 1} จาก ${p.phases.length}`, { a: 'left', fs: 13, b: true });
    }
  },
  handles(p, o, st) { const span = Math.max(20, o._i.xmax - o._i.xmin); return [{ id: 'x0', x: p.x0, y: span * 0.06, set: x => ({ x0: x }) }]; },
  plot: { series: [{ label: 'x', unit: 'm', c: '--c2', f: s => s.x }, { label: 'v', unit: 'm/s', c: '--c1', f: s => s.v }, { label: 'a', unit: 'm/s²', c: '--c3', f: s => s.a }] },
  live: [{ name: 'x', unit: 'm', f: s => s.x }, { name: 'v', unit: 'm/s', f: s => s.v }, { name: 'a', unit: 'm/s²', f: s => s.a }],
  three: {
    cam(p, o) { const i = o._i, c = (i.xmin + i.xmax) / 2, sp = Math.max(20, i.xmax - i.xmin); return { pos: [c - sp * 0.15, sp * 0.35, sp * 0.75], target: [c, 0, 0] }; },
    build(T, p, o) {
      const i = o._i, sp = Math.max(20, i.xmax - i.xmin), x0 = i.xmin - sp * 0.15, x1 = i.xmax + sp * 0.15, c = (x0 + x1) / 2;
      const road = T.box(x1 - x0, 0.2, 7, '--ground', { receive: true, cast: false }); road.position.set(c, -0.1, 0);
      for (let x = Math.ceil(x0 / 5) * 5; x < x1; x += 5) { const m = T.box(2, 0.02, 0.2, '--panel', { cast: false }); m.position.set(x, 0.01, 0); }
      const tick = K.niceStep(sp / 8); for (let x = Math.ceil(x0 / tick) * tick; x <= x1; x += tick) T.label(String(+x.toPrecision(5)), '--muted', { pos: [x, 0, 4.3] });
      const car = K.car3d(T, '--c2', Math.max(3, sp * 0.05)); car.position.z = -1.6;
      return { car, v: T.arrow('--c1', { r: 0.12 }), a: T.arrow('--c3', { r: 0.12 }), lab: T.label('', '--c1'), marks: [], sp };
    },
    update(ob, st, p, o, T) {
      ob.car.position.x = st.x; const h = ob.sp * 0.12, i = o._i;
      ob.v.set([st.x, h, -1.6], [st.v / Math.max(1, i.vmax) * ob.sp * 0.15, 0, 0]);
      ob.a.set([st.x, h + 1.5, -1.6], [st.a / Math.max(0.5, i.amax) * ob.sp * 0.1, 0, 0]);
      ob.lab.set('v = ' + fmt(st.v) + ' m/s', [st.x, h + 3, -1.6]);
      while (ob.marks.length < st.marks.length) { const m = T.sphere(0.3, '--c4'); m.position.set(st.marks[ob.marks.length], 0.3, 1.5); ob.marks.push(m); }
    }
  },
  notes: ['ลองตั้งความเร่งช่วงสุดท้ายให้ติดลบมากๆ ความเร็วจะผ่านศูนย์แล้วติดลบ รถถอยหลัง ระยะทางจึงมากกว่าการกระจัด', 'จุดบนเทปที่ห่างขึ้นเรื่อยๆ แปลว่าเร่ง ห่างเท่ากันแปลว่าความเร็วคงที่', 'กราฟ v-t เป็นเส้นตรงในแต่ละช่วง ความชันเท่ากับ a ของช่วงนั้น', 'ลากจุดวงกลมประเพื่อย้ายตำแหน่งเริ่มต้นของรถ']
});

// ---------- 2 ไล่ตามและพบกัน ----------
const posAt = (x0, u, a, t0, t) => t <= t0 ? x0 : x0 + u * (t - t0) + 0.5 * a * (t - t0) * (t - t0);
const velAt = (u, a, t0, t) => t < t0 ? 0 : u + a * (t - t0);
function meets(p) {
  const f = t => posAt(p.xA, p.uA, p.aA, p.tA, t) - posAt(p.xB, p.uB, p.aB, p.tB, t);
  const out = []; let prev = f(0), tp = 0; const n = 6000;
  if (Math.abs(prev) < 1e-9) out.push(0);
  for (let k = 1; k <= n; k++) { const t = p.T * k / n, v = f(t); if (prev * v < 0) { let lo = tp, hi = t; for (let j = 0; j < 50; j++) { const m = (lo + hi) / 2; f(lo) * f(m) <= 0 ? hi = m : lo = m; } out.push((lo + hi) / 2); } else if (Math.abs(v) < 1e-9 && Math.abs(prev) > 1e-9) out.push(t); prev = v; tp = t; }
  return out;
}
CASES.push({
  name: 'ไล่ตามและพบกัน', aspect: 2.3, title: 'รถสองคันไล่ตามกัน',
  desc: 'กำหนดตำแหน่ง ความเร็ว ความเร่ง และเวลาออกตัวของรถแต่ละคัน หาว่าพบกันเมื่อไร ที่ไหน จุดตัดของกราฟ x-t คือเวลาที่พบกัน',
  formula: 'x_A(t) = x_B(t) &nbsp;|&nbsp; x = x₀ + u(t − t₀) + ½a(t − t₀)²',
  params: [
    { type: 'head', label: 'รถ A (สีส้ม)' },
    { id: 'xA', label: 'ตำแหน่งเริ่ม x_A', unit: 'm', min: -200, max: 200, step: 1, def: 0 },
    { id: 'uA', label: 'ความเร็วต้น u_A', unit: 'm/s', min: -40, max: 40, step: 0.5, def: 0 },
    { id: 'aA', label: 'ความเร่ง a_A', unit: 'm/s²', min: -10, max: 10, step: 0.1, def: 2 },
    { id: 'tA', label: 'ออกตัวเมื่อ t', unit: 's', min: 0, max: 20, step: 0.5, def: 0 },
    { type: 'head', label: 'รถ B (สีน้ำเงิน)' },
    { id: 'xB', label: 'ตำแหน่งเริ่ม x_B', unit: 'm', min: -200, max: 200, step: 1, def: 30 },
    { id: 'uB', label: 'ความเร็วต้น u_B', unit: 'm/s', min: -40, max: 40, step: 0.5, def: 8 },
    { id: 'aB', label: 'ความเร่ง a_B', unit: 'm/s²', min: -10, max: 10, step: 0.1, def: 0 },
    { id: 'tB', label: 'ออกตัวเมื่อ t', unit: 's', min: 0, max: 20, step: 0.5, def: 0 },
    { type: 'head', label: 'เวลาจำลอง' },
    { id: 'T', label: 'ช่วงเวลาที่ดู', unit: 's', min: 2, max: 60, step: 1, def: 15 }
  ],
  presets: [
    { label: 'ตำรวจไล่รถ (ออกตัวช้า 2 s)', set: { xA: 0, uA: 0, aA: 3, tA: 2, xB: 0, uB: 15, aB: 0, tB: 0, T: 15 } },
    { label: 'วิ่งสวนกัน', set: { xA: 0, uA: 10, aA: 0, tA: 0, xB: 120, uB: -8, aB: 0, tB: 0, T: 10 } },
    { label: 'ไล่ไม่ทัน', set: { xA: 0, uA: 20, aA: -2, tA: 0, xB: 60, uB: 8, aB: 0, tB: 0, T: 15 } }
  ],
  outs: [
    { id: 'n', name: 'จำนวนครั้งที่พบกัน', unit: 'ครั้ง' }, { id: 't1', name: 'พบกันครั้งแรกเมื่อ', unit: 's' },
    { id: 'x1', name: 'ตำแหน่งที่พบกัน', unit: 'm' }, { id: 'vA1', name: 'v_A ขณะพบ', unit: 'm/s' }, { id: 'vB1', name: 'v_B ขณะพบ', unit: 'm/s' },
    { id: 'gap', name: 'ระยะห่าง x_B − x_A ตอนจบ', unit: 'm' }
  ],
  compute(p) {
    const m = meets(p), t1 = m.length ? m[0] : NaN;
    const xs = []; for (let k = 0; k <= 200; k++) { const t = p.T * k / 200; xs.push(posAt(p.xA, p.uA, p.aA, p.tA, t), posAt(p.xB, p.uB, p.aB, p.tB, t)); }
    return { n: m.length, t1: m.length ? t1 : 'ไม่พบกัน', x1: m.length ? posAt(p.xA, p.uA, p.aA, p.tA, t1) : '—', vA1: m.length ? velAt(p.uA, p.aA, p.tA, t1) : '—', vB1: m.length ? velAt(p.uB, p.aB, p.tB, t1) : '—', gap: posAt(p.xB, p.uB, p.aB, p.tB, p.T) - posAt(p.xA, p.uA, p.aA, p.tA, p.T), _m: m, _min: Math.min(...xs), _max: Math.max(...xs) };
  },
  sim: {
    tmax: null,
    init(p) { return { xA: p.xA, xB: p.xB, vA: 0, vB: 0, met: [] }; },
    step(st, dt, p, o) { const t = st.t + dt; st.xA = posAt(p.xA, p.uA, p.aA, p.tA, t); st.xB = posAt(p.xB, p.uB, p.aB, p.tB, t); st.vA = velAt(p.uA, p.aA, p.tA, t); st.vB = velAt(p.uB, p.aB, p.tB, t); o._m.forEach(m => { if (m <= t && !st.met.includes(m)) st.met.push(m); }); if (t >= p.T) st.done = true; },
    view(p, o) { const sp = Math.max(20, o._max - o._min), pad = sp * 0.1; return { x0: o._min - pad, x1: o._max + pad, y0: -sp * 0.14, y1: sp * 0.24 }; },
    draw(g, st, p, o) {
      const sp = Math.max(20, o._max - o._min), v = g.visible(), Lc = sp * 0.055, lane = sp * 0.1;
      g.ground(v.x0, v.x1, 0); g.line(v.x0, lane, v.x1, lane, { c: '--line', w: 1, dash: [10, 8] });
      K.axisX(g, v.x0, v.x1, -sp * 0.03, { label: 'x (m)' });
      st.met.forEach(m => { const x = posAt(p.xA, p.uA, p.aA, p.tA, m); g.line(x, -sp * 0.01, x, sp * 0.21, { c: '--c4', w: 2, dash: [5, 4] }); g.text(x, sp * 0.215, 'พบกัน t = ' + fmt(m) + ' s', { fs: 11, b: true, c: '--c4' }); });
      K.car(g, st.xA, 0.004 * sp, Lc, { c: '--c1', dir: st.vA < 0 ? -1 : 1, label: 'A' });
      K.car(g, st.xB, lane, Lc, { c: '--c2', dir: st.vB < 0 ? -1 : 1, label: 'B' });
      g.text(st.xA, Lc * 0.75, fmt(st.vA) + ' m/s', { fs: 10, c: '--c1', dy: -6 }); g.text(st.xB, lane + Lc * 0.75, fmt(st.vB) + ' m/s', { fs: 10, c: '--c2', dy: -6 });
    }
  },
  handles(p, o) { const sp = Math.max(20, o._max - o._min); return [{ id: 'xA', x: p.xA, y: sp * 0.02, set: x => ({ xA: x }) }, { id: 'xB', x: p.xB, y: sp * 0.12, set: x => ({ xB: x }) }]; },
  plot: { overlay: true, yLabel: 'x (m)', series: [{ label: 'x_A', unit: 'm', c: '--c1', f: s => s.xA }, { label: 'x_B', unit: 'm', c: '--c2', f: s => s.xB }] },
  live: [{ name: 'x_A', unit: 'm', f: s => s.xA }, { name: 'x_B', unit: 'm', f: s => s.xB }, { name: 'ห่างกัน', unit: 'm', f: s => s.xB - s.xA }],
  three: {
    cam(p, o) { const c = (o._min + o._max) / 2, sp = Math.max(20, o._max - o._min); return { pos: [c, sp * 0.4, sp * 0.8], target: [c, 0, 0] }; },
    build(T, p, o) {
      const sp = Math.max(20, o._max - o._min), x0 = o._min - sp * 0.15, x1 = o._max + sp * 0.15;
      const road = T.box(x1 - x0, 0.2, 9, '--ground', { receive: true, cast: false }); road.position.set((x0 + x1) / 2, -0.1, 0);
      const L = Math.max(3, sp * 0.04); const A = K.car3d(T, '--c1', L), B = K.car3d(T, '--c2', L); A.position.z = 2; B.position.z = -2;
      return { A, B, la: T.label('A', '--c1'), lb: T.label('B', '--c2'), L };
    },
    update(ob, st) { ob.A.position.x = st.xA; ob.B.position.x = st.xB; ob.A.rotation.y = st.vA < 0 ? Math.PI : 0; ob.B.rotation.y = st.vB < 0 ? Math.PI : 0; ob.la.set(null, [st.xA, ob.L * 0.8, 2]); ob.lb.set(null, [st.xB, ob.L * 0.8, -2]); }
  },
  notes: ['จุดตัดของเส้น x_A กับ x_B ในกราฟคือเวลาที่รถพบกัน', 'ถ้าเส้นไม่ตัดกันเลย รถไม่พบกันภายในช่วงเวลาที่ดู ลองเพิ่มเวลาที่ดู', 'ช่วงที่ระยะห่างน้อยสุดคือขณะที่ความเร็วทั้งสองเท่ากัน', 'ลากรถในภาพเพื่อเปลี่ยนตำแหน่งเริ่มต้น']
});

// ---------- 3 โยนในแนวดิ่ง / ตกจากที่สูง ----------
CASES.push({
  name: 'โยนขึ้น-ตกลง', title: 'วัตถุเคลื่อนที่ในแนวดิ่งภายใต้แรงโน้มถ่วง',
  desc: 'ปล่อยหรือโยนลูกบอลจากดาดฟ้าตึก ปรับความสูง ความเร็วต้น ค่า g (เช่น บนดวงจันทร์) และการกระดอนเมื่อกระทบพื้น',
  formula: 'v = u − gt &nbsp;|&nbsp; y = y₀ + ut − ½gt² &nbsp;|&nbsp; v² = u² − 2g(y − y₀) &nbsp;|&nbsp; ความสูงสูงสุด = y₀ + u²/2g',
  params: [
    { id: 'h0', label: 'ความสูงจุดปล่อย (y₀)', unit: 'm', min: 0, max: 100, step: 0.5, def: 20 },
    { id: 'u', label: 'ความเร็วต้น (u, ขึ้น = +)', unit: 'm/s', min: -30, max: 40, step: 0.5, def: 10 },
    { id: 'g', label: 'ความเร่งโน้มถ่วง (g)', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 },
    { id: 'e', label: 'การกระดอน (e)', unit: '', min: 0, max: 0.95, step: 0.05, def: 0 },
    { id: 'strobe', label: 'ภาพแฟลชทุก 0.25 s', type: 'bool', def: 1 }
  ],
  presets: [{ label: 'ปล่อยเฉยๆ', set: { u: 0, h0: 45 } }, { label: 'โยนลง', set: { u: -10, h0: 30 } }, { label: 'ดวงจันทร์', set: { g: 1.6, u: 5, h0: 10 } }, { label: 'ลูกบอลกระดอน', set: { h0: 10, u: 0, e: 0.7 } }],
  outs: [
    { id: 'tTop', name: 'เวลาถึงจุดสูงสุด', unit: 's' }, { id: 'hmax', name: 'ความสูงสูงสุด', unit: 'm' },
    { id: 'tG', name: 'เวลาถึงพื้นครั้งแรก', unit: 's' }, { id: 'vG', name: 'อัตราเร็วกระทบพื้น', unit: 'm/s' }
  ],
  compute(p) {
    const tTop = p.u > 0 ? p.u / p.g : 0, hmax = p.u > 0 ? p.h0 + p.u * p.u / (2 * p.g) : p.h0;
    const tG = (p.u + Math.sqrt(p.u * p.u + 2 * p.g * p.h0)) / p.g;
    return { tTop: p.u > 0 ? tTop : 'โยนลง/ปล่อย', hmax, tG, vG: Math.sqrt(p.u * p.u + 2 * p.g * p.h0) };
  },
  sim: {
    dt: 1 / 600,
    init(p) { return { y: p.h0, v: p.u, a: -p.g, marks: [], nm: 0, bounces: 0 }; },
    step(st, dt, p) {
      if (st.t + dt >= st.nm) { st.marks.push(st.y); st.nm += 0.25; }
      st.y += st.v * dt - 0.5 * p.g * dt * dt; st.v -= p.g * dt;
      if (st.y <= 0 && st.v < 0) { st.y = 0; if (p.e > 0 && Math.abs(st.v) * p.e > 0.4 && st.bounces < 30) { st.v = -st.v * p.e; st.bounces++; } else { st.v = 0; st.done = true; } }
      if (st.t > 60) st.done = true;
    },
    view(p, o) { const H = Math.max(5, o.hmax * 1.12); return { x0: -H * 0.55, x1: H * 0.55, y0: -H * 0.06, y1: H }; },
    draw(g, st, p, o) {
      const H = Math.max(5, o.hmax * 1.12), bw = H * 0.22, r = H * 0.025, bx = bw * 0.25 + r * 1.6;
      const v = g.visible(); g.ground(v.x0, v.x1, 0);
      if (p.h0 > 0) { g.rect(-bw, 0, bw, p.h0, { fill: '--block', c: '--ink' }); for (let y = H * 0.05; y < p.h0 - H * 0.04; y += H * 0.07) for (let k = 0; k < 3; k++) g.rect(-bw + bw * (0.12 + k * 0.3), y, bw * 0.18, H * 0.035, { fill: '--water-soft', c: 'none' }); }
      K.axisY(g, 0, H * 0.98, -bw - H * 0.1, { label: 'y (m)' });
      g.line(-bw - H * 0.03, o.hmax, bx + H * 0.12, o.hmax, { c: '--muted', dash: [4, 4], w: 1 }); g.text(bx + H * 0.13, o.hmax, 'สูงสุด ' + fmt(o.hmax) + ' m', { a: 'left', fs: 11, c: '--muted', base: 'middle' });
      if (p.strobe) st.marks.forEach((m, k) => g.circle(bx + (k % 2 ? r * 0.6 : -r * 0.6), m, r, { fill: '--c1', c: 'none', alpha: 0.22 }));
      K.ball(g, bx, st.y + r, r);
      const kv = 80 / Math.max(1, o.vG);
      if (Math.abs(st.v) > 0.05) g.vec(bx + r * 2.2, st.y + r, 0, st.v * kv, { px: true, c: '--c1', w: 3, label: 'v ' + fmt(st.v), lside: -1 });
      g.vec(bx - r * 2.2, st.y + r, 0, -40, { px: true, c: '--c3', w: 2.5, label: 'g', lside: 1 });
    }
  },
  handles(p, o) { const H = Math.max(5, o.hmax * 1.12), bw = H * 0.22, r = H * 0.025; return [{ id: 'h0', x: bw * 0.25 + r * 1.6, y: p.h0 + r, set: (x, y) => ({ h0: Math.max(0, y) }) }]; },
  plot: { series: [{ label: 'y', unit: 'm', c: '--c2', f: s => s.y }, { label: 'v', unit: 'm/s', c: '--c1', f: s => s.v }, { label: 'a', unit: 'm/s²', c: '--c3', f: (s, p) => s.done ? 0 : -p.g }] },
  live: [{ name: 'y', unit: 'm', f: s => s.y }, { name: 'v', unit: 'm/s', f: s => s.v }, { name: 'กระดอน', unit: 'ครั้ง', f: s => s.bounces }],
  three: {
    cam(p, o) { const H = Math.max(5, o.hmax); return { pos: [H * 0.9, H * 0.55, H * 1.1], target: [0, H * 0.45, 0] }; },
    build(T, p, o) {
      const H = Math.max(5, o.hmax), r = H * 0.03; T.floor(Math.max(20, H * 2), { step: K.niceStep(H / 4) });
      if (p.h0 > 0) { const b = T.box(H * 0.25, p.h0, H * 0.25, '--block'); b.position.set(-H * 0.14, p.h0 / 2, 0); }
      const ball = T.sphere(r, '--c1'); const tr = T.trail('--c1');
      const lab = T.label('', '--ink');
      return { ball, tr, lab, r, H };
    },
    update(ob, st) { ob.ball.position.set(ob.r * 1.2, st.y + ob.r, 0); ob.tr.push([ob.r * 1.2 - ob.r * 2.5, st.y + ob.r, 0]); ob.lab.set('v = ' + fmt(st.v) + ' m/s', [ob.H * 0.15, st.y + ob.r * 3, 0]); if (st.t === 0) ob.tr.clear(); }
  },
  notes: ['ที่จุดสูงสุด v = 0 แต่ความเร่งยังเป็น g ชี้ลงเสมอ', 'เวลาขึ้นถึงจุดสูงสุดเท่ากับเวลาตกกลับลงมาที่ระดับเดิม และอัตราเร็วที่ระดับเดียวกันเท่ากัน', 'ภาพแฟลชที่ห่างกันมากขึ้นเมื่อลูกบอลตกลง แสดงว่าอัตราเร็วเพิ่มขึ้น', 'ลากลูกบอลขึ้นลงเพื่อเปลี่ยนความสูงจุดปล่อย']
});

Lab.add('kin', CASES);
})();
