/* UZMED · Tashxis maydonlari uchun «Mos tayyor tashxislar» (WHO ICD-10 2019, o‘zbekcha nomlar).
   Klinik taxmin yoki MKB-10 kodi yozilayotganda mos tashxislar pastda chiqadi; bosilsa
   tashxis nomi va kodi ikkala maydonga yoziladi. Shikoyat bo‘limidagi bilan bir xil ko‘rinish. */
(function(W,D){
 'use strict';
 if(W.__UZMED_QABUL_DX_SUGGEST_V1__)return;
 W.__UZMED_QABUL_DX_SUGGEST_V1__=true;
 const LIMIT=12;
 const $=id=>D.getElementById(id);
 let rows=null,loading=null;
 function load(){
  if(rows)return Promise.resolve(rows);
  if(!loading)loading=W.QabulReference.load().then(r=>(rows=r)).finally(()=>{loading=null;});
  return loading;
 }
 const codeLike=q=>/^[A-Za-z]\d[\d.]*$/.test(q);
 function search(q){
  if(codeLike(q)){
   const key=q.toUpperCase().replace('.','');
   return rows.filter(r=>r[0].replace('.','').startsWith(key)).slice(0,LIMIT);
  }
  return W.UZMED_REFERENCE_SEARCH.searchMkb(rows,q,LIMIT)||[];
 }
 function writable(field){
  return !field.readOnly&&!field.disabled&&W.UZMEDVisitBridge?.read?.()?.readOnly!==true;
 }
 function signal(field){field.dispatchEvent(new W.Event('input',{bubbles:true}));}
 function attach(field,mode){
  if(!field||field.dataset.qdxSuggest)return;
  field.dataset.qdxSuggest='1';
  const box=D.createElement('section');box.className='qc-complaint-suggestions qdx-suggest';
  box.id='qdxSuggest-'+field.id;box.setAttribute('aria-label','Mos tayyor tashxislar');
  const title=D.createElement('h4');title.textContent='Mos tayyor tashxislar';
  const list=D.createElement('div');list.className='qc-complaint-suggestion-list';
  box.append(title,list);box.hidden=true;
  field.setAttribute('aria-controls',box.id);
  field.after(box);
  let seq=0,timer;
  function hide(){seq++;clearTimeout(timer);if(!box.hidden){box.hidden=true;list.replaceChildren();}}
  function range(){
   const v=field.value,end=field.selectionEnd??v.length;
   if(mode==='icd'){const start=Math.max(v.lastIndexOf(';',end-1),v.lastIndexOf(',',end-1))+1;
    const raw=v.slice(start,end),lead=raw.length-raw.trimStart().length;return {start:start+lead,end,q:raw.trim()};}
   const start=v.lastIndexOf('\n',end-1)+1,raw=v.slice(start,end),lead=raw.length-raw.trimStart().length;
   return {start:start+lead,end,q:raw.trim()};
  }
  function pick(row,r,value){
   if(!writable(field)||field.value!==value){hide();return;}
   const [code,name]=row,main=$('field-diagnosis'),icd=$('field-icd');
   if(mode==='icd'){
    field.setRangeText(code,r.start,r.end,'end');signal(field);
    if(main&&!main.value.trim()){main.value=name;signal(main);}
   }else{
    field.setRangeText(name,r.start,r.end,'end');signal(field);
    if(icd){const codes=icd.value.split(/[;,\n]+/).map(x=>x.trim()).filter(Boolean);
     if(!codes.includes(code)){codes.push(code);icd.value=codes.join('; ');signal(icd);}}
   }
   const checked=$('icdChecked');if(checked)checked.checked=false;
   field.focus({preventScroll:true});hide();
  }
  async function update(){
   clearTimeout(timer);
   if(D.activeElement!==field||!writable(field)||field.selectionStart!==field.selectionEnd){hide();return;}
   const r=range(),value=field.value;
   if(r.q.length<2||r.q.length>80){hide();return;}
   const id=++seq;
   timer=setTimeout(async()=>{
    try{await load();}catch(_){return;}
    if(id!==seq||field.value!==value)return;
    const found=search(r.q);
    list.replaceChildren(...found.map(row=>{
     const b=D.createElement('button');b.type='button';b.className='qc-complaint-suggestion';
     b.textContent=row[0]+' · '+row[1];
     b.addEventListener('click',()=>pick(row,r,value));
     return b;
    }));
    const wasHidden=box.hidden;
    box.hidden=!found.length;
    if(wasHidden&&!box.hidden&&W.matchMedia('(max-width: 650px)').matches)box.scrollIntoView({block:'nearest'});
   },180);
  }
  field.addEventListener('input',e=>{if(e.isComposing)return;update();});
  field.addEventListener('compositionend',update);
  field.addEventListener('focus',update);
  field.addEventListener('keydown',e=>{
   if(box.hidden)return;
   if(e.key==='Escape'){e.preventDefault();hide();}
   if(e.key==='ArrowDown'&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();list.firstElementChild?.focus();}
  });
  list.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();field.focus({preventScroll:true});hide();}
   const next=e.key==='ArrowDown'?e.target.nextElementSibling:e.key==='ArrowUp'?e.target.previousElementSibling:null;
   if(next){e.preventDefault();next.focus();}
  });
  D.addEventListener('pointerdown',e=>{if(e.target!==field&&!box.contains(e.target))hide();});
  for(const ev of ['qabul:restored','qabul:session-ready','qabul:clinical-locked'])W.addEventListener(ev,hide);
 }
 function mount(){
  const main=$('field-diagnosis'),icd=$('field-icd');
  if(!main||!icd||!W.QabulReference||!W.UZMED_REFERENCE_SEARCH)return false;
  attach(main,'name');attach(icd,'icd');return true;
 }
 let tries=0;
 (function retry(){if(mount()||++tries>60)return;setTimeout(retry,250);})();
})(window,document);
