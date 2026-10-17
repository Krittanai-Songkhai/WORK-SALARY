/* ===== นำเข้าข้อมูลจาก Excel / CSV: รายการ BOQ และตารางห้อง ===== */
const GUESS={name:/รายการ|รายละเอียด|ประเภทงาน|item|description|ชื่อ/i,unit:/หน่วย|unit/i,qty:/ปริมาณ|จำนวน|qty|quantity/i,rate:/ค่าแรง|ราคา|rate|ต่อหน่วย|unit ?price/i,group:/หมวด|group|zone|โซน/i,note:/หมายเหตุ|remark|note/i,floor:/ชั้น|floor|level/i,room:/ห้อง|room|พื้นที่|area|location/i};
function guessCol(head,key,used){const re=GUESS[key];for(let i=0;i<head.length;i++){if(used.has(i))continue;if(re.test(String(head[i])))return i}return -1}
function autoHeaderRow(a){let mx=0;a.slice(0,30).forEach(r=>{mx=Math.max(mx,r.filter(x=>String(x).trim()!=='').length)});
  for(let i=0;i<Math.min(a.length,30);i++){const n=a[i].filter(x=>String(x).trim()!=='').length;if(n>=Math.max(2,Math.ceil(mx*.6)))return i}return 0}

function importDialog(kind,building){
  if(!window.XLSX){toast('ยังโหลดตัวอ่าน Excel ไม่ได้ (ต้องมีอินเทอร์เน็ตครั้งแรก)',4000);return}
  const o=overlay(`<div class="box wide"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">นำเข้า${kind==='boq'?'รายการ BOQ':'ตารางห้อง'} จาก Excel / CSV</h3><button class="btn" data-x="close">ปิด</button></div>
   <p class="hint">${kind==='boq'?'ไฟล์ควรมีหัวตารางเช่น รายการ / หน่วย / ปริมาณ / ค่าแรง (ถ้ามี)':'หนึ่งแถว = หนึ่งห้อง มีคอลัมน์ ชั้น, ห้อง และคอลัมน์ปริมาณ ตร.ม. ของแต่ละ ITEM (หัวคอลัมน์ = ชื่อ ITEM)'}</p>
   <div class="row" style="margin-bottom:10px"><input type="file" id="impf" accept=".xlsx,.xls,.csv"><label class="f" style="width:150px">อาคาร<select id="impb">${S.project.buildings.map(b=>`<option ${b===building?'selected':''}>${esc(b)}</option>`).join('')}</select></label></div><div id="impbody"></div></div>`,'modal');
  let wb=null,A=[],st={sheet:'',hr:0,map:{},items:new Set(),mode:'add'};
  const col=i=>i<0?'':String.fromCharCode(65+i%26);
  const draw=()=>{
    const head=(A[st.hr]||[]).map(x=>String(x).trim());const opts=(sel)=>`<option value="-1">— ไม่ใช้ —</option>${head.map((h,i)=>`<option value="${i}" ${sel===i?'selected':''}>${col(i)} · ${esc(h||'(ว่าง)')}</option>`).join('')}`;
    const fields=kind==='boq'?[['name','รายการ *'],['unit','หน่วย'],['qty','ปริมาณ'],['rate','ค่าแรง/หน่วย'],['group','หมวด/ชั้น'],['note','หมายเหตุ']]:[['floor','ชั้น'],['room','ห้อง *']];
    $('#impbody',o).innerHTML=`<div class="row" style="margin-bottom:8px"><label class="f">ชีต<select id="imps">${wb.SheetNames.map(s=>`<option ${s===st.sheet?'selected':''}>${esc(s)}</option>`).join('')}</select></label><label class="f" style="width:130px">แถวหัวตาราง<input type="number" id="imph" min="1" value="${st.hr+1}"></label></div>
     <div class="grid" style="margin-bottom:10px">${fields.map(f=>`<label class="f">${f[1]}<select data-m="${f[0]}">${opts(st.map[f[0]]==null?-1:st.map[f[0]])}</select></label>`).join('')}</div>
     ${kind==='rooms'?`<div class="small muted" style="margin-bottom:4px">คอลัมน์ปริมาณของแต่ละ ITEM (ติ๊กที่จะนำเข้า):</div><div class="row" style="margin-bottom:10px">${head.map((h,i)=>(i===st.map.floor||i===st.map.room||!h)?'':`<label class="chip" style="cursor:pointer"><input type="checkbox" data-it="${i}" ${st.items.has(i)?'checked':''}> ${esc(h)}</label>`).join('')}</div>`:''}
     <label class="row small" style="gap:6px;margin-bottom:10px">วิธีนำเข้า<select id="impm" style="width:auto"><option value="add" ${st.mode==='add'?'selected':''}>เพิ่ม / อัปเดตรายการที่ชื่อซ้ำ</option><option value="replace" ${st.mode==='replace'?'selected':''}>แทนที่ทั้งหมดของอาคารนี้</option></select></label>
     <div class="tblwrap"><table class="grid-t"><tbody>${A.slice(st.hr,st.hr+7).map((r,ri)=>`<tr class="${ri===0?'hd':''}">${head.map((_,i)=>`<td>${esc(r[i]==null?'':r[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
     <div class="row" style="margin-top:12px;justify-content:flex-end"><span class="small muted" id="impcnt" style="margin-right:auto"></span><button class="btn pri" data-x="go">นำเข้า</button></div>`;
    const n=countRows();$('#impcnt',o).textContent=`พบ ${n} แถวข้อมูล`;
  };
  const dataRows=()=>A.slice(st.hr+1).filter(r=>r.some(x=>String(x).trim()!==''));
  const countRows=()=>{const nc=kind==='boq'?st.map.name:st.map.room;return nc>=0?dataRows().filter(r=>String(r[nc]).trim()!=='').length:0};
  const loadSheet=name=>{st.sheet=name;A=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});st.hr=autoHeaderRow(A);remap()};
  const remap=()=>{const head=(A[st.hr]||[]).map(x=>String(x).trim());const used=new Set();st.map={};
    (kind==='boq'?['name','qty','unit','rate','group','note']:['floor','room']).forEach(k=>{const i=guessCol(head,k,used);st.map[k]=i;if(i>=0)used.add(i)});
    if(kind==='boq'&&st.map.name<0&&head.length){st.map.name=0;}
    st.items=new Set();if(kind==='rooms')head.forEach((h,i)=>{if(h&&!used.has(i)&&dataRows().some(r=>num(r[i])>0))st.items.add(i)});draw()};
  o.addEventListener('change',async e=>{const t=e.target;
    if(t.id==='impf'){const f=t.files[0];if(!f)return;try{wb=XLSX.read(await f.arrayBuffer(),{type:'array'});loadSheet(wb.SheetNames[0])}catch(x){toast('อ่านไฟล์ไม่ได้: '+(x.message||x),4500)}return}
    if(t.id==='imps'){loadSheet(t.value);return}
    if(t.id==='imph'){st.hr=Math.max(0,num(t.value)-1);remap();return}
    if(t.id==='impm'){st.mode=t.value;return}
    if(t.dataset&&t.dataset.m){st.map[t.dataset.m]=+t.value;draw();return}
    if(t.dataset&&t.dataset.it!==undefined){const i=+t.dataset.it;t.checked?st.items.add(i):st.items.delete(i);return}
  });
  o.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b){if(e.target===o)o.remove();return}
    if(b.dataset.x==='close'){o.remove();return}
    if(b.dataset.x==='go'){const bld=$('#impb',o).value;const n=kind==='boq'?doBoq(bld):doRooms(bld);if(n){toast(`นำเข้า ${n} รายการแล้ว`);o.remove();render()}else toast('ไม่พบข้อมูลที่นำเข้าได้ ตรวจการเลือกคอลัมน์')}});
  function doBoq(bld){const m=st.map;if(m.name<0)return 0;let n=0;
    if(st.mode==='replace'){S.boq.filter(x=>x.building===bld).forEach(x=>del('boq',x.id))}
    for(const r of dataRows()){const name=String(r[m.name]).trim();if(!name)continue;
      const g=k=>m[k]>=0?r[m[k]]:'';const ex=S.boq.find(x=>x.building===bld&&x.name===name);
      const v={building:bld,name,unit:String(g('unit')||'').trim()||(ex&&ex.unit)||'',qty:m.qty>=0?num(g('qty')):(ex?ex.qty:0),rate:m.rate>=0?num(g('rate')):(ex?ex.rate:0),group:String(g('group')||'').trim(),note:String(g('note')||'').trim()};
      if(ex){Object.assign(ex,v);save(ex)}else add('boq',v);n++}
    return n}
  function doRooms(bld){const m=st.map;if(m.room<0||!st.items.size)return 0;let n=0;const head=(A[st.hr]||[]).map(x=>String(x).trim());
    if(st.mode==='replace')S.rooms.filter(x=>x.building===bld).forEach(x=>del('rooms',x.id));
    const itemOf={};[...st.items].forEach(i=>{const name=head[i];let it=S.boq.find(x=>x.building===bld&&x.name===name);if(!it)it=add('boq',{building:bld,name,unit:'ตร.ม.',qty:0,rate:0,group:'',note:'สร้างจากตารางห้อง',tile:true,auto:true});itemOf[i]=it});
    let fl='';
    for(const r of dataRows()){const name=String(r[m.room]).trim();if(m.floor>=0&&String(r[m.floor]).trim()!=='')fl=String(r[m.floor]).trim();if(!name)continue;
      const qty={};[...st.items].forEach(i=>{const q=num(r[i]);if(q)qty[itemOf[i].id]=q});
      const ex=S.rooms.find(x=>x.building===bld&&x.name===name&&String(x.floor||'')===fl);
      if(ex){ex.qty=Object.assign(ex.qty||{},qty);save(ex)}else add('rooms',{building:bld,floor:fl,name,qty});n++}
    Object.values(itemOf).forEach(it=>{if(it.auto&&!it.qty){it.qty=S.rooms.filter(r=>r.building===bld).reduce((a,r)=>a+num((r.qty||{})[it.id]),0);save(it)}});
    return n}
}

/* ===== นำเข้า BOQ ทั้งไฟล์: หลายชีต (ชีต = อาคาร), มีหัวข้อ 1 / 1.1, รายการขึ้นต้น “-”, คอลัมน์ BOQ และ 80% ===== */
const UNIT_RE=/^(ตร\.?\s?ม\.?|ตรม\.?|ม\.?|เมตร|ซม\.?|ลบ\.?\s?ม\.?|ชุด|จุด|ชิ้น|แผ่น|งาน|ห้อง|บาน|ตัว|อัน|ต้น|เส้น|m2|m²|m|sq\.?\s?m\.?|lot|pcs?|set|ea)$/i;
const isNum=v=>typeof v==='number'?isFinite(v):(/^-?[\d,]+(\.\d+)?$/.test(String(v).trim()));
const isCode=v=>/^\d+(\.\d+)*$/.test(String(v).trim());
const cell=(r,i)=>i>=0&&r?r[i]:'';
function guessBuilding(sheet){
  const norm=x=>String(x).toLowerCase().replace(/อาคาร|building|bld|ตึก|[\s._-]/g,'');const sn=norm(sheet);if(!sn)return'';
  for(const b of S.project.buildings){const nb=norm(b);if(sn===nb)return b}
  for(const b of S.project.buildings){const toks=norm(b).split(/[&,/+]/).filter(Boolean);if(toks.includes(sn))return b}
  for(const b of S.project.buildings){const nb=norm(b);if(nb&&(sn.endsWith(nb)||sn.startsWith(nb)))return b}
  return'';
}
/* เดาคอลัมน์ของชีต */
function detectBoqCols(A){
  const W=Math.max(0,...A.slice(0,400).map(r=>r.length));const rows=A.slice(0,400);
  const col=(f)=>{let b=-1,bv=0;for(let c=0;c<W;c++){const v=f(c);if(v>bv){bv=v;b=c}}return b};
  const m={no:-1,name:-1,loc:-1,unit:-1,qty:-1,rate:-1,bq:-1,cap:-1,hr:-1};
  // แถวหัวตารางจากคำสำคัญ
  const kw={name:/รายการ|รายละเอียด|description|item/i,unit:/^หน่วย$|unit/i,qty:/ปริมาณ|จำนวน|qty|quantity/i,rate:/ค่าแรง|ราคาต่อหน่วย|rate|unit ?price|ต่อหน่วย/i};
  for(let i=0;i<Math.min(rows.length,15);i++){const r=rows[i];let hits=0;for(const k in kw)if(r.some(x=>kw[k].test(String(x).trim())))hits++;if(hits>=2){m.hr=i;for(const k in kw){const c=r.findIndex(x=>kw[k].test(String(x).trim()));if(c>=0)m[k]=c}break}}
  // BOQ / 80% จากป้ายบนหัวตาราง (ค้นหาในแถวบนๆ)
  for(let i=0;i<Math.min(rows.length,12);i++){rows[i].forEach((x,c)=>{const t=String(x).trim();if(/^BOQ$/i.test(t)&&m.bq<0)m.bq=c;if(/^\d+\s?%$/.test(t)&&m.cap<0&&c>0)m.cap=c})}
  if(m.unit<0){const u=col(c=>rows.filter(r=>UNIT_RE.test(String(cell(r,c)).trim())).length);if(u>=0&&rows.filter(r=>UNIT_RE.test(String(cell(r,u)).trim())).length>=1)m.unit=u}
  const detail=rows.filter(r=>m.unit>=0&&UNIT_RE.test(String(cell(r,m.unit)).trim()));
  if(m.qty<0&&m.unit>=0){for(let c=m.unit+1;c<=m.unit+4&&c<W;c++){if(detail.filter(r=>isNum(cell(r,c))&&num(cell(r,c))>0).length>=Math.max(1,detail.length*.5)){m.qty=c;break}}}
  if(m.rate<0&&m.qty>=0){ // คอลัมน์ที่ qty × ค่า ≈ ตัวเลขอื่นในแถวเดียวกัน
    let best=-1,bs=0;for(let c=m.qty+1;c<W;c++){let s=0;for(const r of detail){const q=num(cell(r,m.qty)),v=num(cell(r,c));if(!q||!v)continue;const t=q*v;if(r.some((x,j)=>j!==c&&j!==m.qty&&isNum(x)&&Math.abs(num(x)-t)<=Math.max(1,t*.005)))s++}if(s>bs){bs=s;best=c}}
    if(best>=0)m.rate=best}
  const used=new Set([m.unit,m.qty,m.rate]);
  if(m.bq<0&&m.qty>=0){ // คอลัมน์ตัวเลขทางขวาสุดที่มี 2 คอลัมน์ติดกัน อัตราส่วน ≈ 0.8
    for(let c=Math.max(m.rate,m.qty)+3;c<W-1;c++){let k=0,tot=0;for(const r of rows){const a=num(cell(r,c)),b=num(cell(r,c+1));if(a>0&&b>0){tot++;if(Math.abs(b/a-.8)<.01)k++}}if(tot>=1&&k>=tot*.8){m.bq=c;if(m.cap<0)m.cap=c+1;break}}}
  if(m.cap<0&&m.bq>=0){const c=m.bq+1;if(rows.some(r=>num(cell(r,c))>0))m.cap=c}
  // คอลัมน์รหัสหัวข้อ + ชื่อรายการ
  m.no=col(c=>c<3?rows.filter(r=>isCode(cell(r,c))&&String(cell(r,c)).trim()!=='').length:0);
  if(m.name<0)m.name=col(c=>used.has(c)||c===m.no?0:rows.filter(r=>{const t=String(cell(r,c)).trim();return t.length>=6&&!isNum(t)&&(m.unit<0||detail.includes(r)||/^-/.test(t))}).reduce((a,r)=>a+String(cell(r,c)).length,0));
  if(m.unit>=0&&m.name>=0&&m.loc<0){const lc=col(c=>c===m.name||c===m.no||used.has(c)||c>m.unit?0:detail.filter(r=>String(cell(r,c)).trim()&&!isNum(cell(r,c))).length);if(lc>=0&&lc>m.name)m.loc=lc}
  return m;
}
function parseBoqSheet(A,m){
  const out=[];let sec='',sub='';
  const start=m.hr>=0?m.hr+1:0;
  for(let i=start;i<A.length;i++){const r=A[i];const name=String(cell(r,m.name)).trim();const unit=String(cell(r,m.unit)).trim();const q=cell(r,m.qty);
    const code=m.no>=0?String(cell(r,m.no)).trim():'';
    const isDetail=name&&isNum(q)&&num(q)!==0&&(m.unit<0||unit);
    if(!isDetail){
      if(name&&isCode(code)&&!/ยอดรวม|^sum$/i.test(name)){const lvl=code.includes('.')?2:1;if(lvl===1){sec=(code+' '+name).trim();sub=''}else sub=(code+' '+name).trim()}
      continue}
    const clean=name.replace(/^[-–•\s]+/,'');const loc=m.loc>=0?String(cell(r,m.loc)).trim():'';
    const t={name:loc?`${clean} (${loc})`:clean,loc,unit,qty:num(q),rate:m.rate>=0?num(cell(r,m.rate)):0,group:[sec,sub].filter(Boolean).join(' › ')};
    if(m.bq>=0){t.bqMapped=true;t.bq=num(cell(r,m.bq))}
    if(m.cap>=0)t.cap=num(cell(r,m.cap));
    out.push(t)}
  return out;
}
function importBoqAll(building){
  if(!window.XLSX){toast('ยังโหลดตัวอ่าน Excel ไม่ได้ (ต้องมีอินเทอร์เน็ตครั้งแรก)',4000);return}
  const o=overlay(`<div class="box wide"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">นำเข้า BOQ จาก Excel (หลายชีต = หลายอาคาร)</h3><button class="btn" data-x="close">ปิด</button></div>
   <p class="hint">รองรับไฟล์ที่ 1 ชีต = 1 อาคาร มีหัวข้อ 1 / 1.1, รายการขึ้นต้น “-”, ตำแหน่ง (ผนังใน/นอก), หน่วย, ปริมาณ, ค่าแรง และคอลัมน์ BOQ / 80% ระบบเดาคอลัมน์ให้ ตรวจแล้วแก้ได้ก่อนนำเข้า</p>
   <input type="file" id="ibf" accept=".xlsx,.xls,.csv" style="margin-bottom:10px"><div id="ibbody"></div></div>`,'modal');
  let wb=null;const sh={};let cur='';
  const colL=i=>i<0?'—':(i<26?String.fromCharCode(65+i):String.fromCharCode(64+Math.floor(i/26))+String.fromCharCode(65+i%26));
  const FL=[['no','รหัสหัวข้อ'],['name','รายการ'],['loc','ตำแหน่ง/ชนิด'],['unit','หน่วย'],['qty','ปริมาณ'],['rate','ค่าแรง/หน่วย'],['bq','BOQ'],['cap','80% BOQ']];
  const draw=()=>{
    const s=sh[cur];const W=Math.max(0,...s.A.slice(0,60).map(r=>r.length));const opts=v=>`<option value="-1">— ไม่ใช้ —</option>${Array.from({length:W},(_,i)=>`<option value="${i}" ${v===i?'selected':''}>${colL(i)}</option>`).join('')}`;
    const items=parseBoqSheet(s.A,s.m);
    $('#ibbody',o).innerHTML=`<div class="tblwrap"><table class="grid-t"><thead><tr><th>นำเข้า</th><th>ชีต</th><th>อาคาร</th><th class="r">รายการ</th></tr></thead><tbody>${wb.SheetNames.map(n=>{const x=sh[n];const cnt=parseBoqSheet(x.A,x.m).length;return`<tr data-sh="${esc(n)}" class="${n===cur?'hd':''}" style="cursor:pointer"><td><input type="checkbox" data-use="${esc(n)}" ${x.use?'checked':''}></td><td>${esc(n)}</td><td><select data-bld="${esc(n)}"><option value="">— ข้าม —</option>${S.project.buildings.map(b=>`<option ${b===x.b?'selected':''}>${esc(b)}</option>`).join('')}</select></td><td class="r">${cnt}</td></tr>`}).join('')}</tbody></table></div>
     <div class="small muted" style="margin:6px 0">คอลัมน์ของชีต “${esc(cur)}” (ใช้กับชีตนี้):</div>
     <div class="grid" style="margin-bottom:8px">${FL.map(f=>`<label class="f">${f[1]}<select data-mc="${f[0]}">${opts(s.m[f[0]])}</select></label>`).join('')}</div>
     <div class="tblwrap" style="max-height:260px;overflow:auto"><table class="grid-t"><thead><tr><th>หมวด</th><th>รายการ</th><th>หน่วย</th><th class="r">ปริมาณ</th><th class="r">ค่าแรง</th><th class="r">BOQ</th><th class="r">80%</th></tr></thead><tbody>${items.slice(0,40).map(t=>`<tr><td class="small muted">${esc(t.group)}</td><td>${esc(t.name)}</td><td>${esc(t.unit)}</td><td class="r mono">${fq(t.qty)}</td><td class="r mono">${f2(t.rate)}</td><td class="r mono">${t.bqMapped?(t.bq?fq(t.bq):'<span class="chip warn">ไม่มี</span>'):'-'}</td><td class="r mono">${t.cap?fq(t.cap):'-'}</td></tr>`).join('')||'<tr><td colspan="7" class="empty small">ไม่พบรายการ — ลองเลือกคอลัมน์ รายการ/หน่วย/ปริมาณ</td></tr>'}</tbody></table></div>
     <div class="row" style="margin-top:10px"><label class="row small" style="gap:6px">วิธีนำเข้า<select id="ibm" style="width:auto"><option value="add">เพิ่ม / อัปเดตรายการที่หมวด+ชื่อตรงกัน</option><option value="replace">แทนที่ทั้งหมดของอาคารนั้น</option></select></label><button class="btn pri" data-x="go" style="margin-left:auto">นำเข้า</button></div>`;
  };
  o.addEventListener('change',async e=>{const t=e.target;
    if(t.id==='ibf'){const f=t.files[0];if(!f)return;try{wb=XLSX.read(await f.arrayBuffer(),{type:'array'});wb.SheetNames.forEach(n=>{const A=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''});const m=detectBoqCols(A);const b=guessBuilding(n);sh[n]={A,m,b,use:!!b&&parseBoqSheet(A,m).length>0}});cur=wb.SheetNames.find(n=>sh[n].use)||wb.SheetNames[0];draw()}catch(x){toast('อ่านไฟล์ไม่ได้: '+(x.message||x),4500)}return}
    if(t.dataset.use){sh[t.dataset.use].use=t.checked;return}
    if(t.dataset.bld!==undefined){const x=sh[t.dataset.bld];x.b=t.value;x.use=!!t.value;draw();return}
    if(t.dataset.mc){sh[cur].m[t.dataset.mc]=+t.value;draw();return}});
  o.addEventListener('click',e=>{const tr=e.target.closest('tr[data-sh]');if(tr&&!e.target.closest('input,select')){cur=tr.dataset.sh;draw();return}
    const b=e.target.closest('[data-x]');if(!b){if(e.target===o)o.remove();return}if(b.dataset.x==='close'){o.remove();return}
    const mode=$('#ibm',o).value;let n=0,bl=new Set();
    for(const name of wb.SheetNames){const x=sh[name];if(!x.use||!x.b)continue;const items=parseBoqSheet(x.A,x.m);
      if(mode==='replace'&&!bl.has(x.b)){S.boq.filter(i=>i.building===x.b).forEach(i=>del('boq',i.id))}bl.add(x.b);
      for(const t of items){const ex=S.boq.find(i=>i.building===x.b&&i.name===t.name&&(i.group||'')===t.group);const v={building:x.b,...t};if(ex){Object.assign(ex,v);save(ex)}else add('boq',Object.assign({note:''},v));n++}}
    if(n){toast(`นำเข้า ${n} รายการ จาก ${bl.size} อาคารแล้ว`);o.remove();render()}else toast('ไม่มีรายการให้นำเข้า — ตรวจการติ๊กชีต/อาคาร')});
}

