/* ===== Excel (ExcelJS) หน้าตาเดียวกับ PDF: หัวฟอร์ม+โลโก้, หัวตาราง 2 ชั้น, ช่องงวดนี้สีฟ้า, สูตรคำนวณ, พิมพ์ A4 แนวนอน ===== */
const XF='Tahoma';
const X_THIN={style:'thin',color:{argb:'FF8A8A8A'}},X_BLK={style:'thin',color:{argb:'FF111111'}},X_MED={style:'medium',color:{argb:'FF111111'}};
const X_BOX=c=>({top:c,left:c,bottom:c,right:c});
const FQ='#,##0.###;-#,##0.###;"-"',FM='#,##0.00;-#,##0.00;"-"',FP='0.00%';
const FILL=a=>({type:'pattern',pattern:'solid',fgColor:{argb:'FF'+a}});
const BLUE='1A3FC4',CURF='E4EEFB',CURH='CFE0F7';
const colL=n=>{let s='';while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s};
/* เซลล์รวม + จัดรูปแบบทุกช่องในช่วง */
function xb(ws,r1,c1,r2,c2,val,o={}){
  if(r2>r1||c2>c1)ws.mergeCells(r1,c1,r2,c2);
  for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){const cell=ws.getCell(r,c);
    cell.font={name:XF,size:o.fs||10,bold:!!o.b,color:{argb:'FF'+(o.color||'111111')}};
    cell.alignment={vertical:'middle',horizontal:o.al||'left',wrapText:o.wrap!==false,indent:o.indent||0};
    if(o.fill)cell.fill=FILL(o.fill);
    if(o.border)cell.border=o.border;
    if(o.fmt)cell.numFmt=o.fmt}
  const t=ws.getCell(r1,c1);if(val!==undefined)t.value=val;return t;
}
const xnum=(ws,r,c,val,fmt,o={})=>xb(ws,r,c,r,c,val,Object.assign({al:'right',fmt,border:X_BOX(X_THIN)},o));
async function xLogo(wb,ws,cols,widthPx,heightPx){
  const id=S.project.logoId;if(!id){return false}
  try{await ensureData([id],true);const u=imgSrc(id);if(!u||!u.startsWith('data:'))return false;
    const im=await loadImgEl(u);const k=Math.min(widthPx/im.naturalWidth,heightPx/im.naturalHeight);
    const ext=/image\/jpe?g/.test(u)?'jpeg':'png';const imgId=wb.addImage({base64:u.split(',')[1],extension:ext});
    ws.addImage(imgId,{tl:{col:0.08,row:0.12},ext:{width:Math.round(im.naturalWidth*k),height:Math.round(im.naturalHeight*k)}});return true}catch(e){return false}
}
/* หัวฟอร์ม 4 แถว เหมือนหัวกระดาษใน PDF — seg=[โลโก้,โครงการ,ชื่อชุด,หมวดงาน/วันที่] จำนวนคอลัมน์ */
async function xHead(wb,ws,seg,o){
  const P=S.project;const[l,p,t,rr]=seg;const n=l+p+t+rr;const c1=1,c2=l+1,c3=l+p+1,c4=l+p+t+1;
  ws.getRow(1).height=22;ws.getRow(2).height=22;ws.getRow(3).height=22;ws.getRow(4).height=22;
  const hasLogo=await xLogo(wb,ws,l,Math.max(60,l*60),42);
  xb(ws,1,c1,2,l,hasLogo?'':(P.company||''),{al:'center',color:'555555',fs:9,border:X_BOX(X_THIN)});
  xb(ws,1,c2,1,c3-1,'โครงการ : '+P.name,{color:BLUE,fs:11,border:X_BOX(X_THIN)});
  xb(ws,2,c2,2,c3-1,'ผู้ว่าจ้าง : '+(P.client||''),{color:BLUE,fs:11,border:X_BOX(X_THIN)});
  xb(ws,1,c3,2,c4-1,o.title,{al:'center',color:'DD0000',b:true,fs:16,border:X_BOX(X_THIN)});
  xb(ws,1,c4,1,c4,'หมวดงาน :',{color:BLUE,fs:11,border:X_BOX(X_THIN)});xb(ws,1,c4+1,1,n,P.category||'',{b:true,fs:12,border:X_BOX(X_THIN)});
  xb(ws,2,c4,2,c4,'Date : '+fmtShort(o.date),{color:BLUE,fs:10,border:X_BOX(X_THIN)});xb(ws,2,c4+1,2,n,fmtDate(o.date),{fs:11,border:X_BOX(X_THIN)});
  xb(ws,3,1,3,n,o.band,{al:'center',b:true,fs:12,fill:'DCDCDC',border:X_BOX(X_BLK)});
  xb(ws,4,1,4,n,o.band2,{fs:11,fill:'E9E9E9',border:X_BOX(X_BLK)});
  return 5;
}
function xPage(ws,n){
  ws.views=[{showGridLines:false}];
  ws.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0,horizontalCentered:true,margins:{left:.3,right:.3,top:.35,bottom:.35,header:.2,footer:.2}};
  ws.headerFooter={oddFooter:`&L${S.project.name}&R&P / &N`};
}
function xSig(ws,r,n){
  ws.getRow(r).height=40;const w=Math.floor(n/3);const segs=[[1,w],[w+1,2*w],[2*w+1,n]];const lab=['ผู้ส่งงาน / หัวหน้าชุด','ผู้ตรวจรับงาน (ผู้ควบคุมงาน)','ผู้อนุมัติ'];
  segs.forEach((s,i)=>xb(ws,r+1,s[0]+(i?0:0),r+1,s[1],lab[i],{al:'center',fs:10,border:{top:X_BLK}}));
  return r+2;
}
function xSumBox(ws,r,n,label,cellRef){
  ws.getRow(r).height=26;
  xb(ws,r,1,r,n-3,label,{b:true,fs:13,border:{top:{style:'medium',color:{argb:'FF'+BLUE}},bottom:{style:'medium',color:{argb:'FF'+BLUE}},left:{style:'medium',color:{argb:'FF'+BLUE}}},indent:1});
  xb(ws,r,n-2,r,n,cellRef,{b:true,fs:14,al:'right',fmt:'#,##0.00" บาท"',border:{top:{style:'medium',color:{argb:'FF'+BLUE}},bottom:{style:'medium',color:{argb:'FF'+BLUE}},right:{style:'medium',color:{argb:'FF'+BLUE}}}});
  return r+1;
}
const xRange=k=>{const s=k.sub;return s?[s.from&&fmtShort(s.from),s.to&&fmtShort(s.to)].filter(Boolean).join(' – '):''};
const xBand2=(c,k)=>`${KINDTXT[c.kind]||'ชุด'} : ${c.name}      อาคาร : ${c.building}      งวดที่ : ${k.no}${xRange(k)?' ('+xRange(k)+')':''}${c.detail?'      รายละเอียดงาน : '+c.detail:''}`;

/* ---- ชีตแบบรายการ ---- */
async function xLineSheet(wb,c,k,o){
  o=o||{};const ws=wb.addWorksheet(o.sheet||('งวด '+k.no));const n=13;
  [7,40,11,7,11,14,11,14,11,14,15,9,24].forEach((w,i)=>ws.getColumn(i+1).width=w);
  let r=await xHead(wb,ws,[2,4,4,3],{title:c.name,date:(k.sub&&k.sub.date)||todayISO(),band:o.band||`ตารางแบ่งจ่าย ส่งเบิกผลงาน${KINDTXT[c.kind]||''}`,band2:xBand2(c,k)});
  const hb=X_BOX(X_BLK);const H=(r1,c1,r2,c2,t,f)=>xb(ws,r1,c1,r2,c2,t,{al:'center',b:true,fs:10,fill:f||'EEEEEE',border:hb});
  ws.getRow(r).height=20;ws.getRow(r+1).height=30;
  H(r,1,r+1,1,'ชั้น');H(r,2,r+1,2,'รายการ');H(r,3,r,6,'ราคาจัดจ้าง');H(r,7,r,8,'งวดก่อนๆ (สะสม)');H(r,9,r,10,`งวดนี้ (ครั้งที่ ${k.no})`,CURH);H(r,11,r,12,'รวมเบิกสะสม');H(r,13,r+1,13,'หมายเหตุ');
  ['ปริมาณ','หน่วย','ค่าแรง/\nหน่วย','บาท','ปริมาณ','บาท'].forEach((t,i)=>H(r+1,3+i,r+1,3+i,t));H(r+1,9,r+1,9,'ปริมาณ',CURH);H(r+1,10,r+1,10,'บาท',CURH);H(r+1,11,r+1,11,'ยอดเบิกสะสม\n(บาท)');H(r+1,12,r+1,12,'% สะสม');
  r+=2;const first=r;let lastFl=null;
  for(const x of k.rows){
    ws.getRow(r).height=30;const f=x.floor!==lastFl?x.floor:'';lastFl=x.floor;const B=X_BOX(X_THIN);
    xb(ws,r,1,r,1,f,{al:'center',border:B});xb(ws,r,2,r,2,x.name,{border:B});xnum(ws,r,3,x.qty,FQ);xb(ws,r,4,r,4,x.unit,{al:'center',border:B});xnum(ws,r,5,x.rate,FM);
    xnum(ws,r,6,{formula:`C${r}*E${r}`,result:x.amt},FM);xnum(ws,r,7,x.prev,FQ);xnum(ws,r,8,{formula:`G${r}*E${r}`,result:x.prevAmt},FM);
    xnum(ws,r,9,x.cur,FQ,{fill:CURF});xnum(ws,r,10,{formula:`I${r}*E${r}`,result:x.curAmt},FM,{fill:CURF});
    xnum(ws,r,11,{formula:`(G${r}+I${r})*E${r}`,result:x.cumAmt},FM);xnum(ws,r,12,{formula:`IF(C${r}=0,0,(G${r}+I${r})/C${r})`,result:x.pct/100},FP);
    xb(ws,r,13,r,13,rowNote(x),{color:'BB0000',fs:9,border:B});r++}
  const last=r-1;const T=k.T;const tb={top:X_MED,bottom:X_BLK,left:X_BLK,right:X_BLK};ws.getRow(r).height=22;
  xb(ws,r,1,r,2,'รวม',{al:'center',b:true,fill:'F3F3F3',border:tb});
  [[3,null],[4,null],[5,null]].forEach(a=>xb(ws,r,a[0],r,a[0],'',{fill:'F3F3F3',border:tb}));
  const sumc=(col,res,fill)=>xnum(ws,r,col,{formula:k.rows.length?`SUM(${colL(col)}${first}:${colL(col)}${last})`:'0',result:res},FM,{b:true,fill:fill||'F3F3F3',border:tb});
  sumc(6,T.amt);xb(ws,r,7,r,7,'',{fill:'F3F3F3',border:tb});sumc(8,T.prevAmt);xb(ws,r,9,r,9,'',{fill:CURF,border:tb});sumc(10,T.curAmt,CURF);sumc(11,T.cumAmt);
  xnum(ws,r,12,{formula:`IF(F${r}=0,0,K${r}/F${r})`,result:T.pct/100},FP,{b:true,fill:'F3F3F3',border:tb});xb(ws,r,13,r,13,'',{fill:'F3F3F3',border:tb});
  const tr=r;r+=2;r=xSumBox(ws,r,n,`${o.sumLabel||'รวมเป็นเงินเบิกผลงาน'} งวดที่ ${k.no}`,{formula:`J${tr}`,result:T.curAmt});
  if(k.missing){xb(ws,r,1,r,n,`* มี ${k.missing} รายการที่ไม่มี BOQ คลุม (ระบุไว้ในช่องหมายเหตุ)`,{color:'BB0000',fs:9});r++}
  if(!o.nosig)xSig(ws,r,n);xPage(ws,n);return ws;
}

/* ---- ชีตแบบห้อง × ITEM + สรุปงบ ---- */
async function xRoomSheets(wb,c,k){
  const items=itemAgg(k);const rowOf=new Map(k.rows.map(x=>[x.key,x]));
  const ws=wb.addWorksheet('ตารางห้อง งวด '+k.no);const n=17;ws.getColumn(1).width=26;for(let i=2;i<=n;i++)ws.getColumn(i).width=11;
  let r=await xHead(wb,ws,[1,5,7,4],{title:c.name,date:(k.sub&&k.sub.date)||todayISO(),band:'ตารางส่งงานรายห้อง (ปริมาณ ตร.ม. ต่อ ITEM)',band2:xBand2(c,k)});
  const hb=X_BOX(X_BLK);const H=(r1,c1,r2,c2,t,f)=>xb(ws,r1,c1,r2,c2,t,{al:'center',b:true,fs:10,fill:f||'EEEEEE',border:hb});
  const chunks=[];for(let i=0;i<items.length;i+=4)chunks.push(items.slice(i,i+4));
  for(const its of chunks){
    const rooms=roomsOf(c).filter(rm=>its.some(it=>rowOf.has(rm.id+'~'+it.boqId)));
    ws.getRow(r).height=32;H(r,1,r+1,1,'ห้อง / พื้นที่');
    its.forEach((it,j)=>{const c0=2+j*4;H(r,c0,r,c0+3,`${it.name}\nค่าแรง ${f2(it.rate)} บาท/${it.unit}`);H(r+1,c0,r+1,c0,'ปริมาณ');H(r+1,c0+1,r+1,c0+1,'สะสมก่อน');H(r+1,c0+2,r+1,c0+2,'งวดนี้',CURH);H(r+1,c0+3,r+1,c0+3,'% สะสม')});
    r+=2;const first=r;let fl=null;const frows=[];
    for(const rm of rooms){
      if(rm.floor!==fl){fl=rm.floor;ws.getRow(r).height=20;xb(ws,r,1,r,1+its.length*4,'ชั้น '+(fl||'-'),{b:true,fill:'F2EFE6',border:X_BOX(X_THIN)});r++}
      ws.getRow(r).height=22;xb(ws,r,1,r,1,rm.name,{border:X_BOX(X_THIN)});frows.push(r);
      its.forEach((it,j)=>{const c0=2+j*4;const x=rowOf.get(rm.id+'~'+it.boqId);
        if(x){xnum(ws,r,c0,x.qty,FQ);xnum(ws,r,c0+1,x.prev,FQ);xnum(ws,r,c0+2,x.cur,FQ,{fill:CURF});xnum(ws,r,c0+3,{formula:`IF(${colL(c0)}${r}=0,0,(${colL(c0+1)}${r}+${colL(c0+2)}${r})/${colL(c0)}${r})`,result:x.pct/100},FP)}
        else{for(let q=0;q<4;q++)xb(ws,r,c0+q,r,c0+q,q?'':'·',{al:'center',color:'999999',fill:q===2?CURF:undefined,border:X_BOX(X_THIN)})}});
      r++}
    const tb={top:X_MED,bottom:X_BLK,left:X_BLK,right:X_BLK};ws.getRow(r).height=22;xb(ws,r,1,r,1,`รวม (${its[0]?its[0].unit:''})`,{b:true,fill:'F3F3F3',border:tb});
    its.forEach((it,j)=>{const c0=2+j*4;const rng=cc=>frows.length?`SUM(${colL(cc)}${first}:${colL(cc)}${r-1})`:'0';
      xnum(ws,r,c0,{formula:rng(c0),result:it.qty},FQ,{b:true,fill:'F3F3F3',border:tb});xnum(ws,r,c0+1,{formula:rng(c0+1),result:it.prev},FQ,{b:true,fill:'F3F3F3',border:tb});xnum(ws,r,c0+2,{formula:rng(c0+2),result:it.cur},FQ,{b:true,fill:CURF,border:tb});
      xnum(ws,r,c0+3,{formula:`IF(${colL(c0)}${r}=0,0,(${colL(c0+1)}${r}+${colL(c0+2)}${r})/${colL(c0)}${r})`,result:it.qty?(it.prev+it.cur)/it.qty:0},FP,{b:true,fill:'F3F3F3',border:tb})});
    const t1=r;r++;ws.getRow(r).height=22;xb(ws,r,1,r,1,'มูลค่างวดนี้ (บาท)',{b:true,fill:'F3F3F3',border:X_BOX(X_BLK)});
    its.forEach((it,j)=>{const c0=2+j*4;xb(ws,r,c0,r,c0+3,{formula:`${colL(c0+2)}${t1}*${it.rate}`,result:it.cur*it.rate},{al:'right',b:true,fill:'F3F3F3',fmt:FM,border:X_BOX(X_BLK)})});
    r+=2;
  }
  xPage(ws,n);
  // สรุปงบ
  const w2=wb.addWorksheet('สรุปงบ งวด '+k.no);const m=14;[26,8,12,11,14,11,14,11,14,15,9,12,12,22].forEach((w,i)=>w2.getColumn(i+1).width=w);
  let q=await xHead(wb,w2,[2,4,5,3],{title:c.name,date:(k.sub&&k.sub.date)||todayISO(),band:'สรุปงบเบิกผลงาน (คุมงบตามปริมาณ ตร.ม. ต่อ ITEM)',band2:xBand2(c,k)});
  w2.getRow(q).height=20;w2.getRow(q+1).height=30;const G=(r1,c1,r2,c2,t,f)=>xb(w2,r1,c1,r2,c2,t,{al:'center',b:true,fs:10,fill:f||'EEEEEE',border:hb});
  G(q,1,q+1,1,'ITEM');G(q,2,q+1,2,'หน่วย');G(q,3,q,5,'ราคาจัดจ้าง (ห้องที่ได้รับ)');G(q,6,q,7,'สะสมก่อน');G(q,8,q,9,'งวดนี้',CURH);G(q,10,q,11,'รวมเบิกสะสม');G(q,12,q,13,'เทียบ BOQ');G(q,14,q+1,14,'หมายเหตุ');
  ['ปริมาณ','ค่าแรง/\nหน่วย','บาท','ปริมาณ','บาท'].forEach((t,i)=>G(q+1,3+i,q+1,3+i,t));G(q+1,8,q+1,8,'ปริมาณ',CURH);G(q+1,9,q+1,9,'บาท',CURH);G(q+1,10,q+1,10,'บาท');G(q+1,11,q+1,11,'%');G(q+1,12,q+1,12,'BOQ');G(q+1,13,q+1,13,'คงเหลือ');
  q+=2;const f0=q;const bc=boqControl(c.building);
  for(const it of items){const b=bc.find(y=>y.it.id===it.boqId);const B=X_BOX(X_THIN);w2.getRow(q).height=24;
    xb(w2,q,1,q,1,it.name,{border:B});xb(w2,q,2,q,2,it.unit,{al:'center',border:B});xnum(w2,q,3,it.qty,FQ);xnum(w2,q,4,it.rate,FM);xnum(w2,q,5,{formula:`C${q}*D${q}`,result:it.qty*it.rate},FM);
    xnum(w2,q,6,it.prev,FQ);xnum(w2,q,7,{formula:`F${q}*D${q}`,result:it.prev*it.rate},FM);xnum(w2,q,8,it.cur,FQ,{fill:CURF});xnum(w2,q,9,{formula:`H${q}*D${q}`,result:it.cur*it.rate},FM,{fill:CURF});
    xnum(w2,q,10,{formula:`(F${q}+H${q})*D${q}`,result:(it.prev+it.cur)*it.rate},FM);xnum(w2,q,11,{formula:`IF(C${q}=0,0,(F${q}+H${q})/C${q})`,result:it.qty?(it.prev+it.cur)/it.qty:0},FP);
    xnum(w2,q,12,b&&b.qty?b.qty:0,FQ);xnum(w2,q,13,b&&b.qty?b.qty-b.alloc:0,FQ);xb(w2,q,14,q,14,b&&b.qty?(b.over?'จัดสรรเกิน BOQ':''):'ไม่มี BOQ คลุม',{color:'BB0000',fs:9,border:B});q++}
  const exr=k.rows.filter(y=>y.extra);
  if(exr.length){xb(w2,q,1,q,14,'รายการอื่นๆ นอกตารางห้อง',{b:true,fill:'F2EFE6',border:X_BOX(X_THIN)});q++;
    for(const it of exr){const B=X_BOX(X_THIN);w2.getRow(q).height=24;
      xb(w2,q,1,q,1,(it.floor?it.floor+' · ':'')+it.name,{border:B});xb(w2,q,2,q,2,it.unit,{al:'center',border:B});xnum(w2,q,3,it.qty,FQ);xnum(w2,q,4,it.rate,FM);xnum(w2,q,5,{formula:`C${q}*D${q}`,result:it.amt},FM);
      xnum(w2,q,6,it.prev,FQ);xnum(w2,q,7,{formula:`F${q}*D${q}`,result:it.prevAmt},FM);xnum(w2,q,8,it.cur,FQ,{fill:CURF});xnum(w2,q,9,{formula:`H${q}*D${q}`,result:it.curAmt},FM,{fill:CURF});
      xnum(w2,q,10,{formula:`(F${q}+H${q})*D${q}`,result:it.cumAmt},FM);xnum(w2,q,11,{formula:`IF(C${q}=0,0,(F${q}+H${q})/C${q})`,result:it.pct/100},FP);
      xnum(w2,q,12,0,FQ);xnum(w2,q,13,0,FQ);xb(w2,q,14,q,14,rowNote(it),{color:'BB0000',fs:9,border:B});q++}}
  const l0=q-1,T=k.T,tb={top:X_MED,bottom:X_BLK,left:X_BLK,right:X_BLK};w2.getRow(q).height=22;
  xb(w2,q,1,q,4,'รวม',{al:'center',b:true,fill:'F3F3F3',border:tb});const sm=(col,res,fill)=>xnum(w2,q,col,{formula:(items.length||exr.length)?`SUM(${colL(col)}${f0}:${colL(col)}${l0})`:'0',result:res},FM,{b:true,fill:fill||'F3F3F3',border:tb});
  sm(5,T.amt);xb(w2,q,6,q,6,'',{fill:'F3F3F3',border:tb});sm(7,T.prevAmt);xb(w2,q,8,q,8,'',{fill:CURF,border:tb});sm(9,T.curAmt,CURF);sm(10,T.cumAmt);xnum(w2,q,11,{formula:`IF(E${q}=0,0,J${q}/E${q})`,result:T.pct/100},FP,{b:true,fill:'F3F3F3',border:tb});
  xb(w2,q,12,q,14,'',{fill:'F3F3F3',border:tb});const tq=q;q+=2;q=xSumBox(w2,q,m,`รวมเป็นเงินเบิกผลงาน งวดที่ ${k.no}`,{formula:`I${tq}`,result:T.curAmt});xSig(w2,q,m);xPage(w2,m);
}

/* ---- แบบ/รูปที่แนบ (วาดทับแล้ว) ---- */
async function svgPng(svg,w,h,maxW){
  const k=Math.min(1,maxW/w),cw=Math.max(1,Math.round(w*k)),ch=Math.max(1,Math.round(h*k));
  const url=URL.createObjectURL(new Blob([svg.replace('<svg ',`<svg width="${cw}" height="${ch}" `)],{type:'image/svg+xml'}));
  try{const im=await loadImgEl(url);const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cw,ch);x.drawImage(im,0,0,cw,ch);return{url:cv.toDataURL('image/png'),w:cw,h:ch}}
  finally{URL.revokeObjectURL(url)}
}
async function xAttach(wb,c,k){
  const s=k.sub;if(!s)return;const plans=s.plans||[],ph=s.photos||[];
  if(plans.length){const ws=wb.addWorksheet('แบบประกอบ');ws.getColumn(1).width=3;ws.views=[{showGridLines:false}];let r=1;
    for(const p of plans){xb(ws,r,2,r,12,'แบบประกอบการส่งงาน · '+(p.name||''),{b:true,fs:12,fill:'DCDCDC',border:X_BOX(X_BLK)});r++;
      const g=await svgPng(annotatedSvg(imgSrc(p.imgId),p.w,p.h,p.shapes||[],[],{scale:p.sym}),p.w,p.h,900);
      const id=wb.addImage({base64:g.url.split(',')[1],extension:'png'});ws.addImage(id,{tl:{col:1,row:r},ext:{width:g.w,height:g.h}});r+=Math.ceil(g.h/20)+2}
    ws.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0}}
  if(ph.length){const ws=wb.addWorksheet('รูปถ่าย');ws.views=[{showGridLines:false}];for(let i=1;i<=15;i++)ws.getColumn(i).width=9.5;
    xb(ws,1,1,1,15,'รูปถ่ายประกอบการส่งงาน',{b:true,fs:12,fill:'DCDCDC',border:X_BOX(X_BLK)});
    for(let i=0;i<ph.length;i++){const p=ph[i];const row=3+Math.floor(i/3)*16,col=i%3*5;
      const g=await svgPng(annotatedSvg(imgSrc(p.imgId),p.w,p.h,p.shapes||[],[]),p.w,p.h,330);
      const id=wb.addImage({base64:g.url.split(',')[1],extension:'png'});ws.addImage(id,{tl:{col:col+0.1,row:row-1+0.1},ext:{width:g.w,height:Math.min(g.h,280)}});
      xb(ws,row+14,col+1,row+14,col+5,`${i+1}. ${p.caption||''}`,{fs:9})}
    ws.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0}}
}
async function crewXlsxBlob(c,no){
  if(!window.ExcelJS)throw new Error('ยังโหลดตัวสร้าง Excel ไม่ได้ (ต้องมีอินเทอร์เน็ตครั้งแรก)');
  const k=calcCrew(c,no);const s=k.sub;
  await ensureData([S.project.logoId],true);if(s)await ensureData([...(s.plans||[]),...(s.photos||[])].map(x=>x.imgId));
  const wb=new ExcelJS.Workbook();wb.creator=S.project.company||'Work Desk';wb.created=new Date();
  if(c.mode==='room'){await xRoomSheets(wb,c,k);const ek=extraK(k);if(ek)await xLineSheet(wb,c,ek,{sheet:'รายการอื่นๆ งวด '+k.no,band:'รายการอื่นๆ นอกตารางห้อง',sumLabel:'รวมรายการอื่นๆ',nosig:true})}else await xLineSheet(wb,c,k);
  await xAttach(wb,c,k);
  return new Blob([await wb.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
async function exportXlsx(c,no){
  try{toast('กำลังสร้าง Excel…',3000);const k=calcCrew(c,no);await saveFile(safeName(`${c.building}_${c.name}_งวด${k.no}`)+'.xlsx',await crewXlsxBlob(c,no))}
  catch(e){toast('สร้าง Excel ไม่สำเร็จ: '+(e.message||e),5000)}
}
/* ---- สรุปทั้งอาคาร ---- */
async function exportBuildingXlsx(b,kind){
  try{
    if(!window.ExcelJS)throw new Error('ยังโหลดตัวสร้าง Excel ไม่ได้');
    const crews=S.crews.filter(c=>(!b||c.building===b)&&(!kind||c.kind===kind)).sort((a,z)=>natCmp(a.building,z.building)||(a.order||0)-(z.order||0));
    const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet('สรุป');const n=11;[5,8,34,16,36,16,16,16,16,9,26].forEach((w,i)=>ws.getColumn(i+1).width=w);
    let r=await xHead(wb,ws,[1,3,4,3],{title:`สรุปส่งงาน/เบิกผลงาน ${b?'อาคาร '+b:'ทุกอาคาร'}${kind?' · '+KIND[kind]:''}`,date:todayISO(),band:'สรุปส่งงาน / เบิกผลงาน',band2:`วันที่ ${fmtDate(todayISO())}`});
    const hb=X_BOX(X_BLK);ws.getRow(r).height=30;
    ['ที่','อาคาร','ชุด','ประเภท','รายละเอียดงาน','มูลค่าสัญญา','เบิกก่อนหน้า','งวดล่าสุด','รวมเบิกสะสม','%','หมายเหตุ'].forEach((t,i)=>xb(ws,r,i+1,r,i+1,t,{al:'center',b:true,fill:i===7?CURH:'EEEEEE',border:hb}));r++;
    const f0=r;
    crews.forEach((c,i)=>{const k=calcCrew(c),t=k.T,B=X_BOX(X_THIN);ws.getRow(r).height=30;
      xb(ws,r,1,r,1,i+1,{al:'center',border:B});xb(ws,r,2,r,2,c.building,{al:'center',border:B});xb(ws,r,3,r,3,c.name,{border:B});xb(ws,r,4,r,4,KIND[c.kind]||'',{al:'center',border:B});xb(ws,r,5,r,5,c.detail||'',{fs:9,border:B});
      if(c.skip){for(let q=6;q<=10;q++)xb(ws,r,q,r,q,'-',{al:'right',border:B})}
      else{xnum(ws,r,6,t.amt,FM);xnum(ws,r,7,t.prevAmt,FM);xnum(ws,r,8,t.curAmt,FM,{fill:CURF});xnum(ws,r,9,{formula:`G${r}+H${r}`,result:t.cumAmt},FM);xnum(ws,r,10,{formula:`IF(F${r}=0,0,I${r}/F${r})`,result:t.pct/100},FP)}
      xb(ws,r,11,r,11,[c.skip?'ไม่ส่งงานงวดนี้':'',c.note,k.missing?`ไม่มี BOQ ${k.missing} รายการ`:'',!k.rows.length&&!c.skip?'ยังไม่มีรายการ':''].filter(Boolean).join(' · '),{color:'BB0000',fs:9,border:B});r++});
    const l0=r-1,T=crews.filter(c=>!c.skip).reduce((a,c)=>{const t=calcCrew(c).T;return{amt:a.amt+t.amt,prev:a.prev+t.prevAmt,cur:a.cur+t.curAmt,cum:a.cum+t.cumAmt}},{amt:0,prev:0,cur:0,cum:0});
    const tb={top:X_MED,bottom:X_BLK,left:X_BLK,right:X_BLK};ws.getRow(r).height=22;xb(ws,r,1,r,5,'รวมทั้งหมด',{al:'center',b:true,fill:'F3F3F3',border:tb});
    [[6,T.amt],[7,T.prev],[8,T.cur],[9,T.cum]].forEach(a=>xnum(ws,r,a[0],{formula:crews.length?`SUM(${colL(a[0])}${f0}:${colL(a[0])}${l0})`:'0',result:a[1]},FM,{b:true,fill:a[0]===8?CURF:'F3F3F3',border:tb}));
    xnum(ws,r,10,{formula:`IF(F${r}=0,0,I${r}/F${r})`,result:T.amt?T.cum/T.amt:0},FP,{b:true,fill:'F3F3F3',border:tb});xb(ws,r,11,r,11,'',{fill:'F3F3F3',border:tb});
    const tr=r;r+=2;r=xSumBox(ws,r,n,'รวมเป็นเงินเบิกผลงานงวดล่าสุด',{formula:`H${tr}`,result:T.cur});xSig(ws,r,n);xPage(ws,n);
    await saveFile(safeName('สรุปส่งงาน_'+(b||'ทุกอาคาร'))+'.xlsx',new Blob([await wb.xlsx.writeBuffer()],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  }catch(e){toast('สร้าง Excel ไม่สำเร็จ: '+(e.message||e),5000)}
}
