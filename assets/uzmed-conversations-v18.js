/* Account-scoped browser conversations. Native AI transport, prompts and formulas stay untouched. */
(function(W){
 'use strict';
 const PREFIX='UZMED_CONVERSATIONS_V18:';
 function text(m){return (m?.parts||[]).map(p=>typeof p.text==='string'?p.text:'').join('\n');}
 function messages(a){return Array.isArray(a)?a.filter(m=>m&&['user','model'].includes(m.role)&&text(m)).map(m=>({role:m.role,parts:[{text:text(m)}]})):[];}
 function equal(a,b){return a?.role===b?.role&&text(a)===text(b);}
 function added(before,after){for(let n=Math.min(before.length,after.length);n>=0;n--)if(before.slice(-n||before.length).every((m,i)=>equal(m,after[i])))return after.slice(n);return after.slice();}
 function merge(before,after){return before.concat(added(before,after));}
 function title(value){return String(value||'Yangi suhbat').replace(/\s+/g,' ').trim().slice(0,80)||'Yangi suhbat';}
 function dayGroup(time,now){const d=new Date(time),n=new Date(now);d.setHours(0,0,0,0);n.setHours(0,0,0,0);const days=Math.round((n-d)/86400000);return days===0?'Bugun':days===1?'Kecha':days<7&&days>=0?'Oxirgi 7 kun':'Oldingi suhbatlar';}
 function read(raw){if(!raw)return {version:1,activeId:null,threads:[]};const d=JSON.parse(raw);if(d.version!==1||!Array.isArray(d.threads)||d.threads.some(t=>!t||typeof t.id!=='string'||typeof t.title!=='string'||!Number.isFinite(t.createdAt)||!Number.isFinite(t.updatedAt)||!Array.isArray(t.messages)||t.messages.some(m=>!['user','model'].includes(m?.role)||!Array.isArray(m.parts)||m.parts.some(p=>typeof p?.text!=='string'))||t.media!=null&&!Array.isArray(t.media)))throw Error('Unsupported conversation archive');return d;}
 const core={PREFIX,text,messages,equal,added,merge,title,dayGroup,read};
 if(typeof module==='object'&&module.exports){module.exports=core;return;}
 W.UZMEDConversationCore=core;
 const D=W.document;let ownerId=null,state=null,lastNative=[],suppressed=false,mounted=false,saveError='',unreadable=false,legacyPending=false;
 const seenMedia=new WeakSet(),seenUsers=new WeakSet();let saveTimer,renderFrame=0;
 function owner(){try{const s=W.UZMEDAuth?.getState?.();return s?.loggedIn&&s.user?.id?String(s.user.id):null;}catch(_){return null;}}
 function native(){return messages(W.aiHistory);}
 function current(){return state?.threads.find(t=>t.id===state.activeId&&!t.archived)||null;}
 function node(tag,cls,value){const n=D.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;}
 function btn(value,action,cls){const n=node('button',cls,value);n.type='button';n.onclick=action;return n;}
 function publish(){W.dispatchEvent(new CustomEvent('uzmed:conversations-updated'));scheduleRender();}
 function store(){
  if(!state||ownerId!==owner()||!ownerId||unreadable)return false;
  try{localStorage.setItem(PREFIX+encodeURIComponent(ownerId),JSON.stringify(state));saveError='';publish();return true;}
  catch(_){saveError='Suhbatni qurilmada saqlab bo‘lmadi. Brauzer xotirasi yoki maxfiy rejimni tekshiring. Ochiq yozishma saqlanib turibdi.';publish();return false;}
 }
 function tell(value){const side=D.getElementById('uzmedRecentConversationStatus');if(side)side.textContent=value;const n=D.getElementById('uzmedConversationStatus');if(n)n.textContent=value;const e=D.getElementById('uzmedConversationSaveStatus');if(e){e.textContent=saveError;e.hidden=!saveError;}}
 function create(){if(unreadable||!ownerId)return null;const now=Date.now(),t={id:W.crypto?.randomUUID?.()||now.toString(36)+'-'+Math.random().toString(36).slice(2),title:'Yangi suhbat',createdAt:now,updatedAt:now,messages:[],media:[],draft:'',archived:false};state.threads.push(t);state.activeId=t.id;return t;}
 function capture(){
  if(ownerId!==owner()){const previousOwner=ownerId,previousNative=lastNative;adopt();if(previousOwner===null)lastNative=previousNative;else return;}
  if(suppressed||!state||ownerId!==owner()||unreadable)return;
  const next=native(),delta=added(lastNative,next);lastNative=next;let stateChanged=false;const active=current(),N=W.UZMEDAIBackendV5;
  if(active&&N?.clinicalOwner===ownerId)try{const value=JSON.stringify(N.clinicalState||null);if(value!==JSON.stringify(active.nativeState||null)){active.nativeState=JSON.parse(value);stateChanged=true;}}catch(_){/* Preserve previous opaque native state if not serializable. */}
  if(!delta.length){if(stateChanged)store();return;}const t=active||create();if(!t)return;
  t.messages=merge(t.messages,delta);if(!t.customTitle)t.title=title(t.messages.find(m=>m.role==='user')?.parts[0].text);
  t.updatedAt=Date.now();store();
 }
 function filesPending(){return !!(W.pendingFiles?.length||W.UZMEDAiAttach?.pendingFiles?.length);}
 function draft(){const t=current(),i=D.getElementById('uzmedV5Input');if(t&&i){t.draft=i.value;store();}}
 function captureUsers(){
  if(suppressed)return;adopt();if(!ownerId||unreadable)return;
  D.querySelectorAll('#aiMessages .uzmed-v5-msg.user').forEach(n=>{
   if(seenUsers.has(n))return;seenUsers.add(n);const q=n.textContent;if(!q)return;
   const t=current()||create();if(!t)return;const last=t.messages.at(-1),lastQuestion=t.messages.filter(m=>m.role==='user').at(-1);
   if(last?.role==='user'&&text(last)===q||!W.UZMEDAIBackendV5?.busy&&!W.aiTyping&&lastQuestion&&text(lastQuestion)===q)return;
   t.messages.push({role:'user',parts:[{text:q}]});if(!t.customTitle)t.title=title(t.messages.find(m=>m.role==='user').parts[0].text);t.updatedAt=Date.now();store();
  });
 }
 function safePicture(value){try{const u=new URL(value,W.location.origin);return u.origin===W.location.origin&&u.pathname.startsWith('/api/derma/image/')?u.pathname+u.search:null;}catch(_){return null;}}
 function captureMedia(){
  if(suppressed||ownerId!==owner())return;const t=current();if(!t)return;
  D.querySelectorAll('#aiMessages .uzmed-main-derma-media').forEach(section=>{
   if(seenMedia.has(section))return;seenMedia.add(section);
   const figures=Array.from(section.querySelectorAll('figure')).map(f=>({url:safePicture(f.querySelector('img')?.src),title:f.querySelector('figcaption')?.textContent||'',source:f.querySelector('small')?.textContent||''})).filter(f=>f.url);
   if(figures.length){t.media.push({after:Math.max(0,t.messages.length-1),figures});store();}
  });
 }
 function markChat(){
  const host=D.getElementById('aiMessages'),screen=D.getElementById('doktor-screen');if(!host||!screen)return;
  const has=!!host.querySelector('.uzmed-v5-msg,.ai-msg-row:not(#aiTypingRow)');screen.classList.toggle('ucs18-has-messages',has);
  const empty=D.getElementById('umAIEmpty');if(empty){const h=empty.querySelector('h2');if(h&&h.textContent!=='Bugun qanday yordam beray?')h.textContent='Bugun qanday yordam beray?';empty.querySelector('p')?.remove();}
 }
 function showPicture(f){const dlg=node('dialog','ucs18-picture-dialog'),close=btn('Yopish',()=>dlg.close()),img=node('img');img.src=f.url;img.alt=f.title;dlg.append(close,img,node('p','',f.title),node('small','',f.source));D.body.append(dlg);const focus=D.activeElement;dlg.onclose=()=>{dlg.remove();focus?.focus?.();};dlg.onclick=e=>{if(e.target===dlg)dlg.close();};dlg.showModal();close.focus();}
 function paint(t){
  const host=D.getElementById('aiMessages');if(!host)return;host.replaceChildren();
  t.messages.forEach((m,index)=>{
   const n=node('div','uzmed-v5-msg '+(m.role==='model'?'bot':'user'),text(m));if(m.role==='user')seenUsers.add(n);host.append(n);
   (t.media||[]).filter(g=>g.after===index).forEach(g=>{const section=node('section','uzmed-main-derma-media'),grid=node('div','uzmed-main-derma-grid');section.append(node('h3','','Saqlangan klinik rasmlar'));g.figures.forEach(f=>{const url=safePicture(f.url);if(!url)return;const fig=node('figure'),button=btn('',()=>showPicture({...f,url})),img=node('img');button.setAttribute('aria-label',f.title+' rasmini kattalashtirish');img.src=url;img.alt=f.title;img.loading='lazy';img.referrerPolicy='no-referrer';button.append(img);fig.append(button,node('figcaption','',f.title),node('small','',f.source));grid.append(fig);});section.append(grid);seenMedia.add(section);host.append(section);});
  });host.scrollTop=host.scrollHeight;markChat();
 }
 function preserveLegacy(){
  try{const raw=localStorage.getItem('UZMED_AI_HISTORY');if(!raw||raw==='[]')return true;
   const k='UZMED_LEGACY_PRESERVED_V18',saved=localStorage.getItem(k),records=saved?JSON.parse(saved):[];if(!Array.isArray(records))throw Error('Legacy snapshot unavailable');
   if(!records.some(r=>r.raw===raw)){records.push({raw,at:Date.now()});localStorage.setItem(k,JSON.stringify(records));}return true;
  }catch(_){saveError='Oldingi yozishma zaxirasini saqlab bo‘lmadi. Uni yo‘qotmaslik uchun yangi chat ochilmadi.';tell(saveError);return false;}
 }
 function nativeClear(){if(!preserveLegacy())return false;legacyPending=false;const fn=W.clearAiChat;if(typeof fn==='function')fn();if(Array.isArray(W.aiHistory))W.aiHistory.splice(0,W.aiHistory.length);W.uzmedSaveHistory?.();return true;}
 function restoreNative(t){if(!Array.isArray(W.aiHistory))W.aiHistory=[];W.aiHistory.splice(0,W.aiHistory.length,...messages(t.messages).slice(-20));W.uzmedHookHistory?.();lastNative=native();const N=W.UZMEDAIBackendV5;if(N&&ownerId&&ownerId===owner()){N.clinicalOwner=ownerId;N.clinicalHistoryRef=W.aiHistory;N.clinicalState=t.nativeState?JSON.parse(JSON.stringify(t.nativeState)):null;}}
 function resetUI(){const host=D.getElementById('aiMessages');if(host)host.replaceChildren();const input=D.getElementById('uzmedV5Input');if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}markChat();}
 function open(id){
  adopt();if(busy()){tell('Avval joriy javob tugashini kuting.');return false;}if(!state||unreadable)return false;const t=state.threads.find(x=>x.id===id&&!x.archived);if(!t)return false;
  if(filesPending()){tell('Biriktirilgan faylni avval yuboring yoki olib tashlang.');return false;}
  capture();draft();suppressed=true;
  try{if(!nativeClear())return false;state.activeId=t.id;restoreNative(t);W.uzmedSaveHistory?.();paint(t);const i=D.getElementById('uzmedV5Input');if(i){i.value=t.draft||'';i.dispatchEvent(new Event('input',{bubbles:true}));}W.UZMEDNavigation?.activate('chat');store();}
  finally{suppressed=false;}return true;
 }
 function fresh(navigate=true){
  adopt();if(busy()){tell('Avval joriy javob tugashini kuting.');return false;}if(filesPending()){tell('Biriktirilgan faylni avval yuboring yoki olib tashlang.');return false;}
  capture();draft();suppressed=true;try{if(!nativeClear())return false;if(state)state.activeId=null;lastNative=native();resetUI();store();if(navigate!==false)W.UZMEDNavigation?.activate('chat');}finally{suppressed=false;}return true;
 }
 function adopt(){
  const next=owner();if(next===ownerId&&state)return;const previousOwner=ownerId;
  ownerId=next;state=null;unreadable=false;legacyPending=false;saveError='';
  if(next)try{state=read(localStorage.getItem(PREFIX+encodeURIComponent(next)));}catch(_){unreadable=true;saveError='Saqlangan suhbat formati ochilmadi. Yozuvlar o‘chirilmagan yoki almashtirilmagan.';state={version:1,activeId:null,threads:[]};}
  // Global legacy records have no owner marker. Keep a byte copy; exclude them from a new account's context.
  if(next&&previousOwner===null&&!current()&&native().length&&!W.UZMEDAIBackendV5?.busy&&!W.aiTyping){
   if(!preserveLegacy()){legacyPending=true;lastNative=native();scheduleRender();return;}if(Array.isArray(W.aiHistory))W.aiHistory.splice(0,W.aiHistory.length);const h=D.getElementById('aiMessages');h?.querySelectorAll('.uzmed-v5-msg,.ai-msg-row,.ai-time').forEach(n=>n.remove());
  }
  lastNative=native();scheduleRender();
 }
 function rename(t){const dlg=node('dialog','ucs18-rename'),form=node('form'),label=node('label','','Suhbat nomi'),input=node('input'),actions=node('div','ucs18-dialog-actions');input.value=t.title;input.maxLength=80;input.id='uzmedRenameConversation';label.htmlFor=input.id;form.append(label,input);actions.append(btn('Bekor qilish',()=>dlg.close()));const submit=node('button','','Saqlash');submit.type='submit';actions.append(submit);form.append(actions);form.onsubmit=e=>{e.preventDefault();if(ownerId!==owner())return dlg.close();t.title=title(input.value);t.customTitle=true;store();dlg.close();};dlg.append(form);D.body.append(dlg);dlg.onclose=()=>dlg.remove();dlg.showModal();input.focus();input.select();}
 function archive(t,value){if(ownerId!==owner())return;t.archived=value;if(value&&state.activeId===t.id)fresh(false);store();}

 function busy(){return !!(W.aiTyping||W.UZMEDAIBackendV5?.busy);}
 function deleteThread(id,expectedOwner){
  adopt();if(!ownerId||ownerId!==expectedOwner||ownerId!==owner()||!state||unreadable)return false;
  const target=state.threads.find(t=>t.id===id);if(!target)return false;
  const active=state.activeId===id;
  if(active&&(busy()||filesPending())){tell('Javob tugashini kuting yoki biriktirilgan faylni olib tashlang.');return false;}
  const next={...state,activeId:active?null:state.activeId,threads:state.threads.filter(t=>t.id!==id)};
  // Persist before clearing native context: a failed write keeps the whole conversation.
  try{localStorage.setItem(PREFIX+encodeURIComponent(ownerId),JSON.stringify(next));}
  catch(_){saveError='Suhbatni o‘chirib bo‘lmadi. Brauzer xotirasini tekshirib, qayta urinib ko‘ring.';tell(saveError);return false;}
  suppressed=true;
  try{
   state=next;saveError='';
   if(active){
    if(Array.isArray(W.aiHistory))W.aiHistory.splice(0,W.aiHistory.length);
    const N=W.UZMEDAIBackendV5;
    if(N&&N.clinicalOwner===ownerId){N.clinicalState=null;N.clinicalHistoryRef=W.aiHistory;}
    lastNative=[];resetUI();
    try{W.uzmedSaveHistory?.();}catch(_){/* The account archive is already durable. */}
   }
  }finally{suppressed=false;}
  publish();tell('Suhbat o‘chirildi.');return true;
 }
 function confirmDelete(t){
  adopt();if(!ownerId||unreadable)return;
  const expectedOwner=ownerId,focus=D.activeElement;
  if(state.activeId===t.id&&(busy()||filesPending())){tell('Javob tugashini kuting yoki biriktirilgan faylni olib tashlang.');return;}
  const dlg=node('dialog','ucs18-delete-dialog'),heading=node('h2','','Suhbatni o‘chirish?'),description=node('p','', '«'+t.title+'» va unga tegishli yozishmalar shu brauzerdan o‘chiriladi.'),status=node('p','ucs18-delete-status'),actions=node('div','ucs18-dialog-actions');
  dlg.id='uzmedDeleteConversation';heading.id='uzmedDeleteConversationTitle';description.id='uzmedDeleteConversationDescription';
  dlg.setAttribute('aria-labelledby',heading.id);dlg.setAttribute('aria-describedby',description.id);status.setAttribute('role','status');
  const cancel=btn('Bekor qilish',()=>dlg.close());
  const remove=btn('O‘chirish',()=>{if(owner()!==expectedOwner){dlg.close();return;}if(deleteThread(t.id,expectedOwner))dlg.close();else status.textContent=saveError||'Javob tugashini kuting yoki biriktirilgan faylni olib tashlang.';},'ucs18-danger');
  actions.append(cancel,remove);dlg.append(heading,description,status,actions);D.body.append(dlg);
  const changed=()=>{if(owner()!==expectedOwner)dlg.close();};W.addEventListener('uzmed:auth-change',changed);
  dlg.onclose=()=>{W.removeEventListener('uzmed:auth-change',changed);dlg.remove();if(focus?.isConnected)focus.focus({preventScroll:true});else (D.querySelector('.ucs18-recent-delete')||D.querySelector('.uxn-new-chat'))?.focus({preventScroll:true});};
  dlg.showModal();cancel.focus();
 }
 function deleteButton(t){
  const b=btn('',()=>confirmDelete(t),'ucs18-recent-delete');b.title='Suhbatni o‘chirish';b.setAttribute('aria-label',t.title+' suhbatini o‘chirish');
  const svg=D.createElementNS('http://www.w3.org/2000/svg','svg'),path=D.createElementNS(svg.namespaceURI,'path');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');path.setAttribute('d','M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7');svg.append(path);b.append(svg);return b;
 }
 function date(value){const d=new Date(value);return d.getDate()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getFullYear()).slice(-2);}
 function sorted(){return (state?.threads||[]).filter(t=>t.messages?.length).slice().sort((a,b)=>b.updatedAt-a.updatedAt);}
 function scheduleRender(){if(!renderFrame)renderFrame=requestAnimationFrame(()=>{renderFrame=0;render();});}
 function render(){
  if(!mounted)return;const host=D.getElementById('uzmedConversationList'),recent=D.getElementById('uzmedRecentConversationList'),search=D.getElementById('uzmedConversationSearch'),mode=D.getElementById('uzmedConversationArchive');if(!host||!recent)return;
  const q=(search.value||'').toLocaleLowerCase(),archived=mode.checked,list=sorted().filter(t=>!!t.archived===archived),matches=list.filter(t=>!q||(t.title+' '+t.messages.map(text).join(' ')).toLocaleLowerCase().includes(q));
  host.replaceChildren();recent.replaceChildren();const count=D.getElementById('uzmedConversationCount');count.textContent=ownerId?list.length+' ta suhbat':'Tarixni ko‘rish uchun akkauntga kiring';
  let group='';matches.forEach(t=>{const name=dayGroup(t.updatedAt,Date.now());if(name!==group){group=name;host.append(node('h3','ucs18-date-group',group));}const row=node('div','ucs18-thread-row'),main=btn(t.title,()=>open(t.id),'ucs18-thread-open'),summary=node('small','',title(text(t.messages.at(-1))).slice(0,110)),time=node('time','',date(t.updatedAt));main.append(summary);row.append(main,time);if(t.id===state?.activeId)row.setAttribute('aria-current','true');const menu=node('details','ucs18-thread-menu'),toggle=node('summary','','⋯');toggle.setAttribute('aria-label',t.title+' — suhbat amallari');const options=node('div','ucs18-thread-options');options.append(btn('Nomini o‘zgartirish',()=>{menu.open=false;rename(t);}),btn(archived?'Arxivdan qaytarish':'Arxivlash',()=>archive(t,!archived)),btn('O‘chirish',()=>{menu.open=false;confirmDelete(t);},'ucs18-delete-option'));menu.append(toggle,options);row.append(menu);host.append(row);});
  if(!matches.length){const empty=node('div','ucs18-history-empty');empty.append(node('h3','',q?'Suhbat topilmadi':archived?'Arxiv hozircha bo‘sh':'Suhbatlaringiz shu yerda'),node('p','',q?'Boshqa so‘z bilan qidiring.':'Yangi chatda yozgan savol va javoblaringiz alohida suhbat bo‘lib saqlanadi.'));if(!q&&!archived)empty.append(btn('Yangi suhbat',fresh,'ucs18-primary'));host.append(empty);}
  sorted().filter(t=>!t.archived).slice(0,12).forEach(t=>{const b=btn(t.title,()=>open(t.id),'ucs18-recent-thread');b.title=t.title;b.setAttribute('aria-label',t.title+' suhbatini ochish');if(t.id===state?.activeId)b.setAttribute('aria-current','page');const row=node('div','ucs18-recent-row');row.append(b,deleteButton(t));recent.append(row);});D.getElementById('uzmedRecentConversations').hidden=!recent.children.length;
  tell(saveError||'Suhbatlar shu brauzerda, akkauntingiz uchun alohida saqlanadi.');
 }
 function install(){
  if(mounted)return true;const history=D.getElementById('ai-tarix-screen'),sidebar=D.getElementById('uzmedSidebar'),host=D.getElementById('aiMessages');if(!history||!sidebar||!host||!W.uzmedSaveHistory)return false;
  mounted=true;const css=D.getElementById('uzmedChatV18Style');if(css)D.head.append(css);const shell=node('section','ucs18-history');shell.id='uzmedConversations';shell.setAttribute('aria-label','Suhbatlar tarixi');const top=node('div','ucs18-history-top'),heading=node('div');heading.append(node('h1','','Suhbatlar'),node('p','', 'Savoldan javobgacha — yozishmalaringiz bir joyda.'));top.append(heading,btn('＋ Yangi chat',fresh,'ucs18-primary'));shell.append(top,node('p','ucs18-count',''));shell.lastChild.id='uzmedConversationCount';const filters=node('div','ucs18-history-filters'),input=node('input');input.type='search';input.id='uzmedConversationSearch';input.placeholder='Suhbatlarni qidirish';input.setAttribute('aria-label','Suhbat nomi, savol yoki javobdan qidirish');input.oninput=scheduleRender;filters.append(input);const label=node('label','ucs18-archive-filter','Arxiv'),check=node('input');check.type='checkbox';check.id='uzmedConversationArchive';check.onchange=scheduleRender;label.prepend(check);filters.append(label);shell.append(filters,node('div','ucs18-thread-list',''));shell.lastChild.id='uzmedConversationList';const status=node('p','ucs18-history-note');status.id='uzmedConversationStatus';status.setAttribute('role','status');shell.append(status);history.prepend(shell);
  const recent=node('section','ucs18-recent');recent.id='uzmedRecentConversations';recent.append(node('h2','','Oxirgi suhbatlar'),node('div'));recent.lastChild.id='uzmedRecentConversationList';const recentStatus=node('p','ucs18-recent-status');recentStatus.id='uzmedRecentConversationStatus';recentStatus.setAttribute('role','status');recent.append(recentStatus);sidebar.querySelector('.uxn-nav').append(recent);
  const oldSave=W.uzmedSaveHistory;W.uzmedSaveHistory=function(){const r=oldSave.apply(this,arguments);capture();return r;};
  const oldClear=W.clearAiChat;W.clearAiChat=function(){if(suppressed)return oldClear.apply(this,arguments);if(filesPending()){tell('Biriktirilgan faylni avval yuboring yoki olib tashlang.');return;}capture();draft();if(!preserveLegacy())return;suppressed=true;let r;try{r=oldClear.apply(this,arguments);if(state)state.activeId=null;lastNative=native();resetUI();store();}finally{suppressed=false;}return r;};
  D.getElementById('uzmedWorkspaceAction')?.addEventListener('click',e=>{if(D.body.classList.contains('ug-chat')){e.preventDefault();e.stopImmediatePropagation();fresh();}},true);
  sidebar.querySelector('.uxn-new-chat')?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();fresh();},true);
  // If an unowned legacy snapshot cannot be backed up, a UI send must not
  // overwrite it or carry its unknown owner's context into this account.
  const protectLegacy=e=>{const send=e.type==='click'?e.target.closest?.('#uzmedV5SendBtn'):e.target.id==='uzmedV5Input'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing;if(!send)return;adopt();if(legacyPending){e.preventDefault();e.stopImmediatePropagation();tell(saveError);}};
  W.addEventListener('click',protectLegacy,true);W.addEventListener('keydown',protectLegacy,true);
  D.addEventListener('keydown',e=>{if(e.target.id==='uzmedV5Input'&&e.key==='Enter'&&(e.isComposing||e.keyCode===229))e.stopImmediatePropagation();},true);
  D.getElementById('uzmedV5Input')?.setAttribute('aria-label','UZMED AIga xabar');D.getElementById('uzmedV5Input')?.addEventListener('focus',adopt);D.getElementById('uzmedV5Input')?.addEventListener('input',()=>{adopt();clearTimeout(saveTimer);saveTimer=setTimeout(draft,300);});
  const saveNotice=node('p','ucs18-save-error');saveNotice.id='uzmedConversationSaveStatus';saveNotice.setAttribute('role','status');saveNotice.hidden=true;D.querySelector('#doktor-screen .ai-input-area')?.append(saveNotice);
  host.querySelectorAll('.uzmed-v5-msg.user').forEach(n=>seenUsers.add(n));new MutationObserver(()=>{captureUsers();capture();markChat();captureMedia();}).observe(host,{childList:true,subtree:true});
  W.addEventListener('uzmed:auth-change',()=>{const previous=ownerId;adopt();if(previous&&previous!==ownerId){suppressed=true;try{nativeClear();resetUI();lastNative=native();}finally{suppressed=false;}}const t=current();if(t&&ownerId){suppressed=true;try{restoreNative(t);paint(t);}finally{suppressed=false;}}render();});
  W.addEventListener('storage',e=>{if(ownerId&&e.key===PREFIX+encodeURIComponent(ownerId)){if(W.aiTyping||W.UZMEDAIBackendV5?.busy){tell('Tarix boshqa tabda yangilandi. Javob tugagach tarixni qayta oching.');return;}try{state=read(e.newValue);render();}catch(_){tell('Boshqa tabdagi tarix ochilmadi; mavjud yozuvlar saqlandi.');}}});
  W.addEventListener('pagehide',()=>{capture();draft();});adopt();const t=current();if(t){suppressed=true;try{restoreNative(t);paint(t);}finally{suppressed=false;}}D.documentElement.setAttribute('data-uzmed-conversations','v18');markChat();render();return true;
 }
 W.UZMEDConversations={open,newChat:fresh,currentId:()=>state?.activeId||null,list:()=>sorted().map(t=>({id:t.id,title:t.title,createdAt:t.createdAt,updatedAt:t.updatedAt,archived:t.archived,messages:t.messages.length})),capture,fileContext:()=>{adopt();const t=current();return t&&ownerId===owner()?{text:typeof t.fileContext==='string'?t.fileContext:'',summary:Array.isArray(t.fileSummary)?t.fileSummary:[]}:null;},setFileContext:value=>{adopt();const t=current();if(!t||ownerId!==owner()||!value||typeof value.text!=='string'||value.text.length>24000)return false;t.fileContext=value.text;t.fileSummary=(Array.isArray(value.summary)?value.summary:[]).slice(0,6).map(f=>({name:String(f.name||'').slice(0,180),mime:String(f.mime||'').slice(0,100),partial:!!f.partial,pages:Array.isArray(f.pages)?f.pages.slice(0,30):undefined,totalPages:Number(f.totalPages)||undefined}));return store();},refresh:()=>{adopt();render();}};
 if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>1200)clearInterval(timer);},100);}
})(typeof window==='object'?window:globalThis);
