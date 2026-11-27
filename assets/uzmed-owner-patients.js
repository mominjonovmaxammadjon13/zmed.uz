/* UZMED owner-only patient read view. Backend always authorizes; UI is not an ACL. */
(function(W,D){
 'use strict';
 const ID='uzOwnerPatientsScreen',SIDEBAR='uzOwnerPatientsMenu',USERS_MENU='uzOwnerAccountsMenu';
 let ownerId='',checkedId='',sequence=0,opened=false,query='',offset=0,wait;
 function el(tag,cls,txt){const n=D.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;}
 function btn(txt,action,cls=''){const b=el('button','upo-btn '+cls,txt);b.type='button';b.addEventListener('click',action);return b;}
 function authId(){try{return String(W.UZMEDAuth?.getState()?.user?.id||'');}catch{return '';}}
 async function get(path){const id=authId(),token=await W.UZMEDAuth?.getAccessToken();if(!token||id!==authId())throw Error('UZMED akkauntiga kiring.');const response=await fetch(path.startsWith('/api/core/entry/')?path:'/api/patients/admin'+path,{headers:{Authorization:'Bearer '+token},cache:'no-store',credentials:'omit'});if(!response.ok)throw Error(response.status===403?'Bosh administrator huquqi yo‘q.':'Bemorlar bazasidan ma’lumot olib bo‘lmadi.');const data=await response.json();if(id!==authId())throw Error('Akkaunt o‘zgardi.');return data;}
 function screen(){let s=D.getElementById(ID);if(!s){const root=D.querySelector('.screens');if(!root)return null;s=el('section','screen upo-screen');s.id=ID;s.setAttribute('aria-label','Barcha bemorlar — bosh administrator');root.append(s);new MutationObserver(()=>{if(!s.classList.contains('active')){s.replaceChildren();sequence++;opened=false;}}).observe(s,{attributes:true,attributeFilter:['class']});}return s;}
 function side(){
  const menu=D.querySelector('#uzSideMenu .uz-menu-body');
  if(menu&&!D.getElementById(SIDEBAR)){const b=btn('👑 Barcha bemorlar',open,'uz-menu-item');b.id=SIDEBAR;menu.append(b);}
  if(menu&&!D.getElementById(USERS_MENU)){const b=btn('👥 Foydalanuvchilar',()=>accountListing('web',1),'uz-menu-item');b.id=USERS_MENU;menu.append(b);}
  const rail=D.querySelector('#uzadSb .uzad-scroll');
  if(rail&&!D.getElementById('uzOwnerPatientsRail')){const b=btn('👑 Barcha bemorlar',open,'uzad-nb');b.id='uzOwnerPatientsRail';rail.append(b);}
  if(rail&&!D.getElementById('uzOwnerAccountsRail')){const b=btn('👥 Foydalanuvchilar',()=>accountListing('web',1),'uzad-nb');b.id='uzOwnerAccountsRail';rail.append(b);}
 }
 function remove(){D.getElementById(SIDEBAR)?.remove();D.getElementById(USERS_MENU)?.remove();D.getElementById('uzOwnerPatientsRail')?.remove();D.getElementById('uzOwnerAccountsRail')?.remove();const s=D.getElementById(ID);s?.replaceChildren();sequence++;opened=false;ownerId='';}
 async function authorize(){const id=authId();if(!id){checkedId='';remove();return;}if(id===ownerId){side();return;}if(id===checkedId)return;checkedId=id;try{await get('/status');if(id!==authId())return;ownerId=id;side();}catch{remove();}}
 function frame(title){const s=screen();if(!s)return null;s.replaceChildren();const h=el('div','upo-head');h.append(btn('← UZMED asosiy sahifasi',()=>W.showNav?.('home'),'upo-quiet'),el('h1','',title));s.append(h);return s;}
 function go(){screen();W.closeMenu?.();W.showScreen?.(ID);opened=true;}
 async function open(){const id=authId();if(id!==ownerId){await authorize();if(id!==ownerId)return;}go();query='';offset=0;await listing();}
 function displayName(p){return [p.last_name,p.first_name,p.middle_name].filter(Boolean).join(' ');}
 async function listing(){const s=frame('👑 Barcha bemorlar');if(!s)return;const controls=el('div','upo-controls'),search=el('input');search.type='search';search.value=query;search.placeholder='Ism, familiya yoki bemor ID';search.setAttribute('aria-label','Barcha bemorlardan qidirish');controls.append(search,btn('Qidirish',()=>{query=search.value;offset=0;listing();},'upo-main'));controls.append(btn('Shaxsiy shablonlar',()=>templateListing(0)),btn('Foydalanuvchilar',()=>accountListing('web',1)));s.append(controls);const result=el('div','upo-result','Ma’lumotlar yuklanmoqda…');s.append(result);let timer;search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{query=search.value;offset=0;listing();},300);});const current=++sequence;try{const data=await get('?'+new URLSearchParams({q:query,limit:'20',offset:String(offset)}));if(current!==sequence||!s.classList.contains('active'))return;result.replaceChildren(el('p','upo-muted','Jami '+data.total+' bemor. Faqat tasdiqlangan administratorga ko‘rinadi.'));const list=el('div','upo-list');for(const p of data.patients||[]){const b=btn(displayName(p)+' · '+(p.created_by||'')+' · '+(p.short_code||String(p.patient_id).slice(0,8)),()=>detail(p.patient_id),'upo-item');list.append(b);}if(!list.children.length)list.append(el('p','upo-muted','Bemor topilmadi.'));result.append(list);const pages=el('div','upo-pages');if(offset)pages.append(btn('← Oldingi',()=>{offset=Math.max(0,offset-20);listing();}));if(offset+20<data.total)pages.append(btn('Keyingi →',()=>{offset+=20;listing();}));result.append(pages);}catch(e){if(current===sequence)result.textContent=e.message;}}
 async function templateListing(start){const s=frame('Shifokorlarning shaxsiy shablonlari');if(!s)return;s.append(btn('← Barcha bemorlar',listing));const root=el('div','upo-result','Shablonlar yuklanmoqda…');s.append(root);const current=++sequence;try{const data=await get('/api/core/entry/admin/templates?limit=20&offset='+start);if(current!==sequence||!s.classList.contains('active'))return;root.replaceChildren(el('p','upo-muted','Jami '+data.total+' shaxsiy shablon.'));for(const row of data.templates||[])section(root,row.template.title,[['Shifokor',row.owner_id],['Turi',row.kind],['Bo‘lim',row.template.section],...Object.entries(row.template.values)]);if(start)root.append(btn('← Oldingi',()=>templateListing(Math.max(0,start-20))));if(start+20<data.total)root.append(btn('Keyingi →',()=>templateListing(start+20)));}catch(e){if(current===sequence)root.textContent=e.message;}}
 function section(root,heading,entries){const article=el('article','upo-panel');article.append(el('h2','',heading));for(const [title,value]of entries){if(value===null||value===undefined||value==='')continue;const row=el('p','upo-line');row.append(el('strong','',title+': '),el('span','',typeof value==='object'?JSON.stringify(value):String(value)));article.append(row);}root.append(article);}
 async function detail(id){const s=frame('Bemor kartasi');if(!s)return;s.append(btn('← Barcha bemorlar',listing,'upo-quiet'));const root=el('div','upo-result','Bemor ma’lumotlari ochilmoqda…');s.append(root);const current=++sequence;try{const {patient:p}=await get('/'+encodeURIComponent(id));if(current!==sequence||!s.classList.contains('active'))return;root.replaceChildren();section(root,displayName(p),[['Bemor ID',p.short_code||p.patient_id],['Ichki UUID',p.patient_id],['Yaratgan shifokor',p.created_by],['Tug‘ilgan sana',p.date_of_birth],['Jins',p.sex],['Telefon',p.phone],['Manzil',p.address],['JShShIR',p.pinfl],['Qon guruhi',p.blood_group],['Doimiy kasalliklar',p.chronic_conditions]]);for(const [name,label,keys]of [['visits','Qabullar',['visit_at','chief_complaint','anamnesis_morbi','anamnesis_vitae','objective_exam','recommendations','follow_up']],['diagnoses','Tashxislar',['diagnosis','icd10','status']],['treatment_plans','Davolash rejalari',['plan','status']],['prescriptions','Retseptlar',['status','created_at']],['allergies','Allergiyalar',['substance','reaction','severity']],['medications','Dorilar',['name','inn','dose','frequency']],['files','Fayllar',['name','mime_type','created_at']]]){const records=Array.isArray(p[name])?p[name]:[];section(root,label+' ('+records.length+')',records.slice(0,100).map((v,i)=>['#'+(i+1),keys.map(k=>v[k]===undefined?'':k+' — '+(typeof v[k]==='object'?JSON.stringify(v[k]):v[k])).filter(Boolean).join(' · ')]));}}
 catch(e){if(current===sequence)root.textContent=e.message;}}
 async function accountListing(kind='web',page=1){
  const id=authId();if(id!==ownerId){await authorize();if(id!==ownerId)return;}go();
  const s=frame('👥 UZMED foydalanuvchilari');if(!s)return;
  const nav=el('div','upo-controls');
  nav.append(btn('Sayt akkauntlari',()=>accountListing('web',1),kind==='web'?'upo-main':''),btn('Telegram foydalanuvchilari',()=>accountListing('telegram',1),kind==='telegram'?'upo-main':''),btn('Barcha bemorlar',listing));
  s.append(nav,el('p','upo-muted','Faqat bosh administratorga ko‘rinadi. Hisoblar hech qachon bir-biriga qo‘shilmaydi.'));
  const root=el('div','upo-result','Akkauntlar yuklanmoqda…');s.append(root);
  const current=++sequence;
  try{
   const data=await get('/api/core/entry/admin/accounts?'+new URLSearchParams({kind,page:String(page)}));
   if(current!==sequence||!s.classList.contains('active'))return;
   root.replaceChildren(el('p','upo-muted',(data.total===null?'Sahifa '+data.page:'Jami '+data.total)+' · '+(kind==='web'?'Sayt akkauntlari':'Telegram foydalanuvchilari')));
   const list=el('div','upo-list');
   for(const user of data.users||[]){
    const name=user.name||user.email||user.username||user.id;
    const sub=kind==='web'?user.email||user.phone||'':user.phone||user.username||'';
    list.append(btn(name+(sub&&sub!==name?' · '+sub:''),()=>accountDetail(kind,page,user),'upo-item'));
   }
   if(!list.children.length)list.append(el('p','upo-muted','Akkaunt topilmadi.'));
   root.append(list);
   const pages=el('div','upo-pages');if(page>1)pages.append(btn('← Oldingi',()=>accountListing(kind,page-1)));if(data.has_more)pages.append(btn('Keyingi →',()=>accountListing(kind,page+1)));root.append(pages);
  }catch(e){if(current===sequence)root.textContent=e.message;}
 }
 function accountDetail(kind,page,user){
  const s=frame('Foydalanuvchi akkaunti');if(!s)return;
  s.append(btn('← Foydalanuvchilar',()=>accountListing(kind,page),'upo-quiet'));
  const details=kind==='web'?[['Foydalanuvchi ID',user.id],['Ism',user.name],['Email',user.email],['Telefon',user.phone],['Kirish turi',user.provider],['Ro‘yxatdan o‘tgan',user.created_at],['Oxirgi kirish',user.last_sign_in_at],['Email tasdiqlangan',user.email_confirmed?'Ha':'Yo‘q'],['Telefon tasdiqlangan',user.phone_confirmed?'Ha':'Yo‘q'],['Telegramdan ochilgan',user.telegram_managed?'Ha':'Yo‘q']]:[['Telegram ID',user.id],['Ism',user.name],['Username',user.username],['Telefon',user.phone],['Telefon tasdiqlangan sana',user.phone_verified_at],['Birinchi kirish',user.first_seen],['Oxirgi faollik',user.last_seen],['So‘rovlar soni',user.requests_count],['Bloklangan',user.banned?'Ha':'Yo‘q'],['Bog‘langan sayt akkaunti ID',user.web_subject]];
  section(s,user.name||user.email||user.username||user.id,details);
  s.append(el('p','upo-muted','Bemorlar va klinik yozuvlar “Barcha bemorlar” bo‘limida alohida ko‘riladi. Maxfiy kalitlar va parollar ko‘rsatilmaydi.'),btn('👑 Barcha bemorlar',listing));
 }
 D.addEventListener('click',e=>{if(e.target.closest?.('#uzAuthLogoutBtn')){checkedId='';remove();}});W.addEventListener('uzmed:auth-change',()=>{checkedId='';if(ownerId&&authId()!==ownerId)remove();authorize();});W.addEventListener('storage',()=>{checkedId='';if(ownerId&&authId()!==ownerId)remove();authorize();});W.addEventListener('pagehide',remove);
 let tries=0;wait=W.setInterval(()=>{if(D.readyState!=='loading'&&W.UZMEDAuth&&D.querySelector('.screens')){W.clearInterval(wait);authorize();W.setInterval(authorize,2500);}else if(++tries>=120)W.clearInterval(wait);},250);
 W.UZMEDOwnerPatients={open,authorize};
})(window,document);
