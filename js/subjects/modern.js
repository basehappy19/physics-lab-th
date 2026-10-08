/* บทที่ 14 ฟิสิกส์ทั่วไป — ฟิสิกส์อะตอมและนิวเคลียร์ */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];
const GRP = 'อะตอมและนิวเคลียร์';
const h = 6.626e-34, c = 3e8, eV = 1.6e-19;
// สีโดยประมาณของแสงที่ความยาวคลื่น (nm)
const wlColor = nm => { let r = 0, g = 0, b = 0; if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else if (nm <= 780) { r = 1; } else return nm < 380 ? '#8b5cf6' : '#9ca3af'; return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`; };

// ---------- 1 การสลายตัว ----------
CASES.push({
  name: 'การสลายตัวกัมมันตรังสี', group: GRP, aspect: 16 / 9, title: 'การสลายตัวและครึ่งชีวิต',
  desc: 'นิวเคลียสแต่ละตัวสลายแบบสุ่ม ไม่รู้ว่าตัวไหนจะสลายเมื่อใด แต่เมื่อมีจำนวนมาก ทุกครึ่งชีวิตจำนวนที่เหลือจะลดลงครึ่งหนึ่ง เทียบกราฟจากการสุ่มกับกราฟทฤษฎี',
  formula: 'N = N₀(½)<sup>t/T½</sup> = N₀e<sup>−λt</sup> &nbsp;|&nbsp; λ = ln 2 / T½ &nbsp;|&nbsp; กัมมันตภาพ A = λN',
  params: [
    { id: 'N0', label: 'จำนวนนิวเคลียสเริ่มต้น', unit: 'ตัว', min: 10, max: 900, step: 10, def: 400 },
    { id: 'th', label: 'ครึ่งชีวิต', unit: 's', min: 0.5, max: 20, step: 0.5, def: 3 },
    { id: 'seed', label: 'ชุดสุ่มที่', unit: '', min: 1, max: 999, step: 1, def: 1 }
  ],
  actions: [{ label: 'สุ่มชุดใหม่', run(P) { P.seed = 1 + Math.floor(Math.random() * 998); } }],
  outs: [{ id: 'lam', name: 'ค่าคงตัวการสลาย λ', unit: '1/s' }, { id: 'A0', name: 'กัมมันตภาพเริ่มต้น', unit: 'Bq' }, { id: 'N3', name: 'เหลือหลัง 3 ครึ่งชีวิต (ทฤษฎี)', unit: 'ตัว' }],
  compute(p) { const lam = Math.LN2 / p.th; return { lam, A0: lam * p.N0, N3: p.N0 / 8 }; },
  sim: {
    dt: 1 / 60,
    init(p) { const r = K.rng(p.seed), A = []; const n = Math.ceil(Math.sqrt(p.N0 * 1.8)); for (let i = 0; i < p.N0; i++) A.push({ i: i % n, j: Math.floor(i / n), td: -Math.log(1 - r()) / (Math.LN2 / p.th) }); return { A, n, N: p.N0 }; },
    step(st, dt, p) { st.N = st.A.filter(a => a.td > st.t + dt).length; if (st.t > p.th * 8 || st.N === 0) st.done = true; },
    view() { return { x0: 0, x1: 16, y0: 0, y1: 9, pad: 4 }; },
    draw(g, st, p) {
      const n = st.n, rows = Math.ceil(p.N0 / n), sz = Math.min(7 / n, 7.6 / rows);
      st.A.forEach(a => { const alive = a.td > st.t, x = 0.5 + a.i * sz + sz / 2, y = 8.4 - a.j * sz - sz / 2; g.circle(x, y, sz * 0.38, { fill: alive ? '--c1' : '--line', c: 'none' }); if (!alive && st.t - a.td < 0.25) g.circle(x, y, sz * 0.9, { c: '--c5', w: 1.5, alpha: 1 - (st.t - a.td) * 4 }); });
      const gx = 8.6, gy = 1, gw = 7, gh = 7, tm = p.th * 6, X = t => gx + t / tm * gw, Y = N => gy + N / p.N0 * gh;
      g.rect(gx, gy, gw, gh, { fill: '--bg', c: '--line' });
      for (let k = 1; k <= 5; k++) { g.line(X(k * p.th), gy, X(k * p.th), gy + gh, { c: '--grid', w: 1 }); g.text(X(k * p.th), gy - 0.35, k + 'T½', { fs: 10, c: '--muted' }); g.line(gx, Y(p.N0 / 2 ** k), X(k * p.th), Y(p.N0 / 2 ** k), { c: '--line', dash: [3, 4], w: 1 }); }
      g.fn(x => Y(p.N0 * Math.pow(0.5, ((x - gx) / gw * tm) / p.th)), gx, gx + gw, { c: '--muted', w: 2, dash: [6, 4] });
      const pts = []; for (let t = 0; t <= Math.min(st.t, tm); t += tm / 200) pts.push([X(t), Y(st.A.filter(a => a.td > t).length)]); g.path(pts, { c: '--c1', w: 2.5 });
      g.text(gx + gw, gy + gh + 0.3, 'เส้นประ = ทฤษฎี  เส้นส้ม = จากการสุ่ม', { a: 'right', fs: 10, c: '--muted' });
      g.textPx(12, 22, `เหลือ ${st.N} จาก ${p.N0} ตัว   t = ${fmt(st.t)} s = ${fmt(st.t / p.th)} ครึ่งชีวิต`, { a: 'left', fs: 13, b: true });
    }
  },
  plot: { series: [{ label: 'N ที่เหลือ', unit: 'ตัว', c: '--c1', f: s => s.N }] },
  three: {
    cam(p) { const n = Math.ceil(Math.cbrt(p.N0)); return { pos: [n * 1.1, n * 0.9, n * 1.6], target: [0, 0, 0] }; },
    build(T, p) {
      // นิวเคลียสทั้งหมดเป็น InstancedMesh ก้อนเดียว (วาดครั้งเดียวไม่ว่ามีกี่ตัว)
      const n = Math.ceil(Math.cbrt(p.N0)), geo = new T.THREE.SphereGeometry(0.32, 12, 8), mat = new T.THREE.MeshStandardMaterial({ roughness: 0.5 });
      const im = new T.THREE.InstancedMesh(geo, mat, p.N0), M = new T.THREE.Matrix4();
      for (let i = 0; i < p.N0; i++) { const x = i % n, y = Math.floor(i / n) % n, z = Math.floor(i / (n * n)); M.setPosition(x - (n - 1) / 2, y - (n - 1) / 2, z - (n - 1) / 2); im.setMatrixAt(i, M); }
      T.scene.add(im);
      return { im, cA: T.color('--c1'), cD: T.color('--line'), cF: T.color('--c5'), lab: T.label('', '--ink', { pos: [0, n * 0.75, 0] }), n };
    },
    update(ob, st, p) {
      const t = st.t; (st.A || []).forEach((a, i) => ob.im.setColorAt(i, a.td > t ? ob.cA : (t - a.td < 0.25 ? ob.cF : ob.cD)));
      if (ob.im.instanceColor) ob.im.instanceColor.needsUpdate = true;
      ob.lab.set(`เหลือ ${st.N != null ? st.N : p.N0} จาก ${p.N0} ตัว · ${fmt(t / p.th)} ครึ่งชีวิต`, null);
    }
  },
  notes: ['การสลายตัวเป็นเรื่องความน่าจะเป็น นิวเคลียสที่เหลืออยู่ไม่ได้ "แก่" ขึ้น โอกาสสลายต่อวินาทีคงที่', 'จำนวนน้อยๆ ผลจากการสุ่มเบี่ยงจากทฤษฎีมาก จำนวนมากจะใกล้ทฤษฎี', 'หลัง 1, 2, 3 ครึ่งชีวิต เหลือ 1/2, 1/4, 1/8 ของเดิม']
});

// ---------- 2 โฟโตอิเล็กทริก ----------
const METALS = { cs: ['ซีเซียม', 2.1], na: ['โซเดียม', 2.28], k: ['โพแทสเซียม', 2.3], ca: ['แคลเซียม', 2.9], zn: ['สังกะสี', 4.3], cu: ['ทองแดง', 4.7] };
CASES.push({
  name: 'ปรากฏการณ์โฟโตอิเล็กทริก', group: GRP, aspect: 2, title: 'แสงตกกระทบโลหะแล้วอิเล็กตรอนหลุด',
  desc: 'ปรับความยาวคลื่นและความเข้มแสง เลือกโลหะ และปรับความต่างศักย์หยุดยั้ง อิเล็กตรอนหลุดเมื่อพลังงานโฟตอนมากกว่าฟังก์ชันงาน ความเข้มแสงเพิ่มจำนวนอิเล็กตรอน แต่ไม่เพิ่มพลังงานต่อตัว',
  formula: 'E = hf = hc/λ &nbsp;|&nbsp; E<sub>k,max</sub> = hf − W &nbsp;|&nbsp; eV<sub>s</sub> = E<sub>k,max</sub> &nbsp;|&nbsp; ความยาวคลื่นขีดเริ่ม λ₀ = hc/W',
  params: [
    { id: 'nm', label: 'ความยาวคลื่นแสง', unit: 'nm', min: 150, max: 750, step: 1, def: 400 },
    { id: 'I', label: 'ความเข้มแสง', unit: '%', min: 0, max: 100, step: 1, def: 60 },
    { id: 'met', label: 'โลหะ', opts: Object.keys(METALS).map(k => [k, METALS[k][0] + ' ' + METALS[k][1] + ' eV']), def: 'na' },
    { id: 'V', label: 'ความต่างศักย์หน่วง', unit: 'V', min: -2, max: 6, step: 0.05, def: 0 }
  ],
  outs: [{ id: 'E', name: 'พลังงานโฟตอน', unit: 'eV' }, { id: 'W', name: 'ฟังก์ชันงาน', unit: 'eV' }, { id: 'K', name: 'พลังงานจลน์สูงสุด', unit: 'eV' }, { id: 'Vs', name: 'ความต่างศักย์หยุดยั้ง', unit: 'V' }, { id: 'l0', name: 'ความยาวคลื่นขีดเริ่ม', unit: 'nm' }, { id: 'cur', name: 'กระแส (สัมพัทธ์)', unit: '%' }],
  compute(p) { const E = h * c / (p.nm * 1e-9) / eV, W = METALS[p.met][1], K0 = E - W; const cur = K0 <= 0 ? 0 : p.V <= 0 ? p.I : p.V >= K0 ? 0 : p.I * (1 - p.V / K0); return { E, W, K: Math.max(0, K0), Vs: Math.max(0, K0), l0: h * c / (W * eV) * 1e9, cur, _K: K0 }; },
  sim: {
    dt: 1 / 120,
    init() { return { ph: [], el: [], np: 0, ne: 0, rn: K.rng(3) }; },
    step(st, dt, p, o) {
      const rate = p.I / 100 * 18; st.np += rate * dt; while (st.np >= 1) { st.np--; st.ph.push({ x: -1 + st.rn() * 1.2, y: 4.2, t: 0 }); }
      st.ph.forEach(q => { q.x += 2.2 * dt; q.y -= 2.6 * dt; if (q.y <= 1.2 && !q.hit) { q.hit = true; if (o._K > 0) st.el.push({ x: q.x, y: 1.25, vx: Math.sqrt(o._K) * (1.2 + st.rn()), vy: (st.rn() - 0.3) * 0.6 }); } });
      st.ph = st.ph.filter(q => !q.hit);
      const acc = -p.V * 0.9; st.el.forEach(e => { e.vx += acc * dt; e.x += e.vx * dt; e.y += e.vy * dt; if (e.x > 6.3) { e.done = true; st.ne++; } if (e.x < 1.3 && e.vx < 0) e.done = true; });
      st.el = st.el.filter(e => !e.done); if (st.t > 3600) st.done = true;
    },
    view() { return { x0: -1.5, x1: 8, y0: -0.6, y1: 4.6 }; },
    draw(g, st, p, o) {
      const col = wlColor(p.nm);
      g.rect(0, 0.2, 1.3, 2.6, { fill: '--muted', c: '--ink' }); g.text(0.65, 0.0, METALS[p.met][0], { fs: 11 }); g.rect(6.3, 0.2, 0.4, 2.6, { fill: '--block', c: '--ink' }); g.text(6.5, 0.0, 'ขั้วรับ', { fs: 11 });
      g.path([[0.65, 0.2], [0.65, -0.4], [6.5, -0.4], [6.5, 0.2]], { c: '--ink', w: 1.5 }); g.rect(3, -0.6, 1, 0.4, { fill: '--panel', c: '--ink' }); g.text(3.5, -0.4, fmt(p.V) + ' V', { fs: 10, base: 'middle' });
      st.ph.forEach(q => { g.ctx.save(); g.ctx.strokeStyle = col; g.ctx.lineWidth = 2; g.ctx.beginPath(); for (let i = 0; i <= 12; i++) { const s = i / 12 * 0.5, x = q.x - s * 0.65, y = q.y + s * 0.77, n = Math.sin(i * 1.6) * 0.06; i ? g.ctx.lineTo(g.X(x + n), g.Y(y + n)) : g.ctx.moveTo(g.X(x + n), g.Y(y + n)); } g.ctx.stroke(); g.ctx.restore(); });
      st.el.forEach(e => g.circle(e.x, e.y, 4, { px: true, fill: '--neg', c: 'none' }));
      g.textPx(12, 22, o._K > 0 ? `อิเล็กตรอนหลุด  Eₖ สูงสุด ${fmt(o._K)} eV  กระแส ${fmt(o.cur)}%` : `พลังงานโฟตอน ${fmt(o.E)} eV น้อยกว่าฟังก์ชันงาน ไม่มีอิเล็กตรอนหลุดไม่ว่าแสงจะเข้มเท่าใด`, { a: 'left', fs: 13, b: true, c: o._K > 0 ? '--ink' : '--bad' });
      // แถบสีสเปกตรัม
      const SX = nm => 4.2 + (nm - 150) / 600 * 3.5; g.rect(SX(150), 2.55, SX(380) - SX(150), 0.2, { fill: '#8b5cf6', c: 'none', alpha: 0.5 }); for (let nm = 380; nm <= 750; nm += 5) g.rect(SX(nm), 2.55, 0.035, 0.2, { fill: wlColor(nm), c: 'none' });
      g.line(SX(p.nm), 2.45, SX(p.nm), 2.85, { c: '--ink', w: 2.5 }); g.text(SX(150), 2.3, 'UV', { a: 'left', fs: 9, c: '--muted' }); g.text(SX(p.nm), 2.95, p.nm + ' nm', { fs: 10, b: true });
      // กราฟ I-V
      const gx = 4.2, gy = 3.2, gw = 3.5, gh = 1.2, X = V => gx + (V + 2) / 8 * gw, Y = I => gy + I / 100 * gh;
      g.rect(gx, gy, gw, gh, { fill: '--bg', c: '--line' }); g.line(X(0), gy, X(0), gy + gh, { c: '--muted', w: 1 });
      g.fn(x => { const V = (x - gx) / gw * 8 - 2; return Y(o._K <= 0 ? 0 : V <= 0 ? p.I : V >= o._K ? 0 : p.I * (1 - V / o._K)); }, X(-2), X(6), { c: '--c1', w: 2 }); g.circle(X(p.V), Y(o.cur), 4, { px: true, fill: '--c1' }); g.text(X(0), gy - 0.25, '0 V', { fs: 9, c: '--muted' }); g.text(gx + gw, gy - 0.25, 'กราฟกระแสกับ V', { a: 'right', fs: 10, c: '--muted' });
    }
  },
  three: {
    cam() { return { pos: [2.6, 3.2, 6.4], target: [3, 1.2, 0] }; },
    build(T, p) {
      T.floor(12, { step: 0.5, y: -0.6 }).position.x = 3;
      const pl = T.box(0.25, 2.6, 2, '--muted'); pl.position.set(1.15, 1.5, 0); T.label(METALS[p.met][0], '--ink', { pos: [1.15, 3.1, 0] });
      const cl = T.box(0.3, 2.6, 2, '--block'); cl.position.set(6.5, 1.5, 0); T.label('ขั้วรับ', '--ink', { pos: [6.5, 3.1, 0] });
      const lc = T.color(p.nm >= 380 && p.nm <= 750 ? wlColor(p.nm) : p.nm < 380 ? '--c4' : '--bad'), lamp = T.cyl(0.3, 0.45, 0.6, '--ink'); lamp.position.set(-1.6, 4.6, 0); lamp.rotation.z = -0.7;
      const beam = T.cyl(0.05, 0.6, 3.6, '--c5', { opacity: 0.12, cast: false }); beam.material.color.copy(lc); beam.position.set(-0.3, 3.1, 0); beam.rotation.z = -0.7;
      const ph = [], el = []; for (let i = 0; i < 60; i++) { const s = T.sphere(0.07, '--c5', { cast: false }); s.material = new T.THREE.MeshStandardMaterial({ color: lc, emissive: lc, emissiveIntensity: 0.6 }); s.visible = false; ph.push(s); }
      for (let i = 0; i < 120; i++) { const s = T.sphere(0.06, '--neg', { cast: false }); s.visible = false; el.push(s); }
      T.label('V = ' + fmt(p.V) + ' V', '--ink', { pos: [3.8, -0.3, 1.1] });
      return { ph, el, aE: T.vec('--neg', 'v อิเล็กตรอน', { kind: 'v', r: 0.025, pad: 0.15 }) };
    },
    update(ob, st, p, o) {
      const zf = i => ((i * 0.618) % 1 - 0.5) * 1.6;
      ob.ph.forEach((s, i) => { const q = (st.ph || [])[i]; s.visible = !!q; if (q) s.position.set(q.x + 0.3, q.y + 0.3, zf(i)); });
      ob.el.forEach((s, i) => { const e = (st.el || [])[i]; s.visible = !!e; if (e) s.position.set(e.x, e.y + 0.3, zf(i + 7)); });
      const e = (st.el || [])[0]; e ? ob.aE.set([e.x, e.y + 0.45, zf(7)], [Math.max(-0.8, Math.min(0.8, e.vx * 0.25)), 0, 0], 'v อิเล็กตรอน') : ob.aE.hide();
    }
  },
  notes: ['แสงความยาวคลื่นยาวเกิน λ₀ ไม่ทำให้อิเล็กตรอนหลุด ไม่ว่าจะเข้มเท่าใด (อธิบายด้วยทฤษฎีคลื่นไม่ได้)', 'ความเข้มแสงเพิ่มจำนวนโฟตอน จึงเพิ่มกระแส แต่ไม่เพิ่มพลังงานจลน์สูงสุด', 'ความต่างศักย์หยุดยั้งขึ้นกับความถี่แสงและชนิดโลหะเท่านั้น']
});

// ---------- 3 ระดับพลังงานไฮโดรเจน ----------
const En = n => -13.6 / (n * n);
CASES.push({
  name: 'สเปกตรัมไฮโดรเจน', group: GRP, aspect: 16 / 9, title: 'ระดับพลังงานของอะตอมไฮโดรเจนและเส้นสเปกตรัม',
  desc: 'เลือกระดับพลังงานเริ่มต้นและสุดท้าย อิเล็กตรอนกระโดดลงจะปล่อยโฟตอน กระโดดขึ้นต้องดูดกลืนโฟตอน ดูความยาวคลื่นและสีของแสง และชื่ออนุกรมสเปกตรัม',
  formula: 'Eₙ = −13.6/n² eV &nbsp;|&nbsp; ΔE = hf = hc/λ &nbsp;|&nbsp; 1/λ = R(1/n<sub>f</sub>² − 1/n<sub>i</sub>²)',
  params: [
    { id: 'ni', label: 'ระดับเริ่มต้น nᵢ', unit: '', min: 1, max: 7, step: 1, def: 3 },
    { id: 'nf', label: 'ระดับสุดท้าย n_f', unit: '', min: 1, max: 7, step: 1, def: 2 }
  ],
  outs: [{ id: 'dE', name: 'พลังงานโฟตอน', unit: 'eV' }, { id: 'nm', name: 'ความยาวคลื่น', unit: 'nm' }, { id: 'ser', name: 'อนุกรม', unit: '' }, { id: 'kind', name: 'ชนิด', unit: '' }, { id: 'band', name: 'ย่านแสง', unit: '' }],
  compute(p) { const dE = Math.abs(En(p.nf) - En(p.ni)), nm = dE > 0 ? h * c / (dE * eV) * 1e9 : Infinity; const lo = Math.min(p.ni, p.nf); return { dE, nm, ser: ['', 'ไลแมน', 'บัลเมอร์', 'พาสเชน', 'แบร็กเกตต์', 'ฟุนด์', 'ฮัมฟรีส์'][lo] || '—', kind: p.ni > p.nf ? 'ปล่อยแสง' : p.ni < p.nf ? 'ดูดกลืนแสง' : 'ไม่เปลี่ยนระดับ', band: nm < 380 ? 'อัลตราไวโอเลต' : nm <= 750 ? 'แสงที่ตามองเห็น' : 'อินฟราเรด' }; },
  sim: {
    dt: 1 / 60, tmax: 3, loop: true,
    init() { return {}; },
    step() { },
    view() { return { x0: 0, x1: 16, y0: -0.4, y1: 9.4, pad: 4 }; },
    draw(g, st, p, o) {
      const Y = E => 8.6 + E / 13.6 * 8.2;
      for (let n = 1; n <= 7; n++) { g.line(1.5, Y(En(n)), 8.5, Y(En(n)), { c: '--ink', w: n === p.ni || n === p.nf ? 2.5 : 1 }); g.text(1.3, Y(En(n)), 'n = ' + n, { a: 'right', fs: 11, base: 'middle' }); if (n <= 4) g.text(8.7, Y(En(n)), fmt(En(n)) + ' eV', { a: 'left', fs: 10, c: '--muted', base: 'middle' }); }
      g.line(1.5, Y(0), 8.5, Y(0), { c: '--muted', dash: [4, 4], w: 1 }); g.text(8.7, Y(0), '0 eV (หลุด)', { a: 'left', fs: 10, c: '--muted', base: 'middle' });
      if (p.ni !== p.nf) {
        const f = clamp(st.t / 1.2, 0, 1), y = Y(En(p.ni)) + (Y(En(p.nf)) - Y(En(p.ni))) * f; g.arrow(5, Y(En(p.ni)), 5, Y(En(p.nf)), { c: '--c4', w: 2.5 }); g.circle(5, y, 7, { px: true, fill: '--neg', c: '--ink' });
        const col = o.nm >= 380 && o.nm <= 750 ? wlColor(o.nm) : g.col('--muted');
        if (st.t > 1.2 || p.ni < p.nf) { const s = p.ni > p.nf ? (st.t - 1.2) : st.t - 0, x0 = p.ni > p.nf ? 5.3 : 13 - s * 4, xx = p.ni > p.nf ? 5.3 + s * 4 : x0; g.ctx.save(); g.ctx.strokeStyle = col; g.ctx.lineWidth = 3; g.ctx.beginPath(); for (let i = 0; i <= 30; i++) { const x = xx + i * 0.07, yy = (Y(En(p.ni)) + Y(En(p.nf))) / 2 + Math.sin(i * 1.1) * 0.25; i ? g.ctx.lineTo(g.X(x), g.Y(yy)) : g.ctx.moveTo(g.X(x), g.Y(yy)); } g.ctx.stroke(); g.ctx.restore(); }
      }
      // แถบสเปกตรัม
      const sx = 10, sw = 5.6, X = nm => sx + (nm - 380) / 370 * sw;
      for (let nm = 380; nm <= 750; nm += 2) g.rect(X(nm), 4, sw / 185, 1, { fill: wlColor(nm), c: 'none' });
      g.text(sx + sw / 2, 5.4, 'แสงที่ตามองเห็น 380–750 nm', { fs: 10, c: '--muted' });
      [[3, 2], [4, 2], [5, 2], [6, 2]].forEach(([a, b]) => { const l = h * c / ((En(b) - En(a)) * eV) * 1e9; g.line(X(l), 3.8, X(l), 3.5, { c: '--ink', w: 1 }); });
      if (o.nm >= 380 && o.nm <= 750) { g.line(X(o.nm), 3.7, X(o.nm), 5.3, { c: '--ink', w: 3 }); g.text(X(o.nm), 3.2, fmt(o.nm) + ' nm', { fs: 11, b: true }); }
      else g.text(sx + sw / 2, 3.2, `${fmt(o.nm)} nm (${o.band} มองไม่เห็น)`, { fs: 11, b: true });
      g.text(sx + sw / 2, 6.3, `${o.kind}  อนุกรม${o.ser}`, { fs: 13, b: true });
    }
  },
  three: {
    cam() { return { pos: [0, 6, 9], target: [0, 0, 0] }; },
    build(T, p, o) {
      const nuc = T.sphere(0.22, '--pos', { emissive: '--pos', ei: 0.3 }); const rr = n => 0.35 * n * n * 0.42 + 0.3;   // รัศมีวงโคจร ∝ n² (ย่อสเกล)
      for (let n = 1; n <= 7; n++) { const ring = T.torus(rr(n), n === p.ni || n === p.nf ? 0.025 : 0.01, n === p.ni || n === p.nf ? '--c4' : '--line'); ring.rotation.x = Math.PI / 2; if (n <= 4 || n === p.ni || n === p.nf) { const a = -0.5 - n * 0.32; T.label('n = ' + n, n === p.ni || n === p.nf ? '--c4' : '--muted', { pos: [rr(n) * Math.cos(a), 0, -rr(n) * Math.sin(a)] }); } }
      const col = o.nm >= 380 && o.nm <= 750 ? wlColor(o.nm) : '#' + T.color('--muted').getHexString();
      const wave = T.line('--c5', { max: 61 }); wave.material.color.set(col);
      T.label(`${o.kind} · ${fmt(o.nm)} nm · ${o.band}`, '--ink', { pos: [0, 2.6, -rr(7)] });
      return { rr, e: T.sphere(0.13, '--neg'), wave, jump: T.vec('--c4', null, { kind: 'v', r: 0.02, line: false }) };
    },
    update(ob, st, p) {
      const f = clamp(st.t / 1.2, 0, 1), r = ob.rr(p.ni) + (ob.rr(p.nf) - ob.rr(p.ni)) * (p.ni === p.nf ? 0 : f), a = st.t * 2.2;
      ob.e.position.set(r * Math.cos(a), 0, r * Math.sin(a));
      p.ni !== p.nf && f < 1 ? ob.jump.set([ob.rr(p.ni) * Math.cos(a), 0.05, ob.rr(p.ni) * Math.sin(a)], [(ob.rr(p.nf) - ob.rr(p.ni)) * Math.cos(a), 0, (ob.rr(p.nf) - ob.rr(p.ni)) * Math.sin(a)]) : ob.jump.hide();
      const emit = p.ni > p.nf, show = p.ni !== p.nf && (emit ? st.t > 1.2 : true); ob.wave.visible = show;
      if (show) { const s = emit ? (st.t - 1.2) * 3 : 4 - st.t * 3, d = Math.max(0, s), pts = []; for (let i = 0; i <= 60; i++) { const x = r + 0.2 + d + i * 0.05; pts.push([x * Math.cos(a), 0.25 * Math.sin(i * 0.9), x * Math.sin(a)]); } ob.wave.set(pts); }
    }
  },
  notes: ['อนุกรมบัลเมอร์ (ลงมาที่ n = 2) มีเส้นที่ตามองเห็น 4 เส้น เส้นแดง 656 nm มาจาก 3 → 2', 'กระโดดลงมาที่ n = 1 (ไลแมน) ได้รังสีอัลตราไวโอเลตทั้งหมด', 'ระดับพลังงานยิ่งสูงยิ่งชิดกัน เข้าใกล้ 0 eV ซึ่งคือการแตกตัวเป็นไอออน']
});

Lab.add('general', CASES);
})();
