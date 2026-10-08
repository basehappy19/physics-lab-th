/* บทที่ 7 โพรเจกไทล์ */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
let ghosts = [], lastTrail = null, lastDone = false;

// ---------- 1 ยิงโพรเจกไทล์ ----------
function flight(p) {
  const th = p.th * RAD, c = Math.cos(th), s = Math.sin(th), tp = Math.tan(p.phi * RAD), vx = p.v0 * c, vy = p.v0 * s;
  // h0 + vy t − ½gt² = tp·vx t
  const A = -0.5 * p.g, B = vy - tp * vx, C = p.h0, D = B * B - 4 * A * C;
  const T = D >= 0 ? (-B - Math.sqrt(D)) / (2 * A) : NaN;
  const X = vx * T, Y = p.h0 + vy * T - 0.5 * p.g * T * T, vyf = vy - p.g * T;
  const tTop = vy > 0 ? vy / p.g : 0, H = p.h0 + (vy > 0 ? vy * vy / (2 * p.g) : 0);
  return { T, X, Y, H, tTop, xTop: vx * tTop, vf: Math.hypot(vx, vyf), af: Math.atan2(vyf, vx) * DEG, vx, vy };
}
const groundY = (p, x) => x * Math.tan(p.phi * RAD);
CASES.push({
  name: 'ยิงโพรเจกไทล์', aspect: 2, title: 'การยิงโพรเจกไทล์ ปรับได้ทุกค่า',
  desc: 'ปรับความเร็ว มุม ความสูงจุดยิง ความชันของพื้น ค่า g และแรงต้านอากาศ ลากปืนขึ้นลง ลากปลายลำกล้องเพื่อเล็ง ลากธงเป้าหมาย ทุกนัดที่ยิงจบจะเก็บรอยทางไว้เทียบ',
  formula: 'x = u cos θ · t &nbsp;|&nbsp; y = y₀ + u sin θ · t − ½gt² &nbsp;|&nbsp; v<sub>x</sub> คงที่ &nbsp;|&nbsp; v<sub>y</sub> = u sin θ − gt &nbsp;|&nbsp; พื้นราบ y₀ = 0: R = u² sin 2θ / g',
  params: [
    { type: 'head', label: 'การยิง' },
    { id: 'v0', label: 'อัตราเร็วต้น (u)', unit: 'm/s', min: 1, max: 60, step: 0.1, def: 20 },
    { id: 'th', label: 'มุมยิง (θ)', unit: '°', min: -89, max: 89, step: 0.5, def: 45 },
    { id: 'h0', label: 'ความสูงจุดยิง (y₀)', unit: 'm', min: 0, max: 100, step: 0.5, def: 0 },
    { type: 'head', label: 'สภาพแวดล้อม' },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 },
    { id: 'phi', label: 'ความชันของพื้น', unit: '°', min: -30, max: 30, step: 0.5, def: 0 },
    { id: 'drag', label: 'แรงต้านอากาศ', type: 'bool', def: 0 },
    { id: 'kd', label: 'สัมประสิทธิ์แรงต้าน (k/m)', unit: '1/m', min: 0.001, max: 0.2, step: 0.001, def: 0.02, show: p => !!p.drag },
    { type: 'head', label: 'เป้าหมายและการแสดงผล' },
    { id: 'xt', label: 'ตำแหน่งเป้า x', unit: 'm', min: 1, max: 400, step: 0.5, def: 35 },
    { id: 'comp', label: 'องค์ประกอบความเร็ว', type: 'bool', def: 1 },
    { id: 'strobe', label: 'ภาพแฟลชทุก 0.2 s', type: 'bool', def: 1 }
  ],
  presets: [{ label: '45° ไกลสุด', set: { th: 45, h0: 0, phi: 0, drag: 0 } }, { label: 'ยิงแนวระดับจากหน้าผา', set: { th: 0, h0: 45, v0: 15, phi: 0 } }, { label: 'ยิงขึ้นเนิน 20°', set: { phi: 20, h0: 0, th: 55 } }, { label: 'บนดวงจันทร์', set: { g: 1.6, v0: 10, th: 45, h0: 0 } }],
  actions: [{ label: 'ล้างร่องรอย', run() { ghosts = []; lastTrail = null; } }],
  outs: [{ id: 'T', name: 'เวลาลอยอยู่ในอากาศ', unit: 's' }, { id: 'X', name: 'ระยะตกในแนวระดับ', unit: 'm' }, { id: 'H', name: 'ความสูงสูงสุด', unit: 'm' }, { id: 'tTop', name: 'เวลาถึงจุดสูงสุด', unit: 's' }, { id: 'vf', name: 'อัตราเร็วกระทบพื้น', unit: 'm/s' }, { id: 'af', name: 'มุมกระทบพื้น', unit: '°' }, { id: 'hit', name: 'เป้าหมาย', unit: '' }],
  compute(p) {
    const f = flight(p); const hit = Math.abs(f.X - p.xt) <= 1 + p.xt * 0.01;
    return { T: f.T, X: f.X, H: f.H, tTop: f.tTop, vf: f.vf, af: f.af, hit: p.drag ? 'ดูจากแอนิเมชัน' : hit ? 'ถูกเป้า' : (f.X < p.xt ? `สั้นไป ${fmt(p.xt - f.X)} m` : `เกินไป ${fmt(f.X - p.xt)} m`), _f: f };
  },
  check(p, o) { return p.drag ? ['เปิดแรงต้านอากาศ ค่าในตารางยังคิดแบบไม่มีแรงต้าน ทางเดินจริงดูในภาพ (สั้นและต่ำกว่า)'] : []; },
  sim: {
    dt: 1 / 600,
    init(p) {
      if (lastTrail && lastDone && lastTrail.length > 3) { ghosts.push(lastTrail); if (ghosts.length > 6) ghosts.shift(); }
      const th = p.th * RAD; lastDone = false; lastTrail = [[0, p.h0]];
      return { x: 0, y: p.h0, vx: p.v0 * Math.cos(th), vy: p.v0 * Math.sin(th), tr: lastTrail, marks: [], nm: 0, hit: false };
    },
    step(st, dt, p) {
      let ax = 0, ay = -p.g; if (p.drag) { const v = Math.hypot(st.vx, st.vy); ax -= p.kd * v * st.vx; ay -= p.kd * v * st.vy; }
      st.x += st.vx * dt + 0.5 * ax * dt * dt; st.y += st.vy * dt + 0.5 * ay * dt * dt; st.vx += ax * dt; st.vy += ay * dt;
      if (st.t + dt >= st.nm) { st.marks.push([st.x, st.y]); st.nm += 0.2; }
      if (st.tr.length === 0 || Math.hypot(st.x - st.tr[st.tr.length - 1][0], st.y - st.tr[st.tr.length - 1][1]) > 0.05) st.tr.push([st.x, st.y]);
      if (st.t > 0.01 && st.y <= groundY(p, st.x)) { st.y = groundY(p, st.x); st.done = true; lastDone = true; st.hit = Math.abs(st.x - p.xt) <= 1 + p.xt * 0.01; }
      if (st.t > 120) { st.done = true; lastDone = true; }
    },
    view(p, o) {
      const f = o._f, xs = [0, isFinite(f.X) ? f.X : 10, p.xt, f.xTop], xmax = Math.max(...xs) * 1.08 + 2, xmin = Math.min(-2, Math.min(...xs));
      const ys = [p.h0, f.H, groundY(p, xmax), groundY(p, xmin), 0];
      return { x0: xmin - 1, x1: xmax, y0: Math.min(...ys) - (xmax - xmin) * 0.03, y1: Math.max(...ys) * 1.12 + (xmax - xmin) * 0.05, bottom: true };
    },
    draw(g, st, p, o) {
      const v = g.visible(), f = o._f, span = v.x1 - v.x0;
      g.path([[v.x0, groundY(p, v.x0)], [v.x1, groundY(p, v.x1)], [v.x1, v.y0 - 1], [v.x0, v.y0 - 1]], { close: true, fill: '--ground', c: '--ink', w: 2, fillAlpha: 0.5 });
      K.axisX(g, Math.max(0, v.x0), v.x1, Math.min(0, groundY(p, v.x1), groundY(p, v.x0)) - span * 0.0, { n: 10 });
      if (p.h0 > 0) g.rect(-span * 0.025, Math.min(0, groundY(p, 0)), span * 0.03, p.h0 - Math.min(0, groundY(p, 0)), { fill: '--block', c: '--ink' });
      // เป้า
      const ty = groundY(p, p.xt); g.line(p.xt, ty, p.xt, ty + span * 0.06, { c: '--ink', w: 2 }); g.path([[p.xt, ty + span * 0.06], [p.xt + span * 0.03, ty + span * 0.05], [p.xt, ty + span * 0.04]], { close: true, fill: st.hit ? '--good' : '--bad', c: 'none' });
      g.line(p.xt - 1 - p.xt * 0.01, ty, p.xt + 1 + p.xt * 0.01, ty, { c: '--bad', w: 4, alpha: 0.6 });
      ghosts.forEach((tr, i) => g.path(tr, { c: '--muted', w: 1.5, alpha: 0.35 + 0.08 * i, dash: [4, 4] }));
      if (!p.drag && isFinite(f.H) && f.vy > 0) { g.line(f.xTop, p.h0, f.xTop, f.H, { c: '--muted', dash: [3, 4], w: 1 }); g.text(f.xTop, f.H, 'สูงสุด ' + fmt(f.H) + ' m', { fs: 10, c: '--muted', dy: -8 }); }
      if (p.strobe) st.marks.forEach(m => g.circle(m[0], m[1], 4, { px: true, fill: '--c1', c: 'none', alpha: 0.3 }));
      g.path(st.tr, { c: '--c1', w: 2.2 });
      // ปืน
      const th = p.th * RAD, bl = span * 0.045; g.line(0, p.h0, bl * Math.cos(th), p.h0 + bl * Math.sin(th), { c: '--ink', w: 8 }); g.circle(0, p.h0, 7, { px: true, fill: '--ink', c: 'none' });
      g.circle(st.x, st.y, 6, { px: true, fill: '--c1', c: '--ink', w: 1.5 });
      if (p.comp) { const k = 2.4; g.vec(st.x, st.y, st.vx * k, 0, { px: true, c: '--c2', w: 2.5, label: 'vₓ ' + fmt(st.vx) }); g.vec(st.x, st.y, 0, st.vy * k, { px: true, c: '--c3', w: 2.5, label: 'v_y ' + fmt(st.vy), lside: -1 }); }
      if (st.done) g.textPx(12, 22, st.hit ? 'ถูกเป้า!' : 'ตกที่ x = ' + fmt(st.x) + ' m', { a: 'left', fs: 14, b: true, c: st.hit ? '--good' : '--ink' });
    }
  },
  handles(p, o) {
    const th = p.th * RAD, sp = Math.max(30, (isFinite(o._f.X) ? o._f.X : 30), p.xt), L = sp * 0.12 * p.v0 / 30 + sp * 0.03;
    return [
      { id: 'h0', x: 0, y: p.h0, set: (x, y) => ({ h0: clamp(y, 0, 100) }) },
      { id: 'aim', x: L * Math.cos(th), y: p.h0 + L * Math.sin(th), set: (x, y) => { const a = Math.atan2(y - p.h0, Math.max(1e-6, x)) * DEG, r = Math.hypot(x, y - p.h0); return { th: clamp(a, -89, 89), v0: clamp((r - sp * 0.03) / (sp * 0.12) * 30, 1, 60) }; } },
      { id: 'xt', x: p.xt, y: groundY(p, p.xt) + sp * 0.06, set: x => ({ xt: clamp(x, 1, 400) }) }
    ];
  },
  plot: { series: [{ label: 'x', unit: 'm', c: '--c2', f: s => s.x, on: false }, { label: 'y', unit: 'm', c: '--c1', f: s => s.y }, { label: 'vₓ', unit: 'm/s', c: '--c6', f: s => s.vx }, { label: 'v_y', unit: 'm/s', c: '--c3', f: s => s.vy }] },
  live: [{ name: 'x', unit: 'm', f: s => s.x }, { name: 'y', unit: 'm', f: s => s.y }, { name: 'v', unit: 'm/s', f: s => Math.hypot(s.vx, s.vy) }],
  three: {
    cam(p, o) { const X = Math.max(10, isFinite(o._f.X) ? o._f.X : 10, p.xt); return { pos: [X * 0.2, Math.max(o._f.H, 5) * 0.9 + X * 0.15, X * 0.95], target: [X * 0.5, Math.max(o._f.H, 2) * 0.4, 0] }; },
    build(T, p, o) {
      const X = Math.max(10, isFinite(o._f.X) ? o._f.X : 10, p.xt) * 1.3, gr = T.box(X * 1.6, 0.2, X * 0.7, '--ground', { receive: true, cast: false });
      gr.rotation.z = p.phi * RAD; gr.position.set(X * 0.4 * Math.cos(p.phi * RAD), X * 0.4 * Math.sin(p.phi * RAD) - 0.1, 0);
      if (p.h0 > 0) { const tw = T.box(X * 0.03, p.h0, X * 0.03, '--block'); tw.position.set(0, p.h0 / 2, 0); }
      const ty = groundY(p, p.xt), tg = T.cyl(1 + p.xt * 0.01, 1 + p.xt * 0.01, 0.1, '--bad'); tg.position.set(p.xt, ty + 0.05, 0);
      const ball = T.sphere(Math.max(0.25, X * 0.008), '--c1'), tr = T.trail('--c1', 4000);
      ghosts.forEach(gh => T.line('--muted', { pts: gh.map(q => [q[0], q[1], 0]), max: gh.length, opacity: 0.5 }));
      const can = T.cyl(X * 0.006, X * 0.008, X * 0.05, '--ink'); can.position.set(0, p.h0, 0); can.rotation.z = p.th * RAD - Math.PI / 2;
      return { ball, tr, lab: T.label('', '--ink'), X };
    },
    update(ob, st) { ob.ball.position.set(st.x, st.y, 0); if (st.t === 0) ob.tr.clear(); ob.tr.push([st.x, st.y, 0]); ob.lab.set('v = ' + fmt(Math.hypot(st.vx, st.vy)) + ' m/s', [st.x, st.y + ob.X * 0.04, 0]); }
  },
  notes: ['vₓ (ลูกศรน้ำเงิน) คงที่ตลอดเมื่อไม่มีแรงต้าน มีเพียง v_y ที่เปลี่ยน', 'บนพื้นราบ มุมที่รวมกันได้ 90° (เช่น 30° กับ 60°) ตกไกลเท่ากัน', 'ยิงจากที่สูง มุมที่ไปไกลสุดน้อยกว่า 45°', 'เปิดแรงต้านอากาศ ทางเดินไม่สมมาตรอีกต่อไป ขาลงชันกว่าขาขึ้น', 'ลากปลายลำกล้องเพื่อเล็ง (ระยะลากกำหนดความเร็ว) ลากธงเพื่อย้ายเป้า']
});

// ---------- 2 ทิ้งของจากเครื่องบิน ----------
CASES.push({
  name: 'ทิ้งของจากเครื่องบิน', aspect: 2.2, title: 'ปล่อยถุงยังชีพจากเครื่องบินที่บินแนวระดับ',
  desc: 'เครื่องบินบินด้วยความเร็วคงที่ ถุงที่ปล่อยออกมามีความเร็วแนวระดับเท่าเครื่องบิน จึงตกอยู่ใต้เครื่องบินตลอด เลือกจุดปล่อยให้ตกถูกเป้า',
  formula: 'เวลาตก t = √(2H/g) &nbsp;|&nbsp; ระยะที่ถุงเคลื่อนไปข้างหน้า = u·t &nbsp;|&nbsp; ต้องปล่อยก่อนถึงเป้าเป็นระยะ u√(2H/g)',
  params: [
    { id: 'u', label: 'ความเร็วเครื่องบิน', unit: 'm/s', min: 10, max: 150, step: 1, def: 60 },
    { id: 'H', label: 'ความสูง', unit: 'm', min: 20, max: 1000, step: 5, def: 300 },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 },
    { id: 'xr', label: 'ปล่อยที่ตำแหน่ง x', unit: 'm', min: 0, max: 3000, step: 5, def: 200 },
    { id: 'xt', label: 'ตำแหน่งเป้า', unit: 'm', min: 100, max: 3000, step: 5, def: 700 }
  ],
  presets: [{ label: 'ปล่อยพอดี', set: { u: 60, H: 300, g: 9.8, xt: 700, xr: 700 - 60 * Math.sqrt(600 / 9.8) } }],
  outs: [{ id: 'tf', name: 'เวลาตก', unit: 's' }, { id: 'dx', name: 'ระยะที่ถุงพุ่งไปข้างหน้า', unit: 'm' }, { id: 'xbest', name: 'ควรปล่อยที่ x', unit: 'm' }, { id: 'land', name: 'ถุงตกที่ x', unit: 'm' }, { id: 'miss', name: 'พลาดเป้า', unit: 'm' }],
  compute(p) { const tf = Math.sqrt(2 * p.H / p.g), dx = p.u * tf; return { tf, dx, xbest: p.xt - dx, land: p.xr + dx, miss: p.xr + dx - p.xt }; },
  sim: {
    dt: 1 / 240,
    init(p) { return { xp: Math.min(0, p.xr - 50), rel: false, bx: 0, by: p.H, bvy: 0, tr: [] }; },
    step(st, dt, p) {
      st.xp += p.u * dt;
      if (!st.rel && st.xp >= p.xr) { st.rel = true; st.bx = p.xr; st.by = p.H; st.bvy = 0; }
      if (st.rel && st.by > 0) { st.bx += p.u * dt; st.by += st.bvy * dt - 0.5 * p.g * dt * dt; st.bvy -= p.g * dt; if (st.tr.length % 1 === 0) st.tr.push([st.bx, Math.max(0, st.by)]); if (st.by <= 0) { st.by = 0; st.landT = st.t; } }
      if (st.landT && st.t > st.landT + 1.5) st.done = true; if (st.t > 120) st.done = true;
    },
    view(p, o) { const x1 = Math.max(p.xt, o.land) + p.H * 0.4; return { x0: Math.min(0, p.xr - 50) - p.H * 0.2, x1, y0: -p.H * 0.06, y1: p.H * 1.18, bottom: true }; },
    draw(g, st, p, o) {
      const v = g.visible(), sz = (v.x1 - v.x0) * 0.03; g.ground(v.x0, v.x1, 0); K.axisX(g, Math.max(0, v.x0), v.x1, 0, { n: 8 });
      g.line(p.xt, 0, p.xt, sz * 0.8, { w: 2 }); g.path([[p.xt, sz * 0.8], [p.xt + sz * 0.6, sz * 0.65], [p.xt, sz * 0.5]], { close: true, fill: '--bad', c: 'none' });
      g.line(p.xr, 0, p.xr, p.H, { c: '--muted', dash: [4, 5], w: 1 }); g.text(p.xr, p.H * 1.08, 'จุดปล่อย', { fs: 10, c: '--muted' });
      g.path(st.tr, { c: '--c1', w: 2 });
      // เครื่องบิน
      const xp = st.xp; g.path([[xp - sz, p.H], [xp + sz, p.H], [xp + sz * 1.3, p.H + sz * 0.15], [xp + sz, p.H + sz * 0.3], [xp - sz * 0.8, p.H + sz * 0.3], [xp - sz * 1.2, p.H + sz * 0.7], [xp - sz * 1.3, p.H + sz * 0.2]], { close: true, fill: '--c2', c: '--ink' });
      if (st.rel) { g.line(xp, p.H - sz * 0.05, st.bx, st.by, { c: '--muted', w: 1, dash: [2, 4] }); g.rect(st.bx - sz * 0.15, st.by, sz * 0.3, sz * 0.3, { fill: '--c1', c: '--ink' }); }
      if (st.landT) g.textPx(12, 22, Math.abs(o.miss) < 10 ? 'ตกถูกเป้า!' : `พลาดเป้า ${fmt(o.miss)} m`, { a: 'left', fs: 14, b: true, c: Math.abs(o.miss) < 10 ? '--good' : '--bad' });
    }
  },
  handles(p) { return [{ id: 'xr', x: p.xr, y: p.H * 0.5, set: x => ({ xr: clamp(x, 0, 3000) }) }, { id: 'xt', x: p.xt, y: 0, set: x => ({ xt: clamp(x, 100, 3000) }) }]; },
  notes: ['ถุงอยู่ใต้เครื่องบินตลอดเวลา (เส้นประจางๆ แนวดิ่ง) เพราะความเร็วแนวระดับเท่ากัน', 'บินสูงขึ้น 4 เท่า เวลาตกเพิ่มเพียง 2 เท่า', 'ลากเส้นจุดปล่อยหรือลากเป้าเพื่อเล็งเอง']
});

// ---------- 3 ลิงกับนายพราน ----------
CASES.push({
  name: 'ลิงกับนายพราน', aspect: 2, title: 'ยิงเล็งตรงไปที่ลิงซึ่งปล่อยตัวตกพร้อมกัน',
  desc: 'นายพรานเล็งปืนตรงไปที่ลิงบนต้นไม้ ลิงปล่อยมือตกทันทีที่ได้ยินเสียงปืน กระสุนจะถูกลิงเสมอถ้ากระสุนเร็วพอไปถึงก่อนลิงตกถึงพื้น เพราะทั้งคู่ตกลงด้วยระยะ ½gt² เท่ากัน',
  formula: 'ทั้งกระสุนและลิงตกจากแนวเล็งเท่ากัน ½gt² &nbsp;|&nbsp; ถูกกันเมื่อ t = D/(u cos θ) &nbsp;|&nbsp; ต้องการ ½gt² < H',
  params: [
    { id: 'D', label: 'ระยะแนวระดับถึงต้นไม้', unit: 'm', min: 5, max: 100, step: 0.5, def: 30 },
    { id: 'H', label: 'ความสูงของลิง', unit: 'm', min: 2, max: 50, step: 0.5, def: 15 },
    { id: 'u', label: 'อัตราเร็วกระสุน', unit: 'm/s', min: 5, max: 100, step: 0.5, def: 25 },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 }
  ],
  outs: [{ id: 'th', name: 'มุมเล็ง', unit: '°' }, { id: 't', name: 'เวลาที่พบกัน', unit: 's' }, { id: 'y', name: 'ความสูงที่พบกัน', unit: 'm' }, { id: 'ok', name: 'ผล', unit: '' }],
  compute(p) { const th = Math.atan2(p.H, p.D), t = p.D / (p.u * Math.cos(th)), y = p.H - 0.5 * p.g * t * t; return { th: th * DEG, t, y, ok: y >= 0 ? 'ถูกลิง' : 'ลิงถึงพื้นก่อน', _th: th }; },
  sim: {
    dt: 1 / 600,
    init(p) { return { bx: 0, by: 0, my: p.H, tr: [] }; },
    step(st, dt, p, o) { const th = o._th, t = st.t + dt; st.bx = p.u * Math.cos(th) * t; st.by = p.u * Math.sin(th) * t - 0.5 * p.g * t * t; st.my = Math.max(0, p.H - 0.5 * p.g * t * t); st.tr.push([st.bx, st.by]); if (st.bx >= p.D - 0.2 || st.by < 0 || st.my <= 0) st.done = true; },
    view(p) { return { x0: -2, x1: p.D + 6, y0: -1, y1: p.H * 1.3, bottom: true }; },
    draw(g, st, p, o) {
      const v = g.visible(); g.ground(v.x0, v.x1, 0);
      g.rect(p.D + 0.5, 0, 1, p.H + 2, { fill: '--block2', c: '--ink' }); g.line(p.D + 0.5, p.H + 0.3, p.D - 0.5, p.H + 0.6, { c: '--block2', w: 6 });
      g.line(0, 0, p.D, p.H, { c: '--muted', dash: [6, 5], w: 1.2 }); g.text(p.D * 0.5, p.H * 0.5 + 1, 'แนวเล็ง', { fs: 11, c: '--muted' });
      g.path(st.tr, { c: '--c1', w: 2 });
      g.circle(st.bx, st.by, 4, { px: true, fill: '--c1' });
      g.circle(p.D, st.my, 0.9, { fill: '--block2', c: '--ink' }); g.text(p.D, st.my, 'ลิง', { fs: 11, b: true, base: 'middle' });
      g.line(p.D, p.H, p.D, st.my, { c: '--c4', w: 1, dash: [2, 3] });
      const drop = p.H - st.my; if (drop > 0.1) g.text(p.D + 1.8, (p.H + st.my) / 2, 'ตก ' + fmt(drop) + ' m', { a: 'left', fs: 11, c: '--c4', base: 'middle' });
      if (st.done) g.textPx(12, 22, o.ok, { a: 'left', fs: 14, b: true, c: o.y >= 0 ? '--good' : '--bad' });
    }
  },
  notes: ['ไม่ว่าความเร็วกระสุนเท่าใด ถ้าเล็งตรงที่ลิง กระสุนจะตกจากแนวเล็งเท่ากับที่ลิงตกเสมอ', 'กระสุนช้าเกินไป ลิงจะถึงพื้นก่อน (ผลแสดงว่าไม่ถูก)', 'หลักนี้แสดงว่าการเคลื่อนที่แนวดิ่งกับแนวระดับเป็นอิสระต่อกัน']
});

// ---------- 4 เทียบหลายมุม ----------
CASES.push({
  name: 'เทียบหลายมุมยิง', aspect: 2, title: 'ยิงพร้อมกันหลายมุมด้วยอัตราเร็วเท่ากัน',
  desc: 'ยิงลูกบอลหลายลูกพร้อมกันจากพื้นด้วยอัตราเร็วเท่ากันแต่มุมต่างกัน ดูว่ามุมใดตกไกลสุด และมุมคู่ใดตกที่เดียวกัน',
  formula: 'R = u² sin 2θ / g &nbsp;|&nbsp; R สูงสุดเมื่อ θ = 45° &nbsp;|&nbsp; θ กับ 90° − θ ตกที่เดียวกัน แต่ลอยนานไม่เท่ากัน',
  params: [
    { id: 'u', label: 'อัตราเร็วต้น', unit: 'm/s', min: 5, max: 40, step: 0.5, def: 20 },
    { id: 'step', label: 'ห่างกันทุก', unit: '°', vals: [5, 10, 15], def: 15 },
    { id: 'g', label: 'g', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, def: 9.8 }
  ],
  outs: [{ id: 'R45', name: 'ระยะไกลสุด (45°)', unit: 'm' }, { id: 'H90', name: 'ความสูงสูงสุดถ้ายิงตรง', unit: 'm' }],
  compute(p) { return { R45: p.u * p.u / p.g, H90: p.u * p.u / (2 * p.g) }; },
  sim: {
    dt: 1 / 300,
    init(p) { const A = []; for (let a = p.step; a < 90; a += p.step) A.push(a); return { A }; },
    step(st, dt, p) { const tmax = 2 * p.u / p.g; if (st.t > tmax + 0.5) st.done = true; },
    view(p) { const R = p.u * p.u / p.g; return { x0: -R * 0.05, x1: R * 1.08, y0: -R * 0.06, y1: R * 0.55, bottom: true }; },
    draw(g, st, p) {
      const v = g.visible(); g.ground(v.x0, v.x1, 0); K.axisX(g, 0, v.x1, 0, { n: 8 });
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];
      st.A.forEach((a, i) => {
        const th = a * RAD, T = 2 * p.u * Math.sin(th) / p.g, t = Math.min(st.t, T), c = cols[i % 6];
        g.fn(x => x * Math.tan(th) - p.g * x * x / (2 * p.u * p.u * Math.cos(th) ** 2), 0, p.u * Math.cos(th) * t, { c, w: 2, n: 60 });
        const x = p.u * Math.cos(th) * t, y = p.u * Math.sin(th) * t - 0.5 * p.g * t * t; g.circle(x, y, 5, { px: true, fill: c, c: '--ink', w: 1 });
        if (st.t >= T) g.text(x, 0, a + '°', { fs: 10, b: true, c, dy: 14 + (i % 2) * 11 });
      });
    }
  },
  three: {
    cam(p) { const R = p.u * p.u / p.g; return { pos: [R * 0.2, R * 0.45, R * 1.0], target: [R * 0.5, R * 0.15, 0] }; },
    build(T, p) { const R = p.u * p.u / p.g; T.floor(R * 2.4, { step: K.niceStep(R / 6) }); const A = []; for (let a = p.step; a < 90; a += p.step) A.push(a); const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6']; return { A, balls: A.map((a, i) => T.sphere(R * 0.012, cols[i % 6])), trs: A.map((a, i) => T.trail(cols[i % 6])) }; },
    update(ob, st, p) { ob.A.forEach((a, i) => { const th = a * RAD, T = 2 * p.u * Math.sin(th) / p.g, t = Math.min(st.t, T), x = p.u * Math.cos(th) * t, y = p.u * Math.sin(th) * t - 0.5 * p.g * t * t; ob.balls[i].position.set(x, y, (i - ob.A.length / 2) * 0.02 * p.u); if (st.t === 0) ob.trs[i].clear(); ob.trs[i].push([x, y, (i - ob.A.length / 2) * 0.02 * p.u]); }); }
  },
  notes: ['ลูกที่มุม 45° ตกไกลที่สุด', 'มุม 30° กับ 60° (หรือ 15° กับ 75°) ตกที่เดียวกัน แต่มุมสูงลอยนานกว่า', 'ทุกลูกที่ยิงด้วยอัตราเร็วเท่ากัน ตกถึงพื้นด้วยอัตราเร็วเท่ากัน']
});

Lab.add('proj', CASES);
})();
