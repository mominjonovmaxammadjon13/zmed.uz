/* UZMED Qabul v2 mobile navigation. Reuses original seven clinical tabs and actions. */
(function(W,D){
 'use strict';
 function make(tag,cls,text){
  const e=D.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;
 }
 function mount(){
  const main=D.querySelector('#qabulFocus .qf-main');
  const rail=D.getElementById('qfNav');
  if(!main||!rail||D.getElementById('uzmedQabulV2Overview'))return;
  const original=[...rail.querySelectorAll('[data-focus-tab]')];
  if(original.length!==7)return;
  const over=make('section','uv2-overview');
  over.id='uzmedQabulV2Overview';
  over.setAttribute('aria-label','Shifokor qabuli bosqichlari');
  const intro=make('div','uv2-overview-intro');
  const caption=make('div','uv2-overview-kicker','✚ UZMED • KLINIK QABUL');
  const heading=make('div','uv2-overview-title','Shifokor qabuli');
  const sub=make('p','','Bemorni ko‘rikdan davolash rejasi va qabul hujjatigacha olib boring.');
  intro.append(caption,heading,sub);
  const info=make('span','uv2-overview-indicator','7 bosqich');
  const header=make('div','uv2-overview-header');header.append(intro,info);
  const nav=make('nav','uv2-overview-steps');nav.setAttribute('aria-label','Qabulning yetti bosqichi');
  const labels=['Shikoyatlar','Anamnez','Ko‘rik','Tekshiruvlar','Tashxis','Davolash','Tavsiyalar'];
  const buttons=original.map((source,i)=>{
   const b=make('button','uv2-overview-step');b.type='button';b.dataset.step=source.dataset.focusTab;
   const num=make('span','uv2-overview-number',String(i+1));
   const text=make('span','uv2-overview-step-name',labels[i]);
   const marker=make('span','uv2-overview-marker','›');
   b.append(num,text,marker);
   b.addEventListener('click',()=>{
    if(source.disabled)return;
    source.click();
    main.scrollTo?.({top:0,behavior:'instant'});
   });
   nav.append(b);return b;
  });
  const actions=make('div','uv2-overview-actions');
  const shortcut=(label,action,cls)=>{
   const b=make('button','uv2-overview-action '+(cls||''),label);b.type='button';b.addEventListener('click',action);actions.append(b);
  };
  const toTreatment=()=>{const b=original.find(b=>b.dataset.focusTab==='treatment');if(b&&!b.disabled)b.click();};
  shortcut('✚ Dori guruhlari',()=>{toTreatment();D.getElementById('uv2GroupsTab')?.click();},'uv2-overview-primary');
  shortcut('▤ Davolash rejasi',()=>{toTreatment();D.getElementById('uv2ReviewTab')?.click();},'');
  shortcut('▣ Qabul hujjati',()=>{if(typeof W.QabulDocument?.open==='function')W.QabulDocument.open();},'');
  over.append(header,nav,actions);
  main.prepend(over);
  function sync(){
   let active=0;
   buttons.forEach((button,i)=>{
    const source=original[i];
    const selected=source.classList.contains('active')||source.getAttribute('aria-current')==='step';
    if(selected)active=i;
    const hasData=source.classList.contains('has-data');
    button.classList.toggle('is-active',selected);
    button.classList.toggle('has-data',hasData);
    button.disabled=!!source.disabled;
    if(selected)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    const mark=button.querySelector('.uv2-overview-marker');
    if(mark)mark.textContent=hasData?'•':'›';
   });
   info.textContent='Bo‘lim '+(active+1)+' / 7';
  }
  const observer=new MutationObserver(sync);
  observer.observe(rail,{subtree:true,attributes:true,attributeFilter:['class','aria-current','disabled']});
  sync();
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});
 else mount();
})(window,document);
