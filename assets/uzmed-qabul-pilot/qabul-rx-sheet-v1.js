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
 const S={visit:'',open:false,busy:false,data:null,key:'',controller:null,paper:'A4'};
 let overlay,sheet,status,notes,printBtn,checked,listHost,recHost,metaHost;

 function visitKey(){const s=bridge()?.read?.();return s?.visit?.visit_id||'';}
 function diagnosisText(){return ($('field-diagnosis')?.value||'').trim();}
 function icdText(){return ($('field-icd')?.value||'').trim().toUpperCase();}

 function build(){
  overlay=el('div','qrx-overlay');overlay.id='qrxOverlay';overlay.hidden=true;
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Retsept');
  const bar=el('div','qrx-bar qrx-noprint');
  const title=el('div','qrx-title');title.append(el('strong','','Retsept'),el('small','','GLM 5.3 Flash · shifokor tekshiradi'));
  const paper=el('select','qrx-paper');paper.setAttribute('aria-label','Qog‘oz o‘lchami');
  for(const p of ['A4','A5']){const o=el('option','',p);o.value=p;paper.append(o);}
  paper.onchange=()=>{S.paper=paper.value;applyPaper();};
  const regen=btn('Qayta tuzish','refresh','qrx-btn',()=>generate(true));
  const save=btn('Davolashga yozish','save','qrx-btn',writeToVisit);
  printBtn=btn('Chop etish','print','qrx-btn qrx-primary',doPrint);
  const close=btn('Yopish','close','qrx-btn qrx-icon',hide,true);
  bar.append(title,paper,regen,save,printBtn,close);
  status=el('p','qrx-status qrx-noprint');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const confirm=el('label','qrx-confirm qrx-noprint');checked=D.createElement('input');checked.type='checkbox';
  checked.onchange=syncPrint;confirm.append(checked,el('span','','Dorilar, dozalar va yosh chegarasini tekshirdim — retsept mening nomimdan beriladi.'));
  notes=el('div','qrx-notes qrx-noprint');
  sheet=el('article','qrx-sheet');sheet.id='qrxSheet';
  const head=el('div','qrx-sheet-head');head.append(el('h1','','RETSEPT'),el('p','','(Dori vositasini yozish uchun)'));
  metaHost=el('dl','qrx-meta');
  const rp=el('div','qrx-rp');rp.append(el('strong','','Rp.:'));
  listHost=el('ol','qrx-items');
  const recBox=el('section','qrx-rec');recBox.append(el('h2','','TAVSIYALAR:'));recHost=el('ul');recBox.append(recHost);
  const foot=el('div','qrx-foot');
  sheet.append(head,metaHost,rp,listHost,recBox,foot);
  const scroller=el('div','qrx-scroll');scroller.append(status,notes,sheet,confirm);
  overlay.append(bar,scroller);
  D.body.append(overlay);
  overlay.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
  W.addEventListener('afterprint',()=>D.documentElement.classList.remove('qrx-printing'));
 }
 function applyPaper(){
  let st=$('qrxPageSize');if(!st){st=el('style');st.id='qrxPageSize';D.head.append(st);}
  st.textContent='@media print{@page{size:'+S.paper+' portrait;margin:'+(S.paper==='A5'?'9mm':'14mm')+'}}';
  sheet.dataset.paper=S.paper;
 }
 function syncPrint(){printBtn.disabled=S.busy||!S.data?.items?.length||!checked.checked;}

 function row(label,value){const dt=el('dt','',label),dd=el('dd','',value||'—');metaHost.append(dt,dd);}
 function renderMeta(){
  metaHost.replaceChildren();
  const p=bridge()?.read?.()?.patient||{};
  const name=[p.last_name,p.first_name,p.middle_name].filter(Boolean).join(' ')||($('field-patient')?.value||'').trim();
  row('Bemor:',name);row('Yoshi:',ageText(p.date_of_birth)||($('field-age')?.value||'').trim());
  const w=weightValue();row('Tana vazni:',w?w+' kg':'');
  row('Tashxis:',diagnosisText()+(icdText()?' ('+icdText()+')':''));
 }
 function editable(node,item,key){
  node.contentEditable='true';node.spellcheck=false;node.dataset.field=key;
  node.addEventListener('input',()=>{item[key]=node.textContent.trim();});
  return node;
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
   const l2=el('p','qrx-l2');
   l2.append(editable(el('span','',item.dose),item,'dose'),el('span','qrx-dash',' — '),editable(el('span','',item.frequency),item,'frequency'));
   const l3=el('p','qrx-l3');
   l3.append(editable(el('span','',[item.duration,item.timing].filter(Boolean).join(', ')),item,'_line3'));
   li.append(l1,l2,l3);
   if(item.purpose)li.append(editable(el('p','qrx-purpose','Maqsad: '+item.purpose),item,'_purpose'));
   // Faqat ekranda: yosh chegarasi, asos, almashtirish
   const tools=el('div','qrx-item-tools qrx-noprint');
   if(item.minAge)tools.append(el('span','qrx-chip','Yosh: '+item.minAge));
   if(item.note)tools.append(el('span','qrx-note',item.note));
   const sel=el('select','qrx-swap');sel.setAttribute('aria-label',(index+1)+'-dori: almashtirish');
   const first=el('option','','Almashtirish…');first.value='';sel.append(first);
   const alts=(item.alternatives||[]).filter(a=>a.name&&a.name!==item.name);
   if(alts.length){
    const g=el('optgroup');g.label='Shu guruhdagi preparatlar';
    for(const a of alts){const o=el('option','',a.name+(a.minAge?' · '+a.minAge:'')+(a.form?' · '+a.form:''));o.value=a.name;g.append(o);}
    sel.append(g);
   }
   const own=el('option','','Boshqa dori yozish…');own.value='__custom';sel.append(own);
   sel.onchange=()=>{const v=sel.value;sel.value='';if(!v)return;
    const name=v==='__custom'?(W.prompt('Yangi dori nomi (savdo nomi va dozasi):','')||'').trim():v;
    if(name)swap(index,name);};
   const rm=btn('Qatorni o‘chirish','remove','qrx-btn qrx-icon',()=>{S.data.items.splice(index,1);renderItems();syncPrint();},true);
   tools.append(sel,rm);
   li.append(tools);
   listHost.append(li);
  });
 }
 function renderRec(){
  recHost.replaceChildren();
  for(const r of S.data?.recommendations||[]){const li=el('li','',r);li.contentEditable='true';li.spellcheck=false;recHost.append(li);}
  recHost.closest('section').hidden=!(S.data?.recommendations||[]).length;
 }
 function renderFoot(){
  const foot=sheet.querySelector('.qrx-foot');foot.replaceChildren();
  const date=el('p');date.append(el('span','','Sana: '),el('u','',today()));
  const doc=el('p');doc.append(el('span','','Shifokor: '),el('u','',($('field-doctor')?.value||'').trim()||' '.repeat(28)));
  foot.append(date,doc);
 }
 function renderNotes(){
  notes.replaceChildren();
  const add=(title,list,cls)=>{if(!list?.length)return;const box=el('div','qrx-notebox '+cls);box.append(el('strong','',title));const ul=el('ul');for(const t of list)ul.append(el('li','',t));box.append(ul);notes.append(box);};
  add('Shifokor uchun eslatma',S.data?.cautions,'warn');
  add('Yetishmayotgan ma’lumot',S.data?.needsInfo,'info');
 }
 function renderAll(){renderMeta();renderItems();renderRec();renderFoot();renderNotes();syncPrint();}

 function setBusy(v,text){S.busy=v;overlay.setAttribute('aria-busy',String(v));if(text!=null)status.textContent=text;
  for(const s of overlay.querySelectorAll('select.qrx-swap'))s.disabled=v;syncPrint();}

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
   const data=await api({draft:snapshot(),diagnosis:diagnosisText(),icd:icdText(),swap:{items,index,selected}},ctrl.signal);
   const old=S.data.items[index];
   const merged=[...(data.item.alternatives||[])];
   if(!merged.some(a=>a.name===old.name))merged.unshift({name:old.name,inn:old.inn,form:old.form,minAge:old.minAge});
   S.data.items[index]={...data.item,alternatives:merged.slice(0,9)};
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
 function doPrint(){
  if(printBtn.disabled)return;
  applyPaper();renderFoot();
  D.documentElement.classList.add('qrx-printing');
  try{
   if(typeof W.print!=='function')throw Error('unsupported');
   W.print(); // tugma bosilishida to‘g‘ridan-to‘g‘ri chaqiriladi (iOS ruxsati)
  }catch(_){status.textContent='Chop etish oynasi ochilmadi: brauzerning Ulashish (↑) → Chop etish bandini tanlang.';}
 }
 function show(){
  if(!overlay)build();
  overlay.hidden=false;S.open=true;D.documentElement.classList.add('qrx-open');applyPaper();
  if(S.visit!==visitKey()){S.data=null;S.key='';S.visit=visitKey();}
  void generate(false);
  overlay.querySelector('.qrx-btn')?.focus?.();
 }
 function hide(){
  if(!overlay)return;
  overlay.hidden=true;S.open=false;D.documentElement.classList.remove('qrx-open','qrx-printing');
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
