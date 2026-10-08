/* บทที่ 10 ไฟฟ้า */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
const KC = 9e9, UC = 1e-6;

// ---------- 1 สนามและศักย์ของจุดประจุ ----------
const field = (Q, x, y) => { let Ex = 0, Ey = 0, V = 0; Q.forEach(c => { const dx = x - c.x, dy = y - c.y, r2 = Math.max(dx * dx + dy * dy, 0.0025), r = Math.sqrt(r2), k = KC * c.q * UC; Ex += k * dx / (r2 * r); Ey += k * dy / (r2 * r); V += k / r; }); return { Ex, Ey, V, E: Math.hypot(Ex, Ey) }; };
let heat = { key: '', cv: null };
function heatmap(g, Q, v) {
  const key = JSON.stringify(Q) + [v.x0, v.x1, v.y0, v.y1, g.W, g.H, g.col('--pos'), g.col('--neg'), g.col('--panel')].join(',');
  if (heat.key !== key) {
    const W = 200, H = Math.round(200 * (v.y1 - v.y0) / (v.x1 - v.x0)), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(W, H), qm = Math.max(1e-9, ...Q.map(c => Math.abs(c.q))), Vs = KC * qm * UC / 1.2;
    const hex = h => { const t = h.replace('#', ''); return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)]; };
    const cp = hex(g.col('--pos')), cn = hex(g.col('--neg')), bg = hex(g.col('--panel'));
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = v.x0 + (i + 0.5) / W * (v.x1 - v.x0), y = v.y1 - (j + 0.5) / H * (v.y1 - v.y0), V = field(Q, x, y).V / Vs;
      const t = Math.tanh(Math.abs(V)) * 0.75, c = V >= 0 ? cp : cn, band = Math.abs((V * 6) % 1) < 0.06 ? 0.25 : 0, k = (j * W + i) * 4;
      for (let d = 0; d < 3; d++) img.data[k + d] = Math.round(bg[d] * (1 - t - band) + c[d] * (t + band));
      img.data[k + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); heat = { key, cv };
  }
  g.ctx.drawImage(heat.cv, g.X(v.x0), g.Y(v.y1), (v.x1 - v.x0) * g.s, (v.y1 - v.y0) * g.s);
}
function fieldLines(g, Q, v) {
  const pos = Q.filter(c => c.q > 0), src = pos.length ? pos : Q.filter(c => c.q < 0), dir = pos.length ? 1 : -1, qm = Math.max(...Q.map(c => Math.abs(c.q)));
  src.forEach(c => {
    const n = Math.max(6, Math.round(16 * Math.abs(c.q) / qm));
    for (let k = 0; k < n; k++) {
      const a = (k + 0.5) / n * 2 * Math.PI; let x = c.x + 0.12 * Math.cos(a), y = c.y + 0.12 * Math.sin(a); const pts = [[x, y]];
      for (let s = 0; s < 700; s++) {
        const f = field(Q, x, y); if (f.E < 1e-9) break; const h = 0.03;
        x += dir * f.Ex / f.E * h; y += dir * f.Ey / f.E * h; pts.push([x, y]);
        if (x < v.x0 - 1 || x > v.x1 + 1 || y < v.y0 - 1 || y > v.y1 + 1) break;
        if (Q.some(o => o !== c && Math.hypot(x - o.x, y - o.y) < 0.1)) break;
      }
      g.path(pts, { c: '--ink', w: 1, alpha: 0.55 });
      if (pts.length > 20) { const m = Math.floor(pts.length / 3), a1 = pts[m], b1 = pts[m + 2]; const ang = Math.atan2(b1[1] - a1[1], b1[0] - a1[0]) * (dir > 0 ? 1 : 1); const d = dir > 0 ? 0 : Math.PI; g.vec(a1[0], a1[1], 9 * Math.cos(ang + d), 9 * Math.sin(ang + d), { px: true, c: '--ink', w: 1, head: 6, alpha: 0.6 }); }
    }
  });
}
CASES.push({
  name: 'สนามและศักย์ไฟฟ้า', aspect: 16 / 9, sens: false, title: 'สนามไฟฟ้าและศักย์ไฟฟ้าจากจุดประจุหลายตัว',
  desc: 'เพิ่ม ลบ และลากจุดประจุได้อิสระ เส้นดำคือเส้นสนาม สีพื้นคือศักย์ (แดง = บวก น้ำเงิน = ลบ) แถบเข้มคือเส้นสมศักย์ ลากจุดทดสอบเพื่ออ่านค่าสนามและศักย์ กดเล่นเพื่อปล่อยประจุทดสอบให้เคลื่อนที่ ดูพื้นผิวศักย์ใน 3D',
  formula: 'E = kq/r² &nbsp;|&nbsp; V = kq/r &nbsp;|&nbsp; E และ V จากหลายประจุ: รวมกันแบบเวกเตอร์ (E) และแบบสเกลาร์ (V) &nbsp;|&nbsp; F = qE &nbsp;|&nbsp; U = qV',
  params: [
    { id: 'Q', type: 'list', label: 'จุดประจุ', item: 'ประจุ', min: 1, max: 6, fields: [{ id: 'q', label: 'ประจุ', unit: 'µC', min: -10, max: 10, step: 0.5 }, { id: 'x', label: 'x', unit: 'm', min: -5, max: 5, step: 0.05 }, { id: 'y', label: 'y', unit: 'm', min: -3, max: 3, step: 0.05 }], def: [{ q: 4, x: -1.5, y: 0 }, { q: -4, x: 1.5, y: 0 }], add: () => ({ q: 2, x: 0, y: 1.5 }) },
    { type: 'head', label: 'จุดทดสอบ / ประจุทดสอบ' },
    { id: 'px', label: 'จุดทดสอบ x', unit: 'm', min: -5, max: 5, step: 0.05, def: 0 },
    { id: 'py', label: 'จุดทดสอบ y', unit: 'm', min: -3, max: 3, step: 0.05, def: 1.2 },
    { id: 'tq', label: 'ประจุทดสอบ', unit: 'µC', min: -2, max: 2, step: 0.05, def: 0.5 },
    { id: 'tm', label: 'มวลประจุทดสอบ', unit: 'g', min: 0.1, max: 100, step: 0.1, def: 5 },
    { id: 'lines', label: 'เส้นสนาม', type: 'bool', def: 1 }
  ],
  presets: [{ label: 'ไดโพล', set: { Q: [{ q: 4, x: -1.5, y: 0 }, { q: -4, x: 1.5, y: 0 }] } }, { label: 'บวกสองตัว', set: { Q: [{ q: 4, x: -1.5, y: 0 }, { q: 4, x: 1.5, y: 0 }] } }, { label: 'บวกใหญ่ ลบเล็ก', set: { Q: [{ q: 8, x: -1, y: 0 }, { q: -2, x: 1.5, y: 0 }] } }, { label: 'สี่ขั้ว', set: { Q: [{ q: 4, x: -1.5, y: 1.2 }, { q: -4, x: 1.5, y: 1.2 }, { q: -4, x: -1.5, y: -1.2 }, { q: 4, x: 1.5, y: -1.2 }] } }],
  outs: [{ id: 'E', name: 'ขนาดสนามที่จุดทดสอบ', unit: 'N/C' }, { id: 'Ea', name: 'ทิศของสนาม', unit: '°' }, { id: 'V', name: 'ศักย์ที่จุดทดสอบ', unit: 'V' }, { id: 'F', name: 'แรงต่อประจุทดสอบ', unit: 'N' }, { id: 'U', name: 'พลังงานศักย์ของประจุทดสอบ', unit: 'J' }],
  compute(p) { const f = field(p.Q, p.px, p.py); return { E: f.E, Ea: Math.atan2(f.Ey, f.Ex) * DEG, V: f.V, F: f.E * Math.abs(p.tq) * UC, U: p.tq * UC * f.V }; },
  sim: {
    dt: 1 / 2000, autoplay: false,
    init(p) { return { x: p.px, y: p.py, vx: 0, vy: 0, tr: [[p.px, p.py]], KE: 0 }; },
    step(st, dt, p) {
      const f = field(p.Q, st.x, st.y), m = p.tm / 1000, q = p.tq * UC;
      st.vx += q * f.Ex / m * dt; st.vy += q * f.Ey / m * dt; const v = Math.hypot(st.vx, st.vy); if (v > 40) { st.vx *= 40 / v; st.vy *= 40 / v; }
      st.x += st.vx * dt; st.y += st.vy * dt; st.KE = 0.5 * m * (st.vx * st.vx + st.vy * st.vy);
      if (st.t - (st.lt || 0) > 0.01) { st.tr.push([st.x, st.y]); st.lt = st.t; }
      if (p.Q.some(c => Math.hypot(st.x - c.x, st.y - c.y) < 0.12) || Math.abs(st.x) > 6 || Math.abs(st.y) > 4 || st.t > 20) st.done = true;
    },
    view() { return { x0: -5, x1: 5, y0: -3, y1: 3, pad: 0 }; },
    draw(g, st, p, o) {
      const v = g.visible(); heatmap(g, p.Q, v);
      if (p.lines) fieldLines(g, p.Q, v);
      p.Q.forEach(c => { const r = 9 + 5 * Math.sqrt(Math.abs(c.q) / 10); g.circle(c.x, c.y, r, { px: true, fill: c.q >= 0 ? '--pos' : '--neg', c: '--ink', w: 1.5 }); g.text(c.x, c.y, (c.q > 0 ? '+' : c.q < 0 ? '−' : '') + Math.abs(c.q), { fs: 11, b: true, c: '--panel', base: 'middle' }); });
      g.path(st.tr, { c: '--c3', w: 2 });
      const f = field(p.Q, st.x, st.y), L = 45; if (f.E > 0) g.vec(st.x, st.y, f.Ex / f.E * L, f.Ey / f.E * L, { px: true, c: '--c3', w: 2.5, label: 'E' });
      g.circle(st.x, st.y, 6, { px: true, fill: p.tq >= 0 ? '--pos' : '--neg', c: '--panel', w: 2 });
      g.textPx(12, 22, `ที่จุดทดสอบ  E = ${fmt(f.E)} N/C   V = ${fmt(f.V)} V`, { a: 'left', fs: 13, b: true, bg: true });
      if (st.t === 0) g.textPx(12, 42, 'กด ▶ เพื่อปล่อยประจุทดสอบ', { a: 'left', fs: 12, c: '--muted', bg: true });
    }
  },
  handles(p) { return p.Q.map((c, i) => ({ id: 'q' + i, x: c.x, y: c.y, set: (x, y) => ({ ['Q.' + i + '.x']: clamp(x, -5, 5), ['Q.' + i + '.y']: clamp(y, -3, 3) }) })).concat([{ id: 'probe', x: p.px, y: p.py, set: (x, y) => ({ px: clamp(x, -5, 5), py: clamp(y, -3, 3) }) }]); },
  plot: { series: [{ label: 'พลังงานจลน์', unit: 'J', c: '--c1', f: s => s.KE }, { label: 'อัตราเร็ว', unit: 'm/s', c: '--c2', f: s => Math.hypot(s.vx, s.vy) }] },
  three: {
    cam() { return { pos: [0, 5.5, 7.5], target: [0, 0, 0] }; },
    build(T, p) {
      const N = 120, M = 72, geo = new T.THREE.PlaneGeometry(10, 6, N, M); geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position, col = [], qm = Math.max(...p.Q.map(c => Math.abs(c.q))), Vs = KC * qm * UC;
      const cp = T.color('--pos'), cn = T.color('--neg'), cb = T.color('--panel');
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), V = field(p.Q, x, -z).V / Vs; pos.setY(i, Math.max(-2.2, Math.min(2.2, V * 0.8))); const t = Math.tanh(Math.abs(V)) * 0.9, c = (V >= 0 ? cp : cn).clone().lerp(cb, 1 - t); col.push(c.r, c.g, c.b); }
      geo.setAttribute('color', new T.THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      T.mesh(geo, '--panel', { material: new T.THREE.MeshStandardMaterial({ vertexColors: true, side: T.THREE.DoubleSide, roughness: 0.7 }), cast: false });
      const wire = new T.THREE.LineSegments(new T.THREE.WireframeGeometry(new T.THREE.PlaneGeometry(10, 6, 20, 12)), new T.THREE.LineBasicMaterial({ color: T.color('--line'), transparent: true, opacity: 0.4 })); wire.rotation.x = -Math.PI / 2; wire.position.y = -2.25; T.scene.add(wire);
      p.Q.forEach(c => T.label((c.q > 0 ? '+' : '−') + Math.abs(c.q) + ' µC', c.q > 0 ? '--pos' : '--neg', { pos: [c.x, c.q > 0 ? 2.4 : -2.4, -c.y] }));
      T.label('พื้นผิวศักย์ไฟฟ้า: สูง = ศักย์บวก ต่ำ = ศักย์ลบ', '--muted', { pos: [0, 2.8, -3.2] });
      const hY = (x, y) => Math.max(-2.2, Math.min(2.2, field(p.Q, x, y).V / Vs * 0.8));
      // ลูกศรสนามไฟฟ้าบนพื้นผิว (ยาวตาม log ของขนาด)
      const Em = []; for (let i = -9; i <= 9; i += 1.5) for (let j = -5; j <= 5; j += 1.25) { const x = i / 2, y = j / 2; if (p.Q.some(c => Math.hypot(x - c.x, y - c.y) < 0.45)) continue; const f = field(p.Q, x, y); if (f.E > 0) Em.push([x, y, f]); }
      const eMax = Math.max(1e-9, ...Em.map(e => e[2].E));
      Em.forEach(([x, y, f]) => { const L = 0.15 + 0.4 * Math.max(0, 1 + Math.log10(f.E / eMax) / 2.5); T.vec('--c3', null, { kind: 'v', r: 0.014, top: false }).set([x, hY(x, y) + 0.06, -y], [f.Ex / f.E * L, 0, -f.Ey / f.E * L]); });
      const ball = T.sphere(0.08, '--c3'); return { ball, Vs, hY, aF: T.vec(p.tq >= 0 ? '--pos' : '--neg', 'F = qE', { r: 0.025 }), aV: T.vec('--c2', 'v', { kind: 'v', r: 0.02 }) };
    },
    update(ob, st, p) {
      const P = [st.x, ob.hY(st.x, st.y) + 0.08, -st.y]; ob.ball.position.set(...P);
      const f = field(p.Q, st.x, st.y), q = p.tq * UC, F = Math.abs(q) * f.E, sg = Math.sign(p.tq) || 1;
      if (f.E > 0) ob.aF.set([P[0], P[1] + 0.05, P[2]], [sg * f.Ex / f.E * 0.9, 0, -sg * f.Ey / f.E * 0.9], 'F ' + fmt(F) + ' N'); else ob.aF.hide();
      const v = Math.hypot(st.vx, st.vy); if (v > 1e-6) ob.aV.set([P[0], P[1] + 0.05, P[2]], [st.vx / v * 0.7, 0, -st.vy / v * 0.7], 'v ' + fmt(v) + ' m/s'); else ob.aV.hide();
    }
  },
  notes: ['เส้นสนามออกจากประจุบวกและพุ่งเข้าหาประจุลบ ไม่ตัดกันเลย', 'เส้นสมศักย์ (แถบเข้ม) ตั้งฉากกับเส้นสนามเสมอ', 'ระหว่างประจุบวกสองตัวมีจุดที่สนามเป็นศูนย์ แต่ศักย์ไม่เป็นศูนย์', 'ประจุทดสอบบวกเคลื่อนที่จากศักย์สูงไปต่ำ (ไหลลงเนินในภาพ 3D) ประจุลบเคลื่อนที่กลับกัน', 'ลากประจุและจุดทดสอบได้ เพิ่มประจุได้ถึง 6 ตัว']
});

// ---------- 2 ประจุระหว่างแผ่นขนาน ----------
const PT = { e: { q: -1.6e-19, m: 9.11e-31, n: 'อิเล็กตรอน' }, p: { q: 1.6e-19, m: 1.67e-27, n: 'โปรตอน' }, a: { q: 3.2e-19, m: 6.64e-27, n: 'อนุภาคแอลฟา' } };
CASES.push({
  name: 'ประจุในแผ่นขนาน', aspect: 2.2, title: 'อนุภาคมีประจุเคลื่อนที่ผ่านสนามไฟฟ้าสม่ำเสมอ',
  desc: 'อนุภาคพุ่งเข้าระหว่างแผ่นโลหะขนานในแนวขนานกับแผ่น สนามไฟฟ้าทำให้เกิดความเร่งคงที่ในแนวตั้งฉาก เส้นทางจึงเป็นพาราโบลาเหมือนโพรเจกไทล์',
  formula: 'E = V/d &nbsp;|&nbsp; a = qE/m &nbsp;|&nbsp; เวลาในแผ่น t = L/v₀ &nbsp;|&nbsp; ระยะเบน y = ½at²',
  params: [
    { id: 'pt', label: 'อนุภาค', opts: [['e', 'อิเล็กตรอน'], ['p', 'โปรตอน'], ['a', 'แอลฟา']], def: 'e' },
    { id: 'V', label: 'ความต่างศักย์ระหว่างแผ่น', unit: 'V', min: -500, max: 500, step: 1, def: 100 },
    { id: 'd', label: 'ระยะห่างแผ่น', unit: 'cm', min: 0.5, max: 10, step: 0.1, def: 2 },
    { id: 'L', label: 'ความยาวแผ่น', unit: 'cm', min: 1, max: 20, step: 0.1, def: 6 },
    { id: 'v0', label: 'ความเร็วต้น', unit: '×10⁶ m/s', min: 0.05, max: 50, step: 0.05, def: 10 }
  ],
  presets: [{ label: 'อิเล็กตรอนชนแผ่น', set: { pt: 'e', V: 300, v0: 8 } }, { label: 'โปรตอน (แทบไม่เบน)', set: { pt: 'p', V: 100, v0: 1 } }],
  outs: [{ id: 'E', name: 'สนามไฟฟ้า', unit: 'N/C' }, { id: 'a', name: 'ความเร่ง', unit: 'm/s²' }, { id: 't', name: 'เวลาในแผ่น', unit: 's' }, { id: 'y', name: 'ระยะเบนเมื่อออกจากแผ่น', unit: 'cm' }, { id: 'ang', name: 'มุมเบนเมื่อออก', unit: '°' }, { id: 'res', name: 'ผล', unit: '' }],
  compute(p) {
    const P = PT[p.pt], d = p.d / 100, L = p.L / 100, v0 = p.v0 * 1e6, E = p.V / d, a = P.q * E / P.m, t = L / v0, y = 0.5 * a * t * t, vy = a * t;
    const hit = Math.abs(y) > d / 2;
    return { E: Math.abs(E), a: Math.abs(a), t, y: y * 100, ang: Math.atan2(vy, v0) * DEG, res: hit ? 'ชนแผ่น' : 'ผ่านออกไปได้', _a: a, _hit: hit, _tHit: hit ? Math.sqrt(d / Math.abs(a)) : null };
  },
  sim: {
    dt: 1 / 600,
    init() { return { x: -0.15, y: 0, tr: [] }; },
    step(st, dt, p, o) {
      const L = p.L, d = p.d, v = 6; st.x += v * dt * L / 6;
      if (st.x > 0 && st.x <= L) { const tt = st.x / L, yy = 0.5 * o._a * (p.L / 100 / (p.v0 * 1e6)) ** 2 * tt * tt * 100; st.y = yy; }
      else if (st.x > L) { const sl = Math.tan(o.ang * RAD); st.y = o.y + sl * (st.x - L); }
      if (Math.abs(st.y) >= d / 2 && st.x > 0 && st.x <= L) { st.y = Math.sign(st.y) * d / 2; st.done = true; }
      st.tr.push([st.x, st.y]); if (st.x > L * 1.5 + 1 || Math.abs(st.y) > d * 2 + 2) st.done = true;
    },
    view(p) { return { x0: -p.L * 0.3 - 0.5, x1: p.L * 1.6 + 1, y0: -Math.max(p.d, 2) * 0.9, y1: Math.max(p.d, 2) * 0.9 }; },
    draw(g, st, p, o) {
      const d = p.d, L = p.L, top = p.V >= 0 ? '+' : '−';
      g.rect(0, d / 2, L, d * 0.08 + 0.1, { fill: p.V >= 0 ? '--pos' : '--neg', c: '--ink' }); g.rect(0, -d / 2 - d * 0.08 - 0.1, L, d * 0.08 + 0.1, { fill: p.V >= 0 ? '--neg' : '--pos', c: '--ink' });
      g.text(L / 2, d / 2 + d * 0.08 + 0.35, 'แผ่น ' + top, { fs: 12, b: true });
      for (let x = L * 0.1; x < L; x += L / 6) g.vec(x, p.V >= 0 ? d / 2 - 0.05 : -d / 2 + 0.05, 0, (p.V >= 0 ? -1 : 1) * Math.min(d * 0.8, d - 0.1) * g.s * 0.9, { px: true, c: '--muted', w: 1, head: 6, alpha: 0.6 });
      g.path(st.tr, { c: '--c1', w: 2.2 }); g.circle(st.x, st.y, 5, { px: true, fill: PT[p.pt].q < 0 ? '--neg' : '--pos', c: '--ink' });
      g.textPx(12, 22, PT[p.pt].n + '  ' + o.res, { a: 'left', fs: 13, b: true, c: o._hit ? '--bad' : '--ink' });
      g.textPx(12, 40, 'ภาพแสดงช้ากว่าจริงมาก (เวลาจริง ' + fmt(o.t) + ' s)', { a: 'left', fs: 11, c: '--muted' });
    }
  },
  three: {
    cam(p) { const s = Math.max(p.L, p.d * 2); return { pos: [p.L * 0.3, s * 0.45, s * 1.1], target: [p.L * 0.6, 0, 0] }; },
    build(T, p, o) {
      const d = p.d, L = p.L, D = Math.max(2, d * 1.2), th = d * 0.08 + 0.1;
      const top = T.box(L, th, D, p.V >= 0 ? '--pos' : '--neg'); top.position.set(L / 2, d / 2 + th / 2, 0);
      const bot = T.box(L, th, D, p.V >= 0 ? '--neg' : '--pos'); bot.position.set(L / 2, -d / 2 - th / 2, 0);
      T.label('แผ่น ' + (p.V >= 0 ? '+' : '−'), '--ink', { pos: [L / 2, d / 2 + th + 0.3, 0] });
      const dir = p.V >= 0 ? -1 : 1; for (let x = L * 0.1; x < L; x += L / 5) for (let z = -D * 0.35; z <= D * 0.36; z += D * 0.35) T.vec('--muted', null, { kind: 'v', r: 0.02 * Math.max(1, d / 4), top: false, opacity: 0.45 }).set([x, -dir * d * 0.42, z], [0, dir * d * 0.84, 0]);
      const o3 = { r: 0.03 * Math.max(1, d / 4), pad: 0.2 };
      return { pt: T.sphere(0.08 * Math.max(1, d / 4), PT[p.pt].q < 0 ? '--neg' : '--pos'), tr: T.trail('--c1', 3000), aF: T.vec('--c4', 'F = qE', o3), aV: T.vec('--c1', 'v', Object.assign({ kind: 'v' }, o3)) };
    },
    update(ob, st, p, o) {
      ob.pt.position.set(st.x, st.y, 0); if (st.t === 0) ob.tr.clear(); ob.tr.push([st.x, st.y, 0]);
      const inside = st.x > 0 && st.x <= p.L, s = Math.sign(o._a) || 1, F = Math.min(p.d * 0.35, 1.2);
      inside ? ob.aF.set([st.x, st.y, 0.15], [0, s * F, 0], 'F = qE') : ob.aF.hide();
      const vy = inside ? Math.tan(Math.atan2(2 * st.y, Math.max(st.x, 1e-6))) : (st.x > p.L ? Math.tan(o.ang * RAD) : 0), n = Math.hypot(1, vy), Lv = Math.min(p.L * 0.2, 1.5);
      ob.aV.set([st.x, st.y, -0.15], [Lv / n, vy * Lv / n, 0], 'v');
    }
  },
  notes: ['อิเล็กตรอนเบนเข้าหาแผ่นบวก โปรตอนเบนเข้าหาแผ่นลบ', 'โปรตอนมวลมากกว่าอิเล็กตรอนเกือบ 2000 เท่า ที่ความเร็วเท่ากันจึงเบนน้อยกว่ามาก', 'ระยะเบนแปรผกผันกับ v₀² ยิงเร็วขึ้น 2 เท่า เบนลดลง 4 เท่า', 'หลังออกจากแผ่นไม่มีแรง อนุภาคเคลื่อนที่เป็นเส้นตรง']
});

// ---------- 3 วงจรตัวต้านทาน ----------
function circuit(p) {
  const els = p.els.map(e => { const Rq = e.R2 > 0 ? e.R1 * e.R2 / (e.R1 + e.R2) : e.R1; return Object.assign({ Rq }, e); });
  const Rext = els.reduce((s, e) => s + e.Rq, 0), I = p.emf / (Rext + p.r);
  els.forEach(e => { e.V = I * e.Rq; e.I1 = e.V / e.R1; e.I2 = e.R2 > 0 ? e.V / e.R2 : 0; });
  return { els, Rext, I, Vt: I * Rext, P: I * I * Rext, Pr: I * I * p.r };
}
CASES.push({
  name: 'วงจรไฟฟ้า', aspect: 2, title: 'วงจรตัวต้านทานแบบอนุกรมผสมขนาน',
  desc: 'สร้างวงจรเอง แต่ละชิ้นในรายการต่ออนุกรมกัน และในแต่ละชิ้นใส่ตัวต้านทานตัวที่สองขนานได้ (ใส่ 0 ถ้าไม่ต้องการ) จุดเคลื่อนที่แสดงกระแสในแต่ละสาขา ยิ่งเร็วยิ่งมีกระแสมาก',
  formula: 'V = IR &nbsp;|&nbsp; อนุกรม R = R₁ + R₂ + … &nbsp;|&nbsp; ขนาน 1/R = 1/R₁ + 1/R₂ &nbsp;|&nbsp; I = ε/(R + r) &nbsp;|&nbsp; P = I²R = V²/R',
  params: [
    { id: 'emf', label: 'แรงเคลื่อนไฟฟ้า (ε)', unit: 'V', min: 0.5, max: 24, step: 0.5, def: 12 },
    { id: 'r', label: 'ความต้านทานภายใน (r)', unit: 'Ω', min: 0, max: 5, step: 0.1, def: 0.5 },
    { id: 'els', type: 'list', label: 'ชิ้นส่วนที่ต่ออนุกรม', item: 'ชิ้น', min: 1, max: 5, fields: [{ id: 'R1', label: 'R₁', unit: 'Ω', min: 0.5, max: 100, step: 0.5 }, { id: 'R2', label: 'R₂ ขนาน (0 = ไม่มี)', unit: 'Ω', min: 0, max: 100, step: 0.5 }], def: [{ R1: 4, R2: 0 }, { R1: 6, R2: 3 }, { R1: 2, R2: 0 }], add: () => ({ R1: 5, R2: 0 }) }
  ],
  presets: [{ label: 'อนุกรม 3 ตัว', set: { els: [{ R1: 2, R2: 0 }, { R1: 4, R2: 0 }, { R1: 6, R2: 0 }] } }, { label: 'ขนาน 2 ตัว', set: { els: [{ R1: 6, R2: 3 }] } }, { label: 'ไม่มีความต้านทานภายใน', set: { r: 0 } }],
  sens: false,
  outs(p) { const a = [{ id: 'Rext', name: 'ความต้านทานรวมภายนอก', unit: 'Ω' }, { id: 'I', name: 'กระแสรวม', unit: 'A' }, { id: 'Vt', name: 'ความต่างศักย์ที่ขั้วแบตเตอรี่', unit: 'V' }, { id: 'P', name: 'กำลังที่วงจรภายนอก', unit: 'W' }]; (p.els || []).forEach((e, i) => { a.push({ id: 'V' + i, name: `ชิ้น ${i + 1}: V`, unit: 'V' }); a.push({ id: 'I' + i, name: `ชิ้น ${i + 1}: I ผ่าน R₁` + (e.R2 > 0 ? ' / R₂' : ''), unit: 'A' }); }); return a; },
  compute(p) { const c = circuit(p), o = { Rext: c.Rext, I: c.I, Vt: c.Vt, P: c.P, _c: c }; c.els.forEach((e, i) => { o['V' + i] = e.V; o['I' + i] = e.R2 > 0 ? `${fmt(e.I1)} / ${fmt(e.I2)}` : e.I1; }); return o; },
  sim: {
    dt: 1 / 120,
    init() { return { ph: 0 }; },
    step(st, dt) { st.ph += dt; if (st.t > 3600) st.done = true; },
    view(p) { const n = p.els.length; return { x0: -1.7, x1: n * 2.4 + 1.0, y0: -1.2, y1: 2.6 }; },
    draw(g, st, p, o) {
      const c = o._c, n = c.els.length, W = n * 2.4 + 0.6, top = 1.6, bot = -0.6, Imax = Math.max(1e-9, c.I, ...c.els.map(e => Math.max(e.I1, e.I2)));
      const wire = (pts, I) => { g.path(pts, { c: '--ink', w: 2 }); const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } const sp = 0.35, off = (st.ph * I / Imax * 1.6) % sp; for (let s = off; s < tot; s += sp) { let k = 0, r = s; while (k < L.length && r > L[k]) { r -= L[k]; k++; } if (k >= L.length) break; const f = r / L[k], x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f; g.circle(x, y, 3, { px: true, fill: '--c5', c: 'none' }); } };
      const res = (x1, x2, y, R, lab) => { const a = x1 + (x2 - x1) * 0.25, b = x2 - (x2 - x1) * 0.25; g.rect(a, y - 0.16, b - a, 0.32, { fill: '--block2', c: '--ink', w: 1.5 }); g.text((a + b) / 2, y, R + ' Ω', { fs: 11, b: true, base: 'middle' }); if (lab) g.text((a + b) / 2, y + 0.3, lab, { fs: 10, c: '--muted' }); };
      // แบตเตอรี่ด้านซ้าย
      wire([[0, top], [0, 0.75]], c.I); wire([[0, 0.35], [0, bot]], c.I); g.line(-0.3, 0.75, 0.3, 0.75, { w: 3 }); g.line(-0.16, 0.55, 0.16, 0.55, { w: 5 }); g.text(-0.4, 0.65, 'ε ' + p.emf + ' V', { a: 'right', fs: 12, b: true, base: 'middle' }); g.text(-0.4, 0.4, 'r ' + p.r + ' Ω', { a: 'right', fs: 10, c: '--muted', base: 'middle' });
      g.line(0, 0.55, 0, 0.35, { w: 2 });
      c.els.forEach((e, i) => {
        const x1 = i * 2.4, x2 = x1 + 2.4;
        if (e.R2 > 0) { const y1 = top + 0.45, y2 = top - 0.45; wire([[x1, top], [x1 + 0.2, top], [x1 + 0.2, y1], [x2 - 0.2, y1], [x2 - 0.2, top], [x2, top]], e.I1); wire([[x1 + 0.2, top], [x1 + 0.2, y2], [x2 - 0.2, y2], [x2 - 0.2, top]], e.I2); res(x1 + 0.2, x2 - 0.2, y1, e.R1, fmt(e.I1) + ' A'); res(x1 + 0.2, x2 - 0.2, y2, e.R2, fmt(e.I2) + ' A'); }
        else { wire([[x1, top], [x2, top]], e.I1); res(x1, x2, top, e.R1, fmt(e.I1) + ' A'); }
        g.text((x1 + x2) / 2, top - (e.R2 > 0 ? 0.95 : 0.45), 'V = ' + fmt(e.V) + ' V', { fs: 11, c: '--c2', b: true });
      });
      wire([[n * 2.4, top], [W, top], [W, bot], [0, bot]], c.I);
      g.vec(W / 2, bot, 30, 0, { px: true, c: '--c1', w: 2.5, label: 'I = ' + fmt(c.I) + ' A' }); g.vec(W / 2, bot, 0, 0, {});
      g.text(W / 2, bot - 0.45, 'จุดสีส้มแสดงทิศกระแสสมมติ (ออกจากขั้วบวก)', { fs: 10, c: '--muted' });
    }
  },
  notes: ['ต่ออนุกรม กระแสเท่ากันทุกตัว ความต่างศักย์แบ่งตามขนาดความต้านทาน', 'ต่อขนาน ความต่างศักย์เท่ากัน กระแสแยกไปทางที่ความต้านทานน้อยมากกว่า', 'มีความต้านทานภายใน ความต่างศักย์ที่ขั้วน้อยกว่า ε เพราะเสียไป Ir ในแบตเตอรี่', 'ลองเพิ่มชิ้นส่วนหรือใส่ R₂ ให้ขนานเพื่อสร้างโจทย์เอง']
});

// ---------- 4 ตัวเก็บประจุ RC ----------
CASES.push({
  name: 'อัดและคายประจุ RC', aspect: 2.2, title: 'การอัดและคายประจุของตัวเก็บประจุ',
  desc: 'ต่อตัวเก็บประจุกับแบตเตอรี่ผ่านตัวต้านทานเพื่ออัดประจุ แล้วสับสวิตช์ให้คายประจุ ดูความต่างศักย์และกระแสที่เปลี่ยนแบบเอกซ์โพเนนเชียล',
  formula: 'Q = CV &nbsp;|&nbsp; τ = RC &nbsp;|&nbsp; อัด: V<sub>C</sub> = ε(1 − e<sup>−t/τ</sup>) &nbsp;|&nbsp; คาย: V<sub>C</sub> = V₀e<sup>−t/τ</sup> &nbsp;|&nbsp; พลังงาน U = ½CV²',
  params: [
    { id: 'emf', label: 'แรงเคลื่อนไฟฟ้า', unit: 'V', min: 1, max: 24, step: 0.5, def: 9 },
    { id: 'R', label: 'ความต้านทาน', unit: 'kΩ', min: 1, max: 500, step: 1, def: 100 },
    { id: 'C', label: 'ความจุ', unit: 'µF', min: 1, max: 100, step: 1, def: 20 },
    { id: 'tsw', label: 'สับสวิตช์คายประจุเมื่อ t', unit: 's', min: 0.5, max: 30, step: 0.5, def: 8 }
  ],
  outs: [{ id: 'tau', name: 'ค่าคงตัวเวลา τ = RC', unit: 's' }, { id: 'Q', name: 'ประจุเมื่อเต็ม', unit: 'µC' }, { id: 'U', name: 'พลังงานเมื่อเต็ม', unit: 'mJ' }, { id: 'I0', name: 'กระแสเริ่มต้น', unit: 'mA' }],
  compute(p) { const tau = p.R * 1e3 * p.C * 1e-6; return { tau, Q: p.C * p.emf, U: 0.5 * p.C * 1e-6 * p.emf * p.emf * 1000, I0: p.emf / (p.R * 1e3) * 1000 }; },
  sim: {
    dt: 1 / 240,
    init() { return { V: 0, I: 0 }; },
    step(st, dt, p, o) { const R = p.R * 1e3, C = p.C * 1e-6; if (st.t < p.tsw) st.I = (p.emf - st.V) / R; else st.I = -st.V / R; st.V += st.I / C * dt; if (st.t > p.tsw + 6 * o.tau) st.done = true; },
    view() { return { x0: 0, x1: 11, y0: 0, y1: 5 }; },
    draw(g, st, p) {
      const ch = st.t < p.tsw;
      g.path([[1.5, 4], [5, 4]], { w: 2 }); g.path([[6, 4], [8.5, 4], [8.5, 1], [1.5, 1], [1.5, 4]], { w: 2 });
      g.rect(5, 3.8, 1, 0.4, { fill: '--block2', c: '--ink' }); g.text(5.5, 4.45, p.R + ' kΩ', { fs: 11 });
      g.line(8.2, 2.7, 8.8, 2.7, { w: 4 }); g.line(8.2, 2.3, 8.8, 2.3, { w: 4 }); g.text(9.0, 2.5, p.C + ' µF', { a: 'left', fs: 11, base: 'middle' }); g.rect(8.45, 2.32, 0.1, 0.36, { fill: '--panel', c: 'none' });
      const frac = clamp(st.V / p.emf, 0, 1); g.rect(8.25, 2.72, 0.5 * frac, 0.08, { fill: '--pos', c: 'none' }); g.rect(8.25, 2.2, 0.5 * frac, 0.08, { fill: '--neg', c: 'none' });
      // แบตเตอรี่และสวิตช์
      g.line(1.5, 2.9, 1.5, 4, { w: 2 }); if (ch) { g.line(1.2, 2.9, 1.8, 2.9, { w: 3 }); g.line(1.32, 2.7, 1.68, 2.7, { w: 5 }); g.text(1.1, 2.8, 'ε', { a: 'right', fs: 13, b: true, base: 'middle' }); g.line(1.5, 2.7, 1.5, 1, { w: 2 }); }
      else { g.line(1.5, 2.9, 1.5, 1, { w: 2, c: '--c3' }); g.text(1.1, 2.0, 'ลัดวงจรผ่านสวิตช์', { a: 'right', fs: 11, c: '--c3', base: 'middle' }); }
      g.vec(3.2, 4, (st.I > 0 ? 1 : -1) * Math.min(60, Math.abs(st.I) / (p.emf / (p.R * 1e3)) * 60), 0, { px: true, c: '--c1', w: 3, label: 'I' });
      g.textPx(12, 22, (ch ? 'กำลังอัดประจุ' : 'กำลังคายประจุ') + `   V_C = ${fmt(st.V)} V   I = ${fmt(st.I * 1000)} mA`, { a: 'left', fs: 13, b: true });
    }
  },
  plot: { series: [{ label: 'V_C', unit: 'V', c: '--c2', f: s => s.V }, { label: 'I', unit: 'mA', c: '--c1', f: s => s.I * 1000 }] },
  notes: ['ที่ t = τ อัดประจุได้ประมาณ 63% ของค่าเต็ม ที่ 5τ ถือว่าเต็ม', 'ตอนเริ่มอัด กระแสมากที่สุด เพราะตัวเก็บประจุยังไม่มีความต่างศักย์ต้าน', 'ตอนคายประจุ กระแสไหลทิศตรงข้ามกับตอนอัด (กราฟติดลบ)', 'R หรือ C มากขึ้น อัดและคายช้าลง']
});

// ---------- 5 ประจุในสนามแม่เหล็ก ----------
CASES.push({
  name: 'ประจุในสนามแม่เหล็ก', aspect: 16 / 9, title: 'อนุภาคมีประจุเคลื่อนที่ในสนามแม่เหล็ก (เส้นทางเกลียว)',
  desc: 'สนามแม่เหล็กมีทิศขึ้น อนุภาคเคลื่อนที่ทำมุมกับสนาม แรงแม่เหล็กตั้งฉากกับความเร็วเสมอ ทำให้วิ่งเป็นวงกลมในระนาบตั้งฉากกับ B และเลื่อนไปตามแนว B เป็นเกลียว ดู 3D',
  formula: 'F = qvB sin θ &nbsp;|&nbsp; r = mv sin θ/(qB) &nbsp;|&nbsp; คาบ T = 2πm/(qB) (ไม่ขึ้นกับความเร็ว) &nbsp;|&nbsp; ระยะเกลียว = v cos θ · T',
  params: [
    { id: 'q', label: 'ประจุ', unit: 'e', min: -3, max: 3, step: 1, def: 1 },
    { id: 'm', label: 'มวล', unit: 'u (มวลโปรตอน)', min: 0.001, max: 20, step: 0.001, def: 1 },
    { id: 'v', label: 'อัตราเร็ว', unit: '×10⁵ m/s', min: 0.1, max: 50, step: 0.1, def: 5 },
    { id: 'th', label: 'มุมระหว่าง v กับ B', unit: '°', min: 0, max: 180, step: 1, def: 70 },
    { id: 'B', label: 'สนามแม่เหล็ก B', unit: 'mT', min: 1, max: 500, step: 1, def: 50 }
  ],
  outs: [{ id: 'F', name: 'แรงแม่เหล็ก', unit: 'N' }, { id: 'r', name: 'รัศมีวงกลม', unit: 'cm' }, { id: 'T', name: 'คาบ', unit: 'µs' }, { id: 'pitch', name: 'ระยะเกลียว', unit: 'cm' }],
  compute(p) { const q = Math.abs(p.q) * 1.6e-19, m = p.m * 1.67e-27, v = p.v * 1e5, B = p.B / 1000, th = p.th * RAD; if (q === 0) return { F: 0, r: Infinity, T: Infinity, pitch: '—', _ok: false }; const r = m * v * Math.sin(th) / (q * B), T = 2 * Math.PI * m / (q * B); return { F: q * v * B * Math.sin(th), r: r * 100, T: T * 1e6, pitch: v * Math.cos(th) * T * 100, _ok: true, _r: r, _T: T }; },
  sim: {
    dt: 1 / 240,
    init() { return { ph: 0, z: 0, tr: [] }; },
    step(st, dt, p, o) { if (!o._ok) { st.done = true; return; } const w = 2 * Math.PI / 4 * Math.sign(p.q) * -1; st.ph += w * dt; st.z += (o.pitch / 4) * dt; st.tr.push([o.r * Math.cos(st.ph) - o.r, st.z, o.r * Math.sin(st.ph)]); if (st.tr.length > 3000) st.tr.shift(); if (st.t > 20) st.done = true; },
    view(p, o) { const R = Math.max(o.r, 0.5) * 1.3; return { x0: -R * 2.4, x1: R * 2.4, y0: -R * 1.35, y1: R * 1.35 }; },
    draw(g, st, p, o) {
      if (!o._ok) { g.textPx(12, 22, 'ประจุเป็นศูนย์ ไม่มีแรงแม่เหล็ก', { a: 'left', fs: 13, b: true }); return; }
      const R = o.r, cx = -R * 1.2; g.text(cx, R * 1.25, 'มองจากบนลงมา (B พุ่งออกจากจอ ⊙)', { fs: 11, c: '--muted' });
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) g.circle(cx + i * R * 0.55, j * R * 0.5, 3, { px: true, fill: '--muted', c: 'none' });
      g.circle(cx - R, 0, R, { c: '--line', dash: [4, 4], w: 1 });
      const x = cx - R + R * Math.cos(st.ph), y = R * Math.sin(st.ph); g.circle(x, y, 6, { px: true, fill: p.q > 0 ? '--pos' : '--neg', c: '--ink' });
      const s = Math.sign(p.q) * -1; g.vec(x, y, -Math.sin(st.ph) * 40 * s, Math.cos(st.ph) * 40 * s, { px: true, c: '--c2', w: 2.5, label: 'v' }); g.vec(x, y, -Math.cos(st.ph) * 35, -Math.sin(st.ph) * 35, { px: true, c: '--c4', w: 2.5, label: 'F' });
      const sx = R * 1.3; g.text(sx, R * 1.25, 'มองด้านข้าง (B ขึ้น)', { fs: 11, c: '--muted' }); g.vec(sx + R * 0.9, -R, 0, 60, { px: true, c: '--muted', w: 2, label: 'B' });
      const pts = st.tr.map(q => [sx + q[0] * 0.5 + R * 0.5, -R + ((q[1] / Math.max(1e-9, Math.abs(o.pitch) * 3)) % 1 + 1) % 1 * 2 * R * 0 + q[1] / Math.max(1, Math.abs(o.pitch) * 2.5) * R]);
      g.path(pts.filter(q => q[1] < R * 1.2 && q[1] > -R * 1.2), { c: '--c1', w: 1.5 });
    }
  },
  three: {
    cam(p, o) { const R = Math.max(o.r || 1, 0.5); return { pos: [R * 4, R * 3, R * 5], target: [-R, R * 1.5, 0] }; },
    build(T, p, o) { const R = Math.max(o.r || 1, 0.5); for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) T.vec('--muted', i === 2 && j === 2 ? 'B' : null, { kind: 'v', r: R * 0.008, top: false, opacity: 0.5 }).set([-R + i * R * 0.8, -R * 0.5, j * R * 0.8], [0, R * 4, 0]); return { ball: T.sphere(R * 0.06, p.q >= 0 ? '--pos' : '--neg'), tr: T.trail('--c1', 3000), aF: T.vec('--c4', 'F = qvB sinθ', { r: R * 0.015, pad: R * 0.15, ext: R * 0.6 }), aV: T.vec('--c2', 'v', { kind: 'v', r: R * 0.015, pad: R * 0.15 }), R }; },
    update(ob, st, p, o) { const q = st.tr[st.tr.length - 1]; if (!q) return; const R = ob.R, sc = R / Math.max(o.r, 1e-9), zz = q[1] / Math.max(1e-9, Math.abs(o.pitch) || 1) * R * 0.9; const P = [q[0] * sc, zz, q[2] * sc]; ob.ball.position.set(...P); if (st.tr.length < 2) ob.tr.clear(); ob.tr.push(P); ob.aF.set(P, [-(q[0] + o.r) / o.r * R * 0.5, 0, -q[2] / o.r * R * 0.5], 'F ' + fmt(o.F) + ' N');
      const w = 2 * Math.PI / 4 * Math.sign(p.q) * -1, d = [-o.r * Math.sin(st.ph) * w * sc, (o.pitch / 4) / Math.max(1e-9, Math.abs(o.pitch) || 1) * R * 0.9, o.r * Math.cos(st.ph) * w * sc], L = Math.hypot(...d); if (L > 1e-12) ob.aV.set(P, d.map(x => x / L * R * 0.7), 'v ' + fmt(p.v) + '×10⁵ m/s'); }
  },
  notes: ['θ = 90° ได้วงกลม θ = 0° หรือ 180° วิ่งตรงตามแนว B ไม่มีแรง มุมอื่นๆ ได้เกลียว', 'คาบไม่ขึ้นกับอัตราเร็ว อนุภาคที่เร็วกว่าวงกว้างกว่าแต่ใช้เวลาต่อรอบเท่ากัน (หลักของไซโคลตรอน)', 'ประจุบวกและลบวนคนละทิศ', 'แรงแม่เหล็กตั้งฉากกับความเร็วเสมอ จึงไม่ทำงาน อัตราเร็วคงที่']
});

// ---------- 6 การเหนี่ยวนำ ----------
CASES.push({
  name: 'แท่งเลื่อนบนราง', aspect: 2.2, title: 'แรงเคลื่อนไฟฟ้าเหนี่ยวนำจากแท่งโลหะเลื่อนบนราง',
  desc: 'แท่งโลหะเลื่อนบนรางในสนามแม่เหล็กที่พุ่งเข้าจอ ฟลักซ์ที่เพิ่มขึ้นเหนี่ยวนำกระแส และกระแสนั้นถูกแรงแม่เหล็กต้านการเคลื่อนที่ (กฎของเลนซ์) ถ้าออกแรงดึงคงที่ แท่งจะเข้าสู่ความเร็วปลาย',
  formula: 'ε = BLv &nbsp;|&nbsp; I = BLv/R &nbsp;|&nbsp; แรงต้าน F = BIL = B²L²v/R &nbsp;|&nbsp; ความเร็วปลาย v = FR/(B²L²)',
  params: [
    { id: 'B', label: 'สนามแม่เหล็ก', unit: 'T', min: 0.05, max: 2, step: 0.01, def: 0.5 },
    { id: 'L', label: 'ความยาวแท่ง (ระยะห่างราง)', unit: 'm', min: 0.1, max: 2, step: 0.01, def: 1 },
    { id: 'R', label: 'ความต้านทานวงจร', unit: 'Ω', min: 0.1, max: 20, step: 0.1, def: 2 },
    { id: 'm', label: 'มวลแท่ง', unit: 'kg', min: 0.05, max: 5, step: 0.05, def: 0.5 },
    { id: 'F', label: 'แรงดึงคงที่', unit: 'N', min: 0, max: 5, step: 0.05, def: 1 },
    { id: 'v0', label: 'ความเร็วต้น', unit: 'm/s', min: 0, max: 20, step: 0.1, def: 0 }
  ],
  outs: [{ id: 'vt', name: 'ความเร็วปลาย', unit: 'm/s' }, { id: 'et', name: 'ε ที่ความเร็วปลาย', unit: 'V' }, { id: 'It', name: 'กระแสที่ความเร็วปลาย', unit: 'A' }, { id: 'tau', name: 'ค่าคงตัวเวลา', unit: 's' }],
  compute(p) { const k = p.B * p.B * p.L * p.L / p.R; return { vt: p.F / k, et: p.B * p.L * p.F / k, It: p.F / (p.B * p.L), tau: p.m / k, _k: k }; },
  sim: {
    dt: 1 / 600,
    init(p) { return { x: 0.6, v: p.v0, e: 0, I: 0 }; },
    step(st, dt, p, o) { st.e = p.B * p.L * st.v; st.I = st.e / p.R; const a = (p.F - p.B * st.I * p.L) / p.m; st.v += a * dt; st.x += st.v * dt; if (st.t > Math.max(6 * o.tau, 3) || st.t > 60) st.done = true; },
    view(p) { return { x0: -0.6, x1: 6.2, y0: -0.4, y1: p.L + 0.8 }; },
    draw(g, st, p, o) {
      const L = p.L, xs = 0.6 + ((st.x - 0.6) % 5 + 5) % 5;
      for (let x = 0; x < 6; x += 0.45) for (let y = 0.15; y < L; y += 0.35) { g.text(x, y, '×', { fs: 12, c: '--muted', base: 'middle' }); }
      g.rect(0, 0, xs, L, { fill: '--c4', c: 'none', alpha: 0.12 });
      g.line(0, 0, 6, 0, { w: 3 }); g.line(0, L, 6, L, { w: 3 }); g.line(0, 0, 0, L, { w: 3 }); g.rect(-0.18, L * 0.3, 0.36, L * 0.4, { fill: '--block2', c: '--ink' }); g.text(-0.25, L / 2, 'R', { a: 'right', fs: 12, b: true, base: 'middle' });
      g.line(xs, -0.1, xs, L + 0.1, { c: '--c2', w: 6 });
      if (Math.abs(st.I) > 1e-6) { const s = 22 * Math.min(1, st.I / Math.max(1e-9, o.It)); g.vec(xs, L * 0.25, 0, s + 8, { px: true, c: '--c1', w: 2.5, label: 'I' }); g.vec(xs + 0.1, L * 0.5, -(p.B * st.I * p.L) / Math.max(p.F, 1e-9, p.B * st.I * p.L) * 50, 0, { px: true, c: '--c3', w: 2.5, label: 'F_B' }); }
      if (p.F > 0) g.vec(xs + 0.1, L * 0.8, 50, 0, { px: true, c: '--c4', w: 2.5, label: 'F ดึง' });
      g.textPx(12, 22, `v = ${fmt(st.v)} m/s   ε = ${fmt(st.e)} V   I = ${fmt(st.I)} A`, { a: 'left', fs: 13, b: true, bg: true });
      g.text(3, L + 0.55, 'สนามแม่เหล็กพุ่งเข้าจอ (×) พื้นที่สีม่วงคือพื้นที่ที่ฟลักซ์ผ่านวงจร', { fs: 11, c: '--muted' });
    }
  },
  plot: { series: [{ label: 'v', unit: 'm/s', c: '--c2', f: s => s.v }, { label: 'ε', unit: 'V', c: '--c4', f: s => s.e }, { label: 'I', unit: 'A', c: '--c1', f: s => s.I }] },
  three: {
    cam(p) { return { pos: [2.6, Math.max(2.6, p.L * 1.6), p.L + 3.2], target: [2.8, 0, -p.L / 2] }; },
    build(T, p, o) {
      const L = p.L; T.floor(10, { step: 0.5, y: -0.05 }).position.set(2.8, -0.05, -L / 2);
      const rail = z => { const r = T.cyl(0.03, 0.03, 6, '--ink'); r.rotation.z = Math.PI / 2; r.position.set(3, 0.03, z); }; rail(0); rail(-L);
      const end = T.cyl(0.03, 0.03, L, '--ink'); end.rotation.x = Math.PI / 2; end.position.set(0, 0.03, -L / 2);
      const res = T.box(0.25, 0.12, L * 0.4, '--block2'); res.position.set(0, 0.06, -L / 2); T.label('R', '--ink', { pos: [-0.3, 0.1, -L / 2] });
      for (let x = 0.3; x < 6; x += 0.8) for (let z = -L * 0.15; z > -L; z -= Math.max(0.35, L / 3)) T.vec('--muted', null, { kind: 'v', r: 0.012, top: false, opacity: 0.4 }).set([x, 0.9, z], [0, -0.7, 0]);
      T.label('B ชี้ลง', '--muted', { pos: [5.7, 1.05, -L / 2] });
      const flux = T.box(1, 0.004, L, '--c4', { opacity: 0.18, cast: false });
      const o3 = { r: 0.02, pad: 0.12 };
      return { rod: T.cyl(0.05, 0.05, L + 0.2, '--c2'), flux, aI: T.vec('--c1', 'I', Object.assign({ kind: 'v' }, o3)), aB: T.vec('--c3', 'F_B', o3), aF: T.vec('--c4', 'F ดึง', o3), aV: T.vec('--c6', 'v', Object.assign({ kind: 'v' }, o3)) };
    },
    update(ob, st, p, o) {
      const L = p.L, xs = 0.6 + ((st.x - 0.6) % 5 + 5) % 5; ob.rod.rotation.x = Math.PI / 2; ob.rod.position.set(xs, 0.06, -L / 2);
      ob.flux.scale.set(xs, 1, 1); ob.flux.position.set(xs / 2, 0.01, -L / 2);
      const Fb = p.B * st.I * p.L, k = 1.2 / Math.max(p.F, Fb, 1e-9);
      Math.abs(st.I) > 1e-6 ? ob.aI.set([xs, 0.15, -L * 0.2], [0, 0, -Math.min(L * 0.5, 0.25 + 0.4 * st.I / Math.max(1e-9, o.It))], 'I ' + fmt(st.I) + ' A') : ob.aI.hide();
      Fb > 1e-6 ? ob.aB.set([xs, 0.15, -L * 0.5], [-Fb * k, 0, 0], 'F_B = BIL ' + fmt(Fb) + ' N') : ob.aB.hide();
      p.F > 0 ? ob.aF.set([xs, 0.15, -L * 0.8], [p.F * k, 0, 0], 'F ดึง ' + fmt(p.F) + ' N') : ob.aF.hide();
      Math.abs(st.v) > 1e-3 ? ob.aV.set([xs, 0.5, -L / 2], [st.v * 0.3 / Math.max(o.vt, st.v, 1e-6) * 2, 0, 0], 'v ' + fmt(st.v) + ' m/s') : ob.aV.hide();
    }
  },
  notes: ['ทิศกระแสเหนี่ยวนำทำให้เกิดแรงต้านการเคลื่อนที่เสมอ (กฎของเลนซ์)', 'เมื่อแรงต้าน B²L²v/R เท่ากับแรงดึง แท่งเคลื่อนที่ด้วยความเร็วคงที่ (ความเร็วปลาย)', 'ลองตั้งแรงดึงเป็นศูนย์และให้ความเร็วต้น แท่งจะช้าลงจนหยุด พลังงานจลน์กลายเป็นความร้อนในตัวต้านทาน']
});

Lab.add('elec', CASES);
})();
