/* ===== หน้าจอ ===== */
const UI={tab:'home',b:'',kind:'',crew:null,sub:null,q:''};
const bOpts=(sel,all)=>(all?`<option value="" ${sel===''?'selected':''}>${all}</option>`:'')+S.project.buildings.map(b=>`<option ${b===sel?'selected':''}>${esc(b)}</option>`).join('');
const kindOpts=(sel,all)=>(all?`<option value="">${all}</option>`:'')+Object.keys(KIND).map(k=>`<option value="${k}" ${k===sel?'selected':''}>${KIND[k]}</option>`).join('');
const bar=p=>`<div class="pbar"><i style="width:${Math.min(100,Math.max(0,p))}%"></i></div>`;
const TABS=[['home','ภาพรวม','ภาพรวม'],['crews','ชุดช่าง','ชุดช่าง'],['boq','BOQ','BOQ'],['rooms','ตารางห้อง','ห้อง'],['plans','แบบ','แบบ'],['set','ตั้งค่า','ตั้งค่า']];
const TABIC={
 home:'<svg viewBox="0 0 24 24"><path d="M4 11l8-6.500 8 6.500v8.500a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 19.500z"/><path d="M10 21v-6h4v6"/></svg>',
 crews:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8.500" r="3.200"/><path d="M3 20c0-3.300 2.700-5.500 6-5.500s6 2.200 6 5.500"/><circle cx="17.500" cy="9.500" r="2.500"/><path d="M17 14.500c2.500 0 4 1.700 4 4.500"/></svg>',
 boq:'<svg viewBox="0 0 24 24"><rect x="5" y="3.500" width="14" height="17" rx="2.500"/><path d="M8.500 8.500h7M8.500 12h7M8.500 15.500h4"/></svg>',
 rooms:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/></svg>',
 plans:'<svg viewBox="0 0 24 24"><path d="M3.500 7.500L9 5l6 2.500L20.500 5v11.500L15 19l-6-2.500-5.500 2.500z"/><path d="M9 5v11.500M15 7.500V19"/></svg>',
 set:'<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.200"/><circle cx="9" cy="17" r="2.200"/></svg>'};

function viewTop(){
  return`${S.project.logoId&&imgSrc(S.project.logoId)?`<img class="tlogo" src="${imgSrc(S.project.logoId)}" alt="">`:''}<div class="brand"><b>Work Desk</b><span>${esc(S.project.name)} · ส่งงาน / เบิกผลงาน</span></div>
   <div class="nav">${TABS.map(t=>`<button data-act="tab" data-v="${t[0]}" aria-label="${t[1]}" aria-current="${UI.tab===t[0]&&!UI.crew}"><i class="ic">${TABIC[t[0]]}</i><span class="lb l">${t[1]}</span><span class="lb s">${t[2]}</span></button>`).join('')}</div><span id="sync">${statusHTML()}</span>`;
}

/* ---- ภาพรวม ---- */
/* หน้าแรกแบบแอปมือถือ (เฉพาะจอเล็ก) */
function mhome(act,T){
  const pct=T.amt?Math.min(100,Math.round(T.cum/T.amt*100)):0,C=2*Math.PI*34,off=C*(1-pct/100);
  const who=(MODE&&MODE.email||'').split('@')[0]||(S.project.name||'W');
  const qa=(ic,t,attr)=>`<button class="mh-qa" ${attr}><i class="ic">${ic}</i><span>${t}</span></button>`;
  return`<div class="mhome">
   <div class="mh-top"><div class="mh-av">${esc(String(who).charAt(0).toUpperCase())}</div><div class="mh-who"><small>โครงการ</small><b>${esc(S.project.name||'')}</b></div><button class="mh-bell" data-act="tab" data-v="set" aria-label="ตั้งค่า">${TABIC.set}</button></div>
   <div class="mh-hero"><div class="mh-hl"><span>เบิกสะสม (บาท)</span><b class="mh-big">${f2(T.cum)}</b><small>จากมูลค่าสัญญา ${f2(T.amt)} · งวดล่าสุด ${f2(T.cur)} · ${act.length} ชุด</small><button class="mh-cta" data-act="bpdf">สรุปรวม PDF</button></div>
    <svg class="mh-ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" class="bg"/><circle cx="42" cy="42" r="34" class="fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 42 42)"/><text x="42" y="40" text-anchor="middle" class="n">${pct}%</text><text x="42" y="55" text-anchor="middle" class="t">คืบหน้า</text></svg></div>
   <div class="mh-qas">${qa(TABIC.crews,'ชุดช่าง','data-act="tab" data-v="crews"')}${qa(TABIC.boq,'BOQ','data-act="tab" data-v="boq"')}${qa(TABIC.rooms,'ตารางห้อง','data-act="tab" data-v="rooms"')}${qa(TABIC.plans,'แบบ','data-act="tab" data-v="plans"')}</div>
   <h2 class="mh-sec">ชุดช่างทั้งหมด</h2></div>`}
function viewHome(){
  const cs=S.crews.filter(c=>(!UI.b||c.building===UI.b)&&(!UI.kind||c.kind===UI.kind));
  const act=cs.filter(c=>!c.skip);const ks=act.map(c=>({c,k:calcCrew(c)}));
  const T=ks.reduce((a,x)=>({amt:a.amt+x.k.T.amt,cum:a.cum+x.k.T.cumAmt,cur:a.cur+x.k.T.curAmt}),{amt:0,cum:0,cur:0});
  const noRows=act.filter(c=>!crewRows(c).length).length;const miss=unlinkedCount();
  let h=mhome(act,T)+`<div class="row" style="margin-bottom:10px"><h1 style="font-size:22px;margin-right:auto" class="mh-hide">ภาพรวมส่งงาน / เบิกผลงาน</h1>
   <select id="fb" style="width:auto">${bOpts(UI.b,'ทุกอาคาร')}</select><select id="fk" style="width:auto">${kindOpts(UI.kind,'ทุกประเภท')}</select>
   <button class="btn pri" data-act="bpdf">สรุปรวม PDF</button><button class="btn" data-act="zipcrews">ส่งออกแยกชุด (ZIP)</button><button class="btn" data-act="bxls">Excel</button></div>
   <div class="stats"><div><b>${act.length}</b><span>ชุดที่ใช้งาน</span></div><div><b class="mono">${f2(T.amt)}</b><span>มูลค่าสัญญารวม (บาท)</span></div><div><b class="mono" style="color:var(--good)">${f2(T.cum)}</b><span>เบิกสะสม (บาท)</span></div><div><b class="mono">${pct(T.amt?T.cum/T.amt*100:0)}</b><span>ความคืบหน้า</span></div>
   <div><b style="color:${miss?'var(--warn)':'var(--good)'}">${miss}</b><span>รายการไม่มี BOQ คลุม</span></div><div><b style="color:${noRows?'var(--warn)':'var(--good)'}">${noRows}</b><span>ชุดที่ยังไม่มีรายการงาน</span></div></div>`;
  for(const b of S.project.buildings.filter(b=>!UI.b||b===UI.b)){
    const list=cs.filter(c=>c.building===b);if(!list.length)continue;
    h+=`<div class="ghead"><b>อาคาร ${esc(b)}</b><span class="small muted">${list.length} ชุด</span><button class="btn sm" style="margin-left:auto" data-act="newcrew" data-b="${esc(b)}">＋ เพิ่มชุด</button></div>
     <div class="tblwrap"><table class="grid-t"><thead><tr><th>ชุด</th><th>ประเภท</th><th>รูปแบบ</th><th class="r">มูลค่าสัญญา</th><th class="r">เบิกงวดล่าสุด</th><th class="r">สะสม</th><th style="width:140px">ความคืบหน้า</th><th>งวด</th><th></th></tr></thead><tbody>
     ${list.map(c=>{const k=calcCrew(c);const n=subsOf(c).length;const ls=subsOf(c)[n-1];return`<tr data-act="opencrew" data-id="${c.id}" class="${c.skip?'dim':''}"><td><b>${esc(c.name)}</b>${c.skip?' <span class="chip">ไม่ส่ง</span>':''}<div class="small muted">${esc(c.detail||c.note||'')}</div></td><td class="small">${esc(KIND[c.kind])}</td><td class="small">${c.mode==='room'?'ตารางห้อง':'รายการงาน'}</td>
      <td class="r mono">${k.rows.length?f2(k.T.amt):'<span class="muted">—</span>'}</td><td class="r mono">${n?f2(k.T.curAmt):'-'}</td><td class="r mono">${k.rows.length?f2(k.T.cumAmt):'-'}</td><td>${k.rows.length?bar(k.T.pct)+`<span class="small">${pct(k.T.pct)}</span>`:'<span class="chip warn">ยังไม่มีรายการ</span>'}</td>
      <td class="small">${n?`ง.${ls.no} ${ls.sent?'<span class="chip good">ส่งแล้ว</span>':'<span class="chip">ร่าง</span>'}`:'-'}${k.missing?`<div><span class="chip warn">ไม่มี BOQ ${k.missing}</span></div>`:''}</td><td class="nw"><button class="btn sm" data-act="opencrew" data-id="${c.id}">เปิด</button> <button class="btn sm" data-act="crewpdf" data-id="${c.id}">PDF</button></td></tr>`}).join('')}</tbody></table></div>`;
  }
  if(!cs.length)h+='<div class="empty">ยังไม่มีชุดช่าง กด “เพิ่มชุด”</div>';
  return h;
}

/* ---- รายการชุดช่าง (ตารางเดียว กรองได้) ---- */
function viewCrews(){return viewHome()}

/* ---- หน้าชุดช่าง ---- */
function viewCrew(){
  const c=by('crews',UI.crew);if(!c){UI.crew=null;return viewHome()}
  const k=calcCrew(c);const subs=subsOf(c);const bo=S.boq.filter(x=>x.building===c.building).sort((a,b)=>natCmp(a.group,b.group)||natCmp(a.name,b.name));
  let h=`<div class="row" style="margin-bottom:8px"><button class="btn" data-act="back">← กลับ</button><h1 style="font-size:20px;margin-right:auto">${esc(c.name)}</h1><button class="btn bad" data-act="delcrew">ลบชุด</button></div>
   <div class="panel"><div class="grid g2">
    <label class="f">ชื่อชุด<input type="text" data-c="name" value="${esc(c.name)}"></label>
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr"><label class="f">อาคาร<select data-c="building">${bOpts(c.building)}</select></label><label class="f">ประเภท<select data-c="kind">${kindOpts(c.kind)}</select></label><label class="f">รูปแบบเอกสาร<select data-c="mode"><option value="line" ${c.mode==='line'?'selected':''}>รายการงาน (แบบเบิกผลงาน)</option><option value="room" ${c.mode==='room'?'selected':''}>ตารางห้อง (ตร.ม./ITEM)</option></select></label></div>
    <label class="f">รายละเอียดงาน<textarea data-c="detail" rows="2">${esc(c.detail||'')}</textarea></label>
    <div class="grid"><label class="f">หมายเหตุ<input type="text" data-c="note" value="${esc(c.note||'')}"></label><label class="f" style="flex-direction:row;align-items:center;gap:8px;margin-top:18px"><input type="checkbox" data-c="skip" ${c.skip?'checked':''}> ไม่ส่งงานงวดนี้ / ยังไม่ใช้งาน</label></div></div></div>`;
  h+=c.mode==='room'?crewRoomPanel(c,bo,crewLinePanel(c,k,bo,true)):crewLinePanel(c,k,bo);
  h+=`<div class="panel"><h3>งวดส่งงาน / เบิกผลงาน <button class="btn pri sm" data-act="newsub" style="margin-left:auto">＋ เริ่มงวดใหม่ (งวดที่ ${nextNo(c)})</button></h3>
   ${subs.length?`<div class="tblwrap"><table class="grid-t"><thead><tr><th>งวด</th><th>ช่วงเวลา</th><th class="r">เบิกงวดนี้ (บาท)</th><th class="r">สะสม (บาท)</th><th>%</th><th>สถานะ</th><th></th></tr></thead><tbody>
    ${subs.map(s=>{const kk=calcCrew(c,s.no);return`<tr><td><b>${s.no}</b></td><td class="small">${esc([s.from&&fmtShort(s.from),s.to&&fmtShort(s.to)].filter(Boolean).join(' – ')||fmtShort(s.date))}</td><td class="r mono">${f2(kk.T.curAmt)}</td><td class="r mono">${f2(kk.T.cumAmt)}</td><td class="small">${pct(kk.T.pct)}</td><td>${s.sent?'<span class="chip good">ส่งแล้ว</span>':'<span class="chip">ร่าง</span>'}</td>
     <td class="r"><button class="btn sm" data-act="opensub" data-id="${s.id}">บันทึกปริมาณ</button> <button class="btn sm" data-act="docsub" data-id="${s.id}">เอกสาร</button></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty small">ยังไม่มีงวด กด “เริ่มงวดใหม่” เพื่อกรอกปริมาณที่ทำเสร็จ</div>'}</div>`;
  return h;
}
function crewLinePanel(c,k,bo,extra){
  const boOpt=sel=>{const gs=[...new Set(bo.map(b=>b.group||NOGRP))];return`<option value="">— ไม่มี BOQ —</option>${gs.map(g=>`<optgroup label="${esc(g)}">${bo.filter(b=>(b.group||NOGRP)===g).map(b=>`<option value="${b.id}" ${b.id===sel?'selected':''}>${esc(b.name)}</option>`).join('')}</optgroup>`).join('')}`};
  const cr=Object.fromEntries(boqControl(c.building).map(x=>[x.it.id,x]));
  return`<div class="panel"><h3>${extra?'รายการอื่นๆ นอกตารางห้อง':'รายการงาน / ราคาจัดจ้างของชุด'} <span class="small muted" style="font-weight:400">${extra?'(เช่น ปูกระเบื้องทางเดินชั้น 1 — เบิกรวมกับตารางห้อง)':'(ปริมาณ × ค่าแรง/หน่วย = มูลค่าสัญญา)'}</span><span style="margin-left:auto" class="row"><button class="btn sm" data-act="fromboq">＋ เพิ่มจาก BOQ</button><button class="btn sm" data-act="newline">＋ เพิ่มรายการ</button></span></h3>
   <div class="tblwrap"><table class="grid-t ed"><thead><tr><th style="width:70px">ชั้น</th><th>รายการ</th><th style="width:90px">ปริมาณ</th><th style="width:70px">หน่วย</th><th style="width:100px">ค่าแรง/หน่วย</th><th class="r" style="width:110px">บาท</th><th style="width:200px">BOQ ที่คลุม</th><th style="width:170px">หมายเหตุ</th><th></th></tr></thead><tbody>
   ${(c.lines||[]).map(l=>{const b=l.boqId&&cr[l.boqId];const warn=(!b||b.noBoq)?'':b.over?'จัดสรรเกิน BOQ':'';return`<tr><td><input type="text" data-l="${l.id}:floor" value="${esc(l.floor)}"></td><td><input type="text" data-l="${l.id}:name" value="${esc(l.name)}"></td><td><input type="number" step="any" data-l="${l.id}:qty" value="${l.qty}"></td><td><input type="text" data-l="${l.id}:unit" value="${esc(l.unit)}"></td><td><input type="number" step="any" data-l="${l.id}:rate" value="${l.rate}"></td>
    <td class="r mono" data-amt="${l.id}">${f2(num(l.qty)*num(l.rate))}</td><td><select data-l="${l.id}:boqId">${boOpt(l.boqId)}</select>${num(l.pct)>0?`<div class="small muted">แบ่ง ${num(l.pct)}% ของ BOQ</div>`:''}${warn?`<div class="small" style="color:var(--warn)">${warn}</div>`:''}</td><td><input type="text" data-l="${l.id}:note" value="${esc(l.note||'')}" placeholder="หมายเหตุเพิ่มเติม">${b&&!b.noBoq?'':`<select data-l="${l.id}:nb"><option value="nobq" ${(l.nb||'nobq')==='nobq'?'selected':''}>ไม่มี BOQ คลุม</option><option value="extra" ${l.nb==='extra'?'selected':''}>งานเพิ่ม</option><option value="none" ${l.nb==='none'?'selected':''}>ไม่ใส่หมายเหตุ</option></select>`}</td><td><button class="btn sm bad" data-act="delline" data-id="${l.id}">ลบ</button></td></tr>`}).join('')||`<tr><td colspan="9" class="empty small">ยังไม่มีรายการ</td></tr>`}
   </tbody><tfoot><tr><td colspan="5" class="r"><b>รวมมูลค่าสัญญา</b></td><td class="r mono" id="lntot"><b>${f2(k.T.amt)}</b></td><td colspan="3"></td></tr></tfoot></table></div></div>`;
}
function crewRoomPanel(c,bo,extraPanel){
  const ctl=Object.fromEntries(boqControl(c.building).map(x=>[x.it.id,x]));
  const rooms=S.rooms.filter(r=>r.building===c.building).sort((a,b)=>natCmp(a.floor,b.floor)||natCmp(a.name,b.name));
  const other=(id,itId)=>{for(const x of S.crews){if(x.id!==c.id&&x.mode==='room'&&x.rates&&x.rates[itId]!==undefined&&(x.roomIds||[]).includes(id))return x.name}return''};
  const its=bo.filter(b=>b.tile||(c.rates&&c.rates[b.id]!==undefined)||S.rooms.some(r=>(r.qty||{})[b.id]));
  const floors=[...new Set(rooms.map(r=>r.floor||''))];
  return`<div class="panel"><h3>ITEM และค่าแรงของชุด <span class="small muted" style="font-weight:400">ติ๊กเฉพาะ ITEM ที่ชุดนี้ทำ แล้วใส่ค่าแรง/ตร.ม.</span><button class="btn sm pri" data-act="newline" style="margin-left:auto">＋ เพิ่มรายการอื่นๆ (นอกตารางห้อง)</button></h3>
   ${its.length?`<div class="tblwrap"><table class="grid-t"><thead><tr><th>ใช้</th><th>ITEM</th><th>หน่วย</th><th class="r">BOQ</th><th class="r">จัดสรรแล้ว (ทุกชุด)</th><th style="width:130px">ค่าแรง/หน่วย</th></tr></thead><tbody>
    ${its.map(b=>{const on=c.rates&&c.rates[b.id]!==undefined;const x=ctl[b.id];return`<tr><td><input type="checkbox" data-ri="${b.id}" ${on?'checked':''}></td><td>${esc(b.name)}</td><td>${esc(b.unit)}</td><td class="r mono">${x&&x.qty?fq(x.qty):'<span class="chip warn">ไม่มี BOQ</span>'}</td><td class="r mono ${x&&x.over?'bad':''}">${x?fq(x.alloc):0}</td><td>${on?`<input type="number" step="any" data-rate="${b.id}" value="${c.rates[b.id]}">`:''}</td></tr>`}).join('')}</tbody></table></div>`
    :'<div class="empty small">ยังไม่มี ITEM กระเบื้องของอาคารนี้ — ไปแท็บ “ตารางห้อง” เพื่อนำเข้า/เพิ่มห้องและ ITEM</div>'}</div>
   ${extraPanel||''}
   <div class="panel"><h3>ห้องที่ชุดนี้รับผิดชอบ <span class="chip">${(c.roomIds||[]).length} ห้อง</span><span style="margin-left:auto" class="row"><button class="btn sm" data-act="roomsall">เลือกทุกห้อง</button><button class="btn sm" data-act="roomsnone">ล้าง</button></span></h3>
   ${rooms.length?floors.map(f=>{const rs=rooms.filter(r=>(r.floor||'')===f);const allOn=rs.every(r=>(c.roomIds||[]).includes(r.id));return`<div class="ghead l1"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-rf="${esc(f)}" ${allOn?'checked':''}> <b>ชั้น ${esc(f||'-')}</b></label><span class="small muted">${rs.length} ห้อง</span></div>
    <div class="roomgrid">${rs.map(r=>{const on=(c.roomIds||[]).includes(r.id);const oth=crewItemIds(c).map(i=>other(r.id,i)).find(Boolean);return`<label class="rchip ${on?'on':''}"><input type="checkbox" data-rm="${r.id}" ${on?'checked':''}> <span>${esc(r.name)}</span>${oth?`<small class="warnt">ชุดอื่นรับแล้ว: ${esc(oth)}</small>`:''}</label>`}).join('')}</div>`}).join(''):'<div class="empty small">ยังไม่มีห้องของอาคารนี้</div>'}</div>`;
}

/* ---- บันทึกปริมาณงวด ---- */
/* ---- งวดงานแบบตารางห้อง: ดูง่าย (การ์ดรายห้อง / ตารางคอลัมน์ติดซ้าย) + ค้นหา/กรอง/พับชั้น ---- */
UI.sv='';UI.sq='';UI.sfl='all';UI.sfc=new Set();
function subRoomView(c,k,items,RA,roomsAll,rowOf,exRows,lineTbl){
  const mode=UI.sv||(window.innerWidth<900?'card':'table');const q=(UI.sq||'').trim().toLowerCase();
  const stat=r=>{const rs=items.map(it=>rowOf.get(r.id+'~'+it.boqId)).filter(Boolean);return{todo:rs.some(x=>x.cum<x.qty-1e-9),cur:rs.some(x=>x.cur>0),rs}};
  const rooms=roomsAll.filter(r=>(!q||(r.name+' '+(r.floor||'')).toLowerCase().includes(q))&&(UI.sfl==='all'||(UI.sfl==='todo'?stat(r).todo:stat(r).cur)));
  const nTodo=roomsAll.filter(r=>stat(r).todo).length,nCur=roomsAll.filter(r=>stat(r).cur).length;
  const chip=(v,l,n)=>`<button class="chipbtn ${UI.sfl===v?'on':''}" data-act="sfl" data-v="${v}">${l} <small>${n}</small></button>`;
  let h=`<div class="srbar"><div class="row" style="gap:8px"><button class="btn sm" data-act="fillall">เติมคงเหลือทั้งหมดเป็น “เสร็จ”</button><button class="btn sm" data-act="clearall">ล้างงวดนี้</button><label class="small" style="display:flex;gap:4px;align-items:center">ใส่ % ให้ทุกห้อง <input type="number" step="any" data-pall="1" placeholder="%" style="width:70px"></label>
    <span style="margin-left:auto" class="row"><button class="chipbtn ${mode==='card'?'on':''}" data-act="svw" data-v="card">รายห้อง</button><button class="chipbtn ${mode==='table'?'on':''}" data-act="svw" data-v="table">ตาราง</button></span></div>
   <div class="row" style="gap:6px;margin-top:8px"><input type="search" id="sq" placeholder="ค้นหาห้อง เช่น E101" value="${esc(UI.sq||'')}" style="max-width:200px">${chip('all','ทั้งหมด',roomsAll.length)}${chip('todo','ยังไม่เสร็จ',nTodo)}${chip('cur','มีงานงวดนี้',nCur)}<span class="small muted" style="margin-left:auto">กรอกปริมาณที่ทำเสร็จ “ในงวดนี้” (ไม่ใช่สะสม) หรือใส่ % ต่อห้อง/ชั้น/ทั้งหมด</span></div></div>`;
  if(!rooms.length)return h+'<div class="empty small">ไม่พบห้องตามที่กรอง</div>'+(exRows.length?`<h3 style="margin:14px 0 6px">รายการอื่นๆ นอกตารางห้อง</h3>`+lineTbl(exRows):'');
  const bar=a=>{const p=a&&a.amt?Math.min(100,a.cumAmt/a.amt*100):0;return`<div class="rbar" title="สะสม ${pct(p)}"><i style="width:${p}%"></i></div>`};
  const flb=(fl,n)=>`<div class="sfband" data-act="sfc" data-f="${esc(fl||'')}"><span>${UI.sfc.has(fl||'')?'▶':'▼'}</span><b>ชั้น ${esc(fl||'-')}</b><span class="small muted">${n} ห้อง</span><label class="small" style="margin-left:auto;font-weight:400" onclick="event.stopPropagation()">ใส่ % ทั้งชั้น <input type="number" step="any" data-pf="${esc(fl||'')}" placeholder="%" style="width:66px"></label></div>`;
  if(mode==='card'){
    let fl=null;
    for(const r of rooms){
      if(r.floor!==fl){fl=r.floor;h+=flb(fl,rooms.filter(x=>x.floor===fl).length)}
      if(UI.sfc.has(fl||''))continue;const a=RA.get(r.id);
      h+=`<div class="rmc"><div class="rmh"><div><b class="rmn">${esc(r.name)}</b>${bar(a)}</div><div class="r small mono"><div>มูลค่า ${a?f2(a.amt):'-'}</div><div style="color:var(--accent)">งวดนี้ <span data-ra="${r.id}:cur">${a?f2(a.curAmt):'-'}</span></div><div style="color:var(--good)">สะสม <span data-ra="${r.id}:cum">${a?f2(a.cumAmt):'-'}</span></div></div>
       <div class="nw"><input type="number" step="any" data-pr="${r.id}" placeholder="%" style="width:60px"> <button class="btn sm" data-act="fullroom" data-id="${r.id}">เสร็จ</button></div></div>
       <div class="rmi">${items.map(it=>{const x=rowOf.get(r.id+'~'+it.boqId);if(!x)return'';return`<div class="rmr"><div class="rmt">${esc(it.name)}<div class="small muted">${fq(x.qty)} ${esc(it.unit)} × ${f2(x.rate)}</div></div><div class="rmp small muted">ก่อน<br><span class="mono" data-c="${x.key}:prev">${x.prev?fq(x.prev):'-'}</span></div><div><input type="number" step="any" data-e="${x.key}" value="${x.cur||''}" placeholder="0" class="${x.over?'bad':''}"></div><div class="rmp small muted">สะสม<br><span class="mono" data-c="${x.key}:cum">${fq(x.cum)}</span> <span data-c="${x.key}:pct">${pct(x.pct)}</span></div></div>`}).join('')}</div></div>`}
  }else{
    h+=`<div class="tblwrap stk"><table class="grid-t ed sr"><thead><tr><th>ห้อง</th>${items.map((it,i)=>`<th colspan="3" class="c ig${i%2}">${esc(it.name)}<div class="small muted">${f2(it.rate)} บาท/${esc(it.unit)}</div></th>`).join('')}<th colspan="3" class="c">ราคาต่อห้อง (บาท)</th><th></th></tr><tr><th></th>${items.map((_,i)=>`<th class="r small ig${i%2}">ปริมาณ</th><th class="r small ig${i%2}">ก่อน</th><th class="small ig${i%2}" style="width:92px">งวดนี้</th>`).join('')}<th class="r small">มูลค่า</th><th class="r small">งวดนี้</th><th class="r small">สะสม</th><th></th></tr></thead><tbody>`;
    let fl=null;
    for(const r of rooms){
      if(r.floor!==fl){fl=r.floor;h+=`<tr class="band"><td colspan="${5+items.length*3}" data-act="sfc" data-f="${esc(fl||'')}" style="cursor:pointer">${UI.sfc.has(fl||'')?'▶':'▼'} ชั้น ${esc(fl||'-')} <label class="small" style="margin-left:14px;font-weight:400" onclick="event.stopPropagation()">ใส่ % ทั้งชั้น <input type="number" step="any" data-pf="${esc(fl||'')}" placeholder="%" style="width:70px"></label></td></tr>`}
      if(UI.sfc.has(fl||''))continue;const a=RA.get(r.id);
      h+=`<tr><td class="stkc"><b>${esc(r.name)}</b>${bar(a)}</td>${items.map((it,i)=>{const x=rowOf.get(r.id+'~'+it.boqId);return x?`<td class="r mono ig${i%2}">${fq(x.qty)}</td><td class="r mono muted ig${i%2}" data-c="${x.key}:prev">${x.prev?fq(x.prev):'-'}</td><td class="ig${i%2}"><input type="number" step="any" data-e="${x.key}" value="${x.cur||''}" placeholder="0" class="${x.over?'bad':''}"></td>`:`<td class="c muted ig${i%2}">·</td><td class="ig${i%2}"></td><td class="ig${i%2}"></td>`}).join('')}<td class="r mono" data-ra="${r.id}:amt">${a?f2(a.amt):'-'}</td><td class="r mono" data-ra="${r.id}:cur">${a?f2(a.curAmt):'-'}</td><td class="r mono" data-ra="${r.id}:cum">${a?f2(a.cumAmt):'-'}</td><td class="nw"><input type="number" step="any" data-pr="${r.id}" placeholder="%" style="width:60px"> <button class="btn sm" data-act="fullroom" data-id="${r.id}">เสร็จ</button></td></tr>`}
    h+=`</tbody><tfoot><tr><td><b>รวม</b></td>${items.map(()=>'<td></td><td></td><td></td>').join('')}<td class="r mono" id="ra-amt"><b>${f2(k.T.amt)}</b></td><td class="r mono" id="ra-cur"><b>${f2(k.T.curAmt)}</b></td><td class="r mono" id="ra-cum"><b>${f2(k.T.cumAmt)}</b></td><td></td></tr></tfoot></table></div>`;
  }
  if(exRows.length)h+=`<h3 style="margin:14px 0 6px">รายการอื่นๆ นอกตารางห้อง</h3>`+lineTbl(exRows);
  return h;
}

function viewSub(){
  const s=by('subs',UI.sub);if(!s){UI.sub=null;return viewCrew()}const c=by('crews',s.crewId);const k=calcCrew(c,s.no);
  let h=`<div class="row" style="margin-bottom:8px"><button class="btn" data-act="backcrew">← ${esc(c.name)}</button><h1 style="font-size:20px;margin-right:auto">งวดที่ ${s.no} · ${esc(c.name)}</h1>
   <button class="btn" data-act="docsub" data-id="${s.id}">ดูเอกสาร / PDF</button><button class="btn" data-act="xlssub" data-id="${s.id}">Excel</button><button class="btn bad" data-act="delsub">ลบงวด</button></div>
   <div class="panel"><div class="grid"><label class="f">ตั้งแต่วันที่<input type="date" data-s="from" value="${esc(s.from||'')}"></label><label class="f">ถึงวันที่<input type="date" data-s="to" value="${esc(s.to||'')}"></label><label class="f">วันที่ส่งเอกสาร<input type="date" data-s="date" value="${esc(s.date||'')}"></label>
   <label class="f">หมายเหตุงวด<input type="text" data-s="note" value="${esc(s.note||'')}"></label><label class="f" style="flex-direction:row;align-items:center;gap:8px;margin-top:18px"><input type="checkbox" data-s="sent" ${s.sent?'checked':''}> ส่งเอกสารแล้ว</label></div></div>
   <div class="stats" id="substats">${subStats(k)}</div>`;
  if(!k.rows.length)return h+'<div class="empty">ชุดนี้ยังไม่มีรายการงาน กลับไปเพิ่มรายการ / เลือกห้องก่อน</div>'+subAttach(s);
  const exRows=k.rows.filter(r=>r.extra);
  const lineTbl=rows=>`<div class="tblwrap"><table class="grid-t ed"><thead><tr><th>ชั้น</th><th>รายการ</th><th class="r">ปริมาณ</th><th>หน่วย</th><th class="r">ค่าแรง</th><th class="r">ก่อนหน้า</th><th style="width:110px">งวดนี้</th><th style="width:84px">% งวดนี้</th><th>ลัด</th><th class="r">สะสม</th><th class="r">% สะสม</th><th class="r">บาทงวดนี้</th><th>หมายเหตุ</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td>${esc(r.floor)}</td><td>${esc(r.name)}</td><td class="r mono">${fq(r.qty)}</td><td>${esc(r.unit)}</td><td class="r mono">${f2(r.rate)}</td><td class="r mono muted" data-c="${r.key}:prev">${r.prev?fq(r.prev):'-'}</td><td><input type="number" step="any" data-e="${r.key}" value="${r.cur||''}" placeholder="0"></td><td><input type="number" step="any" data-pe="${r.key}" value="${r.qty&&r.cur?+(r.cur/r.qty*100).toFixed(2):''}" placeholder="%" style="width:74px"></td>
     <td class="nw">${[25,50,100].map(p=>`<button class="btn sm" data-act="pctline" data-key="${r.key}" data-p="${p}">${p===100?'เสร็จ':'+'+p+'%'}</button>`).join('')}</td><td class="r mono" data-c="${r.key}:cum">${fq(r.cum)}</td><td class="r mono" data-c="${r.key}:pct">${pct(r.pct)}</td><td class="r mono" data-c="${r.key}:amt">${f2(r.curAmt)}</td><td class="small" style="color:var(--warn)">${esc(rowNote(r))}</td></tr>`).join('')}</tbody></table></div>`;
  if(c.mode==='room'){
    const items=itemAgg(k);const RA=roomAmounts(k);const rooms=roomsOf(c).filter(r=>items.some(it=>k.rows.some(x=>x.key===r.id+'~'+it.boqId)));let fl=null;const rowOf=new Map(k.rows.map(r=>[r.key,r]));
    h+=subRoomView(c,k,items,RA,rooms,rowOf,exRows,lineTbl);
  }else{
    h+=`<div class="row" style="margin:8px 0"><button class="btn sm" data-act="fillall">เติมคงเหลือทั้งหมดเป็น “เสร็จ”</button><button class="btn sm" data-act="clearall">ล้างงวดนี้</button><span class="small muted">กรอกปริมาณที่ทำเสร็จในงวดนี้ (ไม่ใช่สะสม) หรือกด % ลัด</span></div>
    ${lineTbl(k.rows)}`;
  }
  return h+subAttach(s);
}
function subAttach(s){
  const pl=s.plans||[],ph=s.photos||[];
  return`<div class="panel" style="margin-top:14px"><h3>แบบประกอบ <span class="chip">${pl.length}</span><button class="btn sm" style="margin-left:auto" data-act="addplan">＋ เลือกแบบจากคลัง</button></h3>
   ${pl.length?`<div class="cards">${pl.map(p=>`<div class="card"><div class="thumb" data-act="markplan" data-id="${p.id}">${annotatedSvg(imgSrc(p.imgId),p.w,p.h,p.shapes||[],[],{scale:p.sym})}</div><div class="body"><input type="text" data-sp="${p.id}" value="${esc(p.name||'')}"><div class="row" style="margin-top:6px"><button class="btn sm" data-act="markplan" data-id="${p.id}">วาดทับ / ระบายสี</button><button class="btn sm bad" data-act="delplan" data-id="${p.id}">เอาออก</button></div></div></div>`).join('')}</div>`:'<div class="empty small">ยังไม่ได้แนบแบบ — ใช้แสดงตำแหน่งงานที่ส่ง (ระบายสีโซนบนแบบได้)</div>'}</div>
   <div class="panel"><h3>รูปถ่ายประกอบ <span class="chip">${ph.length}</span><span style="margin-left:auto" class="row"><label class="btn sm pri" for="subcam">📷 ถ่ายรูป</label><input id="subcam" type="file" accept="image/*" capture="environment" hidden><label class="btn sm" for="subpic">🖼 อัปโหลด</label><input id="subpic" type="file" accept="image/*" multiple hidden></span></h3>
   ${ph.length?`<div class="cards">${ph.map((p,i)=>`<div class="card"><div class="thumb" data-act="markphoto" data-id="${p.id}">${annotatedSvg(imgSrc(p.imgId),p.w,p.h,p.shapes||[],[])}</div><div class="body"><div class="row"><b class="mono">รูปที่ ${i+1}</b><span style="margin-left:auto" class="row"><button class="btn sm" data-act="mvphoto" data-id="${p.id}" data-d="-1" ${i===0?'disabled':''}>←</button><button class="btn sm" data-act="mvphoto" data-id="${p.id}" data-d="1" ${i===ph.length-1?'disabled':''}>→</button></span></div>
     <input type="text" data-sph="${p.id}" value="${esc(p.caption||'')}" placeholder="คำอธิบาย"><div class="row" style="margin-top:6px"><button class="btn sm" data-act="markphoto" data-id="${p.id}">ลูกศร / ข้อความ</button><button class="btn sm bad" data-act="delphoto" data-id="${p.id}">ลบ</button></div></div></div>`).join('')}</div>`:'<div class="empty small">ยังไม่มีรูป — ถ่ายหรืออัปโหลดรูปหน้างานแนบกับเอกสารส่งงานนี้</div>'}</div>`;
}
const subStats=k=>`<div><b class="mono">${f2(k.T.amt)}</b><span>มูลค่าสัญญา</span></div><div><b class="mono">${f2(k.T.prevAmt)}</b><span>เบิกก่อนหน้า</span></div><div><b class="mono" style="color:var(--accent)">${f2(k.T.curAmt)}</b><span>เบิกงวดนี้ (${pct(k.T.curPct)})</span></div><div><b class="mono" style="color:var(--good)">${f2(k.T.cumAmt)}</b><span>สะสม (${pct(k.T.pct)})</span></div>`;

/* ---- BOQ ---- */
const NOGRP='(ไม่ระบุหมวด)';
UI.rsel=new Set();UI.bg='';UI.bcol=new Set();UI.bq='';
function splitCell(x){
  const t=x.it,Q=num(t.qty);const parts=[];
  S.crews.forEach(c=>(c.lines||[]).forEach(l=>{if(l.boqId===t.id){const p=num(l.pct)>0?num(l.pct):(Q?+(num(l.qty)/Q*100).toFixed(1):0);parts.push({n:c.name,p})}}));
  const tot=+parts.reduce((a,s)=>a+s.p,0).toFixed(2);
  return`<button class="btn sm" data-act="splitboq" data-id="${t.id}">÷ แบ่ง %</button>${parts.length?`<div class="small" style="margin-top:4px;line-height:1.5">${parts.map(s=>`${esc(s.n)} <b>${s.p}%</b>`).join('<br>')}${Math.abs(tot-100)>0.01?`<br><span class="${tot>100?'bad':'warnt'}">รวม ${tot}%</span>`:''}</div>`:''}`}
/* ---- ราคาต่อห้อง (รวมทุกงาน) : ปริมาณของห้อง × ค่าแรง/หน่วยใน BOQ ---- */
UI.bv='boq';UI.rpx=new Set();UI.rpf='';UI.rpq='';
function roomPricing(b){
  const items=S.boq.filter(x=>x.building===b);const byId=new Map(items.map(x=>[x.id,x]));
  const rooms=S.rooms.filter(r=>r.building===b).sort((a,z)=>natCmp(a.floor,z.floor)||natCmp(a.name,z.name));
  const groups=[];
  const out=rooms.map(r=>{
    const lines=[];for(const[id,q]of Object.entries(r.qty||{})){const it=byId.get(id);const n=num(q);if(!it||!(n>0))continue;
      lines.push({it,group:it.group||NOGRP,qty:n,rate:num(it.rate),amt:n*num(it.rate)})}
    lines.sort((a,z)=>natCmp(a.group,z.group)||natCmp(a.it.name,z.it.name));
    const gs=new Map();lines.forEach(l=>{if(!groups.includes(l.group))groups.push(l.group);gs.set(l.group,(gs.get(l.group)||0)+l.amt)});
    return{room:r,lines,gs,total:lines.reduce((a,l)=>a+l.amt,0),noRate:lines.filter(l=>!l.rate).length}});
  groups.sort(natCmp);return{rooms:out,groups};
}
function viewRoomPrice(b){
  const P=roomPricing(b);const q=(UI.rpq||'').trim().toLowerCase();
  const floors=[...new Set(P.rooms.map(x=>x.room.floor||''))];
  const rs=P.rooms.filter(x=>(!UI.rpf||(x.room.floor||'')===UI.rpf)&&(!q||(x.room.name+' '+(x.room.floor||'')).toLowerCase().includes(q)));
  const bchips=S.project.buildings.map(x=>`<button class="chipbtn ${x===b?'on':''}" data-act="setb" data-v="${esc(x)}">${esc(x)} <small>${S.rooms.filter(r=>r.building===x).length}</small></button>`).join('');
  const grand=rs.reduce((a,x)=>a+x.total,0);const nor=rs.filter(x=>x.noRate).length;const ncol=P.groups.length;
  let h=`<div class="row" style="margin-bottom:8px"><h1 style="font-size:22px;margin-right:auto">BOQ · ราคาต่อห้อง (รวมทุกงาน)</h1><button class="btn" data-act="bview" data-v="boq">← รายการ BOQ</button><button class="btn" data-act="rpxls">Excel</button></div>
   <div class="chiprow"><span class="small muted">อาคาร</span>${bchips}</div>
   <div class="row" style="margin:6px 0 10px"><select id="rpf" style="width:auto"><option value="">ทุกชั้น</option>${floors.map(f=>`<option value="${esc(f)}" ${UI.rpf===f?'selected':''}>ชั้น ${esc(f||'-')}</option>`).join('')}</select><input type="search" id="rpq" placeholder="ค้นหาห้อง เช่น E101" value="${esc(UI.rpq||'')}" style="max-width:220px"><button class="btn sm" data-act="rpall">ขยายทุกห้อง</button><button class="btn sm" data-act="rpnone">ย่อทุกห้อง</button></div>
   <div class="stats"><div><b class="mono">${rs.length}</b><span>ห้อง</span></div><div><b class="mono" style="color:var(--accent)">${f2(grand)}</b><span>รวมมูลค่า (บาท)</span></div><div><b class="mono">${rs.length?f2(grand/rs.length):'-'}</b><span>เฉลี่ยต่อห้อง</span></div><div><b class="mono ${nor?'warnt':''}">${nor}</b><span>ห้องที่มีรายการไม่มีราคา</span></div></div>
   <p class="hint">ราคา = ปริมาณของห้อง (จากตารางห้อง) × ค่าแรง/หน่วยใน BOQ · งานที่นับเป็นจำนวน (เช่น ช่องสบู่ ช่อง / Floor drain ตัว) ให้เพิ่มเป็น ITEM ในตารางห้อง ตั้งหน่วยและค่าแรง/หน่วยในหน้า BOQ แล้วกรอกจำนวนต่อห้อง · กดชื่อห้องเพื่อดูรายละเอียด</p>`;
  if(!rs.length)return h+'<div class="empty">ยังไม่มีห้องที่มีปริมาณงาน — เพิ่มในแท็บ “ตารางห้อง”</div>';
  h+=`<div class="tblwrap"><table class="grid-t"><thead><tr><th>ห้อง</th>${P.groups.map(g=>`<th class="r">${esc(g)}</th>`).join('')}<th class="r">รวมต่อห้อง (บาท)</th></tr></thead><tbody>`;
  let fl=null;
  for(const x of rs){const r=x.room;
    if((r.floor||'')!==fl){fl=r.floor||'';const ft=rs.filter(y=>(y.room.floor||'')===fl).reduce((a,y)=>a+y.total,0);h+=`<tr class="band"><td colspan="${ncol+2}"><b>ชั้น ${esc(fl||'-')}</b> <span class="small muted" style="font-weight:400">รวม ${f2(ft)} บาท</span></td></tr>`}
    const open=UI.rpx.has(r.id);
    h+=`<tr class="${x.noRate?'overr':''}"><td><button class="btn sm" data-act="rpx" data-id="${r.id}" style="margin-right:6px">${open?'▼':'▶'}</button><b>${esc(r.name)}</b>${x.noRate?` <span class="small warnt">${x.noRate} รายการไม่มีราคา</span>`:''}</td>${P.groups.map(g=>`<td class="r mono">${x.gs.has(g)?f2(x.gs.get(g)):'-'}</td>`).join('')}<td class="r mono"><b>${f2(x.total)}</b></td></tr>`;
    if(open)h+=`<tr><td colspan="${ncol+2}" style="padding:6px 12px 12px 40px"><table class="grid-t"><thead><tr><th>รายการ</th><th class="r">ปริมาณ</th><th>หน่วย</th><th class="r">ค่าแรง/หน่วย</th><th class="r">บาท</th></tr></thead><tbody>
      ${(()=>{let g=null,s='';for(const l of x.lines){if(l.group!==g){g=l.group;s+=`<tr class="band"><td colspan="5"><b>${esc(g)}</b> <span class="small muted" style="font-weight:400">รวม ${f2(x.gs.get(g))} บาท</span></td></tr>`}
        s+=`<tr><td>${esc(l.it.name)}</td><td class="r mono">${fq(l.qty)}</td><td>${esc(l.it.unit||'')}</td><td class="r mono ${l.rate?'':'warnt'}">${l.rate?f2(l.rate):'ไม่มีราคา'}</td><td class="r mono">${f2(l.amt)}</td></tr>`}return s})()}
      </tbody><tfoot><tr><td colspan="4" class="r"><b>รวมราคางานต่อห้อง ${esc(r.name)}</b></td><td class="r mono"><b>${f2(x.total)}</b></td></tr></tfoot></table></td></tr>`}
  h+=`</tbody><tfoot><tr><td><b>รวมทั้งหมด</b></td>${P.groups.map(g=>`<td class="r mono"><b>${f2(rs.reduce((a,x)=>a+(x.gs.get(g)||0),0))}</b></td>`).join('')}<td class="r mono"><b>${f2(grand)}</b></td></tr></tfoot></table></div>`;
  return h;
}
function viewBoq(){
  if(UI.bv==='room')return viewRoomPrice(UI.b||S.project.buildings[0]);
  const b=UI.b||S.project.buildings[0];const idx=new Map(S.boq.map((x,i)=>[x.id,i]));
  let cs=boqControl(b).sort((a,z)=>idx.get(a.it.id)-idx.get(z.it.id));
  const gname=x=>x.it.group||NOGRP;
  const groups=[];cs.forEach(x=>{const g=gname(x);if(!groups.includes(g))groups.push(g)});
  const q=(UI.bq||'').trim().toLowerCase();
  const view=cs.filter(x=>(!UI.bg||gname(x)===UI.bg)&&(!q||(x.it.name+' '+(x.it.group||'')).toLowerCase().includes(q)));
  const stat=g=>{const l=cs.filter(x=>gname(x)===g);return{n:l.length,warn:l.filter(x=>x.over||x.capOver).length,nob:l.filter(x=>x.noBoq).length,amt:l.reduce((a,x)=>a+num(x.it.qty)*num(x.it.rate),0)}};
  const bchips=S.project.buildings.map(x=>`<button class="chipbtn ${x===b?'on':''}" data-act="setb" data-v="${esc(x)}">${esc(x)} <small>${S.boq.filter(i=>i.building===x).length}</small></button>`).join('');
  const gchips=`<button class="chipbtn ${!UI.bg?'on':''}" data-act="bgrp" data-g="">ทุกหมวด <small>${cs.length}</small></button>`+groups.map(g=>{const st=stat(g);return`<button class="chipbtn ${UI.bg===g?'on':''}" data-act="bgrp" data-g="${esc(g)}">${esc(g)} <small>${st.n}</small>${st.warn?'<i class="dot bad"></i>':''}</button>`}).join('');
  let h=`<div class="row" style="margin-bottom:8px"><h1 style="font-size:22px;margin-right:auto">BOQ ปริมาณงาน</h1><button class="btn" data-act="bview" data-v="room">ราคาต่อห้อง</button><button class="btn" data-act="impboq">นำเข้า Excel</button><button class="btn" data-act="newgrp">＋ หมวดงาน</button><button class="btn pri" data-act="newboq">＋ เพิ่มรายการ</button></div>
   <div class="chiprow"><span class="small muted">อาคาร</span>${bchips}</div>
   <div class="chiprow"><span class="small muted">หมวดงาน</span>${gchips}</div>
   <div class="row" style="margin:6px 0 10px"><input type="search" id="bsearch" placeholder="ค้นหารายการ / หมวด" value="${esc(UI.bq||'')}" style="max-width:280px"><button class="btn sm" data-act="expall">ขยายทุกหมวด</button><button class="btn sm" data-act="collall">ย่อทุกหมวด</button><span class="small muted" style="margin-left:auto">${cs.length} รายการ · ${groups.length} หมวด</span></div>
   <datalist id="grplist">${groups.filter(g=>g!==NOGRP).map(g=>`<option value="${esc(g)}">`).join('')}</datalist>
   <p class="hint">แยกตามอาคารและหมวดงาน ใช้คุมงบ: ปริมาณ BOQ เทียบกับที่จัดสรรให้ชุดต่างๆ รายการที่ชุดช่างทำแต่ไม่มี BOQ คลุมจะถูกหมายเหตุในเอกสารให้อัตโนมัติ · เปลี่ยนช่อง “หมวด” ท้ายแถวเพื่อย้ายรายการไปหมวดอื่น</p>
   <div class="tblwrap"><table class="grid-t ed"><thead><tr><th style="min-width:240px">รายการ</th><th style="width:70px">หน่วย</th><th style="width:100px">ปริมาณงาน</th><th style="width:90px">ค่าแรง/หน่วย</th><th style="width:90px">BOQ</th><th style="width:90px">80% BOQ</th><th class="r">จัดสรรให้ชุด</th><th class="r">คงเหลือ</th><th class="r">ปริมาณห้องรวม</th><th class="r">เบิกสะสม</th><th style="min-width:170px">แบ่ง % ให้ชุด</th><th style="width:150px">หมายเหตุ</th><th style="width:130px">หมวด</th><th></th></tr></thead><tbody>`;
  const shown=[];view.forEach(x=>{const g=gname(x);if(!shown.includes(g))shown.push(g)});
  for(const g of shown){
    const st=stat(g);const col=UI.bcol.has(g)&&!q;
    h+=`<tr class="band"><td colspan="14"><button class="btn sm" data-act="togg" data-g="${esc(g)}" style="margin-right:8px">${col?'▶':'▼'}</button><b>${esc(g)}</b> <span class="small muted" style="font-weight:400">${st.n} รายการ · มูลค่า ${f2(st.amt)} บาท${st.warn?` · <span class="bad">เกิน ${st.warn}</span>`:''}${st.nob?` · <span class="warnt">ไม่มี BOQ ${st.nob}</span>`:''}</span>
      <span style="float:right"><button class="btn sm" data-act="newboqg" data-g="${esc(g===NOGRP?'':g)}">＋ รายการ</button> ${g!==NOGRP?`<button class="btn sm" data-act="rengrp" data-g="${esc(g)}">เปลี่ยนชื่อหมวด</button>`:''}</span></td></tr>`;
    if(col)continue;
    h+=view.filter(x=>gname(x)===g).map(x=>{const t=x.it;return`<tr class="${x.over||x.capOver?'overr':''}"><td><input type="text" data-b="${t.id}:name" value="${esc(t.name)}"></td><td><input type="text" data-b="${t.id}:unit" value="${esc(t.unit||'')}"></td><td><input type="number" step="any" data-b="${t.id}:qty" value="${t.qty||''}"></td><td><input type="number" step="any" data-b="${t.id}:rate" value="${t.rate||''}"></td><td><input type="number" step="any" data-b="${t.id}:bq" value="${t.bq||''}"></td><td><input type="number" step="any" data-b="${t.id}:cap" value="${t.cap||''}"></td>
    <td class="r mono">${fq(x.alloc)}</td><td class="r mono ${x.remain<0?'bad':''}">${x.qty?fq(x.remain):'-'}</td><td class="r mono ${x.roomTotal&&x.qty&&Math.abs(x.roomTotal-x.qty)>.5?'warnt':''}">${x.roomTotal?fq(x.roomTotal):'-'}</td><td class="r mono">${fq(x.done)}</td><td>${splitCell(x)}</td><td><input type="text" data-b="${t.id}:note" value="${esc(t.note||'')}">${x.over?'<div class="small bad">จัดสรรเกิน BOQ</div>':''}${x.noBoq?'<div class="small warnt">ไม่มี BOQ คลุม</div>':''}${x.capOver?`<div class="small bad">เกิน 80% BOQ${x.shared?` (รวมรายการที่ใช้ BOQ เดียวกัน ${fq(x.capSum)} / ${fq(x.cap)})`:''}</div>`:''}</td><td><input type="text" list="grplist" data-bg="${t.id}" value="${esc(t.group||'')}" placeholder="หมวด"></td><td><button class="btn sm bad" data-act="delboq" data-id="${t.id}">ลบ</button></td></tr>`}).join('')}
  if(!shown.length)h+='<tr><td colspan="14" class="empty small">ไม่พบรายการ — นำเข้าจาก Excel หรือเพิ่มเอง</td></tr>';
  return h+'</tbody></table></div>';
}

/* ---- ตารางห้อง ---- */
function viewRooms(){
  const b=UI.b||S.project.buildings[0];const rooms=S.rooms.filter(r=>r.building===b).sort((a,z)=>natCmp(a.floor,z.floor)||natCmp(a.name,z.name));
  const its=S.boq.filter(x=>x.building===b&&(x.tile||rooms.some(r=>(r.qty||{})[x.id]))).sort((a,z)=>natCmp(a.name,z.name));let fl=null;
  const tot=it=>rooms.reduce((a,r)=>a+num((r.qty||{})[it.id]),0);
  let h=`<div class="row" style="margin-bottom:10px"><h1 style="font-size:22px;margin-right:auto">ตารางห้อง · ปริมาณ ตร.ม. ต่อ ITEM</h1><select id="fb" style="width:auto">${bOpts(b)}</select><button class="btn" data-act="impRooms">นำเข้า Excel</button><button class="btn" data-act="newitem">＋ ITEM</button><button class="btn" data-act="bulkrooms">＋ หลายห้อง/หลายชั้น</button><button class="btn" data-act="copyfloor">⧉ คัดลอกชั้น</button><button class="btn pri" data-act="newroom">＋ ห้อง</button></div>
   <p class="hint">ทางลัด: ก๊อปช่วงเซลล์จาก Excel แล้ววาง (Ctrl+V) ลงช่องในตารางได้เลย (วางเกินแถวสุดท้ายจะสร้างห้องใหม่ให้) · “＋ หลายห้อง/หลายชั้น” สร้างห้องทุกชั้นทีเดียว · “คัดลอกชั้น” ทำชั้น 2-7 ให้เหมือนชั้น 1<br>ปริมาณของแต่ละห้อง/ITEM ใช้เป็นตัวคุมงบ: ผลรวมเทียบกับ BOQ ด้านล่างตาราง แล้วเลือกห้องให้แต่ละชุดในหน้าชุดช่าง</p>
   ${rooms.length?`<div class="row" style="margin:6px 0 8px" id="rselbar"><label class="small row" style="gap:4px">เลือกทั้งชั้น <select id="rsf" style="width:auto"><option value="">— ชั้น —</option>${[...new Set(rooms.map(r=>r.floor||''))].map(f=>`<option value="${esc(f)}">${esc(f||'-')}</option>`).join('')}</select></label><button class="btn sm" data-act="rselnone">ล้างที่เลือก</button><button class="btn sm bad" data-act="delrooms" id="delrooms">ลบที่เลือก (${UI.rsel.size})</button><span class="small muted">ติ๊กหลายห้อง (หรือเลือกทั้งชั้น) แล้วกดลบทีเดียว</span></div>`:''}
   ${its.length?`<div class="tblwrap"><table class="grid-t ed"><thead><tr><th style="width:34px"><input type="checkbox" data-rsall="1" title="เลือกทุกห้องที่แสดง" ${rooms.length&&rooms.every(r=>UI.rsel.has(r.id))?'checked':''}></th><th style="width:70px">ชั้น</th><th style="min-width:150px">ห้อง</th>${its.map(i=>`<th style="min-width:100px">${esc(i.name)}<div class="small muted">${esc(i.unit||'')}</div></th>`).join('')}<th></th></tr></thead><tbody>
   ${rooms.map(r=>`<tr class="${UI.rsel.has(r.id)?'selrow':''}"><td><input type="checkbox" data-rs="${r.id}" ${UI.rsel.has(r.id)?'checked':''}></td><td><input type="text" data-rm2="${r.id}:floor" value="${esc(r.floor||'')}"></td><td><input type="text" data-rm2="${r.id}:name" value="${esc(r.name)}"></td>${its.map(i=>`<td><input type="number" step="any" data-r="${r.id}:${i.id}" value="${(r.qty||{})[i.id]||''}"></td>`).join('')}<td><button class="btn sm bad" data-act="delroom" data-id="${r.id}">ลบ</button></td></tr>`).join('')||`<tr><td colspan="${4+its.length}" class="empty small">ยังไม่มีห้อง</td></tr>`}</tbody>
   <tfoot><tr><td colspan="3" class="r"><b>รวมตามห้อง</b></td>${its.map(i=>`<td class="mono" data-rt="${i.id}"><b>${fq(tot(i))}</b></td>`).join('')}<td></td></tr>
   <tr><td colspan="3" class="r"><b>BOQ</b></td>${its.map(i=>`<td class="mono ${i.qty&&Math.abs(tot(i)-i.qty)>.5?'warnt':''}">${i.qty?fq(i.qty):'<span class="chip warn">ไม่มี BOQ</span>'}</td>`).join('')}<td></td></tr></tfoot></table></div>`
   :'<div class="empty">ยังไม่มี ITEM / ห้อง — กด “นำเข้า Excel” หรือ “＋ ITEM” แล้ว “＋ ห้อง”</div>'}`;
  return h;
}

/* ---- คลังแบบ ---- */
function viewPlans(){
  const b=UI.b||S.project.buildings[0];const list=S.plans.filter(p=>p.building===b);
  const files=new Map();list.forEach(p=>{const k=p.fileId||p.id;if(!files.has(k))files.set(k,[]);files.get(k).push(p)});
  let h=`<div class="row" style="margin-bottom:10px"><h1 style="font-size:22px;margin-right:auto">คลังแบบ</h1><select id="fb" style="width:auto">${bOpts(b)}</select><label class="btn pri" for="planf">＋ อัปโหลดแบบ (PDF / รูป)</label><input id="planf" type="file" accept="application/pdf,image/*" multiple hidden></div>
   <p class="hint">อัปโหลดครั้งเดียว แล้วเลือกไปแนบในเอกสารส่งงานของแต่ละชุด ระบายสีโซน/ใส่ข้อความทับบนแบบได้ (แยกกันในแต่ละงวด) · PDF หลายหน้าจะแยกเป็นหน้าให้</p>`;
  for(const[k,pg] of files){pg.sort((a,z)=>(a.page||1)-(z.page||1));
    h+=`<div class="ghead l1"><b>${esc(pg[0].fileName||pg[0].name)}</b><span class="small muted">${pg.length} หน้า</span><button class="btn sm bad" style="margin-left:auto" data-act="delplanfile" data-id="${k}">ลบไฟล์</button></div>
     <div class="cards">${pg.map(p=>`<div class="card"><div class="thumb" data-act="viewplan" data-id="${p.id}">${annotatedSvg(imgSrc(p.imgId),p.w,p.h,p.shapes||[],[])}</div><div class="body"><input type="text" data-pl="${p.id}" value="${esc(p.name)}"></div></div>`).join('')}</div>`}
  if(!files.size)h+='<div class="empty">ยังไม่มีแบบของอาคารนี้</div>';
  return h;
}
/* ---- ตั้งค่า ---- */
function viewSet(){
  const P=S.project;
  return`<h1 style="font-size:22px;margin-bottom:10px">ตั้งค่า</h1>
   <div class="panel"><h3>โครงการ</h3><div class="grid g2"><label class="f">ชื่อโครงการ<input type="text" data-p="name" value="${esc(P.name)}"></label><label class="f">ผู้ว่าจ้าง<input type="text" data-p="client" value="${esc(P.client||'')}"></label><label class="f">หมวดงาน<input type="text" data-p="category" value="${esc(P.category||'')}"></label><label class="f">บริษัท<input type="text" data-p="company" value="${esc(P.company||'')}"></label>
   <label class="f">อาคาร (คั่นด้วยจุลภาค)<input type="text" id="bldg" value="${esc(P.buildings.join(', '))}"></label></div></div>
   <div class="panel"><h3>โลโก้บริษัท <span class="small muted" style="font-weight:400">แสดงมุมซ้ายของเอกสารทุกใบและแถบด้านบน</span></h3><div class="row">${P.logoId&&imgSrc(P.logoId)?`<img src="${imgSrc(P.logoId)}" style="height:56px;background:#fff;border:1px solid var(--line);border-radius:6px;padding:3px">`:'<span class="muted small">ยังไม่มีโลโก้</span>'}<label class="btn" for="logof">${P.logoId?'เปลี่ยนโลโก้':'อัปโหลดโลโก้'}</label><input id="logof" type="file" accept="image/*" hidden>${P.logoId?'<button class="btn bad sm" data-act="dellogo">ลบ</button>':''}</div></div>
   <div class="panel"><h3>ระบบออนไลน์ (Supabase)</h3><div class="row"><span id="sync2">${statusHTML()}</span>${MODE.kind==='cloud'?`<span class="small">เข้าสู่ระบบ: ${esc(MODE.email)}</span><button class="btn sm" data-act="syncnow">ซิงก์ตอนนี้</button><button class="btn sm" data-act="logout">ออกจากระบบ</button>`:cloudOn()?'<button class="btn pri sm" data-act="login">เข้าสู่ระบบ</button><span class="small muted">ตอนนี้เก็บเฉพาะในเครื่องนี้</span>':'<span class="small muted">ยังไม่ได้ตั้งค่า config.js — เก็บในเครื่องนี้</span>'}</div>
    ${MODE.kind==='cloud'?`<p class="hint" style="margin-top:8px">ข้อมูลเงินถูกตั้งเป็น “เฉพาะสมาชิกที่ล็อกอิน” เจ้าของโครงการ (คนแรกที่ซิงก์) ให้สิทธิ์แก้ไขทีมงานได้ด้านล่าง</p><label class="f">อีเมลผู้ร่วมแก้ไข (คั่นด้วยจุลภาค)<input type="text" id="eds" value="${esc((P.editors||[]).join(', '))}"></label><div class="row" style="margin-top:6px"><button class="btn sm" data-act="saveacl">บันทึกสิทธิ์</button></div>`:''}</div>
   <div class="panel"><h3>สำรอง / ย้ายข้อมูล</h3><div class="row"><button class="btn" data-act="bkup">ดาวน์โหลดไฟล์สำรอง (JSON)</button><label class="btn" for="bkin">กู้คืนจากไฟล์สำรอง</label><input type="file" id="bkin" accept=".json" hidden><button class="btn" data-act="sample">โหลดข้อมูลตัวอย่าง (BOQ/ห้อง อาคาร D)</button><button class="btn bad" data-act="wipe">ล้างข้อมูลทั้งหมดในเครื่อง</button></div></div>
   <div class="credit"><b>Work Desk</b><span>พัฒนาโดย KRITTANAI</span></div>`;
}

function render(){
  pageAnim(UI.tab+'|'+(UI.crew||'')+'|'+(UI.sub||''));
  $('#top').innerHTML=viewTop();
  const m=$('#main');const sc=window.scrollY;
  m.innerHTML=UI.sub?viewSub():UI.crew?viewCrew():UI.tab==='crews'?viewCrews():UI.tab==='boq'?viewBoq():UI.tab==='rooms'?viewRooms():UI.tab==='plans'?viewPlans():UI.tab==='set'?viewSet():viewHome();
  window.scrollTo(0,sc);
}

/* animation เปลี่ยนหน้า: เล่นเฉพาะเมื่อเปลี่ยนหน้า/แท็บ (ไม่เล่นตอนรีเฟรชข้อมูล) */
let _pgKey='';
function pageAnim(key){if(key===_pgKey)return;_pgKey=key;const m=document.getElementById('main');if(!m)return;m.classList.remove('pgin');void m.offsetWidth;m.classList.add('pgin');clearTimeout(pageAnim.t);pageAnim.t=setTimeout(()=>m.classList.remove('pgin'),800)}
