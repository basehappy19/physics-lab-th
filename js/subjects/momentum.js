/* บทที่ 6 โมเมนตัมและการชน */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];

// ---------- 1 การชน 1 มิติ ----------
const after1 = (p) => { const M = p.m1 + p.m2, P = p.m1 * p.u1 + p.m2 * p.u2, r = p.u1 - p.u2; return { v1: (P - p.m2 * p.e * r) / M, v2: (P + p.m1 * p.e * r) / M }; };
const cart = (g, x, w, h, c, lab) => { g.rect(x - w / 2, 0.12, w, h, { fill: c, c: '--ink', w: 1.5 }); g.circle(x - w * 0.3, 0.08, 0.08, { fill: '--ink', c: 'none' }); g.circle(x + w * 0.3, 0.08, 0.08, { fill: '--ink', c: 'none' }); g.text(x, 0.12 + h / 2, lab, { fs: 11, b: true, base: 'middle', c: '--panel' }); };
CASES.push({
  name: 'การชน 1 มิติ', aspect: 2.4, title: 'การชนของรถทดลองในแนวเส้นตรง',
  desc: 'ปรับมวลและความเร็วของรถสองคัน และสัมประสิทธิ์การกระดอน e ตั้งแต่ชนแล้วติดกัน (e = 0) ถึงยืดหยุ่นสมบูรณ์ (e = 1) ดูโมเมนตัมรวมที่คงที่เสมอ และพลังงานจลน์ที่อาจหายไป',
  formula: 'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂ &nbsp;|&nbsp; e = (v₂ − v₁)/(u₁ − u₂) &nbsp;|&nbsp; e = 1: E<sub>k</sub> คงที่ &nbsp;|&nbsp; e = 0: ติดกันไป',
  params: [
    { type: 'head', label: 'รถ 1 (ซ้าย)' },
    { id: 'm1', label: 'มวล m₁', unit: 'kg', min: 0.1, max: 10, step: 0.1, def: 2 },
    { id: 'u1', label: 'ความเร็วก่อนชน u₁', unit: 'm/s', min: -5, max: 8, step: 0.1, def: 3 },
    { type: 'head', label: 'รถ 2 (ขวา)' },
    { id: 'm2', label: 'มวล m₂', unit: 'kg', min: 0.1, max: 10, step: 0.1, def: 1 },
    { id: 'u2', label: 'ความเร็วก่อนชน u₂', unit: 'm/s', min: -8, max: 5, step: 0.1, def: -1 },
    { type: 'head', label: 'การชน' },
    { id: 'e', label: 'สัมประสิทธิ์การกระดอน (e)', unit: '', min: 0, max: 1, step: 0.01, def: 1 }
  ],
  presets: [{ label: 'ยืดหยุ่น มวลเท่ากัน (แลกความเร็ว)', set: { m1: 1, m2: 1, u1: 3, u2: 0, e: 1 } }, { label: 'ชนแล้วติดกัน', set: { m1: 2, m2: 1, u1: 3, u2: -1, e: 0 } }, { label: 'เบาชนหนัก (กระดอนกลับ)', set: { m1: 0.5, m2: 5, u1: 4, u2: 0, e: 1 } }, { label: 'หนักชนเบา', set: { m1: 5, m2: 0.5, u1: 3, u2: 0, e: 1 } }],
  outs: [{ id: 'v1', name: 'v₁ หลังชน', unit: 'm/s' }, { id: 'v2', name: 'v₂ หลังชน', unit: 'm/s' }, { id: 'P', name: 'โมเมนตัมรวม (ก่อน = หลัง)', unit: 'kg·m/s' }, { id: 'K0', name: 'Eₖ ก่อนชน', unit: 'J' }, { id: 'K1', name: 'Eₖ หลังชน', unit: 'J' }, { id: 'loss', name: 'Eₖ ที่หายไป', unit: '%' }, { id: 'J', name: 'การดลที่รถ 2 ได้รับ', unit: 'N·s' }],
  compute(p) { const a = after1(p), K0 = 0.5 * p.m1 * p.u1 ** 2 + 0.5 * p.m2 * p.u2 ** 2, K1 = 0.5 * p.m1 * a.v1 ** 2 + 0.5 * p.m2 * a.v2 ** 2; return { v1: a.v1, v2: a.v2, P: p.m1 * p.u1 + p.m2 * p.u2, K0, K1, loss: K0 > 0 ? (1 - K1 / K0) * 100 : 0, J: p.m2 * (a.v2 - p.u2), _a: a, _hit: p.u1 > p.u2 }; },
  check(p, o) { return o._hit ? [] : ['รถทั้งสองไม่ได้วิ่งเข้าหากัน (u₁ ≤ u₂) จึงไม่ชนกัน']; },
  sim: {
    dt: 1 / 1000,
    init(p) { const w1 = 0.5 + 0.25 * Math.cbrt(p.m1), w2 = 0.5 + 0.25 * Math.cbrt(p.m2); return { x1: -2.2, x2: 2.2, v1: p.u1, v2: p.u2, w1, w2, hit: false }; },
    step(st, dt, p, o) {
      st.x1 += st.v1 * dt; st.x2 += st.v2 * dt;
      if (!st.hit && st.x2 - st.x1 <= (st.w1 + st.w2) / 2 && st.v1 > st.v2) { st.hit = true; st.th = st.t; st.v1 = o._a.v1; st.v2 = o._a.v2; }
      if (st.t > 6 || Math.min(st.x1, st.x2) < -7 || Math.max(st.x1, st.x2) > 7) st.done = true;
    },
    view() { return { x0: -6.5, x1: 6.5, y0: -0.6, y1: 2.6 }; },
    draw(g, st, p, o) {
      g.ground(-7, 7, 0);
      cart(g, st.x1, st.w1, 0.42, '--c1', p.m1 + ' kg'); cart(g, st.x2, st.w2, 0.42, '--c2', p.m2 + ' kg');
      const k = 30; [[st.x1, st.v1, '--c1'], [st.x2, st.v2, '--c2']].forEach(([x, v, c]) => { if (Math.abs(v) > 0.01) g.vec(x, 0.85, v * k, 0, { px: true, c, w: 3, label: fmt(v) + ' m/s' }); });
      const p1 = p.m1 * st.v1, p2 = p.m2 * st.v2, Pm = Math.max(1e-9, Math.abs(p.m1 * p.u1) + Math.abs(p.m2 * p.u2));
      // แท่งโมเมนตัม
      const bx = g.X(-6.2), by = g.Y(2.25), sc = 140 / Pm;
      g.textPx(bx, by - 8, 'โมเมนตัม (kg·m/s)', { a: 'left', fs: 11, c: '--muted' });
      [[p1, '--c1', 'p₁'], [p2, '--c2', 'p₂'], [p1 + p2, '--muted', 'รวม']].forEach(([v, c, l], i) => { const y = by + 6 + i * 18, x0 = bx + 180; g.ctx.fillStyle = g.col(c); g.ctx.fillRect(Math.min(x0, x0 + v * sc), y, Math.abs(v * sc), 12); g.textPx(bx, y + 10, l + ' = ' + fmt(v), { a: 'left', fs: 11 }); });
      g.linePx(bx + 180, by + 2, bx + 180, by + 60, { c: '--muted', w: 1 });
      const KE = 0.5 * p.m1 * st.v1 ** 2 + 0.5 * p.m2 * st.v2 ** 2;
      g.textPx(g.W - 12, by + 10, 'Eₖ รวม = ' + fmt(KE) + ' J', { a: 'right', fs: 12, b: true });
      if (st.hit && st.t - st.th < 0.25) g.circle((st.x1 + st.x2) / 2, 0.35, 14 + (st.t - st.th) * 60, { px: true, c: '--warn', w: 2, alpha: 1 - (st.t - st.th) * 4 });
    }
  },
  plot: { overlay: true, yLabel: 'v (m/s)', series: [{ label: 'v₁', unit: 'm/s', c: '--c1', f: s => s.v1 }, { label: 'v₂', unit: 'm/s', c: '--c2', f: s => s.v2 }, { label: 'โมเมนตัมรวม', unit: 'kg·m/s', c: '--muted', f: (s, p) => p.m1 * s.v1 + p.m2 * s.v2 }] },
  three: {
    cam() { return { pos: [-1, 2.4, 6], target: [0, 0.3, 0] }; },
    build(T, p) { const tr = T.box(14, 0.1, 1.2, '--block', { receive: true }); tr.position.y = -0.05; const w1 = 0.5 + 0.25 * Math.cbrt(p.m1), w2 = 0.5 + 0.25 * Math.cbrt(p.m2); const a = T.box(w1, 0.42, 0.6, '--c1'), b = T.box(w2, 0.42, 0.6, '--c2'); const o3 = { kind: 'v', r: 0.035, pad: 0.25 }, f3 = { r: 0.035, pad: 0.25 };
      return { a, b, w1, w2, va: T.vec('--c1', 'v₁', o3), vb: T.vec('--c2', 'v₂', o3), fa: T.vec('--c4', 'F₂₁', f3), fb: T.vec('--c4', 'F₁₂', f3), kv: 1.4 / Math.max(0.5, Math.abs(p.u1), Math.abs(p.u2)) }; },
    update(ob, st) {
      ob.a.position.set(st.x1, 0.33, 0); ob.b.position.set(st.x2, 0.33, 0);
      ob.va.set([st.x1, 0.75, 0], [st.v1 * ob.kv, 0, 0], 'v₁ ' + fmt(st.v1) + ' m/s'); ob.vb.set([st.x2, 0.75, 0], [st.v2 * ob.kv, 0, 0], 'v₂ ' + fmt(st.v2) + ' m/s');
      // แรงคู่กิริยา-ปฏิกิริยาขณะชน (ขนาดเท่ากัน ทิศตรงข้าม)
      if (st.hit && st.t - st.th < 0.35) { const xc = (st.x1 + st.x2) / 2; ob.fa.set([xc - 0.02, 0.33, 0.42], [-0.9, 0, 0], 'F₂₁ (รถ 2 ดันรถ 1)'); ob.fb.set([xc + 0.02, 0.33, 0.42], [0.9, 0, 0], 'F₁₂'); } else { ob.fa.hide(); ob.fb.hide(); }
    }
  },
  notes: ['โมเมนตัมรวมคงที่ทุกค่า e แต่พลังงานจลน์คงที่เฉพาะ e = 1', 'มวลเท่ากัน ชนแบบยืดหยุ่น ความเร็วแลกกัน', 'วัตถุเบาชนวัตถุหนักที่อยู่นิ่ง จะกระดอนกลับเกือบความเร็วเดิม', 'e = 0 เสียพลังงานจลน์มากที่สุด (แต่ไม่จำเป็นต้องเสียทั้งหมด เพราะโมเมนตัมต้องคงที่)']
});

// ---------- 2 การชน 2 มิติ ----------
CASES.push({
  name: 'การชน 2 มิติ', aspect: 16 / 9, title: 'การชนของลูกพัคบนโต๊ะลม',
  desc: 'ลูกพัค 1 วิ่งเข้าชนลูกพัค 2 ที่อยู่นิ่ง ปรับระยะเยื้องศูนย์ (b) เพื่อเปลี่ยนมุมการชน ลากลูกพัค 2 ขึ้นลงได้ ดูเวกเตอร์โมเมนตัมก่อนและหลังชนที่รวมกันได้เท่าเดิม',
  formula: 'Σp<sub>x</sub> และ Σp<sub>y</sub> คงที่ &nbsp;|&nbsp; ยืดหยุ่นและมวลเท่ากัน: แยกออกตั้งฉากกัน (90°) &nbsp;|&nbsp; แรงกระทำตามแนวเส้นต่อจุดศูนย์กลาง',
  params: [
    { id: 'm1', label: 'มวลพัค 1', unit: 'kg', min: 0.1, max: 5, step: 0.05, def: 1 },
    { id: 'm2', label: 'มวลพัค 2', unit: 'kg', min: 0.1, max: 5, step: 0.05, def: 1 },
    { id: 'u', label: 'ความเร็วพัค 1', unit: 'm/s', min: 0.2, max: 5, step: 0.1, def: 2 },
    { id: 'b', label: 'ระยะเยื้องศูนย์ b (สัดส่วนของ r₁ + r₂)', unit: '', min: -0.98, max: 0.98, step: 0.01, def: 0.5 },
    { id: 'e', label: 'สัมประสิทธิ์การกระดอน', unit: '', min: 0, max: 1, step: 0.01, def: 1 }
  ],
  outs: [{ id: 'v1', name: 'อัตราเร็วพัค 1 หลังชน', unit: 'm/s' }, { id: 'a1', name: 'มุมพัค 1 หลังชน', unit: '°' }, { id: 'v2', name: 'อัตราเร็วพัค 2 หลังชน', unit: 'm/s' }, { id: 'a2', name: 'มุมพัค 2 หลังชน', unit: '°' }, { id: 'sep', name: 'มุมระหว่างทางทั้งสอง', unit: '°' }, { id: 'loss', name: 'Eₖ ที่หายไป', unit: '%' }],
  compute(p) {
    const r1 = 0.3 * Math.cbrt(p.m1), r2 = 0.3 * Math.cbrt(p.m2), R = r1 + r2, by = p.b * R, nx = Math.sqrt(Math.max(0, 1 - p.b * p.b)), ny = -p.b;
    const un = p.u * nx, j = (1 + p.e) * un / (1 / p.m1 + 1 / p.m2);
    const v1 = [p.u - j / p.m1 * nx, -j / p.m1 * ny], v2 = [j / p.m2 * nx, j / p.m2 * ny];
    const s1 = Math.hypot(...v1), s2 = Math.hypot(...v2), a1 = Math.atan2(v1[1], v1[0]) * DEG, a2 = Math.atan2(v2[1], v2[0]) * DEG;
    const K0 = 0.5 * p.m1 * p.u * p.u, K1 = 0.5 * p.m1 * s1 * s1 + 0.5 * p.m2 * s2 * s2;
    return { v1: s1, a1: s1 > 1e-6 ? a1 : '—', v2: s2, a2, sep: s1 > 1e-6 ? Math.abs(a1 - a2) : '—', loss: (1 - K1 / K0) * 100, _c: { r1, r2, by, v1, v2 } };
  },
  sim: {
    dt: 1 / 1000,
    init(p, o) { const c = o._c; return { p1: [-3.2, c.by], p2: [0, 0], v1: [p.u, 0], v2: [0, 0], hit: false, tr1: [[-3.2, c.by]], tr2: [[0, 0]], nk: 0 }; },
    step(st, dt, p, o) {
      const c = o._c;
      st.p1[0] += st.v1[0] * dt; st.p1[1] += st.v1[1] * dt; st.p2[0] += st.v2[0] * dt; st.p2[1] += st.v2[1] * dt;
      if (!st.hit && Math.hypot(st.p1[0] - st.p2[0], st.p1[1] - st.p2[1]) <= c.r1 + c.r2) { st.hit = true; st.v1 = c.v1.slice(); st.v2 = c.v2.slice(); st.th = st.t; }
      if (st.t >= st.nk) { st.tr1.push(st.p1.slice()); st.tr2.push(st.p2.slice()); st.nk += 0.03; }
      if (st.t > 6 || [st.p1, st.p2].every(q => Math.abs(q[0]) > 6 || Math.abs(q[1]) > 3.2)) st.done = true;
    },
    view() { return { x0: -4, x1: 6.2, y0: -2.9, y1: 2.9 }; },
    draw(g, st, p, o) {
      const c = o._c, v = g.visible(); g.rect(v.x0 + 0.1, v.y0 + 0.1, v.x1 - v.x0 - 0.2, v.y1 - v.y0 - 0.2, { fill: '--water-soft', c: '--line', alpha: 0.5 });
      g.line(-4, c.by, 0, c.by, { c: '--muted', dash: [4, 4], w: 1 }); g.line(-0.2, 0, 0.6, 0, { c: '--muted', dash: [4, 4], w: 1 });
      if (Math.abs(c.by) > 0.02) g.dim(-1.4, 0, -1.4, c.by, 'b', { off: 0 });
      g.path(st.tr1, { c: '--c1', w: 2, alpha: 0.5 }); g.path(st.tr2, { c: '--c2', w: 2, alpha: 0.5 });
      g.circle(st.p1[0], st.p1[1], c.r1, { fill: '--c1', c: '--ink', w: 1.5 }); g.circle(st.p2[0], st.p2[1], c.r2, { fill: '--c2', c: '--ink', w: 1.5 });
      [[st.p1, st.v1, '--c1'], [st.p2, st.v2, '--c2']].forEach(([q, vv, col]) => { if (Math.hypot(...vv) > 0.01) g.vec(q[0], q[1], vv[0] * 35, vv[1] * 35, { px: true, c: col, w: 2.5 }); });
      // แผนภาพเวกเตอร์โมเมนตัม
      const ox = 3.4, oy = -2.2, k = 1.6 / (p.m1 * p.u);
      g.text(4.5, 2.5, 'เวกเตอร์โมเมนตัม', { fs: 11, c: '--muted' });
      g.arrow(ox, oy + 3.4, ox + p.m1 * p.u * k, oy + 3.4, { c: '--muted', w: 2.5, label: 'p ก่อนชน' });
      if (st.hit) { const a = [p.m1 * c.v1[0] * k, p.m1 * c.v1[1] * k], b = [p.m2 * c.v2[0] * k, p.m2 * c.v2[1] * k]; g.arrow(ox, oy + 1.4, ox + a[0], oy + 1.4 + a[1], { c: '--c1', w: 2.5, label: 'p₁′' }); g.arrow(ox + a[0], oy + 1.4 + a[1], ox + a[0] + b[0], oy + 1.4 + a[1] + b[1], { c: '--c2', w: 2.5, label: 'p₂′' }); g.arrow(ox, oy + 1.4, ox + a[0] + b[0], oy + 1.4 + a[1] + b[1], { c: '--muted', w: 1.5, dash: [5, 4] }); }
    }
  },
  handles(p, o) { const R = o._c.r1 + o._c.r2; return [{ id: 'b', x: -3.2, y: o._c.by, set: (x, y) => ({ b: clamp(y / R, -0.98, 0.98) }) }]; },
  three: {
    cam() { return { pos: [0.5, 6, 6], target: [1, 0, 0] }; },
    build(T, p, o) { const t = T.box(10.5, 0.15, 6, '--block', { receive: true }); t.position.set(1.1, -0.075, 0); const c = o._c; const a = T.cyl(c.r1, c.r1, 0.12, '--c1'), b = T.cyl(c.r2, c.r2, 0.12, '--c2'); const o3 = { kind: 'v', r: 0.035, pad: 0.25 }; return { a, b, ta: T.trail('--c1'), tb: T.trail('--c2'), va: T.vec('--c1', 'v₁', o3), vb: T.vec('--c2', 'v₂', o3) }; },
    update(ob, st) {
      [[ob.va, st.p1, st.v1, 'v₁'], [ob.vb, st.p2, st.v2, 'v₂']].forEach(([a, q, v, n]) => { const s = Math.hypot(...v); if (s > 0.01) a.set([q[0], 0.2, -q[1]], [v[0] * 0.5, 0, -v[1] * 0.5], n + ' ' + fmt(s) + ' m/s'); else a.hide(); }); ob.a.position.set(st.p1[0], 0.06, -st.p1[1]); ob.b.position.set(st.p2[0], 0.06, -st.p2[1]); if (st.t === 0) { ob.ta.clear(); ob.tb.clear(); } ob.ta.push([st.p1[0], 0.01, -st.p1[1]]); ob.tb.push([st.p2[0], 0.01, -st.p2[1]]); }
  },
  notes: ['b = 0 คือการชนตรงศูนย์ กลายเป็นการชน 1 มิติ', 'มวลเท่ากันและยืดหยุ่นสมบูรณ์ ทั้งสองแยกกันเป็นมุม 90° เสมอ (ยกเว้นชนตรงศูนย์)', 'ผลรวมเวกเตอร์ p₁′ + p₂′ (เส้นประ) เท่ากับ p ก่อนชนพอดี', 'ลากพัค 1 ขึ้นลงเพื่อเปลี่ยนระยะเยื้องศูนย์']
});

// ---------- 3 การดล ----------
CASES.push({
  name: 'การดลและแรงกระแทก', aspect: 2.2, title: 'การดลกับเวลาที่ใช้หยุด',
  desc: 'ลูกบอลชนผนังแล้วหยุดหรือกระดอนกลับ ปรับเวลาที่สัมผัสกัน (ผนังแข็งหรือนุ่ม) ดูกราฟแรงกับเวลา พื้นที่ใต้กราฟคือการดลซึ่งเท่ากับโมเมนตัมที่เปลี่ยนไป',
  formula: 'การดล J = ∫F dt = Δp = m(v − u) &nbsp;|&nbsp; แรงเฉลี่ย F̄ = Δp/Δt &nbsp;|&nbsp; Δt ยาวขึ้น → แรงเฉลี่ยลดลง',
  params: [
    { id: 'm', label: 'มวลลูกบอล', unit: 'kg', min: 0.05, max: 5, step: 0.01, def: 0.5 },
    { id: 'u', label: 'ความเร็วก่อนชน', unit: 'm/s', min: 0.5, max: 30, step: 0.5, def: 10 },
    { id: 'dt', label: 'เวลาที่สัมผัสกัน (Δt)', unit: 's', min: 0.002, max: 0.5, step: 0.001, def: 0.05 },
    { id: 'e', label: 'การกระดอน (e)', unit: '', min: 0, max: 1, step: 0.01, def: 0.6 }
  ],
  presets: [{ label: 'ไข่ตกบนพื้นแข็ง', set: { m: 0.06, u: 5, dt: 0.002, e: 0 } }, { label: 'ไข่ตกบนหมอน', set: { m: 0.06, u: 5, dt: 0.2, e: 0 } }, { label: 'ถุงลมนิรภัย', set: { m: 5, u: 15, dt: 0.15, e: 0 } }],
  outs: [{ id: 'dp', name: 'การเปลี่ยนโมเมนตัม |Δp|', unit: 'kg·m/s' }, { id: 'Fav', name: 'แรงเฉลี่ย', unit: 'N' }, { id: 'Fmax', name: 'แรงสูงสุด', unit: 'N' }, { id: 'v', name: 'ความเร็วหลังชน', unit: 'm/s' }],
  compute(p) { const dp = p.m * p.u * (1 + p.e), Fav = dp / p.dt; return { dp, Fav, Fmax: Fav * Math.PI / 2, v: -p.e * p.u }; },
  sim: {
    dt: 1 / 4000,
    init(p) { return { x: -2.2, v: p.u, F: 0, J: 0, tc: null }; },
    step(st, dt, p, o) {
      const R = 0.15; st.F = 0;
      if (st.tc === null && st.x + R >= 0) st.tc = st.t;
      if (st.tc !== null && st.t - st.tc < p.dt) { const tau = (st.t - st.tc) / p.dt; st.F = -o.Fmax * Math.sin(Math.PI * tau); st.v += st.F / p.m * dt; st.J += st.F * dt; }
      else if (st.tc !== null && st.t - st.tc >= p.dt && !st.after) { st.after = true; st.v = -p.e * p.u; }
      st.x += st.v * dt * (st.tc !== null && st.t - st.tc < p.dt ? 0 : 1);
      if (st.tc !== null && st.t - st.tc < p.dt) st.squash = Math.sin(Math.PI * (st.t - st.tc) / p.dt); else st.squash = 0;
      if (st.x < -2.6 || (st.after && p.e === 0 && st.t - st.tc > p.dt + 0.4) || st.t > 3) st.done = true;
    },
    view() { return { x0: -2.8, x1: 0.5, y0: -0.25, y1: 0.95 }; },
    draw(g, st, p) {
      g.ground(-3, 0, 0); g.wall(0, 0, 1.1, 1, { fill: p.dt > 0.05 ? '--c4' : '--ground' });
      const R = 0.15, sq = (st.squash || 0) * Math.min(0.5, p.dt * 4 + 0.15);
      g.ctx.save(); g.ctx.translate(g.X(st.x + (st.tc !== null && !st.after ? R * sq * 0.5 : 0)), g.Y(R)); g.ctx.scale(1 - sq, 1 + sq * 0.6);
      g.ctx.beginPath(); g.ctx.arc(0, 0, R * g.s, 0, 7); g.ctx.fillStyle = g.col('--c1'); g.ctx.fill(); g.ctx.strokeStyle = g.col('--ink'); g.ctx.lineWidth = 1.5; g.ctx.stroke(); g.ctx.restore();
      if (Math.abs(st.v) > 0.01 && (st.tc === null || st.after)) g.vec(st.x, R, st.v * 12, 0, { px: true, c: '--c1', w: 3, label: fmt(st.v) + ' m/s' });
      if (st.F) g.vec(-0.02, R, st.F / 50, 0, { px: true, c: '--c4', w: 4, label: 'F ' + fmt(-st.F) + ' N' });
      g.textPx(12, 22, `การดลสะสม ${fmt(-st.J)} N·s`, { a: 'left', fs: 13, b: true });
    }
  },
  plot: { dt: 1 / 2000, series: [{ label: 'แรงที่ผนังกระทำ', unit: 'N', c: '--c4', f: s => -s.F }, { label: 'โมเมนตัม', unit: 'kg·m/s', c: '--c1', f: (s, p) => p.m * s.v }] },
  notes: ['การดลเท่ากันถ้าความเร็วก่อนและหลังเท่าเดิม แต่ถ้า Δt ยาวขึ้น แรงสูงสุดจะต่ำลงมาก (หมอน ถุงลม หมวกกันน็อก)', 'กระดอนกลับ (e > 0) Δp มากกว่าหยุดนิ่ง แรงจึงมากกว่า', 'พื้นที่ใต้กราฟแรง-เวลาคือการดล ไม่ว่ารูปร่างกราฟจะเป็นอย่างไร', 'ปรับความเร็วเล่นเป็น 0.1× เพื่อดูช่วงสัมผัสชัดๆ']
});

// ---------- 4 ลูกตุ้มขีปนะ ----------
CASES.push({
  name: 'ลูกตุ้มขีปนะ', aspect: 16 / 9, title: 'ลูกตุ้มขีปนะ (ยิงกระสุนเข้าไม้แขวน)',
  desc: 'กระสุนฝังเข้าไปในไม้ที่แขวนด้วยเชือก ช่วงชนใช้กฎอนุรักษ์โมเมนตัม ช่วงแกว่งขึ้นใช้กฎอนุรักษ์พลังงาน ใช้หาความเร็วกระสุนจากความสูงที่ไม้ขึ้นไปได้',
  formula: 'ช่วงชน: mv = (m + M)V &nbsp;|&nbsp; ช่วงแกว่ง: ½(m + M)V² = (m + M)gh &nbsp;|&nbsp; v = ((m + M)/m)√(2gh)',
  params: [
    { id: 'm', label: 'มวลกระสุน', unit: 'g', min: 1, max: 200, step: 1, def: 10 },
    { id: 'v', label: 'ความเร็วกระสุน', unit: 'm/s', min: 10, max: 1000, step: 5, def: 400 },
    { id: 'M', label: 'มวลไม้', unit: 'kg', min: 0.2, max: 20, step: 0.1, def: 2 },
    { id: 'L', label: 'ความยาวเชือก', unit: 'm', min: 0.3, max: 3, step: 0.05, def: 1.5 }
  ],
  outs: [{ id: 'V', name: 'ความเร็วไม้หลังชน', unit: 'm/s' }, { id: 'h', name: 'ความสูงที่ขึ้นไป', unit: 'm' }, { id: 'ang', name: 'มุมเชือกสูงสุด', unit: '°' }, { id: 'loss', name: 'Eₖ หายไปตอนชน', unit: '%' }],
  compute(p) { const m = p.m / 1000, V = m * p.v / (m + p.M), h = V * V / (2 * 9.8), c = 1 - h / p.L; return { V, h: Math.min(h, 2 * p.L), ang: c >= -1 ? Math.acos(Math.max(-1, c)) * DEG : 'หมุนครบรอบ', loss: (1 - (m + p.M) * V * V / (m * p.v * p.v)) * 100, _V: V }; },
  check(p, o) { return o.h > p.L ? ['ไม้แกว่งสูงเกินระดับจุดแขวน เชือกอาจหย่อน แบบจำลองนี้คิดเหมือนแท่งแข็ง'] : []; },
  sim: {
    dt: 1 / 2000,
    init(p) { return { bx: -2.4, hit: false, th: 0, w: 0 }; },
    step(st, dt, p, o) {
      if (!st.hit) { st.bx += Math.min(p.v, 12) * dt * 1; if (st.bx >= -0.2) { st.hit = true; st.w = o._V / p.L; st.th0 = st.t; } return; }
      st.w += -9.8 / p.L * Math.sin(st.th) * dt; st.th += st.w * dt; if (st.t - st.th0 > 6) st.done = true;
    },
    view(p) { return { x0: -2.6, x1: Math.max(1.6, p.L) + 0.4, y0: -p.L - 0.6, y1: 0.5 }; },
    draw(g, st, p, o) {
      g.line(-1, 0, 1, 0, { w: 4 }); const bx = p.L * Math.sin(st.th), by = -p.L * Math.cos(st.th);
      g.line(0, 0, bx, by, { c: '--rope', w: 2 }); g.box(bx, by - 0.12, 0.4, 0.26, st.th, { fill: '--block2' });
      if (!st.hit) g.rect(st.bx - 0.06, -p.L - 0.13, 0.12, 0.03, { fill: '--c1', c: 'none' });
      const hmax = o.h; g.line(-0.6, -p.L - 0.12 + hmax, 1.4, -p.L - 0.12 + hmax, { c: '--muted', dash: [4, 4], w: 1 }); g.text(1.45, -p.L - 0.12 + hmax, 'h = ' + fmt(hmax) + ' m', { a: 'left', fs: 11, c: '--muted', base: 'middle' });
      g.text(-2.4, -p.L + 0.2, st.hit ? 'ช่วงแกว่ง: พลังงานอนุรักษ์' : 'ช่วงชน: โมเมนตัมอนุรักษ์', { a: 'left', fs: 12, b: true });
      if (!st.hit) g.text(-2.4, -p.L - 0.05, '(กระสุนแสดงช้ากว่าจริง)', { a: 'left', fs: 10, c: '--muted' });
    }
  },
  three: {
    cam(p) { return { pos: [2.5, 0, 3.5], target: [0, -p.L * 0.7, 0] }; },
    build(T, p) { const top = T.box(1.6, 0.06, 0.4, '--ink'); const rope = T.line('--rope', { max: 2 }), rope2 = T.line('--rope', { max: 2 }); const blk = T.box(0.4, 0.26, 0.3, '--block2'); const bul = T.cyl(0.02, 0.02, 0.1, '--c1'); bul.rotation.z = Math.PI / 2; const o3 = { r: 0.015, pad: 0.1 };
      return { rope, rope2, blk, bul, aT: T.vec('--c3', 'T', o3), aW: T.vec('--c1', '(m+M)g', o3), aV: T.vec('--c2', 'V', Object.assign({ kind: 'v' }, o3)), aB: T.vec('--c1', 'v กระสุน', Object.assign({ kind: 'v' }, o3)) }; },
    update(ob, st, p, o) {
      { const M = p.m / 1000 + p.M, W = M * 9.8, k = 0.45 / W, bx = p.L * Math.sin(st.th), by = -p.L * Math.cos(st.th) - 0.13, s = Math.sin(st.th), c = Math.cos(st.th), Pz = [bx, by, 0.2];
        if (st.hit) { const Tn = M * (9.8 * c + p.L * st.w * st.w); ob.aT.set(Pz, [-s * Tn * k, c * Tn * k, 0], 'T ' + fmt(Tn) + ' N'); ob.aW.set(Pz, [0, -W * k, 0], '(m+M)g ' + fmt(W) + ' N'); const V = p.L * st.w; if (Math.abs(V) > 0.01) ob.aV.set(Pz, [c * V * 0.4, s * V * 0.4, 0], 'V ' + fmt(Math.abs(V)) + ' m/s'); else ob.aV.hide(); ob.aB.hide(); }
        else { ob.aT.set(Pz, [0, 0.45, 0], 'T = Mg'); ob.aW.set(Pz, [0, -0.45 * p.M / M, 0], 'Mg'); ob.aV.hide(); ob.aB.set([st.bx, -p.L - 0.12, 0], [0.5, 0, 0], 'v ' + fmt(p.v) + ' m/s'); } } const bx = p.L * Math.sin(st.th), by = -p.L * Math.cos(st.th); ob.rope.set([[-0.15, 0, 0], [bx - 0.15, by, 0]]); ob.rope2.set([[0.15, 0, 0], [bx + 0.15, by, 0]]); ob.blk.position.set(bx, by - 0.13, 0); ob.blk.rotation.z = st.th; ob.bul.visible = !st.hit; ob.bul.position.set(st.bx, -p.L - 0.12, 0); }
  },
  notes: ['ช่วงชนเป็นการชนไม่ยืดหยุ่น พลังงานจลน์ส่วนใหญ่กลายเป็นความร้อนและเสียง ห้ามใช้อนุรักษ์พลังงานข้ามช่วงชน', 'ไม้หนักขึ้น ความเร็วหลังชนลดลง ไม้จึงขึ้นได้ต่ำลง', 'ความยาวเชือกไม่มีผลต่อความสูงที่ขึ้นได้ แต่มีผลต่อมุม']
});

Lab.add('momentum', CASES);
})();
