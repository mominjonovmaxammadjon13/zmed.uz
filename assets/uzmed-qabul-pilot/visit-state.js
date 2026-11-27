/* Versioned visit data shared by the form adapter and the existing patient API. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.QabulVisitState=api;
})(typeof window==='object'?window:globalThis,function(){
 'use strict';
 const fields=['template','specialty','customSpecialty','documentKind','patient','age','date','doctor','complaints','history','medications','allergies','exam','diagnosis','icd','treatment','advice','followup','tests'];
 const extras=['sex','life','epidemiology','neuro','localis','comorbid','competing','background','complication','height','weight','reminder'];
 const rxKeys=['name','inn','dose','frequency','route','duration','food','notes','goal'];
 const sourceKeys=['sourceKey','source','sourceUrl','sourceVersion'];
 const labKeys=['name','value','unit','low','high','date','docname'];
 const renalKeys=['egfr','dialysis','age','sex','creatinine','unit','stable','date'];
 const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
 function fail(message){throw Error('Qabul ma’lumoti: '+message);}
 function strings(v,keys,max){
  if(!object(v)||Object.keys(v).some(k=>!keys.includes(k)))fail('maydon tuzilmasi noto‘g‘ri.');
  for(const [k,x]of Object.entries(v))if(typeof x!=='string'||x.length>max)fail(k+' qiymati yoki hajmi noto‘g‘ri.');
 }
 function validate(s){
  if(!object(s)||s.version!==1)fail('versiya qo‘llab-quvvatlanmaydi. Eski ma’lumotni almashtirmang.');
  if(Object.keys(s).some(k=>!['version','fields','extra','rx','labs','renal','document'].includes(k)))fail('noma’lum bo‘lim.');
  strings(s.fields,fields,12000);strings(s.extra,extras,5000);
  if(!Array.isArray(s.rx)||s.rx.length>30)fail('30 tagacha dori qatori mumkin.');
  for(const row of s.rx){const prescription=Object.fromEntries(Object.entries(row).filter(([k])=>!sourceKeys.includes(k)));strings(prescription,rxKeys,200);strings(Object.fromEntries(Object.entries(row).filter(([k])=>sourceKeys.includes(k))),sourceKeys,500);}
  if(!Array.isArray(s.labs)||s.labs.length>50)fail('50 tagacha natija qatori mumkin.');
  for(const row of s.labs)strings(row,labKeys,100);
  strings(s.renal,renalKeys,100);
  for(const value of [s.fields.date,s.renal.date,...s.labs.map(r=>r.date)])if(value){
   const date=new Date(value+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)fail('sana YYYY-MM-DD formatida bo‘lishi kerak.');
  }
  if(s.renal.stable&&!['yes','no'].includes(s.renal.stable))fail('kreatinin sharti noto‘g‘ri.');
  if(s.document!==undefined){
   if(!object(s.document))fail('hujjat sozlamalari noto‘g‘ri.');
   for(const [k,v]of Object.entries(s.document))if(!['font','size','density','lab','med','order','borders','bold','italic','institution'].includes(k)||!['string','number','boolean'].includes(typeof v)||String(v).length>200)fail('hujjat sozlamasi noto‘g‘ri.');
  }
  if(JSON.stringify(s).length>100000)fail('qoralama hajmi 100 000 belgidan oshdi; hech narsa qisqartirib saqlanmadi.');
  return s;
 }
 function rows(container,keys){return [...container.children].map(row=>Object.fromEntries(keys.map(k=>[k,row.querySelector('[name="'+k+'"]')?.value||''])));}
 function capture(w){
  const d=w.document,$=id=>d.getElementById(id),out={version:1,fields:{},extra:{},rx:rows($('rxRows'),rxKeys),labs:rows($('labs'),labKeys),renal:w.UzmedVideoFeatures?.renalState?.()||{}};
  [...$('rxRows').children].forEach((row,index)=>{if(row.dataset.sourceName===out.rx[index].name&&row.dataset.sourceInn===out.rx[index].inn)for(const k of sourceKeys)if(row.dataset[k])out.rx[index][k]=row.dataset[k];});
  for(const k of fields){const n=$(k==='template'||['specialty','customSpecialty','documentKind'].includes(k)?k:'field-'+k);if(n)out.fields[k]=n.value;}
  for(const k of extras)if($(k))out.extra[k]=$(k).value;
  if(w.QabulDocument?.settings)out.document=w.QabulDocument.settings();
  return validate(out);
 }
 function legacy(visit,patient){
  const v=visit||{},i=v.investigations||{},e={life:v.anamnesis_vitae||'',height:v.vitals?.height==null?'':String(v.vitals.height),weight:v.vitals?.weight==null?'':String(v.vitals.weight)};
  const f={complaints:v.chief_complaint||'',history:v.anamnesis_morbi||'',allergies:v.allergic_anamnesis||'',exam:v.objective_exam||'',advice:v.recommendations||'',followup:v.follow_up||'',tests:i.tests||i.raw_text||'',diagnosis:i.draft_diagnosis||v.diagnosis||'',icd:i.draft_icd||v.icd10||'',treatment:i.draft_treatment||v.treatment||'',medications:i.medications||'',template:i.template||'initial',specialty:i.specialty||'',customSpecialty:'',documentKind:i.documentKind||'exam',doctor:i.doctor||'',date:String(v.visit_at||v.created_at||'').slice(0,10),age:i.anamnesis_intake?.profile?.age_raw||''};
  const labs=Array.isArray(v.labs?.qabul_labs)?v.labs.qabul_labs:[];
  // Keep legacy prose verbatim. Never reconstruct drug doses from text.
  return validate({version:1,fields:f,extra:e,rx:[],labs,renal:{}});
 }
 function fromVisit(visit,patient){
  const stored=visit?.investigations?.qabul_workspace;
  return stored===undefined?legacy(visit,patient):validate(JSON.parse(JSON.stringify(stored)));
 }
 function hydrate(w,state,patient){
  validate(state);const d=w.document,$=id=>d.getElementById(id);
  for(const k of fields){const n=$(k==='template'||['specialty','customSpecialty','documentKind'].includes(k)?k:'field-'+k);if(n)n.value=state.fields[k]||'';}
  for(const k of extras)if($(k))$(k).value=state.extra[k]||'';
  $('labs').replaceChildren();for(const row of state.labs)w.UzmedQabul.addLab(row);if(!state.labs.length)w.UzmedQabul.addLab();
  $('rxRows').replaceChildren();for(const row of state.rx){$('addRx').click();const last=$('rxRows').lastElementChild;for(const k of rxKeys)last.querySelector('[name="'+k+'"]').value=row[k]||'';w.UzmedQabul.bindSource?.(last,row);}
  w.UzmedVideoFeatures?.restoreRenal?.(state.renal);
  w.QabulDocument?.restoreSettings?.(state.document||{});
  $('customSpecialtyField').hidden=$('specialty').value!=='other';
  if(patient){
   $('field-patient').value=[patient.last_name,patient.first_name,patient.middle_name].filter(Boolean).join(' ')+' · '+(patient.short_code||patient.patient_id);
   $('field-patient').readOnly=true;
   if(!state.extra.sex&&['male','female'].includes(patient.sex))$('sex').value=patient.sex==='male'?'Erkak':'Ayol';
   if(!state.fields.age&&/^\d{4}-\d{2}-\d{2}$/.test(patient.date_of_birth||'')){
    const birth=new Date(patient.date_of_birth),at=new Date(state.fields.date||Date.now());let age=at.getFullYear()-birth.getFullYear();
    if(at.getMonth()<birth.getMonth()||(at.getMonth()===birth.getMonth()&&at.getDate()<birth.getDate()))age--;
    if(age>=0)$('field-age').value=age+' yosh';
   }
  }
  // Local checkmarks never become server-side clinical approval, including on reopen.
  for(const k of ['icdChecked','ddiChecked','rxChecked','approved'])$(k).checked=false;
  w.UzmedQabul.render();w.QabulFocus?.update?.();w.QabulDocument?.refresh?.();w.dispatchEvent(new w.CustomEvent('qabul:restored'));
 }
 function payload(state,visit){
  validate(state);if(!Number.isSafeInteger(visit?.revision)||visit.revision<0)fail('qabul versiyasi topilmadi. Qayta oching.');
  const f=state.fields,e=state.extra;
  const result={expectedRevision:visit.revision,chief_complaint:f.complaints||'',anamnesis_morbi:f.history||'',anamnesis_vitae:e.life||'',allergic_anamnesis:f.allergies||'',objective_exam:f.exam||'',recommendations:f.advice||'',follow_up:f.followup||'',labs:{...visit.labs,qabul_labs:state.labs},investigations:{...visit.investigations,qabul_workspace:state,tests:f.tests||'',draft_diagnosis:f.diagnosis||'',draft_icd:f.icd||'',draft_treatment:f.treatment||'',medications:f.medications||'',clinical_approval:'unreviewed'}};
  result.vitals={...visit.vitals};for(const [key,min,max]of [['height',20,260],['weight',0.3,500]]){
   if(e[key]){const value=Number(e[key]);if(!Number.isFinite(value)||value<min||value>max)fail(key+' qiymatini tekshiring.');result.vitals[key]=value;}
   else delete result.vitals[key];
  }
  if(JSON.stringify(result.labs).length>120000||JSON.stringify(result.investigations).length>120000||new TextEncoder().encode(JSON.stringify(result)).length>180000)fail('saqlash hajmi katta. Hech qaysi qator qisqartirilmadi.');
  return result;
 }
 return {version:1,fields,extras,rxKeys,labKeys,capture,validate,hydrate,fromVisit,payload};
});
