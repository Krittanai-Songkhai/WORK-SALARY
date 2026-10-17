/* ===== หน้าจอ ===== */
const UI={tab:'home',b:'',kind:'',crew:null,sub:null,q:''};
const bOpts=(sel,all)=>(all?`<option value="" ${sel===''?'selected':''}>${all}</option>`:'')+S.project.buildings.map(b=>`<option ${b===sel?'selected':''}>${esc(b)}</option>`).join('');
const kindOpts=(sel,all)=>(all?`<option value="">${all}</option>`:'')+Object.keys(KIND).map(k=>`<option value="${k}" ${k===sel?'selected':''}>${KIND[k]}</option>`).join('');
const bar=p=>`<div class="pbar"><i style="width:${Math.min(100,Math.max(0,p))}%"></i></div>`;
const TABS=[['home','ภาพรวม'],['crews','ชุดช่าง'],['boq','BOQ'],['rooms','ตารางห้อง'],['plans','แบบ'],['set','ตั้งค่า']];

function viewTop(){
  return`${S.project.logoId&&imgSrc(S.project.logoId)?`<img class="tlogo" src="${imgSrc(S.project.logoId)}" alt="">`:''}<div class="brand"><b>Work Desk</b><span>${esc(S.project.name)} · ส่งงาน / เบิกผลงาน</span></div>
   <div class="nav">${TABS.map(t=>`<button data-act="tab" data-v="${t[0]}" aria-current="${UI.tab===t[0]&&!UI.crew}">${t[1]}</button>`).join('')}</div><span id="sync">${statusHTML()}</span>`;
}

/* ---- ภาพรวม ---- */
function viewHome(){
  const cs=S.crews.filter(c=>(!UI.b||c.building===UI.b)&&(!UI.kind||c.kind===UI.kind));
  const act=cs.filter(c=>!c.skip);const ks=act.map(c=>({c,k:calcCrew(c)}));
  const T=ks.reduce((a,x)=>({amt:a.amt+x.k.T.amt,cum:a.cum+x.k.T.cumAmt,cur:a.cur+x.k.T.curAmt}),{amt:0,cum:0,cur:0});
  const noRows=act.filter(c=>!crewRows(c).length).length;const miss=unlinkedCount();
  let h=`<div class="row" style="margin-bottom:10px"><h1 style="font-size:22px;margin-right:auto">ภาพรวมส่งงาน / เบิกผลงาน</h1>
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
  h+=c.mode==='room'?crewRoomPanel(c,bo):crewLinePanel(c,k,bo);
  h+=`<div class="panel"><h3>งวดส่งงาน / เบิกผลงาน <button class="btn pri sm" data-act="newsub" style="margin-left:auto">＋ เริ่มงวดใหม่ (งวดที่ ${nextNo(c)})</button></h3>
   ${subs.length?`<div class="tblwrap"><table class="grid-t"><thead><tr><th>งวด</th><th>ช่วงเวลา</th><th class="r">เบิกงวดนี้ (บาท)</th><th class="r">สะสม (บาท)</th><th>%</th><th>สถานะ</th><th></th></tr></thead><tbody>
    ${subs.map(s=>{const kk=calcCrew(c,s.no);return`<tr><td><b>${s.no}</b></td><td class="small">${esc([s.from&&fmtShort(s.from),s.to&&fmtShort(s.to)].filter(Boolean).join(' – ')||fmtShort(s.date))}</td><td class="r mono">${f2(kk.T.curAmt)}</td><td class="r mono">${f2(kk.T.cumAmt)}</td><td class="small">${pct(kk.T.pct)}</td><td>${s.sent?'<span class="chip good">ส่งแล้ว</span>':'<span class="chip">ร่าง</span>'}</td>
     <td class="r"><button class="btn sm" data-act="opensub" data-id="${s.id}">บันทึกปริมาณ</button> <button class="btn sm" data-act="docsub" data-id="${s.id}">เอกสาร</button></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty small">ยังไม่มีงวด กด “เริ่มงวดใหม่” เพื่อกรอกปริมาณที่ทำเสร็จ</div>'}</div>`;
  return h;
}
function crewLinePanel(c,k,bo){
  const boOpt=sel=>`<option value="">— ไม่มี BOQ —</option>${bo.map(b=>`<option value="${b.id}" ${b.id===sel?'selected':''}>${esc((b.group?b.group+' · ':'')+b.name)}</option>`).join('')}`;
  const cr=Object.fromEntries(boqControl(c.building).map(x=>[x.it.id,x]));
  return`<div class="panel"><h3>รายการงาน / ราคาจัดจ้างของชุด <span class="small muted" style="font-weight:400">(ปริมาณ × ค่าแรง/หน่วย = มูลค่าสัญญา)</span><span style="margin-left:auto" class="row"><button class="btn sm" data-act="fromboq">＋ เพิ่มจาก BOQ</button><button class="btn sm" data-act="newline">＋ เพิ่มรายการ</button></span></h3>
   <div class="tblwrap"><table class="grid-t ed"><thead><tr><th style="width:70px">ชั้น</th><th>รายการ</th><th style="width:90px">ปริมาณ</th><th style="width:70px">หน่วย</th><th style="width:100px">ค่าแรง/หน่วย</th><th class="r" style="width:110px">บาท</th><th style="width:200px">BOQ ที่คลุม</th><th style="width:150px">หมายเหตุ</th><th></th></tr></thead><tbody>
   ${(c.lines||[]).map(l=>{const b=l.boqId&&cr[l.boqId];const warn=(!b||b.noBoq)?'ไม่มี BOQ คลุม':b.over?'จัดสรรเกิน BOQ':'';return`<tr><td><input type="text" data-l="${l.id}:floor" value="${esc(l.floor)}"></td><td><input type="text" data-l="${l.id}:name" value="${esc(l.name)}"></td><td><input type="number" step="any" data-l="${l.id}:qty" value="${l.qty}"></td><td><input type="text" data-l="${l.id}:unit" value="${esc(l.unit)}"></td><td><input type="number" step="any" data-l="${l.id}:rate" value="${l.rate}"></td>
    <td class="r mono" data-amt="${l.id}">${f2(num(l.qty)*num(l.rate))}</td><td><select data-l="${l.id}:boqId">${boOpt(l.boqId)}</select>${warn?`<div class="small" style="color:var(--warn)">${warn}</div>`:''}</td><td><input type="text" data-l="${l.id}:note" value="${esc(l.note||'')}" placeholder="${b?'':'ระบุเหตุที่ไม่มี BOQ'}"></td><td><button class="btn sm bad" data-act="delline" data-id="${l.id}">ลบ</button></td></tr>`}).join('')||`<tr><td colspan="9" class="empty small">ยังไม่มีรายการ</td></tr>`}
   </tbody><tfoot><tr><td colspan="5" class="r"><b>รวมมูลค่าสัญญา</b></td><td class="r mono" id="lntot"><b>${f2(k.T.amt)}</b></td><td colspan="3"></td></tr></tfoot></table></div></div>`;
}
function crewRoomPanel(c,bo){
  const ctl=Object.fromEntries(boqControl(c.building).map(x=>[x.it.id,x]));
  const rooms=S.rooms.filter(r=>r.building===c.building).sort((a,b)=>natCmp(a.floor,b.floor)||natCmp(a.name,b.name));
  const other=(id,itId)=>{for(const x of S.crews){if(x.id!==c.id&&x.mode==='room'&&x.rates&&x.rates[itId]!==undefined&&(x.roomIds||[]).includes(id))return x.name}return''};
  const its=bo.filter(b=>b.tile||(c.rates&&c.rates[b.id]!==undefined)||S.rooms.some(r=>(r.qty||{})[b.id]));
  const floors=[...new Set(rooms.map(r=>r.floor||''))];
  return`<div class="panel"><h3>ITEM และค่าแรงของชุด <span class="small muted" style="font-weight:400">ติ๊กเฉพาะ ITEM ที่ชุดนี้ทำ แล้วใส่ค่าแรง/ตร.ม.</span></h3>
   ${its.length?`<div class="tblwrap"><table class="grid-t"><thead><tr><th>ใช้</th><th>ITEM</th><th>หน่วย</th><th class="r">BOQ</th><th class="r">จัดสรรแล้ว (ทุกชุด)</th><th style="width:130px">ค่าแรง/หน่วย</th></tr></thead><tbody>
    ${its.map(b=>{const on=c.rates&&c.rates[b.id]!==undefined;const x=ctl[b.id];return`<tr><td><input type="checkbox" data-ri="${b.id}" ${on?'checked':''}></td><td>${esc(b.name)}</td><td>${esc(b.unit)}</td><td class="r mono">${x&&x.qty?fq(x.qty):'<span class="chip warn">ไม่มี BOQ</span>'}</td><td class="r mono ${x&&x.over?'bad':''}">${x?fq(x.alloc):0}</td><td>${on?`<input type="number" step="any" data-rate="${b.id}" value="${c.rates[b.id]}">`:''}</td></tr>`}).join('')}</tbody></table></div>`
    :'<div class="empty small">ยังไม่มี ITEM กระเบื้องของอาคารนี้ — ไปแท็บ “ตารางห้อง” เพื่อนำเข้า/เพิ่มห้องและ ITEM</div>'}</div>
   <div class="panel"><h3>ห้องที่ชุดนี้รับผิดชอบ <span class="chip">${(c.roomIds||[]).length} ห้อง</span><span style="margin-left:auto" class="row"><button class="btn sm" data-act="roomsall">เลือกทุกห้อง</button><button class="btn sm" data-act="roomsnone">ล้าง</button></span></h3>
   ${rooms.length?floors.map(f=>{const rs=rooms.filter(r=>(r.floor||'')===f);const allOn=rs.every(r=>(c.roomIds||[]).includes(r.id));return`<div class="ghead l1"><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-rf="${esc(f)}" ${allOn?'checked':''}> <b>ชั้น ${esc(f||'-')}</b></label><span class="small muted">${rs.length} ห้อง</span></div>
    <div class="roomgrid">${rs.map(r=>{const on=(c.roomIds||[]).includes(r.id);const oth=crewItemIds(c).map(i=>other(r.id,i)).find(Boolean);return`<label class="rchip ${on?'on':''}"><input type="checkbox" data-rm="${r.id}" ${on?'checked':''}> <span>${esc(r.name)}</span>${oth?`<small class="warnt">ชุดอื่นรับแล้ว: ${esc(oth)}</small>`:''}</label>`}).join('')}</div>`}).join(''):'<div class="empty small">ยังไม่มีห้องของอาคารนี้</div>'}</div>`;
}

/* ---- บันทึกปริมาณงวด ---- */
function viewSub(){
  const s=by('subs',UI.sub);if(!s){UI.sub=null;return viewCrew()}const c=by('crews',s.crewId);const k=calcCrew(c,s.no);
  let h=`<div class="row" style="margin-bottom:8px"><button class="btn" data-act="backcrew">← ${esc(c.name)}</button><h1 style="font-size:20px;margin-right:auto">งวดที่ ${s.no} · ${esc(c.name)}</h1>
   <button class="btn" data-act="docsub" data-id="${s.id}">ดูเอกสาร / PDF</button><button class="btn" data-act="xlssub" data-id="${s.id}">Excel</button><button class="btn bad" data-act="delsub">ลบงวด</button></div>
   <div class="panel"><div class="grid"><label class="f">ตั้งแต่วันที่<input type="date" data-s="from" value="${esc(s.from||'')}"></label><label class="f">ถึงวันที่<input type="date" data-s="to" value="${esc(s.to||'')}"></label><label class="f">วันที่ส่งเอกสาร<input type="date" data-s="date" value="${esc(s.date||'')}"></label>
   <label class="f">หมายเหตุงวด<input type="text" data-s="note" value="${esc(s.note||'')}"></label><label class="f" style="flex-direction:row;align-items:center;gap:8px;margin-top:18px"><input type="checkbox" data-s="sent" ${s.sent?'checked':''}> ส่งเอกสารแล้ว</label></div></div>
   <div class="stats" id="substats">${subStats(k)}</div>`;
  if(!k.rows.length)return h+'<div class="empty">ชุดนี้ยังไม่มีรายการงาน กลับไปเพิ่มรายการ / เลือกห้องก่อน</div>'+subAttach(s);
  if(c.mode==='room'){
    const items=itemAgg(k);const rooms=roomsOf(c).filter(r=>items.some(it=>k.rows.some(x=>x.key===r.id+'~'+it.boqId)));let fl=null;const rowOf=new Map(k.rows.map(r=>[r.key,r]));
    h+=`<div class="row" style="margin:8px 0"><button class="btn sm" data-act="fillall">เติมคงเหลือทั้งหมดเป็น “เสร็จ”</button><button class="btn sm" data-act="clearall">ล้างงวดนี้</button><span class="small muted">กรอกปริมาณ ตร.ม. ที่ทำเสร็จในงวดนี้ (ไม่ใช่สะสม)</span></div>
     <div class="tblwrap"><table class="grid-t ed"><thead><tr><th>ห้อง</th>${items.map(it=>`<th colspan="3" class="c">${esc(it.name)}<div class="small muted">${f2(it.rate)} บาท/${esc(it.unit)}</div></th>`).join('')}<th></th></tr><tr><th></th>${items.map(()=>'<th class="r small">ปริมาณ</th><th class="r small">ก่อน</th><th class="small" style="width:96px">งวดนี้</th>').join('')}<th></th></tr></thead><tbody>
     ${rooms.map(r=>{let b='';if(r.floor!==fl){fl=r.floor;b=`<tr class="band"><td colspan="${2+items.length*3}">ชั้น ${esc(fl||'-')}</td></tr>`}
      return b+`<tr><td>${esc(r.name)}</td>${items.map(it=>{const x=rowOf.get(r.id+'~'+it.boqId);return x?`<td class="r mono">${fq(x.qty)}</td><td class="r mono muted" data-c="${x.key}:prev">${x.prev?fq(x.prev):'-'}</td><td><input type="number" step="any" data-e="${x.key}" value="${x.cur||''}" placeholder="0" class="${x.over?'bad':''}"></td>`:'<td class="c muted">·</td><td></td><td></td>'}).join('')}<td><button class="btn sm" data-act="fullroom" data-id="${r.id}">เสร็จทั้งห้อง</button></td></tr>`}).join('')}</tbody></table></div>`;
  }else{
    h+=`<div class="row" style="margin:8px 0"><button class="btn sm" data-act="fillall">เติมคงเหลือทั้งหมดเป็น “เสร็จ”</button><button class="btn sm" data-act="clearall">ล้างงวดนี้</button><span class="small muted">กรอกปริมาณที่ทำเสร็จในงวดนี้ (ไม่ใช่สะสม) หรือกด % ลัด</span></div>
    <div class="tblwrap"><table class="grid-t ed"><thead><tr><th>ชั้น</th><th>รายการ</th><th class="r">ปริมาณ</th><th>หน่วย</th><th class="r">ค่าแรง</th><th class="r">ก่อนหน้า</th><th style="width:110px">งวดนี้</th><th>ลัด</th><th class="r">สะสม</th><th class="r">% สะสม</th><th class="r">บาทงวดนี้</th><th>หมายเหตุ</th></tr></thead><tbody>
    ${k.rows.map(r=>`<tr><td>${esc(r.floor)}</td><td>${esc(r.name)}</td><td class="r mono">${fq(r.qty)}</td><td>${esc(r.unit)}</td><td class="r mono">${f2(r.rate)}</td><td class="r mono muted" data-c="${r.key}:prev">${r.prev?fq(r.prev):'-'}</td><td><input type="number" step="any" data-e="${r.key}" value="${r.cur||''}" placeholder="0"></td>
     <td class="nw">${[25,50,100].map(p=>`<button class="btn sm" data-act="pctline" data-key="${r.key}" data-p="${p}">${p===100?'เสร็จ':'+'+p+'%'}</button>`).join('')}</td><td class="r mono" data-c="${r.key}:cum">${fq(r.cum)}</td><td class="r mono" data-c="${r.key}:pct">${pct(r.pct)}</td><td class="r mono" data-c="${r.key}:amt">${f2(r.curAmt)}</td><td class="small" style="color:var(--warn)">${esc(rowNote(r))}</td></tr>`).join('')}</tbody></table></div>`;
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
function viewBoq(){
  const b=UI.b||S.project.buildings[0];const cs=boqControl(b).sort((a,z)=>natCmp(a.it.group,z.it.group)||natCmp(a.it.name,z.it.name));
  let h=`<div class="row" style="margin-bottom:10px"><h1 style="font-size:22px;margin-right:auto">BOQ ปริมาณงาน</h1><select id="fb" style="width:auto">${bOpts(b)}</select><button class="btn" data-act="impboq">นำเข้า Excel</button><button class="btn pri" data-act="newboq">＋ เพิ่มรายการ</button></div>
   <p class="hint">ใช้คุมงบ: ปริมาณ BOQ เทียบกับที่จัดสรรให้ชุดต่างๆ รายการที่ชุดช่างทำแต่ไม่มี BOQ คลุมจะถูกหมายเหตุในเอกสารให้อัตโนมัติ</p>
   <div class="tblwrap"><table class="grid-t ed"><thead><tr><th style="width:120px">หมวด/ชั้น</th><th>รายการ</th><th style="width:70px">หน่วย</th><th style="width:100px">ปริมาณงาน</th><th style="width:90px">ค่าแรง/หน่วย</th><th style="width:90px">BOQ</th><th style="width:90px">80% BOQ</th><th class="r">จัดสรรให้ชุด</th><th class="r">คงเหลือ</th><th class="r">ปริมาณห้องรวม</th><th class="r">เบิกสะสม (ปริมาณ)</th><th style="width:150px">หมายเหตุ</th><th></th></tr></thead><tbody>
   ${cs.map(x=>{const t=x.it;return`<tr class="${x.over||x.capOver?'overr':''}"><td><input type="text" data-b="${t.id}:group" value="${esc(t.group||'')}"></td><td><input type="text" data-b="${t.id}:name" value="${esc(t.name)}"></td><td><input type="text" data-b="${t.id}:unit" value="${esc(t.unit||'')}"></td><td><input type="number" step="any" data-b="${t.id}:qty" value="${t.qty||''}"></td><td><input type="number" step="any" data-b="${t.id}:rate" value="${t.rate||''}"></td><td><input type="number" step="any" data-b="${t.id}:bq" value="${t.bq||''}"></td><td><input type="number" step="any" data-b="${t.id}:cap" value="${t.cap||''}" ></td>
    <td class="r mono">${fq(x.alloc)}</td><td class="r mono ${x.remain<0?'bad':''}">${x.qty?fq(x.remain):'-'}</td><td class="r mono ${x.roomTotal&&x.qty&&Math.abs(x.roomTotal-x.qty)>.5?'warnt':''}">${x.roomTotal?fq(x.roomTotal):'-'}</td><td class="r mono">${fq(x.done)}</td><td><input type="text" data-b="${t.id}:note" value="${esc(t.note||'')}">${x.over?'<div class="small bad">จัดสรรเกิน BOQ</div>':''}${x.noBoq?'<div class="small warnt">ไม่มี BOQ คลุม</div>':''}${x.capOver?`<div class="small bad">เกิน 80% BOQ${x.shared?` (รวมรายการที่ใช้ BOQ เดียวกัน ${fq(x.capSum)} / ${fq(x.cap)})`:''}</div>`:''}</td><td><button class="btn sm bad" data-act="delboq" data-id="${t.id}">ลบ</button></td></tr>`}).join('')||'<tr><td colspan="13" class="empty small">ยังไม่มีรายการ BOQ ของอาคารนี้ — นำเข้าจาก Excel หรือเพิ่มเอง</td></tr>'}</tbody></table></div>`;
  return h;
}

/* ---- ตารางห้อง ---- */
function viewRooms(){
  const b=UI.b||S.project.buildings[0];const rooms=S.rooms.filter(r=>r.building===b).sort((a,z)=>natCmp(a.floor,z.floor)||natCmp(a.name,z.name));
  const its=S.boq.filter(x=>x.building===b&&(x.tile||rooms.some(r=>(r.qty||{})[x.id]))).sort((a,z)=>natCmp(a.name,z.name));let fl=null;
  const tot=it=>rooms.reduce((a,r)=>a+num((r.qty||{})[it.id]),0);
  let h=`<div class="row" style="margin-bottom:10px"><h1 style="font-size:22px;margin-right:auto">ตารางห้อง · ปริมาณ ตร.ม. ต่อ ITEM</h1><select id="fb" style="width:auto">${bOpts(b)}</select><button class="btn" data-act="impRooms">นำเข้า Excel</button><button class="btn" data-act="newitem">＋ ITEM</button><button class="btn pri" data-act="newroom">＋ ห้อง</button></div>
   <p class="hint">ปริมาณของแต่ละห้อง/ITEM ใช้เป็นตัวคุมงบ: ผลรวมเทียบกับ BOQ ด้านล่างตาราง แล้วเลือกห้องให้แต่ละชุดในหน้าชุดช่าง</p>
   ${its.length?`<div class="tblwrap"><table class="grid-t ed"><thead><tr><th style="width:70px">ชั้น</th><th style="min-width:150px">ห้อง</th>${its.map(i=>`<th style="min-width:100px">${esc(i.name)}<div class="small muted">${esc(i.unit||'')}</div></th>`).join('')}<th></th></tr></thead><tbody>
   ${rooms.map(r=>`<tr><td><input type="text" data-rm2="${r.id}:floor" value="${esc(r.floor||'')}"></td><td><input type="text" data-rm2="${r.id}:name" value="${esc(r.name)}"></td>${its.map(i=>`<td><input type="number" step="any" data-r="${r.id}:${i.id}" value="${(r.qty||{})[i.id]||''}"></td>`).join('')}<td><button class="btn sm bad" data-act="delroom" data-id="${r.id}">ลบ</button></td></tr>`).join('')||`<tr><td colspan="${3+its.length}" class="empty small">ยังไม่มีห้อง</td></tr>`}</tbody>
   <tfoot><tr><td colspan="2" class="r"><b>รวมตามห้อง</b></td>${its.map(i=>`<td class="mono" data-rt="${i.id}"><b>${fq(tot(i))}</b></td>`).join('')}<td></td></tr>
   <tr><td colspan="2" class="r"><b>BOQ</b></td>${its.map(i=>`<td class="mono ${i.qty&&Math.abs(tot(i)-i.qty)>.5?'warnt':''}">${i.qty?fq(i.qty):'<span class="chip warn">ไม่มี BOQ</span>'}</td>`).join('')}<td></td></tr></tfoot></table></div>`
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
   <div class="panel"><h3>สำรอง / ย้ายข้อมูล</h3><div class="row"><button class="btn" data-act="bkup">ดาวน์โหลดไฟล์สำรอง (JSON)</button><label class="btn" for="bkin">กู้คืนจากไฟล์สำรอง</label><input type="file" id="bkin" accept=".json" hidden><button class="btn" data-act="sample">โหลดข้อมูลตัวอย่าง (BOQ/ห้อง อาคาร D)</button><button class="btn bad" data-act="wipe">ล้างข้อมูลทั้งหมดในเครื่อง</button></div></div>`;
}

function render(){
  $('#top').innerHTML=viewTop();
  const m=$('#main');const sc=window.scrollY;
  m.innerHTML=UI.sub?viewSub():UI.crew?viewCrew():UI.tab==='crews'?viewCrews():UI.tab==='boq'?viewBoq():UI.tab==='rooms'?viewRooms():UI.tab==='plans'?viewPlans():UI.tab==='set'?viewSet():viewHome();
  window.scrollTo(0,sc);
}
