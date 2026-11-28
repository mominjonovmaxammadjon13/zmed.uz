/* Presentation adapter. Existing visit fields and clinical approval remain authoritative. */
(function(W,D){'use strict';function mount(){
 const $=id=>D.getElementById(id),kit=W.UzmedQabul,focus=W.QabulFocus;if(!kit||!focus)return;
 const el=(tag,text,cls)=>{const n=D.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const locked=()=>{try{return W.UZMEDVisitBridge?.read().readOnly===true;}catch{return true;}};
 const edit=field=>{if($('approved'))$('approved').checked=false;if($('icdChecked'))$('icdChecked').checked=false;field.dispatchEvent(new W.Event('input',{bubbles:true}));kit.render();W.dispatchEvent(new W.CustomEvent('qabul:document-edit'));};
 const type=$('qcDiagnosisType'),library=$('qcDiagnoses'),panel=$('panel-diagnosis');
 if(type&&library){
  const tabs=type.closest('.qc-dx-field'),main=$('slot-diagnosis').parentElement;
  tabs.querySelector('label').textContent='Tashxis turi';panel.prepend(tabs,main);
  // Har bir tashxis turi maydoni «Tashxis turi» ostida, Asosiy tashxis bilan bir xil joyda (keyin MKB katalogi).
  {let anchor=main;for(const n of [$('extra-complication'),$('extra-comorbid'),$('qc-differential')?.closest('.field'),$('qc-diagnostic_plan')?.closest('.field')]){if(n&&n!==main){anchor.after(n);anchor=n;}}}
  library.open=true;library.classList.add('qc-library','qc-complaints','qa-diagnoses');library.querySelector('summary').hidden=true;library.prepend(el('h3','Tayyor tashxislar'));
  const search=$('icdSearch');library.querySelector('h3').after(search);search.setAttribute('aria-label','Tashxisni kod yoki nom bo‘yicha qidirish');
  const label=D.querySelector('label[for="icdSearch"]');if(label)label.hidden=true;
  const target=()=>({main:'field-diagnosis',comorbid:'comorbid',complication:'complication',differential:'qc-differential',diagnostic_plan:'qc-diagnostic_plan'}[type.value]);
  const list=$('icdResults');
  function sync(){const field=$(target());for(const b of list.querySelectorAll('button[data-icd-row]')){
   if(!b.dataset.phrase){const parts=b.textContent.split(' · ');if(parts.length<2)continue;b.dataset.code=parts.shift();b.dataset.phrase=b.dataset.code+' — '+parts.join(' · ');b.replaceChildren(el('span',b.dataset.phrase),el('span','+','qc-phrase-mark'));}
   const selected=field.value.split('\n').includes(b.dataset.phrase);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));b.disabled=locked();const mark=b.lastChild;if(mark.textContent!==(selected?'✓':'+'))mark.textContent=selected?'✓':'+';
  }}
  list.addEventListener('click',event=>{const b=event.target.closest('button[data-icd-row]');if(!b)return;if(locked()){event.stopImmediatePropagation();return;}const field=$(target()),lines=field.value.split('\n'),at=lines.indexOf(b.dataset.phrase);if(at<0)return;
   event.preventDefault();event.stopImmediatePropagation();lines.splice(at,1);field.value=lines.join('\n');
   if(target()==='field-diagnosis'&&!lines.some(line=>line.startsWith(b.dataset.code+' — '))){$('field-icd').value=$('field-icd').value.split(/[;,\n]+/).map(s=>s.trim()).filter(s=>s!==b.dataset.code).join('; ');}
   edit(field);sync();
  },true);
  new MutationObserver(sync).observe(list,{childList:true,subtree:true});D.addEventListener('input',sync);type.addEventListener('change',sync);for(const event of ['qabul:restored','qabul:session-ready','qabul:document-edit'])W.addEventListener(event,sync);sync();
 }
 const exam=D.querySelector('[data-focus-section="exam"]'),picker=exam?.querySelector('.qc-section-picker select');
 const bank=D.querySelector('[data-phrase-target="field-exam"]'),category=bank?.querySelector('select');
 if(picker&&category){const original=picker.onchange;const custom=new Map();
  for(const name of W.UZMEDClinicalPhraseCatalog.examTypes||[]){const option=el('option',name);option.value='specialty:'+name;picker.append(option);custom.set(option.value,name);}
  const option=el('option','Xalqaro klinik belgilar (HPO / EN)');option.value='international';picker.append(option);
  picker.onchange=()=>{const value=picker.value;const selected=custom.get(value);if(selected||value==='international'){picker.value='slot-exam';original.call(picker);picker.value=value;category.value=selected||'Barchasi';category.dispatchEvent(new W.Event('change'));}else original.call(picker);bank.hidden=value==='international';intlExam.hidden=value!=='international';if(!intlExam.hidden)loadIntl(intlExam,'exam',$('field-exam'));};
  const note=el('small','Tizimlar bo‘yicha yozuvlar obyektiv ko‘rikda birga saqlanadi.','minor');picker.parentElement.append(note);
 }
 let pending;const norm=s=>String(s||'').toLowerCase().replace(/['‘’ʻʼ`]/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 function international(){if(!pending)pending=fetch('./hpo-clinical-20260901.json',{credentials:'omit'}).then(r=>{if(!r.ok)throw Error('Xalqaro belgilar yuklanmadi.');return r.json();}).then(data=>{
  if(data.system!=='Human Phenotype Ontology'||data.count!==data.terms.length)throw Error('Xalqaro katalog tuzilmasi mos emas.');
  const rootNames=new Set(['Pain','Pruritus','Fatigue','Dyspnea','Cough','Nausea','Vomiting','Diarrhea','Constipation','Dysphagia','Dysuria','Dizziness','Vertigo','Paresthesia','Headache','Visual impairment','Hearing impairment','Tinnitus','Sleep disturbance','Anxiety','Palpitations','Polyuria','Polydipsia']);const children=new Map();
  for(const t of data.terms){if(!/^HP:\d{7}$/.test(t.id)||typeof t.label!=='string'||!Array.isArray(t.parents))throw Error('Xalqaro belgi mos emas.');for(const p of t.parents){if(!children.has(p))children.set(p,[]);children.get(p).push(t.id);}}
  const queue=data.terms.filter(t=>rootNames.has(t.label)).map(t=>t.id),subjective=new Set();for(let i=0;i<queue.length;i++){const id=queue[i];if(subjective.has(id))continue;subjective.add(id);queue.push(...children.get(id)||[]);}
  return {...data,complaints:data.terms.filter(t=>subjective.has(t.id))};
 }).catch(e=>{pending=null;throw e;});return pending;}
 async function loadIntl(host,scope,field){
  if(host.dataset.loaded)return;host.textContent='Xalqaro belgilar yuklanmoqda…';
  try{const data=await international();host.replaceChildren(el('h3','Xalqaro klinik '+(scope==='exam'?'belgilar':'shikoyatlar')));host.dataset.loaded='1';
   const note=el('p','Human Phenotype Ontology · '+data.version+'. Asl inglizcha nomlar; barcha klinik belgilar shikoyat emas.','minor');const link=el('a',' HPO manbasi');link.href='https://obophenotype.github.io/human-phenotype-ontology/';link.target='_blank';link.rel='noopener noreferrer';note.append(link);host.append(note);
   const status=el('p','','minor'),list=el('div','','qc-chips qc-complaint-list');list.tabIndex=0;host.append(status,list);const terms=scope==='exam'?data.terms:data.complaints;let matches=terms;
   function more(){for(const row of matches.slice(list.children.length,list.children.length+36)){
    const text=row.label+' ['+row.id+']',b=el('button',text,'qc-choice');b.type='button';b.disabled=locked();b.setAttribute('aria-pressed',String(field.value.split('\n').includes(text)));b.onclick=()=>{if(locked())return;const lines=field.value.split('\n'),at=lines.indexOf(text);if(at>=0)lines.splice(at,1);else lines.push(text);const value=lines.filter(Boolean).join('\n');if(field.maxLength>=0&&value.length>field.maxLength){focus.status('Maydon hajmi oshdi.');return;}field.value=value;edit(field);b.setAttribute('aria-pressed',String(at<0));};list.append(b);
   }status.textContent=list.children.length+' / '+matches.length+' ta xalqaro atama';}
   function draw(){const query=norm(field.value.split('\n').at(-1));matches=query.length>=2?terms.filter(t=>norm(t.label+' '+t.id).includes(query)):terms;list.replaceChildren();more();}
   list.addEventListener('scroll',()=>{if(list.scrollHeight-list.scrollTop-list.clientHeight<160)more();},{passive:true});field.addEventListener('input',draw);for(const name of ['qabul:restored','qabul:session-ready','qabul:clinical-locked'])W.addEventListener(name,draw);more();
  }catch(e){host.textContent=e.message;}
 }
 const intlExam=el('section','','qc-library qc-complaints');intlExam.id='qaInternationalExam';intlExam.hidden=true;$('field-exam').after(intlExam);
 const complaintBank=D.querySelector('[data-phrase-target="field-complaints"]'),complaintCategory=complaintBank?.querySelector('select');
 if(complaintCategory){const o=el('option','Xalqaro shikoyatlar (HPO / EN)');o.value='international';complaintCategory.append(o);const intl=el('section');intl.hidden=true;complaintBank.append(intl);const old=complaintCategory.onchange;complaintCategory.onchange=()=>{old.call(complaintCategory);const on=complaintCategory.value==='international';complaintBank.querySelector('.qc-complaint-list').hidden=on;intl.hidden=!on;if(on)loadIntl(intl,'complaints',$('field-complaints'));};}
 W.QabulAuthoringV2={international};
}if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();})(window,document);
