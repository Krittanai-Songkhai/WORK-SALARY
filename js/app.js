/* ===== ตัวจัดการเหตุการณ์ ===== */
const curSub=()=>by('subs',UI.sub);
function refreshSub(){
  const s=curSub();if(!s)return;const c=by('crews',s.crewId);const k=calcCrew(c,s.no);
  const st=$('#substats');if(st)st.innerHTML=subStats(k);
  for(const r of k.rows){const set=(f,v)=>{const el=$(`[data-c="${r.key}:${f}"]`);if(el)el.textContent=v};set('cum',fq(r.cum));set('pct',pct(r.pct));set('amt',f2(r.curAmt));set('prev',r.prev?fq(r.prev):'-')}
  $$('input[data-e]').forEach(i=>{const r=k.rows.find(x=>x.key===i.dataset.e);if(r)i.classList.toggle('bad',r.over)});
  $$('input[data-pe]').forEach(i=>{if(i===document.activeElement)return;const r=k.rows.find(x=>x.key===i.dataset.pe);if(r)i.value=r.qty&&r.cur?+(r.cur/r.qty*100).toFixed(2):''});
  $$('input[data-e]').forEach(i=>{if(i===document.activeElement)return;const r=k.rows.find(x=>x.key===i.dataset.e);if(r)i.value=r.cur||''});
}
function setSubEntry(s,key,v){const n=num(v);s.entries=s.entries||{};if(n)s.entries[key]=n;else delete s.entries[key];save(s)}

const curSubCrew=()=>{const s=curSub();return s&&by('crews',s.crewId)};
async function fileToPng(file,max){const im=await createImageBitmap(file);const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c.toDataURL('image/png')}
const markBoard=(o,kind,title,extra)=>openBoard(Object.assign({kind,title,imgUrl:imgSrc(o.imgId),w:o.w,h:o.h,shapes:(o.shapes=o.shapes||[]),noPin:true,onChange:()=>save(curSub()||o),onClose:()=>render()},extra||{}));
const ACT={
  async crewpdf(el){const c=by('crews',el.dataset.id);const ss=subsOf(c);if(!ss.length){toast('ชุดนี้ยังไม่มีงวด — เปิดชุดแล้วกด “เริ่มงวดใหม่”');return}
    const no=ss[ss.length-1].no;toast('กำลังสร้าง PDF…',3000);exportPages(await crewDocReady(c,no),`${c.building}_${c.name}_งวด${no}`,'pdf')},
  zipcrews(){
    if(!window.JSZip){toast('ยังโหลดตัวสร้าง ZIP ไม่ได้ (ต้องมีอินเทอร์เน็ตครั้งแรก)');return}
    const cs=S.crews.filter(c=>(!UI.b||c.building===UI.b)&&(!UI.kind||c.kind===UI.kind)).sort((a,z)=>natCmp(a.building,z.building));
    const o=overlay(`<div class="box wide"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">ส่งออกแยกชุดช่าง (ไฟล์ละชุด รวมเป็น ZIP)</h3><button class="btn" data-x="close">ปิด</button></div>
     <p class="hint">ใช้งวดล่าสุดของแต่ละชุด รวมแบบและรูปที่แนบไว้ในงวดนั้น</p>
     <div class="row" style="margin-bottom:8px"><label><input type="checkbox" id="zfp" checked> PDF</label><label><input type="checkbox" id="zfx"> Excel</label><span style="margin-left:auto" class="row"><button class="btn sm" data-x="all">เลือกทั้งหมด</button><button class="btn sm" data-x="none">ล้าง</button></span></div>
     ${cs.map(c=>{const n=subsOf(c).length;return`<label class="pickrow ${n?'':'dim'}"><input type="checkbox" value="${c.id}" ${n&&!c.skip?'checked':''} ${n?'':'disabled'}><span style="flex:1"><b>${esc(c.name)}</b> <span class="small muted">อาคาร ${esc(c.building)}</span></span><span class="small muted">${n?'งวดล่าสุด '+subsOf(c)[n-1].no:'ยังไม่มีงวด'}</span></label>`}).join('')}
     <div class="row" style="margin-top:10px;justify-content:flex-end"><span class="small muted" id="zst" style="margin-right:auto"></span><button class="btn pri" data-x="go">สร้าง ZIP</button></div></div>`,'modal');
    o.addEventListener('click',async e=>{const b=e.target.closest('[data-x]');if(!b){if(e.target===o)o.remove();return}const x=b.dataset.x;
      if(x==='close'){o.remove();return}
      if(x==='all'||x==='none'){$$('input[value]:not(:disabled)',o).forEach(i=>i.checked=x==='all');return}
      const ids=$$('input[value]:checked',o).map(i=>i.value);const wp=$('#zfp',o).checked,wx=$('#zfx',o).checked;if(!ids.length||(!wp&&!wx)){toast('เลือกชุดและรูปแบบไฟล์ก่อน');return}
      b.disabled=true;const zip=new JSZip();const used=new Set();let i=0;
      try{for(const id of ids){const c=by('crews',id);const ss=subsOf(c);const no=ss[ss.length-1].no;i++;$('#zst',o).textContent=`กำลังสร้าง ${i}/${ids.length}: ${c.name}`;
        let base=safeName(`${c.building}_${c.name}_งวด${no}`);while(used.has(base))base+='_';used.add(base);
        if(wp)zip.file(base+'.pdf',await pagesToPdf(await crewDocReady(c,no)));if(wx)zip.file(base+'.xlsx',await crewXlsxBlob(c,no))}
        const out=await zip.generateAsync({type:'blob'});await saveFile(safeName(`ส่งงาน_${UI.b||'ทุกอาคาร'}_${todayISO()}`)+'.zip',out);toast(`สร้าง ZIP ${ids.length} ชุดแล้ว`);o.remove()}
      catch(err){toast('สร้าง ZIP ไม่สำเร็จ: '+(err.message||err),5000);b.disabled=false}});
  },
  addplan(){
    const c=curSubCrew();const list=S.plans.filter(p=>p.building===c.building);
    if(!list.length){toast('ยังไม่มีแบบของอาคาร '+c.building+' — ไปแท็บ “แบบ” เพื่ออัปโหลดก่อน',4000);return}
    const files=new Map();list.forEach(p=>{const k=p.fileId||p.id;if(!files.has(k))files.set(k,[]);files.get(k).push(p)});
    const o=overlay(`<div class="box wide"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">เลือกแบบ อาคาร ${esc(c.building)}</h3><button class="btn" data-x="close">ปิด</button></div>
     ${[...files.values()].map(pg=>{pg.sort((a,z)=>(a.page||1)-(z.page||1));return`<div class="ghead l1"><b>${esc(pg[0].fileName||pg[0].name)}</b></div><div class="roomgrid">${pg.map(p=>`<label class="rchip"><input type="checkbox" value="${p.id}"> <span>${esc(p.name)}</span></label>`).join('')}</div>`}).join('')}
     <div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn pri" data-x="go">แนบที่เลือก</button></div></div>`,'modal');
    o.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b){if(e.target===o)o.remove();return}if(b.dataset.x==='close'){o.remove();return}
      const s=curSub();s.plans=s.plans||[];$$('input:checked',o).forEach(i=>{const p=by('plans',i.value);s.plans.push({id:uid(),libId:p.id,imgId:p.imgId,w:p.w,h:p.h,name:p.name,shapes:clone(p.shapes||[]),sym:p.sym||1})});save(s);o.remove();render()});
  },
  markplan(el){const s=curSub();const p=s.plans.find(x=>x.id===el.dataset.id);markBoard(p,'plan','แบบ · '+p.name,{scale:()=>p.sym||1,onScale:v=>{p.sym=v;save(s)},onFlip:async ax=>{const id=await flippedImageId(p.imgId,ax);p.imgId=id;mirrorShapes(p.shapes,p.w,p.h,ax);save(s);return imgSrc(id)}})},
  delplan(el){const s=curSub();s.plans=s.plans.filter(x=>x.id!==el.dataset.id);save(s);render()},
  markphoto(el){const s=curSub();const p=s.photos.find(x=>x.id===el.dataset.id);markBoard(p,'photo','รูปที่ '+(s.photos.indexOf(p)+1))},
  delphoto(el){const s=curSub();s.photos=s.photos.filter(x=>x.id!==el.dataset.id);save(s);render()},
  mvphoto(el){const s=curSub();const i=s.photos.findIndex(x=>x.id===el.dataset.id);const j=i+ +el.dataset.d;if(j<0||j>=s.photos.length)return;[s.photos[i],s.photos[j]]=[s.photos[j],s.photos[i]];save(s);render()},
  viewplan(el){const p=by('plans',el.dataset.id);openBoard({kind:'plan',title:p.name,imgUrl:imgSrc(p.imgId),w:p.w,h:p.h,shapes:(p.shapes=p.shapes||[]),noPin:true,scale:()=>p.sym||1,onScale:v=>{p.sym=v;save(p)},onChange:()=>save(p),onClose:()=>render()})},
  delplanfile(el){armBtn(el,'ลบทั้งไฟล์?',()=>{S.plans.filter(p=>(p.fileId||p.id)===el.dataset.id).forEach(p=>del('plans',p.id));render()})},
  dellogo(){S.project.logoId='';save();render()},
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
     ${[...new Set(list.map(x=>x.it.group||NOGRP))].map(g=>`<div class="pickgrp">${esc(g)}</div>`+list.filter(x=>(x.it.group||NOGRP)===g).map(x=>`<label class="pickrow"><input type="checkbox" value="${x.it.id}"><span style="flex:1">${esc(x.it.name)}</span><span class="small muted">BOQ ${fq(x.qty)} ${esc(x.it.unit||'')} · เหลือ ${fq(x.remain)}</span></label>`).join('')).join('')}
     <div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn pri" data-x="ok">เพิ่มที่เลือก</button></div></div>`,'modal');
    o.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b){if(e.target===o)o.remove();return}
      if(b.dataset.x==='close'){o.remove();return}
      const ids=$$('input:checked',o).map(i=>i.value);ids.forEach(id=>{const x=ctl.find(y=>y.it.id===id);const t=x.it;newLine(c,{floor:t.group||'',name:t.name,unit:t.unit||'',qty:x.remain>0?+x.remain.toFixed(3):num(t.qty),rate:num(t.rate),boqId:t.id})});o.remove();render()});
  },
  roomsall(){const c=by('crews',UI.crew);c.roomIds=S.rooms.filter(r=>r.building===c.building).map(r=>r.id);save(c);render()},
  roomsnone(){const c=by('crews',UI.crew);c.roomIds=[];save(c);render()},
  newsub(){const c=by('crews',UI.crew);const s=newSub(c);UI.sub=s.id;render();scrollTo(0,0)},
  opensub(el){UI.sub=el.dataset.id;render();scrollTo(0,0)},
  async docsub(el){const s=by('subs',el.dataset.id);const c=by('crews',s.crewId);previewDoc(await crewDocReady(c,s.no),`${c.building}_${c.name}_งวด${s.no}`)},
  xlssub(el){const s=by('subs',el.dataset.id);exportXlsx(by('crews',s.crewId),s.no)},
  delsub(el){armBtn(el,'กดอีกครั้งเพื่อลบงวด',()=>{const s=curSub();UI.sub=null;UI.crew=s.crewId;del('subs',s.id);render()})},
  fillall(){const s=curSub();const k=calcCrew(by('crews',s.crewId),s.no);k.rows.forEach(r=>{const rem=r.qty-r.prev;if(rem>1e-9)s.entries[r.key]=+rem.toFixed(4)});save(s);render()},
  clearall(){const s=curSub();s.entries={};save(s);render()},
  fullroom(el){const s=curSub();const k=calcCrew(by('crews',s.crewId),s.no);k.rows.filter(r=>r.roomId===el.dataset.id).forEach(r=>{const rem=r.qty-r.prev;if(rem>1e-9)s.entries[r.key]=+rem.toFixed(4)});save(s);render()},
  pctline(el){const s=curSub();const k=calcCrew(by('crews',s.crewId),s.no);const r=k.rows.find(x=>x.key===el.dataset.key);const p=+el.dataset.p;
    const v=p===100?Math.max(0,r.qty-r.prev):r.qty*p/100;setSubEntry(s,r.key,+v.toFixed(4));render()},
  async bpdf(){await ensureData([S.project.logoId],true);const pg=buildingPages(UI.b,UI.kind);previewDoc(pg,'สรุปส่งงาน_'+(UI.b||'ทุกอาคาร'))},
  bxls(){exportBuildingXlsx(UI.b,UI.kind)},
  newboq(){const b=UI.b||S.project.buildings[0];add('boq',{building:b,group:UI.bg&&UI.bg!==NOGRP?UI.bg:'',name:'',unit:'',qty:0,rate:0,note:''});render()},
  newboqg(el){const b=UI.b||S.project.buildings[0];add('boq',{building:b,group:el.dataset.g,name:'',unit:'',qty:0,rate:0,note:''});UI.bcol.delete(el.dataset.g||NOGRP);render()},
  newgrp(){const g=(prompt('ชื่อหมวดงานใหม่ (เช่น งานกระเบื้อง, งานสี, งานฝ้า)')||'').trim();if(!g)return;const b=UI.b||S.project.buildings[0];add('boq',{building:b,group:g,name:'',unit:'',qty:0,rate:0,note:''});UI.bg='';render()},
  rengrp(el){const g=el.dataset.g;const n=(prompt('เปลี่ยนชื่อหมวด',g)||'').trim();if(!n||n===g)return;const b=UI.b||S.project.buildings[0];S.boq.filter(x=>x.building===b&&(x.group||'')===g).forEach(x=>{x.group=n;save(x)});if(UI.bg===g)UI.bg=n;render()},
  setb(el){UI.b=el.dataset.v;UI.bg='';UI.bq='';render()},
  bgrp(el){UI.bg=el.dataset.g;render()},
  togg(el){const g=el.dataset.g;UI.bcol.has(g)?UI.bcol.delete(g):UI.bcol.add(g);render()},
  expall(){UI.bcol.clear();render()},
  collall(){S.boq.filter(x=>x.building===(UI.b||S.project.buildings[0])).forEach(x=>UI.bcol.add(x.group||NOGRP));render()},
  delboq(el){armBtn(el,'ลบ?',()=>{del('boq',el.dataset.id);render()})},
  impboq(){importBoqAll(UI.b||S.project.buildings[0])},
  impRooms(){importDialog('rooms',UI.b||S.project.buildings[0])},
  bulkrooms(){
    const b=UI.b||S.project.buildings[0];const its=S.boq.filter(x=>x.building===b&&x.tile).sort((x,y)=>natCmp(x.name,y.name));
    const o=overlay(`<div class="box wide"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">เพิ่มหลายห้อง / หลายชั้น อาคาร ${esc(b)}</h3><button class="btn" data-x="close">ปิด</button></div>
     <label class="f">ชั้น (เช่น 1-7 หรือ 1,2,3,R)<input type="text" id="bf" value="1-7"></label>
     <label class="f" style="margin-top:8px">รายชื่อห้องต่อชั้น (บรรทัดละห้อง ใช้ {F} แทนเลขชั้น)<textarea id="bn" rows="7" style="width:100%">{F}01 ห้องพัก\n{F}02 ห้องพัก\n{F}03 ห้องน้ำ\nทางเดิน ชั้น {F}</textarea></label>
     ${its.length?`<p class="hint" style="margin-top:8px">ปริมาณ ตร.ม. ต่อห้อง (ใช้เท่ากันทุกห้อง เว้นว่าง = 0 แก้รายห้องภายหลังได้)</p><div class="grid">${its.map(i=>`<label class="f">${esc(i.name)}<input type="number" step="any" data-bq="${i.id}"></label>`).join('')}</div>`:''}
     <div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn pri" data-x="ok">สร้างห้อง</button></div></div>`,'modal');
    o.addEventListener('click',e=>{const x=e.target.closest('[data-x]');if(!x){if(e.target===o)o.remove();return}if(x.dataset.x==='close'){o.remove();return}
      const fl=parseFloors($('#bf',o).value),names=$('#bn',o).value.split(/\n/).map(s=>s.trim()).filter(Boolean);
      if(!fl.length||!names.length){toast('ใส่ชั้นและชื่อห้องก่อน');return}
      const q={};$$('[data-bq]',o).forEach(i=>{const n=num(i.value);if(n)q[i.dataset.bq]=n});
      fl.forEach(f=>names.forEach(n=>add('rooms',{building:b,floor:String(f),name:n.replace(/\{F\}/g,f),qty:{...q}})));
      o.remove();toast(`สร้าง ${fl.length*names.length} ห้อง`);render()});
  },
  copyfloor(){
    const b=UI.b||S.project.buildings[0];const fls=[...new Set(S.rooms.filter(r=>r.building===b).map(r=>r.floor||''))].sort(natCmp);
    if(!fls.length){toast('ยังไม่มีห้องให้คัดลอก');return}
    const o=overlay(`<div class="box"><div class="row" style="margin-bottom:8px"><h3 style="margin-right:auto">คัดลอกชั้น</h3><button class="btn" data-x="close">ปิด</button></div>
     <label class="f">คัดลอกจากชั้น<select id="cf">${fls.map(f=>`<option>${esc(f)}</option>`).join('')}</select></label>
     <label class="f" style="margin-top:8px">ไปยังชั้น (เช่น 2-7)<input type="text" id="ct" value=""></label>
     <p class="hint">คัดลอกทุกห้องพร้อมปริมาณ ถ้าชื่อห้องขึ้นต้นด้วยเลขชั้นเดิม (เช่น 101) จะเปลี่ยนเป็นเลขชั้นใหม่ (201, 301…) และ {F}/ชั้น เดิมในชื่อก็เปลี่ยนตาม ชั้นปลายทางที่มีห้องอยู่แล้วจะถูกข้าม</p>
     <div class="row" style="margin-top:10px;justify-content:flex-end"><button class="btn pri" data-x="ok">คัดลอก</button></div></div>`,'modal');
    o.addEventListener('click',e=>{const x=e.target.closest('[data-x]');if(!x){if(e.target===o)o.remove();return}if(x.dataset.x==='close'){o.remove();return}
      const src=$('#cf',o).value;const tg=parseFloors($('#ct',o).value).map(String).filter(f=>f!==src);if(!tg.length){toast('ใส่ชั้นปลายทาง');return}
      const from=S.rooms.filter(r=>r.building===b&&(r.floor||'')===src);let n=0,skip=[];
      tg.forEach(f=>{if(S.rooms.some(r=>r.building===b&&(r.floor||'')===f)){skip.push(f);return}
        from.forEach(r=>{let nm=r.name;if(src&&nm.startsWith(src))nm=f+nm.slice(src.length);add('rooms',{building:b,floor:f,name:nm,qty:{...(r.qty||{})}});n++})});
      o.remove();toast(`คัดลอก ${n} ห้อง${skip.length?' · ข้ามชั้นที่มีห้องแล้ว: '+skip.join(','):''}`,4000);render()});
  },
  rselnone(){UI.rsel.clear();render()},
  delrooms(el){const ids=[...UI.rsel].filter(id=>by('rooms',id));if(!ids.length){toast('ยังไม่ได้เลือกห้อง');return}
    armBtn(el,`กดอีกครั้งเพื่อลบ ${ids.length} ห้อง`,()=>{const set=new Set(ids);S.crews.forEach(c=>{if((c.roomIds||[]).some(i=>set.has(i))){c.roomIds=c.roomIds.filter(i=>!set.has(i));save(c)}});ids.forEach(id=>del('rooms',id));UI.rsel.clear();toast(`ลบ ${ids.length} ห้องแล้ว`);render()})},
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

function parseFloors(t){const out=[];String(t).split(/[,，\s]+/).filter(Boolean).forEach(p=>{const m=/^(\d+)\s*[-–~]\s*(\d+)$/.exec(p);if(m){for(let i=+m[1];i<=+m[2]&&i<200;i++)out.push(String(i))}else out.push(p)});return[...new Set(out)]}
/* วางจาก Excel ลงตารางห้อง */
document.addEventListener('paste',e=>{
  const t=e.target;if(!t.matches||!(t.matches('input[data-r]')||t.matches('input[data-rm2]')))return;
  const txt=(e.clipboardData||window.clipboardData).getData('text');if(!/[\t\n]/.test(txt.trim()))return;e.preventDefault();
  const grid=txt.replace(/\r/g,'').replace(/\n+$/,'').split('\n').map(l=>l.split('\t'));
  const rowsEls=()=>$$('table.ed tbody tr').filter(tr=>tr.querySelector('input[data-r],input[data-rm2]'));
  let trs=rowsEls();const r0=trs.indexOf(t.closest('tr'));const cellsOf=tr=>$$('input[data-r],input[data-rm2]',tr);const c0=cellsOf(t.closest('tr')).indexOf(t);
  const b=UI.b||S.project.buildings[0];const need=r0+grid.length-trs.length;
  if(need>0){const last=S.rooms.filter(r=>r.building===b).slice(-1)[0];for(let i=0;i<need;i++)add('rooms',{building:b,floor:last?last.floor:'1',name:'',qty:{}});render();trs=rowsEls()}
  grid.forEach((row,i)=>{const tr=trs[r0+i];if(!tr)return;const cs=cellsOf(tr);row.forEach((v,j)=>{const inp=cs[c0+j];if(!inp)return;inp.value=v.trim().replace(/,/g,'');inp.dispatchEvent(new Event('input',{bubbles:true}))})});
  toast(`วาง ${grid.length} แถว`);
});
const setField=(o,f,v)=>{o[f]=v;save(o)};
document.addEventListener('input',e=>{
  const t=e.target;if(!t.matches||!t.matches('input[type=text],input[type=number],input[type=date],input[type=search],textarea'))return;const d=t.dataset;
  if(d.c){const c=by('crews',UI.crew);setField(c,d.c,t.value);return}
  if(d.l){const[id,f]=d.l.split(':');const c=by('crews',UI.crew);const l=c.lines.find(x=>x.id===id);const numF=f==='qty'||f==='rate';l[f]=numF?num(t.value):t.value;save(c);
    if(numF){const a=$(`[data-amt="${id}"]`);if(a)a.textContent=f2(num(l.qty)*num(l.rate));const tot=$('#lntot');if(tot)tot.innerHTML='<b>'+f2(calcCrew(c).T.amt)+'</b>'}return}
  if(d.e!==undefined){const s=curSub();setSubEntry(s,d.e,t.value);refreshSub();return}
  if(d.pe!==undefined){const s=curSub();const k=calcCrew(by('crews',s.crewId),s.no);const r=k.rows.find(x=>x.key===d.pe);if(r){setSubEntry(s,r.key,t.value===''?0:+(r.qty*num(t.value)/100).toFixed(4));refreshSub()}return}
  if(d.s){const s=curSub();setField(s,d.s,t.value);return}
  if(d.bg){const o=by('boq',d.bg);o.group=t.value.trim();save(o);return}
  if(t.id==='bsearch'){UI.bq=t.value;const p=t.selectionStart;render();const n=$('#bsearch');if(n){n.focus();n.setSelectionRange(p,p)}return}
  if(d.b){const[id,f]=d.b.split(':');const o=by('boq',id);o[f]=(f==='qty'||f==='rate')?num(t.value):t.value;save(o);return}
  if(d.rm2){const[id,f]=d.rm2.split(':');setField(by('rooms',id),f,t.value);return}
  if(d.r){const[id,iid]=d.r.split(':');const r=by('rooms',id);r.qty=r.qty||{};const n=num(t.value);if(n)r.qty[iid]=n;else delete r.qty[iid];save(r);
    const tot=$(`[data-rt="${iid}"]`);if(tot)tot.innerHTML='<b>'+fq(S.rooms.filter(x=>x.building===r.building).reduce((a,x)=>a+num((x.qty||{})[iid]),0))+'</b>';return}
  if(d.sp){const s=curSub();const p=s.plans.find(x=>x.id===d.sp);p.name=t.value;save(s);return}
  if(d.sph){const s=curSub();const p=s.photos.find(x=>x.id===d.sph);p.caption=t.value;save(s);return}
  if(d.pl){const p=by('plans',d.pl);p.name=t.value;save(p);return}
  if(d.rate){const c=by('crews',UI.crew);c.rates[d.rate]=num(t.value);save(c);return}
  if(d.p){S.project[d.p]=t.value;save();const b=$('.brand span');if(b)b.textContent=S.project.name+' · ส่งงาน / เบิกผลงาน';return}
  if(t.id==='bldg'){return}
});
document.addEventListener('change',async e=>{
  const t=e.target;const d=t.dataset||{};
  if(t.id==='fb'){UI.b=t.value;render();return}
  if(t.id==='fk'){UI.kind=t.value;render();return}
  if(t.id==='bldg'){const bs=t.value.split(/[,，]/).map(x=>x.trim()).filter(Boolean);if(bs.length){S.project.buildings=bs;save();render()}return}
  if(t.id==='planf'){const fs=[...t.files];t.value='';if(!fs.length)return;const b=UI.b||S.project.buildings[0];
    for(const f of fs){try{toast('กำลังอ่านไฟล์ '+f.name+'…',20000);const base=f.name.replace(/\.[^.]+$/,'');const fid='fl'+uid();
      if(/pdf$/i.test(f.type)||/\.pdf$/i.test(f.name)){const pgs=await pdfToImages(f,40,(n,m)=>toast(`${f.name} หน้า ${n}/${m}`,20000));
        for(const g of pgs){const imgId=await putImage(g.url);add('plans',{building:b,fileId:fid,fileName:base,page:g.page,pages:g.pages,name:g.pages>1?`${base} หน้า ${g.page}`:base,imgId,w:g.w,h:g.h,shapes:[]})}}
      else{const im=await fileToImage(f,2800,.9);const imgId=await putImage(im.url);add('plans',{building:b,fileId:fid,fileName:base,page:1,pages:1,name:base,imgId,w:im.w,h:im.h,shapes:[]})}
    }catch(x){toast('อ่านไฟล์แบบไม่สำเร็จ: '+(x.message||x),5000)}}
    toast('เพิ่มแบบแล้ว');render();return}
  if(t.id==='subcam'||t.id==='subpic'){const fs=[...t.files];t.value='';const s=curSub();if(!s||!fs.length)return;s.photos=s.photos||[];
    for(const f of fs){if(!f.type.startsWith('image/'))continue;try{const im=await fileToImage(f,1400,.8);const imgId=await putImage(im.url);s.photos.push({id:uid(),imgId,w:im.w,h:im.h,caption:'',shapes:[]})}catch(x){toast('อ่านรูปไม่ได้')}}
    save(s);render();return}
  if(t.id==='logof'){const f=t.files[0];t.value='';if(!f)return;try{S.project.logoId=await putImage(await fileToPng(f,500));save();render()}catch(x){toast('อ่านโลโก้ไม่ได้')}return}
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
  if(d.pr!==undefined||d.pf!==undefined||d.pall!==undefined){const s=curSub();if(!s)return;const k=calcCrew(by('crews',s.crewId),s.no);const p=num(t.value);if(t.value==='')return;
    const sel=d.pr!==undefined?(r=>r.roomId===d.pr):d.pf!==undefined?(r=>(r.floor||'')===d.pf&&r.roomId):(r=>r.roomId);
    k.rows.filter(sel).forEach(r=>setSubEntry(s,r.key,+(r.qty*p/100).toFixed(4)));toast(`ใส่ ${p}% แล้ว`);render();return}
  if(d.rs!==undefined){t.checked?UI.rsel.add(d.rs):UI.rsel.delete(d.rs);const tr=t.closest('tr');if(tr)tr.classList.toggle('selrow',t.checked);const bt=$('#delrooms');if(bt)bt.textContent=`ลบที่เลือก (${UI.rsel.size})`;return}
  if(d.rsall!==undefined){const b=UI.b||S.project.buildings[0];S.rooms.filter(r=>r.building===b).forEach(r=>t.checked?UI.rsel.add(r.id):UI.rsel.delete(r.id));render();return}
  if(t.id==='rsf'){if(t.value===''&&t.selectedIndex===0)return;const b=UI.b||S.project.buildings[0];S.rooms.filter(r=>r.building===b&&(r.floor||'')===t.value).forEach(r=>UI.rsel.add(r.id));render();return}
  if(d.rf!==undefined){const c=by('crews',UI.crew);const ids=S.rooms.filter(r=>r.building===c.building&&(r.floor||'')===d.rf).map(r=>r.id);const s=new Set(c.roomIds||[]);ids.forEach(i=>t.checked?s.add(i):s.delete(i));c.roomIds=[...s];save(c);render();return}
});
window.addEventListener('beforeunload',()=>{persist()});
(async()=>{await initStore();render()})();
