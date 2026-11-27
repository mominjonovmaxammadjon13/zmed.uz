/* UZMED Dermatologiya: licensed image discovery inside the existing atlas screen. No patient data or AI diagnosis. */
(function(global){
 'use strict';
 const API='/api/derma/search';
 const TOPICS=[['psoriaz','Psoriaz'],['atopik dermatit','Atopik dermatit'],['akne','Akne'],['vitiligo','Vitiligo'],['urtikariya','Urtikariya'],['qichima','Qichima'],['ekzema','Ekzema'],['melanoma','Melanoma']];
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
    const resp=await fetch(API+'?'+new URLSearchParams({q}),{method:'GET',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout?AbortSignal.timeout(12000):undefined});
    if(!resp.ok)throw new Error('service unavailable');
    const body=await resp.json();
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
 if(!mount()){
  let tries=0;const timer=setInterval(()=>{if(mount()||++tries>=25)clearInterval(timer)},200);
 }
})(typeof window!=='undefined'?window:globalThis);
