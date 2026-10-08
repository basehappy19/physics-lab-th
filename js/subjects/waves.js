/* บทที่ 14 ฟิสิกส์ทั่วไป — คลื่นและเสียง */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
const GRP = 'คลื่นและเสียง';

// ---------- 1 คลื่นในเส้นเชือก ----------
CASES.push({
  name: 'คลื่นในเส้นเชือก', group: GRP, aspect: 2.4, title: 'คลื่นเดินทางและคลื่นนิ่งในเส้นเชือก',
  desc: 'ปรับแรงตึง ความหนาแน่นเชิงเส้น และความถี่ ดูคลื่นเดินทาง หรือเลือกคลื่นนิ่งที่ปลายตรึงทั้งสองข้าง แล้วเลือกฮาร์มอนิกเพื่อดูบัพ (node) และปฏิบัพ (antinode) จุดสีแดงคืออนุภาคหนึ่งของเชือกที่ขยับขึ้นลงอย่างเดียว',
  formula: 'v = √(T/μ) &nbsp;|&nbsp; v = fλ &nbsp;|&nbsp; คลื่นนิ่งปลายตรึง: λₙ = 2L/n, fₙ = nv/2L &nbsp;|&nbsp; บัพห่างกัน λ/2',
  params: [
    { id: 'mode', label: 'ชนิด', opts: [['tr', 'คลื่นเดินทาง'], ['st', 'คลื่นนิ่ง']], def: 'st' },
    { id: 'T', label: 'แรงตึงเชือก (T)', unit: 'N', min: 1, max: 200, step: 1, def: 50 },
    { id: 'mu', label: 'มวลต่อความยาว (μ)', unit: 'g/m', min: 1, max: 100, step: 0.5, def: 20 },
    { id: 'L', label: 'ความยาวเชือก', unit: 'm', min: 0.5, max: 5, step: 0.05, def: 2 },
    { id: 'n', label: 'ฮาร์มอนิกที่', unit: '', min: 1, max: 8, step: 1, def: 3, show: p => p.mode === 'st' },
    { id: 'f', label: 'ความถี่', unit: 'Hz', min: 0.5, max: 60, step: 0.5, def: 10, show: p => p.mode === 'tr' },
    { id: 'A', label: 'แอมพลิจูด', unit: 'cm', min: 0.5, max: 10, step: 0.5, def: 5 },
    { id: 'slow', label: 'ภาพช้าลง', unit: 'เท่า', vals: [1, 5, 10, 20, 50], def: 10 }
  ],
  outs: [{ id: 'v', name: 'อัตราเร็วคลื่น', unit: 'm/s' }, { id: 'f', name: 'ความถี่', unit: 'Hz' }, { id: 'lam', name: 'ความยาวคลื่น', unit: 'm' }, { id: 'T', name: 'คาบ', unit: 's' }, { id: 'nodes', name: 'จำนวนบัพ (รวมปลาย)', unit: '' }],
  compute(p) { const v = Math.sqrt(p.T / (p.mu / 1000)), f = p.mode === 'st' ? p.n * v / (2 * p.L) : p.f, lam = v / f; return { v, f, lam, T: 1 / f, nodes: p.mode === 'st' ? p.n + 1 : '—' }; },
  sim: {
    dt: 1 / 240,
    init() { return {}; },
    step(st, dt) { if (st.t > 3600) st.done = true; },
    view(p) { return { x0: -0.08 * p.L, x1: p.L * 1.08, y0: -p.L * 0.3, y1: p.L * 0.3 }; },
    draw(g, st, p, o) {
      const t = st.t / p.slow, A = 0.16 * p.L * p.A / 10, k = 2 * Math.PI / o.lam, w = 2 * Math.PI * o.f, L = p.L;
      const y = x => p.mode === 'st' ? A * Math.sin(p.n * Math.PI * x / L) * Math.cos(w * t) : (x <= o.v * t ? A * Math.sin(w * t - k * x) : 0);
      g.line(0, 0, L, 0, { c: '--line', dash: [4, 4], w: 1 });
      if (p.mode === 'st') { g.fn(x => A * Math.sin(p.n * Math.PI * x / L), 0, L, { c: '--muted', w: 1, dash: [3, 4], n: 200 }); g.fn(x => -A * Math.sin(p.n * Math.PI * x / L), 0, L, { c: '--muted', w: 1, dash: [3, 4], n: 200 }); for (let i = 0; i <= p.n; i++) { g.circle(i * L / p.n, 0, 5, { px: true, fill: '--c2', c: 'none' }); if (i < p.n) g.text((i + 0.5) * L / p.n, A * 1.25, 'ปฏิบัพ', { fs: 9, c: '--muted' }); } g.text(0, -A * 1.6, 'บัพ', { fs: 10, c: '--c2' }); }
      g.fn(y, 0, L, { c: '--c1', w: 3, n: 300 });
      g.rect(-0.06 * L, -A * 1.5, 0.06 * L, A * 3, { fill: '--ground', c: '--ink' }); if (p.mode === 'st') g.rect(L, -A * 1.5, 0.06 * L, A * 3, { fill: '--ground', c: '--ink' });
      const xm = p.mode === 'st' ? L / (2 * p.n) * (p.n > 1 ? 1 : 1) * 0.7 + 0.0 : L * 0.3; g.circle(xm, y(xm), 6, { px: true, fill: '--bad', c: '--ink' });
      if (p.mode === 'tr') { g.dim(L * 0.5, -A * 1.7, L * 0.5 + o.lam, -A * 1.7, 'λ = ' + fmt(o.lam) + ' m', { off: 0 }); }
      g.textPx(12, 22, `v = ${fmt(o.v)} m/s   f = ${fmt(o.f)} Hz   λ = ${fmt(o.lam)} m   (ภาพช้าลง ${p.slow} เท่า ขยายแนวดิ่ง)`, { a: 'left', fs: 13, b: true });
    }
  },
  plot: { series: [{ label: 'การกระจัดของจุดสีแดง', unit: 'cm', c: '--bad', f: (s, p, o) => { const t = s.t / p.slow, A = p.A, L = p.L, w = 2 * Math.PI * o.f; if (p.mode === 'st') { const xm = L / (2 * p.n) * 0.7; return A * Math.sin(p.n * Math.PI * xm / L) * Math.cos(w * t); } const xm = L * 0.3, k = 2 * Math.PI / o.lam; return xm <= o.v * t ? A * Math.sin(w * t - k * xm) : 0; } }] },
  notes: ['ดึงเชือกตึงขึ้น 4 เท่า อัตราเร็วคลื่นเพิ่ม 2 เท่า ความถี่ของทุกฮาร์มอนิกจึงเพิ่ม 2 เท่า', 'คลื่นนิ่งเกิดจากคลื่นเดินทางสวนกันซ้อนทับกัน บัพไม่ขยับเลย', 'อนุภาคของเชือกเคลื่อนที่ขึ้นลงเท่านั้น สิ่งที่เดินทางไปคือพลังงานและรูปคลื่น', 'ความถี่มูลฐาน (n = 1) ความยาวเชือกเท่ากับครึ่งความยาวคลื่น']
});

// ---------- 2 การแทรกสอด ----------
let img = null;
CASES.push({
  name: 'การแทรกสอดสองแหล่ง', group: GRP, aspect: 16 / 9, title: 'การแทรกสอดของคลื่นน้ำจากสองแหล่งกำเนิด',
  desc: 'แหล่งกำเนิดคลื่นอาพันธ์สองแหล่งสั่นพร้อมกัน แนวที่คลื่นเสริมกันสั่นแรง แนวที่หักล้างกันแทบนิ่ง ลากแหล่งกำเนิดหรือจุดตรวจเพื่อดูผลต่างระยะทาง ดูพื้นผิวน้ำแบบ 3D',
  formula: 'เสริม (ปฏิบัพ): |S₁P − S₂P| = nλ &nbsp;|&nbsp; หักล้าง (บัพ): |S₁P − S₂P| = (n − ½)λ &nbsp;|&nbsp; d sin θ = nλ (ระยะไกล)',
  params: [
    { id: 'lam', label: 'ความยาวคลื่น (λ)', unit: 'cm', min: 0.5, max: 4, step: 0.05, def: 1.5 },
    { id: 'd', label: 'ระยะห่างแหล่งกำเนิด (d)', unit: 'cm', min: 0.5, max: 10, step: 0.1, def: 4 },
    { id: 'ph', label: 'เฟสต่างกันที่แหล่ง', unit: '°', min: 0, max: 360, step: 15, def: 0 },
    { id: 'px', label: 'จุดตรวจ x', unit: 'cm', min: -12, max: 12, step: 0.1, def: 4 },
    { id: 'py', label: 'จุดตรวจ y', unit: 'cm', min: 0.5, max: 13, step: 0.1, def: 8 },
    { id: 'lines', label: 'เส้นบัพ', type: 'bool', def: 1 }
  ],
  outs: [{ id: 'pd', name: 'ผลต่างระยะทาง', unit: 'cm' }, { id: 'n', name: 'ผลต่างระยะทาง ÷ λ', unit: '' }, { id: 'kind', name: 'จุดตรวจอยู่บน', unit: '' }, { id: 'nmax', name: 'จำนวนแนวปฏิบัพ', unit: 'แนว' }],
  compute(p) { const a = Math.hypot(p.px + p.d / 2, p.py), b = Math.hypot(p.px - p.d / 2, p.py), pd = Math.abs(a - b), n = pd / p.lam - (p.ph / 360) * Math.sign(a - b || 1); const fr = ((n % 1) + 1) % 1; return { pd, n: pd / p.lam, kind: fr < 0.15 || fr > 0.85 ? 'แนวปฏิบัพ (เสริม)' : Math.abs(fr - 0.5) < 0.15 ? 'แนวบัพ (หักล้าง)' : 'ระหว่างแนว', nmax: 2 * Math.floor(p.d / p.lam) + 1 }; },
  sim: {
    dt: 1 / 60,
    init() { return {}; },
    step(st) { if (st.t > 3600) st.done = true; },
    view() { return { x0: -13, x1: 13, y0: -1, y1: 13.6, pad: 0 }; },
    draw(g, st, p, o) {
      const v = g.visible(), W = 220, H = Math.round(W * (v.y1 - v.y0) / (v.x1 - v.x0));
      if (!img || img.width !== W || img.height !== H) { const c = document.createElement('canvas'); c.width = W; c.height = H; img = c; }
      const ctx = img.getContext('2d'), id = ctx.createImageData(W, H), k = 2 * Math.PI / p.lam, wt = st.t * 2 * Math.PI * 1.2, ph = p.ph * RAD;
      const hx = s => { const t = s.replace('#', ''); return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)]; };
      const hi = hx(g.col('--water')), lo = hx(g.col('--panel'));
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const x = v.x0 + (i + 0.5) / W * (v.x1 - v.x0), y = v.y1 - (j + 0.5) / H * (v.y1 - v.y0);
        const r1 = Math.hypot(x + p.d / 2, y), r2 = Math.hypot(x - p.d / 2, y);
        const z = (Math.sin(wt - k * r1) / Math.sqrt(1 + r1) + Math.sin(wt - k * r2 + ph) / Math.sqrt(1 + r2)) * 0.9, t = clamp(0.5 + z * 0.5, 0, 1), q = (j * W + i) * 4;
        for (let c = 0; c < 3; c++) id.data[q + c] = Math.round(lo[c] + (hi[c] - lo[c]) * t);
        id.data[q + 3] = 255;
      }
      ctx.putImageData(id, 0, 0); g.ctx.drawImage(img, g.X(v.x0), g.Y(v.y1), (v.x1 - v.x0) * g.s, (v.y1 - v.y0) * g.s);
      if (p.lines) { for (let m = -10; m <= 10; m++) { const dd = (m + 0.5 - p.ph / 360) * p.lam; if (Math.abs(dd) >= p.d) continue; const pts = []; for (let y = 0; y <= 13.5; y += 0.2) { // ไฮเพอร์โบลา r1 − r2 = dd
          const a = dd / 2, c = p.d / 2, b2 = c * c - a * a; const x = Math.sign(a) * Math.abs(a) * Math.sqrt(1 + y * y / b2); pts.push([-x, y]); } g.path(pts, { c: '--bad', w: 1, dash: [4, 4], alpha: 0.7 }); } }
      [[-p.d / 2], [p.d / 2]].forEach(([x], i) => { g.circle(x, 0, 6, { px: true, fill: '--ink', c: '--panel', w: 2 }); g.text(x, -0.7, 'S' + (i + 1), { fs: 11, b: true }); });
      g.line(-p.d / 2, 0, p.px, p.py, { c: '--c1', w: 1.5 }); g.line(p.d / 2, 0, p.px, p.py, { c: '--c3', w: 1.5 }); g.circle(p.px, p.py, 6, { px: true, fill: '--c5', c: '--ink' });
      g.textPx(12, 22, `|S₁P − S₂P| = ${fmt(o.pd)} cm = ${fmt(o.n)}λ   ${o.kind}`, { a: 'left', fs: 13, b: true, bg: true });
    }
  },
  handles(p) { return [{ id: 's2', x: p.d / 2, y: 0, set: x => ({ d: clamp(2 * Math.abs(x), 0.5, 10) }) }, { id: 'P', x: p.px, y: p.py, set: (x, y) => ({ px: clamp(x, -12, 12), py: clamp(y, 0.5, 13) }) }]; },
  three: {
    cam() { return { pos: [0, 9, 14], target: [0, 0, -5] }; },
    build(T, p) { const geo = new T.THREE.PlaneGeometry(26, 14, 130, 70); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -7); const m = T.mesh(geo, '--water', { cast: false }); m.material.flatShading = false; [-1, 1].forEach(s => { const c = T.cyl(0.15, 0.15, 1.2, '--ink'); c.position.set(s * p.d / 2, 0.3, 0); }); return { geo }; },
    update(ob, st, p) { const pos = ob.geo.attributes.position, k = 2 * Math.PI / p.lam, wt = st.t * 2 * Math.PI * 1.2, ph = p.ph * RAD; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = -pos.getZ(i), r1 = Math.hypot(x + p.d / 2, y), r2 = Math.hypot(x - p.d / 2, y); pos.setY(i, 0.35 * (Math.sin(wt - k * r1) / Math.sqrt(1 + r1) + Math.sin(wt - k * r2 + ph) / Math.sqrt(1 + r2))); } pos.needsUpdate = true; ob.geo.computeVertexNormals(); }
  },
  notes: ['แนวปฏิบัพกลาง (ผลต่างระยะ = 0) อยู่ตรงกลางเมื่อแหล่งกำเนิดเฟสตรงกัน', 'ลด λ หรือเพิ่ม d จะได้จำนวนแนวมากขึ้นและชิดกันมากขึ้น', 'ปรับเฟสต่างกัน 180° แนวกลางกลายเป็นแนวบัพ', 'ลาก S₂ เพื่อเปลี่ยนระยะห่าง ลากจุดตรวจ P เพื่ออ่านผลต่างระยะทาง']
});

// ---------- 3 ดอปเพลอร์ ----------
CASES.push({
  name: 'ปรากฏการณ์ดอปเพลอร์', group: GRP, aspect: 16 / 9, title: 'ความถี่ที่ได้ยินเมื่อแหล่งกำเนิดเสียงเคลื่อนที่',
  desc: 'แหล่งกำเนิดเสียงเคลื่อนที่ไปทางขวา หน้าคลื่นด้านหน้าอัดชิดกัน ผู้ฟังด้านหน้าได้ยินความถี่สูงขึ้น ด้านหลังต่ำลง ถ้าเร็วกว่าเสียงจะเกิดคลื่นกระแทกรูปกรวย',
  formula: 'f′ = f (v ± v<sub>o</sub>)/(v ∓ v<sub>s</sub>) &nbsp;|&nbsp; หน้าแหล่งกำเนิด: f′ = fv/(v − v<sub>s</sub>) &nbsp;|&nbsp; หลัง: f′ = fv/(v + v<sub>s</sub>) &nbsp;|&nbsp; มุมกรวยมัค sin θ = v/v<sub>s</sub>',
  params: [
    { id: 'f', label: 'ความถี่แหล่งกำเนิด', unit: 'Hz', min: 100, max: 2000, step: 10, def: 500 },
    { id: 'vs', label: 'อัตราเร็วแหล่งกำเนิด ÷ อัตราเร็วเสียง', unit: '', min: 0, max: 1.8, step: 0.01, def: 0.5 },
    { id: 'vo', label: 'อัตราเร็วผู้ฟัง (เข้าหา +)', unit: 'm/s', min: -100, max: 100, step: 1, def: 0 },
    { id: 'v', label: 'อัตราเร็วเสียง', unit: 'm/s', min: 300, max: 360, step: 1, def: 343 }
  ],
  presets: [{ label: 'รถพยาบาล 30 m/s', set: { vs: 30 / 343, f: 700 } }, { label: 'เท่าเสียง (มัค 1)', set: { vs: 1 } }, { label: 'เร็วกว่าเสียง (มัค 1.5)', set: { vs: 1.5 } }],
  outs: [{ id: 'ff', name: 'ผู้ฟังด้านหน้าได้ยิน', unit: 'Hz' }, { id: 'fb', name: 'ผู้ฟังด้านหลังได้ยิน', unit: 'Hz' }, { id: 'lf', name: 'λ ด้านหน้า', unit: 'm' }, { id: 'lb', name: 'λ ด้านหลัง', unit: 'm' }, { id: 'mach', name: 'มุมกรวยมัค', unit: '°' }],
  compute(p) { const vs = p.vs * p.v; return { ff: p.vs < 1 ? p.f * (p.v + p.vo) / (p.v - vs) : 'คลื่นกระแทก', fb: p.f * (p.v + p.vo) / (p.v + vs), lf: p.vs < 1 ? (p.v - vs) / p.f : 0, lb: (p.v + vs) / p.f, mach: p.vs > 1 ? Math.asin(1 / p.vs) * DEG : '—' }; },
  sim: {
    dt: 1 / 120,
    init() { return { fronts: [], ne: 0 }; },
    step(st, dt, p) { const T = 0.18, x = -6 + p.vs * 3 * st.t; st.x = x; if (st.t >= st.ne) { st.fronts.push({ x, t: st.t }); st.ne += T; } st.fronts = st.fronts.filter(f => (st.t - f.t) * 3 < 16); if (x > 8) st.done = true; },
    view() { return { x0: -8, x1: 8, y0: -4.5, y1: 4.5 }; },
    draw(g, st, p, o) {
      (st.fronts || []).forEach(f => { const r = (st.t - f.t) * 3; g.circle(f.x, 0, r, { c: '--c2', w: 1.5, alpha: Math.max(0.15, 1 - r / 14) }); });
      const x = st.x != null ? st.x : -6; g.circle(x, 0, 0.2, { fill: '--c1', c: '--ink' }); g.vec(x, 0, p.vs * 40, 0, { px: true, c: '--c1', w: 2.5, label: 'vₛ' });
      g.text(7.2, 3.6, 'ผู้ฟังด้านหน้า', { a: 'right', fs: 11 }); g.text(7.2, 3.1, typeof o.ff === 'number' ? fmt(o.ff) + ' Hz' : o.ff, { a: 'right', fs: 13, b: true, c: '--c1' });
      g.text(-7.6, 3.6, 'ผู้ฟังด้านหลัง', { a: 'left', fs: 11 }); g.text(-7.6, 3.1, fmt(o.fb) + ' Hz', { a: 'left', fs: 13, b: true, c: '--c2' });
      g.circle(7.5, 0, 0.18, { fill: '--c4', c: 'none' }); g.circle(-7.5, 0, 0.18, { fill: '--c4', c: 'none' });
    }
  },
  actions: [{ label: '🔊 ฟังเสียงเทียบ', run(P) { playTones([P.f * P.v / (P.v - Math.min(0.95, P.vs) * P.v), P.f, P.f * P.v / (P.v + P.vs * P.v)]); } }],
  notes: ['ความถี่ของแหล่งกำเนิดไม่เปลี่ยน แต่ระยะห่างหน้าคลื่นที่ไปถึงผู้ฟังเปลี่ยน', 'ด้านหน้าหน้าคลื่นชิดกัน (λ สั้น ความถี่สูง) ด้านหลังห่างกัน', 'แหล่งกำเนิดเร็วเท่าเสียง หน้าคลื่นซ้อนกันที่หน้าแหล่ง เร็วกว่าเสียงเกิดกรวยมัค', 'กดปุ่มฟังเสียง: ได้ยินความถี่ด้านหน้า ความถี่จริง และด้านหลัง ตามลำดับ']
});
function playTones(fs) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC(); let t = ac.currentTime + 0.05;
    fs.forEach(f => { if (!isFinite(f) || f <= 0) return; const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = Math.min(4000, f); o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.15, t + 0.05); g.gain.linearRampToValueAtTime(0, t + 0.7); o.start(t); o.stop(t + 0.75); t += 0.85; });
    setTimeout(() => ac.close(), (t - ac.currentTime + 0.5) * 1000);
  } catch (e) { /* อุปกรณ์ไม่รองรับเสียง */ }
}

// ---------- 4 บีตส์ ----------
CASES.push({
  name: 'บีตส์', group: GRP, aspect: 2.4, title: 'บีตส์จากเสียงสองความถี่ใกล้กัน',
  desc: 'เสียงสองความถี่ที่ใกล้กันรวมกัน ได้เสียงที่ดังค่อยสลับเป็นจังหวะ จำนวนครั้งต่อวินาทีเท่ากับผลต่างของความถี่ กดฟังเสียงได้',
  formula: 'ความถี่บีตส์ f<sub>b</sub> = |f₁ − f₂| &nbsp;|&nbsp; ความถี่ที่ได้ยิน ≈ (f₁ + f₂)/2',
  params: [
    { id: 'f1', label: 'ความถี่ 1', unit: 'Hz', min: 100, max: 1000, step: 0.5, def: 440 },
    { id: 'f2', label: 'ความถี่ 2', unit: 'Hz', min: 100, max: 1000, step: 0.5, def: 444 }
  ],
  outs: [{ id: 'fb', name: 'ความถี่บีตส์', unit: 'Hz' }, { id: 'fa', name: 'ความถี่ที่ได้ยิน', unit: 'Hz' }, { id: 'Tb', name: 'ช่วงเวลาระหว่างเสียงดัง', unit: 's' }],
  compute(p) { const fb = Math.abs(p.f1 - p.f2); return { fb, fa: (p.f1 + p.f2) / 2, Tb: fb > 0 ? 1 / fb : 'ไม่มีบีตส์' }; },
  actions: [{ label: '🔊 ฟังเสียง 3 วินาที', run(P) { try { const ac = new (window.AudioContext || window.webkitAudioContext)(), t = ac.currentTime + 0.05; [P.f1, P.f2].forEach(f => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0.1, t); g.gain.setValueAtTime(0.1, t + 2.9); g.gain.linearRampToValueAtTime(0, t + 3); o.start(t); o.stop(t + 3.05); }); setTimeout(() => ac.close(), 3500); } catch (e) { } } }],
  sim: {
    dt: 1 / 60,
    init() { return {}; },
    step(st) { if (st.t > 3600) st.done = true; },
    view() { return { x0: 0, x1: 12, y0: -2.6, y1: 2.6 }; },
    draw(g, st, p, o) {
      const span = Math.max(0.05, Math.min(2, 2 / Math.max(0.5, o.fb))), t0 = st.t * 0.1;
      const y = x => { const t = t0 + x / 12 * span; return Math.sin(2 * Math.PI * p.f1 * t) + Math.sin(2 * Math.PI * p.f2 * t); };
      g.line(0, 0, 12, 0, { c: '--line', w: 1 });
      g.fn(y, 0, 12, { c: '--c2', w: 1, n: 2400, alpha: 0.8 });
      g.fn(x => 2 * Math.abs(Math.cos(Math.PI * (p.f1 - p.f2) * (t0 + x / 12 * span))), 0, 12, { c: '--c1', w: 2, dash: [5, 4] });
      g.textPx(12, 22, `แสดงช่วงเวลา ${fmt(span)} s   เส้นประ = ความดังที่ขึ้นลง (บีตส์ ${fmt(o.fb)} ครั้ง/วินาที)`, { a: 'left', fs: 12, b: true, bg: true });
    }
  },
  notes: ['ยิ่งความถี่ใกล้กัน บีตส์ยิ่งช้า นักดนตรีใช้ตั้งสายจนไม่ได้ยินบีตส์', 'ถ้าผลต่างมากกว่าประมาณ 10 Hz หูแยกเป็นจังหวะไม่ได้ จะได้ยินเป็นเสียงหยาบ']
});

Lab.add('general', CASES);
})();
