/* Read-only, on-demand Derma reference workspace. Existing clinical stores stay intact. */
(function (W) {
 'use strict';
 const aliases = {
  ten:['toksik epidermal nekroliz','toxic epidermal necrolysis','layell','lyell','ten'],
  sjs:['stivens jonson','stivens djonson','stevens johnson','sjs'],
  ae:['kvinke','angioedema','angionevrotik shish'],bp:['bullez pemfigoid','bulyoz pemfigoid','pufakli pemfigoid','bullous pemphigoid'],
  pv:['oddiy pemfigus','pemfigus','pemfigus vulgaris','pemphigus vulgaris'],sle:['sistem qizil yuguruk','sistemali qizil yuguruk','sle','sqy'],
  lp:['yassi temiratki','lichen planus','likhen planus'],av:['allergik vaskulit'],
  ad:['atopik dermatit','atopic dermatitis','neyrodermit'],cd:['kontakt dermatit','kontaktli dermatit','allergik kontakt dermatit'],
  ur:['urtikariya','urtikaria','urticaria','eshakemi','eshakem','krapivnitsa'],
  ple:['polimorf yoruglik toshmasi','polymorphic light eruption'],fe:['fiksirlangan dori toshmasi','fixed drug eruption'],
  pso:['psoriaz','psoriasis','psoriazis','targil kasalligi'],aps:['artropatik targil','psoriatik artrit','psoriatic arthritis'],
  derma_sjs_ten:['sjs ten','sjs/ten'],nekrotik_fassiit:['nekrotizuvchi fassiit','nekrotik fassiit','necrotizing fasciitis'],
  eritroderma:['eritroderma','erythroderma'],eczema_herpeticum:['eczema herpeticum','ekzema herpetikum','herpetik ekzema'],
  meningokoksemiya:['meningokoksemiya','purpura fulminans'],seboreyik:['seboreyik dermatit','seboreya','seborrheic dermatitis'],
  pityriasis_rosea:['pityriasis rosea','pushti temiratki'],dermatofitoz:['dermatofitoz','tinea'],
  skabies:['skabies','qichima','qichimasi','scabies','qotir','chesotka'],herpes_zoster:['herpes zoster','belbog yara'],
  herpes_simplex:['herpes simplex','oddiy uchuq'],impetigo:['impetigo'],sellyulit:['sellyulit','erisipel','cellulitis','roja'],
  kandidoz:['kandidoz','candidiasis'],akne:['akne','acne','husnbuzar','husnbuzarlar','ugri'],
  rozatsea:['rozatsea','rosacea'],melanoma:['melanoma'],bazalioma:['bazalioma','bazal hujayrali karsinoma','bcc'],
  scc:['yassi hujayrali karsinoma','squamous cell carcinoma','scc'],aktinik_keratoz:['aktinik keratoz','actinic keratosis'],
  vitiligo:['vitiligo','oqtanir','oq doglar']
 };
 const linked={ten:'derma_sjs_ten',sjs:'derma_sjs_ten',pso:'psoriaz',ad:'derma_atopik',cd:'derma_kontakt',lp:'likhen_planus'};
 const imageTerms={ten:'layell',sjs:'stivens-djonson',ae:'angioedema',bp:'bulyoz pemfigoid',pv:'pemfigus',sle:'sistem qizil yuguruk',lp:'yassi temiratki',av:'allergik vaskulit',ad:'atopik dermatit',cd:'kontakt dermatit',ur:'urtikariya',ple:'polimorf yoruglik toshmasi',fe:'fiksirlangan dori toshmasi',pso:'psoriaz',aps:'psoriatik artrit',skabies:'qichima',dermatofitoz:'dermatofitoz'};
 const letters={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',қ:'q',ғ:'g',ҳ:'h',ў:'o'};
 function norm(x){return String(x||'').normalize('NFKC').toLowerCase().replace(/[а-яёқғҳў]/g,x=>letters[x]||x).replace(/[’ʻʼ‘'`]/g,'').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
 function title(r){return r.primary?.uz||r.specialist?.name||r.title||'';}
 function records(data){
  const specialist=new Map((data.specialist||[]).map(x=>[x.id,x]));
  const rows=Object.entries(data.clinical||{}).map(([key,primary])=>({key,primary,specialist:specialist.get(linked[key])||null}));
  const used=new Set(Object.values(linked));
  for(const r of specialist.values())if(!used.has(r.id))rows.push({key:r.id,specialist:r});
  // The combined SJS/TEN record remains separately searchable and keeps its own code.
  if(specialist.has('derma_sjs_ten'))rows.push({key:'derma_sjs_ten',specialist:specialist.get('derma_sjs_ten')});
  return rows;
 }
 function resolve(q,data){
  const s=norm(q);if(s.length<2||s.length>320)return {kind:'none',rows:[]};
  if(s==='ekzema'||s==='eczema'||/^(ekzema|eczema) (haqida|nima|rasmi|rasmlari|davolash)/.test(s))return {kind:'broad',query:'ekzema',rows:records(data).filter(r=>['ad','cd','eczema_herpeticum'].includes(r.key))};
  const hits=[];
  for(const r of records(data)){
   const names=[...(aliases[r.key]||[]),title(r),r.primary?.ru,r.primary?.mkb,r.specialist?.codes?.icd10].filter(Boolean);
   let score=0;
   for(const a of names){const t=norm(a);if(!t)continue;
    if((' '+s+' ').includes(' '+t+' ')||new RegExp('(?:^| )'+t+'(?:ning|ni|ga|da|dan)(?: |$)').test(s))score=Math.max(score,t.length);
   }
   if(score)hits.push({row:r,score});
  }
  // Explicit longer names win over an embedded shorter synonym (e.g. eczema herpeticum).
  hits.sort((a,b)=>b.score-a.score);
  if(!hits.length)return {kind:'none',rows:[]};
  const selected=hits.filter(h=>!hits.some(long=>long.score>h.score&&norm(title(long.row)).includes(norm(title(h.row)))));
  // A compound SJS/TEN request is not silently treated as either individual diagnosis.
  if(s==='sjs ten')return {kind:'match',rows:[records(data).find(r=>r.key==='derma_sjs_ten')]};
  return {kind:selected.length===1?'match':'ambiguous',rows:selected.map(h=>h.row)};
 }
 function imageQuery(r){return imageTerms[r.key]||aliases[r.key]?.[0]||'';}
 function allowedImage(url){if(/^\/api\/derma\/image\/[a-z0-9-]{4,40}$/i.test(url||''))return true;try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['upload.wikimedia.org','thumb.wikimedia.org'].includes(u.hostname);}catch(_){return false;}}
 function sourceUrl(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname==='commons.wikimedia.org'&&u.pathname.startsWith('/wiki/File:')?u.href:'';}catch(_){return '';}}
 function matchesImage(row,r){
  if(!row||!allowedImage(row.url))return false;
  const s=' '+norm(row.title)+' ';
  const terms=[...(aliases[r.key]||[]),imageQuery(r),r.primary?.ru].filter(Boolean).map(norm);
  if(r.key==='pso'&&/artrit|arthritis|zaxm|sifilis/.test(s))return false;
  if(r.key==='ad'&&/herpet|kontakt/.test(s))return false;
  if(r.key==='ten'&&/sjs|jonson|johnson/.test(s)&&!/nekroliz|necrolysis| ten /.test(s))return false;
  return terms.some(t=>t&&s.includes(' '+t+' '));
 }
 function publicQuery(q){return typeof q==='string'&&q.length<=100&&!/[0-9@/:\\<>\x00-\x1f]/.test(q)&&!/(?:bemor|patient|pasport|passport|token|secret|telefon)/i.test(q);}
 const api={norm,records,resolve,title,imageQuery,allowedImage,sourceUrl,matchesImage,publicQuery};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(typeof document==='undefined')return;
 W.UzmedDermaWorkspace=api;
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=String(text);return n;}
 function get(url,signal){return new Promise((resolve,reject)=>{
  const x=new XMLHttpRequest();x.open('GET',url,true);x.timeout=12000;x.setRequestHeader('Accept','application/json');
  x.onload=()=>{try{if(x.status!==200)throw Error();resolve(JSON.parse(x.responseText));}catch(_){reject(Error('reference_unavailable'));}};
  x.onerror=x.ontimeout=()=>reject(Error('reference_unavailable'));x.onabort=()=>reject(Error('cancelled'));
  if(signal){if(signal.aborted){reject(Error('cancelled'));return;}signal.addEventListener('abort',()=>x.abort(),{once:true});}x.send();
 });}
 let basePromise=null;
 function base(){if(!basePromise)basePromise=get('/assets/uzmed-derma-reference1.json').catch(e=>{basePromise=null;throw e;});return basePromise;}
 let mounted=false;
 function mount(){
  if(mounted)return true;
  const screen=document.getElementById('derma-screen');if(!screen)return false;
  // Inline legacy loaders may be installed after this async asset; gate only after they exist.
  if(typeof W.__uzLoadImageKB!=='function'||typeof W.showScreen!=='function'||typeof W.uzmedRenderDermaAtlas!=='function')return false;
  const head=screen.querySelector('.um-page-title');
  if(head){const h=head.querySelector('h1,h2');if(h)h.textContent='Derma';const p=head.querySelector('p');if(p)p.textContent='Kasallik haqida ma’lumot va unga mos klinik rasmlar.';}
  const workspace=el('section','udm-workspace');workspace.id='uzmedDermaWorkspace';workspace.setAttribute('aria-label','Dermatologiya ish muhiti');
  workspace.innerHTML='<form class="udm-search" id="udmSearchForm"><label for="udmQuery">Derma yordamchisiga savolingiz</label><div class="udm-search-row"><input id="udmQuery" type="search" maxlength="320" autocomplete="off" enterkeyhint="send" placeholder="Kasallik nomi yoki savolingiz…"><button type="submit">So‘rash</button></div><p class="udm-source">Teri, soch va tirnoq kasalliklari bo‘yicha.</p></form><p id="udmStatus" class="udm-status" role="status" aria-live="polite"></p><div id="udmChoices" class="udm-choices"></div><div id="udmResult"></div>';
  if(head)head.after(workspace);else screen.prepend(workspace);
  const legacy=el('div','udm-legacy');legacy.id='uzmedDermaLegacy';legacy.hidden=true;
  for(const node of [...screen.children])if(node!==head&&node!==workspace)legacy.append(node);
  screen.append(legacy);screen.setAttribute('data-derma-workspace','ready');
  // The old atlas renderer is retained, but navigation no longer expands 719 images.
  const old=W.uzmedRenderDermaAtlas;
  if(typeof old==='function')W.uzmedRenderDermaAtlas=function(){if(document.documentElement.getAttribute('data-uzmed-ux')==='off')return old.apply(this,arguments);return true;};
  if(W.uzmedRenderDermaAtlas)W.uzmedRenderDermaAtlas.__uzImgWrapped=1;
  api.legacyAtlas=old;
  let entering=false,explicitAtlas=false;
  document.addEventListener('click',e=>{if(e.target.closest?.('#nav-derma,[data-ux-rail="derma"],[onclick*="derma-screen"]')){entering=true;requestAnimationFrame(()=>{entering=false;});}},true);
  const oldLoad=W.__uzLoadImageKB,oldShow=W.showScreen;
  if(typeof oldLoad==='function')W.__uzLoadImageKB=function(cb){
   // Defer only the old navigation/visibility prefetch; explicit atlas consumers still work.
   if(!cb&&!explicitAtlas&&(entering||screen.classList.contains('active'))&&document.documentElement.getAttribute('data-uzmed-ux')!=='off')return;
   return oldLoad.apply(this,arguments);
  };
  if(typeof oldShow==='function'){
   const show=function(id){entering=id==='derma-screen';try{return oldShow.apply(this,arguments);}finally{entering=false;}};
   show.__uzImgWrapped=1;W.showScreen=show;
  }
  for(const name of ['uzmedOpenImageGallery','uzmedImageSearch','uzmedDermaImageSearch','uzmedImageContextForAI']){
   const previous=W[name];if(typeof previous!=='function')continue;
   const call=function(){explicitAtlas=true;try{return previous.apply(this,arguments);}finally{explicitAtlas=false;}};
   call.__uzImgWrapped=1;W[name]=call;
  }
  const input=workspace.querySelector('#udmQuery'),status=workspace.querySelector('#udmStatus'),choices=workspace.querySelector('#udmChoices'),result=workspace.querySelector('#udmResult');
  let seq=0,abort=null,current=null;
  W.addEventListener('uzmed:auth-change',()=>{++seq;api.cancelAI?.();abort?.abort();current=null;result.replaceChildren();choices.replaceChildren();input.value='';status.textContent='';empty();});
  function empty(){result.replaceChildren();const box=el('div','udm-empty');box.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 28c8-8 16-8 24 0s16 8 24 0M8 40c8-8 16-8 24 0s16 8 24 0M8 16c8-8 16-8 24 0s16 8 24 0"/></svg><h2>Kerakli ma’lumotni bir joyda toping</h2><p>Klinik belgilar, diagnostika, davolash va mos rasmlar — so‘rovingiz bo‘yicha.</p>';
   const chips=el('div','udm-examples');for(const q of ['Psoriaz','Akne','Atopik dermatit']){const b=el('button','',q);b.type='button';b.onclick=()=>search(q);chips.append(b);}box.append(chips);result.append(box);}
  function list(items){const ul=el('ul');for(const x of items||[]){if(typeof x==='string')ul.append(el('li','',x));}return ul;}
  function section(parent,title,text,items,open){if(!text&&!items?.length)return;const box=el('details','udm-section');box.open=!!open;box.append(el('summary','',title));if(text)box.append(el('p','udm-clinical-text',text));if(items?.length)box.append(list(items));parent.append(box);return box;}
  function aiBox(q,automatic){
   const box=el('section','udm-ai');box.setAttribute('aria-label','Derma AI yordamchisi');box.append(el('h3','','Derma AI yordamchisi'));
   box.append(el('p','udm-source','Faqat dermatologiya savollari. Suhbat ushbu bo‘limda alohida saqlanadi; yangi savolni yuqorida yozing.'));
   const actions=el('div','udm-ai-actions'),send=el('button','','Batafsil AI izohi'),cancel=el('button','udm-secondary','Bekor qilish');send.type=cancel.type='button';cancel.hidden=true;actions.append(send,cancel);box.append(actions);
   const state=el('p','udm-status');state.setAttribute('role','status');state.setAttribute('aria-live','polite');box.append(state);const answer=el('div','udm-ai-answer');box.append(answer);
   const script=document.createElement('script');if(!W.UzmedDermaAI&&!document.getElementById('udmAiScript')){script.id='udmAiScript';script.src='/assets/uzmed-derma-ai1.js';script.async=true;api.aiReady=new Promise((ok,fail)=>{script.onload=ok;script.onerror=()=>{script.remove();fail(Error('AI ulanishi yuklanmadi. Qayta urinib ko‘ring.'));};});api.aiReady.catch(()=>{});document.head.append(script);}
   let request=null;
   send.onclick=async()=>{
    request=new AbortController();const run=seq;send.disabled=true;cancel.hidden=false;state.textContent='AI so‘rovi yuborilmoqda…';answer.replaceChildren();
    try{await api.aiReady;if(!W.UzmedDermaAI)throw Error('AI ulanishi yuklanmadi. Qayta urinib ko‘ring.');if(run!==seq||!box.isConnected)return;const d=await W.UzmedDermaAI.ask(q,request.signal);if(run!==seq||!box.isConnected)return;state.textContent=d.outOfScope?'Derma doirasidagi savol kerak.':'AI javobi tayyor · '+String(d.model||'');const text=el('div','udm-clinical-text',d.text);answer.append(text);if(!d.outOfScope)answer.append(el('p','udm-source','AI izohi. Klinik qaror uchun keltirilgan manbalarni va bemorning holatini tekshiring.'));
     if(!current&&d.media?.type==='dermatology_images'){const found=resolve(d.media.query,await base());if(found.kind==='match'){const r=found.rows[0],rows=(d.media.images||[]).filter(x=>matchesImage(x,r));if(rows.length){const grid=el('div','udm-images');for(const row of rows)grid.append(imageCard(row));answer.append(grid);}}}
    }
    catch(e){if(run===seq&&box.isConnected)state.textContent=e.message==='cancelled'?'So‘rov bekor qilindi.':String(e.message||'AI javobi olinmadi.');}
    finally{send.disabled=false;cancel.hidden=true;request=null;}
   };
   cancel.onclick=()=>request?.abort();api.cancelAI=()=>request?.abort();if(automatic)queueMicrotask(()=>{if(box.isConnected)send.click();});return box;
  }
  function imageCard(row){
   const fig=el('figure','udm-image'),button=el('button','udm-image-open');button.type='button';button.setAttribute('aria-label',row.title+' rasmini kattalashtirish');
   const img=el('img');img.alt=row.title;img.src=row.url;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';button.append(img);fig.append(button);
   img.onerror=()=>{button.disabled=true;img.remove();button.append(el('span','','Rasm yuklanmadi.'));};
   const cap=el('figcaption');cap.append(el('strong','',row.title));cap.append(el('small','',[row.provider,row.source&&row.provider==='UZMED atlasi'?row.source:row.author,row.page?row.page+'-bet':'',row.license].filter(Boolean).join(' · ')));
   const ref=sourceUrl(row.source);if(ref){const a=el('a','','Manba va litsenziya ↗');a.href=ref;a.target='_blank';a.rel='noopener noreferrer';cap.append(a);}else cap.append(el('small','','Mavjud atlas materiali; foydalanish huquqi alohida tekshiriladi.'));
   fig.append(cap);button.onclick=()=>zoom(row);return fig;
  }
  function zoom(row){const dialog=el('dialog','udm-zoom');const close=el('button','udm-secondary','Yopish');close.type='button';dialog.setAttribute('aria-label',row.title);dialog.append(close);const img=el('img');img.src=row.url;img.alt=row.title;img.referrerPolicy='no-referrer';dialog.append(img);dialog.append(el('p','',row.title));document.body.append(dialog);const focus=document.activeElement;close.onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close();};dialog.onclose=()=>{dialog.remove();if(focus?.isConnected)focus.focus();};dialog.showModal();close.focus();}
  async function images(r,host,run,offset){
   const q=imageQuery(r);if(!publicQuery(q)){host.replaceChildren(el('p','udm-source','Bu mavzu uchun tasdiqlangan rasm qidiruvi mavjud emas.'));return;}
   const note=el('p','udm-source','Mos klinik rasmlar qidirilmoqda…');host.append(note);
   try{const d=await get('/api/derma/search?'+new URLSearchParams({q,limit:'4',offset:String(offset||0)}),abort.signal);if(run!==seq)return;note.remove();
    const all=Array.isArray(d.images)?d.images:[],rows=all.filter(x=>matchesImage(x,r));
    if(!rows.length)host.append(el('p','udm-source',all.length?'Klinik mosligi aniq bo‘lmagan rasmlar ko‘rsatilmadi.':'Mos klinik rasm topilmadi.'));
    let grid=host.querySelector('.udm-images');if(!grid){grid=el('div','udm-images');host.append(grid);}for(const row of rows)grid.append(imageCard(row));
    if(d.has_more&&Number.isSafeInteger(d.next_offset)&&d.next_offset>(offset||0)&&d.next_offset<=1000){const more=el('button','udm-secondary','Yana rasmlar');more.type='button';more.onclick=()=>{more.remove();images(r,host,run,d.next_offset);};host.append(more);}
   }catch(e){if(run!==seq)return;note.textContent='Rasmlarga ulanib bo‘lmadi. Klinik ma’lumotlar saqlanmoqda.';const retry=el('button','udm-secondary','Rasmlarni qayta yuklash');retry.type='button';retry.onclick=()=>{host.replaceChildren();images(r,host,run,0);};host.append(retry);}
  }
  function display(r,q,run){
   current=r;result.replaceChildren();choices.replaceChildren();const p=r.primary,s=r.specialist,card=el('article','udm-answer');card.dataset.referenceKey=r.key;
   card.append(el('h2','',title(r)));const tags=el('div','udm-tags');if(p?.mkb||s?.codes?.icd10)tags.append(el('span','','MKB-10: '+(p?.mkb||s.codes.icd10)));if(p?.sev||s?.emerg)tags.append(el('span','',p?.sev||(s.emerg?'Shoshilinch':'') ));card.append(tags);
   const warnings=[p?.chegara,...(s?.redFlags||[])].filter(Boolean);if(warnings.length){const warning=el('aside','udm-warning');warning.setAttribute('aria-label','Muhim klinik ogohlantirishlar');warning.append(el('h3','','Muhim ogohlantirishlar'));warning.append(list(warnings));card.append(warning);}
   section(card,'Kasallik haqida',p?.tarif,null,true);
   const mechanism=section(card,'Etiologiya va patofiziologiya',null,[...(s?.risk?.triggers||[]),...(s?.risk?.factors||[])],true)||section(card,'Etiologiya va patofiziologiya','Alohida etiologiya va patofiziologiya ushbu manbada berilmagan.',null,true);
   mechanism.append(el('p','udm-source','Yuqorida faqat mavjud manbaning omillari keltiriladi. Batafsil patofiziologiya alohida tasdiqlanmagan; uni AI savolida so‘rashingiz mumkin.'));
   section(card,'Klinik belgilar',p?.belgilar,s?.clinic?.typical,true);
   section(card,'Diagnostika',null,[...(s?.exam?.physical||[]),...(s?.labs?.signs||[]),...(s?.labs?.required||[]).map(x=>[x.name,x.why].filter(Boolean).join(' — '))]);
   section(card,'Differensial tashxis',p?.farq,(s?.dxRules?.ddx||[]).map(x=>[x.dx,x.hint].filter(Boolean).join(' — ')));
   section(card,'Davolash',p?.davolash,[...(s?.mgmt?.emergency||[]),...(s?.mgmt?.ebm||[])]);
   section(card,'Kuzatuv va asoratlar',null,[...(s?.mgmt?.followup||[]),...(s?.complications||[])]);
   section(card,'Asl ruscha ma’lumot',p?.rus_tarif);
   const sources=el('details','udm-section');sources.append(el('summary','','Manbalar va cheklovlar'));sources.append(el('p','udm-source','Mavjud UZMED ma’lumotnomasi. Klinik tekshiruv holati: tasdiqlanmagan. Yangilanish sanasi manbada berilmagan.'));
   if(s?.sources?.length)sources.append(list(s.sources));if(p&&s&&p.mkb!==s.codes?.icd10)sources.append(el('p','udm-source','Mutaxassislik yozuvi: '+s.name+' · MKB-10 '+s.codes?.icd10+'. Bu alohida manba; asosiy yozuvning kodi o‘zgartirilmagan.'));
   const legacyKey=p&&r.key;if(legacyKey){const original=el('button','udm-secondary','Asl yozuvni ochish');original.type='button';original.onclick=()=>W.openDermaModal?.(legacyKey);sources.append(original);}card.append(sources);
   const media=el('section','udm-media');media.append(el('h3','','Mos klinik rasmlar'));media.append(el('p','udm-source','O‘quv va klinik solishtirish uchun. Rasmning o‘zi tashxisni tasdiqlamaydi.'));const imagesHost=el('div');media.append(imagesHost);card.append(media);result.append(card);
   const directQuestion=/\b(?:nima|qanday|nega|qachon|davola\w*|patofizio\w*|etiolog\w*|haqida)\b/i.test(norm(q));
   result.append(aiBox(directQuestion?q:title(r)+': etiologiya, patofiziologiya, diagnostika va davolash haqida manbalarga tayangan holda tushuntiring.',directQuestion));
   status.textContent='Mavjud manbadagi ma’lumotlar topildi.';images(r,imagesHost,run,0);
  }
  async function search(q){
   q=String(q||'').trim().slice(0,320);if(!q){status.textContent='Kasallik nomi yoki Derma savolini yozing.';input.focus();return;}
   const run=++seq;api.cancelAI?.();abort?.abort();abort=new AbortController();current=null;input.value=q;status.textContent='Ma’lumotnomadan qidirilmoqda…';result.replaceChildren();choices.replaceChildren();
   try{const data=await base();if(run!==seq)return;const found=resolve(q,data);
    if(found.kind==='match'){display(found.rows[0],q,run);return;}
    if(found.kind==='ambiguous'||found.kind==='broad'){status.textContent=found.kind==='broad'?'Ekzema bir nechta holatda uchraydi. Qaysi turini ko‘rmoqchisiz?':'Bir nechta kasallik nomi topildi. Keraklisini tanlang.';for(const r of found.rows){const b=el('button','udm-secondary',title(r));b.type='button';b.onclick=()=>{const n=++seq;abort.abort();abort=new AbortController();display(r,q,n);};choices.append(b);}}
    else status.textContent='Bu savol bo‘yicha aniq ma’lumotnoma yozuvi topilmadi. AI izohi orqali davom ettirishingiz mumkin.';
    result.append(aiBox(q,found.kind==='none'));
   }catch(_){if(run===seq){status.textContent='Ma’lumotnoma yuklanmadi. Qayta urinib ko‘ring.';const b=el('button','udm-secondary','Qayta urinish');b.type='button';b.onclick=()=>search(q);result.append(b);}}
  }
  workspace.querySelector('form').onsubmit=e=>{e.preventDefault();search(input.value);};api.search=search;api.getCurrent=()=>current;empty();mounted=true;return true;
 }
 if(!mount()){let tries=0;const timer=setInterval(()=>{if(mount()||++tries>=50)clearInterval(timer);},100);}
})(typeof window==='undefined'?globalThis:window);
