/* UZMED qabul visual shell. No data writes, API changes, or clinical editor overrides. */
(function (W, D) {
  'use strict';
  if (new URLSearchParams(W.location.search).get('section') !== 'qabul'&&!W.UZMED_QABUL_INLINE) return;
  const shapes = {
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/>',
    new:'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 10-6.3M18 13v8M14 17h8"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1.3A6.5 6.5 0 0 1 9 12.2a6.5 6.5 0 0 1 6.5 6.5V20zM17 5a3.5 3.5 0 0 1 0 7M19 14a5 5 0 0 1 3 4.6V20"/>',
    steth:'<path d="M5 4v6a6 6 0 0 0 12 0V4M3 4h4M15 4h4M11 16v1a4.5 4.5 0 0 0 9 0v-3"/><circle cx="20" cy="11.5" r="2"/>',
    moon:'<path d="M20.8 13A9 9 0 0 1 11 3.2 9.3 9.3 0 1 0 20.8 13z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>'
  };
  function el(tag, cls, text) {
    const node = D.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function ico(name) {
    const wrap = el('span','qp-icon');
    wrap.setAttribute('aria-hidden','true');
    wrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+ shapes[name] + '</svg>';
    return wrap;
  }
  const options = [
    ['new','Yangi bemor','Yangi qabulni boshlash','new'],
    ['mine','Mening bemorlarim','Shaxsiy bemorlar ro‘yxati','users']
  ];
  function profileName() {
    const state = W.UZMEDAuth?.getState?.() || {};
    return state.profile?.full_name || state.user?.user_metadata?.full_name || 'Shifokor profili';
  }
  function ensureStyleSheets(){
    if(!W.UZMED_QABUL_INLINE)return Promise.resolve();
    // The UZMED main page rehydrates its shell, discarding links inserted into
    // index.html during startup. Attach styles only after the live shell exists.
    const styles=[
      ['/assets/uzmed-qabul-start-20261025.css?v=20261109-passport5','base'],
      ['/assets/uzmed-qabul-premium-v1.css?v=20261106-registry1','premium'],
      ['/assets/uzmed-new-patient-v1.css?v=20261105-compact1','intake']
    ];
    if(!D.getElementById('uzmed-qabul-inline-style')){
      const inline=D.createElement('style');inline.id='uzmed-qabul-inline-style';
      inline.textContent='#uzQabulEntry.qpremium .qp-topbar{justify-content:flex-end;min-height:46px;margin-bottom:8px}#uzQabulEntry.qpremium .qp-topbar>.qp-square,#uzQabulEntry.qpremium .qp-topbar>.qp-brand{display:none!important}#uzQabulEntry.qpremium .qp-topbar .qp-top-right{margin-left:auto}';
      D.head.append(inline);
    }
    return Promise.all(styles.map(([url,key])=>new Promise(resolve=>{
      let el=D.getElementById('uzmed-embedded-qabul-style-'+key);
      if(el?.sheet)return resolve();
      if(!el){el=D.createElement('link');el.id='uzmed-embedded-qabul-style-'+key;el.rel='stylesheet';el.href=url;D.head.append(el);}
      el.addEventListener('load',resolve,{once:true});el.addEventListener('error',resolve,{once:true});
    })));
  }
  function decorate(root) {
    if (!root || root.dataset.qpremiumReady) return;
    if(W.UZMED_QABUL_INLINE){
      root.style.visibility='hidden';
      ensureStyleSheets().then(()=>{if(root.isConnected)root.style.removeProperty('visibility');});
    }
    root.dataset.qpremiumReady = 'true';
    root.classList.add('qpremium');
    let chosen = root.dataset.qstartView || 'home';
    const top = el('div','qp-topbar');
    const menu = el('button','qp-square');
    menu.type='button';menu.setAttribute('aria-label','Menyuni ochish');menu.setAttribute('aria-expanded','false');menu.append(ico('menu'));
    const brand = el('span','qp-brand','UZMED');
    const right = el('div','qp-top-right');
    const theme = el('button','qp-square qp-theme');
    theme.type='button';
    function setTheme(next) {
      const dark = next !== 'light';
      D.documentElement.setAttribute('data-uzmed-ux-theme',dark?'dark':'light');
      D.body.classList.toggle('dark-mode',dark);
      try {W.localStorage.setItem('uzmed.ux.theme',dark?'dark':'light');W.localStorage.setItem('uzmed_theme',dark?'dark':'light');}catch(e){}
      theme.replaceChildren(ico(dark?'sun':'moon'));
      theme.setAttribute('aria-label',dark?'Kunduzgi rejim':'Tungi rejim');
      theme.title=dark?'Kunduzgi rejim':'Tungi rejim';
    }
    theme.addEventListener('click',()=>setTheme(D.documentElement.getAttribute('data-uzmed-ux-theme')==='light'?'dark':'light'));
    if(!W.UZMED_QABUL_INLINE)setTheme(D.documentElement.getAttribute('data-uzmed-ux-theme')||'dark');
    const profile = el('button','qp-profile');
    profile.type='button';profile.setAttribute('aria-label','Foydalanuvchi profili');
    profile.append(ico('user'),el('span','qp-profile-name',profileName()));
    profile.addEventListener('click',()=>W.UZMEDAuth?.open?.());
    right.append(theme,profile);top.append(menu,brand,right);
    // A single in-page global drawer controls the hamburger on this isolated Qabul entry.
    // No navigation, auth mutation, or page reload occurs while opening it.
    menu.setAttribute('aria-controls','uzmedQabulGlobalDrawer');
    menu.addEventListener('click',()=>{
      // The embedded Qabul view uses the exact original UZMED sidebar.
      if(W.UZMED_QABUL_INLINE){
        if(W.UZMEDNavigation?.open){W.UZMEDNavigation.open();return;}
        // Sidebar module can be mounted just after auth. Do not navigate or reload.
        let count=0;const pending=W.setInterval(()=>{
          if(W.UZMEDNavigation?.open){W.clearInterval(pending);W.UZMEDNavigation.open();}
          else if(++count>=15)W.clearInterval(pending);
        },100);
        return;
      }
      const global=W.UZMEDQabulGlobalMenu;
      if(!global)return;
      if(global.isOpen())global.close();else global.open(menu);
    });
    const hero = el('section','qp-hero');
    const heroBadge = el('span','qp-hero-badge');heroBadge.append(ico('steth'));
    const heroCopy = el('div','qp-hero-copy');
    heroCopy.append(el('h1','', 'Shifokor qabuli'),el('p','', 'Bemorlarni qabul qilish, qidirish va boshqarish'));
    const heroArt=el('div','qp-hero-art');heroArt.append(ico('steth'));heroArt.setAttribute('aria-hidden','true');
    hero.append(heroBadge,heroCopy,heroArt);
    const tiles=el('div','qp-tiles');
    const tileButtons = new Map();
    for(const [key,label,detail,iconName] of options){
      const b=el('button','qp-tile qp-tile-'+key);b.type='button';b.dataset.choice=key;
      b.append(ico(iconName),el('strong','',label),el('small','',detail));
      const arrow=el('span','qp-tile-arrow');arrow.append(ico('chevron'));b.append(arrow);
      b.addEventListener('click',()=>W.UZMEDQabulStart?.choose?.(key));
      tileButtons.set(key,b);tiles.append(b);
    }
    function updateTiles() {
      for(const [key,b] of tileButtons){b.setAttribute('aria-pressed',String(key===chosen));}
    }
    // Main UZMED already owns theme and account controls.
    if(W.UZMED_QABUL_INLINE)root.prepend(hero,tiles);
    else root.prepend(top,hero,tiles);
    W.UZMEDQabulPremium={syncChoice(choice){chosen=choice;updateTiles();}};
    updateTiles();
    W.addEventListener('uzmed:auth-change',()=>{const label=profile.querySelector('.qp-profile-name');if(label)label.textContent=profileName();});
  }
  function boot(){
    const existing=D.getElementById('uzQabulEntry');
    if(existing){decorate(existing);return;}
    const host=D.querySelector('.screens')||D.getElementById('entryContent');
    if(!host){
      // The main UZMED app injects its .screens after the deferred scripts run.
      // Observe only until the real screen host exists, then watch that host.
      const hostWatch=new MutationObserver(()=>{
        if(!D.querySelector('.screens')&&!D.getElementById('entryContent'))return;
        hostWatch.disconnect();boot();
      });
      hostWatch.observe(D.documentElement,{childList:true,subtree:true});
      return;
    }
    const observer=new MutationObserver(()=>{const target=D.getElementById('uzQabulEntry');if(target){observer.disconnect();decorate(target);}});
    observer.observe(host,{childList:true,subtree:true});
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})(window,document);
