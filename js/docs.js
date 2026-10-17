/* ===== เอกสารส่งงาน/เบิกผลงาน (A4 แนวนอน) + PDF / HTML / Excel ===== */
const DOC_CSS=`
.sheet{position:relative;width:1123px;height:794px;background:#fff;color:#111;font-family:'Sarabun','Noto Sans Thai',sans-serif;overflow:hidden;box-sizing:border-box;line-height:1.3}
.sheet *{box-sizing:border-box}
.dp{position:absolute;inset:0;padding:16px 22px;font-size:11px}
.dh{width:100%;border-collapse:collapse;border:1px solid #111;table-layout:fixed;margin-bottom:0}
.dh td{border:1px solid #bbb;padding:3px 8px;font-size:12px;height:23px}
.dh td.lg{text-align:center;padding:2px;width:92px}.dh td.lg img{max-width:84px;max-height:46px;object-fit:contain}
.dh .ttl{text-align:center;color:#d00;font-weight:700;font-size:17px}
.dh .c{color:#1a3fc4}
.band{border:1px solid #111;border-top:0;background:#dcdcdc;text-align:center;font-weight:700;font-size:13px;padding:4px}
.band2{border:1px solid #111;border-top:0;background:#e9e9e9;padding:3px 8px;font-size:12px;display:flex;gap:26px;flex-wrap:wrap}
.dt{width:100%;border-collapse:collapse;table-layout:fixed;border:1px solid #111;margin-top:6px}
.dt th{border:1px solid #111;background:#eee;font-size:10.5px;font-weight:700;padding:3px 2px;line-height:1.2;text-align:center}
.dt td{border:1px solid #888;padding:2px 5px;height:28px;font-size:11px;overflow:hidden;vertical-align:middle}
.dt td.n{text-align:right;font-variant-numeric:tabular-nums}.dt td.c{text-align:center}
.dt td.cur{background:#e4eefb}.dt th.cur{background:#cfe0f7}
.dt tr.tot td{font-weight:700;background:#f3f3f3;border-top:2px solid #111}
.dt tr.fl td{background:#f2efe6;font-weight:700;height:22px}
.dt td.warn{color:#b00;font-size:10px}
.sum{display:flex;justify-content:space-between;align-items:center;border:2px solid #1a3fc4;margin-top:8px;padding:7px 14px;font-size:16px;font-weight:700}
.sig{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:12px;font-size:11px;text-align:center}.sig div{border-top:1px solid #111;padding-top:4px;margin-top:34px}
.plbox{margin-top:8px;height:590px;border:1px solid #888;background:#f4f4f4}.plbox svg{width:100%;height:100%;display:block}
.phg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px}.phc{border:1px solid #888;padding:3px}.phi{height:236px;background:#f2f2f2}.phi svg{width:100%;height:100%;display:block}.phn{font-size:11px;height:30px;overflow:hidden;padding-top:2px}
.dpf{position:absolute;left:22px;right:22px;bottom:10px;display:flex;justify-content:space-between;font-size:10px;color:#666}
`;
const logoHTML=()=>{const L=S.project.logoId&&imgSrc(S.project.logoId);return L?`<img src="${L}" alt="">`:`<span style="font-size:10px;color:#555">${esc(S.project.company||'')}</span>`};
const KINDTXT={sub:'ผู้รับเหมา',dc:'แรง DC บริษัท'};
function dHead(c,k,title){
  const P=S.project;const s=k.sub;
  const rng=s?[s.from&&fmtShort(s.from),s.to&&fmtShort(s.to)].filter(Boolean).join(' – '):'';
  return`<table class="dh"><colgroup><col style="width:92px"><col style="width:28%"><col><col style="width:13%"><col style="width:19%"></colgroup>
   <tr><td rowspan="2" class="lg">${logoHTML()}</td><td class="c">โครงการ : ${esc(P.name)}</td><td class="ttl" rowspan="2">${esc(c.name)}</td><td class="c">หมวดงาน :</td><td class="ttl" style="color:#111;font-size:14px;text-align:left">${esc(P.category||'')}</td></tr>
   <tr><td class="c">ผู้ว่าจ้าง : ${esc(P.client||'')}</td><td class="c">Date : ${esc(fmtShort(s&&s.date||todayISO()))}</td><td>${esc(fmtDate(s&&s.date||todayISO()))}</td></tr></table>
   <div class="band">${esc(title)}</div>
   <div class="band2"><span>${KINDTXT[c.kind]||'ชุด'} : <b>${esc(c.name)}</b></span><span>อาคาร : <b>${esc(c.building)}</b></span><span>งวดที่ : <b>${k.no}</b>${rng?' ('+esc(rng)+')':''}</span>${c.detail?`<span>รายละเอียดงาน : ${esc(c.detail)}</span>`:''}</div>`;
}
const dFoot=(c,k)=>`<div class="dpf"><span>${esc(S.project.name)} · ${esc(c.building)} · ${esc(c.name)} · งวดที่ ${k.no}</span><span>%%P%% / %%N%%</span></div>`;
const sigHTML=()=>`<div class="sig"><div>ผู้ส่งงาน / หัวหน้าชุด</div><div>ผู้ตรวจรับงาน (ผู้ควบคุมงาน)</div><div>ผู้อนุมัติ</div></div>`;
const rowNote=r=>[r.note,r.boq?'':'ไม่มี BOQ คลุม',r.over?'เกินปริมาณสัญญา':''].filter(Boolean).join(' · ');

/* --- ชุดแบบรายการ (ตารางเบิกผลงานตามรูปแบบ Excel) --- */
function linePages(c,k){
  const rows=k.rows;const CH=17,LASTMAX=13;const chunks=[];
  for(let i=0;i<rows.length;i+=CH)chunks.push(rows.slice(i,i+CH));if(!chunks.length)chunks.push([]);
  let extra=false;if(chunks[chunks.length-1].length>LASTMAX)extra=true;
  const N=chunks.length+(extra?1:0);const pages=[];let lastFl='';
  const col=`<colgroup><col style="width:48px"><col style="width:210px"><col style="width:66px"><col style="width:40px"><col style="width:60px"><col style="width:88px"><col style="width:66px"><col style="width:84px"><col style="width:66px"><col style="width:88px"><col style="width:92px"><col style="width:56px"><col></colgroup>`;
  const head=`<thead><tr><th rowspan="2">ชั้น</th><th rowspan="2">รายการ</th><th colspan="4">ราคาจัดจ้าง</th><th colspan="2">งวดก่อนๆ (สะสม)</th><th colspan="2" class="cur">งวดนี้ (ครั้งที่ ${k.no})</th><th colspan="2">รวมเบิกสะสม</th><th rowspan="2">หมายเหตุ</th></tr>
    <tr><th>ปริมาณ</th><th>หน่วย</th><th>ค่าแรง/หน่วย</th><th>บาท</th><th>ปริมาณ</th><th>บาท</th><th class="cur">ปริมาณ</th><th class="cur">บาท</th><th>ยอดเบิกสะสม (บาท)</th><th>% สะสม</th></tr></thead>`;
  const tr=r=>{const f=r.floor!==lastFl?r.floor:'';lastFl=r.floor;return`<tr><td class="c">${esc(f)}</td><td>${esc(r.name)}</td><td class="n">${fq(r.qty)}</td><td class="c">${esc(r.unit)}</td><td class="n">${f2(r.rate)}</td><td class="n">${f2(r.amt)}</td><td class="n">${r.prev?fq(r.prev):'-'}</td><td class="n">${r.prevAmt?f2(r.prevAmt):'-'}</td><td class="n cur">${r.cur?fq(r.cur):'-'}</td><td class="n cur">${r.curAmt?f2(r.curAmt):'-'}</td><td class="n">${r.cumAmt?f2(r.cumAmt):'-'}</td><td class="n">${pct(r.pct)}</td><td class="warn">${esc(rowNote(r))}</td></tr>`};
  const totRow=`<tr class="tot"><td colspan="2" class="c">รวม</td><td></td><td></td><td></td><td class="n">${f2(k.T.amt)}</td><td></td><td class="n">${f2(k.T.prevAmt)}</td><td class="n cur"></td><td class="n cur">${f2(k.T.curAmt)}</td><td class="n">${f2(k.T.cumAmt)}</td><td class="n">${pct(k.T.pct)}</td><td></td></tr>`;
  const fin=`<div class="sum"><span>รวมเป็นเงินเบิกผลงาน งวดที่ ${k.no}</span><span>${f2(k.T.curAmt)} บาท</span></div>${k.missing?`<div style="font-size:10.5px;color:#b00;margin-top:4px">* มี ${k.missing} รายการที่ไม่มี BOQ คลุม (ระบุไว้ในช่องหมายเหตุ)</div>`:''}${sigHTML()}`;
  chunks.forEach((ch,i)=>{const lastP=i===chunks.length-1&&!extra;
    pages.push(`<div class="dp">${dHead(c,k,i===0?`ตารางแบ่งจ่าย ส่งเบิกผลงาน${KINDTXT[c.kind]||''}`:'ตารางแบ่งจ่าย ส่งเบิกผลงาน (ต่อ)')}<table class="dt">${col}${head}<tbody>${ch.map(tr).join('')}${lastP?totRow:''}</tbody></table>${lastP?fin:''}${dFoot(c,k,i+1,N)}</div>`)});
  if(extra)pages.push(`<div class="dp">${dHead(c,k,'สรุปรวมเบิกผลงาน')}<table class="dt">${col}${head}<tbody>${totRow}</tbody></table>${fin}${dFoot(c,k,N,N)}</div>`);
  return pages;
}

/* --- ชุดแบบห้อง (ตารางห้อง × ITEM พร้อมปริมาณ ตร.ม.) --- */
function itemAgg(k){
  const m=new Map();for(const r of k.rows){let a=m.get(r.boqId);if(!a){a={boqId:r.boqId,name:r.name,unit:r.unit,rate:r.rate,qty:0,prev:0,cur:0,cum:0};m.set(r.boqId,a)}a.qty+=r.qty;a.prev+=r.prev;a.cur+=r.cur;a.cum+=r.cum}
  return[...m.values()].sort((a,b)=>natCmp(a.name,b.name));
}
function roomPages(c,k){
  const items=itemAgg(k);const pages=[];const IC=4,RP=16;const chunks=[];
  for(let i=0;i<items.length;i+=IC)chunks.push(items.slice(i,i+IC));if(!chunks.length)chunks.push([]);
  const rowOf=new Map();k.rows.forEach(r=>rowOf.set(r.key,r));
  const parts=[];
  chunks.forEach((its,ci)=>{
    const rooms=roomsOf(c).filter(r=>its.some(it=>rowOf.has(r.id+'~'+it.boqId)));
    const flat=[];let fl=null;for(const r of rooms){if(r.floor!==fl){fl=r.floor;flat.push({band:'ชั้น '+(fl||'-')})}flat.push({room:r})}
    const pgs=[];for(let i=0;i<flat.length;i+=RP)pgs.push(flat.slice(i,i+RP));if(!pgs.length)pgs.push([]);
    pgs.forEach((rows,pi)=>{
      const lastP=pi===pgs.length-1;const w=Math.floor(100*0.14);
      const colg=`<colgroup><col style="width:150px">${its.map(()=>'<col><col><col><col>').join('')}</colgroup>`;
      const head=`<thead><tr><th rowspan="2">ห้อง / พื้นที่</th>${its.map(it=>`<th colspan="4">${esc(it.name)}<br><span style="font-weight:400">ค่าแรง ${f2(it.rate)} บาท/${esc(it.unit)}</span></th>`).join('')}</tr><tr>${its.map(()=>'<th>ปริมาณ</th><th>สะสมก่อน</th><th class="cur">งวดนี้</th><th>% สะสม</th>').join('')}</tr></thead>`;
      const body=rows.map(x=>{if(x.band)return`<tr class="fl"><td colspan="${1+its.length*4}">${esc(x.band)}</td></tr>`;
        return`<tr><td>${esc(x.room.name)}</td>${its.map(it=>{const r=rowOf.get(x.room.id+'~'+it.boqId);return r?`<td class="n">${fq(r.qty)}</td><td class="n">${r.prev?fq(r.prev):'-'}</td><td class="n cur">${r.cur?fq(r.cur):'-'}</td><td class="n">${pct(r.pct)}</td>`:'<td class="c">·</td><td></td><td class="cur"></td><td></td>'}).join('')}</tr>`}).join('');
      const tot=lastP?`<tr class="tot"><td>รวม (${esc(its[0]?its[0].unit:'')})</td>${its.map(it=>`<td class="n">${fq(it.qty)}</td><td class="n">${fq(it.prev)}</td><td class="n cur">${fq(it.cur)}</td><td class="n">${pct(it.qty?(it.prev+it.cur)/it.qty*100:0)}</td>`).join('')}</tr>
        <tr class="tot"><td>มูลค่างวดนี้ (บาท)</td>${its.map(it=>`<td colspan="4" class="n">${f2(it.cur*it.rate)}</td>`).join('')}</tr>`:'';
      parts.push({head:dHead(c,k,ci===0&&pi===0?'ตารางส่งงานรายห้อง (ปริมาณ ตร.ม. ต่อ ITEM)':'ตารางส่งงานรายห้อง (ต่อ)'),html:`<table class="dt">${colg}${head}<tbody>${body}${tot}</tbody></table>`});
    });
  });
  // หน้าสรุปงบ
  const bc=boqControl(c.building);const bq=id=>bc.find(x=>x.it.id===id);
  const srows=items.map(it=>{const b=bq(it.boqId);const a=it.cum;return`<tr><td>${esc(it.name)}</td><td class="c">${esc(it.unit)}</td><td class="n">${fq(it.qty)}</td><td class="n">${f2(it.rate)}</td><td class="n">${f2(it.qty*it.rate)}</td><td class="n">${fq(it.prev)}</td><td class="n">${f2(it.prev*it.rate)}</td><td class="n cur">${fq(it.cur)}</td><td class="n cur">${f2(it.cur*it.rate)}</td><td class="n">${f2(a*it.rate)}</td><td class="n">${pct(it.qty?a/it.qty*100:0)}</td><td class="n">${b&&b.qty?fq(b.qty):'-'}</td><td class="n">${b&&b.qty?fq(b.qty-b.alloc):'-'}</td><td class="warn">${b&&b.qty?(b.over?'จัดสรรเกิน BOQ':''):'ไม่มี BOQ คลุม'}</td></tr>`}).join('');
  const sumPage=`<table class="dt"><colgroup><col style="width:170px"><col style="width:44px"><col style="width:66px"><col style="width:58px"><col style="width:86px"><col style="width:66px"><col style="width:84px"><col style="width:66px"><col style="width:86px"><col style="width:88px"><col style="width:54px"><col style="width:66px"><col style="width:66px"><col></colgroup>
    <thead><tr><th rowspan="2">ITEM</th><th rowspan="2">หน่วย</th><th colspan="3">ราคาจัดจ้าง (ห้องที่ได้รับ)</th><th colspan="2">สะสมก่อน</th><th colspan="2" class="cur">งวดนี้</th><th colspan="2">รวมเบิกสะสม</th><th colspan="2">เทียบ BOQ</th><th rowspan="2">หมายเหตุ</th></tr>
    <tr><th>ปริมาณ</th><th>ค่าแรง/หน่วย</th><th>บาท</th><th>ปริมาณ</th><th>บาท</th><th class="cur">ปริมาณ</th><th class="cur">บาท</th><th>บาท</th><th>%</th><th>BOQ</th><th>คงเหลือ</th></tr></thead>
    <tbody>${srows}<tr class="tot"><td colspan="4" class="c">รวม</td><td class="n">${f2(k.T.amt)}</td><td></td><td class="n">${f2(k.T.prevAmt)}</td><td class="cur"></td><td class="n cur">${f2(k.T.curAmt)}</td><td class="n">${f2(k.T.cumAmt)}</td><td class="n">${pct(k.T.pct)}</td><td colspan="3"></td></tr></tbody></table>
    <div class="sum"><span>รวมเป็นเงินเบิกผลงาน งวดที่ ${k.no}</span><span>${f2(k.T.curAmt)} บาท</span></div>${sigHTML()}`;
  parts.push({head:dHead(c,k,'สรุปงบเบิกผลงาน (คุมงบตามปริมาณ ตร.ม. ต่อ ITEM)'),html:sumPage});
  const N=parts.length;return parts.map((p,i)=>`<div class="dp">${p.head}${p.html}${dFoot(c,k,i+1,N)}</div>`);
}
function attachPages(c,k){
  const s=k.sub;if(!s)return[];const out=[];const hd=t=>dHead(c,k,t);
  for(const p of (s.plans||[]))out.push(`<div class="dp">${hd('แบบประกอบการส่งงาน · '+(p.name||''))}<div class="plbox">${annotatedSvg(imgSrc(p.imgId),p.w,p.h,p.shapes||[],[],{scale:p.sym})}</div>${dFoot(c,k)}</div>`);
  const ph=s.photos||[];const PER=6;
  for(let i=0;i<ph.length;i+=PER){const ch=ph.slice(i,i+PER);
    out.push(`<div class="dp">${hd('รูปถ่ายประกอบการส่งงาน'+(ph.length>PER?` (${Math.floor(i/PER)+1}/${Math.ceil(ph.length/PER)})`:''))}<div class="phg">${ch.map((p,j)=>`<div class="phc"><div class="phi">${annotatedSvg(imgSrc(p.imgId),p.w,p.h,p.shapes||[],[])}</div><div class="phn"><b>${i+j+1}.</b> ${esc(p.caption||'')}</div></div>`).join('')}</div>${dFoot(c,k)}</div>`)}
  return out;
}
function crewDocPages(c,no){
  const k=calcCrew(c,no);let pg=c.mode==='room'?roomPages(c,k):linePages(c,k);pg=pg.concat(attachPages(c,k));
  const N=pg.length;return pg.map((h,i)=>h.replace(/%%P%%/g,i+1).replace(/%%N%%/g,N));
}
async function crewDocReady(c,no){
  const k=calcCrew(c,no);const s=k.sub;
  await ensureData([S.project.logoId],true);if(s)await ensureData([...(s.plans||[]),...(s.photos||[])].map(x=>x.imgId));
  return crewDocPages(c,no);
}

/* --- สรุปทั้งอาคาร (หน้าปะหน้าสำหรับส่งรวม) --- */
function buildingPages(b,kind){
  const crews=S.crews.filter(c=>(!b||c.building===b)&&(!kind||c.kind===kind)).sort((a,z)=>natCmp(a.building,z.building)||(a.order||0)-(z.order||0));
  const P=S.project;const ks=crews.map(c=>({c,k:calcCrew(c)}));const pages=[];const CH=15;
  const chunks=[];for(let i=0;i<ks.length;i+=CH)chunks.push(ks.slice(i,i+CH));if(!chunks.length)chunks.push([]);
  const tot=ks.filter(x=>!x.c.skip).reduce((a,x)=>({amt:a.amt+x.k.T.amt,prev:a.prev+x.k.T.prevAmt,cur:a.cur+x.k.T.curAmt,cum:a.cum+x.k.T.cumAmt}),{amt:0,prev:0,cur:0,cum:0});
  chunks.forEach((ch,i)=>{const last=i===chunks.length-1;let n0=i*CH;
    pages.push(`<div class="dp"><table class="dh"><colgroup><col style="width:30%"><col><col style="width:34%"></colgroup><tr><td class="c"><span style="display:inline-block;vertical-align:middle;margin-right:8px;height:34px">${P.logoId&&imgSrc(P.logoId)?`<img src="${imgSrc(P.logoId)}" style="height:34px">`:''}</span>โครงการ : ${esc(P.name)}</td><td class="ttl">สรุปส่งงาน/เบิกผลงาน ${b?'อาคาร '+esc(b):'ทุกอาคาร'}${kind?' · '+esc(KIND[kind]):''}</td><td class="c">วันที่ : ${esc(fmtDate(todayISO()))}</td></tr><tr><td class="c">ผู้ว่าจ้าง : ${esc(P.client||'')}</td><td class="c" style="text-align:center">หมวดงาน ${esc(P.category||'')}</td><td></td></tr></table>
     <table class="dt"><colgroup><col style="width:34px"><col style="width:46px"><col style="width:200px"><col style="width:84px"><col style="width:220px"><col style="width:90px"><col style="width:90px"><col style="width:90px"><col style="width:96px"><col style="width:54px"><col></colgroup>
     <thead><tr><th>ที่</th><th>อาคาร</th><th>ชุด</th><th>ประเภท</th><th>รายละเอียดงาน</th><th>มูลค่าสัญญา</th><th>เบิกก่อนหน้า</th><th class="cur">งวดล่าสุด</th><th>รวมเบิกสะสม</th><th>%</th><th>หมายเหตุ</th></tr></thead><tbody>
     ${ch.map((x,j)=>{const c=x.c,t=x.k.T;return`<tr><td class="c">${n0+j+1}</td><td class="c">${esc(c.building)}</td><td>${esc(c.name)}</td><td class="c">${esc(KIND[c.kind]||'')}</td><td style="font-size:10px">${esc(c.detail||'')}</td><td class="n">${c.skip?'-':f2(t.amt)}</td><td class="n">${c.skip?'-':f2(t.prevAmt)}</td><td class="n cur">${c.skip?'-':f2(t.curAmt)}${x.k.sub?` <span style="font-size:9px;color:#555">(ง.${x.k.no})</span>`:''}</td><td class="n">${c.skip?'-':f2(t.cumAmt)}</td><td class="n">${c.skip?'-':pct(t.pct)}</td><td class="warn">${esc([c.skip?'ไม่ส่งงานงวดนี้':'',c.note,x.k.missing?`ไม่มี BOQ ${x.k.missing} รายการ`:'',!x.k.rows.length&&!c.skip?'ยังไม่มีรายการ':''].filter(Boolean).join(' · '))}</td></tr>`}).join('')}
     ${last?`<tr class="tot"><td colspan="5" class="c">รวมทั้งหมด</td><td class="n">${f2(tot.amt)}</td><td class="n">${f2(tot.prev)}</td><td class="n cur">${f2(tot.cur)}</td><td class="n">${f2(tot.cum)}</td><td class="n">${pct(tot.amt?tot.cum/tot.amt*100:0)}</td><td></td></tr>`:''}</tbody></table>
     ${last?`<div class="sum"><span>รวมเป็นเงินเบิกผลงานงวดล่าสุด</span><span>${f2(tot.cur)} บาท</span></div>${sigHTML()}`:''}
     <div class="dpf"><span>${esc(P.name)}</span><span>${i+1} / ${chunks.length}</span></div></div>`)});
  return pages;
}

/* ----- แสดงตัวอย่าง / ส่งออก ----- */
function pageShell(pages){return pages.map(p=>`<div class="sheet">${p}</div>`).join('')}
function previewDoc(pages,name){
  const o=overlay(`<div class="pvbar"><b style="margin-right:auto">${esc(name)}</b><button class="btn" data-x="html">HTML / พิมพ์</button><button class="btn pri" data-x="pdf">PDF</button><button class="btn" data-x="close">ปิด</button></div><div class="pvbody" id="pvb"></div>`,'full');
  const body=$('#pvb',o);const draw=()=>{const sc=Math.min(1,(innerWidth-24)/1123);body.innerHTML=`<div style="width:${1123*sc}px;margin:0 auto">${pages.map(p=>`<div style="width:${1123*sc}px;height:${794*sc}px;margin-bottom:12px;box-shadow:var(--shadow)"><div class="sheet" style="transform:scale(${sc});transform-origin:0 0">${p}</div></div>`).join('')}</div>`};
  draw();const rs=()=>draw();addEventListener('resize',rs);
  o.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;if(b.dataset.x==='close'){removeEventListener('resize',rs);o.remove()}else exportPages(pages,name,b.dataset.x)});
}
async function saveFile(name,blob){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
const safeName=s=>String(s).replace(/[\\/:*?"<>|\s]+/g,'_');
async function exportPages(pages,name,kind){
  const fn=safeName(name);
  try{
    if(kind==='html'){
      const doc=`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(name)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Sarabun:wght@300;400;500;600;700&display=swap"><style>${DOC_CSS}body{margin:0;background:#777}.sheet{margin:12px auto}@page{size:A4 landscape;margin:0}@media print{body{background:none}.sheet{margin:0;page-break-after:always;break-after:page}}</style></head><body>${pageShell(pages)}</body></html>`;
      await saveFile(fn+'.html',new Blob([doc],{type:'text/html'}));return}
    toast('กำลังสร้าง PDF…',4000);await saveFile(fn+'.pdf',await pagesToPdf(pages));
  }catch(e){toast('สร้างเอกสารไม่สำเร็จ: '+(e.message||e),5000)}
}
async function pagesToPdf(pages){
  {
    const host=document.createElement('div');host.style.cssText='position:fixed;left:-9999px;top:0;width:1123px;z-index:-1';host.innerHTML=pageShell(pages);document.body.appendChild(host);
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;await new Promise(r=>setTimeout(r,200));
    const pdf=new jspdf.jsPDF({unit:'mm',format:'a4',orientation:'l',compress:true});const sh=$$('.sheet',host);
    for(let i=0;i<sh.length;i++){if(i>0)pdf.addPage('a4','l');const cv=await html2canvas(sh[i],{scale:2,backgroundColor:'#ffffff',logging:false});pdf.addImage(cv.toDataURL('image/jpeg',.9),'JPEG',0,0,297,210,undefined,'FAST')}
    host.remove();return pdf.output('blob');
  }
}
(function(){const s=document.createElement('style');s.textContent=DOC_CSS+`.ov.full{background:var(--bg);display:flex;flex-direction:column;align-items:stretch;padding:0}.pvbar{display:flex;gap:8px;align-items:center;padding:8px 12px;background:var(--surface);border-bottom:1px solid var(--line);flex-wrap:wrap}.pvbody{flex:1;overflow:auto;padding:12px}`;document.head.appendChild(s)})();

/* ----- Excel ----- */
function crewAOA(c,no){
  const k=calcCrew(c,no);const P=S.project;const a=[];
  a.push(['โครงการ',P.name,'','',c.name,'','','','หมวดงาน',P.category]);a.push(['ผู้ว่าจ้าง',P.client,'','','','','','','Date',fmtDate(k.sub&&k.sub.date||todayISO())]);
  a.push([`${KINDTXT[c.kind]||'ชุด'}: ${c.name}`,'','','อาคาร '+c.building,'','งวดที่ '+k.no,'',c.detail||'']);a.push([]);
  if(c.mode==='room'){
    a.push(['ชั้น','ห้อง','ITEM','หน่วย','ปริมาณ','ค่าแรง/หน่วย','บาท','สะสมก่อน','งวดนี้','บาท (งวดนี้)','สะสมรวม','% สะสม']);
    k.rows.forEach(r=>a.push([r.floor,r.room,r.name,r.unit,r.qty,r.rate,r.amt,r.prev,r.cur,r.curAmt,r.cum,+r.pct.toFixed(2)]));
  }else{
    a.push(['ชั้น','รายการ','ปริมาณ','หน่วย','ค่าแรง/หน่วย','บาท','งวดก่อน ปริมาณ','งวดก่อน บาท','งวดนี้ ปริมาณ','งวดนี้ บาท','ยอดเบิกสะสม','% สะสม','หมายเหตุ']);
    k.rows.forEach(r=>a.push([r.floor,r.name,r.qty,r.unit,r.rate,r.amt,r.prev,r.prevAmt,r.cur,r.curAmt,r.cumAmt,+r.pct.toFixed(2),rowNote(r)]));
  }
  a.push([]);a.push(['รวมมูลค่าสัญญา',k.T.amt]);a.push(['เบิกก่อนหน้า',k.T.prevAmt]);a.push(['เบิกงวดนี้',k.T.curAmt]);a.push(['เบิกสะสม',k.T.cumAmt]);a.push(['% สะสม',+k.T.pct.toFixed(2)]);
  return a;
}
function exportXlsx(c,no){
  if(!window.XLSX){toast('ยังโหลดตัวสร้าง Excel ไม่ได้ (ต้องมีอินเทอร์เน็ตครั้งแรก)');return}
  const wb=XLSX.utils.book_new();const k=calcCrew(c,no);XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(crewAOA(c,no)),('งวด '+k.no).slice(0,30));
  XLSX.writeFile(wb,safeName(`${c.building}_${c.name}_งวด${k.no}`)+'.xlsx');
}
function exportBuildingXlsx(b){
  if(!window.XLSX){toast('ยังโหลดตัวสร้าง Excel ไม่ได้');return}
  const a=[['ที่','อาคาร','ชุด','ประเภท','รายละเอียดงาน','มูลค่าสัญญา','เบิกก่อนหน้า','งวดล่าสุด','รวมเบิกสะสม','%','หมายเหตุ']];
  S.crews.filter(c=>!b||c.building===b).forEach((c,i)=>{const k=calcCrew(c);a.push([i+1,c.building,c.name,KIND[c.kind],c.detail,k.T.amt,k.T.prevAmt,k.T.curAmt,k.T.cumAmt,+k.T.pct.toFixed(2),[c.skip?'ไม่ส่งงานงวดนี้':'',c.note].filter(Boolean).join(' · ')])});
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(a),'สรุป');XLSX.writeFile(wb,safeName('สรุปส่งงาน_'+(b||'ทุกอาคาร'))+'.xlsx');
}
