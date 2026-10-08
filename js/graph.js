/* กราฟสดระหว่างแอนิเมชัน
 * case.plot = { x?: {label, unit, f(st,P,o)} (ไม่ใส่ = เวลา), series: [{label, unit, c, f(st,P,o), on?}] }
 * ถ้าแกน x เป็นเวลา: วาดแยกเป็นแถบซ้อนกัน แถบละหนึ่งปริมาณ (เช่น x-t, v-t, a-t)
 * ถ้ากำหนด x เอง: วาดทุกปริมาณในกราฟเดียว (เช่น P-V)
 */
(function () {
'use strict';
function Graph(canvas) { this.g = new Lab.G2(canvas); this.def = null; this.data = []; }
const P = Graph.prototype;
P.setup = function (def) { this.def = def; this.on = def ? def.series.map(s => s.on !== false) : []; this.reset(); };
P.reset = function () { this.data = []; };
P.push = function (st, Pm, o) {
  if (!this.def) return;
  const x = this.def.x ? this.def.x.f(st, Pm, o) : st.t;
  const ys = this.def.series.map(s => s.f(st, Pm, o));
  if (!isFinite(x)) return;
  this.data.push([x, ys]);
  if (this.data.length > 6000) this.data = this.data.filter((_, i) => i % 2 === 0);
};
P.toggle = function (i) { this.on[i] = !this.on[i]; if (!this.on.some(Boolean)) this.on[i] = true; };
const nice = (lo, hi) => {
  if (!isFinite(lo) || !isFinite(hi)) return [0, 1];
  if (hi - lo < 1e-9) { const d = Math.abs(hi) * 0.1 || 1; lo -= d; hi += d; }
  const pad = (hi - lo) * 0.08; return [lo - pad, hi + pad];
};
const step = span => { const r = Math.pow(10, Math.floor(Math.log10(Math.max(1e-12, span)))), m = span / r; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * r; };
const fmtTick = v => { const a = Math.abs(v); return a === 0 ? '0' : a >= 1000 || a < 0.01 ? v.toExponential(0) : +v.toPrecision(3) + ''; };

P.draw = function () {
  const g = this.g, c = g.ctx, W = g.W, H = g.H; g.clear('--panel');
  if (!this.def) return;
  const S = this.def.series, vis = S.map((s, i) => i).filter(i => this.on[i]), D = this.data;
  const L = 58, R = 12, T = 8, B = 26;
  const xs = D.map(d => d[0]);
  let xr = this.def.x ? nice(Math.min(...xs, Infinity), Math.max(...xs, -Infinity)) : [0, Math.max(this.def.tmin || 2, xs.length ? xs[xs.length - 1] : 0)];
  if (!D.length) xr = this.def.x ? [0, 1] : [0, this.def.tmin || 2];
  const PX = x => L + (x - xr[0]) / (xr[1] - xr[0]) * (W - L - R);
  const strips = (this.def.x || this.def.overlay) ? [vis] : vis.map(i => [i]);
  const sh = (H - T - B) / strips.length;
  strips.forEach((idxs, k) => {
    const y0 = T + k * sh, y1 = y0 + sh - (strips.length > 1 ? 6 : 0);
    let lo = Infinity, hi = -Infinity;
    D.forEach(d => idxs.forEach(i => { const v = d[1][i]; if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }));
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    if (lo > 0 && lo < hi * 0.4) lo = 0; if (hi < 0 && hi > lo * 0.4) hi = 0;
    const yr = nice(lo, hi), PY = v => y1 - (v - yr[0]) / (yr[1] - yr[0]) * (y1 - y0);
    // กรอบและเส้นกริด
    c.fillStyle = g.col('--bg'); c.globalAlpha = 0.5; c.fillRect(L, y0, W - L - R, y1 - y0); c.globalAlpha = 1;
    const ys = step((yr[1] - yr[0]) / 3);
    for (let v = Math.ceil(yr[0] / ys) * ys; v <= yr[1]; v += ys) {
      const yy = PY(v); g.linePx(L, yy, W - R, yy, { c: Math.abs(v) < ys * 1e-6 ? '--muted' : '--grid', w: 1 });
      g.textPx(L - 5, yy, fmtTick(v), { a: 'right', base: 'middle', fs: 10, c: '--muted' });
    }
    const s0 = S[idxs[0]];
    g.textPx(6, y0 + 10, idxs.length === 1 ? s0.label : (this.def.yLabel || ''), { a: 'left', fs: 11, b: true, c: idxs.length === 1 ? s0.c : '--ink' });
    if (idxs.length === 1 && s0.unit) g.textPx(6, y0 + 24, s0.unit, { a: 'left', fs: 10, c: '--muted' });
    idxs.forEach(i => {
      c.beginPath(); let started = false;
      D.forEach(d => { const v = d[1][i]; if (!isFinite(v)) { started = false; return; } const px = PX(d[0]), py = PY(v); started ? c.lineTo(px, py) : c.moveTo(px, py); started = true; });
      c.strokeStyle = g.col(S[i].c); c.lineWidth = 2; c.setLineDash([]); c.stroke();
      if (D.length) { const d = D[D.length - 1], v = d[1][i]; if (isFinite(v)) { c.fillStyle = g.col(S[i].c); c.beginPath(); c.arc(PX(d[0]), PY(v), 3.5, 0, 7); c.fill(); } }
    });
  });
  // แกน x
  const xsStep = step((xr[1] - xr[0]) / 5);
  for (let v = Math.ceil(xr[0] / xsStep) * xsStep; v <= xr[1] + 1e-9; v += xsStep) g.textPx(PX(v), H - 9, fmtTick(v), { fs: 10, c: '--muted' });
  g.textPx(W - R, H - 9, this.def.x ? `${this.def.x.label} (${this.def.x.unit})` : 't (s)', { a: 'right', fs: 10, b: true, c: '--ink', bg: true });
};
Lab.Graph = Graph;
})();
