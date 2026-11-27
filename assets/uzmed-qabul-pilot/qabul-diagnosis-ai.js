/* Read-only clinical suggestions. Adding an option to the draft requires a click. */
(function(W,D){
 'use strict';
 function mount(){
  const section=D.querySelector('[data-focus-section="diagnosis"]');
  const search=D.getElementById('icdSearch')?.closest('.search-field');
  if(!section?.contains(search))return;
  const auth=W.parent.UZMEDAuth;
  if(!auth)return;
  const $=id=>D.getElementById(id);
  const node=(tag,text,cls)=>{
   const element=D.createElement(tag);
   if(text)element.textContent=text;
   if(cls)element.className=cls;
   return element;
  };
  const panel=node('section','','qc-dx-panel');
  panel.id='qabulDiagnosisSuggestions';
  panel.hidden=true;
  const status=node('p','','minor qc-dx-status');
  status.setAttribute('role','status');
  const result=node('div');
  const filter=node('select');
  filter.setAttribute('aria-label','AI takliflari turi');
  filter.hidden=true;
  const retry=node('button','Qayta tahlil','qc-choice');
  retry.type='button';
  const head=node('div','','qc-dx-head');
  head.append(node('h3','AI tashxis variantlari'),retry);
  panel.append(head,filter,status,result);
  search.after(panel);
  let permission, active, completedKey, pending=false;
  let selectionButtons=[];

  function scope(){
   const account=auth.getState?.();
   const visit=W.UZMEDVisitBridge?.read();
   const patientId=visit?.patient?.patient_id,visitId=visit?.visit?.visit_id;
   if(!account?.loggedIn||!account.user?.id||!patientId||!visitId||visit.readOnly||visit.visit.status==='closed')return null;
   return {subject:account.user.id,patientId,visitId,revision:visit.visit.revision};
  }
  function snapshot(){
   const {fields:f,extra:e,labs}=W.QabulVisitState.capture(W);
   return {complaints:f.complaints||'',history:f.history||'',life:e.life||'',epidemiology:e.epidemiology||'',
    allergies:f.allergies||'',medications:f.medications||'',exam:f.exam||'',neuro:e.neuro||'',localis:e.localis||'',
    tests:f.tests||'',testNotes:W.QabulClinical?.capture().test_notes||'',height:e.height||'',weight:e.weight||'',
    labs:labs.filter(row=>row.name&&row.value).map(({name,value,unit,low,high})=>({name,value,unit,low,high}))};
  }
  const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
  const keyFor=(current,draft)=>JSON.stringify([current,draft]);
  async function call(current,body,signal){
   const token=await auth.getAccessToken();
   if(!token||!same(scope(),current)||signal.aborted)throw Error('Qabul o‘zgardi. Qayta oching.');
   const path='/api/patients/'+encodeURIComponent(current.patientId)+'/visits/'+encodeURIComponent(current.visitId)+'/qabul-diagnosis';
   const response=await W.fetch(path,{
    method:body?'POST':'GET',cache:'no-store',credentials:'omit',redirect:'error',signal,
    headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
   });
   if(!same(scope(),current)||signal.aborted)throw Error('Qabul o‘zgardi. Qayta oching.');
   const data=await response.json();
   if(!response.ok)throw Error(data.message||'Tahlilni yuklab bo‘lmadi. Qayta urinib ko‘ring.');
   return data;
  }
  function noteList(parent,title,items){
   if(!items.length)return;
   const list=node('ul');
   for(const text of items)list.append(node('li',text));
   parent.append(node('h5',title),list);
  }
  function clearResult(){
   filter.hidden=true;
   filter.onchange=null;
   selectionButtons=[];
   result.replaceChildren();
  }
  function syncSelections(){
   for(const {button,field,name} of selectionButtons){
    const selected=field.value.split('\n').some(line=>line.trim()===name);
    button.textContent=selected?'✓':'+';
    button.setAttribute('aria-pressed',String(selected));
    button.title=selected?'Qoralamaga qo‘shilgan':'Qoralamaga qo‘shish';
   }
  }
  function render(data,current,key){
   status.textContent=data.state==='urgent'?'Shoshilinch holat belgisi bor. Bevosita klinik baholang.':
    data.state==='insufficient'?'Shikoyat, anamnez, ko‘rik yoki tahlil natijasini kiriting.':
    data.shortened?'Uzun qaydlarning bir qismi tahlilga olindi.':
    data.sourceState==='unavailable'?'Tashqi manbalar bilan tekshiruv yakunlanmadi. Variantlar kiritilgan ma’lumotlar asosidagi taxminlar.':
    data.sourceState==='local_only'?'Mahalliy manbalar bilan solishtirildi. Joriy internet dalili olinmadi.':
    data.review==='two_pass'?'Ikki bosqichli tahlil. Variantlar klinik tasdiqlashni talab qiladi.':'';
   clearResult();
   if(data.state!=='ready')return;
   const groups=[
    ['primary','Asosiy variantlar',data.primary,'field-diagnosis'],
    ['comorbid','Hamroh kasalliklar',data.comorbid,'comorbid']
   ];
   const choices=[['all','Barcha variantlar',data.primary.length+data.comorbid.length],
    ...groups.map(([id,label,items])=>[id,label,items.length]),['missing','Aniqlashtirish kerak',data.missing.length]];
   filter.replaceChildren();
   for(const [id,label,count] of choices){
    const option=node('option',label+' ('+count+')');option.value=id;filter.append(option);
   }
   filter.hidden=false;
   function draw(){
    selectionButtons=[];
    result.replaceChildren();
    if(filter.value==='missing'){
     if(data.missing.length)noteList(result,'Yetishmayotgan ma’lumotlar',data.missing);
     else result.append(node('p','Aniqlashtirish uchun band topilmadi.','minor'));
     return;
    }
    for(const [id,title,items,target] of groups){
     if(filter.value!=='all'&&filter.value!==id||filter.value==='all'&&!items.length)continue;
     const field=$(target);
     result.append(node('h4',title,'qc-dx-group'));
     if(!items.length)result.append(node('p','Qabul yozuvida yetarli dalil topilmadi.','minor'));
     for(const [index,item] of items.entries()){
      const option=node('div','','qc-dx-option');
      const details=node('details');
      const leading=id==='primary'&&index===0;
      details.open=leading;
      const head=node('summary',(leading?'Eng asosli taxmin: ':'')+item.name);
      if(Number.isInteger(item.likelihood)){
       const meter=node('span','','qc-dx-pct');
       meter.style.setProperty('--qc-dx-pct',item.likelihood+'%');
       meter.append(node('b',item.likelihood+'%'));
       meter.title='AI taxminiy ehtimoli — kiritilgan ma’lumotlar asosida, o‘lchangan qiymat emas';
       head.append(meter);
      }
      details.append(head);
      if(item.summary)details.append(node('p',item.summary,'minor'));
      if(item.risk==='urgent')details.append(node('p','Zudlik bilan klinik baholash va istisno qilish kerak.','qc-dx-status'));
      else if(item.risk==='prompt')details.append(node('p','Yaqin muddatda klinik baholash kerak.','minor'));
      noteList(details,'Mos dalillar',item.support.map(row=>row.label+' — '+row.quote));
      noteList(details,'Qarshi dalillar',item.against.map(row=>row.label+' — '+row.quote));
      if(!item.against.length)details.append(node('p','Kiritilgan yozuvda aniq qarshi dalil topilmadi; bu tashxis tasdig‘i emas.','minor'));
      noteList(details,'Aniqlashtirish',item.missing);
      noteList(details,'Farqlovchi tekshiruvlar va sinamalar',item.nextTests||[]);
      noteList(details,'Solishtirilgan manba konteksti',(item.references||[]).map(row=>row.id+' · '+row.title+(row.scope==='local_context'?' (mahalliy yozuv)':'')+' — '+row.quote));
      const use=node('button','+','qc-choice qc-dx-add');
      use.type='button';
      use.setAttribute('aria-label',item.name+' — qoralamaga qo‘shish');
      use.onclick=()=>{
       if(!same(scope(),current)||keyFor(current,snapshot())!==key){invalidate();return;}
       if(use.getAttribute('aria-pressed')==='true')return;
       const value=[field.value,item.name].filter(Boolean).join('\n');
       if(field.maxLength>=0&&value.length>field.maxLength){status.textContent='Qoralama maydoni chegarasi oshdi.';return;}
       field.value=value;
       $('icdChecked').checked=false;
       $('approved').checked=false;
       field.dispatchEvent(new W.Event('input',{bubbles:true}));
       status.textContent=id==='comorbid'?'Hamroh tashxis qoralamaga qo‘shildi.':'Asosiy tashxis qoralamaga qo‘shildi.';
      };
      selectionButtons.push({button:use,field,name:item.name});
      const pick=node('button','100%','qc-choice qc-dx-pick');
      pick.type='button';
      pick.setAttribute('aria-label',item.name+' — asosiy tashxis sifatida yozish');
      pick.title='Shifokor tasdig‘i: asosiy tashxis va MKB-10 maydoniga yoziladi';
      pick.onclick=()=>{
       if(!same(scope(),current)||keyFor(current,snapshot())!==key){invalidate();return;}
       const main=$('field-diagnosis'),icd=$('field-icd');
       if(!main)return;
       if(main.maxLength>=0&&item.name.length>main.maxLength){status.textContent='Qoralama maydoni chegarasi oshdi.';return;}
       main.value=item.name;
       if(icd&&item.code)icd.value=item.code;
       $('icdChecked').checked=false;
       $('approved').checked=false;
       main.dispatchEvent(new W.Event('input',{bubbles:true}));
       if(icd&&item.code)icd.dispatchEvent(new W.Event('input',{bubbles:true}));
       status.textContent='Asosiy tashxis yozildi: '+item.name+(item.code?' · '+item.code+' (MKB-10 kodini tekshiring)':'')+'.';
       main.scrollIntoView({block:'center',behavior:'smooth'});
      };
      option.append(details,use,pick);
      result.append(option);
     }
    }
    if(filter.value==='all'&&!data.primary.length&&!data.comorbid.length)result.append(node('p','Dalilli tashxis varianti topilmadi.','minor'));
    if(filter.value==='all')noteList(result,'Xulosani aniqlashtirish uchun',data.missing);
    syncSelections();
   }
   filter.onchange=draw;
   draw();
  }
  function invalidate(){
   if(!active||!permission?.allowed)return;
   try{
    if(!completedKey)return;
    if(keyFor(scope(),snapshot())===completedKey){syncSelections();return;}
   }catch{}
   completedKey=null;
   clearResult();
   status.textContent='Qabul ma’lumoti o‘zgardi. Qayta tahlil qiling.';
  }
  async function refresh(force=false){
   if(section.hidden||pending)return;
   let current;
   try{current=scope();}catch{return;}
   if(!current)return;
   const subjectKey=JSON.stringify([current.subject,current.patientId,current.visitId]);
   if(permission&&permission.key!==subjectKey){permission=null;completedKey=null;panel.hidden=true;clearResult();}
   if(permission?.allowed===false)return;
   const controller=new W.AbortController();
   active=controller;
   pending=true;
   retry.disabled=true;
   try{
    if(!permission){
     const access=await call(current,null,controller.signal);
     permission={key:subjectKey,allowed:access.available===true,configured:access.configured===true};
    }
    if(!permission.allowed)return;
    panel.hidden=false;
    if(!permission.configured){status.textContent='GLM tashxis xizmati sozlanmagan.';return;}
    if(section.hidden)return;
    const draft=snapshot(),key=keyFor(current,draft);
    if(!force&&completedKey===key)return;
    completedKey=key;
    clearResult();
    status.textContent='Qabulning barcha bo‘limlari solishtirilmoqda; manbalar bilan qayta tekshirilmoqda…';
    const data=await call(current,{expectedRevision:current.revision,draft},controller.signal);
    if(key!==completedKey||keyFor(scope(),snapshot())!==key){
     invalidate();
     if(!completedKey)status.textContent='Qabul ma’lumoti o‘zgardi. Qayta tahlil qiling.';
     return;
    }
    render(data,current,key);
   }catch(error){
    if(!controller.signal.aborted){
     completedKey=null;
     if(permission?.allowed)status.textContent=error.message||'Tahlilni yuklab bo‘lmadi.';
    }
   }finally{
    if(active===controller){pending=false;retry.disabled=false;}
   }
  }
  retry.onclick=()=>refresh(true);
  D.addEventListener('input',invalidate);
  D.addEventListener('change',invalidate);
  W.addEventListener('qabul:document-edit',invalidate);
  W.addEventListener('qabul:session-ready',()=>refresh());
  W.parent.addEventListener('uzmed:auth-change',()=>{
   if(!permission)return;
   const account=auth.getState?.();
   if(account?.loggedIn&&account.user?.id===JSON.parse(permission.key)[0])return;
   active?.abort();
   permission=null;completedKey=null;pending=false;panel.hidden=true;clearResult();
  });
  new W.MutationObserver(()=>refresh()).observe(section,{attributes:true,attributeFilter:['hidden']});
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})(window,document);

