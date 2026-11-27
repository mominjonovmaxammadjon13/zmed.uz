/* UZMED navigation additions, v2; current sidebar only; no app logic changed. */
(function(){
'use strict';
const ROOT='/assets/uzmed-tibbiy-huquq/index.html';
const QABUL='/assets/uzmed-qabul-pilot/index.html';
const ids={qabul:'uzmedNavQabul20261023',legal:'uzmedNavLegal20261023',sources:'uzmedNavSources20261023'};
let dialog=null;
function makeSvg(path){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
 const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.appendChild(p);return svg;
}
const paths={
 qabul:'M4 6h16v15H4V6Zm4-3h8v6H8V3Zm4 9v6m-3-3h6',
 legal:'M12 3v16M5 7l7-4 7 4M3 10l3-6 3 6M15 10l3-6 3 6M3 10a3 3 0 0 0 6 0m6 0a3 3 0 0 0 6 0M7 21h10',
 sources:'M4 4h16v16H4V4Zm4 4h8m-8 4h8m-8 4h5'
};
function mkBtn(id,label,iconName,action){
 const b=document.createElement('button');b.type='button';b.id=id;b.className='uxn-nav-button uzmed-nav-addon';
 b.title=label;b.setAttribute('aria-label',label);b.appendChild(makeSvg(paths[iconName]));
 const span=document.createElement('span');span.className='uxn-nav-label';span.textContent=label;b.appendChild(span);
 b.addEventListener('click', action);return b;
}
function groupByName(sidebar,label){return [...sidebar.querySelectorAll('.uxn-nav .uxn-group')].find(g=>g.querySelector('.uxn-group-title')?.textContent.trim().toLowerCase()===label.toLowerCase());}
function installMenu(){
 const sidebar=document.getElementById('uzmedSidebar');if(!sidebar)return false;
 const work=groupByName(sidebar,'Shifokor ish jarayoni');
 const clinical=groupByName(sidebar,'Klinik ma’lumotnoma');
 if(!work||!clinical)return false;
 if(!document.getElementById(ids.qabul)){
  const b=mkBtn(ids.qabul,'Shifokor qabuli','qabul',()=>window.dispatchEvent(new Event('uzmed:qabul-open')));
  const after=work.querySelector('[data-uzmed-section="patients"]');after?after.after(b):work.appendChild(b);
 }
 if(!document.getElementById(ids.legal)){
  const b=mkBtn(ids.legal,'Tibbiy huquq','legal',()=>window.location.assign(ROOT));
  const after=clinical.querySelector('[data-uzmed-section="protocols"]');after?after.after(b):clinical.appendChild(b);
 }
 if(!document.getElementById(ids.sources)){
  const b=mkBtn(ids.sources,'Bo‘lim manbalari','sources',openSources);
  const after=document.getElementById(ids.legal);after?after.after(b):clinical.appendChild(b);
 }
 const input=sidebar.querySelector('.uxn-search input');
 if(input&&!input.dataset.uzmedAddonsFilter){
  input.dataset.uzmedAddonsFilter='1';
  input.addEventListener('input',()=>requestAnimationFrame(()=>updateSearch(input.value)));
  input.addEventListener('search',()=>requestAnimationFrame(()=>updateSearch(input.value)));
 }
 updateSearch(input?.value||'');
 return true;
}
function normalize(v){return String(v||'').toLowerCase().replace(/[’‘ʻʼ]/g,"'").trim();}
function updateSearch(value){
 const q=normalize(value),sidebar=document.getElementById('uzmedSidebar');if(!sidebar)return;
 for(const [id,groupName] of [[ids.qabul,'Shifokor ish jarayoni'],[ids.legal,'Klinik ma’lumotnoma'],[ids.sources,'Klinik ma’lumotnoma']]){
  const b=document.getElementById(id);if(!b)continue;
  const group=groupByName(sidebar,groupName);
  const match=!q||normalize(b.textContent).includes(q)||normalize(groupName).includes(q);
  b.hidden=!match;
  if(group&&match&&group.hidden)group.hidden=false;
 }
}
function getDialog(){
 if(dialog)return dialog;
 dialog=document.createElement('dialog');dialog.id='uzmedSourceDialog20261023';dialog.setAttribute('aria-label','Bo‘lim manbalari');
 const head=document.createElement('div');head.className='uzmed-source-head';
 const title=document.createElement('strong');title.textContent='📚 Bo‘lim manbalari';
 const desc=document.createElement('p');desc.className='uzmed-source-desc';desc.textContent='UZMED bo‘limlarida foydalaniladigan tibbiy manbalar va havolalar. Bo‘limni tanlab, manbalarni ko‘ring.';
 const heading=document.createElement('div');heading.className='uzmed-source-heading';heading.append(title,desc);
 const close=document.createElement('button');close.type='button';close.textContent='Yopish';close.addEventListener('click',()=>dialog.close());
 close.setAttribute('aria-label','Manbalar oynasini yopish');head.append(heading,close);dialog.appendChild(head);
 const container=document.createElement('div');container.className='uzmed-source-body';container.id='uzmedSourceBody20261023';dialog.appendChild(container);
 dialog.addEventListener('close',()=>{
  const details=dialog.querySelector('#uzmedSectionSources');if(details)details.open=false;
 });
 document.body.appendChild(dialog);
 return dialog;
}
function openSources(){
 if(window.UZMEDSourcesUI?.open){window.UZMEDSourcesUI.open();return;}
 let script=document.getElementById('uzmedSourceUiLoader');
 if(!script){
  script=document.createElement('script');script.id='uzmedSourceUiLoader';script.src='/assets/uzmed-sources-panel-20261025.js?v=1';
  script.onload=()=>window.UZMEDSourcesUI?.open();
  script.onerror=()=>{script.remove();window.alert('Manbalar sahifasini ochib bo‘lmadi. Qayta urinib ko‘ring.');};
  document.head.appendChild(script);
 }else{script.addEventListener('load',()=>window.UZMEDSourcesUI?.open(),{once:true});}
}
function hideOldBlock(){
 const panel=document.getElementById('uzmedSectionSources');
 if(panel&&!dialog){panel.hidden=true;}
}
function installStyles(){
 if(document.getElementById('uzmedNavAddonStyle20261023'))return;
 const style=document.createElement('style');style.id='uzmedNavAddonStyle20261023';
 style.textContent=`
  .uxn-nav .uzmed-nav-addon{cursor:pointer;color:inherit}
  .uxn-nav .uzmed-nav-addon svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #uzmedSourceDialog20261023{position:fixed;inset:0;margin:auto;box-sizing:border-box;width:min(560px,calc(100vw - 24px));max-height:min(84dvh,750px);border:1px solid #345567;border-radius:18px;padding:0;color:#e8f6f6;background:#142936;box-shadow:0 20px 70px #0009}
  #uzmedSourceDialog20261023::backdrop{background:rgba(0,13,22,.73)}
  #uzmedSourceDialog20261023 .uzmed-source-head{position:sticky;top:0;padding:17px 20px;display:flex;justify-content:space-between;align-items:center;background:#183541;border-bottom:1px solid #3b5a68;gap:10px}
  #uzmedSourceDialog20261023 .uzmed-source-head strong{font-size:19px;line-height:1.3;color:#e7fffb}
  #uzmedSourceDialog20261023 .uzmed-source-desc{font-size:12px;line-height:1.5;color:#a8c5cd;margin:5px 0 0}
  #uzmedSourceDialog20261023 .uzmed-source-head{z-index:2;border-radius:18px 18px 0 0}
  #uzmedSourceDialog20261023 .uzmed-source-head button{flex-shrink:0;background:#285361;border-radius:12px;min-height:42px}
  #uzmedSourceDialog20261023 .uzmed-source-body{scrollbar-width:thin;overscroll-behavior:contain}
  #uzmedSourceDialog20261023 .uzmed-source-body summary{display:block;padding:12px 14px;border-radius:12px;background:#1b3b48;font-weight:700;list-style:none}
  #uzmedSourceDialog20261023 .uzmed-source-body summary::-webkit-details-marker{display:none}
  #uzmedSourceDialog20261023 .uzmed-source-body a{display:inline-block;line-height:1.6;padding:4px 0}
  @media(max-width:600px){#uzmedSourceDialog20261023{width:calc(100vw - 24px);max-height:calc(100dvh - 110px);border-radius:18px}#uzmedSourceDialog20261023 .uzmed-source-head{padding:15px}#uzmedSourceDialog20261023 .uzmed-source-body{max-height:calc(100dvh - 255px);padding:13px}}
  #uzmedSourceDialog20261023 button{padding:8px 14px;border:1px solid #5c8997;background:transparent;border-radius:9px;color:inherit;cursor:pointer}
  #uzmedSourceDialog20261023 .uzmed-source-body{padding:14px 18px;overflow:auto;max-height:70dvh}
  #uzmedSourceDialog20261023 details{display:block!important;max-height:none!important;overflow:visible!important;border:0!important;margin:0!important;padding:0!important;font-size:14px!important}
  #uzmedSourceDialog20261023 summary{color:#79daca;cursor:pointer}
  #uzmedSourceDialog20261023 a{color:#8be2de;overflow-wrap:anywhere}
  #uzmedSourceDialog20261023 form input{width:100%;max-width:100%;box-sizing:border-box;background:#0c212c;color:#fff;border:1px solid #52717c;border-radius:7px}
  #uzmedSourceDialog20261023 li{margin:9px 0}
  html:not([data-uzmed-navigation='sidebar-v12']) #uzmedSourceDialog20261023:not([open]){display:none}
 `;
 document.head.appendChild(style);
}
function boot(){
 installStyles();
 let tries=0;
 const tick=()=>{
  installMenu();hideOldBlock();
  if(++tries>=50)clearInterval(timer);
 };
 const timer=setInterval(tick,700);tick();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
