/* Shifokor qabuli entry and private patient registry. */
(function(W,D){
 'use strict';
 if(new URLSearchParams(W.location.search).get('section')!=='qabul'&&!W.UZMED_QABUL_INLINE)return;
 let root=null,registry=null,owner='',revision=0,opening=0,timer=null,loading=false,clinical=false;
 const h=(tag,cls,text)=>{const el=D.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el;};
 const button=(text,fn,cls)=>{const b=h('button','qstart-btn '+(cls||''),text);b.type='button';b.onclick=fn;return b;};
 const actor=()=>{try{const a=W.UZMEDAuth?.getState?.();return a?.loggedIn?String(a.user?.id||''):'';}catch{return '';}};
 function status(text,error=false,screen=registry?.classList.contains('active')?registry:root){const node=screen?.querySelector('.qstart-message');if(node){node.textContent=text||'';node.setAttribute('role',error?'alert':'status');node.classList.toggle('qstart-error',error);}}
 async function api(path,method='GET',data){
  const initial=actor();if(!initial||initial!==owner)throw Error('Akkaunt sessiyasini tekshiring.');
  const token=await W.UZMEDAuth.getAccessToken();
  if(!token||actor()!==initial)throw Error('Akkaunt o‘zgardi yoki sessiya tugadi.');
  const response=await fetch('/api/patients'+path,{method,headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,credentials:'omit',cache:'no-store'});
  let payload={};try{payload=await response.json();}catch{}
  if(actor()!==initial)throw Error('Akkaunt almashdi.');
  if(!response.ok)throw Error(payload?.error?.message||payload.message||('So‘rov xatosi: '+response.status));
  return payload;
 }
 let passportLoading=null;
 function passportModule(){
  if(W.QabulPassport)return Promise.resolve(W.QabulPassport);
  if(!passportLoading)passportLoading=new Promise((resolve,reject)=>{
   const script=h('script');script.src='/assets/uzmed-qabul-passport-v1.js?v=20261106-treatment1';
   script.onload=()=>W.QabulPassport?resolve(W.QabulPassport):reject(Error('Pasport moduli ochilmadi.'));
   script.onerror=()=>{passportLoading=null;script.remove();reject(Error('Pasport shaklini yuklab bo‘lmadi. Qayta oching.'));};D.head.append(script);
  });return passportLoading;
 }
 function mount(){
  if(root?.isConnected)return root;
  const host=D.querySelector('.screens');if(!host)return null;
  root=h('section','screen qstart-screen');root.id='uzQabulEntry';
  const header=h('header','qstart-head'),top=h('div','qstart-headline');
  top.append(h('span','qstart-kicker','UZMED · KLINIK ISH MAYDONI'),h('h1','', 'Shifokor qabuli'),h('p','', 'Bemorni tanlang yoki yangi karta oching.'));
  const back=h('a','qstart-back','←');back.href='/';back.setAttribute('aria-label','UZMED bosh sahifasi');back.title='UZMED bosh sahifasi';
  header.append(top,back);
  const actions=h('div','qstart-actions');
  const create=button('Yangi bemor',()=>choose('new'));
  const mine=button('Mening bemorlarim',()=>choose('mine'));
  for(const [b,key]of [[create,'new'],[mine,'mine']]){b.dataset.action=key;b.setAttribute('aria-pressed','false');}
  actions.append(create,mine);
  const feedback=h('p','qstart-message');feedback.id='qstartStatus';feedback.setAttribute('role','status');
  const workspace=h('div','qstart-content');workspace.id='qstartContent';
  root.append(header,actions,feedback,workspace);host.append(root);
  return root;
 }
 function registryScreen(){
  if(registry?.isConnected)return registry;
  registry=h('section','screen qstart-screen');registry.id='uzQabulRegistry';
  registry.dataset.qstartView='mine';registry.setAttribute('aria-labelledby','qregistryTitle');
  const head=h('header','qregistry-head');
  const back=button('←',()=>choose('home'),'qregistry-back');
  back.setAttribute('aria-label','Shifokor qabuliga qaytish');back.title='Shifokor qabuliga qaytish';
  const title=h('h1','','Mening bemorlarim');title.id='qregistryTitle';title.tabIndex=-1;
  head.append(back,title);
  const feedback=h('p','qstart-message');feedback.setAttribute('role','status');
  registry.append(head,feedback,h('div','qstart-content'));
  root.parentElement.append(registry);
  return registry;
 }
 function show(screen){
  if(screen.classList.contains('active'))return true;
  W.showScreen?.(screen.id);
  if(!screen.classList.contains('active'))return false;
  scrollTop(screen);
  return true;
 }
 function scrollTop(screen){
  screen.scrollTop=0;screen.parentElement.scrollTop=0;W.scrollTo?.(0,0);
 }
 function clear(){
  revision++;if(timer)clearTimeout(timer);timer=null;
  for(const screen of [root,registry]){
   screen?.querySelector('.qstart-content')?.replaceChildren();
   status('',false,screen);
  }
 }
 function choose(type){
  if(type==='search')type='mine';
  if(type!=='new'&&type!=='mine')type='home';
  if(!root?.isConnected)return;
  if(type!=='home'&&!clinical){status('Shifokor qabuli uchun vrach akkauntingizni ulash kerak.',true);return;}
  const screen=type==='mine'?registryScreen():root;
  if(!show(screen))return;
  if(type==='home'&&root.dataset.qstartView==='new')scrollTop(root);
  clear();root.dataset.qstartView=type==='mine'?'home':type;
  W.UZMEDQabulPremium?.syncChoice?.(type);
  root.querySelectorAll('[data-action]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.action===type));b.classList.toggle('qstart-primary',b.dataset.action===type);});
  const content=screen.querySelector('.qstart-content');
  if(type==='new'){
   const seq=revision;
   status('Bemor pasporti ochilmoqda…');
   Promise.all([passportModule(),api('/specialists')]).then(([passport,data])=>{
    if(seq!==revision||!content.isConnected)return;
    let created=null,retryVisit=null;
    const form=passport.render(D,{specialties:data.specialists||[],onBack:()=>choose('home'),onSave:async({patient,draft})=>{
     if(loading)throw Error('Oldingi saqlash tugashini kuting.');
     loading=true;
     try{
      // Keep the created ID after an editor/network failure. Retry must not create a duplicate patient.
      if(!created){const result=await api('','POST',patient);created=result.patient;}
      if(!created?.patient_id)throw Error('Bemor identifikatori qaytmadi.');
      if(seq!==revision)return;
      await api('/'+encodeURIComponent(created.patient_id),'PATCH',patient);
      const state=W.UZMEDAuth?.getState?.();
      const opened=await launch(created,{...draft,template:'initial',documentKind:'exam',doctor:String(state?.profile?.full_name||state?.user?.user_metadata?.full_name||'').slice(0,120)},retryVisit);
      if(opened!==true)throw Error('Pasport saqlandi. Qabulni qayta oching.');
     }catch(err){if(err.visitId)retryVisit={visit_id:err.visitId};if(!err.hasEditor&&seq===revision)W.showScreen?.('uzQabulEntry');throw err;}finally{loading=false;}
    }});
    content.append(form.form);status('');
   }).catch(err=>{if(seq===revision)status(err.message,true);});
   return;
  }
  if(type==='mine'){
   mountRegistry(content);
   screen.querySelector('h1').focus({preventScroll:true});
  }
 }
 function mountRegistry(content){
  const panel=h('div','qregistry');
  api('/telegram').then(data=>{if(!data.allowed||!content.isConnected)return;const open=button('Telegram bemorlarim',()=>mountTelegram(content),'qstart-primary');panel.prepend(open);}).catch(()=>{});
  const filters=h('div','qregistry-filters');filters.id='qregistryFilters';filters.hidden=true;
  const columns=h('div','qregistry-columns');columns.id='qregistryColumns';columns.hidden=true;
  const search=h('form','qregistry-search');
  const input=h('input');input.type='search';input.maxLength=200;input.autocomplete='off';
  input.placeholder='F.I.Sh., ID yoki tashxis';input.setAttribute('aria-label','Bemor F.I.Sh., ID yoki tashxis');
  const paths={
   search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
   filter:'<path d="M3 5h18l-7 8v5l-4 2v-7z"/>',
   patients:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20v-2a7 7 0 0 1 14 0v2M17 5a3.5 3.5 0 0 1 0 7m1 3a5 5 0 0 1 4 5"/>',
   journal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
   columns:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 4v16"/>'
  };
  function icon(key){
   const node=h('span','qregistry-icon');node.setAttribute('aria-hidden','true');
   node.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">'+paths[key]+'</svg>';
   return node;
  }
  function iconButton(label,key,action){
   const b=button(label,action);b.prepend(icon(key));return b;
  }
  function disclosure(label,key,target){
   const b=iconButton(label,key,()=>{target.hidden=!target.hidden;b.setAttribute('aria-expanded',String(!target.hidden));});
   b.setAttribute('aria-controls',target.id);b.setAttribute('aria-expanded','false');
   return b;
  }
  const filterButton=disclosure('Filtrlar','filter',filters);
  const searchBox=h('div','qregistry-searchbox');searchBox.append(icon('search'),input);
  search.append(searchBox,filterButton);
  const modes=h('div','qregistry-modes');modes.setAttribute('role','group');modes.setAttribute('aria-label','Ro‘yxat turi');
  let view='cards',tab='all',offset=0,result=null;
  const modeButtons=[['cards','Kartoteka','patients'],['journal','Qabullar jurnali','journal']].map(([key,label,symbol])=>{
   const b=iconButton(label,symbol,()=>{if(view!==key){view=key;tab='all';refresh();}});
   modes.append(b);return [key,b];
  });
  const fields=new Map();
  function labelField(label,field){
   const wrapper=h('label','qregistry-field');wrapper.append(h('span','',label),field);return wrapper;
  }
  function select(choices){
   const field=h('select');
   for(const [value,label] of choices)field.add(new Option(label,value));
   return field;
  }
  function filterField(key,label,field){
   fields.set(key,field);filters.append(labelField(label,field));return field;
  }
  function menu(key,label,choices){return filterField(key,label,select([['','Barchasi'],...choices]));}
  function ageField(key,label){
   const n=h('input');n.type='number';n.min='0';n.max='180';n.step='1';n.placeholder=label;n.setAttribute('aria-label',label);
   fields.set(key,n);return n;
  }
  menu('sex','Jins',[['male','Erkak'],['female','Ayol']]);
  const ages=h('fieldset','qregistry-age'),ageInputs=h('div','qregistry-age-inputs'),ageChoices=h('div','qregistry-chips');
  const minAge=ageField('age_min','Yoshdan'),maxAge=ageField('age_max','Yoshgacha');
  ageInputs.append(minAge,maxAge);
  for(const [label,min,max] of [['Bolalar','','17'],['Kattalar','18',''],['60+','60','']]){
   ageChoices.append(button(label,()=>{minAge.value=min;maxAge.value=max;refresh();}));
  }
  ages.append(h('legend','','Yosh'),ageInputs,ageChoices);filters.append(ages);
  const specialist=menu('specialist_id','Mutaxassislik',[]);
  menu('status','Holat',[['draft','Qoralama'],['closed','Yopilgan qabul']]);
  const ranges=[['today','Bugun'],['week','So‘nggi 7 kun'],['month','So‘nggi 30 kun']];
  menu('created','Bemor yaratilgan',ranges);
  menu('updated','Oxirgi tahrir',ranges);
  const diagnosis=h('input');diagnosis.type='search';diagnosis.maxLength=200;diagnosis.placeholder='Tashxis yoki MKB kodi';
  filterField('diagnosis','Tashxis',diagnosis);
  menu('visits','Qabullar soni',[['none','Qabulsiz'],['one','1 ta'],['multiple','2 ta va ko‘p']]);
  const extras=h('div','qregistry-chips qregistry-extras');
  function checkbox(key,label){
   const n=h('input');n.type='checkbox';
   fields.set(key,n);extras.append(labelField(label,n));
  }
  checkbox('allergy','Allergiyasi bor');checkbox('phone','Telefoni bor');
  const filterActions=h('div','qregistry-filter-actions');
  filterActions.append(button('Hammasini tozalash',()=>{
   for(const field of fields.values()){if(field.type==='checkbox')field.checked=false;else field.value='';}
   refresh();
  }),button('Yopish',()=>{filterButton.click();filterButton.focus();}));
  const filterError=h('p','qstart-error');filterError.hidden=true;filterError.setAttribute('role','alert');
  filters.append(extras,filterError,filterActions);
  const quick=h('div','qregistry-quick');quick.setAttribute('role','group');quick.setAttribute('aria-label','Tezkor filtrlar');
  const quickButtons=[['all','Hammasi'],['draft','Qoralamalar'],['today','Bugun'],['followup','Nazorat']].map(([key,label])=>{
   const b=button(label,()=>{if(tab!==key){tab=key;refresh();}});
   quick.append(b);return [key,label,b];
  });
  const toolbar=h('div','qregistry-toolbar');
  const count=h('p','qregistry-count');count.setAttribute('role','status');
  const sort=select([
   ['last','Oxirgi qabul bo‘yicha'],['name','Ism bo‘yicha (A–Z)'],
   ['created','Yaratilgan sana bo‘yicha'],['updated','Tahrir sanasi bo‘yicha'],
   ['age_asc','Yosh: kichiklari birinchi'],['age_desc','Yosh: kattalari birinchi']
  ]);
  toolbar.append(count,disclosure('Ustunlar','columns',columns),labelField('Saralash',sort));
  const dateFormatter=new Intl.DateTimeFormat('uz-Latn-UZ',{timeZone:'Asia/Tashkent',dateStyle:'short',timeStyle:'short'});
  const date=value=>value&&Number.isFinite(Date.parse(value))?dateFormatter.format(new Date(value)):'—';
  const specialistNames=new Map();
  const optional=[
   ['id','ID',p=>p.short_code||'—',true],
   ['date','Qabul sanasi',p=>date(p.visit_at),true],
   ['specialty','Mutaxassislik',p=>specialistNames.get(p.specialist_id)||p.specialist_id||'—',false],
   ['diagnosis','Tashxis',p=>[p.icd10,p.diagnosis].filter(Boolean).join(' · ')||'—',false],
   ['age','Yosh',p=>p.intake_profile?.profile?.age_raw??p.age??'—',false],
   ['phone','Telefon',p=>p.phone||'—',false],
   ['telegram','Telegram',p=>p.intake_profile?.telegram?.username?'@'+p.intake_profile.telegram.username:(p.phone||'—'),false],
   ['weight','Vazn',p=>p.intake_profile?.profile?.weight_raw||'—',false],
   ['height','Bo‘y',p=>p.intake_profile?.profile?.height_raw||'—',false],
   ['visits','Qabullar',p=>p.visit_count,false]
  ];
  const visibleColumns=new Set(optional.filter(([, , ,shown])=>shown).map(([key])=>key));
  for(const [key,label] of optional){
   const n=h('input');n.type='checkbox';n.checked=visibleColumns.has(key);
   n.onchange=()=>{if(n.checked)visibleColumns.add(key);else visibleColumns.delete(key);if(result)renderRows();};
   columns.append(labelField(label,n));
  }
  const list=h('div','qregistry-results');list.id='qstartList';list.setAttribute('aria-busy','true');
  const pager=h('div','qregistry-pager');pager.hidden=true;
  panel.append(search,modes,filters,quick,toolbar,columns,list,pager);content.append(panel);
  function controls(counts){
   for(const [key,b] of modeButtons)b.setAttribute('aria-pressed',String(view===key));
   for(const [key,label,b] of quickButtons){
    b.setAttribute('aria-pressed',String(tab===key));
    b.replaceChildren(D.createTextNode(label),h('span','qregistry-badge',counts?.[key]??''));
   }
   const activeFilters=[...fields.values()].filter(n=>n.type==='checkbox'?n.checked:n.value.trim()).length;
   filterButton.replaceChildren(icon('filter'),D.createTextNode('Filtrlar'));
   if(activeFilters)filterButton.append(h('span','qregistry-badge',activeFilters));
  }
  function openRecord(p){
   if(!panel.isConnected||actor()!==owner||!clinical)return;
   if(view==='journal'){
    launch(p,null,{visit_id:p.visit_id}).then(opened=>{
     if(opened===true&&panel.isConnected)status('',false,registry);
    }).catch(err=>{if(panel.isConnected)status(err.message,true,registry);});
   }
   else W.UZMEDPatients?.openCard?.(p.patient_id);
  }
  function renderRows(){
   const {rows,counts,limit}=result;
   const total=counts[tab];controls(counts);count.textContent='Topildi: '+total+' / '+counts.all;
   list.replaceChildren();pager.replaceChildren();pager.hidden=true;
   if(!rows.length){
    const filtered=input.value.trim()||[...fields.values()].some(n=>n.type==='checkbox'?n.checked:n.value.trim())||tab!=='all';
    const message=filtered?'Tanlangan shartlar bo‘yicha natija topilmadi.':view==='journal'?'Qabullar jurnalida hozircha yozuv yo‘q.':'Kartoteka hozircha bo‘sh. Bemor qo‘shish uchun «Yangi bemor»ni bosing.';
    list.append(h('p','qstart-muted qregistry-empty',message));return;
   }
   const table=h('table','qregistry-table'),head=table.createTHead().insertRow(),body=table.createTBody();
   table.setAttribute('aria-label',view==='journal'?'Qabullar jurnali':'Bemorlar kartotekasi');
   const shown=optional.filter(([key])=>visibleColumns.has(key));
   const cols=[['name','Bemor'],...shown];
   if(view==='journal')cols.push(['status','Holat',p=>p.status==='closed'?'Yopilgan':p.is_draft?'Qoralama':'Tasdiqlangan']);
   const details=cols.slice(1);
   for(const [,label] of cols){const th=h('th','',label);th.scope='col';head.append(th);}
   for(const p of rows){
    const row=body.insertRow();
    for(const [key,label,value] of cols){
     const cell=row.insertCell();cell.dataset.label=label;
     if(key==='name'){
      const name=[p.last_name,p.first_name,p.middle_name].filter(Boolean).join(' ');
      const link=button('',()=>openRecord(p),'qstart-patient');
      link.title=name;
      const intake=p.intake_profile,registration=intake?.profile;
      const intakeLabel=intake?[(intake.telegram?.username?'@'+intake.telegram.username:p.phone),registration?.age_raw,registration?.weight_raw?registration.weight_raw+(registration.weight!=null?' kg':''):'',registration?.height_raw?registration.height_raw+(registration.height!=null?' sm':''):''].filter(Boolean).join(' · '):'';
      const copy=h('span','qregistry-patient-copy');
      const summary=h('span','qregistry-patient-summary');
      for(const [column,label,format] of details){
       const detail=format(p);
       if(detail==='—')continue;
       const item=h('span','',column==='id'||column==='date'||column==='status'?detail:label+' '+detail);
       summary.append(item);
      }
      const arrow=h('span','qregistry-patient-arrow','›');arrow.setAttribute('aria-hidden','true');
      copy.append(h('span','qregistry-patient-name',name));
      if(intakeLabel)copy.append(h('span','qregistry-intake-summary',intakeLabel));
      if(summary.childElementCount)copy.append(summary);
      link.append(copy,arrow);cell.append(link);
     }else cell.textContent=value(p);
    }
   }
   list.append(table);
   if(total>limit){
    const previous=button('Oldingi',()=>{offset=Math.max(0,offset-limit);load();});
    const next=button('Keyingi',()=>{offset+=limit;load();});
    previous.disabled=offset===0;next.disabled=offset+limit>=total;
    pager.append(previous,h('span','',(offset+1)+'–'+(offset+rows.length)+' / '+total),next);pager.hidden=false;
   }
  }
  function startLoading(){
   result=null;controls();count.textContent='';pager.hidden=true;
   list.setAttribute('aria-busy','true');list.replaceChildren(h('p','qregistry-empty','Bemorlar yuklanmoqda…'));
  }
  async function load(){
   timer=null;const seq=++revision;
   startLoading();status('',false,registry);
   const params=new URLSearchParams({view,tab,sort:sort.value,q:input.value.trim(),offset:String(offset)});
   for(const [key,n] of fields){
    const value=n.type==='checkbox'?(n.checked?'1':''):n.value.trim();
    if(value)params.set(key,value);
   }
   try{
    const data=await api('/registry?'+params);
    if(seq!==revision||!panel.isConnected)return;
    result=data;list.setAttribute('aria-busy','false');
    if(offset>0&&!data.rows.length){offset=0;load();return;}
    renderRows();
   }catch(err){
    if(seq!==revision||!panel.isConnected)return;
    list.setAttribute('aria-busy','false');
    const note=h('p','qstart-error',err.message);note.setAttribute('role','alert');
    list.replaceChildren(note,button('Qayta urinish',load));
   }
  }
  function refresh(delayed=false){
   if(timer)W.clearTimeout(timer);
   offset=0;
   const badAge=[minAge,maxAge].some(n=>!n.validity.valid)||
    (minAge.value!==''&&maxAge.value!==''&&Number(minAge.value)>Number(maxAge.value));
   filterError.hidden=!badAge;
   if(badAge){
    revision++;startLoading();list.setAttribute('aria-busy','false');
    filterError.textContent='Yosh chegarasi 0–180 oralig‘ida bo‘lishi va «gacha» qiymati kichik bo‘lmasligi kerak.';
    list.replaceChildren(h('p','qstart-muted qregistry-empty','Natijalarni ko‘rish uchun yosh filtrini tekshiring.'));return;
   }
   if(delayed){revision++;startLoading();timer=W.setTimeout(load,280);}
   else load();
  }
  search.onsubmit=e=>{e.preventDefault();refresh();};
  input.oninput=()=>refresh(true);
  sort.onchange=()=>refresh();
  for(const field of fields.values()){
   if(field.type==='search'||field.type==='number')field.oninput=()=>refresh(true);
   else field.onchange=()=>refresh();
  }
  api('/specialists').then(data=>{
   if(!panel.isConnected||actor()!==owner)return;
   for(const item of data.specialists||[]){
    specialistNames.set(item.key,item.label);specialist.add(new Option(item.label,item.key));
   }
   if(result)renderRows();
  }).catch(()=>{if(panel.isConnected){specialist.disabled=true;specialist.options[0].textContent='Mutaxassisliklar yuklanmadi';}});
  refresh();
 }
 function mountTelegram(content){
  content.replaceChildren();let offset=0,epoch=0;
  const header=h('div','qregistry-head');header.append(button('← Mening bemorlarim',()=>choose('mine')),h('h2','','Telegram bemorlarim'));
  const search=h('input');search.type='search';search.placeholder='Ism, familiya yoki Telegram niki';search.setAttribute('aria-label',search.placeholder);
  const list=h('div'),pager=h('div');content.append(header,search,list,pager);
  async function load(){const ticket=++epoch;list.textContent='Yuklanmoqda…';try{const data=await api('/telegram?'+new URLSearchParams({q:search.value,offset}));if(ticket!==epoch||!content.isConnected)return;list.replaceChildren();pager.replaceChildren();
   for(const patient of data.patients){const card=h('article','qstart-form'),p=patient.metadata?.profile||{},tg=patient.metadata?.telegram;card.style.marginBlock='18px';
    let opening=false;
    async function openTelegramVisit(){if(opening)return;opening=true;try{const r=await api('/telegram/'+encodeURIComponent(patient.patient_id)+'/new-visit','POST',{});if(ticket!==epoch||!content.isConnected)return;W.UZMEDPatients?.openCard(patient.patient_id,r.visit.visit_id);}catch(e){if(card.isConnected)card.append(h('p','qstart-error',e.message));}finally{opening=false;}}
    const title=h('h3');title.append(button([patient.last_name,patient.first_name].join(' '),()=>patient.submitted_visit_id?openTelegramVisit():W.UZMEDPatients?.openCard(patient.patient_id)));
    card.append(title,h('p','',[tg?.username?'@'+tg.username:patient.phone,p.age_raw,p.weight_raw? p.weight_raw+(p.weight!=null?' kg':''):'',p.height_raw?p.height_raw+(p.height!=null?' sm':''):'',patient.address].filter(Boolean).join(' · ')),h('p','qstart-muted',patient.submitted_visit_id?'Shikoyatlar yuborilgan':'Ro‘yxatdan o‘tgan — shikoyatlar hali yuborilmagan'));
    card.append(button('Profilni ko‘rish',()=>W.UZMEDPatients?.openCard(patient.patient_id)));
    if(patient.submitted_visit_id)card.append(button('Qabulni ochish',openTelegramVisit,'qstart-primary'));
    list.append(card);
   }
   if(!data.patients.length)list.append(h('p','','Bemor topilmadi.'));
   if(offset)pager.append(button('Oldingi',()=>{offset=Math.max(0,offset-30);load();}));if(offset+30<data.total)pager.append(button('Keyingi',()=>{offset+=30;load();}));
  }catch(e){list.textContent=e.message;}}
  search.oninput=()=>{offset=0;load();};load();
 }
 async function launch(patient,draft=null,visit=null){
  if(!clinical||!patient?.patient_id)return;
  if(!W.UZMEDBemorlar?.launchQabul){status('Qabul muharriri yuklanmadi.',true);return;}
  status('Qabul ochilmoqda…');return W.UZMEDBemorlar.launchQabul(patient,visit,draft);
 }
 async function open(view='') {
  const id=actor();if(!id)return;
  if(!mount())return;
  const deepLink=!view&&new URLSearchParams(W.location.search).get('view')==='mine';
  const type=view==='mine'||deepLink?'mine':'home';
  const screen=type==='mine'?registryScreen():root;
  if(!show(screen))return;
  clear();
  if(owner!==id){owner=id;clinical=false;}
  const pending=revision, request=++opening;
  status('Klinik ruxsat tekshirilmoqda…');
  try{
   const {clinicalAllowed}=await api('/auth/status');if(actor()!==id||pending!==revision||request!==opening||!screen.classList.contains('active'))return;
   clinical=clinicalAllowed===true;
   if(!clinical){screen.querySelector('.qstart-content').replaceChildren(h('p','qstart-muted','Bu akkauntda klinik huquq tasdiqlanmagan. Vrach akkauntini ulash uchun Bemorlarim orqali ruxsat oling.'));status('Klinik kirish huquqi talab qilinadi.',true);return;}
   choose(type);
  }catch(err){if(pending===revision&&request===opening)status(err.message,true);}
 }
 W.UZMEDQabulStart={open,choose};
 W.addEventListener('uzmed:auth-change',()=>{if(actor()!==owner){clear();owner='';clinical=false;if(root){delete root.dataset.qstartView;W.UZMEDQabulPremium?.syncChoice?.('home');}}});
})(window,document);
