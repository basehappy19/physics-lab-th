/* บทที่ 4 สมดุลกล */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const G = 9.8;
const CASES = [];

// ---------- 1 คานแก้ไขได้ ----------
const STYPES = [['pin', 'จุดหมุน'], ['roller', 'จุดรองรับล่าง'], ['rope', 'เชือกแขวน'], ['spring', 'สปริงล่าง'], ['springU', 'สปริงแขวน']];
const TNAME = Object.fromEntries(STYPES);
const oneWay = t => t === 'roller' || t === 'rope';     // ให้แรงขึ้นได้อย่างเดียว
const isSpring = t => t === 'spring' || t === 'springU';
const RIGID = 1e8;
// แก้สมการสมดุลของคานแข็งบนจุดรองรับยืดหยุ่น (y = y0 + θx) พร้อมตัดจุดรองรับที่ต้องดึงลงออก
function solveBeam(p) {
  const W = [{ x: p.L / 2, w: p.mb * G, beam: true }].concat(p.loads.map(l => ({ x: Math.min(l.x, p.L), w: l.m * G })));
  const Wt = W.reduce((s, q) => s + q.w, 0), M = W.reduce((s, q) => s + q.w * q.x, 0), xcg = Wt > 0 ? M / Wt : p.L / 2;
  const S = p.sup.map((s, i) => ({ i, type: s.type, x: Math.min(s.x, p.L), k: isSpring(s.type) ? s.k : RIGID, on: true, F: 0 }));
  let ok = false, y0 = 0, th = 0;
  for (let it = 0; it < 12; it++) {
    const A = S.filter(s => s.on);
    let a = 0, b = 0, c = 0; A.forEach(s => { a += s.k; b += s.k * s.x; c += s.k * s.x * s.x; });
    const det = a * c - b * b;
    if (A.length === 0 || Math.abs(det) < 1e-9 * Math.max(1, a * c)) {
      // จุดรองรับจุดเดียว (หรือไม่มี) สมดุลได้เฉพาะเมื่อจุดศูนย์ถ่วงอยู่ตรงจุดนั้นพอดี
      if (A.length >= 1 && A.every(s => Math.abs(s.x - A[0].x) < 1e-9) && Math.abs(xcg - A[0].x) < 1e-3) { const kk = a; y0 = -Wt / kk; th = 0; A.forEach(s => { s.F = Wt * s.k / kk; }); ok = true; }
      break;
    }
    y0 = (-Wt * c + M * b) / det; th = (-M * a + Wt * b) / det;
    A.forEach(s => { s.F = -s.k * (y0 + th * s.x); });
    const bad = A.filter(s => oneWay(s.type) && s.F < -1e-6).sort((u, v) => u.F - v.F)[0];
    if (!bad) { ok = true; break; }
    bad.on = false; bad.F = 0;
  }
  S.forEach(s => { if (!s.on) s.F = 0; s.dy = y0 + th * s.x; });
  if (!ok) S.forEach(s => { s.F = 0; });
  return { W, Wt, M, xcg, S, ok, y0, th };
}
function beamSupportsPos(p) { return p.sup; }
CASES.push({
  name: 'คานแก้ไขได้', aspect: 2.1, title: 'คานกับน้ำหนัก จุดรองรับ เชือก และสปริง',
  desc: 'สร้างโจทย์คานเองได้ เพิ่มน้ำหนักวางตรงไหนก็ได้ เพิ่มจุดหมุน จุดรองรับ เชือกแขวน หรือสปริง ลากชิ้นส่วนในภาพเพื่อย้ายตำแหน่ง ระบบคำนวณแรงที่จุดรองรับทุกจุด และถ้าไม่สมดุลคานจะพลิกให้เห็น',
  formula: 'ΣF<sub>y</sub> = 0 &nbsp;|&nbsp; ΣM = 0 (โมเมนต์ = แรง × ระยะตั้งฉาก) &nbsp;|&nbsp; สปริง F = kx &nbsp;|&nbsp; จุดรองรับล่างและเชือกดึงได้ทางเดียว',
  params: [
    { type: 'head', label: 'คาน' },
    { id: 'L', label: 'ความยาวคาน (L)', unit: 'm', min: 1, max: 12, step: 0.1, def: 6 },
    { id: 'mb', label: 'มวลคาน (สม่ำเสมอ)', unit: 'kg', min: 0, max: 100, step: 0.5, def: 10 },
    { id: 'loads', type: 'list', label: 'น้ำหนักบนคาน', item: 'น้ำหนัก', min: 0, max: 8, fields: [{ id: 'x', label: 'ตำแหน่งจากปลายซ้าย', unit: 'm', min: 0, max: 12, step: 0.05 }, { id: 'm', label: 'มวล', unit: 'kg', min: 0.5, max: 200, step: 0.5 }], def: [{ x: 1.5, m: 20 }, { x: 4.8, m: 12 }], add: p => ({ x: p.L / 2, m: 10 }) },
    { id: 'sup', type: 'list', label: 'จุดรองรับ เชือก สปริง', item: 'จุดรองรับ', min: 0, max: 6, fields: [{ id: 'type', label: 'ชนิด', opts: STYPES }, { id: 'x', label: 'ตำแหน่งจากปลายซ้าย', unit: 'm', min: 0, max: 12, step: 0.05 }, { id: 'k', label: 'ค่าคงที่สปริง (ใช้กับสปริง)', unit: 'N/m', min: 100, max: 20000, step: 50 }], def: [{ type: 'pin', x: 0.5, k: 2000 }, { type: 'roller', x: 5.5, k: 2000 }], add: p => ({ type: 'spring', x: p.L * 0.75, k: 2000 }) },
    { type: 'head', label: 'การแสดงผล' },
    { id: 'arr', label: 'ลูกศรแรง', type: 'bool', def: 1 }
  ],
  presets: [
    { label: 'คานสองจุดรองรับ', set: { L: 6, mb: 10, loads: [{ x: 1.5, m: 20 }, { x: 4.8, m: 12 }], sup: [{ type: 'roller', x: 0.5, k: 2000 }, { type: 'roller', x: 5.5, k: 2000 }] } },
    { label: 'กระดานหก', set: { L: 6, mb: 8, loads: [{ x: 0.5, m: 30 }, { x: 5.2, m: 25 }], sup: [{ type: 'pin', x: 3, k: 2000 }] } },
    { label: 'แขวนด้วยเชือกสองเส้น', set: { L: 5, mb: 6, loads: [{ x: 3.8, m: 15 }], sup: [{ type: 'rope', x: 0.3, k: 2000 }, { type: 'rope', x: 4.2, k: 2000 }] } },
    { label: 'คานบนสปริงสามตัว', set: { L: 6, mb: 10, loads: [{ x: 4.5, m: 30 }], sup: [{ type: 'spring', x: 0.5, k: 3000 }, { type: 'spring', x: 3, k: 3000 }, { type: 'spring', x: 5.5, k: 3000 }] } },
    { label: 'ยื่นเลยจุดรองรับ (พลิก)', set: { L: 6, mb: 5, loads: [{ x: 5.8, m: 30 }], sup: [{ type: 'roller', x: 0.3, k: 2000 }, { type: 'roller', x: 3.5, k: 2000 }] } }
  ],
  outs(p, o) {
    const a = [{ id: 'Wt', name: 'น้ำหนักรวม', unit: 'N' }, { id: 'xcg', name: 'จุดศูนย์ถ่วงรวม (จากปลายซ้าย)', unit: 'm' }, { id: 'stat', name: 'สถานะ', unit: '' }];
    (p.sup || []).forEach((s, i) => a.push({ id: 'F' + i, name: `แรงที่${TNAME[s.type]} ${i + 1} (x = ${fmt(s.x)} m)`, unit: 'N' }));
    if (o && o._r && o._r.S.some(s => isSpring(s.type))) a.push({ id: 'tilt', name: 'คานเอียง', unit: '°' });
    return a;
  },
  compute(p) {
    const r = solveBeam(p), o = { Wt: r.Wt, xcg: r.xcg, stat: r.ok ? 'สมดุล' : (p.sup.length ? 'ไม่สมดุล คานพลิก' : 'ไม่มีจุดรองรับ'), tilt: Math.atan(r.th) * DEG, _r: r };
    r.S.forEach((s, i) => { o['F' + i] = r.ok ? s.F : 'พลิก'; });
    return o;
  },
  check(p, o) {
    const w = []; const r = o._r;
    p.loads.forEach((l, i) => { if (l.x > p.L) w.push(`น้ำหนัก ${i + 1} อยู่เลยปลายคาน จะคิดที่ปลายคาน`); });
    p.sup.forEach((s, i) => { if (s.x > p.L) w.push(`จุดรองรับ ${i + 1} อยู่เลยปลายคาน จะคิดที่ปลายคาน`); });
    r.S.forEach(s => { if (!s.on && r.ok) w.push(`${TNAME[s.type]} ${s.i + 1} ไม่รับแรง (${s.type === 'rope' ? 'เชือกหย่อน' : 'คานยกตัวพ้นจุดรองรับ'})`); });
    const rig = r.S.filter(s => s.on && !isSpring(s.type)); if (rig.length > 2 && r.ok) w.push('มีจุดรองรับแข็งเกิน 2 จุด (อินดีเทอร์มิเนต) แบบจำลองแบ่งแรงโดยคิดว่าจุดรองรับยุบตัวได้เล็กน้อยเท่ากัน');
    return w;
  },
  sim: {
    dt: 1 / 2000,
    init(p, o) {
      const r = o._r, Mt = r.Wt / G || 1, xc = p.L / 2;
      let I = p.mb * p.L * p.L / 12; p.loads.forEach(l => { I += l.m * Math.pow(Math.min(l.x, p.L) - xc, 2); });
      return { y: 0, th: 0, vy: 0, w: 0, Mt, I: Math.max(I, 0.06 * Mt * p.L * p.L), xcgU: r.xcg - xc, settle: 0 };
    },
    step(st, dt, p, o) {
      const xc = p.L / 2, c = Math.cos(st.th), s = Math.sin(st.th);
      let Fy = -st.Mt * G, Tq = -st.Mt * G * st.xcgU * c;
      const kA = 4e5, Mt = st.Mt;
      p.sup.forEach(sp => {
        const u = Math.min(sp.x, p.L) - xc, yy = st.y + u * s, vv = st.vy + u * c * st.w;
        const k = isSpring(sp.type) ? sp.k : kA, cd = 2 * 0.25 * Math.sqrt(k * Mt);
        let F = -k * yy - cd * vv; if (oneWay(sp.type) && F < 0) F = 0;
        Fy += F; Tq += F * u * c;
      });
      // พื้นและเพดาน (กันคานพลิกทะลุ)
      [-xc, xc].forEach(u => { const yy = st.y + u * s; if (yy < -1.15) { const F = 4e5 * (-1.15 - yy) - 2 * Math.sqrt(4e5 * Mt) * (st.vy + u * c * st.w) * 0.5; Fy += Math.max(0, F); Tq += Math.max(0, F) * u * c; } if (yy > 2.1) { const F = -4e5 * (yy - 2.1); Fy += F; Tq += F * u * c; } });
      st.vy += Fy / Mt * dt; st.w += Tq / st.I * dt; st.vy *= 0.9995; st.w *= 0.9995; st.y += st.vy * dt; st.th += st.w * dt;
      if (Math.abs(st.vy) < 1e-4 && Math.abs(st.w) < 1e-4) st.settle += dt; else st.settle = 0;
      if (st.settle > 0.6 || st.t > 12) st.done = true;
    },
    view(p) { return { x0: -1.2, x1: Math.max(p.L, 1) + 1.2, y0: -1.45, y1: 2.45 }; },
    draw(g, st, p, o) {
      const r = o._r, xc = p.L / 2, c = Math.cos(st.th), s = Math.sin(st.th), v = g.visible();
      const P = x => [xc + (x - xc) * c, st.y + (x - xc) * s];
      g.ground(v.x0, v.x1, -1.2);
      if (p.sup.some(q => q.type === 'rope' || q.type === 'springU')) { g.line(v.x0, 2.2, v.x1, 2.2, { w: 3 }); for (let x = Math.ceil(v.x0 * 4) / 4; x < v.x1; x += 0.25) g.line(x, 2.2, x + 0.15, 2.32, { c: '--muted', w: 1 }); }
      // จุดรองรับ
      p.sup.forEach((sp, i) => {
        const x = Math.min(sp.x, p.L), b = P(x), on = r.S[i] && r.S[i].on;
        if (sp.type === 'pin') { g.path([[x - 0.22, -1.2], [x + 0.22, -1.2], [b[0], b[1] - 0.06]], { close: true, fill: '--c6', c: '--ink' }); g.circle(b[0], b[1], 0.06, { fill: '--panel' }); }
        else if (sp.type === 'roller') { g.rect(x - 0.12, -1.2, 0.24, Math.max(0.02, 1.06), { fill: '--ground', c: '--ink' }); g.circle(x, -0.07, 0.07, { fill: '--panel', c: '--ink' }); if (r.ok && !on) g.text(x, -0.3, 'ไม่รับแรง', { fs: 10, c: '--bad' }); }
        else if (sp.type === 'rope') { g.line(x, 2.2, b[0], b[1] + 0.06, { c: on ? '--rope' : '--muted', w: 2, dash: on ? null : [4, 4] }); }
        else if (sp.type === 'spring') g.spring(x, -1.2, b[0], b[1] - 0.06, { n: 9 });
        else g.spring(x, 2.2, b[0], b[1] + 0.06, { n: 9 });
      });
      // คาน
      g.box(xc, st.y, p.L, 0.12, st.th, { fill: '--block2' });
      for (let x = 0; x <= p.L + 1e-9; x += 1) { const q = P(x); g.text(q[0], q[1] - 0.24, String(+x.toFixed(1)), { fs: 9, c: '--muted' }); }
      // น้ำหนัก
      p.loads.forEach((l, i) => {
        const x = Math.min(l.x, p.L), b = P(x), sz = 0.18 + 0.14 * Math.cbrt(l.m / 20);
        g.box(b[0] - s * (0.06 + sz / 2), b[1] + c * (0.06 + sz / 2), sz, sz, st.th, { fill: '--c2', label: '' });
        g.text(b[0] - s * (0.06 + sz), b[1] + c * (0.06 + sz) + 0.12, l.m + ' kg', { fs: 11, b: true });
      });
      // แรง
      if (p.arr && r.ok) {
        const all = r.W.map(q => q.w).concat(r.S.map(q => Math.abs(q.F))), k = 70 / Math.max(1e-9, ...all);
        r.W.forEach(q => { const b = P(q.x); K.force(g, b[0], b[1], -Math.PI / 2, q.w * k, q.beam ? 'W คาน' : '', '--c1'); });
        r.S.forEach((q, i) => { if (q.on && Math.abs(q.F) > 1e-6) { const b = P(q.x); K.force(g, b[0] + 0.1, b[1], Math.PI / 2, q.F * k, fmt(q.F) + ' N', '--c3'); } });
        const cg = P(r.xcg); g.circle(cg[0], cg[1], 6, { px: true, fill: '--panel', c: '--c4', w: 2 }); g.text(cg[0], cg[1] + 0.3, 'CG', { fs: 10, b: true, c: '--c4' });
      }
      g.textPx(12, 22, o.stat + (Math.abs(st.th) > 0.002 ? `  เอียง ${fmt(st.th * DEG)}°` : ''), { a: 'left', fs: 13, b: true, c: r.ok ? '--ink' : '--bad' });
    }
  },
  handles(p, o, st) {
    const xc = p.L / 2, c = Math.cos(st.th), s = Math.sin(st.th), P = x => [xc + (x - xc) * c, st.y + (x - xc) * s];
    const h = [];
    p.loads.forEach((l, i) => { const b = P(Math.min(l.x, p.L)); h.push({ id: 'l' + i, x: b[0], y: b[1] + 0.35, set: x => ({ ['loads.' + i + '.x']: clamp(x, 0, p.L) }) }); });
    p.sup.forEach((sp, i) => { const x = Math.min(sp.x, p.L), y = sp.type === 'rope' || sp.type === 'springU' ? 1.9 : -0.85; h.push({ id: 's' + i, x, y, set: xx => ({ ['sup.' + i + '.x']: clamp(xx, 0, p.L) }) }); });
    h.push({ id: 'L', x: P(p.L)[0], y: P(p.L)[1], set: x => ({ L: clamp(x, 1, 12) }) });
    return h;
  },
  extra(p, o) {
    const r = o._r; if (!r.ok) return null;
    const pv = r.S.find(s => s.on) || { x: 0 };
    const rows = r.W.map((q, i) => [q.beam ? 'น้ำหนักคาน' : 'น้ำหนัก ' + i, -q.w, q.x]).concat(r.S.filter(s => s.on).map(s => [`${TNAME[s.type]} ${s.i + 1}`, s.F, s.x]));
    let sum = 0;
    const html = `<p class="hint">คิดโมเมนต์รอบ x = ${fmt(pv.x)} m (ตำแหน่งจุดรองรับแรก) ทวนเข็มเป็นบวก</p><table><tr><th>แรง</th><th>ขนาด (N, ขึ้น +)</th><th>ระยะจากจุดหมุน (m)</th><th>โมเมนต์ (N·m)</th></tr>` +
      rows.map(([n, F, x]) => { const M = F * (x - pv.x); sum += M; return `<tr><td class="rowh">${n}</td><td>${fmt(F)}</td><td>${fmt(x - pv.x)}</td><td>${fmt(M)}</td></tr>`; }).join('') +
      `<tr class="hl"><td class="rowh">รวม</td><td>${fmt(rows.reduce((a, b) => a + b[1], 0))}</td><td></td><td>${fmt(Math.abs(sum) < 1e-6 ? 0 : sum)}</td></tr></table>`;
    return { title: 'ตารางแรงและโมเมนต์', html };
  },
  three: {
    cam(p) { return { pos: [p.L * 0.5 - p.L * 0.3, 2.6, p.L * 0.95 + 2], target: [p.L / 2, 0.2, 0] }; },
    build(T, p, o) {
      const r = o._r; T.floor(p.L + 6, { y: -1.2, step: 0.5 });
      const beam = T.group(); const bm = T.box(p.L, 0.12, 0.5, '--block2', { parent: beam }); bm.position.x = 0;
      const loads = p.loads.map(l => { const sz = 0.18 + 0.14 * Math.cbrt(l.m / 20); const b = T.box(sz, sz, sz, '--c2', { parent: beam }); b.position.set(Math.min(l.x, p.L) - p.L / 2, 0.06 + sz / 2, 0); T.label(l.m + ' kg', '--ink', { pos: [Math.min(l.x, p.L), 0.06 + sz + 0.2, 0] }); return b; });
      if (p.sup.some(q => q.type === 'rope' || q.type === 'springU')) { const ce = T.box(p.L + 2, 0.08, 1.2, '--ground'); ce.position.set(p.L / 2, 2.24, 0); }
      const parts = p.sup.map(sp => {
        const x = Math.min(sp.x, p.L);
        if (sp.type === 'pin') { const c = T.cyl(0.02, 0.25, 1.1, '--c6'); c.position.set(x, -0.65, 0); return null; }
        if (sp.type === 'roller') { const c = T.box(0.24, 1.06, 0.5, '--ground'); c.position.set(x, -0.67, 0); const rl = T.cyl(0.07, 0.07, 0.5, '--muted'); rl.rotation.x = Math.PI / 2; rl.position.set(x, -0.07, 0); return null; }
        if (sp.type === 'rope') return { kind: 'rope', x, l: T.line('--rope', { max: 2 }) };
        return { kind: sp.type, x, l: T.spring('--spring', { coils: 10, r: 0.1 }) };
      });
      const all = r.W.map(q => q.w).concat(r.S.map(q => Math.abs(q.F))), k = 1.3 / Math.max(1e-9, ...all), o3 = { r: 0.03, pad: 0.2 };
      const wA = r.W.map(q => ({ q, a: T.vec('--c1', (q.beam ? 'W คาน ' : 'W ') + fmt(q.w) + ' N', o3) }));
      const sA = r.S.map(q => ({ q, a: T.vec('--c3', fmt(q.F) + ' N', o3) }));
      return { beam, parts, wA, sA, k, ok: r.ok };
    },
    update(ob, st, p) {
      const xc = p.L / 2; ob.beam.position.set(xc, st.y, 0); ob.beam.rotation.z = st.th;
      const P = x => [xc + (x - xc) * Math.cos(st.th), st.y + (x - xc) * Math.sin(st.th), 0.32];
      ob.wA.forEach(({ q, a }) => ob.ok ? a.set(P(q.x), [0, -q.w * ob.k, 0]) : a.hide());
      ob.sA.forEach(({ q, a }) => ob.ok && q.on && Math.abs(q.F) > 1e-6 ? a.set(P(q.x), [0, q.F * ob.k, 0]) : a.hide());
      ob.parts.forEach(q => { if (!q) return; const y = st.y + (q.x - xc) * Math.sin(st.th), X = xc + (q.x - xc) * Math.cos(st.th); if (q.kind === 'rope') q.l.set([[q.x, 2.2, 0], [X, y + 0.06, 0]]); else if (q.kind === 'spring') q.l.set2([q.x, -1.2, 0], [X, y - 0.06, 0]); else q.l.set2([q.x, 2.2, 0], [X, y + 0.06, 0]); });
    }
  },
  notes: ['ลากกล่องน้ำหนักไปตามคาน ลากจุดวงกลมประด้านล่างหรือบนเพื่อย้ายจุดรองรับ ลากปลายขวาของคานเพื่อเปลี่ยนความยาว', 'จุดรองรับล่างดันขึ้นได้อย่างเดียว เชือกดึงขึ้นได้อย่างเดียว ถ้าคำนวณแล้วต้องการแรงทิศกลับ แสดงว่าคานยกตัวหรือเชือกหย่อน', 'ถ้าจุดศูนย์ถ่วงรวม (CG) อยู่นอกช่วงระหว่างจุดรองรับ คานจะพลิก', 'สปริงทำให้คานเอียงตามแรงที่แต่ละตัวรับ ลองตั้ง k ต่างกัน', 'ตารางโมเมนต์ด้านล่าง ผลรวมโมเมนต์เป็นศูนย์เมื่อสมดุล']
});

// ---------- 2 คานยื่นกับเชือกโยง ----------
function strut(p) {
  const b = p.beta * RAD, u = [Math.cos(b), Math.sin(b)];
  const Pc = [p.d * u[0], p.d * u[1]], A = [0, p.h], dv = [A[0] - Pc[0], A[1] - Pc[1]], dl = Math.hypot(dv[0], dv[1]), e = [dv[0] / dl, dv[1] / dl];
  const Wb = p.mb * G, Wl = p.m * G, Mw = -(Wb * (p.L / 2) * u[0] + Wl * p.x * u[0]);
  const mT = Pc[0] * e[1] - Pc[1] * e[0];
  const T = Math.abs(mT) < 1e-9 ? Infinity : -Mw / mT;
  const Tx = T * e[0], Ty = T * e[1], Hx = -Tx, Hy = Wb + Wl - Ty;
  return { T, Tx, Ty, Hx, Hy, H: Math.hypot(Hx, Hy), Ha: Math.atan2(Hy, Hx) * DEG, cab: Math.atan2(dv[1], -dv[0]) * DEG, Pc, A, u, e };
}
CASES.push({
  name: 'คานยื่นและเชือกโยง', title: 'คานติดบานพับที่ผนัง มีเชือกโยงและป้ายแขวน',
  desc: 'คานต่อกับผนังด้วยบานพับ ปลายด้านหนึ่งมีเชือกโยงไปยังผนัง ลากป้ายแขวน จุดผูกเชือกบนคาน หรือจุดยึดเชือกบนผนัง เพื่อดูแรงตึงเชือกและแรงที่บานพับ',
  formula: 'ΣM รอบบานพับ = 0 → T &nbsp;|&nbsp; ΣF<sub>x</sub> = 0 → H<sub>x</sub> = −T<sub>x</sub> &nbsp;|&nbsp; ΣF<sub>y</sub> = 0 → H<sub>y</sub> = W − T<sub>y</sub>',
  params: [
    { id: 'L', label: 'ความยาวคาน', unit: 'm', min: 1, max: 6, step: 0.1, def: 3 },
    { id: 'mb', label: 'มวลคาน', unit: 'kg', min: 0, max: 50, step: 0.5, def: 8 },
    { id: 'beta', label: 'มุมคานกับแนวระดับ (β)', unit: '°', min: -45, max: 60, step: 1, def: 0 },
    { id: 'm', label: 'มวลป้ายแขวน', unit: 'kg', min: 0, max: 100, step: 0.5, def: 20 },
    { id: 'x', label: 'ตำแหน่งป้ายจากบานพับ', unit: 'm', min: 0, max: 6, step: 0.05, def: 2.6 },
    { id: 'd', label: 'จุดผูกเชือกบนคาน', unit: 'm', min: 0.2, max: 6, step: 0.05, def: 3 },
    { id: 'h', label: 'ความสูงจุดยึดเชือกบนผนัง', unit: 'm', min: -2, max: 5, step: 0.05, def: 2 }
  ],
  outs: [{ id: 'T', name: 'แรงตึงเชือก (T)', unit: 'N' }, { id: 'cab', name: 'มุมเชือกกับคาน', unit: '°' }, { id: 'Hx', name: 'แรงบานพับแนวระดับ', unit: 'N' }, { id: 'Hy', name: 'แรงบานพับแนวดิ่ง', unit: 'N' }, { id: 'H', name: 'ขนาดแรงบานพับ', unit: 'N' }, { id: 'Ha', name: 'ทิศแรงบานพับ (จากแนวระดับ)', unit: '°' }],
  compute(p) { const r = strut(p); return { T: r.T > 0 ? r.T : 'เชือกต้องดัน (ใช้ไม่ได้)', cab: Math.abs(r.cab - p.beta), Hx: r.Hx, Hy: r.Hy, H: r.H, Ha: r.Ha, _r: r }; },
  check(p, o) { const w = []; if (p.x > p.L) w.push('ป้ายอยู่เลยปลายคาน'); if (p.d > p.L) w.push('จุดผูกเชือกเลยปลายคาน'); if (!(o._r.T > 0)) w.push('ตำแหน่งจุดยึดทำให้เชือกต้องดันคาน ซึ่งเชือกทำไม่ได้ ย้ายจุดยึดให้สูงกว่าคาน'); return w; },
  sim: {
    view(p) { return { x0: -1, x1: Math.max(p.L, 2) + 1, y0: Math.min(-1.6, p.h - 0.4, p.L * Math.sin(p.beta * RAD) - 1.4), y1: Math.max(p.h, p.L * Math.sin(p.beta * RAD), 1) + 0.6 }; },
    draw(g, st, p, o) {
      const r = o._r, u = r.u, v = g.visible(); g.wall(0, v.y0, v.y1, -1);
      const tip = [p.L * u[0], p.L * u[1]];
      g.line(0, 0, tip[0], tip[1], { c: '--block2', w: 10 }); g.line(0, 0, tip[0], tip[1], { c: '--ink', w: 1 });
      g.circle(0, 0, 0.07, { fill: '--panel', c: '--ink', w: 2 });
      g.line(r.Pc[0], r.Pc[1], r.A[0], r.A[1], { c: '--rope', w: 2.5 }); g.circle(r.A[0], r.A[1], 0.05, { fill: '--ink' });
      const lx = p.x * u[0], ly = p.x * u[1]; g.line(lx, ly, lx, ly - 0.5, { c: '--rope', w: 1.5 }); g.rect(lx - 0.35, ly - 0.95, 0.7, 0.45, { fill: '--c2', c: '--ink' }); g.text(lx, ly - 0.72, p.m + ' kg', { fs: 11, b: true, c: '--panel', base: 'middle' });
      if (r.T > 0) {
        const k = 80 / Math.max(r.T, r.H, (p.m + p.mb) * G);
        g.vec(r.Pc[0], r.Pc[1], r.Tx * k, r.Ty * k, { px: true, c: '--c3', w: 3, label: 'T ' + fmt(r.T) + ' N' });
        g.vec(0, 0, r.Hx * k, r.Hy * k, { px: true, c: '--c4', w: 3, label: 'H ' + fmt(r.H) + ' N' });
        K.force(g, p.L / 2 * u[0], p.L / 2 * u[1], -Math.PI / 2, p.mb * G * k, 'W คาน', '--c1');
        K.force(g, lx + 0.45, ly - 0.72, -Math.PI / 2, p.m * G * k, 'W ป้าย', '--c1');
      }
      g.dim(0, 0, r.Pc[0], r.Pc[1], 'd = ' + fmt(p.d) + ' m', { off: -22 });
    }
  },
  handles(p, o) { const r = o._r; return [{ id: 'x', x: p.x * r.u[0], y: p.x * r.u[1] - 0.72, set: (x, y) => ({ x: clamp(x * r.u[0] + (y + 0.72) * r.u[1], 0, p.L) }) }, { id: 'd', x: r.Pc[0], y: r.Pc[1], set: (x, y) => ({ d: clamp(x * r.u[0] + y * r.u[1], 0.2, p.L) }) }, { id: 'h', x: 0, y: p.h, set: (x, y) => ({ h: y }) }, { id: 'beta', x: p.L * r.u[0], y: p.L * r.u[1], set: (x, y) => ({ beta: clamp(Math.atan2(y, Math.max(0.05, x)) * DEG, -45, 60) }) }];
  },
  notes: ['เชือกยิ่งเกือบขนานกับคาน (มุมเล็ก) แรงตึงยิ่งมาก เพราะแขนของโมเมนต์สั้น', 'ย้ายป้ายเข้าใกล้ผนัง แรงตึงลดลง', 'แรงที่บานพับไม่จำเป็นต้องอยู่ตามแนวคาน ยกเว้นคานไม่มีน้ำหนักและมีแรงกระทำที่ปลายเท่านั้น', 'ลากจุดยึดเชือกบนผนัง ลากจุดผูกบนคาน ลากป้าย หรือลากปลายคานเพื่อเปลี่ยนมุม']
});

// ---------- 3 บันไดพาดผนัง ----------
function ladder(p) {
  const th = p.th * RAD, W1 = p.M * G, W2 = p.m * G, Wt = W1 + W2;
  const Mg = (W1 * p.L / 2 + W2 * p.s) * Math.cos(th);
  const N2 = Mg / (p.L * Math.sin(th) + p.muw * p.L * Math.cos(th)), f2 = p.muw * N2, N1 = Wt - f2, f1 = N2;
  return { N1, N2, f1, f2, need: f1 / N1, ok: f1 <= p.mus * N1 + 1e-12, fmax: p.mus * N1 };
}
CASES.push({
  name: 'บันไดพาดผนัง', title: 'บันไดพาดผนังกับแรงเสียดทาน',
  desc: 'ปรับมุมบันได มวลบันได มวลคน และตำแหน่งที่คนปีน ดูว่าแรงเสียดทานที่พื้นพอหรือไม่ ถ้าไม่พอ บันไดจะลื่นไถล',
  formula: 'ΣF<sub>x</sub>: f₁ = N₂ &nbsp;|&nbsp; ΣF<sub>y</sub>: N₁ + f₂ = W &nbsp;|&nbsp; ΣM รอบฐาน: N₂L sin θ + f₂L cos θ = Σ W·x cos θ &nbsp;|&nbsp; ไม่ลื่นเมื่อ f₁ ≤ μ₁N₁',
  params: [
    { id: 'th', label: 'มุมบันไดกับพื้น (θ)', unit: '°', min: 15, max: 85, step: 0.5, def: 60 },
    { id: 'L', label: 'ความยาวบันได', unit: 'm', min: 2, max: 10, step: 0.1, def: 5 },
    { id: 'M', label: 'มวลบันได', unit: 'kg', min: 1, max: 50, step: 0.5, def: 10 },
    { id: 'm', label: 'มวลคน', unit: 'kg', min: 0, max: 120, step: 1, def: 60 },
    { id: 's', label: 'ตำแหน่งคนตามบันไดจากพื้น', unit: 'm', min: 0, max: 10, step: 0.05, def: 3 },
    { id: 'mus', label: 'μ ที่พื้น', unit: '', min: 0, max: 1.2, step: 0.01, def: 0.4 },
    { id: 'muw', label: 'μ ที่ผนัง', unit: '', min: 0, max: 1, step: 0.01, def: 0 }
  ],
  presets: [{ label: 'ผนังลื่น θ = 60°', set: { th: 60, muw: 0, mus: 0.4 } }, { label: 'ปีนสูงจนลื่น', set: { th: 55, s: 4.8, mus: 0.35 } }, { label: 'มุมต่ำ ลื่นทันที', set: { th: 30, s: 1, mus: 0.4 } }],
  outs: [{ id: 'N1', name: 'N ที่พื้น', unit: 'N' }, { id: 'f1', name: 'แรงเสียดทานที่พื้นที่ต้องการ', unit: 'N' }, { id: 'fmax', name: 'แรงเสียดทานสูงสุดที่พื้นให้ได้', unit: 'N' }, { id: 'N2', name: 'N ที่ผนัง', unit: 'N' }, { id: 'need', name: 'μ ที่พื้นอย่างน้อย', unit: '' }, { id: 'st', name: 'ผล', unit: '' }],
  compute(p) { const r = ladder(Object.assign({}, p, { s: Math.min(p.s, p.L) })); return { N1: r.N1, f1: r.f1, fmax: r.fmax, N2: r.N2, need: r.need, st: r.ok ? 'ไม่ลื่น' : 'ลื่นไถล', _r: r }; },
  sim: {
    dt: 1 / 600,
    init(p) { return { th: p.th * RAD, w: 0 }; },
    step(st, dt, p, o) {
      const r = ladder(Object.assign({}, p, { th: st.th * DEG, s: Math.min(p.s, p.L) }));
      if (r.ok && st.w === 0) { if (st.t > 1) st.done = true; return; }
      const I = (p.M * p.L * p.L / 3 + p.m * p.s * p.s);
      const tq = (r.f1 - p.mus * r.N1) * p.L * Math.sin(st.th) * 0.9;
      st.w -= Math.max(0, tq) / I * dt * 3 + 0.0;
      st.th += st.w * dt; if (st.th < 0.05) { st.th = 0.05; st.done = true; }
    },
    view(p) { return { x0: -1.2, x1: p.L + 1.4, y0: -0.4, y1: p.L + 0.4 }; },
    draw(g, st, p, o) {
      const c = Math.cos(st.th), s = Math.sin(st.th), bx = p.L * c, v = g.visible();
      g.ground(-0.2, v.x1, 0); g.wall(0, 0, v.y1, -1);
      const B = [bx, 0], T = [0, p.L * s];
      g.line(B[0], B[1], T[0], T[1], { c: '--block2', w: 9 });
      for (let k = 1; k < p.L * 3; k++) { const t = k / (p.L * 3), X = B[0] - c * p.L * t, Y = s * p.L * t; g.line(X - s * 0.14, Y - c * 0.14, X + s * 0.14, Y + c * 0.14, { c: '--ink', w: 1.2 }); }
      const sp = Math.min(p.s, p.L), P = [bx - sp * c, sp * s];
      if (p.m > 0) { g.circle(P[0] + 0.25, P[1] + 0.95, 0.13, { fill: '--block2' }); g.line(P[0] + 0.25, P[1] + 0.82, P[0] + 0.2, P[1] + 0.35, { w: 3 }); g.line(P[0] + 0.2, P[1] + 0.35, P[0], P[1], { w: 3 }); g.line(P[0] + 0.25, P[1] + 0.7, P[0] - 0.05, P[1] + 0.55, { w: 3 }); }
      g.angle(bx, 0, 34, Math.PI - st.th, Math.PI, 'θ');
      const r = ladder(Object.assign({}, p, { th: st.th * DEG, s: sp })), k = 80 / ((p.M + p.m) * G);
      K.force(g, bx, 0, Math.PI / 2, r.N1 * k, 'N₁', '--c2'); K.force(g, bx, 0, Math.PI, r.f1 * k, 'f₁', '--c3');
      K.force(g, 0, p.L * s, 0, r.N2 * k, 'N₂', '--c2'); if (r.f2 > 0) K.force(g, 0, p.L * s, Math.PI / 2, r.f2 * k, 'f₂', '--c3');
      K.force(g, bx - p.L / 2 * c, p.L / 2 * s, -Math.PI / 2, p.M * G * k, 'W บันได', '--c1');
      g.textPx(12, 22, r.ok ? 'บันไดไม่ลื่น' : 'แรงเสียดทานไม่พอ บันไดลื่นไถล', { a: 'left', fs: 13, b: true, c: r.ok ? '--good' : '--bad' });
    }
  },
  handles(p) { const th = p.th * RAD, sp = Math.min(p.s, p.L); return [{ id: 's', x: p.L * Math.cos(th) - sp * Math.cos(th), y: sp * Math.sin(th), set: (x, y) => ({ s: clamp(((p.L * Math.cos(th) - x) * Math.cos(th) + y * Math.sin(th)), 0, p.L) }) }, { id: 'top', x: 0, y: p.L * Math.sin(th), set: (x, y) => ({ th: clamp(Math.asin(clamp(y / p.L, 0.25, 0.996)) * DEG, 15, 85) }) }]; },
  notes: ['คนปีนสูงขึ้น โมเมนต์รอบฐานเพิ่ม N₂ และแรงเสียดทานที่ต้องการเพิ่ม บันไดจึงลื่นง่ายขึ้นเมื่อปีนสูง', 'มุมบันไดยิ่งต่ำ ยิ่งต้องการแรงเสียดทานมาก', 'ผนังมีแรงเสียดทานช่วยลดแรงเสียดทานที่พื้นต้องการ', 'ลากคนขึ้นลงตามบันได หรือลากปลายบนเพื่อเปลี่ยนมุม แอนิเมชันการลื่นเป็นภาพประกอบ ไม่ได้จำลองพลศาสตร์ครบถ้วน']
});

// ---------- 4 ปมเชือกสามแรง ----------
CASES.push({
  name: 'ปมเชือกสามแรง', title: 'แรงตึงในเชือกสองเส้นที่แขวนวัตถุ',
  desc: 'ลากจุดยึดเชือกบนเพดานทั้งสองจุด หรือลากปมเชือก ดูแรงตึงแต่ละเส้นและรูปสามเหลี่ยมแรงที่ปิดพอดีเมื่อสมดุล',
  formula: 'T₁ cos α₁ = T₂ cos α₂ &nbsp;|&nbsp; T₁ sin α₁ + T₂ sin α₂ = mg &nbsp;|&nbsp; ทฤษฎีของลามี T₁/sin A = T₂/sin B = W/sin C',
  params: [
    { id: 'm', label: 'มวลที่แขวน', unit: 'kg', min: 0.5, max: 50, step: 0.5, def: 10 },
    { id: 'ax', label: 'จุดยึดซ้าย x', unit: 'm', min: -4, max: 0, step: 0.05, def: -2 },
    { id: 'bx', label: 'จุดยึดขวา x', unit: 'm', min: 0, max: 4, step: 0.05, def: 2.5 },
    { id: 'kx', label: 'ปมเชือก x', unit: 'm', min: -3.9, max: 3.9, step: 0.05, def: 0.5 },
    { id: 'ky', label: 'ปมเชือกต่ำกว่าเพดาน', unit: 'm', min: 0.1, max: 3, step: 0.05, def: 1.2 }
  ],
  outs: [{ id: 'T1', name: 'แรงตึงเชือกซ้าย (T₁)', unit: 'N' }, { id: 'T2', name: 'แรงตึงเชือกขวา (T₂)', unit: 'N' }, { id: 'a1', name: 'มุมเชือกซ้ายกับแนวระดับ', unit: '°' }, { id: 'a2', name: 'มุมเชือกขวากับแนวระดับ', unit: '°' }, { id: 'W', name: 'น้ำหนัก mg', unit: 'N' }],
  compute(p) {
    const kx = clamp(p.kx, p.ax + 0.01, p.bx - 0.01), a1 = Math.atan2(p.ky, kx - p.ax), a2 = Math.atan2(p.ky, p.bx - kx), W = p.m * G;
    const T1 = W * Math.cos(a2) / Math.sin(a1 + a2), T2 = W * Math.cos(a1) / Math.sin(a1 + a2);
    return { T1, T2, a1: a1 * DEG, a2: a2 * DEG, W, _k: kx };
  },
  sim: {
    view() { return { x0: -4.5, x1: 7.5, y0: -3.8, y1: 0.5 }; },
    draw(g, st, p, o) {
      const kx = o._k, K0 = [kx, -p.ky], W = o.W, k = 90 / Math.max(W, o.T1, o.T2);
      g.line(-4.4, 0, 4.4, 0, { w: 3 }); for (let x = -4.4; x < 4.4; x += 0.25) g.line(x, 0, x + 0.15, 0.12, { c: '--muted', w: 1 });
      g.line(p.ax, 0, K0[0], K0[1], { c: '--rope', w: 2.5 }); g.line(p.bx, 0, K0[0], K0[1], { c: '--rope', w: 2.5 }); g.line(K0[0], K0[1], K0[0], K0[1] - 0.6, { c: '--rope', w: 2 });
      g.rect(K0[0] - 0.3, K0[1] - 1.05, 0.6, 0.45, { fill: '--c2', c: '--ink' }); g.text(K0[0], K0[1] - 0.83, p.m + ' kg', { fs: 11, b: true, base: 'middle', c: '--panel' });
      g.circle(K0[0], K0[1], 0.06, { fill: '--ink' });
      const a1 = o.a1 * RAD, a2 = o.a2 * RAD;
      g.vec(K0[0], K0[1], -o.T1 * Math.cos(a1) * k, o.T1 * Math.sin(a1) * k, { px: true, c: '--c3', w: 3, label: 'T₁' });
      g.vec(K0[0], K0[1], o.T2 * Math.cos(a2) * k, o.T2 * Math.sin(a2) * k, { px: true, c: '--c4', w: 3, label: 'T₂' });
      g.vec(K0[0] + 0.5, K0[1] - 0.2, 0, -W * k, { px: true, c: '--c1', w: 3, label: 'W' });
      // สามเหลี่ยมแรง
      const ox = 5.4, oy = -0.6, s = 0.022 * 90 / Math.max(W, o.T1, o.T2) * 1.4;
      const p1 = [ox, oy], p2 = [ox, oy - W * s], p3 = [p2[0] + o.T1 * Math.cos(a1) * -1 * s * -1, p2[1] + 0];
      const q2 = [p1[0], p1[1] - W * s], q3 = [q2[0] - o.T1 * Math.cos(a1) * s, q2[1] + o.T1 * Math.sin(a1) * s];
      g.arrow(p1[0], p1[1], q2[0], q2[1], { c: '--c1', w: 2.5, label: 'W' }); g.arrow(q2[0], q2[1], q3[0], q3[1], { c: '--c3', w: 2.5, label: 'T₁' }); g.arrow(q3[0], q3[1], p1[0], p1[1], { c: '--c4', w: 2.5, label: 'T₂' });
      g.text(ox, 0.25, 'สามเหลี่ยมแรง (ปิดพอดี)', { fs: 11, c: '--muted' });
    }
  },
  handles(p) { return [{ id: 'a', x: p.ax, y: 0, set: x => ({ ax: clamp(x, -4, 0) }) }, { id: 'b', x: p.bx, y: 0, set: x => ({ bx: clamp(x, 0, 4) }) }, { id: 'k', x: clamp(p.kx, p.ax + 0.01, p.bx - 0.01), y: -p.ky, set: (x, y) => ({ kx: x, ky: clamp(-y, 0.1, 3) }) }]; },
  three: {
    cam() { return { pos: [1.5, 0.4, 7], target: [0, -1.4, 0] }; },
    build(T, p, o) {
      const ce = T.box(9, 0.1, 2, '--ground'); ce.position.y = 0.05;
      const kx = o._k, K0 = [kx, -p.ky, 0];
      T.line('--rope', { pts: [[p.ax, 0, 0], K0] }); T.line('--rope', { pts: [[p.bx, 0, 0], K0] }); T.line('--rope', { pts: [K0, [kx, -p.ky - 0.6, 0]] });
      const b = T.box(0.6, 0.45, 0.6, '--c2'); b.position.set(kx, -p.ky - 0.82, 0);
      const k = 1.6 / Math.max(o.W, o.T1, o.T2), a1 = o.a1 * RAD, a2 = o.a2 * RAD;
      const Kf = [K0[0], K0[1], 0.15];
      T.vec('--c3', '', { r: 0.04 }).set(Kf, [-o.T1 * Math.cos(a1) * k, o.T1 * Math.sin(a1) * k, 0], 'T₁ ' + fmt(o.T1) + ' N');
      T.vec('--c4', '', { r: 0.04 }).set(Kf, [o.T2 * Math.cos(a2) * k, o.T2 * Math.sin(a2) * k, 0], 'T₂ ' + fmt(o.T2) + ' N');
      T.vec('--c1', '', { r: 0.04 }).set(Kf, [0, -o.W * k, 0], 'W ' + fmt(o.W) + ' N');
      return {};
    }
  },
  notes: ['เชือกที่ชันกว่า (ใกล้แนวดิ่ง) รับแรงมากกว่า', 'ยิ่งดึงเชือกให้ตึงเกือบเป็นเส้นตรง (ปมเชือกสูงขึ้น) แรงตึงยิ่งพุ่งสูงมาก แม้น้ำหนักเท่าเดิม', 'เวกเตอร์แรงสามแรงต่อหัวต่อหางกันได้รูปสามเหลี่ยมปิดเสมอเมื่อสมดุล', 'ลากจุดยึดและปมเชือกได้ทั้งสามจุด']
});

Lab.add('equil', CASES);
})();
