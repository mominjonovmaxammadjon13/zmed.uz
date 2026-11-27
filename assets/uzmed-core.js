(function(W,D){'use strict';
if(W.__UZMED_CORE_UI__)return;W.__UZMED_CORE_UI__=true;
var state={open:false,page:'overview',timer:null,three:null,agents:[],events:[],tasks:[]};
var pages=[
 ['overview','◫','Bosh sahifa'],['live','◉','Jonli'],['agents','🤖','Agentlar'],['tasks','📋','Vazifalar'],
 ['telegram','✈️','Telegram'],['website','🌐','Sayt'],['research','🔬','Tibbiy manbalar'],['models','🧠','Modellar'],['server','🖥','Server'],
 ['errors','🚨','Xatolar'],['security','🛡','Xavfsizlik'],['conversations','💬','Suhbatlar'],
 ['3d','◈','3D Boshqaruv markazi'],['chat','⌁','UZMED CORE suhbat']
];
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function fmtTime(v){try{return new Date(v).toLocaleString('uz-UZ',{hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'2-digit'})}catch(e){return esc(v)}}
function num(v){return Number(v||0).toLocaleString('uz-UZ')}
function bytes(v){v=Number(v)||0;if(v>1073741824)return (v/1073741824).toFixed(1)+' GB';if(v>1048576)return (v/1048576).toFixed(1)+' MB';return Math.round(v/1024)+' KB'}
async function credential(){
  try{
    if(W.__UZMED_TG_ADMIN_TOKEN)return {kind:'telegram',token:String(W.__UZMED_TG_ADMIN_TOKEN)};
    var t=W.UZMEDAuth&&W.UZMEDAuth.getAccessToken?await W.UZMEDAuth.getAccessToken():null;
    return t?{kind:'bearer',token:t}:null;
  }catch(e){return null}
}
async function api(path,opt){
  opt=opt||{};var c=await credential();if(!c)throw Error('Admin sessiyasi topilmadi. Qayta kiring.');
  var h=Object.assign({'Accept':'application/json'},opt.headers||{});
  if(c.kind==='telegram')h['X-UZMED-Telegram-Admin']=c.token;else h['Authorization']='Bearer '+c.token;
  if(opt.body!==undefined&&!h['Content-Type'])h['Content-Type']='application/json';
  var r=await fetch('/api/core'+path,{method:opt.method||'GET',headers:h,body:opt.body===undefined?undefined:JSON.stringify(opt.body),cache:'no-store'});
  var text=await r.text(),data={};try{data=text?JSON.parse(text):{}}catch(e){}
  if(!r.ok)throw Error(data.error||('HTTP '+r.status));return data;
}
function root(){
  var r=D.getElementById('uzcoreRoot');if(r)return r;
  r=D.createElement('div');r.id='uzcoreRoot';
  r.innerHTML='<div class="uzc-shell"><aside class="uzc-side"><div class="uzc-brand"><div class="uzc-orb"></div><span>UZMED ADMIN</span></div><nav class="uzc-nav">'+
    pages.map(function(p){return '<button data-core-page="'+p[0]+'"><b>'+p[1]+'</b> <span>'+p[2]+'</span></button>'}).join('')+
    '</nav></aside><main class="uzc-main"><header class="uzc-top"><div class="uzc-title" id="uzcTitle">UZMED CORE</div><div class="uzc-actions"><button class="uzc-btn" id="uzcRefresh">↻</button><button class="uzc-btn" id="uzcClose">✕</button></div></header><section class="uzc-content" id="uzcContent"></section></main></div>';
  D.body.appendChild(r);
  // Seven essential actions fit across the phone; the rest open in a real More menu.
  var nav=r.querySelector('.uzc-nav'),side=r.querySelector('.uzc-side');
  var more=D.createElement('button');more.id='uzcMoreToggle';more.textContent='☰';more.title='Boshqa bo‘limlar';
  var sheet=D.createElement('div');sheet.id='uzcMoreSheet';sheet.className='uzc-more-sheet';sheet.hidden=true;
  var mainPages=new Set(['overview','live','agents','tasks','3d','chat']);
  pages.filter(function(p){return !mainPages.has(p[0])}).forEach(function(p){
    var b=D.createElement('button');b.textContent=p[1]+' '+p[2];b.dataset.corePage=p[0];sheet.appendChild(b);
  });
  side.appendChild(sheet);nav.appendChild(more);
  more.onclick=function(){sheet.hidden=!sheet.hidden;more.classList.toggle('on',!sheet.hidden)};
  r.querySelectorAll('[data-core-page]').forEach(function(b){b.onclick=function(){
    sheet.hidden=true;more.classList.remove('on');show(b.dataset.corePage)
  }});

  r.querySelector('#uzcClose').onclick=close;r.querySelector('#uzcRefresh').onclick=function(){render(true)};
  return r;
}
function navOn(){var r=root();r.querySelectorAll('[data-core-page]').forEach(function(b){b.classList.toggle('on',b.dataset.corePage===state.page)});var p=pages.find(function(x){return x[0]===state.page});r.querySelector('#uzcTitle').textContent=p?p[2]:'UZMED CORE'}
function content(html){root().querySelector('#uzcContent').innerHTML=html}
function error(e){content('<div class="uzc-error">'+esc(e&&e.message||e)+'</div>')}
function card(k,v,s){return '<div class="uzc-card"><div class="uzc-k">'+esc(k)+'</div><div class="uzc-v">'+esc(v)+'</div><div class="uzc-sub">'+esc(s||'')+'</div></div>'}
var AGENT_UZ={'UZMED CORE':'UZMED bosh agenti','Medical Agent':'Mutaxassis agenti','Evidence Agent':'Manbalar agenti','Reviewer Agent':'Tekshiruvchi agent','MKB Agent':'MKB-10 agenti','Differential Agent':'Differensial agent','Tahlil Agent':'Tahlil agenti','Score Agent':'Klinik shkalalar agenti','DevOps Agent':'Server agenti'};
var AGENT_DESC={'UZMED CORE':'Barcha jarayonlarni boshqaradi','Medical Agent':'Mutaxassis tavsiyalar beradi','Evidence Agent':'Tibbiy manbalarni qidiradi','Reviewer Agent':'Ma’lumotlarni tekshiradi','MKB Agent':'MKB-10 kodlarini tekshiradi','Differential Agent':'Differensial diagnostika','Tahlil Agent':'Tahlil va xulosa qiladi','Score Agent':'Klinik shkalalarni baholaydi','DevOps Agent':'Server va xizmatlarni kuzatadi'};
function agentUz(v){return AGENT_UZ[String(v||'')]||String(v||'Noma’lum agent')}
function agentDesc(v){return AGENT_DESC[String(v||'')]||'UZMED subagenti'}
function statusUz(v){var x=String(v||'idle').toLowerCase(),uz={idle:'Bo‘sh',running:'Ishlayapti',started:'Ishlayapti',completed:'Tugadi',active:'Faol',waiting:'Navbatda',failed:'Xato',timeout:'Javob bermadi',cancelled:'Bekor qilindi',critical:'Jiddiy',error:'Xato',warning:'Ogohlantirish'};return uz[x]||String(v||'Bo‘sh')}
function pill(v){var x=String(v||'idle').toLowerCase(),c=/failed|critical|error/.test(x)?'failed':/running|started|completed|active/.test(x)?'running':/waiting/.test(x)?'waiting':/warning/.test(x)?'warning':'';return '<span class="uzc-pill '+c+'">'+esc(statusUz(v))+'</span>'}
function table(head,rows){return '<div class="uzc-table-wrap"><table class="uzc-table"><thead><tr>'+head.map(function(x){return '<th>'+esc(x)+'</th>'}).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>'}
async function overview(){
  var x=await Promise.all([api('/today'),api('/telegram'),api('/website'),api('/server'),api('/agents'),api('/errors?limit=8')]),today=x[0],tg=x[1],web=x[2],srv=x[3],agents=x[4].agents||[],errs=x[5].errors||[];
  state.agents=agents;
  var working=agents.filter(function(a){return /running|started/.test(a.status)}).length,waiting=agents.filter(function(a){return a.status==='waiting'}).length;
  content('<div class="uzc-grid">'+
    card('Telegram foydalanuvchilari',tg.total_users==null?'—':num(tg.total_users),'bugun faol '+num(tg.active_users)+' · yangi '+num(tg.new_users)+' · AI '+num(tg.ai_requests))+
    card('Sayt sessiyalari',num(web.sessions),'AI '+num(web.ai_requests)+' · faol '+num(web.active_users))+
    card('Ishlayotgan agentlar',working,'navbatda '+waiting+' · jami '+agents.length)+
    card('Jiddiy / Xato',num(today.severity&&today.severity.critical)+' / '+num(today.severity&&today.severity.error),'bugungi hodisalar')+
    card('CPU',srv.cpu_percent+'%','load '+Number(srv.load_1m||0).toFixed(2))+
    card('RAM',srv.ram_percent+'%',bytes((srv.ram_total_bytes||0)-(srv.ram_free_bytes||0))+' / '+bytes(srv.ram_total_bytes))+
    card('Disk',srv.disk_percent==null?'—':srv.disk_percent+'%','root filesystem')+
    card('Xizmatlar',[srv.processes&&srv.processes.backend,srv.processes&&srv.processes.telegram,srv.processes&&srv.processes.admin_bot].filter(function(v){return v==='active'}).length+'/3 ishlayapti','server · telegram · admin bot')+
  '</div><div class="uzc-two uzc-section"><div class="uzc-card"><h3>Agent holati</h3>'+agents.slice(0,9).map(function(a){return '<div style="display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-bottom:1px solid rgba(148,163,184,.08)"><span>'+esc(agentUz(a.agent_name))+'</span>'+pill(a.status)+'</div>'}).join('')+'</div><div class="uzc-card"><h3>So‘nggi xatolar</h3>'+(errs.length?errs.map(function(e){return '<div style="padding:7px 0;border-bottom:1px solid rgba(148,163,184,.08)"><b>'+esc(e.event_type)+'</b><div class="uzc-muted">'+fmtTime(e.created_at)+' · '+esc(e.status||e.severity)+'</div></div>'}).join(''):'<div class="uzc-empty">Xato event yo‘q</div>')+'</div></div>');
}
async function live(){
  var d=await api('/events?limit=100'),ev=d.events||[];state.events=ev;
  content('<div class="uzc-live">'+(ev.length?ev.map(function(e){return '<div class="uzc-event"><time>'+esc((e.created_at||'').slice(11,19))+'</time><div class="src">'+esc(e.source)+'</div><div class="msg">'+esc(e.event_type)+(e.agent_name?' · '+esc(e.agent_name):'')+'</div><div class="state">'+pill(e.status||e.severity)+'</div></div>'}).join(''):'<div class="uzc-empty">Event hali yo‘q</div>')+'</div>');
}
async function agents(){
  var d=await api('/agents'),a=d.agents||[];state.agents=a;
  content(table(['Agent','Holati','Hozirgi vazifa','Bosh agent','Model / Provayder','Oxirgi hodisa'],a.map(function(x){var t=x.current_task;return '<tr><td><b>'+esc(agentUz(x.agent_name))+'</b></td><td>'+pill(x.status)+'</td><td>'+(t?esc(t.title)+'<br><small>'+esc(t.id)+'</small>':'—')+'</td><td>'+esc(x.parent_agent||'—')+'</td><td>'+esc(x.model_name||'—')+'<br><small>'+esc(x.provider||'')+'</small></td><td>'+fmtTime(x.last_event_at||'')+'</td></tr>'})));
}
async function tasks(){
  var d=await api('/tasks?limit=100'),ts=d.tasks||[];state.tasks=ts;
  content('<div class="uzc-card"><h3>Yangi vazifa</h3><div class="uzc-form"><select class="uzc-select" id="uzcTaskAgent"><option value="DevOps Agent">Server agenti</option><option value="Reviewer Agent">Tekshiruvchi agent</option><option value="Evidence Agent">Manbalar agenti</option><option value="Medical Agent">Mutaxassis agenti</option><option value="Differential Agent">Differensial tashxis agenti</option><option value="Tahlil Agent">Tahlil agenti</option><option value="MKB Agent">MKB-10 agenti</option><option value="Score Agent">Klinik shkalalar agenti</option></select><input class="uzc-input" id="uzcTaskTitle" placeholder="Vazifa"><button class="uzc-btn primary" id="uzcTaskAdd">Vazifa berish</button></div></div><div class="uzc-section">'+table(['Agent','Vazifa','Holati','Boshlangan','Davomiyligi','Amal'],ts.map(function(t){var controls=['waiting','running','started'].includes(t.status)?'<button class="uzc-btn" data-act="pause" data-id="'+esc(t.id)+'">⏸</button> <button class="uzc-btn" data-act="resume" data-id="'+esc(t.id)+'">▶</button> <button class="uzc-btn danger" data-act="cancel" data-id="'+esc(t.id)+'">⛔</button>':'';return '<tr><td>'+esc(agentUz(t.agent_name))+'</td><td>'+esc(t.title)+'<br><small>'+esc(t.id)+'</small></td><td>'+pill(t.status)+'</td><td>'+fmtTime(t.started_at||t.created_at)+'</td><td>'+(t.duration_ms==null?'—':num(t.duration_ms)+' ms')+'</td><td>'+controls+'</td></tr>'}))+'</div>');
  var add=D.getElementById('uzcTaskAdd');if(add)add.onclick=async function(){var title=D.getElementById('uzcTaskTitle').value.trim(),agent=D.getElementById('uzcTaskAgent').value;if(!title)return;add.disabled=true;try{await api('/tasks',{method:'POST',body:{agent_name:agent,title:title}});await tasks()}catch(e){alert(e.message)}finally{add.disabled=false}};
  root().querySelectorAll('[data-act]').forEach(function(b){b.onclick=async function(){var action=b.dataset.act,id=b.dataset.id;try{var out=await api('/tasks/'+encodeURIComponent(id)+'/action',{method:'POST',body:{action:action}});if(out.requires_confirmation){if(confirm('⚠️ Taskni to‘xtatishni tasdiqlaysizmi?'))await api('/approvals/'+encodeURIComponent(out.approval_id)+'/confirm',{method:'POST',body:{}})}await tasks()}catch(e){alert(e.message)}}});
}
async function statPage(kind){
  var d=await api('/'+kind);
  var cards='',rows=[];
  if(kind==='telegram'){cards=card('Jami foydalanuvchilar',d.total_users==null?'—':num(d.total_users),'faol '+num(d.active_users)+' · yangi '+num(d.new_users))+card('So‘rovlar',num(d.requests),'AI '+num(d.ai_requests))+card('Xatolar',num(d.errors),'javob bermadi '+num(d.timeouts));rows=(d.modules||[]).map(function(x){return '<tr><td>'+esc(x.module||'—')+'</td><td>'+num(x.n)+'</td></tr>'});}
  else{cards=card('Sessiyalar',num(d.sessions),'faol '+num(d.active_users))+card('AI so‘rovlari',num(d.ai_requests),'bugun')+card('Xatolar',num(d.errors),'javob bermadi '+num(d.timeouts));rows=(d.modules||[]).map(function(x){return '<tr><td>'+esc(x.module||'—')+'</td><td>'+num(x.n)+'</td></tr>'});}
  content('<div class="uzc-grid">'+cards+'</div><div class="uzc-section"><h3>Eng ko‘p ishlatilgan bo‘limlar</h3>'+table(['Bo‘lim','Soni'],rows)+'</div>');
}

async function researchApi(path,opt){
  opt=opt||{};var c=await credential();if(!c)throw Error('Admin sessiyasi topilmadi. Qayta kiring.');
  var h={'Accept':'application/json'};
  if(c.kind==='telegram')h['X-UZMED-Telegram-Admin']=c.token;else h.Authorization='Bearer '+c.token;
  if(opt.body!==undefined)h['Content-Type']='application/json';
  var r=await fetch('/api/research'+path,{method:opt.method||'GET',headers:h,cache:'no-store',
    body:opt.body===undefined?undefined:JSON.stringify(opt.body),signal:AbortSignal.timeout(115000)});
  var data=await r.json().catch(function(){return {}});
  var messages={source_not_allowlisted:'WHO, PubMed, GINA, CDC yoki NICE sahifasining HTTPS havolasini kiriting.',
    url_must_have_no_credentials_or_query:'Havoladagi ? dan keyingi parametrlarni olib tashlang.',
    robots_disallow:'Manba bu sahifani avtomatik o‘qishga ruxsat bermaydi.',
    robots_policy_unavailable:'Manbaning o‘qish ruxsatini tekshirib bo‘lmadi. Boshqa sahifani tanlang.',
    source_too_large:'Bu sahifa juda katta. Bitta maqola yoki qisqaroq sahifani tanlang.',
    unsupported_content_type:'Hozir HTML sahifalar o‘qiladi. PDF o‘rniga uning rasmiy tavsif sahifasini kiriting.',
    redirect_not_allowed:'Havola boshqa manzilga yo‘naltiryapti. Sahifaning yakuniy HTTPS manzilini kiriting.',
    busy:'Boshqa manba o‘qilmoqda. Bir ozdan keyin qayta yuboring.',
    verified_models_temporarily_unavailable:'AI hozir javob bermadi. Keyinroq qayta urinib ko‘ring.',
    research_worker_unavailable:'Manbalarni o‘qish xizmati hozir javob bermadi.',
    source_evidence_insufficient:'Manbada tasdiqlash uchun yetarli matn topilmadi.',
    missing_auth:'Admin akkauntiga qayta kiring.',invalid_auth:'Admin akkauntiga qayta kiring.'};
  if(!r.ok)throw Error(messages[data.error]||'So‘rov bajarilmadi. Boshqa rasmiy manbani tanlang yoki qayta urinib ko‘ring.');
  return data;
}
function researchRecord(row){
  var data=row.data||{},facts=data.facts||[];
  return '<article class="uzc-card uzc-section"><h3>'+esc(data.title||'Tibbiy manba')+'</h3>'+
    '<p>'+esc(data.summary||'')+'</p><p class="uzc-muted">Tibbiy ko‘rib chiqishni kutmoqda · '+esc(fmtTime(row.retrieved_at))+'</p>'+
    '<a href="'+esc(row.source_url)+'" target="_blank" rel="noopener noreferrer" style="overflow-wrap:anywhere">'+esc(row.source_url)+'</a>'+
    facts.map(function(f){return '<div style="margin-top:14px"><b>'+esc(f.field)+'</b><p>'+esc(f.value)+'</p><blockquote style="margin:8px 0;padding:10px;border-left:3px solid #10b981;overflow-wrap:anywhere">'+esc(f.evidence_quote)+'</blockquote></div>'}).join('')+
    '<p class="uzc-muted">Manbadagi iqtiboslar matn bilan solishtirildi. Klinik to‘g‘rilikni shifokor tekshiradi.</p></article>';
}
async function research(){
  var x=await Promise.all([researchApi('/status'),researchApi('/records')]),health=x[0],records=x[1].records||[];
  var passed=(health.models||[]).filter(function(m){return m.status==='passed'&&m.model!=='openrouter/free'}).length;
  content('<style>#uzcResearchForm{display:grid;gap:14px;max-width:760px}#uzcResearchForm input[type=url]{font-size:16px;min-height:48px;width:100%;box-sizing:border-box}#uzcResearchForm fieldset{display:flex;gap:12px;flex-wrap:wrap;border:1px solid #64748b;border-radius:12px;padding:12px}#uzcResearchForm label.kind{display:flex;align-items:center;gap:8px;min-height:48px}#uzcResearchForm button{min-height:48px}#uzcResearchForm input:focus-visible{outline:3px solid #10b981;outline-offset:3px}</style>'+
    '<div class="uzc-grid">'+card('Manbalarni o‘qish',health.ready?'Tayyor':'Tekshiruv kutilmoqda','WHO · PubMed · GINA · CDC · NICE')+
    card('Sinovdan o‘tgan modellar',passed,'Bepul modellar')+card('Saqlangan natijalar',records.length,'Tibbiy ko‘rib chiqishni kutmoqda')+card('Neon qo‘shimcha baza',health.neon&&health.neon.connected?'Ulangan':'Ulanish tekshirilmoqda',health.neon&&health.neon.connected?num(health.neon.records_count)+' ta manba natijasi saqlangan':'Natijalar serverda saqlanadi; Neon bilan ulanish qayta tekshiriladi')+'</div>'+
    '<div class="uzc-card uzc-section"><h3>Tibbiy manbadan ma’lumot olish</h3>'+
    '<form id="uzcResearchForm" action="/api/research/extract" method="post">'+
    '<label for="uzcResearchUrl">Rasmiy sahifa havolasi</label><input class="uzc-input" id="uzcResearchUrl" name="url" type="url" inputmode="url" enterkeyhint="go" autocorrect="off" autocapitalize="off" spellcheck="false" required maxlength="450" aria-describedby="uzcResearchHelp" placeholder="https://www.who.int/...">'+
    '<p id="uzcResearchHelp" class="uzc-muted">WHO, PubMed, GINA, CDC yoki NICE saytidagi maqola havolasi. <button type="button" class="uzc-btn" id="uzcResearchExample">Astma bo‘yicha WHO sahifasi</button></p>'+
    '<fieldset><legend>Ma’lumot turi</legend><label class="kind"><input type="radio" name="kind" value="disease" checked> Kasallik</label><label class="kind"><input type="radio" name="kind" value="guideline"> Qo‘llanma</label><label class="kind"><input type="radio" name="kind" value="drug"> Dori</label></fieldset>'+
    '<button class="uzc-btn primary" type="submit" id="uzcResearchSubmit">Ma’lumotni ajratish</button>'+
    '<p id="uzcResearchStatus" role="status" aria-live="polite"></p></form>'+
    '<p class="uzc-muted">Natija alohida saqlanadi va klinik bazaga avtomatik qo‘shilmaydi.</p></div>'+
    '<div id="uzcResearchResult"></div><h3 class="uzc-section">Oxirgi natijalar</h3><div id="uzcResearchRecords">'+
    (records.length?records.map(researchRecord).join(''):'<p class="uzc-muted">Hali natija yo‘q. Yuqoridagi shakldan foydalaning.</p>')+'</div>');
  var form=D.getElementById('uzcResearchForm'),url=D.getElementById('uzcResearchUrl'),status=D.getElementById('uzcResearchStatus'),button=D.getElementById('uzcResearchSubmit');
  D.getElementById('uzcResearchExample').onclick=function(){url.value='https://www.who.int/news-room/fact-sheets/detail/asthma';url.focus()};
  form.onsubmit=async function(e){
    e.preventDefault();if(!form.reportValidity())return;button.disabled=true;form.setAttribute('aria-busy','true');status.textContent='Manba o‘qilmoqda va AI ma’lumotni ajratmoqda…';
    try{
      var out=await researchApi('/extract',{method:'POST',body:{url:url.value.trim(),kind:form.querySelector('input[name=kind]:checked').value}});
      if(state.page!=='research')return;
      D.getElementById('uzcResearchResult').innerHTML=researchRecord(out.record);
      status.textContent=out.neon&&out.neon.connected?'Tayyor. Natija server va Neon bazasida saqlandi. Tibbiy ko‘rib chiqishni kutmoqda.':'Natija serverda saqlandi. Neon nusxasi uchun natijalarni yangilang.';
    }catch(err){if(state.page==='research')status.textContent=err.name==='TimeoutError'?'So‘rov uzoq davom etdi. Oxirgi natijalarni yangilab tekshiring.':err.message}
    finally{button.disabled=false;form.removeAttribute('aria-busy')}
  };
}

async function models(){var d=await api('/models'),m=d.models||[];content(table(['Provayder','Model','Hodisalar','Tugagan','Xatolar','Javobsiz / Zaxira','O‘rtacha vaqt'],m.map(function(x){return '<tr><td>'+esc(x.provider)+'</td><td><b>'+esc(x.model_name)+'</b></td><td>'+num(x.events)+'</td><td>'+num(x.completed)+'</td><td>'+num(x.errors)+'</td><td>'+num(x.fallbacks)+' zaxira · '+num(x.rate_limits)+' limit</td><td>'+(x.avg_latency_ms==null?'—':num(x.avg_latency_ms)+' ms')+'</td></tr>'})));}
async function server(){var s=await api('/server');content('<div class="uzc-grid">'+card('CPU',s.cpu_percent+'%',s.cpu_count+' core')+card('RAM',s.ram_percent+'%',bytes(s.ram_total_bytes-s.ram_free_bytes)+' used')+card('Disk',s.disk_percent==null?'—':s.disk_percent+'%','root')+card('Uptime',Math.round((s.uptime_seconds||0)/3600)+' h',esc(s.hostname||''))+'</div><div class="uzc-section">'+table(['Process','State'],Object.keys(s.processes||{}).map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+pill(s.processes[k])+'</td></tr>'}))+'</div>');}
async function errors(){var d=await api('/errors?limit=150'),e=d.errors||[];content(table(['Vaqt','Daraja','Turi','Manba','Agent','Holati','Xabar'],e.map(function(x){return '<tr><td>'+fmtTime(x.created_at)+'</td><td>'+pill(x.severity)+'</td><td>'+esc(x.event_type)+'</td><td>'+esc(x.source)+'</td><td>'+esc(x.agent_name||'—')+'</td><td>'+pill(x.status||x.severity)+'</td><td>'+esc(x.message||'')+'</td></tr>'})));}
async function security(){
  var x=await Promise.all([api('/security-report'),api('/events?source=security&limit=150')]),d=x[0],e=x[1].events||[];
  content('<div class="uzc-grid">'+card('Tekshiruvdan o‘tdi',d.passed,'sayt · server · baza · ruxsatlar')+
    card('Aniqlangan muammolar',d.failed,'joriy tekshiruv')+card('Tarif cheklovi',d.plan_limited,'Supabase parol himoyasi')+'</div>'+
    '<div class="uzc-card uzc-section"><h3>UZMED xavfsizlik tekshiruvi</h3><p class="uzc-muted">Oxirgi tekshiruv: '+esc(fmtTime(d.checked_at))+
    '. Baza ruxsatlari va FTP sinovi: '+esc(fmtTime(d.evidence_checked_at))+'. Yangilash uchun yuqoridagi ↻ tugmasini bosing.</p>'+
    '<p>Tekshiruv ma’lumotlarni o‘qiydi; bazani, parollarni yoki kalitlarni o‘zgartirmaydi.</p></div>'+
    '<style>.uzc-security-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px}.uzc-security-checks h4{margin:0 0 8px}.uzc-security-checks p{white-space:normal;overflow-wrap:anywhere;line-height:1.5}</style><div class="uzc-section uzc-security-checks">'+(d.checks||[]).map(function(c){
      var label={passed:'✅ O‘tdi',failed:'❌ Muammo',unknown:'Tekshirilmadi',plan_limited:'Tarif cheklovi'}[c.status]||c.status;
      return '<article class="uzc-card"><h4>'+esc(c.name)+'</h4><p>'+esc(label)+'</p><p class="uzc-muted">'+esc(c.detail)+'</p></article>';
    }).join('')+'</div><h3 class="uzc-section">Xavfsizlik hodisalari</h3>'+table(['Vaqt','Daraja','Turi','Holati','Xabar'],e.map(function(x){return '<tr><td>'+fmtTime(x.created_at)+'</td><td>'+pill(x.severity)+'</td><td>'+esc(x.event_type)+'</td><td>'+pill(x.status||'')+'</td><td>'+esc(x.message||'')+'</td></tr>'})));
}

async function conversations(){
  var d=await api('/conversations?platform=telegram&limit=150'),rows=d.rows||[];
  content('<div class="uzc-card"><b>Admin suhbatlar ko‘ruvi</b><div class="uzc-sub">Faqat ko‘rish uchun. Suhbat matni hodisalar jurnaliga ko‘chirilmaydi; ko‘rish amali auditga yoziladi.</div></div><div class="uzc-section">'+(d.available?table(['Vaqt','Foydalanuvchi','Yo‘nalish','Bo‘lim','Xabar','Model','Javob vaqti'],rows.map(function(x){return '<tr><td>'+fmtTime(x.sent_at)+'</td><td>'+esc(x.first_name||'')+' '+esc(x.last_name||'')+'<br><small>'+esc(x.username?'@'+x.username:x.telegram_id)+'</small></td><td>'+esc(x.direction)+'</td><td>'+esc(x.section||'—')+'</td><td style="max-width:420px;white-space:pre-wrap">'+esc(x.text)+'</td><td>'+esc(x.model_name||'—')+'<br><small>'+esc(x.provider||'')+'</small></td><td>'+(x.latency_ms==null?'—':num(x.latency_ms)+' ms')+'</td></tr>'})):'<div class="uzc-empty">'+esc(d.reason||'Suhbatlar bazasi mavjud emas')+'</div>')+'</div>');
}
async function chat(){
  content('<div class="uzc-chat"><div class="uzc-chatlog" id="uzcChatLog"><div class="uzc-msg core"><b>UZMED CORE</b>\nReal monitoring ma’lumotlari asosida savol bering.</div></div><div class="uzc-compose"><textarea class="uzc-textarea" id="uzcChatInput" placeholder="Masalan: Telegram bot nega sekin?"></textarea><button class="uzc-btn primary" id="uzcChatSend">Yuborish</button></div></div>');
  var input=D.getElementById('uzcChatInput'),btn=D.getElementById('uzcChatSend'),log=D.getElementById('uzcChatLog');
  async function go(){var q=input.value.trim();if(!q)return;input.value='';log.insertAdjacentHTML('beforeend','<div class="uzc-msg me">'+esc(q)+'</div>');btn.disabled=true;try{var out=await api('/chat',{method:'POST',body:{text:q}});log.insertAdjacentHTML('beforeend','<div class="uzc-msg core"><b>UZMED CORE</b>\n'+esc(out.text||'')+(out.requires_confirmation?'<br><br><button class="uzc-btn danger" id="uzcApprove">✅ TASDIQLASH</button> <button class="uzc-btn" id="uzcReject">❌ BEKOR</button>':'')+'</div>');if(out.requires_confirmation){var a=D.getElementById('uzcApprove'),r=D.getElementById('uzcReject');a.onclick=async function(){var z=await api('/approvals/'+encodeURIComponent(out.approval_id)+'/confirm',{method:'POST',body:{}});log.insertAdjacentHTML('beforeend','<div class="uzc-msg core">'+esc(z.ok?'Tasdiqlandi.':z.error)+'</div>')};r.onclick=async function(){await api('/approvals/'+encodeURIComponent(out.approval_id)+'/reject',{method:'POST',body:{}});log.insertAdjacentHTML('beforeend','<div class="uzc-msg core">Bekor qilindi.</div>')}}}catch(e){log.insertAdjacentHTML('beforeend','<div class="uzc-msg core uzc-error">'+esc(e.message)+'</div>')}finally{btn.disabled=false;log.scrollTop=log.scrollHeight}}
  btn.onclick=go;input.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();go()}};
}
function labelSprite(THREE,text,color){
  var c=D.createElement('canvas'),x=c.getContext('2d');c.width=512;c.height=96;x.clearRect(0,0,c.width,c.height);x.fillStyle='rgba(5,9,17,.82)';x.roundRect(4,4,504,88,20);x.fill();x.strokeStyle=color;x.lineWidth=3;x.stroke();var fs=28;x.font='700 '+fs+'px Inter,Arial';while(x.measureText(String(text||'')).width>450&&fs>17){fs-=1;x.font='700 '+fs+'px Inter,Arial'}x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,48);var t=new THREE.CanvasTexture(c),m=new THREE.SpriteMaterial({map:t,transparent:true}),s=new THREE.Sprite(m);s.scale.set(3.8,.72,1);return s;
}
async function command3d(){
  content('<div class="uzc-3d-wrap"><canvas id="uzcore3d"></canvas><div class="uzc-stage-status" id="uzc3dStatus"><i></i> UZMED · Jonli 3D</div><div class="uzc-3d-help">Barmoq bilan aylantiring · Agentni bosing</div><button class="uzc-btn primary uzc-meet-toggle" id="uzcMeetToggle">🤝 Jamoaviy maslahat</button><section class="uzc-meet-panel" id="uzcMeetPanel" hidden><button class="uzc-btn uzc-meet-close" id="uzcMeetClose">✕</button><h3>Agentlar suhbatlashsin</h3><p>Mutaxassis → Manbalar → Tekshiruvchi → Bosh agent</p><textarea class="uzc-textarea" id="uzcMeetQuestion" maxlength="4900" placeholder="Klinik savol (bemorning shaxsiy ma’lumotlarisiz)"></textarea><button class="uzc-btn primary" id="uzcMeetStart">▶ Jamoaviy maslahatni boshlash</button><div id="uzcMeetState" class="uzc-meet-state">Faqat administrator boshlaydi. Har bosqichning haqiqiy natijasi keyingi agentga uzatiladi.</div></section><div class="uzc-agent-panel" id="uzcAgentPanel"></div></div>');
  var a=await api('/agents');state.agents=a.agents||[];state.events=[];var st=D.getElementById('uzc3dStatus');if(st)st.innerHTML='<i></i> UZMED · '+state.agents.filter(function(a){return /running|started/.test(a.status)}).length+' faol / '+state.agents.length+' agent';
  if(!state.three)state.three=await import('/assets/three.module.min.js');
  if(!state.sceneModule)state.sceneModule=await import('/assets/uzmed-core-medical-scene.js?v=20261009-clinic1');
  if(!state.motionModule)state.motionModule=await import('/assets/uzmed-core-motion.js?v=20261008-walk5');
  build3d(state.three,state.agents,state.events,state.sceneModule,state.motionModule);
}
function build3d(THREE,agents,handoffs,sceneModule,motionModule){
  var canvas=D.getElementById('uzcore3d');if(!canvas)return;
  var wrap=canvas.parentElement,w=Math.max(1,wrap.clientWidth),h=Math.max(1,wrap.clientHeight);
  var mobile=(W.matchMedia&&W.matchMedia('(max-width:700px)').matches)||(h>w*1.22);
  var scene=new THREE.Scene();scene.background=new THREE.Color(0x041018);scene.fog=new THREE.Fog(0x041018,mobile?24:19,mobile?48:42);

  var camera=new THREE.PerspectiveCamera(mobile?58:48,w/h,.1,120);
  var orbit=mobile
    ?{theta:0.02,phi:.80,r:19.4,target:new THREE.Vector3(0,1.35,2.1)}
    :{theta:.23,phi:1.03,r:23,target:new THREE.Vector3(0,1.45,0)};
  var minR=mobile?14:8,maxR=mobile?32:32;

  var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
  var pixelCap=mobile?1.15:1.6;renderer.setPixelRatio(Math.min(devicePixelRatio||1,pixelCap));renderer.setSize(w,h,false);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  if(renderer.outputColorSpace!==undefined&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;

  function mat(c,em,rough,metal,transparent,opacity){
    return new THREE.MeshStandardMaterial({color:c,roughness:rough==null?.58:rough,metalness:metal==null?.12:metal,emissive:c,emissiveIntensity:em==null?.04:em,transparent:!!transparent,opacity:opacity==null?1:opacity});
  }
  function addBox(parent,size,pos,color,em){
    var m=new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]),mat(color,em));m.position.set(pos[0],pos[1],pos[2]);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }

  scene.add(new THREE.HemisphereLight(0xbfefff,0x07121b,1.4));
  var key=new THREE.DirectionalLight(0xe9fbff,1.75);key.position.set(7,14,9);key.castShadow=true;key.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);scene.add(key);
  var teal=new THREE.PointLight(0x22d3ee,1.2,28);teal.position.set(-7,5,2);scene.add(teal);
  var green=new THREE.PointLight(0x34d399,1.15,24);green.position.set(7,4,-4);scene.add(green);

  // Clinical environment
  var floorW=mobile?13.5:25,floorD=mobile?22:20;
  var floor=new THREE.Mesh(new THREE.PlaneGeometry(floorW,floorD),new THREE.MeshStandardMaterial({color:0x0a1821,roughness:.72,metalness:.12}));
  floor.rotation.x=-Math.PI/2;floor.position.z=mobile?2:0;floor.receiveShadow=true;scene.add(floor);

  // Medical grid lines
  var gridGroup=new THREE.Group(),gridMat=new THREE.MeshBasicMaterial({color:0x164e63,transparent:true,opacity:.25});
  for(var gx=-Math.floor(floorW/2);gx<=Math.floor(floorW/2);gx+=2){var gl=new THREE.Mesh(new THREE.BoxGeometry(.018,.01,floorD),gridMat);gl.position.set(gx,.012,mobile?2:0);gridGroup.add(gl)}
  for(var gz=-Math.floor(floorD/2);gz<=Math.floor(floorD/2);gz+=2){var gl2=new THREE.Mesh(new THREE.BoxGeometry(floorW,.01,.018),gridMat);gl2.position.set(0,.013,(mobile?2:0)+gz);gridGroup.add(gl2)}
  scene.add(gridGroup);

  var backZ=mobile?-8.5:-9.6;
  var back=new THREE.Mesh(new THREE.BoxGeometry(floorW,6.4,.22),mat(0x071821,.02,.8,.05));back.position.set(0,3.2,backZ);scene.add(back);
  var sideW=mobile?floorD:20,left=new THREE.Mesh(new THREE.BoxGeometry(.22,6.4,sideW),mat(0x06151e,.02,.8,.05));left.position.set(-floorW/2,3.2,mobile?2:0);scene.add(left);
  var right=left.clone();right.position.x=floorW/2;scene.add(right);

  // Medical cross
  var cross=new THREE.Group();addBox(cross,[.32,1.72,.08],[0,0,0],0x34d399,1.3);addBox(cross,[1.72,.32,.08],[0,0,.01],0x34d399,1.3);
  cross.position.set(0,4.15,backZ+.16);scene.add(cross);
  var clinicTitle=labelSprite(THREE,'UZMED KLINIK AI MARKAZI','#67e8f9');clinicTitle.scale.multiplyScalar(mobile?.62:.78);clinicTitle.position.set(0,5.55,backZ+.24);scene.add(clinicTitle);

  // ECG pulse on back wall
  var ecgPts=[[-4.7,3.0],[-3.8,3.0],[-3.45,3.35],[-3.05,2.45],[-2.65,4.0],[-2.25,3.0],[-1.25,3.0],[-.85,3.18],[-.45,2.82],[0,3.0],[1.0,3.0],[1.4,3.35],[1.8,2.48],[2.2,3.95],[2.58,3.0],[4.7,3.0]];
  var ecgGeo=new THREE.BufferGeometry().setFromPoints(ecgPts.map(function(p){return new THREE.Vector3(p[0]*(mobile?.62:1),p[1],backZ+.18)}));
  var ecgLine=new THREE.Line(ecgGeo,new THREE.LineBasicMaterial({color:0x22d3ee,transparent:true,opacity:.58}));scene.add(ecgLine);

  // Central AI hub
  var hub=new THREE.Group();hub.position.set(0,0,backZ+2.15);
  var hubBase=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.7,.22,40),mat(0x0b2b2e,.18,.4,.25));hubBase.position.y=.13;hub.add(hubBase);
  var hubRing=new THREE.Mesh(new THREE.TorusGeometry(1.1,.075,14,72),mat(0x34d399,1.25,.35,.2,true,.95));hubRing.rotation.x=Math.PI/2;hubRing.position.y=.31;hub.add(hubRing);
  var hubOrb=new THREE.Mesh(new THREE.SphereGeometry(.42,24,18),mat(0x0ea5a8,1.4,.25,.15,true,.72));hubOrb.position.y=.75;hub.add(hubOrb);
  var coreText=labelSprite(THREE,'UZMED CORE','#34d399');coreText.scale.multiplyScalar(mobile?.58:.82);coreText.position.set(0,1.75,0);hub.add(coreText);scene.add(hub);

  var roomMotion=sceneModule.enhanceRoom(THREE,scene,{mobile:mobile,floorW:floorW,backZ:backZ});

  var clickable=[],byName=new Map(),statusColor={running:0x22c55e,started:0x22c55e,completed:0x34d399,waiting:0x38bdf8,failed:0xef4444,timeout:0xef4444,idle:0x64748b,cancelled:0x64748b};
  var roleStyle={
    'UZMED CORE':{scrub:0x064e3b,coat:0x10b981,accent:0x34d399,prop:'core'},
    'Medical Agent':{scrub:0x0f766e,coat:0xe5f7f5,accent:0x2dd4bf,prop:'steth'},
    'Differential Agent':{scrub:0x155e75,coat:0xe7f8ff,accent:0x22d3ee,prop:'steth'},
    'Tahlil Agent':{scrub:0x0369a1,coat:0xdbeafe,accent:0x60a5fa,prop:'lab'},
    'MKB Agent':{scrub:0x1d4ed8,coat:0xeff6ff,accent:0x818cf8,prop:'code'},
    'Score Agent':{scrub:0x0f766e,coat:0xccfbf1,accent:0x2dd4bf,prop:'score'},
    'Evidence Agent':{scrub:0x5b21b6,coat:0xf5f3ff,accent:0xa78bfa,prop:'tablet'},
    'Reviewer Agent':{scrub:0x166534,coat:0xecfdf5,accent:0x4ade80,prop:'steth'},
    'DevOps Agent':{scrub:0x1e3a5f,coat:0x1e293b,accent:0x38bdf8,prop:'server'}
  };

  function medicalProp(parent,role){
    var style=roleStyle[role]||roleStyle['Medical Agent'],p=new THREE.Group();p.position.set(.78,1.13,-.15);parent.add(p);
    if(style.prop==='lab'){
      var base=new THREE.Mesh(new THREE.CylinderGeometry(.13,.18,.08,14),mat(0x94a3b8));base.position.y=.06;p.add(base);
      var stem=addBox(p,[.08,.56,.08],[0,.32,0],0x94a3b8);stem.rotation.z=-.18;
      var lens=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.22,14),mat(0x67e8f9,.35));lens.rotation.z=Math.PI/2;lens.position.set(.12,.52,0);p.add(lens);
    }else if(style.prop==='server'){
      var tower=addBox(p,[.42,.85,.48],[0,.42,0],0x172554,.08);for(var i=0;i<3;i++){var led=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:i?0x22c55e:0x38bdf8}));led.position.set(.12,.22+i*.18,.245);p.add(led)}
    }else if(style.prop==='score'){
      var pad=addBox(p,[.62,.08,.54],[0,.08,0],0x134e4a,.18);for(var bx=-1;bx<=1;bx++)for(var bz=-1;bz<=1;bz++){var b=new THREE.Mesh(new THREE.BoxGeometry(.09,.035,.09),new THREE.MeshBasicMaterial({color:0x99f6e4}));b.position.set(bx*.15,.14,bz*.13);p.add(b)}
    }else if(style.prop==='code'){
      for(var k=0;k<3;k++){var book=addBox(p,[.62,.09,.4],[0,.06+k*.11,0],k===0?0x1d4ed8:k===1?0x2563eb:0x3b82f6,.08)}
    }else{
      var tablet=addBox(p,[.52,.055,.7],[0,.22,0],0x0f172a,.12);var glow=addBox(p,[.4,.02,.56],[0,.255,0],style.accent,.7);glow.material.transparent=true;glow.material.opacity=.65;
    }
  }

  function medicalPerson(role,boss){
    var style=roleStyle[role]||roleStyle['Medical Agent'],person=new THREE.Group();
    var body=new THREE.Mesh(new THREE.CapsuleGeometry(.27,.68,5,10),mat(style.scrub,.04,.62,.08));body.position.y=1.42;person.add(body);
    var coatL=addBox(person,[.24,.82,.05],[-.15,1.42,-.245],style.coat,.02),coatR=addBox(person,[.24,.82,.05],[.15,1.42,-.245],style.coat,.02);coatL.rotation.z=.03;coatR.rotation.z=-.03;
    var head=new THREE.Mesh(new THREE.SphereGeometry(.30,18,14),mat(0xd6a77a,.01,.8,0));head.position.y=2.1;person.add(head);
    var hair=new THREE.Mesh(new THREE.SphereGeometry(.305,18,10,0,Math.PI*2,0,Math.PI*.46),mat(role==='Reviewer Agent'?0x475569:0x3f3025));hair.position.y=2.16;person.add(hair);

    // Yuz va emotsiya elementlari: ko‘z, qorachiq, qosh va og‘iz.
    var eyeMat=mat(0xf8fafc,.02,.52,0),pupilMat=mat(0x10212b,.02,.75,0);
    var eyeL=new THREE.Mesh(new THREE.SphereGeometry(.052,10,8),eyeMat),eyeR=eyeL.clone();
    eyeL.position.set(-.095,2.105,-.276);eyeR.position.set(.095,2.105,-.276);person.add(eyeL);person.add(eyeR);
    var pupilL=new THREE.Mesh(new THREE.SphereGeometry(.024,9,7),pupilMat),pupilR=pupilL.clone();
    pupilL.position.set(-.095,2.102,-.322);pupilR.position.set(.095,2.102,-.322);person.add(pupilL);person.add(pupilR);
    var browL=addBox(person,[.115,.018,.018],[-.095,2.205,-.289],0x4a3328,.01),browR=addBox(person,[.115,.018,.018],[.095,2.205,-.289],0x4a3328,.01);
    var mouth=new THREE.Mesh(new THREE.TorusGeometry(.074,.011,6,18,Math.PI),new THREE.MeshBasicMaterial({color:0x7f1d1d}));
    mouth.position.set(0,1.995,-.294);mouth.rotation.z=Math.PI;person.add(mouth);
    person.userData.face={eyes:[eyeL,eyeR],pupils:[pupilL,pupilR],brows:[browL,browR],mouth:mouth};

    var armL=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.48,4,7),mat(style.coat,.02,.7,.03));armL.position.set(-.4,1.42,-.04);armL.rotation.z=-.38;person.add(armL);
    var armR=armL.clone();armR.position.x=.4;armR.rotation.z=.38;person.add(armR);
    var legL=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.5,4,7),mat(0x0f2740));legL.position.set(-.15,.62,0);person.add(legL);
    var legR=legL.clone();legR.position.x=.15;person.add(legR);
    person.userData.arms=[armL,armR];person.userData.legs=[legL,legR];person.userData.body=body;person.userData.head=head;person.userData.homeZ=.88;
    if(['Medical Agent','Differential Agent','Reviewer Agent'].includes(role)){
      var st=new THREE.Mesh(new THREE.TorusGeometry(.19,.022,7,24,Math.PI*1.35),new THREE.MeshBasicMaterial({color:0x0f172a}));st.position.set(0,1.68,-.29);st.rotation.z=.7;person.add(st);
    }
    if(role==='Tahlil Agent'){
      var cap=new THREE.Mesh(new THREE.SphereGeometry(.31,18,8,0,Math.PI*2,0,Math.PI*.42),mat(0xbfdbfe));cap.position.y=2.18;person.add(cap);
      var goggles=addBox(person,[.42,.08,.04],[0,2.12,-.29],0x67e8f9,.2);
    }
    if(role==='Evidence Agent'){
      var badge=addBox(person,[.20,.25,.025],[.13,1.52,-.285],0xa78bfa,.25);
    }
    if(boss){
      var halo=new THREE.Mesh(new THREE.TorusGeometry(.55,.035,10,40),new THREE.MeshBasicMaterial({color:0x34d399,transparent:true,opacity:.62}));halo.rotation.x=Math.PI/2;halo.position.y=2.7;person.add(halo);person.userData.halo=halo;
    }
    sceneModule.enhanceDoctor(THREE,person,role,boss);
    return person;
  }

  function worker(a,pos,boss,index){
    var g=new THREE.Group();g.position.copy(pos);g.userData.agent=a;g.userData.index=index||0;g.userData.base=pos.clone();
    if(mobile)g.scale.setScalar(boss?1.0:.98);
    var accent=statusColor[a.status]||0x64748b,style=roleStyle[a.agent_name]||roleStyle['Medical Agent'];

    // Medical workstation
    var platform=new THREE.Mesh(new THREE.CylinderGeometry(boss?2.2:1.85,boss?2.28:1.9,.09,32),mat(0x0b2630,.08,.58,.12,true,.9));platform.position.y=.045;platform.receiveShadow=true;g.add(platform);
    var ring=new THREE.Mesh(new THREE.TorusGeometry(boss?1.82:1.5,.035,8,42),new THREE.MeshBasicMaterial({color:style.accent,transparent:true,opacity:.22}));ring.rotation.x=Math.PI/2;ring.position.y=.1;g.add(ring);g.userData.ring=ring;

    var desk=new THREE.Mesh(new THREE.BoxGeometry(boss?3.8:2.85,.16,1.12),mat(boss?0x0f3d38:0x173447,.06,.48,.2));desk.position.y=.82;desk.castShadow=true;g.add(desk);
    [-1,1].forEach(function(s){var leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.75,.12),mat(0x0b1722));leg.position.set((boss?1.5:1.08)*s,.39,.35);g.add(leg)});

    var screenMat=mat(accent,/running|started/.test(a.status)?.85:.2,.35,.3);
    var monitor=new THREE.Mesh(new THREE.BoxGeometry(boss?1.65:1.22,.72,.07),screenMat);monitor.position.set(0,1.34,-.29);monitor.rotation.x=-.05;g.add(monitor);g.userData.screen=monitor;
    var monitorStand=addBox(g,[.08,.44,.08],[0,1.02,-.27],0x334155);
    // Medical cross on monitor
    var mx=addBox(g,[.08,.32,.015],[0,1.34,-.333],0xe6fffb,1),my=addBox(g,[.32,.08,.015],[0,1.34,-.334],0xe6fffb,1);

    // Ishlayotgan stol: klaviatura + suzuvchi tibbiy gologramma.
    var keyboard=addBox(g,[boss?1.05:.82,.055,.36],[0,.94,.18],0x0b1f2b,.08);
    for(var kk=-2;kk<=2;kk++){var keyDot=addBox(g,[.08,.018,.055],[kk*.13,.978,.18],style.accent,.65);keyDot.material.transparent=true;keyDot.material.opacity=.48}
    var holo=new THREE.Group();holo.position.set(boss?-1.28:-.88,1.72,-.18);
    var holoRing=new THREE.Mesh(new THREE.TorusGeometry(boss?.34:.27,.022,8,30),new THREE.MeshBasicMaterial({color:style.accent,transparent:true,opacity:.55}));
    var holoOrb=new THREE.Mesh(new THREE.SphereGeometry(boss?.095:.075,12,9),new THREE.MeshBasicMaterial({color:0x67e8f9,transparent:true,opacity:.78}));
    holo.add(holoRing);holo.add(holoOrb);g.add(holo);g.userData.holo=holo;g.userData.holoRing=holoRing;g.userData.holoOrb=holoOrb;

    medicalProp(g,a.agent_name);
    var person=medicalPerson(a.agent_name,boss);person.position.set(0,0,.88);g.add(person);g.userData.person=person;

    var chair=new THREE.Mesh(new THREE.BoxGeometry(.62,.68,.55),mat(0x111827));chair.position.set(0,.72,1.18);g.add(chair);

    var labelScale=mobile?.78:1,statusScale=mobile?.58:.65;
    var lab=labelSprite(THREE,agentUz(a.agent_name),'#'+style.accent.toString(16).padStart(6,'0'));lab.scale.multiplyScalar(labelScale);lab.position.set(0,mobile?2.78:3.12,0);g.add(lab);g.userData.nameSprite=lab;
    var status=labelSprite(THREE,agentDesc(a.agent_name)+' · '+statusUz(a.status),'#'+accent.toString(16).padStart(6,'0'));status.scale.multiplyScalar(statusScale);status.position.set(0,mobile?2.32:2.55,0);g.add(status);g.userData.statusSprite=status;
    if(!mobile&&a.current_task&&a.current_task.title){var tl=labelSprite(THREE,String(a.current_task.title).slice(0,30),'#38bdf8');tl.scale.multiplyScalar(.46);tl.position.set(0,2.05,0);g.add(tl);g.userData.taskSprite=tl}

    sceneModule.enhanceDesk(THREE,g,a.agent_name,boss);
    g.traverse(function(o){if(o.isMesh&&o!==platform&&o!==ring){o.castShadow=true;o.userData.agentGroup=g;clickable.push(o)}});scene.add(g);byName.set(a.agent_name,g);return g;
  }

  function disposeSprite(sp){if(!sp)return;sp.parent&&sp.parent.remove(sp);try{sp.material&&sp.material.map&&sp.material.map.dispose()}catch(_){}try{sp.material&&sp.material.dispose()}catch(_){}}
  function updateWorkerVisual(g,a){
    g.userData.agent=a;var accent=statusColor[a.status]||0x64748b,screen=g.userData.screen;
    if(screen&&screen.material){screen.material.color.setHex(accent);screen.material.emissive.setHex(accent);screen.material.emissiveIntensity=/running|started/.test(a.status)?.85:.2}
    if(g.userData.ring&&g.userData.ring.material)g.userData.ring.material.color.setHex(accent);
    disposeSprite(g.userData.statusSprite);var st=labelSprite(THREE,agentDesc(a.agent_name)+' · '+statusUz(a.status),'#'+accent.toString(16).padStart(6,'0'));st.scale.multiplyScalar(mobile?.58:.65);st.position.set(0,mobile?2.32:2.55,0);g.add(st);g.userData.statusSprite=st;
    disposeSprite(g.userData.taskSprite);g.userData.taskSprite=null;
    if(!mobile&&a.current_task&&a.current_task.title){var tl=labelSprite(THREE,String(a.current_task.title).slice(0,30),'#38bdf8');tl.scale.multiplyScalar(.46);tl.position.set(0,2.05,0);g.add(tl);g.userData.taskSprite=tl}
  }

  var normalized=agents.slice(),coreAgent=normalized.find(function(a){return a.agent_name==='UZMED CORE'})||{agent_name:'UZMED CORE',status:'idle'};
  var corePos=mobile?new THREE.Vector3(0,0,-5.6):new THREE.Vector3(0,0,-5.0);worker(coreAgent,corePos,true,0);
  var others=normalized.filter(function(a){return a.agent_name!=='UZMED CORE'});
  others.forEach(function(a,i){
    var pos;
    if(mobile){
      var row=Math.floor(i/2),col=i%2;
      pos=new THREE.Vector3(col===0?-2.20:2.20,0,-1.85+row*3.6);
    }else{
      var cols=4,rowD=Math.floor(i/cols),colD=i%cols;
      pos=new THREE.Vector3((colD-(cols-1)/2)*4.7,0,-.75+rowD*4.15);
    }
    worker(a,pos,false,i+1);
  });

  // No luminous connection lines: only agent movement conveys a real handoff.
  var teamMotion=motionModule.createAgentMotion(THREE,byName,wrap,canvas,camera);
  var meetPane=D.getElementById('uzcMeetPanel'),meetButton=D.getElementById('uzcMeetToggle');
  var meetStatus=D.getElementById('uzcMeetState');
  var meetId=null,meetShown=false;
  function showMeet(){meetShown=!meetShown;meetPane.hidden=!meetShown}
  if(meetButton)meetButton.onclick=showMeet;
  var meetClose=D.getElementById('uzcMeetClose');if(meetClose)meetClose.onclick=function(){meetShown=false;meetPane.hidden=true};
  function presentMeeting(x){
    if(!meetStatus||!x)return;
    var isBusy=x.status==='running',statuses=(x.stages||[]).map(function(z){return '<div>'+esc(agentUz(z.agent))+' · '+esc(statusUz(z.status))+'</div>'}).join('');
    var report=x.report||null;
    meetStatus.innerHTML='<strong>'+esc(x.status==='completed'?'Maslahat yakunlandi':isBusy?'Agentlar ishlayapti':x.status==='failed'?'Vazifada xato':'Kutilmoqda')+'</strong>'+statuses+
       (report?'<div class="uzc-meet-report"><strong>Mutaxassisning dastlabki fikri</strong><p>'+esc(report.preliminary_draft||'')+'</p><strong>Tekshiruv xulosasi</strong><p>'+esc(report.review_summary||'')+'</p><p>Manbalar: '+esc((report.sources||[]).length)+' · '+esc(report.verdict||'aniqlanmadi')+'</p><b>'+esc(report.warning||'Shifokor tekshiruvi talab qilinadi')+'</b></div>':'');
  }
  var meetStart=D.getElementById('uzcMeetStart');
  if(meetStart)meetStart.onclick=async function(){
    var q=D.getElementById('uzcMeetQuestion'),question=(q&&q.value||'').trim();
    if(question.length<12){if(meetStatus)meetStatus.textContent='Kamida 12 belgidan iborat klinik savol yozing.';return}
    meetStart.disabled=true;
    try{
      var out=await api('/council',{method:'POST',body:{question:question}});
      meetId=out.session.id;presentMeeting(out.session);if(q)q.value='';
    }catch(e){if(meetStatus)meetStatus.textContent='Maslahat boshlanmadi: '+e.message;meetStart.disabled=false}
  };
  async function syncMeeting(){
    try{
      if(!meetId){var active=await api('/council');if(active.sessions&&active.sessions.length)meetId=active.sessions[0].id}
      if(!meetId)return;
      var response=await api('/council/'+encodeURIComponent(meetId));
      presentMeeting(response.session);
      if(meetStart)meetStart.disabled=response.session.status==='running';
    }catch(e){if(meetStatus&&meetId)meetStatus.textContent='Holatni yangilashda xato: '+e.message}
  }
  syncMeeting();


  var syncing=false,last3dSync=0;
  async function sync3d(){
    if(syncing)return;syncing=true;
    try{
      var x=await Promise.all([api('/agents'),api('/events?source=agent&limit=250')]),latest=x[0].agents||[];
      agents.splice.apply(agents,[0,agents.length].concat(latest));
      latest.forEach(function(a){var g=byName.get(a.agent_name);if(g)updateWorkerVisual(g,a)});var badge=D.getElementById('uzc3dStatus');if(badge)badge.innerHTML='<i></i> UZMED · '+latest.filter(function(a){return /running|started/.test(a.status)}).length+' faol / '+latest.length+' agent';
      teamMotion.receive(x[1].events||[]);syncMeeting();
    }catch(_){}finally{syncing=false}
  }

  function updateCamera(){
    var sp=Math.sin(orbit.phi);camera.position.set(orbit.target.x+orbit.r*sp*Math.sin(orbit.theta),orbit.target.y+orbit.r*Math.cos(orbit.phi),orbit.target.z+orbit.r*sp*Math.cos(orbit.theta));camera.lookAt(orbit.target)
  }
  updateCamera();

  var dragging=false,moved=false,lx=0,ly=0,pointers=new Map(),pinchLast=0;
  canvas.style.touchAction='none';
  canvas.onpointerdown=function(e){dragging=true;moved=false;lx=e.clientX;ly=e.clientY;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId)};
  canvas.onpointermove=function(e){
    if(!dragging)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(Math.abs(e.clientX-lx)>4||Math.abs(e.clientY-ly)>4)moved=true;
    if(pointers.size>=2){var pts=[...pointers.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);if(pinchLast)orbit.r=Math.max(minR,Math.min(maxR,orbit.r+(pinchLast-dist)*.03));pinchLast=dist;updateCamera();return}
    pinchLast=0;orbit.theta-=(e.clientX-lx)*(mobile?.0045:.007);orbit.phi=Math.max(.48,Math.min(1.35,orbit.phi+(e.clientY-ly)*(mobile?.004:.006)));lx=e.clientX;ly=e.clientY;updateCamera();
  };
  canvas.onpointerup=function(e){pointers.delete(e.pointerId);pinchLast=0;dragging=pointers.size>0;try{canvas.releasePointerCapture(e.pointerId)}catch(_){}};
  canvas.onpointercancel=canvas.onpointerup;
  canvas.onwheel=function(e){e.preventDefault();orbit.r=Math.max(minR,Math.min(maxR,orbit.r+e.deltaY*.012));updateCamera()};

  var ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  canvas.onclick=function(e){
    if(moved)return;var rect=canvas.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;ray.setFromCamera(mouse,camera);
    var hit=ray.intersectObjects(clickable,false)[0];if(!hit)return;var g=hit.object.userData.agentGroup,a=g.userData.agent;
    orbit.target.copy(g.position).add(new THREE.Vector3(0,1.25,0));orbit.r=mobile?15:10;updateCamera();showAgentPanel(a);
  };

  async function showAgentPanel(a){
    var p=D.getElementById('uzcAgentPanel');if(!p)return;p.classList.add('on');
    var t=a.current_task,active=t&&['waiting','running','started'].includes(t.status);
    var children=agents.filter(function(x){return x.parent_agent===a.agent_name}).map(function(x){return agentUz(x.agent_name)});
    var taskControls='';
    if(t&&['running','started'].includes(t.status))taskControls='<button class="uzc-btn" id="uzc3dPause">⏸ Pauza</button> <button class="uzc-btn danger" id="uzc3dCancel">⛔ Bekor qilish</button>';
    else if(t&&t.status==='waiting')taskControls='<button class="uzc-btn primary" id="uzc3dResume">▶ Davom ettirish</button> <button class="uzc-btn danger" id="uzc3dCancel">⛔ Bekor qilish</button>';
    var newTask=active?'<div class="uzc-muted" style="margin-top:10px">Yangi vazifa berish uchun joriy vazifani tugating yoki bekor qiling.</div>':'<div class="uzc-form" style="margin-top:12px"><input class="uzc-input" id="uzc3dTaskText" placeholder="Agentga yangi vazifa yozing"><button class="uzc-btn primary" id="uzc3dTaskAdd">➕ Vazifa berish</button></div>';
    p.innerHTML='<button class="uzc-btn" style="float:right" id="uzc3dClose">✕</button><h3>'+esc(agentUz(a.agent_name))+'</h3>'+pill(a.status)+
      '<p><b>Hozirgi vazifa:</b><br>'+esc(t&&t.title||'—')+'</p><p><b>Boshlangan:</b> '+fmtTime(t&&t.started_at||t&&t.created_at||'')+'</p>'+
      '<p><b>Davomiyligi:</b> '+(t&&t.duration_ms!=null?num(t.duration_ms)+' ms':'—')+'</p><p><b>Bosh agent:</b> '+esc(agentUz(a.parent_agent||'—'))+'</p>'+
      '<p><b>Quyi agentlar:</b> '+esc(children.join(', ')||'—')+'</p><p><b>Model:</b> '+esc(a.model_name||'—')+' / '+esc(a.provider||'—')+'</p>'+
      (taskControls?'<div class="uzc-form" style="margin:10px 0">'+taskControls+'</div>':'')+newTask+
      '<div id="uzcAgentRecent" class="uzc-muted" style="margin-top:12px">So‘nggi hodisalar yuklanmoqda…</div>';
    var closeBtn=D.getElementById('uzc3dClose');if(closeBtn)closeBtn.onclick=function(){p.classList.remove('on');if(mobile){orbit.target.set(0,1.35,2.1);orbit.r=19.4;updateCamera()}};
    async function reloadPanel(){await sync3d();var latest=agents.find(function(x){return x.agent_name===a.agent_name})||a;return showAgentPanel(latest)}
    var add=D.getElementById('uzc3dTaskAdd');if(add)add.onclick=async function(){var input=D.getElementById('uzc3dTaskText'),title=String(input&&input.value||'').trim();if(!title){input&&input.focus();return}add.disabled=true;try{await api('/tasks',{method:'POST',body:{agent_name:a.agent_name,parent_agent:'UZMED CORE',title:title}});await reloadPanel()}catch(e){alert('Vazifa berilmadi: '+e.message);add.disabled=false}};
    async function action(kind){if(!t||!t.id)return;try{var out=await api('/tasks/'+encodeURIComponent(t.id)+'/action',{method:'POST',body:{action:kind}});if(out.requires_confirmation){if(!confirm('⚠️ Vazifani bekor qilishni tasdiqlaysizmi?'))return;await api('/approvals/'+encodeURIComponent(out.approval_id)+'/confirm',{method:'POST',body:{}})}await reloadPanel()}catch(e){alert('Amal bajarilmadi: '+e.message)}}
    var pause=D.getElementById('uzc3dPause'),resume=D.getElementById('uzc3dResume'),cancel=D.getElementById('uzc3dCancel');if(pause)pause.onclick=function(){action('pause')};if(resume)resume.onclick=function(){action('resume')};if(cancel)cancel.onclick=function(){action('cancel')};
    try{var dd=await api('/events?agent_name='+encodeURIComponent(a.agent_name)+'&limit=12'),ev=dd.events||[],recent=D.getElementById('uzcAgentRecent');if(recent)recent.innerHTML='<b>So‘nggi hodisalar</b><br>'+(ev.length?ev.map(function(x){return esc((x.created_at||'').slice(11,19))+' · '+esc(x.event_type)+' · '+esc(statusUz(x.status||x.severity))}).join('<br>'):'—')}catch(e){var recent=D.getElementById('uzcAgentRecent');if(recent)recent.textContent='So‘nggi hodisalar olinmadi.'}
  }

  var clock=new THREE.Clock(),alive=true,lastFrame=0,lastPresence=0,presenceBusy=false;
  function frame(){
    var now=performance.now();
    if((mobile&&now-lastFrame<29)||D.hidden){requestAnimationFrame(frame);return}
    lastFrame=now;
    if(!D.body.contains(canvas)){alive=false;try{ro&&ro.disconnect()}catch(_){}try{renderer.dispose()}catch(_){}return}
    var t=clock.getElapsedTime();if(t-last3dSync>1.8){last3dSync=t;sync3d()}
    hubRing.rotation.z=t*.35;hubOrb.position.y=.75+Math.sin(t*2)*.06;cross.rotation.z=Math.sin(t*.4)*.008;
    roomMotion(t);
    ecgLine.material.opacity=.42+Math.abs(Math.sin(t*2.8))*.24;
    byName.forEach(function(g){
      var a=g.userData.agent,p=g.userData.person;if(!p)return;
      var working=/running|started/.test(a.status),waiting=a.status==='waiting',failed=/failed|timeout/.test(a.status),completed=a.status==='completed';
      var ar=p.userData.arms,legs=p.userData.legs,body=p.userData.body,head=p.userData.head,face=p.userData.face,idx=g.userData.index||0;
      var breath=Math.sin(t*1.65+idx*.73),blink=Math.sin(t*2.15+idx*1.31)>.985?.10:1;

      // Har bir subagent tirik ko‘rinadi: nafas, ko‘z pirpirashi, qarash va mayda bosh harakati.
      p.position.y=breath*.014;
      if(body)body.position.y=1.42+breath*.018;
      if(head){head.rotation.y=Math.sin(t*.72+idx*.61)*.075;head.rotation.x=Math.sin(t*.48+idx*.37)*.025}
      if(face){
        face.eyes.forEach(function(e){e.scale.y=blink});
        face.pupils.forEach(function(e,j){e.scale.y=blink;e.position.x=(j?.095:-.095)+Math.sin(t*.58+idx*.9)*.010;e.position.y=.002+Math.cos(t*.44+idx)*.006});
        face.brows[0].rotation.z=.02;face.brows[1].rotation.z=-.02;
        face.mouth.rotation.z=Math.PI;face.mouth.scale.set(1,.18,1);
      }
      if(g.userData.holo){
        g.userData.holo.rotation.z=t*(working?.85:.28)+idx*.4;
        g.userData.holo.position.y=1.72+Math.sin(t*1.9+idx)*.055;
        if(g.userData.holoRing)g.userData.holoRing.material.opacity=(working?.58:.30)+Math.abs(Math.sin(t*2.4+idx))*(working?.28:.12);
        if(g.userData.holoOrb)g.userData.holoOrb.scale.setScalar(.86+Math.abs(Math.sin(t*2.8+idx))*.28);
      }

      if(working){
        // Ish holati: agent stol atrofida yuradi, qaytib kelib monitor/klaviaturada ishlaydi.
        var phase=(t*.13+idx*.17)%1,walk=0,px=0,pz=.88,rot=0;
        var side=(idx%2?1:-1)*1.05;
        if(phase<.18){var q=phase/.18;px=side*q;pz=.88;rot=(idx%2?-1:1)*.55;walk=1}
        else if(phase<.42){var q2=(phase-.18)/.24;px=side;pz=.88-1.55*q2;rot=Math.PI;walk=1}
        else if(phase<.58){px=side;pz=-.67;rot=Math.PI*.88;walk=0;ar[0].rotation.x=-.45+Math.sin(t*6)*.12;ar[1].rotation.x=-.15+Math.sin(t*6+1)*.08}
        else if(phase<.82){var q3=(phase-.58)/.24;px=side;pz=-.67+1.55*q3;rot=0;walk=1}
        else{var q4=(phase-.82)/.18;px=side*(1-q4);pz=.88;rot=(idx%2?1:-1)*-.55;walk=1}
        p.position.x=px;p.position.z=pz;p.rotation.y=rot;
        if(walk){
          legs[0].rotation.x=Math.sin(t*8)*.62;legs[1].rotation.x=Math.sin(t*8+Math.PI)*.62;
          ar[0].rotation.x=Math.sin(t*8+Math.PI)*.38;ar[1].rotation.x=Math.sin(t*8)*.38;
        }else{
          legs[0].rotation.x*=.70;legs[1].rotation.x*=.70;
          ar[0].rotation.x=-.67+Math.sin(t*9)*.10;ar[1].rotation.x=-.67+Math.sin(t*9+Math.PI)*.10;
        }
        if(head){head.rotation.x=-.06+Math.sin(t*2.2+idx)*.02;head.rotation.y=Math.sin(t*1.3+idx)*.04}
        if(face){
          face.brows[0].rotation.z=.14;face.brows[1].rotation.z=-.14;
          face.mouth.rotation.z=Math.PI;face.mouth.scale.set(.92,.48,1);
        }
        if(g.userData.screen)g.userData.screen.material.emissiveIntensity=.72+Math.abs(Math.sin(t*5))* .42;
      }else{
        p.position.x*=.84;p.position.z+=(.88-p.position.z)*.15;p.rotation.y*=.82;
        legs[0].rotation.x*=.75;legs[1].rotation.x*=.75;ar[0].rotation.x*=.78;ar[1].rotation.x*=.78;

        // Bo‘sh agent ham qotib turmaydi: vaqti-vaqti bilan bir-ikki qadam, atrofga qarash.
        var idlePhase=(t*.055+idx*.121)%1;
        if(!waiting&&!failed&&!completed&&idlePhase>.58&&idlePhase<.74){
          var iq=(idlePhase-.58)/.16,step=Math.sin(iq*Math.PI)*.28*(idx%2?1:-1);
          p.position.x=step;legs[0].rotation.x=Math.sin(iq*Math.PI*4)*.24;legs[1].rotation.x=-legs[0].rotation.x;
          if(head)head.rotation.y=(idx%2?1:-1)*.18;
        }

        if(waiting){
          // Kutish: boshni biroz egish, qo‘lni iyakka olib borish, ko‘z bilan kuzatish.
          ar[0].rotation.x=-.78+Math.sin(t*2.2+idx)*.05;ar[1].rotation.x=-.12;
          if(head){head.rotation.z=(idx%2?1:-1)*.055;head.rotation.y=Math.sin(t*.9+idx)*.16}
          if(face){face.brows[0].rotation.z=-.08;face.brows[1].rotation.z=.08;face.mouth.scale.set(.72,.12,1)}
          if(g.userData.ring)g.userData.ring.material.opacity=.16+Math.abs(Math.sin(t*3))* .42;
        }else if(failed){
          // Xato: xavotir/frown va bosh chayqash.
          if(head){head.rotation.y=Math.sin(t*7.5+idx)*.16;head.rotation.x=.035}
          ar[0].rotation.x=.22;ar[1].rotation.x=.22;
          if(face){face.brows[0].rotation.z=-.24;face.brows[1].rotation.z=.24;face.mouth.rotation.z=0;face.mouth.scale.set(1,.62,1)}
          if(g.userData.ring)g.userData.ring.material.opacity=.22+Math.abs(Math.sin(t*6))* .5;
        }else if(completed){
          // Tugadi: tabassum + qo‘l silkitish.
          ar[1].rotation.x=-1.02+Math.sin(t*5.5+idx)*.24;ar[0].rotation.x=-.12;
          p.position.y+=Math.abs(Math.sin(t*2.6+idx))*.025;
          if(head)head.rotation.y=Math.sin(t*2+idx)*.08;
          if(face){face.brows[0].rotation.z=.04;face.brows[1].rotation.z=-.04;face.mouth.rotation.z=Math.PI;face.mouth.scale.set(1.08,.72,1)}
          if(g.userData.ring)g.userData.ring.material.opacity=.22+Math.abs(Math.sin(t*2))* .28;
        }else{
          // Idle: sokin tabassum, yengil qo‘l/ko‘z harakati.
          ar[0].rotation.x=Math.sin(t*.9+idx)*.045;ar[1].rotation.x=Math.sin(t*.9+idx+1.2)*.045;
          if(face)face.mouth.scale.set(.82,.28,1);
          if(g.userData.ring)g.userData.ring.material.opacity=.18;
        }
      }
      if(g.userData.screen&&failed)g.userData.screen.material.emissiveIntensity=.2+Math.abs(Math.sin(t*6))*1.0;
      if(p.userData.halo)p.userData.halo.rotation.z=t*.8;
    });
    teamMotion.tick(t);
    // Send only actual scene activity; Admin bot reports it as sampled data.
    if(t-lastPresence>8&&!presenceBusy&&state.open&&state.page==='3d'){
      lastPresence=t;presenceBusy=true;
      var moving=new Set(teamMotion.movingAgents());
      byName.forEach(function(g,name){var a=g.userData.agent;
        if(!/running|started/.test(a.status))return;
        var idx=g.userData.index||0,phase=(t*.13+idx*.17)%1;
        if(phase<.42||phase>=.58)moving.add(name);
      });
      api('/animation',{method:'POST',body:{moving_agents:Array.from(moving),active_agents:Array.from(byName.values()).filter(function(g){return /running|started/.test(g.userData.agent.status)}).length}})
        .catch(function(){}).finally(function(){presenceBusy=false});
    }
    renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  var ro=new ResizeObserver(function(){if(!alive)return;var nw=Math.max(1,wrap.clientWidth),nh=Math.max(1,wrap.clientHeight);camera.aspect=nw/nh;camera.updateProjectionMatrix();renderer.setSize(nw,nh,false)});ro.observe(wrap);
}
async function render(force){navOn();try{
  if(state.page==='overview')return overview();if(state.page==='live')return live();if(state.page==='agents')return agents();if(state.page==='tasks')return tasks();if(state.page==='telegram')return statPage('telegram');if(state.page==='website')return statPage('website');if(state.page==='research')return research();if(state.page==='models')return models();if(state.page==='server')return server();if(state.page==='errors')return errors();if(state.page==='security')return security();if(state.page==='conversations')return conversations();if(state.page==='chat')return chat();if(state.page==='3d')return command3d();
}catch(e){error(e)}}
function show(p){state.page=p;render(true)}
async function open(page){if(typeof page==='string'&&pages.some(function(p){return p[0]===page}))state.page=page;var r=root();r.classList.add('open');state.open=true;show(state.page||'overview');clearInterval(state.timer);state.timer=setInterval(function(){if(!state.open||['chat','conversations','tasks','3d','research','security'].includes(state.page))return;render(false)},5000)}
function close(){state.open=false;clearInterval(state.timer);if(W.__UZMED_TG_ADMIN_TOKEN&&W.Telegram&&W.Telegram.WebApp){try{W.Telegram.WebApp.close();return}catch(e){}}root().classList.remove('open')}
function inject(){
  var sb=D.getElementById('uaSb');if(!sb||D.getElementById('uzcoreNavBtn'))return;
  var btn=D.createElement('button');btn.className='ua-nb';btn.id='uzcoreNavBtn';btn.innerHTML='<span class="ua-nb-ic">🧊</span>3D Boshqaruv';btn.onclick=function(e){e.preventDefault();state.page='3d';open()};var sec=D.createElement('div');sec.className='ua-nav-sec';sec.appendChild(btn);sb.appendChild(sec);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',function(){setTimeout(inject,200)});else setTimeout(inject,200);
setTimeout(inject,900);setTimeout(inject,2000);
W.UZMEDCore={open:open,close:close,show:show,refresh:render,api:api};
})(window,document);
