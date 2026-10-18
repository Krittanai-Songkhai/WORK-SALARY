/* ===== นำเข้า BOQ ผรม. แบบ “สรุปงานเหมา + รายละเอียด ITEM → ชั้น → ห้อง (ตร.ม.)” =====
   ชีตตัวอย่าง: ปูกระเบื้องอาคาร D — หัวบล็อก (ลำดับ, ชื่อ, ขนาดกระเบื้อง) → แถว “- ชั้น N” (ปริมาณรวมชั้น, ค่าแรง/ตร.ม.) → แถวห้อง (เลขห้อง, ชนิด, ตร.ม.) */
const T_FLOOR=/^\s*-\s*ชั้น\s*([^\s]+)/;
const tNum=v=>typeof v==='number'?v:(String(v).trim()!==''&&isFinite(+String(v).replace(/,/g,''))?+String(v).replace(/,/g,''):NaN);
const tUnit=u=>{u=String(u||'').trim();return /^ตร\.?\s?ม\.?$/.test(u)?'ตร.ม.':u};
function isTileSheet(A){let n=0;for(const r of A){if(T_FLOOR.test(String(r[3]||'')))n++;if(n>=2)return true}return false}
function tileGroup(name,sheetName){
  const s=String(name);
  if(/^\(?\s*(#|ไม่ทราบ)/.test(s)||/#REF/.test(s))return'ไม่ระบุชื่อ (#REF!)';
  if(/ฉาบ/.test(s))return'งานฉาบ';
  if(/กระเบื้อง/.test(s)&&/ผนัง/.test(s))return'งานกระเบื้องผนัง';
  if(/กระเบื้อง/.test(s)&&/พื้น|ส่วนกลาง/.test(s))return'งานกระเบื้องพื้น';
  const t=String(sheetName||'').replace(/อาคาร\s*\S+/,'').trim();return t?(/^งาน/.test(t)?t:'งาน'+t):'งานกระเบื้อง';
}
function parseTileSheet(A,sheetName){
  const out={building:'',bidder:'',kind:'',category:'',items:[],warn:[],skipped:[]};
  for(let i=0;i<Math.min(12,A.length);i++){const r=A[i];const t=r.map(x=>String(x)).join(' ');
    if(/หมวดงาน/.test(t)&&!out.category)out.category=(t.match(/หมวดงาน[^\d]*?([^\s].*?)(?:\s{2,}|$)/)||[])[0]||'';
    if(/BIDDER/i.test(t)){const x=r.slice(14).map(v=>String(v).trim()).filter(v=>v&&!/^\d{4}-/.test(v));out.bidder=x[0]||'';out.kind=x[1]||''}}
  out.building=guessBuilding(sheetName)||guessBuilding(out.category.replace(/.*อาคาร/,''))||'';
  // ตารางสรุป: ลำดับ + รหัส + ชื่อ
  const sum={};
  for(const r of A){const no=tNum(r[1]);if(isFinite(no)&&String(r[5]).trim()==='เหมา'&&String(r[3]).trim())sum[no]={code:String(r[2]).trim(),name:String(r[3]).trim(),amount:tNum(r[10])}}
  let cur=null,fl=null,fr=null,sinceTotal=true;
  const closeFloor=()=>{
    if(cur&&fr){
      if(!fr.rooms.length&&fr.rate>0&&fr.qty>0)fr.rooms.push({name:(fr.loc||('ชั้น '+fr.f)),qty:fr.qty});
      const sm=fr.rooms.reduce((a,x)=>a+x.qty,0);
      if(fr.rooms.length&&fr.qty&&Math.abs(sm-fr.qty)>0.5)cur.warn.push(`ชั้น ${fr.f}: ผลรวมห้อง ${sm.toFixed(2)} ≠ ปริมาณชั้น ${fr.qty}`);
      fr.rooms.forEach(x=>cur.rooms.push({floor:fr.f,name:x.name,qty:x.qty}));if(fr.rate>0)cur.rates.push(fr.rate);
    }fr=null};
  const closeBlock=()=>{closeFloor();if(cur){out.items.push(cur)}cur=null};
  for(let i=0;i<A.length;i++){
    const r=A[i];const c3=String(r[3]||'');
    // หัวบล็อก: ลำดับ + ชื่อ (อาจเป็น #REF!) + ขนาด; ไม่มีหน่วย
    if(isFinite(tNum(r[1]))&&String(r[2]).trim()!==''&&String(r[5]).trim()===''&&String(r[3]).trim()===''&&i>10){
      closeBlock();const no=tNum(r[1]);const raw=String(r[2]).trim();const bad=/^#/.test(raw);const sn=sum[no];
      cur={no,code:sn?sn.code:'',name:bad?`(ชื่อเสีย ${raw}) ลำดับ ${no}`:raw,spec:String(r[4]||'').trim(),bad,rooms:[],rates:[],warn:[],floors:[]};continue}
    if(!cur)continue;
    const m=T_FLOOR.exec(c3);
    if(m){closeFloor();fr={f:m[1],qty:tNum(r[6])||0,rate:tNum(r[9])||0,loc:String(r[4]||'').trim(),rooms:[]};cur.floors.push(m[1]);continue}
    if(/^\s*รวม\s*$/.test(c3)){closeBlock();continue}
    if(fr&&isFinite(tNum(r[3]))&&String(r[3]).trim()!==''&&isFinite(tNum(r[6]))){
      let no=String(Math.round(tNum(r[3])));const f=fr.f;
      if(/^\d{3,}$/.test(no)&&/^\d$/.test(f)&&no[0]!==f){no=f+no.slice(1);cur.fix=(cur.fix||0)+1}
      const type=String(r[4]||'').trim();fr.rooms.push({name:type?`${no} ${type}`:no,qty:tNum(r[6])});continue}
    if(fr&&/^\s*-\s*\S/.test(c3)&&isFinite(tNum(r[6]))){   // เช่น “- บันได” ที่ไม่มีราคา
      const rate=tNum(r[9])||0;const nm=c3.replace(/^\s*-\s*/,'').trim();
      if(rate>0)fr.rooms.push({name:nm,qty:tNum(r[6])});else out.skipped.push(`${cur.name}: ${nm} ${tNum(r[6])} ตร.ม. (ไม่มีราคา)`)}
  }
  closeBlock();
  out.items=out.items.filter(it=>it.rooms.length);
  for(const it of out.items){
    it.unit='ตร.ม.';it.qty=+it.rooms.reduce((a,x)=>a+x.qty,0).toFixed(3);
    const cnt={};it.rates.forEach(x=>cnt[x]=(cnt[x]||0)+1);it.rate=+(Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||0);
    it.priced=it.rate>0;it.group=tileGroup(it.name,sheetName);
    if(it.fix)out.warn.push(`${it.name}: แก้เลขห้อง ${it.fix} ห้องให้ตรงหัวชั้น (เช่น 401 ใต้ “ชั้น 3” → 301)`);
    if(!it.priced)out.warn.push(`${it.name}: ไม่มีค่าแรง/ราคาในไฟล์`);
    it.warn.forEach(w=>out.warn.push(`${it.name} · ${w}`));
  }
  return out;
}
function importTileDialog(wb,building){
  const parsed=wb.SheetNames.map(n=>({n,A:XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''})})).filter(x=>isTileSheet(x.A)).map(x=>({n:x.n,...parseTileSheet(x.A,x.n)}));
  if(!parsed.length){toast('ไม่พบรูปแบบ “ชั้น → ห้อง” ในไฟล์นี้');return false}
  const o=overlay(`<div class="box wide"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">นำเข้า BOQ ปูกระเบื้อง (แยกหมวด/ITEM/ห้อง อัตโนมัติ)</h3><button class="btn" data-x="close">ปิด</button></div><div id="tbody"></div></div>`,'modal');
  const sel={};parsed.forEach(p=>p.items.forEach(it=>{it.use=it.priced&&!it.bad}));
  const bld={};parsed.forEach(p=>bld[p.n]=p.building||building||S.project.buildings[0]);
  const crewSel={};
  const draw=()=>{
    $('#tbody',o).innerHTML=parsed.map(p=>{
      const b=bld[p.n];const crews=S.crews.filter(c=>c.building===b&&c.mode==='room');
      const def=crewSel[p.n]!==undefined?crewSel[p.n]:((crews.find(c=>p.bidder&&c.name.includes(p.bidder))||{}).id||'');crewSel[p.n]=def;
      const rooms=new Set();p.items.filter(i=>i.use).forEach(i=>i.rooms.forEach(r=>rooms.add(r.floor+'|'+r.name.split(' ')[0])));
      return`<div style="margin-bottom:14px"><div class="row" style="margin-bottom:6px"><b>ชีต “${esc(p.n)}”</b><span class="small muted">${esc(p.category||'')} ${p.bidder?'· ผู้รับเหมา: '+esc(p.bidder)+(p.kind?' ('+esc(p.kind)+')':''):''}</span>
        <label class="row small" style="margin-left:auto;gap:6px">อาคาร<select data-bld="${esc(p.n)}" style="width:auto">${S.project.buildings.map(x=>`<option ${x===b?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div>
       <div class="tblwrap"><table class="grid-t"><thead><tr><th>นำเข้า</th><th>หมวด</th><th>ITEM</th><th>ขนาด</th><th class="r">ห้อง/จุด</th><th class="r">ตร.ม.</th><th class="r">ค่าแรง/ตร.ม.</th></tr></thead><tbody>
       ${p.items.map((it,i)=>`<tr class="${it.use?'':'muted'}"><td><input type="checkbox" data-it="${esc(p.n)}:${i}" ${it.use?'checked':''}></td><td class="small">${esc(it.group)}</td><td>${esc(it.name)}${it.code?` <span class="chip">${esc(it.code)}</span>`:''}${it.priced?'':' <span class="chip warn">ไม่มีราคา</span>'}</td><td class="small">${esc(it.spec)}</td><td class="r mono">${it.rooms.length}</td><td class="r mono">${fq(it.qty)}</td><td class="r mono">${it.rate?f2(it.rate):'-'}</td></tr>`).join('')}</tbody></table></div>
       <div class="small muted" style="margin-top:4px">จะสร้าง/อัปเดต ${p.items.filter(i=>i.use).length} ITEM · ${rooms.size} ห้อง/จุด ในอาคาร ${esc(b)} · ปริมาณ ตร.ม. ต่อห้องถูกใส่ในตารางห้อง</div>
       <label class="f" style="margin-top:8px">ผูกกับชุดช่าง (ใส่ ITEM + ค่าแรง + ห้องทั้งหมดให้ชุดนี้)<select data-crew="${esc(p.n)}"><option value="">— ไม่ผูก (เลือกในหน้าชุดช่างภายหลัง) —</option>${crews.map(c=>`<option value="${c.id}" ${c.id===def?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label>
       ${p.warn.length||p.skipped.length?`<details style="margin-top:6px"><summary class="small warnt">ข้อสังเกต ${p.warn.length+p.skipped.length} ข้อ (กดดู)</summary><ul class="small" style="margin:6px 0 0 18px">${p.warn.map(w=>`<li>${esc(w)}</li>`).join('')}${p.skipped.map(w=>`<li>ข้าม: ${esc(w)}</li>`).join('')}</ul></details>`:''}</div>`}).join('')
      +`<div class="row" style="justify-content:flex-end"><label class="row small" style="gap:6px;margin-right:auto"><input type="checkbox" id="treset" checked> ล้างปริมาณเดิมของ ITEM ที่นำเข้าซ้ำ (กันห้องเก่าค้าง)</label><button class="btn pri" data-x="ok">นำเข้า</button></div>`;
  };
  draw();
  o.addEventListener('change',e=>{const t=e.target;
    if(t.dataset.it){const[n,i]=t.dataset.it.split(':');parsed.find(p=>p.n===n).items[+i].use=t.checked;draw();return}
    if(t.dataset.bld){bld[t.dataset.bld]=t.value;delete crewSel[t.dataset.bld];draw();return}
    if(t.dataset.crew!==undefined){crewSel[t.dataset.crew]=t.value}});
  o.addEventListener('click',e=>{const x=e.target.closest('[data-x]');if(!x){if(e.target===o)o.remove();return}
    if(x.dataset.x==='close'){o.remove();return}
    const reset=$('#treset',o).checked;let ni=0,nr=0;
    for(const p of parsed){const b=bld[p.n];const crew=crewSel[p.n]?by('crews',crewSel[p.n]):null;const touched=new Set();
      for(const it of p.items.filter(i=>i.use)){
        const loc=[it.code,it.spec].filter(Boolean).join(' · ');
        let bi=S.boq.find(y=>y.building===b&&y.name===it.name&&(y.loc||'')===loc);
        const v={building:b,group:it.group,name:it.name,loc,unit:'ตร.ม.',qty:it.qty,rate:it.rate,bq:it.priced?it.qty:0,bqMapped:true,cap:0,tile:true,code:it.code||''};
        if(bi){Object.assign(bi,v);save(bi)}else bi=add('boq',Object.assign({note:it.priced?'':'ไม่มีราคาในไฟล์'},v));
        if(reset)S.rooms.filter(r=>r.building===b).forEach(r=>{if(r.qty&&r.qty[bi.id]!==undefined){delete r.qty[bi.id];save(r)}});
        for(const rm of it.rooms){
          const key=rm.name.split(' ')[0];
          let ro=S.rooms.find(r=>r.building===b&&(r.floor||'')===rm.floor&&(r.name===rm.name||r.name.split(' ')[0]===key));
          if(!ro)ro=add('rooms',{building:b,floor:rm.floor,name:rm.name,qty:{}});
          else if(rm.name.includes(' ')&&!ro.name.includes(' ')){ro.name=rm.name}
          ro.qty=ro.qty||{};ro.qty[bi.id]=+rm.qty.toFixed(3);save(ro);touched.add(ro.id);nr++}
        if(crew){crew.rates=crew.rates||{};crew.rates[bi.id]=it.rate;crew.roomIds=crew.roomIds||[];touched.forEach(id=>{if(!crew.roomIds.includes(id))crew.roomIds.push(id)});save(crew)}
        ni++}}
    o.remove();toast(`นำเข้า ${ni} ITEM · ${nr} ช่องห้อง${''} แล้ว`,4000);UI.tab='boq';render()});
  return true;
}
