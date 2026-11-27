/* UZMED Bemorlarim. UI is not a security boundary; all records use the existing doctor-scoped API. */
(function(W,D){
 'use strict';
 const ID='uzBemorlarHub';
 let root=null,revision=0,active=null,loading=false;
 const name=p=>[p.last_name,p.first_name,p.middle_name].filter(Boolean).join(' ');
 function el(tag,cls,value){const e=D.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;}
 function btn(label,handler,cls=''){const b=el('button','ubh-button '+cls,label);b.type='button';b.addEventListener('click',handler);return b;}
 function actor(){try{const state=W.UZMEDAuth?.getState();return state?.loggedIn?state.user?.id||'':'';}catch{return '';}}
 async function api(path,method='GET',data){const before=actor();if(!before)throw Error('Davom etish uchun UZMED akkauntingizga kiring.');const token=await W.UZMEDAuth.getAccessToken();if(!token||actor()!==before)throw Error('Akkaunt sessiyasi tugagan.');const result=await fetch('/api/patients'+path,{method,headers:{Authorization:'Bearer '+token,...(data?{'Content-Type':'application/json'}:{})},body:data?JSON.stringify(data):undefined,cache:'no-store',credentials:'omit'});if(actor()!==before)throw Error('Akkaunt o‘zgardi; davom etish taqiqlangan.');let response={};try{response=await result.json();}catch{}if(!result.ok)throw Error(response.message||'Bemorlar xizmati javob bermadi ('+result.status+').');return response;}
 function telegramMode(){try{return new URLSearchParams(W.location.search).get('telegram_miniapp')==='1'||new URLSearchParams(W.location.hash.slice(1)).has('tgWebAppData')||!!W.Telegram?.WebApp?.initData;}catch{return false;}}
 let exporting=false;
 async function telegramDocx(patientId,visitId,bytes){
  if(exporting)throw Error('Hujjat allaqachon yuborilmoqda.');
  if(!bytes?.length||bytes.length>2000000)throw Error('Word hujjati bo‘sh yoki 2 MB dan katta.');
  const owner=actor();if(!owner)throw Error('UZMED akkauntingizga kiring.');
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  exporting=true;try{
   const result=await api('/'+encodeURIComponent(patientId)+(visitId?'/visits/'+encodeURIComponent(visitId):'')+'/export-telegram','POST',{base64:W.btoa(binary)});
   if(actor()!==owner)throw Error('Akkaunt o‘zgardi.');
   if(result.sent!==true||result.delivery!=='telegram_private_chat')throw Error('Telegram yetkazilgani tasdiqlanmadi.');
  }finally{exporting=false;}
 }
 let printing=false;
 function printTree(node){
  if(node.nodeType===3)return node.textContent;
  if(node.nodeType!==1)return null;
  const style={};for(const key of node.style)style[key]=node.style.getPropertyValue(key);
  return {tag:node.localName,attrs:Object.fromEntries(['class','data-density','data-borders'].filter(k=>node.hasAttribute(k)).map(k=>[k,node.getAttribute(k)])),style,children:[...node.childNodes].map(printTree).filter(n=>n!==null)};
 }
 async function printDocument(source,patientId,visitId=null){
  if(printing)throw Error('Hujjat tayyorlanmoqda.');
  printing=true;
  try{
   const account=actor();
   const result=await api('/'+encodeURIComponent(patientId)+(visitId?'/visits/'+encodeURIComponent(visitId):'')+'/print-ticket','POST',{document:printTree(source)});
   if(!account||actor()!==account)throw Error('Akkaunt o‘zgardi.');
   if(!/^[A-Za-z0-9_-]{43}$/.test(result.token))throw Error('Chop etish havolasi olinmadi.');
   const url=W.location.origin+'/assets/uzmed-print.html#'+result.token;
   if(W.Telegram?.WebApp?.openLink)W.Telegram.WebApp.openLink(url);
   else if(W.TelegramWebviewProxy?.postEvent)W.TelegramWebviewProxy.postEvent('web_app_open_link',JSON.stringify({url}));
   else if(W.external&&'notify' in W.external)W.external.notify(JSON.stringify({eventType:'web_app_open_link',eventData:{url}}));
   else{
    const dialog=el('dialog','ubh-print-dialog'),link=el('a','ubh-button','Hujjatni ochish va chop etish');
    link.href=url;link.target='_blank';link.rel='noopener noreferrer';
    dialog.append(el('p','','A4 hujjat tayyor. Brauzerda ochib, Chop etish tugmasini bosing.'),link,btn('Yopish',()=>dialog.close()));
    D.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
   }
  }finally{printing=false;}
 }
 function screen(){if(root?.isConnected)return root;const screens=D.querySelector('.screens');if(!screens)return null;root=D.getElementById(ID);if(!root){root=el('section','screen ubh-screen');root.id=ID;root.setAttribute('aria-label','Bemorlarim');screens.append(root);new MutationObserver(()=>{if(!root.classList.contains('active')){revision++;active?.resizeObserver?.disconnect();active?.frame.remove();active=null;root.replaceChildren();}}).observe(root,{attributes:true,attributeFilter:['class']});}return root;}
 function heading(title='Bemorlarim'){const h=el('header','ubh-head');const left=el('div');left.append(el('span','ubh-overline','UZMED · KLINIK ISH MAYDONI'),el('h1','',title));h.append(left);const a=el('a','ubh-back','← UZMED asosiy sahifasi');a.href='/';h.append(a);return h;}
 function message(parent,value,error=false){const n=el('p','ubh-note'+(error?' ubh-error':''),value);n.setAttribute('role',error?'alert':'status');parent.prepend(n);return n;}
 function open(){
  // Unified entry. Existing patient details and clinical editor remain accessible.
  if(!closeSession())return;
  const qabul=W.UZMEDQabulStart;
  if(typeof qabul?.open==='function')return qabul.open('mine');
  return W.UZMEDPatients?.openAction?.('mine');
 }
 function status(text,error=false){if(!root)return;root.querySelectorAll('.ubh-note').forEach(n=>n.remove());message(root,text,error);}
 // Every entry uses the same authenticated patient/visit editor.
 let stateLoading=null;
 async function stateModule(){
  if(W.QabulVisitState)return W.QabulVisitState;
  if(!stateLoading)stateLoading=new Promise((resolve,reject)=>{const s=el('script');s.src='/assets/uzmed-qabul-pilot/visit-state.js?v=20261109-passport5';s.onload=()=>W.QabulVisitState?resolve(W.QabulVisitState):reject(Error('Qabul moduli ochilmadi.'));s.onerror=()=>{stateLoading=null;s.remove();reject(Error('Qabul modulini yuklab bo‘lmadi.'));};D.head.append(s);});
  return stateLoading;
 }
 function still(session){return active===session&&session.subject===actor()&&session.mark===revision;}
 function stateSnapshot(session){const w=session.frame.contentWindow;return {workspace:W.QabulVisitState.capture(w),controls:w.QabulClinical?.capture()||null};}
 function stateText(session){return JSON.stringify(stateSnapshot(session));}
 function unsaved(session=active){if(!session?.ready)return false;try{return !!session.frame.contentWindow.QabulWorkflow?.passportDirty?.()||stateText(session)!==session.saved;}catch{return true;}}
 function mayLeave(){return !active?.saving&&!active?.confirming&&!active?.frame.contentWindow.QabulWorkflow?.passportBusy?.()&&(!unsaved()||W.confirm('Qabuldagi o‘zgarishlar hali saqlanmagan. Saqlamasdan chiqilsinmi?'));}
 function closeSession(){if(!mayLeave())return false;revision++;active?.frame.contentWindow?.UzmedQabul?.allowClose?.();active?.resizeObserver?.disconnect();active?.frame.remove();active=null;return true;}
 async function launchQabul(patient,visit=null,intakeDraft=null){
  if(!patient?.patient_id||(active&&!active.ready)||!mayLeave())return;
  const s=screen();if(!s)return;
  if(W.showScreen&&!W.showScreen.__qabulGuard){const show=W.showScreen;const guarded=function(id){if(id!==ID&&active&&!mayLeave())return;return show.apply(this,arguments);};guarded.__qabulGuard=true;W.showScreen=guarded;}
  W.closeMenu?.();W.showScreen?.(ID);const subject=actor(),mark=++revision;
  active?.resizeObserver?.disconnect();active?.frame.remove();active=null;
  s.classList.remove('ubh-compact-ready');s.classList.add('ubh-visit-mode','ubh-compact');fitEditor();s.replaceChildren(heading('Shifokor qabuli'));
  const identity=el('p','ubh-description',name(patient)+' · ID '+(patient.short_code||patient.patient_id));s.append(identity);
  const shell=el('div','ubh-qabul'),tools=el('div','ubh-tools'),info=el('p','ubh-note','Qabul ma’lumotlari ochilmoqda…');info.setAttribute('role','status');info.setAttribute('aria-live','polite');
  // Leave the clinical editor for the Shifokor qabuli entry, not the separate
  // patient chart. No new visit is created while navigating backward.
  const back=btn('←',()=>{
   if(!closeSession())return;
   const entry=W.UZMEDQabulStart;
   if(typeof entry?.open==='function')return entry.open('recent');
   if(D.getElementById('uzQabulEntry'))return W.showScreen?.('uzQabulEntry');
   return W.UZMEDPatients?.openAction?.('recent');
  },'ubh-secondary');
  back.setAttribute('aria-label','Shifokor qabuli menyusiga qaytish');back.title='Shifokor qabuli menyusiga qaytish';
  const save=btn('Saqlash',()=>saveCurrent(),'ubh-primary');save.setAttribute('aria-label','Qabulni saqlash');save.disabled=true;
  const details=btn('AI va ko‘rsatkichlar',()=>{if(closeSession())W.UZMEDPatients?.openCard?.(patient.patient_id,visit?.visit_id,'clinical');},'ubh-secondary');details.disabled=true;
  details.title='Ko‘rsatkichlar, AI va klinik tasdiqlash';tools.append(back,details,save);shell.append(tools,info);s.append(shell);
  const frame=el('iframe','ubh-frame');frame.title='Bemorning joriy qabuli';frame.setAttribute('allow','microphone; clipboard-write');frame.setAttribute('referrerpolicy','same-origin');
  const session={subject,mark,patientId:patient.patient_id,frame,save,info,details,ready:false,saving:false,saved:'',visit:null,patient};active=session;
  try{
   const codec=await stateModule();if(!still(session))return;
   // Reopening an existing visit never creates another record.
   const path='/'+encodeURIComponent(patient.patient_id)+'/visits';
   const response=visit?.visit_id?await api(path+'/'+encodeURIComponent(visit.visit_id)):await api(path,'POST',{specialist_id:intakeDraft?.specialty||patient.assigned_specialist_id||null,...(intakeDraft?{visit_at:intakeDraft.date+'T00:00:00+05:00',allergic_anamnesis:intakeDraft.allergies||'',vitals:Object.fromEntries(['height','weight'].filter(k=>intakeDraft[k]).map(k=>[k,Number(intakeDraft[k])])),investigations:{patient_note:intakeDraft.patient_note||''}}:{})});
   if(!still(session))return;visit=response.visit;session.visit=visit;session.visitId=visit.visit_id;details.disabled=false;
   const context=await api(path+'/'+encodeURIComponent(visit.visit_id)+'/qabul-context');if(!still(session))return;
   const fullCard=await api('/'+encodeURIComponent(patient.patient_id));if(!still(session))return;
   session.patient={...fullCard.patient,...context.patient};const snapshot=codec.fromVisit(visit,session.patient);
   let loadedResolve,loadedReject;const loaded=new Promise((resolve,reject)=>{const timeout=W.setTimeout(()=>reject(Error('Qabul muharriri vaqtida yuklanmadi. Qayta oching.')),25000);loadedResolve=value=>{W.clearTimeout(timeout);resolve(value);};loadedReject=error=>{W.clearTimeout(timeout);reject(error);};});
   const populate=async()=>{
    if(!still(session)||session.ready)return;
    try{
     const w=frame.contentWindow;if(!w?.UzmedQabul?.collect||!w.UzmedVideoFeatures||!w.QabulVisitState)throw Error('Qabul muharririni to‘liq yuklab bo‘lmadi. Qayta oching.');
     const fitFrame=()=>{if(still(session))w.document.documentElement.style.setProperty('--qabul-viewport-height',frame.clientHeight+'px');};
     fitFrame();if(W.ResizeObserver){session.resizeObserver=new W.ResizeObserver(fitFrame);session.resizeObserver.observe(frame);}
     if(telegramMode())w.QabulDocument.setPrintExport(async source=>{if(!still(session)||!session.ready)throw Error('Qabul oynasi o‘zgardi.');await printDocument(source,session.patientId,session.visitId);});
     if(telegramMode())w.QabulDocument.setTelegramExport(async bytes=>{if(!still(session)||!session.ready)throw Error('Qabul oynasi o‘zgardi; qayta oching.');await telegramDocx(session.patientId,session.visitId,bytes);if(!still(session))throw Error('Qabul oynasi o‘zgardi.');});
     const specialistRows=(await api('/specialists')).specialists||[];
     if(!still(session))throw Error('Akkaunt o‘zgardi.');
     for(const item of specialistRows){if(![...w.document.getElementById('specialty').options].some(o=>o.value===item.key)){const o=w.document.createElement('option');o.value=item.key;o.textContent=item.label;w.document.getElementById('specialty').append(o);}}
     codec.hydrate(w,snapshot,session.patient);
     w.UZMEDVisitBridge={
      read:()=>{if(!still(session))throw Error('Akkaunt yoki qabul o‘zgardi.');return {patient:session.patient,visit:session.visit,specialists:specialistRows,readOnly:session.readOnly===true};},
      save:()=>saveCurrent(),
      openClinical:()=>details.click(),
      treatmentKey:()=>still(session)?stateText(session)+JSON.stringify(w.QabulWorkflow?.passportSnapshot?.()||null):'',
      treatmentSaved:()=>still(session)&&session.ready&&!session.saving&&!unsaved(session),
      treatmentLabels:async name=>{
       if(!still(session)||!session.ready)return [];
       const data=await api(path+'/'+encodeURIComponent(session.visitId)+'/qabul-drug-label','POST',{name});
       return still(session)?data.rows:[];
      },
      drugReferences:async (mode,name,key)=>{
       if(!still(session)||!session.ready)throw Error('Qabulni qayta oching.');
       const endpoint=path+'/'+encodeURIComponent(session.visitId)+'/qabul-drug-label';
       const result=mode==='access'?await api(endpoint):await api(endpoint,'POST',{mode,name,key});
       if(!still(session))throw Error('Qabul o‘zgardi.');
       return result;
      },
      previewTreatment:(ingredient,product)=>w.UZMEDVisitBridge.treatment({ingredient,automatic:true,preview:true,product}),
      treatment:async({ingredient,automatic=false,preview=false,product,requestText}={})=>{
       if(!still(session)||!session.ready||session.visit.status==='closed')throw Error('Joriy qabulni qayta oching.');
       if(automatic&&(session.readOnly||session.saving||unsaved(session)))throw Error('Tahlildan oldin qabuldagi o‘zgarishlarni saqlang.');
       if(unsaved(session)&&(!await saveCurrent()||unsaved(session)))throw Error('Tahlildan oldin barcha o‘zgarishlarni saqlang.');
       if(!still(session))throw Error('Akkaunt yoki qabul o‘zgardi.');
       const snapshot=stateText(session);
       const result=await api(path+'/'+encodeURIComponent(session.visitId)+'/qabul-treatment','POST',{expectedRevision:session.visit.revision,ingredient,requestText,...(preview?{preview,product}:{})});
       if(!still(session)||stateText(session)!==snapshot||unsaved(session))throw Error('Qabul ma’lumoti o‘zgardi. Loyihani qayta tayyorlang.');
       return result;
      },
      confirmTreatment:async(type,id)=>{
       if(!still(session)||!session.ready||unsaved(session))throw Error('Qabul ma’lumoti o‘zgardi. Loyihani qayta tayyorlang.');
       if(session.confirming)throw Error('Tasdiqlash yakunlanishini kuting.');
       session.confirming=true;
       const editor=w.document.getElementById('qabulFocus');
       editor.inert=true;
       try{
        const result=await api(path+'/'+encodeURIComponent(session.visitId)+'/drafts/'+encodeURIComponent(id)+'/confirm','POST',{type});
        if(!still(session))throw Error('Akkaunt yoki qabul o‘zgardi.');
        session.visit=result.visit;
        if(!session.readOnly){
         session.readOnly=true;save.disabled=true;
         w.dispatchEvent(new w.CustomEvent('qabul:clinical-locked'));
        }
        info.textContent='Klinik yozuv tasdiqlandi. Tahrir uchun yangi qabul boshlang.';
        return result.record;
       }finally{session.confirming=false;editor.inert=false;}
      },
      savePassport:async data=>{
       if(!still(session)||session.readOnly||session.saving)throw Error('Bu qabul pasportini hozir saqlab bo‘lmaydi.');
       const result=await api('/'+encodeURIComponent(session.patientId),'PATCH',data.patient);
       if(!still(session))throw Error('Akkaunt o‘zgardi.');
       session.patient=result.patient;
       if(data.draft.specialty&&specialistRows.some(row=>row.key===data.draft.specialty)&&data.draft.specialty!==session.visit.specialist_id){
        const assigned=await api('/'+encodeURIComponent(session.patientId)+'/specialists','POST',{specialist_id:data.draft.specialty,visit_id:session.visitId});
        if(!still(session))throw Error('Akkaunt o‘zgardi.');session.visit=assigned.assignment;
       }
       session.visit.investigations={...session.visit.investigations,patient_note:data.draft.patient_note};
       w.document.getElementById('field-date').value=data.draft.date;
       for(const key of ['height','weight']){
        const input=w.document.getElementById(key);input.value=data.draft[key]||'';input.dispatchEvent(new w.Event('input',{bubbles:true}));
       }
       w.document.getElementById('field-allergies').value=data.draft.allergies;
       w.document.getElementById('sex').value=data.patient.sex==='male'?'Erkak':data.patient.sex==='female'?'Ayol':'';
       w.document.getElementById('specialty').value=data.draft.specialty;
       w.document.getElementById('field-patient').value=name(session.patient)+' · '+(session.patient.short_code||session.patientId);
       w.UzmedQabul.render();w.QabulFocus.update();
       if(!await saveVisit())throw Error('Bemor pasporti bazaga yozildi, lekin qabul qoralamasi saqlanmadi. Yuqoridagi Saqlashni qayta bosing.');
       identity.textContent=name(session.patient)+' · ID '+(session.patient.short_code||session.patientId);
      }
     };
     // New patient intake is explicitly submitted by the doctor. Keep the server-hydrated
     // snapshot as baseline so browser close warnings remain correct until PATCH succeeds.
     const beforeIntake=stateText(session);
     const intakeKeys=['template','specialty','customSpecialty','documentKind','date','age','doctor'];
     if(intakeDraft&&typeof intakeDraft==='object'&&Object.keys(intakeDraft).every(k=>[...intakeKeys,'sex','height','weight','allergies','patient_note'].includes(k))){
      for(const k of intakeKeys){
       const value=intakeDraft[k];if(typeof value!=='string'||value.length>120)continue;
       const control=w.document.getElementById(['template','specialty','customSpecialty','documentKind'].includes(k)?k:'field-'+k);
       if(control&&((k==='specialty'&&!value)||value))control.value=value;
      }
      for(const key of ['height','weight'])if(typeof intakeDraft[key]==='string'){
       const input=w.document.getElementById(key);input.value=intakeDraft[key];input.dispatchEvent(new w.Event('input',{bubbles:true}));
      }
      if(intakeDraft.sex==='male')w.document.getElementById('sex').value='Erkak';
      if(intakeDraft.sex==='female')w.document.getElementById('sex').value='Ayol';
      w.document.getElementById('customSpecialtyField').hidden=intakeDraft.specialty!=='other';
      w.UzmedQabul.render();w.QabulFocus?.update?.();
     }
     w.UzmedVideoFeatures.setPatientContext(context);
     w.UzmedVideoFeatures.reloadPatientContext=async()=>{const next=await api(path+'/'+encodeURIComponent(session.visitId)+'/qabul-context');if(still(session))w.UzmedVideoFeatures.setPatientContext(next);};
     w.document.querySelectorAll('.private-badge,.qf-local').forEach(n=>n.textContent='Bemor tarixidagi qoralama');const foot=w.document.querySelector('.qf-footnote');if(foot)foot.textContent='Saqlash tugmasi orqali bemor tarixiga yoziladi · Klinik tasdiq alohida bajariladi';
     const note=w.document.querySelector('#panel-patient .inline-note');if(note)note.textContent='O‘zgarishlar «Qabulni saqlash» tugmasi orqali shu bemor tarixiga yoziladi.';
     identity.textContent=name(session.patient)+' · ID '+(session.patient.short_code||patient.patient_id)+' · Qabul '+visit.visit_id.slice(0,8);identity.title='Qabul ID: '+visit.visit_id;
     // Signed clinical records stay immutable. A new visit is a separate explicit action.
     const signed=visit.status==='closed'||[...(visit.diagnoses||[]),...(visit.prescriptions||[]),...(visit.treatment_plans||[])].some(r=>r.status==='confirmed');
     session.readOnly=signed;
     function lockEditor(){
      w.document.querySelectorAll('input,textarea,select').forEach(n=>{if(!n.closest('#docOptions')&&n.id!=='qfSectionSelect'&&!n.matches('#uzmedQabulV3 .uv3-field input'))n.disabled=true;});
      w.document.querySelectorAll('button').forEach(n=>{const view=n.closest('#documentDialog,#qabulPrintTools,#qfNav,.segmented')||n.matches('.uv5-step,.uv3-home-link,.uv3-mobile-button,.uv3-list-row,.uv3-drug,.uv3-filter,.uv3-mode')||!!n.closest('.uv3-quick,.uv3-heading-tools,.qflow-toolbar,#qflowModes,.qc-test-nav,.qc-output-bar')||n.closest('#qabulTreatment')||n.id==='uv5Home'||n.id==='uv5Doc'||n.classList.contains('qf-close')||['qflowMore','qflowSettings','qflowOldVisits','qflowClinical','qflowBack','back','themeToggle','documentView','exportOpen','patientOpen','finishOpen','sectionCopy','qfPrevious','qfNext','showFinalPreview','word','pdf','copy'].includes(n.id);n.disabled=!view||['docEditInPlace','qflowSave'].includes(n.id);});
     }
     if(signed)lockEditor();else save.disabled=false;
     w.addEventListener('qabul:clinical-locked',lockEditor);
     session.ready=true;w.dispatchEvent(new w.CustomEvent('qabul:session-ready'));session.saved=intakeDraft?beforeIntake:stateText(session);if(!intakeDraft)w.UzmedQabul.markSaved?.();details.disabled=false;s.classList.add('ubh-compact-ready');
     info.textContent=signed?'Tasdiqlangan / yopilgan qabul. Hujjatni ko‘rish va eksport qilish mumkin. O‘zgartirish uchun bemor kartasidan yangi qabul boshlang.':'Qoralama · v'+visit.revision+' · Klinik tasdiq alohida.';

     function changed(){if(still(session)&&!session.saving&&!signed){info.textContent=unsaved(session)?'Saqlanmagan o‘zgarishlar · Saqlashni bosing.':'Barcha o‘zgarishlar bemor tarixida saqlangan.';}}
     for(const event of ['input','change','click'])w.document.addEventListener(event,changed);
     w.addEventListener('qabul:document-edit',changed);w.document.getElementById('back').onclick=()=>back.click();
     w.document.querySelectorAll('a[href="/"]').forEach(a=>{a.onclick=e=>{e.preventDefault();back.click();};});
     if(intakeDraft&&!signed&&!await saveVisit())throw Error('Pasport saqlandi, qabul qoralamasini saqlashda xato. Saqlash tugmasini qayta bosing.');
     loadedResolve(true);
    }catch(e){info.textContent=e.message;info.setAttribute('role','alert');save.disabled=!session.ready;loadedReject(e);}
   };
   frame.addEventListener('load',populate);frame.src='/assets/uzmed-qabul-pilot/index.html?uzmed_patient=1&v=20261109-passport5';shell.append(frame);
   return await loaded;
  }catch(e){if(still(session)){info.textContent='Qabul ochilmadi: '+e.message;info.setAttribute('role','alert');if(!session.ready){active=null;frame.remove();}}if(session.visitId)e.visitId=session.visitId;e.hasEditor=session.ready;throw e;}
 }
 async function saveCurrent(){
  const flow=active?.frame.contentWindow?.QabulWorkflow;
  if(flow?.passportDirty?.())return flow.savePassport();
  return saveVisit();
 }
 async function saveVisit(){
  const session=active;if(!session?.ready||session.saving||session.readOnly||!still(session))return false;
  const codec=W.QabulVisitState;let snapshot,payload;
  try{session.frame.contentWindow.QabulClinical?.validate();snapshot=stateSnapshot(session);payload=codec.payload(snapshot.workspace,session.visit);if(snapshot.controls)payload.investigations.qabul_controls=snapshot.controls;}catch(e){session.info.textContent=e.message;session.info.setAttribute('role','alert');return false;}
  session.saving=true;session.save.disabled=true;session.info.textContent='Qabul bemor tarixiga saqlanmoqda…';
  let saved=false;
  try{
   const r=await api('/'+encodeURIComponent(session.patientId)+'/visits/'+encodeURIComponent(session.visitId),'PATCH',payload);
   if(!still(session))return;
   session.visit=r.visit;session.saved=JSON.stringify(snapshot);saved=true;
   if(!unsaved(session))session.frame.contentWindow.UzmedQabul.markSaved?.();
   session.info.textContent=unsaved(session)?'So‘rovdagi nusxa saqlandi. Keyingi kiritilgan o‘zgarishlar uchun yana saqlang.':'Qabul bemor tarixiga saqlandi · v'+r.visit.revision+' · Qoralama.';
   session.info.setAttribute('role','status');return true;
  }catch(e){if(still(session)){session.info.textContent='Saqlanmadi: '+e.message+' Kiritilgan ma’lumot oynada qoldi. Boshqa oynadagi o‘zgarishni almashtirish bajarilmadi.';session.info.setAttribute('role','alert');}return false;}
  finally{session.saving=false;if(still(session)){session.save.disabled=false;if(saved)session.frame.contentWindow.dispatchEvent(new Event('qabul:visit-saved'));}}
 }
 function fitEditor(){if(!root?.classList.contains('ubh-visit-mode'))return;const viewport=W.visualViewport;root.style.setProperty('--ubh-viewport-height',(viewport?.height||W.innerHeight)+'px');root.style.setProperty('--ubh-viewport-top',(viewport?.offsetTop||0)+'px');}
 W.addEventListener('resize',fitEditor,{passive:true});
 W.visualViewport?.addEventListener('resize',fitEditor,{passive:true});W.visualViewport?.addEventListener('scroll',fitEditor,{passive:true});
 W.addEventListener('beforeunload',e=>{if(active?.saving||active?.confirming||unsaved()){e.preventDefault();e.returnValue='';}});
 W.addEventListener('uzmed:auth-change',()=>{if(active&&actor()!==active.subject){revision++;active.frame.remove();active=null;root?.replaceChildren();}});
 function documentDate(value,withTime=false){if(!value)return '';if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value.split('-').reverse().join('.');const d=new Date(value);return Number.isNaN(d.getTime())?String(value):d.toLocaleDateString('uz-UZ',{year:'numeric',month:'2-digit',day:'2-digit',...(withTime?{hour:'2-digit',minute:'2-digit'}:{})});}
 function readable(value){
  if(value===null||value===undefined||value==='')return '';
  if(Array.isArray(value))return value.map(readable).filter(Boolean).join('\n');
  if(typeof value!=='object')return String(value);
  const labels={name:'Nomi',inn:'INN',dose:'Doza',frequency:'Qabul soni / vaqti',route:'Yo‘l',duration:'Davomiylik',food:'Ovqat',notes:'Izoh',goal:'Maqsad',substance:'Modda',reaction:'Reaksiya',severity:'Og‘irlik',value:'Natija',unit:'Birlik',low:'Pastki referens',high:'Yuqori referens',date:'Sana',docname:'Ko‘rsatkich',height:'Bo‘y',weight:'Vazn'};
  return Object.entries(value).filter(([k])=>!/(?:^|_)(?:id)$/.test(k)).map(([k,v])=>{const text=readable(v);return text?(labels[k]||k)+': '+text:'';}).filter(Boolean).join('; ');
 }
 function documentLines(p,codec){
  const entries=[['Bemor',name(p)],['Bemor ID',p.short_code||p.patient_id],['Tug‘ilgan sana',documentDate(p.date_of_birth)],['Jinsi',{male:'Erkak',female:'Ayol'}[p.sex]||p.sex],['Telefon',p.phone],['Qon guruhi',p.blood_group],['Doimiy kasalliklar',readable(p.chronic_conditions)||'Ma’lumot kiritilmagan'],['Allergiyalar',readable(p.allergies)||'Ma’lumot kiritilmagan'],['Doimiy dori vositalari',readable(p.current_medications)||'Ma’lumot kiritilmagan'],['Qamrov','Kartada ko‘rsatilgan oxirgi '+p.visits.length+' qabul']];
  for(const v of p.visits){
   const state=codec.fromVisit(v,p),f=state.fields,e=state.extra;
   entries.push(['Qabul sanasi',documentDate(v.visit_at||v.created_at,true)],['Qabul holati',v.status==='closed'?'Yopilgan':'Ochiq'],['Shifokor',f.doctor],['Shikoyatlar',f.complaints],['Kasallik anamnezi',f.history],['Hayot anamnezi',e.life],['Epidemiologik anamnez',e.epidemiology],['Qabul qilayotgan dorilar',f.medications],['Allergik anamnez',f.allergies],['Obyektiv ko‘rik',f.exam],['Nevrologik status',e.neuro],['Status localis',e.localis],['Ko‘rsatkichlar',readable(v.vitals)],['Qoralama tashxis',f.diagnosis],['Qoralama MKB-10',f.icd],['Hamroh tashxis',e.comorbid],['Raqobatdosh tashxis',e.competing],['Fon kasallik',e.background],['Asorat',e.complication],['Tekshiruv rejasi',f.tests]);
   state.labs.forEach((row,i)=>entries.push(['Laboratoriya natijasi '+(i+1),readable(row)]));
   state.rx.forEach((row,i)=>entries.push(['Qoralama tayinlov '+(i+1),readable(Object.fromEntries(codec.rxKeys.map(k=>[k,row[k]])))]));
   const controls=v.investigations?.qabul_controls||{};entries.push(['Differensial tashxis',controls.differential],['Aniqlashtirish rejasi',controls.diagnostic_plan],['Tekshiruvlar bo‘yicha qaydlar',controls.test_notes]);
   entries.push(['Qo‘shimcha davolash yozuvi',f.treatment],['Tavsiyalar',f.advice],['Nazorat / qayta ko‘rik',f.followup],['Qo‘shimcha tahlillar',readable(Object.fromEntries(Object.entries(v.labs||{}).filter(([k])=>k!=='qabul_labs')))],['Qo‘shimcha tekshiruv qaydlari',readable(Object.fromEntries(Object.entries(v.investigations||{}).filter(([k])=>!['qabul_controls','qabul_workspace','tests','draft_diagnosis','draft_icd','draft_treatment','medications','clinical_approval','template','specialty','documentKind','doctor'].includes(k))))]);
   for(const record of v.diagnoses||[])entries.push([record.status==='confirmed'?'Shifokor tasdiqlagan tashxis':'Tashxis loyihasi ('+record.status+')',[record.diagnosis,record.icd10,record.assessment].filter(Boolean).join(' · ')]);
   for(const record of v.treatment_plans||[])entries.push([record.status==='confirmed'?'Shifokor tasdiqlagan davolash rejasi':'Davolash rejasi loyihasi ('+record.status+')',record.plan]);
   for(const record of v.prescriptions||[])entries.push([record.status==='confirmed'?'Shifokor tasdiqlagan retsept':'Retsept loyihasi ('+record.status+')',(record.items||[]).map(readable).join('\n')],['Retsept tavsiyalari',record.recommendations],['Retsept nazorati',record.follow_up]);
   entries.push(['Qoralama haqida','Qoralama yozuvlar elektron imzo yoki tasdiqlangan retsept emas.']);
  }
  return entries.filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([k,v])=>[k,String(v)]);
 }
 function download(bytes,file,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=el('a');a.href=url;a.download=file;D.body.append(a);a.click();a.remove();W.setTimeout(()=>URL.revokeObjectURL(url),15000);}
 async function exportPatient(patient,kind){const popup=kind==='print'&&!telegramMode()?W.open('','_blank'):null;try{const account=actor(),{patient:p}=await api('/'+encodeURIComponent(patient.patient_id));if(!account||actor()!==account)throw Error('Akkaunt o‘zgardi.');const codec=await stateModule();const full=[];for(const brief of p.visits||[]){if(actor()!==account)throw Error('Akkaunt o‘zgardi.');const {visit}=await api('/'+encodeURIComponent(p.patient_id)+'/visits/'+encodeURIComponent(brief.visit_id));full.push(visit);}if(actor()!==account)throw Error('Akkaunt o‘zgardi.');p.visits=full;const entries=documentLines(p,codec),source=el('article');source.append(el('div','docBrand','UZMED'),el('h1','','BEMOR KARTASI'),el('p','docType','Bemor ID: '+(p.short_code||p.patient_id)));for(const [k,v]of entries){const line=el('p');line.append(el('strong','',k+': '),D.createTextNode(v));source.append(line);}if(kind==='docx'){if(!W.QabulDocx?.create)throw Error('Word yaratish moduli yuklanmadi.');const bytes=W.QabulDocx.create(source,{font:'Times New Roman',size:10,density:'compact',borders:'all',bold:false,italic:false});if(telegramMode()){await telegramDocx(p.patient_id,null,bytes);W.alert?.('Word hujjati o‘z Telegram bot chatingizga yuborildi.');return;}download(bytes,'UZMED-bemor-'+(p.short_code||'karta')+'.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document');}
  else if(kind==='print'&&telegramMode()){source.className='docPage docCard';await printDocument(source,p.patient_id);return;}
  else if(popup){const html='<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>UZMED · Bemor kartasi</title><style>@page{size:A4;margin:16mm}html{background:#edf1f4}body{box-sizing:border-box;max-width:210mm;min-height:297mm;margin:16px auto;padding:16mm;background:#fff;color:#111;font:10.5pt Times New Roman;box-shadow:0 2px 12px #172e3b24}p{white-space:pre-wrap;overflow-wrap:anywhere;text-align:justify;line-height:1.3;margin:0 0 1.75pt;orphans:3;widows:3}h1{font-size:17pt;text-align:center;margin:2mm 0 3mm;break-after:avoid}.docBrand{font:700 8.5pt Arial;letter-spacing:1pt}.docType{text-align:center;font-size:9pt;margin-bottom:5mm}@media print{html{background:#fff}body{max-width:none;min-height:0;margin:0;padding:0;box-shadow:none}}</style></head><body></body></html>';popup.document.open();popup.document.write(html);popup.document.close();popup.document.body.append(popup.document.importNode(source,true));popup.focus();popup.print();}else throw Error('Brauzer chop etish oynasini ochmadi. PDF uchun Safari yoki Chrome orqali oching.');}
 catch(e){if(popup&&!popup.closed){popup.document.body.textContent=e.message;}W.alert?.('Hujjatni chiqarib bo‘lmadi: '+e.message);}}
 const wanted=new URLSearchParams(W.location.search).get('section');let tries=0;const ready=W.setInterval(()=>{if(!W.UZMEDPatients||!D.querySelector('.screens')){if(++tries>100)W.clearInterval(ready);return;}W.clearInterval(ready);if(wanted==='bemorlar'&&!D.getElementById('entryWaiting'))open();const nav=D.querySelector('#uzSideMenu .uz-menu-body');if(nav&&!D.getElementById('uzBemorlarMenu')){const b=btn('👨‍⚕️ Bemorlarim',open,'uz-menu-item');b.id='uzBemorlarMenu';nav.append(b);}},200);
 W.UZMEDBemorlar={open,launchQabul,exportPatient,telegramMode,mayLeave,closeSession};
})(window,document);
