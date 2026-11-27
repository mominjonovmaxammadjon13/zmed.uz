/* Qabul workflow: shared passport + native seven-section clinical controls. */
(function(W,D){
 'use strict';
 function mount(){
 const $=id=>D.getElementById(id),focus=W.QabulFocus,kit=W.UzmedQabul;
 if(!focus||!kit||!W.QabulPassport)return;
 const el=(tag,cls,text)=>{const n=D.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const button=(label,cb)=>{const n=el('button','qflow-action',label);n.type='button';n.addEventListener('click',cb);return n;};
 const paths={back:'M19 12H5m7-7-7 7 7 7',save:'M5 3h12l4 4v14H3V3z M7 3v6h10V3 M7 21v-8h10v8',folder:'M3 6h7l2 3h9v12H3z',print:'M6 9V3h12v6 M6 17H3V9h18v8h-3 M6 14h12v7H6z',calc:'M5 2h14v20H5z M8 5h8v4H8z M8 13h1m6 0h1m-8 4h1m6 0h1',more:'M12 5h.01M12 12h.01M12 19h.01',copy:'M9 9h12v12H9z M5 15H3V3h12v2',mic:'M9 3h6v10H9z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3 M8 22h8',trash:'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7'};
 function iconButton(b,label,key){b.setAttribute('aria-label',label);b.title=label;b.classList.add('qflow-icon');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[key]+'"/></svg>';return b;}
 const root=$('qabulFocus'),main=D.querySelector('.qf-main');root.classList.add('qflow','qflow-compact');
 function leaveHome(){root.classList.remove('uv5-home-mode');main.classList.remove('uv5-dashboard-open');}
 leaveHome();$('uv5Dashboard').hidden=true;
 const passport=el('aside','qflow-passport');passport.setAttribute('aria-label','Bemor pasporti');main.prepend(passport);
 let passportUI=null,savedPassport='',passportSaving=false;
 function passportValues(){
  const b=W.UZMEDVisitBridge?.read();if(!b)return null;
  const p=b.patient;
  return {full_name:[p.last_name,p.first_name,p.middle_name].filter(Boolean).join(' '),date:$('field-date').value,date_of_birth:p.date_of_birth||'',sex:p.sex||'unknown',height:$('height').value,weight:$('weight').value,specialty:$('specialty').value||b.visit.specialist_id||'',phone:p.phone||'',address:p.address||'',patient_note:b.visit.investigations?.patient_note||'',allergies:$('field-allergies').value};
 }
 function dirty(){return !!passportUI&&JSON.stringify(passportUI.read())!==savedPassport;}
 async function savePassport(){
  if(!passportUI||passportSaving)return false;
  if(!passportUI.form.reportValidity())return false;
  passportSaving=true;passportUI.save.disabled=true;
  try{
   const values=passportUI.read(),data=W.QabulPassport.validate(values);
   await W.UZMEDVisitBridge.savePassport(data);
   savedPassport=JSON.stringify(values);W.dispatchEvent(new W.CustomEvent('qabul:passport-saved'));passportUI.message.textContent='Pasport va qabul bazaga saqlandi.';passportUI.message.setAttribute('role','status');return true;
  }catch(e){passportUI.message.textContent=e.message;passportUI.message.setAttribute('role','alert');return false;}
  finally{passportSaving=false;passportUI.save.disabled=false;}
 }
 function renderPassport(){
  if(dirty())return;
  const values=passportValues();if(!values)return;
  const b=W.UZMEDVisitBridge.read();
  passportUI=W.QabulPassport.render(D,{values,specialties:b.specialists,submitLabel:'Pasportni saqlash',onSave:async()=>{if(!await savePassport())throw Error(passportUI.message.textContent);}});
  passport.replaceChildren(passportUI.form);savedPassport=JSON.stringify(passportUI.read());passportUI.setReadOnly(b.readOnly);
 }
 W.addEventListener('qabul:session-ready',renderPassport);
 D.addEventListener('input',e=>{if(!e.target.closest('.qp-passport')&&['field-date','height','weight','specialty','sex','field-allergies'].includes(e.target.id))renderPassport();});
 D.addEventListener('change',e=>{if(!e.target.closest('.qp-passport')&&['specialty','sex'].includes(e.target.id))renderPassport();});
 function openPassport(){leaveHome();renderPassport();root.classList.toggle('qflow-passport-open');main.scrollTop=0;}
 $('patientOpen').onclick=openPassport;
 // Existing navigation keeps its event listeners and dirty/clinical protections.
 for(const node of D.querySelectorAll('[data-focus-tab],#qfSectionSelect,#qfPrevious,#qfNext'))node.addEventListener('click',()=>{leaveHome();root.classList.remove('qflow-passport-open');});
 $('uv5Home')?.addEventListener('click',openPassport);
 $('uv5RailHome')?.addEventListener('click',openPassport);
 const actions=el('div','qflow-toolbar');actions.setAttribute('role','toolbar');actions.setAttribute('aria-label','Qabul amallari');
 const more=focus.dialog('qflowMenu','Qabul amallari');
 const save=iconButton(button('Qabulni saqlash',async()=>{
  save.disabled=true;try{const ok=await W.UZMEDVisitBridge?.save();focus.status(ok?'Qabul bemor tarixiga saqlandi.':'Saqlash yakunlanmadi. Xabarni tekshiring.');}finally{save.disabled=W.UZMEDVisitBridge?.read().readOnly===true;}
 }),'Qabulni saqlash','save');save.id='qflowSave';
 const back=iconButton(button('Orqaga',()=>$('back').click()),'Shifokor qabuli menyusiga qaytish','back');back.id='qflowBack';
 const templates=iconButton(button('Shablonlar',()=>$('templatesOpen').click()),'Shablonlar','folder');templates.id='qflowTemplates';
 const print=iconButton(button('Eksport va chop etish',()=>W.QabulDocument.open()),'Eksport va chop etish','print');print.id='qflowExport';
 const calc=iconButton(button('Kalkulyatorlar',showCalculators),'Kalkulyatorlar','calc');calc.id='qflowCalculators';
 const menu=iconButton(button('Boshqa amallar',()=>more.showModal()),'Boshqa amallar','more');menu.id='qflowMore';
 actions.append(back,templates,print,calc,menu,save);$('qfNav').before(actions);
 for(const [i,short]of ['Shikoyat','Anamnez','Ko‘rik','Tahlillar','Tashxis','Davolash','Tavsiyalar'].entries()){
  const b=D.querySelectorAll('[data-focus-tab]')[i];b.dataset.short=short;b.setAttribute('aria-label',b.querySelector('span').textContent);
 }
 function signal(input){input.dispatchEvent(new W.Event('input',{bubbles:true}));}
 const clear=button('Bo‘limni tozalash',()=>{
  const section=D.querySelector('[data-focus-section="'+focus.current()+'"]');
  const fields=[...section.querySelectorAll('textarea,input[id^="field-"]')];
  const rows=focus.current()==='treatment'?$('rxRows'):null;
  if(!fields.some(n=>n.value)&&!rows?.children.length)return;
  if(!W.confirm('Joriy bo‘limdagi matnlar tozalansinmi? Saqlangan tarix o‘zgarmaydi.'))return;
  fields.forEach(n=>{n.value='';signal(n);});if(rows){rows.replaceChildren();kit.render();}
  W.QabulClinical?.clearSection(focus.current());
 });clear.id='qflowClearSection';iconButton(clear,'Bo‘limni tozalash','trash');D.querySelector('.qf-tools').append(clear);
 // Dictation uses the existing section router and voice engine.
 const originalVoice=$('dictationOpen').onclick;
 $('dictationOpen').onclick=()=>{const section=focus.current();originalVoice();const target=$('voiceTarget');if([...target.options].some(o=>o.value===section))target.value=section;};
 iconButton($('sectionCopy'),'Bo‘limdan nusxa','copy');iconButton($('dictationOpen'),'Ovozdan matn kiritish','mic');$('sectionTemplate').hidden=true;
 const treatmentTools=el('details','qflow-treatment-tools');
 treatmentTools.append(el('summary','','Qo‘shimcha amallar'));
 const modes=focus.dialog('qflowModes','Davolash rejimini tanlash');
 for(const [key,label]of [['table','Jadval'],['group','Guruhlar'],['text','Matn'],['free','Erkin matn']])modes.append(button(label,()=>{
  $('panel-treatment').dataset.qflowMode=key;
  W.QabulDocument.restoreSettings({...W.QabulDocument.settings(),med:key==='free'?'text':key});
  D.querySelector('.uv3-mobile-button[data-pane=plan]')?.click();modes.close();kit.render();if(key==='free'){const extra=D.querySelector('.uv3-native-extra');if(extra)extra.open=true;$('field-treatment').scrollIntoView({block:'nearest'});$('field-treatment').focus();}
 }));
 treatmentTools.append(button('Hujjatda dorilar ko‘rinishi',()=>modes.showModal()),button('Dori mosligi (DDI)',()=>{
  const box=[...D.querySelectorAll('details.vf-drawer')].find(n=>/Dori mosligi/.test(n.textContent));
  if(box){D.querySelector('.uv3-mobile-button[data-pane=plan]')?.click();box.open=true;W.UzmedVideoFeatures?.checkDrugs?.();box.scrollIntoView({block:'nearest'});}else focus.status('Dori manbasini tayinlov qatoridagi «Manba» tugmasidan oching.');
 }));$('panel-treatment').prepend(treatmentTools);
 // Previous visits use the existing authenticated patient context, never a second patient list.
 const history=focus.dialog('qflowHistory','Oldingi qabullar');
 function showHistory(){
  history.querySelectorAll('.qflow-history-item,.qflow-history-empty').forEach(n=>n.remove());
  const rows=(W.UZMEDVisitBridge?.read()?.patient.visits||[]).filter(v=>v.visit_id!==W.UZMEDVisitBridge.read().visit.visit_id);
  for(const visit of rows){const item=el('article','qflow-history-item');item.append(el('h3','',String(visit.visit_at||'').slice(0,10)),el('p','',visit.chief_complaint||'Shikoyat kiritilmagan'),el('p','',visit.diagnosis||visit.assessment||'Tashxis kiritilmagan'));history.append(item);}
  if(!rows.length)history.append(el('p','qflow-history-empty','Oldingi qabul ma’lumoti yo‘q. Bemor kartasida to‘liq tarixni ko‘rish mumkin.'));
  history.showModal();
 }
 const settings=button('Qabul sozlamalari',()=>{more.close();$('patientDialog').showModal();});settings.id='qflowSettings';
 const oldVisits=button('Oldingi qabullar',()=>{more.close();showHistory();});oldVisits.id='qflowOldVisits';
 const clinical=button('AI va ko‘rsatkichlar',()=>{more.close();W.UZMEDVisitBridge?.openClinical();});clinical.id='qflowClinical';
 more.append(settings,oldVisits,clinical,$('clear'));$('clear').title='Butun qoralamani tozalash';$('clear').addEventListener('click',()=>more.close());
 const calculators=focus.dialog('qflowCalculatorDialog','Kalkulyatorlar'),calcTabs=el('div','segmented');calcTabs.setAttribute('aria-label','Kalkulyator turi');
 const bmi=el('form','qflow-bmi'),height=el('input'),weight=el('input'),result=el('output'),apply=button('Ko‘rikka kiritish',()=>{
  if(!W.UZMEDVisitBridge?.read().readOnly&&calculated){$('height').value=height.value;$('weight').value=weight.value;signal($('height'));signal($('weight'));focus.status('Bo‘y va vazn ko‘rikka kiritildi.');calculators.close();}
 });let calculated=false;
 height.type=weight.type='number';height.id='qflowBmiHeight';weight.id='qflowBmiWeight';height.min='50';height.max='250';weight.min='1';weight.max='500';height.step=weight.step='0.1';height.required=weight.required=true;
 for(const [label,control]of [['Bo‘y, sm',height],['Vazn, kg',weight]]){const l=el('label','',label);l.htmlFor=control.id;l.append(control);bmi.append(l);}
 result.id='qflowBmiResult';result.setAttribute('aria-live','polite');apply.disabled=true;
 const calculate=button('TVI hisoblash',()=>{if(!bmi.reportValidity())return;const h=Number(height.value)/100,w=Number(weight.value);if(!(h>=.5&&h<=2.5&&w>=1&&w<=500))return;result.textContent='TVI: '+(w/(h*h)).toFixed(1)+' kg/m²';calculated=true;apply.disabled=W.UZMEDVisitBridge?.read().readOnly===true;});
 bmi.append(calculate,result,el('p','minor','TVI = vazn / bo‘y². Bolalar natijasi yosh va jinsga mos baholanadi.'),apply);bmi.onsubmit=e=>{e.preventDefault();calculate.click();};bmi.oninput=()=>{calculated=false;apply.disabled=true;result.textContent='Ma’lumot o‘zgardi. Qayta hisoblang.';};
 const egfr=$('qabulEgfrCalculator');egfr.open=true;const source=egfr.querySelector('summary');source.hidden=true;
 const tabBmi=button('TVI',()=>calcTab(false)),tabEgfr=button('eGFR · CKD-EPI',()=>calcTab(true));
 function calcTab(renal){bmi.hidden=renal;egfr.hidden=!renal;tabBmi.classList.toggle('selected',!renal);tabEgfr.classList.toggle('selected',renal);tabBmi.setAttribute('aria-pressed',String(!renal));tabEgfr.setAttribute('aria-pressed',String(renal));}
 calcTabs.append(tabBmi,tabEgfr);calculators.append(calcTabs,bmi,egfr);calcTab(false);
 function showCalculators(){height.value=$('height').value;weight.value=$('weight').value;calculated=false;apply.disabled=true;result.textContent='';calculators.showModal();}
 W.addEventListener('qabul:session-ready',()=>{save.disabled=W.UZMEDVisitBridge.read().readOnly;});
 W.addEventListener('qabul:clinical-locked',()=>{save.disabled=true;passportUI?.setReadOnly(true);});
 W.QabulWorkflow={passportDirty:dirty,passportSnapshot:()=>passportUI?.read(),passportBusy:()=>passportSaving,savePassport};
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
