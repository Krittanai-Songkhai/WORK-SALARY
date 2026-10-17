/* ===== Work Desk: ข้อมูล + บันทึกในเครื่อง + ซิงก์ Supabase (ตาราง docs เดิม, collection ขึ้นต้น wd_) ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const num=v=>{const n=parseFloat(String(v==null?'':v).replace(/,/g,''));return isFinite(n)?n:0};
const f2=n=>(+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const fq=n=>(+n||0).toLocaleString('en-US',{maximumFractionDigits:3});
const pct=n=>(isFinite(n)?n:0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
const clone=o=>JSON.parse(JSON.stringify(o));
const natCmp=(a,b)=>String(a==null?'':a).localeCompare(String(b==null?'':b),'th',{numeric:true,sensitivity:'base'});
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const TH_M=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const fmtDate=iso=>{if(!iso)return'';const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(iso);if(!m)return iso;return(+m[3])+' '+TH_M[+m[2]-1]+' '+(+m[1]+543)};
const fmtShort=iso=>{if(!iso)return'';const m=/^(\d{4})-(\d\d)-(\d\d)/.exec(iso);return m?(+m[3])+'/'+(+m[2])+'/'+(+m[1]+543):iso};

function toast(msg,ms=2600){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=msg;t.className='show';clearTimeout(toast._t);toast._t=setTimeout(()=>t.className='',ms)}
function overlay(html,cls){const o=document.createElement('div');o.className='ov '+(cls||'');o.innerHTML=html;document.body.appendChild(o);return o}
function armBtn(b,txt,fn){if(b.classList.contains('arm')){clearTimeout(b._t);b.classList.remove('arm');b.textContent=b._o;fn();return}b._o=b.textContent;b.textContent=txt;b.classList.add('arm');b._t=setTimeout(()=>{b.classList.remove('arm');b.textContent=b._o},3000)}

/* ----- โครงสร้างข้อมูล ----- */
const COLL={crews:'wd_crew',boq:'wd_boq',rooms:'wd_room',subs:'wd_sub',plans:'wd_plan'};
const GRP='wd';
const KIND={sub:'ผรม. (เหมา)',dc:'แรง DC บริษัท'};
let S={project:{name:'MODEVA',client:'KMIT',category:'สถาปัตย์',company:'KMIT Construction',buildings:['D','E','F&J','G'],editors:[]},crews:[],boq:[],rooms:[],subs:[],plans:[]};
const MODE={kind:'local',sb:null,email:'',ok:true,pending:0,msg:'บันทึกในเครื่องนี้'};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){toast('พื้นที่เก็บข้อมูลในเครื่องเต็ม',4000)}}};
let DIRTY=new Set(LS.get('wd:dirty',[])),DELS=LS.get('wd:dels',[]),SYNCED=new Set(LS.get('wd:synced',[]));
const keyOf=(c,id)=>c+'/'+id;
function persist(){LS.set('wd:data',S);LS.set('wd:dirty',[...DIRTY]);LS.set('wd:dels',DELS);LS.set('wd:synced',[...SYNCED]);setStatus()}
let _pt=0;function save(...objs){objs.forEach(o=>{if(o&&o._c)DIRTY.add(keyOf(o._c,o.id))});DIRTY.add('wd_project/project');clearTimeout(_pt);_pt=setTimeout(()=>{persist();cloudSoon()},250)}
const tag=(c,o)=>{Object.defineProperty(o,'_c',{value:COLL[c],enumerable:false,writable:true});return o};
function tagAll(){for(const c in COLL)S[c]=(S[c]||[]).map(o=>tag(c,o))}
function add(c,o){o.id=o.id||uid();tag(c,o);S[c].push(o);save(o);return o}
function del(c,id){const i=S[c].findIndex(o=>o.id===id);if(i<0)return;S[c].splice(i,1);DIRTY.delete(keyOf(COLL[c],id));DELS.push(keyOf(COLL[c],id));save()}
const by=(c,id)=>S[c].find(o=>o.id===id);

function setStatus(){const n=DIRTY.size+DELS.length;MODE.pending=n;const el=$('#sync');if(el)el.innerHTML=statusHTML()}
function statusHTML(){
  if(MODE.kind==='local')return'<span class="chip">ในเครื่องนี้</span>';
  const n=MODE.pending;return MODE.ok?(n?`<span class="chip warn">รอส่ง ${n}</span>`:'<span class="chip good">ซิงก์แล้ว</span>'):`<span class="chip bad">ออฟไลน์ · รอส่ง ${n}</span>`}

/* ----- Supabase ----- */
const cfg=()=>window.APP_CONFIG||{};
const cloudOn=()=>!!(cfg().SUPABASE_URL&&cfg().SUPABASE_ANON_KEY&&window.supabase);
function rowOf(c,o){return{collection:c,id:o.id,data:o,grp:GRP,access:'members'}}
let _cs=0,_busy=false;
function cloudSoon(){if(MODE.kind!=='cloud')return;clearTimeout(_cs);_cs=setTimeout(cloudFlush,900)}
async function cloudFlush(){
  if(MODE.kind!=='cloud'||_busy)return;_busy=true;
  try{
    await pushImages();
    const rows=[];for(const k of [...DIRTY]){const[c,id]=k.split('/');
      if(c==='wd_project'){rows.push(rowOf('wd_project',{id:'project',..._projectDoc()}));continue}
      const list=Object.keys(COLL).find(x=>COLL[x]===c);const o=list&&by(list,id);if(o)rows.push(rowOf(c,o))}
    // เอกสารโครงการต้องเป็นแถวแรกของกลุ่ม เพื่อให้เจ้าของกลุ่มคือคนสร้างโครงการ
    rows.sort((a,b)=>(a.collection==='wd_project'?-1:0)-(b.collection==='wd_project'?-1:0));
    for(let i=0;i<rows.length;i+=150){const{error}=await MODE.sb.from('docs').upsert(rows.slice(i,i+150),{onConflict:'collection,id'});if(error)throw error;
      rows.slice(i,i+150).forEach(r=>{DIRTY.delete(keyOf(r.collection,r.id));SYNCED.add(keyOf(r.collection,r.id))})}
    for(const k of [...DELS]){const[c,id]=k.split('/');const{error}=await MODE.sb.from('docs').delete().eq('collection',c).eq('id',id);if(error&&error.code!=='42501')throw error;DELS=DELS.filter(x=>x!==k);SYNCED.delete(k)}
    MODE.ok=true;
  }catch(e){MODE.ok=!(/fetch|network|Failed|timeout/i.test(String(e&&e.message)));if(MODE.ok)toast('ส่งขึ้นระบบไม่สำเร็จ: '+(e.message||e),5000);else _cs=setTimeout(cloudFlush,8000)}
  _busy=false;persist();
}
/* ----- รูป: เก็บในเครื่อง (IndexedDB) + อัปโหลดขึ้น bucket เดิม inspection-images (ชื่อไฟล์ขึ้นต้น wd-) ----- */
const IMGDATA=new Map();let IDBH=null;const BUCKET='inspection-images';let IMGQ=new Set(LS.get('wd:imgq',[]));
function openIDB(){return new Promise((res,rej)=>{try{const q=indexedDB.open('workdesk-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('img');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}catch(e){rej(e)}})}
const idbReq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function initImages(){try{IDBH=await openIDB();const st=IDBH.transaction('img').objectStore('img');const ks=await idbReq(st.getAllKeys()),vs=await idbReq(st.getAll());ks.forEach((k,i)=>IMGDATA.set(k,vs[i]))}catch(e){IDBH=null}}
async function putImage(url){const id='im'+uid();IMGDATA.set(id,url);
  if(IDBH){try{IDBH.transaction('img','readwrite').objectStore('img').put(url,id)}catch(e){}}
  if(MODE.kind==='cloud'){IMGQ.add(id);LS.set('wd:imgq',[...IMGQ]);cloudSoon()}return id}
const imgSrc=id=>{if(!id)return'';const v=IMGDATA.get(id);if(v)return v;if(MODE.kind==='cloud')return String(cfg().SUPABASE_URL).replace(/\/$/,'')+'/storage/v1/object/public/'+BUCKET+'/wd-'+encodeURIComponent(id);return''};
const dataUrlToBlob=u=>{const[h,b]=u.split(',');const mime=/:(.*?);/.exec(h)[1];const bin=atob(b);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})};
async function pushImages(){
  for(const id of [...IMGQ]){const u=IMGDATA.get(id);if(!u){IMGQ.delete(id);continue}
    const blob=dataUrlToBlob(u);const{error}=await MODE.sb.storage.from(BUCKET).upload('wd-'+id,blob,{contentType:blob.type,upsert:true,cacheControl:'31536000'});if(error)throw error;IMGQ.delete(id)}
  LS.set('wd:imgq',[...IMGQ]);
}
/* ให้ทุก id มี data: URL (ใช้ตอนสร้าง PDF / HTML) */
async function ensureData(ids,png){
  for(const id of ids){if(!id||(IMGDATA.has(id)&&String(IMGDATA.get(id)).startsWith('data:')))continue;
    try{const s=imgSrc(id);const im=await loadImgEl(/^https?:/.test(s)?s+(s.includes('?')?'&':'?')+'cors=1':s);const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const x=c.getContext('2d');
      if(!png){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}x.drawImage(im,0,0);IMGDATA.set(id,c.toDataURL(png?'image/png':'image/jpeg',.92))}catch(e){}}
}
const _projectDoc=()=>({project:{...S.project}});
async function cloudLoad(){
  const rows=[];
  for(let from=0;;from+=1000){const{data,error}=await MODE.sb.from('docs').select('collection,id,data').in('collection',Object.values(COLL).concat('wd_project')).range(from,from+999);if(error)throw error;rows.push(...data);if(data.length<1000)break}
  const seen=new Set();
  for(const r of rows){const k=keyOf(r.collection,r.id);seen.add(k);
    if(r.collection==='wd_project'){if(!DIRTY.has(k)&&r.data&&r.data.project)S.project=Object.assign(S.project,r.data.project);SYNCED.add(k);continue}
    if(DIRTY.has(k)||DELS.includes(k))continue;
    const list=Object.keys(COLL).find(x=>COLL[x]===r.collection);if(!list)continue;
    const i=S[list].findIndex(o=>o.id===r.id);const o=tag(list,r.data);if(i>=0)S[list][i]=o;else S[list].push(o);SYNCED.add(k)}
  for(const list in COLL){S[list]=S[list].filter(o=>{const k=keyOf(COLL[list],o.id);if(seen.has(k)||DIRTY.has(k))return true;if(SYNCED.has(k)){SYNCED.delete(k);return false}DIRTY.add(k);return true})}
  if(!seen.has('wd_project/project'))DIRTY.add('wd_project/project');
  persist();
}
function loginDialog(after){
  const o=overlay(`<div class="box"><h3 style="margin-bottom:6px">เข้าสู่ระบบสมาชิก</h3><p class="hint">ใช้บัญชีเดียวกับ Inspection Desk ข้อมูลเงินเบิกผลงานจะเห็นได้เฉพาะสมาชิกที่ล็อกอิน</p>
   <label class="f">อีเมล<input type="email" id="lgmail" autocomplete="username"></label><label class="f" style="margin-top:8px">รหัสผ่าน<input type="password" id="lgpass" autocomplete="current-password"></label>
   <div class="row" style="margin-top:14px;justify-content:flex-end"><button class="btn" data-x="local">ใช้ในเครื่องก่อน</button><button class="btn pri" data-x="ok">เข้าสู่ระบบ</button></div></div>`,'modal');
  const go=async()=>{const email=$('#lgmail',o).value.trim(),password=$('#lgpass',o).value;const{error}=await MODE.sb.auth.signInWithPassword({email,password});
    if(error){toast('เข้าสู่ระบบไม่สำเร็จ: '+error.message,5000);return}localStorage.removeItem('wd:local');o.remove();location.reload()};
  o.addEventListener('click',e=>{const b=e.target.closest('[data-x]');if(!b)return;if(b.dataset.x==='ok')go();else{LS.set('wd:local',1);o.remove();after&&after()}});
  o.addEventListener('keydown',e=>{if(e.key==='Enter')go()});setTimeout(()=>$('#lgmail',o).focus(),30);
}
async function logout(){try{await MODE.sb.auth.signOut()}catch(e){}location.reload()}

/* ----- เริ่มระบบ ----- */
async function initStore(){
  await initImages();
  const d=LS.get('wd:data',null);
  if(d){S=Object.assign(S,d);S.project=Object.assign({editors:[],buildings:['D','E','F&J','G']},d.project||{})}
  tagAll();
  if(cloudOn()){
    try{
      MODE.sb=supabase.createClient(cfg().SUPABASE_URL,cfg().SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
      const{data}=await MODE.sb.auth.getSession();const ses=data&&data.session;
      if(ses){MODE.kind='cloud';MODE.email=ses.user.email||'';
        try{await cloudLoad()}catch(e){MODE.ok=false;toast('โหลดจากระบบไม่ได้ ใช้ข้อมูลในเครื่อง: '+(e.message||e),4500)}
        cloudSoon();
        window.addEventListener('online',()=>{MODE.ok=true;cloudFlush()});
        window.addEventListener('offline',()=>{MODE.ok=false;setStatus()});
        document.addEventListener('visibilitychange',async()=>{if(document.visibilityState==='visible'&&!DIRTY.size&&!DELS.length&&!$('.ov')){try{await cloudLoad();render()}catch(e){}}});
      }else if(!LS.get('wd:local',0))setTimeout(()=>loginDialog(),300);
    }catch(e){console.warn(e)}
  }
  if(!S.crews.length&&!S.boq.length&&!d)seedData();
  persist();
}
