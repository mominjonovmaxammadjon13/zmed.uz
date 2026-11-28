/* UZMED · Telegram bot kodi bilan kirish (zmed.uz kirish oynasi).
   1) «Telegram orqali kirish» → «Botni ochish»: @uz_med_bot shu brauzer uchun ochilgan so‘rov bilan ochiladi.
   2) Bot 5 xonali kod yuboradi, foydalanuvchi uni kataklarga yozadi.
   Kod faqat shu brauzerdagi so‘rov uchun ishlaydi. Sessiya mavjud kirish mexanizmi orqali saqlanadi. */
(function(W,D){
 'use strict';
 if(W.__UZMED_TG_CODE_LOGIN_V1__)return;
 W.__UZMED_TG_CODE_LOGIN_V1__=true;
 const KEY='uzmed_tg_code_req_v1',BOT='uz_med_bot',LEN=5;
 const $=id=>D.getElementById(id);
 const svg=(d,size=20)=>'<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
 const I_SEND=svg('<path d="M21.5 3.5 2.8 10.6c-.9.3-.9 1.5 0 1.8l4.6 1.6 1.7 5.3c.2.8 1.2 1 1.8.4l2.6-2.5 4.6 3.4c.6.5 1.6.1 1.7-.7l2.9-15.2c.2-.9-.6-1.5-1.2-1.2Z"/><path d="m7.4 14 9.6-6.3-6.7 7.6"/>');
 const I_OPEN=svg('<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',16);
 const I_CHEV=svg('<path d="m6 9 6 6 6-6"/>',18);
 const CSS=`
 .uztg{display:grid;gap:10px;margin:4px 0 16px;color:#0f172a}
 #uzmedAuthSignedOut:has(#uzmedAuthResetPane:not([hidden])) .uztg{display:none}
 .uztg-btn{display:flex;align-items:center;gap:10px;width:100%;height:50px;margin:0;border-radius:12px;font-family:inherit;font-size:15px;font-weight:600;line-height:1;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent;transition:background-color .15s,border-color .15s}
 .uztg-tg{border:0;border-radius:999px;background:#1677b0;color:#fff;padding:0 20px}
 .uztg-tg:hover{background:#1170a8}.uztg-tg:active{background:#0f6aa0}
 .uztg-tg>svg{flex:none}
 .uztg-lbl{flex:1;text-align:left}
 .uztg-chev{display:grid;opacity:.85;transition:transform .2s}
 .uztg-tg[aria-expanded="true"] .uztg-chev{transform:rotate(180deg)}
 .uztg-panel{border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;padding:14px}
 .uztg-panel[hidden]{display:none}
 .uztg-step{display:grid;grid-template-columns:24px 1fr;gap:10px;align-items:start}
 .uztg-step+.uztg-step{margin-top:14px;padding-top:14px;border-top:1px solid #e2e8f0}
 .uztg-n{width:24px;height:24px;border-radius:50%;background:#e2e8f0;color:#334155;font-size:12px;font-weight:700;display:grid;place-items:center}
 .uztg-step.done .uztg-n{background:#dcfce7;color:#15803d}
 .uztg-t{font-size:14px;font-weight:600;line-height:24px;margin:0}
 .uztg-s{font-size:14px;color:#5b6b82;line-height:1.45;margin:2px 0 10px}
 .uztg-open{display:inline-flex;align-items:center;gap:6px;height:44px;padding:0 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-size:14px;font-weight:600;text-decoration:none}
 .uztg-open:hover{border-color:#94a3b8}
 .uztg-open[aria-disabled="true"]{opacity:.55;pointer-events:none}
 .uztg-otp{position:relative;display:grid;grid-template-columns:repeat(${LEN},1fr);gap:8px;max-width:290px;margin-top:8px}
 .uztg-cell{height:52px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;display:grid;place-items:center;font:600 22px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#0f172a;transition:border-color .12s,box-shadow .12s}
 .uztg-otp.focus .uztg-cell.cur{border-color:#1677b0;box-shadow:0 0 0 3px rgba(22,119,176,.2)}
 .uztg-otp.err .uztg-cell{border-color:#ef4444}
 .uztg-otp.busy .uztg-cell{opacity:.6}
 .uztg-otp input{position:absolute;inset:0;width:100%;height:100%;opacity:0;border:0;padding:0;margin:0;font-size:16px;color:transparent;caret-color:transparent;background:transparent;cursor:text}
 .uztg-msg{font-size:14px;line-height:1.45;margin:8px 0 0;color:#64748b}
 .uztg-msg:empty{display:none}
 .uztg-msg[data-kind="err"]{color:#dc2626}.uztg-msg[data-kind="ok"]{color:#15803d}
 .uztg-again{display:block;min-height:44px;border:0;background:none;padding:0;margin:0;font:inherit;font-size:14px;color:#1170a8;cursor:pointer;text-align:left}
 .uztg-again[hidden]{display:none}
 .uztg-sep{display:flex;align-items:center;gap:12px;color:#64748b;font-size:13px;margin:6px 0 0}
 .uztg-sep::before,.uztg-sep::after{content:"";flex:1;height:1px;background:#e2e8f0}
 .uztg .uz-auth-google{width:100%;margin:0;height:50px;box-shadow:none}
 /* Bosilganda darhol javob (Apple: pointer-down feedback) */
 .uztg-btn:active,.uztg-open:active,#uzmedAuthOverlay .uz-auth-btn:active{transform:scale(.97);transition:transform 100ms ease-out}
 .uztg-btn:focus-visible,.uztg-open:focus-visible,.uztg-again:focus-visible{outline:3px solid #1677b0;outline-offset:2px}
 .uztg-otp:focus-within{outline:none}
 /* Panel ochilishi: qisqa, tugmadan pastga; harakat kamaytirilsa — faqat paydo bo‘lish */
 .uztg-panel:not([hidden]){animation:uztgIn 180ms cubic-bezier(.2,.8,.2,1)}
 @keyframes uztgIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
 /* Kirish oynasidagi mayda yozuvlar o‘qilishi uchun (12px → 14px) va bosiladigan maydon 44px */
 #uzmedAuthOverlay#uzmedAuthOverlay#uzmedAuthOverlay .uz-auth-tab{font-size:14px!important}
 #uzmedAuthOverlay#uzmedAuthOverlay#uzmedAuthOverlay #uzAuthForgotBtn,#uzmedAuthOverlay#uzmedAuthOverlay#uzmedAuthOverlay .uz-auth-inline,#uzmedAuthOverlay#uzmedAuthOverlay#uzmedAuthOverlay .uz-auth-inline button{font-size:14px!important}
 #uzmedAuthOverlay#uzmedAuthOverlay#uzmedAuthOverlay .uz-auth-remember{min-height:44px!important;display:inline-flex!important;align-items:center;gap:8px}
 #uzmedAuthOverlay#uzmedAuthOverlay#uzmedAuthOverlay .uz-auth-remember span{font-size:14px!important}
 @media (prefers-reduced-motion:reduce){.uztg *,#uzmedAuthOverlay .uz-auth-btn{transition:none!important;animation:none!important}.uztg-btn:active,.uztg-open:active,#uzmedAuthOverlay .uz-auth-btn:active{transform:none}}
 @media (prefers-contrast:more){.uztg-panel,.uztg-cell,.uztg-open{border-color:#334155}.uztg-s,.uztg-sep{color:#334155}}
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
  code_locked:()=>'Ko‘p noto‘g‘ri urinish. Botni qayta oching va yangi kod oling.',
  code_expired:()=>'Kod eskirgan. Botni qayta oching va yangi kod oling.',
  code_request_expired:()=>'So‘rov eskirgan. Botni qayta oching.',
  code_not_issued:()=>'Avval botni oching — kod o‘sha yerga keladi.',
  phone_verification_required:()=>'Avval botda telefon raqamingizni tasdiqlang.',
  telegram_banned:()=>'Bu Telegram akkaunti uchun kirish cheklangan.',
  admin_email_login_required:()=>'Admin email yoki Google orqali kiradi.',
  entry_rate_limited:()=>'Juda ko‘p urinish. Bir daqiqadan keyin qayta urinib ko‘ring.',
  account_link_conflict:()=>'Bu Telegram boshqa UZMED akkauntiga bog‘langan. Admin bilan bog‘laning.'
 };
 const UNAVAILABLE='Ulanib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.';
 function el(tag,cls,text){const e=D.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}
 function mount(){
  const host=$('uzmedAuthSignedOut');
  if(!host)return false;
  if(host.querySelector('.uztg'))return true;
  const st=el('style');st.id='uztgCodeLoginCss';st.textContent=CSS;D.head.append(st);
  const wrap=el('section','uztg');wrap.setAttribute('aria-label','Telegram yoki Google orqali kirish');
  // Asosiy tugma
  const tg=el('button','uztg-btn uztg-tg');tg.type='button';tg.setAttribute('aria-expanded','false');tg.setAttribute('aria-controls','uztgPanel');
  tg.innerHTML=I_SEND;tg.append(el('span','uztg-lbl','Telegram orqali kirish'));const chev=el('span','uztg-chev');chev.innerHTML=I_CHEV;tg.append(chev);
  // Qadamlar
  const panel=el('div','uztg-panel');panel.id='uztgPanel';panel.hidden=true;
  const s1=el('div','uztg-step'),s1b=el('div');
  s1.append(el('span','uztg-n','1'),s1b);
  s1b.append(el('p','uztg-t','Botni oching'),el('p','uztg-s','@'+BOT+' sizga 5 xonali kod yuboradi. Yangi foydalanuvchi uchun akkaunt avtomatik ochiladi.'));
  const open=el('a','uztg-open');open.target='_blank';open.rel='noopener';open.href='https://t.me/'+BOT;open.setAttribute('aria-disabled','true');
  open.append(D.createTextNode('Botni ochish'));open.insertAdjacentHTML('beforeend',I_OPEN);s1b.append(open);
  const s2=el('div','uztg-step'),s2b=el('div');
  s2.append(el('span','uztg-n','2'),s2b);
  s2b.append(el('p','uztg-t','Kodni kiriting'));
  const otp=el('div','uztg-otp'),cells=[];
  for(let i=0;i<LEN;i++){const c=el('span','uztg-cell');cells.push(c);otp.append(c);}
  const input=el('input');input.id='uztgCode';input.inputMode='numeric';input.autocomplete='one-time-code';input.maxLength=LEN;input.pattern='[0-9]*';input.setAttribute('aria-label','Botdan kelgan 5 xonali kod');
  otp.append(input);
  const msg=el('p','uztg-msg');msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
  const again=el('button','uztg-again','Kod kelmadimi? Botni qayta ochish');again.type='button';again.hidden=true;
  s2b.append(otp,msg,again);
  panel.append(s1,s2);
  wrap.append(tg,panel);
  // Google tugmasi Telegramdan keyin turadi
  const g=$('uzAuthGoogleBtn');
  if(g){wrap.append(g);const old=$('uzmedAuthLoginPane')?.querySelector('.uz-auth-divider');if(old)old.hidden=true;}
  wrap.append(el('div','uztg-sep','yoki email bilan'));
  host.prepend(wrap);

  function say(text,kind){msg.textContent=text||'';msg.dataset.kind=kind||'';}
  function draw(){
   const v=input.value;
   cells.forEach((c,i)=>{c.textContent=v[i]||'';c.classList.toggle('cur',i===Math.min(v.length,LEN-1));});
  }
  let req=store(),preparing=null,busy=false;
  function apply(){if(req){open.href=req.bot;open.setAttribute('aria-disabled','false');}else{open.href='https://t.me/'+BOT;open.setAttribute('aria-disabled','true');}}
  function prepare(force){
   if(!force&&req)return Promise.resolve(req);
   if(preparing)return preparing;
   open.setAttribute('aria-disabled','true');
   preparing=post('/api/core/entry/code/begin',{}).then(d=>{
    if(typeof d.bot!=='string'||!/^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}\?start=web_[A-Za-z0-9_-]{43}$/.test(d.bot))throw Object.assign(new Error('entry_unavailable'),{code:'entry_unavailable'});
    req={request:d.request,bot:d.bot,exp:Date.now()+Math.max(60,Number(d.expires_in)||900)*1000};save(req);apply();return req;
   }).catch(e=>{apply();throw e;}).finally(()=>{preparing=null;});
   return preparing;
  }
  function toggle(show){
   panel.hidden=!show;tg.setAttribute('aria-expanded',String(show));
   if(show){prepare().then(()=>{if(msg.dataset.kind==='err'&&!busy)say('','');}).catch(e=>say(ERR[e.code]?ERR[e.code](e):UNAVAILABLE,'err'));}
  }
  apply();draw();
  tg.addEventListener('click',()=>toggle(panel.hidden));
  function opened(){s1.classList.add('done');again.hidden=false;say('Botdagi kodni shu yerga yozing.','');setTimeout(()=>input.focus({preventScroll:true}),500);}
  open.addEventListener('click',e=>{
   if(!req){e.preventDefault();prepare().then(r=>{opened();W.location.href=r.bot;}).catch(x=>say(ERR[x.code]?ERR[x.code](x):UNAVAILABLE,'err'));return;}
   opened();
  });
  again.addEventListener('click',()=>{
   const go=r=>{opened();W.open(r.bot,'_blank','noopener')||(W.location.href=r.bot);};
   if(req)go(req);else prepare().then(go).catch(x=>say(ERR[x.code]?ERR[x.code](x):UNAVAILABLE,'err'));
  });
  input.addEventListener('focus',()=>{otp.classList.add('focus');draw();});
  input.addEventListener('blur',()=>otp.classList.remove('focus'));
  input.addEventListener('input',()=>{
   const v=input.value.replace(/\D/g,'').slice(0,LEN);if(v!==input.value)input.value=v;
   otp.classList.remove('err');draw();
   if(v.length===LEN&&!busy)submit();
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&input.value.length===LEN)submit();});
  async function submit(){
   const code=input.value.replace(/\D/g,'');
   if(code.length!==LEN||busy)return;
   if(!req){say(ERR.code_not_issued(),'err');return;}
   busy=true;otp.classList.add('busy');input.readOnly=true;say('Tekshirilmoqda…','');
   try{
    const data=await post('/api/core/entry/code',{request:req.request,code});
    const s=data&&data.session;
    if(!s||typeof s.access_token!=='string'||typeof s.refresh_token!=='string')throw Object.assign(new Error('entry_unavailable'),{code:'entry_unavailable'});
    save(null);s2.classList.add('done');say('Kirildi. Sahifa yangilanmoqda…','ok');
    // Mavjud kirish mexanizmi (Google qaytishi bilan bir xil) sessiyani hash orqali qabul qiladi va darhol URLdan o‘chiradi.
    const p=new URLSearchParams({access_token:s.access_token,refresh_token:s.refresh_token,expires_in:String(Number(s.expires_in)||3600),token_type:'bearer'});
    W.location.hash=p.toString();W.location.reload();
   }catch(e){
    busy=false;otp.classList.remove('busy');input.readOnly=false;otp.classList.add('err');
    if(['code_locked','code_expired','code_request_expired'].includes(e.code)){save(null);req=null;s1.classList.remove('done');apply();prepare(true).catch(()=>{});}
    input.value='';draw();
    say(ERR[e.code]?ERR[e.code](e):UNAVAILABLE,'err');
    input.focus({preventScroll:true});
   }
  }
  // Bot ochilib sahifaga qaytilganda (so‘rov hali amal qilsa) panel ochiq turadi.
  if(req){toggle(true);s1.classList.add('done');again.hidden=false;}
  setInterval(()=>{if(req&&req.exp<=Date.now()+60000){req=null;save(null);apply();if(!panel.hidden)prepare().catch(()=>{});}},30000);
  return true;
 }
 let tries=0;
 (function retry(){if(mount()||++tries>80)return;setTimeout(retry,250);})();
})(window,document);
