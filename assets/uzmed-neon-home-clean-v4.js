/* UZMED Neon Main Menu v1. Presentation + same-page navigation only.
 * No credentials, network calls, clinical data reads/writes or duplicate app routes.
 */
(function(W,D){
'use strict';
if(W.__UZMED_NEON_HOME_V1__)return;W.__UZMED_NEON_HOME_V1__=true;
const heart='<svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M32 51C25 43 6 32 6 18 6 5 25 2 32 16 39 2 58 5 58 18c0 14-19 25-26 33Z" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/><path d="M3 29h15l6-12 7 26 7-17 4 7h18" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>';
const svgPaths={
 menu:'M4 6h16M4 12h16M4 18h16',chat:'M4 4h16v12H9l-5 4V4Zm7 5h6m-6 4h3',compose:'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-3-9 3 3M9 15l4-.8L20.2 6a2.12 2.12 0 0 0-3-3L10 11.2 9 15Z',speaker:'M4 10h4l6-5v14l-6-5H4v-4Zm14-2q4 4 0 8m2-12q7 8 0 16',
 stethoscope:'M7 3v6a5 5 0 0 0 10 0V3m-3 0v5m-7-5v5m5 6v3a5 5 0 0 0 10 0v-2M21 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
 book:'M12 6Q7 3 3 4v15q5-2 9 2 4-4 9-2V4q-4-1-9 2Zm0 0v15m3-13v4m-2-2h4',
 mkb:'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5m-5 4h8',
 pills:'m5 13 8-8a5.66 5.66 0 0 1 8 8l-8 8a5.66 5.66 0 0 1-8-8Zm3-3 8 8',
 calc:'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm2 4h10v4H7zm0 8h2m3 0h2m3 0h1M7 18h2m3 0h2m3 0h1',
 lab:'M9 2h6m-5 0v7L4 20a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L14 9V2M7 16h10m-6 3h1',
 people:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9v-3a7 7 0 0 1 14 0v3ZM17 4a4 4 0 0 1 0 8m0 2a7 7 0 0 1 6 7',
 law:'M12 3v18M4 6h16M7 6l-5 8h10L7 6Zm10 0-5 8h10l-5-8ZM6 22h12',
 layers:'m3 8 9-6 9 6-9 6-9-6Zm0 6 9 6 9-6M3 19l9 5 9-5',
 calendar:'M6 2v4m12-4v4M3 9h18M4 5h16v16H4V5Zm4 8h3m4 0h2m-9 4h3m4 0h2',
 pulse:'M2 12h4l3-8 5 16 3-8h5',
 search:'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 5 5',
 scan:'M3 9V4h5m8 0h5v5M3 15v5h5m8 0h5v-5M7 12h10M12 7v10',
 arrow:'M5 12h14m-6-6 6 6-6 6'
};
function icon(key,cls=''){return '<svg '+(cls?'class="'+cls+'" ':'')+'viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(svgPaths[key]||svgPaths.pulse)+'"/></svg>'}
const doctor='<img class="unh-doctor" src="/assets/uzmed-neon-doctor-clean-v3.webp?v=3" alt="Shifokor surati" loading="eager" decoding="async">';
const tiles=[
 {key:'qabul',title:'Shifokor qabuli',sub:'Qabul · EPKR · Retsept',ico:'stethoscope',primary:true,voice:'qabul'},
 {key:'protocols',title:'Tashxis va protokollar',sub:'SSV · Klinik · Davolash',ico:'book',voice:'protocols'},
 {key:'mkb',title:'MKB-10',sub:'Kasalliklar klassifikatori',ico:'mkb',voice:'mkb'},
 {key:'drugs',title:'Dorilar',sub:'Ma’lumot · Narxlar · DDI',ico:'pills',voice:'drugs'},
 {key:'scores',title:'Klinik shkalalar',sub:'Risk · Diagnostika · Prognoz',ico:'calc',voice:'scores'},
 {key:'analysis',title:'Tahlil (AI)',sub:'Rasm · PDF · Hujjat tahlili',ico:'lab',voice:'analysis'},
 {key:'patients',title:'Bemorlarim',sub:'Qidiruv · Tarix · EPKR',ico:'people',voice:'patients'},
 {key:'legal',title:'Tibbiy huquq',sub:'Qonunchilik · Me’yoriy hujjatlar',ico:'law',voice:'legal'},
 {key:'chat',title:'AI umumiy chat',sub:'Klinik savollar · Izohlar · Ilmiy manbalar',ico:'chat',voice:'chat'},
 {key:'templates',title:'Shablonlar',sub:'Tayyor hujjatlar va shakllar',ico:'layers',voice:'qabul'},
 {key:'history',title:'Suhbatlar tarixi',sub:'Chat va AI murojaatlari arxivi',ico:'calendar',voice:'history'}
];
function tile(t,i){const btn=D.createElement('button');btn.type='button';btn.className='unh-grid-button'+(t.primary?' primary':'');btn.dataset.unhAction=t.key;btn.setAttribute('data-uzmed-section',t.voice);btn.setAttribute('aria-label',t.title);btn.innerHTML=icon(t.ico)+'<span class="unh-card-copy"><strong>'+t.title+'</strong><small>'+t.sub+'</small></span>'+(i<2?'<span class="unh-arrow" aria-hidden="true">›</span>':'');return btn;}
const html='<div class="unh-shell"><header class="unh-head"><button type="button" class="unh-menu" data-unh-action="all" aria-label="UZMED asosiy menyusini ochish">'+icon('menu')+'</button><div class="unh-brand"><span class="unh-brand-logo">'+heart+'</span><span class="unh-brand-text"><strong>UZMED</strong><small>Tibbiy platforma</small></span></div><div class="unh-actions"><button class="unh-voice" type="button" data-unh-action="voice" aria-label="Ovozli yordamchini yoqish yoki o‘chirish" aria-pressed="true">'+icon('speaker')+'</button><button type="button" class="unh-chat" data-unh-action="chat" data-uzmed-section="chat">'+icon('compose')+' Chat</button></div></header><section class="unh-hero" aria-label="UZMED kutib olish"><div class="unh-hero-copy"><h1>Xush kelibsiz, <span>Doktor!</span></h1><p>Tibbiy amaliyotingiz uchun ishonchli yordamchi</p></div><svg class="unh-ecg" viewBox="0 0 320 65" fill="none" aria-hidden="true"><path d="M0 36h82l20-11 15 23 22-43 21 57 18-37 14 11h128" stroke="#20f6d7" stroke-width="3.5" stroke-linecap="round"/></svg>'+doctor+'</section><div class="unh-grid big" id="unhMajor"></div><div class="unh-grid small" id="unhSecondary"></div><footer class="unh-footer"><div class="unh-footer-title">'+icon('pulse')+'<span><strong>Klinik vositalar</strong><small>Barcha bo‘limlar bir joyda</small></span></div><button type="button" class="unh-tools-go" data-unh-action="all">Barcha bo‘limlar →</button></footer><div class="unh-status" id="uzmedNeonStatus" role="status" aria-live="polite"></div></div>';
let root=null,screen=null,back=null,observers=[];
function isVisible(el){return !!(el&&el.isConnected&&el.getClientRects().length&&getComputedStyle(el).display!=='none')}
function setStatus(message){let el=D.getElementById('uzmedNeonStatus');if(el)el.textContent=message||''}
function authReady(){const a=W.UZMEDAuth?.getState?.();return !!a?.loggedIn;}
function activate(section){const nav=W.UZMEDNavigation;if(nav&&typeof nav.activate==='function')try{return nav.activate(section)===true}catch(e){setStatus('Bo‘limni ochishda xatolik yuz berdi.');return false}return false;}
function clickSelector(selector){const el=D.querySelector(selector);if(el){el.click();return true}return false}
function nativeScreen(id){if(typeof W.showScreen==='function'&&D.getElementById(id)){W.showScreen(id);return true}return clickSelector('#uzSideMenu [onclick*="'+id+'"]')}
function protocolView(){return activate('protocols')||nativeScreen('assosi-screen');}
function mainView(){return activate('home')||nativeScreen('uzmed-home-screen');}
function qabul(view){if(typeof W.UZMEDQabulStart?.open==='function'){W.UZMEDQabulStart.open(view||'');return true}W.dispatchEvent(new Event('uzmed:qabul-open'));return !!D.getElementById('uzQabulEntry')}
function go(key){
 if(!authReady()){W.UZMEDAuth?.open?.();return}
 setStatus('');
 let ok=true;
 switch(key){
 case 'qabul':ok=qabul();break;
 case 'patients':ok=qabul('mine');break;
 case 'protocols':ok=protocolView();break;
 case 'mkb':ok=activate('mkb')||nativeScreen('mkb-db-screen');break;
 case 'drugs':ok=activate('drugs')||clickSelector('#nav-dorilar');break;
 case 'scores':ok=activate('scores')||(protocolView()&&clickSelector('#umHome [data-um-tool="scores"]'));break;
 case 'analysis':ok=activate('analysis')||clickSelector('#uzmedUxLabMenu');break;
 case 'legal':ok=nativeScreen('privacy-screen');break;
 case 'chat':ok=activate('chat')||clickSelector('#nav-doktor');break;
 case 'templates':ok=qabul();break;
 case 'history':ok=activate('history')||nativeScreen('ai-tarix-screen');break;
 case 'search':ok=activate('search')||nativeScreen('search-screen');break;
 case 'home':ok=mainView();break;
 case 'all':if(W.matchMedia('(min-width:1024px)').matches){D.documentElement.classList.toggle('unh-menu-open');ok=!!D.getElementById('uzmedSidebar')}else{ok=(typeof W.UZMEDNavigation?.open==='function'?(W.UZMEDNavigation.open(),true):typeof W.openMenu==='function'?(W.openMenu(),true):clickSelector('#uzmedSidebarToggle'));}break;
 case 'voice':{let btn=D.getElementById('uzmedVoiceGuide')?.shadowRoot?.querySelector('button');if(btn){btn.click()}else if(W.UZMEDVoiceGuide?.setEnabled){W.UZMEDVoiceGuide.setEnabled(!W.UZMEDVoiceGuide.enabled())}else ok=false;updateVoice();break;}
 default:ok=false;
 }
 if(!ok)setStatus('Bu bo‘lim hozir ochilmadi. Menyudan qayta urinib ko‘ring.');
 W.setTimeout(sync,80);
}
function updateVoice(){const el=root?.querySelector('.unh-voice'),guide=W.UZMEDVoiceGuide;if(el&&guide?.enabled){el.setAttribute('aria-pressed',String(guide.enabled()));el.title=guide.enabled()?'Ovozli yordamchi yoqilgan':'Ovozli yordamchi o‘chirilgan';}}
function sync(){
 if(!root||!screen)return;
 const active=screen.classList.contains('active')&&!Array.from(D.querySelectorAll('.screens > .screen.active')).some(n=>n!==screen)&&!isVisible(D.querySelector('#uzQabulEntry.screen.active'));
 D.documentElement.classList.toggle('unh-active',active&&screen.classList.contains('unh-home-mode'));
 // Legacy desktop sidebar places the fixed app at left:280px with a very
 // specific !important rule. Use a reversible inline override on home only.
 const shell=D.querySelector('.phone-shell');
 if(shell){
  const widen=active&&W.matchMedia('(min-width:1024px)').matches;
  if(widen){shell.style.setProperty('left','0px','important');shell.style.setProperty('right','0px','important');shell.style.setProperty('width','100vw','important');shell.dataset.unhShellWidened='1';}
  else if(shell.dataset.unhShellWidened==='1'){shell.style.removeProperty('left');shell.style.removeProperty('right');shell.style.removeProperty('width');delete shell.dataset.unhShellWidened;}
 }
 if(!active)D.documentElement.classList.remove('unh-menu-open');
 updateVoice();
}
function mount(){
 if(root?.isConnected)return true;
 screen=D.getElementById('uzmed-home-screen');
 if(!screen)return false;
 if(!D.getElementById('uzmedNeonHomeStyles')){const css=D.createElement('link');css.id='uzmedNeonHomeStyles';css.rel='stylesheet';css.href='/assets/uzmed-neon-home-clean-v4.css?v=4';D.head.appendChild(css);}
 if(!D.getElementById('unhMenuBackdrop')){const veil=D.createElement('button');veil.id='unhMenuBackdrop';veil.type='button';veil.setAttribute('aria-label','Menyuni yopish');veil.addEventListener('click',()=>D.documentElement.classList.remove('unh-menu-open'));D.body.appendChild(veil);}
  root=D.createElement('div');root.id='uzmedNeonHome';root.innerHTML=html;
 screen.insertBefore(root,screen.firstChild);
 root.querySelector('#unhMajor').append(...tiles.slice(0,2).map(tile));
 root.querySelector('#unhSecondary').append(...tiles.slice(2).map((t,i)=>tile(t,i+2)));
 // Cards use their own action key, not an unrelated route or second site.
 root.querySelectorAll('[data-unh-action]').forEach(el=>el.addEventListener('click',e=>{e.stopPropagation();go(el.dataset.unhAction)}));

 screen.classList.add('unh-home-mode');
 const obs=new MutationObserver(sync);obs.observe(screen,{attributes:true,attributeFilter:['class']});observers.push(obs);
 W.addEventListener('uzmed:auth-change',sync);W.addEventListener('popstate',sync);W.addEventListener('resize',sync,{passive:true});
 D.addEventListener('click',e=>{if(e.target.closest('#uzmedSidebar .uxn-nav-button,#uzmedSidebar [data-uzmed-section]'))D.documentElement.classList.remove('unh-menu-open');if(e.target.closest('#uzmedSidebar,#uzSideMenu,[data-ux-rail]'))W.setTimeout(sync,50)},true);
 sync();W.UZMEDNeonHome={go,mainView,protocolView,version:1};return true;
}
if(!mount()){let n=0;const timer=W.setInterval(()=>{if(mount()||++n>450)W.clearInterval(timer)},100)}
})(window,document);
