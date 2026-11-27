/* UZMED source catalogue: isolated read-only full-screen view. */
(function(W,D){'use strict';
 if(W.UZMEDSourcesUI)return;
 const sections=[
 ['ai','Umumiy AI','ai'],['mkb','MKB-10 / MKB-11','mkb'],['drug','Dorilar','drug'],['ddi','Dorilar o‘zaro ta’siri','ddi'],
 ['proto','Tashxis va protokollar','protocols'],['spec','Mutaxassislar','specialists'],['derma','Dermatologiya','derma'],
 ['score','Klinik shkalalar','scores'],['ped','Pediatriya','ped'],['atc','ATC klassifikatsiyasi','atc'],['legal','Tibbiy huquq','legal']
 ];
 const types={
 live_adapter:'API adapteri',versioned_import:'Versiyali baza',versioned_metadata_index:'Hujjatlar indeksi',
 local_reference:'Mahalliy indeks',partial_local_and_external:'Qisman mahalliy va tashqi manbalar',
 configured_adapter:'Sozlangan adapter',credentials_required:'API kaliti talab etiladi',
 license_required:'Litsenziya talab etiladi',reference_link:'Tashqi havola',import_required:'Import talab etiladi'
 };
 let view=null,selected='ai',rows=[],query='',revision=0,focusBefore=null,loading=false;
 const el=(tag,cls,label)=>{const n=D.createElement(tag);if(cls)n.className=cls;if(label!==undefined)n.textContent=label;return n;};
 const css=`
 #uzmedSourcesView{position:fixed;inset:0;z-index:2147482550;overflow-y:auto;overscroll-behavior:contain;background:#0a1925;color:#eaf7fa;font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
 #uzmedSourcesView *,#uzmedSourcesView *:before,#uzmedSourcesView *:after{box-sizing:border-box}
 #uzmedSourcesView .usv-top{position:sticky;top:0;z-index:4;background:rgba(12,30,42,.96);backdrop-filter:blur(14px);border-bottom:1px solid #2e4b58}
 #uzmedSourcesView .usv-bar{max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:13px;padding:14px 20px;padding-top:max(14px,env(safe-area-inset-top))}
 #uzmedSourcesView .usv-back{border:1px solid #436877;background:#183744;color:#ebffff;padding:10px 15px;border-radius:12px;min-height:44px;font-weight:700;cursor:pointer}
 #uzmedSourcesView .usv-brand{margin-left:auto;color:#61e7d9;letter-spacing:.16em;font-size:13px;font-weight:850}
 #uzmedSourcesView .usv-main{max-width:1100px;margin:0 auto;padding:30px 20px 72px}
 #uzmedSourcesView .usv-eyebrow{font-size:12px;font-weight:800;letter-spacing:.18em;color:#63d9d2;text-transform:uppercase}
 #uzmedSourcesView h1{font-size:clamp(28px,5vw,39px);line-height:1.16;margin:9px 0 11px;font-weight:850;letter-spacing:-.025em;color:#f4feff}
 #uzmedSourcesView .usv-intro{margin:0;max-width:780px;font-size:15px;color:#aac1cc}
 #uzmedSourcesView .usv-layout{display:grid;grid-template-columns:244px minmax(0,1fr);gap:20px;margin-top:28px;align-items:start}
 #uzmedSourcesView .usv-nav{background:#102938;border:1px solid #2b4855;border-radius:18px;padding:10px;display:flex;flex-direction:column;gap:4px}
 #uzmedSourcesView .usv-tab{display:flex;align-items:center;text-align:left;gap:10px;width:100%;border:1px solid transparent;border-radius:12px;background:transparent;padding:11px 13px;color:#bfd4dd;font-weight:600;min-height:45px;cursor:pointer}
 #uzmedSourcesView .usv-tab:hover{background:#1e4250}
 #uzmedSourcesView .usv-tab[aria-selected="true"]{background:#164b51;color:#e8fffc;border-color:#398e91;box-shadow:inset 3px 0 #62e3d6}
 #uzmedSourcesView .usv-body{min-width:0;background:#102635;border:1px solid #2d4a59;border-radius:20px;overflow:hidden}
 #uzmedSourcesView .usv-body-head{padding:20px 22px;border-bottom:1px solid #2c4d59}
 #uzmedSourcesView .usv-title{margin:0;font-size:20px;color:#f3fbff;font-weight:800}
 #uzmedSourcesView .usv-help{margin:5px 0 0;font-size:13px;color:#9dbac7}
 #uzmedSourcesView .usv-search{width:100%;height:46px;margin-top:15px;border:1px solid #426777;border-radius:12px;background:#081e2b;color:#f0ffff;padding:0 15px;outline:none}
 #uzmedSourcesView .usv-search:focus{border-color:#6de4d8;box-shadow:0 0 0 3px #42dcc328}
 #uzmedSourcesView .usv-results{padding:17px 20px;display:grid;gap:12px}
 #uzmedSourcesView .usv-source{background:#172f3e;border:1px solid #335363;border-radius:14px;padding:15px 17px}
 #uzmedSourcesView .usv-source a{font-size:15px;font-weight:750;color:#7ae9e0;text-decoration:none;overflow-wrap:anywhere}
 #uzmedSourcesView .usv-source a:hover{text-decoration:underline}
 #uzmedSourcesView .usv-status{display:inline-block;margin:9px 0 3px;padding:3px 9px;border:1px solid #406877;border-radius:999px;background:#203e4b;color:#b6d7df;font-size:11px;font-weight:700}
 #uzmedSourcesView .usv-url{display:block;color:#8ba9b7;font-size:11px;margin-top:5px;word-break:break-word}
 #uzmedSourcesView .usv-empty{padding:30px 15px;text-align:center;color:#b3c7d1;line-height:1.7}
 #uzmedSourcesView .usv-note{font-size:12px;color:#9db6c1;padding:16px 22px;border-top:1px solid #2d4a59}
 #uzmedSourcesView button:focus-visible,#uzmedSourcesView a:focus-visible{outline:3px solid #61e7d9;outline-offset:2px}
 @media(max-width:700px){#uzmedSourcesView .usv-main{padding:22px 13px 65px}#uzmedSourcesView .usv-bar{padding:12px 13px;padding-top:max(12px,env(safe-area-inset-top))}#uzmedSourcesView .usv-layout{grid-template-columns:1fr;gap:13px;margin-top:19px}#uzmedSourcesView .usv-nav{display:flex;flex-direction:row;overflow-x:auto;border-radius:13px;padding:8px;scrollbar-width:thin}#uzmedSourcesView .usv-tab{width:auto;white-space:nowrap;flex:none;min-height:43px;padding:9px 13px}#uzmedSourcesView .usv-tab[aria-selected="true"]{box-shadow:inset 0 -3px #62e3d6}#uzmedSourcesView .usv-body-head{padding:17px 15px}#uzmedSourcesView .usv-results{padding:12px;gap:10px}#uzmedSourcesView .usv-source{padding:13px}}
 @media(prefers-color-scheme:light){html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView{background:#f2f7f8;color:#15323f}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-top{background:#fff}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-body,html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-nav{background:#fff}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView h1,html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-title{color:#142f3a}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-tab{color:#225061}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-tab[aria-selected="true"]{background:#d5f2ef}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-source{background:#f4f9fa}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-source a{color:#006e70}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-search{background:#f7fbfc;color:#16313e}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-back{background:#edf7f7;color:#143846}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-intro,html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-help{color:#4c6b79}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-status{color:#315866;background:#e6f4f5}html:not([data-uzmed-ux-theme="dark"]) #uzmedSourcesView .usv-empty{color:#476371}}
 `;
 function close(){if(!view||view.hidden)return;view.hidden=true;revision++;if(focusBefore&&focusBefore.isConnected)focusBefore.focus();}
 function mount(){
  if(view)return;
  const style=el('style');style.id='uzmedSourcesUiStyle20261025';style.textContent=css;D.head.append(style);
  view=el('section');view.id='uzmedSourcesView';view.hidden=true;view.setAttribute('aria-label','UZMED bo‘lim manbalari');view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');
  const top=el('header','usv-top'),bar=el('div','usv-bar'),back=el('button','usv-back','← Orqaga');back.type='button';back.onclick=close;
  bar.append(back,el('div','usv-brand','UZMED · MANBALAR'));top.append(bar);
  const main=el('main','usv-main');main.append(el('div','usv-eyebrow','Klinik bilimlar kutubxonasi'),el('h1','','Bo‘lim manbalari'),el('p','usv-intro','Har bir UZMED bo‘limining ma’lumot manbalari va ulanish turi. Istalgan bo‘limni tanlang va rasmiy havolalarni oching.'));
  const layout=el('div','usv-layout'),nav=el('nav','usv-nav'),body=el('div','usv-body');
  nav.setAttribute('aria-label','Manbalar bo‘limlari');
  for(const [key,label] of sections){const btn=el('button','usv-tab',label);btn.type='button';btn.dataset.key=key;btn.setAttribute('aria-selected','false');btn.onclick=()=>select(key);nav.append(btn);}
  const head=el('div','usv-body-head'),title=el('h2','usv-title'),help=el('p','usv-help'),search=el('input','usv-search');
  search.type='search';search.placeholder='Manbalar ichidan qidirish…';search.setAttribute('aria-label','Manbalar ichidan qidirish');search.oninput=()=>{query=search.value.toLocaleLowerCase();render();};
  head.append(title,help,search);
  const list=el('div','usv-results');list.setAttribute('aria-live','polite');list.id='uzmedSourcesResults';
  body.append(head,list,el('div','usv-note','Muhim: havola yoki sozlangan adapter mavjudligi ushbu manbadan har bir AI javobida foydalanilganini anglatmaydi. Klinik qaror uchun asl hujjatni tekshiring.'));
  layout.append(nav,body);main.append(layout);view.append(top,main);D.body.append(view);
  D.addEventListener('keydown',e=>{if(e.key==='Escape'&&view&&!view.hidden){e.preventDefault();close();}});
 }
 function render(){
  const list=view.querySelector('#uzmedSourcesResults');list.replaceChildren();
  if(loading){list.append(el('p','usv-empty','Manbalar yuklanmoqda…'));return;}
  const filtered=rows.filter(x=>(String(x.title||'')+' '+String(x.specialty||'')+' '+String(x.id||'')).toLocaleLowerCase().includes(query));
  if(!filtered.length){list.append(el('p','usv-empty',rows.length?'Qidiruvga mos manba topilmadi.':'Bu bo‘lim uchun hozircha manbalar qayd etilmagan.'));return;}
  for(const x of filtered){
   const card=el('article','usv-source'),a=el('a','',String(x.specialty?x.specialty+' · ':'')+String(x.title||'Nomsiz manba'));
   try{const u=new URL(x.url);if(u.protocol!=='https:')continue;a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';card.append(a,el('span','usv-status',types[x.status]||'Holati aniqlanmagan'),el('small','usv-url',u.hostname));}catch{continue;}
   list.append(card);
  }
 }
 async function select(key){
  selected=key;const rev=++revision;query='';rows=[];loading=true;
  for(const tab of view.querySelectorAll('.usv-tab'))tab.setAttribute('aria-selected',String(tab.dataset.key===key));
  const label=sections.find(s=>s[0]===key)?.[1]||'Manbalar';
  view.querySelector('.usv-title').textContent=label;
  view.querySelector('.usv-help').textContent='Manbalar va ularning texnik holati';
  view.querySelector('.usv-search').value='';
  const list=view.querySelector('#uzmedSourcesResults');list.replaceChildren(el('p','usv-empty','Manbalar yuklanmoqda…'));
  try{
   const response=await fetch('/api/medical-sources/status?section='+encodeURIComponent(key),{headers:{Accept:'application/json'},credentials:'omit'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();if(rev!==revision||view.hidden)return;
   loading=false;rows=Array.isArray(data.sources)?data.sources:[];view.querySelector('.usv-help').textContent=rows.length+' ta manba · Foydalanish holati manba yonida ko‘rsatilgan';render();
  }catch{if(rev!==revision||view.hidden)return;loading=false;rows=[];list.replaceChildren();const b=el('button','usv-back','Qayta yuklash');b.onclick=()=>select(key);list.append(el('p','usv-empty','Manbalar xizmati vaqtincha javob bermadi.'),b);}
 }
 function open(){focusBefore=D.activeElement;mount();view.hidden=false;select(selected);view.querySelector('.usv-back').focus();}
 W.UZMEDSourcesUI={open,close};
})(window,document);
