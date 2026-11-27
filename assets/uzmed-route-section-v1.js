/* Main UZMED dispatcher for a section explicitly selected from the Qabul in-page menu.
 * Only runs on the main app after an explicit menu click. Never changes auth or privileges.
 */
(function(W,D){
  'use strict';
  const url=new URL(W.location.href);
  if(url.searchParams.has('section'))return;
  const target=url.searchParams.get('uzmed_target');
  const allowed=new Set(['chat','sources','derma','scores','growth','prices','history','models','settings']);
  if(!allowed.has(target))return;
  let finished=false,tries=0,clock=null;
  function currentUser(){
    const s=W.UZMEDAuth?.getState?.();
    return s?.loggedIn?String(s?.user?.id||''):'';
  }
  function apply(){
    if(finished||!currentUser())return false;
    let launched=false;
    if(target==='sources'){
      const button=D.getElementById('uzmedNavSources20261023');
      if(button&&!button.disabled){button.click();launched=true;}
      else if(W.UZMEDSourcesUI?.open){W.UZMEDSourcesUI.open();launched=true;}
    }else{
      const nav=W.UZMEDNavigation;
      const def=nav?.definitions?.find?.(x=>x.key===target);
      if(def&&D.querySelector(def.source)&&nav?.activate){
        try{launched=nav.activate(target)!==false;}catch(e){launched=false;}
      }
    }
    if(!launched)return false;
    finished=true;
    if(clock)W.clearInterval(clock);
    try{
      url.searchParams.delete('uzmed_target');
      W.history.replaceState(W.history.state,'',url.pathname+url.search+url.hash);
    }catch(e){}
    return true;
  }
  function boot(){
    if(apply())return;
    clock=W.setInterval(()=>{if(apply()||++tries>=120)W.clearInterval(clock);},180);
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
  W.addEventListener('uzmed:auth-change',apply);
})(window,document);
