/* UZMED diagnosis-first medication workbench: existing patient and drug services retained. */
(function(W,D){
'use strict';
const $=id=>D.getElementById(id),el=(tag,cls,txt)=>{const n=D.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
const btn=(txt,fn,cls)=>{const n=el('button',cls,txt);n.type='button';n.addEventListener('click',fn);return n;};
const normalize=s=>String(s||'').normalize('NFKC').replace(/[ʻʼ‘’]/g,"'").toLowerCase().trim();
const paths=[
 ['Allergik rinit',/allergik\s+rinit|pollinoz|j30(?:\.|$)/i,[['Intranazal kortikosteroidlar','mometazon','Shakli va yoshga mosligini tekshiring'],['II avlod H1-antigistaminlar','tsetirizin','Faol modda va yoshga moslik'],['Muqobil H1-antigistaminlar','loratadin','Takroriy preparat qo‘shmang'],['Mahalliy antigistaminlar','azelastin','Burun spreyi shakli'],['Fiziologik eritma','natriy xlorid','Yordamchi muolaja']]],
 ['Urtikariya',/urtikariya|eshakemi|l50(?:\.|$)/i,[['II avlod H1-antigistaminlar','tsetirizin','Yoshga mosligi'],['Boshqa antihistaminlar','loratadin','Muqobil tanlov'],['H1-antigistaminlar','feksofenadin','Dori yo‘riqnomasi']]],
 ['Atopik dermatit',/atopik\s+dermatit|l20(?:\.|$)/i,[['Teri parvarishi','emollient','Teri to‘sig‘i'],['Mahalliy kortikosteroidlar','gidrokortizon krem','Yosh va hududga mos kuch'],['Kalsinevrin ingibitorlari','takrolimus maz','Tegishli ko‘rsatmada']]],
 ['Bronxial astma',/bronxial\s+astma|j45(?:\.|$)/i,[['Inhalatsion kortikosteroidlar','budezonid ingalyatsiya','Yosh va nazorat bosqichi'],['Bronxodilatatorlar','salbutamol','Doimiy monoterapiya emas'],['ICS-formoterol kombinatsiyalari','budezonid formoterol','Protokol va inhaler rejimi']]],
 ['Arterial gipertenziya',/arterial\s+gipertenziya|gipertoniya|i10(?:\.|$)/i,[['AAF ingibitorlari','perindopril','Buyrak, kaliy, qarshi ko‘rsatmalar'],['Kalsiy kanali blokatorlari','amlodipin','Qon bosimi va yosh'],['Tiazidsimon diuretiklar','indapamid','Elektrolit va eGFR']]],
 ['2-tip diabet',/2.tip\s+qandli\s+diabet|e11(?:\.|$)/i,[['Biguanidlar','metformin','Yosh va eGFR'],['SGLT2 ingibitorlari','empagliflozin','Ko‘rsatma va yosh'],['GLP-1 agonistlari','semaglutid','Yosh va ko‘rsatma']]],
 ['Migren',/migren|g43(?:\.|$)/i,[['Xurujni davolash','sumatriptan','Yosh va yurak-qon tomir xavfi'],['Simptomatik davo','ibuprofen','Analgetikni ortiqcha ishlatish xavfi'],['Profilaktika','propranolol','Individual baholashdan keyin']]]
];
function mount(){
 const panel=$('panel-treatment'),stage=$('uzmedQabulV3'),rx=$('rxRows'),search=panel?.querySelector('.search-field'),right=stage?.querySelector('.uv3-right'),plan=right?.querySelector('.uv3-plan-rows');
 if(!panel||!stage||!rx||!search||!right||!plan||$('qdxWorkbench'))return;
 const root=el('section','qdx-workbench');root.id='qdxWorkbench';
 const head=el('div','qdx-top'),ht=el('div');ht.append(el('span','qdx-label','UZMED · DAVOLASH'),el('h2','','Dori tayinlash'));
 const count=el('span','qdx-count','0 ta dori');head.append(ht,count);root.append(head);
 const dx=el('div','qdx-context'),left=el('div');left.append(el('span','qdx-label','ASOSIY TASHXIS'));
 const dxName=el('strong','','Tashxis kiritilmagan'),dxInfo=el('p','qdx-note','Tashxis bo‘limidan');left.append(dxName,dxInfo);
 dx.append(left,btn('Tahrirlash',()=>W.QabulFocus?.show('diagnosis',true),'qdx-subtle'));root.append(dx);
 const rec=el('section','qdx-recommend'),recHead=el('div','qdx-subhead');recHead.append(el('h3','','Tashxisga mos dori guruhlari'),el('span','qdx-label','TANLASH UCHUN'));
 const recMsg=el('p','qdx-note'),list=el('div','qdx-rec-list');rec.append(recHead,recMsg,list);root.append(rec);
 const sh=el('div','qdx-subhead');sh.append(el('h3','','Dori qidirish'),el('span','qdx-label','2 HARFDAN BOSHLAB'));root.append(sh);
 search.classList.add('qdx-search');search.querySelector('label').textContent='Dori nomi yoki XNN';
 const input=$('drugSearch');input.placeholder='Masalan: lor, azi, mom…';root.append(search);
 root.prepend(sh,search);
 const official=el('details','qdx-official'),osummary=el('summary','','Rasmiy referent narxlar · Farmagentlik'),obox=el('div','qdx-official-content'),ostatus=el('p','qdx-note','Dori nomini qidiruvga yozing, keyin rasmiy narxni tekshiring.'),olist=el('div','qdx-official-results');
 const officialButton=btn('Rasmiy narxni tekshirish',checkOfficial,'qdx-subtle');
 const officialNote=el('p','qdx-note','Bu dorixona sotuv narxi emas: O‘zbekistonning rasmiy referent (chegaraviy) narxlari. Shakl va qadoq mosligini tekshiring.');
 const links=el('div','qdx-official-links');
 for(const [text,url]of [['Farmagentlik rasmiy reyestri','https://uzpharmagency.uz/uz/reference-prices'],['RefControl (mustaqil taqqoslash)','https://refcontrol.uz/uz/']]){
  const a=el('a','',text);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);
 }
 obox.append(officialNote,officialButton,ostatus,olist,links);
 official.append(osummary,obox);root.append(official);
 let officialSeq=0;
 async function checkOfficial(){
  const q=W.UZMEDDrugCatalog?.term?.(input.value)||'';
  if(q.length<2){ostatus.textContent='Dori nomini kamida 2 ta harf bilan kiriting. Bemor haqida ma’lumot yuborilmaydi.';return;}
  const seq=++officialSeq;
  olist.replaceChildren();
  officialButton.disabled=true;
  ostatus.textContent='Rasmiy Farmagentlik narxlari tekshirilmoqda…';
  try{
   const response=await fetch('/api/official-reference/search?q='+encodeURIComponent(q),{credentials:'omit',cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(18000)});
   const body=await response.json().catch(()=>({}));
   if(seq!==officialSeq)return;
   if(!response.ok||body.ok!==true)throw Error('Rasmiy reyestr hozir javob bermadi. Narx sifatida eski dorixona ma’lumoti ko‘rsatilmaydi.');
   const rows=Array.isArray(body.results)?body.results:[];
   const date=body.fetched_at?new Date(body.fetched_at):null;
   const stamp=date&&Number.isFinite(date.getTime())?date.toLocaleString('uz-UZ'):'noma’lum';
   ostatus.textContent=q+' · '+rows.length+' ta reyestr yozuvi · Tekshirilgan: '+stamp+(body.stale?' · ESKI KESH, rasmiy manba hozir ishlamadi':'')+(body.partial?' · Natija qisman':'')+(body.total_upstream>rows.length?' · Aniqroq nom bilan qidiring':'');
   if(!rows.length){olist.append(el('p','qdx-note','Rasmiy narx topilmadi. Nomni kirillcha shaklda ham qidirib ko‘ring.'));return;}
   const money=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?new Intl.NumberFormat('uz-UZ',{maximumFractionDigits:2}).format(value)+' so‘m':'Ko‘rsatilmagan';
   for(const row of rows.slice(0,8)){
    const card=el('article','qdx-official-row'),top=el('strong','',row.name||row.trademark||'Dori');
    const info=el('small','',[(row.inn||''),(row.manufacturer||''),(row.reestr_updated?'Reyestr: '+row.reestr_updated:'')].filter(Boolean).join(' · '));
    const prices=el('p','qdx-official-price','Chegaraviy chakana: '+money(row.retail_price_uzs)+' · Ulgurji: '+money(row.wholesale_price_uzs));
    card.append(top,info,prices);olist.append(card);
   }
   if(rows.length>8)olist.append(el('p','qdx-note','Birinchi 8 ta ko‘rsatildi. To‘liq ro‘yxat uchun dori nomini aniqlashtiring.'));
  }catch(e){if(seq!==officialSeq)return;ostatus.textContent=String(e.message||'Rasmiy reyestrga ulanishda xato.');}
  finally{if(seq===officialSeq)officialButton.disabled=false;}
 }
 input.addEventListener('input',()=>{officialSeq++;officialButton.disabled=false;olist.replaceChildren();ostatus.textContent='Rasmiy narx qidirish uchun tugmani bosing.';});
 right.insertBefore(root,plan);
 const source=stage.querySelector('.uv3-source-box');if(source&&!source.querySelector('.search-field'))source.hidden=true;
 const addArea=right.querySelector(':scope > .uv3-add-area');if(addArea)addArea.hidden=true;
 const hint=right.querySelector(':scope > .uv3-muted');if(hint)hint.hidden=true;
 function lookup(text){input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});search.scrollIntoView({block:'nearest'});}
 const getDiagnosis=()=>{const b=W.UZMEDVisitBridge?.read();return String($('field-diagnosis')?.value||b?.visit?.investigations?.qabul_workspace?.fields?.diagnosis||b?.visit?.investigations?.draft_diagnosis||b?.visit?.diagnosis||'').trim();};
 const short=raw=>raw.split(/\s*[—–]\s*\[|\[\s*gumon|differensial\s+tashxis\s*:/iu)[0].split('\n')[0].replace(/[;:.,-]+$/u,'').trim().slice(0,160);
 let previous='';
 function updateDiagnosis(){
  const raw=getDiagnosis();if(raw===previous)return;previous=raw;
  const name=short(raw),code=normalize($('field-icd')?.value||''),key=normalize(name);
  dxName.textContent=name||'Asosiy tashxis kiritilmagan';
  dxInfo.textContent=/\[[^\]]+\]|differensial\s+tashxis\s*:/iu.test(raw)?'Shablon matni tugallanmagan; shifokor tashxisni aniqlashtiradi.':'Tashxis bo‘limidagi asosiy tashxisdan olindi.';
  list.replaceChildren();
  if(!name){recMsg.textContent='Tashxisni kiriting. Dori qidiruvi hozir ham ishlaydi.';return;}
  const rule=paths.find(([_,pat])=>pat.test(key));
  if(!rule||(rule[0]==='Allergik rinit'&&/noallergik|non.allergik/i.test(key))){recMsg.textContent='Maxsus ro‘yxat yo‘q. Quyidagi barcha dori manbalaridan qidiring yoki shablonni tanlang.';return;}
  recMsg.textContent=rule[0]+' · '+rule[2].length+' ta davolash yo‘nalishi. Har bir preparat alohida tekshiriladi.';
  for(const [group,query,note] of rule[2]){const item=btn('',()=>lookup(query),'qdx-rec qdx-rec-pick'),body=el('div');item.setAttribute('aria-label',group+' · '+query+' dori qidirish');body.append(el('strong','',group),el('small','',query+' · '+note));item.append(body);list.append(item);}
  if(rule[0]==='Allergik rinit'){const a=el('a','qdx-ref','ARIA–EAACI 2024–2025 klinik tavsiyasi');a.href='https://pmc.ncbi.nlm.nih.gov/articles/PMC13040648/';a.target='_blank';a.rel='noopener noreferrer';list.append(a);}
 }
 function fill(field,value){if(!field||W.UZMEDVisitBridge?.read().readOnly)return;field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));}
 function chips(field,items){if(!field)return;const c=el('div','qdx-chips');for(const [label,value] of items)c.append(btn(label,()=>fill(field,value),'qdx-chip'));field.closest('.field')?.append(c);}
 function decorate(row){
  if(!row||row.dataset.qdxReady)return;row.dataset.qdxReady='1';row.classList.add('qdx-editor');
  const head=row.querySelector('.rx-header'),name=row.querySelector('[name=name]');if(!head||!name)return;
  const title=head.querySelector('span');const show=()=>title.textContent=name.value.trim()||'Yangi dori';name.addEventListener('input',show);show();
  chips(row.querySelector('[name=frequency]'),[['Ertalab','ertalab'],['Tushlikda','tushlikda'],['Kechqurun','kechqurun'],['Uyqu oldidan','uyqu oldidan']]);
  chips(row.querySelector('[name=route]'),[['Og‘iz orqali','peroral'],['Burun orqali','intranazal'],['Tashqi','mahalliy'],['Ingalatsiya','ingalyatsion']]);
  chips(row.querySelector('[name=food]'),[['Ovqatdan oldin','ovqatdan oldin'],['Ovqatdan keyin','ovqatdan keyin'],['Farqi yo‘q','ovqatga bog‘liq emas']]);
 }
 const updateRows=()=>{count.textContent=rx.children.length+' ta dori';for(const r of rx.children)decorate(r);};
 new MutationObserver(updateRows).observe(rx,{childList:true});updateRows();
 D.addEventListener('input',e=>{if(['field-diagnosis','field-icd'].includes(e.target?.id))updateDiagnosis();});
 for(const ev of ['qabul:restored','qabul:session-ready'])W.addEventListener(ev,()=>{previous='';updateDiagnosis();updateRows();});
 D.addEventListener('click',e=>{if(e.target.closest('[data-focus-tab=treatment]')){previous='';updateDiagnosis();}});
 updateDiagnosis();
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
