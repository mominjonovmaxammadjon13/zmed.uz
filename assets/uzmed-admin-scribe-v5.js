(function (W,D) {
  'use strict';
  if (W.__UZMED_ADMIN_MEDICAL_SCRIBE_V1__) return;
  W.__UZMED_ADMIN_MEDICAL_SCRIBE_V1__ = true;
  var ENDPOINT='/api/ai/admin-scribe';
  var ADMIN_MIC_CSS=`/* UZMED admin-only Scribe v2 Medical chat microphone. No shared chat styles changed. */
#uzAdminMedicalMic{
  flex:0 0 38px;display:inline-flex;align-items:center;justify-content:center;
  width:38px;height:38px;min-width:38px;min-height:38px;border:1px solid rgba(50,110,90,.20);
  border-radius:50%;background:rgba(28,160,104,.09);color:#14865f;
  padding:0;cursor:pointer;line-height:1;box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}
#uzAdminMedicalMic:focus-visible,.uz-scribe-panel button:focus-visible{outline:3px solid #3b82f6;outline-offset:2px;}
#uzAdminMedicalMic.uz-sm-active{background:#15815c;color:#fff;}
body.dark-mode #uzAdminMedicalMic{background:rgba(29,173,116,.18);color:#4ce5a4;border-color:rgba(29,173,116,.4);}
body#uzmedMobile #uzAdminMedicalMic{
  display:inline-flex!important;align-items:center!important;justify-content:center!important;
  flex:0 0 38px!important;width:38px!important;min-width:38px!important;
  max-width:38px!important;height:38px!important;min-height:38px!important;
  padding:0!important;border-radius:10px!important;margin:0!important;
}
#uzAdminMedicalVoicePanel{box-sizing:border-box;flex:0 0 auto;width:100%;max-width:100%;padding:2px 4px 8px;}
#uzAdminMedicalVoicePanel[hidden]{display:none!important;}
#uzAdminMedicalVoicePanel .uz-scribe-pill{
  box-sizing:border-box;width:100%;min-height:64px;display:flex;align-items:center;gap:11px;
  padding:7px 9px;border:1px solid #303337;border-radius:40px;
  background:#111315;color:#fff;box-shadow:0 8px 26px rgba(0,0,0,.22);
}
#uzAdminMedicalVoicePanel button{cursor:pointer;border:0;padding:0;outline:none;flex:0 0 46px;display:flex;align-items:center;justify-content:center;}
#uzAdminMedicalVoicePanel .uz-scribe-cancel,#uzAdminMedicalVoicePanel .uz-scribe-stop{
  width:45px;height:45px;border-radius:50%;background:#34373a;color:#fff;
}
#uzAdminMedicalVoicePanel .uz-scribe-stop span{width:15px;height:15px;border-radius:2px;background:white;}
#uzAdminMedicalVoicePanel .uz-scribe-submit{
  width:48px;height:48px;flex-basis:48px;border-radius:50%;
  background:#2c66eb;color:white;
}
#uzAdminMedicalVoicePanel button:disabled{opacity:.42;cursor:default;}
#uzAdminMedicalVoicePanel .uz-scribe-middle{
  flex:1;display:flex;flex-direction:column;justify-content:center;align-items:stretch;
  min-width:0;gap:4px;overflow:hidden;
}
#uzAdminMedicalVoicePanel .uz-scribe-wave{width:100%;display:flex;align-items:center;justify-content:space-between;gap:3px;height:13px;overflow:hidden;}
#uzAdminMedicalVoicePanel .uz-scribe-wave i{
  display:block;flex:1;max-width:4px;min-width:2px;height:4px;opacity:.55;
  background:#bfc4ce;border-radius:2px;animation:uz-scribe-pulse 850ms ease-in-out infinite alternate;
}
#uzAdminMedicalVoicePanel .uz-scribe-label{
  color:#e4e6ee;font-size:11px;font-weight:500;
  line-height:15px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;
}
#uzAdminMedicalVoicePanel[data-phase="ready"] .uz-scribe-wave i,
#uzAdminMedicalVoicePanel[data-phase="error"] .uz-scribe-wave i{animation-play-state:paused;opacity:.36;}
#uzAdminMedicalVoicePanel[data-phase="working"] .uz-scribe-wave i{animation-duration:400ms;}
#uzAdminMedicalVoicePanel .uz-scribe-hint{
  font:11px/1.35 system-ui,-apple-system,sans-serif;color:#68788b;
  padding:5px 7px 0;text-align:center;
}
@keyframes uz-scribe-pulse{0%{height:3px;opacity:.4}100%{height:12px;opacity:1}}
@media(max-width:390px){
  #uzAdminMedicalVoicePanel .uz-scribe-pill{gap:7px;padding:6px;min-height:58px;}
  #uzAdminMedicalVoicePanel .uz-scribe-cancel,
  #uzAdminMedicalVoicePanel .uz-scribe-stop{width:40px;height:40px;flex-basis:40px;}
  #uzAdminMedicalVoicePanel .uz-scribe-submit{width:43px;height:43px;flex-basis:43px;}
  #uzAdminMedicalVoicePanel .uz-scribe-hint{font-size:10px;}
}
@media(prefers-reduced-motion:reduce){
  #uzAdminMedicalVoicePanel .uz-scribe-wave i{animation:none;}
}

/* Admin-only: one-row mic / + / editable text / send. Other users untouched. */
body#uzmedMobile .ai-input-wrap.uz-scribe-enabled{
  display:grid!important;
  grid-template-columns:44px 40px minmax(0,1fr) 44px!important;
  grid-template-rows:minmax(44px,auto)!important;
  align-items:center!important;
  column-gap:3px!important;
  row-gap:0!important;
  padding:6px 8px!important;
  width:100%!important;max-width:100%!important;min-width:0!important;
  min-height:58px!important;
  box-sizing:border-box!important;
}
body#uzmedMobile .ai-input-wrap.uz-scribe-enabled > #uzAdminMedicalMic{
  grid-column:1!important;grid-row:1!important;
  display:flex!important;justify-self:center!important;align-self:center!important;
  width:42px!important;min-width:42px!important;max-width:42px!important;
  height:42px!important;min-height:42px!important;
  flex:0 0 42px!important;margin:0!important;padding:0!important;
  border-radius:50%!important;
}
body#uzmedMobile .ai-input-wrap.uz-scribe-enabled > #aiAttachBtn{
  grid-column:2!important;grid-row:1!important;align-self:center!important;
  justify-self:center!important;min-width:40px!important;width:40px!important;max-width:40px!important;
  height:44px!important;margin:0!important;padding:0!important;
}
body#uzmedMobile .ai-input-wrap.uz-scribe-enabled > :is(#uzmedV5Input,#aiInput){
  grid-area:1 / 3!important;grid-column:3!important;grid-row:1!important;min-width:0!important;
  width:100%!important;max-width:100%!important;
  min-height:44px!important;max-height:132px!important;
  padding:10px 4px!important;margin:0!important;
  font-size:16px!important;line-height:24px!important;
  align-self:center!important;box-sizing:border-box!important;
}
body#uzmedMobile .ai-input-wrap.uz-scribe-enabled > :is(#uzmedV5SendBtn,#aiSendBtn){
  grid-area:1 / 4!important;grid-column:4!important;grid-row:1!important;
  width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;
  max-width:44px!important;justify-self:center!important;align-self:center!important;
  margin:0!important;border-radius:50%!important;
}
@media(max-width:359px){
  body#uzmedMobile .ai-input-wrap.uz-scribe-enabled{
    grid-template-columns:40px 36px minmax(0,1fr) 40px!important;
    column-gap:2px!important;padding:5px 6px!important;
  }
  body#uzmedMobile .ai-input-wrap.uz-scribe-enabled > #uzAdminMedicalMic{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;}
  body#uzmedMobile .ai-input-wrap.uz-scribe-enabled > #aiAttachBtn{width:36px!important;min-width:36px!important;max-width:36px!important;}
  body#uzmedMobile .ai-input-wrap.uz-scribe-enabled > :is(#uzmedV5SendBtn,#aiSendBtn){width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;}
}
`;
  var mic=null, panel=null, label=null, stopBtn=null, upBtn=null;
  var recorder=null,stream=null,parts=[],recorded=null,timer=null,abort=null;
  var actor='',nextCheck=0,admin=false,checking=false,phase='idle',epoch=0,startAt=0;
  var lastComposer=null;
  // The legacy UZMED RAG adapter globally wraps fetch(); use native XHR for our local API.
  function apiRequest(method,path,token,payload,signal){
    return new Promise(function(resolve,reject){
      var x=new XMLHttpRequest(),settled=false;
      function end(error,value){if(settled)return;settled=true;if(signal)signal.removeEventListener('abort',cancel);if(error)reject(error);else resolve(value);}
      function cancel(){try{x.abort()}catch(e){}}
      x.open(method,ENDPOINT+path,true);x.responseType='json';x.timeout=100000;
      x.setRequestHeader('Authorization','Bearer '+token);
      if(payload)x.setRequestHeader('Content-Type','application/json');
      x.onload=function(){end(null,{ok:x.status>=200&&x.status<300,status:x.status,body:x.response||{}});};
      x.onerror=function(){end(Error('Ulanish xatosi. Internetni tekshiring.'));};
      x.ontimeout=function(){end(Error('OpenRouter javob berish vaqti tugadi.'));};
      x.onabort=function(){end(Object.assign(Error('Bekor qilindi'),{name:'AbortError'}));};
      if(signal){if(signal.aborted)return end(Object.assign(Error('Bekor qilindi'),{name:'AbortError'}));signal.addEventListener('abort',cancel,{once:true});}
      try{x.send(payload?JSON.stringify(payload):null);}catch(e){end(e);}
    });
  }

  function stopTracks() { if (stream) { stream.getTracks().forEach(function(t){try{t.stop()}catch(e){}});stream=null; } }
  function clearTimer() { if(timer){clearInterval(timer);timer=null;} }
  function render(message,mode) {
    phase=mode;
    if(panel) {
      panel.hidden=(mode==='idle');
      panel.dataset.phase=mode;
    }
    if(label) label.textContent=message||'';
    if(stopBtn) stopBtn.disabled=mode!=='recording';
    if(upBtn) upBtn.disabled=mode==='working'||mode==='idle';
    if(mic){mic.setAttribute('aria-pressed',String(mode==='recording'));mic.classList.toggle('uz-sm-active',mode==='recording');}
  }
  function discard() {
    epoch++;
    if(abort){try{abort.abort()}catch(e){} abort=null;}
    if(recorder && recorder.state!=='inactive'){try{recorder.stop()}catch(e){}}
    recorder=null; parts=[]; recorded=null; stopTracks();clearTimer();
    render('', 'idle');
  }
  function mount() {
    // Restore scoped styles if UZMED reconstructs its document. No global composer changes.
    if(!D.getElementById('uzAdminMedicalScribeCss')){
      var sheet=D.createElement('style');sheet.id='uzAdminMedicalScribeCss';
      sheet.textContent=ADMIN_MIC_CSS;(D.head||D.documentElement).appendChild(sheet);
    }
    var plus=D.getElementById('aiAttachBtn'), v5=D.getElementById('uzmedV5Input'), legacy=D.getElementById('aiInput');
    var input=v5&&getComputedStyle(v5).display!=='none'?v5:legacy&&getComputedStyle(legacy).display!=='none'?legacy:null;
    if(!plus||!plus.parentNode||!input) return;
    if(lastComposer && lastComposer!==plus.parentElement)lastComposer.classList.remove('uz-scribe-enabled');
    lastComposer=plus.parentElement;
    lastComposer.classList.toggle('uz-scribe-enabled',admin);
    if(!mic) {
      mic=D.createElement('button');mic.type='button';mic.id='uzAdminMedicalMic';
      mic.setAttribute('aria-label','Scribe v2 Medical bilan ovozni matnga aylantirish');
      mic.setAttribute('title','Tibbiy ovozli yozish (faqat admin)');
      mic.setAttribute('aria-pressed','false');
      mic.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/></svg>';
      mic.addEventListener('click',start);
    }
    if(admin && (mic.parentNode!==plus.parentNode || mic.nextElementSibling!==plus)) plus.parentNode.insertBefore(mic,plus);
    if(!admin && mic.parentNode) mic.remove();
    var area=plus.closest('.ai-input-area')||plus.parentNode.parentNode;
    if(!panel) {
      panel=D.createElement('div');panel.id='uzAdminMedicalVoicePanel';panel.className='uz-scribe-panel';
      panel.setAttribute('role','group');panel.setAttribute('aria-label','Tibbiy ovozli diktant');panel.hidden=true;
      panel.innerHTML='<div class="uz-scribe-pill">'+
        '<button type="button" class="uz-scribe-cancel" title="Bekor qilish" aria-label="Bekor qilish"><svg viewBox="0 0 24 24" width="25" height="25" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg></button>'+
        '<div class="uz-scribe-middle"><div class="uz-scribe-wave" aria-hidden="true"></div><span class="uz-scribe-label" aria-live="polite">Yozilmoqda</span></div>'+
        '<button type="button" class="uz-scribe-stop" title="Yozishni to‘xtatish" aria-label="Yozishni to‘xtatish"><span></span></button>'+
        '<button type="button" class="uz-scribe-submit" title="Matnga aylantirish" aria-label="Ovozni matnga aylantirish"><svg viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" stroke-width="2.7" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V4M5 11l7-7 7 7"/></svg></button></div>'+
        '<div class="uz-scribe-hint">Audio OpenRouter orqali qayta ishlanadi. Bemor ma’lumotlarini yuborishdan oldin maxfiylikka e’tibor bering.</div>';
      var wave=panel.querySelector('.uz-scribe-wave');
      for(var i=0;i<25;i++){var dot=D.createElement('i');dot.style.animationDelay=(i%7*70)+'ms';wave.appendChild(dot);}
      label=panel.querySelector('.uz-scribe-label');
      stopBtn=panel.querySelector('.uz-scribe-stop');
      upBtn=panel.querySelector('.uz-scribe-submit');
      panel.querySelector('.uz-scribe-cancel').addEventListener('click',discard);
      stopBtn.addEventListener('click',function(){stopRecording().catch(showError);});
      upBtn.addEventListener('click',submit);
    }
    if(area && panel.parentNode!==area) area.insertBefore(panel,area.firstChild);
  }
  function showError(error) {
    var message=error instanceof Error?error.message:'Ovozli yozuvda xatolik';
    render(message.slice(0,150),'error');
  }
  function stopRecording() {
    if(recorder && recorder.state!=='inactive'){
      var r=recorder, myEpoch=epoch;
      return new Promise(function(resolve,reject){
        function done() {
          if(myEpoch!==epoch)return reject(Error('Bekor qilindi'));
          recorded=new Blob(parts,{type:r.mimeType||'audio/webm'});
          parts=[];recorder=null;stopTracks();clearTimer();
          if(recorded.size<300)return reject(Error('Ovoz aniqlanmadi, qayta yozing.'));
          if(recorded.size>6_000_000)return reject(Error('Yozuv hajmi 6 MB dan oshdi.'));
          render('Yozuv tayyor · Matnga o‘tkazish uchun ↑','ready');
          resolve(recorded);
        }
        r.addEventListener('stop',done,{once:true});
        try{r.stop();}catch(e){reject(e)}
      });
    }
    return Promise.resolve(recorded);
  }
  async function start() {
    if(!admin||phase==='working')return;
    if(phase!=='idle'){discard();return;}
    if(!W.MediaRecorder || !navigator.mediaDevices?.getUserMedia){showError(Error('Brauzeringizda mikrofon orqali yozish qo‘llanmaydi.'));return;}
    var stamp=++epoch;
    try {
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
      if(stamp!==epoch){stopTracks();return;}
      var variants=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'];
      var fmt=variants.find(function(x){try{return MediaRecorder.isTypeSupported(x)}catch(e){return false}});
      recorder=fmt?new MediaRecorder(stream,{mimeType:fmt}):new MediaRecorder(stream);
      parts=[];recorded=null;startAt=Date.now();
      recorder.addEventListener('dataavailable',function(e){if(stamp===epoch&&e.data?.size)parts.push(e.data)});
      recorder.addEventListener('error',function(){if(stamp===epoch){stopTracks();clearTimer();showError(Error('Mikrofon yozuvi uzildi.'));}});
      recorder.start(800);
      render('00:00 · Yozilmoqda','recording');
      timer=setInterval(function(){
        if(stamp!==epoch)return;
        var seconds=Math.floor((Date.now()-startAt)/1000);
        if(seconds>=90){stopRecording().catch(showError);return;}
        var count=''+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
        if(label)label.textContent=count+' · Yozilmoqda';
      },500);
    } catch(e) {
      stopTracks();clearTimer();
      showError(Error(e?.name==='NotAllowedError'?'Mikrofonga ruxsat bering.':'Mikrofon ishga tushmadi.'));
    }
  }
  function toBase64(blob) {
    return new Promise(function(resolve,reject) {
      var reader=new FileReader();
      reader.onload=function(){var s=String(reader.result||'');resolve(s.slice(s.indexOf(',')+1));};
      reader.onerror=function(){reject(Error('Audio fayl o‘qilmadi.'))};
      reader.readAsDataURL(blob);
    });
  }
  async function submit(){
    if(!admin||phase==='working'||phase==='idle')return;
    var myEpoch=epoch;
    try {
      var blob=recorded||await stopRecording();
      if(!blob || myEpoch!==epoch)return;
      var token=await W.UZMEDAuth?.getAccessToken?.();
      if(!token || myEpoch!==epoch)throw Error('Admin akkauntiga qayta kiring.');
      var base64=await toBase64(blob);
      if(myEpoch!==epoch)return;
      abort=new AbortController();
      render('Tibbiy nutq matnga aylantirilmoqda…','working');
      var response=await apiRequest('POST','/transcribe',token,
        {audio_base64:base64,mime:blob.type,language:'uz'},abort.signal);
      var body=response.body;
      if(myEpoch!==epoch)return;
      if(!response.ok||!body.ok||!body.text){
        var errors={admin_only:'Faqat admin uchun.',openrouter_not_configured:'OpenRouter kaliti mavjud emas.',dictation_rate_limit:'Ovozli so‘rov chegarasi tugadi.',transcription_provider_unavailable:'OpenRouter vaqtincha javob bermadi.',empty_transcription:'Ovozdan matn olinmadi.',audio_too_large:'Audio hajmi juda katta.',already_processing:'Oldingi diktant qayta ishlanmoqda.'};
        throw Error(errors[body.error]||'Transkripsiya bajarilmadi. Qayta urinib ko‘ring.');
      }
      var input=D.getElementById('uzmedV5Input');
      if(!input||getComputedStyle(input).display==='none')input=D.getElementById('aiInput');
      if(!input||getComputedStyle(input).display==='none')throw Error('Chat matn maydoni topilmadi.');
      input.value+=(input.value.trim()?'\n':'')+body.text;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      try { if(typeof W.autoResizeAi==='function')W.autoResizeAi(input); }catch(e){}
      discard();
      input.focus();
    }catch(e){if(myEpoch===epoch && e?.name!=='AbortError')showError(e);}
    finally{abort=null;}
  }
  async function syncAuth(){
    if(checking || !W.UZMEDAuth?.getState || !W.UZMEDAuth?.getAccessToken)return;
    var s=W.UZMEDAuth.getState(), id=s?.loggedIn?String(s.user?.id||''):'';
    if(!id){actor='';admin=false;nextCheck=0;if(phase!=='idle')discard();mount();return;}
    if(id===actor&&Date.now()<nextCheck)return;
    checking=true;
    try {
      var token=await W.UZMEDAuth.getAccessToken();
      if(!token)throw Error('auth_required');
      var r=await apiRequest('GET','/status',token);
      var data=r.ok?r.body:null;
      if(String(W.UZMEDAuth.getState()?.user?.id||'')!==id)return;
      actor=id;admin=!!(r.ok&&data?.admin&&data?.available);
      nextCheck=Date.now()+(admin?60000:15000);
      if(!admin && phase!=='idle')discard();
      mount();
    }catch(e){actor=id;admin=false;nextCheck=Date.now()+15000;mount();}
    finally{checking=false;}
  }
  function boot(){
    mount();syncAuth();
    setInterval(function(){mount();syncAuth()},3000);
    D.addEventListener('visibilitychange',function(){if(!D.hidden){mount();syncAuth()}});
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window,document);
