(function(){
'use strict';
const app=window.Telegram?.WebApp,init=app?.initData||'';
const form=document.querySelector('#keyform'),key=document.querySelector('#profilekey');
const button=document.querySelector('#save'),status=document.querySelector('#status');
if(app){app.ready();app.expand()}
function say(message){status.textContent=message}
if(init){button.disabled=false;say('Kalitni kiriting. U serverga shifrlangan HTTPS orqali yuboriladi.')}
else say('Oynani faqat @uzmedadminbot ichidan oching.');
form.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!init||button.disabled)return;
 const value=key.value.trim();
 if(!/^[A-Za-z0-9._-]{16,256}$/.test(value)){say('Kalit formati mos kelmayapti. Qayta nusxalang.');return}
 button.disabled=true;say('Profil kaliti va UZMED kassa #395 tekshirilmoqda…');
 try{
  const response=await fetch('/api/admin-voice/checkout-profile-key-install',{
   method:'POST',cache:'no-store',credentials:'same-origin',
   headers:{'Content-Type':'application/json','X-Telegram-Init-Data':init},
   body:JSON.stringify({api_key:value})
  });
  const result=await response.json();
  if(response.ok&&result.ok){
   key.value='';say('✅ Checkout.uz Profil API kaliti muvaffaqiyatli ulandi. Admin botga qayting va «💳 Checkout.uz» ni bosing.');
  }else{
   const errors={
    invalid_key_format:'Kalit formati xato.',
    uzmed_shop_395_not_found:'Ushbu profil kalitiga UZMED #395 kassasi biriktirilmagan.',
    checkout_profile_key_validation_failed:'Checkout.uz API kalitni tasdiqlamadi yoki hozir ishlamayapti.',
    telegram_auth_required:'Telegram sessiyasi eskirgan. Botdan qayta oching.',
    too_many_attempts:'Ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.',
    origin_required:'Ushbu oynani @uzmedadminbot ichidan oching.'
   };
   say('❌ '+(errors[result.error]||'Ulash amalga oshmadi. Oldingi sozlamalar saqlandi.'));
  }
 }catch{say('❌ Ulanish xatosi. Internetni tekshirib, qayta urinib ko‘ring.')}
 finally{button.disabled=false}
});
window.addEventListener('pagehide',()=>{key.value=''});
})();
