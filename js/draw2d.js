/* ตัวช่วยวาด 2D บน canvas ด้วยพิกัดโลก (เมตร แกน y ชี้ขึ้น)
 * ทุกฟังก์ชันรับพิกัดโลก ยกเว้นที่ลงท้ายด้วย Px
 * สีใช้ชื่อ token เช่น '--ray' (เปลี่ยนตามโหมดมืด/สว่างให้เอง) หรือสีตรงๆ เช่น '#f00'
 */
(function () {
'use strict';
const TAU = Math.PI * 2;

function G2(canvas) {
  this.cv = canvas;
  this.ctx = canvas.getContext('2d');
  this.W = 640; this.H = 360; this.s = 1; this.ox = 0; this.oy = 0;
  this.cache = {};
  this.font = getComputedStyle(document.documentElement).getPropertyValue('--f-body') || 'sans-serif';
}
const P = G2.prototype;

P.refreshColors = function () { this.cache = {}; };
P.col = function (c) {
  if (!c) return this.col('--ink');
  if (c[0] !== '-') return c;
  if (!(c in this.cache)) this.cache[c] = getComputedStyle(document.documentElement).getPropertyValue(c).trim() || '#888';
  return this.cache[c];
};
P.resize = function (cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  this.cv.width = Math.round(cssW * dpr); this.cv.height = Math.round(cssH * dpr);
  this.cv.style.height = cssH + 'px';
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.W = cssW; this.H = cssH;
};
// view = {x0,x1,y0,y1} พื้นที่โลกที่ต้องเห็นทั้งหมด (สเกลเท่ากันสองแกน)
P.frame = function (v) {
  const pad = v.pad == null ? 14 : v.pad;
  const w = Math.max(1e-9, v.x1 - v.x0), h = Math.max(1e-9, v.y1 - v.y0);
  this.s = Math.min((this.W - 2 * pad) / w, (this.H - 2 * pad) / h);
  this.ox = (this.W - this.s * w) / 2 - this.s * v.x0;
  this.oy = v.bottom ? this.H - pad + this.s * v.y0 : this.H - (this.H - this.s * h) / 2 + this.s * v.y0;
  this.view = v;
};
P.X = function (x) { return this.ox + this.s * x; };
P.Y = function (y) { return this.oy - this.s * y; };
P.toWorld = function (px, py) { return [(px - this.ox) / this.s, (this.oy - py) / this.s]; };
// ขอบเขตโลกที่มองเห็นจริง (กว้างกว่า view เมื่อสัดส่วนไม่ตรง)
P.visible = function () { const a = this.toWorld(0, this.H), b = this.toWorld(this.W, 0); return { x0: a[0], y0: a[1], x1: b[0], y1: b[1] }; };

P.clear = function (c) { const x = this.ctx; x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.cv.width, this.cv.height); x.restore(); x.fillStyle = this.col(c || '--panel'); x.fillRect(0, 0, this.W, this.H); };
P._stroke = function (o) {
  const x = this.ctx;
  x.strokeStyle = this.col(o.c || '--ink'); x.lineWidth = o.w || 1.5; x.setLineDash(o.dash || []);
  x.globalAlpha = o.alpha == null ? 1 : o.alpha; x.lineCap = 'round'; x.lineJoin = 'round';
};
P._done = function () { const x = this.ctx; x.setLineDash([]); x.globalAlpha = 1; };

P.grid = function (step, o = {}) {
  const v = this.visible(), x = this.ctx; this._stroke({ c: o.c || '--grid', w: 1 });
  for (let gx = Math.ceil(v.x0 / step) * step; gx <= v.x1; gx += step) { x.beginPath(); x.moveTo(this.X(gx), 0); x.lineTo(this.X(gx), this.H); x.stroke(); }
  for (let gy = Math.ceil(v.y0 / step) * step; gy <= v.y1; gy += step) { x.beginPath(); x.moveTo(0, this.Y(gy)); x.lineTo(this.W, this.Y(gy)); x.stroke(); }
  this._done();
};
P.line = function (x1, y1, x2, y2, o = {}) {
  const x = this.ctx; this._stroke(o); x.beginPath(); x.moveTo(this.X(x1), this.Y(y1)); x.lineTo(this.X(x2), this.Y(y2)); x.stroke(); this._done();
};
P.linePx = function (x1, y1, x2, y2, o = {}) {
  const x = this.ctx; this._stroke(o); x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); this._done();
};
P.path = function (pts, o = {}) {
  if (!pts.length) return;
  const x = this.ctx; this._stroke(o); x.beginPath();
  pts.forEach((p, i) => { const a = this.X(p[0]), b = this.Y(p[1]); i ? x.lineTo(a, b) : x.moveTo(a, b); });
  if (o.close) x.closePath();
  if (o.fill) { x.fillStyle = this.col(o.fill); x.globalAlpha = o.fillAlpha == null ? (o.alpha == null ? 1 : o.alpha) : o.fillAlpha; x.fill(); x.globalAlpha = o.alpha == null ? 1 : o.alpha; }
  if (o.c !== 'none') x.stroke();
  this._done();
};
P.circle = function (cx, cy, r, o = {}) {
  const x = this.ctx; this._stroke(o); x.beginPath();
  x.arc(this.X(cx), this.Y(cy), o.px ? r : Math.max(0.5, r * this.s), 0, TAU);
  if (o.fill) { x.fillStyle = this.col(o.fill); x.fill(); }
  if (o.c !== 'none') x.stroke();
  this._done();
};
P.rect = function (x0, y0, w, h, o = {}) { this.path([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], Object.assign({ close: true }, o)); };
// กล่องหมุนได้ ศูนย์กลาง (cx,cy) มุม ang (rad) ตัวอักษรตรงกลาง
P.box = function (cx, cy, w, h, ang, o = {}) {
  const c = Math.cos(ang || 0), s = Math.sin(ang || 0);
  const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => [cx + a * c - b * s, cy + a * s + b * c]);
  this.path(pts, Object.assign({ close: true, fill: '--block', c: '--ink', w: 2 }, o));
  if (o.label) this.text(cx, cy, o.label, { fs: o.fs || 12, b: true, base: 'middle', c: o.lc || '--ink' });
};
P.arrowPx = function (x1, y1, x2, y2, o = {}) {
  const x = this.ctx, len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 0.5) return;
  const a = Math.atan2(y2 - y1, x2 - x1), hd = Math.min(o.head || 10, len * 0.6);
  this._stroke(o); x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2 - hd * 0.7 * Math.cos(a), y2 - hd * 0.7 * Math.sin(a)); x.stroke();
  x.setLineDash([]); x.fillStyle = this.col(o.c || '--ink'); x.beginPath(); x.moveTo(x2, y2);
  x.lineTo(x2 - hd * Math.cos(a - 0.42), y2 - hd * Math.sin(a - 0.42)); x.lineTo(x2 - hd * Math.cos(a + 0.42), y2 - hd * Math.sin(a + 0.42)); x.closePath(); x.fill();
  this._done();
  if (o.label) {
    const t = o.lpos == null ? 1 : o.lpos, lx = x1 + (x2 - x1) * t, ly = y1 + (y2 - y1) * t;
    const nx = -Math.sin(a), ny = Math.cos(a), off = o.loff == null ? 12 : o.loff;
    const ex = t === 1 ? Math.cos(a) * 10 : 0, ey = t === 1 ? Math.sin(a) * 10 : 0;
    this.textPx(lx + ex + nx * (o.lside === -1 ? -off : off) * (t === 1 ? 0.6 : 1), ly + ey + ny * (o.lside === -1 ? -off : off) * (t === 1 ? 0.6 : 1), o.label, { c: o.lc || o.c, fs: o.fs || 12, b: true, base: 'middle', bg: o.bg });
  }
};
P.arrow = function (x1, y1, x2, y2, o = {}) { this.arrowPx(this.X(x1), this.Y(y1), this.X(x2), this.Y(y2), o); };
// เวกเตอร์ (dx,dy) ในหน่วยโลก; o.px = true แปลว่า dx,dy เป็นพิกเซล (y ขึ้น)
P.vec = function (x, y, dx, dy, o = {}) {
  const a = this.X(x), b = this.Y(y);
  if (o.px) this.arrowPx(a, b, a + dx, b - dy, o); else this.arrowPx(a, b, this.X(x + dx), this.Y(y + dy), o);
};
P.textPx = function (px, py, s, o = {}) {
  const x = this.ctx;
  x.font = `${o.b ? 600 : 400} ${o.fs || 12}px ${this.font}`;
  x.textAlign = o.a || 'center'; x.textBaseline = o.base || 'alphabetic';
  if (o.bg) {
    const w = x.measureText(s).width, h = (o.fs || 12) * 1.25;
    let bx = px - (x.textAlign === 'center' ? w / 2 : x.textAlign === 'right' ? w : 0);
    let by = x.textBaseline === 'middle' ? py - h / 2 : py - h * 0.8;
    x.fillStyle = this.col(o.bg === true ? '--panel' : o.bg); x.globalAlpha = 0.85; x.fillRect(bx - 3, by, w + 6, h); x.globalAlpha = 1;
  }
  x.fillStyle = this.col(o.c || '--ink'); x.fillText(s, px, py);
};
P.text = function (wx, wy, s, o = {}) { this.textPx(this.X(wx) + (o.dx || 0), this.Y(wy) + (o.dy || 0), s, o); };
// สปริงซิกแซก แอมพลิจูดหน่วยพิกเซล
P.spring = function (x1, y1, x2, y2, o = {}) {
  const a = [this.X(x1), this.Y(y1)], b = [this.X(x2), this.Y(y2)];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) return;
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux;
  const n = o.n || 10, amp = o.amp || 7, lead = Math.min(10, L * 0.12);
  const x = this.ctx; this._stroke(Object.assign({ w: 2, c: '--spring' }, o)); x.beginPath(); x.moveTo(a[0], a[1]);
  x.lineTo(a[0] + ux * lead, a[1] + uy * lead);
  const body = L - 2 * lead;
  for (let i = 0; i < n * 2; i++) {
    const t = lead + body * (i + 0.5) / (n * 2), sg = i % 2 ? -1 : 1;
    x.lineTo(a[0] + ux * t + nx * amp * sg, a[1] + uy * t + ny * amp * sg);
  }
  x.lineTo(b[0] - ux * lead, b[1] - uy * lead); x.lineTo(b[0], b[1]); x.stroke(); this._done();
};
// พื้นพร้อมลายขีด
P.ground = function (x0, x1, y, o = {}) {
  const x = this.ctx, X0 = this.X(x0), X1 = this.X(x1), Y = this.Y(y);
  x.fillStyle = this.col(o.fill || '--ground'); x.globalAlpha = 0.55; x.fillRect(X0, Y, X1 - X0, o.depth || 10); x.globalAlpha = 1;
  this.linePx(X0, Y, X1, Y, { c: o.c || '--ink', w: 2 });
};
// ผนังแนวตั้ง ด้าน side = -1 (ลายอยู่ซ้าย) หรือ 1
P.wall = function (xw, y0, y1, side = -1, o = {}) {
  const x = this.ctx, X = this.X(xw), A = this.Y(y0), B = this.Y(y1);
  x.fillStyle = this.col(o.fill || '--ground'); x.globalAlpha = 0.55; x.fillRect(side < 0 ? X - 10 : X, B, 10, A - B); x.globalAlpha = 1;
  this.linePx(X, A, X, B, { c: '--ink', w: 2 });
};
// ส่วนโค้งแสดงมุม รัศมีเป็นพิกเซล มุมเรเดียนตามแกนโลก (ทวนเข็มจาก +x)
P.angle = function (cx, cy, rpx, a0, a1, label, o = {}) {
  const x = this.ctx; this._stroke(Object.assign({ c: '--accent', w: 1.6 }, o)); x.beginPath();
  x.arc(this.X(cx), this.Y(cy), rpx, -a0, -a1, a1 > a0); x.stroke(); this._done();
  if (label) { const m = (a0 + a1) / 2; this.textPx(this.X(cx) + (rpx + 14) * Math.cos(m), this.Y(cy) - (rpx + 14) * Math.sin(m), label, { c: o.c || '--accent', fs: 12, b: true, base: 'middle' }); }
};
// เส้นบอกระยะ พร้อมข้อความ o.off = ระยะเลื่อนพิกเซลตั้งฉาก
P.dim = function (x1, y1, x2, y2, label, o = {}) {
  let a = [this.X(x1), this.Y(y1)], b = [this.X(x2), this.Y(y2)];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2) return;
  const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, off = o.off || 0;
  a = [a[0] + nx * off, a[1] + ny * off]; b = [b[0] + nx * off, b[1] + ny * off];
  const c = o.c || '--muted';
  this.linePx(a[0], a[1], b[0], b[1], { c, w: 1.2 });
  [a, b].forEach(p => this.linePx(p[0] - nx * 5, p[1] - ny * 5, p[0] + nx * 5, p[1] + ny * 5, { c, w: 1.2 }));
  if (label) this.textPx((a[0] + b[0]) / 2 + nx * 11, (a[1] + b[1]) / 2 + ny * 11, label, { c: o.lc || c, fs: o.fs || 11, b: o.b, base: 'middle', bg: true });
};
P.pulley = function (cx, cy, r, ang, o = {}) {
  this.circle(cx, cy, r, { fill: '--panel', c: '--ink', w: 2 });
  this.circle(cx, cy, r * 0.25, { fill: '--ink', c: 'none' });
  for (let k = 0; k < 3; k++) { const a = (ang || 0) + k * TAU / 3; this.line(cx, cy, cx + r * 0.85 * Math.cos(a), cy + r * 0.85 * Math.sin(a), { c: '--muted', w: 1.2 }); }
};
// ห่วงจับลาก (พิกเซล) สำหรับวัตถุที่ลากได้
P.handle = function (wx, wy, active, hover) {
  const x = this.ctx; x.beginPath(); x.arc(this.X(wx), this.Y(wy), active ? 13 : 11, 0, TAU);
  x.strokeStyle = this.col('--accent'); x.lineWidth = active ? 2.5 : 1.5; x.setLineDash(active || hover ? [] : [3, 3]);
  x.globalAlpha = active || hover ? 0.95 : 0.55; x.stroke(); this._done();
};
// แท่งพลังงาน/ปริมาณ แนวตั้งในพิกัดพิกเซล
P.barsPx = function (x0, yBase, items, o = {}) {
  const bw = o.bw || 22, gap = o.gap || 10, hMax = o.h || 90, vmax = o.max || Math.max(1e-9, ...items.map(i => Math.abs(i.v)));
  items.forEach((it, i) => {
    const bx = x0 + i * (bw + gap), h = hMax * Math.max(0, it.v) / vmax;
    this.ctx.fillStyle = this.col(it.c); this.ctx.fillRect(bx, yBase - h, bw, h);
    this.textPx(bx + bw / 2, yBase + 13, it.label, { fs: 11, c: '--muted' });
    if (o.values) this.textPx(bx + bw / 2, yBase - h - 4, o.values(it), { fs: 10, c: '--ink' });
  });
  this.linePx(x0 - 4, yBase, x0 + items.length * (bw + gap) - gap + 4, yBase, { c: '--muted', w: 1 });
};
// เส้นทางวาดจากฟังก์ชัน y=f(x)
P.fn = function (f, xa, xb, o = {}) { const n = o.n || 120, pts = []; for (let i = 0; i <= n; i++) { const xx = xa + (xb - xa) * i / n, yy = f(xx); if (isFinite(yy)) pts.push([xx, yy]); } this.path(pts, o); };

Lab.G2 = G2;
})();
