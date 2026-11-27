/* Qabul v4: progressive navigation behavior only. Clinical events remain native. */
(function(W,D){
'use strict';
function mount(){
 const rail=D.getElementById('qfNav');
 if(!rail||rail.dataset.uv4Enhanced==='1')return;
 const tabs=Array.from(rail.querySelectorAll('[data-focus-tab]'));
 if(tabs.length!==7)return;
 rail.dataset.uv4Enhanced='1';
 const labels=['Shikoyatlar','Anamnez','Ko‘rik','Tekshiruvlar','Tashxis','Davolash','Tavsiyalar'];
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-label',(i+1)+'. '+labels[i]);tab.setAttribute('title',(i+1)+'. '+labels[i]);});
 let last=null;
 function synchronize(){
   const active=tabs.find(b=>b.classList.contains('active'));
   if(!active||active===last)return;
   last=active;
   if(!W.matchMedia('(max-width:760px)').matches)return;
   const current=active.getBoundingClientRect(),bounds=rail.getBoundingClientRect();
   const x=rail.scrollLeft+current.left-bounds.left-(rail.clientWidth-current.width)/2;
   rail.scrollTo({left:Math.max(0,x),behavior:'instant'});
 }
 const observer=new MutationObserver(synchronize);
 observer.observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});
 synchronize();
 W.addEventListener('resize',()=>{last=null;synchronize();},{passive:true});
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})(window,document);
