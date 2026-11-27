/* UZMED Telegram ⇄ Google consent screen. Independent of clinical UI. */
(function(W,D){
 'use strict';
 const KEY='uzmed_google_invitation_20261024';
 let item=null,busy=false,root=null,notice=null,action=null;
 try{
  const hash=W.location.hash||'';
  if(/^#uzmed_google_link=[A-Za-z0-9_-]{43}$/.test(hash)){
   item={token:hash.slice('#uzmed_google_link='.length),at:Date.now()};
   W.localStorage.setItem(KEY,JSON.stringify(item));
   W.history.replaceState(null,'',W.location.pathname+W.location.search);
  }else item=JSON.parse(W.localStorage.getItem(KEY)||'null');
  if(!item||!/^[A-Za-z0-9_-]{43}$/.test(String(item.token||''))||!Number.isFinite(item.at)||Date.now()-item.at>12*60*1000){
   W.localStorage.removeItem(KEY);item=null;
  }
 }catch{item=null;}
 if(!item)return;
 function el(tag,txt){const n=D.createElement(tag);if(txt!=null)n.textContent=String(txt);return n;}
 function close(){
  try{W.localStorage.removeItem(KEY);}catch{}
  item=null;root?.remove();
 }
 function button(label,onClick){const b=el('button',label);b.type='button';b.style.cssText='border:0;border-radius:12px;padding:12px 15px;font:inherit;font-weight:600;background:#087e76;color:white;cursor:pointer;min-height:44px';b.onclick=onClick;return b;}
 function show(message){if(notice)notice.textContent=message;}
 async function refresh(){
  if(!item||busy)return;
  const s=W.UZMEDAuth?.getState?.();
  const ok=!!(s?.loggedIn&&s.user?.id);
  if(action)action.textContent=ok?'Google akkauntini Telegram bilan bog‘lash':'Google orqali UZMEDga kirish';
  if(ok)show('Akkauntga kirgansiz. Tasdiqlashni boshlash uchun pastdagi tugmani bosing. Faqat Google hisobingiz qabul qilinadi.');
  else show('Google hisobingiz bilan xavfsiz kiring. Kirishdan keyin bu oynada bog‘lashni tasdiqlaysiz.');
 }
 async function proceed(){
  if(!item||busy)return;
  const token=await W.UZMEDAuth?.getAccessToken?.();
  if(!token){
   show('UZMED kirish oynasidan Google / Gmail orqali kiring.');
   if(root)root.style.display='none';
   W.UZMEDAuth?.open?.();
   const loginTab=D.querySelector('[data-auth-tab="login"]');
   loginTab?.click();
   return;
  }
  busy=true;action.disabled=true;show('Google akkauntingiz tekshirilmoqda…');
  try{
   const r=await W.fetch('/api/core/entry/google/begin',{
    method:'POST',credentials:'omit',cache:'no-store',
    headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
    body:JSON.stringify({token:item.token})
   });
   const data=await r.json();
   if(!r.ok){
    const messages={
     google_provider_required:'Avval Google orqali kirish kerak. Saytdan chiqib, Google tugmasi bilan kiring.',
     google_account_unverified:'Google email manzilingiz tasdiqlanmagan.',
     existing_telegram_account_requires_safe_merge:'Bu Telegram akkaunti avval boshqa UZMED akkauntiga bog‘langan. Bemorlaringizni saqlash uchun avtomatik birlashtirish bloklandi.',
     google_account_already_used:'Google akkauntingiz boshqa Telegram foydalanuvchisiga bog‘langan.',
     google_link_expired_or_used:'Bog‘lash havolasi eskirgan. Botda /google orqali yangisini oling.',
     admin_google_link_denied:'Bosh admin akkaunti maxsus himoyalangan, uni Telegramga bu usulda ulash mumkin emas.'
    };
    throw new Error(messages[data.error]||'Bog‘lash amalga oshmadi. Google hisobingiz va botdagi havolani tekshiring.');
   }
   close();
   const done=el('div');
   done.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#081c26e8;display:flex;align-items:center;justify-content:center;padding:24px;';
   const panel=el('section');panel.style.cssText='background:#102b34;border:1px solid #3b656c;color:#f3fafb;border-radius:22px;padding:28px;max-width:450px;font:16px/1.55 system-ui;text-align:center';
   panel.append(el('h2','✅ Google tekshiruvi bajarildi'),el('p',data.telegram_notified?'Telegramga qayting va kelgan “Google akkauntimni bog‘lash” tugmasini bosing.':'Telegramda /start orqali tasdiqlashni qayta tekshiring. Tasdiqlash xabari yetkazilmadi.'));
   panel.append(button('Telegram botga qaytish',()=>{W.location.href='https://t.me/uz_med_bot';}));
   done.append(panel);D.body.append(done);
   return;
  }catch(e){show(e.message||'Ulashda xato yuz berdi.');}
  finally{busy=false;if(action)action.disabled=false;}
 }
 function init(){
  if(!item||!D.body)return;
  root=el('div');root.id='uzmed-google-link-confirm';
  root.style.cssText='position:fixed;inset:0;z-index:2147483600;background:#081c26ed;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
  const panel=el('section');panel.style.cssText='width:min(100%,460px);background:#112a35;color:#f3fafb;border:1px solid #39666d;border-radius:20px;padding:24px;box-shadow:0 20px 80px #0007;font:16px/1.5 system-ui';
  const title=el('h2','UZMED — Google orqali kirish');title.style.cssText='font-size:23px;margin:0 0 8px';
  notice=el('p','Google akkauntingizni UZMED Telegram botiga bog‘lash');notice.setAttribute('role','status');
  const hint=el('p','Tasdiqlashni faqat o‘zingiz boshlagan bo‘lsangiz davom ettiring. Shaxsiy bemor ma’lumotlari boshqa akkauntga berilmaydi.');
  hint.style.cssText='color:#bed6d9;font-size:14px';
  action=button('Google orqali UZMEDga kirish',proceed);
  action.style.width='100%';
  const cancel=button('Bekor qilish',close);cancel.style.cssText+=';margin-top:12px;background:#34515c;width:100%';
  panel.append(title,notice,hint,action,cancel);root.append(panel);D.body.append(root);
  refresh();
  W.addEventListener('uzmed:auth-change',()=>{if(W.UZMEDAuth?.getState?.()?.loggedIn&&root)root.style.display='flex';W.setTimeout(refresh,150);});
  let tries=0;const interval=W.setInterval(()=>{refresh();if(++tries>=120)W.clearInterval(interval);},1000);
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(window,document);
