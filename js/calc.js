/* ===== คำนวณ: รายการงานของชุด, ปริมาณสะสม, ยอดเงิน, คุมงบเทียบ BOQ ===== */
const subsOf=c=>S.subs.filter(s=>s.crewId===c.id).sort((a,b)=>a.no-b.no);
const roomsOf=c=>(c.roomIds||[]).map(id=>by('rooms',id)).filter(Boolean).sort((a,b)=>natCmp(a.floor,b.floor)||natCmp(a.name,b.name));
/* รายการนี้มี BOQ คลุมหรือไม่: ถ้านำเข้าพร้อมคอลัมน์ BOQ ให้ดูค่า BOQ ไม่งั้นดูว่ามีปริมาณ */
const itemCovered=it=>!!it&&(it.bqMapped?num(it.bq)>0:num(it.qty)>0);
const crewItemIds=c=>Object.keys(c.rates||{}).filter(id=>by('boq',id));
/* แถวงานของชุด (โหมดรายการ = lines ของชุด, โหมดห้อง = ห้อง × ITEM ที่ชุดนั้นทำ) */
function crewRows(c){
  if(c.mode==='room'){
    const items=crewItemIds(c).map(id=>by('boq',id)).sort((a,b)=>natCmp(a.name,b.name));const rows=[];
    for(const r of roomsOf(c))for(const it of items){const q=num((r.qty||{})[it.id]);if(q>0)rows.push({key:r.id+'~'+it.id,floor:r.floor||'',room:r.name,roomId:r.id,name:it.name,boqId:it.id,unit:it.unit||'ตร.ม.',qty:q,rate:num(c.rates[it.id]),note:'',boq:itemCovered(it)})}
    return rows;
  }
  return(c.lines||[]).map(l=>({key:l.id,floor:l.floor||'',room:'',name:l.name,boqId:l.boqId||'',unit:l.unit,qty:num(l.qty),rate:num(l.rate),note:l.note||'',boq:itemCovered(l.boqId&&by('boq',l.boqId))}));
}
/* คำนวณงวด no (ไม่ระบุ = งวดล่าสุด) */
function calcCrew(c,no){
  const subs=subsOf(c);const cur=no!=null?subs.find(s=>s.no===no):subs[subs.length-1];const n=cur?cur.no:(subs.length?subs[subs.length-1].no+1:1);
  const prevSubs=subs.filter(s=>s.no<n);
  const rows=crewRows(c).map(r=>{
    const prev=prevSubs.reduce((a,s)=>a+num((s.entries||{})[r.key]),0);const q=cur?num((cur.entries||{})[r.key]):0;
    const cum=prev+q;return{...r,prev,cur:q,cum,amt:r.qty*r.rate,prevAmt:prev*r.rate,curAmt:q*r.rate,cumAmt:cum*r.rate,pct:r.qty?cum/r.qty*100:0,over:cum>r.qty+1e-9}});
  const sum=k=>rows.reduce((a,r)=>a+r[k],0);
  const T={amt:sum('amt'),prevAmt:sum('prevAmt'),curAmt:sum('curAmt'),cumAmt:sum('cumAmt')};T.pct=T.amt?T.cumAmt/T.amt*100:0;T.prevPct=T.amt?T.prevAmt/T.amt*100:0;T.curPct=T.amt?T.curAmt/T.amt*100:0;
  return{crew:c,sub:cur||null,no:n,rows,T,subs,missing:rows.filter(r=>!r.boq).length};
}
const crewTotal=c=>calcCrew(c).T;
/* คุมงบเทียบ BOQ ของอาคาร: ปริมาณ BOQ / จัดสรรให้ชุดต่างๆ / ปริมาณห้องรวม / เบิกสะสม */
function boqControl(b){
  const items=S.boq.filter(x=>!b||x.building===b);
  const crews=S.crews.filter(c=>!b||c.building===b);
  const bkey=it=>num(it.bq)>0&&num(it.cap)>0?[it.building,it.group||'',it.unit||'',num(it.bq)].join('|'):'';
  const capSums={};items.forEach(it=>{const k=bkey(it);if(k)capSums[k]=(capSums[k]||0)+num(it.qty)});
  return items.map(it=>{
    let alloc=0,done=0,amt=0;
    for(const c of crews){
      if(c.mode==='room'){if(c.rates&&c.rates[it.id]!==undefined){for(const r of roomsOf(c))alloc+=num((r.qty||{})[it.id])}}
      else for(const l of c.lines||[])if(l.boqId===it.id)alloc+=num(l.qty);
      const k=calcCrew(c);for(const r of k.rows)if(r.boqId===it.id){done+=r.cum;amt+=r.cumAmt}
    }
    const roomTotal=S.rooms.filter(r=>r.building===it.building).reduce((a,r)=>a+num((r.qty||{})[it.id]),0);
    const q=num(it.qty);
    const cap=num(it.cap);const k=bkey(it);const capSum=k?capSums[k]:q;const shared=k&&items.filter(x=>bkey(x)===k).length>1;
    return{it,qty:q,alloc,remain:q-alloc,done,amt,roomTotal,over:alloc>q+1e-9&&q>0,cap,capSum,shared,capOver:cap>0&&capSum>cap+1e-9,noBoq:!itemCovered(it)}
  });
}
const unlinkedCount=()=>S.crews.reduce((a,c)=>a+(c.skip?0:crewRows(c).filter(r=>!r.boq).length),0);
function newCrew(o){return add('crews',Object.assign({building:S.project.buildings[0]||'',name:'',kind:'sub',mode:'line',detail:'',skip:false,note:'',lines:[],rates:{},roomIds:[],order:S.crews.length},o))}
function newLine(c,o){const l=Object.assign({id:uid(),floor:'',name:'',unit:'ตร.ม.',qty:0,rate:0,boqId:'',note:''},o);c.lines.push(l);save(c);return l}
function nextNo(c){const s=subsOf(c);return s.length?s[s.length-1].no+1:1}
function addDays(iso,n){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function newSub(c){const s=subsOf(c);const last=s[s.length-1];
  return add('subs',{crewId:c.id,no:nextNo(c),from:last&&last.to?addDays(last.to,1):todayISO(),to:'',date:todayISO(),entries:{},note:'',sent:false})}

/* ----- ข้อมูลเริ่มต้น: อาคาร/ชุดช่างตามรายชื่อที่ให้มา ----- */
function seedData(){
  const mk=(building,name,kind,mode,detail,extra)=>newCrew(Object.assign({building,name,kind,mode,detail:detail||''},extra||{}));
  const clear='งานเคลียร์ขยะ / งานขึ้นของ / งานสกัดพื้นเพื่อเทปรับกระเบื้องยาง / งานก่ออิฐบันไดหลักและหนีไฟ / งานเทปรับและฉาบแต่งคานท้องพื้นบันได';
  mk('D','ชุดพี่ขาว (ขึ้นของ/สกัดแต่ง)','sub','line','ขึ้นของอาคาร พวกปูนและงานสกัดแต่ง');
  mk('D','ชุดพี่ขาว (เก็บส่งแผ่นกระเบื้อง)','sub','room','เก็บส่งแผ่นกระเบื้องอาคาร D');
  const roof=mk('D','ชุดชาม (ปูกระเบื้องดาดฟ้า)','sub','line','ปูกระเบื้องดาดฟ้า (ROOF)');
  [['ปูกระเบื้องผนังขนาด 30x60 แนวตรง','ตร.ม.',420.2,280],['ปูกระเบื้องผนังขนาด 30x60 แนวโค้ง','ตร.ม.',46.18,380],['ปูกระเบื้องผนัง TOP กำแพง','ม.',550.55,380],['ปูกระเบื้องเริบขอบรอบแนวพื้นหญ้า','ม.',120.24,380]]
    .forEach(a=>newLine(roof,{floor:'ROOF',name:a[0],unit:a[1],qty:a[2],rate:a[3]}));
  add('subs',{crewId:roof.id,no:1,from:'2025-09-01',to:'2025-09-15',date:'2025-09-15',entries:{[roof.lines[0].id]:63.03},note:'',sent:true});
  add('subs',{crewId:roof.id,no:2,from:'2025-09-16',to:'2025-09-30',date:'2025-09-30',entries:{[roof.lines[0].id]:256.315},note:'',sent:false});
  mk('D','ชุดช่างไก่ (ปูกระเบื้อง 2 คน)','dc','room','งานปูกระเบื้อง 2 คน');
  mk('D','ชุดช่างไก่ (วงกบประตู)','dc','line','งานวงกบประตู');
  mk('E','ชุดโซมอญ','sub','line',clear);
  mk('E','ชุดมาวมิน อาคาร E','sub','line','',{skip:true,note:'คิดไว้ว่าจะไม่ส่ง'});
  mk('E','ชุดเอก (ZONE 1)','sub','line','เก็บงานภายนอก ZONE 1 อาคาร E');
  mk('E','ชุดลุงซัน (ZONE 2)','sub','line','เก็บงานภายนอก ZONE 2 อาคาร E');
  mk('E','ชุดลุงสุพรรณ (ZONE 3)','sub','line','เก็บงานภายนอก ZONE 3 อาคาร E');
  mk('E','ชุดช่างไก่ (วงกบประตู)','dc','line','งานวงกบประตู');
  mk('E','งานกระเบื้องทางเดินและห้องน้ำ 1-2','dc','room','งานกระเบื้องทางเดินและห้องน้ำ 1-2');
  mk('E','ชุดโซ่ (กระเบื้องดาดฟ้า)','dc','line','กระเบื้องดาดฟ้า');
  mk('F&J','ชุดยิน อาคาร F','sub','line',clear);
  mk('F&J','ชุดช่างเต๋งนวย อาคาร F','dc','line','');
  mk('F&J','ป้าจอย (วงกบประตู) อาคาร F','dc','line','งานวงกบประตู');
  ['ชุดมาวมิน','ชุดสุพรรณ','ชุดโทลินาย'].forEach(n=>mk('G',n,'sub','room','งานกระเบื้อง อาคาร G'));
  ['โมวิน','ไวยาน','เท็จวิน','โทลินาย'].forEach(n=>mk('G',n+' (งานกระเบื้อง)','dc','room','งานกระเบื้อง อาคาร G'));
  mk('G','(ยังไม่มีชื่อ) ยังไม่เปิดสัญญา','dc','room','',{note:'ยังไม่เปิดสัญญา'});
  mk('G','ชุดปูกระเบื้องดาดฟ้า','dc','line','ชุดที่ปูกระเบื้องดาดฟ้าอยู่');
  S.project.seeded=true;
}
/* ข้อมูลตัวอย่างของ BOQ/ห้อง สำหรับลองใช้ */
function sampleTile(){
  const b='D';const mkb=(name,unit,qty)=>add('boq',{building:b,group:'งานกระเบื้อง',name,unit,qty,rate:0,note:'',tile:true});
  const f=mkb('กระเบื้องพื้น 60x60','ตร.ม.',420),w=mkb('กระเบื้องผนัง 30x60','ตร.ม.',300),s=mkb('ซ่อมยาแนว','ตร.ม.',100);
  const rooms=[['1','101 ห้องน้ำ',[12.5,38,0]],['1','102 ห้องพัก',[28,0,0]],['1','ทางเดิน 1',[64,0,20]],['2','201 ห้องน้ำ',[12.5,38,0]],['2','202 ห้องพัก',[28,0,0]],['2','ทางเดิน 2',[64,0,20]]];
  rooms.forEach(r=>add('rooms',{building:b,floor:r[0],name:r[1],qty:{[f.id]:r[2][0],[w.id]:r[2][1],[s.id]:r[2][2]}}));
  const c=S.crews.find(x=>x.building===b&&x.mode==='room');if(c){c.rates={[f.id]:95,[w.id]:110,[s.id]:40};c.roomIds=S.rooms.map(r=>r.id);save(c)}
  return c;
}
