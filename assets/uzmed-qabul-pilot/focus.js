'use strict';
/* Presentation adapter: original draft, search, review and speech handlers are retained. */
(function(){
 const kit=window.UzmedQabul,$=id=>document.getElementById(id);
 if(!kit?.collect||!$('panel-patient'))return;
 const config=[['complaints','Shikoyatlar','M8 10h8 M8 14h5 M21 11a8 8 0 0 1-8 8H7l-5 3 2-6a8 8 0 1 1 17-5'],['history','Anamnez','M3 11a9 9 0 1 1 3 8 M3 4v7h7 M12 7v5l3 2'],['exam','Ko‘rik','M6 3v6a4 4 0 0 0 8 0V3 M4 3h4 M12 3h4 M10 13v3a5 5 0 0 0 10 0v-2 M20 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4'],['tests','Tekshiruvlar','M9 3h6 M10 3v6L4 19v2h16v-2L14 9V3 M8 15h8'],['diagnosis','Tashxis','M8 5H5v16h14V5h-3 M9 3h6v4H9z M8 14l3 3 5-6'],['treatment','Davolash','M9 4a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7-7l5-5 M7 7l7 7 M16 14l5 5 M21 14l-7 7'],['advice','Tavsiyalar','M9 6h12 M9 12h12 M9 18h12 M3 5l1 1 2-2 M3 11l1 1 2-2 M3 17l1 1 2-2']];
 const icons={print:'M6 9V3h12v6 M6 17H3V9h18v8h-3 M6 14h12v7H6z M17 12h.01',person:'M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8',copy:'M9 9h12v12H9z M5 15H3V3h12v2',folder:'M3 6h7l2 3h9v12H3z',edit:'M15 4l5 5 M3 21l4-1L21 6l-5-5L2 16z'};
 function icon(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(icons[path]||path)+'"/></svg>';}
 function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
 const root=node('div','qf');root.id='qabulFocus';
 root.innerHTML='<header class="qf-header"><div id="qfBrand"></div><button type="button" id="patientOpen" class="qf-patient">'+icon('person')+'<span><strong id="patientSummary">Bemor va qabul</strong><small id="patientMeta">Ma’lumotlarni kiriting</small></span><span aria-hidden="true">⌄</span></button><div class="qf-header-end"><span class="qf-local"><i></i> Mahalliy qoralama</span><button type="button" id="finishOpen" aria-label="Qabulni yakunlash" title="Qabulni yakunlash" class="qf-btn qf-review">✓ <span>Yakunlash</span></button><button type="button" id="documentView" aria-label="Qabul hujjati" title="Qabul hujjati" class="qf-btn qf-doc">▤ <span>Hujjat</span></button><div id="qfTheme"></div><div id="qfBack"></div></div></header><nav class="qf-rail" aria-label="Qabul bo‘limlari" id="qfNav"></nav><label class="qf-mobile-nav"><span id="qfSectionLabel">Bo‘lim</span><select id="qfSectionSelect" aria-label="Qabul bo‘limi"></select></label><main class="qf-main"><div class="qf-card"><div class="qf-card-head"><div><div class="qf-eyebrow">UZMED · SHIFOKOR QABULI</div><h1 id="qfTitle">Shikoyatlar</h1></div><div class="qf-tools"><button type="button" id="sectionTemplate" title="Bo‘lim shablonlari" aria-label="Bo‘lim shablonlari">'+icon('folder')+'</button><button type="button" id="sectionCopy" title="Bo‘limdan nusxa" aria-label="Bo‘limdan nusxa">'+icon('copy')+'</button><button type="button" id="dictationOpen" title="Ovozdan matn kiritish" aria-label="Ovozdan matn kiritish">♬</button></div></div><div id="qfSections"></div><div class="qf-step"><button id="qfPrevious" type="button">← Oldingi</button><span id="qfPosition"></span><button id="qfNext" type="button">Keyingi →</button></div></div><p id="qfStatus" role="status" aria-live="polite"></p><div class="qf-footnote">Qoralama shu sahifada saqlanadi · Klinik qarorni shifokor tasdiqlaydi</div></main><div class="qf-dock" aria-label="Qabul amallari"><button type="button" id="templatesOpen">'+icon('folder')+'<span>Shablonlar</span></button><button type="button" id="exportOpen" class="qf-export" title="Eksport va chop etish" aria-label="Eksport va chop etish">'+icon('print')+'</button><div id="qfClear"></div></div>';
 document.body.append(root);
 $('qfBrand').append(document.querySelector('.topbar .brand'));
 $('qfTheme').append($('themeToggle'));$('qfBack').append($('back'));$('qfClear').append($('clear'));
 const panels={};
 for(const [key,title,path]of config){const b=node('button','qf-nav');b.type='button';b.dataset.focusTab=key;b.innerHTML=icon(path)+'<span>'+title+'</span><i aria-hidden="true"></i>';$('qfNav').append(b);const option=node('option','',title);option.value=key;$('qfSectionSelect').append(option);const pane=node('section','qf-section');pane.dataset.focusSection=key;pane.setAttribute('aria-label',title);pane.hidden=true;$('qfSections').append(pane);panels[key]=pane;}
 function move(id,dest){const n=$(id);if(n)dest.append(n);}
 move('slot-complaints',panels.complaints);
 const dictation=document.querySelector('.dictation');if(dictation)panels.complaints.append(dictation);
 const originalHistory=$('panel-history');
 while(originalHistory.firstChild)panels.history.append(originalHistory.firstChild);
 panels.history.querySelector('.section-heading')?.remove();
 move('slot-exam',panels.exam);
 for(const [key,id]of [['tests','panel-tests'],['diagnosis','panel-diagnosis'],['treatment','panel-treatment']]){const p=$(id);p.hidden=false;p.classList.remove('tab-panel','pane');p.classList.add('qf-original');p.querySelector('.section-heading')?.remove();panels[key].append(p);}
 move('slot-advice',panels.advice);move('slot-followup',panels.advice);
 function extra(id,label){const wrap=node('div','field');wrap.id=id+'Wrap';const l=node('label','',label);l.htmlFor=id;const t=node('textarea');t.id=id;t.maxLength=5000;t.placeholder=label+' (mavjud bo‘lsa)';wrap.append(l,t);return wrap;}
 function sectionPicker(title,sections){
  const label=node('label','qc-section-picker',title),select=node('select');
  for(const [caption,body] of sections){
   const option=node('option','',caption);option.value=body.id;select.append(option);
  }
  select.onchange=()=>{for(const [,body] of sections)body.hidden=body.id!==select.value;};
  select.onchange();
  label.append(select);
  return label;
 }
 const epid=extra('epidemiology','Epidemiologik anamnez');
 $('slot-history').after(epid);
 panels.history.querySelector('.segmented').replaceWith(sectionPicker('Anamnez turi',[
  ['Kasallik anamnezi',$('slot-history')],['Hayot anamnezi',$('lifeWrap')],['Epidemiologik anamnez',epid]
 ]));
 const neuro=extra('neuro','Nevrologik status'),localis=extra('localis','Status localis');
 panels.exam.prepend(sectionPicker('Ko‘rik turi',[
  ['Obyektiv ko‘rik',$('slot-exam')],['Nevrologik status',neuro],['Status localis',localis]
 ]));
 panels.exam.append(neuro,localis);
 const diagTabs=panels.diagnosis.querySelector('.diagnosis-tabs'),mainDiag=node('div');
 move('slot-diagnosis',mainDiag);move('slot-icd',mainDiag);diagTabs.after(mainDiag);
 const mainButton=node('button','selected','Asosiy');mainButton.type='button';mainButton.dataset.diagnosis='main';diagTabs.prepend(mainButton);
 diagTabs.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.diagnosis;diagTabs.querySelectorAll('button').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});mainDiag.hidden=k!=='main';['comorbid','competing','background','complication'].forEach(x=>$('extra-'+x).hidden=x!==k);}));mainButton.click();
 const oldEnrich=kit.enrich,oldNote=kit.buildNote;
 kit.enrich=function(d){d=oldEnrich?oldEnrich(d):d;d.extra=d.extra||{};for(const id of ['epidemiology','neuro','localis'])d.extra[id]=$(id).value;return d;};
 kit.buildNote=function(d){let s=oldNote(d);const extras=[['epidemiology','Epidemiologik anamnez'],['neuro','Nevrologik status'],['localis','Status localis']].filter(([k])=>kit.clean(d.extra?.[k])).map(([k,t])=>t+': '+kit.clean(d.extra[k]));return extras.length?s+'\n\n'+extras.join('\n\n'):s;};
 const dialogs={};
 function dialog(id,title){const d=node('dialog','qf-dialog');d.id=id;const h=node('div','qf-dialog-head');h.append(node('h2','',title));const close=node('button','qf-close','×');close.type='button';close.setAttribute('aria-label','Oynani yopish');close.onclick=()=>d.close();h.append(close);d.append(h);d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});root.append(d);dialogs[id]=d;return d;}
 function open(d){d.showModal();}
 const patientDialog=dialog('patientDialog','Bemor va qabul');const patientPanel=$('panel-patient');patientPanel.hidden=false;patientPanel.classList.remove('tab-panel');patientPanel.querySelector('.section-heading')?.remove();patientDialog.append(patientPanel);const pdone=node('button','qf-primary','Tayyor');pdone.type='button';pdone.onclick=()=>patientDialog.close();patientDialog.append(pdone);
 const finishDialog=dialog('finishDialog','Qabulni yakunlash');const finish=$('panel-finish');finish.hidden=false;finish.classList.remove('tab-panel');finish.querySelector('.section-heading')?.remove();finishDialog.append(finish);$('showFinalPreview').onclick=()=>{finishDialog.close();window.QabulDocument?.open();};
 $('patientOpen').onclick=()=>open(patientDialog);$('finishOpen').onclick=()=>open(finishDialog);
 document.querySelector('.topbar').hidden=true;document.querySelector('.workspace').hidden=true;
 let current='complaints';
 function show(key,focus=false){if(!panels[key])return;current=key;for(const k of Object.keys(panels))panels[k].hidden=k!==key;document.querySelectorAll('[data-focus-tab]').forEach(b=>{const on=b.dataset.focusTab===key;b.classList.toggle('active',on);b.setAttribute('aria-current',on?'step':'false');});$('qfTitle').textContent=config.find(x=>x[0]===key)[1];const i=config.findIndex(x=>x[0]===key);$('qfPosition').textContent=(i+1)+' / 7';$('qfSectionSelect').value=key;$('qfSectionLabel').textContent='Bo‘lim '+(i+1)+'/7';$('qfPrevious').disabled=i===0;$('qfNext').textContent=i===6?'Hujjatni ko‘rish ↗':'Keyingi →';if(focus){document.querySelector('.qf-main').scrollTop=0;$('qfTitle').tabIndex=-1;$('qfTitle').focus({preventScroll:true});document.querySelector('[data-focus-tab="'+key+'"]').scrollIntoView({block:'nearest',inline:'center'});} }
 $('qfSectionSelect').onchange=()=>show($('qfSectionSelect').value,true);
 document.querySelectorAll('[data-focus-tab]').forEach(b=>b.onclick=()=>show(b.dataset.focusTab,true));
 $('qfPrevious').onclick=()=>show(config[Math.max(0,config.findIndex(x=>x[0]===current)-1)][0],true);
 $('qfNext').onclick=()=>{const i=config.findIndex(x=>x[0]===current);if(i===6)window.QabulDocument?.open();else show(config[i+1][0],true);};
 function status(t){$('qfStatus').textContent=t;}
 // Keep a usable copy path when Telegram/iOS denies the Clipboard API.
 const copyDialog=dialog('sectionCopyDialog','Bo‘lim matnidan nusxa');
 const copyHelp=node('p','minor','Matnni bosib ushlab turing va Nusxalashni tanlang. Quyidagi tugma barcha matnni belgilaydi.');
 const copyText=node('textarea');copyText.id='sectionCopyText';copyText.readOnly=true;copyText.setAttribute('aria-label','Nusxalash uchun bo‘lim matni');copyText.style.minHeight='180px';copyText.style.width='100%';
 const selectCopy=node('button','qf-primary','Hammasini belgilash');selectCopy.id='sectionCopySelect';selectCopy.type='button';
 function selectText(){copyText.focus();copyText.select();copyText.setSelectionRange(0,copyText.value.length);}
 selectCopy.onclick=selectText;copyDialog.append(copyHelp,copyText,selectCopy);copyDialog.addEventListener('close',()=>{copyText.value='';});
 function legacyCopy(text){const previous=document.activeElement,temporary=node('textarea');temporary.value=text;temporary.readOnly=true;temporary.style.cssText='position:fixed;left:0;top:0;opacity:0;pointer-events:none';document.body.append(temporary);let copied=false;try{temporary.focus();temporary.select();temporary.setSelectionRange(0,text.length);copied=document.execCommand('copy')===true;}catch(_){}finally{temporary.remove();if(previous&&previous.isConnected)previous.focus({preventScroll:true});}return copied;}
 $('sectionCopy').onclick=async()=>{
  const values=[...panels[current].querySelectorAll('textarea,input:not([type=checkbox])')].filter(e=>!['icdSearch','drugSearch','height','weight'].includes(e.id)).map(e=>e.value.trim()).filter(Boolean).join('\n\n');
  if(!values){status('Bu bo‘limda nusxalanadigan matn yo‘q. Matn yozing yoki papkadan shablon tanlang.');return;}
  const button=$('sectionCopy');button.disabled=true;let copied=false;
  try{if(navigator.clipboard?.writeText)copied=await Promise.race([navigator.clipboard.writeText(values).then(()=>true,()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),1200))]);if(!copied)copied=legacyCopy(values);
   if(copied){status('Bo‘lim matni nusxalandi.');return;}
   copyText.value=values;if(!copyDialog.open)copyDialog.showModal();selectText();status('Avtomatik nusxalashga ruxsat berilmadi. Ochilgan matnni belgilab nusxalang.');
  }catch(_){copyText.value=values;if(!copyDialog.open)copyDialog.showModal();status('Matnni ochilgan oynadan belgilab nusxalang.');}finally{button.disabled=false;}
 };
 $('dictationOpen').onclick=()=>{show('complaints',true);dictation.open=true;dictation.scrollIntoView({block:'nearest'});};
 const templateDialog=dialog('templateDialog','Bo‘lim shablonlari');
 const info=node('p','minor','Shablonlar shaxsiy UZMED akkauntingizda saqlanadi. Bemor identifikatori va shifokor ma’lumotlari ularga qo‘shilmaydi.');
 const templateName=node('input');templateName.id='sectionTemplateName';templateName.maxLength=80;templateName.placeholder='Masalan: mening ko‘rik andozam';templateName.setAttribute('aria-label','Shablon nomi');
 const saveTemplate=node('button','qf-primary','Joriy bo‘limni saqlash'),templateList=node('div','qf-template-list'),templateStatus=node('p','minor');templateStatus.setAttribute('role','status');let templates=[];let templateSection='complaints';
 templateDialog.append(info,templateName,saveTemplate,templateList,templateStatus);
 function templateFields(key){return [...panels[key].querySelectorAll('textarea[id],input[id^="field-"]')].filter(e=>!['field-patient','field-doctor','field-age','field-date','field-icd'].includes(e.id));}
 function listTemplates(){templateList.replaceChildren();const rows=templates.filter(x=>x.section===templateSection);if(!rows.length)templateList.append(node('p','minor','Bu bo‘lim uchun hali shablon yo‘q.'));for(const t of rows){const b=node('button','',t.title);b.type='button';b.onclick=()=>{const fields=templateFields(t.section);if(fields.some(f=>f.value.trim())&&!confirm('Joriy bo‘lim matnlarini shablon bilan almashtirasizmi?'))return;for(const f of fields){f.value=t.values[f.id]||'';f.dispatchEvent(new Event('input',{bubbles:true}));}templateDialog.close();show(t.section,true);status('Shablon kiritildi. Matnni tekshiring.');};templateList.append(b);}}
 saveTemplate.type='button';saveTemplate.onclick=async()=>{const name=templateName.value.trim(),fields=templateFields(templateSection);if(!name||!fields.some(f=>f.value.trim())){templateStatus.textContent='Shablon nomi va bo‘lim matnini kiriting.';return;}if(templates.length>=20){templateStatus.textContent='Ko‘pi bilan 20 ta shaxsiy bo‘lim shabloni.';return;}saveTemplate.disabled=true;try{const t=await window.QabulAccount.save('section',{id:'custom-'+crypto.randomUUID(),title:name,section:templateSection,values:Object.fromEntries(fields.map(f=>[f.id,f.value]))});templates.push(t);templateName.value='';templateStatus.textContent='Shablon shaxsiy akkauntingizga saqlandi.';listTemplates();}catch(e){templateStatus.textContent=e.message;}finally{saveTemplate.disabled=false;}};
 async function openTemplates(){templateSection=current;templates=[];templateStatus.textContent='Shaxsiy shablonlar yuklanmoqda…';listTemplates();open(templateDialog);try{templates=await window.QabulAccount.list('section');templateStatus.textContent='';listTemplates();}catch(e){templateStatus.textContent=e.message;}}
 $('templatesOpen').onclick=openTemplates;$('sectionTemplate').onclick=openTemplates;
 const baseRender=kit.render;
 function update(){for(const [key]of config){const yes=[...panels[key].querySelectorAll('textarea,input:not([type=checkbox])')].some(e=>!['icdSearch','drugSearch','height','weight'].includes(e.id)&&e.value.trim());document.querySelector('[data-focus-tab="'+key+'"]').classList.toggle('has-data',yes);}const id=$('field-patient').value.trim(),age=$('field-age').value.trim();$('patientSummary').textContent=id||'Bemor va qabul';$('patientMeta').textContent=[age,$('field-date').value].filter(Boolean).join(' · ')||'Ma’lumotlarni kiriting';}
 kit.render=function(){baseRender();update();window.QabulDocument?.refresh();};
 document.addEventListener('input',()=>{update();window.QabulDocument?.refresh();});document.addEventListener('change',update);
 $('clear').addEventListener('click',()=>{if($('status').textContent==='Qoralama tozalandi. Ma’lumot serverda saqlanmagan.'){for(const id of ['epidemiology','neuro','localis'])$(id).value='';kit.render();status('Qoralama tozalandi.');}});
 new MutationObserver(()=>{if($('status').textContent)status($('status').textContent);}).observe($('status'),{childList:true});
 window.QabulFocus={show,dialog,openDialog:open,status,current:()=>current,update};
 $('documentView').onclick=() =>window.QabulDocument?.open();$('exportOpen').onclick=() =>window.QabulDocument?.open();
 // Mobile viewport accommodates the software keyboard without covering form fields.
 if(window.visualViewport){const viewport=()=>{const covered=Math.max(0,innerHeight-visualViewport.height-visualViewport.offsetTop);root.classList.toggle('qf-keyboard',covered>160);};visualViewport.addEventListener('resize',viewport);visualViewport.addEventListener('scroll',viewport);viewport();}
 function revealField(){const field=document.activeElement;if(document.querySelector('.qf-main').contains(field)&&field.matches('input,textarea,select'))field.scrollIntoView({block:'nearest'});}
 root.addEventListener('focusin',revealField);window.addEventListener('resize',revealField,{passive:true});
 show('complaints');kit.render();
})();
