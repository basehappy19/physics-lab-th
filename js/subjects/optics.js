/* หัวข้อ: ทัศนศาสตร์เรขาคณิต — กระจก เลนส์ การหักเห ปริซึม ตา ใยแก้วนำแสง */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG, T, L, PL, ARW, DOT, midArrow } = Lab.h;
const CASES = [];
const REAL = 'จริง', VIRT = 'เสมือน';
// ---- ตัวช่วย 3D (หน่วย cm → 0.05 หน่วยโลก) ----
const OS = 0.05;
const arrow3d = (T, x, h, c, op) => { const g = T.group(), H = Math.abs(h), sh = T.cyl(0.025, 0.025, Math.max(0.01, H - 0.12), c, { parent: g, opacity: op }); sh.position.y = (H - 0.12) / 2; const hd = T.mesh(new T.THREE.ConeGeometry(0.07, 0.14, 16), c, { parent: g, opacity: op }); hd.position.y = H - 0.07; g.position.x = x; if (h < 0) g.rotation.x = Math.PI; return g; };
const seg3d = (T, a, b, c, o = {}) => T.line(c, Object.assign({ pts: [[a[0], a[1], 0], [b[0], b[1], 0]] }, o));
// รังสีหลัก: จากยอดวัตถุ ผ่านจุดบนเลนส์/กระจก แล้วผ่าน (หรือเสมือนผ่าน) ยอดภาพ
const rays3d = (T, O, I, pts, xEnd, dirSign, cols) => pts.forEach((M, i) => {
  const c = cols[i % cols.length]; seg3d(T, O, M, c);
  if (!isFinite(I[0]) || !isFinite(I[1])) { const d = dirSign > 0 ? [-O[0], -O[1]] : [O[0], -O[1]], L = Math.hypot(...d) || 1; seg3d(T, M, [M[0] + d[0] / L * 4, M[1] + d[1] / L * 4], c); return; }   // วัตถุที่จุดโฟกัส: รังสีออกขนานกัน
  const real = (I[0] - M[0]) * dirSign > 0; let d = real ? [I[0] - M[0], I[1] - M[1]] : [M[0] - I[0], M[1] - I[1]]; const L = Math.hypot(...d) || 1; d = [d[0] / L, d[1] / L];
  const k = Math.abs((xEnd - M[0]) / (d[0] || 1e-6)); seg3d(T, M, [M[0] + d[0] * Math.min(k, 6), M[1] + d[1] * Math.min(k, 6)], c);
  if (!real) seg3d(T, M, I, c, { dash: 0.05, opacity: 0.6 });
});
// ภาพจากเลนส์บาง/กระจกโค้ง: คืนตำแหน่งภาพ s' และกำลังขยาย m (f บวก = รวมแสง)
const imageOf = (s, f) => { if (Math.abs(s - f) < 1e-6) return { sp: Infinity, m: Infinity }; const sp = 1 / (1 / f - 1 / s); return { sp, m: -sp / s }; };

// ---------- shared drawing helpers for thin elements ----------
const AX=150,KY=7.5;
function rayDraw(base,dir,k,axisY,xTip,yTip,yHit,mOut,dEnd,sp,color){
  const hit=[base,axisY-yHit*KY],tip=[base+xTip*k,axisY-yTip*KY];
  const end=[base+dir*dEnd*k,axisY-(yHit+mOut*dEnd)*KY];
  let s=PL([tip,hit],color,2)+PL([hit,end],color,2)+midArrow([tip,hit],color);
  if(isFinite(sp)&&sp<0){const v=[base+dir*sp*k,axisY-(yHit+mOut*sp)*KY];s+=PL([hit,v],color,1.5,'5 4')}
  return s}
const imgText=(sp,m)=>!isFinite(sp)?'ไม่เกิดภาพ (รังสีขนาน)':(sp>0?REAL:VIRT);
const oriText=(sp,m)=>!isFinite(sp)?'—':(m<0?'หัวกลับ':'หัวตั้ง');
const sizeText=(sp,m)=>{if(!isFinite(sp))return '—';const a=Math.abs(m);return a>1.001?'ขยาย':(a<0.999?'ย่อ':'เท่าวัตถุ')};
function regionTable(kind,s,f){
  const hl=(c)=>c?' class="hl"':'';const e=0.05*Math.max(1,f);
  if(kind==='div')return `<table><tr><th>ระยะวัตถุ</th><th>ตำแหน่งภาพ</th><th>ชนิดภาพ</th><th>ขนาด</th></tr><tr class="hl"><td class="rowh">ทุกตำแหน่ง</td><td>ระหว่างวัตถุกับจุดโฟกัส</td><td>เสมือน หัวตั้ง</td><td>ย่อ</td></tr></table>`;
  const row=(c,a,b,d,x)=>`<tr${hl(c)}><td class="rowh">${a}</td><td>${b}</td><td>${d}</td><td>${x}</td></tr>`;
  return `<table><tr><th>ระยะวัตถุ (s)</th><th>ตำแหน่งภาพ (s′)</th><th>ชนิดภาพ</th><th>ขนาด</th></tr>`+
   row(s>2*f+e,'s &gt; 2f','f &lt; s′ &lt; 2f','จริง หัวกลับ','ย่อ')+
   row(Math.abs(s-2*f)<=e,'s = 2f','s′ = 2f','จริง หัวกลับ','เท่าวัตถุ')+
   row(s>f+e&&s<2*f-e,'f &lt; s &lt; 2f','s′ &gt; 2f','จริง หัวกลับ','ขยาย')+
   row(Math.abs(s-f)<=e,'s = f','ที่ระยะอนันต์','ไม่เกิดภาพ','—')+
   row(s<f-e,'s &lt; f','อยู่ด้านเดียวกับวัตถุ','เสมือน หัวตั้ง','ขยาย')+`</table>`;
}
// ---------- 1 กระจกเงาราบ ----------
CASES.push({
 name:'กระจกเงาราบ',title:'ภาพในกระจกเงาราบ',
 desc:'ภาพอยู่หลังกระจกห่างเท่ากับวัตถุอยู่หน้ากระจก เป็นภาพเสมือน หัวตั้ง ขนาดเท่าวัตถุ และกลับซ้ายขวา',
 formula:'s′ = −s &nbsp;|&nbsp; m = +1 &nbsp;|&nbsp; มุมตกกระทบ i = มุมสะท้อน r &nbsp;|&nbsp; ความยาวกระจกที่เห็นเต็มตัว = h/2',
 params:[
  {id:'s',label:'ระยะวัตถุหน้ากระจก (s)',unit:'cm',min:5,max:50,step:1,def:30},
  {id:'ho',label:'ความสูงวัตถุ (h)',unit:'cm',min:5,max:25,step:1,def:16}],
 outs:[
  {id:'sp',name:'ตำแหน่งภาพ (s′)',unit:'cm'},
  {id:'D',name:'ระยะวัตถุถึงภาพ',unit:'cm'},
  {id:'hi',name:'ความสูงภาพ',unit:'cm'},
  {id:'m',name:'กำลังขยาย (m)',unit:'เท่า'},
  {id:'Lm',name:'กระจกสั้นสุดที่เห็นตัวเต็ม',unit:'cm'},
  {id:'type',name:'ชนิดภาพ',unit:''},
  {id:'ori',name:'ลักษณะภาพ',unit:''}],
 compute(p){return{sp:-p.s,D:2*p.s,hi:p.ho,m:1,Lm:p.ho/2,type:VIRT,ori:'หัวตั้ง กลับซ้ายขวา'}},
 drag:{id:'s',px:(X)=>(380-X)/4.4},
 draw(p,o){const mx=380,k=4.4,gy=235,ox=mx-p.s*k,ix=mx+p.s*k,tipY=gy-p.ho*k;
  let svg=L(10,gy,630,gy,'--muted',1)+`<rect x="${mx}" y="30" width="7" height="${gy-30+6}" style="fill:var(--line)"/>`+L(mx,30,mx,gy+6,'--ink',3);
  for(let y=40;y<gy;y+=14)svg+=L(mx,y,mx+10,y+8,'--muted',1);
  [0.3,0.7].forEach((f,i)=>{const hy=tipY+(gy-tipY)*f,dx=mx-ox,dy=hy-tipY,ang=Math.round(Math.atan(dy/dx)*DEG);
   const sl=(hy-tipY)/(mx-ix);const ex=45,ey=tipY+(ex-ix)*((hy-tipY)/(mx-ix));
   svg+=PL([[ox,tipY],[mx,hy]],'--ray',2)+midArrow([[ox,tipY],[mx,hy]],'--ray')+PL([[mx,hy],[ex,ey]],'--ray',2)+midArrow([[mx,hy],[ex,ey]],'--ray')+PL([[mx,hy],[ix,tipY]],'--ray',1.5,'5 4')+L(mx-60,hy,mx+0,hy,'--muted',1,'3 4');
   if(i===0)svg+=T(mx-12,52,'ตัวอย่าง i = r = '+ang+'°',{fs:11,a:'end',c:'--muted'})});
  svg+=`<g data-drag class="drag"><rect x="${ox-14}" y="${tipY-8}" width="28" height="${gy-tipY+8}" style="fill:transparent"/>`+ARW(ox,gy,ox,tipY,'--ink',4)+`</g>`+T(ox,gy+18,'วัตถุ')+
   ARW(ix,gy,ix,tipY,'--img',4,'4 4')+T(ix,gy+18,'ภาพเสมือน',{c:'--img'})+
   L(ox,gy+30,mx,gy+30,'--muted',1)+T((ox+mx)/2,gy+44,'s = '+p.s+' cm',{fs:11,c:'--muted'})+L(mx,gy+30,ix,gy+30,'--muted',1)+T((mx+ix)/2,gy+44,'s′ = '+p.s+' cm',{fs:11,c:'--muted'});
  return svg},
 three: {
  cam() { return { pos: [0.4, 0.5, 1.1], target: [0, 0.12, 0] }; },
  build(T, p, o) {
   const s = p.s / 100, h = p.ho / 100; T.floor(2, { step: 0.05 });
   const m = T.box(0.01, Math.max(0.3, h * 1.3), 0.5, '--water', { opacity: 0.55 }); m.position.set(0, Math.max(0.3, h * 1.3) / 2, 0);
   const candle = (x, op) => { const g = T.group(); const c = T.cyl(0.015, 0.015, h, '--c1', { parent: g, opacity: op }); c.position.y = h / 2; const f = T.mesh(new T.THREE.ConeGeometry(0.012, 0.035, 12), '--c5', { parent: g, emissive: '--c5', ei: 0.9, opacity: op }); f.position.y = h + 0.02; g.position.x = x; return g; };
   candle(-s); candle(s, 0.35); T.label('วัตถุ', '--ink', { pos: [-s, h + 0.07, 0] }); T.label('ภาพเสมือน', '--muted', { pos: [s, h + 0.07, 0] });
   const eye = T.sphere(0.02, '--ink'); eye.position.set(-s * 0.6, h * 0.6, 0.22);
   const top = [-s, h + 0.02, 0], hit = [0, (h + 0.02) * 0.6 + h * 0.6 * 0.4, 0.22 * (s / (s + s * 0.6))];
   T.line('--ray', { pts: [top, hit, eye.position.toArray()] }); T.line('--ray', { pts: [hit, [s, h + 0.02, 0]], dash: 0.01, opacity: 0.6 });
   T.line('--muted', { pts: [[-s, 0.002, 0.12], [0, 0.002, 0.12]] }); T.label('s = ' + p.s + ' cm', '--muted', { pos: [-s / 2, 0.01, 0.16] });
   T.line('--muted', { pts: [[0, 0.002, 0.12], [s, 0.002, 0.12]], dash: 0.01 }); T.label("s′ = " + p.s + ' cm', '--muted', { pos: [s / 2, 0.01, 0.16] });
   return {};
  }
 },
 notes:['ขยับวัตถุเข้าหากระจก 1 cm ภาพขยับเข้าหากระจก 1 cm เช่นกัน ระยะระหว่างวัตถุกับภาพเปลี่ยน 2 cm','ถ้าเลื่อนกระจกออกจากวัตถุ x ภาพจะเลื่อนตาม 2x','กระจกยาวแค่ครึ่งหนึ่งของความสูงตัวเรา ก็เห็นเต็มตัว และไม่ขึ้นกับว่ายืนไกลหรือใกล้','รังสีสะท้อนทุกเส้นเมื่อลากต่อไปด้านหลังจะมาพบกันที่ปลายภาพเสมือนพอดี']
});

// ---------- 2 กระจกสองบาน ----------
CASES.push({
 name:'กระจกสองบาน',title:'กระจกสองบานทำมุมกัน (กล้องคาไลโดสโคป)',
 desc:'วางกระจกสองบานทำมุม θ ต่อกัน แล้ววัตถุระหว่างกระจกจะมีภาพหลายภาพ ภาพทั้งหมดอยู่บนวงกลมที่มีจุดตัดของกระจกเป็นศูนย์กลาง',
 formula:'จำนวนภาพ n = 360°/θ − 1 (เมื่อ 360°/θ เป็นจำนวนเต็ม) &nbsp;|&nbsp; ภาพทุกภาพห่างจากจุดตัดเท่ากับวัตถุ',
 params:[
  {id:'th',label:'มุมระหว่างกระจก (θ)',unit:'°',vals:[30,36,40,45,60,72,90,120,180],def:60},
  {id:'r',label:'ระยะวัตถุจากจุดตัด (r)',unit:'cm',min:8,max:30,step:1,def:22},
  {id:'pos',label:'ตำแหน่งวัตถุในมุม',unit:'%',min:10,max:90,step:1,def:35}],
 outs:[
  {id:'n',name:'จำนวนภาพ',unit:'ภาพ'},
  {id:'phi',name:'มุมของวัตถุจากกระจกบานล่าง',unit:'°'},
  {id:'d1',name:'ระยะวัตถุถึงภาพแรก (บานล่าง)',unit:'cm'}],
 compute(p){const N=Math.round(360/p.th),phi=p.th*p.pos/100,set=[];
  for(let k=0;k<N;k++)[2*k*p.th+phi,2*k*p.th-phi].forEach(a=>{a=((a%360)+360)%360;if(!set.some(b=>Math.abs(b-a)<1e-6||Math.abs(Math.abs(b-a)-360)<1e-6))set.push(a)});
  const imgs=set.filter(a=>Math.abs(a-phi)>1e-6);
  return{n:N-1,phi,d1:2*p.r*Math.sin(phi*RAD),_imgs:imgs}},
 draw(p,o){const ox=250,oy=160,k=5.6,R=Math.min(130,p.r*k+18),pt=(a,r)=>[ox+r*Math.cos(a*RAD),oy-r*Math.sin(a*RAD)];
  let svg=`<circle cx="${ox}" cy="${oy}" r="${p.r*k}" style="fill:none;stroke:var(--muted);stroke-width:1;stroke-dasharray:4 5"/>`;
  const wedge=[[ox,oy],pt(0,R+25),pt(p.th/2,R+25),pt(p.th,R+25)];
  svg+=`<path d="M${ox} ${oy} L${pt(0,R+25).join(' ')} A${R+25} ${R+25} 0 ${p.th>180?1:0} 0 ${pt(p.th,R+25).join(' ')} Z" style="fill:var(--water-soft);opacity:.55"/>`;
  svg+=L(ox,oy,...pt(0,R+25),'--ink',4)+L(ox,oy,...pt(p.th,R+25),'--ink',4);
  svg+=`<path d="M${pt(0,34).join(' ')} A34 34 0 ${p.th>180?1:0} 0 ${pt(p.th,34).join(' ')}" style="fill:none;stroke:var(--accent);stroke-width:2"/>`+T(...pt(p.th/2,50),'θ = '+p.th+'°',{c:'--accent',fs:12,b:1});
  o._imgs.forEach((a,i)=>{const [x,y]=pt(a,p.r*k);svg+=`<circle cx="${x}" cy="${y}" r="7" style="fill:none;stroke:var(--img);stroke-width:2.5"/>`+T(x,y+4,String(i+1),{fs:9,c:'--img',b:1})});
  const [px,py]=pt(o.phi,p.r*k);svg+=DOT(px,py,'--ink',8)+T(px,py-14,'วัตถุ',{fs:11,b:1});
  svg+=L(px,py,...pt(0,p.r*k),'--ray',1.5,'4 4');
  svg+=T(470,60,'ภาพทั้งหมด '+o.n+' ภาพ',{fs:15,b:1,a:'start'})+T(470,84,'วงกลมประ = วงที่ภาพทุกภาพอยู่',{fs:11,a:'start',c:'--muted'})+T(470,104,'วงกลมเปล่า = ภาพเสมือน',{fs:11,a:'start',c:'--muted'})+T(470,124,'จุดทึบ = วัตถุจริง',{fs:11,a:'start',c:'--muted'});
  return svg},
 three: {
  cam() { return { pos: [0.8, 2.4, 3.4], target: [0.6, 0.2, -0.3] }; },
  build(T, p, o) {
   const r = p.r * 0.05, th = p.th * RAD, H = 0.7, Lm = r * 1.7; T.floor(6, { step: 0.25 });
   const mir = a => { const m = T.box(Lm, H, 0.015, '--water', { opacity: 0.5, cast: false }); m.position.set(Math.cos(a) * Lm / 2, H / 2, -Math.sin(a) * Lm / 2); m.rotation.y = a; };
   mir(0); mir(th);
   const cand = (a, op) => { const g = T.group(); const c = T.cyl(0.03, 0.03, 0.3, '--c1', { parent: g, opacity: op }); c.position.y = 0.15; const fl = T.mesh(new T.THREE.ConeGeometry(0.022, 0.06, 12), '--c5', { parent: g, emissive: '--c5', ei: 0.9, opacity: op }); fl.position.y = 0.33; g.position.set(r * Math.cos(a), 0, -r * Math.sin(a)); return g; };
   cand(o.phi * RAD); (o._imgs || []).forEach(a => cand(a * RAD, 0.35));
   const ring = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * 2 * Math.PI; ring.push([r * Math.cos(a), 0.003, -r * Math.sin(a)]); } T.line('--muted', { pts: ring, max: 73, dash: 0.03 });
   T.label('ภาพ ' + o.n + ' ภาพ (360°/θ − 1)', '--ink', { pos: [0, H + 0.25, 0] });
   return {};
  }
 },
 notes:['θ ลดลง → จำนวนภาพเพิ่มขึ้น (θ = 90° ได้ 3 ภาพ, 60° ได้ 5 ภาพ, 30° ได้ 11 ภาพ)','θ = 180° คือกระจกเงาราบบานเดียว ได้ภาพเดียว','ตำแหน่งของวัตถุในมุมไม่เปลี่ยนจำนวนภาพ แต่เปลี่ยนตำแหน่งของภาพบนวงกลม','ภาพจะอยู่ในส่วนที่กระจกบังไว้ ผู้ดูที่อยู่ระหว่างกระจกจึงเห็นแต่ภาพที่เกิดจากการสะท้อนต่อเนื่อง']
});

// ---------- 3 กระจกเว้า / นูน ----------
CASES.push({
 name:'กระจกเว้า/นูน',title:'ภาพจากกระจกทรงกลม',
 desc:'เลือกกระจกเว้า (รวมแสง) หรือนูน (กระจายแสง) แล้วลากวัตถุไปมาดูภาพจริง ภาพเสมือน และขนาดของภาพ',
 formula:'1/f = 1/s + 1/s′ &nbsp;|&nbsp; f = R/2 &nbsp;|&nbsp; m = −s′/s = h′/h &nbsp;|&nbsp; เว้า f &gt; 0, นูน f &lt; 0',
 params:[
  {id:'kind',label:'ชนิดกระจก',opts:[['c','กระจกเว้า'],['v','กระจกนูน']],def:'c'},
  {id:'s',label:'ระยะวัตถุ (s)',unit:'cm',min:2,max:60,step:0.5,def:25},
  {id:'f',label:'ความยาวโฟกัส (|f|)',unit:'cm',min:4,max:30,step:1,def:10},
  {id:'ho',label:'ความสูงวัตถุ (h)',unit:'cm',min:1,max:8,step:0.5,def:4}],
 outs:[
  {id:'sp',name:'ตำแหน่งภาพ (s′)',unit:'cm'},
  {id:'m',name:'กำลังขยาย (m)',unit:'เท่า'},
  {id:'hi',name:'ความสูงภาพ (h′)',unit:'cm'},
  {id:'R',name:'รัศมีความโค้ง (R)',unit:'cm'},
  {id:'type',name:'ชนิดภาพ',unit:''},
  {id:'ori',name:'ลักษณะภาพ',unit:''},
  {id:'size',name:'ขนาดภาพ',unit:''}],
 presets:[{label:'เว้า: s > 2f',set:{kind:'c',s:35,f:10}},{label:'เว้า: f < s < 2f',set:{kind:'c',s:15,f:10}},{label:'เว้า: s < f (กระจกแต่งหน้า)',set:{kind:'c',s:6,f:10}}],
 drag:{id:'s',px:(X)=>(470-X)/4.5},
 compute(p){const f=p.kind==='c'?p.f:-p.f,im=imageOf(p.s,f);return{sp:im.sp,m:im.m,hi:im.m*p.ho,R:2*f,type:imgText(im.sp,im.m),ori:oriText(im.sp,im.m),size:sizeText(im.sp,im.m),_f:f}},
 check(p,o){return Math.abs(p.s-p.f)<0.01&&p.kind==='c'?['วัตถุอยู่ที่จุดโฟกัสพอดี รังสีสะท้อนขนานกัน ไม่เกิดภาพ']:[]},
 extra(p,o){return{title:'วัตถุอยู่ตรงไหน ภาพเป็นอย่างไร',html:regionTable(p.kind==='c'?'conv':'div',p.s,p.f)}},
 draw(p,o){const mx=470,k=4.5,f=o._f,sp=o.sp,ho=p.ho,hi=o.hi;let svg=L(15,AX,625,AX,'--muted',1);
  const c=p.kind==='c';
  svg+=c?`<path d="M${mx-14} 40 Q${mx+14} 150 ${mx-14} 260" style="fill:none;stroke:var(--ink);stroke-width:4"/>`:`<path d="M${mx+14} 40 Q${mx-14} 150 ${mx+14} 260" style="fill:none;stroke:var(--ink);stroke-width:4"/>`;
  for(let y=50;y<255;y+=15){const bx=(c?mx-14:mx+14)+(c?1:-1)*(28*(1-Math.pow((y-150)/110,2)))*0.5*(c?1:-1)*(c?1:1);}
  const Fx=mx-f*k,Cx=mx-2*f*k;
  svg+=DOT(Fx,AX,'--accent',3.5)+T(Fx,AX+16,'F',{c:'--accent',b:1})+DOT(Cx,AX,'--accent',3.5)+T(Cx,AX+16,'C',{c:'--accent',b:1})+DOT(mx,AX,'--ink',3)+T(mx,AX+16,'V',{fs:11});
  const s=p.s,tipX=-s,dMax=(mx-8)/k,dEnd=isFinite(sp)?(sp>0?Math.min(dMax,sp+9):Math.min(dMax,30)):dMax,rays=[];
  const r1y=ho,m1=-r1y/f; rays.push([r1y,m1,'--ray']);
  rays.push([0,-ho/s,'--ray2']);
  if(Math.abs(s-f)>0.01){const m3=-ho/(s-f),y3=ho+m3*s;rays.push([y3,m3-y3/f,'--ray'])}
  rays.forEach(r=>{svg+=rayDraw(mx,-1,k,AX,tipX,ho,r[0],r[1],dEnd,sp,r[2])});
  if(isFinite(sp)){const ix=mx-sp*k,iy=AX-hi*KY;
   if(sp>0&&ix>10)svg+=L(ix,AX-70,ix,AX+70,'--muted',1,'2 4')+T(ix,AX+84,'ฉาก',{fs:10,c:'--muted'});
   svg+=ARW(ix,AX,ix,iy,'--img',4,sp>0?null:'4 4')+T(ix,(hi>=0?iy-8:iy+16),sp>0?'ภาพจริง':'ภาพเสมือน',{c:'--img',fs:11,b:1})}
  const ox=mx-s*k;svg+=`<g data-drag class="drag"><rect x="${ox-14}" y="${AX-ho*KY-8}" width="28" height="${ho*KY+8}" style="fill:transparent"/>`+ARW(ox,AX,ox,AX-ho*KY,'--ink',4)+`</g>`+T(ox,AX+32,'วัตถุ',{b:1});
  return svg},
 three: {
  cam() { return { pos: [-0.8, 1.2, 4.8], target: [-1, 0, 0] }; },
  build(T, p, o) {
   const f = o._f * OS, s = p.s * OS, h = p.ho * OS, sp = o.sp * OS, hi = o.hi * OS, R = Math.abs(2 * f), conc = p.kind === 'c';
   T.floor(10, { step: 0.25, y: -1.3 }).position.x = -1; seg3d(T, [-3.6, 0], [1.2, 0], '--muted', { dash: 0.06 });
   const ap = Math.asin(Math.min(0.55, 1.0 / R)), geo = new T.THREE.SphereGeometry(R, 48, 16, 0, Math.PI * 2, 0, ap);
   geo.rotateZ(conc ? -Math.PI / 2 : Math.PI / 2); const m = T.mesh(geo, '--water', { side: T.THREE.DoubleSide, cast: false }); m.material.metalness = 0.6; m.material.roughness = 0.2; m.position.x = conc ? -R : R;
   [[conc ? -Math.abs(f) : Math.abs(f), 'F'], [conc ? -R : R, 'C']].forEach(([x, l]) => { if (Math.abs(x) < 3.6) { const k = T.sphere(0.035, '--ink'); k.position.x = x; T.label(l, '--muted', { pos: [x, -0.18, 0] }); } });
   arrow3d(T, -s, h, '--c1'); T.label('วัตถุ', '--c1', { pos: [-s, h + 0.18, 0] });
   if (isFinite(sp)) { const real = sp > 0, x = -sp; arrow3d(T, x, hi, '--c4', real ? 1 : 0.4); T.label(o.type + ' ' + o.ori, '--c4', { pos: [x, hi + (hi > 0 ? 0.18 : -0.18), 0] }); }
   const O = [-s, h], I = [-sp, hi], y3 = isFinite(hi) ? hi : 0; rays3d(T, O, I, [[0, h], [0, 0], [0, y3]], -3.6, -1, ['--ray', '--ray2', '--c3']);
   return {};
  }
 },
 notes:['กระจกเว้า: s &gt; f ได้ภาพจริงหัวกลับ s &lt; f ได้ภาพเสมือนหัวตั้งขยาย (ใช้ส่องหน้า)','วัตถุเข้าใกล้ F จากด้านไกล ภาพจริงเลื่อนออกไกลและขยายขึ้น','กระจกนูนให้ภาพเสมือน หัวตั้ง ย่อ เสมอ ไม่ว่าวัตถุอยู่ไหน (ใช้เป็นกระจกมองข้างและกระจกโค้งที่ทางแยก เพราะเห็นมุมกว้าง)','f เพิ่ม (กระจกแบนขึ้น) ภาพจริงเลื่อนไปไกลขึ้นและขนาดเล็กลง','สามรังสีหลัก: ขนานแกน → ผ่าน F | ผ่าน F → ขนานแกน | ผ่านจุดยอด → สะท้อนมุมเท่ากัน']
});

// ---------- 4 เลนส์บาง ----------
const lensShape=(base,conv)=>conv?`<path d="M${base} 38 Q${base+26} 150 ${base} 262 Q${base-26} 150 ${base} 38 Z" style="fill:var(--water-soft);stroke:var(--ink);stroke-width:2.5;opacity:.9"/>`:`<path d="M${base-13} 38 L${base+13} 38 Q${base+3} 150 ${base+13} 262 L${base-13} 262 Q${base-3} 150 ${base-13} 38 Z" style="fill:var(--water-soft);stroke:var(--ink);stroke-width:2.5;opacity:.9"/>`;
CASES.push({
 name:'เลนส์บาง',title:'ภาพจากเลนส์นูนและเลนส์เว้า',
 desc:'เลนส์นูนรวมแสงให้ภาพจริงหรือภาพเสมือน เลนส์เว้ากระจายแสงให้ภาพเสมือนเสมอ ลากวัตถุไปมาดูว่าภาพเปลี่ยนอย่างไร',
 formula:'1/f = 1/s + 1/s′ &nbsp;|&nbsp; m = −s′/s &nbsp;|&nbsp; 1/f = (n−1)(1/R₁ − 1/R₂) &nbsp;|&nbsp; กำลังเลนส์ P = 1/f (เมตร) หน่วยไดออปเตอร์',
 params:[
  {id:'kind',label:'ชนิดเลนส์',opts:[['c','เลนส์นูน'],['v','เลนส์เว้า']],def:'c'},
  {id:'s',label:'ระยะวัตถุ (s)',unit:'cm',min:2,max:60,step:0.5,def:25},
  {id:'f',label:'ความยาวโฟกัส (|f|)',unit:'cm',min:4,max:30,step:1,def:10},
  {id:'ho',label:'ความสูงวัตถุ (h)',unit:'cm',min:1,max:8,step:0.5,def:4}],
 outs:[
  {id:'sp',name:'ตำแหน่งภาพ (s′)',unit:'cm'},
  {id:'m',name:'กำลังขยาย (m)',unit:'เท่า'},
  {id:'hi',name:'ความสูงภาพ (h′)',unit:'cm'},
  {id:'Pw',name:'กำลังเลนส์ (P)',unit:'D'},
  {id:'type',name:'ชนิดภาพ',unit:''},
  {id:'ori',name:'ลักษณะภาพ',unit:''},
  {id:'size',name:'ขนาดภาพ',unit:''}],
 presets:[{label:'กล้องถ่ายรูป (s > 2f)',set:{kind:'c',s:40,f:10}},{label:'เครื่องฉาย (f < s < 2f)',set:{kind:'c',s:14,f:10}},{label:'แว่นขยาย (s < f)',set:{kind:'c',s:6,f:10}},{label:'เลนส์เว้า',set:{kind:'v',s:25,f:10}}],
 drag:{id:'s',px:(X)=>(300-X)/4.5},
 compute(p){const f=p.kind==='c'?p.f:-p.f,im=imageOf(p.s,f);return{sp:im.sp,m:im.m,hi:im.m*p.ho,Pw:100/f,type:imgText(im.sp,im.m),ori:oriText(im.sp,im.m),size:sizeText(im.sp,im.m),_f:f}},
 check(p,o){return Math.abs(p.s-p.f)<0.01&&p.kind==='c'?['วัตถุอยู่ที่จุดโฟกัสพอดี รังสีหักเหออกขนานกัน ไม่เกิดภาพ']:[]},
 extra(p,o){return{title:'วัตถุอยู่ตรงไหน ภาพเป็นอย่างไร',html:regionTable(p.kind==='c'?'conv':'div',p.s,p.f)}},
 draw(p,o){const base=300,k=4.5,f=o._f,sp=o.sp,ho=p.ho,hi=o.hi,conv=p.kind==='c';let svg=L(15,AX,625,AX,'--muted',1)+lensShape(base,conv);
  [[-1,'F'],[1,'F′']].forEach(([d,l])=>{svg+=DOT(base+d*p.f*k,AX,'--accent',3.5)+T(base+d*p.f*k,AX+16,l,{c:'--accent',b:1})+DOT(base+d*2*p.f*k,AX,'--accent',3)+T(base+d*2*p.f*k,AX+16,d<0?'2F':'2F′',{c:'--accent',fs:10})});
  const s=p.s,dMax=(630-base)/k,dEnd=isFinite(sp)?(sp>0?Math.min(dMax,sp+9):Math.min(dMax,30)):dMax,rays=[[ho,-ho/f,'--ray'],[0,-ho/s,'--ray2']];
  if(Math.abs(s-f)>0.01){const m3=-ho/(s-f),y3=ho+m3*s;rays.push([y3,m3-y3/f,'--ray'])}
  rays.forEach(r=>{svg+=rayDraw(base,1,k,AX,-s,ho,r[0],r[1],dEnd,sp,r[2])});
  if(isFinite(sp)){const ix=base+sp*k,iy=AX-hi*KY;
   if(sp>0&&ix<620)svg+=L(ix,AX-70,ix,AX+70,'--muted',1,'2 4')+T(ix,AX+84,'ฉาก',{fs:10,c:'--muted'});
   svg+=ARW(ix,AX,ix,iy,'--img',4,sp>0?null:'4 4')+T(ix,(hi>=0?iy-8:iy+16),sp>0?'ภาพจริง':'ภาพเสมือน',{c:'--img',fs:11,b:1})}
  const ox=base-s*k;svg+=`<g data-drag class="drag"><rect x="${ox-14}" y="${AX-ho*KY-8}" width="28" height="${ho*KY+8}" style="fill:transparent"/>`+ARW(ox,AX,ox,AX-ho*KY,'--ink',4)+`</g>`+T(ox,AX+32,'วัตถุ',{b:1});
  return svg},
 three: {
  cam() { return { pos: [0.3, 1.2, 4.8], target: [0.2, 0, 0] }; },
  build(T, p, o) {
   const f = o._f * OS, s = p.s * OS, h = p.ho * OS, sp = o.sp * OS, hi = o.hi * OS, conv = p.kind === 'c';
   T.floor(10, { step: 0.25, y: -1.3 }); seg3d(T, [-3.4, 0], [3.4, 0], '--muted', { dash: 0.06 });
   // เลนส์: หมุนโปรไฟล์ (รัศมี, ความหนา) รอบแกน แล้ววางให้แกนเลนส์ตรงกับแกนมุขสำคัญ (แกน x)
   const R = 1.1, th = r => conv ? 0.17 * (1 - (r / R) ** 2) + 0.012 : 0.03 + 0.14 * (r / R) ** 2, pts = [];
   for (let i = 0; i <= 24; i++) { const r = R * i / 24; pts.push(new T.THREE.Vector2(r, th(r))); } for (let i = 24; i >= 0; i--) { const r = R * i / 24; pts.push(new T.THREE.Vector2(r, -th(r))); }
   const geo = new T.THREE.LatheGeometry(pts, 48); geo.rotateZ(-Math.PI / 2); T.mesh(geo, '--water', { opacity: 0.45, side: T.THREE.DoubleSide, cast: false });
   [[f, 'F'], [-f, 'F'], [2 * f, '2F'], [-2 * f, '2F']].forEach(([x, l]) => { if (Math.abs(x) < 3.4) { const m = T.sphere(0.035, '--ink'); m.position.x = x; T.label(l, '--muted', { pos: [x, -0.18, 0] }); } });
   arrow3d(T, -s, h, '--c1'); T.label('วัตถุ', '--c1', { pos: [-s, h + 0.18, 0] });
   if (isFinite(sp)) { const real = sp > 0; arrow3d(T, sp, hi, real ? '--c4' : '--c4', real ? 1 : 0.4); T.label(o.type + ' ' + o.ori, '--c4', { pos: [sp, hi + (hi > 0 ? 0.18 : -0.18), 0] }); }
   const O = [-s, h], I = [sp, hi], y3 = isFinite(hi) ? hi : 0; rays3d(T, O, I, [[0, h], [0, 0], [0, y3]], 3.4, 1, ['--ray', '--ray2', '--c3']);
   return {};
  }
 },
 notes:['เลนส์นูน: s &gt; f ได้ภาพจริงหัวกลับ (ฉายบนฉากได้) s &lt; f ได้ภาพเสมือนหัวตั้งขยาย (แว่นขยาย)','ยิ่งวัตถุเข้าใกล้ F จากด้านไกล ภาพจริงยิ่งไกลและใหญ่ และกลับด้านเมื่อข้าม F เป็นภาพเสมือน','เลนส์เว้าให้ภาพเสมือน หัวตั้ง ย่อ อยู่ระหว่างวัตถุกับเลนส์ ทุกตำแหน่งวัตถุ','f สั้นลง (เลนส์โค้งมากขึ้น กำลังเลนส์สูงขึ้น) ภาพจริงเกิดใกล้เลนส์ขึ้น','สามรังสีหลัก: ขนานแกน → ผ่าน F′ | ผ่านศูนย์กลางเลนส์ → ตรงไม่หัก | ผ่าน F → ออกขนานแกน']
});

// ---------- 5 เลนส์สองชุด ----------
CASES.push({
 name:'เลนส์สองชุด',title:'ระบบเลนส์ประกอบสองชุด',
 desc:'ภาพจากเลนส์ตัวแรกกลายเป็นวัตถุของเลนส์ตัวที่สอง ใช้อธิบายกล้องจุลทรรศน์ประกอบ และเหตุที่ภาพหัวกลับสองครั้งกลับมาหัวตั้ง',
 formula:'เลนส์ 1: 1/f₁ = 1/s₁ + 1/s₁′ &nbsp;|&nbsp; s₂ = d − s₁′ &nbsp;|&nbsp; เลนส์ 2: 1/f₂ = 1/s₂ + 1/s₂′ &nbsp;|&nbsp; m = m₁ × m₂',
 params:[
  {id:'s',label:'ระยะวัตถุถึงเลนส์ 1 (s₁)',unit:'cm',min:2,max:30,step:0.5,def:6},
  {id:'f1',label:'โฟกัสเลนส์ 1 (f₁)',unit:'cm',min:2,max:15,step:0.5,def:4},
  {id:'f2',label:'โฟกัสเลนส์ 2 (f₂)',unit:'cm',min:3,max:20,step:0.5,def:8},
  {id:'d',label:'ระยะห่างเลนส์ทั้งสอง (d)',unit:'cm',min:4,max:40,step:0.5,def:22},
  {id:'ho',label:'ความสูงวัตถุ (h)',unit:'cm',min:0.5,max:3,step:0.1,def:1}],
 outs:[
  {id:'sp1',name:'ภาพกลาง (s₁′)',unit:'cm'},
  {id:'m1',name:'ขยายครั้งที่ 1 (m₁)',unit:'เท่า'},
  {id:'s2',name:'ระยะวัตถุของเลนส์ 2 (s₂)',unit:'cm'},
  {id:'sp2',name:'ภาพสุดท้าย (s₂′)',unit:'cm'},
  {id:'m',name:'กำลังขยายรวม (m)',unit:'เท่า'},
  {id:'type',name:'ชนิดภาพสุดท้าย',unit:''},
  {id:'ori',name:'ลักษณะภาพสุดท้าย',unit:''}],
 presets:[{label:'กล้องจุลทรรศน์',set:{s:5,f1:4,f2:8,d:25,ho:1}},{label:'กลับสองครั้ง → หัวตั้ง',set:{s:10,f1:5,f2:6,d:22,ho:1}},{label:'ภาพเสมือนเป็นวัตถุ',set:{s:8,f1:5,f2:10,d:5,ho:1}}],
 compute(p){const a=imageOf(p.s,p.f1);
  if(!isFinite(a.sp)){const mm=-p.f2/p.s;return{sp1:Infinity,m1:Infinity,s2:Infinity,sp2:p.f2,m:mm,type:REAL,ori:'หัวกลับ',_a:a,_b:{sp:p.f2,m:Infinity}}}
  const s2=p.d-a.sp,b=imageOf(s2,p.f2),m=a.m*b.m;
  return{sp1:a.sp,m1:a.m,s2,sp2:b.sp,m,type:imgText(b.sp,m),ori:oriText(b.sp,m),_a:a,_b:b}},
 check(p,o){const w=[];if(!isFinite(o.sp1))w.push('วัตถุอยู่ที่ F₁ ภาพกลางอยู่ไกลอนันต์ เลนส์ 2 รับรังสีขนาน');else if(!isFinite(o.sp2))w.push('ภาพกลางอยู่ที่ F₂ ภาพสุดท้ายอยู่ไกลอนันต์ (ตาผ่อนคลายมองได้สบาย)');if(o.s2<0&&isFinite(o.s2))w.push('ภาพกลางอยู่เลยเลนส์ 2 ไป เลนส์ 2 จึงรับ "วัตถุเสมือน"');return w},
 draw(p,o){const b1=170,k=4,KY2=14,b2=b1+p.d*k,ho=p.ho,Ypx=y=>AX-y*KY2;let svg=L(10,AX,630,AX,'--muted',1)+lensShape(b1,true)+lensShape(b2,true);
  svg+=T(b1,28,'เลนส์ 1',{fs:11,b:1})+T(b2,28,'เลนส์ 2',{fs:11,b:1});
  [[b1,p.f1,'F₁'],[b2,p.f2,'F₂']].forEach(([b,f,l])=>{[-1,1].forEach(d=>{svg+=DOT(b+d*f*k,AX,'--accent',3)+(d>0?T(b+d*f*k,AX+16,l+'′',{fs:10,c:'--accent'}):T(b+d*f*k,AX+16,l,{fs:10,c:'--accent'}))})});
  const s=p.s,rays=[];
  rays.push({y:ho,m:0,c:'--ray'});rays.push({y:0,m:-ho/s,c:'--ray2'});
  if(Math.abs(s-p.f1)>0.01){const m3=-ho/(s-p.f1);rays.push({y:ho+m3*s,m:m3,c:'--ray',hit:true})}
  const xEnd=isFinite(o.sp2)&&o.sp2>0?Math.min((630-b1)/k,p.d+o.sp2+9):(630-b1)/k;
  rays.forEach(r=>{let y1=r.hit?r.y:(r.y===0?0:r.y);if(r.hit)y1=r.y;
   const m1=r.m-y1/p.f1,y2=y1+m1*p.d,m2=m1-y2/p.f2,yE=y2+m2*(xEnd-p.d);
   const pts=[[b1-s*k,Ypx(ho)],[b1,Ypx(y1)],[b2,Ypx(y2)],[b1+xEnd*k,Ypx(yE)]];
   svg+=PL(pts,r.c,2)+midArrow(pts.slice(0,2),r.c);
   if(isFinite(o.sp2)&&o.sp2<0)svg+=PL([[b2,Ypx(y2)],[b2+o.sp2*k,Ypx(y2+m2*o.sp2)]],r.c,1.5,'5 4')});
  if(isFinite(o.sp1)){const x=b1+o.sp1*k,hh=o.m1*ho;if(x>0&&x<640)svg+=ARW(x,AX,x,AX-hh*KY2,'--muted',3,o.sp1>0?'3 3':'2 5')+T(x,AX-hh*KY2+(hh>=0?-6:14),'ภาพกลาง',{fs:10,c:'--muted'})}
  if(isFinite(o.sp2)){const x=b2+o.sp2*k,hh=o.m*ho;if(x>0&&x<640)svg+=ARW(x,AX,x,AX-hh*KY2,'--img',4,o.sp2>0?null:'4 4')+T(x,AX-hh*KY2+(hh>=0?-8:16),o.sp2>0?'ภาพจริง':'ภาพเสมือน',{fs:11,b:1,c:'--img'})}
  const ox=b1-s*k;svg+=`<g data-drag class="drag"><rect x="${ox-14}" y="${AX-ho*KY2-8}" width="28" height="${ho*KY2+8}" style="fill:transparent"/>`+ARW(ox,AX,ox,AX-ho*KY2,'--ink',4)+`</g>`+T(ox,AX+32,'วัตถุ',{b:1});
  return svg},
 drag:{id:'s',px:(X)=>(170-X)/4},
 extra(p,o){const r=(a,b)=>`<tr><td class="rowh">${a}</td><td>${b}</td></tr>`;return{title:'อ่านขั้นตอน',html:`<table><tr><th>ขั้น</th><th>ผล</th></tr>`+r('1 เลนส์ 1 สร้างภาพกลาง','s₁′ = '+fmt(o.sp1)+' cm, m₁ = '+fmt(o.m1))+r('2 ภาพกลางเป็นวัตถุของเลนส์ 2','s₂ = d − s₁′ = '+fmt(o.s2)+' cm')+r('3 เลนส์ 2 สร้างภาพสุดท้าย','s₂′ = '+fmt(o.sp2)+' cm, m₂ = '+fmt(o._b.m))+r('4 รวมผล','m = m₁m₂ = '+fmt(o.m)+' ('+(o.m<0?'หัวกลับ':'หัวตั้ง')+')')+`</table>`}},
 notes:['กำลังขยายรวมคือผลคูณ m₁ × m₂ ไม่ใช่ผลบวก','ภาพกลับด้านทุกครั้งที่เกิดเป็นภาพจริงจากเลนส์นูน สองครั้งจึงหัวตั้งเหมือนเดิม','กล้องจุลทรรศน์: เลนส์ใกล้วัตถุ (f₁ สั้น) สร้างภาพจริงขยาย แล้วเลนส์ตาทำหน้าที่แว่นขยาย (s₂ &lt; f₂) ได้ภาพเสมือนขยายอีกชั้น','เพิ่ม d ทำให้ s₂ เพิ่ม ภาพสุดท้ายเลื่อนจากภาพเสมือนไปเป็นภาพจริง เมื่อ s₂ ข้าม f₂']
});

const PLr=(pts,color,w=2,op=1)=>`<polyline points="${pts.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}" style="fill:none;stroke:${color};stroke-width:${w};stroke-opacity:${op}"/>`;
const arcAt=(cx,cy,r,a1,a2,label,c='--accent')=>{ // angles in screen degrees measured from +x, y down
  const p1=[cx+r*Math.cos(a1*RAD),cy+r*Math.sin(a1*RAD)],p2=[cx+r*Math.cos(a2*RAD),cy+r*Math.sin(a2*RAD)],sw=a2>a1?1:0,am=(a1+a2)/2;
  return `<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${r} ${r} 0 0 ${sw} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" style="fill:none;stroke:var(${c});stroke-width:1.8"/>`+T(cx+(r+16)*Math.cos(am*RAD),cy+(r+16)*Math.sin(am*RAD)+4,label,{fs:11,c,b:1})};
// ---------- 6 การหักเห ----------
CASES.push({
 name:'การหักเห',title:'การหักเหและการสะท้อนกลับหมด',
 desc:'แสงเปลี่ยนทิศเมื่อผ่านรอยต่อระหว่างตัวกลางสองชนิด เพราะความเร็วแสงในแต่ละตัวกลางไม่เท่ากัน ถ้าไปหาตัวกลางที่ดรรชนีหักเหน้อยกว่าและมุมตกกระทบใหญ่พอ จะเกิดการสะท้อนกลับหมด',
 formula:'n₁ sin θ₁ = n₂ sin θ₂ &nbsp;|&nbsp; n = c/v &nbsp;|&nbsp; sin θ<sub>c</sub> = n₂/n₁ (เมื่อ n₁ &gt; n₂) &nbsp;|&nbsp; ความถี่คงที่ λ₂/λ₁ = n₁/n₂',
 params:[
  {id:'n1',label:'ดรรชนีหักเหตัวกลางบน (n₁)',unit:'',min:1,max:2.5,step:0.01,def:1},
  {id:'n2',label:'ดรรชนีหักเหตัวกลางล่าง (n₂)',unit:'',min:1,max:2.5,step:0.01,def:1.5},
  {id:'t1',label:'มุมตกกระทบ (θ₁)',unit:'°',min:0,max:89,step:1,def:40}],
 presets:[{label:'อากาศ → น้ำ',set:{n1:1,n2:1.33,t1:45}},{label:'อากาศ → แก้ว',set:{n1:1,n2:1.5,t1:45}},{label:'แก้ว → อากาศ (สะท้อนกลับหมด)',set:{n1:1.5,n2:1,t1:55}},{label:'น้ำ → อากาศ',set:{n1:1.33,n2:1,t1:40}}],
 outs:[
  {id:'t2',name:'มุมหักเห (θ₂)',unit:'°'},
  {id:'tc',name:'มุมวิกฤต (θ<sub>c</sub>)',unit:'°'},
  {id:'R',name:'แสงที่สะท้อน',unit:'%'},
  {id:'v1',name:'ความเร็วแสงตัวกลางบน',unit:'×10⁸ m/s'},
  {id:'v2',name:'ความเร็วแสงตัวกลางล่าง',unit:'×10⁸ m/s'},
  {id:'lam',name:'λ₂ / λ₁',unit:'เท่า'},
  {id:'bend',name:'การเบน',unit:''}],
 compute(p){const s2=p.n1*Math.sin(p.t1*RAD)/p.n2,tir=s2>1,t2=tir?null:Math.asin(s2),c1=Math.cos(p.t1*RAD);let R=1;
  if(!tir){const c2=Math.cos(t2),rs=((p.n1*c1-p.n2*c2)/(p.n1*c1+p.n2*c2))**2,rp=((p.n1*c2-p.n2*c1)/(p.n1*c2+p.n2*c1))**2;R=(rs+rp)/2}
  return{t2:tir?'สะท้อนกลับหมด':t2*DEG,tc:p.n1>p.n2?Math.asin(p.n2/p.n1)*DEG:'ไม่มี (n₁ ≤ n₂)',R:R*100,v1:3/p.n1,v2:3/p.n2,lam:p.n1/p.n2,bend:tir?'—':(Math.abs(p.n1-p.n2)<1e-9?'ไม่เบน':(p.n2>p.n1?'เข้าหาเส้นปกติ':'ออกจากเส้นปกติ')),_tir:tir}},
 check(p,o){return o._tir?['เกิดการสะท้อนกลับหมด: ไม่มีแสงหักเหผ่านรอยต่อ แสงสะท้อนกลับทั้งหมด (ใช้ในใยแก้วนำแสงและปริซึมสะท้อน)']:[]},
 draw(p,o){const cx=320,cy=150,Ln=125,t1=p.t1*RAD;let svg=`<rect x="0" y="${cy}" width="640" height="150" style="fill:var(--water-soft);opacity:${(0.25+0.3*(p.n2-1)/1.5).toFixed(2)}"/>`+L(0,cy,640,cy,'--ink',2)+L(cx,cy-135,cx,cy+135,'--muted',1.2,'5 4');
  svg+=T(14,cy-10,'ตัวกลางบน n₁ = '+p.n1.toFixed(2),{a:'start',fs:12,b:1})+T(14,cy+22,'ตัวกลางล่าง n₂ = '+p.n2.toFixed(2),{a:'start',fs:12,b:1})+T(cx+6,24,'เส้นปกติ',{a:'start',fs:10,c:'--muted'});
  const inc=[[cx-Ln*Math.sin(t1),cy-Ln*Math.cos(t1)],[cx,cy]],refl=[[cx,cy],[cx+Ln*Math.sin(t1),cy-Ln*Math.cos(t1)]];
  svg+=PL(inc,'--ray',3)+midArrow(inc,'--ray')+`<polyline points="${refl.map(q=>q.join(',')).join(' ')}" style="fill:none;stroke:var(--ray);stroke-width:2.5;stroke-opacity:${Math.max(0.18,o.R/100).toFixed(2)};stroke-dasharray:${o._tir?'none':'1 0'}"/>`;
  if(!o._tir){const t2=o.t2*RAD,tr=[[cx,cy],[cx+Ln*1.1*Math.sin(t2),cy+Ln*1.1*Math.cos(t2)]];svg+=PL(tr,'--ray2',3)+midArrow(tr,'--ray2')+arcAt(cx,cy,48,90,90-o.t2,'θ₂','--ray2')}
  svg+=arcAt(cx,cy,48,-90,-90-p.t1,'θ₁','--ray');
  if(p.n1>p.n2){const tc=Math.asin(p.n2/p.n1);svg+=L(cx-Ln*Math.sin(tc),cy-Ln*Math.cos(tc),cx,cy,'--muted',1,'3 4')+T(cx-Ln*Math.sin(tc)-6,cy-Ln*Math.cos(tc)-6,'มุมวิกฤต '+fmt(o.tc)+'°',{a:'end',fs:10,c:'--muted'})}
  return svg},
 three: {
  cam() { return { pos: [1.8, 1.2, 4.2], target: [0, 0, 0] }; },
  build(T, p, o) {
   const W = 4, D = 2, a = T.box(W, 1.6, D, '--water', { opacity: 0.04 + 0.1 * (p.n1 - 1), cast: false }); a.position.y = 0.8; const b = T.box(W, 1.6, D, '--water', { opacity: 0.08 + 0.18 * (p.n2 - 1), cast: false }); b.position.y = -0.8;
   T.label('n₁ = ' + fmt(p.n1), '--ink', { pos: [-1.6, 1.4, 0] }); T.label('n₂ = ' + fmt(p.n2), '--ink', { pos: [-1.6, -1.4, 0] });
   T.line('--muted', { pts: [[0, 1.5, 0], [0, -1.5, 0]], dash: 0.06 });
   const ray = (a, d, L, c, r) => T.vec(c, '', { kind: 'v', r, line: false, mid: true }).set(a, d.map(x => x * L));
   const t1 = p.t1 * RAD, R = o.R / 100;
   ray([-1.5 * Math.sin(t1), 1.5 * Math.cos(t1), 0], [Math.sin(t1), -Math.cos(t1), 0], 1.5, '--ray', 0.022).set([-1.5 * Math.sin(t1), 1.5 * Math.cos(t1), 0], [1.5 * Math.sin(t1), -1.5 * Math.cos(t1), 0], 'θ₁ ' + p.t1 + '°');
   T.vec('--ray', '', { kind: 'v', r: 0.022 * Math.max(0.35, Math.sqrt(R)), line: false, opacity: 0.4 + 0.6 * R }).set([0, 0, 0], [1.2 * Math.sin(t1), 1.2 * Math.cos(t1), 0], 'สะท้อน ' + fmt(o.R) + '%');
   if (!o._tir) { const t2 = o.t2 * RAD; T.vec('--ray2', '', { kind: 'v', r: 0.022, line: false }).set([0, 0, 0], [1.5 * Math.sin(t2), -1.5 * Math.cos(t2), 0], 'θ₂ ' + fmt(o.t2) + '°'); }
   else T.label('สะท้อนกลับหมด', '--bad', { pos: [1, -0.6, 0] });
   return {};
  }
 },
 notes:['n₂ มากขึ้น (แสงช้าลง) → θ₂ ลดลง แสงเบนเข้าหาเส้นปกติ','θ₁ เพิ่ม → θ₂ เพิ่ม และสัดส่วนแสงที่สะท้อนเพิ่มขึ้นมาก เมื่อใกล้ 90°','ไปตัวกลางที่ n น้อยกว่า (เช่น แก้ว → อากาศ): θ₂ &gt; θ₁ ถึง θ₂ = 90° ที่มุมวิกฤต เกินนั้นเกิดสะท้อนกลับหมด','ความถี่ของแสงไม่เปลี่ยนเมื่อเปลี่ยนตัวกลาง v และ λ เปลี่ยนตามกัน (λ = v/f)']
});

// ---------- 7 แผ่นกระจกขนาน ----------
CASES.push({
 name:'แผ่นกระจกขนาน',title:'แสงผ่านแผ่นกระจกหน้าขนาน',
 desc:'แสงออกจากแผ่นกระจกในทิศขนานกับตอนเข้า แต่ถูกเลื่อนไปด้านข้าง ยิ่งแผ่นหนาและมุมตกกระทบมากยิ่งเลื่อนมาก',
 formula:'sin θ₁ = n sin θ₂ &nbsp;|&nbsp; ระยะเลื่อน d = t·sin(θ₁ − θ₂)/cos θ₂ &nbsp;|&nbsp; ความหนาปรากฏ (มองตรง) = t/n',
 params:[
  {id:'n',label:'ดรรชนีหักเหของแผ่น (n)',unit:'',min:1.1,max:2.4,step:0.05,def:1.5},
  {id:'t',label:'ความหนาแผ่น (t)',unit:'cm',min:1,max:10,step:0.5,def:6},
  {id:'t1',label:'มุมตกกระทบ (θ₁)',unit:'°',min:0,max:80,step:1,def:50}],
 outs:[
  {id:'t2',name:'มุมหักเหในแผ่น (θ₂)',unit:'°'},
  {id:'d',name:'ระยะที่แสงเลื่อนไปด้านข้าง (d)',unit:'cm'},
  {id:'path',name:'ระยะทางของแสงในแผ่น',unit:'cm'},
  {id:'app',name:'ความหนาปรากฏเมื่อมองตรง',unit:'cm'},
  {id:'v',name:'ความเร็วแสงในแผ่น',unit:'×10⁸ m/s'}],
 compute(p){const t1=p.t1*RAD,t2=Math.asin(Math.sin(t1)/p.n);return{t2:t2*DEG,d:p.t*Math.sin(t1-t2)/Math.cos(t2),path:p.t/Math.cos(t2),app:p.t/p.n,v:3/p.n}},
 draw(p,o){const k=11,top=62,tp=p.t*k,bot=top+tp,cx=300,t1=p.t1*RAD,t2=o.t2*RAD,dy=Math.min(95,282-bot);
  const ex=cx+tp*Math.tan(t2),inLen=52,A=[cx-inLen*Math.sin(t1),top-inLen*Math.cos(t1)],B=[cx,top],C=[ex,bot],D=[ex+dy*Math.tan(t1),bot+dy];
  const straightEnd=[cx+(bot-top+dy)*Math.tan(t1),bot+dy];
  let svg=`<rect x="130" y="${top}" width="360" height="${tp}" style="fill:var(--water-soft);stroke:var(--water);stroke-width:1.5;opacity:.85"/>`+T(500,top+tp/2+4,'n = '+p.n.toFixed(2),{a:'start',fs:12,b:1})+
   L(cx,top-48,cx,top,'--muted',1,'4 4')+L(ex,bot,ex,bot+48,'--muted',1,'4 4');
  svg+=PL([B,straightEnd],'--muted',1.5,'6 5')+PL([A,B],'--ray',3)+midArrow([A,B],'--ray')+PL([B,C],'--ray2',3)+midArrow([B,C],'--ray2')+PL([C,D],'--ray',3)+midArrow([C,D],'--ray');
  if(p.t1>0){const dp=o.d*k,fx=straightEnd[0]-dp*Math.cos(t1),fy=straightEnd[1]+dp*Math.sin(t1);svg+=L(straightEnd[0],straightEnd[1],fx,fy,'--accent',2.5)+T(fx-8,fy+4,'d = '+fmt(o.d)+' cm',{a:'end',c:'--accent',fs:12,b:1})}
  svg+=arcAt(cx,top,34,-90,-90-p.t1,'θ₁','--ray')+arcAt(cx,top,30,90,90-o.t2,'θ₂','--ray2')+T(120,top+tp/2+4,'t = '+p.t+' cm',{a:'end',fs:11,c:'--muted'})+
   T(14,16,'ส้ม = แสงในอากาศ (เข้าและออกขนานกัน)',{a:'start',fs:11,c:'--ray'})+T(14,32,'ฟ้า = แสงในแผ่น',{a:'start',fs:11,c:'--ray2'})+T(14,48,'เส้นประ = ทางตรงถ้าไม่มีแผ่น',{a:'start',fs:11,c:'--muted'});
  return svg},
 three: {
  cam() { return { pos: [1.2, 0.8, 4], target: [0.3, -0.2, 0] }; },
  build(T, p, o) {
   const t = p.t * 0.15, W = 4.5, sl = T.box(W, t, 1.6, '--water', { opacity: 0.35, cast: false }); sl.position.set(0.5, -t / 2, 0);
   const t1 = p.t1 * RAD, t2 = o.t2 * RAD, A = [0, 0], B = [t * Math.tan(t2), -t], L = 1.6, c = { kind: 'v', line: false, r: 0.022 };
   T.vec('--ray', '', c).set([-L * Math.sin(t1), L * Math.cos(t1), 0], [L * Math.sin(t1), -L * Math.cos(t1), 0], 'θ₁ ' + p.t1 + '°');
   T.vec('--ray', '', c).set([A[0], A[1], 0], [B[0] - A[0], B[1] - A[1], 0], 'θ₂ ' + fmt(o.t2) + '°');
   T.vec('--ray', '', c).set([B[0], B[1], 0], [L * Math.sin(t1), -L * Math.cos(t1), 0]);
   seg3d(T, B, [B[0] + 2 * L * Math.sin(t1), B[1] - 2 * L * Math.cos(t1) + 2 * L * Math.cos(t1) - 2 * L * Math.cos(t1)], '--ray', { opacity: 0 });
   seg3d(T, A, [A[0] + 2.2 * Math.sin(t1), A[1] - 2.2 * Math.cos(t1)], '--muted', { dash: 0.05 });   // แนวเดิมถ้าไม่มีแผ่น
   [A, B].forEach(P => seg3d(T, [P[0], P[1] + 0.5], [P[0], P[1] - 0.5], '--muted', { dash: 0.04 }));
   T.label('n = ' + fmt(p.n) + ', t = ' + p.t + ' cm', '--ink', { pos: [2.2, -t / 2, 0.85] }); T.label('เลื่อนด้านข้าง d = ' + fmt(o.d) + ' cm', '--c4', { pos: [B[0] + 1.2, B[1] - 0.6, 0] });
   return {};
  }
 },
 notes:['θ₁ = 0° แสงตั้งฉาก ไม่เบน และไม่เลื่อน (d = 0)','t↑ → d↑ เป็นสัดส่วนตรง และ θ₁↑ → d↑','n↑ → θ₂↓ และ d↑ (แสงเบนมากขึ้น)','มองตรงผ่านแผ่นหนา t วัตถุด้านหลังดูเหมือนอยู่ใกล้กว่าจริงเป็น t/n เหมือนก้นสระที่ดูตื้นกว่าความจริง']
});

// ---------- 8 ปริซึม ----------
const prismTrace=(n,A,t1d)=>{const h=A/2*RAD,t1=t1d*RAD,t2=Math.asin(Math.sin(t1)/n),a3=A*RAD-t2,s4=n*Math.sin(a3);
  if(a3<=0||s4>1)return{ok:false,t2,a3};const t4=Math.asin(s4);return{ok:true,t2,a3,t4,delta:(t1+t4-A*RAD)*DEG,h}};
CASES.push({
 name:'ปริซึม',title:'ปริซึมและการกระจายแสง',
 desc:'แสงหักเหสองครั้งที่ผิวปริซึม เบนเข้าหาฐาน แสงต่างสีมีดรรชนีหักเหต่างกันเล็กน้อย จึงเบนไม่เท่ากันและแยกเป็นสี',
 formula:'δ = θ₁ + θ₄ − A &nbsp;|&nbsp; θ₂ + θ₃ = A &nbsp;|&nbsp; δ<sub>min</sub> = 2 sin⁻¹(n sin(A/2)) − A (เมื่อ θ₁ = θ₄)',
 params:[
  {id:'n',label:'ดรรชนีหักเห (n)',unit:'',min:1.3,max:2,step:0.01,def:1.5},
  {id:'A',label:'มุมยอดปริซึม (A)',unit:'°',min:30,max:90,step:1,def:60},
  {id:'t1',label:'มุมตกกระทบด้านซ้าย (θ₁)',unit:'°',min:15,max:80,step:1,def:50},
  {id:'disp',label:'การแยกสี',opts:[[0,'แสงขาวไม่แยกสี'],[1,'แยกเป็นสี']],def:1}],
 outs:[
  {id:'t2',name:'มุมหักเหที่ผิวแรก (θ₂)',unit:'°'},
  {id:'t3',name:'มุมตกกระทบที่ผิวสอง (θ₃)',unit:'°'},
  {id:'t4',name:'มุมที่แสงออก (θ₄)',unit:'°'},
  {id:'dl',name:'มุมเบี่ยงเบน (δ)',unit:'°'},
  {id:'dmin',name:'มุมเบี่ยงเบนต่ำสุด (δ<sub>min</sub>)',unit:'°'},
  {id:'spread',name:'มุมกระจาย (แดง→ม่วง)',unit:'°'}],
 presets:[{label:'ผ่านค่าต่ำสุด',set:{n:1.5,A:60,t1:48.6,disp:1}},{label:'เกือบสะท้อนกลับหมด',set:{n:1.5,A:60,t1:15,disp:0}},{label:'ปริซึมมุมฉาก 90°',set:{n:1.5,A:90,t1:20,disp:0}}],
 compute(p){const tr=prismTrace(p.n,p.A,p.t1),nr=p.n-0.012,nv=p.n+0.02,r=prismTrace(nr,p.A,p.t1),v=prismTrace(nv,p.A,p.t1),sm=p.n*Math.sin(p.A/2*RAD);
  return{t2:tr.t2*DEG,t3:tr.a3*DEG,t4:tr.ok?tr.t4*DEG:'ไม่ออก (สะท้อนกลับหมด)',dl:tr.ok?tr.delta:'แสงไม่ผ่านออกด้านขวา',dmin:sm<=1?2*Math.asin(sm)*DEG-p.A:'—',spread:(r.ok&&v.ok)?v.delta-r.delta:'—',_tr:tr,_r:r,_v:v}},
 check(p,o){return o._tr.ok?[]:['แสงตกกระทบผิวที่สองด้วยมุมเกินมุมวิกฤต จึงสะท้อนกลับหมดภายในปริซึม ลองลดมุมยอด A หรือปรับ θ₁']},
 draw(p,o){const ox=250,oy=48,Lf=150,h=p.A/2*RAD,X=x=>ox+x,Y=y=>oy-y;
  const apex=[0,0],bl=[-Lf*Math.sin(h),-Lf*Math.cos(h)],br=[Lf*Math.sin(h),-Lf*Math.cos(h)];
  let svg=`<polygon points="${[apex,bl,br].map(q=>X(q[0]).toFixed(1)+','+Y(q[1]).toFixed(1)).join(' ')}" style="fill:var(--water-soft);stroke:var(--water);stroke-width:2;opacity:.9"/>`+T(ox,oy+46,'A = '+p.A+'°',{fs:12,c:'--accent',b:1});
  const E1=[0.55*bl[0],0.55*bl[1]],phiIn=-h+p.t1*RAD;
  const trace=(n,colorHex,w)=>{const t=prismTrace(n,p.A,p.t1),t2=t.t2,phi2=-h+t2;
   // intersect E1 + s*(cos phi2, sin phi2) with right face u*(sin h,-cos h)
   const dx=Math.cos(phi2),dy=Math.sin(phi2),fx=Math.sin(h),fy=-Math.cos(h),det=dx*(-fy)-dy*(-fx);let s=((0-E1[0])*(-fy)-(0-E1[1])*(-fx))/det;
   // solve E1 + s d = u f  -> [dx -fx;dy -fy][s;u]=[-E1]
   const a=dx,b=-fx,c=dy,d=-fy,e=-E1[0],f=-E1[1],D=a*d-b*c;s=(e*d-b*f)/D;const u=(a*f-c*e)/D;const E2=[E1[0]+s*dx,E1[1]+s*dy];
   let g=PLr([[X(E1[0]),Y(E1[1])],[X(E2[0]),Y(E2[1])]],colorHex,w);
   if(t.ok){const phiOut=h-t.t4;g+=PLr([[X(E2[0]),Y(E2[1])],[X(E2[0]+300*Math.cos(phiOut)),Y(E2[1]+300*Math.sin(phiOut))]],colorHex,w)}
   return g};
  const back=[[X(E1[0]-120*Math.cos(phiIn)),Y(E1[1]-120*Math.sin(phiIn))],[X(E1[0]),Y(E1[1])]];
  svg+=PL(back,'--ink',3)+midArrow(back,'--ink');
  if(p.disp){svg+=trace(p.n-0.012,'#f03e3e',2.5)+trace(p.n,'#37b24d',2.5)+trace(p.n+0.02,'#845ef7',2.5);[['#f03e3e','แดง (เบนน้อยสุด)',30],['#37b24d','เขียว',50],['#845ef7','ม่วง (เบนมากสุด)',70]].forEach(q=>{svg+='<rect x="440" y="'+(q[2]-8)+'" width="18" height="5" style="fill:'+q[0]+'"/>'+T(464,q[2]-2,q[1],{a:'start',fs:11,c:'--muted'})})}
  else svg+=trace(p.n,'var(--ray)',3);
  // normal at left face
  const nx=Math.cos(h),ny=-Math.sin(h);svg+=L(X(E1[0]-60*nx),Y(E1[1]-60*ny),X(E1[0]+40*nx),Y(E1[1]+40*ny),'--muted',1,'3 4');
  svg+=(o._tr.ok?T(600,280,'δ = '+fmt(o.dl)+'°',{a:'end',fs:13,b:1}):'');
  return svg},
 three: {
  cam() { return { pos: [0.4, 0.6, 4.2], target: [0.7, -0.9, 0] }; },
  build(T, p, o) {
   const Lf = 1.5, h = p.A / 2 * RAD, bl = [-Lf * Math.sin(h), -Lf * Math.cos(h)], br = [Lf * Math.sin(h), -Lf * Math.cos(h)], D = 0.8;
   const pr = T.extrude([[0, 0], bl, br], D, '--water', { opacity: 0.35, cast: false }); pr.material.side = T.THREE.DoubleSide;
   const eg = new T.THREE.LineSegments(new T.THREE.EdgesGeometry(pr.geometry), new T.THREE.LineBasicMaterial({ color: T.color('--water') })); T.scene.add(eg);
   T.floor(8, { step: 0.25, y: -1.9 }).position.x = 0.8;
   const ray = (a, b, c, r = 0.012) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), m = T.cyl(r, r, L, '--ray', { cast: false }); m.material = new T.THREE.MeshStandardMaterial({ color: new T.THREE.Color(c), emissive: new T.THREE.Color(c), emissiveIntensity: 0.6 }); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0); m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2; };
   const E1 = [0.55 * bl[0], 0.55 * bl[1]], phiIn = -h + p.t1 * RAD, white = '#' + T.color('--ink').getHexString();
   ray([E1[0] - 1.6 * Math.cos(phiIn), E1[1] - 1.6 * Math.sin(phiIn)], E1, white, 0.018);
   T.vec('--ink', null, { kind: 'v', r: 0.012, line: false }).set([E1[0] - 1.0 * Math.cos(phiIn), E1[1] - 1.0 * Math.sin(phiIn), 0], [0.3 * Math.cos(phiIn), 0.3 * Math.sin(phiIn), 0]);
   const scr = T.box(0.04, 2.4, 1.2, '--panel'); scr.position.set(3.3, -1.1, 0);
   const trace = (n, c) => {
    const t = prismTrace(n, p.A, p.t1), phi2 = -h + t.t2, dx = Math.cos(phi2), dy = Math.sin(phi2), fx = Math.sin(h), fy = -Math.cos(h), D2 = dx * -fy - -fx * dy, s = (-E1[0] * -fy - -fx * -E1[1]) / D2, E2 = [E1[0] + s * dx, E1[1] + s * dy];
    ray(E1, E2, c);
    if (t.ok) { const po = h - t.t4, k = (3.28 - E2[0]) / Math.max(1e-3, Math.cos(po)), P = [E2[0] + k * Math.cos(po), E2[1] + k * Math.sin(po)]; if (k > 0) { ray(E2, P, c); const sp = T.sphere(0.035, '--ray', { cast: false }); sp.material = new T.THREE.MeshStandardMaterial({ color: new T.THREE.Color(c), emissive: new T.THREE.Color(c), emissiveIntensity: 0.9 }); sp.position.set(3.27, P[1], 0); } }
   };
   if (p.disp) ['#f03e3e', '#fd7e14', '#fab005', '#37b24d', '#1c7ed6', '#4c6ef5', '#845ef7'].forEach((c, i) => trace(p.n - 0.012 + 0.032 * i / 6, c));
   else trace(p.n, white);
   T.label('A = ' + p.A + '°', '--accent', { pos: [0, 0.25, 0] }); if (o._tr.ok) T.label('δ = ' + fmt(o.dl) + '°', '--ink', { pos: [2.6, 0.4, 0] }); else T.label('สะท้อนกลับหมดภายใน', '--bad', { pos: [1.4, 0.3, 0] });
   return {};
  }
 },
 notes:['n↑ → δ↑ แสงเบนมากขึ้น และแสงม่วง (n มากกว่า) เบนมากกว่าแสงแดง จึงเรียงสีเป็นสเปกตรัม','A↑ → δ↑ ปริซึมที่ยอดแหลมมากเบนน้อย','θ₁ ที่ทำให้ δ ต่ำที่สุดคือเมื่อแสงผ่านสมมาตร (θ₁ = θ₄) ตรงกับที่รังสีในปริซึมขนานฐาน','ถ้า A ใหญ่หรือ n ใหญ่ แสงอาจตกผิวที่สองเกินมุมวิกฤตและไม่ออก']
});

// ---------- 9 ตาและแว่นตา ----------
CASES.push({
 name:'ตาและแว่นตา',title:'สายตาสั้น สายตายาว และแว่นแก้',
 desc:'ตาปกติรวมแสงให้ตกพอดีที่จอประสาทตา สายตาสั้นรวมแสงก่อนถึงจอ สายตายาวรวมแสงเลยจอ แว่นตาช่วยเลื่อนภาพกลับมาที่จอ',
 formula:'สายตาสั้น: f = −(จุดไกลสุด) &nbsp;|&nbsp; สายตายาว: 1/f = 1/25 − 1/(จุดใกล้สุด) &nbsp;|&nbsp; กำลังเลนส์ P = 100/f (f หน่วย cm) ไดออปเตอร์',
 params:[
  {id:'type',label:'ลักษณะสายตา',opts:[['m','สายตาสั้น'],['h','สายตายาว']],def:'m'},
  {id:'lim',label:'จุดไกลสุด (สั้น) / จุดใกล้สุด (ยาว)',unit:'cm',min:30,max:200,step:5,def:60},
  {id:'gl',label:'แว่นตา',opts:[[0,'ไม่ใส่แว่น'],[1,'ใส่แว่นแก้']],def:0}],
 outs:[
  {id:'lens',name:'เลนส์ที่ต้องใช้',unit:''},
  {id:'f',name:'ความยาวโฟกัสแว่น (f)',unit:'cm'},
  {id:'Pw',name:'กำลังเลนส์ (P)',unit:'D'},
  {id:'fv',name:'ภาพตกห่างจากเลนส์ตา',unit:'cm'},
  {id:'where',name:'ตำแหน่งภาพเทียบจอประสาทตา',unit:''}],
 compute(p){const Leye=2.4,my=p.type==='m';let f,Pw,fv;
  if(my){f=-p.lim;fv=p.gl?Leye:1/(1/p.lim+1/Leye)}else{f=1/(1/25-1/p.lim);fv=p.gl?Leye:1/(1/p.lim+1/Leye-1/25)}
  Pw=100/f;const d=fv-Leye;return{lens:my?'เลนส์เว้า':'เลนส์นูน',f,Pw,fv,where:Math.abs(d)<0.005?'ตกบนจอพอดี (ชัด)':(d<0?'ตกหน้าจอ (เบลอ)':'ตกหลังจอ (เบลอ)'),_L:Leye}},
 draw(p,o){const kp=70,xl=300,xr=xl+2.4*kp,cy=150,my=p.type==='m';
  let svg=`<ellipse cx="${(xl+xr)/2}" cy="${cy}" rx="${(xr-xl)/2+12}" ry="72" style="fill:var(--bg);stroke:var(--ink);stroke-width:2.5"/>`+
   `<path d="M${xr-3} ${cy-48} Q${xr+12} ${cy} ${xr-3} ${cy+48}" style="fill:none;stroke:var(--img);stroke-width:5"/>`+T(xr+10,cy-58,'จอประสาทตา',{a:'start',fs:11,c:'--img'})+
   `<path d="M${xl} ${cy-27} Q${xl+10} ${cy} ${xl} ${cy+27} Q${xl-10} ${cy} ${xl} ${cy-27} Z" style="fill:var(--water-soft);stroke:var(--ink);stroke-width:2"/>`+T(xl,cy-38,'เลนส์ตา',{fs:11})+L(30,cy,xr+60,cy,'--muted',1,'3 5');
  const yh=22,EX=4,fvd=xr+(o.fv-2.4)*kp*EX,fx=clamp(fvd,xl+30,xr+150);
  const gx=215;
  if(p.gl){const pm=my;svg+=pm?`<path d="M${gx-8} ${cy-42} L${gx+8} ${cy-42} Q${gx+2} ${cy} ${gx+8} ${cy+42} L${gx-8} ${cy+42} Q${gx-2} ${cy} ${gx-8} ${cy-42} Z" style="fill:var(--water-soft);stroke:var(--ink);stroke-width:2"/>`:`<path d="M${gx} ${cy-42} Q${gx+14} ${cy} ${gx} ${cy+42} Q${gx-14} ${cy} ${gx} ${cy-42} Z" style="fill:var(--water-soft);stroke:var(--ink);stroke-width:2"/>`;svg+=T(gx,cy-52,my?'แว่นเว้า':'แว่นนูน',{fs:11,c:'--accent',b:1})}
  [1,-1].forEach(sg=>{
    const pts=[];
    if(my)pts.push([40,cy-sg*(p.gl?yh-4:yh)]);else pts.push([40,cy-sg*(p.gl?yh*0.3:yh*0.35)]);
    if(p.gl)pts.push([gx,cy-sg*(my?yh-3:yh*0.95)]);
    pts.push([xl,cy-sg*yh]);
    let dotted=null;
    if(p.gl){pts.push([xr,cy])}
    else{const fxx=clamp(fvd,xl+30,xr+150);
      if(o.fv<2.395){pts.push([fxx,cy]);pts.push([xr,cy+sg*yh*(xr-fxx)/(fxx-xl)])}
      else if(o.fv>2.405){pts.push([xr,cy-sg*yh*(1-(xr-xl)/(fxx-xl))]);dotted=[[xr,cy-sg*yh*(1-(xr-xl)/(fxx-xl))],[Math.min(fxx,xr+140),cy-sg*yh*(1-(Math.min(fxx,xr+140)-xl)/(fxx-xl))]]}
      else pts.push([xr,cy])}
    svg+=PL(pts,'--ray',2.5)+midArrow(pts.slice(0,2),'--ray')+(dotted?PL(dotted,'--ray',1.5,'4 4'):'');
  });
  svg+=DOT(p.gl?xr:fx,cy,Math.abs(o.fv-2.4)<0.005||p.gl?'--ray2':'--warn',5)+T(p.gl?xr:fx,cy+88,o.where,{fs:12,b:1,c:(p.gl||Math.abs(o.fv-2.4)<0.005)?'--ray2':'--warn'});
  svg+=T(40,cy-52,my?'วัตถุไกล (รังสีขนาน)':'วัตถุใกล้ (รังสีแยก)',{a:'start',fs:11,c:'--muted'});
  return svg},
 notes:['สายตาสั้น: เห็นชัดเฉพาะของใกล้ ใช้เลนส์เว้ากระจายแสงก่อนเข้าตา ให้ภาพเสมือนอยู่ที่จุดไกลสุด กำลังเลนส์เป็นลบ','สายตายาว: เห็นชัดเฉพาะของไกล ใช้เลนส์นูนรวมแสง ให้วัตถุที่ 25 cm ดูเหมือนอยู่ที่จุดใกล้สุด กำลังเลนส์เป็นบวก','จุดไกลสุด/ใกล้สุด ยิ่งใกล้ตา ความบกพร่องยิ่งมาก กำลังเลนส์ที่ต้องใช้ยิ่งสูง','ในภาพ ลำแสงถูกวาดเกินจริง และระยะที่ภาพเลยหรือขาดจอประสาทตาถูกขยาย 4 เท่าเพื่อให้เห็นชัด ตัวเลขข้างบนคือค่าจริง สมมุติว่าแว่นอยู่ชิดตา']
});

// ---------- 10 ใยแก้วนำแสง ----------
CASES.push({
 name:'ใยแก้วนำแสง',title:'ใยแก้วนำแสง',
 desc:'แสงเข้าปลายใยแก้วที่มุมไม่เกินมุมรับ แล้วสะท้อนกลับหมดซ้ำๆ ที่ผิวแกนกับเปลือก เดินทางไปได้ไกลโดยไม่รั่วออก',
 formula:'sin α = n₁ sin β &nbsp;|&nbsp; มุมตกกระทบที่ผนัง ι = 90° − β &nbsp;|&nbsp; นำแสงได้เมื่อ ι ≥ θ<sub>c</sub> = sin⁻¹(n₂/n₁) &nbsp;|&nbsp; sin α<sub>max</sub> = √(n₁² − n₂²)',
 params:[
  {id:'n1',label:'ดรรชนีหักเหแกน (n₁)',unit:'',min:1.4,max:1.8,step:0.01,def:1.5},
  {id:'n2',label:'ดรรชนีหักเหเปลือก (n₂)',unit:'',min:1.3,max:1.75,step:0.01,def:1.45},
  {id:'a',label:'มุมแสงเข้าจากอากาศ (α)',unit:'°',min:0,max:60,step:1,def:15}],
 outs:[
  {id:'b',name:'มุมหักเหในแกน (β)',unit:'°'},
  {id:'i',name:'มุมตกกระทบที่ผนัง (ι)',unit:'°'},
  {id:'tc',name:'มุมวิกฤต (θ<sub>c</sub>)',unit:'°'},
  {id:'amax',name:'มุมรับสูงสุด (α<sub>max</sub>)',unit:'°'},
  {id:'NA',name:'NA = √(n₁² − n₂²)',unit:''},
  {id:'st',name:'ผลที่ได้',unit:''}],
 presets:[{label:'ใยแก้วมาตรฐาน',set:{n1:1.5,n2:1.45,a:15}},{label:'เปลือกใกล้แกน (มุมรับแคบ)',set:{n1:1.5,n2:1.49,a:6}},{label:'แสงเข้ามุมกว้างเกิน',set:{n1:1.5,n2:1.45,a:45}}],
 compute(p){const b=Math.asin(Math.sin(p.a*RAD)/p.n1),i=Math.PI/2-b,ok=p.n2<p.n1,tc=ok?Math.asin(p.n2/p.n1):Math.PI/2,NA=ok?Math.sqrt(p.n1**2-p.n2**2):0,amax=Math.asin(Math.min(1,NA));
  return{b:b*DEG,i:i*DEG,tc:ok?tc*DEG:'—',amax:ok?amax*DEG:'—',NA:ok?NA:'—',st:ok?(i>=tc-1e-9?'นำแสงได้ (สะท้อนกลับหมดทุกครั้ง)':'แสงรั่วออกที่ผนัง'):'ไม่นำแสง (n₂ ≥ n₁)',_ok:ok,_g:ok&&i>=tc-1e-9,_i:i,_b:b}},
 check(p,o){return o._ok?[]:['เปลือกต้องมีดรรชนีหักเหน้อยกว่าแกนจึงจะเกิดการสะท้อนกลับหมด']},
 draw(p,o){const y0=95,y1=205,cy=150,x0=70,xe=620;let svg=`<rect x="${x0}" y="${y0-26}" width="${xe-x0}" height="${y1-y0+52}" style="fill:var(--line);opacity:.6"/><rect x="${x0}" y="${y0}" width="${xe-x0}" height="${y1-y0}" style="fill:var(--water-soft)"/>`+L(x0,y0,xe,y0,'--water',1.5)+L(x0,y1,xe,y1,'--water',1.5)+
  T(xe-6,y0-9,'เปลือก n₂ = '+p.n2.toFixed(2),{a:'end',fs:11,c:'--muted'})+T(xe-6,cy+4,'แกน n₁ = '+p.n1.toFixed(2),{a:'end',fs:12,b:1})+L(x0,y0-26,x0,y1+26,'--ink',2);
  const al=p.a*RAD,inLen=90,A=[x0-inLen*Math.cos(al),cy+inLen*Math.sin(al)];
  svg+=PL([A,[x0,cy]],'--ray',3)+midArrow([A,[x0,cy]],'--ray');
  if(o._ok){const am=Math.asin(Math.min(1,o.NA));[1,-1].forEach(sg=>{svg+=L(x0,cy,x0-100*Math.cos(am),cy-sg*100*Math.sin(am),'--muted',1,'4 4')});svg+=T(8,34,'เส้นประ = ขอบมุมรับ ±'+fmt(o.amax)+'°',{a:'start',fs:11,c:'--muted'})}
  const b=o._b;let x=x0,y=cy,dir=-1,pts=[[x,y]];const tb=Math.tan(b);
  if(tb<1e-4){pts.push([xe,cy])}else{
   for(let n=0;n<60&&x<xe;n++){const dy=(dir<0)?(y-y0):(y1-y),dx=dy/tb;if(x+dx>=xe){pts.push([xe,y+dir*(xe-x)*tb]);break}
     x+=dx;y=(dir<0)?y0:y1;pts.push([x,y]);
     if(!o._g){ // leak: refract out
       const sg=p.n1*Math.sin(o._i)/p.n2;if(o._ok&&sg<=1){const g=Math.asin(sg),ox=60,oy=-dir*0;const ex=x+ox*Math.tan(Math.PI/2-g)*(1),ey=y+dir*Math.min(60,26);svg+=PL(pts,'--ray2',2.5)+PL([[x,y],[x+Math.min(130,26/Math.tan(g)),y+dir*26]],'--warn',2.5)+T(x+30,y+dir*40,'แสงรั่วออก',{a:'start',fs:11,c:'--warn',b:1});pts=null}break}
     dir=-dir}}
  if(pts)svg+=PL(pts,'--ray2',2.5);
  svg+=arcAt(x0,cy,34,0,-p.a,'α','--ray');
  return svg},
 three: {
  cam() { return { pos: [2.2, 1.6, 4.4], target: [2.4, 0, 0] }; },
  build(T, p, o) {
   const Lf = 5.5, R = 0.5, cl = T.cyl(R + 0.12, R + 0.12, Lf, '--c4', { opacity: 0.12, cast: false }); cl.rotation.z = Math.PI / 2; cl.position.x = Lf / 2;
   const co = T.cyl(R, R, Lf, '--water', { opacity: 0.25, cast: false }); co.rotation.z = Math.PI / 2; co.position.x = Lf / 2;
   T.label('แกน n₁ = ' + fmt(p.n1), '--ink', { pos: [Lf / 2, R + 0.45, 0] }); T.label('เปลือก n₂ = ' + fmt(p.n2), '--c4', { pos: [Lf / 2, -R - 0.4, 0] });
   const a = p.a * RAD, seg = (A, B, c, op) => T.vec(c, null, { kind: 'v', r: 0.02, line: false, opacity: op }).set(A, [B[0] - A[0], B[1] - A[1], 0]);
   seg([-1.2 * Math.cos(a), 1.2 * Math.sin(a), 0], [0, 0, 0], '--ray');
   const b = o._b, dx = Math.cos(b), dy = -Math.sin(b); let P = [0, 0], d = [dx, dy], n = 0, lost = false;
   while (P[0] < Lf && n < 40) { const tt = d[1] > 1e-9 ? (R - P[1]) / d[1] : d[1] < -1e-9 ? (-R - P[1]) / d[1] : (Lf - P[0]) / d[0], Q = [P[0] + d[0] * tt, P[1] + d[1] * tt]; if (Q[0] > Lf) { const u = (Lf - P[0]) / d[0]; seg([P[0], P[1], 0], [Lf, P[1] + d[1] * u, 0], '--ray'); break; }
    seg([P[0], P[1], 0], [Q[0], Q[1], 0], '--ray'); if (!o._g) { seg([Q[0], Q[1], 0], [Q[0] + 0.5 * d[0], Q[1] + Math.sign(d[1]) * 0.5, 0], '--bad', 0.7); lost = true; break; } P = Q; d = [d[0], -d[1]]; n++; }
   T.label(o.st, o._g ? '--good' : '--bad', { pos: [Lf / 2, R + 0.9, 0] });
   return {};
  }
 },
 notes:['n₁ − n₂ ยิ่งมาก มุมรับยิ่งกว้าง (NA มาก) รับแสงได้มากแต่แสงหลายเส้นทางทำให้สัญญาณกระจายตัวเร็วขึ้น','α เกิน α<sub>max</sub> → มุมตกกระทบที่ผนังน้อยกว่ามุมวิกฤต แสงบางส่วนทะลุไปเปลือกและหายไป','α = 0° แสงวิ่งตรงตามแกน ไม่มีการสะท้อน','สายเคเบิลใยแก้วอินเทอร์เน็ตและกล้องส่องภายในร่างกาย (เอ็นโดสโคป) ใช้หลักการนี้']
});



Lab.add('general', CASES, { group: 'แสง', foot: 'ใช้เลนส์บางและกระจกโค้งแบบรังสีใกล้แกน ระยะวัดเป็นเซนติเมตร ข้อตกลงเครื่องหมาย: ภาพจริง s′ เป็นบวก ภาพเสมือน s′ เป็นลบ f ของเลนส์นูนและกระจกเว้าเป็นบวก ส่วนเลนส์เว้าและกระจกนูนเป็นลบ เส้นประคือรังสีที่ลากต่อ ไม่ใช่แสงจริง' });
})();
