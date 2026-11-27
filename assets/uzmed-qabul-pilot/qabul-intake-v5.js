/* UZMED Qabul v5: responsive intake landing and verified patient summary.
   Read-only presentation; native seven-step editor, save, permissions and APIs remain authoritative. */
(function(W,D){
'use strict';
const $=id=>D.getElementById(id);
function node(tag,cls,text){
  const e=D.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=String(text);
  return e;
}
function button(label,cb,cls){
  const b=node('button',cls,label);
  b.type='button';b.addEventListener('click',cb);
  return b;
}
function mount(){
 const focus=W.QabulFocus,editor=$('qabulFocus'),rail=$('qfNav'),main=D.querySelector('#qabulFocus .qf-main');
 if(!focus||!editor||!rail||!main||$('uv5Dashboard'))return;
 const tabs=[...rail.querySelectorAll('[data-focus-tab]')];
 if(tabs.length!==7)return;
 const names=['Shikoyatlar','Anamnez','Ko‘rik','Tekshiruvlar','Tashxis','Davolash','Tavsiyalar'];
 const openEditor=(key)=>{
   main.classList.remove('uv5-dashboard-open');
   editor.classList.remove('uv5-home-mode');
   focus.show(key,true);
   main.scrollTop=0;
 };
 const dashboard=node('section','uv5-dashboard');
 dashboard.id='uv5Dashboard';dashboard.setAttribute('aria-label','Shifokor qabuli bosh menyusi');
 const hero=node('div','uv5-hero');
 const brand=node('span','uv5-kicker','✚ UZMED  ·  KLINIK QABUL');
 const head=node('h1','','Shifokor qabuli');
 const sub=node('p','','Bemorni ko‘rikdan davolash rejasigacha olib boring.');
 hero.append(brand,head,sub);
 const patient=node('div','uv5-patient');
 const patientIcon=node('span','uv5-patient-icon','♙');
 const patientInfo=node('div','uv5-patient-info');
 const patientName=node('strong','','Bemor ma’lumoti');
 const patientMeta=node('p','','Bemor kartasidagi ma’lumot yuklanmoqda…');
 const diagnosis=node('small','','Tashxis: hali belgilanmagan');
 patientInfo.append(patientName,patientMeta,diagnosis);
 const edit=button('Tahrirlash',()=>{$('patientOpen')?.click();},'uv5-patient-edit');
 patient.append(patientIcon,patientInfo,edit);
 const stepHead=node('div','uv5-section-heading');
 stepHead.append(node('h2','','Qabul bosqichlari'),node('span','uv5-count','7 bo‘lim'));
 const grid=node('nav','uv5-steps');grid.setAttribute('aria-label','Klinik qabul bo‘limlari');
 const symbols=['01','02','03','04','05','06','07'];
 const rows=tabs.map((original,i)=>{
   const b=button('',()=>openEditor(original.dataset.focusTab),'uv5-step');
   b.dataset.target=original.dataset.focusTab;
   const n=node('span','uv5-step-num',symbols[i]);
   const title=node('span','uv5-step-title',names[i]);
   const state=node('span','uv5-step-state','›');
   b.append(n,title,state);
   if(i===5)b.classList.add('uv5-treatment-step');
   grid.append(b);return b;
 });
 const quick=node('div','uv5-quick');
 const templates=button('Shablonlar',()=>{
   openEditor('treatment');
   const b=D.querySelector('#uzmedQabulV3 .uv3-mobile-button[data-pane="templates"]');
   if(b)b.click();
   else W.UzmedAllergyTemplateUI?.open?.('all');
 },'uv5-secondary');
 const mic=button('🎙 Ovozdan kiritish',()=>{openEditor('complaints');$('dictationOpen')?.click();},'uv5-primary');
 const print=button('▤ Chop etish',()=>{W.QabulDocument?.open?.();},'uv5-secondary');
 print.id='uv5Doc';quick.append(templates,mic,print);
 const note=node('p','uv5-note','Bemor tarixi o‘zgartirilmaydi. Saqlash va klinik tasdiq alohida bajariladi.');
 dashboard.append(hero,patient,stepHead,grid,quick,note);
 main.prepend(dashboard);
 const back=node('button','uv5-back','▦');back.type='button';
 back.textContent='▦';back.setAttribute('aria-label','Qabul bosh menyusi');back.title='Qabul bosh menyusi';
 back.id='uv5Home';
 back.addEventListener('click',()=>{
   main.classList.add('uv5-dashboard-open');editor.classList.add('uv5-home-mode');
   main.scrollTop=0;
 });
 const cardTools=D.querySelector('#qabulFocus .qf-tools');
 if(cardTools)cardTools.prepend(back);
 const metaStrip=node('div','uv5-clinical-strip');
 metaStrip.id='uv5PatientStrip';
 const stripName=node('strong','','Bemor ma’lumotlari');
 const age=node('span','','Yosh: —'),sex=node('span','','Jins: —');
 const weight=node('span','','Vazn: —'),height=node('span','','Bo‘y: —');
 const dx=node('span','uv5-strip-diagnosis','Tashxis: belgilanmagan');
 metaStrip.append(stripName,age,sex,weight,height,dx);
 rail.before(metaStrip);
 const val=id=>String($(id)?.value||'').trim();
 function render(){
   const n=val('field-patient'),a=val('field-age'),s=val('sex'),wt=val('weight'),ht=val('height'),d=val('field-diagnosis');
   const safe=x=>x||'—';
   patientName.textContent=n||'Bemorning F.I.Sh. kiritilmagan';
   patientMeta.textContent=[a?a+' yosh':null,s||null,wt?wt+' kg':null,ht?ht+' sm':null].filter(Boolean).join(' · ')||'Yosh, jins va ko‘rsatkichlar bemor kartasida mavjud bo‘lsa ko‘rinadi';
   diagnosis.textContent='Tashxis: '+(d||'hali belgilanmagan');
   stripName.textContent=n||'Bemor ma’lumotlari';
   age.textContent='Yosh: '+safe(a);sex.textContent='Jins: '+safe(s);
   weight.textContent='Vazn: '+(wt?wt+' kg':'—');height.textContent='Bo‘y: '+(ht?ht+' sm':'—');
   dx.textContent='Tashxis: '+(d||'belgilanmagan');
   rows.forEach((b,i)=>{
     const has= tabs[i].classList.contains('has-data');
     b.classList.toggle('has-data',has);
     b.querySelector('.uv5-step-state').textContent=has?'•':'›';
     b.setAttribute('aria-label',(i+1)+'. '+names[i]+(has?' — ma’lumot bor':''));
   });
 }
 // Initial parent visit hydration occurs after iframe load; input/change events refresh labels.
 W.requestAnimationFrame?.(render);
 D.addEventListener('input',render);D.addEventListener('change',render);
 new MutationObserver(render).observe(rail,{attributes:true,subtree:true,attributeFilter:['class']});
 const originalSummary=document.getElementById("patientSummary");
 if(originalSummary)new MutationObserver(render).observe(originalSummary,{subtree:true,childList:true,characterData:true});
 render();
 if(W.matchMedia('(max-width:760px)').matches){
   main.classList.add('uv5-dashboard-open');
   editor.classList.add('uv5-home-mode');
 }
 W.addEventListener('resize',()=>{
   if(W.matchMedia('(min-width:761px)').matches){main.classList.remove('uv5-dashboard-open');editor.classList.remove('uv5-home-mode');}
 },{passive:true});
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
