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
