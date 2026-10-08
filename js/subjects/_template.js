/* แม่แบบแบบจำลองใหม่ — คัดลอกเป็น js/subjects/<ชื่อ>.js แล้วแก้
 * จากนั้นเพิ่ม <script src="js/subjects/<ชื่อ>.js"></script> ใน index.html (ก่อน Lab.start())
 * ถ้าเป็นบทใหม่ เพิ่มบรรทัดใน js/chapters.js ก่อน
 * รายละเอียดทุกฟิลด์ดู README.md หัวข้อ "เพิ่มแบบจำลองใหม่"
 */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG } = Lab.h, K = Lab.kit;
const CASES = [];

// ตัวอย่าง: ลูกบอลกลิ้งบนพื้นที่มีแรงเสียดทาน (แอนิเมชัน 2D + 3D + กราฟ + ลากได้)
CASES.push({
  name: 'ตัวอย่าง', title: 'ลูกบอลกลิ้งแล้วหยุด', aspect: 2.2,
  desc: 'คำอธิบายสั้นๆ ว่าแบบจำลองนี้แสดงอะไร',
  formula: 'v = u − μgt',                          // ใส่ HTML ได้ เช่น <sub> <sup>
  params: [
    { type: 'head', label: 'หัวข้อย่อยในแผงควบคุม' },
    { id: 'u', label: 'ความเร็วต้น', unit: 'm/s', min: 0, max: 20, step: 0.1, def: 8 },
    { id: 'mu', label: 'μ', unit: '', min: 0.01, max: 1, step: 0.01, def: 0.2 },
    { id: 'x0', label: 'ตำแหน่งเริ่ม', unit: 'm', min: 0, max: 10, step: 0.1, def: 1 },
    { id: 'arrow', label: 'แสดงลูกศร', type: 'bool', def: 1 }
    // ปุ่มเลือก: { id:'mode', label:'โหมด', opts:[['a','แบบ A'],['b','แบบ B']], def:'a', show: p => true }
    // รายการเพิ่ม/ลบได้: { id:'items', type:'list', label:'...', item:'ชิ้น', min:1, max:6, fields:[{id:'x',label:'x',unit:'m',min:0,max:10,step:0.1}], def:[{x:1}], add: p => ({x:2}) }
  ],
  presets: [{ label: 'พื้นลื่น', set: { mu: 0.05 } }],
  outs: [{ id: 'd', name: 'ระยะหยุด', unit: 'm' }, { id: 't', name: 'เวลาหยุด', unit: 's' }],
  compute(p) { const a = p.mu * 9.8; return { d: p.u * p.u / (2 * a), t: p.u / a }; },
  sim: {
    dt: 1 / 240,                                    // ช่วงเวลาย่อยของการคำนวณ
    init(p) { return { x: p.x0, v: p.u }; },         // สถานะเริ่มต้น (st.t ระบบจัดการเอง)
    step(st, dt, p) { st.v = Math.max(0, st.v - p.mu * 9.8 * dt); st.x += st.v * dt; if (st.v === 0) st.done = true; },
    view(p, o) { return { x0: -1, x1: p.x0 + o.d + 2, y0: -0.5, y1: 2, bottom: true }; },   // พื้นที่โลกที่ต้องเห็น (เมตร)
    draw(g, st, p, o) {                              // g = ตัวช่วยวาด (js/draw2d.js)
      const v = g.visible(); g.ground(v.x0, v.x1, 0); K.axisX(g, 0, v.x1, 0);
      K.ball(g, st.x, 0.3, 0.3);
      if (p.arrow) g.vec(st.x, 0.3, st.v * 10, 0, { px: true, c: '--c1', w: 3, label: 'v' });
    }
  },
  handles(p) { return [{ id: 'x0', x: p.x0, y: 0.3, set: x => ({ x0: clamp(x, 0, 10) }) }] },   // จุดที่ลากได้
  plot: { series: [{ label: 'v', unit: 'm/s', c: '--c1', f: s => s.v }, { label: 'x', unit: 'm', c: '--c2', f: s => s.x }] },
  live: [{ name: 'v', unit: 'm/s', f: s => s.v }],
  three: {                                         // ไม่ใส่ก็ได้ ถ้าไม่ต้องการ 3D
    cam(p) { return { pos: [4, 3, 8], target: [4, 0, 0] }; },
    build(T, p) { T.floor(30); return { ball: T.sphere(0.3, '--c1') }; },
    update(ob, st) { ob.ball.position.set(st.x, 0.3, 0); }
  },
  notes: ['ข้อสังเกตข้อที่ 1', 'ข้อสังเกตข้อที่ 2']
});

// Lab.add('<รหัสบท เช่น newton>', CASES, { group: 'ชื่อกลุ่ม (ไม่ใส่ก็ได้)' });
})();
