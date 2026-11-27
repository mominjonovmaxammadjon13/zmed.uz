(function(W,D){'use strict';
if(W.__UZMED_CORE_TELEMETRY__)return;W.__UZMED_CORE_TELEMETRY__=true;
var originalFetch=W.fetch.bind(W),sessionKey='uzmed_core_session_v1';
function sid(){try{var x=sessionStorage.getItem(sessionKey);if(!x){x=(crypto.randomUUID?crypto.randomUUID():'web-'+Date.now()+'-'+Math.random().toString(36).slice(2));sessionStorage.setItem(sessionKey,x)}return x}catch(e){return 'web-'+Date.now()}}
var sessionId=sid(),started=false;
function userId(){try{var s=W.UZMEDAuth&&W.UZMEDAuth.getState&&W.UZMEDAuth.getState();return s&&s.user&&s.user.id?String(s.user.id):''}catch(e){return ''}}
function send(event_type,status,metadata,extra,attempt){
  var payload=Object.assign({event_type:event_type,status:status||'completed',session_id:sessionId,user_id:userId()||null,metadata:metadata||{}},extra||{});
  try{
    var A=W.UZMEDAuth;if(!A||typeof A.getAccessToken!=='function'){if((attempt||0)<2)setTimeout(function(){send(event_type,status,metadata,extra,(attempt||0)+1)},1000);return}
    Promise.resolve(A.getAccessToken()).then(function(t){
      if(!t)return;
      return originalFetch('/api/core/events',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify(payload),keepalive:true,credentials:'same-origin'});
    }).catch(function(){});
  }catch(e){}
}
function start(attempt){
  if(started)return;
  var logged=false;try{var st=W.UZMEDAuth&&W.UZMEDAuth.getState&&W.UZMEDAuth.getState();logged=!!(st&&st.loggedIn&&st.user);}catch(e){}
  if(!logged){if((attempt||0)<6)setTimeout(function(){start((attempt||0)+1)},700);return;}
  started=true;send('website.session_started','started',{route:location.pathname});
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',function(){start(0)},{once:true});else start(0);
W.addEventListener('uzmed:auth-change',function(e){var logged=!!(e&&e.detail&&e.detail.loggedIn);if(logged&&!started)start(0);send('website.user_active','completed',{action:logged?'signed_in':'signed_out'});});
D.addEventListener('click',function(e){
  var el=e.target&&e.target.closest&&e.target.closest('button,[data-mode],[data-section],[data-pg],a');if(!el)return;
  var module=el.getAttribute('data-mode')||el.getAttribute('data-section')||el.getAttribute('data-pg')||el.id||'ui';
  module=String(module).replace(/[^a-zA-Z0-9_.:-]/g,'').slice(0,80);if(!module)return;
  send('website.module_opened','completed',{module:module,action:'click'});
},{passive:true});
D.addEventListener('submit',function(e){
  var f=e.target;if(!f||!f.querySelector)return;
  var inp=f.querySelector('input[type=search],input[name*=search i],input[id*=search i],input[name=q],input[id*=query i]');
  if(!inp)return;
  var module=f.getAttribute('data-mode')||f.getAttribute('data-section')||f.id||inp.id||'search';
  send('website.search','completed',{module:String(module).replace(/[^a-zA-Z0-9_.:-]/g,'').slice(0,80),query_length:String(inp.value||'').length});
},true);
D.addEventListener('keydown',function(e){
  if(e.key!=='Enter')return;var inp=e.target;if(!inp||!inp.matches||!inp.matches('input[type=search],input[name*=search i],input[id*=search i],input[name=q],input[id*=query i]'))return;
  if(inp.form)return;
  var module=inp.getAttribute('data-mode')||inp.getAttribute('data-section')||inp.id||'search';
  send('website.search','completed',{module:String(module).replace(/[^a-zA-Z0-9_.:-]/g,'').slice(0,80),query_length:String(inp.value||'').length});
},true);
W.fetch=function(input,init){
  var u='';try{u=typeof input==='string'?input:(input&&input.url)||'';var parsed=new URL(u,location.href);if(parsed.origin!==location.origin||!parsed.pathname.startsWith('/api/ai'))return originalFetch(input,init)}catch(e){return originalFetch(input,init)}
  var at=Date.now(),meta={route:(new URL(u,location.href)).pathname};send('website.ai_request_started','started',meta);
  return originalFetch(input,init).then(function(r){
    var duration=Date.now()-at;
    try{r.clone().json().then(function(j){send('website.ai_request_completed',r.ok?'completed':'failed',meta,{duration_ms:duration,model_name:j&&j.model||null,provider:j&&j.provider||null});}).catch(function(){send('website.ai_request_completed',r.ok?'completed':'failed',meta,{duration_ms:duration});});}
    catch(e){send('website.ai_request_completed',r.ok?'completed':'failed',meta,{duration_ms:duration});}
    return r;
  }).catch(function(err){var timeout=/abort|timeout/i.test(String(err&&err.message||err));send(timeout?'website.timeout':'website.error',timeout?'timeout':'failed',meta,{duration_ms:Date.now()-at});throw err;});
};
W.UZMEDCoreTelemetry={send:send,sessionId:sessionId};
})(window,document);
