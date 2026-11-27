/* UZMED unified in-page drawer for Shifokor qabuli.
 * Mirrors the live main UZMED navigation labels. The hamburger NEVER navigates.
 * Other modules are opened only when the user explicitly selects their entry.
 */
(function(W,D){
  'use strict';
  if(new URLSearchParams(W.location.search).get('section')!=='qabul')return;
  if(W.UZMEDQabulGlobalMenu?.version===2)return;
  const sections=[
    {key:'legal',label:'Tibbiy huquq',icon:'scale',group:'medical'},
    {key:'sources',label:'Bo‘lim manbalari',icon:'file',group:'medical'},
    {key:'derma',label:'Dermatologiya · AI',icon:'image',group:'medical'},
    {key:'scores',label:'Klinik shkalalar',icon:'chart',group:'medical'},
    {key:'growth',label:'Pediatriya · o‘sish',icon:'growth',group:'medical'},
    {key:'patients',label:'Bemorlar',icon:'users',group:'clinical'},
    {key:'qabul',label:'Shifokor qabuli',icon:'briefcase',group:'clinical'},
    {key:'prices',label:'Dorixona va narxlar',icon:'pharmacy',group:'clinical'},
    {key:'history',label:'Suhbatlar tarixi',icon:'history',group:'account'},
    {key:'models',label:'AI modelni tanlash',icon:'sparkles',group:'account'},
    {key:'home',label:'Asosiy menyu',icon:'home',group:'account'},
    {key:'profile',label:'Akkaunt va profil',icon:'user',group:'account'},
    {key:'settings',label:'Sozlamalar',icon:'settings',group:'account'}
  ];
  const paths={
    menu:'M4 7h16M4 12h16M4 17h16',x:'M5 5l14 14M19 5 5 19',
    search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    chat:'M4 4h16v12H8l-4 4V4Z',scale:'M12 3v18M4 7l8-4 8 4M4 7l-3 7h6L4 7Zm16 0-3 7h6l-3-7ZM8 21h8',
    file:'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4',
    image:'M3 3h18v18H3zM3 17l6-6 4 4 3-3 5 5M15 8h2',
    chart:'M4 3v18h17M8 15v-5m5 5V6m5 9v-8',
    growth:'M4 3v18h17M7 15l5-5 3 3 6-7',users:'M16 21v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 6a4 4 0 0 1 0 7M21 21v-2a5 5 0 0 0-3-4.58',
    briefcase:'M4 7h16v14H4V7ZM8 7V4h8v3M12 11v6M9 14h6',
    pharmacy:'M3 6h18v15H3V6ZM3 6l3-3h12l3 3M10 12h4m-2-2v4',
    history:'M3 11a9 9 0 1 1 3 8M3 4v7h7M12 7v5l4 2',
    sparkles:'m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z',
    home:'M3 11l9-8 9 8v10h-7v-7h-4v7H3V11Z',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-2a8 8 0 0 1 16 0v2',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M4.9 4.9 7 7m10 10 2.1 2.1M2 12h3m14 0h3M4.9 19.1 7 17M17 7l2.1-2.1'
  };
  const create=(tag,cls,text)=>{const n=D.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const svg=key=>{const s=D.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.85');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');s.setAttribute('aria-hidden','true');const p=D.createElementNS(s.namespaceURI,'path');p.setAttribute('d',paths[key]||paths.home);s.append(p);return s;};
  let isOpen=false,previousFocus=null,previousOverflow='',drawer,backdrop,search,closeButton,menuButton,nav,empty;
  function ready(){
    if(drawer)return;
    backdrop=create('div','uqm-backdrop');backdrop.hidden=true;
    backdrop.addEventListener('click',close);
    drawer=create('aside','uqm-drawer');
    drawer.id='uzmedQabulGlobalDrawer';
    drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');
    drawer.setAttribute('aria-label','UZMED asosiy yon menyusi');
    drawer.setAttribute('aria-hidden','true');drawer.hidden=true;
    const head=create('div','uqm-head');
    const brand=create('strong','uqm-brand','UZMED');
    const chat=create('button','uqm-chat','Chat');chat.type='button';chat.prepend(svg('chat'));chat.addEventListener('click',()=>choose('chat'));
    closeButton=create('button','uqm-close');closeButton.type='button';closeButton.setAttribute('aria-label','Menyuni yopish');closeButton.append(svg('x'));closeButton.addEventListener('click',close);
    head.append(brand,chat,closeButton);drawer.append(head);
    const searchBox=create('div','uqm-search');searchBox.append(svg('search'));
    search=create('input');search.type='search';search.placeholder='Bo‘limni qidirish';search.setAttribute('aria-label','Bo‘limni qidirish');search.autocomplete='off';
    search.addEventListener('input',filter);searchBox.append(search);drawer.append(searchBox);
    nav=create('nav','uqm-list');nav.setAttribute('aria-label','UZMED bo‘limlari');
    const labels={medical:'',clinical:'SHIFOKOR ISH JARAYONI',account:'HISOB VA SOZLAMALAR'};
    for(const group of ['medical','clinical','account']){
      const block=create('section','uqm-group');block.dataset.group=group;
      if(labels[group])block.append(create('h2','uqm-group-name',labels[group]));
      for(const data of sections.filter(s=>s.group===group)){
        const b=create('button','uqm-link');b.type='button';b.dataset.target=data.key;b.dataset.label=data.label.toLowerCase();
        b.append(svg(data.icon),create('span','',data.label));
        if(data.key==='qabul')b.setAttribute('aria-current','page');
        b.addEventListener('click',()=>choose(data.key));
        block.append(b);
      }
      nav.append(block);
    }
    empty=create('p','uqm-empty','Bo‘lim topilmadi.');empty.hidden=true;nav.append(empty);drawer.append(nav);
    drawer.append(create('div','uqm-footer','UZMED · Klinik ish muhiti'));
    D.body.append(backdrop,drawer);
    D.addEventListener('keydown',keydown,true);
  }
  function filter(){
    if(!drawer)return;
    const q=search.value.toLocaleLowerCase('uz-UZ').trim().replace(/[’‘ʻʼ]/g,"'");
    let any=false;
    nav.querySelectorAll('.uqm-group').forEach(group=>{
      let matched=0;
      group.querySelectorAll('.uqm-link').forEach(button=>{
        const label=(button.dataset.label||'').replace(/[’‘ʻʼ]/g,"'");
        const hit=!q||label.includes(q);
        button.hidden=!hit;if(hit)matched++;
      });
      group.hidden=matched===0;if(matched)any=true;
    });empty.hidden=any;
  }
  function open(opener){
    ready();if(isOpen)return;
    isOpen=true;previousFocus=opener||D.activeElement;previousOverflow=D.body.style.overflow;
    D.body.style.overflow='hidden';D.documentElement.classList.add('uqm-open');
    drawer.hidden=false;backdrop.hidden=false;drawer.setAttribute('aria-hidden','false');
    if(menuButton)menuButton.setAttribute('aria-expanded','true');
    search.value='';filter();closeButton.focus({preventScroll:true});
  }
  function close(){
    if(!isOpen)return;
    isOpen=false;drawer.hidden=true;backdrop.hidden=true;drawer.setAttribute('aria-hidden','true');
    D.body.style.overflow=previousOverflow;D.documentElement.classList.remove('uqm-open');
    if(menuButton)menuButton.setAttribute('aria-expanded','false');
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }
  function keydown(e){
    if(!isOpen)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if(e.key!=='Tab')return;
    const visible=[...drawer.querySelectorAll('button:not([hidden]),input:not([hidden])')].filter(n=>!n.closest('[hidden]')&&!n.disabled);
    const first=visible[0],last=visible[visible.length-1];if(!first||!last)return;
    if(e.shiftKey&&D.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&D.activeElement===last){e.preventDefault();first.focus();}
  }
  function hasUnsavedPatient(){
    const form=D.getElementById('qpIntakeForm');if(!form)return false;
    return ['first_name','last_name','age','customSpecialty'].some(name=>form.elements.namedItem(name)?.value?.trim());
  }
  function choose(key){
    if(key==='patients'||key==='qabul'){
      const tile=D.querySelector('#uzQabulEntry .qp-tile[data-choice="'+(key==='patients'?'mine':'recent')+'"]');
      close();
      if(tile){tile.click();tile.scrollIntoView({block:'start',behavior:'auto'});}
      else W.UZMEDQabulStart?.choose?.(key==='patients'?'mine':'recent');
      return;
    }
    if(key==='profile'){close();W.UZMEDAuth?.open?.();return;}
    if(hasUnsavedPatient()&&!W.confirm('Yangi bemorning saqlanmagan ma’lumotlari yo‘qoladi. Boshqa bo‘limga o‘tasizmi?'))return;
    close();
    if(key==='legal'){W.location.assign('/assets/uzmed-tibbiy-huquq/index.html');return;}
    if(key==='home'){W.location.assign('/?telegram_miniapp=1');return;}
    const target=new URL('/?telegram_miniapp=1',W.location.origin);
    target.searchParams.set('uzmed_target',key);
    target.hash=W.location.hash;
    W.location.assign(target.href);
  }
  function capture(e){
    const button=e.target?.closest?.('#uzQabulEntry .qp-topbar button[aria-label="Menyuni ochish"]');
    if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();
    menuButton=button;
    if(isOpen)close();else open(button);
  }
  // Capture means this overrides old cached premium-menu JS as well.
  D.addEventListener('click',capture,true);
  W.UZMEDQabulGlobalMenu={version:2,open,close,isOpen:()=>isOpen};
})(window,document);
