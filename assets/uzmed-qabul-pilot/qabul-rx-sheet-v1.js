/* UZMED · AI retsept varag‘i (GLM 5.3 Flash · OpenRouter, server orqali).
   Davolash asboblar qatoridagi tugma → tashxis va qabul ma’lumotlari asosida retsept qoralamasi,
   dori almashtirish (shu guruh, yosh chegarasi bilan), shifokor tekshiruvi va chop etish.
   Mavjud kodga tegmaydi; faqat yangi tugma va oyna qo‘shadi. */
(function(W,D){
 'use strict';
 if(W.__UZMED_QABUL_RX_SHEET_V1__)return;
 W.__UZMED_QABUL_RX_SHEET_V1__=true;
 const SVG='http://www.w3.org/2000/svg';
 const ICON={
  rx:'M7 3h8l5 5v13H7z M15 3v6h5 M10 11h2.5a1.75 1.75 0 0 1 0 3.5H10V11z M10 14.5V18 M12.2 14.5l3.3 3.5',
  print:'M6 9V3h12v6 M6 17H3V9h18v8h-3 M6 14h12v7H6z',
  refresh:'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
  close:'M6 6l12 12 M18 6L6 18',
  save:'M5 3h11l3 3v15H5z M8 3v5h7V3 M8 21v-7h8v7',
  remove:'M6 12h12'
 };
 const $=id=>D.getElementById(id);
 function icon(key){
  const svg=D.createElementNS(SVG,'svg');
  for(const [k,v]of [['viewBox','0 0 24 24'],['fill','none'],['stroke','currentColor'],['stroke-width','1.8'],['stroke-linecap','round'],['stroke-linejoin','round'],['aria-hidden','true']])svg.setAttribute(k,v);
  svg.classList.add('qcx-svg');
  const p=D.createElementNS(SVG,'path');p.setAttribute('d',ICON[key]);svg.append(p);
  return svg;
 }
 function el(tag,cls,text){const n=D.createElement(tag);if(cls)n.className=cls;if(text!=null&&text!=='')n.textContent=text;return n;}
 function btn(label,key,cls,onclick,iconOnly){
  const b=el('button',cls);b.type='button';b.setAttribute('aria-label',label);b.title=label;
  if(key)b.append(icon(key));
  b.append(el('span',iconOnly?'qcx-visually-hidden':'qrx-btn-label',label));
  b.onclick=onclick;return b;
 }
 // Retsept varag‘i dizayni: ekranda ham, chop etishda ham bir xil (yuqori oynaga ham ko‘chiriladi).
 const SHEET_CSS=".qrx-sheet{--ink:#13212b;--muted:#5b6b76;--line:#cfd9df;--accent:#0f6e66;--soft:#f3f7f8;box-sizing:border-box;width:100%;max-width:760px;margin:0 auto;background:#fff;color:var(--ink);font-family:-apple-system,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif;font-size:15px;line-height:1.45;padding:18px;border:1px solid #d8e1e6;border-radius:8px;box-shadow:0 3px 14px #172e3b1f;-webkit-print-color-adjust:exact;print-color-adjust:exact;text-align:left}\n.qrx-sheet *{box-sizing:border-box}\n.qrx-frame{position:relative;border:1.6px solid var(--ink);border-radius:6px;padding:16px 18px 14px}\n.qrx-frame::before{content:\"\";position:absolute;inset:3px;border:.6px solid var(--ink);border-radius:4px;pointer-events:none}\n.qrx-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding-bottom:10px;border-bottom:1.6px solid var(--ink)}\n.qrx-org{margin:0;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.qrx-hd h1{margin:2px 0 0;font-size:24px;letter-spacing:.18em;font-weight:800;color:var(--ink)}\n.qrx-sub{margin:0;font-size:12px;color:var(--muted)}\n.qrx-hd-side{text-align:right;font-size:11px;color:var(--muted);white-space:nowrap;text-transform:uppercase;letter-spacing:.06em;font-weight:600}\n.qrx-hd-side b{display:block;color:var(--ink);font-size:15px;letter-spacing:0;text-transform:none}\n.qrx-pt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 14px;margin:12px 0 4px}\n.qrx-pt>div{min-width:0}\n.qrx-pt .qrx-wide{grid-column:1/-1}\n.qrx-pt>div>span{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600}\n.qrx-pt b{display:block;font-size:15px;font-weight:600;border-bottom:1px solid var(--line);padding:1px 0 3px;overflow-wrap:anywhere;min-height:1.6em}\n.qrx-icd{display:inline-block;margin-left:6px;padding:0 6px;border:1px solid var(--ink);border-radius:4px;font-size:12px;font-weight:700;white-space:nowrap}\n.qrx-rp{display:flex;align-items:baseline;gap:10px;margin:14px 0 4px}\n.qrx-rp strong{font-family:Georgia,\"Times New Roman\",serif;font-style:italic;font-size:22px}\n.qrx-rp span{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600}\n.qrx-items{list-style:none;margin:0;padding:0;counter-reset:rx}\n.qrx-item{counter-increment:rx;position:relative;padding:10px 0 10px 40px;border-bottom:1px dashed var(--line);break-inside:avoid;page-break-inside:avoid}\n.qrx-item:last-child{border-bottom:0}\n.qrx-item::before{content:counter(rx);position:absolute;left:0;top:10px;width:26px;height:26px;border-radius:50%;border:1.6px solid var(--ink);font-weight:800;font-size:13px;line-height:23px;text-align:center}\n.qrx-item p{margin:0}\n.qrx-l1{margin:0 0 4px!important;font-size:16.5px;font-weight:800}\n.qrx-form{font-weight:500;color:var(--muted)}\n.qrx-how{display:grid;grid-template-columns:max-content 1fr;gap:3px 12px;margin:0}\n.qrx-how dt{font-size:11.5px;color:var(--muted);font-weight:600;padding-top:2px}\n.qrx-how dd{margin:0;font-size:15px;min-width:0;overflow-wrap:anywhere}\n.qrx-how dd.qrx-dose{font-weight:700}\n.qrx-empty{list-style:none;color:var(--muted);font-style:italic;padding:8px 0}\n.qrx-empty::before{display:none}\n.qrx-rec{margin-top:12px;padding:10px 12px;border:1px solid var(--line);border-radius:6px;background:var(--soft);break-inside:avoid;page-break-inside:avoid}\n.qrx-rec h2{margin:0 0 4px;font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--accent)}\n.qrx-rec ul{margin:0;padding-left:18px}\n.qrx-rec li{margin:2px 0}\n.qrx-foot{display:grid;grid-template-columns:1fr 1fr auto;gap:14px;align-items:end;margin-top:18px;break-inside:avoid;page-break-inside:avoid}\n.qrx-sign span{display:block;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600}\n.qrx-sign b{display:block;border-bottom:1px solid var(--ink);min-height:1.7em;font-weight:600;padding-bottom:2px}\n.qrx-seal{width:62px;height:62px;border:1px dashed var(--muted);border-radius:50%;font-size:10px;color:var(--muted);line-height:60px;text-align:center}\n.qrx-fine{margin:10px 0 0;font-size:10.5px;color:var(--muted);text-align:center}\n.qrx-sheet [contenteditable=true]{outline:none;border-radius:3px}\n.qrx-sheet [contenteditable=true]:focus{background:#fff6d6}\n.qrx-sheet[data-paper=A5]{max-width:560px;font-size:14px;padding:14px}\n.qrx-sheet[data-paper=A5] .qrx-pt{grid-template-columns:repeat(2,minmax(0,1fr))}\n.qrx-sheet[data-paper=A5] .qrx-hd h1{font-size:21px}\n.qrx-sheet[data-paper^=R]{max-width:310px;padding:12px 10px;font-size:12.5px;border-radius:2px;font-family:\"Helvetica Neue\",Arial,sans-serif}\n.qrx-sheet[data-paper=R58]{max-width:226px;font-size:11.5px;padding:10px 6px}\n.qrx-sheet[data-paper^=R] .qrx-frame{border:0;padding:0}\n.qrx-sheet[data-paper^=R] .qrx-frame::before{display:none}\n.qrx-sheet[data-paper^=R] .qrx-hd{flex-direction:column;align-items:center;text-align:center;gap:4px;border-bottom:1px dashed var(--ink);padding-bottom:6px}\n.qrx-sheet[data-paper^=R] .qrx-hd-side{text-align:center}\n.qrx-sheet[data-paper^=R] .qrx-hd h1{font-size:17px;letter-spacing:.14em}\n.qrx-sheet[data-paper^=R] .qrx-pt{grid-template-columns:1fr;gap:2px;margin:8px 0 2px}\n.qrx-sheet[data-paper^=R] .qrx-pt>div{display:flex;gap:6px;align-items:baseline}\n.qrx-sheet[data-paper^=R] .qrx-pt>div>span{flex:none;font-size:9.5px}\n.qrx-sheet[data-paper^=R] .qrx-pt b{border:0;font-size:inherit;min-height:0;padding:0}\n.qrx-sheet[data-paper^=R] .qrx-rp{margin:8px 0 2px;border-top:1px dashed var(--ink);padding-top:6px}\n.qrx-sheet[data-paper^=R] .qrx-rp strong{font-size:17px}\n.qrx-sheet[data-paper^=R] .qrx-item{padding:7px 0 7px 24px}\n.qrx-sheet[data-paper^=R] .qrx-item::before{width:18px;height:18px;font-size:10.5px;line-height:15px;top:7px;border-width:1.3px}\n.qrx-sheet[data-paper^=R] .qrx-l1{font-size:1.07em}\n.qrx-sheet[data-paper^=R] .qrx-how{grid-template-columns:1fr;gap:0}\n.qrx-sheet[data-paper^=R] .qrx-how dt{padding-top:3px;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em}\n.qrx-sheet[data-paper^=R] .qrx-how dd{font-size:inherit}\n.qrx-sheet[data-paper^=R] .qrx-rec{background:none;border:0;border-top:1px dashed var(--ink);border-radius:0;padding:6px 0 0}\n.qrx-sheet[data-paper^=R] .qrx-foot{grid-template-columns:1fr;gap:6px;margin-top:10px}\n.qrx-sheet[data-paper^=R] .qrx-seal{display:none}\n@media screen and (max-width:420px){.qrx-sheet{padding:10px}.qrx-frame{padding:12px 12px 10px}.qrx-pt{grid-template-columns:repeat(2,minmax(0,1fr))}.qrx-item{padding-left:34px}.qrx-hd h1{font-size:20px}}\n\n@media print{.qrx-sheet{font-size:13.5px;line-height:1.38}.qrx-sheet .qrx-frame{padding:12px 14px 10px}.qrx-sheet .qrx-l1{font-size:15px}.qrx-sheet .qrx-how dd{font-size:13.5px}.qrx-sheet .qrx-item{padding-top:7px;padding-bottom:7px}.qrx-sheet .qrx-item::before{top:7px}.qrx-sheet .qrx-pt{margin:10px 0 2px;gap:6px 14px}.qrx-sheet .qrx-rp{margin:10px 0 2px}.qrx-sheet .qrx-rec{margin-top:8px;padding:8px 10px}.qrx-sheet .qrx-foot{margin-top:14px}.qrx-sheet .qrx-hd h1{font-size:22px}.qrx-sheet[data-paper^=R]{font-size:11.5px}.qrx-sheet[data-paper^=R] .qrx-l1{font-size:12.5px}.qrx-sheet[data-paper^=R] .qrx-how dd{font-size:11.5px}.qrx-sheet[data-paper^=R] .qrx-frame{padding:0}}";
 const PAPERS=[['A4','A4'],['A5','A5'],['R80','Chek 80 mm'],['R58','Chek 58 mm']];
 const PAGE={A4:'size:A4 portrait;margin:12mm',A5:'size:A5 portrait;margin:8mm',R80:'size:80mm 297mm;margin:2mm 3mm',R58:'size:58mm 297mm;margin:2mm'};
 const bridge=()=>W.UZMEDVisitBridge;
 const auth=()=>W.parent?.UZMEDAuth||W.UZMEDAuth;

 function snapshot(){
  const {fields:f,extra:e,labs}=W.QabulVisitState.capture(W);
  return {complaints:f.complaints||'',history:f.history||'',life:e.life||'',epidemiology:e.epidemiology||'',
   allergies:f.allergies||'',medications:f.medications||'',exam:f.exam||'',neuro:e.neuro||'',localis:e.localis||'',
   tests:f.tests||'',testNotes:W.QabulClinical?.capture().test_notes||'',height:e.height||'',weight:e.weight||'',
   labs:(labs||[]).filter(r=>r.name&&r.value).map(({name,value,unit,low,high})=>({name,value,unit,low,high}))};
 }
 function ageText(dob){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dob||''))return '';
  const b=new Date(dob+'T00:00:00'),n=new Date();
  let m=(n.getFullYear()-b.getFullYear())*12+n.getMonth()-b.getMonth();if(n.getDate()<b.getDate())m--;
  if(m<0)return '';if(m<1)return Math.max(0,Math.floor((n-b)/864e5))+' kunlik';if(m<24)return m+' oylik';return Math.floor(m/12)+' yosh';
 }
 function weightValue(){
  const v=($('qp-weight')?.value||$('weight')?.value||'').trim();
  return /^\d+(?:[.,]\d+)?$/.test(v)?v.replace(',','.'):'';
 }
 // UZMED · retsept qatoridagi birlik va doza arifmetikasini tekshirish (frontend va backendda bir xil).
 function rxFixItem(it){
  if(!it||typeof it!=='object')return it;
  const out={...it};
  const unit=s=>String(s||'').replace(/(\d)\s*(?:µg|μg|mcg|мкг)/gi,'$1 mkg').replace(/(?:µg|μg|мкг)/g,'mkg').replace(/(\d)\s*(?:µl|μl)/gi,'$1 mkl').replace(/(\d)\s*(?:IU|ME|МЕ)\b/g,'$1 XB');
  for(const k of ['name','form','strength','dose','frequency','duration','timing','route','purpose','minAge','note'])if(typeof out[k]==='string')out[k]=unit(out[k]);
  if(out.form)out.form=out.form.replace(/\s*\(([^()]*)\)/g,', $1').replace(/^[,\s]+|[,\s]+$/g,'');
  const num=s=>parseFloat(String(s).replace(',','.'));
  const fmt=n=>(Math.round(n*10)/10).toString().replace('.',',');
  const src=(out.strength||'')+' '+(out.name||'');
  const combo=/\d\s*\/\s*\d+(?:[.,]\d+)?\s*(?:mg|mkg)\b|\+/i.test(src);
  let dose=out.dose||'',fixed='';
  // Burun spreyi: «har bir burun teshigiga N purkash» → har teshikka va jami miqdor.
  const NOSE='har\\s+(?:bir\\s+)?burun\\s+(?:teshigiga|yo[‘\'’`]?liga|kataklariga|katagiga)',PUFF='(?:ta\\s*)?(?:purkash|puflash|doza|ingalyatsiya)';
  const nasal=dose.match(new RegExp(NOSE+'\\s+(\\d+)\\s*'+PUFF,'i'))||dose.match(new RegExp('^\\s*(\\d+)\\s*'+PUFF+'\\b[^:]*?'+NOSE,'i'));
  const per=src.match(/(\d+(?:[.,]\d+)?)\s*mkg/i);
  if(nasal&&per&&!combo){
   const n=num(nasal[1]),s=num(per[1]),each=n*s,total=each*2;
   const freq=(out.frequency||dose).match(/kuniga\s+(\d+)\s*(?:mahal|marta)/i);
   dose=dose.replace(/\s*\([^()]*(?:mkg|mg)[^()]*\)/gi,'').replace(/\s*[:—-]\s*har teshikka.*$/i,'').trim();
   dose+=': har teshikka '+fmt(each)+' mkg, bir martada jami '+fmt(total)+' mkg'+(freq?', sutkasiga '+fmt(total*num(freq[1]))+' mkg':'');
  }else if(!combo){
   // Tabletka/kapsula: N tabletka × kuch = qavsdagi mg.
   const tab=dose.match(/^\s*(\d+(?:[.,]\d+)?|½|1\/2|yarim)\s*(?:ta\s*)?(tabletka|kapsula|draje)\b/i);
   const tabS=src.match(/(\d+(?:[.,]\d+)?)\s*(mg|mkg)\b(?!\s*\/)/i);
   const inPar=dose.match(/\(\s*(\d+(?:[.,]\d+)?)\s*(mg|mkg)\s*\)/i);
   if(tab&&tabS&&inPar&&inPar[2].toLowerCase()===tabS[2].toLowerCase()){
    const n=/½|1\/2|yarim/i.test(tab[1])?0.5:num(tab[1]),want=n*num(tabS[1]);
    if(Math.abs(want-num(inPar[1]))>want*0.02){dose=dose.replace(inPar[0],'('+fmt(want)+' '+inPar[2]+')');fixed='Doza miqdori qayta hisoblandi: AI '+inPar[1]+' '+inPar[2]+' yozgan edi. Tekshiring.';}
   }
   // Suyuq shakl: N ml × konsentratsiya = qavsdagi mg.
   const ml=dose.match(/^\s*(\d+(?:[.,]\d+)?)\s*ml\b/i);
   const conc=src.match(/(\d+(?:[.,]\d+)?)\s*(mg|mkg)\s*\/\s*(\d+(?:[.,]\d+)?)?\s*ml/i);
   if(ml&&conc&&inPar&&inPar[2].toLowerCase()===conc[2].toLowerCase()){
    const want=num(ml[1])*num(conc[1])/(conc[3]?num(conc[3]):1);
    if(Math.abs(want-num(inPar[1]))>want*0.02){dose=dose.replace(inPar[0],'('+fmt(want)+' '+inPar[2]+')');fixed='Doza miqdori qayta hisoblandi: AI '+inPar[1]+' '+inPar[2]+' yozgan edi. Tekshiring.';}
   }
  }
  out.dose=dose;
  if(fixed&&!String(out.note||'').includes('qayta hisoblandi'))out.note=(fixed+' '+(out.note||'')).trim();
  return out;
 }
 function hasForm(it){return String(it.name||'').toLowerCase().includes(String(it.form||'').toLowerCase());}
 function today(){const d=new Date(),p=x=>String(x).padStart(2,'0');return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear();}

 async function api(body,signal){
  const state=bridge()?.read?.();
  const pid=state?.patient?.patient_id,vid=state?.visit?.visit_id;
  if(!pid||!vid)throw Error('Avval bemor qabulini oching.');
  if(state.readOnly||state.visit.status==='closed')throw Error('Qabul yopilgan yoki faqat o‘qish uchun.');
  const token=await auth()?.getAccessToken?.();
  if(!token)throw Error('Akkauntga qayta kiring.');
  const res=await W.fetch('/api/patients/'+encodeURIComponent(pid)+'/visits/'+encodeURIComponent(vid)+'/qabul-rx-sheet',{
   method:'POST',cache:'no-store',credentials:'omit',redirect:'error',signal,
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
   body:JSON.stringify({expectedRevision:state.visit.revision,...body})
  });
  let data={};try{data=await res.json();}catch(_){}
  if(!res.ok)throw Error(data.message||(res.status===403?'GLM retsepti Admin yoki faol PRO akkaunti uchun.':'Retsept tayyorlanmadi. Qayta urinib ko‘ring.'));
  return data;
 }

 // ── Holat ──
 const S={visit:'',open:false,busy:false,data:null,key:'',controller:null,paper:(()=>{try{const v=W.localStorage.getItem('uzmed_rx_paper');return PAPERS.some(p=>p[0]===v)?v:'A4';}catch{return 'A4';}})()};
 let overlay,sheet,status,notes,printBtn,checked,listHost,recHost,metaHost;

 function visitKey(){const s=bridge()?.read?.();return s?.visit?.visit_id||'';}
 function diagnosisText(){return ($('field-diagnosis')?.value||'').trim();}
 // Varaq uchun: shablon qoldiqlari ([…], differensial qismi, takrorlar) olib tashlanadi.
 function cleanDx(text){
  let t=String(text||'').split(/\n/).map(x=>x.trim()).find(Boolean)||'';
  t=t.split(/\s*[—–-]\s*\[|\s*\[|\.\s*Differensial|\s+Differensial tashxis/i)[0];
  t=t.replace(/[\s—–:;,.-]+$/,'').trim();
  return t||String(text||'').trim().slice(0,200);
 }
 function institution(){try{const v=JSON.parse(W.localStorage.getItem('uzmed_qabul_print_v1')||'{}');return typeof v.institution==='string'?v.institution.trim().slice(0,160):'';}catch{return '';}}
 function icdText(){return ($('field-icd')?.value||'').trim().toUpperCase();}

 function build(){
  overlay=el('div','qrx-overlay');overlay.id='qrxOverlay';overlay.hidden=true;
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Retsept');
  const bar=el('div','qrx-bar qrx-noprint');
  const title=el('div','qrx-title');title.append(el('strong','','Retsept'),el('small','','GLM 5.3 Flash · shifokor tekshiradi'));
  const paper=el('select','qrx-paper');paper.setAttribute('aria-label','Qog‘oz o‘lchami');
  for(const [v,l] of PAPERS){const o=el('option','',l);o.value=v;paper.append(o);}
  paper.value=S.paper;
  paper.onchange=()=>{S.paper=paper.value;try{W.localStorage.setItem('uzmed_rx_paper',S.paper);}catch{}applyPaper();};
  const regen=btn('Qayta tuzish','refresh','qrx-btn qrx-act',()=>generate(true));
  const save=btn('Davolashga yozish','save','qrx-btn qrx-act',writeToVisit);
  printBtn=btn('Chop etish','print','qrx-btn qrx-primary',doPrint);
  const close=btn('Yopish','close','qrx-btn qrx-icon',hide,true);
  bar.append(title,paper,regen,save,printBtn,close);
  status=el('p','qrx-status qrx-noprint');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const confirm=el('label','qrx-confirm qrx-noprint');checked=D.createElement('input');checked.type='checkbox';
  checked.onchange=syncPrint;confirm.append(checked,el('span','','Dorilar, dozalar va yosh chegarasini tekshirdim — retsept mening nomimdan beriladi.'));
  notes=el('div','qrx-notes qrx-noprint');
  if(!$('qrxSheetCss')){const st=el('style');st.id='qrxSheetCss';st.textContent=SHEET_CSS;D.head.append(st);}
  sheet=el('article','qrx-sheet');sheet.id='qrxSheet';
  const frame=el('div','qrx-frame');
  const head=el('header','qrx-hd'),brand=el('div'),side=el('div','qrx-hd-side');
  brand.append(el('p','qrx-org'),el('h1','','RETSEPT'),el('p','qrx-sub','Dori vositalarini qabul qilish tartibi'));
  side.append(D.createTextNode('Sana'),el('b','qrx-date'));head.append(brand,side);
  metaHost=el('div','qrx-pt');
  const rp=el('div','qrx-rp');rp.append(el('strong','','Rp.'),el('span','','Dori vositalari'));
  listHost=el('ol','qrx-items');
  const recBox=el('section','qrx-rec');recBox.append(el('h2','','Tavsiyalar'));recHost=el('ul');recBox.append(recHost);
  const foot=el('footer','qrx-foot');
  frame.append(head,metaHost,rp,listHost,recBox,foot,el('p','qrx-fine','Dorilarni faqat shu varaqdagi tartibda qabul qiling. Savollar bo‘lsa, shifokoringizga murojaat qiling.'));
  sheet.append(frame);
  const scroller=el('div','qrx-scroll');scroller.append(status,notes,sheet,confirm);
  overlay.append(bar,scroller);
  D.body.append(overlay);
  overlay.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
 }
 function applyPaper(){
  sheet.dataset.paper=S.paper;
 }
 function syncPrint(){printBtn.disabled=S.busy||!S.data?.items?.length||!checked.checked;}

 function row(label,value,cls){const d=el('div',cls);d.append(el('span','',label),el('b','',value||' '));metaHost.append(d);return d;}
 function renderMeta(){
  metaHost.replaceChildren();
  const p=bridge()?.read?.()?.patient||{};
  const name=[p.last_name,p.first_name,p.middle_name].filter(Boolean).join(' ')||($('field-patient')?.value||'').trim();
  row('Bemor (F.I.Sh.)',name,'qrx-wide');row('Yoshi',ageText(p.date_of_birth)||($('field-age')?.value||'').trim());
  const w=weightValue();row('Tana vazni',w?w+' kg':'');
  const dx=row('Tashxis',cleanDx(diagnosisText()),'qrx-wide');
  if(icdText())dx.querySelector('b').append(el('span','qrx-icd','MKB-10 '+icdText()));
  const org=sheet.querySelector('.qrx-org');if(org)org.textContent=institution()||'UZMED · Tibbiy retsept';
  const date=sheet.querySelector('.qrx-date');if(date)date.textContent=today();
 }
 function editable(node,item,key){
  node.contentEditable='true';node.spellcheck=false;node.dataset.field=key;
  node.addEventListener('input',()=>{item[key]=node.textContent.trim();});
  return node;
 }

 // ── Davlat reyestri (O‘zbekiston, 18 353 preparat): to‘liq muqobillar ATC kodi bo‘yicha, AI siz ──
 const REG_URL='/assets/uzmed-qabul-pilot/official-active-drugs-v4.json?v=20261108-archive6';
 const CYR={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh','щ':'sh','ъ':'','ы':'i','ь':'','э':'e','ю':'yu','я':'ya'};
 function translit(t){return String(t||'').replace(/[а-яё]/gi,c=>{const l=c.toLowerCase(),r=CYR[l]??c;return c===l?r:r.charAt(0).toUpperCase()+r.slice(1);});}
 const FORMS=[[/инъекц|для инфуз/i,'in’eksiya'],[/таблет|tablet/i,'tabletka'],[/капсул/i,'kapsula'],[/сироп/i,'sirop'],[/суспенз/i,'suspenziya'],[/порош|гранул/i,'kukun'],[/капли/i,'tomchi'],[/спрей|аэрозол/i,'sprey'],[/мазь/i,'malham'],[/крем/i,'krem'],[/гель/i,'gel'],[/суппоз|свеч/i,'sham'],[/раствор/i,'eritma'],[/пастил|леденц/i,'so‘rg‘ich']];
 const formOf=t=>{for(const [re,f] of FORMS)if(re.test(t))return f;return '';};
 const FORM_KEY=[[/tab/i,'tabletka'],[/kaps/i,'kapsula'],[/sirop/i,'sirop'],[/suspen/i,'suspenziya'],[/kukun|poroshok|granul/i,'kukun'],[/tomchi/i,'tomchi'],[/sprey|aerozol|purka/i,'sprey'],[/malham|maz/i,'malham'],[/krem/i,'krem'],[/gel/i,'gel'],[/sham|suppoz/i,'sham'],[/in.?eksiya|ukol|ampula/i,'in’eksiya'],[/eritma/i,'eritma']];
 const itemForm=t=>{for(const [re,f] of FORM_KEY)if(re.test(t||''))return f;return '';};
 const UNIT={'мг':'mg','мкг':'mkg','г':'g','мл':'ml','ме':'ME','доза':'doza','%':'%'};
 function strengthOf(title){
  const m=String(title).match(/(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?)\s*(мкг|мг|ме|г|%)(?:\s*\/\s*(\d+(?:[.,]\d+)?)?\s*(мл|г|доза))?/i);
  if(!m)return '';
  return (m[1].replace(/\s+/g,'')+' '+(UNIT[m[2].toLowerCase()]||m[2])+(m[4]?'/'+(m[3]?m[3]+' ':'')+(UNIT[m[4].toLowerCase()]||m[4]):'')).replace(',','.');
 }
 const numKey=t=>(String(t||'').replace(',','.').match(/\d+(?:\.\d+)?/g)||[]).join('/');
 const innKey=t=>translit(t).toLowerCase().replace(/[^a-z]/g,'').replace(/h/g,'g').replace(/x/g,'g');
 const nameCase=t=>t.replace(/[®™]/g,'').trim().toLowerCase().replace(/(^|[\s(-])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase());
 const REG={rows:null,loading:null,failed:false};
 function loadRegistry(){
  if(REG.rows||REG.loading)return REG.loading||Promise.resolve(REG.rows);
  REG.loading=W.fetch(REG_URL,{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('http '+r.status);return r.json();}).then(d=>{
   const seen=new Set(),out=[];
   for(const r of d.rows||[]){
    const title=String(r[3]||''),atc=String(r[7]||'').toUpperCase(),inn=String(r[6]||'');
    if(!atc&&!inn)continue;
    const form=formOf(title),strength=strengthOf(title);
    const cut=title.search(/\s(?:таблет|капсул|сироп|суспенз|порош|гранул|капли|спрей|аэрозол|мазь|крем|гель|суппоз|свеч|раствор|лиоф|пастил|леденц|концентрат|эмульс)/i);
    const name=nameCase(translit(cut>0?title.slice(0,cut):title.split(/\s\d/)[0]));
    const key=atc+'|'+name+'|'+form+'|'+strength;
    if(!name||seen.has(key))continue;seen.add(key);
    out.push({atc,inn,innKey:innKey(inn),innLat:nameCase(translit(inn)),name,form,strength,label:[name,strength,form].filter(Boolean).join(' · ')});
   }
   REG.rows=out;return out;
  }).catch(e=>{REG.failed=true;console.warn('[UZMED rx] reyestr',e&&e.message);return null;}).finally(()=>{REG.loading=null;});
  return REG.loading;
 }
 function alternativesFor(item){
  const rows=REG.rows||[],atc=String(item.atc||'').toUpperCase(),key=innKey(item.inn),f=itemForm(item.form||item.name);
  const same=rows.filter(r=>(atc.length===7&&r.atc===atc)||(key.length>3&&r.innKey===key));
  same.sort((a,b)=>(b.form===f)-(a.form===f)||a.name.localeCompare(b.name));
  const groups=new Map();
  if(atc.length>=5)for(const r of rows){
   if(r.atc.slice(0,5)!==atc.slice(0,5)||r.atc===atc||!r.innKey||/утвержд/i.test(r.inn)||(key&&r.innKey===key))continue;
   const g=groups.get(r.innKey)||{inn:r.innLat,count:0};g.count++;groups.set(r.innKey,g);
  }
  return {same:same.slice(0,80),group:[...groups.values()].sort((a,b)=>b.count-a.count).slice(0,40)};
 }
 function renderItems(){
  listHost.replaceChildren();
  const items=S.data?.items||[];
  if(!items.length){listHost.append(el('li','qrx-empty','Dori qatori yo‘q.'));return;}
  items.forEach((item,index)=>{
   const li=el('li','qrx-item');
   const l1=el('p','qrx-l1');
   l1.append(editable(el('span','qrx-name',item.name),item,'name'));
   if(item.form&&!hasForm(item))l1.append(D.createTextNode(' '),editable(el('span','qrx-form','('+item.form+')'),item,'form'));
   const how=el('dl','qrx-how');
   const line=(label,cls)=>{const dd=el('dd',cls);how.append(el('dt','',label),dd);return dd;};
   const dose=line('Qabul','qrx-dose');
   dose.append(editable(el('span','',item.dose),item,'dose'));
   if(item.frequency)dose.append(el('span','qrx-dash',' — '),editable(el('span','',item.frequency),item,'frequency'));
   if(item.duration)line('Muddati').append(editable(el('span','',item.duration),item,'duration'));
   if(item.timing)line('Qachon').append(editable(el('span','',item.timing),item,'timing'));
   if(item.purpose)line('Nima uchun').append(editable(el('span','',item.purpose),item,'purpose'));
   li.append(l1,how);
   // Faqat ekranda: yosh chegarasi, asos, almashtirish
   const tools=el('div','qrx-item-tools qrx-noprint');
   if(item.minAge)tools.append(el('span','qrx-chip','Yosh: '+item.minAge));
   if(item.note)tools.append(el('span','qrx-note',item.note));
   const sel=buildSwap(item,index);
   const rm=btn('Qatorni o‘chirish','remove','qrx-btn qrx-icon qrx-rm',()=>{if(S.busy)return;S.data.items.splice(index,1);renderItems();syncPrint();},true);
   rm.disabled=S.busy;
   tools.append(sel,rm);
   li.append(tools);
   listHost.append(li);
  });
 }

 function buildSwap(item,index){
  const sel=el('select','qrx-swap');sel.setAttribute('aria-label',(index+1)+'-dori: almashtirish');
  const first=el('option','','Almashtirish…');first.value='';sel.append(first);
  const picks=[];
  if(REG.rows){
   const {same,group}=alternativesFor(item);
   if(same.length){
    const g=el('optgroup');g.label='Shu modda — boshqa preparatlar ('+same.length+')';
    for(const r of same){if(r.name.toLowerCase()===String(item.name).toLowerCase())continue;const o=el('option','',r.label);o.value='p:'+picks.length;picks.push({type:'product',r});g.append(o);}
    sel.append(g);
   }
   if(group.length){
    const g=el('optgroup');g.label='Shu guruh — boshqa moddalar ('+group.length+')';
    for(const x of group){const o=el('option','',x.inn+' — '+x.count+' ta preparat');o.value='p:'+picks.length;picks.push({type:'inn',x});g.append(o);}
    sel.append(g);
   }
   if(!same.length&&!group.length){const o=el('option','','Reyestrda muqobil topilmadi');o.disabled=true;sel.append(o);}
  }else{
   const o=el('option','',REG.failed?'Reyestr yuklanmadi':'Reyestr yuklanmoqda…');o.disabled=true;sel.append(o);
  }
  const own=el('option','','Boshqa dori yozish…');own.value='__custom';sel.append(own);
  sel.disabled=S.busy;
  sel.onchange=()=>{
   const v=sel.value;sel.value='';if(!v||S.busy)return;
   if(v==='__custom'){const name=(W.prompt('Yangi dori nomi (savdo nomi va dozasi):','')||'').trim();if(name)swap(index,name);return;}
   const pick=picks[Number(v.slice(2))];if(!pick)return;
   if(pick.type==='inn'){swap(index,pick.x.inn);return;}
   const r=pick.r,cur=S.data.items[index];
   // Shu modda, shu shakl va shu kuch — doza o‘zgarmaydi: AI ga murojaatsiz darhol almashtiriladi.
   if(cur&&r.form&&r.form===itemForm(cur.form||cur.name)&&r.strength&&numKey(r.strength)===numKey(cur.strength)){
    S.data.items[index]={...cur,name:[r.name,r.strength].join(' ')};
    checked.checked=false;renderAll();status.textContent=(index+1)+'-dori «'+r.name+'» ga almashtirildi (doza o‘zgarmadi).';
    return;
   }
   swap(index,[r.name,r.strength,r.form].filter(Boolean).join(' '));
  };
  return sel;
 }
 function renderRec(){
  recHost.replaceChildren();
  for(const r of S.data?.recommendations||[]){const li=el('li','',r);li.contentEditable='true';li.spellcheck=false;recHost.append(li);}
  recHost.closest('section').hidden=!(S.data?.recommendations||[]).length;
 }
 function renderFoot(){
  const foot=sheet.querySelector('.qrx-foot');foot.replaceChildren();
  const sign=(label,value)=>{const d=el('div','qrx-sign');d.append(el('span','',label),el('b','',value||' '));return d;};
  foot.append(sign('Shifokor',($('field-doctor')?.value||'').trim()),sign('Imzo',''),el('div','qrx-seal','M.O‘.'));
  const date=sheet.querySelector('.qrx-date');if(date)date.textContent=today();
 }
 function renderNotes(){
  notes.replaceChildren();
  const add=(title,list,cls)=>{if(!list?.length)return;const box=el('div','qrx-notebox '+cls);box.append(el('strong','',title));const ul=el('ul');for(const t of list)ul.append(el('li','',t));box.append(ul);notes.append(box);};
  add('Shifokor uchun eslatma',S.data?.cautions,'warn');
  add('Yetishmayotgan ma’lumot',S.data?.needsInfo,'info');
 }
 function renderAll(){renderMeta();renderItems();renderRec();renderFoot();renderNotes();syncPrint();}

 function setBusy(v,text){S.busy=v;overlay.setAttribute('aria-busy',String(v));if(text!=null)status.textContent=text;
  for(const s of overlay.querySelectorAll('select.qrx-swap,.qrx-rm,.qrx-act'))s.disabled=v;syncPrint();}

 async function generate(force){
  const dx=diagnosisText();
  renderMeta();
  if(!dx){S.data=null;renderAll();status.textContent='Avval Tashxis bo‘limida asosiy tashxisni yozing (yoki AI variantidan «100%» ni bosing).';return;}
  const key=JSON.stringify([visitKey(),dx,icdText(),snapshot()]);
  if(!force&&S.data&&S.key===key){renderAll();return;}
  if(S.busy)return;
  S.controller?.abort();const ctrl=S.controller=new AbortController();
  checked.checked=false;
  setBusy(true,'Tashxis, shikoyat, anamnez, ko‘rik va tahlillar asosida retsept tuzilmoqda…');
  try{
   const data=await api({draft:snapshot(),diagnosis:dx,icd:icdText()},ctrl.signal);
   if(ctrl.signal.aborted)return;
   if(Array.isArray(data.items))data.items=data.items.map(rxFixItem);
   S.data=data;S.key=key;renderAll();
   status.textContent=data.items?.length?'Qoralama tayyor. Har bir dori, doza va yosh chegarasini tekshiring; matnni bosib tahrirlash mumkin.':'Retsept uchun ma’lumot yetarli emas — pastdagi eslatmani ko‘ring.';
  }catch(e){if(!ctrl.signal.aborted){status.textContent=e.message;}}
  finally{if(S.controller===ctrl)setBusy(false);}
 }
 async function swap(index,selected){
  if(S.busy||!S.data?.items?.[index])return;
  const ctrl=S.controller=new AbortController();
  checked.checked=false;
  setBusy(true,'«'+selected+'» uchun doza va qabul tartibi hisoblanmoqda…');
  try{
   const items=S.data.items.map(({alternatives,_verified,_line3,_purpose,...rest})=>rest);
   const snapshotItems=S.data.items;
   const data=await api({draft:snapshot(),diagnosis:diagnosisText(),icd:icdText(),swap:{items,index,selected}},ctrl.signal);
   if(S.data.items!==snapshotItems||!S.data.items[index])return; // ro‘yxat o‘zgargan bo‘lsa natija tashlanadi
   S.data.items[index]=rxFixItem(data.item);
   S.data.cautions=[...new Set([...(S.data.cautions||[]),...(data.cautions||[])])];
   renderAll();status.textContent=(index+1)+'-dori almashtirildi. Yangi dozani tekshiring.';
  }catch(e){if(!ctrl.signal.aborted)status.textContent=e.message;}
  finally{if(S.controller===ctrl)setBusy(false);}
 }
 function plainText(){
  const lines=(S.data?.items||[]).map((it,i)=>{
   const l3=it._line3!=null?it._line3:[it.duration,it.timing].filter(Boolean).join(', ');
   return (i+1)+'. '+it.name+(it.form&&!hasForm(it)?' ('+it.form+')':'')+' — '+[it.dose,it.frequency].filter(Boolean).join(', ')+(l3?'; '+l3:'');
  });
  const rec=[...recHost.querySelectorAll('li')].map(li=>'- '+li.textContent.trim()).filter(t=>t.length>2);
  return {rx:lines.join('\n'),rec:rec.join('\n')};
 }
 function writeToVisit(){
  if(!S.data?.items?.length){status.textContent='Yoziladigan retsept yo‘q.';return;}
  const tr=$('field-treatment'),adv=$('field-advice');
  if(!tr){status.textContent='Davolash maydoni topilmadi.';return;}
  if(tr.value.trim()&&!W.confirm('Davolash maydonidagi mavjud matn retsept bilan almashtirilsinmi?'))return;
  const t=plainText();
  tr.value=t.rx;tr.dispatchEvent(new W.Event('input',{bubbles:true}));
  if(adv&&t.rec&&!adv.value.trim()){adv.value=t.rec;adv.dispatchEvent(new W.Event('input',{bubbles:true}));}
  status.textContent='Retsept Davolash maydoniga yozildi. Qabulni saqlang.';
 }
 // Chop etish: iframe ichidan emas, yuqori oynaning o‘zidan — aks holda iOS faqat
 // ko‘rinib turgan iframe qismini (1 sahifa, kesilgan) chop etadi.
 function printCss(paper){
  const width={R80:'74mm',R58:'54mm'}[paper]||'none';
  return SHEET_CSS+'\n@media screen{#uzmedRxPrint{display:none!important}}'+
   '\n@media print{@page{'+PAGE[paper]+'}'+
   'html.uzmed-rx-printing,html.uzmed-rx-printing body{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;background:#fff!important;margin:0!important;padding:0!important;position:static!important;transform:none!important}'+
   'html.uzmed-rx-printing body>*:not(#uzmedRxPrint){display:none!important}'+
   '#uzmedRxPrint{display:block!important;position:static!important;width:auto!important;margin:0!important}'+
   '#uzmedRxPrint .qrx-sheet{box-shadow:none!important;border:0!important;border-radius:0!important;margin:0 auto!important;padding:0!important;max-width:'+width+'!important}}';
 }
 function doPrint(){
  if(printBtn.disabled)return;
  applyPaper();renderMeta();renderFoot();
  let top=W;
  try{if(W.top&&W.top!==W&&W.top.location.origin===W.location.origin&&W.top.document.body)top=W.top;}catch{}
  const TD=top.document;
  TD.getElementById('uzmedRxPrint')?.remove();
  const root=TD.createElement('div');root.id='uzmedRxPrint';
  const style=TD.createElement('style');style.textContent=printCss(S.paper);
  const clone=sheet.cloneNode(true);clone.removeAttribute('id');
  clone.querySelectorAll('.qrx-noprint,select,button').forEach(n=>n.remove());
  clone.querySelectorAll('[contenteditable]').forEach(n=>n.removeAttribute('contenteditable'));
  if(!(S.data?.recommendations||[]).length)clone.querySelector('.qrx-rec')?.remove();
  root.append(style,TD.importNode(clone,true));TD.body.append(root);
  TD.documentElement.classList.add('uzmed-rx-printing');
  const cleanup=()=>{root.remove();TD.documentElement.classList.remove('uzmed-rx-printing');};
  top.addEventListener('afterprint',cleanup,{once:true});
  try{
   if(typeof top.print!=='function')throw Error('unsupported');
   top.print(); // tugma bosilishida to‘g‘ridan-to‘g‘ri chaqiriladi (iOS ruxsati)
  }catch(_){cleanup();status.textContent='Chop etish oynasi ochilmadi: brauzerning Ulashish (↑) → Chop etish bandini tanlang.';}
 }
 function show(){
  if(!overlay)build();
  overlay.hidden=false;S.open=true;D.documentElement.classList.add('qrx-open');applyPaper();
  if(S.visit!==visitKey()){S.data=null;S.key='';S.visit=visitKey();}
  void generate(false);
  if(!REG.rows)loadRegistry().then(()=>{if(S.open&&S.data?.items?.length&&!S.busy)renderItems();});
  overlay.querySelector('.qrx-btn')?.focus?.();
 }
 function hide(){
  if(!overlay)return;
  overlay.hidden=true;S.open=false;D.documentElement.classList.remove('qrx-open');
  S.controller?.abort();S.busy=false;
 }

 // ── Davolash asboblar qatoriga tugma ──
 function mount(){
  const section=D.querySelector('[data-focus-section=treatment]');
  const tools=section?.closest('#qabulFocus')?.querySelector('.qf-tools');
  if(!section||!tools||!W.QabulVisitState)return false;
  if(tools.querySelector('.qrx-open-btn'))return true;
  const open=btn('AI retsept','rx','qcx-action qcx-icon-only qt-manual qrx-open-btn',show,true);
  const anchor=tools.querySelector('.qt-manual');
  if(anchor)anchor.after(open);else tools.prepend(open);
  // GLM 5.3 Flash faqat Admin yoki faol UZMED PRO uchun: oddiy foydalanuvchiga tugma ko‘rinmaydi.
  const allowed=()=>{try{return (W.parent?.UZMEDPremiumFlash||W.UZMEDPremiumFlash)?.allowed===true;}catch(_){return false;}};
  const sync=()=>{open.hidden=section.hidden||bridge()?.read?.()?.readOnly===true||!allowed();if(section.hidden&&S.open)hide();};
  let checks=0;(function poll(){sync();if(allowed()||++checks>40)return;setTimeout(poll,1500);})();
  try{W.parent?.addEventListener?.('uzmed:auth-change',()=>{checks=0;sync();setTimeout(sync,3000);});}catch(_){}
  new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['hidden']});
  W.addEventListener('qabul:session-ready',()=>{S.data=null;S.key='';sync();});
  W.addEventListener('qabul:clinical-locked',sync);
  sync();
  return true;
 }
 let tries=0;
 (function retry(){if(mount()||++tries>60)return;setTimeout(retry,250);})();
 W.UZMEDQabulRxSheet={open:show,close:hide};
})(window,document);
