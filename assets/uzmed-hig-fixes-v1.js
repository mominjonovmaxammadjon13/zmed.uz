/* UZMED HIG + Apple uslubi: CSS'ni haqiqiy ilova hujjatiga ulaydi (bundler qobig'i almashganda ham). */
(function(){
  'use strict';
  if(window.__UZMED_HIG_FIXES_V1__)return;window.__UZMED_HIG_FIXES_V1__=true;
  var SHEETS=[
    ['uzmed-apple-v1','/assets/uzmed-apple-v1.css?v=20261128-1'],
    ['uzmed-hig-fixes-v1','/assets/uzmed-hig-fixes-v1.css?v=20261128-1']
  ];
  function ensure(){
    try{
      var host=document.body||document.head;if(!host)return;
      for(var i=0;i<SHEETS.length;i++){
        var l=document.getElementById(SHEETS[i][0]);
        if(l&&l.isConnected)continue;
        l=document.createElement('link');l.id=SHEETS[i][0];l.rel='stylesheet';l.href=SHEETS[i][1];
        host.appendChild(l);
      }
    }catch(e){}
  }
  ensure();
  try{new MutationObserver(ensure).observe(document,{childList:true});}catch(e){}
  document.addEventListener('DOMContentLoaded',ensure);
  window.addEventListener('load',ensure);
  var n=0;(function tick(){ensure();if(++n<40)setTimeout(tick,500);})();
})();
