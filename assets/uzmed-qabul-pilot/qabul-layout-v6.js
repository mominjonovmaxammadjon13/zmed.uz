/* UZMED Qabul layout v6: original patient/clinical services preserved, no server or data writes. */
(function(W,D){
'use strict';
const ROOT='/assets/uzmed-qabul-pilot/';
const $=id=>D.getElementById(id);
function el(tag,cls,text){const n=D.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
function action(label,fn,cls){const b=el('button',cls,label);b.type='button';b.addEventListener('click',fn);return b;}
function mount(){
 const focus=W.QabulFocus,panel=$('panel-treatment'),rail=$('qfNav'),main=D.querySelector('.qf-main');
 if(!focus||!panel||!rail||!main||$('uzmedQabulV3'))return;
 const originals=Array.from(panel.children),search=panel.querySelector('.search-field'),rx=$('rxRows'),add=$('addRx');
 if(!search||!rx||!add)return;
 const stage=el('div','uv3');stage.id='uzmedQabulV3';stage.dataset.mobilePane='templates';stage.dataset.layout='v6';
 const mobileTop=el('div','uv3-mobile-top');
 const bread=el('div','uv3-breadcrumb','Davolash / Dori guruhlari'),mobileNav=el('div','uv3-mobile-nav');
 const topLine=el('div','uv3-title-line');
 topLine.append(bread);
 mobileTop.append(topLine,mobileNav);
 const left=el('section','uv3-panel uv3-left'),middle=el('section','uv3-panel uv3-middle'),right=el('section','uv3-panel uv3-right');
 left.setAttribute('aria-label','Davolash vositalari');middle.setAttribute('aria-label','Dori guruhlari va preparatlar');right.setAttribute('aria-label','Davolash rejasi');
 const lhead=el('div','uv3-panel-heading');lhead.append(el('h2','','Davolash vositalari'));
 const modes=el('div','uv3-modes'),category=el('select','qc-catalog-select uv3-filters');const groupList=el('div','uv3-list');groupList.id='uv3LeftResults';
 category.setAttribute('aria-label','Dori guruhlari toifasi');
 const lookup=el('label','uv3-field'),groupInput=el('input');lookup.textContent='Qidirish';groupInput.type='search';groupInput.maxLength=90;groupInput.placeholder='Shablon yoki dori guruhi…';lookup.append(groupInput);
 const modeHelp=el('p','uv3-muted');
 left.append(lhead,modes,category,lookup,modeHelp,groupList);
 const mhead=el('div','uv3-panel-heading'),mtitle=el('h2','','Dori guruhlari'),msub=el('p','uv3-muted','Mavjud UZMED klinik reyestridan');
 const middleTools=el('div','uv3-heading-tools');
 const back=action('← Orqaga',()=>{if(state.section==='template-detail'){renderTemplates();showPane('templates');}else if(state.section==='detail')renderDrugs();else{selectMode('groups');showPane('groups');}},'uv3-subtle');back.hidden=true;
 middleTools.append(back);mhead.append(mtitle,middleTools);
 const middleBody=el('div','uv3-middle-body'),sourceBox=el('details','uv3-source-box'),sourceSummary=el('summary','','Barcha dori manbalaridan qidirish');
 sourceBox.append(sourceSummary,search);
 middle.append(mhead,msub,middleBody,sourceBox);
 const rhead=el('div','uv3-panel-heading'),rtitle=el('h2','','Davolash rejasi'),badge=el('span','uv3-count','0 ta preparat');
 const rbuttons=el('div','uv3-quick');
 const doc=()=>{if(typeof W.QabulDocument?.open==='function')W.QabulDocument.open();else say('Hujjat muharriri yuklanmadi.');};
 rbuttons.append(action('Hujjat / Chop etish',doc,'uv3-subtle'));
 rhead.append(rtitle,badge);
 const planMsg=el('p','uv3-muted','Preparat tanlang, so‘ng doza, qabul yo‘li va davomiylikni tekshirib kiriting.');
 const planList=el('div','uv3-plan-rows');
 const addBar=el('div','uv3-add-area');
 const find=action('＋ Dori qidirish',()=>{
   showPane('plan');$('drugSearch').focus();
 },'uv3-primary');
 add.textContent='Bo‘sh qator';
 addBar.append(find,add);
 const existing=el('div','uv3-existing'),extra=el('details','uv3-native-extra');
 extra.append(el('summary','','Qo‘shimcha davolash va hisoblash'));
 const safety=el('div','uv3-safety');
 right.append(rhead,planMsg,planList,addBar,rbuttons,safety);
 stage.append(mobileTop,left,middle,right);
 // Move native DOM elements (not copies): all save, clinical validation and Rx listeners stay attached.
 const drawers=originals.filter(n=>n.matches?.('details.vf-drawer'));
 for(const item of originals){
   if(item===search||item===rx||item===add)continue;
   if(drawers.includes(item))safety.append(item);
   else extra.append(item);
 }
 planList.append(rx);existing.append(extra);right.append(existing);
 panel.append(stage);
 const state={mode:'templates',section:'templates',groups:[],group:null,drug:null,version:'',seq:0,visibleCount:25,mobile:'templates',category:'all',selectedTemplate:null};
 const status=el('p','uv3-status');status.setAttribute('role','status');middleBody.after(status);
 function say(t,error=false){status.textContent=t||'';status.classList.toggle('is-error',!!error);}
 function setTitle(t,hint){mtitle.textContent=t;msub.textContent=hint||'';}
 function showPane(p){
   const changed=state.mobile!==p;
   state.mobile=p;stage.dataset.mobilePane=p;
   const labels={groups:'Dori guruhlari',templates:'Shablonlar',guides:'Klinik tavsiyalar',drugs:'Preparatlar',detail:'Preparat ma’lumoti',plan:'Davolash rejasi'};
   bread.textContent='Davolash / '+(labels[p]||'');
   [...mobileNav.children].forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.pane===p)));
   const scroller=main;
   if(changed&&W.matchMedia('(max-width:760px)').matches)scroller.scrollTo?.({top:0,behavior:'instant'});
 }
 function navButton(text,p,fn){const b=action(text,()=>{if(typeof fn==='function')fn();else showPane(p);},'uv3-mobile-button');b.dataset.pane=p;mobileNav.append(b);return b;}
 navButton('Retsept','plan');
 navButton('Shablonlar','templates',()=>selectMode('templates'));
 navButton('Guruhlar','groups',()=>selectMode('groups'));
 const modesConfig=[['templates','Shablonlar'],['groups','Dori guruhlari'],['guides','Klinik tavsiyalar']];
 const modeButtons=new Map();
 const filters=[
  ['all','Barchasi',null],
  ['allergy','Allergologiya',/antigist|allerg|kortik|glyukokort|mast|leykot|adrenoret|bronx|immuno|omaliz|salmeterol|salbut|histamin|biolog/i],
  ['pulmo','Pulmonologiya',/bronx|inhal|beta.?2|beta.?adreno|antixolin|leykot|glyukokort|kortikost|mukolit|igks|saba/i],
  ['derma','Dermatologiya',/topik|mahalliy|maz|krem|teri|dermat|retinoid|antisept|antigist/i]
 ];
 for(const [key,label] of filters){
   const option=el('option','',label);option.value=key;category.append(option);
 }
 category.onchange=()=>{state.category=category.value;state.visibleCount=25;renderGroups();};
 for(const [key,text]of modesConfig){
   const b=action(text,()=>selectMode(key),'uv3-mode');b.dataset.mode=key;modes.append(b);modeButtons.set(key,b);
 }
 function selectMode(mode){
   state.mode=mode;groupInput.value='';state.visibleCount=25;category.hidden=mode!=='groups';
   modeButtons.forEach((b,key)=>b.setAttribute('aria-pressed',String(key===mode)));
   if(mode==='groups'){modeHelp.textContent='Manba: UZMED dori guruhlari • klinik reyestr';renderGroups();renderDrugs();}
   if(mode==='templates'){modeHelp.textContent='Haqiqiy UZMED qabul shablonlari';renderTemplates();}
   if(mode==='guides'){modeHelp.textContent='Klinik manba va tekshiruvlar';renderGuides();}
   showPane(mode==='guides'?'guides':mode==='templates'?'templates':'groups');
 }
 function templOpen(templateId){if(W.UzmedAllergyTemplateUI?.open)W.UzmedAllergyTemplateUI.open('all',templateId);else $('templatesOpen')?.click();}
 function showTemplate(template){
   if(!template||typeof template!=='object')return;
   state.selectedTemplate=template;state.section='template-detail';
   setTitle(template.title,'UZMED klinik shabloni · '+(template.category||'Allergologiya'));
   middleBody.replaceChildren();
   const hero=el('div','uv3-template-hero');
   hero.append(el('span','uv3-template-category',template.category||'Allergologiya'));
   hero.append(el('h3','',template.title));
   if(template.note)hero.append(el('p','uv3-muted',template.note));
   middleBody.append(hero);
   const values=template.values||{};
   const sections=[
     ['field-treatment','Davolash yo‘nalishi'],
     ['field-diagnosis','Tashxis va differensial baholash'],
     ['field-tests','Tekshiruvlar'],
     ['field-advice','Tavsiyalar'],
     ['field-followup','Kuzatuv']
   ];
   let any=false;
   for(const [key,label] of sections){
     const v=String(values[key]||'').trim();
     if(!v)continue;any=true;
     const sec=el('section','uv3-template-fact');
     sec.append(el('h4','',label),el('p','',v));
     middleBody.append(sec);
   }
   if(!any)middleBody.append(el('p','uv3-muted','Shablonning klinik matni mavjud muharrir orqali ochiladi.'));
   const menu=el('div','uv3-template-actions');
   menu.append(action('Ko‘rib chiqish va qo‘llash',()=>templOpen(template.id),'uv3-primary'));
   middleBody.append(menu);
   middleBody.append(el('p','uv3-muted','Bu klinik shablon matni. Bemorning yoshi, allergiyasi, qarshi ko‘rsatmalari va protokollarni tekshirmasdan retseptga ko‘chirilmaydi.'));
   back.textContent='← Shablonlar';back.hidden=false;
   showPane('detail');
 }
 function renderTemplates(){
   groupList.replaceChildren();
   const templates=Array.isArray(W.UzmedAllergyTemplates?.templates)?W.UzmedAllergyTemplates.templates:[];
   const q=groupInput.value.trim().toLocaleLowerCase('uz');
   const filtered=templates.filter(t=>(t.title+' '+t.category).toLocaleLowerCase('uz').includes(q));
   const heading=el('div','uv3-category-heading');
   heading.append(el('strong','','Allergologiya'),el('span','',filtered.length+' ta'));
   groupList.append(heading);
   let selected=state.selectedTemplate;
   const order=['Nafas yo‘llari','Burun va ko‘z','Dermatit va teri','Urtikariya','Angioedema','Dori reaksiyalari'];
   const priority=c=>{const i=order.indexOf(c);return i<0?99:i;};
   const sorted=[...filtered].sort((a,b)=>priority(a.category)-priority(b.category)||a.category.localeCompare(b.category,'uz')||a.title.localeCompare(b.title,'uz'));
   let last='';
   for(const t of sorted.slice(0,state.visibleCount)){
     if(last!==t.category){
       const h=el('div','uv3-category-subheading',t.category||'Boshqa');groupList.append(h);
       last=t.category;
     }
     const b=action('',()=>{showTemplate(t);renderTemplateSelection();},'uv3-list-row uv3-template-row');
     b.append(el('span','',t.title),el('small','',t.category||''));
     b.dataset.templateId=t.id||'';
     groupList.append(b);
   }
   if(sorted.length>state.visibleCount)groupList.append(action('Yana '+Math.min(25,sorted.length-state.visibleCount)+' ta ko‘rsatish',()=>{state.visibleCount+=25;renderTemplates();},'uv3-wide'));
   if(!sorted.length)groupList.append(el('p','uv3-muted','Mos shablon topilmadi. Mavjud shaxsiy shablonlarni ham tekshiring.'));
   modeHelp.textContent=templates.length+' ta tayyor shablon. Shaxsiy shablonlar yuqoridagi papka orqali ochiladi. Tayyor shablon tashxisni tasdiqlamaydi.';
   if(!selected){
     const diagnosed=String($('field-diagnosis')?.value||'').toLocaleLowerCase('uz');
     selected=templates.find(t=>diagnosed&&t.title.toLocaleLowerCase('uz').includes(diagnosed.slice(0,22)))||
       templates.find(t=>/allergik bronxial astma/i.test(t.title))||templates[0];
   }
   if(selected){if(!W.matchMedia('(max-width:760px)').matches)showTemplate(selected);}
   else{
     state.section='templates';back.hidden=true;setTitle('Klinik shablonlar','Mavjud shablonni tanlang');
     middleBody.replaceChildren(el('p','uv3-muted','Klinik shablonlar hozircha mavjud emas.'));
   }
   function renderTemplateSelection(){
     [...groupList.querySelectorAll('[data-template-id]')].forEach(b=>b.setAttribute('aria-current',String(b.dataset.templateId===state.selectedTemplate?.id)));
   }
   renderTemplateSelection();
   showPane('templates');
 }
 function renderGuides(){
   groupList.replaceChildren();
   const items=[
    ['Dori mosligi va DDI',()=>showSafety('Dori mosligi')],
    ['Buyrak faoliyati',()=>showSafety('Monelik')],
    ['MKB-10 tashxisini ko‘rish',()=>focus.show('diagnosis',true)],
    ['Klinik shablonlar',templOpen]];
   for(const [name,fn]of items)groupList.append(action(name,fn,'uv3-list-row'));
   middleBody.replaceChildren(el('p','uv3-muted','Mazkur amallar haqiqiy UZMED modullarini ochadi. Klinik ko‘rsatmalar va individual dozalar avtomatik tayinlanmaydi.'));
   setTitle('Klinik tekshiruv','Amaldagi dori mosligi, eGFR va shablonlar');back.hidden=true;state.section='guides';
 }
 function showSafety(t){
   const d=[...safety.querySelectorAll('details.vf-drawer')].find(x=>x.querySelector('summary')?.textContent.includes(t));
   showPane('plan');
   if(!d)return say('Bu tekshiruv moduli mavjud emas.',true);
   d.open=true;
   if(t==='Dori mosligi')W.UzmedVideoFeatures?.checkDrugs?.();
   d.scrollIntoView({block:'nearest'});
 }
 function renderGroups(){
   if(state.mode!=='groups')return;
   groupList.replaceChildren();
   const q=groupInput.value.trim().toLocaleLowerCase('uz');
   const activeFilter=filters.find(([key])=>key===state.category)?.[2];
   const found=state.groups.filter(g=>{
     const content=g.name+' '+g.items.map(i=>i.name).join(' ');
     return (!activeFilter||activeFilter.test(content))&&content.toLocaleLowerCase('uz').includes(q);
   });
   for(const g of found.slice(0,state.visibleCount)){
     const b=action(g.name,()=>openGroup(g),'uv3-list-row');
     b.append(el('small','',g.items.length+' ta klinik reyestr yozuvi'));
     if(state.group?.name===g.name)b.setAttribute('aria-current','true');
     groupList.append(b);
   }
   if(found.length>state.visibleCount)groupList.append(action('Yana guruhlarni ko‘rsatish',()=>{state.visibleCount+=30;renderGroups();},'uv3-wide'));
   modeHelp.textContent=state.groups.length?found.length+' ta guruh • UZMED klinik reyestri':'Guruhlar yuklanmoqda…';
   if(!found.length&&state.groups.length)groupList.append(el('p','uv3-muted','Bu nomdagi guruh topilmadi. Umumiy dori qidiruvini ishlating.'));
 }
 function openGroup(group){
   state.group=group;state.section='drugs';state.seq++;state.drug=null;
   renderGroups();renderDrugs();
   showPane('drugs');
 }
 function renderDrugs(){
   if(!state.group){
     setTitle('Davolashni shakllantirish','Klinik manbalar asosida tayinlovni to‘ldirish');
     back.hidden=true;state.section='groups';middleBody.replaceChildren();
     const intro=el('div','uv3-welcome');
     intro.append(el('span','uv3-eyebrow','UZMED • KLINIK QABUL'),el('h3','','Avval dori guruhini yoki shablonni tanlang.'));
     const diagnosis=$('field-diagnosis')?.value?.trim();
     intro.append(el('p','uv3-muted',diagnosis?'Joriy tashxis: '+diagnosis:'Tashxis hozircha tanlanmagan. Davolashni shifokor belgilaydi.'));
     const steps=el('div','uv3-welcome-steps');
     for(const step of ['1. Guruh yoki shablon','2. Preparat manbasi','3. Doza va DDI tekshiruvi','4. Qabul hujjati'])
       steps.append(el('span','',step));
     intro.append(steps);
     const links=el('div','uv3-welcome-actions');
     links.append(action('Dori guruhini qidirish',()=>{selectMode('groups');groupInput.focus();},'uv3-primary'));
     links.append(action('Shablonlar',()=>selectMode('templates'),'uv3-subtle'));
     intro.append(links,el('p','uv3-muted','Katalog va yo‘riqnomalar klinik tekshiruv uchun. Tayinlov faqat shifokor tasdig‘i bilan shakllantiriladi.'));
     middleBody.append(intro);
     return;
   }
   state.section='drugs';back.hidden=false;back.textContent='← Barcha guruhlar';
   setTitle(state.group.name,'Klinik reyestr • '+state.group.items.length+' ta yozuv');
   middleBody.replaceChildren();
   for(const drug of state.group.items){
     const b=action('',()=>drugDetail(drug),'uv3-drug');
     b.append(el('span','uv3-drug-name',drug.name),el('small','',drug.inn||'INN ko‘rsatilmagan'),el('span','uv3-drug-arrow','›'));
     middleBody.append(b);
   }
   if(!state.group.items.length)middleBody.append(el('p','uv3-muted','Ushbu guruhda preparat topilmadi.'));
   showPane('drugs');
 }
 const detailFields=[['description','Dori guruhi / ta’siri'],['indications','Ko‘rsatmalar'],['dosage_instructions','Dozalash haqida manba'],['contraindications','Qarshi ko‘rsatmalar'],['interactions','Dori o‘zaro ta’siri'],['adverse_effects','Nojo‘ya ta’sirlari'],['special_instructions','Maxsus ko‘rsatmalar']];
 async function drugDetail(drug){
   const order=++state.seq;state.section='detail';setTitle(drug.name,'Dori ma’lumotlari • manba tekshiruvi');
   back.hidden=false;back.textContent='← Preparatlar';
   middleBody.replaceChildren(el('p','uv3-muted','Preparat ma’lumotlari API orqali tekshirilmoqda…'));
   showPane('detail');
   try{
     const response=await fetch('/api/drugs/catalog?key='+encodeURIComponent(drug.key)+'&version='+encodeURIComponent(state.version),{credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}});
     if(!response.ok)throw Error('Manba javob bermadi: HTTP '+response.status);
     const record=await response.json();
     if(order!==state.seq||state.section!=='detail')return;
     if(record.key!==drug.key||record.sourceVersion!==state.version)throw Error('Baza o‘zgargan. Ro‘yxatni yangilang.');
     middleBody.replaceChildren();
     const hero=el('div','uv3-product-head');hero.append(el('h3','',record.name||drug.name),el('span','uv3-pill',record.source||'UZMED'));
     middleBody.append(hero,el('p','uv3-muted','INN: '+(record.inn||'ko‘rsatilmagan')));
     const data=record.uzbek||{};
     for(const [field,label]of detailFields){
       const section=el('section','uv3-fact');
       section.append(el('h4','',label),el('p','',String(data[field]||'Manbada ko‘rsatilmagan.')));middleBody.append(section);
     }
     middleBody.append(el('p','uv3-warning','Doza, shakl, yosh, allergiya, buyrak holati va DDI tekshirilmasdan qo‘llash mumkin emas.'));
     const addButton=action('+ Davolash rejasiga qo‘shish',()=>addToPlan(record),'uv3-primary uv3-wide');
     addButton.disabled=!!record.clinicalBlock;
     if(record.clinicalBlock)middleBody.append(el('p','uv3-warning','Ushbu yozuvda tarkib ziddiyati aniqlangan; tayinlov bloklangan.'));
     middleBody.append(addButton);
   }catch(e){if(order===state.seq)middleBody.replaceChildren(el('p','uv3-error','Ma’lumotni ochib bo‘lmadi: '+e.message));}
 }
 function addToPlan(record){
   if(record.clinicalBlock||add.disabled)return say('Preparat tayinlovga qo‘shilmadi.',true);
   const before=rx.children.length;add.click();if(rx.children.length!==before+1)return say('Yangi dori qatori ochilmadi.',true);
   const row=rx.lastElementChild,ni=row.querySelector('[name=name]'),inn=row.querySelector('[name=inn]');
   if(!ni||!inn)return say('Tayinlov muharriri tayyor emas.',true);
   ni.value=record.name||'';inn.value=record.inn||'';
   ni.dispatchEvent(new Event('input',{bubbles:true}));inn.dispatchEvent(new Event('input',{bubbles:true}));
   W.UzmedQabul?.bindSource?.(row,{sourceKey:record.key,source:record.source,sourceVersion:record.sourceVersion});
   W.UzmedQabul?.render?.();
   say('Preparat qoralamaga qo‘shildi. Doza, yo‘l va davomiylikni shifokor to‘ldirishi kerak.');
   countRx();showPane('plan');
 }
 function countRx(){
   const n=rx.children.length;badge.textContent=n+' ta tayinlov';
   planMsg.textContent=n?'Har bir qatorning dozasi, qabul yo‘li va davomiyligini tekshiring.':'Preparat tanlang yoki qo‘lda tayinlov qo‘shing.';
 }
 new MutationObserver(countRx).observe(rx,{childList:true});countRx();
 groupInput.addEventListener('input',()=>{state.visibleCount=25;if(state.mode==='groups')renderGroups();else if(state.mode==='templates')renderTemplates();});
 W.addEventListener('uzmed:auth-change',()=>{state.seq++;});
 const navObs=new MutationObserver(()=>{
   const active=rail.querySelector('[data-focus-tab="treatment"].active');
   D.body.classList.toggle('uv3-treatment-active',!!active);
 });
 navObs.observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});
 D.body.classList.toggle('uv3-treatment-active',!!rail.querySelector('[data-focus-tab="treatment"].active'));
 selectMode('templates');
 showPane('plan');
 fetch(ROOT+'v2-drug-groups.json',{cache:'no-store',credentials:'omit'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(v=>{
   if(!Array.isArray(v.groups)||!v.version)throw Error('Noto‘g‘ri ma’lumot formati');
   state.groups=v.groups;state.version=v.version;renderGroups();
 }).catch(e=>say('Klinik guruhlar yuklanmadi: '+e.message,true));
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
