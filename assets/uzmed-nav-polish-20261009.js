/* UZMED clinical drawer usability improvements, 2026-10-09.
 * Presentation only. No routes removed, no credentials, no data requests. */
(function(){
 'use strict';
 if(window.__UZMED_NAV_POLISH_20261009)return;
 window.__UZMED_NAV_POLISH_20261009=true;
 function mount(){
  var panel=document.getElementById('uzSideMenu');
  if(!panel)return false;
  var head=panel.querySelector('.uz-menu-head');
  var body=panel.querySelector('.uz-menu-body');
  if(!head||!body)return false;
  var input=document.getElementById('uzmedMenuSearch20261009');
  if(!input){
   input=document.createElement('input');
   input.id='uzmedMenuSearch20261009';
   input.type='search';
   input.autocomplete='off';
   input.placeholder='Bo‘limni qidirish…';
   input.setAttribute('aria-label','UZMED bo‘limlarini qidirish');
   head.appendChild(input);
   // Preserve original route handlers and layout nodes; filter visibility only.
   function filter(){
    var term=input.value.toLocaleLowerCase('uz-UZ').replace(/\s+/g,' ').trim();
    var sections=body.querySelectorAll('.uz-menu-section');
    var buttons=body.querySelectorAll('.uz-menu-item');
    buttons.forEach(function(btn){
     var label=(btn.innerText||btn.textContent||'').toLocaleLowerCase('uz-UZ').replace(/\s+/g,' ');
     btn.classList.toggle('uzmed-filter-hidden',Boolean(term)&&!label.includes(term));
    });
    sections.forEach(function(section){
     if(!term){section.classList.remove('uzmed-filter-hidden');return;}
     var next=section.nextElementSibling,has=false;
     while(next&&!next.classList.contains('uz-menu-section')){
      if(next.classList.contains('uz-menu-item')&&!next.classList.contains('uzmed-filter-hidden'))has=true;
      next=next.nextElementSibling;
     }
     section.classList.toggle('uzmed-filter-hidden',!has);
    });
   }
   input.addEventListener('input',filter);
   var oldClose=window.closeMenu;
   if(typeof oldClose==='function'&&!oldClose.__uzmedPolished){
    var newClose=function(){
     var out=oldClose.apply(this,arguments);
     input.value='';filter();
     return out;
    };
    newClose.__uzmedPolished=true;
    window.closeMenu=newClose;
   }
  }
  return true;
 }
 if(!mount()){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else{var times=0,timer=setInterval(function(){if(mount()||++times>=25)clearInterval(timer)},200);}
 }
})();
