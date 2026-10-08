/* มุมมอง 3 มิติ (three.js r149 ในโฟลเดอร์ vendor/)
 * แบบจำลองที่มี 3D กำหนด case.three = { cam:{pos:[x,y,z], target:[x,y,z]}, build(T,P,o) -> obj, update(obj,st,P,o,T) }
 * T คือชุดตัวช่วยด้านล่าง (สร้างวัตถุ ลูกศร ป้ายข้อความ รอยทาง สปริง)
 * แกน: y ชี้ขึ้น หน่วยเมตร ลากเมาส์เพื่อหมุนมุมกล้อง ล้อเมาส์เพื่อซูม
 */
(function () {
'use strict';
if (typeof THREE === 'undefined') { Lab.V3 = null; return; }

const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
const color = c => new THREE.Color(c && c[0] === '-' ? css(c) : (c || '#888'));

function V3(host) {
  this.host = host;
  this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(this.renderer.domElement);
  this.labelLayer = document.createElement('div'); this.labelLayer.className = 'labels3d'; host.appendChild(this.labelLayer);
  this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.01, 5000);
  this.orb = { r: 10, th: 0.6, ph: 1.1, target: new THREE.Vector3() };
  this._bindControls();
  this.scene = null; this.obj = null; this.labels = [];
}
const P = V3.prototype;

P._bindControls = function () {
  const el = this.renderer.domElement; let drag = null;
  el.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', e => {
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
    if (drag.pan) {
      const k = this.orb.r * 0.0016, cam = this.camera;
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrix, 1);
      this.orb.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
    } else { this.orb.th -= dx * 0.008; this.orb.ph = Math.max(0.08, Math.min(Math.PI - 0.08, this.orb.ph - dy * 0.008)); }
    this.dirty = true;
  });
  el.addEventListener('pointerup', () => { drag = null; });
  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('wheel', e => { e.preventDefault(); this.orb.r *= Math.exp(e.deltaY * 0.0012); this.orb.r = Math.max(0.2, Math.min(4000, this.orb.r)); }, { passive: false });
};
P.resize = function (w, h) { this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.w = w; this.h = h; };
P.setCam = function (pos, target) {
  const t = new THREE.Vector3(...target), p = new THREE.Vector3(...pos).sub(t);
  this.orb.target.copy(t); this.orb.r = p.length(); this.orb.ph = Math.acos(Math.max(-1, Math.min(1, p.y / this.orb.r))); this.orb.th = Math.atan2(p.x, p.z);
};
P._applyCam = function () {
  const o = this.orb, c = this.camera;
  c.position.set(o.target.x + o.r * Math.sin(o.ph) * Math.sin(o.th), o.target.y + o.r * Math.cos(o.ph), o.target.z + o.r * Math.sin(o.ph) * Math.cos(o.th));
  c.lookAt(o.target);
};
P.dispose = function () {
  if (!this.scene) return;
  this.scene.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) [].concat(m.material).forEach(x => x.dispose()); });
  this.labelLayer.innerHTML = ''; this.labels = []; this.scene = null; this.obj = null;
};
// สร้างฉากใหม่ keepCam = true เพื่อคงมุมกล้องเดิม
P.build = function (cs, Pm, o, keepCam) {
  this.dispose();
  const scene = new THREE.Scene(); this.scene = scene; this.cs = cs;
  scene.background = color('--panel');
  scene.add(new THREE.HemisphereLight(0xffffff, color('--ground'), 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(8, 18, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); const sc = cs.three.shadow || 20;
  Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 0.5, far: 200 }); sun.shadow.bias = -0.0005;
  scene.add(sun); this.sun = sun;
  const T = this.helpers();
  if (!keepCam || !this._camSet) { const cm = cs.three.cam ? cs.three.cam(Pm, o) : { pos: [6, 5, 10], target: [0, 1, 0] }; this.setCam(cm.pos, cm.target); this._camSet = true; }
  this.T = T;
  this.obj = cs.three.build(T, Pm, o) || {};
};
P.resetCam = function () { this._camSet = false; };
P.render = function (st, Pm, o) {
  if (!this.scene) return;
  if (this.cs.three.update) this.cs.three.update(this.obj, st, Pm, o, this.T);
  this._applyCam();
  this.renderer.render(this.scene, this.camera);
  // ป้ายข้อความ
  const v = new THREE.Vector3();
  this.labels.forEach(l => {
    if (!l.visible) { l.el.style.display = 'none'; return; }
    v.copy(l.pos).project(this.camera);
    if (v.z > 1) { l.el.style.display = 'none'; return; }
    l.el.style.display = ''; l.el.style.transform = `translate(-50%,-50%) translate(${(v.x + 1) / 2 * this.w}px,${(1 - v.y) / 2 * this.h}px)`;
  });
};

P.helpers = function () {
  const self = this, scene = this.scene;
  const mat = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: color(c), roughness: 0.55, metalness: 0.05 }, o.opacity != null ? { transparent: true, opacity: o.opacity } : {}, o.emissive ? { emissive: color(o.emissive), emissiveIntensity: o.ei || 0.6 } : {}, o.side ? { side: o.side } : {}));
  const mesh = (geo, c, o = {}) => { const m = new THREE.Mesh(geo, o.material || mat(c, o)); m.castShadow = o.cast !== false; m.receiveShadow = !!o.receive; if (o.add !== false) (o.parent || scene).add(m); return m; };
  const T = {
    THREE, scene, color, mat, mesh,
    group(parent) { const g = new THREE.Group(); (parent || scene).add(g); return g; },
    box(w, h, d, c, o) { return mesh(new THREE.BoxGeometry(w, h, d), c, o); },
    sphere(r, c, o) { return mesh(new THREE.SphereGeometry(r, 32, 20), c, o); },
    cyl(rt, rb, h, c, o) { return mesh(new THREE.CylinderGeometry(rt, rb, h, 32), c, o); },
    torus(r, tube, c, o) { return mesh(new THREE.TorusGeometry(r, tube, 16, 64), c, o); },
    // พื้น size×size พร้อมเส้นกริด
    floor(size, o = {}) {
      const g = mesh(new THREE.PlaneGeometry(size, size), o.c || '--ground', { receive: true, cast: false, opacity: o.opacity == null ? 0.6 : o.opacity });
      g.rotation.x = -Math.PI / 2; g.position.y = o.y || 0;
      if (o.grid !== false) { const gr = new THREE.GridHelper(size, Math.round(size / (o.step || 1)), color('--muted'), color('--line')); gr.position.y = (o.y || 0) + 0.002; gr.material.opacity = 0.45; gr.material.transparent = true; scene.add(gr); }
      return g;
    },
    // ลูกศรปรับได้: a.set(origin[x,y,z], vec[x,y,z])
    arrow(c, o = {}) {
      const g = new THREE.Group(), m = mat(c, { emissive: c, ei: 0.25 });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 12), m), head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 16), m);
      g.add(shaft, head); (o.parent || scene).add(g); const r = o.r || 0.04;
      g.set = (org, vec) => {
        const V = new THREE.Vector3(...vec), L = V.length(); g.visible = L > 1e-6; if (!g.visible) return g;
        const hl = Math.min(L * 0.4, r * 6), sl = L - hl;
        shaft.scale.set(r, sl, r); shaft.position.set(0, sl / 2, 0); head.scale.set(r * 2.6, hl, r * 2.6); head.position.set(0, sl + hl / 2, 0);
        g.position.set(...org); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), V.normalize()); return g;
      };
      return g;
    },
    // เส้นจากรายการจุด l.set(pts)
    line(c, o = {}) {
      const n = o.max || 2, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      const m = o.dash ? new THREE.LineDashedMaterial({ color: color(c), dashSize: o.dash, gapSize: o.dash }) : new THREE.LineBasicMaterial({ color: color(c), transparent: o.opacity != null, opacity: o.opacity == null ? 1 : o.opacity });
      const L = new THREE.Line(geo, m); (o.parent || scene).add(L);
      L.set = pts => { const a = geo.attributes.position; const k = Math.min(n, pts.length); for (let i = 0; i < k; i++) a.setXYZ(i, pts[i][0], pts[i][1], pts[i][2]); geo.setDrawRange(0, k); a.needsUpdate = true; geo.computeBoundingSphere(); if (o.dash) L.computeLineDistances(); return L; };
      if (o.pts) L.set(o.pts);
      return L;
    },
    // รอยทาง trail.push([x,y,z]) / trail.clear()
    trail(c, max = 2000) {
      const L = T.line(c, { max }); const pts = [];
      L.push = p => { pts.push(p); if (pts.length > max) pts.shift(); L.set(pts); };
      L.clear = () => { pts.length = 0; L.set([]); }; L.pts = pts; return L;
    },
    // สปริงเกลียว s.set(a[x,y,z], b[x,y,z])
    spring(c, o = {}) {
      const coils = o.coils || 12, R = o.r || 0.12, n = coils * 16 + 2;
      const L = T.line(c || '--spring', { max: n }); L.material.linewidth = 2;
      L.set2 = (a, b) => {
        const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length(), u = d.clone().normalize();
        let v1 = new THREE.Vector3(0, 1, 0); if (Math.abs(u.dot(v1)) > 0.9) v1.set(1, 0, 0);
        const p = v1.clone().cross(u).normalize(), q = u.clone().cross(p);
        const pts = [a]; for (let i = 0; i < n - 2; i++) { const t = (i + 0.5) / (n - 2), ang = t * coils * Math.PI * 2; const P0 = A.clone().addScaledVector(u, len * (0.06 + 0.88 * t)).addScaledVector(p, R * Math.cos(ang)).addScaledVector(q, R * Math.sin(ang)); pts.push([P0.x, P0.y, P0.z]); }
        pts.push(b); return L.set(pts);
      };
      return L;
    },
    // ป้ายข้อความ HTML ติดตามจุดในฉาก
    label(text, c, o = {}) {
      const el = document.createElement('span'); el.className = 'lab3d'; el.textContent = text; if (c) el.style.color = css(c);
      self.labelLayer.appendChild(el);
      const l = { el, pos: new THREE.Vector3(...(o.pos || [0, 0, 0])), visible: true, set(t, p) { if (t != null && el.textContent !== t) el.textContent = t; if (p) l.pos.set(...p); return l; } };
      self.labels.push(l); return l;
    },
    // ทรงจากเส้นขอบ 2D (shape แกน xy) ดึงความหนา d ตามแกน z
    extrude(pts2, d, c, o = {}) {
      const sh = new THREE.Shape(); pts2.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
      const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return mesh(g, c, o);
    },
    // ท่อตามเส้นโค้ง (รางรถไฟเหาะ ฯลฯ)
    tube(pts, r, c, o = {}) {
      const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
      return mesh(new THREE.TubeGeometry(curve, Math.max(20, pts.length * 4), r, 10, false), c, o);
    }
  };
  return T;
};

Lab.V3 = V3;
})();
