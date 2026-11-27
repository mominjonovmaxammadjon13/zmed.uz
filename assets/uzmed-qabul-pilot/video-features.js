'use strict';
(function(W,D){
 const $=id=>D.getElementById(id),kit=W.UzmedQabul,focus=W.QabulFocus,safety=W.QabulSafety;
 if(!kit||!focus||!safety||!$('testPlan'))return;
 const node=(tag,text,cls)=>{const n=D.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn)=>{const b=node('button',text,'vf-action');b.type='button';b.onclick=fn;return b;};
 const input=(label,type='text',value='')=>{const n=node('input');n.type=type;n.value=value;n.setAttribute('aria-label',label);n.maxLength=200;return n;};
 const field=(label,control)=>{const l=node('label',label,'vf-field');l.append(control);return l;};
 const block=(title,help)=>{const b=node('section',undefined,'vf-block');b.append(node('h3',title));if(help)b.append(node('p',help,'vf-help'));return b;};
 const message=(el,text)=>{el.textContent=text;el.setAttribute('role','status');};
 const signal=el=>{el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));};
 const id=()=> 'custom-'+W.crypto.randomUUID();
 const lines=()=>[...new Set($('field-tests').value.split('\n').map(x=>x.trim()).filter(Boolean))];
 const rxKeys=['name','inn','dose','frequency','route','duration','food','notes','goal'];
 const rxData=()=>[...$('rxRows').children].map(row=>Object.fromEntries(rxKeys.map(k=>[k,row.querySelector('[name="'+k+'"]')?.value.trim()||'']))).filter(row=>row.name||row.inn);
 function appendTests(names){const previous=lines(),seen=new Set(previous.map(x=>x.toLowerCase()));let count=0;for(const value of names){const name=String(value).trim().slice(0,120);if(name&&!seen.has(name.toLowerCase())&&[...previous,name].join('\n').length<=5000){previous.push(name);seen.add(name.toLowerCase());count++;}}$('field-tests').value=previous.join('\n');signal($('field-tests'));return count;}
 const packs={Standart:['Umumiy qon tahlili','Umumiy siydik tahlili','Glyukoza'], 'Check-up':['Umumiy qon tahlili','Umumiy siydik tahlili','Glyukoza','Kreatinin','ALT','AST'],Kardio:['EKG','Exokardiografiya (EhoKG)','Umumiy xolesterin','LDL xolesterin','HDL xolesterin','Triglitseridlar']};
 const pack=block('Tekshiruv paketlari','Namuna to‘plamlar. Tarkibini shifokor tanlaydi; shaxsiy paketni quyida saqlash mumkin.'),packActions=node('div',undefined,'vf-actions'),packStatus=node('p','','vf-help');
 for(const [title,values]of Object.entries(packs))packActions.append(button(title,()=>message(packStatus,appendTests(values)+' ta tekshiruv qo‘shildi.')));
 const packName=input('Tekshiruv paketi nomi');packName.maxLength=120;
 pack.append(packActions,field('Shaxsiy paket nomi',packName),button('Tanlanganlardan paket saqlash',()=>saveTemplate('video-pack',packName.value,{tests:JSON.stringify(lines())},packStatus)),packStatus);
 $('testPlan').prepend(pack);
 const catalog=block('Mening tekshiruv katalogim','Shaxsiy katalog UZMED akkauntingizda saqlanadi. Natijalar va bemor yozuvlari shablonga kiritilmaydi.'),customList=node('div'),customStatus=node('p','','vf-help');
 const testName=input('Yangi tekshiruv nomi'),testDocName=input('Hujjatdagi tekshiruv nomi'),testGroup=input('Tekshiruv guruhi');testName.maxLength=testDocName.maxLength=120;testGroup.maxLength=80;
 const where=node('select');where.setAttribute('aria-label','Tekshiruv qayerda ko‘rinsin');for(const [v,t]of [['both','Reja va natijalar'],['plan','Faqat reja'],['result','Faqat natijalar']]){const o=node('option',t);o.value=v;where.append(o);}
 const customForm=node('details');customForm.append(node('summary','+ Shaxsiy tekshiruv qo‘shish'),field('Tekshiruv nomi',testName),field('Hujjatdagi nomi (ixtiyoriy)',testDocName),field('Guruhi (ixtiyoriy)',testGroup),field('Ko‘rinadigan joyi',where),button('Katalogga saqlash',()=>saveTemplate('video-test',testName.value,{test:testName.value.trim(),docname:testDocName.value.trim(),group:testGroup.value.trim(),where:where.value},customStatus)));
 catalog.append(customForm,customList,customStatus);pack.after(catalog);
 const personal=block('Shaxsiy shablonlar','Shablon nomi va tarkibi akkauntingizga tegishli. Qo‘llangach tayinlovni qayta tekshiring.'),ownPacks=node('div'),ownRx=node('div'),ownRxStatus=node('p','','vf-help');
 const rxName=input('Dori shabloni nomi');rxName.maxLength=120;const rxCondition=input('Dori shabloni kasallik yoki bo‘limi');rxCondition.maxLength=80;
 personal.append(field('Shablon nomi',rxName),field('Kasallik / bo‘lim (ixtiyoriy)',rxCondition),button('Joriy dorilardan shablon saqlash',()=>saveTemplate('video-rx',rxName.value,{rows:JSON.stringify(rxData()),condition:rxCondition.value.trim()},ownRxStatus)),ownRx,ownRxStatus);
 $('rxRows').after(personal);pack.append(ownPacks);
 const templateDialog=focus.dialog('videoTemplatesDialog','Tekshiruv va dori shablonlari');
 templateDialog.append(node('p','Shaxsiy tekshiruv paketlari va dori shablonlari shu bo‘limlarda saqlanadi.','vf-help'),button('Tekshiruv paketlarini ochish',()=>{templateDialog.close();focus.show('tests',true);pack.scrollIntoView({block:'start'});}),button('Dori shablonlarini ochish',()=>{templateDialog.close();focus.show('treatment',true);personal.scrollIntoView({block:'start'});}));
 // Preserve existing disease/text templates; add a separate entry for structured rows.
 const structuredTemplates=button('Tekshiruv / dori shablonlari',()=>{$('allergyTemplateDialog')?.close();load();focus.openDialog(templateDialog);});structuredTemplates.id='vfStructuredTemplates';($('allergyLegacy')||$('templateDialog').lastElementChild).after(structuredTemplates);
 const reload=button('Shaxsiy katalogni yangilash',load);catalog.append(reload);
 let templates=[];
 async function saveTemplate(section,title,values,status){
  title=String(title).trim();if(!title||title.length>120)return message(status,'Nom kiriting (120 belgigacha).');
  if(section==='video-pack'&&lines().length===0)return message(status,'Avval tekshiruvlarni tanlang.');
  if(section==='video-rx'&&rxData().length===0)return message(status,'Avval kamida bitta dori qatorini to‘ldiring.');
  if(Object.values(values).some(x=>typeof x!=='string'||x.length>5000))return message(status,'Shablon juda katta. Kamroq qator tanlang.');
  try{await W.QabulAccount.save('section',{id:id(),title,section,values});await load();message(status,'Shaxsiy akkauntga saqlandi.');}
  catch(e){message(status,e.message||'Saqlash bajarilmadi.');}
 }
 function savedRow(t,apply){const row=node('div',undefined,'vf-saved-row');row.append(button(t.title,()=>apply(t)),button('O‘chirish',async()=>{if(!W.confirm('“'+t.title+'” shabloni o‘chirilsinmi?'))return;try{await W.QabulAccount.remove('section',t.id);await load();}catch(e){message(customStatus,e.message);}}));return row;}
 function addResult(t){
  const name=t.values.test;if(!name)return;
  const empty=[...$('labs').children].find(row=>![...row.querySelectorAll('input')].some(n=>n.value));
  if(empty){for(const [k,v]of Object.entries({name,docname:t.values.docname||''})){const n=empty.querySelector('[name="'+k+'"]');if(n)n.value=v;}signal(empty.querySelector('input'));}
  else kit.addLab({name,docname:t.values.docname||''});
  D.querySelector('[data-tests="results"]').click();message(customStatus,'Natija qatori qo‘shildi. Sana va qiymatni kiriting.');
 }
 function applyRx(t){
  let rows;try{rows=JSON.parse(t.values.rows);}catch{return message(ownRxStatus,'Shablon tuzilmasi xato.');}
  if(!Array.isArray(rows)||rows.length>30||rows.some(r=>!r||typeof r!=='object'||Array.isArray(r)||rxKeys.some(k=>r[k]!==undefined&&typeof r[k]!=='string')))return message(ownRxStatus,'Shablon qatorlari yaroqsiz.');
  if($('rxRows').children.length+rows.length>30)return message(ownRxStatus,'Shablon sig‘madi: jami 30 ta dori qatori mumkin. Mavjud tayinlov o‘zgarmadi.');
  for(const r of rows){$('addRx').click();const last=$('rxRows').lastElementChild;for(const k of rxKeys){const n=last.querySelector('[name="'+k+'"]');if(n)n.value=String(r[k]||'').slice(0,200);}signal(last.querySelector('input'));}
  message(ownRxStatus,rows.length+' ta qator qo‘shildi. Doza, DDI va monelikni tekshiring.');
 }
 async function load(){
  customList.replaceChildren();ownPacks.replaceChildren();ownRx.replaceChildren();templates=[];message(customStatus,'Yuklanmoqda…');
  try{templates=await W.QabulAccount.list('section');
   for(const t of templates){if(!t.values||typeof t.values!=='object')continue;
    if(t.section==='video-test'&&typeof t.values.test==='string'){
     const row=node('div',undefined,'vf-saved-row');row.append(node('span',[(t.values.group||'Shaxsiy'),t.title].join(' · ')));
     if(t.values.where!=='result')row.append(button('Rejaga',()=>message(customStatus,appendTests([t.values.docname||t.values.test])+' ta qo‘shildi.')));
     if(t.values.where!=='plan')row.append(button('Natijaga',()=>addResult(t)));
     row.append(button('O‘chirish',async()=>{if(W.confirm('Shaxsiy tekshiruv o‘chirilsinmi?'))try{await W.QabulAccount.remove('section',t.id);await load();}catch(e){message(customStatus,e.message);}}));customList.append(row);
    }
    if(t.section==='video-pack')ownPacks.append(savedRow(t,x=>{let a;try{a=JSON.parse(x.values.tests);}catch{}if(!Array.isArray(a)||a.length>200||a.some(v=>typeof v!=='string'))return message(packStatus,'Paket tuzilmasi xato.');message(packStatus,appendTests(a)+' ta tekshiruv qo‘shildi.');}));
    if(t.section==='video-rx')ownRx.append(savedRow(t,applyRx));
   }
   message(customStatus,customList.children.length?'':'Shaxsiy katalog bo‘sh.');message(ownRxStatus,ownRx.children.length?'':'Shaxsiy dori shablonlari yo‘q.');
  }catch(e){message(customStatus,e.message||'Akkauntga kirib qayta yuklang.');message(ownRxStatus,'Shaxsiy shablonlarni yuklab bo‘lmadi.');}
 }
 const oldDdi=$('panel-treatment').querySelector('.inline-note');if(oldDdi)oldDdi.textContent='Mahalliy DDI tekshiruvi quyida avtomatik ishlaydi. Barcha qoidalar va topilmagan juftliklar shifokor tomonidan tekshiriladi.';
 const review=block('Dori mosligi va moneliklar','INN (ta’sir etuvchi modda) bo‘yicha tekshiriladi. Kombinatsiya tarkibini “+” bilan kiriting. Mahalliy qoida yo‘qligi xavfsizlik kafolati emas.');
 const reviewActions=node('div',undefined,'vf-actions'),ddiStatus=node('p','','vf-help'),ddiList=node('div'),matrix=node('div',undefined,'vf-matrix');matrix.hidden=true;
 reviewActions.append(button('Ro‘yxat',()=>{ddiList.hidden=false;matrix.hidden=true;}),button('Matritsa',()=>{ddiList.hidden=true;matrix.hidden=false;}),button('Hozir tekshirish',checkDrugs));review.append(reviewActions,ddiStatus,ddiList,matrix);personal.after(review);
 const renalBlock=block('Buyrak faoliyati va rasmiy yo‘riqnoma','eGFR CrCl bilan bir xil emas. Natija tayinlovni yoki dozani avtomatik almashtirmaydi. Bir qiymatdan surunkali buyrak kasalligi tashxislanmaydi.'),gfr=input('Bemor eGFR','number'),dialysis=node('select');gfr.min='1';gfr.max='200';gfr.step='.1';
 for(const [value,label]of [['unknown','Dializ holati noma’lum'],['no','Dializ olmaydi'],['yes','Dializ oladi']]){const o=node('option',label);o.value=value;dialysis.append(o);}dialysis.setAttribute('aria-label','Dializ holati');
 const renalList=node('div');renalBlock.append(field('eGFR · ml/min/1,73 m²',gfr),field('Dializ',dialysis),renalList);review.after(renalBlock);
 function ingredients(){return rxData().flatMap(r=>(r.inn||r.name).split('+').map(s=>s.trim()).filter(Boolean));}
 function renderRenal(){renalList.replaceChildren();if(!safety.ready()){renalList.append(node('p','Asosiy dori ma’lumotlari hali yuklanmadi.'));return;}for(const r of safety.renal(ingredients(),{egfr:gfr.value,dialysis:dialysis.value==='yes'})){const card=node('article',undefined,'vf-review '+(r.level==='contra'?'vf-contra':''));card.append(node('strong',r.name),node('p',r.text));if(r.reference){const details=node('details');details.append(node('summary','Yo‘riqnomadagi doza mezonlari'),node('p',r.reference),node('p','Bu ma’lumot tayinlovga avtomatik ko‘chirilmaydi. Preparat shakli va bemorga mosligini shifokor tekshiradi.','vf-help'));card.append(details);}if(r.source){const a=node('a','DailyMed · rasmiy yo‘riqnoma');a.href=r.source;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}renalList.append(card);}if(!renalList.children.length)renalList.append(node('p','Avval dori tayinlovini kiriting.','vf-help'));}
 function checkDrugs(){
  ddiList.replaceChildren();matrix.replaceChildren();const names=ingredients();renderRenal();if(!safety.ready())return message(ddiStatus,'Asosiy DDI manbasi hali yuklanmadi. Tekshiruv bajarilmadi; qayta oching.');
  if(names.length<2)return message(ddiStatus,'DDI uchun kamida ikki ta’sir etuvchi modda kerak.');
  let r;try{r=safety.check(names);}catch(e){return message(ddiStatus,e.message);}
  message(ddiStatus,r.drugs.length+' ta modda · '+r.total+' juftlik · '+r.covered+' juftlikda qoida topildi. '+(r.unknown.length?'Aniqlanmagan: '+r.unknown.join(', ')+'. ':'')+'Qoida topilmagan juftliklar tekshirilmagan; xavfsiz deb baholanmaydi.');
  for(const p of r.pairs){const card=node('article',undefined,'vf-review '+(p.level==='CONTRA'?'vf-contra':''));card.append(node('strong',p.a.name+' + '+p.b.name+' · '+safety.levels[p.level]));for(const rule of p.rules){const details=node('details');details.append(node('summary',rule.effect),node('p',rule.mechanism),node('p',rule.action),node('p','Manba: '+rule.source),node('p',rule._verified?'Mahalliy yozuvda tasdiqlangan deb belgilangan.':'Mahalliy yozuvning manbasi mustaqil tasdiqlanmagan — shifokor tekshiradi.','vf-help'));card.append(details);}ddiList.append(card);}
  const duplicates=names.filter((x,i)=>{const key=safety.resolve(x);return key&&names.slice(0,i).some(n=>safety.resolve(n)===key);});if(duplicates.length)ddiList.prepend(node('p','Takror kiritilgan modda: '+[...new Set(duplicates)].join(', ')+'. Tayinlov qatorlarini tekshiring.','vf-help'));
  const table=node('table'),head=node('tr');head.append(node('th','Dori'));for(const d of r.drugs)head.append(node('th',d.name));table.append(head);
  r.drugs.forEach((d,i)=>{const row=node('tr');row.append(node('th',d.name));r.drugs.forEach((_,j)=>{const value=r.matrix[i][j],label=i===j?'—':value==='unknown'?'Aniqlanmagan':value==='unlisted'?'Qoida yo‘q':safety.levels[value]||'—';row.append(node('td',label));});table.append(row);});matrix.append(table,node('p','“Qoida yo‘q” va “Aniqlanmagan” xavfsiz degani emas.','vf-help'));
 }
 let timer;const schedule=()=>{W.clearTimeout(timer);timer=W.setTimeout(checkDrugs,250);};$('rxRows').addEventListener('input',schedule);new MutationObserver(schedule).observe($('rxRows'),{childList:true});gfr.addEventListener('input',renderRenal);dialysis.addEventListener('change',renderRenal);
 const calculator=node('details');calculator.id='qabulEgfrCalculator';calculator.append(node('summary','Tez kalkulyator · buyrak filtratsiyasi (CKD-EPI 2021)'));
 const age=input('eGFR uchun yosh','number'),sex=node('select'),cr=input('Qon kreatinini','number'),unit=node('select'),stable=input('Kreatinin barqaror, AKI yoki homiladorlik yo‘q','checkbox'),calcOut=node('p','','vf-help');
 age.min='18';age.max='120';cr.min='.1';cr.step='.1';for(const [v,t]of [['','Jinsni tanlang'],['M','Erkak'],['F','Ayol']]){const o=node('option',t);o.value=v;sex.append(o);}sex.setAttribute('aria-label','eGFR uchun jins');for(const [v,t]of [['umol/L','µmol/L'],['mg/dL','mg/dL']]){const o=node('option',t);o.value=v;unit.append(o);}unit.setAttribute('aria-label','Kreatinin birligi');
 calculator.append(field('Yosh (18+)',age),field('Jinsi',sex),field('Kreatinin',cr),field('Birlik',unit),field('Kreatinin barqaror; AKI va homiladorlik yo‘q',stable),button('eGFR hisoblash',()=>{const n=safety.egfr({age:age.value,sex:sex.value,creatinine:cr.value,unit:unit.value,stable:stable.checked});message(calcOut,n===null?'Yosh, jins, kreatinin/birlik va barqarorlikni tekshiring. Bolalar, AKI va homiladorlik uchun bu hisob qo‘llanmaydi.':'eGFR: '+n.toFixed(1)+' ml/min/1,73 m². Bu taxminiy hisob; dori dozasini avtomatik belgilamaydi.');applyGfr.disabled=n===null;applyGfr.dataset.value=n===null?'':String(n);}),calcOut);
 const applyGfr=button('Hisoblangan eGFRni tekshiruvga olish',()=>{gfr.value=applyGfr.dataset.value;signal(gfr);});applyGfr.disabled=true;
 // Invalidate a previous calculation as soon as any input changes.
 calculator.addEventListener('input',()=>{applyGfr.disabled=true;applyGfr.dataset.value='';message(calcOut,'Ma’lumot o‘zgardi. Qayta hisoblang.');});
 const source=node('a','NIDDK · formula manbasi');source.href=safety.sources.egfr;source.target='_blank';source.rel='noopener noreferrer';calculator.append(applyGfr,source);renalBlock.append(calculator);
 $('clear').addEventListener('click',()=>{if($('status').textContent==='Qoralama tozalandi. Ma’lumot serverda saqlanmagan.'){gfr.value='';dialysis.value='unknown';age.value='';sex.value='';cr.value='';stable.checked=false;applyGfr.disabled=true;message(calcOut,'');checkDrugs();}});
 // Keep contextual tools close to the prescription, without a permanently long form.
 function drawer(section,title){const wrap=node('details',undefined,'vf-block vf-drawer'),head=node('summary',title);section.classList.remove('vf-block');section.querySelector('h3')?.remove();section.before(wrap);wrap.append(head,section);return wrap;}
 drawer(personal,'Shaxsiy dori shablonlari');drawer(catalog,'Mening tekshiruv katalogim');
 const reviewDrawer=drawer(review,'Dori mosligi · tekshirish'),renalDrawer=drawer(renalBlock,'Monelik va buyrak faoliyati');
 const contextStatus=node('p','','vf-help');review.prepend(contextStatus);
 const refreshContext=button('Amaldagi dorilarni yangilash',async()=>{refreshContext.disabled=true;try{if(!W.UzmedVideoFeatures.reloadPatientContext)throw Error('Bemor kartasidan oching.');await W.UzmedVideoFeatures.reloadPatientContext();}catch(e){message(contextStatus,e.message);}finally{refreshContext.disabled=false;}});review.prepend(refreshContext);
 let patientContext=null;
 const gfrDate=input('Buyrak natijasi sanasi','date');renalBlock.prepend(field('Buyrak natijasi sanasi',gfrDate));
 function renalState(){return {egfr:gfr.value,dialysis:dialysis.value,age:age.value,sex:sex.value,creatinine:cr.value,unit:unit.value,stable:stable.checked?'yes':'no',date:gfrDate.value};}
 function restoreRenal(value={}){gfr.value=value.egfr||'';dialysis.value=value.dialysis||'unknown';age.value=value.age||'';sex.value=value.sex||'';cr.value=value.creatinine||'';unit.value=value.unit||'umol/L';stable.checked=value.stable==='yes';gfrDate.value=value.date||'';applyGfr.disabled=true;message(calcOut,'Ma’lumot tiklandi. Zarur bo‘lsa qayta hisoblang.');checkDrugs();}
 function setPatientContext(value){
  if(!value||!Array.isArray(value.medications))throw Error('Bemorning dori konteksti yuklanmadi.');
  patientContext=value;for(const k of ['approved','rxChecked','ddiChecked'])$(k).checked=false;
  contextStatus.textContent='Bemor kartasidan '+value.medications.length+' ta amaldagi dori tekshiruvga olindi · '+new Date().toLocaleTimeString('uz-UZ')+'.'+(value.unresolvedMedicationPlans?' Matnli davolash rejasi ham bor; tarkibini shifokor alohida solishtiradi.':'');
  const used=node('details'),summary=node('summary','Tekshiruvdagi amaldagi dorilar');used.append(summary);
  for(const r of value.medications)used.append(node('p',[r.name,r.inn,r.dose,r.frequency,r.duration].filter(Boolean).join(' · ')));
  review.querySelector('[data-patient-medications]')?.remove();used.dataset.patientMedications='1';contextStatus.after(used);
  checkDrugs();
 }
 const originalIngredients=ingredients;
 ingredients=function(){return (patientContext?.medications||[]).flatMap(r=>String(r.inn||r.name||'').split('+').map(s=>s.trim()).filter(Boolean)).concat(originalIngredients());};
 const originalCheck=checkDrugs;
 checkDrugs=function(){originalCheck();reviewDrawer.querySelector('summary').textContent='Dori mosligi · '+ddiList.querySelectorAll('article').length+' ta topilgan qoida';};
 // Changes in context/calculator invalidate local review checkmarks as well.
 renalBlock.addEventListener('input',()=>{for(const k of ['approved','rxChecked','ddiChecked'])$(k).checked=false;});
 W.addEventListener('qabul:ddi-ready',()=>checkDrugs());
 W.UzmedVideoFeatures={appendTests,rxData,load,packs,checkDrugs,renalState,restoreRenal,setPatientContext};load();checkDrugs();

})(window,document);
