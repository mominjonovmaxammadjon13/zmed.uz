/* UZMED Dermatologiya: licensed image discovery inside the existing atlas screen. No patient data or AI diagnosis. */
(function(global){
 'use strict';
 const API='/api/derma/search';
 const TOPICS=[['psoriaz','Psoriaz'],['atopik dermatit','Atopik dermatit'],['akne','Akne'],['vitiligo','Vitiligo'],['urtikariya','Urtikariya'],['qichima','Qichima'],['ekzema','Ekzema'],['melanoma','Melanoma']];
 function apiFind(q){
  // UZMED's old global fetch wrappers may reroute local /api calls to RAG.
  // XMLHttpRequest is used narrowly for the trusted SAME-ORIGIN derma endpoint.
  q=String(q||'').trim().slice(0,140);
  return new Promise((resolve,reject)=>{
   const xhr=new XMLHttpRequest();
   xhr.open('GET',API+'?'+new URLSearchParams({q}).toString(),true);
   xhr.timeout=12000;
   xhr.withCredentials=false;
   xhr.setRequestHeader('Accept','application/json');
   xhr.onreadystatechange=function(){
    if(xhr.readyState!==4)return;
    if(xhr.status!==200){reject(new Error('derma http '+xhr.status));return}
    try{resolve(JSON.parse(xhr.responseText))}catch(_){reject(new Error('derma json invalid'))}
   };
   xhr.onerror=function(){reject(new Error('derma network error'))};
   xhr.ontimeout=function(){reject(new Error('derma timeout'))};
   xhr.send();
  });
 }
 function allowedUrl(url){
  if(typeof url!=='string')return false;
  if(/^\/api\/derma\/image\/[a-z0-9-]{4,40}$/i.test(url))return true;
  try{
   const u=new URL(url);
   return u.protocol==='https:'&&['upload.wikimedia.org','thumb.wikimedia.org'].includes(u.hostname);
  }catch(_){return false}
 }
 function sourceUrl(url){
  try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='commons.wikimedia.org'&&u.pathname.startsWith('/wiki/File:')?u.href:''}
  catch(_){return ''}
 }
 function safeResults(obj){
  return obj&&Array.isArray(obj.images)?obj.images.filter(x=>x&&allowedUrl(x.url)).slice(0,8):[];
 }
 function el(tag,cls,content){
  const n=document.createElement(tag);if(cls)n.className=cls;
  if(content!=null)n.textContent=String(content);
  return n;
 }
 function makeCard(data){
  const card=el('article','uzd-card'),fig=el('div','uzd-picture');
  const pic=document.createElement('img');
  pic.src=data.url;pic.alt='Klinik rasm: '+String(data.title||'teridagi holat').slice(0,140);
  pic.loading='lazy';pic.decoding='async';pic.referrerPolicy='no-referrer';
  pic.onerror=function(){pic.remove();fig.appendChild(el('span','uzd-image-error','Rasm yuklanmadi'));};
  fig.appendChild(pic);
  card.appendChild(fig);
  const content=el('div','uzd-card-content');
  content.appendChild(el('strong','uzd-card-title',data.title||'Dermatologik rasm'));
  const external=data.provider==='Wikimedia Commons';
  content.appendChild(el('span','uzd-source',external?'Wikimedia Commons':'UZMED klinik atlasi'));
  const meta=external?[data.author,data.license].filter(Boolean).join(' · '):[data.source,data.page?data.page+'-bet':''].filter(Boolean).join(' · ');
  if(meta)content.appendChild(el('span','uzd-meta',meta));
  if(external){
   const ref=sourceUrl(data.source);
   if(ref){const a=el('a','uzd-credit','Rasm manbasi va litsenziya ↗');a.href=ref;a.target='_blank';a.rel='noopener noreferrer';content.appendChild(a)}
  }else content.appendChild(el('span','uzd-meta','Mavjud atlas materiali; foydalanish huquqlari alohida tekshiriladi.'));
  card.appendChild(content);return card;
 }
 function mount(){
  const screen=document.getElementById('derma-screen');
  if(!screen||screen.querySelector('#uzmedDermaDiscovery'))return false;
  const hero=screen.querySelector('.derma-hero');
  if(!hero)return false;
  const box=el('section','uzd-discovery');
  box.id='uzmedDermaDiscovery';
  box.setAttribute('aria-label','Klinik dermatologik rasmlar qidiruvi');
  box.innerHTML='<div class="uzd-intro"><div><span class="uzd-kicker">UZMED · Klinik tasvirlar</span><h2>Kasallik bo‘yicha rasm qidirish</h2><p>Mahalliy atlas va manbasi ko‘rsatilgan ochiq klinik rasmlar.</p></div><div class="uzd-status" id="uzdAtlasCount">Atlas tekshirilmoqda</div></div>'+
  '<form class="uzd-form" id="uzdSearchForm"><label for="uzdSearchInput" class="uzd-sr">Teri kasalligi nomi</label><input id="uzdSearchInput" type="search" maxlength="120" enterkeyhint="search" autocomplete="off" placeholder="Masalan: psoriaz, akne, vitiligo" required><button type="submit" id="uzdSearchButton">Rasmlarni topish</button></form>'+
  '<div class="uzd-topics" id="uzdTopics" aria-label="Tezkor kasallik qidiruvi"></div>'+
  '<p class="uzd-feedback" id="uzdFeedback" role="status" aria-live="polite">Kasallik nomini kiriting yoki quyidagilardan tanlang.</p>'+
  '<div class="uzd-results" id="uzdResults" aria-live="polite"></div>'+
  '<p class="uzd-warning">Rasmlar faqat o‘quv va klinik solishtirish uchun. Suratning o‘zi tashxisni tasdiqlamaydi. Shoshilinch alomatlarda kechiktirmasdan tibbiy yordam ko‘rsating.</p>';
  hero.insertAdjacentElement('afterend',box);
  const input=box.querySelector('#uzdSearchInput'),button=box.querySelector('#uzdSearchButton');
  const feedback=box.querySelector('#uzdFeedback'),results=box.querySelector('#uzdResults');
  const topics=box.querySelector('#uzdTopics');
  let seq=0;
  async function search(q){
   q=String(q||'').trim().slice(0,120);
   if(q.length<2){feedback.textContent='Kasallik nomini kamida 2 harf bilan yozing.';results.replaceChildren();return}
   input.value=q;
   const run=++seq;
   feedback.textContent='Klinik rasmlar qidirilmoqda…';button.disabled=true;
   results.replaceChildren();
   try{
    const body=await apiFind(q);
    if(run!==seq||!box.isConnected)return;
    const images=safeResults(body);
    const count=Number(body.atlas_count);
    if(Number.isInteger(count)&&count>=0)box.querySelector('#uzdAtlasCount').textContent=count+' ta atlas rasmi';
    const bad=Array.isArray(body.images)?body.images.length-images.length:0;
    feedback.textContent=images.length?images.length+' ta mos rasm. Ularning manbasi va litsenziyasini tekshiring.':'Mos klinik rasm topilmadi. Boshqa nom bilan qayta qidiring.';
    for(const data of images)results.appendChild(makeCard(data));
    if(bad&&images.length===0)feedback.textContent='Rasm manbasi tasdiqlanmagani uchun ko‘rsatilmadi.';
   }catch(_){if(run===seq&&box.isConnected)feedback.textContent='Rasmlar vaqtincha yuklanmadi. Keyinroq qayta urinib ko‘ring.'}
   finally{if(run===seq)button.disabled=false}
  }
  for(const [q,title] of TOPICS){
   const chip=el('button','uzd-chip',title);chip.type='button';
   chip.addEventListener('click',()=>search(q));topics.appendChild(chip);
  }
  box.querySelector('#uzdSearchForm').addEventListener('submit',e=>{e.preventDefault();search(input.value)});
  search('psoriaz');
  return true;
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={allowedUrl,sourceUrl,safeResults,topics:TOPICS};
 if(typeof document==='undefined')return;
 if(global.UzmedDermaMedia && typeof global.UzmedDermaMedia.isImageQuestion==='function'){
  // Keep the site's existing image-question recognizer and chat rendering UI.
  // Only replace its transport that was blocked by the unrelated RAG wrapper.
  global.UzmedDermaMedia.find=apiFind;
 }

 function installChatDermaRoute(){
  const prior=global.sendAiMessage;
  if(typeof prior!=='function'||prior.__uzmedDermaRoute)return;
  let running=false;
  function routedSend(){
   const input=document.getElementById('aiInput');
   const text=String(input?.value||'').trim();
   const m=global.UzmedDermaMedia;
   const pendingFiles=global.UZMEDAiAttach?.pendingFiles;
   const hasFiles=Array.isArray(pendingFiles)&&pendingFiles.length>0;
   const clinicalSkin=/(derma|teri kasallik|psoriaz|psoriasis|vitiligo|akne|acne|husnbuzar|atopik|ekzema|eczema|urtikariya|urticaria|eshakemi|qichima|scabies|melanoma|pemfigus|toshma)/i.test(text);
   if(!text||hasFiles||!m||!m.isImageQuestion(text)||!clinicalSkin)
    return prior.apply(this,arguments);
   if(running)return;
   running=true;
   const sendButton=document.getElementById('aiSendBtn');
   input.value='';input.style.height='auto';
   if(sendButton)sendButton.disabled=true;
   try{if(typeof global.appendUserMsg==='function')global.appendUserMsg(text);}catch(_){}
   try{if(Array.isArray(global.aiHistory))global.aiHistory.push({role:'user',parts:[{text}]});}catch(_){}
   try{if(typeof global.showTyping==='function')global.showTyping();}catch(_){}
   return Promise.resolve().then(()=>m.find(text)).then(result=>{
    try{if(typeof global.hideTyping==='function')global.hideTyping();}catch(_){}
    const images=Array.isArray(result?.images)?safeResults(result):[];
    if(typeof global.appendBotMsg==='function'){
     global.appendBotMsg(images.length?
      'Dermatologiya bazasidan klinik rasmlar topildi. Har bir rasmning manbasi va litsenziyasiga e’tibor bering.':
      'Mos klinik rasm topilmadi. Teri kasalligining aniq nomini kiriting.');
    }
    m.display({...result,images});
    try{
     if(Array.isArray(global.aiHistory))global.aiHistory.push({
      role:'model',parts:[{text:images.length?'Dermatologiya rasmlari: '+(result.query||text):'Dermatologik rasm topilmadi.'}]
     });
    }catch(_){}
   }).catch(()=>{
    try{if(typeof global.hideTyping==='function')global.hideTyping();}catch(_){}
    if(typeof global.appendBotMsg==='function')global.appendBotMsg('Dermatologiya rasmlari vaqtincha olinmadi. Qayta urinib ko‘ring.');
   }).finally(()=>{
    running=false;if(sendButton)sendButton.disabled=false;
   });
  }
  routedSend.__uzmedDermaRoute=true;
  global.sendAiMessage=routedSend;
 }
 installChatDermaRoute();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installChatDermaRoute,{once:true});
 global.addEventListener('load',installChatDermaRoute,{once:true});
 setTimeout(installChatDermaRoute,400);
 if(!mount()){
  let tries=0;const timer=setInterval(()=>{if(mount()||++tries>=25)clearInterval(timer)},200);
 }
})(typeof window!=='undefined'?window:globalThis);
