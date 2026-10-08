/* บทที่ 1 การคิดเชิงวิทยาศาสตร์ เทคโนโลยี และวิศวกรรม */
(function () {
'use strict';
const { fmt, clamp } = Lab.h, K = Lab.kit;
const CASES = [];
const fx = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);

// ---------- 1 เวอร์เนียร์คาลิปเปอร์ ----------
const VER = { '0.1': { n: 10, d: 1, lab: 1 }, '0.05': { n: 20, d: 2, lab: 2 }, '0.02': { n: 50, d: 2, lab: 5 } };
function vernier(p) {
  const lc = +p.lc, V = VER[p.lc], sp = (V.n - 1) / V.n, pos = p.w + p.z;   // ตำแหน่งขีดศูนย์เวอร์เนียร์
  const main = Math.floor(pos + 1e-9), n = Math.round((pos - main) / lc) % (V.n + 1);
  const read = main + n * lc;
  return { lc, V, sp, pos, main, n, read, corr: read - p.z };
}
CASES.push({
  name: 'เวอร์เนียร์คาลิปเปอร์', aspect: 2.2, title: 'การอ่านค่าเวอร์เนียร์คาลิปเปอร์',
  desc: 'ลากขากรรไกรเลื่อนหรือพิมพ์ความกว้างวัตถุ เลือกความละเอียดของเวอร์เนียร์ได้ 3 แบบ เปิดโหมดฝึกอ่านเพื่อซ่อนคำตอบ และกดสุ่มโจทย์ใหม่ได้',
  formula: 'ค่าที่อ่าน = สเกลหลัก (mm) + (ขีดเวอร์เนียร์ที่ตรงกัน × ค่าความละเอียด) &nbsp;|&nbsp; ค่าความละเอียด = 1 mm / จำนวนช่องเวอร์เนียร์ &nbsp;|&nbsp; ค่าจริง = ค่าที่อ่าน − ความคลาดเคลื่อนศูนย์',
  params: [
    { id: 'w', label: 'ความกว้างวัตถุ', unit: 'mm', min: 0, max: 120, step: 0.01, def: 23.45 },
    { id: 'lc', label: 'ความละเอียดเวอร์เนียร์', opts: [['0.1', '0.1 mm (10 ช่อง)'], ['0.05', '0.05 mm (20 ช่อง)'], ['0.02', '0.02 mm (50 ช่อง)']], def: '0.05' },
    { id: 'z', label: 'ความคลาดเคลื่อนศูนย์', unit: 'mm', min: -0.5, max: 0.5, step: 0.01, def: 0 },
    { id: 'quiz', label: 'โหมดฝึกอ่าน (ซ่อนคำตอบ)', type: 'bool', def: 0 }
  ],
  actions: [{ label: 'สุ่มโจทย์ใหม่', run(P) { const lc = +P.lc; P.w = +(Math.round((5 + Math.random() * 100) / lc) * lc).toFixed(2); } }],
  outs: [{ id: 'main', name: 'สเกลหลัก', unit: 'mm' }, { id: 'n', name: 'ขีดเวอร์เนียร์ที่ตรงกัน', unit: '' }, { id: 'read', name: 'ค่าที่อ่านได้', unit: 'mm' }, { id: 'corr', name: 'ค่าหลังแก้ความคลาดเคลื่อนศูนย์', unit: 'mm' }],
  compute(p) { const r = vernier(p), q = p.quiz; return { main: q ? '?' : r.main, n: q ? '?' : r.n, read: q ? '?' : fx(r.read, r.V.d), corr: q ? '?' : fx(r.corr, r.V.d), _r: r }; },
  sens: false,
  sim: {
    view(p, o) { const r = o._r, Lv = r.V.n * r.sp; return { x0: r.pos - 6, x1: r.pos + Lv + 6, y0: -19, y1: 10, pad: 6 }; },
    draw(g, st, p, o) {
      const r = o._r, v = g.visible(), V = r.V;
      // ตัวสเกลหลัก
      g.rect(v.x0 - 5, 0, v.x1 - v.x0 + 10, 8, { fill: '--block', c: '--ink', w: 1.5 });
      for (let x = Math.max(0, Math.floor(v.x0)); x <= v.x1; x++) {
        const h = x % 10 === 0 ? 3.6 : x % 5 === 0 ? 2.6 : 1.7, hl = x === r.main + r.n && !p.quiz;
        g.line(x, 0, x, h, { c: hl ? '--c1' : '--ink', w: hl ? 2.4 : 1.1 });
        if (x % 10 === 0) g.text(x, 5.2, String(x / 10), { fs: 13, b: true });
      }
      g.text(v.x1 - 1, 6.6, 'cm', { a: 'right', fs: 11, c: '--muted' });
      // เวอร์เนียร์
      const L = V.n * r.sp;
      g.rect(r.pos - 1.5, -6.5, L + 3, 6.5, { fill: '--panel', c: '--ink', w: 1.5 });
      for (let i = 0; i <= V.n; i++) {
        const x = r.pos + i * r.sp, hl = i === r.n && !p.quiz, h = i % V.lab === 0 ? 2.8 : 1.8;
        g.line(x, 0, x, -h, { c: hl ? '--c1' : '--ink', w: hl ? 2.4 : 1.1 });
        if (i % V.lab === 0) g.text(x, -4.6, String(i / V.lab * (p.lc === '0.02' ? 1 : 1)), { fs: 11 });
      }
      // ขากรรไกรและวัตถุ
      g.path([[r.pos - 1.5, -6.5], [r.pos - 1.5, -18], [r.pos + 2.5, -18], [r.pos + 4, -6.5]], { close: true, fill: '--panel', c: '--ink', w: 1.5 });
      if (v.x0 < 0) g.path([[-2, 0], [0, 0], [0, -18], [-4, -18]], { close: true, fill: '--block', c: '--ink', w: 1.5 });
      g.rect(Math.max(v.x0 - 2, 0), -16, p.w - Math.max(v.x0 - 2, 0), 8, { fill: '--block2', c: '--ink' });
      g.text(Math.max(v.x0 + 3, p.w - 4), -12, 'วัตถุ', { fs: 12, b: true, base: 'middle', a: 'right' });
      if (v.x0 > 0) g.text(v.x0 + 0.5, -17.5, '← ขากรรไกรคงที่อยู่ที่ 0 mm', { a: 'left', fs: 11, c: '--muted' });
      g.textPx(12, 20, p.quiz ? 'โหมดฝึกอ่าน: อ่านค่าเอง แล้วปิดโหมดเพื่อตรวจ' : `อ่านได้ ${r.main} + ${r.n} × ${p.lc} = ${fx(r.read, V.d)} mm`, { a: 'left', fs: 14, b: true, c: p.quiz ? '--accent' : '--ink' });
    }
  },
  handles(p, o) { const r = o._r; return [{ id: 'jaw', x: r.pos + 0.5, y: -12, set: x => ({ w: clamp(x - 0.5 - p.z, 0, 120) }) }]; },
  notes: ['หาขีดสเกลหลักที่อยู่ก่อนขีดศูนย์ของเวอร์เนียร์ จากนั้นหาขีดบนเวอร์เนียร์ที่ตรงกับขีดบนสเกลหลักพอดี (ขีดสีส้ม)', 'เวอร์เนียร์ 20 ช่องยาว 19 mm แต่ละช่องสั้นกว่า 1 mm อยู่ 0.05 mm นี่คือที่มาของค่าความละเอียด', 'ถ้าปิดขากรรไกรแล้วศูนย์ไม่ตรง (ความคลาดเคลื่อนศูนย์) ต้องลบค่านั้นออกจากค่าที่อ่านได้', 'ผลที่บันทึกควรมีทศนิยมตามความละเอียดของเครื่องมือ เช่น 23.45 mm สำหรับ 0.05 mm']
});

// ---------- 2 ไมโครมิเตอร์ ----------
function micro(p) {
  const pos = p.w + p.z, sleeve = Math.floor(pos * 2 + 1e-9) / 2, th = Math.round((pos - sleeve) * 100) % 50;
  return { pos, sleeve, th, read: sleeve + th * 0.01 };
}
CASES.push({
  name: 'ไมโครมิเตอร์', aspect: 2.2, title: 'การอ่านค่าไมโครมิเตอร์',
  desc: 'ลากปลอกหมุนหรือพิมพ์ความหนาวัตถุ สเกลบนปลอกนอกบอกทุก 0.5 mm ส่วนปลอกหมุน 1 รอบมี 50 ช่อง แต่ละช่อง 0.01 mm',
  formula: 'ค่าที่อ่าน = สเกลปลอกนอก (ทีละ 0.5 mm) + ขีดบนปลอกหมุนที่ตรงเส้นอ้างอิง × 0.01 mm',
  params: [
    { id: 'w', label: 'ความหนาวัตถุ', unit: 'mm', min: 0, max: 25, step: 0.001, def: 7.38 },
    { id: 'z', label: 'ความคลาดเคลื่อนศูนย์', unit: 'mm', min: -0.1, max: 0.1, step: 0.01, def: 0 },
    { id: 'quiz', label: 'โหมดฝึกอ่าน (ซ่อนคำตอบ)', type: 'bool', def: 0 }
  ],
  actions: [{ label: 'สุ่มโจทย์ใหม่', run(P) { P.w = +(Math.round((0.5 + Math.random() * 23) * 100) / 100).toFixed(2); } }],
  outs: [{ id: 'sl', name: 'สเกลปลอกนอก', unit: 'mm' }, { id: 'th', name: 'ขีดปลอกหมุน', unit: 'ช่อง' }, { id: 'read', name: 'ค่าที่อ่านได้', unit: 'mm' }, { id: 'corr', name: 'ค่าหลังแก้ความคลาดเคลื่อนศูนย์', unit: 'mm' }],
  compute(p) { const r = micro(p), q = p.quiz; return { sl: q ? '?' : fx(r.sleeve, 1), th: q ? '?' : r.th, read: q ? '?' : fx(r.read, 2), corr: q ? '?' : fx(r.read - p.z, 2), _r: r }; },
  sens: false,
  sim: {
    view(p, o) { const r = o._r; return { x0: r.pos - 9, x1: r.pos + 17, y0: -9, y1: 9, pad: 6 }; },
    draw(g, st, p, o) {
      const r = o._r, v = g.visible(), x0 = Math.max(v.x0, -1);
      g.rect(x0 - 3, -4.2, r.pos - x0 + 3, 8.4, { fill: '--block', c: '--ink', w: 1.5 });
      g.line(x0 - 3, 0, r.pos + 15, 0, { c: '--ink', w: 1.2 });
      for (let k = Math.max(0, Math.floor(v.x0 * 2)); k / 2 <= r.pos; k++) {
        const x = k / 2; if (k % 2 === 0) { g.line(x, 0, x, x % 5 === 0 ? 2.6 : 1.8, { w: 1.2 }); if (x % 5 === 0) g.text(x, 3.4, String(x), { fs: 12, b: true }); }
        else g.line(x, 0, x, -1.6, { w: 1.2 });
      }
      // ปลอกหมุน
      const R = 6.2; g.rect(r.pos, -R, 13, 2 * R, { fill: '--panel', c: '--ink', w: 1.5 }); g.rect(r.pos + 13, -R * 0.75, 4, 1.5 * R, { fill: '--block', c: '--ink', w: 1.5 });
      const frac = ((r.pos * 100) % 50 + 50) % 50;
      for (let d = Math.ceil(frac - 13); d <= frac + 13; d++) {
        const ang = (d - frac) / 50 * 2 * Math.PI; if (Math.abs(ang) > Math.PI / 2 * 0.98) continue;
        const y = R * Math.sin(ang), dm = ((d % 50) + 50) % 50, hl = Math.round(frac) % 50 === dm && !p.quiz;
        g.line(r.pos, y, r.pos + (dm % 5 === 0 ? 2.4 : 1.4), y, { c: hl ? '--c1' : '--ink', w: hl ? 2.4 : 1.1, alpha: 0.35 + 0.65 * Math.cos(ang) });
        if (dm % 5 === 0) g.text(r.pos + 3.6, y, String(dm), { fs: 11, base: 'middle', a: 'left', c: '--ink' });
      }
      g.text(x0 - 2, -6.2, 'ปลอกนอก', { a: 'left', fs: 11, c: '--muted' }); g.text(r.pos + 6.5, -7.2, 'ปลอกหมุน', { fs: 11, c: '--muted' });
      g.textPx(12, 20, p.quiz ? 'โหมดฝึกอ่าน: อ่านค่าเอง แล้วปิดโหมดเพื่อตรวจ' : `อ่านได้ ${fx(r.sleeve, 1)} + ${r.th} × 0.01 = ${fx(r.read, 2)} mm`, { a: 'left', fs: 14, b: true, c: p.quiz ? '--accent' : '--ink' });
    }
  },
  handles(p, o) { return [{ id: 'th', x: o._r.pos + 6.5, y: -4, set: x => ({ w: clamp(x - 6.5 - p.z, 0, 25) }) }]; },
  notes: ['ดูขีดบนปลอกนอกที่โผล่พ้นขอบปลอกหมุน ขีดบน = มิลลิเมตรเต็ม ขีดล่าง = ครึ่งมิลลิเมตร', 'ปลอกหมุน 1 รอบเลื่อน 0.5 mm แบ่ง 50 ช่อง จึงละเอียด 0.01 mm', 'ถ้าเห็นขีดครึ่งมิลลิเมตรโผล่แล้ว ต้องบวก 0.5 mm ก่อนบวกค่าจากปลอกหมุน']
});

// ---------- 3 การวัดซ้ำ ความแม่นและความเที่ยง ----------
function sample(p) {
  const r = K.rng(p.seed), vals = [], ys = [];
  for (let i = 0; i < p.N; i++) { let v = p.mu + p.bias + p.sd * K.gauss(r); v = Math.round(v / p.res) * p.res; vals.push(v); ys.push(K.gauss(r) * p.sd); }
  return { vals, ys };
}
const stats = a => { const n = a.length; if (!n) return { mean: NaN, sd: NaN, se: NaN }; const m = a.reduce((s, x) => s + x, 0) / n; const sd = n > 1 ? Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (n - 1)) : 0; return { mean: m, sd, se: sd / Math.sqrt(n) }; };
CASES.push({
  name: 'วัดซ้ำและความไม่แน่นอน', aspect: 16 / 8, title: 'ความแม่น ความเที่ยง และค่าเฉลี่ยจากการวัดซ้ำ',
  desc: 'จำลองการวัดซ้ำหลายครั้งที่มีความคลาดเคลื่อนแบบสุ่มและแบบมีระบบ ดูฮิสโทแกรมและเป้ายิงเพื่อแยกความแม่น (ใกล้ค่าจริง) กับความเที่ยง (ค่ากระจุกตัว)',
  formula: 'x̄ = Σx/N &nbsp;|&nbsp; s = √(Σ(x − x̄)²/(N − 1)) &nbsp;|&nbsp; ความไม่แน่นอนของค่าเฉลี่ย ≈ s/√N &nbsp;|&nbsp; รายงานผล x̄ ± s/√N',
  params: [
    { id: 'mu', label: 'ค่าจริง', unit: '', min: 0, max: 100, step: 0.1, def: 50 },
    { id: 'sd', label: 'ความคลาดเคลื่อนสุ่ม (ส่วนเบี่ยงเบน)', unit: '', min: 0.01, max: 10, step: 0.01, def: 1 },
    { id: 'bias', label: 'ความคลาดเคลื่อนมีระบบ', unit: '', min: -10, max: 10, step: 0.05, def: 0 },
    { id: 'N', label: 'จำนวนครั้งที่วัด', unit: 'ครั้ง', min: 3, max: 300, step: 1, def: 60 },
    { id: 'res', label: 'ความละเอียดเครื่องมือ', unit: '', min: 0.01, max: 2, step: 0.01, def: 0.1 },
    { id: 'seed', label: 'ชุดสุ่มที่', unit: '', min: 1, max: 999, step: 1, def: 7 }
  ],
  presets: [{ label: 'แม่นและเที่ยง', set: { sd: 0.3, bias: 0 } }, { label: 'เที่ยงแต่ไม่แม่น', set: { sd: 0.3, bias: 3 } }, { label: 'แม่นแต่ไม่เที่ยง', set: { sd: 3, bias: 0 } }, { label: 'ไม่แม่นไม่เที่ยง', set: { sd: 3, bias: 4 } }],
  actions: [{ label: 'สุ่มชุดใหม่', run(P) { P.seed = 1 + Math.floor(Math.random() * 998); } }],
  outs: [{ id: 'mean', name: 'ค่าเฉลี่ย x̄', unit: '' }, { id: 'sd', name: 'ส่วนเบี่ยงเบน s', unit: '' }, { id: 'se', name: 'ความไม่แน่นอนของค่าเฉลี่ย', unit: '' }, { id: 'err', name: 'x̄ − ค่าจริง', unit: '' }, { id: 'rep', name: 'รายงานผล', unit: '' }],
  compute(p) { const s = sample(p), t = stats(s.vals); const d = Math.max(0, -Math.floor(Math.log10(Math.max(1e-9, t.se))) + 0); return { mean: t.mean, sd: t.sd, se: t.se, err: t.mean - p.mu, rep: fx(t.mean, d) + ' ± ' + fx(t.se, d), _s: s }; },
  sim: {
    dt: 1 / 60,
    init() { return { k: 0 }; },
    step(st, dt, p) { st.k = Math.min(p.N, Math.floor(st.t / 0.05) + 1); if (st.k >= p.N) st.done = true; },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 8, pad: 4 }; },
    draw(g, st, p, o) {
      const k = st.k || 0, vals = o._s.vals.slice(0, k), ys = o._s.ys.slice(0, k), t = stats(vals);
      const span = Math.max(4 * p.sd + Math.abs(p.bias), p.res * 4), lo = p.mu - span, hi = p.mu + span;
      // ฮิสโทแกรม (ซ้าย)
      const X = v => 0.6 + (v - lo) / (hi - lo) * 8.6, nb = 24, bw = (hi - lo) / nb, bins = new Array(nb).fill(0);
      vals.forEach(v => { const i = Math.floor((v - lo) / bw); if (i >= 0 && i < nb) bins[i]++; });
      const mx = Math.max(3, ...bins);
      bins.forEach((c, i) => { if (c) g.rect(X(lo + i * bw) + 0.02, 1, 8.6 / nb - 0.04, c / mx * 5.6, { fill: '--c2', c: 'none', alpha: 0.85 }); });
      g.line(0.6, 1, 9.2, 1, { c: '--muted' });
      [lo, p.mu, hi].forEach(v => g.text(X(v), 0.45, fmt(v), { fs: 10, c: '--muted' }));
      g.line(X(p.mu), 1, X(p.mu), 7.2, { c: '--good', w: 2.5 }); g.text(X(p.mu), 7.45, 'ค่าจริง', { fs: 11, b: true, c: '--good' });
      if (k > 1) { g.rect(X(t.mean - t.sd), 1, X(t.mean + t.sd) - X(t.mean - t.sd), 6.6, { fill: '--c1', c: 'none', alpha: 0.12 }); g.line(X(t.mean), 1, X(t.mean), 7.6, { c: '--c1', w: 2.5, dash: [6, 4] }); g.text(X(t.mean), 7.85, 'ค่าเฉลี่ย', { fs: 11, b: true, c: '--c1' }); }
      // เป้า (ขวา)
      const cx = 12.6, cy = 4.2, Rr = 3.3, sc = Rr / span;
      [1, 0.75, 0.5, 0.25].forEach((f, i) => g.circle(cx, cy, Rr * f, { fill: i % 2 ? '--panel' : '--water-soft', c: '--line' }));
      g.circle(cx, cy, 0.08, { fill: '--good', c: 'none' });
      vals.forEach((v, i) => { const dx = (v - p.mu) * sc, dy = ys[i] * sc; if (Math.hypot(dx, dy) < Rr * 1.15) g.circle(cx + dx, cy + dy, 3.2, { px: true, fill: '--c1', c: 'none', alpha: 0.75 }); });
      g.text(cx, 0.45, 'เป้า: ระยะแนวนอน = ค่าคลาดเคลื่อน', { fs: 10, c: '--muted' });
      g.textPx(12, 18, `วัดแล้ว ${k} / ${p.N} ครั้ง` + (k > 1 ? `   x̄ = ${fmt(t.mean)}   s = ${fmt(t.sd)}` : ''), { a: 'left', fs: 13, b: true });
    }
  },
  notes: ['ความคลาดเคลื่อนสุ่มทำให้ค่ากระจาย ลดลงได้ด้วยการวัดซ้ำหลายครั้งแล้วเฉลี่ย', 'ความคลาดเคลื่อนมีระบบทำให้ค่าเฉลี่ยเลื่อนออกจากค่าจริง วัดซ้ำกี่ครั้งก็ไม่หาย ต้องแก้ที่เครื่องมือหรือวิธีวัด', 'เพิ่มจำนวนครั้ง ความไม่แน่นอนของค่าเฉลี่ยลดลงตาม 1/√N', 'ความแม่น (accuracy) = ใกล้ค่าจริง ความเที่ยง (precision) = ค่าที่ได้ใกล้กันเอง']
});

// ---------- 4 กราฟและการทำให้เป็นเส้นตรง ----------
const EXP = [['1', 'x'], ['2', 'x²'], ['0.5', '√x'], ['-1', '1/x'], ['-2', '1/x²'], ['3', 'x³']];
const EXPN = Object.fromEntries(EXP);
function fitData(p) {
  const r = K.rng(p.seed), n = +p.n, m = +p.m, pts = [];
  for (let i = 0; i < p.N; i++) { const x = p.xmax * (0.15 + 0.85 * (i + 0.5) / p.N); const y = p.k * Math.pow(x, n) * (1 + p.noise / 100 * K.gauss(r)); pts.push([x, y]); }
  const X = pts.map(q => Math.pow(q[0], m)), Y = pts.map(q => q[1]), N = pts.length;
  const mx = X.reduce((a, b) => a + b, 0) / N, my = Y.reduce((a, b) => a + b, 0) / N;
  let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < N; i++) { sxy += (X[i] - mx) * (Y[i] - my); sxx += (X[i] - mx) ** 2; syy += (Y[i] - my) ** 2; }
  const a = sxy / sxx, b = my - a * mx, R2 = sxy * sxy / (sxx * syy);
  // ความโค้งของข้อมูลเมื่อเทียบเส้นตรง (ดูจากเศษเหลือ)
  return { pts, X, Y, a, b, R2 };
}
CASES.push({
  name: 'กราฟเส้นตรงจากข้อมูล', aspect: 16 / 8, title: 'เปลี่ยนตัวแปรให้กราฟเป็นเส้นตรง แล้วหาค่าคงที่จากความชัน',
  desc: 'ข้อมูลทดลองมาจากความสัมพันธ์ y = kxⁿ ที่ซ่อนอยู่ ลองเลือกตัวแปรแกนนอนต่างๆ จนกราฟขวาเป็นเส้นตรง (R² ใกล้ 1 และผ่านจุดกำเนิด) แล้วอ่านค่า k จากความชัน',
  formula: 'y = kxⁿ → พล็อต y กับ xⁿ ได้เส้นตรง ความชัน = k &nbsp;|&nbsp; ความชัน = Δy/Δx &nbsp;|&nbsp; R² ยิ่งใกล้ 1 ยิ่งเป็นเส้นตรง',
  params: [
    { type: 'head', label: 'ความสัมพันธ์จริง (ซ่อนได้)' },
    { id: 'n', label: 'ความสัมพันธ์ y = k·', opts: EXP, def: '2' },
    { id: 'k', label: 'ค่าคงที่ k', unit: '', min: 0.1, max: 20, step: 0.1, def: 2.5 },
    { id: 'noise', label: 'ความคลาดเคลื่อนของข้อมูล', unit: '%', min: 0, max: 30, step: 0.5, def: 4 },
    { id: 'N', label: 'จำนวนจุดข้อมูล', unit: 'จุด', min: 4, max: 30, step: 1, def: 10 },
    { id: 'xmax', label: 'x สูงสุด', unit: '', min: 1, max: 20, step: 0.5, def: 5 },
    { id: 'seed', label: 'ชุดสุ่มที่', unit: '', min: 1, max: 999, step: 1, def: 3 },
    { type: 'head', label: 'ลองพล็อต' },
    { id: 'm', label: 'แกนนอนของกราฟขวา', opts: EXP, def: '1' }
  ],
  actions: [{ label: 'สุ่มโจทย์ใหม่', run(P) { P.n = EXP[Math.floor(Math.random() * 5)][0]; P.k = +(0.5 + Math.random() * 9).toFixed(1); P.seed = 1 + Math.floor(Math.random() * 998); P.m = '1'; } }],
  outs: [{ id: 'a', name: 'ความชัน', unit: '' }, { id: 'b', name: 'จุดตัดแกน y', unit: '' }, { id: 'R2', name: 'R²', unit: '' }, { id: 'ans', name: 'ผล', unit: '' }],
  compute(p) { const f = fitData(p), ok = p.m === p.n; return { a: f.a, b: f.b, R2: f.R2, ans: ok ? `เป็นเส้นตรง k ≈ ${fmt(f.a)}` : 'ยังไม่ใช่ ลองแกนอื่น', _f: f }; },
  sens: false,
  sim: {
    view() { return { x0: 0, x1: 16, y0: 0, y1: 8, pad: 4 }; },
    draw(g, st, p, o) {
      const f = o._f;
      const panel = (x0, xs, ys, xl, fit) => {
        const W = 6.6, H = 6, y0 = 1;
        const xmin = Math.min(0, ...xs), xmax = Math.max(...xs) * 1.08, ymin = Math.min(0, ...ys), ymax = Math.max(...ys) * 1.08;
        const X = v => x0 + (v - xmin) / (xmax - xmin) * W, Y = v => y0 + (v - ymin) / (ymax - ymin) * H;
        g.rect(x0, y0, W, H, { fill: '--bg', c: '--line', alpha: 1 });
        for (let i = 1; i < 5; i++) { g.line(x0 + W * i / 5, y0, x0 + W * i / 5, y0 + H, { c: '--grid', w: 1 }); g.line(x0, y0 + H * i / 5, x0 + W, y0 + H * i / 5, { c: '--grid', w: 1 }); }
        g.line(X(0), y0, X(0), y0 + H, { c: '--muted' }); g.line(x0, Y(0), x0 + W, Y(0), { c: '--muted' });
        if (fit) { const c = g.ctx; c.save(); c.beginPath(); c.rect(g.X(x0), g.Y(y0 + H), W * g.s, H * g.s); c.clip(); g.line(X(xmin), Y(f.a * xmin + f.b), X(xmax), Y(f.a * xmax + f.b), { c: '--c1', w: 2, dash: [6, 4] }); c.restore(); }
        xs.forEach((x, i) => g.circle(X(x), Y(ys[i]), 4, { px: true, fill: '--c2', c: '--ink', w: 1 }));
        g.text(x0 + W, y0 - 0.45, xl, { a: 'right', fs: 12, b: true }); g.text(x0 - 0.1, y0 + H + 0.25, 'y', { a: 'right', fs: 12, b: true });
        g.text(X(xmax), y0 - 0.45 + 0, '', {});
        [xmax].forEach(v => g.text(X(v * 0.92), y0 - 0.2, fmt(v * 0.92), { fs: 9, c: '--muted', dy: 4 }));
        g.text(x0 - 0.15, Y(ymax * 0.92), fmt(ymax * 0.92), { a: 'right', fs: 9, c: '--muted', base: 'middle' });
      };
      panel(0.9, f.pts.map(q => q[0]), f.Y, 'x', false);
      panel(9, f.X, f.Y, EXPN[p.m], true);
      g.text(4.2, 7.55, 'ข้อมูลดิบ y กับ x', { fs: 12, b: true }); g.text(12.3, 7.55, `y กับ ${EXPN[p.m]}   R² = ${f.R2.toFixed(4)}`, { fs: 12, b: true, c: p.m === p.n ? '--good' : '--ink' });
    }
  },
  notes: ['เลือกแกนนอนจนจุดเรียงเป็นเส้นตรงและผ่านใกล้จุดกำเนิด ความชันที่ได้คือ k', 'R² สูงอย่างเดียวยังไม่พอ ดูด้วยว่าจุดโค้งเป็นระบบรอบเส้นหรือไม่ และจุดตัดแกน y ใกล้ศูนย์หรือไม่', 'เพิ่มความคลาดเคลื่อนของข้อมูลแล้วดูว่าค่า k ที่ได้เพี้ยนไปเท่าใด', 'กดสุ่มโจทย์ใหม่เพื่อฝึกหาความสัมพันธ์ที่ซ่อนอยู่']
});

Lab.add('sci', CASES);
})();
