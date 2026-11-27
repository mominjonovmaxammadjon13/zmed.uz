/* Clinical authoring controls. No observation is selected without a doctor's action. */
(function(W,D){
 'use strict';
 function mount(){
 const $=id=>D.getElementById(id),kit=W.UzmedQabul,focus=W.QabulFocus;
 if(!kit||!focus)return;
 const node=(tag,text,cls)=>{const n=D.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const btn=(text,fn,cls='qc-choice')=>{const b=node('button',text,cls);b.type='button';b.onclick=fn;return b;};
 const signal=n=>n.dispatchEvent(new W.Event('input',{bubbles:true}));
 const changed=()=>{$('approved').checked=false;W.dispatchEvent(new W.CustomEvent('qabul:document-edit'));kit.render();};
 const writable=()=>{try{return W.UZMEDVisitBridge?.read().readOnly!==true;}catch{return false;}};
 const blocks=[],extra={version:1,choices:{},generated:{},differential:'',diagnostic_plan:'',test_notes:'',followup_date:'',med_mode:'cards',diets:[],diet_edits:{}};
 const safeCopy=v=>JSON.parse(JSON.stringify(v));
 function append(target,text){const n=$(target),lines=n.value.split('\n');if(lines.some(x=>x.trim().toLowerCase()===text.trim().toLowerCase()))return false;const next=[n.value,text].filter(Boolean).join('\n');if(next.length>n.maxLength){focus.status('Maydon hajmi oshdi. Matn qisqartirilmadi.');return false;}n.value=next;signal(n);return true;}
 function replaceLine(target,key,text){
  const field=$(target),old=extra.generated[key]||'';let value=field.value;
  // Only replace exactly the text inserted by this control. Preserve doctor's edits.
  if(old){const lines=value.split('\n'),at=lines.indexOf(old);if(at>=0){lines.splice(at,1,...(text?[text]:[]));value=lines.join('\n');}else if(text)value=[value,text].filter(Boolean).join('\n');}
  else if(text&&!value.split('\n').includes(text))value=[value,text].filter(Boolean).join('\n');
  if(value.length>field.maxLength){focus.status('Maydon hajmi oshdi. Matn qisqartirilmadi.');return false;}
  field.value=value;extra.generated[key]=text;signal(field);return true;
 }
 function choiceBlock(target,rows,normal=false){
  const host=node('div',undefined,'qc-observations'),entries=[];host.dataset.qcTarget=target;
  if(normal){const all=btn('✓ Norma',()=>{if(!writable())return;for(const row of entries){if(!extra.choices[row.key]?.length&&row.normal!==null)row.select(row.normal);}renderChoices();changed();},'qc-primary');host.append(all,node('p','Faqat bo‘sh variantlarni belgilaydi; mavjud tanlovlar saqlanadi.','minor'));}
  for(const [label,options,normalIndex,multi]of rows){
   const key=target+':'+label,group=node('fieldset',undefined,'qc-observation'),legend=node('legend',label),choices=node('div',undefined,'qc-chips');group.append(legend,choices);host.append(group);
   const entry={key,normal:normalIndex===undefined?null:normalIndex,buttons:[],select(index){
    const old=extra.choices[key]||[];let selected=old.includes(index)?old.filter(v=>v!==index):multi?[...old,index]:[index];if(multi&&normalIndex!==undefined&&normalIndex!==null){if(index===normalIndex&&!old.includes(index))selected=[index];else if(index!==normalIndex)selected=selected.filter(i=>i!==normalIndex);}
    const text=selected.length?label+': '+selected.map(i=>options[i]).join(', ')+'.':'';
    if(!replaceLine(target,key,text))return;extra.choices[key]=selected;renderChoices();changed();
   }};
   options.forEach((value,index)=>{const b=btn(value,()=>{if(writable())entry.select(index);});b.dataset.qcOption=index;b.setAttribute('aria-pressed','false');choices.append(b);entry.buttons.push(b);});entries.push(entry);
  }
  $(target).before(host);blocks.push({host,entries});return host;
 }
 function renderChoices(){for(const {entries}of blocks)for(const {key,buttons}of entries)buttons.forEach((b,i)=>{const on=Array.isArray(extra.choices[key])&&extra.choices[key].includes(i);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
 choiceBlock('field-history',[
 ['Kasallik boshlanishi',['To‘satdan','Asta-sekin','Aniq emas','Tug‘ilgandan beri']],['Qachondan beri',['Soat','1 kun','2–3 kun','1 hafta','1 oy','Uzoq vaqtdan beri','Boshqa','4–6 kun','2 hafta','2–4 hafta','Bir necha oy','Bir yildan ortiq']],['Kechishi',['O‘tkir','O‘tkir osti','Surunkali','Qaytalanuvchi']],['Belgilar dinamikasi',['Kuchaygan','Kamaygan','O‘zgarishsiz','Davriy','Kuchayib-pasayib turadi']],['Kasallikni nima bilan bog‘laydi',['Sovuq qotish','Ovqatlanish','Jismoniy zo‘riqish','Stress','Jarohat','Infeksiya','Bog‘lamaydi','Boshqa','Chang','Gul changi','Hayvon bilan kontakt','Dori','Hasharot chaqishi','Kasbiy ta’sir'],null,true],['Oldin davolanganmi',['Yo‘q','Ha']]
 ]);
 choiceBlock('life',[
 ['O‘tkazgan kasalliklari',['Gipertoniya','Qandli diabet','YuIK','Infarkt','Insult','Gepatit','Sil','Yo‘q','Boshqa'],7,true],['Operatsiyalar',['Bo‘lmagan','Bo‘lgan'],0],['Jarohatlar',['Bo‘lmagan','Bo‘lgan'],0],['Allergologik anamnez',['Allergiya yo‘q','Doriga','Ovqatga','Boshqa'],null,true],['Doimiy qabul qiladigan dorilar',['Yo‘q','Ha'],null],['Qon quyish',['Bo‘lmagan','Bo‘lgan'],0],['Chekish',['Chekmaydi','Chekadi'],0],['Alkogol',['Iste’mol qilmaydi','Iste’mol qiladi'],0],['Irsiy anamnez',['Og‘irlashmagan','Og‘irlashgan'],0]
 ],true);
 choiceBlock('epidemiology',[
 ['Infeksion bemor bilan kontakt',['Bo‘lmagan','Bo‘lgan','Noma’lum'],0],['Oxirgi vaqtda safar',['Bo‘lmagan','Bo‘lgan'],0],['Gepatit bilan kontakt',['Yo‘q','Ha'],0],['Sil bilan kontakt',['Yo‘q','Ha'],0],['Qon / biologik suyuqlik bilan kontakt',['Yo‘q','Ha'],0],['Oxirgi operatsiya / invaziv muolaja',['Yo‘q','Ha'],0],['Stomatologik muolaja',['Yo‘q','Ha'],0]
 ],true);
 choiceBlock('field-exam',[
 ['Umumiy ahvoli',['Qoniqarli','O‘rta og‘ir','Og‘ir','O‘ta og‘ir'],0],['Hushi',['Tiniq','Somnolent','Sopor','Koma'],0],['Holati',['Faol','Passiv','Majburiy'],0],['Tana tuzilishi',['Normostenik','Astenik','Giperstenik'],null],['Teri va shilliq qavatlar',['Oddiy rangda','Oqargan','Sarg‘aygan','Sianoz','Giperemiya','Marmarsimon rang'],0],['Shish',['Yo‘q','Bor'],0],['Limfa tugunlari',['Kattalashmagan','Kattalashgan'],0],['Nafas',['Vezikulyar','Susaygan','Qattiq','Bronxial','Bir tomonda eshitilmaydi'],0],['Xirillashlar',['Yo‘q','Quruq','Nam','Krepitatsiya','Plevra ishqalanish shovqini'],0,true],['Yurak tonlari',['Aniq','Bo‘g‘iq'],0],['Ritm',['To‘g‘ri','Noto‘g‘ri'],0],['Shovqin',['Yo‘q','Bor'],0],['Til',['Nam, toza','Quruq','Karash bilan qoplangan'],0],['Qorin',['Yumshoq','Tarang','Dam'],0],['Palpatsiyada',['Og‘riqsiz','Og‘riqli','Yuzaki og‘riqli','Chuqur palpatsiyada og‘riqli'],0],['Peristaltika',['Saqlangan','Susaygan','Kuchaygan','Eshitilmaydi'],0],['Jigar va taloq',['Kattalashmagan','Kattalashgan'],0],['Siydik ajratish',['Erkin','Qiyinlashgan','Og‘riqli'],0],['Pasternatskiy simptomi',['Manfiy','Musbat','O‘ngda musbat','Chapda musbat','Ikki tomonda musbat'],0]
 ],true);
 choiceBlock('neuro',[
 ['Oriyentatsiya',['Saqlangan','Buzilgan'],0],['Nutq',['Saqlangan','Buzilgan'],0],['Qorachiqlar',['D=S','D>S','D<S'],0],['Yorug‘likka reaksiya',['Jonli','Susaygan','Yo‘q'],0],['Yuz simmetriyasi',['Simmetrik','Asimmetrik'],0],['Mushak kuchi',['Saqlangan','Pasaygan'],0],['Mushak tonusi',['Normal','Oshgan','Pasaygan'],0],['Reflekslar',['Saqlangan','Kuchaygan','Pasaygan'],0],['Sezuvchanlik',['Saqlangan','Buzilgan'],0],['Meningeal belgilar',['Yo‘q','Bor'],0],['Koordinatsiya',['Buzilmagan','Buzilgan'],0],['Fokal nevrologik simptomlar',['Yo‘q','Bor'],0]
 ],true);
 // Native free text remains editable alongside structured observations.
 const vitals=node('div',undefined,'qc-vitals');
 for(const [key,label,unit,min,max]of [['temperature','Tana harorati','°C',25,45],['bp','AQB','mm sim. ust.',0,0],['pulse','Puls','/min',1,300],['hr','YuQS','/min',1,300],['rr','Nafas soni','/min',1,100],['spo2','SpO₂','%',1,100]]){
  const l=node('label',label+', '+unit),i=node('input');i.id='qc-vital-'+key;i.dataset.qcVital=key;i.type=key==='bp'?'text':'number';i.maxLength=20;if(key!=='bp'){i.min=min;i.max=max;i.step='0.1';}else i.pattern='[0-9]{2,3}/[0-9]{2,3}';
  i.oninput=()=>{if(!writable()||!i.checkValidity())return;replaceLine('field-exam','vital:'+key,i.value?label+': '+i.value+' '+unit+'.':'');changed();};l.append(i);vitals.append(l);
 }
 for(const id of ['weight','height'])vitals.append($(id).closest('.field'));vitals.append($('bmi'));
 const phraseCatalog=W.UZMEDClinicalPhraseCatalog||{};
 const normalizePhrase=text=>text.toLocaleLowerCase('uz').replace(/['‘’ʻʼ`]/g,'').trim();
 const normalizeExam=text=>normalizePhrase(text)
  .replace(/\bsox/g,'soh')
  .replace(/\bsoha(?:si(?:da|ni|ning)?|da|ni|ning)?\b/g,'soha')
  .replace(/\b[xh]ush(?:i|ida|ining)?\b/g,'hush')
  .replace(/\bxarak/g,'harak');
 const uniquePhrases=phrases=>[...new Map(phrases.map(text=>[normalizePhrase(text),text])).values()];

 function phraseSelection(target){
  const field=$(target),buttons=new Map();
  function refresh(){
   const selected=new Set(field.value.split('\n')),locked=!writable();
   for(const [text,button] of buttons){
    const on=selected.has(text);
    if(button.getAttribute('aria-pressed')!==String(on)){
     button.classList.toggle('selected',on);
     button.setAttribute('aria-pressed',String(on));
     button.lastChild.textContent=on?'✓':'+';
    }
    if(button.disabled!==locked)button.disabled=locked;
   }
  }
  for(const event of ['qabul:restored','qabul:session-ready','qabul:document-edit'])W.addEventListener(event,refresh);
  field.addEventListener('input',refresh);
  return {
   clear(){buttons.clear();},
   add(text){
    const button=btn(text,()=>{
     if(!writable())return;
     if(field.value.split('\n').includes(text)){
      const lines=field.value.split('\n');
      lines.splice(lines.indexOf(text),1);
      field.value=lines.join('\n');
      signal(field);
     }else if(!append(target,text))return;
     changed();
    },'qc-choice qc-phrase-choice');
    const mark=node('span','+','qc-phrase-mark');
    mark.setAttribute('aria-hidden','true');
    button.append(mark);
    buttons.set(text,button);
    return button;
   },
   refresh
  };
 }

 // Move the existing observations into the same topic as their descriptive phrases.
 function organizeObservations(target,topics){
  const host=D.querySelector('[data-qc-target="'+target+'"]')||choiceBlock(target,[]);
  const rows=new Map([...host.querySelectorAll('fieldset')].map(row=>[row.firstChild.textContent,row]));
  const picker=phraseSelection(target);
  const library=phraseCatalog.sections?.[target]||{};
  const folder=node('div',undefined,'qc-topics');
  const heading=node('p','Tegishli mavzuni ochib, kuzatilgan variantlarni belgilang.','minor qc-topic-help');
  host.append(heading,folder);
  for(const [title,labels,noteGroups=[title]] of topics){
   const section=node('details',undefined,'qc-topic');
   section.append(node('summary',title));
   const body=node('div',undefined,'qc-topic-body');
   for(const label of labels){
    const row=label==='vitals'?vitals:rows.get(label);
    if(row)body.append(row);
   }
   const notes=node('div',undefined,'qc-chips qc-topic-phrases');
   for(const phrase of uniquePhrases(noteGroups.flatMap(key=>library[key]||[])))notes.append(picker.add(phrase));
   if(notes.children.length)body.append(notes);
   section.append(body);
   folder.append(section);
  }
  picker.refresh();
 }
 organizeObservations('field-exam',[
  ['Umumiy holat',['Umumiy ahvoli','Hushi','Holati','Tana tuzilishi','Teri va shilliq qavatlar','Shish','Limfa tugunlari'],['Umumiy']],
  ['Hayotiy ko‘rsatkichlar',['vitals'],[]],
  ['Nafas tizimi',['Nafas','Xirillashlar']],
  ['Yurak-qon tomir',['Yurak tonlari','Ritm','Shovqin']],
  ['Hazm va siydik',['Til','Qorin','Palpatsiyada','Peristaltika','Jigar va taloq','Siydik ajratish','Pasternatskiy simptomi']],
  ['Teri, ko‘z va LOR',[],['Teri va LOR']]
 ]);
 organizeObservations('neuro',[
  ['Hush va nutq',['Oriyentatsiya','Nutq']],
  ['Bosh miya nervlari',['Qorachiqlar','Yorug‘likka reaksiya','Yuz simmetriyasi']],
  ['Harakat va sezuvchanlik',['Mushak kuchi','Mushak tonusi','Reflekslar','Sezuvchanlik','Fokal nevrologik simptomlar']],
  ['Koordinatsiya va meningeal belgilar',['Meningeal belgilar','Koordinatsiya']]
 ]);
 organizeObservations('localis',[
  ['Teri va shilliq qavat',[]],
  ['Yara va shish',[]],
  ['Bo‘g‘im va yumshoq to‘qima',[]]
 ]);

 function complaintSuggestions(field,phrases,{id='qcComplaintSuggestions',title='Mos tayyor shikoyatlar',durationTemplates=[],symptoms=[],lookup,normalize=normalizePhrase}={}){
  const box=node('section',undefined,'qc-complaint-suggestions');
  const list=node('div',undefined,'qc-complaint-suggestion-list');
  box.id=id;
  box.setAttribute('aria-label',title);
  box.append(node('h4',title),list);
  field.setAttribute('aria-controls',box.id);
  field.after(box);
  // A symptom fragment in a history should rank above unrelated narrative prefixes.
  const indexEntries=entries=>entries.map(({text,symptom})=>{
   const key=normalize(text);
   return {text,key,words:' '+key,tokens:key.split(/\s+/),symptom};
  });
  const index=indexEntries([...symptoms.map(text=>({text,symptom:true})),...phrases.map(text=>({text,symptom:false}))]);
  let revision=0,lookupTimer,lookupController,lookupTimeout;
  function cancelLookup(){clearTimeout(lookupTimer);clearTimeout(lookupTimeout);lookupController?.abort();}
  const token=/[\p{L}\p{N}'‘’ʻʼ`-]+/gu;
  const wordChar=/[\p{L}\p{N}'‘’ʻʼ`-]/u;
  const durationPattern=/(?:^|(?<=[\s:.,;]))(?:(?:bemor(?:ning[ \t]+aytishicha,?|[ \t]+o[‘’ʻʼ']?zini)?|ota-onaning[ \t]+aytishicha,?[ \t]+bolada)[ \t]+)?(\d{1,4}(?:[.,]\d{1,2})?|bir|ikki|uch|to[‘’ʻʼ']?rt|besh|olti|yetti|sakkiz|to[‘’ʻʼ']?qqiz|o[‘’ʻʼ']?n)[ \t]*(soat|kun|hafta|oy|yil)(?:dan)?(?:[ \t]+beri)?(?:[ \t]+([\p{L}'‘’ʻʼ` -]*))?$/iu;
  function orderedMatch(tokens,query){
   let at=0;
   return query.split(' ').every(word=>{
    while(at<tokens.length&&!tokens[at].startsWith(word))at++;
    return at++<tokens.length;
   });
  }
  function hide(){revision++;cancelLookup();if(!box.hidden){box.hidden=true;list.replaceChildren();}}
  function update(){
   cancelLookup();const request=++revision;
   const value=field.value,end=field.selectionEnd;
   if(!writable()||field.disabled||field.readOnly||field.selectionStart!==end||wordChar.test(value[end]||'')){hide();return;}
   const prefix=value.slice(0,end).match(/[\p{L}\p{N}'‘’ʻʼ`-]+(?:[ \t]+[\p{L}\p{N}'‘’ʻʼ`-]+){0,7}[ \t]*$/u)?.[0];
   const words=prefix?[...prefix.matchAll(token)]:[];
   const duration=durationTemplates.length?value.slice(0,end).match(durationPattern):null;
   const shortQuery=!words.some(word=>normalize(word[0]).length>=2);
   if(!duration&&shortQuery){hide();return;}
   const queries=(shortQuery?[]:words).map(word=>{
    const start=end-prefix.length+word.index;
    return {start,key:normalize(value.slice(start,end)).replace(/\s+/g,' ')};
   }).filter(query=>query.key.length>=2);
   const results=[];
   if(duration&&(!/^\d/.test(duration[1])||Number(duration[1].replace(',','.'))>0)){
    const interval=duration[1]+' '+duration[2].toLowerCase()+'dan';
    const query=normalizePhrase(duration[3]||'').replace(/\s+/g,' ');
    for(const template of durationTemplates){
     const text=template.replace('{duration}',interval);
     const key=normalizePhrase(text);
     if(query&&!orderedMatch(key.split(/\s+/),query))continue;
     results.push({text,start:duration.index,rank:!query&&template.includes('____')?-2:-1});
    }
   }
   function collect(entries){const found=[];
   for(const {text,key,words:labelWords,tokens,symptom} of entries){
    for(const [i,query] of queries.entries()){
     if(key===query.key)break;
     const direct=key.startsWith(query.key);
     let matches=direct||labelWords.includes(' '+query.key);
     if(!matches&&query.key.includes(' ')){
      matches=orderedMatch(tokens,query.key);
     }
     if(!matches)continue;
     found.push({text,start:query.start,rank:i*4+Number(!direct)+Number(!symptom)*2});
     break;
    }
   }
   return found;}
   if(!duration)results.push(...collect(index));
   function render(names=[]){
   const wasHidden=box.hidden;
   const matches=results.concat(collect(indexEntries(names.map(text=>({text,symptom:true})))));
   matches.sort((a,b)=>a.rank-b.rank||a.text.length-b.text.length);
   const distinct=[],seen=new Set();
   for(const item of matches){
    const key=normalize(item.text);
    if(!seen.has(key)){seen.add(key);distinct.push(item);}
   }
   list.replaceChildren(...distinct.slice(0,16).map(({text,start})=>btn(text,()=>{
    if(!writable()||field.disabled||field.readOnly||field.value!==value){hide();return;}
    if(field.maxLength>=0&&value.length-end+start+text.length>field.maxLength){
     focus.status('Maydon hajmi oshdi. Matn qisqartirilmadi.');return;
    }
    field.focus({preventScroll:true});
    field.setRangeText(text,start,end,'end');
    signal(field);changed();hide();
   },'qc-complaint-suggestion')));
   box.hidden=!list.children.length;
   if(wasHidden&&!box.hidden&&D.activeElement===field&&W.matchMedia('(max-width: 650px)').matches)list.firstElementChild?.scrollIntoView({block:'nearest'});
   }
   render();
   const query=words.at(-1)?.[0]||'';
   if(lookup&&/^[\p{L}][\p{L}'‘’ʻʼ`-]{1,49}$/u.test(query)){
    lookupController=new W.AbortController();const controller=lookupController;
    const receive=names=>{
     if(controller.signal.aborted||request!==revision||field.value!==value||field.selectionStart!==end||field.selectionEnd!==end||D.activeElement!==field||!writable()||field.readOnly||field.disabled)return;
     render(names);
    };
    lookupTimer=setTimeout(async()=>{
     const timeout=setTimeout(()=>controller.abort(),6500);lookupTimeout=timeout;
     try{receive(await lookup(query,{signal:controller.signal,onNames:receive}));}catch{}finally{clearTimeout(timeout);}
    },300);
   }
  }
  field.addEventListener('input',event=>{
   if(event.isComposing||D.activeElement!==field){hide();return;}
   update();
  });
  field.addEventListener('compositionend',update);
  field.addEventListener('click',update);
  field.addEventListener('focus',update);
  field.addEventListener('keyup',event=>{
   if(!box.hidden&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))update();
  });
  field.addEventListener('keydown',event=>{
   if(box.hidden)return;
   if(event.key==='Escape'){event.preventDefault();hide();}
   if(event.key==='ArrowDown'&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){
    event.preventDefault();list.firstElementChild?.focus();
   }
  });
  list.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();field.focus({preventScroll:true});hide();}
   const next=event.key==='ArrowDown'?event.target.nextElementSibling:event.key==='ArrowUp'?event.target.previousElementSibling:null;
   if(next){event.preventDefault();next.focus();}
  });
  D.addEventListener('pointerdown',event=>{if(event.target!==field&&!box.contains(event.target))hide();});
  for(const event of ['qabul:restored','qabul:session-ready','qabul:clinical-locked'])W.addEventListener(event,hide);
  hide();
 }

 function phrasePicker(data,allergy={},settings={}){
  const {target='field-complaints',title='Tayyor shikoyatlar',noun='shikoyat',searchLabel='Shikoyatni qidirish',suggestionTitle='Mos tayyor shikoyatlar',suggestionId='qcComplaintSuggestions'}=settings;
  const picker=phraseSelection(target);
  const observations=settings.observations;
  const normalize=settings.normalize||normalizePhrase;

  const host=node('section',undefined,'qc-library qc-complaints');
  if(target!=='field-complaints')host.classList.add('qc-history-library');
  host.dataset.phraseTarget=target;
  host.append(node('h3',title));
  const search=node('input');
  search.type='search';
  search.placeholder=searchLabel+'…';
  search.setAttribute('aria-label',searchLabel);
  const category=node('select'),subgroup=node('select');
  category.setAttribute('aria-label',title+' toifasi');
  subgroup.setAttribute('aria-label','Allergik shikoyatlar mavzusi');
  const compare=new Intl.Collator('uz').compare;
  const sorted=phrases=>uniquePhrases(phrases).sort((a,b)=>Number(a.includes('____'))-Number(b.includes('____'))||compare(a,b));
  const entries=Object.fromEntries(Object.entries(data).map(([key,phrases])=>[key,sorted(phrases)]));
  const all=sorted(Object.values(entries).flat());
  const option=(name,phrases)=>{const item=node('option',name+' ('+phrases.length+')');item.value=name;return item;};
  category.append(option('Barchasi',all),...Object.entries(entries).map(([key,phrases])=>option(key,phrases)));
  if(entries.Allergik)subgroup.append(option('Barcha mavzular',entries.Allergik),...Object.entries(allergy).map(([key,phrases])=>option(key,phrases)));
  if(observations){
   const short=node('option','Qisqa belgilar');short.value='__structured';category.append(short);
   observations.classList.add('qc-history-choices');
  }
  const filters=node('div',undefined,'qc-complaint-filters');
  filters.append(category,subgroup);
  const result=node('p','','minor qc-complaint-count');
  result.setAttribute('role','status');
  const list=node('div',undefined,'qc-chips qc-complaint-list');
  list.setAttribute('role','region');
  list.setAttribute('aria-label',title+' ro‘yxati');
  list.tabIndex=0;
  const pageSize=36;
  let matches=[];
  function appendPage(){
   const offset=list.children.length;
   const batch=D.createDocumentFragment();
   for(const text of matches.slice(offset,offset+pageSize))batch.append(picker.add(text));
   list.append(batch);
   picker.refresh();
   result.textContent=matches.length?list.children.length+' / '+matches.length+' ta '+noun:'Mos '+noun+' topilmadi. Yuqoridagi maydonga qo‘lda yozishingiz mumkin.';
  }
  list.addEventListener('scroll',()=>{
   if(list.children.length>=matches.length)return;
   if(list.scrollHeight-list.scrollTop-list.clientHeight<=160)appendPage();
  },{passive:true});
  function draw(){
   if(observations){
    const structured=category.value==='__structured';
    observations.hidden=!structured;
    if(structured){
     subgroup.hidden=true;list.hidden=true;
     const words=normalize(search.value).split(/\s+/).filter(Boolean);
     let count=0;
     for(const row of observations.querySelectorAll('fieldset')){
      for(const button of row.querySelectorAll('button')){
       const text=normalize(row.querySelector('legend').textContent+' '+button.textContent);
       button.hidden=!words.every(word=>text.includes(word));
       if(!button.hidden)count++;
      }
      row.hidden=![...row.querySelectorAll('button')].some(button=>!button.hidden);
     }
     result.textContent=count+' ta qisqa belgi';return;
    }
   }
   const allergySelected=category.value==='Allergik';
   subgroup.hidden=!allergySelected;
   const source=allergySelected&&allergy[subgroup.value]?sorted(allergy[subgroup.value]):entries[category.value]||all;
   const words=normalize(search.value).split(/\s+/).filter(Boolean);
   matches=words.length?source.filter(text=>{
    const label=normalize(text);
    return words.every(word=>label.includes(word));
   }):source;
   list.replaceChildren();
   list.scrollTop=0;
   list.hidden=!matches.length;
   picker.clear();
   appendPage();
  }
  search.oninput=subgroup.onchange=draw;
  category.onchange=()=>{subgroup.selectedIndex=0;draw();};
  host.append(filters,result,list);
  if(observations)host.append(observations);
  $(target).after(host);
  complaintSuggestions($(target),all,{id:suggestionId,title:suggestionTitle,durationTemplates:target==='field-history'?phraseCatalog.historyDurationTemplates||[]:[],symptoms:settings.symptoms||[],normalize});
  draw();
 }

 // Keep previously available phrases in the catalog when expanding it.
 const complaints={Umumiy:['Holsizlik','Ishtaha pasayishi','Isitma','Terlash','Tez charchash','Titroq','Tunda terlash','Uyquchanlik','Uyqusizlik','Vazn ortishi','Vazn yo‘qotish'],Allergik:Object.values(phraseCatalog.allergy||{}).flat(), 'Nafas tizimi':['Yo‘tal','Balg‘am','Nafas qisishi','Hansirash','Ko‘krak og‘rig‘i'], 'Hazm tizimi':['Ko‘ngil aynishi','Qusish','Qorin og‘rig‘i','Jig‘ildon qaynashi','Ich ketishi','Ich qotishi','Qorin dam bo‘lishi'],Nevrologik:['Bosh og‘rig‘i','Bosh aylanishi','Uvishish','Hushdan ketish','Tremor'], 'Yurak-qon tomir':['Yurak urishi','Ko‘krakda og‘riq','Oyoqlarda shish'], 'Siydik tizimi':['Siydik ajratishda og‘riq','Tez-tez siyish','Bel og‘rig‘i'], 'Tayanch-harakat':['Bo‘g‘im og‘rig‘i','Mushak og‘rig‘i','Harakat cheklanishi'],LOR:['Tomoq og‘rig‘i','Quloq og‘rig‘i','Burun bitishi'],'Ko‘z':['Ko‘rish pasayishi','Ko‘z og‘rig‘i'],Teri:['Teri qizarishi','Teri qurishi']};
 for(const [category,phrases] of Object.entries(phraseCatalog.complaints||{})){
  complaints[category]=[...(complaints[category]||[]),...phrases];
 }
 phrasePicker(complaints,phraseCatalog.allergy||{});
 for(const [target,title] of [['field-history','Tayyor kasallik anamnezi'],['life','Tayyor hayot anamnezi'],['epidemiology','Tayyor epidemiologik anamnez']]){
  phrasePicker(phraseCatalog.sections?.[target]||{},{},{target,title,noun:'anamnez varianti',searchLabel:'Anamnezni qidirish',
   suggestionTitle:'Mos tayyor anamnezlar',suggestionId:'qcHistorySuggestions-'+target,symptoms:target==='field-history'?uniquePhrases(Object.values(complaints).flat()):[],
   observations:D.querySelector('[data-qc-target="'+target+'"]')});
 }
 for(const [target,title] of [['field-exam','Tayyor obyektiv ko‘rik'],['neuro','Tayyor nevrologik status'],['localis','Tayyor status localis']]){
  phrasePicker(phraseCatalog.sections?.[target]||{},{},{target,title,noun:'ko‘rik varianti',searchLabel:'Ko‘rikni qidirish',suggestionTitle:'Mos tayyor ko‘rik bayonlari',suggestionId:'qcExamSuggestions-'+target,normalize:normalizeExam,observations:D.querySelector('[data-qc-target="'+target+'"]')});
 }
 async function medicineNames(query,{signal,onNames}){
  if(!W.UZMEDDrugWorkspace?.lookup)return [];
  const sources={};
  const names=rows=>{
   const found=new Map();
   for(const row of rows){
    if(row.clinicalBlock)continue;
    for(const raw of [row.name,row.inn]){
     if(typeof raw!=='string'||raw.length>200||/[<>\r\n]/u.test(raw))continue;
     const text=raw.trim(),key=normalizePhrase(text);
     if(text.length>=2&&!found.has(key))found.set(key,text);
    }
   }
   return [...found.values()];
  };
  const result=await W.UZMEDDrugWorkspace.lookup(query,{signal,limit:12,onSource:(key,rows)=>{sources[key]=rows;onNames(names(Object.values(sources).flat()));}});
  return names(result.rows);
 }
 for(const [target,id,title] of [['field-medications','qcMedicationSuggestions','Mos dori nomlari va qaydlar'],['field-allergies','qcAllergySuggestions','Mos allergenlar va allergiya qaydlari']]){
  complaintSuggestions($(target),uniquePhrases(Object.values(phraseCatalog.sections?.[target]||{}).flat()),{id,title,lookup:medicineNames,normalize:W.UZMED_REFERENCE_SEARCH?.normalize||normalizePhrase});
 }
 // Five reference diagnosis fields; legacy competing/background data remains visible separately.
 const diagTabs=D.querySelector('.diagnosis-tabs');const mainBody=$('slot-diagnosis').parentElement;
 const diagBodies={main:mainBody,complication:$('extra-complication'),comorbid:$('extra-comorbid')};
 for(const [key,title]of [['differential','Differensial'],['diagnostic_plan','Aniqlashtirish rejasi']]){const wrap=node('div',undefined,'field'),l=node('label',title),t=node('textarea');t.id='qc-'+key;t.maxLength=5000;t.placeholder=title+'…';t.oninput=()=>{extra[key]=t.value;changed();};l.htmlFor=t.id;wrap.append(l,t);diagTabs.after(wrap);diagBodies[key]=wrap;}
 const diagnosisType=node('select');
 diagnosisType.id='qcDiagnosisType';
 const diagnosisLabel=node('label','Qoralama maydoni');
 diagnosisLabel.htmlFor=diagnosisType.id;
 for(const [key,title] of [['main','Asosiy tashxis'],['complication','Asoratlar'],['comorbid','Hamroh kasalliklar'],['differential','Differensial tashxis'],['diagnostic_plan','Aniqlashtirish rejasi']]){
  const option=node('option',title);option.value=key;diagnosisType.append(option);
 }
 const showDiagnosisType=()=>{for(const [key,body] of Object.entries(diagBodies))body.hidden=key!==diagnosisType.value;};
 diagTabs.classList.remove('segmented');
 diagTabs.classList.add('qc-dx-field');
 diagTabs.replaceChildren(diagnosisLabel,diagnosisType);
 diagnosisType.onchange=showDiagnosisType;
 showDiagnosisType();
 const legacy=node('details',undefined,'qc-legacy');legacy.append(node('summary','Qo‘shimcha: raqobatlashuvchi tashxis va fon kasalliklari'));for(const id of ['competing','background']){const n=$('extra-'+id);n.hidden=false;legacy.append(n);}$('diagnosisExtras').append(legacy);
 const oldEnrich=kit.enrich;kit.enrich=d=>{d=oldEnrich(d);d.extra.differential=extra.differential;d.extra.diagnostic_plan=extra.diagnostic_plan;d.extra.test_notes=extra.test_notes;return d;};
 // The existing search and reference catalogue share one field and result list.
 const icdHost=node('details',undefined,'qc-dx-catalog'),icdSearch=$('icdSearch'),icdList=$('icdResults');
 const icdGroups=node('select'),icdStatus=node('p','','minor');
 icdHost.id='qcDiagnoses';
 icdGroups.setAttribute('aria-label','MKB-10 toifasi');
 icdStatus.setAttribute('role','status');
 icdList.setAttribute('role','region');
 icdList.setAttribute('aria-label','MKB-10 natijalari');
 icdList.tabIndex=0;
 const icdCategories=[['Barchasi',null],['Umumiy amaliyot',null],['Jarrohlik',/^[KST]/],['Endokrinologiya',/^E/],['Nevrologiya',/^[GF]/],['Oftalmologiya',/^H[0-5]/],['LOR',/^(H[6-9]|J[0-3])/],['Kardiologiya',/^I/],['Pulmonologiya',/^J/],['Gastroenterologiya',/^K/],['Dermatologiya',/^L/],['Travmatologiya',/^[MST]/],['Urologiya',/^N[0-5]/],['Ginekologiya',/^(N[7-9]|O)/],['Pediatriya',/^[PQ]/]];
 for(const [index,[label]] of icdCategories.entries()){
  const option=node('option',label);option.value=String(index);icdGroups.append(option);
 }
 const icdGrouped=new Map();
 let icdData,icdLoading,icdRows=[],icdRendered=0;
 const searchField=icdSearch.closest('.search-field');
 icdHost.append(node('summary','MKB-10 katalogi'),icdGroups,icdStatus,icdList);
 searchField.append(icdHost);
 icdList.addEventListener('click',event=>{
  const option=event.target.closest('button[data-icd-row]');
  if(!option||!writable())return;
  const [code,title]=icdRows[Number(option.dataset.icdRow)];
  const target={main:'field-diagnosis',complication:'complication',comorbid:'comorbid',differential:'qc-differential',diagnostic_plan:'qc-diagnostic_plan'}[diagnosisType.value];
  if(!append(target,code+' — '+title))return;
  if(target==='field-diagnosis'){
   const codes=$('field-icd').value.split(/[;,\n]+/).map(x=>x.trim()).filter(Boolean);
   if(!codes.includes(code)){codes.push(code);$('field-icd').value=codes.join('; ');signal($('field-icd'));}
  }else if(target==='qc-differential')extra.differential=$('qc-differential').value;
  else if(target==='qc-diagnostic_plan')extra.diagnostic_plan=$('qc-diagnostic_plan').value;
  $('icdChecked').checked=false;
  changed();
 });
 function appendIcdRows(){
  const end=Math.min(icdRendered+48,icdRows.length);
  const batch=D.createDocumentFragment();
  for(;icdRendered<end;icdRendered++){
   const [code,title]=icdRows[icdRendered];
   const option=node('button',code+' · '+title);
   option.type='button';option.dataset.icdRow=String(icdRendered);
   batch.append(option);
  }
  icdList.append(batch);
 }
 icdList.addEventListener('scroll',()=>{
  if(!icdHost.open||icdRendered>=icdRows.length)return;
  if(icdList.scrollHeight-icdList.scrollTop-icdList.clientHeight<=160)appendIcdRows();
 },{passive:true});
 function drawIcd(){
  if(!icdData||!icdHost.open)return;
  const category=Number(icdGroups.value),pattern=icdCategories[category][1];
  if(pattern&&!icdGrouped.has(category))icdGrouped.set(category,icdData.filter(row=>pattern.test(row[0])));
  const all=icdGrouped.get(category)||icdData;
  const query=icdSearch.value.trim();
  const rows=query.length===1?[]:query?W.UZMED_REFERENCE_SEARCH.searchMkb(all,query,all.length):all;
  icdRows=rows;
  icdRendered=0;
  icdStatus.textContent=query.length===1?'Kamida ikki belgi kiriting.':rows.length?'Natijalar · '+rows.length.toLocaleString('uz')+' ta':'Mos tashxis topilmadi.';
  icdList.replaceChildren();
  icdList.scrollTop=0;
  appendIcdRows();
 }
 async function loadIcd(){
  if(icdData){drawIcd();return;}
  if(icdLoading)return;
  icdStatus.textContent='MKB bazasi yuklanmoqda…';
  try{
   icdLoading=W.QabulReference.load();
   icdData=await icdLoading;
   drawIcd();
  }catch(error){
   icdStatus.textContent=error.message;
   icdList.replaceChildren(btn('Qayta yuklash',loadIcd));
  }finally{icdLoading=null;}
 }
 icdHost.addEventListener('toggle',()=>{if(icdHost.open)loadIcd();});
 icdGroups.onchange=drawIcd;
 icdSearch.addEventListener('input',()=>{
  if(icdSearch.value.trim().length>=2){icdHost.open=true;loadIcd();}
  else drawIcd();
 });

 // Reuse the complete UZMED catalog; reorganise it into the six reference categories.
 const catalog=$('testPresets'),categories=['Barchasi','Laboratoriya','Funksional','Ultratovush','Radiologiya','Endoskopiya','Konsultatsiya'];
 const testNav=node('select',undefined,'qc-catalog-select'),testSearch=D.querySelector('.qf-lab-search input'),testField=$('field-tests');
 testNav.setAttribute('aria-label','Tekshiruvlar toifasi');
 const instrument=[...catalog.children].find(n=>/Instrumental va funksional/.test(n.querySelector('summary')?.textContent));
 if(instrument){const byCategory={Funksional:[],Ultratovush:[],Radiologiya:[],Endoskopiya:[]};for(const label of instrument.querySelectorAll('label')){const text=label.textContent;let cat=/UTT|Ultratovush|ultratovush|Exokardio/.test(text)?'Ultratovush':/Rentgen|tomografiya|DEXA|Mammografiya/.test(text)?'Radiologiya':/skopiya|FGDS/.test(text)&&!/Oftalmoskopiya/.test(text)?'Endoskopiya':'Funksional';byCategory[cat].push(label);}instrument.remove();for(const [cat,labels]of Object.entries(byCategory)){const details=node('details',undefined,'qf-lab-group'),head=node('summary',cat+' ('+labels.length+')'),grid=node('div',undefined,'preset-grid');details.dataset.qcCategory=cat;grid.append(...labels);details.append(head,grid);catalog.append(details);}}
 for(const d of catalog.children)if(!d.dataset.qcCategory)d.dataset.qcCategory='Laboratoriya';
 // Integrate extended native-checkbox tests and former quick-phrase tests into ONE catalog.
 // These are names for deliberate clinician selection, not pre-checked orders.
 const allTestNames=new Set([...catalog.querySelectorAll('input[data-test-name]')].map(c=>c.dataset.testName.toLocaleLowerCase('uz').trim()));
 const extended=W.UZMEDExpandedTestCatalog||{};
 const quickTestPhrases=W.UZMEDClinicalPhraseCatalog?.sections?.['field-tests']||{};
 const extraGroups={};
 for(const [category,groups]of Object.entries(extended))extraGroups[category]={...groups};
 for(const [group,phrases]of Object.entries(quickTestPhrases)){
  const category=group==='Laboratoriya'?'Laboratoriya':group==='Funksional'?'Funksional':'Radiologiya';
  (extraGroups[category]??={})['Qo‘shimcha tekshiruv nomlari']=[...(extraGroups[category]['Qo‘shimcha tekshiruv nomlari']||[]),...phrases];
 }
 for(const [category,groups]of Object.entries(extraGroups)){
  for(const [groupName,names]of Object.entries(groups)){
   const details=node('details',undefined,'qf-lab-group qc-expanded-group');
   details.dataset.qcCategory=category;
   const header=node('summary',''),grid=node('div',undefined,'preset-grid');let added=0;
   for(const raw of names){
    const name=String(raw||'').trim(),key=name.toLocaleLowerCase('uz');
    if(!name||name.length>120||allTestNames.has(key))continue;allTestNames.add(key);
    const label=node('label'),check=node('input');check.type='checkbox';check.dataset.testName=name;
    label.append(check,D.createTextNode(name));grid.append(label);added++;
    check.onchange=()=>{
     if(!writable()){check.checked=!check.checked;return;}
     const old=testField.value.split('\n').map(x=>x.trim()).filter(Boolean);
     const current=new Set(old);
     if(check.checked)current.add(name);else current.delete(name);
     const next=[...current].join('\n');
     if(testField.maxLength>0&&next.length>testField.maxLength){
      check.checked=!check.checked;focus.status('Tekshiruvlar maydoni to‘ldi. Qo‘lda qisqartiring.');return;
     }
     testField.value=next;signal(testField);changed();renderTests();
    };
   }
   if(!added)continue;
   header.textContent=groupName+' ('+added+')';details.append(header,grid);catalog.append(details);
  }
 }
 function consultationChoices(rows){let group=catalog.querySelector('[data-qc-category="Konsultatsiya"]');if(group)group.remove();group=node('details',undefined,'qf-lab-group');group.dataset.qcCategory='Konsultatsiya';const unique=[...new Set(rows.map(r=>r.label).filter(Boolean))];group.append(node('summary','Mutaxassislar ('+unique.length+')'));const grid=node('div',undefined,'preset-grid');for(const name of unique){const label=node('label'),check=node('input');check.type='checkbox';check.dataset.testName=name+' konsultatsiyasi';label.append(check,D.createTextNode(check.dataset.testName));check.onchange=()=>{if(!writable())return;if(check.checked)W.UzmedVideoFeatures.appendTests([check.dataset.testName]);else{testField.value=testField.value.split('\n').filter(x=>x.trim()!==check.dataset.testName).join('\n');signal(testField);}renderTests();};grid.append(label);}group.append(grid);catalog.append(group);filterTests();}
 function filterTests(){
  const query=testSearch.value.trim().toLocaleLowerCase('uz');
  const counts=new Map(categories.map(title=>[title,0]));
  let visibleCount=0;
  for(const group of catalog.children){
   let count=0;
   for(const label of group.querySelectorAll('label')){
    const show=!query||label.textContent.toLocaleLowerCase('uz').includes(query);
    label.hidden=!show;if(show)count++;
   }
   const category=group.dataset.qcCategory;
   const categoryVisible=testNav.value==='Barchasi'||category===testNav.value;
   group.hidden=!categoryVisible||!count;
   if(!group.hidden){visibleCount+=count;if(query)group.open=true;}
   const total=group.querySelectorAll('input[type=checkbox]').length;
   counts.set(category,counts.get(category)+total);
   counts.set('Barchasi',counts.get('Barchasi')+total);
  }
  if(!query){
   const first=[...catalog.children].find(group=>!group.hidden);
   if(first&&![...catalog.children].some(group=>!group.hidden&&group.open))first.open=true;
  }
  for(const option of testNav.options)option.textContent=option.value+' ('+counts.get(option.value)+')';
  const summary=D.getElementById('qcTestCatalogSummary');
  if(summary)summary.textContent=visibleCount+' ta '+(query?'mos':'mavjud')+' tekshiruv';
 }
 for(const title of categories){const option=node('option',title);option.value=title;testNav.append(option);}
 testNav.onchange=()=>{for(const group of catalog.children)group.open=false;filterTests();};
 D.querySelector('.qf-lab-search').before(testNav);testSearch.placeholder='Masalan, spirometriya, IgE, MRT, EKG…';testSearch.setAttribute('aria-label','Tekshiruvni qidirish');testSearch.addEventListener('input',filterTests);
 const selected=node('section',undefined,'qc-selected-tests'),count=node('h3'),list=node('div');selected.append(count,list);catalog.after(selected);
 function renderTests(){const names=[...new Set(testField.value.split('\n').map(v=>v.trim()).filter(Boolean))];count.textContent='Tanlangan tekshiruvlar ('+names.length+')';D.querySelector('.qf-lab-selected').textContent=names.length+' ta tanlangan';list.replaceChildren();for(const name of names){const row=node('div',undefined,'qc-selected-row');row.append(node('span',name),btn('×',()=>{if(!writable())return;testField.value=names.filter(v=>v!==name).join('\n');signal(testField);renderTests();}));row.lastChild.setAttribute('aria-label',name+'ni olib tashlash');list.append(row);}if(!names.length)list.append(node('p','Ro‘yxatdan tekshiruv tanlang yoki o‘zingiz qo‘shing.','minor'));for(const c of catalog.querySelectorAll('input[type=checkbox]'))c.checked=names.includes(c.dataset.testName);}
 catalog.addEventListener('change',renderTests);testField.addEventListener('input',renderTests);
 const noteWrap=node('label','Tekshiruvlar bo‘yicha qo‘shimcha qaydlar'),testNotes=node('textarea');testNotes.id='qc-test_notes';testNotes.maxLength=5000;testNotes.oninput=()=>{extra.test_notes=testNotes.value;changed();};noteWrap.append(testNotes);selected.after(noteWrap);
 const testActions=node('div',undefined,'qc-chips');const bundle=D.querySelector('#testPlan>.vf-block'),own=bundle?.nextElementSibling;
 const custom=focus.dialog('qcCustomTest','Tekshiruv qo‘shish'),cf=node('form'),ci=node('input');ci.required=true;ci.maxLength=120;ci.setAttribute('aria-label','Tekshiruv nomi');cf.append(ci,btn('Qo‘shish',()=>{if(!cf.reportValidity()||!writable())return;W.UzmedVideoFeatures.appendTests([ci.value]);ci.value='';renderTests();custom.close();},'qc-primary'));cf.onsubmit=e=>e.preventDefault();custom.append(cf);
 testActions.append(btn('+ Tekshiruv qo‘shish',()=>custom.showModal(),'qc-primary'),btn('To‘plamlar',()=>{if(!bundle)return;bundle.hidden=!bundle.hidden;bundle.scrollIntoView({block:'nearest'});}),btn('Shaxsiy katalog',()=>{if(!own)return;own.hidden=!own.hidden;own.scrollIntoView({block:'nearest'});}),btn('Yo‘llanma',()=>W.QabulDocument.open('referral')));testNav.after(testActions);if(bundle)bundle.hidden=true;if(own)own.hidden=true;
 const unified=node('section',undefined,'qc-tests-unified');
 unified.setAttribute('aria-label','Tahlil va tekshiruvlarni tanlash');
 const heading=node('div',undefined,'qc-tests-unified-head');
 heading.append(node('h3','Tayyor tahlil va tekshiruvlar'),node('p','Toifani oching yoki nomini qidiring. Faqat shifokor belgilagan tekshiruvlar rejaga qo‘shiladi.','minor'));
 const totals=node('p','','qc-tests-summary');totals.id='qcTestCatalogSummary';
 testNav.before(unified);
 unified.append(heading,D.querySelector('.qf-lab-search'),testNav,totals,testActions,catalog,selected,noteWrap);
 testSearch.remove();
 const manual=$('slot-tests');
 if(manual)heading.after(manual);
 const note= D.querySelector('#testPlan>.minor');
 if(note)unified.append(note);
 filterTests();renderTests();
 const testNames=uniquePhrases([...catalog.querySelectorAll('input[data-test-name]')].map(input=>input.dataset.testName));
 complaintSuggestions(testField,testNames,{id:'qcTestSuggestions',title:'Mos tahlil va tekshiruvlar'});
 complaintSuggestions(testNotes,uniquePhrases([...testNames,...Object.values(phraseCatalog.sections?.['test-notes']||{}).flat()]),{id:'qcTestNoteSuggestions',title:'Mos tekshiruv nomlari va qaydlar'});
 // Medication dialog stages changes. Cancel leaves the prescription list untouched.
 const medDialog=focus.dialog('qcMedicine','Yangi dori'),form=node('form'),medInputs={},rxKeys=[['name','Dori (savdo nomi)'],['inn','XNN (xalqaro nomi)'],['dose','Doza'],['frequency','Qabul soni / vaqti'],['route','Qabul yo‘li'],['food','Ovqatga nisbatan'],['duration','Davomiyligi'],['goal','Tayinlash maqsadi'],['notes','Izoh / maxsus ko‘rsatmalar']];
 let editingRow=null,drugDraft=null,afterDrugSave=null,verifiedSource=null,automaticRequest=0,filledValues={};
 const packageInfo=node('p',undefined,'minor');
 const autoSummary=node('div',undefined,'qc-med-autofill');
 autoSummary.hidden=true;autoSummary.setAttribute('role','status');
 function renderAutoSummary(){
  if(!verifiedSource)return;
  const line=node('p',[medInputs.dose.value,medInputs.frequency.value,medInputs.route.value,medInputs.food.value,medInputs.duration.value].filter(Boolean).join(' · '));
  const link=node('a','Doza manbasi · '+verifiedSource.title);
  link.href=verifiedSource.url;link.target='_blank';link.rel='noopener noreferrer';
  autoSummary.replaceChildren(node('strong','Retsept qoralamasi · shifokor ko‘rib chiqadi'),line,link);
 }
 function updateAutoSummary(){
  if(verifiedSource&&(medInputs.name.value!==drugDraft?.name||medInputs.inn.value!==drugDraft?.inn)){
   verifiedSource=null;
   for(const [key,value] of Object.entries(filledValues))if(medInputs[key].value===value)medInputs[key].value='';
   filledValues={};
   autoSummary.textContent='Dori nomi yoki XNN o‘zgardi. Yangi preparatni qidiruvdan tanlang.';
  }else renderAutoSummary();
  refreshMedicineChoices();
 }
 const medicineChoices=W.QabulMedicineOptions,choiceControls={},manualFields=new Set();
 const productField=node('div',undefined,'qc-med-field'),productLabel=node('label','Dori shakli'),productPicker=node('select');
 productPicker.id='qcMedicineProduct';productPicker.setAttribute('aria-label','Dori shakli');productLabel.htmlFor=productPicker.id;productField.append(productLabel,productPicker);
 const strengthField=node('div',undefined,'qc-med-field'),strengthLabel=node('label','Kuchi / tarkibi'),strengthPicker=node('select');strengthPicker.id='qcMedicineStrength';strengthPicker.setAttribute('aria-label','Kuchi / tarkibi');strengthLabel.htmlFor=strengthPicker.id;strengthField.append(strengthLabel,strengthPicker);
 const referenceBox=node('details',undefined,'qc-med-reference'),referenceTitle=node('summary','Dori yo‘riqnomasi'),referenceBody=node('div');referenceBox.append(referenceTitle,referenceBody);
 let referenceRequest=0,productChoices=[],referenceRecord=null,automaticRoute='';
 function applyProductChoice(product,explicit=false){
  if(!drugDraft)return;
  const oldStrength=drugDraft.product?.strength;if(oldStrength&&medInputs.dose.value===oldStrength&&oldStrength!==product.strength)medInputs.dose.value='';
  if(verifiedSource){for(const [key,value]of Object.entries(filledValues))if(medInputs[key].value===value)medInputs[key].value='';verifiedSource=null;filledValues={};autoSummary.hidden=true;}
  const name=(drugDraft.catalogName||drugDraft.name)+' · '+product.label;
  if(name.length>200)return;
  drugDraft={...drugDraft,name,catalogName:drugDraft.catalogName||drugDraft.name,product:{form:product.form,strength:product.strength||'',routeOptions:product.routeOptions,routeUnspecified:product.routeUnspecified},referenceRecord};
  medInputs.name.value=name;
  const routes=medicineChoices.options('route',drugDraft);
  if(medInputs.route.value===automaticRoute&&routes.length!==1){medInputs.route.value='';automaticRoute='';}
  if(routes.length===1&&(!medInputs.route.value||medInputs.route.value===automaticRoute)){medInputs.route.value=routes[0];automaticRoute=routes[0];}
  refreshMedicineChoices();
 }
 function showStrengths(prior=''){
  strengthPicker.replaceChildren();const blank=node('option','Kuchini tanlang');blank.value='';strengthPicker.append(blank);
  productChoices.forEach((product,i)=>{if(product.form!==productPicker.value||!product.strength)return;const option=node('option',product.strength);option.value=String(i);strengthPicker.append(option);});
  const same=productChoices.findIndex(x=>x.form===productPicker.value&&x.strength===prior);
  if(same>=0)strengthPicker.value=String(same);
  else if(strengthPicker.options.length===2)strengthPicker.selectedIndex=1;
  const product=productChoices[Number(strengthPicker.value)];
  if(strengthPicker.value!==''&&product)applyProductChoice(product,true);
  else if(productPicker.value)applyProductChoice({form:productPicker.value,strength:'',label:productPicker.value});
 }
 productPicker.onchange=()=>{if(!writable()||!medDialog.open)return;showStrengths();previewSelectedMedicine(++automaticRequest);};
 strengthPicker.onchange=()=>{if(!writable()||!medDialog.open||strengthPicker.value==='')return;const product=productChoices[Number(strengthPicker.value)];if(product){applyProductChoice(product,true);previewSelectedMedicine(++automaticRequest);}};
 function showProductReference(record){
  referenceRecord=record;
  if(drugDraft)drugDraft={...drugDraft,referenceRecord:record};
  const priorForm=productPicker.value,priorStrength=drugDraft?.product?.strength;
  productChoices=medicineChoices.forms(record);
  if(record.sourceGuidance?.available===true&&Array.isArray(record.sourceGuidance.routeOptions)&&record.sourceGuidance.routeOptions.length){
   const guideForms=medicineChoices.forms({form:record.sourceGuidance.form}).map(p=>p.form);
   productChoices=productChoices.map(p=>guideForms.includes(p.form)?{...p,routeOptions:record.sourceGuidance.routeOptions,routeUnspecified:false}:p);
  }
  const formNames=[...new Set(productChoices.map(x=>x.form))];
  productPicker.replaceChildren();const blank=node('option','Shaklini tanlang');blank.value='';productPicker.append(blank);
  for(const name of formNames){const option=node('option',name);option.value=name;productPicker.append(option);}
  if(formNames.includes(priorForm))productPicker.value=priorForm;else if(formNames.length===1)productPicker.value=formNames[0];
  showStrengths(priorStrength);productField.hidden=!productChoices.length;strengthField.hidden=!productChoices.length;
  referenceBody.replaceChildren();
  const full=record.uzbek||{},raw=record.raw||{};
  for(const [title,text]of [['Qo‘llash va dozalash',full.dosage_instructions||raw.dozalash],['Qarshi ko‘rsatmalar',full.contraindications||raw.qarshi],['Ogohlantirishlar',full.special_instructions||record.warnings]]){
   if(typeof text==='string'&&text.trim()){referenceBody.append(node('strong',title),node('p',text));}
  }
  if(record.archiveNotice)referenceBody.append(node('p',record.archiveNotice));
  if(record.manufacturerSource==='https://innotech.uz/dermobacter'){const a=node('a','Ishlab chiqaruvchi yo‘riqnomasi');a.href=record.manufacturerSource;a.target='_blank';a.rel='noopener noreferrer';referenceBody.append(a);}
  const guidance=record.sourceGuidance;
  if(guidance){
   referenceBody.append(node('strong','Ro‘yxatga olingan yo‘riqnoma — asl matn'));
   if(guidance.available!==true)referenceBody.append(node('p',guidance.reason==='no_instruction'?'Ushbu kartada qo‘llash yo‘riqnomasi yo‘q. Qabul tartibi tasdiqlanmadi.':'Asl yo‘riqnoma olinmadi. Manbani qayta oching.'));
   for(const section of guidance.sections||[]){if(typeof section.title!=='string'||typeof section.text!=='string')continue;const paragraph=node('p',section.text);paragraph.style.whiteSpace='pre-wrap';referenceBody.append(node('strong',section.title),paragraph);}
  }
  const url=record.url;
  if(typeof url==='string'&&/^https:\/\//.test(url)){const link=node('a',record.referenceScope==='registered_product'?'Mahsulot manbasini ochish':'Asl yo‘riqnomani ochish');link.href=url;link.target='_blank';link.rel='noopener noreferrer';referenceBody.append(link);}
  referenceBox.hidden=!referenceBody.childElementCount;
  referenceTitle.textContent=(record.source||'Katalog')+(record.referenceScope==='registered_product'?' · mahsulot ma’lumotnomasi':' · dori yo‘riqnomasi');
  refreshMedicineChoices();
 }
 async function loadMedicineReference(selected,request){
  const record=selected?.catalogRecord;
  if(!record||!medicineChoices)return;
  showProductReference(record);
  if(record.reviewedReference&&!String(record.key||'').startsWith('uzreg:')||!W.UZMEDDrugWorkspace?.details)return;
  try{
   const full=await W.UZMEDDrugWorkspace.details(record);
   if(request!==referenceRequest||!medDialog.open||!writable()||medInputs.name.value!==drugDraft?.name||medInputs.inn.value!==drugDraft?.inn||full.key!==record.key)return;
   if(W.UZMEDDrugWorkspace.clinicalBlock(full)||(record.inn&&full.inn&&record.inn!==full.inn))throw Error('Manbadagi mahsulot yoki tarkib o‘zgardi. Dorini qayta qidiring.');
   showProductReference({...full,sourceVariants:full.sourceVariants||record.sourceVariants});
  }catch(error){
   if(request!==referenceRequest||!medDialog.open)return;
   referenceBox.hidden=false;referenceBody.append(node('p','To‘liq yo‘riqnoma yuklanmadi. '+(error.message||'Manbani qayta oching.')));
  }
 }
 function previewSelectedMedicine(request){
  // Patient-specific AI preview still uses the existing independently checked oral-product service.
  if(!drugDraft||!W.UZMEDVisitBridge?.previewTreatment)return;
  if(!medicineChoices.combination(drugDraft.product?.strength)&&medicineChoices.strength(drugDraft)&&drugDraft.checkIngredient&&/tablet|capsul|kapsul|sirop|syrup|suspen/i.test(drugDraft.product?.form||''))void fillSelectedMedicine(drugDraft,request);
  else{autoSummary.hidden=true;}
 }

 const choiceKeys=new Set(['dose','frequency','route','duration','goal','notes']);
 function refreshMedicineChoices(){
  if(!medicineChoices)return;
  const selected=drugDraft&&medInputs.name.value===drugDraft.name&&medInputs.inn.value===drugDraft.inn?drugDraft:null;
  productField.hidden=!selected||!productChoices.length;strengthField.hidden=productField.hidden;referenceBox.hidden=!selected||!referenceBody.childElementCount;
  for(const [key,{picker,input,hint}]of Object.entries(choiceControls)){
   const values=medicineChoices.options(key,selected,$('field-diagnosis')?.value);
   if(verifiedSource&&filledValues[key]&&!values.includes(filledValues[key]))values.unshift(filledValues[key]);
   picker.replaceChildren();
   for(const value of ['',...values,'__custom']){
    const option=node('option',value==='__custom'?'Boshqa — qo‘lda kiritish':value||'Tanlanmagan');
    option.value=value;picker.append(option);
   }
   const custom=manualFields.has(key)||!!input.value&&!values.includes(input.value);
   picker.value=custom?'__custom':input.value;input.hidden=!custom;
   if(key==='dose'){
    const strength=medicineChoices.strength(selected);
    hint.textContent=strength?'Katalogdagi kuch / konsentratsiya: '+strength+'. Bir martalik doza va miqdorni shifokor belgilaydi.':'Katalogda dori kuchi aniqlanmagan. Dozani qo‘lda kiriting.';
   }
  }
 }
 for(const [key,title]of rxKeys){
  const l=node('label',title),i=node(key==='food'?'select':'input');
  if(key==='food')for(const value of ['','Ovqatdan oldin','Ovqat bilan','Ovqatdan keyin','Ovqatga bog‘liq emas']){const o=node('option',value||'Tanlanmagan');o.value=value;i.append(o);}
  i.name=key;i.id='qc-med-'+key;i.maxLength=200;i.setAttribute('aria-label',title);l.htmlFor=i.id;
  if(key==='name')i.required=true;
  medInputs[key]=i;
  if(medicineChoices&&choiceKeys.has(key)){
   const field=node('div',undefined,'qc-med-field'),picker=node('select'),hint=node('p',undefined,'minor');
   picker.id=i.id+'-choice';picker.dataset.medChoice=key;picker.setAttribute('aria-label',title);l.htmlFor=picker.id;
   i.setAttribute('aria-label',title+' — qo‘lda');i.placeholder='Qiymatni qo‘lda kiriting';i.hidden=true;
   if(key==='dose'){hint.id='qc-med-dose-hint';picker.setAttribute('aria-describedby',hint.id);i.setAttribute('aria-describedby',hint.id);}
   picker.addEventListener('change',()=>{
    if(!writable()||!medDialog.open){refreshMedicineChoices();return;}
    if(picker.value==='__custom'){manualFields.add(key);i.hidden=false;i.focus();}
    else{manualFields.delete(key);i.value=picker.value;signal(i);}
   });
   choiceControls[key]={picker,input:i,hint};field.append(l,picker,i);if(key==='dose')field.append(hint);form.append(field);
  }else{l.append(i);form.append(l);}
 }
 const times=node('div',undefined,'qc-chips');for(const time of ['Ertalab','Kunduzi','Kechqurun'])times.append(btn(time,()=>{const i=medInputs.frequency,values=i.value.split(', ').filter(Boolean);i.value=values.includes(time)?values.filter(x=>x!==time).join(', '):[...values,time].join(', ');updateAutoSummary();}));medInputs.frequency.parentElement.after(times);
 const medMessage=node('p');medMessage.setAttribute('role','alert');
 const saveMed=btn('✓ Dorini saqlash',()=>{
  if(!form.reportValidity()||!writable()||!medDialog.open)return;
  medInputs.name.value=medInputs.name.value.trim();medInputs.inn.value=medInputs.inn.value.trim();
  if(!medInputs.name.value){medMessage.textContent='Dori nomini kiriting.';medInputs.name.focus();return;}
  let row=editingRow;
  if(row&&!row.isConnected)return;
  if(!row){
   const before=$('rxRows').children.length;
   $('addRx').click();
   if($('rxRows').children.length===before){medMessage.textContent='Ko‘pi bilan 30 ta dori qatori.';return;}
   row=$('rxRows').lastElementChild;
  }
  for(const [key]of rxKeys){
   const input=row.querySelector('[name="'+key+'"]');
   if(input.value!==medInputs[key].value){input.value=medInputs[key].value;signal(input);}
  }
  const selected=drugDraft,done=afterDrugSave;
  const sameDrug=selected&&selected.name===medInputs.name.value&&selected.inn===medInputs.inn.value;
  if(sameDrug)kit.bindSource(row,verifiedSource?{
   sourceKey:verifiedSource.id,source:'FDA / DailyMed',sourceUrl:verifiedSource.url,sourceVersion:verifiedSource.version
  }:selected.source);
  if(verifiedSource&&sameDrug&&!['table','text','group'].includes(treatmentPanel.dataset.qflowMode)){
   treatmentPanel.dataset.qflowMode='text';
   W.QabulDocument.restoreSettings({...W.QabulDocument.settings(),med:'text'});
  }
  changed();medDialog.close();D.querySelector('.uv3-mobile-button[data-pane=plan]')?.click();renderMedRows();
  if(selected){
   done?.();
   if(!W.UZMEDVisitBridge?.previewTreatment)W.dispatchEvent(new W.CustomEvent('qabul:drug-check',{detail:{
    ingredient:sameDrug?selected.checkIngredient:'',row,name:selected.name,inn:selected.inn
   }}));
   renderMedPreview();
   focus.status('Dori qoralamaga qo‘shildi. Qabulni saqlash tugmasini bosing.');
  }
 },'qc-primary');
 form.prepend(packageInfo,productField,strengthField,referenceBox,autoSummary);form.addEventListener('input',e=>{if(!e.target.matches('[data-med-choice]'))updateAutoSummary();});form.append(medMessage,btn('Bekor qilish',()=>medDialog.close()),saveMed);
 form.onsubmit=e=>{e.preventDefault();saveMed.click();};medDialog.append(form);
 function openMed(row=null,selected=null,done=null){
  if(!writable())return;
  const request=++automaticRequest,reference=++referenceRequest;
  referenceRecord=null;automaticRoute='';productChoices=[];productPicker.replaceChildren();strengthPicker.replaceChildren();strengthField.hidden=true;productField.hidden=true;referenceBox.hidden=true;referenceBody.replaceChildren();
  editingRow=row;drugDraft=selected;afterDrugSave=done;verifiedSource=null;filledValues={};medMessage.textContent='';
  autoSummary.hidden=true;autoSummary.replaceChildren();saveMed.disabled=false;manualFields.clear();
  medDialog.querySelector('h2').textContent=row?'Dorini tahrirlash':selected?'Dorini qoralamaga qo‘shish':'Yangi dori';
  packageInfo.textContent=selected?.packageDetails?'Katalogdagi shakl va qadoq · '+selected.packageDetails:'';
  packageInfo.hidden=!packageInfo.textContent;
  for(const [key]of rxKeys){
   const value=row?.querySelector('[name="'+key+'"]')?.value||selected?.[key]||'';
   if(key==='food'&&![...medInputs[key].options].some(n=>n.value===value)){const o=node('option',value);o.value=value;medInputs[key].append(o);}
   medInputs[key].value=value;
  }
  refreshMedicineChoices();medDialog.showModal();
  if(selected)void loadMedicineReference(selected,reference);
  previewSelectedMedicine(request);
 }
 async function fillSelectedMedicine(selected,request){
  autoSummary.hidden=false;
  if(!selected.checkIngredient){
   autoSummary.textContent='Bitta faol modda aniqlanganda doza avtomatik tekshiriladi. XNN yoki tarkibni manbadan tekshiring.';
   return;
  }
  const original=Object.fromEntries(rxKeys.map(([key])=>[key,medInputs[key].value]));
  const current=()=>request===automaticRequest&&medDialog.open&&writable();
  saveMed.disabled=true;autoSummary.textContent='Dori yo‘riqnomasi va qabul ma’lumotlari tekshirilmoqda…';
  try{
   const result=await W.UZMEDVisitBridge.previewTreatment(selected.checkIngredient,selected.product);
   if(!current())return;
   if(rxKeys.some(([key])=>medInputs[key].value!==original[key])){
    autoSummary.textContent='Maydonlar tahrirlandi. Kiritgan qiymatlaringiz saqlandi.';return;
   }
   if(!result.suggestion){
    const messages=[result.text,...(result.missingInformation||[])].filter(Boolean);
    autoSummary.textContent=messages.join(' ')||'Doza uchun tasdiqlangan qoralama olinmadi.';
    if(result.choices?.length){
     const options=node('div',undefined,'qc-chips');
     for(const {label,product} of result.choices)options.append(btn(label,()=>{
      if(medInputs.name.value!==selected.name||medInputs.inn.value!==selected.inn)return;
      const name=(selected.catalogName||selected.name)+' · '+label;
      if(name.length>200)return;
      medInputs.name.value=name;
      drugDraft={...selected,name,catalogName:selected.catalogName||selected.name,product};
      fillSelectedMedicine(drugDraft,++automaticRequest);
     }));
     autoSummary.append(options);
    }
    return;
   }
   const source=result.source;
   if(!source||!/^https:\/\/dailymed\.nlm\.nih\.gov\/dailymed\/drugInfo\.cfm\?setid=[a-f0-9-]+$/i.test(source.url)){autoSummary.textContent='Doza manbasini ochib tekshirish talab etiladi.';return;}
   for(const [key]of rxKeys)if(!['name','inn'].includes(key)&&typeof result.suggestion[key]==='string'&&result.suggestion[key].length<=200){
    medInputs[key].value=result.suggestion[key];filledValues[key]=medInputs[key].value;
   }
   if(result.productLabel&&!selected.catalogName&&!selected.name.includes(result.productLabel)){
    const name=selected.name+' · '+result.productLabel;
    if(name.length<=200){medInputs.name.value=name;drugDraft={...selected,name};}
   }
   verifiedSource=source;renderAutoSummary();refreshMedicineChoices();
  }catch(error){if(current())autoSummary.textContent=error.message;}
  finally{if(current())saveMed.disabled=false;}
 }
 kit.openDrugDraft=(selected,done)=>openMed(null,selected,done);
 const addMed=btn('+ Yangi dori',()=>openMed(),'qc-primary');addMed.id='qcAddMedicine';D.querySelector('.qflow-treatment-tools').prepend(addMed);
 let movingRx=null;function renderMedRows(){for(const row of $('rxRows').children)if(!row.querySelector('.qc-edit-med')){const b=btn('Tahrirlash',()=>openMed(row),'qc-edit-med');const header=row.querySelector('.rx-header');header.append(b);const drag=btn('⋮⋮',()=>focus.status('Dori tartibini ↑ / ↓ tugmalari bilan ham o‘zgartirish mumkin.'),'qc-drag-med');drag.draggable=true;drag.setAttribute('aria-label','Dori qatorini ko‘chirish');drag.ondragstart=e=>{if(!writable()){e.preventDefault();return;}movingRx=row;e.dataTransfer.effectAllowed='move';};drag.onkeydown=e=>{if(!writable())return;if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();row.querySelector('[aria-label="Dori qatorini '+(e.key==='ArrowUp'?'yuqoriga':'pastga')+'"]').click();}};header.prepend(drag);row.ondragover=e=>{if(movingRx&&writable())e.preventDefault();};row.ondrop=e=>{e.preventDefault();if(movingRx&&movingRx!==row&&writable()){row.before(movingRx);changed();}movingRx=null;};drag.ondragend=()=>movingRx=null;}}
 new MutationObserver(renderMedRows).observe($('rxRows'),{childList:true});renderMedRows();
 const rxList=$('rxRows'),treatmentPanel=$('panel-treatment');
 const medViews=node('div',undefined,'segmented qc-med-views'),medPreview=node('section',undefined,'qc-med-preview');
 medViews.setAttribute('role','group');medViews.setAttribute('aria-label','Retsept qoralamasi ko‘rinishi');
 medPreview.setAttribute('aria-label','Retsept qoralamasi');rxList.before(medViews,medPreview);
 let readOnlyView='';
 const viewButtons=[['cards','Kartalar'],['table','Jadval'],['text','Matn']].map(([key,label])=>{
  const control=btn(label,()=>{
   if(writable()){
    treatmentPanel.dataset.qflowMode=key;
    if(key!=='cards')W.QabulDocument.restoreSettings({...W.QabulDocument.settings(),med:key});
    W.dispatchEvent(new W.Event('qabul:document-edit'));
   }else readOnlyView=key;
   renderMedPreview();
  });
  medViews.append(control);return [key,control];
 });
 function renderMedPreview(){
  const mode=readOnlyView||treatmentPanel.dataset.qflowMode||extra.med_mode;
  const usePreview=['table','group','text'].includes(mode)&&rxList.children.length>0;
  const rows=[...rxList.children].map(card=>({card,values:Object.fromEntries(rxKeys.map(([key])=>[key,card.querySelector('[name="'+key+'"]')?.value.trim()||'']))}));
  medViews.hidden=!rows.length;rxList.hidden=usePreview;medPreview.hidden=!usePreview;medPreview.replaceChildren();
  for(const [key,control]of viewButtons){
   const selected=key===(mode==='group'?'table':usePreview?mode:'cards');
   control.classList.toggle('selected',selected);control.setAttribute('aria-pressed',String(selected));
  }
  if(!usePreview)return;
  const editButton=card=>{
   const edit=btn('Tahrir',()=>openMed(card));
   edit.disabled=!writable();
   edit.setAttribute('aria-label',(card.querySelector('[name=name]').value||'Dori')+' — tahrirlash');
   const controls=node('div',undefined,'qc-med-actions');controls.append(edit);
   const source=card.querySelector('.rx-source');
   if(source)controls.append(btn('Manba',()=>source.click()));
   return controls;
  };
  if(mode==='text'){
   const list=node('ol',undefined,'qc-med-text');
   for(const {card,values:row}of rows){
    const entry=node('li'),name=row.name||'Nomi kiritilmagan dori';
    entry.append(node('strong',name+(row.inn&&row.inn.toLowerCase()!==name.toLowerCase()?' ('+row.inn+')':'')));
    const regimen=[row.dose,row.frequency,row.route,row.food,row.duration].filter(Boolean);
    entry.append(D.createTextNode(' — '+(regimen.join(', ')||'Qabul tartibi kiritilmagan')+'.'));
    if(row.goal)entry.append(node('div','Maqsad · '+row.goal));
    if(row.notes)entry.append(node('div','Izoh · '+row.notes));
    const missing=[['dose','doza'],['frequency','vaqt / soni'],['route','qabul yo‘li'],['duration','davomiylik']]
     .filter(([key])=>!row[key]).map(([,label])=>label);
    if(missing.length&&regimen.length)entry.append(node('div','To‘ldirilishi kerak · '+missing.join(', '),'minor'));
    entry.append(editButton(card));list.append(entry);
   }
   medPreview.append(list);return;
  }
  const groups=new Map();
  for(const row of rows){
   const title=mode==='group'?(row.values.goal||row.values.frequency||'Guruh belgilanmagan'):'';
   if(!groups.has(title))groups.set(title,[]);
   groups.get(title).push(row);
  }
  for(const [title,items]of groups){
   if(title)medPreview.append(node('h4',title));
   const scroll=node('div',undefined,'qc-med-table-scroll'),table=node('table'),head=node('thead'),header=node('tr');
   scroll.tabIndex=0;scroll.setAttribute('aria-label','Dori tayinlovlari jadvali');
   const columns=['Dori','XNN','Doza','Vaqt','Qabul yo‘li','Ovqat','Muddat','Maqsad','Izoh','Amal'];
   for(const label of columns){const th=node('th',label);th.scope='col';header.append(th);}
   head.append(header);table.append(head);
   const body=node('tbody');
   for(const {card,values}of items){
    const tr=node('tr');
    for(const [key]of rxKeys)tr.append(node('td',values[key]||'—'));
    const action=node('td');action.append(editButton(card));tr.append(action);body.append(tr);
   }
   table.append(body);scroll.append(table);medPreview.append(scroll);
  }
 }
 rxList.addEventListener('input',renderMedPreview);
 new MutationObserver(renderMedPreview).observe(rxList,{childList:true});
 $('qflowModes').addEventListener('click',()=>queueMicrotask(renderMedPreview));
 for(const event of ['qabul:restored','qabul:document-edit','qabul:clinical-locked'])W.addEventListener(event,renderMedPreview);
 renderMedPreview();

 // A real follow-up date and shortcuts, persisted with the visit.
 const follow=node('section',undefined,'qc-followup'),fl=node('label','Nazorat sanasi'),date=node('input');date.type='date';date.id='qc-followup-date';fl.htmlFor=date.id;fl.append(date);follow.append(fl);const shortcuts=node('div',undefined,'qc-chips');
 function followChanged(){if(!writable())return;extra.followup_date=date.value;replaceLine('field-followup','followup',date.value?'Nazorat sanasi: '+date.value+'.':'');$('reminder').value=date.value?date.value+'T09:00':'';signal($('reminder'));changed();}
 date.onchange=followChanged;for(const [label,days]of [['1 haftadan keyin',7],['2 haftadan keyin',14],['1 oydan keyin',30]])shortcuts.append(btn(label,()=>{if(!writable())return;const d=new Date(($('field-date').value||new Date().toISOString().slice(0,10))+'T12:00:00Z');if(days===30){const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));}else d.setUTCDate(d.getUTCDate()+days);date.value=d.toISOString().slice(0,10);followChanged();}));shortcuts.append(btn('Sanani tozalash',()=>{date.value='';followChanged();}));follow.append(shortcuts);$('slot-followup').before(follow);
 // Pevzner reference values: B.M. Saidov, Diyetologiya I (2008), table 23, pp.105–106.
 // Reference catalog only: selecting inserts its name. Regimens are never auto-prescribed.
 const dietSource='https://repository.tma.uz/jspui/bitstream/1/92/1/B.M%20Saidob%20DIYETOLOGIYA%201-Jild%202008.pdf#page=105';
 const dietRows=[['0',15,15,200,945,'6','Jarrohlik'],['1',100,100,425,2894,'4–5','Gastroenterologiya'],['1A',77,92,200,1886,'6','Gastroenterologiya'],['1B',100,100,300,2425,'5','Gastroenterologiya'],['2',95,95,400,2735,'4','Gastroenterologiya'],['3',110,110,525,3399,'5','Gastroenterologiya'],['4',78,73,275,2000,'5','Gastroenterologiya'],['4A',135,73,175,1871,'5','Gastroenterologiya'],['4B',110,95,362,2653,'5','Gastroenterologiya'],['4V',120,100,375,2786,'5','Gastroenterologiya'],['5',90,65,475,2726,'5','Gastroenterologiya'],['5A',102,72,475,2837,'5','Gastroenterologiya'],['5P',150,70,350,2553,'5–6','Gastroenterologiya'],['6',82,82,410,2604,'4–5','Urologiya'],['7',80,95,450,2876,'5','Urologiya'],['7A',28,75,462,2520,'5–6','Urologiya'],['7B',54,90,437,2665,'5','Urologiya'],['8',125,80,120,1670,'6','Endokrinologiya'],['9',100,70,300,2164,'5–6','Endokrinologiya'],['9A',100,50,200,1606,'4','Endokrinologiya'],['10',null,null,null,null,'5','Kardiologiya'],['10A',65,55,290,1843,'6','Kardiologiya'],['11',127,110,525,3467,'4–5','Pulmonologiya'],['12',105,95,500,3165,'4–5','Nevrologiya'],['13',75,67,350,2215,'6','Umumiy amaliyot'],['14',110,110,450,3118,'4–5','Urologiya'],['15',95,95,440,2885,'4','Umumiy amaliyot']];
 const dietHost=node('section',undefined,'qc-library'),dietSearch=node('input'),dietGroups=node('select',undefined,'qc-catalog-select'),dietList=node('div',undefined,'qc-diet-list'),dietCount=node('span');dietHost.id='qcDiets';dietHost.append(node('h3','Parhez stollari (Pevzner)'),dietCount);dietSearch.type='search';dietSearch.placeholder='Parhezni qidirish…';dietSearch.setAttribute('aria-label','Parhezni qidirish');dietGroups.setAttribute('aria-label','Parhezlar toifasi');dietHost.append(dietSearch,dietGroups,dietList);$('slot-advice').append(dietHost);
 const dietInfo=focus.dialog('qcDietInfo','Parhez haqida'),dietInfoBody=node('div');dietInfo.append(dietInfoBody);
 function dietName(code){return code+'-sonli parhez stoli';}
 function toggleDiet(code){if(!writable())return;const selected=extra.diets.includes(code),line='Parhez: '+dietName(code)+'.';if(!replaceLine('field-advice','diet:'+code,selected?'':line))return;extra.diets=selected?extra.diets.filter(x=>x!==code):[...extra.diets,code];drawDiets();changed();}
 function showDiet(row){const [code,protein,fat,carbs,kcal,meals]=row;dietInfo.querySelector('h2').textContent=dietName(code);dietInfoBody.replaceChildren();const link=node('a','B.M. Saidov · Diyetologiya I (2008), 22–23-jadval');link.href=dietSource;link.target='_blank';link.rel='noopener noreferrer';dietInfoBody.append(link,node('p','Quyidagi sonlar tarixiy manbadagi ma’lumotnoma qiymatlaridir. Bemor uchun tavsiya matnini shifokor tahrirlaydi.','minor'));
  const metrics=node('dl',undefined,'qc-diet-metrics');for(const [label,value]of [['Kkal',kcal],['Oqsillar, g',protein],['Yog‘lar, g',fat],['Uglevodlar, g',carbs],['Ovqatlanish soni',meals]])metrics.append(node('dt',label),node('dd',value===null?'Manbada tekshirish kerak':String(value)));dietInfoBody.append(metrics);
  const inputs={},saved=extra.diet_edits[code]||{};for(const [key,label]of [['purpose','Tayinlashdan maqsad / ko‘rsatmalar'],['allowed','Tavsiya etiladigan mahsulotlar'],['avoid','Cheklanadigan mahsulotlar'],['notes','Bemor uchun tavsiya']]){const l=node('label',label),t=node('textarea');t.maxLength=1200;t.setAttribute('aria-label',label);t.value=saved[key]||'';l.append(t);dietInfoBody.append(l);inputs[key]=t;}
  dietInfoBody.append(btn('Ma’lumot va tavsiyani saqlash',()=>{if(!writable())return;extra.diet_edits[code]=Object.fromEntries(Object.entries(inputs).map(([k,t])=>[k,t.value]));const notes=inputs.notes.value.trim();if(!replaceLine('field-advice','diet-note:'+code,notes?'Parhez '+code+': '+notes:''))return;if(notes&&!extra.diets.includes(code))toggleDiet(code);changed();dietInfo.close();},'qc-primary'),btn(extra.diets.includes(code)?'Tanlovdan olib tashlash':'Parhezni tanlash',()=>{toggleDiet(code);dietInfo.close();}));if(!writable())dietInfoBody.querySelectorAll('textarea,button').forEach(n=>n.disabled=true);dietInfo.showModal();
 }
 function drawDiets(){dietCount.textContent=extra.diets.length+' ta tanlandi';dietList.replaceChildren();for(const row of dietRows){const [code,,,,,,group]=row;if(dietGroups.value!=='Barchasi'&&group!==dietGroups.value)continue;if(!(dietName(code)+' '+group).toLowerCase().includes(dietSearch.value.trim().toLowerCase()))continue;const item=node('div',undefined,'qc-diet-item'),choose=btn(dietName(code)+(extra.diets.includes(code)?' ✓':' +'),()=>toggleDiet(code)),info=btn('ⓘ',()=>showDiet(row));choose.classList.toggle('selected',extra.diets.includes(code));choose.setAttribute('aria-pressed',String(extra.diets.includes(code)));info.setAttribute('aria-label',dietName(code)+' haqida');choose.disabled=!writable();item.append(choose,info);dietList.append(item);}if(!dietList.children.length)dietList.append(node('p','Mos parhez topilmadi.','minor'));}
 for(const group of ['Barchasi',...new Set(dietRows.map(r=>r[6]))]){
  const count=group==='Barchasi'?dietRows.length:dietRows.filter(r=>r[6]===group).length;
  const option=node('option',group+' ('+count+')');option.value=group;dietGroups.append(option);
 }
 dietGroups.onchange=dietSearch.oninput=drawDiets;
 drawDiets();
 W.addEventListener('qabul:session-ready',()=>{drawDiets();});

 // Reuse the authenticated voice engine, including its PRO and session checks.
 for(const [key,label]of [['differential','Differensial tashxis'],['diagnostic_plan','Aniqlashtirish rejasi'],['test_notes','Tekshiruvlar bo‘yicha qaydlar']]){
  W.QabulVoiceSections.fields.push({key,label,id:'qc-'+key});const option=node('option',label);option.value=key;$('voiceTarget').append(option);
 }
 $('dictationOpen').onclick=()=>{
  if(!writable())return;
  if(W.UZMEDVisitBridge){void W.QabulVoice.openCompact();return;}
  const section=focus.current(),host=D.querySelector('[data-focus-section="'+section+'"]');
  const field=section==='diagnosis'?$(activeDiagnosis()):['history','exam'].includes(section)?[...host.querySelectorAll('textarea')].find(n=>n.getClientRects().length):$('field-'+section);
  const target=W.QabulVoiceSections.fields.find(n=>n.id===field?.id);
  if(target&&W.QabulVoice.state()==='idle')$('voiceTarget').value=target.key;
  void W.QabulVoice.open();
 };
 $('clear').addEventListener('click',()=>{
  if($('status').textContent!=='Qoralama tozalandi. Ma’lumot serverda saqlanmagan.')return;
  icdHost.open=false;icdRows=[];icdRendered=0;icdStatus.textContent='';
  extra.choices={};extra.generated={};extra.diets=[];extra.diet_edits={};extra.followup_date='';extra.differential='';extra.diagnostic_plan='';extra.test_notes='';
  for(const key of ['differential','diagnostic_plan','test_notes'])$('qc-'+key).value='';date.value='';for(const i of vitals.querySelectorAll('input'))i.value='';
  renderChoices();renderTests();drawDiets();renderMedPreview();changed();
 });
 W.addEventListener('qabul:session-ready',()=>{
  const b=W.UZMEDVisitBridge.read(),saved=b.visit.investigations?.qabul_controls;if(saved?.output)W.QabulDocument.restoreOutput(saved.output);
  if(saved&&saved.version===1){for(const key of Object.keys(extra)){if(['choices','generated'].includes(key)){if(saved[key]&&typeof saved[key]==='object'&&!Array.isArray(saved[key]))extra[key]=safeCopy(saved[key]);}else if(typeof saved[key]===typeof extra[key])extra[key]=safeCopy(saved[key]);}}
  readOnlyView='';treatmentPanel.dataset.qflowMode=extra.med_mode||'cards';for(const key of ['differential','diagnostic_plan','test_notes'])$('qc-'+key).value=extra[key]||'';date.value=extra.followup_date||'';
  for(const i of vitals.querySelectorAll('[data-qc-vital]')){const text=extra.generated['vital:'+i.dataset.qcVital]||'';i.value=text?text.slice(text.indexOf(': ')+2).split(' ')[0]:'';}
  consultationChoices(b.specialists);renderChoices();filterTests();renderTests();renderMedRows();drawDiets();renderMedPreview();
  if(b.readOnly){for(const n of D.querySelectorAll('#testPresets input,.qc-observations input,.qc-observations button,.qc-library button,.qc-followup input,.qc-followup button,.qc-selected-tests button,#qcAddMedicine,.qc-edit-med'))n.disabled=true;}
 });
 W.QabulClinical={capture:()=>safeCopy({...extra,med_mode:$('panel-treatment').dataset.qflowMode||W.QabulDocument.settings().med,output:W.QabulDocument.outputSettings()}),clearSection(key){const targets={history:['field-history','life','epidemiology'],exam:['field-exam','neuro','localis']}[key]||[];for(const k of Object.keys(extra.choices))if(targets.some(t=>k.startsWith(t+':')))delete extra.choices[k];if(key==='exam'){for(const i of vitals.querySelectorAll('input'))i.value='';for(const k of Object.keys(extra.generated))if(k.startsWith('vital:'))delete extra.generated[k];}for(const k of Object.keys(extra.generated))if(targets.some(t=>k.startsWith(t+':')))delete extra.generated[k];if(key==='diagnosis'){extra.differential='';extra.diagnostic_plan='';}if(key==='tests')extra.test_notes='';if(key==='advice'){extra.followup_date='';date.value='';$('reminder').value='';signal($('reminder'));extra.diets=[];extra.diet_edits={};drawDiets();}renderChoices();renderTests();},validate(){for(const n of vitals.querySelectorAll('input'))if(!n.checkValidity()){n.closest('.qc-topic').open=true;n.reportValidity();throw Error('Hayotiy ko‘rsatkich qiymatini tekshiring.');}return true;}};
 filterTests();renderTests();
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
