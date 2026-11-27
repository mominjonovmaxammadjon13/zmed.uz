(function(){
'use strict';
const app=window.Telegram?.WebApp,init=app?.initData||'';
const form=document.getElementById('keyform'),key=document.getElementById('key');
const button=document.getElementById('save'),status=document.getElementById('status');
if(app){app.ready();app.expand()}
function tell(msg){status.textContent=msg}
if(init){button.disabled=false;tell('SpeechLab read kalitini kiriting.')}
else tell('Ushbu oynani @uzmedadminbot ichidan oching.');
form.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!init||button.disabled)return;
 const value=key.value.trim();
 if(!/^sl_live_[A-Za-z0-9_-]{12,240}$/.test(value)){tell('Kalit to‘liq emas yoki formati noto‘g‘ri.');return}
 button.disabled=true;tell('O‘qish ruxsati tekshirilmoqda…');
 try{
  const response=await fetch('/api/admin-voice/speechlab-key-install',{
   method:'POST',cache:'no-store',credentials:'same-origin',
   headers:{'Content-Type':'application/json','X-Telegram-Init-Data':init},
   body:JSON.stringify({api_key:value})
  });
  const result=await response.json();
  if(response.ok&&result.ok){
   key.value='';tell('✅ SpeechLab UZMED’ga xavfsiz ulandi. Telefon qo‘ng‘iroqlariga ruxsat berilmadi. Endi botga qaytib «📞 Telefon AI» ni bosing.');
  }else{
   const codes={invalid_key_format:'❌ Kalit formati xato.',invalid_api_key:'❌ API kalit qabul qilinmadi.',
    insufficient_read_scope:'❌ Kalitga read ruxsatini bering.',rate_limited:'❌ SpeechLab so‘rov chegarasi. Keyinroq urinib ko‘ring.',
    too_many_attempts:'❌ Juda ko‘p urinish. 15 daqiqa kuting.',
    telegram_auth_required:'❌ Sessiya muddati tugagan. Botdan qayta oching.',
    speechlab_unreachable:'❌ SpeechLab’ga ulanish vaqtincha imkonsiz.'};
   tell(codes[result.error]||'❌ Xavfsiz ulash tugamadi. Avvalgi sozlamalar o‘zgarmadi.');
  }
 }catch{tell('❌ Tarmoq xatosi. Ulanish holatini botdan tekshiring.')}
 finally{button.disabled=false}
});
window.addEventListener('pagehide',()=>{key.value=''});
})();
