/* ===== ตัวจัดการเหตุการณ์ ===== */
const curSub=()=>by('subs',UI.sub);
function refreshSub(){
  const s=curSub();if(!s)return;const c=by('crews',s.crewId);const k=calcCrew(c,s.no);
  const st=$('#substats');if(st)st.innerHTML=subStats(k);
  for(const r of k.rows){const set=(f,v)=>{const el=$(`[data-c="${r.key}:${f}"]`);if(el)el.textContent=v};set('cum',fq(r.cum));set('pct',pct(r.pct));set('amt',f2(r.curAmt));set('prev',r.prev?fq(r.prev):'-')}
  $$('input[data-e]').forEach(i=>{const r=k.rows.find(x=>x.key===i.dataset.e);if(r)i.classList.toggle('bad',r.over)});
}
function setSubEntry(s,key,v){const n=num(v);s.entries=s.entries||{};if(n)s.entries[key]=n;else delete s.entries[key];save(s)}

const ACT={
  tab(el){UI.tab=el.dataset.v;UI.crew=UI.sub=null;render()},
  back(){UI.crew=null;render()},
  backcrew(){UI.sub=null;render()},
  opencrew(el){UI.crew=el.dataset.id;render();scrollTo(0,0)},
  newcrew(el){const c=newCrew({building:el.dataset.b||UI.b||S.project.buildings[0],name:'ชุดใหม่'});UI.crew=c.id;render();scrollTo(0,0)},
  delcrew(el){armBtn(el,'กดอีกครั้งเพื่อลบชุดและงวดทั้งหมด',()=>{const c=by('crews',UI.crew);S.subs.filter(s=>s.crewId===c.id).forEach(s=>del('subs',s.id));del('crews',c.id);UI.crew=null;render()})},
  newline(){const c=by('crews',UI.crew);newLine(c,{});render()},
  delline(el){const c=by('crews',UI.crew);c.lines=c.lines.filter(l=>l.id!==el.dataset.id);save(c);render()},
  fromboq(){
    const c=by('crews',UI.crew);const ctl=boqControl(c.building);const have=new Set((c.lines||[]).map(l=>l.boqId));const list=ctl.filter(x=>!have.has(x.it.id));
    if(!list.length){toast('ไม่มีรายการ BOQ ของอาคารนี้ที่ยังไม่ได้เพิ่ม');return}
    const o=overlay(`<div class="box wide"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">เลือกรายการจาก BOQ อาคาร ${esc(c.building)}</h3><button class="btn" data-x="close">ปิด</button></div><p class="hint">ปริมาณที่ใส่ให้ = ส่วนที่ยังเหลือยังไม่ได้จัดสรรให้ชุดอื่น (แก้ได้ภายหลัง)</p>
     ${list.map(x=>`<label class="pickrow"><input type="checkbox" value="${x.it.id}"><span style="flex:1">${esc((x.it.group?x.it.group+' · ':'')+x.it.name)}</span><span class="small muted">BOQ ${fq(x.qty)} ${esc(x.it.unit||'')} · เหลือ ${fq(x.remain)}</span></label>`).join('')}
     <div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn pri" data-x="ok">เพิ่มที่เลือก</button></div></div>`,'modal');
    o.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b){if(e.target===o)o.remove();return}
      if(b.dataset.x==='close'){o.remove();return}
      const ids=$$('input:checked',o).map(i=>i.value);ids.forEach(id=>{const x=ctl.find(y=>y.it.id===id);const t=x.it;newLine(c,{floor:t.group||'',name:t.name,unit:t.unit||'',qty:x.remain>0?+x.remain.toFixed(3):num(t.qty),rate:num(t.rate),boqId:t.id})});o.remove();render()});
  },
  roomsall(){const c=by('crews',UI.crew);c.roomIds=S.rooms.filter(r=>r.building===c.building).map(r=>r.id);save(c);render()},
  roomsnone(){const c=by('crews',UI.crew);c.roomIds=[];save(c);render()},
  newsub(){const c=by('crews',UI.crew);const s=newSub(c);UI.sub=s.id;render();scrollTo(0,0)},
  opensub(el){UI.sub=el.dataset.id;render();scrollTo(0,0)},
  docsub(el){const s=by('subs',el.dataset.id);const c=by('crews',s.crewId);previewDoc(crewDocPages(c,s.no),`${c.building}_${c.name}_งวด${s.no}`)},
  xlssub(el){const s=by('subs',el.dataset.id);exportXlsx(by('crews',s.crewId),s.no)},
  delsub(el){armBtn(el,'กดอีกครั้งเพื่อลบงวด',()=>{const s=curSub();UI.sub=null;UI.crew=s.crewId;del('subs',s.id);render()})},
  fillall(){const s=curSub();const k=calcCrew(by('crews',s.crewId),s.no);k.rows.forEach(r=>{const rem=r.qty-r.prev;if(rem>1e-9)s.entries[r.key]=+rem.toFixed(4)});save(s);render()},
  clearall(){const s=curSub();s.entries={};save(s);render()},
  fullroom(el){const s=curSub();const k=calcCrew(by('crews',s.crewId),s.no);k.rows.filter(r=>r.roomId===el.dataset.id).forEach(r=>{const rem=r.qty-r.prev;if(rem>1e-9)s.entries[r.key]=+rem.toFixed(4)});save(s);render()},
  pctline(el){const s=curSub();const k=calcCrew(by('crews',s.crewId),s.no);const r=k.rows.find(x=>x.key===el.dataset.key);const p=+el.dataset.p;
    const v=p===100?Math.max(0,r.qty-r.prev):r.qty*p/100;setSubEntry(s,r.key,+v.toFixed(4));render()},
  bpdf(){const pg=buildingPages(UI.b,UI.kind);previewDoc(pg,'สรุปส่งงาน_'+(UI.b||'ทุกอาคาร'))},
  bxls(){exportBuildingXlsx(UI.b)},
  newboq(){const b=UI.b||S.project.buildings[0];add('boq',{building:b,group:'',name:'',unit:'',qty:0,rate:0,note:''});render()},
  delboq(el){armBtn(el,'ลบ?',()=>{del('boq',el.dataset.id);render()})},
  impboq(){importDialog('boq',UI.b||S.project.buildings[0])},
  impRooms(){importDialog('rooms',UI.b||S.project.buildings[0])},
  newroom(){const b=UI.b||S.project.buildings[0];const last=S.rooms.filter(r=>r.building===b).slice(-1)[0];add('rooms',{building:b,floor:last?last.floor:'1',name:'',qty:{}});render()},
  newitem(){const b=UI.b||S.project.buildings[0];add('boq',{building:b,group:'งานกระเบื้อง',name:'ITEM ใหม่',unit:'ตร.ม.',qty:0,rate:0,note:'',tile:true});render()},
  delroom(el){armBtn(el,'ลบ?',()=>{S.crews.forEach(c=>{if((c.roomIds||[]).includes(el.dataset.id)){c.roomIds=c.roomIds.filter(x=>x!==el.dataset.id);save(c)}});del('rooms',el.dataset.id);render()})},
  login(){loginDialog()},logout(){logout()},
  syncnow(){cloudFlush().then(()=>cloudLoad()).then(()=>{render();toast('ซิงก์แล้ว')}).catch(e=>toast('ซิงก์ไม่สำเร็จ: '+(e.message||e),4500))},
  async saveacl(){const eds=$('#eds').value.split(/[,\s]+/).map(x=>x.trim().toLowerCase()).filter(Boolean);S.project.editors=eds;save();
    const{error}=await MODE.sb.rpc('set_acl',{p_grp:GRP,p_access:'members',p_readers:[],p_editors:eds});toast(error?'ตั้งสิทธิ์ไม่สำเร็จ: '+error.message:'บันทึกสิทธิ์แล้ว',4000)},
  bkup(){saveFile(`workdesk-backup-${todayISO()}.json`,new Blob([JSON.stringify({v:1,project:S.project,crews:S.crews,boq:S.boq,rooms:S.rooms,subs:S.subs})],{type:'application/json'}))},
  sample(){if(S.boq.some(b=>b.building==='D')){toast('อาคาร D มี BOQ อยู่แล้ว');return}const c=sampleTile();toast('โหลดตัวอย่างแล้ว'+(c?` · ผูกกับ “${c.name}”`:''));UI.tab='boq';UI.b='D';render()},
  wipe(el){armBtn(el,'กดอีกครั้งเพื่อล้างทั้งหมด',()=>{['wd:data','wd:dirty','wd:dels','wd:synced'].forEach(k=>localStorage.removeItem(k));location.reload()})}
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||e.target.closest('input,select,textarea'))return;
  const f=ACT[el.dataset.act];if(f)f(el)});

const setField=(o,f,v)=>{o[f]=v;save(o)};
document.addEventListener('input',e=>{
  const t=e.target;if(!t.matches||!t.matches('input[type=text],input[type=number],input[type=date],input[type=search],textarea'))return;const d=t.dataset;
  if(d.c){const c=by('crews',UI.crew);setField(c,d.c,t.value);return}
  if(d.l){const[id,f]=d.l.split(':');const c=by('crews',UI.crew);const l=c.lines.find(x=>x.id===id);const numF=f==='qty'||f==='rate';l[f]=numF?num(t.value):t.value;save(c);
    if(numF){const a=$(`[data-amt="${id}"]`);if(a)a.textContent=f2(num(l.qty)*num(l.rate));const tot=$('#lntot');if(tot)tot.innerHTML='<b>'+f2(calcCrew(c).T.amt)+'</b>'}return}
  if(d.e!==undefined){const s=curSub();setSubEntry(s,d.e,t.value);refreshSub();return}
  if(d.s){const s=curSub();setField(s,d.s,t.value);return}
  if(d.b){const[id,f]=d.b.split(':');const o=by('boq',id);o[f]=(f==='qty'||f==='rate')?num(t.value):t.value;save(o);return}
  if(d.rm2){const[id,f]=d.rm2.split(':');setField(by('rooms',id),f,t.value);return}
  if(d.r){const[id,iid]=d.r.split(':');const r=by('rooms',id);r.qty=r.qty||{};const n=num(t.value);if(n)r.qty[iid]=n;else delete r.qty[iid];save(r);
    const tot=$(`[data-rt="${iid}"]`);if(tot)tot.innerHTML='<b>'+fq(S.rooms.filter(x=>x.building===r.building).reduce((a,x)=>a+num((x.qty||{})[iid]),0))+'</b>';return}
  if(d.rate){const c=by('crews',UI.crew);c.rates[d.rate]=num(t.value);save(c);return}
  if(d.p){S.project[d.p]=t.value;save();const b=$('.brand span');if(b)b.textContent=S.project.name+' · ส่งงาน / เบิกผลงาน';return}
  if(t.id==='bldg'){return}
});
document.addEventListener('change',async e=>{
  const t=e.target;const d=t.dataset||{};
  if(t.id==='fb'){UI.b=t.value;render();return}
  if(t.id==='fk'){UI.kind=t.value;render();return}
  if(t.id==='bldg'){const bs=t.value.split(/[,，]/).map(x=>x.trim()).filter(Boolean);if(bs.length){S.project.buildings=bs;save();render()}return}
  if(t.id==='bkin'){const f=t.files[0];t.value='';if(!f)return;try{const j=JSON.parse(await f.text());if(!j.crews)throw new Error('ไม่ใช่ไฟล์สำรองของ Work Desk');
      S.project=Object.assign(S.project,j.project||{});for(const c in COLL)S[c]=(j[c]||[]);tagAll();for(const c in COLL)S[c].forEach(o=>DIRTY.add(keyOf(COLL[c],o.id)));save();toast('กู้คืนข้อมูลแล้ว');render()}catch(x){toast('กู้คืนไม่สำเร็จ: '+(x.message||x),4500)}return}
  if(d.c&&t.matches('select,input[type=checkbox]')){const c=by('crews',UI.crew);const v=t.type==='checkbox'?t.checked:t.value;
    if(d.c==='mode'&&c.mode!==v&&(c.lines.length||(c.roomIds||[]).length)&&!confirm('เปลี่ยนรูปแบบเอกสาร ข้อมูลรายการ/ห้องเดิมยังอยู่แต่จะไม่แสดงจนกว่าจะสลับกลับ ต้องการเปลี่ยนหรือไม่?')){render();return}
    setField(c,d.c,v);render();return}
  if(d.l&&t.matches('select')){const[id,f]=d.l.split(':');const c=by('crews',UI.crew);const l=c.lines.find(x=>x.id===id);l[f]=t.value;
    if(f==='boqId'&&t.value){const b=by('boq',t.value);if(b){if(!l.name)l.name=b.name;if(!l.unit)l.unit=b.unit||'';if(!num(l.rate)&&num(b.rate))l.rate=b.rate}}save(c);render();return}
  if(d.s==='sent'){setField(curSub(),'sent',t.checked);return}
  if(d.ri){const c=by('crews',UI.crew);c.rates=c.rates||{};if(t.checked){const b=by('boq',d.ri);c.rates[d.ri]=c.rates[d.ri]||num(b&&b.rate)}else delete c.rates[d.ri];save(c);render();return}
  if(d.rm){const c=by('crews',UI.crew);const s=new Set(c.roomIds||[]);t.checked?s.add(d.rm):s.delete(d.rm);c.roomIds=[...s];save(c);render();return}
  if(d.rf!==undefined){const c=by('crews',UI.crew);const ids=S.rooms.filter(r=>r.building===c.building&&(r.floor||'')===d.rf).map(r=>r.id);const s=new Set(c.roomIds||[]);ids.forEach(i=>t.checked?s.add(i):s.delete(i));c.roomIds=[...s];save(c);render();return}
});
window.addEventListener('beforeunload',()=>{persist()});
(async()=>{await initStore();render()})();
