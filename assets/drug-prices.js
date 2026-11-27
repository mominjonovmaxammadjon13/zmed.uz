(function(W,D){'use strict';
if(W.UZMEDDrugPrices)return;
if(!D.querySelector('link[data-uz-price-css]')){const l=D.createElement('link');l.rel='stylesheet';l.href='/assets/drug-prices.css?v=1';l.dataset.uzPriceCss='1';(D.head||D.documentElement).appendChild(l);}
const A=W.UZMEDDrugPrices={version:'1.0'};
let tree=null,configured=null,dialog=null,form=null,results=null,statusEl=null,regionSel=null,districtSel=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('uz-UZ').format(Number(n))+' so‘m':'Narx ko‘rsatilmagan';
function payloadData(x){return x&&x.data&&typeof x.data==='object'?x.data:x}
function childrenRoot(x){
  const d=payloadData(x),r=Array.isArray(d?.regions)?d.regions:[];
  if(r.length===1&&Array.isArray(r[0]?.children))return r[0].children;
  return r;
}
function close(){try{dialog?.close()}catch{}}
function makeDialog(){
  if(dialog?.isConnected)return dialog;
  if(dialog){tree=null;configured=null;}
  dialog=D.createElement('dialog');dialog.id='uzPriceDialog';dialog.className='uz-price-dialog';
  dialog.innerHTML='<div class="uz-price-head"><div><b>💰 Dori narxlari</b><small>ArzonApteka ochiq sahifalaridagi joriy umumiy narxlar</small></div><button type="button" id="uzPriceClose" aria-label="Yopish">✕</button></div>'+
  '<form id="uzPriceForm" class="uz-price-form">'+
  '<label>Dori nomi<input id="uzPriceQuery" name="q" autocomplete="off" placeholder="Masalan: No-shpa" required minlength="2"></label>'+
  '<div class="uz-price-grid"><label>Viloyat<select id="uzPriceRegion"><option value="">Butun O‘zbekiston</option></select></label>'+
  '<label>Tuman / shahar<select id="uzPriceDistrict" disabled><option value="">Barchasi</option></select></label></div>'+
  '<button class="uz-price-submit" type="submit">Narxlarni qidirish</button></form>'+
  '<div id="uzPriceStatus" class="uz-price-status">Dori nomini yozing va hududni tanlang.</div>'+
  '<div id="uzPriceResults" class="uz-price-results"></div>'+
  '<p class="uz-price-note">Narx va mavjudlik dorixona ma’lumotlariga bog‘liq. Xarid oldidan dorixonada tasdiqlang.</p>';
  D.body.append(dialog);
  form=D.getElementById('uzPriceForm');results=D.getElementById('uzPriceResults');statusEl=D.getElementById('uzPriceStatus');
  regionSel=D.getElementById('uzPriceRegion');districtSel=D.getElementById('uzPriceDistrict');
  D.getElementById('uzPriceClose').onclick=close;
  dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
  regionSel.addEventListener('change',fillDistricts);
  form.addEventListener('submit',search);
  return dialog;
}
async function loadRegions(){
  if(tree)return tree;
  const r=await fetch('/api/drug-prices/regions',{headers:{Accept:'application/json'}});
  const x=await r.json().catch(()=>({}));
  configured=x.configured!==false&&x.status!=='setup_required';
  tree=childrenRoot(x);
  regionSel.innerHTML='<option value="">Butun O‘zbekiston</option>'+tree.map(v=>'<option value="'+esc(v.region_id||v.slug||v.name)+'">'+esc(v.name)+'</option>').join('');
  if(!configured)statusEl.textContent='Dori narxlari xizmati vaqtincha mavjud emas.';
  return tree;
}
function fillDistricts(){
  const value=regionSel.value,node=(tree||[]).find(v=>String(v.region_id||v.slug||v.name)===String(value));
  const kids=Array.isArray(node?.children)?node.children:[];
  districtSel.innerHTML='<option value="">Barchasi</option>'+kids.map(v=>'<option value="'+esc(v.region_id||v.slug||v.name)+'">'+esc(v.name)+'</option>').join('');
  districtSel.disabled=!value||!kids.length;
}
function render(data){
  const d=payloadData(data),rows=Array.isArray(d?.results)?d.results:[];
  if(!rows.length){results.innerHTML='';statusEl.textContent='Bu qidiruv bo‘yicha mavjud taklif topilmadi.';return}
  const loc=d.location_filter_applied===false?(d.scope_label||'Butun O‘zbekiston'):[d.selected_region?.name,d.selected_district?.name].filter(Boolean).join(' · ')||'Butun O‘zbekiston';
  statusEl.textContent=loc+' — '+rows.length+' ta natija'+(d.location_filter_applied===false?' · umumiy narx':'');
  results.innerHTML=rows.map(x=>{
    const url=/^https:\/\//.test(String(x.product_url||''))?x.product_url:'#';
    return '<article class="uz-price-card"><div class="uz-price-card-top"><div><b>'+esc(x.name||'Dori')+'</b><small>'+esc([x.dosage,x.form].filter(Boolean).join(' · '))+'</small></div><strong>'+esc(fmt(x.min_price))+'</strong></div>'+
      '<div class="uz-price-meta">'+(x.manufacturer?'<span>'+esc(x.manufacturer)+'</span>':'')+
      '<span>'+(x.in_stock?'✅ Mavjud':'○ Mavjud emas')+'</span><span>🏪 '+esc(x.offers_count??0)+' ta taklif</span></div>'+
      (url!=='#'?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">ArzonApteka’da ko‘rish ↗</a>':'')+'</article>'
  }).join('');
}
async function search(e){
  e.preventDefault();
  const q=D.getElementById('uzPriceQuery').value.trim();if(q.length<2)return;
  const p=new URLSearchParams({q,limit:'8'});if(regionSel.value)p.set('region',regionSel.value);if(districtSel.value)p.set('district',districtSel.value);
  statusEl.textContent='⏳ Narxlar tekshirilmoqda…';results.innerHTML='';
  const b=form.querySelector('button[type=submit]');b.disabled=true;
  try{
    const r=await fetch('/api/drug-prices/search?'+p.toString(),{headers:{Accept:'application/json'}});
    const x=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(x.error||'Narx xizmati javob bermadi.');
    render(x);
  }catch(err){statusEl.textContent='⚠️ '+String(err.message||err);results.innerHTML=''}
  finally{b.disabled=false}
}
async function open(){
  makeDialog();
  try{if(!tree)await loadRegions()}catch(e){statusEl.textContent='⚠️ Hududlar yuklanmadi: '+String(e.message||e)}
  W.closeMenu?.();dialog.showModal();
}
function menuButton(){
  if(D.getElementById('uzPriceMenu'))return;
  const host=D.querySelector('.uz-menu-body');if(!host)return;
  const b=D.createElement('button');b.type='button';b.id='uzPriceMenu';b.className='uz-price-menu';
  b.innerHTML='<span class="uz-price-menu-icon">💰</span><span><b>Dori narxlari</b><small>Dorixonalardagi joriy narxlar</small></span><i>›</i>';
  b.addEventListener('click',open);
  const labels=[...host.querySelectorAll('.uz-menu-section')],before=labels.find(x=>/ILOVA/i.test(x.textContent||''));
  if(before)host.insertBefore(b,before);else host.appendChild(b);
}
function boot(){menuButton();makeDialog()}
D.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));
setTimeout(boot,1200);
new MutationObserver(()=>menuButton()).observe(D.documentElement,{childList:true,subtree:true});
A.open=open;A.reloadRegions=()=>{tree=null;return loadRegions()};
})(window,document);