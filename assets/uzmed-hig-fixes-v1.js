/* UZMED HIG tuzatishlari: CSS'ni haqiqiy ilova hujjatiga ulaydi (bundler qobig'i almashganda ham). */
(function(){
  'use strict';
  if(window.__UZMED_HIG_FIXES_V1__)return;window.__UZMED_HIG_FIXES_V1__=true;
  var ID='uzmed-hig-fixes-v1',HREF='/assets/uzmed-hig-fixes-v1.css?v=20261128-1';
  function ensure(){
    try{
      var host=document.body||document.head;if(!host)return;
      var l=document.getElementById(ID);
      if(l&&l.isConnected)return;
      if(!l){l=document.createElement('link');l.id=ID;l.rel='stylesheet';l.href=HREF;}
      host.appendChild(l);
    }catch(e){}
  }
  ensure();
  try{new MutationObserver(ensure).observe(document,{childList:true});}catch(e){}
  document.addEventListener('DOMContentLoaded',ensure);
  window.addEventListener('load',ensure);
  var n=0;(function tick(){ensure();if(++n<40)setTimeout(tick,500);})();
})();
