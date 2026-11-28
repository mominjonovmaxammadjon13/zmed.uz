/* UZMED · Qabul matn maydonlari yozilgan matnga qarab avtomatik kattalashadi.
   Matn to‘liq ko‘rinadi; juda uzun bo‘lsa ekranning 75% igacha o‘sib, keyin ichida aylanadi. */
(function(W,D){
 'use strict';
 if(W.__UZMED_QABUL_AUTOGROW_V1__)return;
 W.__UZMED_QABUL_AUTOGROW_V1__=true;
 const SKIP='dialog,#allergyTemplateDialog,#templateDialog,.qd-toolbar';
 const seen=new WeakMap();
 function eligible(t){return t&&t.tagName==='TEXTAREA'&&!t.closest(SKIP)&&t.offsetParent!==null;}
 function limit(){return Math.max(320,Math.round(W.innerHeight*0.75));}
 function minH(t){return parseFloat(W.getComputedStyle(t).minHeight)||0;}
 function apply(t,content){
  const max=limit(),h=Math.max(minH(t),Math.min(content,max));
  t.style.height=h+'px';
  t.style.overflowY=content>max?'auto':'hidden';
  seen.set(t,t.value.length+'|'+t.clientWidth);
 }
 function border(t){const s=W.getComputedStyle(t);return (parseFloat(s.borderTopWidth)||0)+(parseFloat(s.borderBottomWidth)||0);}
 // To‘liq o‘lchash: balandlik vaqtincha «auto» qilinadi (faqat fokusda bo‘lmagan maydonlar uchun).
 function fit(t){
  if(!eligible(t))return;
  const keep=t.scrollTop;
  t.style.height='auto';
  apply(t,t.scrollHeight+border(t));
  t.scrollTop=keep;
 }
 // Yozish paytida faqat o‘stiriladi: sahifa sakramaydi.
 function grow(t){
  if(!eligible(t))return;
  if(t.scrollHeight>t.clientHeight+1)apply(t,t.scrollHeight+border(t));
  else seen.set(t,t.value.length+'|'+t.clientWidth);
 }
 function sweep(){
  if(D.hidden)return;
  for(const t of D.getElementsByTagName('textarea')){
   if(!eligible(t))continue;
   const sig=t.value.length+'|'+t.clientWidth;
   if(seen.get(t)===sig)continue;
   if(t===D.activeElement)grow(t);else fit(t);
  }
 }
 D.addEventListener('input',e=>{const t=e.target;if(t.tagName!=='TEXTAREA')return;if(t===D.activeElement)grow(t);else fit(t);},true);
 D.addEventListener('focusin',e=>{if(e.target.tagName==='TEXTAREA')grow(e.target);},true);
 let rt;W.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{for(const t of D.getElementsByTagName('textarea'))seen.delete(t);sweep();},200);});
 for(const ev of ['qabul:restored','qabul:session-ready','qabul:clinical-locked'])W.addEventListener(ev,()=>setTimeout(sweep,60));
 D.addEventListener('click',()=>setTimeout(sweep,80),true);
 D.addEventListener('change',()=>setTimeout(sweep,80),true);
 // Dastur orqali yozilgan matnlar (qoralama tiklash, shablon) ham hisobga olinadi: yengil davriy tekshiruv.
 setInterval(sweep,800);
 setTimeout(sweep,300);
})(window,document);
