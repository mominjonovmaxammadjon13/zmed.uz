'use strict';
(function(){
const qs=x=>document.querySelector(x);
const input=qs('#lawSearch'),results=qs('#results'),loading=qs('#loading');
const ask=qs('#legalQuestion'),askButton=qs('#legalAskButton'),answerBox=qs('#legalAnswer'),answerStatus=qs('#legalAskStatus');
const topicPanel=qs('#legalTopicsPanel'),topicHeading=qs('#legalTopicsHeading'),topicBody=qs('#legalTopicsBody');
let docs=[],sources=[],ssv=[],indexedAt='',timer=0,requestId=0;
const stop=new Set(['bilan','uchun','ning','hamda','yoki','agar','qanday','qilib','bolsa','bo‘lsa','bor','ham','men','bu','shunday','qaysi','qonun','modda','moddasi','haqida','bo‘yicha','tibbiy','fuqarolar','huquqiy']);
const topics={
 doctor:{label:'Shifokor huquqlari va mas’uliyati',refs:[
  ['health_law_265',41],['health_law_265',42],['health_law_265',43],['health_law_265',44],['health_law_265',45],['health_law_265',46],
  ['labor_code',21],['labor_code',22],['criminal_code',116],['administrative_code',41],['medic_obstruction_827',null]
 ],intro:'Tibbiyot xodimlarining kasbiy faoliyat huquqi, mehnat huquqlari, shifokor siri, kasbiy mas’uliyat va faoliyatga to‘sqinlik masalalari.'},
 patient:{label:'Bemor huquqlari',refs:[
  ['health_law_265',24],['health_law_265',25],['health_law_265',26],['health_law_265',27],['health_law_265',28],['health_law_265',30],
  ['health_law_265',45],['health_law_265',46],['health_law_265',47],['personal_data',null]
 ],intro:'Tibbiy yordam olish, xabardor rozilik, muolajani rad etish, shifokor siri, tibbiy hujjatlar va shikoyat qilish huquqlari.'},
 laws:{label:'Rasmiy qonunlar va SSV hujjatlari',refs:[],intro:'Indekslangan hujjatlarning asl Lex.uz sahifalari va SSVning rasmiy protokol/buyruq kataloglariga havolalar.'}
};
function el(tag,cls,str){const v=document.createElement(tag);if(cls)v.className=cls;if(str!==undefined)v.textContent=String(str);return v;}
function norm(s){return String(s||'').toLocaleLowerCase('uz').replace(/[ʻʼ‘’\u0060]/g,"'").replace(/o'/g,'o').replace(/g'/g,'g').replace(/[^a-zа-яёҳқғў0-9 ]/gi,' ').replace(/\s+/g,' ').trim();}
function words(q){return [...new Set(norm(q).split(' ').filter(s=>s.length>2&&!stop.has(s)))].slice(0,12);}
function lexLink(url){
 try{const u=new URL(url);if(u.protocol==='https:'&&u.hostname==='lex.uz')return u.href;}catch(_){}
 return 'https://lex.uz/';
}
function ssvLink(url){
 try{const u=new URL(url);if(u.protocol==='https:'&&['gov.uz','tipme.uz'].includes(u.hostname))return u.href;}catch(_){}
 return 'https://gov.uz/oz/ssv/';
}
function link(str,url,cls){const a=el('a',cls,str);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function renderRecord(r,dest,compact){
 const item=el('article','result legal-record');
 item.appendChild(el('div','tag',r.title));
 const heading=el('h3');heading.appendChild(link(r.article||'Tegishli hujjat',lexLink(r.url)));item.appendChild(heading);
 const preview=el('div','excerpt',String(r.text||'').slice(0,compact?380:700)+(String(r.text||'').length>(compact?380:700)?'…':''));
 item.appendChild(preview);
 const footer=el('footer','', 'Lex.uz — asl moddaning amaldagi tahririni tekshiring.');
 item.appendChild(footer);dest.appendChild(item);
}
function block(title,subtitle){const sec=el('section','legal-source-section');sec.appendChild(el('h3','',title));if(subtitle)sec.appendChild(el('p','small',subtitle));return sec;}
function sourceCard(title,url,note,type){
 const card=el('article','legal-source-card');card.appendChild(link('↗ '+title,type==='ssv'?ssvLink(url):lexLink(url)));
 if(note)card.appendChild(el('p','small',note));return card;
}
function showTopic(name){
 const t=topics[name];if(!t)return;
 topicPanel.hidden=false;topicPanel.setAttribute('data-topic',name);
 topicHeading.textContent=t.label;topicBody.replaceChildren();
 topicBody.appendChild(el('p','small',t.intro));
 const order=docs.filter(r=>t.refs.some(([id,n])=>r.sourceId===id&&(n===null||r.articleNumber===n)));
 if(name!=='laws'){
  const ranked=[];
  for(const [sourceId,article] of t.refs){
   const row=order.find(r=>r.sourceId===sourceId&&(article===null||r.articleNumber===article));
   if(row&&!ranked.includes(row))ranked.push(row);
  }
  const section=block('Tegishli qonunlar va moddalar',ranked.length+' ta huquqiy modda va normativ asos topildi.'); 
  const list=el('div','legal-topic-records');ranked.slice(0,18).forEach(r=>renderRecord(r,list,true));section.appendChild(list);topicBody.appendChild(section);
 }else{
  const section=block('Lex.uz — rasmiy qonunlar',sources.length+' ta qonun/kodeks indekslangan.');
  const list=el('div','legal-source-list');sources.forEach(s=>list.appendChild(sourceCard(s.title,s.url,'Indeksdagi nusxa: '+indexedAt.slice(0,10)+'; amaldagi holatini asl sahifadan tekshiring.','lex')));
  section.appendChild(list);topicBody.appendChild(section);
 }
 const section2=block('SSV — buyruqlar va klinik protokollar','Quyidagi sahifalar rasmiy manbalarga to‘g‘ridan-to‘g‘ri havoladir. Bu yerda buyruqlarning to‘liq bandlari hali indekslanmagan.');
 const list2=el('div','legal-source-list');ssv.forEach(s=>list2.appendChild(sourceCard(s.title,s.url,s.description,'ssv')));section2.appendChild(list2);topicBody.appendChild(section2);
 const stamp=el('p','small','⚠️ SSV havolalari ochiq manbalarga yo‘naltiradi; AI ularning matnini tekshirmasdan xulosa chiqarmaydi.');
 topicBody.appendChild(stamp);
 topicPanel.scrollIntoView({behavior:'smooth',block:'start'});
 document.querySelectorAll('.feature[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===name)));
}
function score(r,q,tokens){
 const title=r.articleSearch,body=r.textSearch,book=r.titleSearch;
 let hits=0,number=0;
 for(const token of tokens){let h=0;if(title.includes(token))h+=8;if(book.includes(token))h+=3;if(body.includes(token))h+=1;if(h)number++;hits+=h;}
 if(!number)return 0;if(number===tokens.length)hits+=tokens.length*3;
 if(title.includes(norm(q)))hits+=10;
 return hits*number/(tokens.length||1);
}
function renderSearch(){
 const q=input.value.trim();
 results.replaceChildren();
 if(q.length<2){loading.textContent='Mavzuni yozing yoki yuqoridagi tugmalardan birini tanlang.';return;}
 const tokens=words(q);
 if(!tokens.length){loading.textContent='Aniqroq savol yoki kalit so‘z yozing.';return;}
 const ranked=docs.map(r=>({r,n:score(r,q,tokens)})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n).slice(0,9);
 loading.textContent='Indeks sanasi: '+indexedAt.slice(0,10)+' · Huquqiy xulosa emas.';
 if(!ranked.length)results.appendChild(el('p','small','Indeksda mos modda topilmadi. Rasmiy qonunlar bo‘limidan tekshiring.'));
 else ranked.forEach(o=>renderRecord(o.r,results,false));
 if(/\bssv\b|buyruq|protokol|standart|vazirlik/i.test(norm(q))){
  const more=block('SSV rasmiy hujjatlari', 'Buyruq raqamini va amaldagi tahririni manbaning o‘zida tekshiring.');
  const list=el('div','legal-source-list');ssv.forEach(s=>list.appendChild(sourceCard(s.title,s.url,s.description,'ssv')));more.appendChild(list);results.appendChild(more);
 }
}
const noPrivate=/(?:\+?998[\s()-]*\d{2}[\s()-]*\d{3}[\s()-]*\d{2}[\s()-]*\d{2}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{9,14}\b)/i;
async function askAgent(){
 const q=ask.value.trim();requestId++;const own=requestId;
 if(q.length<7){answerStatus.textContent='Savolni to‘liqroq yozing.';return;}
 if(noPrivate.test(q)){answerStatus.textContent='Shaxsiy ma’lumotlarni olib tashlang.';return;}
 askButton.disabled=true;answerBox.replaceChildren();
 answerStatus.textContent='Huquqiy agent Lex.uz indeksidagi moddalarni tekshiryapti…';
 const ac=new AbortController();const limit=setTimeout(()=>ac.abort(),42000);
 try{
  const res=await fetch('/api/legal/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q}),signal:ac.signal});
  const j=await res.json();if(own!==requestId)return;
  if(!res.ok&&!j.answer){answerStatus.textContent=j.message||'Agentga ulanib bo‘lmadi. Tibbiy huquqiy manbalar qidiruvidan foydalaning.';return;}
  answerStatus.textContent=!j.ok?'Savolga mos huquqiy modda indeksda topilmadi. Rasmiy hujjatlarni tekshiring.':j.ai?'AI tahlili manbalar bilan tekshirildi.':'Rasmiy moddalardan ma’lumot topildi. AI tahlili tasdiqlanmadi yoki mavjud emas.';
  const header=el('h3','','⚖️ UZMED — Tibbiy huquq agenti');answerBox.appendChild(header);
  answerBox.appendChild(el('div','legal-agent-text',j.answer||'Mos ma’lumot topilmadi.'));
  if(Array.isArray(j.sources)&&j.sources.length){
   const block=el('div','legal-agent-sources');block.appendChild(el('h4','','Rasmiy manbalar'));
   j.sources.forEach((s,i)=>block.appendChild(sourceCard('['+(i+1)+'] '+(s.article||s.title),s.url,s.title,'lex')));
   answerBox.appendChild(block);
  }
  answerBox.appendChild(el('p','small','Sahifa: qonunlarning amaldagi tahririni Lex.uz orqali tekshiring. SSV buyruqlari to‘liq indekslanmagan.'));
 }catch(e){answerStatus.textContent=e.name==='AbortError'?'Huquqiy so‘rov vaqti tugadi; noto‘liq javob ko‘rsatilmaydi.':'Agent hozir javob bermadi; manba qidiruvi ishlashda davom etadi.';}
 finally{clearTimeout(limit);if(own===requestId)askButton.disabled=false;}
}
function boot(){
 document.querySelectorAll('.feature[data-topic]').forEach(b=>b.addEventListener('click',()=>showTopic(b.dataset.topic)));
 document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.query;renderSearch();input.focus();}));
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(renderSearch,140);});
 askButton.addEventListener('click',askAgent);
 ask.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();askAgent();}});
 fetch('./sources.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('sources');return r.json()}).then(j=>{
  if(!Array.isArray(j.records)||!Array.isArray(j.sources)||j.records.length<100)throw Error('sources invalid');
  indexedAt=j.indexedAt||'';sources=j.sources;ssv=j.ssvSources||[];
  docs=j.records.map(r=>({...r,articleNumber:Number((r.article||'').match(/^(\d+)-modda/)?.[1])||0,
    articleSearch:norm(r.article),textSearch:norm(r.text),titleSearch:norm(r.title)}));
  loading.textContent=docs.length+' ta modda · '+sources.length+' ta Lex.uz manbasi · '+ssv.length+' ta SSV rasmiy havolasi. Mavzu tanlang.';
 }).catch(()=>{loading.textContent='Rasmiy hujjatlar indeksi vaqtincha yuklanmadi. Lex.uz va SSV sahifalarini tekshiring.';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();