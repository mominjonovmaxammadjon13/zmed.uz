'use strict';
(function(){
 const $=id=>document.getElementById(id),focus=window.QabulFocus,routing=window.QabulVoiceSections;if(!focus||!routing)return;
 const microphone='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>';
 document.querySelector('.dictation')?.remove();
 const dialog=focus.dialog('voiceDialog','Ovozdan matn kiritish');dialog.classList.add('qv-dialog');
 const body=document.createElement('div');body.innerHTML='<div class="qv-tabs" role="tablist" aria-label="Ovoz manbasi"><button id="voiceMicTab" type="button" role="tab" aria-selected="true">🎙 Mikrofon</button><button id="voiceFileTab" type="button" role="tab" aria-selected="false">♬ Audio fayl</button></div><div class="qv-selects"><label>Kiritish usuli<select id="voiceTarget"></select></label><label>Til<select id="voiceLang"><option value="uz">O‘zbekcha</option><option value="ru">Русский</option></select></label></div><div id="voiceMicPanel" class="qv-capture"><div class="qv-controls"><button id="voiceStart" type="button" class="qv-main" aria-label="Yozishni boshlash">'+microphone+'</button><button id="voiceStop" type="button" class="qv-main" data-recording="true" aria-label="Yozishni to‘xtatish" hidden><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"/></svg></button><button id="voicePause" type="button" class="qv-pause" aria-label="Pauza" hidden>Ⅱ</button></div><div class="qv-wave" id="voiceWave" aria-hidden="true"></div><div id="voiceTimer" class="qv-timer">00:00</div><div id="voiceCaption" class="qv-caption"></div><div class="qv-progress" id="voiceProgress" hidden><i></i></div></div><div id="voiceFilePanel" class="qv-file" hidden><div>'+microphone+'<p>2 daqiqagacha · MP3, WAV, M4A, OGG yoki WebM</p><button id="voiceChoose" type="button">Audio fayl tanlash</button><input id="voiceFile" type="file" accept="audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/webm,.m4a,.mp3,.wav,.ogg,.webm" hidden></div></div><p id="voiceStatus" class="qv-status" role="status" aria-live="polite"></p><button id="voiceRetry" type="button" class="qf-primary" hidden>Natijani qayta tekshirish</button><div id="voicePreview" class="qv-preview" hidden><div id="voiceMap" class="qv-map"></div><p id="voiceRemainder" class="qv-remainder" hidden></p><label for="voiceTranscript">Ovozdan olingan to‘liq matn</label><textarea id="voiceTranscript" maxlength="10000"></textarea><div class="qv-actions"><button id="voiceApply" type="button">Maydonga qo‘shish</button><button id="voiceDiscard" type="button">Bekor qilish</button><button id="voiceUndo" type="button" hidden>Qo‘shilgan ovoz matnini qaytarish</button></div></div>';
 dialog.append(body);for(let i=0;i<40;i++){const b=document.createElement('i');$('voiceWave').append(b);}
 const pro=focus.dialog('voiceProDialog','PRO obunasi uchun');pro.classList.add('qv-pro');const p=document.createElement('div');p.innerHTML='<div class="qv-pro-icon" aria-hidden="true">♛</div><p>Bu mikrofon faqat Admin va faol PRO obunachilari uchun. Foydalanish uchun PRO obunasini sotib oling.</p><a id="voiceDeveloper" href="/assets/uzmed-pro-billing/index.html">UZMED PRO obunasi</a>';pro.append(p);if(window.Telegram?.WebApp||new URLSearchParams(location.hash.slice(1)).has('qabul_voice')){$('voiceDeveloper').hidden=true;p.querySelector('p').textContent='Bu mikrofon faqat Admin va faol PRO obunachilari uchun. PRO obunasini faollashtiring.';}
 const targets=routing.fields.map(f=>[f.key,f.label]);
 for(const [value,label]of [['auto','Bo‘limlarga avtomatik'],...targets]){const o=document.createElement('option');o.value=value;o.textContent=label;$('voiceTarget').append(o);}
 const receipt=document.createElement('div');receipt.className='qv-receipt';receipt.hidden=true;receipt.id='voiceReceipt';
 const receiptText=document.createElement('span'),receiptUndo=document.createElement('button');receiptUndo.type='button';receiptUndo.id='voiceReceiptUndo';receiptUndo.textContent='Qaytarish';receipt.append(receiptText,receiptUndo);$('qfStatus').after(receipt);
 let voiceToken='',launchToken='',generation=0,mode='idle',recorder=null,stream=null,context=null,animation=0,timer=0,started=0,pausedAt=0,pausedMs=0,elapsed=0,selected='auto',request=null,opening=false,lastWrites=[],applied=false;
 try{const hash=new URLSearchParams(location.hash.slice(1));launchToken=hash.get('qabul_voice')||'';if(launchToken){hash.delete('qabul_voice');history.replaceState(null,'',location.pathname+location.search+(hash.size?'#'+hash.toString():''));}}catch{}
 const messages={voice_pro_only:'Ovozdan matn kiritish uchun UZMED PRO obunasi kerak.',voice_session_expired:'Kirish muddati tugadi. Botga /menu yuborib, qabulni qayta oching.',voice_login_required:'UZMED akkauntingizga kiring yoki botdagi /menu orqali qayta oching.',voice_auth_unavailable:'Akkauntni tekshirish vaqtincha ishlamadi. Qayta urinib ko‘ring.',voice_key_missing:'Voicelab kaliti serverda sozlanmagan.',voice_key_invalid:'Voicelab kaliti qabul qilinmadi.',voice_credits_empty:'Voicelab balansida mablag‘ yetarli emas.',voice_scope_missing:'Voicelab kalitiga STT ruxsati berilmagan.',voice_provider_busy:'Voicelab band. Birozdan keyin qayta tekshiring.',voice_audio_large:'Audio hajmi 4 MB dan oshmasin.',voice_audio_too_long:'Audio 120 soniyadan oshmasin.',voice_audio_too_short:'Kamida yarim soniya yozing.',voice_no_speech:'Nutq topilmadi. Mikrofonga yaqinroq gapiring.',voice_invalid_audio:'Audio formati mos kelmadi. WAV, MP3 yoki M4A tanlang.',voice_audio_decode_failed:'Audio faylni o‘qib bo‘lmadi.',voice_busy:'Ovoz xizmati band. Birozdan keyin urinib ko‘ring.',voice_already_processing:'Oldingi ovoz hali qayta ishlanmoqda.',voice_rate_limited:'Bir necha daqiqadan keyin yana urinib ko‘ring.',voice_processing_timeout:'Ovoz hali tayyor emas. Shu natijani qayta tekshiring.',voice_job_missing:'Bog‘lanish uzilgan. Shu yozuvni qayta tekshiring.',voice_transcript_too_long:'Matn juda uzun. Qisqaroq yozuv yuboring.'};
 const svg=path=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
 const sendIcon=svg('<path d="M12 20V4m-7 7 7-7 7 7"/>');
 const chatIcon=svg('<path d="M20 11a8 8 0 0 1-8 8H5l2-3a8 8 0 1 1 13-5Z"/><path d="M9 11h6"/>');
 const compact=document.createElement('section');
 compact.className='qv-compact';compact.hidden=true;compact.setAttribute('aria-label','Qabul yordamchisi');
 compact.innerHTML='<div class="qv-compact-row"><button id="qvCompactClose" type="button" aria-label="Bekor qilish">'+svg('<path d="m6 6 12 12M6 18 18 6"/>')+'</button><div id="qvCompactCapture" class="qv-compact-capture"></div><form id="qvCompactChat" hidden><input id="qvChatText" maxlength="180" aria-label="Davolash bo‘yicha so‘rov" placeholder="Davolash sxemasini tuzing"><button id="qvChatMic" type="button" aria-label="So‘rovni ovoz bilan yozish">'+microphone+'</button><button type="submit" id="qvChatSend" aria-label="So‘rovni yuborish">'+sendIcon+'</button></form></div><p id="qvCompactStatus" role="status" aria-live="polite"></p><details id="qvCompactResult" hidden><summary>Ovoz matni va bo‘limlar</summary></details>';
 document.body.append(compact);
 const chatOpen=document.createElement('button');
 chatOpen.type='button';chatOpen.id='qvChatOpen';chatOpen.hidden=true;chatOpen.title='Davolash bo‘yicha AI yordamchi';
 chatOpen.setAttribute('aria-label',chatOpen.title);chatOpen.innerHTML=chatIcon;
 $('dictationOpen').before(chatOpen);
 const movable=['voiceWave','voiceTimer','voiceStart','voicePause','voiceStop','voiceRetry','voicePreview'].map(id=>{
  const node=$(id),mark=document.createComment(id);node.before(mark);return {id,node,mark};
 });
 const stopIcon=$('voiceStop').innerHTML;
 let compactMode='',owner='',visitId='',snapshot='',routingResult=null;

 function editor(){
  try{
   const bridge=window.UZMEDVisitBridge,record=bridge?.read();
   if(record?.visit?.visit_id&&!record.readOnly&&record.visit.status!=='closed')return {bridge,id:record.visit.visit_id};
  }catch{}
  return null;
 }
 function sameVisit(){return !!owner&&owner===accountId(webAuth())&&visitId===editor()?.id;}
 function toggleCapture(show){
  $('qvCompactCapture').hidden=!show;$('qvCompactChat').hidden=show;
 }
 function closeCompact(){
  if(!compactMode)return;
  const dictation=compactMode==='dictation',trigger=dictation?$('dictationOpen'):chatOpen;
  const restoreFocus=compact.contains(document.activeElement);
  cancel();compactMode='';owner='';visitId='';snapshot='';routingResult=null;
  compact.hidden=true;$('qvCompactResult').hidden=true;$('qvCompactResult').open=false;$('qvChatText').value='';$('qvCompactStatus').textContent='';
  for(const {node,mark}of movable)mark.after(node);
  $('voiceStop').innerHTML=stopIcon;$('voiceStop').setAttribute('aria-label','Yozishni to‘xtatish');
  trigger.setAttribute('aria-expanded','false');if(restoreFocus)trigger.focus();
 }
 function isClinical(){return !!compactMode;}
 async function openCompact(purpose='dictation'){
  if(dialog.open||opening)return;
  if(compactMode){if(compactMode===purpose)$('qvCompactClose').focus();return;}
  const current=editor();
  if(!current){focus.status('Tahrirlanadigan qabulni oching.');return;}
  owner=accountId(webAuth());visitId=current.id;compactMode=purpose;
  snapshot=current.bridge.treatmentKey?.()||'';
  for(const {id,node} of movable)(id==='voicePreview'?$('qvCompactResult'):$('qvCompactCapture')).append(node);
  $('voiceStop').innerHTML=sendIcon;$('voiceStop').setAttribute('aria-label','Ovozni yuborish');
  toggleCapture(purpose==='dictation');compact.hidden=false;
  (purpose==='dictation'?$('dictationOpen'):chatOpen).setAttribute('aria-expanded','true');
  const gen=++generation;
  state('preparing');say('Kirish huquqi tekshirilmoqda…');
  opening=true;
  try{
   const access=await api('status');
   if(gen!==generation)return;
   if(!sameVisit())throw Error('voice_session_expired');
   if(!access.allowed)throw Error(access.error||'voice_auth_unavailable');
   if(!access.configured)throw Error('voice_key_missing');
   state('idle');
   if(purpose==='dictation')await start();
   else{
    say('Joriy qabul uchun manbali davolash qoralamasi.');
    $('qvChatText').focus();
   }
  }catch(e){
   if(gen!==generation)return;
   closeCompact();
   if(e.message==='voice_pro_only'){if(!pro.open)pro.showModal();}
   else focus.status(clinicalMessages[e.message]||messages[e.message]||'Ovoz xizmati hozir mavjud emas.');
  }finally{opening=false;}
 }
 function completeCompact(value){
  if(!sameVisit()){closeCompact();return;}
  if(compactMode==='treatment'){
   $('qvChatText').value=value.text.slice(0,180);
   state('idle');toggleCapture(false);
   say(value.text.length>180?'So‘rov uzun. Matnni tekshirib, qisqartiring.':'So‘rovni tekshirib yuboring.');
   $('qvChatText').focus();return;
  }
  const current=editor(),unchanged=snapshot===current.bridge.treatmentKey?.();
  $('voiceTranscript').value=value.text;
  $('voicePreview').hidden=false;$('qvCompactResult').hidden=false;$('qvCompactResult').open=true;state('preview');
  const catalog=[...document.querySelectorAll('#testPresets [data-test-name]')].map(x=>x.dataset.testName);
  const simplified=x=>x.toLocaleLowerCase('uz').replace(/[‘’ʻʼ`]/g,"'").replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const sections=(Array.isArray(value.sections)?value.sections:[]).flatMap(row=>{
   const field=routing.fields.find(x=>x.key===row.key);
   if(!field||typeof row.text!=='string'||!row.text.trim())return [];
   let text=row.text;
   if(field.key==='tests'){
    text=text.split('\n').map(line=>{
     const name=simplified(line).replace(/ (?:qilinsin|olinsin|buyurildi|rejalashtirildi|kerak|tayinlansin)$/,'');
     const exact=catalog.find(x=>simplified(x)===name);
     if(exact)return exact;
     return line;
    }).join('\n');
   }
   return [{...field,text}];
  });
  const conflicting=sections.filter(x=>x.key==='diagnosis'&&$(x.id)?.value.trim()&&!$(x.id).value.includes(x.text));
  const safe=sections.filter(x=>!conflicting.includes(x));
  routingResult={sections:safe,unassigned:[]};
  renderMap({sections,unassigned:[]});
  $('voiceApply').hidden=!safe.length;$('voiceApply').textContent='Ajratilgan matnni qo‘shish';
  if(value.routing_error||!sections.length){say('Matn tayyor. Bo‘limlar aniqlanmadi. To‘liq matnni tekshiring.');return;}
  if(!unchanged){say('Qabul yozuvlari o‘zgardi. Bo‘limlarni tekshirib qo‘shing.');return;}
  commitCompact();
  if(conflicting.length&&applied)say('Bo‘limlar to‘ldirildi. Yangi tashxisni ko‘rib chiqing, mavjud tashxis saqlandi.');
 }
 function commitCompact(){
  if(applied||!routingResult?.sections.length||!sameVisit())return;
  const sections=routingResult.sections.flatMap(section=>{
   const field=$(section.id),existing=new Set(field?.value.split('\n').map(x=>x.trim())||[]);
   if(section.key==='diagnosis'&&field?.value.trim())return [];
   const text=[...new Set(section.text.split('\n').map(x=>x.trim()))].filter(line=>line&&!existing.has(line)).join('\n');
   return text?[{...section,text}]:[];
  });
  if(!sections.length){say('Ushbu yozuvlar qabulda bor.');return;}
  const added=routing.append(sections,$);
  if(!added.ok){say(added.label+' maydoniga qo‘shib bo‘lmadi. To‘liq matnni tekshiring.');return;}
  applied=true;remember(added.writes);$('qvCompactResult').open=false;
  $('voiceApply').hidden=true;$('voiceTranscript').readOnly=true;
  say('Qoralamaga qo‘shildi. Ko‘rib chiqib, qabulni saqlang.');
 }
 const clinicalMessages={
  voice_key_missing:'OpenRouter kaliti serverda sozlanmagan.',
  voice_key_invalid:'OpenRouter kaliti qabul qilinmadi.',
  voice_credits_empty:'OpenRouter balansida mablag‘ yetarli emas.',
  voice_openrouter_unavailable:'Scribe v2 Medical hozir javob bermadi. Keyinroq yangi yozuv yuboring.',
  voice_provider_busy:'Ovoz xizmati band. Birozdan keyin urinib ko‘ring.'
 };
 $('qvCompactClose').onclick=closeCompact;
 compact.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeCompact();}});
 $('qvChatMic').onclick=()=>{if(mode!=='idle'||!sameVisit())return;toggleCapture(true);void start();};
 $('qvCompactChat').onsubmit=async e=>{
  e.preventDefault();
  const input=$('qvChatText'),value=input.value.trim();
  if(!value||mode!=='idle'||!sameVisit())return;
  const gen=++generation;
  state('processing');say('Davolash sxemasi tekshirilmoqda…');
  try{
   const result=await window.QabulTreatmentChat.request(value);
   if(gen!==generation)return;
   if(!sameVisit()){closeCompact();return;}
   state('idle');say(result);
  }catch(e){if(gen!==generation)return;state('idle');say(e.message||'Davolash qoralamasi tayyorlanmadi.');}
 };
 chatOpen.onclick=()=>void openCompact('treatment');
 window.addEventListener('qabul:session-ready',()=>{chatOpen.hidden=!editor();});
 window.addEventListener('qabul:clinical-locked',()=>{chatOpen.hidden=true;closeCompact();});

 function say(s){$(isClinical()?'qvCompactStatus':'voiceStatus').textContent=s;}
 function webAuth(){try{if(window.parent!==window&&window.parent.location.origin===location.origin)return window.parent.UZMEDAuth;}catch{}return window.UZMEDAuth;}
 function accountId(auth){const state=auth?.getState?.();return state?.loggedIn?String(state.user?.id||''):'';}
 async function headers(premium){
  const token=premium?'':voiceToken||launchToken;if(token)return {Authorization:'QabulVoice '+token};
  const auth=webAuth(),owner=accountId(auth);if(!owner||typeof auth?.getAccessToken!=='function')throw Error('voice_login_required');
  let fresh;try{fresh=await auth.getAccessToken();}catch{throw Error('voice_auth_unavailable');}
  if(owner!==accountId(auth))throw Error('voice_session_expired');
  if(!fresh)throw Error('voice_login_required');return {Authorization:'Bearer '+fresh};
 }
 async function api(route,body,retry=true){
  const premium=isClinical(),gen=generation;
  const authHeaders=await headers(premium);
  if(gen!==generation||premium&&!sameVisit())throw Error('voice_session_expired');
  const r=await fetch('/api/qabul-voice/'+route+(premium?'?clinical=1':''),{method:body?'POST':'GET',headers:{...authHeaders,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(25000)});
  let value;try{value=await r.json();}catch{throw Error('voice_service_unavailable');}
  if(!premium&&retry&&gen===generation&&['voice_login_required','voice_session_expired'].includes(value.error)&&(voiceToken||launchToken)&&accountId(webAuth())){voiceToken='';launchToken='';return api(route,body,false);}
  if(!r.ok||value.ok===false)throw Error(value.error||'voice_service_unavailable');return value;
 }
 function state(value){mode=value;dialog.dataset.mode=compact.dataset.mode=value;const chatBusy=value!=='idle';$('qvChatText').disabled=$('qvChatMic').disabled=$('qvChatSend').disabled=chatBusy;if(value==='idle')$('voiceCaption').textContent='';if(value==='paused')$('voiceCaption').textContent='Pauza · davom ettirish mumkin';if(value==='preview')$('voiceCaption').textContent='Matn tayyor';const capturing=['recording','paused'].includes(value),busy=value==='processing',locked=capturing||busy||value==='preview';$('voiceStart').hidden=capturing||isClinical()&&['preparing','processing','preview'].includes(value);$('voiceStart').disabled=busy||value==='preview';$('voiceStop').hidden=!capturing;$('voicePause').hidden=!capturing;$('voicePause').innerHTML=isClinical()?svg(value==='paused'?'<path d="m8 5 12 7-12 7z"/>':'<path d="M9 5v14m6-14v14"/>'):value==='paused'?'▶':'Ⅱ';$('voicePause').setAttribute('aria-label',value==='paused'?'Davom ettirish':'Pauza');$('voiceTarget').disabled=locked;$('voiceLang').disabled=locked;for(const id of ['voiceMicTab','voiceFileTab','voiceChoose'])$(id).disabled=locked;$('voiceProgress').hidden=!busy;window.dispatchEvent(new CustomEvent('qabul:voice-state',{detail:{active:capturing||busy}}));}
 function cleanup(){clearInterval(timer);timer=0;cancelAnimationFrame(animation);animation=0;stream?.getTracks().forEach(t=>t.stop());stream=null;if(context){context.close().catch(()=>{});context=null;}for(const bar of $('voiceWave').children)bar.style.height='4px';}
 function cancel(){applied=false;generation++;$('voiceMap').replaceChildren();$('voiceRemainder').hidden=true;$('voiceTranscript').readOnly=false;$('voiceUndo').hidden=!lastWrites.length;$('voiceApply').hidden=false;$('voiceApply').textContent=selected==='auto'?'Bo‘limlarga ajratib qo‘shish':'Maydonga qo‘shish';$('voiceDiscard').textContent='Bekor qilish';if(recorder&&recorder.state!=='inactive'){recorder.onstop=null;try{recorder.stop();}catch{}}recorder=null;cleanup();request=null;$('voiceTranscript').value='';$('voicePreview').hidden=true;$('voiceRetry').hidden=true;elapsed=0;$('voiceTimer').textContent='00:00';state('idle');}
 function close(){if(!applied&&(mode!=='idle'||$('voiceTranscript').value)&&!confirm('Ovoz yozuvi va tayyor matnni bekor qilasizmi?'))return;dialog.close();}
 dialog.querySelector('.qf-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('close',cancel);dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){e.stopImmediatePropagation();close();}},true);
 async function open(){if(opening||compactMode)return;if(dialog.open)return;opening=true;const gen=++generation;try{const status=await api('status');if(gen!==generation)return;if(!status.allowed){if(status.error==='voice_pro_only'){if(!pro.open)pro.showModal();}else focus.status(messages[status.error]||'Ovoz uchun kirish huquqini tekshirib bo‘lmadi. Qayta urinib ko‘ring.');return;}if(!status.configured){focus.status('Voicelab kaliti serverda sozlanmagan.');return;}if(!voiceToken&&!launchToken){const session=await api('session',{});voiceToken=session.session_token;}
 if(gen!==generation)return;dialog.showModal();say(lastWrites.length?'Oxirgi ovoz matni bo‘limlarga qo‘shilgan. Tekshiring yoki yangi yozuvni boshlang.':$('voiceTarget').value==='auto'?'Bo‘lim nomlarini aytib yozing. Matn avtomatik ajratiladi.':'Matn tanlangan bitta maydonga tasdiqlagandan keyin qo‘shiladi.');}catch(e){if(gen!==generation)return;if(e.message==='voice_pro_only'){if(!pro.open)pro.showModal();}else focus.status(messages[e.message]||'Ovoz xizmati bilan bog‘lanib bo‘lmadi. Qayta urinib ko‘ring.');}finally{opening=false;}}
 function wave(s){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=new Audio();const analyser=context.createAnalyser();analyser.fftSize=128;context.createMediaStreamSource(s).connect(analyser);context.resume().catch(()=>{});const data=new Uint8Array(analyser.frequencyBinCount),bars=[...$('voiceWave').children];const draw=()=>{if(!context)return;analyser.getByteFrequencyData(data);bars.forEach((b,i)=>b.style.height=(mode==='paused'?4:Math.max(4,data[Math.floor(i*data.length/bars.length)]/255*40))+'px');animation=requestAnimationFrame(draw);};draw();}catch{}}
 function tick(){if(mode==='paused')return;elapsed=performance.now()-started-pausedMs;const sec=Math.floor(elapsed/1000);$('voiceTimer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');if(elapsed>=(isClinical()?118000:120000)||performance.now()-started>240000){if(isClinical()){if(mode==='recording')pause();}else stop();}}
 async function start(){if(mode!=='idle')return;
 const accessGeneration=generation;
 state('preparing');
 try{
  const access=await api('status');
  if(accessGeneration!==generation)return;
  if(!access.allowed)throw Error(access.error||'voice_auth_unavailable');
  if(!access.configured)throw Error('voice_key_missing');
 }catch(e){
  if(accessGeneration!==generation)return;
  if(isClinical())closeCompact();else state('idle');
  if(e.message==='voice_pro_only'){if(!pro.open)pro.showModal();}
  else focus.status(messages[e.message]||'Ovoz uchun kirish huquqi tasdiqlanmadi.');
  return;
 }
 state('idle');if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){say('Mikrofon bu oynada ishlamayapti. Safari yoki Chrome’da oching.');return;}const gen=++generation;state('preparing');$('voiceStart').disabled=true;say('Mikrofonga ruxsat bering…');
 try{const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(gen!==generation){s.getTracks().forEach(t=>t.stop());return;}stream=s;let mime='';for(const m of ['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'])if(MediaRecorder.isTypeSupported(m)){mime=m;break;}recorder=new MediaRecorder(s,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:64000});let parts=[],size=0;selected=isClinical()?'auto':$('voiceTarget').value;
 recorder.ondataavailable=e=>{if(gen!==generation||!e.data?.size)return;size+=e.data.size;if(size>4_000_000){cancel();say('Audio hajmi oshib ketdi. Qisqaroq yozing.');return;}parts.push(e.data);};recorder.onerror=()=>{cancel();say('Ovozni yozib bo‘lmadi. Audio fayldan foydalaning.');};recorder.onstop=()=>{if(gen!==generation)return;const blob=new Blob(parts,{type:recorder.mimeType||mime});parts=[];recorder=null;cleanup();void upload(blob,gen);};recorder.start(500);started=performance.now();pausedMs=0;pausedAt=0;elapsed=0;state('recording');$('voiceCaption').textContent='Yozilmoqda · to‘xtatish uchun kvadratni bosing';say(isClinical()?'Yuborilganda ovoz OpenRouter’ga uzatiladi. Ism va aloqa ma’lumotlarini aytmang.':'Mikrofon yoqilgan.');wave(s);timer=setInterval(tick,250);
 }catch(e){if(gen!==generation)return;cleanup();state('idle');say(e.name==='NotAllowedError'?'Mikrofonga ruxsat berilmadi. Telegram sozlamalarini tekshiring yoki audio fayl tanlang.':'Mikrofonni ochib bo‘lmadi. Audio fayldan foydalaning.');}}
 function stop(){if(!recorder||recorder.state==='inactive')return;if(isClinical()&&!sameVisit()){closeCompact();return;}state('processing');$('voiceCaption').textContent='Ovoz matnga aylantirilmoqda…';recorder.stop();}
 function pause(){if(!recorder)return;if(isClinical()&&recorder.state==='paused'&&(elapsed>=118000||performance.now()-started>240000)){say('Yozuv 2 daqiqaga yetdi. Yuboring yoki bekor qiling.');return;}if(recorder.state==='recording'&&typeof recorder.pause==='function'){recorder.pause();pausedAt=performance.now();state('paused');say('Pauza. Davom ettirish yoki to‘xtatishni tanlang.');}else if(recorder.state==='paused'){recorder.resume();pausedMs+=performance.now()-pausedAt;pausedAt=0;state('recording');say('Mikrofon yoqilgan.');}}
 async function base64(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);}
 async function poll(id,gen){const until=Date.now()+300000;while(gen===generation&&Date.now()<until){const v=await api('jobs/'+id);if(gen!==generation)return;if(v.status==='completed'){if(isClinical()){request=null;$('voiceRetry').hidden=true;completeCompact(v);return;}$('voiceTranscript').value=v.text;$('voicePreview').hidden=false;$('voiceRetry').hidden=true;request=null;state('preview');if(selected==='auto')distribute();else{applied=false;$('voiceTranscript').readOnly=false;$('voiceApply').hidden=false;$('voiceApply').textContent='Maydonga qo‘shish';say('Matn tayyor. Tekshirib, tanlangan maydonga qo‘shing.');}return;}if(v.status==='failed'){if(isClinical())request=null;throw Error(v.error||'voice_processing_failed');}await new Promise(r=>setTimeout(r,1200));}if(gen===generation)throw Error('voice_processing_timeout');}
 async function upload(blob,gen){if(gen!==generation)return;state('processing');say(isClinical()?'Scribe v2 Medical ovozni matnga aylantirmoqda…':'Ovoz Voicelab’ga yuborilmoqda…');try{if(blob.size<250||blob.size>4_000_000)throw Error(blob.size>4_000_000?'voice_audio_large':'voice_audio_too_short');const mime=blob.type.split(';')[0]||'audio/mp4',purpose=compactMode;const payload={request_id:crypto.randomUUID(),audio_base64:await base64(blob),mime,language:purpose?'uz':$('voiceLang').value,...(purpose?{purpose}:{})};if(gen!==generation)return;request=payload;const j=await api('jobs',request);if(gen!==generation)return;if(purpose)request={id:j.id};await poll(j.id,gen);}catch(e){if(gen!==generation)return;if(isClinical()&&!sameVisit()){closeCompact();return;}state('idle');$('voiceRetry').hidden=!request;say((isClinical()&&clinicalMessages[e.message])||messages[e.message]||'Bog‘lanish uzildi. Shu yozuv natijasini qayta tekshirishingiz mumkin.');}}
 async function retry(){if(!request||mode==='processing')return;const gen=generation;state('processing');$('voiceRetry').hidden=true;say('Shu yozuv natijasi qayta tekshirilmoqda…');try{const j=request.id?request:await api('jobs',request);if(isClinical())request={id:j.id};await poll(j.id,gen);}catch(e){if(gen!==generation)return;state('idle');$('voiceRetry').hidden=false;say(messages[e.message]||'Natija olinmadi. Keyinroq qayta tekshiring.');}}
 function renderMap(result){
  $('voiceMap').replaceChildren();
  for(const section of result.sections){const card=document.createElement('div');card.className='qv-map-item';const title=document.createElement('strong'),text=document.createElement('p');title.textContent=section.label;text.textContent=section.text;card.append(title,text);$('voiceMap').append(card);}
  $('voiceRemainder').hidden=!result.unassigned.length;$('voiceRemainder').textContent=result.unassigned.length?'Bo‘limga kiritilmagan matn (quyidagi to‘liq matnda): '+result.unassigned.join('\n')+'. Qo‘shish bajarilgan bo‘lsa avval Qaytarish tugmasini bosing, so‘ng to‘liq matndagi bo‘lim nomlarini tahrirlab qayta ajrating.':'';
 }
 function remember(writes){lastWrites=writes;receipt.hidden=false;receiptText.textContent='Ovoz matni qo‘shildi: '+writes.map(w=>w.label).join(', ')+'. Tekshiring.';$('voiceUndo').hidden=false;}
 function distribute(confirmed=false){
  if(applied)return;const result=routing.split($('voiceTranscript').value);renderMap(result);
  if(!result.sections.length){$('voiceApply').textContent='Matnni qayta ajratish';say('Bo‘lim ishonchli aniqlanmadi. Matnni tekshirib, bo‘lim nomlarini qo‘shing. Mavjud maydonlar o‘zgartirilmadi.');return;}
  if(result.unassigned.length&&!confirmed){$('voiceApply').hidden=false;$('voiceApply').textContent='Aniqlangan bo‘limlargagina qo‘shish';say('Matnning bir qismi aniq bo‘limga ajratilmadi. Hech narsa yozilmadi. To‘liq matnni tekshiring yoki faqat aniqlangan bo‘limlarga qo‘shishni tasdiqlang.');return;}
  const committed=routing.append(result.sections,$);
  if(!committed.ok){say(committed.label+(committed.error==='overflow'?' maydon chegarasidan oshdi. Hech bir maydon o‘zgarmadi; to‘liq matn quyida saqlandi.':' maydoni topilmadi. Hech bir maydon o‘zgarmadi.'));return;}
  remember(committed.writes);applied=true;$('voiceTranscript').readOnly=true;$('voiceApply').hidden=true;$('voiceDiscard').textContent='Bo‘limlarni ko‘rish';
  const names=committed.writes.map(w=>w.label).join(', ');say((confirmed?'Tasdiqlab qo‘shildi: ':'Avtomatik qo‘shildi: ')+names+'. '+(result.unassigned.length?'Ajratilmagan matnni ham tekshiring. ':'')+'Matnni tekshiring.');focus.status('Ovozdan '+committed.writes.length+' ta bo‘lim to‘ldirildi. Matnni tekshiring.');
 }
 function undo(){
  if(isClinical()&&!sameVisit())return;
  if(!routing.undo(lastWrites,$)){say('Maydon keyinroq tahrirlangan. Keyingi yozuvni saqlash uchun avtomatik qaytarilmadi.');focus.status('Ovozdan keyin matn tahrirlangan. Qaytarish uchun maydonni qo‘lda tekshiring.');return;}
  lastWrites=[];receipt.hidden=true;$('voiceUndo').hidden=true;applied=false;$('voiceTranscript').readOnly=false;$('voiceApply').hidden=false;$('voiceApply').textContent='Bo‘limlarga ajratib qo‘shish';$('voiceDiscard').textContent='Bekor qilish';if(isClinical())$('voiceApply').hidden=!routingResult?.sections.length;say('Faqat oxirgi ovozdan qo‘shilgan matn qaytarildi. Avvalgi yozuvlar saqlandi.');focus.status('Oxirgi ovoz matni qaytarildi.');
 }
 function apply(){
  if(isClinical())return commitCompact();
  if(selected==='auto')return distribute(true);const text=$('voiceTranscript').value.trim();if(!text)return say('Matn bo‘sh.');
  const field=routing.fields.find(f=>f.key===selected);if(!field)return say('Tanlangan maydon topilmadi.');const committed=routing.append([{...field,text}],$);
  if(!committed.ok)return say('Matn maydon chegarasidan oshdi. Tayyor matnni qisqartiring; mavjud yozuv saqlanadi.');remember(committed.writes);cancel();dialog.close();focus.status(field.label+' maydoniga ovoz matni qo‘shildi.');
 }
 function tab(file){if(mode!=='idle')return;$('voiceMicTab').setAttribute('aria-selected',String(!file));$('voiceFileTab').setAttribute('aria-selected',String(file));$('voiceMicPanel').hidden=file;$('voiceFilePanel').hidden=!file;}
 if($('voiceOpen'))$('voiceOpen').onclick=open;$('dictationOpen').onclick=open;$('voiceStart').onclick=start;$('voiceStop').onclick=stop;$('voicePause').onclick=pause;$('voiceMicTab').onclick=()=>tab(false);$('voiceFileTab').onclick=()=>tab(true);$('voiceChoose').onclick=()=>$('voiceFile').click();$('voiceFile').onchange=()=>{const file=$('voiceFile').files[0];$('voiceFile').value='';if(!file||mode!=='idle')return;selected=$('voiceTarget').value;const types={m4a:'audio/mp4',mp4:'audio/mp4',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',webm:'audio/webm'};const blob=new Blob([file],{type:types[file.name.split('.').pop().toLowerCase()]||file.type||''});void upload(blob,++generation);};$('voiceApply').onclick=apply;$('voiceDiscard').onclick=()=>{if(isClinical()){closeCompact();return;}if(applied){const first=lastWrites[0]?.id;dialog.close();const key=['life','epidemiology','field-medications','field-allergies'].includes(first)?'history':['neuro','localis'].includes(first)?'exam':['comorbid','competing','background','complication','field-diagnosis'].includes(first)?'diagnosis':first==='field-followup'?'advice':first?.replace('field-','');if(key)focus.show(key);if(['life','epidemiology','field-history'].includes(first))document.querySelector('[data-history="'+(first==='field-history'?'history':first)+'"]')?.click();return;}cancel();say('Ovoz yozuvi bekor qilindi.');};$('voiceUndo').onclick=undo;receiptUndo.onclick=undo;$('voiceRetry').onclick=retry;
 $('clear').addEventListener('click',()=>{if($('status').textContent==='Qoralama tozalandi. Ma’lumot serverda saqlanmagan.'){lastWrites=[];receipt.hidden=true;cancel();}});
 window.addEventListener('pagehide',()=>isClinical()?closeCompact():cancel());window.addEventListener('beforeunload',e=>{if(mode!=='idle'||request){e.preventDefault();e.returnValue='';}});
 window.QabulVoice={open,openCompact,stop,cancel:()=>isClinical()?closeCompact():cancel(),state:()=>mode};state('idle');
})();
