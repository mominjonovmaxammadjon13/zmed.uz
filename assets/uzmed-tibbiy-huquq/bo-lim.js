/* UZMED Tibbiy huquq: three independent, source-grounded catalogs. No API mutations. */
(function(){
'use strict';
const root='./', params=new URLSearchParams(location.search);
let section=['shifokor','bemor','manbalar','hujjat'].includes(params.get('tur'))?params.get('tur'):'manbalar';
let docId=String(params.get('id')||'').slice(0,80);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const $=id=>document.getElementById(id),content=$('mainContent'),query=$('filterInput'),counter=$('countStatus');
let db=null, groups=[],source=null, pageSize=25, lastQuery='';
const cfg={
 shifokor:{title:'Shifokor huquqlari',intro:'Kasbiy huquqlar, mehnat va navbatchilik, shifokor siri, tibbiyot xodimining mas’uliyati va huquqiy himoyasi.',sections:[
  {title:'Kasbiy faoliyat va shifokor siri',sources:[['health_law_265',[41,43,44,45]]]},
  {title:'Mehnat, ish sharoiti va navbatchilik',sources:[['labor_code',[21,22,24,25]]]},
  {title:'Mas’uliyat va shifokor xavfsizligi',sources:[['health_law_265',[46]],['criminal_code',[112,116,117]],['administrative_code',[40,41]],['medic_obstruction_827',[]]]}
 ]},
 bemor:{title:'Bemor huquqlari',intro:'Sog‘liqni saqlash, xabardor rozilik, tibbiy sir, shoshilinch yordam, zarar qoplash va huquqlarni himoya qilish bo‘yicha rasmiy normalar.',sections:[
  {title:'Bemor va fuqarolarning huquqlari',sources:[['health_law_265',[21,22,23,24,25,29,30,31,35]]]},
  {title:'Tibbiy aralashuv va rozilik',sources:[['health_law_265',[26,27,28]]]},
  {title:'Maxfiylik, ma’lumotlar va shikoyat',sources:[['health_law_265',[45,46,47]],['personal_data',[21,25,27,28,30]]]}
 ]},
 manbalar:{title:'Rasmiy manbalar',intro:'Lex.uz qonun va kodekslari, Sog‘liqni saqlash vazirligi buyruqlari va milliy klinik protokollarning rasmiy kataloglari.'}
};
function clean(s){return String(s||'').toLocaleLowerCase('uz').replace(/[ʻʼ‘’`]/g,"'").replace(/o'/g,'o').replace(/g'/g,'g').replace(/[^a-zа-яёҳқғў0-9 ]/gi,' ').replace(/\s+/g,' ').trim();}
function allow(url,type){
 try{
  const u=new URL(url);
  const allowed=type==='lex'?['lex.uz']:['gov.uz','tipme.uz','api-portal.gov.uz'];
  if(u.protocol==='https:'&&allowed.includes(u.hostname))return u.href;
 }catch(_){}
 return null;
}
function external(label,url,type='lex',cls='source-button'){
 const href=allow(url,type),a=el('a',cls,label);
 if(!href){a.setAttribute('aria-disabled','true');a.removeAttribute('href');}
 else{a.href=href;a.target='_blank';a.rel='noopener noreferrer';}
 return a;
}
function badge(t){return el('span','tag',t);}
function info(t){return el('p','subtle',t);}
function groupCard(title,count){
 const c=el('section','group'),h=el('div','grouphead');
 h.appendChild(el('h2','',title));h.appendChild(el('span','groupbadge',count));
 c.appendChild(h);return c;
}
function sourceCount(sid){return db.records.filter(x=>x.sourceId===sid).length;}
function recordNumber(r){const m=String(r.article||'').match(/^\s*(\d+)\s*[-– ]\s*modda/i);return m?Number(m[1]):-1;}
function recordUI(r){
 const d=el('details','record'),sum=el('summary');
 const wrap=el('div');
 wrap.appendChild(el('span','',r.article||'Tegishli band / hujjat matni'));
 const meta=el('span','excerpt',r.title);
 wrap.appendChild(meta);sum.appendChild(wrap);d.appendChild(sum);
 const full=el('div','lawtext',r.text||'Indeksda matn mavjud emas. Asl manbani oching.');d.appendChild(full);
 const foot=el('div','lawfoot');foot.appendChild(el('span','source-pill',r.scope||'Manba doirasi noma’lum'));
 foot.appendChild(external('Lex.uz asl hujjat ↗',r.url));d.appendChild(foot);
 return d;
}
function recordsFor(spec){
 const [id,nums]=spec;
 return db.records.filter(r=>r.sourceId===id&&(!nums.length||nums.includes(recordNumber(r))));
}
function relatedSources(){
 const ids=section==='shifokor'?['health_law_265','labor_code','medic_obstruction_827','criminal_code','administrative_code']:['health_law_265','personal_data','civil_code_1'];
 const ssvIDs=section==='shifokor'?[1,3]:[0,2];
 const g=groupCard('Tegishli rasmiy manbalar','Lex.uz / SSV');
 g.appendChild(info('Quyida qonunlarning asl sahifalari va SSV rasmiy kataloglariga havolalar bor. Hujjatning to‘liq joriy versiyasini faqat rasmiy saytdan tekshiring.'));
 const entries=el('div','docsgrid');
 ids.map(id=>db.sources.find(s=>s.id===id)).filter(Boolean).forEach(s=>entries.appendChild(docCard(s)));
 ssvIDs.map(i=>db.ssvSources[i]).filter(Boolean).forEach(s=>entries.appendChild(ssvCard(s)));
 g.appendChild(entries);
 return g;
}
function renderCategories(){
 const q=clean(query.value),filteredGroups=cfg[section].sections||[],dest=document.createDocumentFragment();
 let shown=0;
 filteredGroups.forEach(g=>{
  const related=[];
  for(const x of g.sources)for(const row of recordsFor(x))if(!related.includes(row))related.push(row);
  const filtered=related.filter(r=>!q||clean((r.article||'')+' '+r.title+' '+r.text).includes(q));
  if(!filtered.length)return;
  const sec=groupCard(g.title,filtered.length+' modda');
  const records=el('div','records');filtered.forEach(r=>records.appendChild(recordUI(r)));
  sec.appendChild(records);dest.appendChild(sec);shown+=filtered.length;
 });
 content.replaceChildren();
 if(!shown){content.appendChild(el('p','empty','Bu bo‘limda qidiruvga mos hujjat topilmadi. So‘rovni o‘zgartiring.'));}
 else{const grid=el('div','groups');grid.appendChild(dest);if(!q)grid.appendChild(relatedSources());content.appendChild(grid);}
 counter.textContent=shown+' ta tegishli modda';
}
function docCard(doc){
 const card=el('article','doc');
 card.appendChild(el('h3','',doc.title));
 const n=sourceCount(doc.id),experimental=db.records.some(r=>r.sourceId===doc.id&&String(r.scope||'').includes('tajriba'));
 card.appendChild(info(n+' ta indekslangan modda yoki bo‘lak'+(experimental?' · ayrim normalar faqat tajriba-sinov doirasida':'')+'.'));
 const links=el('div','doclinks');
 const internal=el('a','primary','UZMED’da hujjatni ochish →');
 internal.href='./bo-lim.html?tur=hujjat&id='+encodeURIComponent(doc.id);
 links.appendChild(internal);
 links.appendChild(external('Lex.uz asl nusxasi ↗',doc.url,'lex',''));
 card.appendChild(links);return card;
}
function ssvCard(doc){
 const c=el('article','doc');c.appendChild(el('h3','',doc.title));
 c.appendChild(info(doc.description||'SSV rasmiy hujjat sahifasi'));
 const links=el('div','doclinks');
 const href=allow(doc.url,'ssv');
 if(href)links.appendChild(external(doc.type==='pdf'?'Rasmiy PDF’ni ochish ↗':'Rasmiy portalni ochish ↗',href,'ssv','primary'));
 c.appendChild(links);return c;
}
function renderSources(){
 const q=clean(query.value);let shown=0;
 content.replaceChildren();
 const g=groupCard('Lex.uz — qonun va kodekslar',db.sources.length+' ta hujjat');
 const docs=el('div','docsgrid');
 db.sources.filter(s=>!q||clean(s.title).includes(q)||db.records.some(r=>r.sourceId===s.id&&clean(r.article).includes(q))).forEach(s=>{docs.appendChild(docCard(s));shown++});
 g.appendChild(docs);content.appendChild(g);
 const s=groupCard('SSV — rasmiy buyruqlar',db.ssvOrders.length+' ta PDF');
 s.appendChild(info('Buyruqlarning to‘liq fayli hukumatning rasmiy PDF manbasida ochiladi; UZMED bu hujjatlar ichidagi matnni huquqiy agent uchun hali indekslamagan.'));
 const grid=el('div','docsgrid');db.ssvOrders.filter(o=>!q||clean(o.title+' '+o.description).includes(q)).forEach(o=>{grid.appendChild(ssvCard(o));shown++});
 s.appendChild(grid);content.appendChild(s);
 const c=groupCard('SSV — katalog va protokollar',db.ssvSources.length+' ta portal');
 const cg=el('div','docsgrid');db.ssvSources.filter(o=>!q||clean(o.title+' '+o.description).includes(q)).forEach(o=>{cg.appendChild(ssvCard(o));shown++});
 c.appendChild(cg);content.appendChild(c);
 if(!shown)content.replaceChildren(el('p','empty','Mos hujjat topilmadi. Boshqa nom yoki buyruq raqamini kiriting.'));
 counter.textContent=shown+' ta rasmiy manba';
}
function renderDocument(){
 const rows=db.records.filter(r=>r.sourceId===source.id),q=clean(query.value);
 const filtered=rows.filter(r=>!q||clean(r.article+' '+r.text).includes(q));
 content.replaceChildren();
 const g=groupCard(source.title,filtered.length+' / '+rows.length+' modda');
 const note=el('div','note',String(rows[0]?.scope||'').includes('tajriba')?'DIQQAT: Ushbu hujjatning ayrim bandlari tajriba-sinov hududi va davriga bog‘liq. Uni butun O‘zbekiston uchun umumiy norma deb hisoblamang.':'Ushbu matn UZMED’ning sanalangan indeksidan olingan. Qonunning to‘liq va amaldagi tahriri uchun Lex.uz’dagi asl nusxani oching.');
 g.appendChild(note);
 const linkRow=el('div','actions');linkRow.appendChild(external('Lex.uz’da to‘liq hujjatni ochish ↗',source.url,'lex','source-button'));g.appendChild(linkRow);
 const list=el('div','records');const displayed=filtered.slice(0,pageSize);displayed.forEach(r=>list.appendChild(recordUI(r)));g.appendChild(list);
 if(filtered.length>displayed.length){
  const more=el('button','more','Yana '+Math.min(25,filtered.length-displayed.length)+' ta moddani ko‘rsatish');
  more.type='button';more.addEventListener('click',()=>{pageSize+=25;renderDocument();});g.appendChild(more);
 }
 content.appendChild(g);
 if(!filtered.length)content.appendChild(el('p','empty','Ushbu hujjatda qidiruv bo‘yicha modda topilmadi.'));
 counter.textContent=filtered.length+' ta modda topildi · '+displayed.length+' ta ko‘rsatilgan';
}
function preparePage(){
 if(!db||!Array.isArray(db.records)||db.records.length<500){content.replaceChildren(el('p','empty','Hujjatlar indeksi yuklanmadi.'));return;}
 if(section==='hujjat'){
  source=db.sources.find(s=>s.id===docId);
  if(!source){section='manbalar';}
 }
 const infoSource=section==='hujjat'?{title:source.title,intro:'Hujjatning UZMED indeksidagi moddalari. Har bir modda nomini bosib, mavjud matnni o‘qing; Lex.uz’da asl tahririni oching.'}:cfg[section];
 document.title='UZMED · '+infoSource.title;
 $('pageTitle').textContent=infoSource.title;$('crumbHere').textContent=infoSource.title;$('pageIntro').textContent=infoSource.intro;
 const meta=$('heroMeta');meta.replaceChildren();meta.appendChild(badge('Lex.uz indeks: '+db.indexedAt.slice(0,10)));
 if(section==='manbalar'||section==='hujjat')meta.appendChild(badge('SSV rasmiy hujjatlar'));
 if(section==='hujjat'){$('searchTitle').textContent='Ushbu qonun ichida qidirish';$('searchHelp').textContent='Modda raqami yoki matndagi so‘zlarni kiriting.';}
 else if(section==='manbalar'){$('searchTitle').textContent='Rasmiy manba yoki buyruqni qidirish';$('searchHelp').textContent='Hujjat nomi, kodeks yoki buyruq raqami bo‘yicha qidiring.';}
 else{$('searchTitle').textContent='Shu yo‘nalishdagi moddalarni qidirish';$('searchHelp').textContent='Boshqa sohadagi qonunlar aralashmaydi. Moddaning o‘zini ochib o‘qishingiz mumkin.';}
 document.querySelectorAll('[data-tab]').forEach(a=>{if(a.dataset.tab===section)a.setAttribute('aria-current','page');});
 $('filterInput').addEventListener('input',()=>{if(section==='hujjat')pageSize=25;render();});
 $('clearSearch').addEventListener('click',()=>{query.value='';pageSize=25;render();query.focus();});
 render();
}
function render(){if(section==='hujjat')renderDocument();else if(section==='manbalar')renderSources();else renderCategories();}
const theme=$('themeToggle');
const saved=(()=>{try{return localStorage.getItem('uzmed.legal.theme')}catch(_){return null}})();
if(saved==='light'||saved==='dark')document.documentElement.dataset.theme=saved;
theme.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme==='dark'||(!document.documentElement.dataset.theme&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.dataset.theme=dark?'light':'dark';theme.textContent=dark?'☀':'☾';try{localStorage.setItem('uzmed.legal.theme',document.documentElement.dataset.theme)}catch(_){}});
fetch(root+'sources.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('sources_http');return r.json();}).then(data=>{
 db=data;
 if(!Array.isArray(db.ssvOrders))db.ssvOrders=[];
 if(!Array.isArray(db.ssvSources))db.ssvSources=[];
 preparePage();
}).catch(()=>{content.replaceChildren(el('p','empty','Ma’lumotlar manbai yuklanmadi. Iltimos, sahifani yangilang yoki Lex.uz saytidan tekshiring.'));});
})();
