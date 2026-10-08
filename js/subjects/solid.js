/* บทที่ 12 ของแข็ง */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
const G = 9.8;
// มอดุลัสของยัง (Pa) ขีดจำกัดการแปรผันตรง ขีดจำกัดสภาพยืดหยุ่น (จุดคราก) ความเค้นสูงสุด (Pa) ความเครียดตอนขาด
const MATS = { steel: ['เหล็กกล้า', 200e9, 250e6, 280e6, 420e6, 0.2], cu: ['ทองแดง', 117e9, 60e6, 70e6, 220e6, 0.35], al: ['อะลูมิเนียม', 69e9, 90e6, 100e6, 160e6, 0.15], brass: ['ทองเหลือง', 100e9, 180e6, 200e6, 350e6, 0.25] };
const MOPT = Object.keys(MATS).map(k => [k, MATS[k][0]]);
// ความเครียดจากความเค้นตามเส้นโค้งจำลอง
function strainOf(M, s) {
  const [, E, sp, sy, su, eb] = M, ep = sp / E, ey = sy / E * 1.15, eu = eb * 0.7;
  if (s <= sp) return s / E;
  if (s <= sy) return ep + (ey - ep) * (s - sp) / (sy - sp);
  if (s <= su) return ey + (eu - ey) * Math.pow((s - sy) / (su - sy), 2);
  return Infinity;
}
function curvePts(M) { const pts = [], [, E, sp, sy, su, eb] = M; for (let i = 0; i <= 80; i++) { const s = su * i / 80; pts.push([strainOf(M, s), s]); } pts.push([eb, su * 0.82]); return pts; }
CASES.push({
  name: 'ลวดรับแรงดึง', aspect: 16 / 9, title: 'ความเค้น ความเครียด และมอดุลัสของยัง',
  desc: 'แขวนน้ำหนักที่ปลายลวด น้ำหนักค่อยๆ เพิ่มจนถึงค่าที่ตั้งไว้ ดูจุดบนกราฟความเค้น-ความเครียดเลื่อนผ่านช่วงยืดหยุ่น จุดคราก ช่วงพลาสติก จนลวดขาด เลือกวัสดุ ความยาว และเส้นผ่านศูนย์กลางได้',
  formula: 'ความเค้น σ = F/A &nbsp;|&nbsp; ความเครียด ε = ΔL/L₀ &nbsp;|&nbsp; มอดุลัสของยัง Y = σ/ε (ช่วงเส้นตรง) &nbsp;|&nbsp; ΔL = FL₀/(AY)',
  params: [
    { id: 'mat', label: 'วัสดุ', opts: MOPT, def: 'steel' },
    { id: 'L', label: 'ความยาวลวด', unit: 'm', min: 0.2, max: 5, step: 0.05, def: 2 },
    { id: 'd', label: 'เส้นผ่านศูนย์กลาง', unit: 'mm', min: 0.1, max: 5, step: 0.05, def: 1 },
    { id: 'm', label: 'มวลที่แขวน (สุดท้าย)', unit: 'kg', min: 0.1, max: 2000, step: 0.1, def: 15 },
    { id: 'ex', label: 'ขยายภาพการยืด', unit: 'เท่า', min: 1, max: 500, step: 1, def: 100 },
    { id: 'zoom', label: 'ซูมกราฟช่วงยืดหยุ่น', type: 'bool', def: 0 }
  ],
  presets: [{ label: 'ในช่วงยืดหยุ่น', set: { m: 15, d: 1, mat: 'steel' } }, { label: 'เลยจุดคราก', set: { m: 25, d: 1, mat: 'steel' } }, { label: 'ลวดขาด', set: { m: 40, d: 1, mat: 'steel' } }],
  outs: [{ id: 'A', name: 'พื้นที่หน้าตัด', unit: 'mm²' }, { id: 's', name: 'ความเค้นสุดท้าย', unit: 'MPa' }, { id: 'e', name: 'ความเครียด', unit: '' }, { id: 'dL', name: 'ลวดยืด', unit: 'mm' }, { id: 'mmax', name: 'มวลมากสุดก่อนขาด', unit: 'kg' }, { id: 'zone', name: 'ช่วง', unit: '' }],
  compute(p) {
    const M = MATS[p.mat], A = Math.PI * (p.d / 2000) ** 2, s = p.m * G / A, e = strainOf(M, s);
    const zone = s <= M[2] ? 'ยืดหยุ่น แปรผันตรง (กฎของฮุก)' : s <= M[3] ? 'ยืดหยุ่น ไม่แปรผันตรง' : s <= M[4] ? 'พลาสติก (ยืดถาวร)' : 'ขาด';
    return { A: A * 1e6, s: s / 1e6, e: isFinite(e) ? e : 'ขาด', dL: isFinite(e) ? e * p.L * 1000 : 'ขาด', mmax: M[4] * A / G, zone, _M: M, _A: A };
  },
  sim: {
    dt: 1 / 120,
    init() { return { f: 0, broke: false }; },
    step(st, dt, p, o) { if (st.broke) { st.fall = (st.fall || 0) + dt; if (st.fall > 1.2) st.done = true; return; } st.f = clamp(st.t / 5, 0, 1); const s = p.m * G * st.f / o._A; st.s = s; st.e = strainOf(o._M, s); if (!isFinite(st.e)) { st.broke = true; st.e = o._M[5]; } if (st.t > 5.5) st.done = true; },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 4 }; },
    draw(g, st, p, o) {
      const M = o._M, s = st.s || 0, e = st.e || 0, ext = Math.min(3, e * p.ex * 3.2);
      g.line(0.8, 8.0, 4.2, 8.0, { w: 4 }); const top = 8.0, len = 3.8, bot = top - len - ext;
      if (!st.broke) g.line(2.5, top, 2.5, bot, { c: '--muted', w: 1 + p.d * 1.2 });
      else { g.line(2.5, top, 2.5, top - len * 0.6, { c: '--muted', w: 1 + p.d * 1.2 }); }
      const by = st.broke ? bot - 0.9 - 4 * (st.fall || 0) ** 2 : bot - 0.9; const w = 0.6 + 0.4 * Math.cbrt(p.m / 50);
      g.box(2.5, Math.max(0.45, by + 0.45), w * 1.3, 0.9, 0, { fill: '--c2', label: fmt(p.m * st.f) + ' kg', fs: 11 });
      g.line(3.2, top - len, 4, top - len, { c: '--muted', dash: [3, 3], w: 1 }); if (ext > 0.02) g.dim(3.8, top - len, 3.8, bot, 'ΔL ×' + p.ex, { off: 0 });
      // กราฟ σ-ε
      const pts = curvePts(M), em = p.zoom ? M[3] / M[1] * 2.2 : M[5] * 1.05, sm = M[4] * 1.15, gx = 6.2, gy = 1, gw = 9.2, gh = 7.2, X = x => gx + x / em * gw, Y = y => gy + y / sm * gh;
      g.rect(gx, gy, gw, gh, { fill: '--bg', c: '--line' });
      { const c = g.ctx; c.save(); c.beginPath(); c.rect(g.X(gx), g.Y(gy + gh), gw * g.s, gh * g.s); c.clip(); g.path(pts.map(q => [X(q[0]), Y(q[1])]), { c: '--muted', w: 2 }); c.restore(); }
      [[M[2], 'ขีดจำกัดการแปรผันตรง'], [M[3], 'จุดคราก'], [M[4], 'ความเค้นสูงสุด']].forEach(([v, l]) => { g.line(gx, Y(v), gx + gw, Y(v), { c: '--line', dash: [3, 4], w: 1 }); g.text(gx + gw - 0.1, Y(v) + 0.12, l + ' ' + fmt(v / 1e6) + ' MPa', { a: 'right', fs: 10, c: '--muted' }); });
      const sE = Math.min(M[2], s), eE = sE / M[1]; g.line(X(0), Y(0), X(M[2] / M[1] * 3), Y(M[2] * 3), { c: '--c3', w: 1, dash: [4, 4], alpha: 0.5 });
      g.circle(X(Math.min(e, em)), Y(st.broke ? M[4] * 0.82 : s), 6, { px: true, fill: st.broke ? '--bad' : '--c1', c: '--ink' });
      g.text(gx + gw / 2, gy - 0.5, 'ความเครียด ε', { fs: 11, c: '--muted' }); g.text(gx - 0.15, gy + gh, 'σ', { a: 'right', fs: 13, b: true });
      g.text(gx + 0.2, gy + gh - 0.4, 'ความชันช่วงแรก = Y = ' + fmt(M[1] / 1e9) + ' GPa', { a: 'left', fs: 11, c: '--c3' });
      g.textPx(12, 22, st.broke ? 'ลวดขาด!' : s <= M[2] ? 'ช่วงยืดหยุ่น: เอาน้ำหนักออก ลวดกลับยาวเท่าเดิม' : s <= M[3] ? 'ยังยืดหยุ่น แต่ไม่แปรผันตรงแล้ว' : 'ช่วงพลาสติก: ลวดยืดถาวร', { a: 'left', fs: 13, b: true, c: st.broke ? '--bad' : '--ink' });
    }
  },
  plot: { x: { label: 'ε', unit: '×10⁻³', f: s => (s.e || 0) * 1000 }, series: [{ label: 'σ', unit: 'MPa', c: '--c1', f: s => (s.s || 0) / 1e6 }] },
  three: {
    cam() { return { pos: [1.2, -1.5, 3.2], target: [0, -1.5, 0] }; },
    build(T, p) { const c = T.box(1, 0.06, 0.5, '--ink'); c.position.y = 0.03; const wire = T.cyl(1, 1, 1, '--muted'); const box = T.box(0.45, 0.4, 0.45, '--c2'), o3 = { r: 0.015, pad: 0.1 }; return { wire, box, aT: T.vec('--c3', 'T', o3), aW: T.vec('--c1', 'mg', o3) }; },
    update(ob, st, p, o) { const ext = Math.min(1.2, (st.e || 0) * p.ex * 1.3), L = 2.2 + ext, r = 0.006 + p.d * 0.004; if (st.broke) { ob.wire.scale.set(r, 1.3, r); ob.wire.position.y = -0.65; ob.box.position.y = -L - 0.3 - 4 * (st.fall || 0) ** 2; } else { ob.wire.scale.set(r * (1 - ext * 0.15), L, r * (1 - ext * 0.15)); ob.wire.position.y = -L / 2; ob.box.position.y = -L - 0.2; }
      const F = p.m * G * (st.f || 0), k = 0.7 / (p.m * G), y = ob.box.position.y, z = 0.25;
      if (F > 1e-6 && !st.broke) { ob.aT.set([0.12, y + 0.2, z], [0, F * k, 0], 'T ' + fmt(F) + ' N'); ob.aW.set([-0.12, y, z], [0, -F * k, 0], 'mg ' + fmt(F) + ' N'); }
      else if (st.broke) { ob.aT.hide(); ob.aW.set([0, y, z], [0, -0.7, 0], 'mg (ตกอิสระ)'); } else { ob.aT.hide(); ob.aW.hide(); }
    }
  },
  notes: ['ในช่วงเส้นตรง ความเค้นแปรผันตรงกับความเครียด ความชันคือมอดุลัสของยัง ซึ่งเป็นสมบัติของวัสดุ ไม่ขึ้นกับขนาดลวด', 'ลวดยาวขึ้น 2 เท่า ยืดเพิ่ม 2 เท่า เส้นผ่านศูนย์กลางเพิ่ม 2 เท่า พื้นที่เพิ่ม 4 เท่า ยืดลดลง 4 เท่า', 'เลยจุดครากไปแล้ว เมื่อเอาน้ำหนักออก ลวดจะยาวกว่าเดิมถาวร', 'ค่าวัสดุเป็นค่าประมาณเพื่อการเรียนรู้']
});

// ---------- 2 กฎของฮุกกับสปริง ----------
CASES.push({
  name: 'กฎของฮุก', aspect: 16 / 9, title: 'แขวนน้ำหนักทีละก้อนบนสปริงและขีดจำกัดสภาพยืดหยุ่น',
  desc: 'แขวนตุ้มน้ำหนักเพิ่มทีละก้อนแล้วปลดออก ถ้าแรงไม่เกินขีดจำกัดสภาพยืดหยุ่น สปริงกลับยาวเท่าเดิม ถ้าเกิน สปริงจะยืดถาวร ดูกราฟแรงกับระยะยืดทั้งขาขึ้นและขาลง',
  formula: 'F = kx (ภายในขีดจำกัด) &nbsp;|&nbsp; ความชันกราฟ F-x = k &nbsp;|&nbsp; พลังงานในสปริง = ½kx² = พื้นที่ใต้กราฟ',
  params: [
    { id: 'k', label: 'ค่าคงที่สปริง', unit: 'N/m', min: 5, max: 500, step: 1, def: 50 },
    { id: 'mm', label: 'มวลตุ้มแต่ละก้อน', unit: 'g', min: 10, max: 1000, step: 10, def: 100 },
    { id: 'n', label: 'จำนวนก้อนสูงสุด', unit: 'ก้อน', min: 1, max: 12, step: 1, def: 8 },
    { id: 'Fe', label: 'ขีดจำกัดสภาพยืดหยุ่น', unit: 'N', min: 0.5, max: 50, step: 0.5, def: 6 }
  ],
  outs: [{ id: 'Fmax', name: 'แรงสูงสุด', unit: 'N' }, { id: 'xel', name: 'ระยะยืดที่ขีดจำกัด', unit: 'cm' }, { id: 'set', name: 'ยืดถาวรหลังปลดหมด', unit: 'cm' }],
  compute(p) { const Fmax = p.n * p.mm / 1000 * G, xel = p.Fe / p.k; const over = Math.max(0, Fmax - p.Fe); const set = over > 0 ? over / p.k * 1.5 : 0; return { Fmax, xel: xel * 100, set: set * 100, _set: set }; },
  sim: {
    dt: 1 / 60,
    init() { return { cnt: 0, x: 0, xmax: 0, perm: 0, tr: [[0, 0]] }; },
    step(st, dt, p, o) {
      const per = 0.7, i = Math.floor(st.t / per), n = p.n; st.cnt = i <= n ? i : Math.max(0, 2 * n - i);
      const F = st.cnt * p.mm / 1000 * G, up = i <= n;
      let x; if (F <= p.Fe && st.perm === 0) x = F / p.k; else if (up) { x = F <= p.Fe ? F / p.k : p.Fe / p.k + (F - p.Fe) / p.k * 2.5; st.perm = Math.max(st.perm, F > p.Fe ? (F - p.Fe) / p.k * 1.5 : 0); } else x = st.perm + F / p.k;
      st.x = x; st.F = F; if (!st.tr.length || st.tr[st.tr.length - 1][1] !== F) st.tr.push([x, F]);
      if (i > 2 * n + 1) st.done = true;
    },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 4 }; },
    draw(g, st, p, o) {
      const xmaxv = (p.Fe / p.k + Math.max(0, o.Fmax - p.Fe) / p.k * 2.5) * 1.2 || 0.1, sc = 5 / Math.max(xmaxv, 1e-6);
      g.line(0.8, 8.0, 4.2, 8.0, { w: 4 }); const L0 = 2.2, y1 = 8.0 - L0 - (st.x || 0) * sc * 0.6;
      g.spring(2.5, 8.0, 2.5, y1, { n: 14, amp: 10, c: st.perm > 0 ? '--bad' : '--spring' });
      for (let i = 0; i < (st.cnt || 0); i++) g.rect(2.1, y1 - 0.35 * (i + 1), 0.8, 0.3, { fill: '--c2', c: '--ink' });
      g.line(3.3, 8.0 - L0, 4.2, 8.0 - L0, { c: '--muted', dash: [3, 3], w: 1 }); g.text(4.25, 8.0 - L0, 'ยาวเดิม', { a: 'left', fs: 10, c: '--muted', base: 'middle' });
      const gx = 6.2, gy = 1, gw = 9.2, gh = 7.2, Fm = o.Fmax * 1.15, X = x => gx + x / xmaxv * gw, Y = F => gy + F / Fm * gh;
      g.rect(gx, gy, gw, gh, { fill: '--bg', c: '--line' }); g.line(gx, Y(p.Fe), gx + gw, Y(p.Fe), { c: '--bad', dash: [4, 4], w: 1 }); g.text(gx + gw - 0.1, Y(p.Fe) + 0.15, 'ขีดจำกัดสภาพยืดหยุ่น', { a: 'right', fs: 10, c: '--bad' });
      g.path(st.tr.map(q => [X(q[0]), Y(q[1])]), { c: '--c1', w: 2.5 }); st.tr.forEach(q => g.circle(X(q[0]), Y(q[1]), 3.5, { px: true, fill: '--c1', c: 'none' }));
      g.text(gx + gw, gy - 0.45, 'ระยะยืด x', { a: 'right', fs: 11, c: '--muted' }); g.text(gx - 0.15, gy + gh, 'F', { a: 'right', fs: 13, b: true });
      g.textPx(12, 22, `แขวน ${st.cnt || 0} ก้อน  F = ${fmt(st.F || 0)} N  ยืด ${fmt((st.x || 0) * 100)} cm` + (st.perm > 0 ? '  (เลยขีดจำกัด ยืดถาวร)' : ''), { a: 'left', fs: 13, b: true, c: st.perm > 0 ? '--bad' : '--ink' });
    }
  },
  three: {
    cam() { return { pos: [1.7, 1.7, 3.1], target: [0, 1.25, 0] }; },
    build(T, p, o) {
      K.ceil3d(T, -0.6, 0.6, 2.2, 0.5); T.floor(4, { step: 0.1 });
      const ruler = T.box(0.04, 2.1, 0.01, '--block2'); ruler.position.set(0.35, 1.15, 0); for (let i = 0; i <= 20; i++) { const t = T.box(i % 5 ? 0.02 : 0.04, 0.004, 0.012, '--ink'); t.position.set(0.33, 0.1 + i * 0.1, 0.006); }
      const L0 = 0.7, mark = T.box(0.16, 0.006, 0.02, '--muted'); mark.position.set(0.3, 2.2 - L0, 0); T.label('ยาวเดิม', '--muted', { pos: [0.55, 2.2 - L0, 0] });
      const n = Math.max(1, p.n), ms = []; for (let i = 0; i < n; i++) ms.push(T.cyl(0.08, 0.08, 0.05, '--c2'));
      const o3 = { r: 0.01, pad: 0.06 };
      return { L0, ms, spr: T.spring('--spring', { coils: 16, r: 0.05 }), hook: T.cyl(0.006, 0.006, 1, '--ink'), aS: T.vec('--c4', 'kx', o3), aW: T.vec('--c1', 'W', o3), xmaxv: (p.Fe / p.k + Math.max(0, o.Fmax - p.Fe) / p.k * 2.5) * 1.2 || 0.1, lab: T.label('', '--ink'), cBad: T.color('--bad'), cSpr: T.color('--spring') };
    },
    update(ob, st, p, o) {
      const sc = Math.min(1.0 / ob.xmaxv, 8), y1 = 2.2 - ob.L0 - (st.x || 0) * sc, n = st.cnt || 0;
      ob.spr.set2([0, 2.2, 0], [0, y1, 0]); ob.spr.material.color.copy(st.perm > 0 ? ob.cBad : ob.cSpr);
      ob.hook.scale.set(1, 0.06, 1); ob.hook.position.set(0, y1 - 0.03, 0);
      ob.ms.forEach((m, i) => { m.visible = i < n; m.position.set(0, y1 - 0.085 - i * 0.052, 0); });
      const F = st.F || 0, k = 0.5 / Math.max(o.Fmax, 1e-9);
      F > 1e-6 ? ob.aS.set([0.12, y1, 0.09], [0, F * k, 0], 'แรงสปริง ' + fmt(F) + ' N') : ob.aS.hide();
      F > 1e-6 ? ob.aW.set([-0.12, y1 - 0.06 - n * 0.026, 0.09], [0, -F * k, 0], 'W ' + fmt(F) + ' N') : ob.aW.hide();
      ob.lab.set(`ยืด ${fmt((st.x || 0) * 100)} cm` + (st.perm > 0 ? ' (ยืดถาวร)' : ''), [-0.35, y1, 0]);
    }
  },
  notes: ['ภายในขีดจำกัด จุดขาขึ้นและขาลงทับกันเป็นเส้นตรงเส้นเดียว', 'เลยขีดจำกัด สปริงยืดมากขึ้นผิดสัดส่วน และเมื่อปลดน้ำหนักหมดยังเหลือระยะยืดถาวร', 'ลด k (สปริงอ่อน) จะยืดมากกว่าภายใต้แรงเท่ากัน']
});

Lab.add('solid', CASES);
})();
