(function(W,D){
'use strict';
if(W.__UZMED_APTEKA_REFERENCE_UI__) return;
W.__UZMED_APTEKA_REFERENCE_UI__=true;

var API='/api/drugs';
var seq=0, timer=null, mounted=false;

function $(s,r){return (r||D).querySelector(s)}
function all(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s))}
function el(tag,cls,text){var n=D.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=String(text);return n}
function txt(v){return String(v==null?'':v).trim()}
function esc(v){return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

function nodes(){
 var scr=D.getElementById('dorilar-screen'),tabs=D.getElementById('uzmNarxTabs'),list=D.getElementById('drugDbList');
 if(!scr||!tabs||!list)return null;
 var search=scr.querySelector('#drugDbSearch'),searchRow=search?search.closest('div[style]'):null;
 if(searchRow&&searchRow.parentNode!==scr){while(searchRow&&searchRow.parentNode!==scr)searchRow=searchRow.parentNode}
 var gb=scr.querySelector('.mkb-letter-btn'),grp=gb?gb.parentNode:null;
 if(grp===list||grp===tabs)grp=null;
 return {scr:scr,tabs:tabs,list:list,searchRow:searchRow,grp:grp,narx:D.getElementById('uzmNarxPanel')};
}
function orig(show){
 var n=nodes();if(!n)return;
 n.list.style.display=show?'':'none';
 if(n.searchRow)n.searchRow.style.display=show?'':'none';
 if(n.grp)n.grp.style.display=show?'':'none';
}
function css(){
 if(D.getElementById('uzm-apteka-ref-css'))return;
 var s=el('style');s.id='uzm-apteka-ref-css';
 s.textContent=
 '.uzm-apteka-panel{display:none;padding:10px 12px 24px;background:var(--bg)}'+
 '.uzm-apteka-panel.on{display:block}'+
 '.uzm-apteka-search{display:flex;gap:8px;align-items:center;background:var(--white);border:1px solid var(--border);border-radius:12px;padding:8px 11px;margin-bottom:10px}'+
 '.uzm-apteka-search input{width:100%;border:0;outline:0;background:transparent;color:var(--text);font-size:15px;min-height:32px}'+
 '.uzm-apteka-meta{font-size:11px;color:var(--muted);padding:3px 2px 9px}'+
 '.uzm-apteka-item{background:var(--white);border:1px solid var(--border);border-radius:13px;padding:12px;margin:0 0 8px;cursor:pointer}'+
 '.uzm-apteka-name{font-size:13px;font-weight:850;color:var(--text);line-height:1.35}'+
 '.uzm-apteka-sub{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.5}'+
 '.uzm-apteka-tag{display:inline-block;margin:6px 5px 0 0;padding:3px 7px;border-radius:8px;background:var(--red-soft);color:var(--red);font-size:9px;font-weight:800}'+
 '.uzm-apteka-empty{padding:18px 12px;text-align:center;color:var(--muted);font-size:12px;line-height:1.6}'+
 '.uzm-apteka-mask{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.48);display:none;align-items:flex-end;justify-content:center;padding:0}'+
 '.uzm-apteka-mask.on{display:flex}'+
 '.uzm-apteka-modal{width:min(680px,100%);max-height:86vh;overflow:auto;background:var(--white);border-radius:22px 22px 0 0;padding:18px 16px 26px;color:var(--text);position:relative}'+
 '.uzm-apteka-close{position:sticky;top:0;float:right;width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--white);color:var(--text);font-size:17px;z-index:2}'+
 '.uzm-apteka-title{font-size:18px;font-weight:900;padding-right:44px;line-height:1.35;margin-bottom:12px}'+
 '.uzm-apteka-sec{margin-top:14px;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}'+
 '.uzm-apteka-row{padding:8px 0;border-bottom:1px solid var(--border)}'+
 '.uzm-apteka-key{font-size:10px;color:var(--muted);font-weight:800;margin-bottom:3px}'+
 '.uzm-apteka-val{font-size:12px;line-height:1.6;color:var(--text2);white-space:pre-wrap}'+
 '.uzm-apteka-src{margin-top:15px;padding:10px 12px;border-radius:12px;background:var(--bg);font-size:10px;color:var(--muted);line-height:1.5}';
 (D.head||D.documentElement).appendChild(s);
}
function ensurePanel(){
 var n=nodes();if(!n)return false;
 css();
 var btn=n.tabs.querySelector('[data-k="apteka"]');
 if(!btn){
   btn=el('button','uzm-narx-tab','Apteka.uz ');
   btn.setAttribute('data-k','apteka');
   var b=el('b',null,'19 046');btn.appendChild(b);n.tabs.appendChild(btn);
 }
 var p=D.getElementById('uzmAptekaPanel');
 if(!p){
   p=el('div','uzm-apteka-panel');p.id='uzmAptekaPanel';
   p.innerHTML='<div class="uzm-apteka-search"><span>🌐</span><input id="uzmAptekaSearch" type="text" autocomplete="off" placeholder="Dori nomi yoki faol modda…"></div><div id="uzmAptekaMeta" class="uzm-apteka-meta">Apteka.uz ochiq dori sahifalari · Crawl4AI · Parse krediti ishlatilmaydi</div><div id="uzmAptekaList"><div class="uzm-apteka-empty">Dori nomini yozing. Masalan: Azimak yoki Paratsetamol.</div></div>';
   n.list.parentNode.insertBefore(p,n.list.nextSibling);
   var inp=D.getElementById('uzmAptekaSearch');
   inp.addEventListener('input',function(){clearTimeout(timer);var q=inp.value.trim();timer=setTimeout(function(){search(q)},240)});
 }
 if(!D.getElementById('uzmAptekaMask')){
   var m=el('div','uzm-apteka-mask');m.id='uzmAptekaMask';
   var box=el('div','uzm-apteka-modal');box.id='uzmAptekaModal';m.appendChild(box);D.body.appendChild(m);
   m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('on')});
 }
 fetch(API+'/status',{headers:{Accept:'application/json'}}).then(function(r){return r.ok?r.json():null}).then(function(j){
   if(!j)return;var b=n.tabs.querySelector('[data-k="apteka"] b');if(b&&j.catalog_products)b.textContent=Number(j.catalog_products).toLocaleString('ru-RU');
 }).catch(function(){});
 mounted=true;return true;
}
function activate(){
 var n=nodes();if(!n||!ensurePanel())return;
 all('.uzm-narx-tab',n.tabs).forEach(function(x){x.classList.remove('on')});
 var b=n.tabs.querySelector('[data-k="apteka"]');if(b)b.classList.add('on');
 if(n.narx)n.narx.classList.remove('on');
 orig(false);
 var p=D.getElementById('uzmAptekaPanel');if(p)p.classList.add('on');
 setTimeout(function(){var i=D.getElementById('uzmAptekaSearch');if(i)i.focus()},30);
}
function deactivate(){
 var p=D.getElementById('uzmAptekaPanel');if(p)p.classList.remove('on');
}
function render(rows,q,total){
 var host=D.getElementById('uzmAptekaList'),meta=D.getElementById('uzmAptekaMeta');if(!host)return;
 if(meta)meta.textContent=(total||rows.length)+' ta mos yozuv · Apteka.uz public sahifalari · SQLite cache · Parse krediti 0';
 if(!rows.length){host.innerHTML='<div class="uzm-apteka-empty">Mos dori topilmadi. Nomini boshqa yozuvda kiriting.</div>';return}
 host.innerHTML=rows.map(function(x){
   var sub=[];if(x.active_ingredient)sub.push('Faol modda: '+esc(x.active_ingredient));if(x.manufacturer)sub.push(esc(x.manufacturer));if(x.country)sub.push(esc(x.country));
   var tags=[];if(x.dosage)tags.push(esc(x.dosage));if(x.dosage_form)tags.push(esc(x.dosage_form));if(x.atc_code)tags.push('ATX '+esc(x.atc_code));
   return '<div class="uzm-apteka-item" data-slug="'+esc(x.slug)+'"><div class="uzm-apteka-name">'+esc(x.name||x.slug)+'</div><div class="uzm-apteka-sub">'+sub.join(' · ')+'</div>'+tags.map(function(t){return '<span class="uzm-apteka-tag">'+t+'</span>'}).join('')+'</div>'
 }).join('');
 all('.uzm-apteka-item',host).forEach(function(it){it.addEventListener('click',function(){detail(it.getAttribute('data-slug'))})});
}
function search(q){
 var host=D.getElementById('uzmAptekaList'),meta=D.getElementById('uzmAptekaMeta');if(!host)return;
 var my=++seq;
 if(q.length<2){host.innerHTML='<div class="uzm-apteka-empty">Dori nomini yozing. Masalan: Azimak yoki Paratsetamol.</div>';return}
 host.innerHTML='<div class="uzm-apteka-empty">Qidirilmoqda…</div>';
 fetch(API+'/search?q='+encodeURIComponent(q)+'&limit=8',{headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(j){
   if(my!==seq)return;var d=j&&j.data||{};render(Array.isArray(d.results)?d.results:[],q,d.total||0)
 }).catch(function(e){if(my!==seq)return;host.innerHTML='<div class="uzm-apteka-empty">Apteka.uz ma’lumoti hozir olinmadi. UZMED lokal bazasi ishlashda davom etadi.</div>';if(meta)meta.textContent='Crawl4AI API xatosi: '+e.message});
}
function field(box,k,v){if(!txt(v))return;var r=el('div','uzm-apteka-row');r.appendChild(el('div','uzm-apteka-key',k));r.appendChild(el('div','uzm-apteka-val',v));box.appendChild(r)}
function detail(slug){
 var mask=D.getElementById('uzmAptekaMask'),box=D.getElementById('uzmAptekaModal');if(!mask||!box)return;
 box.innerHTML='<button class="uzm-apteka-close" type="button">✕</button><div class="uzm-apteka-empty">Ma’lumot yuklanmoqda…</div>';mask.classList.add('on');
 $('.uzm-apteka-close',box).onclick=function(){mask.classList.remove('on')};
 fetch(API+'/'+encodeURIComponent(slug),{headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(function(j){
   var x=j&&j.data||{};box.innerHTML='';
   var c=el('button','uzm-apteka-close','✕');c.type='button';c.onclick=function(){mask.classList.remove('on')};box.appendChild(c);
   box.appendChild(el('div','uzm-apteka-title',x.name||slug));
   var sec=el('div','uzm-apteka-sec','Asosiy ma’lumot');box.appendChild(sec);
   field(box,'Faol modda',x.active_ingredient);field(box,'Guruh / kategoriya',x.drug_group||x.category);field(box,'Doza',x.dosage);field(box,'Shakli',x.dosage_form);field(box,'Qadoq',x.package_size);field(box,'Ishlab chiqaruvchi',x.manufacturer);field(box,'Mamlakat',x.country);field(box,'ATX',x.atc_code);
   if(x.description||x.indications||x.dosage_instructions||x.contraindications||x.adverse_effects||x.interactions||x.special_instructions){
     box.appendChild(el('div','uzm-apteka-sec','Yo‘riqnoma'));
     field(box,'Tavsif',x.description);field(box,'Ko‘rsatmalar',x.indications);field(box,'Qo‘llash / dozalash',x.dosage_instructions);field(box,'Qarshi ko‘rsatmalar',x.contraindications);field(box,'Nojo‘ya ta’sirlar',x.adverse_effects);field(box,'O‘zaro ta’sir',x.interactions);field(box,'Maxsus ko‘rsatmalar',x.special_instructions);
   }
   var src=el('div','uzm-apteka-src','Manba: Apteka.uz ochiq dori sahifasi → self-hosted Crawl4AI → UZMED SQLite/cache → UZMED API. Narx bu ma’lumotnomaga kiritilmaydi. Parse krediti ishlatilmaydi.');box.appendChild(src);
 }).catch(function(){box.innerHTML='<button class="uzm-apteka-close" type="button">✕</button><div class="uzm-apteka-empty">Dori tafsiloti olinmadi.</div>';$('.uzm-apteka-close',box).onclick=function(){mask.classList.remove('on')}});
}

D.addEventListener('click',function(e){
 var b=e.target.closest&&e.target.closest('#uzmNarxTabs .uzm-narx-tab');if(!b)return;
 if(b.getAttribute('data-k')==='apteka'){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();activate()}
 else{deactivate()}
},true);

var tries=0;(function mount(){if(ensurePanel())return;if(++tries<160)setTimeout(mount,250)})();
D.addEventListener('DOMContentLoaded',function(){setTimeout(ensurePanel,80)});
W.addEventListener('load',function(){setTimeout(ensurePanel,100)});
})(window,document);
