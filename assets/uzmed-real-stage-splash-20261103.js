/* UZMED splash v2 — silliq foiz.
   Haqiqiy bosqichlar (mark) maqsadni belgilaydi; ko‘rsatkich unga 60 fps da silliq yetib boradi va
   bosqichlar orasida ham sekin-asta oldinga siljiydi (hech qachon qotib qolmaydi, lekin 97% dan
   oshmaydi). 100% faqat done() — ilova haqiqatan tayyor bo‘lganda. API o‘zgarmagan: mark, done, fail, status. */
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
  var reduce=!!(W.matchMedia&&W.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var target=0,shown=0,painted=-1,failed=false,ended=false,finishing=false,raf=0,last=0;
  // Chiziq: kenglik o‘rniga transform (silliq, qayta joylashtirishsiz)
  try{
    bar.style.setProperty('width','100%','important');
    bar.style.setProperty('transform-origin','0 50%','important');
    bar.style.setProperty('transition','none','important');
    bar.style.setProperty('will-change','transform','important');
  }catch(_){}
  function draw(){
    var v=Math.max(0,Math.min(100,shown));
    try{bar.style.setProperty('transform','scaleX('+(v/100).toFixed(4)+')','important');}catch(_){}
    var n=Math.floor(v+0.0001);
    if(n!==painted){
      painted=n;counter.textContent=n+'%';
      if(progress)progress.setAttribute('aria-valuenow',String(n));
    }
  }
  function tick(now){
    raf=0;
    if(failed)return;
    var dt=last?Math.min(64,now-last):16;last=now;
    var k=dt/16.7;
    if(finishing){
      // tayyor: 100% ga tez, lekin silliq (~0,25 s)
      shown=Math.min(100,shown+Math.max(1.5*k,(100-shown)*0.2*k));
    }else if(shown<target){
      // maqsadga silliq yetish (masofaga mos tezlik)
      shown=Math.min(target,shown+Math.max(0.3*k,(target-shown)*0.07*k));
    }else if(!finishing){
      // bosqichlar orasida: keyingi bosqich tomon sekin, sekinlashib boruvchi siljish
      var cap=Math.min(target+10,97);
      if(shown<cap)shown+=Math.max(0.01*k,(cap-shown)*0.006*k);
    }
    draw();
    if(finishing&&shown>=99.95){done2();return;}
    if(!ended)raf=W.requestAnimationFrame(tick);
  }
  function loop(){if(!raf&&!ended&&!failed)raf=W.requestAnimationFrame(tick);}
  function setTarget(v){target=Math.max(target,Math.max(0,Math.min(100,v)));if(reduce){shown=target;draw();}loop();}
  function mark(value,message){
    if(ended||failed)return;
    setTarget(Math.min(98,value)); // 100 ga faqat done() olib chiqadi
    if(message&&status)status.textContent=message;
  }
  function done2(){
    if(ended)return;
    shown=100;draw();
    if(status)status.textContent='Ish maydoni tayyor';
    splash.setAttribute('aria-busy','false');
    splash.classList.add('uzmed-boot-exit');
    W.setTimeout(function(){splash.remove();ended=true;},360);
  }
  function finish(){
    if(ended||failed||finishing)return;
    finishing=true;
    W.clearTimeout(longWait);
    target=100;
    if(reduce||!splash.isConnected){done2();return;}
    loop();
    W.setTimeout(function(){if(!ended&&!failed)done2();},1200); // zaxira: kadrlar to‘xtasa ham yopiladi
  }
  function fail(message){
    if(ended||failed)return;
    failed=true;
    W.clearTimeout(longWait);
    if(raf){W.cancelAnimationFrame(raf);raf=0;}
    if(status){
      status.textContent=message||'Yuklanishda xatolik yuz berdi.';
      status.setAttribute('role','alert');
    }
    var title=D.getElementById('uzb-title');
    if(title)title.textContent='Qayta urinish kerak';
    if(retry)retry.hidden=false;
  }
  var api={mark:mark,done:finish,fail:fail,status:function(){return {percent:Math.floor(shown),target:target,ended:ended,failed:failed};}};
  W.__UZMED_SPLASH_V1__=api;
  var longWait=W.setTimeout(function(){
    if(!ended&&!finishing&&!failed)fail('Yuklanish juda uzoq davom etdi. Internetni tekshiring va qayta urinib ko‘ring.');
  },45000);
  if(retry)retry.addEventListener('click',function(){W.location.reload();});
  draw();
  setTarget(6); // HTML, logo va splash tayyor
})(window,document);
