/* UZMED ADMIN Mini App - hands-free conversation, turn-taking VAD. */
(function(){
'use strict';
const tg=window.Telegram&&window.Telegram.WebApp, initData=tg&&tg.initData;
const el=id=>document.getElementById(id);
const manual=el('record'),liveButton=el('live'),feed=el('feed'),orb=el('orb'),connection=el('connection'),status=el('status');
const form=el('form'),submit=el('submit'),question=el('question'),speak=el('speak');
const AC=window.AudioContext||window.webkitAudioContext;
const orbFX=window.UZMEDVoiceOrb||{setMode(){},setAnalyser(){}};
const voiceState=el('voice-state'),heroLabel=el('hero-label');
function visual(mode,title){
 orbFX.setMode(mode);
 const names={idle:'TAYYOR',listening:'TINGLAYAPMAN',speaking:'GAPIRYAPMAN',thinking:'KUTILMOQDA',error:'XATO'};
 // Brand stays fixed in the orb. Current activity is shown under the sphere.
 voiceState.textContent='UZMED';
 heroLabel.textContent=title||({idle:'Suhbatni boshlash uchun tugmani bosing',
 listening:'Gapiring, UZMED tinglayapti',speaking:'UZMED ovozli javob qaytarmoqda',thinking:'UZMED javob tayyorlamoqda',error:'Ulanishni tekshiring'}[mode]);
}
const incoming=new URLSearchParams(window.location.search).get('incoming')==='1';
const minSpeechMs=650, silenceMs=1200, noSpeechMs=45000, maxUtteranceMs=25000;
let busy=false,live=false,session=0,rec=null,stream=null,context=null,analyser=null;
let sttReady=false,ttsReady=false;
let raf=0,startTime=0,lastVoice=0,speechSince=0,heardSpeech=false,noise=0.008;
let ignoreRecording=false,chunks=[],manualTimeout=0,player=null,voiceSource=null;

if(tg){tg.ready();tg.expand();}
function info(s){status.textContent=s;}
function setButtonStates(){
 manual.disabled=busy||live||!sttReady||connection.textContent!=='Himoyalangan';
 liveButton.disabled=!sttReady||!ttsReady||connection.textContent!=='Himoyalangan';
 liveButton.textContent=live?'⏹ Suhbatni yakunlash':(incoming?'🎙 Gapirishni boshlash':'🎙 Jonli suhbatni boshlash');
 liveButton.classList.toggle('running',live);
 manual.textContent=rec?.state==='recording'&&!live?'To‘xtatish va yuborish':'Mikrofonni yoqish';
 orb.classList.toggle('recording',rec?.state==='recording');
 orb.classList.toggle('live',live);
}
function line(who,value){
 const p=document.createElement('div');p.className='line';
 const b=document.createElement('b');b.textContent=who+' ';
 p.append(b,document.createTextNode(value));
 if(feed.children.length>8)feed.firstChild.remove();
 feed.append(p);
}
async function api(route,body){
 if(!initData)throw Error('Telegramdagi 📞 Jonli suhbat tugmasidan qayta oching.');
 const r=await fetch('/api/admin-voice/'+route,{method:'POST',headers:{
  'Content-Type':'application/json','X-Telegram-Init-Data':initData
 },body:JSON.stringify(body||{}),cache:'no-store'});
 const data=await r.json();
 if(!r.ok){
  if(r.status===401)throw Error('Telegram sessiyasi eskirgan. Ilovani yoping va 📞 Jonli suhbat tugmasidan qayta oching.');
  if(r.status===429)throw Error('So‘rov juda tez yuborildi. Biroz kuting.');
  const errors={
   voicelab_stt_scope_missing:'VoiceLab API kalitida Speech-to-Text ruxsati yo‘q. VoiceLab sozlamalaridan STT Accessni yoqing.',
   voicelab_stt_insufficient_credits:'VoiceLab STT uchun kredit yetarli emas.',
   voicelab_stt_key_missing:'VoiceLab STT API kaliti topilmadi.',
   voicelab_stt_pending_timeout:'VoiceLab ovozni hali qayta ishlayapti. Keyinroq qayta urinib ko‘ring.',
   voicelab_stt_no_speech:'Ovoz tushunarsiz yoki juda qisqa. Qayta gapiring.',
   tts_failed:'VoiceLab ovoz yaratishda xatolik bo‘ldi.',
   tts_unavailable:'VoiceLab TTS hozir tayyor emas.',
   invalid_or_expired_ticket:'Ovoz sessiyasi eskirdi. Suhbatni qaytadan boshlang.'
  };
  throw Error(errors[data.code]||data.code||data.error||'Server xatosi');
 }
 return data;
}
function chooseMime(){
 const allowed=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg'];
 return allowed.find(t=>window.MediaRecorder?.isTypeSupported(t))||'';
}
async function audioBytes(blob){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');
  reader.onerror=()=>reject(Error('Ovozni o‘qib bo‘lmadi'));
  reader.readAsDataURL(blob);
 });
}
async function playAudio(encoded,mime,autoplay){
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 // When AudioContext is unlocked, use the actual TTS samples to drive the sphere.
 if(context&&context.state==='running'){
  const decoded=await context.decodeAudioData(bytes.buffer.slice(0));
  await new Promise((resolve,reject)=>{
   const source=context.createBufferSource();
   const output=context.createAnalyser();output.fftSize=256;output.smoothingTimeConstant=.68;
   source.buffer=decoded;source.connect(output);output.connect(context.destination);
   voiceSource=source;
   orbFX.setAnalyser(output,'speaking');visual('speaking');
   let done=false;
   const finish=()=>{
    if(done)return;done=true;voiceSource=null;
    try{source.disconnect();output.disconnect();}catch{}
    orbFX.setAnalyser(null);visual(live?'thinking':'idle');
    resolve();
   };
   source.onended=finish;
   try{source.start(0);}catch(e){finish();reject(e);}
  });
  return;
 }
 // iOS may not allow a newly-created AudioContext here; retain safe audio fallback.
 const url=URL.createObjectURL(new Blob([bytes],{type:mime||'audio/wav'}));
 try{
  player=new Audio(url);player.playsInline=true;
  await player.play();visual('speaking');
  await new Promise((resolve,reject)=>{
   player.onended=resolve;
   player.onerror=()=>reject(Error('Audio ijro xatosi'));
  });
 }finally{player?.pause();player=null;URL.revokeObjectURL(url);visual(live?'thinking':'idle');}
}
async function send(data,{autoplay=false}={}){
 if(busy)return;
 busy=true;setButtonStates();
 if(live&&stream)for(const track of stream.getAudioTracks())track.enabled=false;
 visual('thinking');info('Savol tekshirilmoqda...');
 let repeat=false;
 try{
  const answer=await api('turn',{...data,defer_voice:true});
  line('Siz:',answer.heard||'');
  line('UZMED:',answer.answer||'');
  if(autoplay&&!live)return; // Stop button takes precedence over a delayed response.
  if(answer.voice_ticket){
   info('Javob tayyor. Ovoz tayyorlanmoqda...');
   try{
    const voice=await api('speak',{ticket:answer.voice_ticket});
    if(autoplay&&!live)return;
    if(voice.audio_base64){
     info('UZMED gapiryapti...');
     await playAudio(voice.audio_base64,voice.audio_mime,autoplay);
     repeat=true;
    }else info('Matn tayyor, ovoz qaytmadi.');
   }catch(e){info('Matn tayyor. Ovoz: '+e.message);}
  }else if(answer.audio_base64){
   info('UZMED javob beryapti...');
   try{await playAudio(answer.audio_base64,answer.audio_mime,autoplay);repeat=true;}
   catch(e){info('Ovoz ijrosi cheklangan. Suhbatni qayta boshlashga bosing.');}
  }else if(answer.voice_error){
   info('Matn tayyor. VoiceLab ovozi hozir mavjud emas.');
  }else if(answer.voice_skipped){
   info('Matn tayyor. Ovoz sintezidan kredit tejandi.');
  }else info('Ovozli javob olinmadi.');
 }catch(e){visual('error');info('Xato: '+e.message);}
 finally{
  busy=false;
  if(live&&autoplay&&repeat&&document.visibilityState==='visible'){
   // Leave a short echo guard before the next turn.
   await new Promise(resolve=>setTimeout(resolve,240));
   if(live){startRecorder(true).catch(e=>stopLive('Mikrofon: '+e.message));}
  }else if(live&&autoplay){
   stopLive('Suhbat to‘xtadi. Davom ettirish uchun yana boshlang.');
  }else if(!live&&orbFX.getMode?.()!=='error')visual('idle');
  setButtonStates();
 }
}
async function ensureMicrophone(){
 if(stream&&stream.getTracks().some(t=>t.readyState==='live'))return stream;
 if(!navigator.mediaDevices?.getUserMedia)throw Error('Bu qurilmada mikrofon API ishlamaydi.');
 stream=await navigator.mediaDevices.getUserMedia({audio:{
  echoCancellation:true,noiseSuppression:true,autoGainControl:true
 }});
 return stream;
}
function clearWatch(){
 if(raf){cancelAnimationFrame(raf);raf=0;}
 if(manualTimeout){clearTimeout(manualTimeout);manualTimeout=0;}
}
function stopTracks(){
 if(stream){for(const track of stream.getTracks())track.stop();stream=null;}
}
function stopLive(message){
 const wasLive=live;
 live=false;session++;
 clearWatch();
 if(rec&&rec.state==='recording'){ignoreRecording=true;rec.stop();}
 if(player){player.pause();player=null;}
 if(voiceSource){try{voiceSource.stop()}catch{}voiceSource=null;}
 orbFX.setAnalyser(null);visual('idle');
 stopTracks();
 if(context){const old=context;context=null;analyser=null;old.close().catch(()=>{});}
 setButtonStates();
 if(wasLive&&message)info(message);
}
function startVad(recordId){
 if(!analyser||!context)throw Error('Ovoz faolligini aniqlash ishlamadi.');
 const buffer=new Float32Array(analyser.fftSize);
 const check=()=>{
  if(!live||!rec||rec.state!=='recording'||session!==recordId)return;
  if(document.visibilityState==='hidden'){stopLive('Ilova yashirildi — mikrofon yopildi.');return;}
  analyser.getFloatTimeDomainData(buffer);
  let sum=0;
  for(let i=0;i<buffer.length;i++)sum+=buffer[i]*buffer[i];
  const rms=Math.sqrt(sum/buffer.length),now=performance.now();
  const age=now-startTime;
  // Do not calibrate speech as background noise when a person starts speaking
  // immediately after pressing Call. Calibrate only quiet opening frames.
  if(age<380&&rms<0.025){
   noise=Math.max(0.006,Math.min(0.025,noise*0.84+rms*0.16));
   raf=requestAnimationFrame(check);
   return;
  }
  const threshold=Math.max(0.014,Math.min(0.10,noise*2.8));
  const active=rms>threshold;
  if(!active)noise=Math.max(0.003,Math.min(0.040,noise*0.992+rms*0.008));
  if(active){
   if(!speechSince)speechSince=now;
   if(now-speechSince>180){heardSpeech=true;lastVoice=now;}
  }else speechSince=0;
  if(heardSpeech&&now-lastVoice>silenceMs&&now-startTime>=minSpeechMs){finishRecorder(false);return;}
  if(age>maxUtteranceMs&&heardSpeech){finishRecorder(false);return;}
  if(age>noSpeechMs&&!heardSpeech){stopLive('Uzoq sukut sabab suhbat to‘xtadi — kredit sarflanmadi.');return;}
  raf=requestAnimationFrame(check);
 };
 raf=requestAnimationFrame(check);
}
async function startRecorder(automatic=false){
 if(busy)return;
 await ensureMicrophone();
 if(automatic&&(!live||document.visibilityState!=='visible'))return;
 if(!window.MediaRecorder)throw Error('Bu qurilmada ovoz yozish qo‘llanmaydi.');
 if(rec?.state==='recording')return;
 const mime=chooseMime();
 if(automatic&&context){
  if(context.state==='suspended')await context.resume();
  if(context.state!=='running')throw Error('iPhone ovoz mexanizmi to‘xtagan.');
 }
 for(const track of stream.getAudioTracks())track.enabled=true;
 const r=new MediaRecorder(stream,mime?{mimeType:mime}:{});
 rec=r;chunks=[];ignoreRecording=false;startTime=performance.now();speechSince=0;
 heardSpeech=false;lastVoice=0;noise=0.008;
 const id=session;
 r.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};
 r.onstop=async()=>{
  clearWatch();
  const discarded=ignoreRecording||id!==session;
  const blob=new Blob(chunks,{type:r.mimeType||'audio/webm'});
  if(!live)stopTracks();
  if(rec===r)rec=null;setButtonStates();
  if(discarded||blob.size<250)return;
  if(blob.size>4000000){info('Yozuv hajmi katta. Qisqaroq gapiring.');if(live)stopLive();return;}
  try{
   const payload={audio_base64:await audioBytes(blob),mime:blob.type};
   if(id!==session)return;
   await send(payload,{autoplay:automatic});
  }catch(e){info('Ovozni yuborishda xato: '+e.message);if(automatic)stopLive();}
 };
 r.onerror=()=>{if(automatic)stopLive('Mikrofon xatosi. Qayta urinib ko‘ring.');};
 r.start();
 setButtonStates();
 if(automatic){
  orbFX.setAnalyser(analyser,'listening');
  visual('listening');
  info('🎙 Tinglayapman. Gapiring — sukutda avtomatik yuboraman.');
  startVad(id);
 }else{
  visual('listening');
  info('🎙 Yozilmoqda. Tugmani yana bosib yuboring.');
  manualTimeout=setTimeout(()=>finishRecorder(false),maxUtteranceMs);
 }
}
function finishRecorder(discard){
 if(!rec||rec.state!=='recording')return;
 clearWatch();
 ignoreRecording=!!discard;
 orbFX.setAnalyser(null);visual('thinking');
 rec.stop();
 setButtonStates();
}
manual.onclick=async()=>{
 if(live||busy)return;
 if(rec?.state==='recording'){finishRecorder(false);return;}
 try{await startRecorder(false);}catch(e){stopTracks();info('Mikrofon ruxsati: '+e.message);setButtonStates();}
};
liveButton.onclick=async()=>{
 if(live){stopLive('Suhbat yakunlandi.');return;}
 if(busy)return;
 live=true;session++;
 visual('thinking','Mikrofonga ulanmoqda...');
 setButtonStates();
 try{
  if(!AC)throw Error('Qurilmada ovoz aniqlash mavjud emas. Bosib gapirish rejimidan foydalaning.');
  await ensureMicrophone();
  if(!live){stopTracks();return;}
  context=new AC();
  const input=context.createMediaStreamSource(stream);
  analyser=context.createAnalyser();analyser.fftSize=2048;input.connect(analyser);
  await context.resume();
  if(context.state!=='running')throw Error('Ovoz tizimini yoqib bo‘lmadi.');
  // Conversation starts with the administrator's speech. Never auto-ask or play a greeting.
  await startRecorder(true);
 }catch(e){stopLive('Jonli rejim ishlamadi: '+e.message);}
};
form.onsubmit=e=>{
 e.preventDefault();
 const text=question.value.trim();
 if(!text||busy)return;
 question.value='';
 if(live)stopLive();
 send({text,speak:speak.checked});
};
document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'){
  if(live)stopLive('Ilova yashirildi: suhbat to‘xtatildi.');
  else if(rec?.state==='recording'){finishRecorder(true);stopTracks();}
 }
});
window.addEventListener('pagehide',()=>{if(live)stopLive();else{clearWatch();stopTracks();}});
setButtonStates();
api('status',{}).then(s=>{
 connection.textContent='Himoyalangan';
 sttReady=!!s.stt_ready;ttsReady=!!s.tts_ready;
 visual(sttReady&&ttsReady?'idle':'error',
  sttReady&&ttsReady?'Ovozli suhbatga tayyor':'Ovoz xizmatlari tekshirilishi kerak');
 info((incoming?'🎙 Avval siz gapirasiz, UZMED keyin javob beradi. ':'')+
 'VoiceLab STT: '+(s.stt_ready?'tayyor':s.stt_code==='voicelab_stt_scope_missing'?'API kalitiga Speech-to-Text Access ruxsati kerak':s.stt_code==='voicelab_stt_insufficient_credits'?'STT krediti yetarli emas':'hozir ishlamayapti')+
 '. VoiceLab TTS: '+(s.tts_ready?'tayyor':'API kaliti kutilmoqda')+
 '. Ruxsatlarni to‘g‘rilagach shu sahifani qayta oching.');
 setButtonStates();
 // Disabled controls stay disabled until STT Access and TTS are both available.
}).catch(e=>{
 connection.textContent='Ruxsat yo‘q';visual('error');info(e.message);
 manual.disabled=true;liveButton.disabled=true;submit.disabled=true;
});
})();
