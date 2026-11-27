(function (W,D) {
  'use strict';
  if (W.__UZMED_SPLASH_V1__) return;
  var splash=D.getElementById('__bundler_thumbnail');
  var counter=D.getElementById('uzb-counter');
  var bar=D.getElementById('uzb-bar');
  var progress=D.getElementById('uzb-progress');
  var retry=D.getElementById('uzb-retry');
  var status=D.getElementById('__bundler_loading');
  if (!splash || !counter || !bar) return;
  var start=performance.now(), duration=2600;
  var ready=false, failed=false, ended=false;
  var last=-1, frameId=0;
  function setPercent(n) {
    n=Math.max(0,Math.min(100,n));
    if(n===last)return;
    last=n;counter.textContent=n+'%';bar.style.width=n+'%';
    if(progress)progress.setAttribute('aria-valuenow',String(n));
  }
  function tick(now) {
    if(ended || failed)return;
    var t=Math.min(1,(now-start)/duration);
    var eased=1-Math.pow(1-t,3);
    setPercent(Math.min(ready?100:94,Math.round((ready?100:94)*eased)));
    if(ready && t>=1) {
      setPercent(100);
      ended=true;
      splash.classList.add('uzmed-boot-exit');
      splash.setAttribute('aria-busy','false');
      W.setTimeout(function(){if(splash.isConnected)splash.remove();},360);
      return;
    }
    frameId=W.requestAnimationFrame(tick);
  }
  frameId=W.requestAnimationFrame(tick);
  var failTimer=W.setTimeout(function(){
    if(!ready && !failed) api.fail('Yuklanish kutilganidan uzoq davom etdi. Internetni tekshiring.');
  },25000);
  var api={
    done:function(){
      if(ready || failed || ended)return;
      ready=true;
      W.clearTimeout(failTimer);
      if(status)status.textContent='Asosiy menyu tayyor';
      if(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches){
        setPercent(100);ended=true;splash.remove();
      }
    },
    fail:function(message){
      if(failed || ended)return;
      failed=true;W.clearTimeout(failTimer);
      if(frameId)W.cancelAnimationFrame(frameId);
      if(status){status.textContent=message || 'Yuklanishda xatolik yuz berdi.';status.setAttribute('role','alert');}
      var h=D.getElementById('uzb-title');if(h)h.textContent='Qayta urinish kerak';
      if(retry)retry.hidden=false;
    }
  };
  W.__UZMED_SPLASH_V1__=api;
  if(retry)retry.addEventListener('click',function(){W.location.reload();});
})(window,document);