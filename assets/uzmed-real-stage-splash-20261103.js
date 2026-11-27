/* UZMED real-stage splash: percentages advance ONLY when completed app stages report. */
(function(W,D){
  'use strict';
  if(W.__UZMED_SPLASH_V1__)return;
  var splash=D.getElementById('__bundler_thumbnail');
  var counter=D.getElementById('uzb-counter');
  var bar=D.getElementById('uzb-bar');
  var progress=D.getElementById('uzb-progress');
  var retry=D.getElementById('uzb-retry');
  var status=D.getElementById('__bundler_loading');
  if(!splash||!counter||!bar)return;
  var percent=0,failed=false,ended=false,finishing=false;
  function paint(value){
    if(ended||failed)return;
    percent=Math.max(percent,Math.max(0,Math.min(100,Math.round(value))));
    counter.textContent=percent+'%';
    bar.style.width=percent+'%';
    if(progress)progress.setAttribute('aria-valuenow',String(percent));
  }
  function mark(value,message){
    if(ended||failed)return;
    // Only done() is allowed to reach 100 after the UI readiness gate passes.
    paint(Math.min(98,value));
    if(message&&status)status.textContent=message;
  }
  function finish(){
    if(ended||failed||finishing)return;
    finishing=true;
    W.clearTimeout(longWait);
    W.requestAnimationFrame(function(){
      W.requestAnimationFrame(function(){
        if(!splash.isConnected||failed)return;
        paint(100);
        if(status)status.textContent='Ish maydoni tayyor';
        splash.setAttribute('aria-busy','false');
        splash.classList.add('uzmed-boot-exit');
        W.setTimeout(function(){splash.remove();ended=true;},350);
      });
    });
  }
  function fail(message){
    if(ended||failed)return;
    failed=true;
    W.clearTimeout(longWait);
    if(status){
      status.textContent=message||'Yuklanishda xatolik yuz berdi.';
      status.setAttribute('role','alert');
    }
    var title=D.getElementById('uzb-title');
    if(title)title.textContent='Qayta urinish kerak';
    if(retry)retry.hidden=false;
  }
  var api={mark:mark,done:finish,fail:fail,status:function(){return {percent:percent,ended:ended,failed:failed};}};
  W.__UZMED_SPLASH_V1__=api;
  var longWait=W.setTimeout(function(){
    if(!ended&&!finishing&&!failed)fail('Yuklanish juda uzoq davom etdi. Internetni tekshiring va qayta urinib ko‘ring.');
  },45000);
  if(retry)retry.addEventListener('click',function(){W.location.reload();});
  paint(5); // Initial HTML, logo and splash are present.
})(window,document);
