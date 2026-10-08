/* หัวข้อ: กลศาสตร์ของไหล — ท่อเวนทูรี เบอร์นูลลี ความดัน ทอร์ริเซลลี แรงลอยตัว ไฮดรอลิก สโตกส์ */
(function () {
'use strict';
const { fmt, clamp, RAD, DEG, T, L, PL, ARW, DOT, midArrow } = Lab.h;
const CASES = [];
const G = 9.8, PATM = 101.3;
const arrowSvg = (x1, y1, x2, y2, c = '--accent', w = 2.5) => ARW(x1, y1, x2, y2, c, w);
const water = 'style="fill:var(--water-soft);stroke:var(--water);stroke-width:1.5"';
const solid = 'style="fill:none;stroke:var(--ink);stroke-width:2"';

// ---------- 1 เวนทูรี ----------
CASES.push({
 name:'ท่อเวนทูรี',title:'ท่อเปลี่ยนพื้นที่หน้าตัด (แนวระดับ)',
 desc:'ของไหลไหลผ่านท่อกว้างแล้วบีบแคบ หลอดวัดความดันต่อขึ้นด้านบนที่แต่ละตำแหน่ง ระดับของเหลวในหลอดบอกความดัน',
 formula:'A₁v₁ = A₂v₂ &nbsp;|&nbsp; P₁ + ½ρv₁² = P₂ + ½ρv₂² &nbsp;|&nbsp; P = ρgh',
 params:[
  {id:'A1',label:'พื้นที่หน้าตัดท่อ 1 (A₁)',unit:'cm²',min:20,max:100,step:1,def:60},
  {id:'A2',label:'พื้นที่หน้าตัดท่อ 2 (A₂)',unit:'cm²',min:10,max:100,step:1,def:20},
  {id:'v1',label:'ความเร็วที่ท่อ 1 (v₁)',unit:'m/s',min:0.5,max:6,step:0.1,def:2},
  {id:'P1',label:'ความดันเกจที่ท่อ 1 (P₁)',unit:'kPa',min:20,max:200,step:1,def:100},
  {id:'rho',label:'ความหนาแน่นของไหล (ρ)',unit:'kg/m³',min:800,max:1300,step:10,def:1000}],
 outs:[
  {id:'v2',name:'ความเร็วที่ท่อ 2 (v₂)',unit:'m/s'},
  {id:'P2',name:'ความดันเกจที่ท่อ 2 (P₂)',unit:'kPa'},
  {id:'h1',name:'ระดับในหลอด 1 (h₁)',unit:'m'},
  {id:'h2',name:'ระดับในหลอด 2 (h₂)',unit:'m'},
  {id:'dh',name:'ผลต่างระดับ (h₁−h₂)',unit:'m'},
  {id:'Q',name:'อัตราการไหล (Q)',unit:'L/s'}],
 compute(p){const v2=p.v1*p.A1/p.A2,P2=p.P1+0.5*p.rho*(p.v1**2-v2**2)/1000,h1=p.P1*1000/(p.rho*G),h2=P2*1000/(p.rho*G);
  return{v2,P2,h1,h2,dh:h1-h2,Q:p.A1*1e-4*p.v1*1000}},
 check(p,o){return o.P2+PATM<0?['ความดันสัมบูรณ์ที่ท่อ 2 ติดลบ ในความจริงจะเกิดฟองไอ (คาวิเทชัน) ค่านี้ใช้ไม่ได้ ลองลด v₁ หรือเพิ่ม A₂']:[]},
 draw(p,o){const cy=190,k=7,d1=k*Math.sqrt(p.A1),d2=k*Math.sqrt(p.A2),t1=cy-d1/2,t2=cy-d2/2,b1=cy+d1/2,b2=cy+d2/2;
  const top=[[20,t1],[130,t1],[190,t2],[270,t2],[330,t1],[380,t1]],bot=[[380,b1],[330,b1],[270,b2],[190,b2],[130,b1],[20,b1]];
  const pts=top.concat(bot).map(q=>q.join(',')).join(' ');
  const tube=(x,yt,h)=>{const px=clamp(h/25*125,0,yt-28);return `<rect x="${x-5}" y="${yt-px}" width="10" height="${px+1}" style="fill:var(--water);opacity:.85"/><line x1="${x-5}" y1="22" x2="${x-5}" y2="${yt}" style="stroke:var(--ink);stroke-width:1.5"/><line x1="${x+5}" y1="22" x2="${x+5}" y2="${yt}" style="stroke:var(--ink);stroke-width:1.5"/>`+T(x,15,'h='+fmt(h)+' m',{fs:10})};
  return `<polygon points="${pts}" ${water}/><line x1="20" y1="${cy}" x2="380" y2="${cy}" style="stroke:var(--water);stroke-width:1;stroke-dasharray:4 4"/>`+
  tube(75,t1,o.h1)+tube(230,t2,o.h2)+arrowSvg(30,cy,70+0,cy,'--up',2)+arrowSvg(200,cy,250,cy,'--up',2+Math.min(3,o.v2/3))+
  T(75,cy+d1/2+18,'A₁ '+fmt(p.A1)+' cm²')+T(230,cy+d2/2+18,'A₂ '+fmt(p.A2)+' cm²')+
  T(75,cy+d1/2+33,'v₁ '+fmt(p.v1)+' m/s  P₁ '+fmt(p.P1)+' kPa',{c:'--muted',fs:10})+T(230,cy+d2/2+33,'v₂ '+fmt(o.v2)+' m/s  P₂ '+fmt(o.P2)+' kPa',{c:'--muted',fs:10})},
 notes:['พื้นที่ A ลด → ความเร็ว v เพิ่ม (สมการต่อเนื่อง ปริมาตรที่ไหลต่อวินาทีเท่าเดิม)','v เพิ่ม → ความดัน P ลด (เบอร์นูลลี ท่อแนวระดับ) → ระดับ h ในหลอดลด เพราะ P = ρgh','ท่อแคบที่สุด v สูงสุด P ต่ำสุด h ต่ำสุด ตรงกับข้อ 4 ในโจทย์','ตั้ง A₂ มากกว่า A₁ จะเห็นทิศทางกลับกันทั้งหมด']
});

// ---------- 2 เบอร์นูลลี ท่อต่างระดับ ----------
CASES.push({
 name:'ท่อต่างระดับ',title:'เบอร์นูลลีเมื่อท่อสูงต่ำต่างกัน',
 desc:'จุด 2 อยู่สูงหรือต่ำกว่าจุด 1 และพื้นที่หน้าตัดต่างกัน ดูว่าความดันเปลี่ยนเพราะความเร็วหรือเพราะความสูง',
 formula:'P₁ + ½ρv₁² + ρgz₁ = P₂ + ½ρv₂² + ρgz₂ &nbsp;|&nbsp; A₁v₁ = A₂v₂',
 params:[
  {id:'v1',label:'ความเร็วที่จุด 1 (v₁)',unit:'m/s',min:0.5,max:6,step:0.1,def:2},
  {id:'A1',label:'พื้นที่ที่จุด 1 (A₁)',unit:'cm²',min:20,max:100,step:1,def:60},
  {id:'A2',label:'พื้นที่ที่จุด 2 (A₂)',unit:'cm²',min:10,max:100,step:1,def:30},
  {id:'z2',label:'ความสูงจุด 2 เหนือจุด 1 (z₂)',unit:'m',min:-5,max:5,step:0.1,def:2},
  {id:'P1',label:'ความดันเกจที่จุด 1 (P₁)',unit:'kPa',min:50,max:300,step:1,def:200},
  {id:'rho',label:'ความหนาแน่นของไหล (ρ)',unit:'kg/m³',min:800,max:1300,step:10,def:1000}],
 outs:[
  {id:'v2',name:'ความเร็วที่จุด 2 (v₂)',unit:'m/s'},
  {id:'P2',name:'ความดันเกจที่จุด 2 (P₂)',unit:'kPa'},
  {id:'dP',name:'P₂ − P₁',unit:'kPa'},
  {id:'dPv',name:'ส่วนจากความเร็ว',unit:'kPa'},
  {id:'dPz',name:'ส่วนจากความสูง',unit:'kPa'}],
 compute(p){const v2=p.v1*p.A1/p.A2,dPv=0.5*p.rho*(p.v1**2-v2**2)/1000,dPz=-p.rho*G*p.z2/1000;return{v2,P2:p.P1+dPv+dPz,dP:dPv+dPz,dPv,dPz}},
 check(p,o){return o.P2+PATM<0?['ความดันสัมบูรณ์ที่จุด 2 ติดลบ ค่านี้เกิดขึ้นจริงไม่ได้ ลองลดความสูง z₂']:[]},
 draw(p,o){const y1=170,y2=y1-p.z2*13,d1=4*Math.sqrt(p.A1),d2=4*Math.sqrt(p.A2);
  const top=[[25,y1-d1/2],[125,y1-d1/2],[275,y2-d2/2],[375,y2-d2/2]],bot=[[375,y2+d2/2],[275,y2+d2/2],[125,y1+d1/2],[25,y1+d1/2]];
  const pts=top.concat(bot).map(q=>q.join(',')).join(' ');
  const gauge=(x,y,P,l)=>`<circle cx="${x}" cy="${y}" r="3.5" style="fill:var(--ink)"/>`+T(x,y-d1/2-10,l+' '+fmt(P)+' kPa',{fs:10});
  return `<line x1="10" y1="${y1}" x2="390" y2="${y1}" style="stroke:var(--muted);stroke-dasharray:3 4"/>`+T(14,y1-4,'ระดับจุด 1',{a:'start',c:'--muted',fs:9})+
   `<polygon points="${pts}" ${water}/>`+arrowSvg(40,y1,90,y1,'--up',2)+arrowSvg(300,y2,350,y2,'--up',2+Math.min(3,o.v2/3))+
   gauge(75,y1,p.P1,'P₁')+gauge(325,y2,o.P2,'P₂')+
   (Math.abs(p.z2)>0.05?arrowSvg(200,y1,200,y2,'--accent',1.5)+T(212,(y1+y2)/2+4,'z₂='+fmt(p.z2)+' m',{a:'start',fs:10}):'')+
   T(75,y1+d1/2+18,'v₁ '+fmt(p.v1)+' m/s',{fs:10,c:'--muted'})+T(325,y2+d2/2+18,'v₂ '+fmt(o.v2)+' m/s',{fs:10,c:'--muted'})},
 notes:['ความดันเปลี่ยนจาก 2 สาเหตุ: ความเร็วเปลี่ยน (A เปลี่ยน) และความสูงเปลี่ยน สองส่วนนี้แยกให้ดูในช่อง "ส่วนจาก…"','จุด 2 สูงขึ้น → P₂ ลด เพราะต้องยกของไหลขึ้น','A₂ เล็กลง → v₂ เพิ่ม → P₂ ลด','ท่อเดียวกัน ถ้า v ไม่เปลี่ยน (A₁ = A₂) ความดันเปลี่ยนตามความสูงเท่านั้น']
});

// ---------- 3 ความดันของเหลวนิ่ง ----------
CASES.push({
 name:'ความดันในของเหลว',title:'ความดันที่ความลึกต่างๆ ของของเหลวนิ่ง',
 desc:'วางแผ่นเล็กไว้ใต้ผิวของเหลว ยิ่งลึกยิ่งดันแรง ความดันขึ้นกับความลึก ความหนาแน่น และความโน้มถ่วง ไม่ขึ้นกับรูปร่างภาชนะ',
 formula:'P = P₀ + ρgh &nbsp;|&nbsp; P<sub>สัมบูรณ์</sub> = P<sub>เกจ</sub> + 101.3 kPa &nbsp;|&nbsp; F = PA',
 params:[
  {id:'h',label:'ความลึกของแผ่น (h)',unit:'m',min:0,max:30,step:0.1,def:10},
  {id:'rho',label:'ความหนาแน่นของเหลว (ρ)',unit:'kg/m³',min:700,max:13600,step:100,def:1000},
  {id:'g',label:'ความโน้มถ่วง (g)',unit:'m/s²',min:1.6,max:24.8,step:0.1,def:9.8},
  {id:'P0',label:'ความดันเกจที่ผิว (P₀)',unit:'kPa',min:0,max:200,step:1,def:0},
  {id:'A',label:'พื้นที่แผ่น (A)',unit:'cm²',min:1,max:100,step:1,def:10}],
 outs:[
  {id:'dP',name:'ความดันจากของเหลว (ρgh)',unit:'kPa'},
  {id:'Pg',name:'ความดันเกจรวม',unit:'kPa'},
  {id:'Pa',name:'ความดันสัมบูรณ์',unit:'kPa'},
  {id:'F',name:'แรงดันบนแผ่น (F)',unit:'N'}],
 compute(p){const dP=p.rho*p.g*p.h/1000,Pg=p.P0+dP;return{dP,Pg,Pa:Pg+PATM,F:Pg*1000*p.A*1e-4}},
 draw(p,o){const sy=40,py=sy+p.h/30*185,len=8+52*Math.min(1,o.Pg/600);
  return `<rect x="70" y="${sy}" width="190" height="205" ${water}/><line x1="70" y1="${sy}" x2="260" y2="${sy}" style="stroke:var(--water);stroke-width:3"/>`+
  `<path d="M70 20 V245 H260 V20" ${solid}/>`+(p.P0>0?arrowSvg(165,8,165,sy-2,'--up',2)+T(175,18,'P₀ '+fmt(p.P0)+' kPa',{a:'start',fs:10}):'')+
  `<rect x="150" y="${py-5}" width="30" height="10" style="fill:var(--ink)"/>`+
  arrowSvg(165,py-5-len,165,py-6,'--accent')+arrowSvg(165-18-len,py,150-1,py,'--accent')+arrowSvg(165+18+len,py,181,py,'--accent')+
  `<line x1="280" y1="${sy}" x2="280" y2="${py}" style="stroke:var(--muted);stroke-width:1.5"/>`+T(290,(sy+py)/2+4,'h = '+fmt(p.h)+' m',{a:'start',fs:11})+
  T(330,Math.min(230,py+30),'P = '+fmt(o.Pg),{fs:11,b:1})+T(330,Math.min(244,py+44),'kPa',{fs:10,c:'--muted'})},
 notes:['ลึกขึ้น (h↑) → P↑ เป็นสัดส่วนตรง','ของเหลวหนาแน่นกว่า (ρ↑ เช่นปรอท) → P↑ ที่ความลึกเท่ากัน','บนดวงจันทร์ (g=1.6) ความดันที่ความลึกเท่ากันต่ำกว่าบนโลกมาก','พื้นที่แผ่น A ไม่เปลี่ยนความดัน แต่เปลี่ยนแรง (F = PA)','ความดันที่ความลึกเท่ากันในของเหลวเดียวกันเท่ากันทุกทิศทาง']
});

// ---------- 4 ทอร์ริเซลลี ----------
CASES.push({
 name:'น้ำพุ่งจากถัง',title:'น้ำพุ่งออกจากรูข้างถัง (ทอร์ริเซลลี)',
 desc:'เจาะรูที่ข้างถังน้ำ ความเร็วที่พุ่งออกขึ้นกับความลึกของรูใต้ผิวน้ำ ระยะตกขึ้นกับทั้งความลึกของรูและความสูงของรูจากพื้น',
 formula:'v = √(2g·d) &nbsp;|&nbsp; x = v·t = 2√(d·y) &nbsp;|&nbsp; t = √(2y/g) &nbsp;|&nbsp; Q = a·v',
 params:[
  {id:'H',label:'ความสูงน้ำในถัง (H)',unit:'m',min:0.5,max:5,step:0.1,def:3},
  {id:'y',label:'ความสูงของรูจากพื้น (y)',unit:'m',min:0,max:4.9,step:0.05,def:1},
  {id:'g',label:'ความโน้มถ่วง (g)',unit:'m/s²',min:1.6,max:24.8,step:0.1,def:9.8},
  {id:'a',label:'พื้นที่รู (a)',unit:'cm²',min:0.5,max:10,step:0.5,def:2}],
 outs:[
  {id:'d',name:'ความลึกของรูใต้ผิว (d)',unit:'m'},
  {id:'v',name:'ความเร็วน้ำพุ่งออก (v)',unit:'m/s'},
  {id:'t',name:'เวลาที่ตกถึงพื้น (t)',unit:'s'},
  {id:'x',name:'ระยะตกในแนวระดับ (x)',unit:'m'},
  {id:'Q',name:'อัตราการไหล (Q)',unit:'L/s'}],
 compute(p){const y=Math.min(p.y,p.H*0.95),d=p.H-y,v=Math.sqrt(2*p.g*d),t=Math.sqrt(2*y/p.g);return{d,v,t,x:v*t,Q:p.a*1e-4*v*1000,_y:y}},
 check(p,o){const w=[];if(p.y>p.H*0.95)w.push('รูอยู่เหนือผิวน้ำ จึงจำกัดตำแหน่งรูไว้ที่ใต้ผิวน้ำเล็กน้อย');if(o.x>0&&Math.abs(o._y-p.H/2)<0.06*p.H)w.push('รูอยู่ราวกึ่งกลางความสูงน้ำ ระยะตกใกล้ค่าสูงสุดสำหรับ H นี้ (x = H)');return w},
 draw(p,o){const s=36,gy=235,wl=gy-p.H*s,hy=gy-o._y*s;let pts=[];
  for(let k=0;k<=60;k++){const t=k*o.t/60;if(!(o.t>0))break;pts.push([110+o.v*t*s,hy+0.5*p.g*t*t*s].join(','))}
  return `<line x1="10" y1="${gy}" x2="395" y2="${gy}" style="stroke:var(--ink);stroke-width:2"/>`+
  `<rect x="40" y="${wl}" width="70" height="${gy-wl}" ${water}/><path d="M40 ${gy-5*s-10} V${gy} H110 V${gy-5*s-10}" ${solid}/>`+
  `<rect x="107" y="${hy-3}" width="6" height="6" style="fill:var(--bg)"/>`+
  (pts.length?`<polyline points="${pts.join(' ')}" style="fill:none;stroke:var(--water);stroke-width:3"/>`:'')+
  `<line x1="125" y1="${wl}" x2="125" y2="${hy}" style="stroke:var(--muted)"/>`+T(130,(wl+hy)/2+4,'d '+fmt(o.d)+' m',{a:'start',fs:10})+
  (o._y>0.05?`<line x1="28" y1="${hy}" x2="28" y2="${gy}" style="stroke:var(--muted)"/>`+T(26,(hy+gy)/2+4,'y '+fmt(o._y),{a:'end',fs:10}):'')+
  (o.x>0.05?`<line x1="110" y1="${gy+12}" x2="${110+o.x*s}" y2="${gy+12}" style="stroke:var(--accent);stroke-width:2"/>`+T(110+o.x*s/2,gy+26,'x = '+fmt(o.x)+' m',{fs:11,b:1}):'')},
 notes:['รูลึกขึ้น (d↑) → v↑ แต่ถ้าเลื่อนรูลงใกล้พื้นเพื่อให้ลึกขึ้น เวลาตกจะสั้นลง','ระยะตก x = 2√(d·y) สูงสุดเมื่อ y = H/2 (รูอยู่กึ่งกลาง) และรูที่ห่างจากกึ่งกลางเท่ากันทั้งบนและล่างได้ระยะตกเท่ากัน','g เปลี่ยน v และ t เปลี่ยน แต่ระยะตก x ไม่เปลี่ยน','รูใหญ่ขึ้น (a↑) เพิ่มอัตราไหล Q แต่ไม่เปลี่ยน v']
});

// ---------- 5 แรงลอยตัว ----------
CASES.push({
 name:'แรงลอยตัว',title:'วัตถุลอยหรือจมในของเหลว',
 desc:'เปรียบเทียบน้ำหนักวัตถุกับแรงลอยตัว ถ้าวัตถุเบากว่าของเหลวจะลอยโดยจมบางส่วน ถ้าหนักกว่าจะจมและมีน้ำหนักปรากฏลดลง',
 formula:'W = ρ<sub>วัตถุ</sub>Vg &nbsp;|&nbsp; B = ρ<sub>ของเหลว</sub>V<sub>จม</sub>g &nbsp;|&nbsp; ลอย: B = W &nbsp;|&nbsp; จม: W<sub>ปรากฏ</sub> = W − B',
 params:[
  {id:'ro',label:'ความหนาแน่นวัตถุ (ρ₀)',unit:'kg/m³',min:200,max:8000,step:10,def:700},
  {id:'rf',label:'ความหนาแน่นของเหลว (ρf)',unit:'kg/m³',min:600,max:13600,step:100,def:1000},
  {id:'V',label:'ปริมาตรวัตถุ (V)',unit:'L',min:1,max:20,step:0.5,def:5},
  {id:'g',label:'ความโน้มถ่วง (g)',unit:'m/s²',min:1.6,max:24.8,step:0.1,def:9.8}],
 outs:[
  {id:'W',name:'น้ำหนักวัตถุ (W)',unit:'N'},
  {id:'Bmax',name:'แรงลอยตัวสูงสุด (จมมิด)',unit:'N'},
  {id:'B',name:'แรงลอยตัวจริง (B)',unit:'N'},
  {id:'f',name:'สัดส่วนที่จมใต้ผิว',unit:'%'},
  {id:'Wa',name:'น้ำหนักปรากฏ (W − B)',unit:'N'}],
 compute(p){const V=p.V/1000,W=p.ro*V*p.g,Bmax=p.rf*V*p.g,B=Math.min(W,Bmax),f=Math.min(1,p.ro/p.rf)*100;return{W,Bmax,B,f,Wa:W-B}},
 check(p,o){return [p.ro<p.rf?'ลอย: วัตถุเบากว่าของเหลว B = W จมประมาณ '+fmt(o.f)+'%':(p.ro===p.rf?'ลอยปริ่มพอดี: ความหนาแน่นเท่ากัน':'จม: วัตถุหนักกว่าของเหลว B < W แรงที่พื้นรับ = W − B ≈ '+fmt(o.Wa)+' N')]},
 draw(p,o){const s=24*Math.cbrt(p.V),sy=105,by=235,f=o.f/100,sink=p.ro>p.rf;const top=sink?by-s:sy-s*(1-f);const cx=200,sc=L=>8+62*Math.min(1,L/700);
  return `<rect x="60" y="${sy}" width="280" height="${by-sy}" ${water}/><path d="M60 40 V${by} H340 V40" ${solid}/><line x1="60" y1="${sy}" x2="340" y2="${sy}" style="stroke:var(--water);stroke-width:3"/>`+
  `<rect x="${cx-s/2}" y="${top}" width="${s}" height="${s}" style="fill:var(--muted);stroke:var(--ink);stroke-width:2"/>`+
  arrowSvg(cx,top+s/2,cx,top+s/2+sc(o.W),'--up',3)+T(cx+12,top+s/2+sc(o.W),'W '+fmt(o.W)+' N',{a:'start',fs:10})+
  arrowSvg(cx,top+s/2,cx,top+s/2-sc(o.B),'--accent',3)+T(cx+12,top+s/2-sc(o.B)+8,'B '+fmt(o.B)+' N',{a:'start',fs:10})},
 notes:['ρ วัตถุ ↑ → น้ำหนัก W↑ และสัดส่วนที่จมมากขึ้น แต่แรงลอยตัวขณะลอยยังเท่ากับ W','ของเหลวหนาแน่นขึ้น (ρf↑) → วัตถุที่ลอยจมน้อยลง วัตถุที่จมมีน้ำหนักปรากฏลดลง','ขณะลอย B = W เสมอ ไม่ว่าของเหลวจะเป็นอะไร','ปริมาตร V เพิ่ม → ทั้ง W และ B เพิ่ม แต่สัดส่วนที่จมไม่เปลี่ยน']
});

// ---------- 6 ไฮดรอลิก ----------
CASES.push({
 name:'แม่แรงไฮดรอลิก',title:'หลักของปาสคาล (แม่แรงไฮดรอลิก)',
 desc:'ออกแรงเล็กที่ลูกสูบเล็ก ได้แรงใหญ่ที่ลูกสูบใหญ่ ความดันในของเหลวเท่ากันทุกจุด แต่ลูกสูบใหญ่ขยับน้อยกว่า',
 formula:'P = F₁/A₁ = F₂/A₂ &nbsp;|&nbsp; A₁d₁ = A₂d₂ &nbsp;|&nbsp; งาน F₁d₁ = F₂d₂',
 params:[
  {id:'F1',label:'แรงที่ลูกสูบเล็ก (F₁)',unit:'N',min:10,max:500,step:5,def:100},
  {id:'A1',label:'พื้นที่ลูกสูบเล็ก (A₁)',unit:'cm²',min:2,max:50,step:1,def:10},
  {id:'A2',label:'พื้นที่ลูกสูบใหญ่ (A₂)',unit:'cm²',min:20,max:500,step:5,def:200},
  {id:'d1',label:'ระยะกดลูกสูบเล็ก (d₁)',unit:'cm',min:1,max:20,step:0.5,def:10}],
 outs:[
  {id:'P',name:'ความดันในของเหลว (P)',unit:'kPa'},
  {id:'F2',name:'แรงที่ลูกสูบใหญ่ (F₂)',unit:'N'},
  {id:'MA',name:'อัตราทดแรง (F₂/F₁)',unit:'เท่า'},
  {id:'d2',name:'ระยะยกลูกสูบใหญ่ (d₂)',unit:'cm'},
  {id:'Wk',name:'งาน (ใส่เข้า = ได้ออก)',unit:'J'}],
 compute(p){const P=p.F1/(p.A1*1e-4)/1000,F2=P*1000*p.A2*1e-4;return{P,F2,MA:p.A2/p.A1,d2:p.d1*p.A1/p.A2,Wk:p.F1*p.d1/100}},
 draw(p,o){const w1=clamp(6.5*Math.sqrt(p.A1),14,60),w2=clamp(6.5*Math.sqrt(p.A2),30,150),x1=85,x2=280,base=205,ph=18;
  const dd1=clamp(p.d1*3,3,60),dd2=clamp(o.d2*3,1,60);const y1=95+dd1,y2=95-dd2;
  return `<path d="M${x1-w1/2} 60 V${base} H${x2-w2/2} V60 M${x1+w1/2} 60 V${base-40} H${x2+w2/2-w2} " style="fill:none"/>`+
  `<rect x="${x1-w1/2}" y="${y1}" width="${w1}" height="${base-y1}" ${water}/><rect x="${x1+w1/2}" y="${base-35}" width="${x2-w2/2-x1-w1/2}" height="35" ${water}/><rect x="${x2-w2/2}" y="${y2}" width="${w2}" height="${base-y2}" ${water}/>`+
  `<path d="M${x1-w1/2} 50 V${base+10} H${x2+w2/2} V50 M${x1+w1/2} 50 V${base-35} H${x2-w2/2} V50" ${solid}/>`+
  `<rect x="${x1-w1/2}" y="${y1-ph}" width="${w1}" height="${ph}" style="fill:var(--muted);stroke:var(--ink);stroke-width:2"/><rect x="${x2-w2/2}" y="${y2-ph}" width="${w2}" height="${ph}" style="fill:var(--muted);stroke:var(--ink);stroke-width:2"/>`+
  arrowSvg(x1,y1-ph-clamp(p.F1/500*55,10,55)-4,x1,y1-ph-3,'--up',3)+T(x1,y1-ph-clamp(p.F1/500*55,10,55)-10,'F₁ '+fmt(p.F1)+' N',{fs:10})+
  arrowSvg(x2,y2-ph-4,x2,Math.max(30,y2-ph-4-clamp(Math.log10(o.F2+1)*14,10,55)),'--accent',3)+T(x2,22,'F₂ '+fmt(o.F2)+' N',{fs:10})+
  T(x1,base+28,'A₁ '+fmt(p.A1)+' cm²  ลง '+fmt(p.d1)+' cm',{fs:10,c:'--muted'})+T(x2,base+28,'A₂ '+fmt(p.A2)+' cm²  ขึ้น '+fmt(o.d2)+' cm',{fs:10,c:'--muted'})},
 notes:['A₂/A₁ ↑ → F₂ ↑ แต่ระยะยก d₂ ↓ (ได้แรงเพิ่ม เสียระยะ)','ความดัน P ขึ้นกับ F₁ และ A₁ เท่านั้น A₂ ไม่ทำให้ P เปลี่ยน','งานที่ใส่ F₁d₁ เท่ากับงานที่ได้ F₂d₂ เสมอ (ไม่คิดการสูญเสีย) แม่แรงทดแรงได้ ทดงานไม่ได้','ภาพวาดเน้นสัดส่วนคร่าวๆ ตัวเลขด้านล่างคือค่าที่คำนวณจริง']
});

// ---------- 7 สโตกส์ ----------
CASES.push({
 name:'ตกในของหนืด',title:'ทรงกลมตกในของไหลหนืด (กฎของสโตกส์)',
 desc:'ทรงกลมเล็กตกในของไหลหนืด แรงต้านโตตามความเร็วจนสมดุลกับน้ำหนักลบแรงลอยตัว จึงตกด้วยความเร็วคงที่เรียกว่าความเร็วปลาย',
 formula:'F<sub>ต้าน</sub> = 6πηrv &nbsp;|&nbsp; สมดุล: W = B + F<sub>ต้าน</sub> &nbsp;|&nbsp; v<sub>t</sub> = 2r²(ρs − ρf)g / 9η',
 params:[
  {id:'r',label:'รัศมีทรงกลม (r)',unit:'mm',min:0.1,max:5,step:0.1,def:1},
  {id:'rs',label:'ความหนาแน่นทรงกลม (ρs)',unit:'kg/m³',min:1000,max:8000,step:100,def:2700},
  {id:'rf',label:'ความหนาแน่นของไหล (ρf)',unit:'kg/m³',min:700,max:1500,step:10,def:1260},
  {id:'eta',label:'ความหนืด (η)',unit:'Pa·s',min:0.01,max:2,step:0.01,def:1}],
 outs:[
  {id:'vt',name:'ความเร็วปลาย (v<sub>t</sub>)',unit:'mm/s'},
  {id:'W',name:'น้ำหนัก (W)',unit:'µN'},
  {id:'B',name:'แรงลอยตัว (B)',unit:'µN'},
  {id:'Fd',name:'แรงต้าน ณ ความเร็วปลาย',unit:'µN'},
  {id:'Re',name:'เลขเรย์โนลดส์ (Re)',unit:''}],
 compute(p){const r=p.r/1000,V=4/3*Math.PI*r**3,W=p.rs*V*G,B=p.rf*V*G,vt=2*r*r*(p.rs-p.rf)*G/(9*p.eta);
  return{vt:vt*1000,W:W*1e6,B:B*1e6,Fd:(W-B)*1e6,Re:p.rf*Math.abs(vt)*2*r/p.eta}},
 check(p,o){const w=[];if(p.rs<=p.rf)w.push('ทรงกลมเบากว่าของไหล จะลอยขึ้นแทนที่จะตก (ค่าความเร็วปลายติดลบ หมายถึงลอยขึ้น)');if(o.Re>1)w.push('Re > 1 กฎของสโตกส์ใช้ได้ดีเมื่อ Re น้อยกว่า 1 ค่านี้ประมาณการสูงเกินจริง');return w},
 draw(p,o){const R=clamp(p.r*7,6,36),cx=200,cy=120,mx=Math.max(o.W,o.B,1e-9),sc=L=>6+56*Math.abs(L)/mx;
  return `<rect x="140" y="20" width="120" height="225" ${water}/><path d="M140 20 V245 H260 V20" ${solid}/>`+
  `<circle cx="${cx}" cy="${cy}" r="${R}" style="fill:var(--muted);stroke:var(--ink);stroke-width:2"/>`+
  arrowSvg(cx-R*0.5,cy,cx-R*0.5,cy+sc(o.W),'--up',3)+T(cx-R*0.5-8,cy+sc(o.W)+4,'W',{a:'end',fs:11,b:1})+
  arrowSvg(cx+R*0.5,cy,cx+R*0.5,cy-sc(o.B),'--accent',3)+T(cx+R*0.5+8,cy-sc(o.B)+4,'B',{a:'start',fs:11,b:1})+
  (o.Fd>0?arrowSvg(cx,cy+R,cx,cy+R-sc(o.Fd),'--accent',3)+T(cx+8,cy+R-sc(o.Fd)/2+14,'F ต้าน',{a:'start',fs:10}):'')+
  T(300,200,'v = '+fmt(o.vt)+' mm/s',{a:'start',fs:11,b:1})+arrowSvg(290,60,290,60+clamp(o.vt/2,6,70),'--up',2)+T(300,75,'ทิศการตก',{a:'start',fs:10,c:'--muted'})},
 notes:['ทรงกลมใหญ่ขึ้น (r↑) → vt เพิ่มเร็วมาก เพราะ vt ∝ r²','ความหนืดมากขึ้น (η↑) → vt ลด (ตกช้าลง)','ρs − ρf มากขึ้น → vt เพิ่ม ถ้า ρs = ρf ทรงกลมลอยนิ่ง vt = 0','ที่ความเร็วปลาย แรงต้าน = W − B จึงเปลี่ยนตามน้ำหนักและแรงลอยตัว ไม่ตามความหนืด ความหนืดเปลี่ยนเพียงความเร็วที่ต้องมีจึงสมดุล']
});


Lab.add('fluid', CASES.map(c => Object.assign({ box: [400, 260] }, c)), { group: 'สมการและความสัมพันธ์' });
})();
