(function(W,D){
'use strict';
if(W.__UZMED_PREMIUM_FLASH_UI_V1__)return;
W.__UZMED_PREMIUM_FLASH_UI_V1__=true;
var IDS=['deepseek/deepseek-v4.1-flash-1017','z-ai/glm-5.3-flash'];
var TITLES=['DeepSeek V4.1 Flash 1017','GLM 5.3 Flash'];
var state={allowed:false,owner:'',role:'',verifiedAt:0,checking:false};
W.UZMEDPremiumFlash={isAllowed:function(id){return state.allowed&&IDS.indexOf(id)!==-1},get allowed(){return state.allowed}};
function currentOwner(){try{var s=W.UZMEDAuth?.getState?.();return s?.loggedIn?String(s.user?.id||''):''}catch(e){return ''}}
function revoke(){
 state.allowed=false;state.role='';state.verifiedAt=0;
 var modal=D.getElementById('uzmedV5Modal');if(modal)modal.setAttribute('aria-hidden','true');
 var ns=W.UZMEDAIBackendV5;if(ns&&Array.isArray(ns.models)){
  for(var i=ns.models.length-1;i>=0;i--)if(ns.models[i]?.premiumFlash)ns.models.splice(i,1);
 }
}
function api(token){
 return new Promise(function(resolve){
  var xhr=new XMLHttpRequest();xhr.open('GET','/api/ai/premium-flash/status',true);
  xhr.timeout=10000;xhr.responseType='json';
  xhr.setRequestHeader('Authorization','Bearer '+token);
  xhr.onload=function(){resolve({ok:xhr.status===200,data:xhr.response||{}})};
  xhr.onerror=xhr.ontimeout=function(){resolve({ok:false,data:{}})};
  try{xhr.send()}catch(e){resolve({ok:false,data:{}})}
 });
}
async function check(){
 var owner=currentOwner();
 if(owner!==state.owner){revoke();state.owner=owner}
 if(!owner||state.checking||Date.now()-state.verifiedAt<45000)return;
 state.checking=true;state.verifiedAt=Date.now();
 try{
  var token=await W.UZMEDAuth?.getAccessToken?.();
  if(!token||owner!==currentOwner()){revoke();return}
  var response=await api(token);
  if(owner!==currentOwner()){revoke();return}
  state.allowed=!!(response.ok&&response.data?.allowed&&response.data?.available&&
   Array.isArray(response.data?.models)&&IDS.every(function(id){return response.data.models.some(function(m){return m.id===id})}));
  state.role=state.allowed?String(response.data.kind||'pro'):'';
  if(!state.allowed){revoke();state.verifiedAt=Date.now();}
 }catch(e){revoke()}finally{state.checking=false}
 sync();
}
function sync(){
 var ns=W.UZMEDAIBackendV5,owner=currentOwner();
 if(!ns||!Array.isArray(ns.models))return;
 if(!state.allowed||!owner||owner!==state.owner){
  for(var i=ns.models.length-1;i>=0;i--)if(ns.models[i]?.premiumFlash)ns.models.splice(i,1);
  return;
 }
 if(!ns.ready)return;
 // Only the verified models, and only once, go at the start of the picker.
 var present=ns.models.filter(function(m){return m?.premiumFlash});
 if(present.length===2&&present[0].kalit==='or:'+IDS[0]&&present[1].kalit==='or:'+IDS[1]){
  present.forEach(function(m){m.enabled=true});return;
 }
 for(var i=ns.models.length-1;i>=0;i--)if(ns.models[i]?.premiumFlash)ns.models.splice(i,1);
 for(var j=IDS.length-1;j>=0;j--){
  ns.models.unshift({kalit:'or:'+IDS[j],prov:'or',provNom:'UZMED PRO · OpenRouter',id:IDS[j],
   nom:TITLES[j],imk:['text'],vis:false,proOnly:true,premiumFlash:true,enabled:true,
   izoh:'Admin va faol UZMED PRO uchun · OpenRouter',ikon:'generic',vision:false,reasoning:true,tools:true,webSearch:false});
 }
 try{W.UZMEDAIHub?.yangila?.()}catch(e){}
}
function start(){check();sync();setInterval(function(){check();sync()},1500);W.addEventListener('uzmed:auth-change',function(){revoke();state.owner='';check()});D.addEventListener('visibilitychange',function(){if(!D.hidden){state.verifiedAt=0;check();sync()}})}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window,document);
