/* UZMED · Telegram bot kodi bilan kirish (zmed.uz kirish oynasi).
   1) «Botdan kod olish» — @uz_med_bot shu brauzer uchun ochilgan so‘rov bilan ochiladi.
   2) Bot 5 xonali kod yuboradi, foydalanuvchi uni shu yerga yozadi.
   Kod faqat shu brauzerdagi so‘rov uchun ishlaydi. Sessiya mavjud kirish mexanizmi orqali saqlanadi. */
(function(W,D){
 'use strict';
 if(W.__UZMED_TG_CODE_LOGIN_V1__)return;
 W.__UZMED_TG_CODE_LOGIN_V1__=true;
 const KEY='uzmed_tg_code_req_v1',BOT='uz_med_bot';
 const $=id=>D.getElementById(id);
 const ICON_SEND='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>';
 const ICON_KEY='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8"/><path d="m16 7 3 3"/><path d="m19 4 2 2"/></svg>';
 const CSS=`
 .uztg-top{display:grid;gap:12px;margin:2px 0 14px}
 #uzmedAuthSignedOut:has(#uzmedAuthResetPane:not([hidden])) .uztg-top{display:none}
 .uztg-card{border:1px solid rgba(120,140,170,.28);border-radius:18px;padding:16px;background:rgba(127,150,190,.06)}
 .uztg-card h3{margin:0 0 4px;font-size:16px;font-weight:700;color:inherit}
 .uztg-steps{margin:0 0 12px;font-size:13px;line-height:1.5;opacity:.75}
 .uztg-get{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;min-height:50px;border-radius:14px;border:0;background:linear-gradient(180deg,#6ea8fe,#3b82f6);color:#fff;font-weight:600;font-size:15px;line-height:1.2;font-family:inherit;text-decoration:none;box-shadow:0 4px 0 #2f6fd8,0 8px 18px rgba(59,130,246,.28);cursor:pointer;-webkit-tap-highlight-color:transparent}
 .uztg-get[aria-disabled="true"]{opacity:.6;pointer-events:none}
 .uztg-row{display:grid;grid-template-columns:1fr auto;gap:10px;margin-top:12px}
 .uztg-code{min-width:0;height:50px;border-radius:14px;border:1px solid rgba(120,140,170,.35);background:rgba(255,255,255,.9);color:#111827;text-align:center;font:600 22px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.45em;padding:0 0 0 .45em;outline:none}
 .uztg-code:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.2)}
 .uztg-code::placeholder{color:#9aa3b2;letter-spacing:.45em}
 .uztg-go{display:flex;align-items:center;gap:7px;height:50px;padding:0 16px;border-radius:14px;border:0;background:#2d5fd3;color:#fff;font-weight:600;font-size:15px;line-height:1;font-family:inherit;cursor:pointer}
 .uztg-go:disabled{background:#8794ab;cursor:default}
 .uztg-msg{margin:10px 0 0;font-size:13px;line-height:1.45;min-height:0}
 .uztg-msg[data-kind="err"]{color:#d14343}.uztg-msg[data-kind="ok"]{color:#15803d}.uztg-msg[data-kind="info"]{opacity:.8}
 .uztg-foot{margin:10px 0 0;font-size:12.5px;text-align:center;opacity:.75}
 .uztg-foot a{color:#3b82f6;font-weight:600;text-decoration:none}
 .uztg-or{display:flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.08em;opacity:.6;text-transform:uppercase;margin:4px 0 2px}
 .uztg-or::before,.uztg-or::after{content:"";flex:1;height:1px;background:currentColor;opacity:.35}
 .uztg-top .uz-auth-google{width:100%;margin:0}
 `;
 function store(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');return v&&typeof v.request==='string'&&/^[A-Za-z0-9_-]{43}$/.test(v.request)&&v.exp>Date.now()+60000?v:null;}catch(_){return null;}}
 function save(v){try{v?localStorage.setItem(KEY,JSON.stringify(v)):localStorage.removeItem(KEY);}catch(_){}}
 async function post(path,body){
  const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),credentials:'omit',cache:'no-store',redirect:'error'});
  let data={};try{data=await r.json();}catch(_){}
  if(!r.ok){const e=new Error(data.error||'entry_unavailable');e.code=data.error||'entry_unavailable';e.left=data.left;e.status=r.status;throw e;}
  return data;
 }
 const ERR={
  code_invalid:e=>'Kod noto‘g‘ri.'+(Number.isInteger(e.left)?' Yana '+e.left+' ta urinish qoldi.':''),
  code_locked:()=>'Ko‘p noto‘g‘ri urinish. «Botdan kod olish»ni qayta bosing va yangi kod oling.',
  code_expired:()=>'Kod eskirgan. «Botdan kod olish»ni qayta bosing.',
  code_request_expired:()=>'Kirish so‘rovi eskirgan. «Botdan kod olish»ni qayta bosing.',
  code_not_issued:()=>'Avval «Botdan kod olish» tugmasini bosing va botdagi kodni yozing.',
  code_format_invalid:()=>'5 xonali kodni kiriting.',
  phone_verification_required:()=>'Avval @'+BOT+' botida telefon raqamingizni tasdiqlang.',
  telegram_banned:()=>'Bu Telegram akkaunti uchun kirish cheklangan.',
  admin_email_login_required:()=>'Admin email yoki Google orqali kirishi kerak.',
  entry_rate_limited:()=>'Juda ko‘p urinish. 1 daqiqadan keyin qayta urinib ko‘ring.',
  account_link_conflict:()=>'Bu Telegram boshqa UZMED akkauntiga bog‘langan. Admin bilan bog‘laning.'
 };
 function mount(){
  const host=$('uzmedAuthSignedOut');
  if(!host)return false;
  if(host.querySelector('.uztg-top'))return true;
  const st=D.createElement('style');st.id='uztgCodeLoginCss';st.textContent=CSS;D.head.append(st);
  const top=D.createElement('section');top.className='uztg-top';top.setAttribute('aria-label','Telegram yoki Google orqali kirish');
  const card=D.createElement('div');card.className='uztg-card';
  const h=D.createElement('h3');h.textContent='Telegram orqali kirish';
  const steps=D.createElement('p');steps.className='uztg-steps';steps.textContent='1. @'+BOT+' botidan 5 xonali kod oling. 2. Uni pastga yozing. Yangi foydalanuvchi uchun akkaunt avtomatik ochiladi.';
  const get=D.createElement('a');get.className='uztg-get';get.target='_blank';get.rel='noopener';get.href='https://t.me/'+BOT;get.setAttribute('aria-disabled','true');
  get.innerHTML=ICON_SEND;get.append(D.createTextNode('Botdan kod olish'));
  const row=D.createElement('div');row.className='uztg-row';
  const input=D.createElement('input');input.className='uztg-code';input.id='uztgCode';input.inputMode='numeric';input.autocomplete='one-time-code';input.maxLength=5;input.placeholder='•••••';input.setAttribute('aria-label','Botdan kelgan 5 xonali kod');input.pattern='[0-9]*';
  const go=D.createElement('button');go.type='button';go.className='uztg-go';go.disabled=true;go.innerHTML=ICON_KEY;go.append(D.createTextNode('Kirish'));
  row.append(input,go);
  const msg=D.createElement('p');msg.className='uztg-msg';msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
  const foot=D.createElement('p');foot.className='uztg-foot';foot.append(D.createTextNode('Yoki Telegram ichida foydalaning: '));
  const link=D.createElement('a');link.href='https://t.me/'+BOT;link.target='_blank';link.rel='noopener';link.textContent='@'+BOT;foot.append(link);
  card.append(h,steps,get,row,msg,foot);
  top.append(card);
  // Google tugmasi Telegram yonida turadi: ikkala tezkor yo‘l birinchi ko‘rinadi.
  const g=$('uzAuthGoogleBtn');
  if(g){const or=D.createElement('div');or.className='uztg-or';or.textContent='yoki';top.append(or,g);const oldDivider=$('uzmedAuthLoginPane')?.querySelector('.uz-auth-divider');if(oldDivider)oldDivider.hidden=true;}
  const or2=D.createElement('div');or2.className='uztg-or';or2.textContent='yoki email va parol bilan';top.append(or2);
  host.prepend(top);
  function say(text,kind){msg.textContent=text||'';msg.dataset.kind=kind||'';}
  let req=store(),preparing=null,busy=false;
  function apply(){if(req){get.href=req.bot;get.setAttribute('aria-disabled','false');}else{get.href='https://t.me/'+BOT;get.setAttribute('aria-disabled','true');}}
  async function prepare(force){
   if(!force&&req)return req;
   if(preparing)return preparing;
   get.setAttribute('aria-disabled','true');
   preparing=post('/api/core/entry/code/begin',{}).then(d=>{
    if(typeof d.bot!=='string'||!/^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}\?start=web_[A-Za-z0-9_-]{43}$/.test(d.bot))throw new Error('entry_unavailable');
    req={request:d.request,bot:d.bot,exp:Date.now()+Math.max(60,Number(d.expires_in)||900)*1000};save(req);apply();return req;
   }).catch(e=>{say(ERR[e.code]?ERR[e.code](e):'Kirish xizmati hozir javob bermadi. Birozdan keyin qayta urinib ko‘ring.','err');apply();throw e;}).finally(()=>{preparing=null;});
   return preparing;
  }
  apply();
  get.addEventListener('click',e=>{
   if(!req){e.preventDefault();prepare().then(r=>{W.location.href=r.bot;}).catch(()=>{});return;}
   say('Botdagi 5 xonali kodni pastga yozing.','info');setTimeout(()=>input.focus({preventScroll:true}),400);
  });
  input.addEventListener('input',()=>{
   const v=input.value.replace(/\D/g,'').slice(0,5);if(v!==input.value)input.value=v;
   go.disabled=v.length!==5||busy;if(v.length===5&&!busy)submit();
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.length===5)submit();});
  go.addEventListener('click',submit);
  async function submit(){
   const code=input.value.replace(/\D/g,'');
   if(code.length!==5||busy)return;
   if(!req){say(ERR.code_not_issued(),'err');return;}
   busy=true;go.disabled=true;say('Tekshirilmoqda…','info');
   try{
    const data=await post('/api/core/entry/code',{request:req.request,code});
    const s=data&&data.session;
    if(!s||typeof s.access_token!=='string'||typeof s.refresh_token!=='string')throw Object.assign(new Error('entry_unavailable'),{code:'entry_unavailable'});
    save(null);say('Kirildi. Sahifa yangilanmoqda…','ok');
    // Mavjud kirish mexanizmi (Google qaytishi bilan bir xil) sessiyani hash orqali qabul qiladi va darhol URLdan o‘chiradi.
    const p=new URLSearchParams({access_token:s.access_token,refresh_token:s.refresh_token,expires_in:String(Number(s.expires_in)||3600),token_type:'bearer'});
    try{sessionStorage.setItem('uzmed_tg_code_login_done','1');}catch(_){}
    W.location.hash=p.toString();W.location.reload();
   }catch(e){
    busy=false;
    if(['code_locked','code_expired','code_request_expired'].includes(e.code)){save(null);req=null;apply();prepare(true).catch(()=>{});input.value='';}
    say(ERR[e.code]?ERR[e.code](e):'Kirib bo‘lmadi. Qayta urinib ko‘ring.','err');
    go.disabled=input.value.length!==5;
   }
  }
  // So‘rov faqat kirish oynasi ko‘rinib turganda tayyorlanadi.
  const ready=()=>{if(!req&&card.offsetParent!==null&&!W.UZMEDAuth?.getState?.()?.loggedIn)prepare().catch(()=>{});};
  if('IntersectionObserver' in W){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting))ready();});io.observe(card);}else setTimeout(ready,800);
  setInterval(()=>{if(req&&req.exp<=Date.now()+60000){req=null;save(null);apply();ready();}},30000);
  return true;
 }
 let tries=0;
 (function retry(){if(mount()||++tries>80)return;setTimeout(retry,250);})();
})(window,document);
