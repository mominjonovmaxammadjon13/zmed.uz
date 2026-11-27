/* The authenticated visit bridge owns persistence and clinical signatures. */
(function(W,D){
 'use strict';
 function mount(){
  const $=id=>D.getElementById(id),panel=$('panel-treatment');
  if(!panel||!W.QabulFocus)return;
  const el=(tag,cls,value)=>{const n=D.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;};
  const button=(label,action,cls='qflow-action')=>{const n=el('button',cls,label);n.type='button';n.onclick=action;return n;};
  const review=el('details','qt-review'),root=el('section','qt-card');
  review.hidden=true;
  root.id='qabulTreatment';root.setAttribute('aria-label','Retseptni ko‘rib chiqish');
  review.append(el('summary','','Retseptni ko‘rib chiqish'),root);
  const stats=el('div','qt-stats'),status=el('p','qt-status'),result=el('div','qt-result'),actions=el('div','qt-actions');
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const retry=button('Qayta tekshirish',()=>{attempted='';enter();});
  const reset=button('Umumiy qoralama',()=>selectIngredient(''));
  retry.hidden=reset.hidden=true;
  const formats=el('div','qt-formats'),table=button('Jadval',()=>setFormat(false)),text=button('Matn',()=>setFormat(true));
  formats.append(table,text);formats.hidden=true;
  actions.append(retry,reset);root.append(stats,status,formats,result,actions);
  const planPane=panel.querySelector('#uzmedQabulV3 .uv3-right');
  const tools=planPane?.querySelector('.uv3-native-extra');
  if(tools)tools.append(review);else (planPane||panel).append(review);
  const addBar=panel.querySelector('.uv3-add-area'),manual=$('qcAddMedicine');
  if(addBar&&manual)addBar.append(manual);
  const extra=panel.querySelector('.qflow-treatment-tools');
  if(extra&&addBar){extra.append($('addRx'));addBar.after(extra);}

  let busy=false,attempted='',shown='',selectedDrug=null,model=null;
  function activeIngredient(){
   if(!selectedDrug)return '';
   const {row,name,inn,ingredient}=selectedDrug;
   if(row&&(!row.isConnected||row.querySelector('[name=name]')?.value!==name||row.querySelector('[name=inn]')?.value!==inn))return '';
   return ingredient;
  }
  function setFormat(asText){
   result.classList.toggle('qt-text-mode',asText);
   table.setAttribute('aria-pressed',String(!asText));
   text.setAttribute('aria-pressed',String(asText));
  }
  setFormat(false);
  const diagnosisIsTemplate=value=>/\[[^\]]{1,240}\]/u.test(String(value||''))||/differensial\s+tashxis\s*:/iu.test(String(value||''));
  const bridge=()=>W.UZMEDVisitBridge;
  function measure(key){const input=$('qp-'+key);return W.QabulWorkflow?.passportDirty?.()&&input?input.value:$(key).value;}
  function updateStats(){
   const height=measure('height'),weight=measure('weight'),bmi=W.QabulPassport?.bmi(height,weight);
   const diagnosis=$('field-diagnosis').value.trim()||bridge()?.read().visit.diagnosis;
   stats.replaceChildren(...[diagnosis,weight&&weight+' kg',bmi&&'TVI '+bmi].filter(Boolean).map(v=>el('span','',v)));
  }
  function sources(host,values,quote=''){
   if(!values.length&&!quote)return;
   const details=el('details','qt-sources');details.append(el('summary','','Manba va asos'));
   for(const source of values){
    const label=[source.title,source.version&&'v'+source.version].filter(Boolean).join(' · ');
    if(!label)continue;
    let url;try{url=new URL(source.url);}catch{}
    if(url?.protocol==='https:'){const link=el('a','',label);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';details.append(link);}
    else details.append(el('span','',label));
   }
   if(quote)details.append(el('blockquote','',quote));
   host.append(details);
  }
  function render(data){
   model=data;result.replaceChildren();
   updateStats();
   review.hidden=false;
   const p=data.prescriptionDraft,confirmed=p?.status==='confirmed';
   formats.hidden=!p;
   if(p&&data.assistantDraft){setFormat(true);review.open=true;}
   const ingredient=activeIngredient();
   status.textContent=confirmed?'Retsept bemor tarixiga saqlandi.':p?(ingredient?'Faol modda — '+ingredient+'. Ko‘rsatilgan doza manbadagi shaklga tegishli.':'Manba, doza va qabul tartibini ko‘rib chiqing.'):data.text||'Manbali retsept uchun ma’lumot yetarli bo‘lmadi.';
   if(!p){
    const missing=[...new Set(data.missingInformation||[])];
    if(!missing.length){missing.push(status.textContent);status.textContent='Retsept loyihasi tayyorlanmadi.';}
    const list=el('ul','qt-missing');
    list.append(...missing.map(value=>el('li','',value)));
    result.append(el('h3','',data.diagnosisInputRequired?'Tashxisni aniqlashtiring':'Nega loyiha to‘xtadi?'),list);
    sources(result,data.sources||[]);
    return;
   }
   const references=Array.isArray(data.sources)?data.sources:[];
   for(const item of p.items||[]){
    const card=el('article','qt-item'),name=el('h3','',item.name||item.inn),fields=el('dl','qt-fields');
    const group=[item.inn,item.source?.pharmacological_group].filter(Boolean).join(' · ');
    card.append(name);if(group)card.append(el('p','qt-caption',group));
    const lines=[['XNN',item.inn],['Doza',item.dose],['Qabul yo‘li',item.route],['Qabul soni yoki vaqti',item.frequency],['Ovqatga nisbatan',item.food],['Davomiyligi',item.duration],['Maqsad',item.goal],['Izoh',item.notes]].filter(([,value])=>value);
    for(const [label,value]of lines)fields.append(el('dt','',label),el('dd','',value));
    card.append(fields,el('p','qt-text-rx',lines.map(([label,value])=>label+' — '+value).join('\n')));
    if(item.source?.calculation)card.append(el('p','qt-calculation',item.source.calculation));
    sources(card,references.filter(r=>r.id===item.source?.id),item.source?.quote);
    result.append(card);
   }
   for(const [label,value]of [['Tavsiyalar',p.recommendations],['Nazorat',p.follow_up]])if(value){const row=el('p','');row.append(el('strong','',label+' · '),D.createTextNode(value));result.append(row);}
   if(p.safety?.passed!==true)return;
   const verify=el('details','qt-sources');verify.append(el('summary','','Qabul dalillari va xavfsizlik tekshiruvlari'));
   const labels={demographics:'Bemor pasporti',complaint:'Shikoyatlar',timeline:'Kasallik kechishi',history:'Anamnez',allergies_medications:'Allergiya va dorilar',red_flags:'Shoshilinch belgilar',relevant_examinations:'Ko‘rik va tekshiruvlar',differential:'Differensial tashxis',contradictions:'Qarama-qarshi belgilar',diagnosis:'Tashxis',age:'Yosh',weight:'Vazn',pregnancy_lactation:'Homiladorlik va emizish',allergies:'Allergiya',renal:'Buyrak faoliyati',hepatic:'Jigar faoliyati',current_medications:'Hozirgi dorilar',interactions:'Dorilar o‘zaro ta’siri',contraindications:'Qarshi ko‘rsatmalar',duplicate_therapy:'Takroriy davo',dose:'Doza',duration:'Davomiylik'};
   for(const check of [...(p.safety.clinicalChecks||[]),...(p.safety.checks||[])]){
    const records=check.recordEvidence||[];
    const values=[check.status==='not_required'?'Tegishli emas':null,check.reason,...(check.evidence||[]).filter(text=>!records.some(row=>row.text===text))].filter(Boolean);
    verify.append(el('p','',(labels[check.kind]||check.kind)+(values.length?' · '+values.join(' · '):'')));
    for(const row of records)verify.append(el('blockquote','',row.label+' · '+row.text));
   }
   result.append(verify);
   if(confirmed)return;
   const diagnosis=data.diagnosisDraft;
   if(diagnosis)result.append(el('p','qt-caption','Tasdiqlanadigan tashxis · '+diagnosis.diagnosis));
   const type=diagnosis?'diagnosis':'prescription',id=diagnosis?.diagnosis_id||p.prescription_id;
   if(id&&(diagnosis||data.diagnosisConfirmed))result.append(button(diagnosis?'Tashxisni tasdiqlash':'Retseptni tasdiqlash',()=>confirm(type,id),'qflow-action qt-primary'));
  }
  async function confirm(type,id){
   if(busy||!model||shown!==currentKey())return;
   if(!W.confirm(type==='diagnosis'?'Tashxisni tasdiqlaysizmi? Tasdiqdan so‘ng qabul tahriri yopiladi.':'Ushbu retseptni shifokor sifatida tasdiqlaysizmi?'))return;
   busy=true;root.setAttribute('aria-busy','true');const prior=model;
   try{
    const record=await bridge().confirmTreatment(type,id);
    shown=currentKey();
    render(type==='diagnosis'?{...prior,diagnosisDraft:null,diagnosisConfirmed:true}:{...prior,prescriptionDraft:record});
   }catch(e){status.textContent=e.message;}
   finally{busy=false;root.removeAttribute('aria-busy');}
  }
  function ready(){
   const filled=id=>Boolean($(id)?.value.trim());
   return ['field-diagnosis','field-complaints','field-history'].every(filled)
    && ['field-exam','localis','neuro'].some(filled)
    && Boolean(bridge().read().patient.date_of_birth)
    && (['field-tests','qc-test_notes'].some(filled)
      || [...$('labs').children].some(row=>row.querySelector('[name=name]')?.value.trim()&&row.querySelector('[name=value]')?.value.trim()));
  }
  const currentKey=()=>JSON.stringify([bridge()?.treatmentKey(),activeIngredient()]);
  function clearResult(){model=null;result.replaceChildren();formats.hidden=true;retry.hidden=true;review.hidden=true;}
  async function run(key){
   attempted=key;busy=true;clearResult();root.setAttribute('aria-busy','true');
   try{
    const data=await bridge().treatment({ingredient:activeIngredient()||undefined,automatic:true});
    if(key===currentKey()){shown=key;render(data);}
   }catch(e){
    if(key===currentKey()){
     shown=key;status.textContent=e.message;retry.hidden=false;review.hidden=false;
    }
   }finally{
    busy=false;root.removeAttribute('aria-busy');
    if(key!==currentKey())enter();
   }
  }
  function enter(){
   if(!bridge()?.treatment||W.QabulFocus.current()!=='treatment')return;
   const {visit,readOnly}=bridge().read();
   if(model?.prescriptionDraft?.status==='confirmed'||visit.status==='closed')return;
   reset.hidden=!activeIngredient();
   const key=currentKey();
   if(shown!==key&&!review.hidden){attempted='';review.open=false;clearResult();}
   if(busy)return;
   if(readOnly||!bridge().treatmentSaved?.()||diagnosisIsTemplate($('field-diagnosis').value)||!ready())return;
   if(attempted!==key)void run(key);
  }
  function selectIngredient(value){
   if(model?.prescriptionDraft?.status==='confirmed'||bridge()?.read()?.readOnly)return;
   selectedDrug=typeof value==='string'?{ingredient:value}:value;
   enter();
  }
  W.QabulTreatmentChat={async request(requestText){
   if(!bridge()?.treatment||bridge().read().readOnly)throw Error('Tahrirlanadigan qabulni oching.');
   if(busy)throw Error('Oldingi sxema tekshirilmoqda.');
   if(!/^(?:iltimos[,]? )?(?:(?:shu|ushbu|bu) (?:qabul|bemor) uchun )?(?:(?:davolash|davo) (?:sxemasini|rejasini)|retsept(?:ni)?) (?:ham )?(?:tuz(?:ib ber(?:ing)?|ing)?|yoz(?:ib ber(?:ing)?|ing)?|tayyorla(?:ng)?)$/u.test(requestText.trim().toLowerCase().replace(/[.!?]+$/u,'')))throw Error('«Davolash sxemasini tuzing» deb yuboring.');
   busy=true;root.setAttribute('aria-busy','true');
   try{
    const data=await bridge().treatment({requestText});
    if(!data.prescriptionDraft)return [data.text,...(data.missingInformation||[])].filter(Boolean).join(' ');
    selectedDrug=null;shown=attempted=currentKey();retry.hidden=true;
    render({...data,assistantDraft:true});
    W.QabulFocus.show('treatment');
    D.querySelector('.uv3-mobile-button[data-pane=plan]')?.click();
    review.scrollIntoView({block:'nearest'});
    return 'Davolash → Matn ochildi. Sxemani va manbalarni tekshiring.';
   }finally{busy=false;root.removeAttribute('aria-busy');}
  }};
  function activate(){
   if(!bridge()?.treatment)return;
   const visit=bridge().read().visit,confirmed=(visit.prescriptions||[]).find(p=>p.status==='confirmed');
   if(confirmed)render({prescriptionDraft:confirmed,sources:confirmed.source_metadata||[]});
   else queueMicrotask(enter);
  }
  W.addEventListener('qabul:session-ready',activate);
  W.addEventListener('qabul:drug-check',event=>{
   if(typeof event.detail==='string'||typeof event.detail?.ingredient==='string')selectIngredient(event.detail);
  });
  W.addEventListener('qabul:visit-saved',enter);
  D.querySelector('[data-focus-tab=treatment]')?.addEventListener('click',()=>queueMicrotask(enter));
  const section=panel.closest('[data-focus-section=treatment]');
  if(section)new MutationObserver(()=>{if(!section.hidden)enter();}).observe(section,{attributes:true,attributeFilter:['hidden']});
  D.addEventListener('input',event=>{if(event.target.id!=='drugSearch')enter();});
  W.addEventListener('qabul:document-edit',enter);
  W.addEventListener('qabul:passport-saved',enter);
  if(bridge()?.treatment)activate();
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
