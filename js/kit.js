/* ชิ้นส่วนวาดที่ใช้ซ้ำหลายบท (2D และ 3D) */
(function () {
'use strict';
const K = {};
// ระยะห่างขีดสเกลที่อ่านง่าย (1, 2, 5 × 10^n)
K.niceStep = span => { const r = Math.pow(10, Math.floor(Math.log10(Math.max(1e-12, span)))), m = span / r; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * r; };
// แกนตัวเลขตามแนวนอน
K.axisX = (g, x0, x1, y, o = {}) => {
  const st = o.step || K.niceStep((x1 - x0) / (o.n || 8));
  g.line(x0, y, x1, y, { c: o.c || '--muted', w: 1 });
  for (let x = Math.ceil(x0 / st) * st; x <= x1 + 1e-9; x += st) {
    g.linePx(g.X(x), g.Y(y), g.X(x), g.Y(y) + 5, { c: '--muted', w: 1 });
    g.textPx(g.X(x), g.Y(y) + 17, (+x.toPrecision(6)) + (o.unit && Math.abs(x - (Math.ceil(x1 / st) * st - st)) < st / 2 ? '' : ''), { fs: 10, c: '--muted' });
  }
  if (o.label) g.textPx(g.X(x1), g.Y(y) + 30, o.label, { a: 'right', fs: 10, c: '--muted' });
};
K.axisY = (g, y0, y1, x, o = {}) => {
  const st = o.step || K.niceStep((y1 - y0) / (o.n || 6));
  g.line(x, y0, x, y1, { c: o.c || '--muted', w: 1 });
  for (let y = Math.ceil(y0 / st) * st; y <= y1 + 1e-9; y += st) {
    g.linePx(g.X(x) - 5, g.Y(y), g.X(x), g.Y(y), { c: '--muted', w: 1 });
    g.textPx(g.X(x) - 8, g.Y(y), String(+y.toPrecision(6)), { fs: 10, c: '--muted', a: 'right', base: 'middle' });
  }
  if (o.label) g.textPx(g.X(x) - 8, g.Y(y1) - 10, o.label, { a: 'right', fs: 10, c: '--muted' });
};
// รถยนต์ด้านข้าง (x = กึ่งกลางล้อ, y = พื้น, L = ความยาว)
K.car = (g, x, y, L, o = {}) => {
  const h = L * 0.32, r = L * 0.12, d = o.dir || 1, c = o.c || '--c2';
  g.path([[x - L / 2, y + r], [x + L / 2, y + r], [x + L / 2, y + r + h * 0.55], [x + d * L * 0.2, y + r + h * 0.6], [x + d * L * 0.05, y + r + h], [x - d * L * 0.32, y + r + h], [x - d * L * 0.45, y + r + h * 0.6], [x - L / 2, y + r + h * 0.55]], { close: true, fill: c, c: '--ink', w: 1.5 });
  [-0.3, 0.3].forEach(k => { g.circle(x + k * L, y + r, r, { fill: '--ink', c: 'none' }); g.circle(x + k * L, y + r, r * 0.45, { fill: '--muted', c: 'none' }); });
  if (o.label) g.text(x, y + r + h * 0.55, o.label, { fs: 12, b: true, c: '--panel', base: 'middle' });
};
// ลูกบอล
K.ball = (g, x, y, r, o = {}) => { g.circle(x, y, r, { fill: o.c || '--c1', c: '--ink', w: 1.5 }); if (o.label) g.text(x, y, o.label, { fs: 11, b: true, base: 'middle', c: '--panel' }); };
// สเกลลูกศรแรง: คืนฟังก์ชันแปลงขนาดแรง → พิกเซล ให้แรงที่ใหญ่สุดยาว maxPx
K.forceScale = (forces, maxPx = 80) => { const m = Math.max(1e-9, ...forces.map(Math.abs)); return f => f / m * maxPx; };
// ลูกศรแรงจากจุด (x,y) ทิศ ang (rad) ความยาวเป็นพิกเซล
K.force = (g, x, y, ang, lenPx, label, c) => { if (Math.abs(lenPx) < 1) return; if (lenPx < 0) { ang += Math.PI; lenPx = -lenPx; } g.vec(x, y, lenPx * Math.cos(ang), lenPx * Math.sin(ang), { px: true, c: c || '--c1', w: 2.6, label, fs: 12 }); };
// เชือกผ่านจุด
K.rope = (g, pts, o = {}) => g.path(pts, { c: o.c || '--rope', w: o.w || 2 });

// ----- 3D -----
K.car3d = (T, c, L = 4) => {
  const grp = T.group(), body = T.box(L, L * 0.25, L * 0.45, c, { parent: grp }); body.position.y = L * 0.2;
  const top = T.box(L * 0.5, L * 0.2, L * 0.42, c, { parent: grp }); top.position.set(-L * 0.05, L * 0.42, 0);
  [[-0.3, 1], [0.3, 1], [-0.3, -1], [0.3, -1]].forEach(([a, b]) => { const w = T.cyl(L * 0.11, L * 0.11, L * 0.08, '--ink', { parent: grp }); w.rotation.x = Math.PI / 2; w.position.set(a * L, L * 0.11, b * L * 0.23); });
  return grp;
};
// รอก 3D (แกนหมุนตามแกน z) p.spin(มุม) หมุนล้อ
K.pulley3d = (T, R, x, y, z = 0, d = 0.12) => {
  const g = T.group(); g.position.set(x, y, z);
  const w = T.cyl(R, R, d, '--muted', { parent: g }); w.rotation.x = Math.PI / 2;
  const sp = T.box(R * 1.8, R * 0.18, d * 1.1, '--ink', { parent: g }), sp2 = T.box(R * 0.18, R * 1.8, d * 1.1, '--ink', { parent: g });
  const hub = T.cyl(R * 0.18, R * 0.18, d * 1.4, '--ink', { parent: g }); hub.rotation.x = Math.PI / 2;
  g.spin = a => { g.rotation.z = a; }; return g;
};
// เพดานหรือที่ยึด
K.ceil3d = (T, x0, x1, y, d = 1) => { const b = T.box(x1 - x0, 0.08, d, '--ink'); b.position.set((x0 + x1) / 2, y + 0.04, 0); return b; };
// ตั้งตำแหน่งกล่องให้ฐานแนบผิวเอียงมุม th (cx, cy คือจุดศูนย์กลางในภาพ 2D)
K.place3d = (m, cx, cy, th = 0, z = 0) => { m.position.set(cx, cy, z); m.rotation.set(0, 0, th); return m; };
// ตัวสุ่มที่กำหนด seed ได้ (ผลซ้ำเดิมเมื่อ seed เดิม)
K.rng = seed => { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
K.gauss = r => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
// เส้นโค้งเรียบผ่านจุด (Catmull-Rom) พร้อมความยาวสะสม ใช้กับรางเลื่อน
K.track = (ctrl, per = 40) => {
  const P = ctrl.map(c => [c.x, c.y]), n = P.length, pts = [];
  const get = i => P[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      pts.push([0, 1].map(d => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  pts.push(P[n - 1].slice());
  const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const T = { pts, S, L: S[S.length - 1] };
  // ตำแหน่ง มุม และความโค้งที่ระยะ s ตามราง
  T.at = s => {
    s = Math.max(0, Math.min(T.L, s)); let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; S[m] <= s ? lo = m : hi = m; }
    const f = (s - S[lo]) / Math.max(1e-12, S[hi] - S[lo]), a = pts[lo], b = pts[hi];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const i0 = Math.max(0, lo - 2), i1 = Math.min(pts.length - 1, hi + 2);
    const a0 = Math.atan2(pts[i0 + 1][1] - pts[i0][1], pts[i0 + 1][0] - pts[i0][0]), a1 = Math.atan2(pts[i1][1] - pts[i1 - 1][1], pts[i1][0] - pts[i1 - 1][0]);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, ang, k: da / Math.max(1e-9, S[i1] - S[i0]) };
  };
  // ระยะตามรางที่ใกล้จุด (x,y) ที่สุด
  T.nearest = (x, y) => { let best = 0, bd = Infinity; pts.forEach((q, i) => { const d = (q[0] - x) ** 2 + (q[1] - y) ** 2; if (d < bd) { bd = d; best = i; } }); return S[best]; };
  return T;
};
Lab.kit = K;
})();
