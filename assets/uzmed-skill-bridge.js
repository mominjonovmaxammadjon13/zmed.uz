(function(){
  'use strict';
  if(window.__UZMED_SKILL_BRIDGE__)return;
  window.__UZMED_SKILL_BRIDGE__=true;

  var contextCache=new Map();
  var CONTEXT_TTL=45000;

  var liveControllers=new Set(),activeTask=null,loaderPromise=null;
  function epoch(){return (window.UZMEDAIBackendV5||{}).epoch||0;}
  function guard(){var g={owner:clinicalOwner(),epoch:epoch(),history:window.aiHistory,controller:new AbortController()};liveControllers.add(g.controller);return g;}
  function valid(g){return !g.controller.signal.aborted&&g.owner===clinicalOwner()&&g.epoch===epoch()&&g.history===window.aiHistory;}
  function check(g){if(!valid(g))throw new DOMException('So‘rov bekor qilindi','AbortError');}
  function progress(detail){window.dispatchEvent(new CustomEvent('uzmed:file-progress',{detail:detail}));}
  function abortRequests(){liveControllers.forEach(c=>c.abort());liveControllers.clear();if(activeTask){activeTask=null;var i=document.getElementById('uzmedV5Input'),b=document.getElementById('uzmedV5SendBtn');if(i)i.disabled=false;if(b)b.disabled=false;window.aiTyping=false;progress({phase:'cancelled'});}}
  function newCase(q){return /(?:^|[.!?\n]\s*)(?:yangi bemor|boshqa bemor|yangi klinik holat|new patient|another patient|новый пациент)\b/i.test(String(q));}
  function conversationFile(q){var C=window.UZMEDConversations;if(newCase(q)){C?.setFileContext?.({text:'',summary:[]});return '';}return C?.fileContext?.()?.text||'';}
  function nativeState(g){var N=window.UZMEDAIBackendV5;return N&&N.clinicalOwner===g.owner&&N.clinicalHistoryRef===g.history?N.clinicalState||null:null;}
  function rememberState(g,data){check(g);var N=window.UZMEDAIBackendV5;if(N&&data.clinicalState&&typeof data.clinicalState==='object'){N.clinicalOwner=g.owner;N.clinicalHistoryRef=g.history;N.clinicalState=data.clinicalState;}}
  function transportBudget(ctx,value){if(window.UZMED_FILE_EVIDENCE_POLICY==='independent-24000')return;var raw={file:String(value||'').trim(),baza:String(ctx.bazaContext||'').trim(),internet:String(ctx.internetContext||'').trim()},active=Object.keys(raw).filter(k=>raw[k].length),caps={file:0,baza:0,internet:0};active.forEach(k=>caps[k]=Math.min(raw[k].length,Math.floor(5000/active.length)));var left=5000-Object.values(caps).reduce((a,b)=>a+b,0);active.forEach(k=>{var add=Math.min(left,raw[k].length-caps[k]);caps[k]+=add;left-=add;});if(raw.file.length>caps.file)throw Error('Hujjat matni joriy server limitiga sig‘madi. PDF sahifalarini tanlang yoki faylni qismlarga ajrating. Matn kesilmadi.');}
  function combinedFile(a,b){var x=[a,b].filter(Boolean).join('\n\n');if(x.length>24000)throw Error('Fayl konteksti juda katta. PDF sahifalarini tanlang; matn tashlab yuborilmadi.');return x;}
  async function preparation(){if(window.UZMEDFilePreparation)return window.UZMEDFilePreparation;if(!loaderPromise)loaderPromise=new Promise((ok,no)=>{var e=document.createElement('script');e.src='/assets/uzmed-file-preparation-v19.js';e.onload=()=>window.UZMEDFilePreparation?ok(window.UZMEDFilePreparation):no(Error('Fayl o‘qish moduli ochilmadi.'));e.onerror=()=>no(Error('Fayl o‘qish moduli yuklanmadi. Qayta urinib ko‘ring.'));document.head.append(e);}).catch(e=>{loaderPromise=null;throw e;});return loaderPromise;}
  async function prepareFiles(files,g){var P=await preparation();check(g);var selections={};(window.UZMEDAiAttach?.pendingFiles||[]).forEach(it=>{if(it.file&&it.pages)selections[it.file.name]=it.pages;});return P.prepare(files,{signal:g.controller.signal,selections:selections,onProgress:progress});}
  function flags(){
    var V=window.UZMEDAIHubV2,web=false,kb=false;
    try{web=!!(V&&V.internet&&V.internet());}catch(_){}
    try{kb=!!(V&&V.baza&&V.baza());}catch(_){}
    return {web:web,kb:kb,mode:web&&kb?'both':web?'internet':kb?'baza':'none'};
  }
  function modelInfo(m){
    var p=String(m&&m.prov||'').toLowerCase();
    var map={or:'openrouter',openrouter:'openrouter',gemini:'gemini',google:'gemini',groq:'groq',mistral:'mistral',bai:'bai','b.ai':'bai',ix:'ix',oxa:'oxa',deepseek:'deepseek'};
    return {provider:map[p]||p,model:String(m&&m.id||'')};
  }
  function clinicalOwner(){
    try{var A=window.UZMEDAuth,st=A&&A.getState&&A.getState();return String(st&&st.loggedIn&&st.user&&st.user.id||'anonymous')}catch(_){return 'anonymous'}
  }
  function assertOwner(owner){
    if(owner!==clinicalOwner())throw new Error('Akkaunt holati o‘zgardi. Qayta urinib ko‘ring.');
  }
  function chatEndpoint(provider,model){
    return provider==='openrouter'&&(model==='deepseek/deepseek-v4.1-flash-1017'||model==='z-ai/glm-5.3-flash')
      ? '/api/ai/premium-flash/chat' : '/api/ai/chat';
  }
  async function requestHeaders(provider,owner,model){
    assertOwner(owner);
    var headers={'Content-Type':'application/json'};
    if(provider==='codecraft'||chatEndpoint(provider,model)==='/api/ai/premium-flash/chat'){
      var A=window.UZMEDAuth;
      if(!A||typeof A.getAccessToken!=='function')throw new Error('UZMED PRO uchun akkauntga qayta kiring.');
      var token=await A.getAccessToken();
      assertOwner(owner);
      if(!token)throw new Error('UZMED PRO uchun akkauntga qayta kiring.');
      headers.Authorization='Bearer '+token;
    }
    return headers;
  }
  function msgText(row){
    if(!row)return '';
    if(typeof row.content==='string')return row.content;
    var parts=Array.isArray(row.parts)?row.parts:[];
    return parts.map(function(x){return x&&typeof x.text==='string'?x.text:'';}).join('\n').trim();
  }
  function history(userText){
    var src=Array.isArray(window.aiHistory)?window.aiHistory:[],out=[];
    src.slice(-12).forEach(function(x){
      var role=x&&x.role==='model'?'assistant':x&&x.role==='assistant'?'assistant':x&&x.role==='user'?'user':'';
      var content=msgText(x);
      if(role&&content)out.push({role:role,content:content.slice(0,24000)});
    });
    var last=out.length?out[out.length-1]:null;
    if(!last||last.role!=='user'||last.content.trim()!==String(userText||'').trim()){
      out.push({role:'user',content:String(userText||'').slice(0,24000)});
    }
    return out.slice(-12);
  }
  function fileContext(text){
    text=String(text||'');
    var i=text.indexOf('───── FAYL:');
    if(i>=0)return text.slice(i,i+24000);
    if(/\[Eslatma: foydalanuvchi rasm ham yubordi\.?\]/i.test(text))return 'Foydalanuvchi ushbu so‘rov bilan tibbiy rasm ham yuborgan.';
    return '';
  }  function hash(s){
    s=String(s||'');var h=2166136261;
    for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return (h>>>0).toString(16);
  }
  async function prepareContext(question){
    var f=flags(),key=f.mode+'|'+hash(question),now=Date.now(),old=contextCache.get(key);
    if(old&&now-old.at<CONTEXT_TTL)return old.value;

    var baza='',file=fileContext(question);
    // Chat evidence is requested by the selected model after it understands the task.
    // File/specialized preparation retains its existing path below.
    if(!file){var direct={sourceMode:f.mode,internetContext:'',bazaContext:'',fileContext:''};contextCache.set(key,{at:now,value:direct});return direct;}

    if(f.kb){
      try{
        var S=window.UZMEDAIHubStream;
        baza=String(S&&typeof S.grounding==='function'?(S.grounding(question)||''):'').slice(0,24000);
      }catch(_){baza='';}
    }
    var value={sourceMode:f.mode,internetContext:'',bazaContext:baza,fileContext:file};
    if(f.web){
      var r=await fetch('/api/ai/context',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          sourceMode:f.mode,
          messages:[{role:'user',content:String(question||'').slice(0,24000)}],
          bazaContext:baza,
          fileContext:file,
          retrieveInternet:true
        })
      });
      var j=await r.json().catch(function(){return {};});
      if(!r.ok)throw new Error((j.error&&j.error.message)||('Internet context HTTP '+r.status));
      value.internetContext=String(j.internetContext||'').slice(0,24000);
    }
    contextCache.set(key,{at:now,value:value});
    return value;
  }  async function backendSora(m,question,onToken){
    var g=guard(),mi=modelInfo(m),mediaHost=document.getElementById('aiMessages');
    try{
      if(!mi.provider||!mi.model)throw Error('AI modeli aniqlanmadi.');
      var ctx=await prepareContext(question);check(g);var msgs=history(question),doc=conversationFile(question),headers=await requestHeaders(mi.provider,g.owner,mi.model);check(g);
      transportBudget(ctx,combinedFile(ctx.fileContext,doc));var response=await fetch(chatEndpoint(mi.provider,mi.model),{method:'POST',headers:headers,signal:g.controller.signal,body:JSON.stringify({provider:mi.provider,model:mi.model,messages:msgs,sourceMode:ctx.sourceMode,internetContext:ctx.internetContext,bazaContext:ctx.bazaContext,fileContext:combinedFile(ctx.fileContext,doc),clinicalState:nativeState(g),retrieveInternet:false,freeTierAcknowledged:true,maxTokens:4096})});
      var data=await response.json().catch(()=>({}));check(g);if(!response.ok){var e=Error(data.error?.message||'AI HTTP '+response.status);e.status=response.status;e.code=data.error?.code;throw e;}
      var text=String(data.text||'').trim();if(!text)throw Error('AI javobi bo‘sh.');rememberState(g,data);try{onToken?.(text);}catch(_){}
      if(data.media?.type==='dermatology_images'&&window.UzmedDermaMedia&&valid(g)&&mediaHost===document.getElementById('aiMessages'))window.UzmedDermaMedia.display(data.media,mediaHost);
      return {media:data.media||null,matn:text,provider:data.provider,model:data.model,sourceMode:data.sourceMode,contextMeta:data.contextMeta};
    }finally{liveControllers.delete(g.controller);}
  }

  function fileB64(file){
    return new Promise(function(resolve,reject){
      var fr=new FileReader();fr.onload=function(){var s=String(fr.result||''),i=s.indexOf(',');resolve(i>=0?s.slice(i+1):s);};
      fr.onerror=function(){reject(new Error('Faylni o‘qib bo‘lmadi.'));};fr.readAsDataURL(file);
    });
  }
  async function uploadPacket(files){
    files=Array.prototype.slice.call(files||[]).slice(0,6);var media=[],notes=[],total=0;
    for(var i=0;i<files.length;i++){
      var f=files[i],name=String(f&&f.name||('fayl-'+(i+1))).slice(0,180),mime=String(f&&f.type||'').toLowerCase();
      if(!mime&&/\.pdf$/i.test(name))mime='application/pdf';
      if(!mime&&/\.(jpe?g)$/i.test(name))mime='image/jpeg';
      if(!mime&&/\.png$/i.test(name))mime='image/png';
      if(!mime&&/\.webp$/i.test(name))mime='image/webp';
      notes.push('Fayl: '+name+(mime?' · '+mime:''));
      if(/^(image\/(?:jpeg|png|webp|gif)|application\/pdf)$/.test(mime)){
        total+=Number(f.size||0);if(total>10000000)throw new Error('Fayllar jami 10 MB dan katta.');
        media.push({name:name,mime:mime,data:await fileB64(f)});
      }else{
        try{
          var txt='';
          if(/\.docx$/i.test(name)&&typeof window.uzmedDocxText==='function')txt=await window.uzmedDocxText(f);
          else if(f&&typeof f.text==='function')txt=await f.text();
          txt=String(txt||'').trim();if(txt)notes.push('['+name+']\n'+txt.slice(0,18000));
        }catch(_){}
      }
    }
    return {files:media,fileContext:notes.join('\n\n').slice(0,24000)};
  }
  async function backendFiles(files,userText,prepared){
    var g=guard();try{
      var question=String(userText||'').trim()||'Yuborilgan tibbiy fayllarni shifokor uchun tahlil qil.',ctx=await prepareContext(question);check(g);
      var pack=prepared||await prepareFiles(files,g);check(g);transportBudget(ctx,combinedFile(ctx.fileContext,pack.fileContext));var current=currentModel(),mi=modelInfo(current||{}),headers=await requestHeaders(mi.provider,g.owner,mi.model);check(g);
      progress({phase:'inference',summary:pack.summary});
      var response=await fetch(pack.files.length?'/api/ai/vision':chatEndpoint(mi.provider,mi.model),{method:'POST',headers:headers,signal:g.controller.signal,body:JSON.stringify({provider:mi.provider,model:mi.model,messages:history(question),userMessage:question,sourceMode:ctx.sourceMode,internetContext:ctx.internetContext,bazaContext:ctx.bazaContext,fileContext:combinedFile(ctx.fileContext,pack.fileContext),clinicalState:nativeState(g),files:pack.files,retrieveInternet:false,freeTierAcknowledged:true,maxTokens:4096})});
      var data=await response.json().catch(()=>({}));check(g);if(!response.ok)throw Error(data.error?.message||'Fayl AI HTTP '+response.status);var text=String(data.text||'').trim();if(!text)throw Error('Fayl AI javobi bo‘sh.');rememberState(g,data);
      return {text:text,provider:data.provider,model:data.model,sourceMode:data.sourceMode,contextMeta:data.contextMeta,prepared:pack};
    }finally{liveControllers.delete(g.controller);}
  }

  function installFileSend(){
    var old=window.sendAiMessage;if(typeof old!=='function'||old.__uzSkillFile)return;
    var wrapped=async function(){
      var ns=window.UZMEDAiAttach,pf=ns&&Array.isArray(ns.pendingFiles)?ns.pendingFiles:[];
      if(!pf.length)return old.apply(this,arguments);
      if(window.aiTyping===true||activeTask)return;
      if(window.UZMED_DOCUMENT_V2?.openWithFiles){const chosen=pf.map(x=>x?.file).filter(Boolean),q=document.getElementById('aiInput')?.value||'';await window.UZMED_DOCUMENT_V2.openWithFiles(chosen,q);ns.clear?.();return {redirectedToPrivateFileReview:true};}
      var files=pf.map(x=>x&&x.file).filter(Boolean),input=document.getElementById('aiInput'),btn=document.getElementById('aiSendBtn');
      var userText=input?String(input.value||'').trim():'',names=files.map(f=>f.name).join(', '),label=(userText?userText+'\n':'')+'📎 '+names;
      var task=guard(),shown=false;activeTask=task;window.aiTyping=true;if(btn)btn.disabled=true;
      try{
        var pack=await prepareFiles(files,task);check(task);var preflight=await prepareContext(userText||'Yuborilgan tibbiy fayllarni shifokor uchun tahlil qil.');check(task);transportBudget(preflight,combinedFile(preflight.fileContext,pack.fileContext));
        // File parse must finish before clearing the native question or queue.
        if(typeof window.appendUserMsg==='function')window.appendUserMsg(label);
        if(Array.isArray(window.aiHistory))window.aiHistory.push({role:'user',parts:[{text:userText||'[yuklangan fayllar: '+names+']'}]});
        if(input){input.value='';input.style.height='auto';}
        window.showTyping?.();shown=true;
        var r=await backendFiles(files,userText,pack);check(task);window.hideTyping?.();shown=false;
        window.appendBotMsg?.(r.text);
        if(Array.isArray(window.aiHistory))window.aiHistory.push({role:'model',parts:[{text:r.text}]});
        window.UZMEDConversations?.setFileContext?.({text:pack.fileContext,summary:pack.summary});window.uzmedSaveHistory?.();window.aiTarixAdd?.(label,r.text);ns.clear?.();
        progress({phase:'done',model:r.model,provider:r.provider,summary:pack.summary});return r;
      }catch(e){if(valid(task)){if(input&&!input.value)input.value=userText;progress({phase:e.name==='AbortError'?'cancelled':'error',message:e.message});}if(e.name!=='AbortError')throw e;}
      finally{if(shown)window.hideTyping?.();liveControllers.delete(task.controller);if(activeTask===task){activeTask=null;window.aiTyping=false;if(btn)btn.disabled=false;}}
    };
    wrapped.__uzSkillFile=true;wrapped.__old=old;window.sendAiMessage=wrapped;
  }

  function currentModel(){
    try{
      var C=window.UZMEDAIHubCore;
      if(C&&typeof C.joriy==='function'){var m=C.joriy();if(m)return m;}
    }catch(_){}
    try{
      var B=window.UZMEDAIBackendV5,rows=B&&Array.isArray(B.models)?B.models:[],key=localStorage.getItem('uzmed_ai_selected_model')||'';
      return rows.find(function(x){return x&&x.enabled&&x.kalit===key;})||rows.find(function(x){return x&&x.enabled;})||null;
    }catch(_){return null;}
  }
  function standaloneAppend(text,kind){
    var host=document.getElementById('aiMessages');if(!host)return null;
    var e=document.createElement('div');e.className='uzmed-v5-msg '+kind;e.textContent=String(text||'');host.append(e);host.scrollTop=host.scrollHeight;return e;
  }
  async function standaloneSend(){
    var input=document.getElementById('uzmedV5Input'),btn=document.getElementById('uzmedV5SendBtn');if(!input||activeTask||window.aiTyping||(btn&&btn.disabled))return;
    var q=String(input.value||'').trim(),ns=window.UZMEDAiAttach,pf=ns?.pendingFiles||[],files=pf.map(x=>x?.file).filter(Boolean);if(!q&&!files.length)return;
    if(!files.length&&window.UzmedDermaMedia?.trySendImage(q,{input,button:btn}))return;
    var m=currentModel();if(!m){progress({phase:'error',message:'AI modeli aniqlanmadi. Modelni tanlab qayta urinib ko‘ring.'});return;}
    var task=guard(),response=null,pack=null;activeTask=task;if(btn)btn.disabled=true;input.disabled=true;window.aiTyping=true;
    try{
      if(files.length){pack=await prepareFiles(files,task);var preflight=await prepareContext(q||'Yuborilgan tibbiy fayllarni shifokor uchun tahlil qil.');check(task);transportBudget(preflight,combinedFile(preflight.fileContext,pack.fileContext));}check(task);
      var names=files.map(f=>f.name).join(', '),shown=q+(files.length?(q?'\n':'')+'📎 '+names:'');standaloneAppend(shown,'user');
      if(Array.isArray(window.aiHistory))window.aiHistory.push({role:'user',parts:[{text:q||(files.length?'[yuklangan fayllar: '+names+']':'')}]});window.uzmedSaveHistory?.();
      if(pack)window.UZMEDConversations?.setFileContext?.({text:pack.fileContext,summary:pack.summary});input.value='';response=standaloneAppend('Javob tayyorlanmoqda…','bot');
      var r=files.length?await backendFiles(files,q,pack):await backendSora(m,q,null);check(task);if(response)response.textContent=String(r.text||r.matn||'');
      if(Array.isArray(window.aiHistory))window.aiHistory.push({role:'model',parts:[{text:String(r.text||r.matn||'')}]});window.uzmedSaveHistory?.();if(files.length)ns?.clear?.();progress({phase:'done',model:r.model,provider:r.provider,summary:pack?.summary,contextMeta:r.contextMeta});return r;
    }catch(e){if(valid(task)){if(response)response.textContent='AI xato: '+String(e.message||e).slice(0,240);if(!input.value)input.value=q;progress({phase:e.name==='AbortError'?'cancelled':'error',message:e.message});}if(e.name!=='AbortError')throw e;}
    finally{liveControllers.delete(task.controller);if(activeTask===task){activeTask=null;input.disabled=false;if(btn)btn.disabled=false;window.aiTyping=false;}}
  }

  function installStandaloneCapture(){
    if(typeof document==='undefined'||!document.addEventListener)return;
    if(window.__UZMED_SKILL_STANDALONE_CAPTURE__)return;
    window.__UZMED_SKILL_STANDALONE_CAPTURE__=true;
    document.addEventListener('click',function(e){
      var b=e.target&&e.target.closest?e.target.closest('#uzmedV5SendBtn'):null;if(!b)return;
      e.preventDefault();e.stopImmediatePropagation();standaloneSend().catch(function(){});
    },true);
    document.addEventListener('keydown',function(e){
      if(!(e.target&&e.target.id==='uzmedV5Input'&&e.key==='Enter'&&!e.shiftKey))return;
      e.preventDefault();e.stopImmediatePropagation();standaloneSend().catch(function(){});
    },true);
  }

  function install(){
    var V=window.UZMEDAIHubV2,S=window.UZMEDAIHubStream,A=window.UZMEDAISelectionV4;
    if(!V||!S)return false;
    try{if(localStorage.getItem('uzmed_ai_mode_web')===null&&localStorage.getItem('uzmed_ai_mode_kb')===null){V.internet(true);V.baza(true);}}catch(_){}

    var clear=window.clearAiChat;
    if(typeof clear==='function'&&!clear.__uzSkillAbort){var next=function(){abortRequests();return clear.apply(this,arguments);};next.__uzSkillAbort=true;window.clearAiChat=next;}
    V.sora=backendSora;
    S.sora=backendSora;
    if(A)A.webAnswer=backendSora;
    window.uzmedAnalyzeFilesWithGemini=function(files,userText){return backendFiles(files,userText).then(function(r){return r.text;});};
    installFileSend();
    installStandaloneCapture();
    if(window.UZMEDBai&&typeof window.UZMEDBai.streamMessage==='function'){
      window.UZMEDBai.streamMessage=function(id,question,onToken,opts){
        if(opts&&Array.isArray(opts.rasmlar)&&opts.rasmlar.length){
          return Promise.reject(new Error('Rasm tahlili server-side vision yo‘li orqali yuborilishi kerak.'));
        }
        return backendSora({prov:'bai',id:id},question,onToken);
      };
    }
    window.UZMEDSkillBridge={
      version:'1.2',
      cancel:abortRequests,
      sourceMode:function(){return flags().mode;},
      ask:backendSora,
      analyzeFiles:backendFiles,
      context:function(q){return prepareContext(String(q||''));},
      clearContextCache:function(){contextCache.clear();}
    };
    return true;
  }

  window.addEventListener('uzmed:auth-change',()=>{if(activeTask&&activeTask.owner!==clinicalOwner()){abortRequests();window.UZMEDAiAttach?.clear?.();}});
  var tries=0;
  (function boot(){
    if(install()){
      var keep=0;
      var guard=setInterval(function(){
        install();
        if(++keep>=40)clearInterval(guard);
      },500);
      return;
    }
    if(++tries<120)setTimeout(boot,250);
  })();
})();