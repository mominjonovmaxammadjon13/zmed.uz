/* UZMED HIG + Apple uslubi + telefon tuzatishlari.
   CSS'ni haqiqiy ilova hujjatiga ulaydi (bundler qobig'i almashganda ham),
   status panel rangini mavzuga moslaydi va iOS'da maydon bosilganda
   sahifa kattalashib ketmasligi uchun 16px dan kichik maydonlarni belgilaydi. */
(function(){
  'use strict';
  if(window.__UZMED_HIG_FIXES_V1__)return;window.__UZMED_HIG_FIXES_V1__=true;
  var SHEETS=[
    ['uzmed-apple-v1','/assets/uzmed-apple-v1.css?v=20261128-3'],
    ['uzmed-hig-fixes-v1','/assets/uzmed-hig-fixes-v1.css?v=20261128-1'],
    ['uzmed-native-v1','/assets/uzmed-native-v1.css?v=20261128-1'],
    ['uzmed-apple-sections-v1','/assets/uzmed-apple-sections-v1.css?v=20261128-2']
  ];
  var TEXT=/^(text|search|email|tel|number|password|url|date|time|datetime-local|month|week)$/;
  var coarse=false;try{coarse=matchMedia('(pointer:coarse)').matches;}catch(e){}

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

  /* Status panel / brauzer chizig'i rangi: yuqori panel rangiga mos (mavzu ilova ichida tanlanadi) */
  function themeColor(){
    try{
      var de=document.documentElement,b=document.body;
      var dark=de.getAttribute('data-uzmed-ux-theme')==='dark'||(!de.hasAttribute('data-uzmed-ux-theme')&&b&&b.classList.contains('dark-mode'));
      var want=dark?'#161618':'#F9F9F9';
      var m=document.querySelector('meta[name="theme-color"]');
      if(!m){m=document.createElement('meta');m.name='theme-color';(document.head||de).appendChild(m);}
      if(m.getAttribute('content')!==want)m.setAttribute('content',want);
    }catch(e){}
  }

  function isTextField(el){
    if(!el||!el.tagName)return false;var t=el.tagName;
    if(t==='TEXTAREA'||t==='SELECT')return true;
    return t==='INPUT'&&TEXT.test((el.getAttribute('type')||'text').toLowerCase());
  }
  function mark(el){
    try{if(isTextField(el)&&!el.classList.contains('uz-in16')&&parseFloat(getComputedStyle(el).fontSize)<16)el.classList.add('uz-in16');}catch(e){}
  }
  /* Ekran o'quvchi uchun: nomsiz sozlama kalitlariga qator nomini beradi */
  function names(){
    try{
      var t=document.querySelectorAll('.soz-toggle:not([aria-label])');
      for(var i=0;i<t.length;i++){
        var row=t[i].closest('.settings-item');var lab=row&&row.querySelector('.settings-label,.soz-label,b,strong,span:not(.soz-toggle):not(.soz-toggle-slider)');
        var txt=lab&&lab.textContent.trim();if(txt)t[i].setAttribute('aria-label',txt.slice(0,60));
      }
    }catch(e){}
  }
  function sweep(){
    try{var list=document.querySelectorAll('input,textarea,select');for(var i=0;i<list.length;i++)mark(list[i]);}catch(e){}
  }

  ensure();themeColor();
  var rootObs=null,root=null;
  function watchRoot(){
    try{
      if(root===document.documentElement)return;root=document.documentElement;
      if(rootObs)rootObs.disconnect();
      rootObs=new MutationObserver(themeColor);
      rootObs.observe(root,{attributes:true,attributeFilter:['data-uzmed-ux-theme','class']});
    }catch(e){}
  }
  watchRoot();
  try{new MutationObserver(function(){ensure();watchRoot();themeColor();}).observe(document,{childList:true});}catch(e){}
  document.addEventListener('DOMContentLoaded',function(){ensure();themeColor();});
  window.addEventListener('load',function(){ensure();themeColor();if(coarse)sweep();});
  if(coarse){
    /* pointerdown fokusdan oldin keladi — iOS kattalashtirish qarorini fokusda qiladi */
    document.addEventListener('pointerdown',function(e){mark(e.target);},true);
    document.addEventListener('focusin',function(e){mark(e.target);},true);
  }
  var n=0;(function tick(){ensure();themeColor();names();if(coarse&&n%3===0)sweep();if(++n<40)setTimeout(tick,500);})();
})();
