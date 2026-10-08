/* ห้องทดลองฟิสิกส์ TPAT3 — แกนกลาง (v2)
 * โครง: บท (chapter) → แบบจำลอง (case)
 * แบบจำลองมี 2 ชนิด
 *   1) ภาพนิ่ง SVG:  case.draw(P,o) คืนสตริง SVG 640×300
 *   2) แอนิเมชัน:    case.sim = { view, init, step, draw, ... } วาดบน canvas 2D และ/หรือ case.three สำหรับ 3D
 * รายละเอียดทุกฟิลด์อยู่ใน README.md
 */
const Lab = (function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

  // ---------- ตัวเลข ----------
  const sci = (x, d = 2) => { const [m, e] = x.toExponential(d).split('e'); return m + '×10' + String(+e).split('').map(ch => SUP[ch] || ch).join(''); };
  const fmt = x => {
    if (typeof x === 'string') return x;
    if (x == null || !isFinite(x)) return '—';
    const a = Math.abs(x);
    if (a === 0) return '0';
    if (a >= 1e6 || a < 1e-3) return sci(x);
    if (a >= 1000) return x.toFixed(0);
    if (a >= 100) return x.toFixed(1);
    return x.toPrecision(3);
  };
  const cmp = (a, b) => {
    if (typeof a !== 'number' || typeof b !== 'number' || !isFinite(a) || !isFinite(b)) return null;
    const t = 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= t ? 0 : (a > b ? 1 : -1);
  };
  const AR = { 1: ['↑', 'up', 'เพิ่มขึ้น'], '-1': ['↓', 'down', 'ลดลง'], 0: ['–', 'flat', 'ไม่เปลี่ยน'] };
  const arrowHTML = d => d === null ? '' : `<span class="ar ${AR[d][1]}" aria-label="${AR[d][2]}">${AR[d][0]}</span>`;
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  // ---------- ตัวช่วยวาด SVG (แบบจำลองภาพนิ่ง) ----------
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 12}" text-anchor="${o.a || 'middle'}" style="fill:var(${o.c || '--ink'})" ${o.b ? 'font-weight="600"' : ''}>${s}</text>`;
  const L = (x1, y1, x2, y2, c = '--ink', w = 1.5, dash) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:var(${c});stroke-width:${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const PL = (pts, c = '--ray', w = 2, dash) => `<polyline points="${pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ')}" style="fill:none;stroke:var(${c});stroke-width:${w}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const ARW = (x1, y1, x2, y2, c = '--ink', w = 3, dash) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = Math.min(9, Math.hypot(x2 - x1, y2 - y1) * 0.6);
    const p = [[x2, y2], [x2 - h * Math.cos(a - .45), y2 - h * Math.sin(a - .45)], [x2 - h * Math.cos(a + .45), y2 - h * Math.sin(a + .45)]].map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
    return L(x1, y1, x2, y2, c, w, dash) + `<polygon points="${p}" style="fill:var(${c})"/>`;
  };
  const DOT = (x, y, c = '--ink', r = 3) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="fill:var(${c})"/>`;
  const midArrow = (pts, c) => {
    const [a, b] = pts, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = 7;
    const p = [[mx + h * Math.cos(ang), my + h * Math.sin(ang)], [mx - h * Math.cos(ang - .5), my - h * Math.sin(ang - .5)], [mx - h * Math.cos(ang + .5), my - h * Math.sin(ang + .5)]].map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
    return `<polygon points="${p}" style="fill:var(${c})"/>`;
  };

  // ---------- ทะเบียนบทและแบบจำลอง ----------
  const chapters = [];
  const chap = id => chapters.find(c => c.id === id);
  function chapter(def) { chapters.push(Object.assign({ cases: [] }, def)); }
  function add(id, cases, defaults) {
    const c = chap(id); if (!c) { console.warn('ไม่พบบท', id); return; }
    cases.forEach(cs => c.cases.push(Object.assign({}, defaults || {}, cs)));
  }
  // รองรับไฟล์แบบเก่า Lab.register({id, cases})
  function register(s) { if (chap(s.id)) add(s.id, s.cases); else chapter(s); }

  // ---------- สถานะ ----------
  let si = -1, ci = -1, cur = null, P = {}, REF_P = {}, REF_O = {}, O = {};
  let st = null, playing = false, speed = 1, view = '2d', acc = 0, nextSample = 0, dirty = true, drag = null, hover = null, handles = [];
  let G = null, GR = null, V3 = null, v3stale = true, lastLive = 0, lastGraph = 0;

  const isRange = q => !q.type && !q.opts;
  const outsOf = c => typeof c.outs === 'function' ? c.outs(P, O) : (c.outs || []);
  const decimals = s => { const t = String(s); return t.includes('.') ? t.split('.')[1].length : 0; };
  const snap = (q, v) => { if (q.vals) return v; v = clamp(v, q.min, q.max); if (q.step) v = +(Math.round(v / q.step) * q.step).toFixed(decimals(q.step)); return v; };
  const paramVal = (q, raw) => q.vals ? q.vals[+raw] : +raw;
  const sliderIdx = (q, v) => q.vals ? Math.max(0, q.vals.indexOf(v)) : v;
  const deepCopy = v => JSON.parse(JSON.stringify(v));

  function setHash() {
    const h = si === -2 ? '#start' : si < 0 ? '#home' : '#' + chapters[si].id + '.' + ci;
    try { history.replaceState(null, '', h); } catch (e) { /* ไม่เป็นไร */ }
  }

  // เลื่อนแถบแนวนอนให้เห็นปุ่มที่เลือก โดยไม่เลื่อนหน้าขึ้นลง
  const hscroll = (box, el) => { const l = el.offsetLeft - box.offsetLeft, r = l + el.offsetWidth; if (l < box.scrollLeft) box.scrollLeft = l - 20; else if (r > box.scrollLeft + box.clientWidth) box.scrollLeft = r - box.clientWidth + 20; };

  // ไอคอนเส้นเรียบ (svg) ของแต่ละบท กำหนดใน chapters.js ผ่าน Lab.icons
  const icon = (id, sz = 22) => { const d = (Lab.icons || {})[id]; return d ? `<svg class="ic" width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>` : ''; };
  const showPage = which => { $('#landing').hidden = which !== 'landing'; $('#homeGrid').hidden = which !== 'toc'; $('#lab').hidden = which !== 'lab'; $('#hdr').hidden = which === 'landing'; };
  const FEATURED = [['equil', 'คานแก้ไขได้', 'วางน้ำหนัก จุดรองรับ เชือก สปริง แล้วดูแรงทุกตัว'], ['newton', 'พื้นเอียง', 'ลากมุมและกล่องได้ ดูแรงเสียดทานสถิตกับจลน์'], ['proj', 'ยิงโพรเจกไทล์', 'เล็ง ย้ายเป้า เก็บรอยทางเทียบหลายนัด'], ['energy', 'รางเลื่อนแก้ไขได้', 'ปั้นรางเอง ดูพลังงานเปลี่ยนรูป'], ['elec', 'สนามและศักย์ไฟฟ้า', 'ลากประจุ ดูเส้นสนามและพื้นผิวศักย์ 3D'], ['env', 'แผงโซลาร์เซลล์', 'ดวงอาทิตย์เคลื่อนที่ทั้งวัน 3D']];
  function goLanding() {
    si = -2; ci = -1; cur = null; playing = false; showPage('landing');
    $('#foot').textContent = '';
    const nCase = chapters.reduce((a, c) => a + c.cases.length, 0), n3 = chapters.reduce((a, c) => a + c.cases.filter(x => x.three).length, 0);
    const find = (cid, nm) => { const c = chap(cid); const k = c ? c.cases.findIndex(x => x.name === nm) : -1; return k >= 0 ? `#${cid}.${k}` : `#${cid}.0`; };
    $('#landing').innerHTML = `<section class="hero"><p class="eyebrow">${icon('general', 18)} TPAT3 · ฟิสิกส์</p><h1>ห้องทดลองฟิสิกส์ TPAT3</h1>
      <p class="lead">แบบจำลองโต้ตอบครบทุกบทของ TPAT3 ปรับค่าตามโจทย์ ลากย้ายวัตถุ เพิ่มหรือลบชิ้นส่วน แล้วดูผลทันทีผ่านแอนิเมชัน กราฟ และภาพ 3D</p>
      <div class="cta"><a class="b1" href="#home">${icon('toc', 18)}ดูสารบัญทั้งหมด</a><button class="b2" id="rand">${icon('dice', 18)}สุ่มแบบจำลอง</button></div>
      <p class="stats"><b>${chapters.length}</b> บท · <b>${nCase}</b> แบบจำลอง · <b>${n3}</b> แบบมีมุมมอง 3D</p></section>
      <section><h2 class="sec">เลือกบท</h2><div class="chapgrid">${chapters.map(c => `<a class="cbtn" href="#${c.id}.0"><span class="icbox">${icon(c.id, 26)}</span><span class="t"><span class="no">บทที่ ${c.no}</span><span class="nm">${c.short || c.name}</span></span><span class="ct">${c.cases.length}</span></a>`).join('')}</div></section>
      <section><h2 class="sec">แนะนำให้ลอง</h2><div class="feat">${FEATURED.map(([cid, nm, d]) => `<a class="fcard" href="${find(cid, nm)}"><span class="icbox">${icon(cid, 22)}</span><span><b>${nm}</b><span class="d">${d}</span></span></a>`).join('')}</div></section>
      <section><h2 class="sec">ใช้งานอย่างไร</h2><div class="tips">
        <div>${icon('drag', 22)}<p><b>ลากวัตถุในภาพ</b>จุดวงกลมประคือสิ่งที่ลากได้ เช่น กล่อง น้ำหนัก เป้า ประจุ</p></div>
        <div>${icon('sliders', 22)}<p><b>ปรับค่าตามโจทย์</b>เลื่อนแถบหรือพิมพ์ตัวเลขในช่อง เพิ่มหรือลบชิ้นส่วนได้</p></div>
        <div>${icon('play', 22)}<p><b>เล่นแอนิเมชัน</b>กด ▶ หรือ Space ปรับความเร็วได้ ดูกราฟสดด้านล่าง</p></div>
        <div>${icon('cube', 22)}<p><b>ดูแบบ 3D</b>กดปุ่ม 3D ลากเพื่อหมุน ล้อเมาส์เพื่อซูม</p></div></div></section>
      <section class="creator"><span class="icbox">${icon('heart', 22)}</span><p>สร้างโดย <a href="https://www.instagram.com/base_happy19/" target="_blank" rel="noopener">IG: base_happy19</a><span class="d">ใช้สอนและทบทวนได้ฟรี แบบจำลองเป็นการคำนวณโดยประมาณเพื่อการเรียนรู้</span></p></section>`;
    $('#rand').onclick = () => { const all = []; chapters.forEach((c, i) => c.cases.forEach((x, k) => all.push([i, k]))); const [a, b] = all[Math.floor(Math.random() * all.length)]; go(a, b); };
    buildNav(); setHash(); window.scrollTo(0, 0);
  }

  // ---------- เมนูบท ----------
  function buildNav() {
    $('#subjects').innerHTML = `<button role="tab" aria-selected="${si === -2}" data-s="-2">${icon('start', 16)}หน้าแรก</button><button role="tab" aria-selected="${si === -1}" data-s="-1">${icon('toc', 16)}สารบัญ</button>` +
      chapters.map((c, i) => `<button role="tab" aria-selected="${i === si}" data-s="${i}" ${c.cases.length ? '' : 'class="empty"'}>${icon(c.id, 16)}<span class="no">${c.no}</span>${c.short || c.name}</button>`).join('');
    $('#subjects').onclick = e => { const b = e.target.closest('button'); if (b) { const k = +b.dataset.s; go(k, 0); } };
    const on = $('#subjects [aria-selected="true"]'); if (on) hscroll($('#subjects'), on);
  }
  function goHome() {
    si = -1; ci = -1; cur = null; playing = false; showPage('toc');
    $('#siteH1').textContent = 'สารบัญแบบจำลอง';
    $('#subjDesc').textContent = 'แบบจำลองโต้ตอบครบ 15 บทตามเนื้อหา TPAT3 ปรับค่าได้ละเอียด ลากย้ายวัตถุ เพิ่มหรือลบชิ้นส่วน ดูแอนิเมชันและกราฟสด ทั้ง 2D และ 3D';
    $('#foot').textContent = '';
    $('#homeGrid').innerHTML = chapters.map((c, i) => `<article class="chap"><a class="chap-h" href="#${c.id}.0" data-s="${i}"><span class="icbox">${icon(c.id, 24)}</span><span class="no">บทที่ ${c.no}</span><span class="nm">${c.name}</span><span class="ct">${c.cases.length} แบบจำลอง · ${c.blurb || ''}</span></a>` +
      `<div class="chips">${c.cases.map((cs, k) => `<a href="#${c.id}.${k}">${cs.name}${cs.three ? '<span class="d3">3D</span>' : ''}</a>`).join('')}</div></article>`).join('');
    buildNav(); setHash();
  }
  function selectSubject(i, j) {
    si = i; const s = chapters[i];
    showPage('lab');
    $('#siteH1').textContent = `บทที่ ${s.no} · ${s.name}`;
    $('#subjDesc').textContent = s.blurb || '';
    buildNav();
    if (!s.cases.length) { $('#tabs').innerHTML = ''; showPage('toc'); $('#homeGrid').innerHTML = '<p class="hint">บทนี้ยังไม่มีแบบจำลอง</p>'; return; }
    selectCase(clamp(j || 0, 0, s.cases.length - 1));
  }
  function buildCaseTabs() {
    let g = null;
    $('#tabs').innerHTML = chapters[si].cases.map((c, i) => {
      let pre = ''; if (c.group && c.group !== g) { g = c.group; pre = `<span class="tgroup">${esc(g)}</span>`; }
      return pre + `<button role="tab" aria-selected="${i === ci}" data-i="${i}">${c.name}${c.three ? '<span class="d3">3D</span>' : ''}</button>`;
    }).join('');
    $('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) selectCase(+b.dataset.i); };
    const on = $('#tabs [aria-selected="true"]'); if (on) hscroll($('#tabs'), on);
  }

  // ---------- ตัวควบคุม ----------
  function rangeCtl(q, id, val, label) {
    return `<div class="ctl" data-show="${esc(q.id)}"><label for="p_${id}"><span>${label}</span><span class="val"><input type="number" class="num" id="n_${id}" step="${q.vals ? 'any' : q.step}" value="${val}" aria-label="${esc(label)}"><span class="u hint">${q.unit || ''}</span><span id="a_${id}"></span></span></label>` +
      `<input type="range" id="p_${id}" min="${q.vals ? 0 : q.min}" max="${q.vals ? q.vals.length - 1 : q.max}" step="${q.vals ? 1 : q.step}" value="${sliderIdx(q, val)}"></div>`;
  }
  function optsCtl(q, id, val) {
    return `<div class="ctl" data-show="${esc(q.id)}"><label><span>${q.label}</span></label><div class="seg" id="seg_${id}" role="group" aria-label="${esc(q.label)}">${q.opts.map((o, k) => `<button data-k="${k}" aria-pressed="${o[0] === val}">${o[1]}</button>`).join('')}</div></div>`;
  }
  function listCtl(q) {
    const items = P[q.id] || [];
    return `<div class="ctl list" data-show="${esc(q.id)}"><div class="list-h"><span>${q.label}</span><span class="hint">${items.length}${q.max ? '/' + q.max : ''}</span></div>` +
      items.map((it, i) => `<div class="item"><div class="item-h"><b>${q.item || 'ชิ้นที่'} ${i + 1}</b>${(items.length > (q.min || 0)) ? `<button class="x" data-del="${q.id}.${i}" aria-label="ลบ">ลบ</button>` : ''}</div>` +
        q.fields.map(f => f.opts ? optsCtl(f, `${q.id}_${i}_${f.id}`, it[f.id]) : rangeCtl(f, `${q.id}_${i}_${f.id}`, it[f.id], f.label)).join('') + '</div>').join('') +
      ((!q.max || items.length < q.max) ? `<button class="addbtn" data-add="${q.id}">＋ เพิ่ม${q.item || ''}</button>` : '') + '</div>';
  }
  function renderControls() {
    const c = cur;
    $('#controls').innerHTML = c.params.map(q => q.type === 'head' ? `<div class="chead" data-show="${esc(q.label)}">${q.label}</div>` :
      q.type === 'list' ? listCtl(q) :
        q.type === 'bool' ? optsCtl(Object.assign({ opts: [[0, 'ปิด'], [1, 'เปิด']] }, q), q.id, P[q.id]) :
          q.opts ? optsCtl(q, q.id, P[q.id]) : rangeCtl(q, q.id, P[q.id], q.label)).join('') +
      `<div class="btns">${(c.presets || []).map((p, k) => `<button data-pre="${k}">${p.label}</button>`).join('')}<button id="setref">ใช้ค่าปัจจุบันเป็นค่าอ้างอิง</button><button id="reset">คืนค่าเริ่มต้น</button></div>` +
      `<div class="hint">${c.handles ? 'ลากจุดวงกลมประในภาพเพื่อย้ายวัตถุ · ' : c.drag ? 'ลากวัตถุในภาพได้ · ' : ''}พิมพ์ตัวเลขในช่องได้โดยตรง · ลูกศรข้างค่าเทียบกับค่าอ้างอิง</div>`;
    // ผูกเหตุการณ์
    const bindRange = (q, id, get, set) => {
      const r = $('#p_' + id), n = $('#n_' + id);
      r.addEventListener('input', () => { set(paramVal(q, r.value)); n.value = get(); changed(); });
      n.addEventListener('change', () => { let v = parseFloat(n.value); if (!isFinite(v)) { n.value = get(); return; } if (q.vals) { v = q.vals.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a); } set(snap(q, v)); n.value = get(); r.value = sliderIdx(q, get()); changed(); });
    };
    const bindOpts = (q, id, set) => $('#seg_' + id).addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; set(q.opts[+b.dataset.k][0]); changed(true); });
    c.params.forEach(q => {
      if (q.type === 'head') return;
      if (q.type === 'list') {
        (P[q.id] || []).forEach((it, i) => q.fields.forEach(f => {
          const id = `${q.id}_${i}_${f.id}`;
          if (f.opts) bindOpts(f, id, v => { it[f.id] = v; });
          else bindRange(f, id, () => it[f.id], v => { it[f.id] = v; });
        }));
        return;
      }
      if (q.type === 'bool') return bindOpts({ opts: [[0], [1]] }, q.id, v => { P[q.id] = v; });
      if (q.opts) return bindOpts(q, q.id, v => { P[q.id] = v; });
      bindRange(q, q.id, () => P[q.id], v => { P[q.id] = v; });
    });
    $('#controls').querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const [id, i] = b.dataset.del.split('.'); P[id].splice(+i, 1); renderControls(); changed(true); });
    $('#controls').querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const q = c.params.find(z => z.id === b.dataset.add); P[q.id].push(q.add ? q.add(P) : deepCopy(q.def[q.def.length - 1] || {})); renderControls(); changed(true); });
    $('#controls').querySelectorAll('[data-pre]').forEach(b => b.onclick = () => { Object.assign(P, deepCopy(c.presets[+b.dataset.pre].set)); renderControls(); changed(true); });
    $('#setref').onclick = () => { REF_P = deepCopy(P); REF_O = c.compute(P); changed(); };
    $('#reset').onclick = () => selectCase(ci);
    syncControls();
  }
  function syncControls() {
    const c = cur;
    c.params.forEach(q => {
      if (q.type === 'head') return;
      const box = $('#controls').querySelector(`[data-show="${CSS.escape(q.id || q.label)}"]`);
      if (box && q.show) box.hidden = !q.show(P);
      if (q.type === 'list') return;
      if (q.opts || q.type === 'bool') { const opts = q.opts || [[0], [1]]; document.querySelectorAll(`#seg_${q.id} button`).forEach((b, i) => b.setAttribute('aria-pressed', String(opts[i][0] === P[q.id]))); return; }
      const r = $('#p_' + q.id), n = $('#n_' + q.id);
      if (r) r.value = sliderIdx(q, P[q.id]);
      if (n && document.activeElement !== n) n.value = P[q.id];
      const a = $('#a_' + q.id); if (a) a.innerHTML = arrowHTML(cmp(P[q.id], REF_P[q.id]));
    });
    c.params.filter(q => q.type === 'head' && q.show).forEach(q => { const b = $('#controls').querySelector(`[data-show="${CSS.escape(q.label)}"]`); if (b) b.hidden = !q.show(P); });
    c.params.filter(q => q.type === 'list').forEach(q => (P[q.id] || []).forEach((it, i) => q.fields.forEach(f => {
      const id = `${q.id}_${i}_${f.id}`;
      if (f.opts) { document.querySelectorAll(`#seg_${id} button`).forEach((b, k) => b.setAttribute('aria-pressed', String(f.opts[k][0] === it[f.id]))); return; }
      const r = $('#p_' + id), n = $('#n_' + id); if (r) r.value = sliderIdx(f, it[f.id]); if (n && document.activeElement !== n) n.value = it[f.id];
    })));
  }

  // ---------- เลือกแบบจำลอง ----------
  function selectCase(i) {
    const c = chapters[si].cases[i]; if (!c) return;
    ci = i; cur = c;
    P = {}; c.params.forEach(q => { if (q.id) P[q.id] = deepCopy(q.def); });
    REF_P = deepCopy(P); REF_O = c.compute(P);
    buildCaseTabs(); setHash();
    $('#foot').textContent = c.foot || chapters[si].footer || '';
    $('#head').innerHTML = `<div class="case-head"><h2>${c.title}</h2><p>${c.desc}</p>${c.formula ? `<div class="formula">${c.formula}</div>` : ''}</div>`;
    $('#notes').innerHTML = (c.notes || []).map(n => `<li>${n}</li>`).join('');
    $('#sensHint').innerHTML = 'อ่านตามแถว: เมื่อ <b>เพิ่ม</b>ตัวแปรในแถวทีละ 10% (ตัวแปรอื่นคงที่ ณ ค่าปัจจุบัน) ค่าในแต่ละคอลัมน์จะ ↑ เพิ่ม ↓ ลด หรือ – ไม่เปลี่ยน';
    const isSim = !!(c.sim || c.three);
    $('#viewer').classList.toggle('is-sim', isSim);
    $('#svg').toggleAttribute('hidden', isSim); $('#cv').hidden = !isSim; $('#v3host').hidden = true;
    view = c.sim && c.sim.draw ? '2d' : (c.three && V3 ? '3d' : '2d');
    if (V3) V3.resetCam();
    playing = !!(c.sim && c.sim.step && c.sim.autoplay !== false);
    renderToolbar();
    if (GR) GR.setup(c.plot || null);
    $('#graphCard').hidden = !c.plot;
    if (c.plot) $('#glegend').innerHTML = c.plot.series.map((s, k) => `<button data-g="${k}" aria-pressed="${GR.on[k]}"><i style="background:var(${s.c})"></i>${s.label}${s.unit ? ` <span class="hint">(${s.unit})</span>` : ''}</button>`).join('');
    renderControls();
    resizeView();
    changed(true);
    document.querySelector('.layout').classList.toggle('wide', isSim);
  }
  function renderToolbar() {
    const c = cur, hasStep = !!(c.sim && c.sim.step);
    $('#vbar').hidden = !(c.sim || c.three);
    $('#vbar').innerHTML = (c.three && V3 && c.sim && c.sim.draw ? `<div class="seg sm" id="vmode"><button data-v="2d" aria-pressed="${view === '2d'}">2D</button><button data-v="3d" aria-pressed="${view === '3d'}">3D</button></div>` : (c.three && V3 ? '<span class="tag">3D</span>' : '')) +
      (hasStep ? `<button class="pb" id="play" aria-label="เล่น/หยุด"></button><button class="pb" id="restart" title="เริ่มใหม่">↺</button>` +
        `<label class="spd">ความเร็ว <select id="speed">${[0.1, 0.25, 0.5, 1, 2, 4].map(v => `<option value="${v}" ${v === speed ? 'selected' : ''}>${v}×</option>`).join('')}</select></label><span class="tm" id="tm"></span>` : '') +
      (c.actions || []).map((a, k) => `<button class="act" data-act="${k}">${a.label}</button>`).join('') +
      (c.three && V3 ? `<button class="act" id="camreset" title="มุมกล้องเริ่มต้น" ${view === '3d' ? '' : 'hidden'}>มุมกล้องเริ่มต้น</button>` : '');
    if (!$('#vbar').innerHTML.trim()) $('#vbar').hidden = true;
    const vm = $('#vmode'); if (vm) vm.onclick = e => { const b = e.target.closest('button'); if (!b) return; setView(b.dataset.v); };
    if (hasStep) {
      $('#play').onclick = togglePlay;
      $('#restart').onclick = () => { rebuildSim(); playing = true; updPlay(); };
      $('#speed').onchange = e => { speed = +e.target.value; };
      updPlay();
    }
    $('#vbar').querySelectorAll('[data-act]').forEach(b => b.onclick = () => { c.actions[+b.dataset.act].run(P, st, O); renderControls(); changed(true); });
    const cr = $('#camreset'); if (cr) cr.onclick = () => { V3.resetCam(); v3stale = true; };
  }
  function setView(v) {
    view = v; $('#vmode') && $('#vmode').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    const cr = $('#camreset'); if (cr) cr.hidden = v !== '3d';
    resizeView(); v3stale = true; dirty = true;
  }
  function togglePlay() {
    if (!cur || !cur.sim || !cur.sim.step) return;
    if (!playing && st && st.done) rebuildSim();
    playing = !playing; updPlay();
  }
  function updPlay() { const b = $('#play'); if (b) { b.textContent = playing ? '❚❚' : '▶'; b.classList.toggle('on', playing); } }

  // ---------- เมื่อค่าเปลี่ยน ----------
  function changed(structural) {
    const c = cur; O = c.compute(P);
    syncControls();
    $('#out').innerHTML = outsOf(c).map(q => `<div class="o"><div class="n">${q.name}</div><div class="v">${fmt(O[q.id])}<span class="u">${q.unit || ''}</span>${arrowHTML(cmp(O[q.id], REF_O[q.id]))}</div></div>`).join('');
    $('#outCard').hidden = !outsOf(c).length;
    const w = c.check ? c.check(P, O) : [];
    $('#warn').innerHTML = w.map(s => `<div class="warn">${s}</div>`).join('');
    if (c.sim || c.three) rebuildSim();
    else { let svg = c.draw(P, O); if (c.box) { const k = Math.min(640 / c.box[0], 300 / c.box[1]); svg = `<g transform="translate(${(640 - c.box[0] * k) / 2},${(300 - c.box[1] * k) / 2}) scale(${k})">${svg}</g>`; } $('#svg').innerHTML = svg; }
    const ex = c.extra ? c.extra(P, O) : null;
    $('#extraCard').hidden = !ex; if (ex) { $('#extraTitle').textContent = ex.title; $('#extra').innerHTML = ex.html; }
    sens();
  }
  function sens() {
    const c = cur, o = O;
    const ranged = c.params.filter(q => isRange(q) && (!q.show || q.show(P))), numOuts = outsOf(c).filter(r => typeof o[r.id] === 'number' && isFinite(o[r.id]));
    $('#sensCard').hidden = !(ranged.length && numOuts.length && c.sens !== false);
    if ($('#sensCard').hidden) return;
    let h = '<tr><th>เพิ่มตัวแปร ↓ / ดูผลต่อ →</th>' + numOuts.map(q => `<th>${q.name}</th>`).join('') + '</tr>';
    ranged.forEach(q => {
      let up, dir = 1;
      if (q.vals) { const i = q.vals.indexOf(P[q.id]); if (i < q.vals.length - 1) up = q.vals[i + 1]; else { up = q.vals[i - 1]; dir = -1; } }
      else { up = P[q.id] === 0 ? q.step * 5 : P[q.id] + Math.abs(P[q.id]) * 0.1; if (up > q.max) { up = P[q.id] - Math.abs(P[q.id]) * 0.1; dir = -1; if (P[q.id] === 0) up = -q.step * 5; } }
      const o2 = c.compute(Object.assign(deepCopy(P), { [q.id]: up }));
      h += `<tr><td class="rowh">${q.label}</td>` + numOuts.map(r => { const d = cmp(o2[r.id], o[r.id]); return `<td>${arrowHTML(d === null ? null : d * dir)}</td>`; }).join('') + '</tr>';
    });
    $('#sens').innerHTML = h;
  }

  // ---------- แอนิเมชัน ----------
  function rebuildSim() {
    const c = cur;
    st = c.sim && c.sim.init ? c.sim.init(P, O) : {}; st.t = 0; st.done = false; acc = 0; nextSample = 0;
    if (GR) { GR.reset(); if (c.plot) GR.push(st, P, O); }
    v3stale = true; dirty = true; lastLive = 0;
    updPlay();
  }
  function resizeView() {
    if (!cur) return;
    const box = $('#vbox'), w = box.clientWidth || 640;
    if (!(cur.sim || cur.three)) return;
    const asp = cur.aspect || (cur.sim && cur.sim.aspect) || 16 / 9;
    let h = Math.round(w / asp); h = clamp(h, 220, Math.max(260, Math.round(window.innerHeight * 0.68)));
    const show3 = view === '3d' && cur.three && V3;
    $('#cv').hidden = show3; $('#v3host').hidden = !show3;
    if (show3) { V3.resize(w, h); $('#v3host').style.height = h + 'px'; } else G.resize(w, h);
    const gc = $('#gcv'); if (cur.plot && !$('#graphCard').hidden) { GR.g.resize(gc.parentElement.clientWidth, cur.plot.h || Math.max(160, Math.min(320, (cur.plot.x ? 1 : cur.plot.series.length) * 95))); }
    dirty = true; v3stale = v3stale || show3;
  }
  function stepSim(realDt) {
    const c = cur, sim = c.sim, h = sim.dt || 1 / 240, sdt = (c.plot && c.plot.dt) || 1 / 60;
    acc += realDt * speed; let n = 0;
    while (acc >= h && n < 20000) {
      sim.step(st, h, P, O); st.t += h; acc -= h; n++;
      if (GR && c.plot && st.t >= nextSample) { GR.push(st, P, O); nextSample = st.t + sdt; }
      if (sim.tmax && st.t >= sim.tmax) st.done = true;
      if (st.done) { acc = 0; break; }
    }
    if (st.done) { if (sim.loop) { setTimeout(() => { if (cur === c && !playing) { rebuildSim(); playing = true; updPlay(); } }, 700); } playing = false; updPlay(); if (GR && c.plot) GR.push(st, P, O); }
  }
  let lastTs = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    const realDt = Math.min(0.05, (ts - lastTs) / 1000 || 0); lastTs = ts;
    if (!cur || !(cur.sim || cur.three) || document.hidden) return;
    if (playing && cur.sim && cur.sim.step) { stepSim(realDt); dirty = true; }
    const show3 = view === '3d' && cur.three && V3;
    if (show3) {
      if (v3stale) { V3.build(cur, P, O, true); v3stale = false; }
      V3.render(st, P, O);
    } else if (dirty && cur.sim && cur.sim.draw) {
      G.clear(); G.frame(cur.sim.view(P, O, st)); cur.sim.draw(G, st, P, O);
      handles = cur.handles ? cur.handles(P, O, st) : [];
      handles.forEach(hd => G.handle(hd.x, hd.y, drag && drag.h.id === hd.id, hover && hover.id === hd.id));
      dirty = false;
    }
    if (ts - lastLive > 100) {
      lastLive = ts;
      const tm = $('#tm'); if (tm) tm.textContent = 't = ' + st.t.toFixed(2) + ' s';
      if (cur.live) $('#live').innerHTML = cur.live.map(l => `<span class="lv"><span class="n">${l.name}</span> <b>${fmt(l.f(st, P, O))}</b> <span class="u">${l.unit || ''}</span></span>`).join('');
      else $('#live').innerHTML = '';
    }
    if (GR && cur.plot && (playing || ts - lastGraph > 400)) { if (ts - lastGraph > 50) { GR.draw(); lastGraph = ts; } }
  }

  // ---------- ลากวัตถุ (sim) ----------
  function applyUpdates(u) {
    Object.keys(u).forEach(k => {
      const parts = k.split('.');
      if (parts.length === 3) { const q = cur.params.find(z => z.id === parts[0]); const f = q.fields.find(z => z.id === parts[2]); const it = P[parts[0]][+parts[1]]; if (it) it[parts[2]] = f ? snap(f, u[k]) : u[k]; }
      else { const q = cur.params.find(z => z.id === k); P[k] = q && isRange(q) ? snap(q, u[k]) : u[k]; }
    });
    changed();
  }
  function bindCanvas() {
    const cv = $('#cv');
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const pick = (px, py) => { let best = null, bd = 20; handles.forEach(h => { const d = Math.hypot(G.X(h.x) - px, G.Y(h.y) - py); if (d < bd) { bd = d; best = h; } }); return best; };
    cv.addEventListener('pointerdown', e => {
      const [px, py] = pos(e), h = pick(px, py); if (!h) return;
      drag = { h, dx: G.X(h.x) - px, dy: G.Y(h.y) - py }; playing = false; updPlay(); cv.setPointerCapture(e.pointerId); e.preventDefault(); dirty = true;
    });
    cv.addEventListener('pointermove', e => {
      const [px, py] = pos(e);
      if (drag) { const w = G.toWorld(px + drag.dx, py + drag.dy); const u = drag.h.set(w[0], w[1], P); if (u) applyUpdates(u); dirty = true; return; }
      const h = pick(px, py); if ((h && h.id) !== (hover && hover.id)) { hover = h; dirty = true; }
      cv.style.cursor = h ? 'grab' : 'default';
    });
    const end = () => { if (drag) { drag = null; dirty = true; renderControls(); } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  }

  function themeChanged() { if (G) G.refreshColors(); if (GR) GR.g.refreshColors(); v3stale = true; dirty = true; if (cur && !(cur.sim || cur.three)) changed(); }

  function fromHash() {
    const m = /^#([A-Za-z0-9_~-]+)(?:\.(\d+))?$/.exec(location.hash || '');
    if (!m || m[1] === 'start') return [-2, 0];
    if (m[1] === 'home') return [-1, 0];
    const k = chapters.findIndex(s => s.id === m[1]); return k >= 0 ? [k, +(m[2] || 0)] : [-2, 0];
  }
  function go(i, j) { if (i === -2) goLanding(); else if (i < 0) goHome(); else selectSubject(i, j); window.scrollTo(0, 0); }
  function start() {
    G = new Lab.G2($('#cv'));
    GR = Lab.Graph ? new Lab.Graph($('#gcv')) : null;
    try { V3 = Lab.V3 ? new Lab.V3($('#v3host')) : null; } catch (e) { V3 = null; console.warn('3D ใช้ไม่ได้บนเครื่องนี้', e); }
    bindCanvas();
    $('#glegend').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; GR.toggle(+b.dataset.g); b.parentElement.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-pressed', String(GR.on[k]))); resizeView(); GR.draw(); });
    $('#themebtn').onclick = () => {
      const r = document.documentElement;
      const d = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme:dark)').matches);
      r.dataset.theme = d ? 'light' : 'dark'; themeChanged();
    };
    matchMedia('(prefers-color-scheme:dark)').addEventListener('change', themeChanged);
    window.addEventListener('resize', resizeView);
    if (window.ResizeObserver) new ResizeObserver(resizeView).observe($('#vbox'));
    document.addEventListener('keydown', e => { if (e.code === 'Space' && !/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)) { e.preventDefault(); togglePlay(); } });
    const [i, j] = fromHash(); go(i, j);
    window.addEventListener('hashchange', () => { const [a, b] = fromHash(); if (a !== si || b !== ci) go(a, b); });
    requestAnimationFrame(frame);
  }

  // สำหรับทดสอบอัตโนมัติ
  const _t = {
    list: () => chapters.map(c => ({ id: c.id, n: c.cases.length, names: c.cases.map(x => x.name) })),
    raw: () => chapters,
    go: (i, j) => go(i, j),
    run(sec) { if (!cur || !cur.sim || !cur.sim.step) return 0; const h = cur.sim.dt || 1 / 240; let n = 0; while (st.t < sec && !st.done && n < 200000) { cur.sim.step(st, h, P, O); st.t += h; n++; if (GR && cur.plot && st.t >= nextSample) { GR.push(st, P, O); nextSample = st.t + ((cur.plot && cur.plot.dt) || 1 / 60); } } dirty = true; return st.t; },
    state: () => ({ st, P, O, playing, view }),
    setView, pause() { playing = false; updPlay(); }
  };

  return {
    chapter, add, register, start, _t,
    h: { fmt, sci, cmp, arrowHTML, clamp, RAD, DEG, T, L, PL, ARW, DOT, midArrow, esc }
  };
})();
