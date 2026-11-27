(function(W,D){'use strict';
if(W.UZMEDOfficialReference)return;
const A=W.UZMEDOfficialReference={version:'1.0',mounted:false};
const API='/api/official-reference/search';
const OFFICIAL='https://uzpharmagency.uz/uz/reference-prices';
const COMPARE='https://refcontrol.uz/uz/';
const safe=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>typeof v==='number'&&Number.isFinite(v)?new Intl.NumberFormat('uz-UZ',{maximumFractionDigits:2}).format(v)+' so‘m':'Ma’lumot ko‘rsatilmagan';
let controller=null,epoch=0,host=null,queryEl=null,statusEl=null,output=null,submit=null;
function links(){return '<div class="uor-links"><a href="'+OFFICIAL+'" target="_blank" rel="noopener noreferrer">Farmagentlik rasmiy reyestri ↗</a><a href="'+COMPARE+'" target="_blank" rel="noopener noreferrer">RefControl — xalqaro taqqoslash ↗</a></div>';}
function render(data){
 const rows=Array.isArray(data.results)?data.results:[];
 const checked=data.fetched_at?new Date(data.fetched_at).toLocaleString('uz-UZ'):'noma’lum';
 const warning=data.stale?'⚠️ Rasmiy manba vaqtincha ishlamayapti. Oxirgi saqlangan narxlar ko‘rsatilmoqda. ':data.partial?'⚠️ Qidiruv manbalaridan biri vaqtincha javob bermadi. ':'';
 statusEl.textContent=warning+rows.length+' ta yozuv · Oxirgi tekshiruv: '+checked+'. '+(data.total_upstream>rows.length?'Natijalar ko‘p; aniqroq dori nomi bilan qidiring.':'');
 if(!rows.length){output.innerHTML='<p class="uor-help">Ushbu so‘rov bo‘yicha rasmiy yozuv topilmadi. Nomning kirillcha yozilishi yoki Pharm ID bilan rasmiy reyestrni tekshiring.</p>';return}
 output.innerHTML=rows.map(x=>{
   const link=typeof x.details_url==='string'&&x.details_url.startsWith(OFFICIAL+'/')?x.details_url:OFFICIAL;
   return '<article class="uor-result"><div class="uor-result-head"><div><b>'+safe(x.name||x.trademark||'Dori')+'</b><small>'+safe(x.manufacturer||'Ishlab chiqaruvchi ko‘rsatilmagan')+'</small></div><span class="uor-pill">Pharm ID: '+safe(x.pharm_id)+'</span></div>'+
   '<dl class="uor-prices"><div><dt>Chegaraviy chakana</dt><dd>'+safe(money(x.retail_price_uzs))+'</dd></div><div><dt>Chegaraviy ulgurji</dt><dd>'+safe(money(x.wholesale_price_uzs))+'</dd></div></dl>'+
   '<details class="uor-details"><summary>Preparat va reyestr tafsilotlari</summary><p><b>INN:</b> '+safe(x.inn||'—')+'</p><p><b>Ro‘yxatga olish:</b> '+safe(x.registration||'—')+'</p><p><b>Reyestr yozuvi sanasi:</b> '+safe(x.reestr_updated||'ko‘rsatilmagan')+'</p><p><b>Manbadagi valyuta:</b> '+safe(x.source_currency||'—')+'</p></details>'+
   '<div class="uor-result-foot"><small>Reyestr sanasi: '+safe(x.reestr_updated||'noma’lum')+'</small><a href="'+safe(link)+'" target="_blank" rel="noopener noreferrer">Rasmiy yozuv ↗</a></div></article>';
 }).join('');
}
async function search(q){
 if(!host)return;
 const term=String(q||'').trim();
 if(term.length<2){statusEl.textContent='Dori nomini kamida 2 ta belgi bilan kiriting.';return;}
 if(controller)controller.abort();
 controller=new AbortController();
 const current=++epoch;
 queryEl.value=term;
 output.innerHTML='';
 statusEl.textContent='⏳ Rasmiy Farmagentlik reyestridan narxlar olinmoqda…';
 submit.disabled=true;
 try{
   const p=new URLSearchParams({q:term});
   const response=await fetch(API+'?'+p,{signal:controller.signal,headers:{Accept:'application/json'}});
   const body=await response.json().catch(()=>({}));
   if(current!==epoch)return;
   if(!response.ok)throw Error(body.error||'Rasmiy ma’lumotga ulanishda xatolik');
   render(body);
 }catch(e){
   if(current!==epoch||e.name==='AbortError')return;
   statusEl.textContent='⚠️ '+String(e.message||'Rasmiy narxlarni olishning imkoni bo‘lmadi.');
   output.innerHTML='<p class="uor-help">Rasmiy reyestr ishlamasa, bu bo‘lim eski dorixona narxlarini rasmiy narx deb ko‘rsatmaydi. Pastdagi manbalardan tekshiring.</p>';
 }finally{if(current===epoch)submit.disabled=false;}
}
function mount(){
 if(A.mounted)return true;
 const workspace=D.getElementById('uzDrugWorkspace'),screen=D.getElementById('dorilar-screen');
 if(!workspace||!screen)return false;
 host=D.createElement('section');host.id='uzmedOfficialReference';host.className='uor-panel';host.setAttribute('aria-label','Rasmiy referent narx');
 host.innerHTML='<div class="uor-heading"><div class="uor-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18M3 18h18"/></svg></div><div><h2>Rasmiy referent narx</h2><p>O‘zbekiston Farmagentligi reyestri · har kuni qayta tekshiriladigan ma’lumot</p></div></div>'+
 '<p class="uor-help">Dori nomi, dozasi, qadoq soni va ishlab chiqaruvchisini tekshiring. Bu dorixona sotuv narxi emas, reyestrdagi chegaraviy narxdir.</p>'+
 '<form id="uorForm" class="uor-form"><label for="uorQuery">Dori yoki preparat nomi</label><div class="uor-query-row"><input type="search" enterkeyhint="search" id="uorQuery" maxlength="80" minlength="2" autocomplete="off" placeholder="Masalan: Analgin, Azimak"><button id="uorSubmit" type="submit"><span>Qidirish</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></button></div></form>'+
 '<div id="uorStatus" class="uor-status" role="status" aria-live="polite">Dorini kiriting yoki Dorilar qidiruvidan foydalaning.</div>'+
 '<div id="uorResults" class="uor-results"></div>'+links()+
 '<p class="uor-disclaimer">Manbalar: Farmagentlik — davlat reyestri; RefControl — alohida taqqoslash servisi (natijalari bu yerga avtomatik ko‘chirilmaydi). Narxlar faqat rasmiy manbadagi mos preparat bo‘yicha ko‘rsatiladi.</p>';
 workspace.after(host);
 queryEl=D.getElementById('uorQuery');statusEl=D.getElementById('uorStatus');output=D.getElementById('uorResults');submit=D.getElementById('uorSubmit');
 D.getElementById('uorForm').addEventListener('submit',e=>{e.preventDefault();search(queryEl.value);});
 const main=D.getElementById('uzDrugForm');
 if(main)main.addEventListener('submit',()=>{
   const q=String(D.getElementById('uzDrugQuery')?.value||'').trim();
   if(q.length>=2&&q.length<=60&&q.split(/\s+/).length<=3&&!/[?!:;]/.test(q))search(q);
 });
 A.mounted=true;return true;
}
if(!D.querySelector('link[data-uor-css]')){
 const css=D.createElement('link');css.rel='stylesheet';css.href='/assets/official-reference.css?v=20261025-responsive1';css.dataset.uorCss='1';D.head.appendChild(css);
}
function boot(){
 if(mount())return;
 // The drug workspace is lazy: keep waiting until its first actual mount.
 const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});
 observer.observe(D,{childList:true,subtree:true});
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
A.open=function(q){if(!mount())return false;host.scrollIntoView({behavior:'smooth',block:'start'});if(q)search(q);else queryEl.focus();return true;};
A.search=search;
})(window,document);
