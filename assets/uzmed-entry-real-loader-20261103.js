/* UZMED entry real-stage loader: no timer-driven percentage and no premature exit.
   Restricted to initial qabul/patients/bemorlar Mini App entry pages. */
(function(W,D){
 'use strict';
 if(W.UZMEDEntryLoader)return;
 const overlay=D.getElementById('entryWaiting');
 if(!overlay)return;
 const section=new URLSearchParams(W.location.search).get('section')||'patients';
 const counter=D.getElementById('uzb-counter'),bar=D.getElementById('uzb-bar');
 const progress=D.getElementById('uzb-progress'),subtitle=D.getElementById('entryStatus');
 const title=D.getElementById('entryTitle'),retry=D.getElementById('entryRetry');
 const label=section==='qabul'?'Shifokor qabuli':'Bemorlarim';
 let percent=0,ended=false,failed=false,finishing=false,modulesLoaded=false,operationDone=false,active='',tickHandle=null,loginReleased=false,generation=0;
 if(title)title.textContent='Yuklanmoqda...';
 const checkVisible=element=>Boolean(element&&element.isConnected&&element.getClientRects().length&&W.getComputedStyle(element).visibility!=='hidden'&&W.getComputedStyle(element).display!=='none');
 function mark(n,message){
   if(ended||failed||finishing)return;
   const next=Math.min(98,Math.max(percent,Math.max(0,Math.round(n))));
   if(next!==percent){
     percent=next;
     if(counter)counter.textContent=percent+'%';
     if(bar)bar.style.width=percent+'%';
     if(progress)progress.setAttribute('aria-valuenow',String(percent));
   }
   if(message&&subtitle)subtitle.textContent=message;
 }
 function showReady(mode='section'){
   if(ended||failed||finishing)return;
   finishing=true;loginReleased=mode==='login';const own=++generation;W.clearTimeout(watchdog);W.clearInterval(tickHandle);
   W.requestAnimationFrame(()=>W.requestAnimationFrame(()=>{
     if(own!==generation||!overlay.isConnected||failed)return;
     percent=100;if(counter)counter.textContent='100%';
     if(bar)bar.style.width='100%';
     if(progress)progress.setAttribute('aria-valuenow','100');
     if(subtitle)subtitle.textContent=mode==='login'?'Kirish oynasi tayyor':'Ish maydoni tayyor';
     overlay.setAttribute('aria-busy','false');
     overlay.classList.add('uzmed-boot-exit');
     W.setTimeout(()=>{if(own!==generation)return;overlay.hidden=true;ended=true;},350);
   }));
 }
 function fail(message){
   if(ended||failed)return;failed=true;W.clearTimeout(watchdog);W.clearInterval(tickHandle);
   if(title)title.textContent='Yuklashda muammo';
   if(subtitle)subtitle.textContent=message||'Bo‘limni yuklab bo‘lmadi. Qayta urinib ko‘ring.';
   if(subtitle)subtitle.setAttribute('role','alert');
   if(retry)retry.hidden=false;
 }
 function isLoggedIn(){
   try{return Boolean(W.UZMEDAuth?.getState?.().loggedIn);}catch{return false;}
 }
 function verify(){
   if(ended||failed||finishing)return;
   if(W.UZMEDAuth?.getState)mark(20,'Akkaunt tekshirilmoqda…');
   const logged=isLoggedIn();
   const auth=D.getElementById('uzmedAuthOverlay');
   // If the real login/registration form is ready, let the user access it.
   if(!logged&&auth&&!auth.hidden&&checkVisible(auth)&&auth.querySelector('#uzAuthLoginBtn')){
     mark(96,'Kirish oynasi tayyor');showReady('login');return;
   }
   if(!logged)return;
   if(modulesLoaded)mark(55,'Bo‘lim modullari yuklandi');
   const screen=D.querySelector('.screens > .screen.active');
   if(!screen||!checkVisible(screen))return;
   active=screen.id;mark(68,'Interfeys ochilmoqda…');
   if(section==='qabul'){
     const workspace=screen;
     if(workspace.id!=='uzQabulEntry'&&workspace.id!=='uzQabulRegistry')return;
     const container=workspace.querySelector('.qstart-content');
     const feedback=workspace.querySelector('.qstart-message');
     const state=(feedback?.textContent||'').toLowerCase();
     const existingList=workspace.querySelector('#qstartList');
     const finishedRows=Boolean(existingList?.querySelector('.qstart-patient,.qstart-muted,.qstart-error') &&
       !existingList.textContent?.includes('Bemorlar yuklanmoqda'));
     if(state.includes('tekshirilmoqda')&&!finishedRows){mark(72,'Klinik ruxsat tekshirilmoqda…');return;}
     if(feedback?.getAttribute('role')==='alert'&&!workspace.querySelector('#qstartList')){
       // Permission denial is an actually rendered usable state (user can navigate back).
       if(container&&container.children.length){mark(95,'Bo‘lim holati tayyor');showReady();}
       else fail(feedback.textContent);
       return;
     }
     if(!operationDone)return;
     if(workspace.dataset.qstartView==='home'){
       mark(96,'Shifokor qabuli tayyor');showReady();return;
     }
     if(workspace.dataset.qstartView==='mine'&&finishedRows){
       mark(96,'Mening bemorlarim tayyor');showReady();
     }
     return;
   }
   if(!operationDone)return;
   const panel=D.getElementById('patients-screen');
   if(panel?.classList.contains('active')&&checkVisible(panel)){
     const readyPanel=panel.querySelector('#upPatientResults,.up-auth-panel,.up-panel,.up-empty');
     if(!readyPanel||panel.textContent.includes('Klinik ruxsat tekshirilmoqda'))return;
     mark(96,'Bemorlar bo‘limi tayyor');showReady();return;
   }
   const hub=D.getElementById('uzBemorlarHub');
   if(hub?.classList.contains('active')&&hub.children.length>1){
     mark(96,'Bemorlar bo‘limi tayyor');showReady();
   }
 }
 function scan(){W.clearTimeout(scan.pending);scan.pending=W.setTimeout(verify,32);}
 function authChanged(){
   if(loginReleased&&isLoggedIn()){
     generation++;loginReleased=false;ended=false;failed=false;finishing=false;
     modulesLoaded=false;operationDone=false;percent=0;active='';
     overlay.hidden=false;overlay.classList.remove('uzmed-boot-exit');
     overlay.setAttribute('aria-busy','true');
     if(retry)retry.hidden=true;
     if(title)title.textContent='Yuklanmoqda...';
     W.clearTimeout(watchdog);W.clearInterval(tickHandle);
     watchdog=W.setTimeout(()=>fail('Bo‘lim kutilganidan uzoq yuklanmoqda. Qayta urinib ko‘ring.'),45000);
     tickHandle=W.setInterval(verify,250);
     mark(5,label+' tayyorlanmoqda…');
   }
   scan();
 }
 let watchdog=W.setTimeout(()=>fail('Bo‘lim kutilganidan uzoq yuklanmoqda. Internetni tekshirib, qayta urinib ko‘ring.'),45000);
 mark(5,label+' ochilmoqda…');
 W.UZMEDEntryLoader=Object.freeze({
   mark,fail,
   modulesReady(){modulesLoaded=true;mark(55,'Bo‘lim modullari yuklandi');scan();},
   screen(id){active=id;mark(65,'Interfeys tayyorlanmoqda…');scan();},
   operationSettled(){operationDone=true;mark(74,'Ma’lumotlar tekshirildi');scan();},
   check:verify,
   status(){return {percent,ended,failed,active,modulesLoaded,operationDone};}
 });
 if(retry)retry.addEventListener('click',()=>W.location.reload());
 if(D.readyState==='loading'){
   D.addEventListener('DOMContentLoaded',()=>{const host=D.getElementById('entryContent');
     if(host)new MutationObserver(scan).observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','role']});
     W.addEventListener('uzmed:auth-change',authChanged);tickHandle=W.setInterval(verify,250);verify();
   },{once:true});
 }else{
   const host=D.getElementById('entryContent');
   if(host)new MutationObserver(scan).observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','role']});
   W.addEventListener('uzmed:auth-change',authChanged);tickHandle=W.setInterval(verify,250);verify();
 }
})(window,document);
