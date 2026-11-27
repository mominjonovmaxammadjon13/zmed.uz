(function(){
'use strict';
const tg=window.Telegram?.WebApp,init=tg?.initData||'';
const field=document.getElementById('key'),status=document.getElementById('status');
const form=document.getElementById('keyform'),button=document.getElementById('save');
if(tg){tg.ready();tg.expand();}
function message(s){status.textContent=s;}
if(init){button.disabled=false;message('Kalitni joylashtiring va «Saqlash va tekshirish» tugmasini bosing.');}
else message('Faqat UZMED ADMIN Telegram botidan oching.');
form.addEventListener('submit',async e=>{
 e.preventDefault();
 if(!init||button.disabled)return;
 const key=field.value.trim();
 if(!/^vlk_[A-Za-z0-9_-]{12,240}$/.test(key)){
  message('Kalit formati noto‘g‘ri. VoiceLab API kalitini to‘liq nusxalang.');return;
 }
 button.disabled=true;message('VoiceLab STT va TTS ruxsatlari tekshirilmoqda...');
 try{
  const r=await fetch('/api/admin-voice/key-install',{
   method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json','X-Telegram-Init-Data':init},
   body:JSON.stringify({api_key:key})});
  const data=await r.json();
  if(r.ok&&data.ok){
   field.value='';message('✅ Kalit xavfsiz saqlandi. VoiceLab STT va ovozlar ruxsati tasdiqlandi. Mini App oynasini yoping va 📞 Jonli suhbatni sinang.');
  }else{
   const m={
    voicelab_stt_scope_missing:'❌ Kalitda Nutqdan matnga (STT) ruxsati yetishmayapti.',
    voicelab_stt_insufficient_credits:'❌ VoiceLab STT uchun kredit yetarli emas.',
    voicelab_stt_invalid_key:'❌ Kalit haqiqiy emas.',
    invalid_key_format:'❌ Kalit formati noto‘g‘ri.',
    telegram_auth_required:'❌ Sessiya eskirgan. Botdan qayta oching.',
    too_many_attempts:'❌ Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.'
   };
   const err=String(data.error||'unknown');
   message(m[err]||(err.startsWith('voicelab_voices_access_')?'❌ Ovozlar (Voices) uchun O‘qish ruxsatini yoqing.':'❌ Kalitni tekshirib bo‘lmadi. Eski kalit saqlangan.'));
  }
 }catch{message('❌ Tarmoq xatosi. Kalit saqlanganini tekshirmasdan qayta yubormang.');}
 finally{button.disabled=false;}
});
window.addEventListener('pagehide',()=>{field.value='';});
})();
