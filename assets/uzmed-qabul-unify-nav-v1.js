/* Unify UZMED site Bemorlar navigation under Shifokor qabuli / Mening bemorlarim.
   Only intercepts main-site menu links; no changes to clinical API or Telegram callbacks. */
(function(W,D){
 'use strict';
 if(new URLSearchParams(W.location.search).get('section')&&!W.UZMED_QABUL_INLINE)return;
 const target='/?section=qabul&telegram_miniapp=1&view=mine';
 function isPatientNavigation(element){
   if(!element||!element.closest)return false;
   const node=element.closest('a,button,[role=button]');
   if(!node)return false;
   if(node.matches('[data-uzmed-section="patients"],[data-ux-rail="patients"]'))return true;
   const href=node.getAttribute('href')||'';
   if(/(?:\?|&)section=(?:patients|bemorlar)(?:&|$)/.test(href))return true;
   const nav=node.closest('#uzSideMenu,#uzmedWorkspaceRail,.uz-side-menu,.ux-rail-nav,[data-uzmed-nav]');
   if(!nav)return false;
   const label=node.querySelector('.uz-menu-title')?.textContent||node.getAttribute('aria-label')||node.textContent||'';
   return /^(?:👨‍⚕️\s*)?(?:Bemorlar(?:im)?|Mening bemorlarim)$/i.test(label.trim());
 }
 D.addEventListener('click',function(ev){
   if(ev.defaultPrevented||ev.button!==0||ev.metaKey||ev.ctrlKey||ev.altKey||ev.shiftKey)return;
   if(!isPatientNavigation(ev.target))return;
   ev.preventDefault();ev.stopImmediatePropagation();
   W.UZMEDQabulStart?.open?.('mine');
 },true);
})(window,document);

/* Redirect to the actual main-website sidebar on request from the Qabul interface. */
(function(W,D){
 'use strict';
 const params=new URLSearchParams(W.location.search);
 if(params.get('uzmed_open_menu')!=='1')return;
 let done=false,checks=0,timer=null;
 function openRealMenu(){
  if(done)return true;
  const sidebar=D.getElementById('uzSideMenu');
  if(!sidebar||typeof W.openMenu!=='function')return false;
  if(D.body.classList.contains('uz-auth-locked'))return false;
  try{if(!sidebar.classList.contains('open'))W.openMenu();}catch(e){return false;}
  if(!sidebar.classList.contains('open'))return false;
  done=true;if(timer)W.clearInterval(timer);
  // Remove the one-time launch hint so reloads do not keep re-opening the drawer.
  try{const next=new URL(W.location.href);next.searchParams.delete('uzmed_open_menu');W.history.replaceState(W.history.state,'',next.pathname+next.search+next.hash);}catch(e){}
  return true;
 }
 function start(){if(openRealMenu())return;timer=W.setInterval(()=>{if(openRealMenu()||++checks>=160)W.clearInterval(timer);},220);}
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
 W.addEventListener('uzmed:auth-change',openRealMenu);
})(window,document);
